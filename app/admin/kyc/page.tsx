'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type KycApplicant = {
  user_id: string
  bio: string | null
  service_fee_pct: number | null
  base_country: string | null
  whatsapp_number: string | null
  kyc_idcard_url: string | null
  kyc_selfie_url: string | null
  kyc_status: 'pending' | 'approved' | 'rejected'
  kyc_rejection_reason: string | null
  users: {
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export default function AdminDashboard() {
  const supabase = createClient()
  const router = useRouter()

  const [applicants, setApplicants] = useState<KycApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<KycApplicant | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | ''>('')
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  useEffect(() => { fetchApplicants() }, [tab])

  async function fetchApplicants() {
    setLoading(true)
    const res = await fetch(`/api/admin/kyc?status=${tab}`)
    const json = await res.json()
    setApplicants(json.data ?? [])
    setLoading(false)
  }

  async function handleApprove(applicant: KycApplicant) {
    setActionLoading(true)
    await fetch('/api/admin/kyc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: applicant.user_id, action: 'approve' }),
    })
    setActionType('approve')
    setActionSuccess(`${applicant.users.full_name} berhasil disetujui sebagai jastiper`)
    setSelected(null)
    setActionLoading(false)
    fetchApplicants()
  }

  async function handleReject(applicant: KycApplicant) {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    await fetch('/api/admin/kyc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: applicant.user_id, action: 'reject', rejection_reason: rejectReason }),
    })
    setActionType('reject')
    setActionSuccess(`Pengajuan ${applicant.users.full_name} ditolak`)
    setSelected(null)
    setRejectReason('')
    setActionLoading(false)
    fetchApplicants()
  }

  return (
    <div className="py-6 min-h-screen">

      {/* ── IMAGE PREVIEW MODAL ── */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImg(null)}
        >
          <img src={previewImg} alt="preview" className="max-w-full max-h-[90vh] rounded-xl object-contain" />
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setSelected(null); setRejectReason('') }}
        >
          <div
            className="bg-white w-full max-w-[650px] max-h-[90vh] overflow-y-auto rounded-2xl p-5 shadow-xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg text-[#0F172A]">Detail Pengajuan KYC</h2>
              <button
                onClick={() => { setSelected(null); setRejectReason('') }}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 text-xl font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3 mb-3">
              {selected.users.avatar_url ? (
                <img src={selected.users.avatar_url} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold uppercase">
                  {selected.users.full_name?.[0] ?? '?'}
                </div>
              )}
              <div>
                <p className="font-semibold text-[#0F172A]">{selected.users.full_name}</p>
                <p className="text-sm text-[#64748B]">{selected.users.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[13px] text-[#64748B] mb-1">Domisili</p>
                  <input value={selected.base_country ?? '-'} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#0F172A] bg-white" />
                </div>
                <div>
                  <p className="text-[13px] text-[#64748B] mb-1">Service Fee</p>
                  <input value={selected.service_fee_pct ? `${selected.service_fee_pct}%` : '-'} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#0F172A] bg-white" />
                </div>
              </div>
              <div>
                <p className="text-[13px] text-[#64748B] mb-1">WhatsApp</p>
                <input value={selected.whatsapp_number ?? '-'} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#0F172A] bg-white" />
              </div>
              <div>
                <p className="text-[13px] text-[#64748B] mb-1">Bio</p>
                <textarea rows={2} value={selected.bio ?? '-'} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#0F172A] bg-white resize-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              {selected.kyc_idcard_url ? (
                <div className="cursor-pointer rounded-xl overflow-hidden border border-gray-200 hover:opacity-80 transition" onClick={() => setPreviewImg(selected.kyc_idcard_url)}>
                  <img src={selected.kyc_idcard_url} alt="KTP" className="w-full h-24 object-cover" />
                  <p className="text-xs text-center text-[#64748B] py-1">KTP / Passport</p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 h-24 flex items-center justify-center">
                  <p className="text-xs text-gray-400">Tidak ada foto</p>
                </div>
              )}
              {selected.kyc_selfie_url ? (
                <div className="cursor-pointer rounded-xl overflow-hidden border border-gray-200 hover:opacity-80 transition" onClick={() => setPreviewImg(selected.kyc_selfie_url)}>
                  <img src={selected.kyc_selfie_url} alt="Selfie" className="w-full h-24 object-cover" />
                  <p className="text-xs text-center text-[#64748B] py-1">Selfie + KTP</p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 h-24 flex items-center justify-center">
                  <p className="text-xs text-gray-400">Tidak ada foto</p>
                </div>
              )}
            </div>

            {/* Action: pending */}
            {selected.kyc_status === 'pending' && (
              <>
                <div className="mt-3">
                  <p className="text-[13px] text-[#64748B] mb-1">Alasan penolakan (wajib jika menolak)</p>
                  <input
                    placeholder="Contoh: Foto KTP buram"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#0F172A] placeholder-gray-400 outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => handleReject(selected)} disabled={actionLoading || !rejectReason.trim()} className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-40 transition">
                    {actionLoading ? 'Memproses...' : 'Tolak'}
                  </button>
                  <button onClick={() => handleApprove(selected)} disabled={actionLoading} className="px-4 py-2 bg-[#14B8A6] text-white rounded-lg disabled:opacity-40 transition">
                    {actionLoading ? 'Memproses...' : 'Setujui'}
                  </button>
                </div>
              </>
            )}

            {/* Action: approved */}
            {selected.kyc_status === 'approved' && (
              <div className="mt-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                ✓ Sudah disetujui sebagai jastiper
              </div>
            )}

            {/* Action: rejected */}
            {selected.kyc_status === 'rejected' && (
              <div className="mt-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <p className="text-xs font-medium mb-1">Alasan penolakan:</p>
                <p className="text-sm">{selected.kyc_rejection_reason ?? '-'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KONTEN UTAMA ── */}
      <div>
        <h1 className="text-[24px] font-semibold text-[#0F172A] mb-6">Verifikasi KYC</h1>

        {/* Banner */}
        {actionSuccess && (
          <div className={`mb-6 border rounded-xl px-4 py-3 flex items-center justify-between ${
            actionType === 'reject' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionType === 'reject' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              )}
              <p className={`text-sm ${actionType === 'reject' ? 'text-red-700' : 'text-green-700'}`}>
                {actionSuccess}
              </p>
            </div>
            <button
              onClick={() => { setActionSuccess(''); setActionType('') }}
              className={`ml-4 ${actionType === 'reject' ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-6 border-b border-[#E2E8F0] mb-6">
          {(['pending', 'approved', 'rejected'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-2 font-medium text-sm transition-colors ${
                tab === t ? 'text-[#14B8A6]' : 'text-[#64748B] hover:text-gray-800'
              }`}
            >
              {t === 'pending' ? 'Menunggu' : t === 'approved' ? 'Disetujui' : 'Ditolak'}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#14B8A6]" />}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <p className="text-sm text-[#64748B]">
              {tab === 'pending' ? 'Tidak ada pengajuan yang menunggu review' : tab === 'approved' ? 'Belum ada jastiper yang disetujui' : 'Tidak ada pengajuan yang ditolak'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applicants.map(applicant => (
              <div
                key={applicant.user_id}
                className="bg-white border border-[#E2E8F0] rounded-2xl px-6 py-5 hover:border-teal-300 hover:shadow-sm transition cursor-pointer"
                onClick={() => setSelected(applicant)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    {applicant.users.avatar_url ? (
                      <img src={applicant.users.avatar_url} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold uppercase flex-shrink-0">
                        {applicant.users.full_name?.[0] ?? '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold text-[#0F172A] truncate">{applicant.users.full_name}</p>
                      <p className="text-[14px] text-[#64748B] truncate">{applicant.users.email}</p>
                    </div>
                  </div>
                  <div className="w-[1px] h-10 bg-[#E2E8F0] flex-shrink-0 ml-3" />
                </div>

                <div className="mt-4 bg-[#F1F5F9] rounded-2xl px-5 py-4 flex justify-between">
                  <div>
                    <p className="text-[13px] text-gray-500 mb-1">Domisili</p>
                    <p className="text-[15px] font-semibold text-gray-900">{applicant.base_country ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-gray-500 mb-1">Service Fee</p>
                    <p className="text-[15px] font-semibold text-gray-900">Fee {applicant.service_fee_pct ? `${applicant.service_fee_pct}%` : '-'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5">
                  <span className={`text-[12px] px-4 py-1.5 rounded-full font-medium ${
                    applicant.kyc_status === 'pending' ? 'bg-orange-100 text-orange-500' : applicant.kyc_status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                  }`}>
                    {applicant.kyc_status === 'pending' ? 'Menunggu' : applicant.kyc_status === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </span>
                  <span className="text-[14px] font-medium text-[#14B8A6]">Lihat Detail →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}