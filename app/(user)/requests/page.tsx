'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Request = {
  id: string
  jastiper_id: string | null
  order_id: string | null
  payment_proof_url: string | null
  cancellation_reason: string | null
  product_name: string
  product_url: string
  quantity: number
  max_budget_idr: number
  fixed_price_idr: number | null
  deadline: string
  delivery_pref: 'courier' | 'meetup'
  status: 'open' | 'matched' | 'cancelled'
  payment_expired_at: string | null
  notes: string | null
  created_at: string
  jastiper: {
    full_name: string
    avatar_url: string | null
    whatsapp_number: string | null
  } | null
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatExpiry(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  if (diff <= 0) return 'Kadaluarsa'
  const hours = Math.floor(diff / 1000 / 60 / 60)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  return `${hours}j ${minutes}m tersisa`
}

export default function MyRequestsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'open' | 'matched' | 'paid' | 'selesai' | 'cancelled'>('open')

  useEffect(() => { fetchRequests() }, [tab])

  async function fetchRequests() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let query = supabase
      .from('requests')
      .select('id, jastiper_id, product_name, product_url, quantity, max_budget_idr, fixed_price_idr, deadline, delivery_pref, status, payment_expired_at, notes, created_at, jastiper:jastiper_id(full_name, avatar_url)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    if (tab === 'selesai' || tab === 'paid') {
      query = query.eq('status', 'matched')
    } else if (tab === 'cancelled') {
      query = query.in('status', ['matched', 'cancelled', 'open'])
    } else {
      query = query.eq('status', tab)
    }

    const { data } = await query

    if (!data || data.length === 0) { setRequests([]); setLoading(false); return }

    const jastiperIds = [...new Set(data.filter((r: any) => r.jastiper_id).map((r: any) => r.jastiper_id))]
    let waMap: Record<string, string | null> = {}

    if (jastiperIds.length > 0) {
      const { data: jpData } = await supabase
        .from('jastiper_profiles')
        .select('user_id, whatsapp_number')
        .in('user_id', jastiperIds)
      ;(jpData ?? []).forEach((jp: any) => { waMap[jp.user_id] = jp.whatsapp_number })
    }

    const requestIds = data.map((r: any) => r.id)
    let orderMap: Record<string, { id: string; status: string }> = {}

    if (requestIds.length > 0) {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, request_id, status')
        .in('request_id', requestIds)
      ;(ordersData ?? []).forEach((o: any) => { orderMap[o.request_id] = { id: o.id, status: o.status } })
    }

    const orderIds = Object.values(orderMap).map(o => o.id).filter(Boolean)
    let escrowProofMap: Record<string, string | null> = {}
    let escrowNoteMap: Record<string, string | null> = {}

    if (orderIds.length > 0) {
      for (const oid of orderIds) {
        const { data: escrowData } = await supabase
          .from('escrow_transactions')
          .select('order_id, payment_proof_url, admin_note')
          .eq('order_id', oid)
          .single()
        if (escrowData) {
          escrowProofMap[escrowData.order_id] = escrowData.payment_proof_url
          escrowNoteMap[escrowData.order_id] = escrowData.admin_note
        }
      }
    }

    const reqPaymentProofMap: Record<string, string | null> = {}
    const reqCancellationReasonMap: Record<string, string | null> = {}
    Object.entries(orderMap).forEach(([reqId, o]) => {
      reqPaymentProofMap[reqId] = escrowProofMap[o.id] ?? null
      reqCancellationReasonMap[reqId] = escrowNoteMap[o.id] ?? null
    })

    const mapped = data
      .filter((r: any) => {
        const orderStatus = orderMap[r.id]?.status
        if (tab === 'matched') {
          if (orderStatus !== 'waiting_payment') return false
        }
        if (tab === 'paid') {
          return orderStatus === 'processing' || orderStatus === 'shipped'
        }
        if (tab === 'selesai') {
          return orderStatus === 'delivered'
        }
        if (tab === 'cancelled') {
          if (r.status === 'cancelled') return true
          if (r.status === 'matched' && orderStatus === 'cancelled') return true
          return false
        }
        return true
      })
      .map((r: any) => ({
        ...r,
        order_id: orderMap[r.id]?.id ?? null,
        payment_proof_url: reqPaymentProofMap[r.id] ?? null,
        cancellation_reason: reqCancellationReasonMap[r.id] ?? null,
        jastiper: r.jastiper ? {
          full_name: r.jastiper.full_name,
          avatar_url: r.jastiper.avatar_url,
          whatsapp_number: waMap[r.jastiper_id] ?? null,
        } : null,
      }))

    setRequests(mapped)
    setLoading(false)
  }

  async function handleCancel(id: string) {
    setCancellingId(id)
    await supabase.from('requests').update({ status: 'cancelled' }).eq('id', id)
    setCancellingId(null)
    fetchRequests()
  }

  const tabLabels: Record<string, string> = {
    open: 'Menunggu',
    matched: 'Tagihan',
    paid: 'Diproses',
    selesai: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  return (
    // ✅ FIX: Hapus max-w-3xl di sini — biarkan parent layout yang mengatur lebar.
    // Gunakan w-full agar card mengisi penuh lebar container yang tersedia.
    <div className="w-full pb-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Request Saya</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Pantau status permintaan barang kamu</p>
        </div>
        <button
          onClick={() => router.push('/requests/new')}
          className="bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold flex items-center gap-1.5 shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="hidden sm:inline">Tambah Permintaan</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Tabs — scroll horizontal di mobile */}
      <div className="overflow-x-auto mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-0 border-b border-gray-200 min-w-max">
          {(['open', 'matched', 'paid', 'selesai', 'cancelled'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 pb-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                tab === t
                  ? 'border-[#49BC9E] text-[#49BC9E] font-semibold'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tabLabels[t]}
              {tab === t && requests.length > 0 && (
                <span className="bg-[#49BC9E] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#49BC9E] rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {tab === 'open' ? 'Belum ada request yang aktif'
              : tab === 'matched' ? 'Belum ada tagihan masuk'
              : tab === 'paid' ? 'Belum ada request yang diproses'
              : tab === 'selesai' ? 'Belum ada request yang selesai'
              : 'Tidak ada request yang dibatalkan'}
          </p>
          {tab === 'open' && (
            <button
              onClick={() => router.push('/requests/new')}
              className="bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Buat Request Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {requests.map(req => (
            // ✅ FIX: Card full width, padding lebih kecil di mobile (p-3 → p-4 di sm)
            <div key={req.id} className="w-full bg-white rounded-xl border border-gray-200 p-3 sm:p-5 shadow-sm">

              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  {/* ✅ FIX: Batas teks lebih ketat di mobile, gunakan line-clamp */}
                  <p className="font-bold text-gray-900 mb-1 text-sm sm:text-base line-clamp-2">{req.product_name}</p>
                  <a
                    href={req.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:underline truncate block"
                  >
                    {req.product_url}
                  </a>
                </div>
                {/* Status Badge — ✅ FIX: teks lebih kecil di mobile */}
                <span className={`flex-shrink-0 text-[10px] sm:text-xs font-semibold rounded-full px-2 sm:px-3 py-1 border ${
                  tab === 'open'
                    ? 'text-orange-400 bg-orange-50 border-orange-200'
                    : tab === 'matched' && req.payment_proof_url
                    ? 'text-orange-600 bg-orange-50 border-orange-200'
                    : tab === 'matched'
                    ? 'text-blue-500 bg-blue-50 border-blue-200'
                    : tab === 'paid'
                    ? 'text-purple-600 bg-purple-50 border-purple-200'
                    : tab === 'selesai'
                    ? 'text-green-600 bg-green-50 border-green-200'
                    : 'text-red-500 bg-red-50 border-red-200'
                }`}>
                  {tab === 'open' ? 'Menunggu'
                    : tab === 'matched' && req.payment_proof_url ? 'Direview'
                    : tab === 'matched' ? 'Tagihan'
                    : tab === 'paid' ? 'Diproses'
                    : tab === 'selesai' ? 'Selesai'
                    : 'Dibatalkan'}
                </span>
              </div>

              {/* Detail Grid — ✅ FIX: 2 kolom tetap tapi lebih compact di mobile */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 bg-gray-50 rounded-lg p-3 mb-3">
                <div>
                  <p className="text-[11px] text-[#64748B] mb-0.5">Estimasi Diterima</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{formatDate(req.deadline)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748B] mb-0.5">Pengiriman</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{req.delivery_pref === 'courier' ? 'Kirim Paket' : 'Meetup'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748B] mb-0.5">Maks. Budget</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{formatRupiah(req.max_budget_idr)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748B] mb-0.5">Jumlah</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{req.quantity} Pcs</p>
                </div>
              </div>

              {/* Tab Cancelled: request dibatalkan manual */}
              {tab === 'cancelled' && req.status === 'cancelled' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Request dibatalkan</p>
                  <p className="text-[11px] text-gray-400 mt-1">Request ini dibatalkan sebelum ada jastiper yang mengambil.</p>
                </div>
              )}

              {tab === 'cancelled' && req.status === 'matched' && req.jastiper && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-red-700">Order Dibatalkan</p>
                  <div className="flex items-center gap-2">
                    {req.jastiper.avatar_url ? (
                      <img src={req.jastiper.avatar_url} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center text-[10px] font-semibold text-red-700 uppercase">
                        {req.jastiper.full_name?.[0] ?? '?'}
                      </div>
                    )}
                    <p className="text-xs text-red-700">{req.jastiper.full_name}</p>
                  </div>
                  <div className="text-[11px] text-red-600 space-y-1">
                    <p>Harga disepakati: <span className="font-medium">{formatRupiah(req.fixed_price_idr ?? 0)}</span></p>
                    {req.cancellation_reason && <p>Alasan: {req.cancellation_reason}</p>}
                  </div>
                </div>
              )}

              {/* Info jastiper + harga */}
              {tab !== 'cancelled' && req.status === 'matched' && req.fixed_price_idr && (
                <div className={`border rounded-xl p-3 sm:p-4 mb-3 ${
                  tab === 'matched' ? 'bg-gray-50 border-gray-200'
                  : tab === 'paid' ? 'bg-purple-50 border-purple-200'
                  : 'bg-green-50 border-green-200'
                }`}>
                  {tab === 'matched' ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-gray-900">Tagihan Anda</p>
                        {req.payment_expired_at && (
                          <span className="text-[11px] text-gray-500 font-medium">⏱ {formatExpiry(req.payment_expired_at)}</span>
                        )}
                      </div>

                      {req.jastiper && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                          {req.jastiper.avatar_url ? (
                            <img src={req.jastiper.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 uppercase shrink-0">
                              {req.jastiper.full_name?.[0] ?? '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{req.jastiper.full_name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#49BC9E] shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              <span className="text-[11px] text-[#64748B] font-medium">Jastiper</span>
                            </div>
                          </div>
                          {req.jastiper.whatsapp_number && (
                            <a
                              href={`https://wa.me/${req.jastiper.whatsapp_number.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0"
                            >
                              Hubungi
                            </a>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-[#64748B]">Harga (Produk & Fee Jastiper)</span>
                          <span className="text-xs font-semibold text-gray-900">{formatRupiah(req.fixed_price_idr)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-[#64748B]">Platform Fee (5%)</span>
                          <span className="text-xs font-semibold text-gray-900">{formatRupiah(Math.round(req.fixed_price_idr * 0.05))}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm font-bold text-gray-900">Total Tagihan</span>
                          <span className="text-sm font-bold text-gray-900">{formatRupiah(req.fixed_price_idr + Math.round(req.fixed_price_idr * 0.05))}</span>
                        </div>
                      </div>

                      {req.payment_proof_url ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-center">
                          <p className="text-xs font-medium text-orange-700">Bukti transfer sedang direview admin</p>
                          <p className="text-[11px] text-orange-500 mt-0.5">Review akan selesai dalam 1x24 jam</p>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => req.order_id ? router.push(`/orders/${req.order_id}/pay`) : router.push('/orders')}
                            className="w-full bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-xl py-2.5 text-sm font-semibold transition-all"
                          >
                            Bayar Sekarang
                          </button>
                          <p className="text-[11px] text-gray-400 text-center mt-2">
                            Pesanan dibatalkan otomatis jika waktu pembayaran habis.
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className={`text-sm font-bold ${tab === 'paid' ? 'text-purple-900' : 'text-green-900'}`}>
                          {tab === 'paid' ? 'Sedang Diproses Jastiper' : 'Order Selesai'}
                        </p>
                      </div>

                      {req.jastiper && (
                        <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${tab === 'paid' ? 'border-purple-200' : 'border-green-200'}`}>
                          {req.jastiper.avatar_url ? (
                            <img src={req.jastiper.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold uppercase shrink-0 ${tab === 'paid' ? 'bg-purple-200 text-purple-700' : 'bg-green-200 text-green-700'}`}>
                              {req.jastiper.full_name?.[0] ?? '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${tab === 'paid' ? 'text-purple-900' : 'text-green-900'}`}>{req.jastiper.full_name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 ${tab === 'paid' ? 'text-purple-400' : 'text-green-500'}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              {/* ✅ FIX: teks lebih pendek di mobile agar tidak wrap buruk */}
                              <span className={`text-[11px] font-medium ${tab === 'paid' ? 'text-purple-600' : 'text-green-600'}`}>
                                {tab === 'paid' ? 'Memproses pesananmu' : 'Jastiper kamu'}
                              </span>
                            </div>
                          </div>
                          {req.jastiper.whatsapp_number && (
                            <a
                              href={`https://wa.me/${req.jastiper.whatsapp_number.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${tab === 'paid' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#49BC9E] hover:bg-[#3da88d]'}`}
                            >
                              Hubungi
                            </a>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <span className={`text-xs font-medium ${tab === 'paid' ? 'text-purple-700' : 'text-green-700'}`}>Harga fix (all-in)</span>
                            <p className={`text-[11px] mt-0.5 ${tab === 'paid' ? 'text-purple-500' : 'text-green-500'}`}>Termasuk barang, fee jastiper & ongkir</p>
                          </div>
                          <span className={`text-xs font-semibold shrink-0 ${tab === 'paid' ? 'text-purple-900' : 'text-green-900'}`}>{formatRupiah(req.fixed_price_idr)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-medium ${tab === 'paid' ? 'text-purple-700' : 'text-green-700'}`}>Platform fee (5%)</span>
                          <span className={`text-xs font-semibold ${tab === 'paid' ? 'text-purple-900' : 'text-green-900'}`}>{formatRupiah(Math.round(req.fixed_price_idr * 0.05))}</span>
                        </div>
                        <div className={`flex justify-between items-center pt-2 border-t ${tab === 'paid' ? 'border-purple-200' : 'border-green-200'}`}>
                          <span className={`text-sm font-bold ${tab === 'paid' ? 'text-purple-900' : 'text-green-900'}`}>Total {tab === 'selesai' ? 'dibayar' : 'tagihan'}</span>
                          <span className={`text-sm font-bold ${tab === 'paid' ? 'text-purple-900' : 'text-green-900'}`}>{formatRupiah(req.fixed_price_idr + Math.round(req.fixed_price_idr * 0.05))}</span>
                        </div>
                      </div>

                      {tab === 'paid' && (
                        <p className="text-[11px] text-purple-500 text-center">
                          Jastiper akan update status saat barang siap dikirim.
                        </p>
                      )}
                      {tab === 'selesai' && (
                        <p className="text-xs text-green-600 text-center">
                          Transaksi selesai, terima kasih telah menggunakan Jastipal!
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Catatan */}
              {req.notes && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-900 mb-1">Catatan:</p>
                  <p className="text-xs text-gray-500">{req.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-400">{formatDate(req.created_at)}</p>
                {req.status === 'open' && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={cancellingId === req.id}
                    className="bg-[#49BC9E] hover:bg-[#3da88d] disabled:opacity-50 transition-colors text-white text-xs font-semibold px-4 py-2 rounded-lg"
                  >
                    {cancellingId === req.id ? 'Membatalkan...' : 'Batalkan'}
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