'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type PaymentItem = {
  id: string
  order_id: string
  amount_idr: number
  payment_method: string | null
  payment_proof_url: string | null
  paid_at: string | null
  status: string
  admin_note: string | null
  order: {
    id: string
    product_name: string
    flow_type: string
    delivery_pref: string
    buyer: { full_name: string; email: string } | null
    jastiper: { full_name: string } | null
  } | null
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminPaymentsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PaymentItem | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => { fetchPayments() }, [tab])

  async function fetchPayments() {
    setLoading(true)

    const { data: escrowData } = await supabase
      .from('escrow_transactions')
      .select('id, order_id, amount_idr, payment_method, payment_proof_url, paid_at, status, admin_note')
      .not('payment_proof_url', 'is', null)
      .eq('status', tab === 'pending' ? 'held' : tab === 'approved' ? 'released' : 'refunded')
      .order('paid_at', { ascending: false })

    if (!escrowData || escrowData.length === 0) {
      setPayments([])
      setLoading(false)
      return
    }

    const orderIds = escrowData.map((e: any) => e.order_id)
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, product_name, flow_type, delivery_pref, buyer_id, jastiper_id')
      .in('id', orderIds)

    const userIds = [...new Set([
      ...(ordersData ?? []).map((o: any) => o.buyer_id),
      ...(ordersData ?? []).map((o: any) => o.jastiper_id),
    ].filter(Boolean))]

    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)

    const userMap: Record<string, any> = {}
    ;(usersData ?? []).forEach((u: any) => { userMap[u.id] = u })

    const orderMap: Record<string, any> = {}
    ;(ordersData ?? []).forEach((o: any) => {
      orderMap[o.id] = {
        ...o,
        buyer: userMap[o.buyer_id] ?? null,
        jastiper: userMap[o.jastiper_id] ?? null,
      }
    })

    const mapped = escrowData.map((e: any) => ({
      ...e,
      order: orderMap[e.order_id] ?? null,
    }))

    setPayments(mapped)
    setLoading(false)
  }

  async function handleApprove(payment: PaymentItem) {
    setActionLoading(true)

    await supabase.from('escrow_transactions').update({
      status: 'released',
      released_at: new Date().toISOString(),
      admin_note: adminNote || null,
    }).eq('id', payment.id)

    await supabase.from('orders').update({
      status: 'processing',
    }).eq('id', payment.order_id)

    setSuccess(`Pembayaran disetujui — order ${payment.order?.product_name} diproses jastiper`)
    setSelected(null)
    setAdminNote('')
    setActionLoading(false)
    fetchPayments()
  }

  async function handleReject(payment: PaymentItem) {
    if (!adminNote.trim()) return
    setActionLoading(true)

    await supabase.from('escrow_transactions').update({
      status: 'refunded',
      admin_note: adminNote,
    }).eq('id', payment.id)

    await supabase.from('orders').update({
      status: 'cancelled',
    }).eq('id', payment.order_id)

    setSuccess(`Pembayaran ditolak — order ${payment.order?.product_name} dibatalkan`)
    setSelected(null)
    setAdminNote('')
    setActionLoading(false)
    fetchPayments()
  }

  return (
    <div className="py-10">

      {/* ── IMAGE PREVIEW MODAL ── */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImg(null)}
        >
          <img src={previewImg} alt="Bukti transfer" className="max-w-full max-h-[90vh] rounded-xl object-contain" />
          <p className="absolute bottom-6 text-white text-sm opacity-70">Klik mana saja untuk tutup</p>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4"
          onClick={() => { setSelected(null); setAdminNote('') }}
        >
          <div
            className="bg-white w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-xl relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => { setSelected(null); setAdminNote('') }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 text-xl font-bold transition"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Detail Bukti Transfer</h2>

            {/* Buyer info */}
            <div className="mb-4">
              <p className="font-semibold text-[#0F172A]">{selected.order?.buyer?.full_name ?? '-'}</p>
              <p className="text-sm text-gray-500">{selected.order?.buyer?.email ?? ''}</p>
            </div>

            {/* Buyer + Jastiper */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Buyer</p>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#0F172A] bg-white"
                  value={selected.order?.buyer?.full_name ?? '-'}
                  readOnly
                />
              </div>
              <div>
                <p className="text-gray-400 mb-1">Jastiper</p>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#0F172A] bg-white"
                  value={selected.order?.jastiper?.full_name ?? '-'}
                  readOnly
                />
              </div>
            </div>

            {/* Detail pembayaran */}
            <div className="mt-5 text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total dibayar</span>
                <span className="font-semibold text-[#0F172A]">{formatRupiah(selected.amount_idr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Metode</span>
                <span className="font-semibold text-[#0F172A]">{selected.payment_method ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Waktu transfer</span>
                <span className="font-semibold text-[#0F172A]">{selected.paid_at ? formatDate(selected.paid_at) : '-'}</span>
              </div>
            </div>

            {/* Bukti transfer image */}
            {selected.payment_proof_url && (
              <div className="mt-5">
                <p className="text-sm text-gray-400 mb-2">Bukti Transfer</p>
                <div
                  className="cursor-pointer rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition"
                  onClick={() => setPreviewImg(selected.payment_proof_url)}
                >
                  <img
                    src={selected.payment_proof_url}
                    alt="Bukti transfer"
                    className="w-full h-48 object-cover"
                  />
                  <p className="text-center text-sm text-gray-500 py-2">Klik untuk Perbesar</p>
                </div>
              </div>
            )}

            {/* Catatan admin - pending */}
            {tab === 'pending' && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-1">
                  Catatan (opsional untuk approve, wajib untuk tolak)
                </p>
                <input
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Contoh: Nominal tidak sesuai"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#0F172A] placeholder-gray-400 outline-none focus:border-gray-400"
                />
              </div>
            )}

            {/* Catatan admin - sudah ada */}
            {tab !== 'pending' && selected.admin_note && (
              <div className="mt-4 bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Catatan admin</p>
                <p className="text-sm text-gray-700">{selected.admin_note}</p>
              </div>
            )}

            {/* Status badge - approved */}
            {tab === 'approved' && (
              <div className="mt-4 bg-green-100 text-green-700 p-3 rounded-lg text-sm">
                ✔ Bukti pembayaran sudah disetujui oleh Admin
              </div>
            )}

            {/* Status badge - rejected */}
            {tab === 'rejected' && (
              <div className="mt-4 bg-red-100 text-red-600 p-3 rounded-lg text-sm">
                ✖ {selected.admin_note || 'Pembayaran ditolak'}
              </div>
            )}

            {/* Action buttons - pending */}
            {tab === 'pending' && (
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => handleReject(selected)}
                  disabled={actionLoading || !adminNote.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-40 transition"
                >
                  {actionLoading ? 'Memproses...' : 'Tolak'}
                </button>
                <button
                  onClick={() => handleApprove(selected)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] disabled:opacity-40 transition"
                >
                  {actionLoading ? 'Memproses...' : 'Setujui'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#0F172A]">Verifikasi Pembayaran</h1>
        <p className="text-sm text-gray-500 mt-1">Cek dan approve bukti transfer dari buyer</p>
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

      {/* ── TABS ── */}
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
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#14B8A6]" />
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>

      ) : payments.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <p className="text-sm text-[#64748B]">
            {tab === 'pending' ? 'Tidak ada bukti transfer yang menunggu' : tab === 'approved' ? 'Belum ada pembayaran yang disetujui' : 'Tidak ada pembayaran yang ditolak'}
          </p>
        </div>

      ) : (
        /* ── GRID CARDS ── */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map(payment => (
            <div
              key={payment.id}
              className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:border-teal-300 hover:shadow-sm transition cursor-pointer"
              onClick={() => { setSelected(payment); setAdminNote('') }}
            >
              {/* Thumbnail */}
              {payment.payment_proof_url && (
                <img
                  src={payment.payment_proof_url}
                  alt="Bukti"
                  className="w-full h-[140px] object-cover"
                />
              )}

              <div className="p-4">
                {/* Title + badge */}
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold text-[#0F172A] truncate">
                    {payment.order?.product_name ?? '-'}
                  </p>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ml-2 ${
                    tab === 'pending'
                      ? 'bg-orange-100 text-orange-600'
                      : tab === 'approved'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {tab === 'pending' ? 'Menunggu' : tab === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </span>
                </div>

                {/* Info box */}
                <div className="bg-[#F1F5F9] rounded-xl p-3 text-sm">
                  <p>
                    <span className="text-gray-400">Buyer</span><br />
                    <span className="font-semibold text-gray-900 text-[15px]">
                      {payment.order?.buyer?.full_name ?? '-'}
                    </span>
                  </p>
                  <p className="mt-2">
                    <span className="text-gray-400">Metode Pembayaran</span><br />
                    <span className="font-semibold text-gray-900 text-[15px]">
                      {payment.payment_method ?? '-'}
                    </span>
                  </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-4">
                  <p className="text-[#14B8A6] font-semibold text-[16px]">
                    {formatRupiah(payment.amount_idr)}
                  </p>
                  <span className="text-[#14B8A6] font-medium text-sm">
                    Lihat Detail →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}