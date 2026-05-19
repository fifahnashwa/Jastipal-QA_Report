'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

type OrderDetail = {
  id: string
  product_name: string
  status: string
  buyer_id: string
  jastiper_id: string
}

export default function OpenDisputePage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState('')
  const [activeRole, setActiveRole] = useState<'buyer' | 'jastiper'>('buyer')
  const [reason, setReason] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [existingDispute, setExistingDispute] = useState(false)
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: userData } = await supabase
        .from('users')
        .select('active_role')
        .eq('id', user.id)
        .single()
      setActiveRole(userData?.active_role ?? 'buyer')

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, product_name, status, buyer_id, jastiper_id')
        .eq('id', orderId)
        .single()

      if (!orderData) { router.push('/orders'); return }

      if (orderData.buyer_id !== user.id && orderData.jastiper_id !== user.id) {
        router.push('/orders')
        return
      }

      const { data: disputeData } = await supabase
        .from('disputes')
        .select('id')
        .eq('order_id', orderId)
        .single()

      if (disputeData) setExistingDispute(true)

      setOrder(orderData as any)
      setLoading(false)
    }
    init()
  }, [])

  async function handleSubmit() {
    if (!reason.trim()) { setError('Alasan dispute wajib diisi'); return }
    setSubmitting(true)
    setError('')

    const { error: insertError } = await supabase.from('disputes').insert({
      order_id: orderId,
      raised_by: userId,
      reason: reason,
      status: 'open',
      bank_name: bankName || null,
      bank_account: bankAccount || null,
    })

    if (insertError) {
      setError('Gagal membuka dispute: ' + insertError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => router.push('/orders'), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#49BC9E] rounded-full animate-spin"></div>
    </div>
  )

  if (!order) return null

  return (
    <div className="max-w-lg pb-12">

      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Ajukan Komplain</h1>
        <p className="text-sm text-gray-500">{order.product_name}</p>
      </div>

      {existingDispute && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm text-yellow-700 font-medium">⚠️ Dispute sudah pernah dibuka untuk order ini</p>
          <p className="text-xs text-yellow-600 mt-1">Admin sedang memproses dispute ini. Harap tunggu.</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm text-green-700 font-medium">✓ Dispute berhasil dibuka! Admin akan segera meninjau.</p>
        </div>
      )}

      {!existingDispute && !success && (
        <>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm font-semibold text-red-700 mb-1">Perhatian</p>
            <p className="text-xs text-red-600">
              Dispute akan diproses oleh admin. Pastikan kamu sudah mencoba menghubungi {activeRole === 'buyer' ? 'jastiper' : 'buyer'} via WhatsApp sebelum membuka dispute.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-4">Detail Komplain</h2>

            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pilih Alasan <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-col gap-2 mb-6">
              {(activeRole === 'buyer' ? [
                'Barang tidak sampai setelah waktu yang dijanjikan',
                'Barang rusak atau tidak sesuai deskripsi',
                'Jastiper tidak responsif',
                'Jastiper tidak membeli barang',
                'Lainnya',
              ] : [
                'Buyer tidak konfirmasi terima padahal barang sudah dikirim',
                'Buyer tidak bisa dihubungi',
                'Lainnya',
              ]).map(option => (
                <button
                  key={option}
                  onClick={() => { setSelectedReason(option); setReason(option !== 'Lainnya' ? option : '') }}
                  className={`w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors ${
                    selectedReason === option
                      ? 'border-[#49BC9E] bg-[#f0faf7] text-gray-900 font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-[#49BC9E]'
                  }`}
                >
                  {selectedReason === option && (
                    <span className="mr-2 text-[#49BC9E]">✓</span>
                  )}
                  {option}
                </button>
              ))}
            </div>

            {selectedReason === 'Lainnya' && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Jelaskan masalahmu <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan detail kendala atau kronologi yang terjadi..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#49BC9E] transition-colors resize-none mb-4"
                  onChange={e => setReason(e.target.value)}
                />
              </>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Informasi Rekening (untuk pencairan dana)</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Bank</label>
                <input
                  placeholder="Contoh: BCA, BRI, Mandiri"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#49BC9E] transition-colors"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Rekening</label>
                <input
                  placeholder="Contoh: 1234567890"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#49BC9E] transition-colors"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !reason.trim()}
              className="bg-[#49BC9E] hover:bg-[#3da88d] disabled:opacity-50 transition-colors text-white text-sm font-semibold px-6 py-2.5 rounded-lg"
            >
              {submitting ? 'Mengirim...' : 'Kirim Komplain'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}