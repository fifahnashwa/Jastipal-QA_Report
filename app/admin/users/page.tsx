'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  is_jastiper: boolean
  is_frozen: boolean
  is_admin: boolean
  active_role: string
  created_at: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<User | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<User | null>(null)
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [adminId, setAdminId] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setAdminId(user.id)
      fetchUsers()
    }
    init()
  }, [])

  async function fetchUsers(q?: string) {
    setLoading(true)
    const res = await fetch(`/api/admin/users${q?.trim() ? `?q=${encodeURIComponent(q)}` : ''}`)
    const json = await res.json()
    setUsers(json.data ?? [])
    setLoading(false)
  }

  async function handleFreeze(user: User) {
    if (!reason.trim()) return
    setActionLoading(true)

    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: user.id, action: 'freeze', reason, admin_id: adminId }),
    })

    setSuccess(`Akun ${user.full_name} berhasil dibekukan`)
    setSelected(null)
    setReason('')
    setActionLoading(false)
    fetchUsers(search)
  }

  async function handleUnfreeze(user: User) {
    setActionLoading(true)

    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: user.id, action: 'unfreeze', reason: 'Diaktifkan kembali oleh admin', admin_id: adminId }),
    })

    setSuccess(`Akun ${user.full_name} berhasil diaktifkan kembali`)
    setSelected(null)
    setReason('')
    setActionLoading(false)
    fetchUsers(search)
  }

  return (
    <div>

      {/* ── CONFIRM MODAL (freeze/unfreeze) ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0F172A]">
                {selected.is_frozen ? 'Aktifkan Akun' : 'Bekukan Akun'}
              </h2>
              <button
                onClick={() => { setSelected(null); setReason('') }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* User info */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                {selected.avatar_url ? (
                  <img src={selected.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 uppercase">
                    {selected.full_name?.[0] ?? '?'}
                  </div>
                )}
                <div>
                  <p className="font-medium text-[#0F172A] text-sm">{selected.full_name}</p>
                  <p className="text-xs text-gray-500">{selected.email}</p>
                </div>
              </div>

              {selected.is_frozen ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700">
                    Akun ini sedang dibekukan. Mengaktifkan kembali akan memungkinkan user untuk login dan menggunakan platform.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-700">
                      Membekukan akun akan mencegah user login. Semua aktivitas sebagai buyer maupun jastiper akan terhenti.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Alasan pembekuan <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Contoh: Melanggar ketentuan layanan, penipuan, dll"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white text-gray-900 resize-none"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setSelected(null); setReason('') }}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                {selected.is_frozen ? (
                  <button
                    onClick={() => handleUnfreeze(selected)}
                    disabled={actionLoading}
                    className="flex-1 bg-[#14B8A6] hover:bg-[#0d9488] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Memproses...' : 'Aktifkan Kembali'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleFreeze(selected)}
                    disabled={actionLoading || !reason.trim()}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Memproses...' : 'Bekukan Akun'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL PROFIL MODAL ── */}
      {selectedDetail && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="bg-white w-full max-w-[500px] rounded-2xl p-6 shadow-xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDetail(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold transition"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Detail Profil</h2>

            <div className="flex gap-3 mb-5">
              {selectedDetail.avatar_url ? (
                <img src={selectedDetail.avatar_url} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 uppercase">
                  {selectedDetail.full_name?.[0] ?? '?'}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{selectedDetail.full_name}</p>
                <p className="text-sm text-gray-500">{selectedDetail.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[13px] text-gray-500 mb-1">Bergabung</p>
                <input
                  value={formatDate(selectedDetail.created_at)}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <p className="text-[13px] text-gray-500 mb-1">Role</p>
                <input
                  value={[
                    selectedDetail.is_admin ? 'Admin' : '',
                    selectedDetail.is_jastiper ? 'Jastiper' : '',
                    'Buyer',
                  ].filter(Boolean).join(', ')}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <p className="text-[13px] text-gray-500 mb-1">Status Akun</p>
                <input
                  value={selectedDetail.is_frozen ? '❄️ Dibekukan' : '✓ Aktif'}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#0F172A]">Manajemen User</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola semua akun user platform Jastipal</p>
      </div>

      {/* Success toast */}
      {success && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-green-700">{success}</p>
          <button onClick={() => setSuccess('')} className="text-green-500 ml-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Cari nama atau email..."
          className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-gray-400 bg-white text-gray-900"
          value={search}
          onChange={e => { setSearch(e.target.value); fetchUsers(e.target.value) }}
        />
      </div>

      {/* ── LIST ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(user => (
            <div
              key={user.id}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center justify-between"
            >
              {/* LEFT */}
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-14 h-14 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-base font-semibold text-blue-600 uppercase shrink-0">
                    {user.full_name?.[0] ?? '?'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-[#0F172A] text-lg">{user.full_name}</p>
                    {user.is_admin && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">Admin</span>
                    )}
                    {user.is_jastiper && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">Jastiper</span>
                    )}
                    {user.is_frozen && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">❄️ Frozen</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{user.email}</p>
                  <p className="text-sm text-gray-400">Bergabung {formatDate(user.created_at)}</p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-3 shrink-0">
                {!user.is_admin && (
                  <button
                    onClick={() => { setSelected(user); setReason('') }}
                    className={`px-5 py-2 rounded-lg font-medium transition ${
                      user.is_frozen
                        ? 'border border-[#14B8A6] text-[#14B8A6] hover:bg-teal-50'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {user.is_frozen ? 'Aktifkan' : 'Bekukan'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedDetail(user)}
                  className="px-5 py-2 bg-[#14B8A6] text-white rounded-lg font-medium hover:bg-[#0d9488] transition"
                >
                  Lihat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}