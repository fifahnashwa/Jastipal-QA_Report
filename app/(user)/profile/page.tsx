'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type JastiperProfile = {
  kyc_status: 'pending' | 'approved' | 'rejected'
  kyc_rejection_reason: string | null
  bio: string | null
  service_fee_pct: number | null
  base_country: string | null
  whatsapp_number: string | null
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [switchLoading, setSwitchLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState('')
  const [isJastiper, setIsJastiper] = useState(false)
  const [activeRole, setActiveRole] = useState<'buyer' | 'jastiper'>('buyer')
  const [jastiperProfile, setJastiperProfile] = useState<JastiperProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [jastiperForm, setJastiperForm] = useState({ whatsapp_number: '', service_fee_pct: '' })
  const [jastiperEditLoading, setJastiperEditLoading] = useState(false)
  const [jastiperEditSuccess, setJastiperEditSuccess] = useState(false)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('users')
        .select('full_name, phone, avatar_url, is_jastiper, active_role')
        .eq('id', user.id)
        .single()

      if (data) {
        setForm({ full_name: data.full_name ?? '', phone: data.phone ?? '' })
        setAvatarUrl(data.avatar_url)
        setIsJastiper(data.is_jastiper)
        setActiveRole(data.active_role ?? 'buyer')
        const names = (data.full_name ?? '').split(' ')
        setInitials(names.length >= 2 ? names[0][0] + names[1][0] : names[0]?.[0] ?? '?')
      }

      const { data: jpData } = await supabase
        .from('jastiper_profiles')
        .select('kyc_status, kyc_rejection_reason, bio, service_fee_pct, base_country, whatsapp_number')
        .eq('user_id', user.id)
        .single()

      if (jpData) {
        setJastiperProfile(jpData)
        setJastiperForm({
          whatsapp_number: jpData.whatsapp_number ?? '',
          service_fee_pct: jpData.service_fee_pct?.toString() ?? '',
        })
      }
      setProfileLoaded(true)
    }
    getProfile()
  }, [])

  async function handleUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (uploadError) { setError('Gagal upload foto'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('id', userId)
    setAvatarUrl(urlData.publicUrl)
    setUploading(false)
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess(false)
    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name: form.full_name, phone: form.phone })
      .eq('id', userId)
    if (updateError) { setError('Gagal menyimpan, coba lagi.'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  async function handleSaveJastiperProfile() {
    setJastiperEditLoading(true)
    setJastiperEditSuccess(false)

    const { error: updateError } = await supabase
      .from('jastiper_profiles')
      .update({
        whatsapp_number: jastiperForm.whatsapp_number || null,
        service_fee_pct: jastiperForm.service_fee_pct ? parseFloat(jastiperForm.service_fee_pct) : null,
      })
      .eq('user_id', userId)

    if (updateError) {
      setError('Gagal menyimpan profil jastiper')
    } else {
      setJastiperEditSuccess(true)
      setTimeout(() => setJastiperEditSuccess(false), 3000)
    }
    setJastiperEditLoading(false)
  }

  async function handleSwitchRole(to: 'buyer' | 'jastiper') {
    setSwitchLoading(true)
    await supabase.from('users').update({ active_role: to }).eq('id', userId)
    setActiveRole(to)
    setSwitchLoading(false)
  }

  function renderJastiperSection() {
    if (!profileLoaded) return null

    // belum pernah daftar
    if (!jastiperProfile) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Daftar sebagai Jastiper</h2>
          <p className="text-sm text-gray-500 mb-5">
            Jadilah jastiper dan bantu buyer belanja dari luar negeri. Upload KYC untuk memulai.
          </p>
          <button
            onClick={() => router.push('/profile/switch-to-jastiper')}
            className="w-full bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white font-semibold text-sm py-3 rounded-lg"
          >
            Daftar sebagai Jastiper
          </button>
        </div>
      )
    }

    // pending
    if (jastiperProfile.kyc_status === 'pending') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <h2 className="text-base font-semibold text-yellow-800">Menunggu Review Admin</h2>
          </div>
          <p className="text-sm text-yellow-700">
            Pengajuan jastiper kamu sedang diproses. Kami akan memberitahu kamu setelah review selesai.
          </p>
        </div>
      )
    }

    // rejected
    if (jastiperProfile.kyc_status === 'rejected') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <h2 className="text-base font-semibold text-red-800">Pengajuan Ditolak</h2>
          </div>
          {jastiperProfile.kyc_rejection_reason && (
            <p className="text-sm text-red-700 mb-4">
              Alasan: {jastiperProfile.kyc_rejection_reason}
            </p>
          )}
          <button
            onClick={() => router.push('/profile/switch-to-jastiper')}
            className="w-full bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white font-semibold text-sm py-3 rounded-lg"
          >
            Ajukan Ulang
          </button>
        </div>
      )
    }

    // approved — tampilkan toggle mode
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <h2 className="text-base font-bold text-gray-900">Verified Jastiper ✓</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Kamu bisa beralih antara mode buyer dan jastiper kapan saja.
        </p>

        {/* Edit profil jastiper */}
        <div className="space-y-3 mb-5">
          <h3 className="text-sm font-semibold text-gray-700">Edit Profil Jastiper</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor WhatsApp</label>
            <input
              placeholder="Contoh: 08123456789"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#49BC9E] transition-colors"
              value={jastiperForm.whatsapp_number}
              onChange={e => setJastiperForm({ ...jastiperForm, whatsapp_number: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Fee (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Contoh: 10"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#49BC9E] transition-colors"
              value={jastiperForm.service_fee_pct}
              onChange={e => setJastiperForm({ ...jastiperForm, service_fee_pct: e.target.value })}
            />
          </div>

          {jastiperEditSuccess && (
            <p className="text-xs text-green-600 font-medium">✓ Profil jastiper berhasil disimpan</p>
          )}

          <button
            onClick={handleSaveJastiperProfile}
            disabled={jastiperEditLoading}
            className="w-full bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white font-semibold text-sm py-3 rounded-lg disabled:opacity-50"
          >
            {jastiperEditLoading ? 'Menyimpan...' : 'Simpan Profil Jastiper'}
          </button>
        </div>

        {/* Info jastiper */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {jastiperProfile.base_country && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Domisili</p>
              <p className="text-sm font-medium text-gray-900">{jastiperProfile.base_country}</p>
            </div>
          )}
          {jastiperProfile.service_fee_pct && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Service Fee</p>
              <p className="text-sm font-medium text-gray-900">{jastiperProfile.service_fee_pct}%</p>
            </div>
          )}
        </div>

        {/* Toggle mode */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${
            activeRole === 'jastiper'
              ? 'bg-[#49BC9E]/10 text-[#49BC9E]'
              : 'bg-gray-50 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${activeRole === 'jastiper' ? 'bg-[#49BC9E]' : 'bg-gray-400'}`}></div>
            Mode aktif sekarang: <span className="font-semibold">{activeRole === 'jastiper' ? 'Jastiper' : 'Buyer'}</span>
          </div>

          <div className="p-4">
            {activeRole === 'buyer' ? (
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Beralih ke mode jastiper untuk mulai menerima order dan membuat listing.
                </p>
                <button
                  onClick={() => handleSwitchRole('jastiper')}
                  disabled={switchLoading}
                  className="w-full bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white font-semibold text-sm py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {switchLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  )}
                  {switchLoading ? 'Beralih...' : 'Aktifkan Mode Jastiper'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Beralih ke mode buyer untuk berbelanja dan membuat request.
                </p>
                <button
                  onClick={() => handleSwitchRole('buyer')}
                  disabled={switchLoading}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {switchLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-400 rounded-full animate-spin"></div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  )}
                  {switchLoading ? 'Beralih...' : 'Kembali ke Mode Buyer'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi akun Jastipal kamu</p>
      </div>

      {/* Badge mode aktif */}
      {isJastiper && profileLoaded && jastiperProfile?.kyc_status === 'approved' && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-fit ${
          activeRole === 'jastiper'
            ? 'bg-[#49BC9E]/10 text-[#49BC9E]'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${activeRole === 'jastiper' ? 'bg-[#49BC9E]' : 'bg-gray-400'}`}></div>
          {activeRole === 'jastiper' ? '🧳 Mode Jastiper Aktif' : '🛍️ Mode Buyer Aktif'}
        </div>
      )}

      {/* Data Pribadi */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Data Pribadi</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium text-gray-600 uppercase">
              {initials}
            </div>
          )}
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-[#49BC9E] hover:underline disabled:opacity-50 transition-all cursor-pointer"
            >
              {uploading ? 'Mengupload...' : 'Ubah foto'}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 2MB</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-green-600 text-sm">Profil berhasil disimpan!</p>
          </div>
        )}

        {/* Nama Lengkap */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#49BC9E] transition-colors"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
          />
        </div>

        {/* Nomor Telepon */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
          <input
            type="tel"
            placeholder="08xxxxxxxxxx"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#49BC9E] transition-colors"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white font-semibold text-sm py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {renderJastiperSection()}
    </div>
  )
}