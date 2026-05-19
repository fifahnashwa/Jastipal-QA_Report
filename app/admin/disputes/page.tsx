'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Dispute = {
  id: string
  order_id: string
  reason: string
  status: 'open' | 'resolved' | 'rejected'
  resolution: string | null
  bank_name: string | null
  bank_account: string | null
  raised_by: string
  created_at: string
  raised_by_user: { full_name: string; email: string } | null
  order: {
    product_name: string
    status: string
    buyer_id: string | null
    buyer: { full_name: string } | null
    jastiper: { id: string; full_name: string } | null
    pricing: { total_idr: number; platform_fee_idr: number; jastiper_amount: number } | null
  } | null
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function AdminDisputesPage() {
  const supabase = createClient()
  const router = useRouter()

  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'open' | 'resolved' | 'rejected'>('open')
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [adminId, setAdminId] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setAdminId(user.id)
    }
    init()
  }, [])

  useEffect(() => {
    if (adminId) fetchDisputes()
  }, [adminId, tab])

  async function fetchDisputes() {
    setLoading(true)

    const { data: disputesData } = await supabase
      .from('disputes')
      .select('id, order_id, reason, status, resolution, created_at, raised_by, bank_name, bank_account')
      .eq('status', tab)
      .order('created_at', { ascending: false })

    if (!disputesData || disputesData.length === 0) { setDisputes([]); setLoading(false); return }

    const raisedByIds = [...new Set(disputesData.map((d: any) => d.raised_by).filter(Boolean))]
    let raisedByMap: Record<string, any> = {}
    if (raisedByIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', raisedByIds)
      ;(usersData ?? []).forEach((u: any) => { raisedByMap[u.id] = u })
    }

    const orderIds = disputesData.map((d: any) => d.order_id)
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, product_name, status, buyer_id, jastiper_id, order_pricing(total_idr, platform_fee_idr)')
      .in('id', orderIds)

    const allUserIds = [...new Set([
      ...(ordersData ?? []).map((o: any) => o.buyer_id),
      ...(ordersData ?? []).map((o: any) => o.jastiper_id),
    ].filter(Boolean))]

    let orderUserMap: Record<string, any> = {}
    if (allUserIds.length > 0) {
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', allUserIds)
      ;(allUsers ?? []).forEach((u: any) => { orderUserMap[u.id] = u })
    }

    // fetch escrow sebagai sumber harga (sama seperti disbursements)
    const { data: escrowData } = await supabase
      .from('escrow_transactions')
      .select('order_id, amount_idr')
      .in('order_id', orderIds)
    const escrowMap: Record<string, number> = {}
    ;(escrowData ?? []).forEach((e: any) => { escrowMap[e.order_id] = Number(e.amount_idr ?? 0) })

    const orderMap: Record<string, any> = {}
    ;(ordersData ?? []).forEach((o: any) => {
      // prioritas: order_pricing → fallback ke escrow amount_idr
      const opRow = o.order_pricing?.[0]
      const escrowTotal = escrowMap[o.id] ?? 0
      const total = opRow?.total_idr ? Number(opRow.total_idr) : escrowTotal
      const fee = opRow?.platform_fee_idr
        ? Number(opRow.platform_fee_idr)
        : Math.round(escrowTotal - escrowTotal / 1.05)

      orderMap[o.id] = {
        product_name: o.product_name,
        status: o.status,
        buyer_id: o.buyer_id ?? null,
        buyer: orderUserMap[o.buyer_id] ?? null,
        jastiper: o.jastiper_id
          ? { id: o.jastiper_id, ...(orderUserMap[o.jastiper_id] ?? {}) }
          : null,
        pricing: total > 0
          ? { total_idr: total, platform_fee_idr: fee, jastiper_amount: total - fee }
          : null,
      }
    })

    const mapped = disputesData.map((d: any) => {
      const order = orderMap[d.order_id] ?? null
      return {
        ...d,
        raised_by_user: raisedByMap[d.raised_by] ?? null,
        order,
      }
    })

    setDisputes(mapped)
    setLoading(false)
  }

  async function handleResolve(dispute: Dispute, action: 'refund' | 'release') {
    if (!resolution.trim()) return
    setActionLoading(true)

    await supabase.from('disputes').update({
      status: 'resolved',
      resolution: resolution,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
    }).eq('id', dispute.id)

    if (action === 'refund') {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', dispute.order_id)
      await supabase.from('escrow_transactions').update({
        status: 'refunded',
        released_at: new Date().toISOString(),
        admin_note: resolution,
      }).eq('order_id', dispute.order_id)
    } else {
      await supabase.from('orders').update({ status: 'delivered' }).eq('id', dispute.order_id)
      await supabase.from('escrow_transactions').update({
        status: 'released',
        released_at: new Date().toISOString(),
        admin_note: resolution,
      }).eq('order_id', dispute.order_id)
    }

    await supabase.from('admin_actions').insert({
      admin_id: adminId,
      target_order_id: dispute.order_id,
      action_type: action === 'refund' ? 'dispute_refund' : 'dispute_release',
      reason: resolution,
    })

    setSuccess(`Pelanggaran berhasil diselesaikan — ${action === 'refund' ? 'dana dikembalikan ke buyer' : 'dana dicairkan ke jastiper'}`)
    setSelected(null)
    setResolution('')
    setActionLoading(false)
    fetchDisputes()
  }

  async function handleReject(dispute: Dispute) {
    if (!resolution.trim()) return
    setActionLoading(true)

    await supabase.from('disputes').update({
      status: 'rejected',
      resolution: resolution,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
    }).eq('id', dispute.id)

    setSuccess('Pelanggaran ditolak')
    setSelected(null)
    setResolution('')
    setActionLoading(false)
    fetchDisputes()
  }

  const statusConfig = {
    open: { label: 'Menunggu', color: 'bg-orange-100 text-orange-500' },
    resolved: { label: 'Diselesaikan', color: 'bg-green-100 text-green-600' },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-500' },
  }

  return (
    <div className="min-h-screen py-6">

      {/* ── MODAL RESOLVE ── */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0F172A]">Tangani Pelanggaran</h2>
              <button
                onClick={() => { setSelected(null); setResolution('') }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* ── Info ringkas order ── */}
              <div className="bg-[#F1F5F9] rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-[#0F172A]">{selected.order?.product_name}</p>
                <p className="text-xs text-gray-400 font-mono">{selected.order_id}</p>
                <p className="text-xs text-[#64748B]">
                  Buyer: {selected.order?.buyer?.full_name} · Jastiper: {selected.order?.jastiper?.full_name}
                </p>
                <p className="text-xs text-[#64748B]">
                  Dibuka oleh: <span className="font-medium text-gray-700">{selected.raised_by_user?.full_name}</span>
                  {selected.raised_by === selected.order?.buyer_id && selected.raised_by !== selected.order?.jastiper?.id && (
                    <span className="ml-2 bg-blue-100 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">sebagai Buyer</span>
                  )}
                  {selected.raised_by === selected.order?.jastiper?.id && selected.raised_by !== selected.order?.buyer_id && (
                    <span className="ml-2 bg-teal-100 text-teal-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">sebagai Jastiper</span>
                  )}
                  {selected.raised_by === selected.order?.buyer_id && selected.raised_by === selected.order?.jastiper?.id && (
                    <span className="ml-2 bg-orange-100 text-orange-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">Buyer & Jastiper</span>
                  )}
                </p>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-400 mb-1">Alasan:</p>
                  <p className="text-sm text-gray-700">{selected.reason}</p>
                </div>

                {/* Rekening pengaju (dari disputes.bank_name) */}
                {selected.bank_name && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-400 mb-1">Rekening pengaju:</p>
                    <p className="text-sm font-medium text-gray-700">{selected.bank_name} - {selected.bank_account}</p>
                  </div>
                )}

              </div>

              {/* ── Struk transaksi ── */}
              {selected.order?.pricing && (
                <div className="space-y-2 text-sm border border-[#E2E8F0] rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Rincian Transaksi</p>
                  <div className="flex justify-between text-gray-500">
                    <span>Total Dibayar Buyer</span>
                    <span>{formatRupiah(selected.order.pricing.total_idr)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Platform Fee (Jastipal)</span>
                    <span className="text-red-500">- {formatRupiah(selected.order.pricing.platform_fee_idr)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-dashed border-gray-200">
                    <span>Total Transaksi</span>
                    <span className="text-teal-600">{formatRupiah(selected.order.pricing.jastiper_amount)}</span>
                  </div>
                </div>
              )}

              {/* Catatan keputusan */}
              <div>
                <label className="text-[13px] text-[#64748B] mb-1 block">
                  Catatan keputusan <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan keputusan admin..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white text-[#0F172A] resize-none"
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                />
              </div>

              {/* Tombol aksi */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleResolve(selected, 'refund')}
                    disabled={actionLoading || !resolution.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Memproses...' : 'Refund ke Buyer'}
                  </button>
                  <button
                    onClick={() => handleResolve(selected, 'release')}
                    disabled={actionLoading || !resolution.trim()}
                    className="bg-[#14B8A6] hover:bg-[#0d9488] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Memproses...' : 'Cairkan ke Jastiper'}
                  </button>
                </div>
                <button
                  onClick={() => handleReject(selected)}
                  disabled={actionLoading || !resolution.trim()}
                  className="w-full border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Tolak Pelanggaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#0F172A]">Pelanggaran</h1>
        <p className="text-sm text-gray-500 mt-1">Tangani komplain dari buyer dan jastiper</p>
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
        {(['open', 'resolved', 'rejected'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative pb-2 font-medium text-sm transition-colors ${
              tab === t ? 'text-[#14B8A6]' : 'text-[#64748B] hover:text-gray-800'
            }`}
          >
            {t === 'open' ? 'Menunggu' : t === 'resolved' ? 'Diselesaikan' : 'Ditolak'}
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
      ) : disputes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-[#64748B]">
            {tab === 'open' ? 'Tidak ada pelanggaran yang menunggu' : tab === 'resolved' ? 'Belum ada pelanggaran yang diselesaikan' : 'Tidak ada pelanggaran yang ditolak'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(dispute => (
            <div
              key={dispute.id}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-teal-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-[#0F172A]">{dispute.order?.product_name ?? '-'}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Buyer: {dispute.order?.buyer?.full_name} · Jastiper: {dispute.order?.jastiper?.full_name}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${statusConfig[dispute.status].color}`}>
                  {statusConfig[dispute.status].label}
                </span>
              </div>

              <div className="bg-[#F1F5F9] rounded-xl p-3 mb-3">
                <p className="text-xs text-gray-400 mb-1">Alasan dari {dispute.raised_by_user?.full_name}:</p>
                <p className="text-sm text-gray-700">{dispute.reason}</p>
              </div>

              {dispute.resolution && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                  <p className="text-xs text-blue-500 mb-1">Keputusan admin:</p>
                  <p className="text-sm text-blue-700">{dispute.resolution}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                <p className="text-xs text-gray-400">{formatDate(dispute.created_at)}</p>
                {dispute.status === 'open' && (
                  <button
                    onClick={() => { setSelected(dispute); setResolution('') }}
                    className="text-sm text-[#14B8A6] hover:text-[#0d9488] font-medium transition"
                  >
                    Tangani →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}