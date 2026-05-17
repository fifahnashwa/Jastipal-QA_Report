'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Order = {
  id: string
  flow_type: 'flow_a' | 'flow_b'
  listing_id: string | null
  product_name: string
  product_url: string
  quantity: number
  delivery_pref: 'courier' | 'meetup'
  shipping_address: string | null
  meetup_location: string | null
  meetup_time: string | null
  status: 'waiting_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  tracking_number: string | null
  notes: string | null
  created_at: string
  buyer_id: string
  jastiper_id: string
  counterpart: {
    full_name: string
    avatar_url: string | null
    whatsapp_number: string | null
  } | null
  pricing: {
    product_price_idr: number
    platform_fee_idr: number
    total_idr: number
  } | null
  proof: {
    receipt_url: string
    store_photo_url: string | null
  } | null
  payment_proof_url: string | null
  dispute: {
    reason: string
    resolution: string | null
    status: string
  } | null
}

const statusConfig: Record<string, { label: string; color: string; step: number }> = {
  waiting_payment: { label: 'Menunggu Pembayaran', color: 'text-orange-400', step: 1 },
  processing:      { label: 'Diproses Jastiper',   color: 'text-blue-500',   step: 2 },
  shipped:         { label: 'Dikirim',              color: 'text-purple-500', step: 3 },
  delivered:       { label: 'Selesai',              color: 'text-[#49BC9E]',  step: 4 },
  cancelled:       { label: 'Dibatalkan',           color: 'text-gray-400',   step: 0 },
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrdersPage() {
  const supabase = createClient()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState<'buyer' | 'jastiper'>('buyer')
  const [userId, setUserId] = useState('')
  const [tab, setTab] = useState<'waiting' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('waiting')
  const [selected, setSelected] = useState<Order | null>(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState('')

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
    }
    init()
  }, [])

  useEffect(() => {
    if (userId) fetchOrders()
  }, [userId, activeRole, tab])

  async function fetchOrders() {
    setLoading(true)

    const buyerTabMap: Record<string, string[]> = {
      waiting:    ['waiting_payment'],
      processing: ['processing', 'shipped'],
      delivered:  ['delivered'],
      cancelled:  ['cancelled'],
    }

    const jastiperTabMap: Record<string, string[]> = {
      waiting:    ['waiting_payment', 'processing'],
      processing: ['shipped'],
      delivered:  ['delivered'],
      cancelled:  ['cancelled'],
    }

    const statuses = activeRole === 'buyer'
      ? (buyerTabMap[tab] ?? ['waiting_payment'])
      : (jastiperTabMap[tab] ?? ['waiting_payment', 'processing'])

    const col = activeRole === 'buyer' ? 'buyer_id' : 'jastiper_id'
    const counterpartCol = activeRole === 'buyer' ? 'jastiper_id' : 'buyer_id'

    const { data } = await supabase
      .from('orders')
      .select('id, flow_type, listing_id, product_name, product_url, quantity, delivery_pref, shipping_address, meetup_location, meetup_time, status, tracking_number, notes, created_at, buyer_id, jastiper_id, order_pricing(product_price_idr, platform_fee_idr, total_idr)')
      .eq(col, userId)
      .in('status', statuses)
      .order('created_at', { ascending: false })

    if (!data) { setOrders([]); setLoading(false); return }

    const counterpartIds = [...new Set(data.map((o: any) => o[counterpartCol]).filter(Boolean))]
    let counterpartMap: Record<string, any> = {}

    if (counterpartIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', counterpartIds)

      const { data: jpData } = await supabase
        .from('jastiper_profiles')
        .select('user_id, whatsapp_number')
        .in('user_id', counterpartIds)

      const waMap: Record<string, string> = {}
      ;(jpData ?? []).forEach((jp: any) => { waMap[jp.user_id] = jp.whatsapp_number })
      ;(usersData ?? []).forEach((u: any) => {
        counterpartMap[u.id] = { full_name: u.full_name, avatar_url: u.avatar_url, whatsapp_number: waMap[u.id] ?? null }
      })
    }

    const orderIds = data.map((o: any) => o.id)
    let proofMap: Record<string, any> = {}
    let escrowMap: Record<string, string | null> = {}
    let disputeMap: Record<string, any> = {}

    if (orderIds.length > 0) {
      const { data: escrowData } = await supabase
        .from('escrow_transactions')
        .select('order_id, payment_proof_url')
        .in('order_id', orderIds)
      ;(escrowData ?? []).forEach((e: any) => { escrowMap[e.order_id] = e.payment_proof_url })
    }

    if (orderIds.length > 0) {
      const { data: proofData } = await supabase
        .from('proof_of_purchase')
        .select('order_id, receipt_url, store_photo_url')
        .in('order_id', orderIds)
      ;(proofData ?? []).forEach((p: any) => { proofMap[p.order_id] = p })
    }

    if (orderIds.length > 0) {
      const { data: disputeData } = await supabase
        .from('disputes')
        .select('order_id, reason, resolution, status')
        .in('order_id', orderIds)
      ;(disputeData ?? []).forEach((d: any) => { disputeMap[d.order_id] = d })
    }

    const mapped = data.map((o: any) => ({
      ...o,
      counterpart: counterpartMap[o[counterpartCol]] ?? null,
      pricing: o.order_pricing?.[0] ?? null,
      proof: proofMap[o.id] ?? null,
      payment_proof_url: escrowMap[o.id] ?? null,
      dispute: disputeMap[o.id] ?? null,
    }))

    setOrders(mapped)
    setLoading(false)
  }

  async function handleShipped(order: Order) {
    if (!trackingInput.trim()) return
    setActionLoading(true)
    await supabase.from('orders').update({ status: 'shipped', tracking_number: trackingInput }).eq('id', order.id)
    setSuccess('Nomor resi berhasil disimpan, status order diupdate ke Dikirim')
    setSelected(null)
    setTrackingInput('')
    setActionLoading(false)
    fetchOrders()
  }

  async function handleMeetupDone(order: Order) {
    setActionLoading(true)
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id)
    await supabase.from('escrow_transactions').update({ status: 'released', released_at: new Date().toISOString() }).eq('order_id', order.id)
    setSuccess('Meetup selesai! Dana sudah dicairkan ke kamu.')
    setSelected(null)
    setActionLoading(false)
    fetchOrders()
  }

  async function handleDelivered(order: Order) {
    setActionLoading(true)
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id)
    await supabase.from('escrow_transactions').update({ status: 'released', released_at: new Date().toISOString() }).eq('order_id', order.id)
    setSuccess('Order selesai! Dana sudah dicairkan ke jastiper.')
    setSelected(null)
    setActionLoading(false)
    fetchOrders()
  }

  async function handleCancel(order: Order) {
    setActionLoading(true)
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    if (order.flow_type === 'flow_b' && order.listing_id) {
      const { data: listing } = await supabase.from('listings').select('stock').eq('id', order.listing_id).single()
      if (listing) {
        await supabase.from('listings').update({ stock: listing.stock + order.quantity }).eq('id', order.listing_id)
      }
    }
    await supabase.from('escrow_transactions').update({ status: 'refunded' }).eq('order_id', order.id)
    setSuccess('Pesanan berhasil dibatalkan')
    setActionLoading(false)
    fetchOrders()
  }

  function renderActions(order: Order) {
    if (order.status === 'cancelled' || order.status === 'delivered') return null

    if (activeRole === 'buyer') {
      if (order.status === 'shipped') {
        return (
          // ✅ FIX: stack vertikal di mobile, grid di sm ke atas
          <div className={order.dispute ? '' : 'flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3'}>
            <button
              onClick={() => setSelected(order)}
              className="w-full bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              Konfirmasi Diterima
            </button>
            {!order.dispute && (
              <button
                onClick={() => router.push(`/orders/${order.id}/dispute`)}
                className="w-full border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Laporkan Kendala
              </button>
            )}
          </div>
        )
      }
      if (order.status === 'processing') {
        return !order.dispute ? (
          <button
            onClick={() => router.push(`/orders/${order.id}/dispute`)}
            className="w-full border border-red-200 text-red-400 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Ada Masalah? Laporkan
          </button>
        ) : null
      }
      if (order.status === 'waiting_payment') {
        if (order.payment_proof_url) {
          return (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-center">
              <p className="text-sm font-medium text-orange-700">Bukti transfer sedang direview admin</p>
              <p className="text-xs text-orange-400 mt-1">Review akan selesai dalam 1x24 jam</p>
            </div>
          )
        }
        return (
          // ✅ FIX: stack vertikal di mobile
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() => router.push(`/orders/${order.id}/pay`)}
              className="w-full bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              Bayar
            </button>
            <button
              onClick={() => handleCancel(order)}
              disabled={actionLoading}
              className="w-full border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Batalkan
            </button>
          </div>
        )
      }
    }

    if (activeRole === 'jastiper') {
      if (order.status === 'processing') {
        return (
          <button
            onClick={() => router.push(`/orders/${order.id}/proof`)}
            className="w-full bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
          >
            {order.delivery_pref === 'courier' ? 'Upload Struk & Input Nomor Resi' : 'Upload Struk & Konfirmasi Meetup'}
          </button>
        )
      }
      if (order.status === 'shipped') {
        return !order.dispute ? (
          <button
            onClick={() => router.push(`/orders/${order.id}/dispute`)}
            className="w-full border border-red-200 text-red-400 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Ada masalah? Laporkan
          </button>
        ) : null
      }
    }

    return null
  }

  return (
    // ✅ FIX: w-full menggantikan max-w-2xl agar card full lebar container
    <div className="w-full pb-12">

      {/* Modal konfirmasi */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          {/* ✅ FIX: di mobile muncul dari bawah (sheet), di sm ke atas jadi modal tengah */}
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-xl p-5 sm:p-6">
            {activeRole === 'buyer' && selected.status === 'shipped' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-gray-900">Konfirmasi Pesanan Diterima</h2>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Pastikan pesanan telah diterima dalam kondisi baik. Setelah dikonfirmasi, dana otomatis diteruskan kepada jastiper.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleDelivered(selected)}
                    disabled={actionLoading}
                    className="w-full bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? 'Memproses...' : 'Konfirmasi Diterima'}
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-full border border-gray-200 text-gray-600 rounded-lg py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
            {activeRole === 'buyer' ? 'Pesanan Saya' : 'Order Masuk'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {activeRole === 'buyer' ? 'Pantau status pesanan kamu' : 'Kelola order yang sedang kamu handle'}
          </p>
        </div>
      </div>

      {/* Success toast */}
      {success && (
        <div className="mb-4 bg-[#e6f7f3] border border-[#b3e8d9] rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-[#2d9b7f] font-medium">{success}</p>
          <button onClick={() => setSuccess('')} className="text-[#49BC9E] ml-3 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Tabs — ✅ FIX: scroll horizontal di mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-5">
        <div className="flex border-b border-gray-200 min-w-max sm:min-w-0">
          {(['waiting', 'processing', 'delivered', 'cancelled'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 sm:px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
                tab === t
                  ? 'text-[#49BC9E] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#49BC9E] after:rounded-full'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {activeRole === 'buyer'
                ? t === 'waiting'    ? 'Menunggu Bayar'
                : t === 'processing' ? 'Diproses'
                : t === 'delivered'  ? 'Selesai'
                : 'Dibatalkan'
                : t === 'waiting'    ? 'Perlu Diproses'
                : t === 'processing' ? 'Dikirim'
                : t === 'delivered'  ? 'Selesai'
                : 'Dibatalkan'
              }
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#49BC9E] rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            {tab === 'waiting'    ? (activeRole === 'buyer' ? 'Tidak ada order menunggu pembayaran' : 'Tidak ada order yang perlu diproses')
            : tab === 'processing' ? (activeRole === 'buyer' ? 'Tidak ada order yang sedang diproses' : 'Tidak ada order yang sedang dikirim')
            : tab === 'delivered'  ? 'Belum ada order yang selesai'
            : 'Tidak ada order yang dibatalkan'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map(order => {
            const cfg = statusConfig[order.status]
            const step = cfg?.step ?? 0
            return (
              // ✅ FIX: w-full, padding lebih kecil di mobile
              <div key={order.id} className="w-full bg-white border border-gray-200 rounded-xl p-3 sm:p-5">

                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2">{order.product_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-semibold rounded-full px-2 sm:px-2.5 py-1 border shrink-0 ${
                    order.status === 'waiting_payment' && order.payment_proof_url
                      ? 'text-orange-600 bg-orange-50 border-orange-200'
                      : order.status === 'waiting_payment'
                      ? 'text-orange-400 bg-orange-50 border-orange-200'
                      : order.status === 'processing'
                      ? 'text-blue-500 bg-blue-50 border-blue-200'
                      : order.status === 'shipped'
                      ? 'text-purple-600 bg-purple-50 border-purple-200'
                      : order.status === 'delivered'
                      ? 'text-green-600 bg-green-50 border-green-200'
                      : 'text-red-500 bg-red-50 border-red-200'
                  }`}>
                    {order.status === 'waiting_payment' && order.payment_proof_url ? 'Direview' : cfg?.label}
                  </span>
                </div>

                {/* Progress Steps — ✅ FIX: ukuran lebih kecil di mobile */}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <div className="flex items-center mb-4">
                    {[
                      { s: 1, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                      { s: 2, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /> },
                      { s: 3, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /> },
                      { s: 4, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                    ].map(({ s, icon }, idx) => (
                      <React.Fragment key={s}>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${step >= s ? 'border-[#49BC9E]' : 'border-gray-200'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 sm:w-5 sm:h-5 ${step >= s ? 'text-[#49BC9E]' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {icon}
                          </svg>
                        </div>
                        {idx < 3 && <div className={`flex-1 h-px mx-1 sm:mx-2 ${step > s ? 'bg-[#49BC9E]' : 'bg-gray-200'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Delivery info */}
                <div className={`mb-3 ${order.tracking_number ? 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4' : ''}`}>
                  {order.delivery_pref === 'courier' ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 mb-0.5">Pengiriman:</p>
                        <p className="text-xs text-gray-500">{order.shipping_address ?? '-'}</p>
                      </div>
                      {order.tracking_number && (
                        <div>
                          <p className="text-xs font-semibold text-gray-900 mb-0.5">No. Resi:</p>
                          <p className="text-xs text-gray-500 font-mono">{order.tracking_number}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-900 mb-0.5">Lokasi Meetup:</p>
                      <p className="text-xs text-gray-500">{order.meetup_location ?? '-'}</p>
                      {order.meetup_time && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(order.meetup_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Counterpart info */}
                {order.counterpart && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {order.counterpart.avatar_url ? (
                        <img src={order.counterpart.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#e6f7f3] flex items-center justify-center text-sm font-semibold text-[#49BC9E] uppercase shrink-0">
                          {order.counterpart.full_name?.[0] ?? '?'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[130px] sm:max-w-none">{order.counterpart.full_name}</p>
                        <p className="text-[11px] text-gray-400">{activeRole === 'buyer' ? 'Jastiper' : 'Buyer'}</p>
                      </div>
                    </div>
                    {order.counterpart.whatsapp_number && (
                      <a
                        href={`https://wa.me/${order.counterpart.whatsapp_number.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#49BC9E] hover:bg-[#3da88d] text-white text-xs font-semibold px-3 sm:px-5 py-2 rounded-lg transition-colors shrink-0"
                      >
                        Hubungi
                      </a>
                    )}
                  </div>
                )}

                {/* Pricing */}
                {order.pricing && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Harga fix (all-in)</span>
                      <span>{formatRupiah(order.pricing.product_price_idr)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Platform fee (5%)</span>
                      <span>{formatRupiah(order.pricing.platform_fee_idr)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                      <span>Total</span>
                      <span>{formatRupiah(order.pricing.total_idr)}</span>
                    </div>
                  </div>
                )}

                {/* Bukti pembelian */}
                {activeRole === 'buyer' && order.proof && (
                  <div className="border border-gray-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-gray-900 mb-2">Bukti Pembelian</p>
                    {/* ✅ FIX: stack vertikal di mobile, grid di sm */}
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                      <a
                        href={order.proof.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-gray-700">Lihat Struk</span>
                      </a>
                      {order.proof.store_photo_url && (
                        <a
                          href={order.proof.store_photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs text-gray-700">Foto Toko</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Info dispute open */}
                {order.dispute && order.dispute.status === 'open' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 flex items-start gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-blue-600">Komplain sedang ditinjau admin</p>
                      <p className="text-[11px] text-blue-500 mt-0.5">{order.dispute.reason}</p>
                    </div>
                  </div>
                )}

                {/* Info dispute cancelled */}
                {order.status === 'cancelled' && order.dispute && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-red-600 mb-1">Order dibatalkan karena pelanggaran</p>
                    <p className="text-xs text-red-700 mb-1">
                      <span className="font-medium">Alasan:</span> {order.dispute.reason}
                    </p>
                    {order.dispute.resolution && (
                      <p className="text-xs text-red-700">
                        <span className="font-medium">Keputusan admin:</span> {order.dispute.resolution}
                      </p>
                    )}
                    {order.dispute.status === 'resolved' && (
                      <p className="text-xs text-red-500 mt-1">Dana dikembalikan ke buyer</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {renderActions(order)}

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}