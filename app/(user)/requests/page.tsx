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

const statusConfig = {
  open: { label: 'Menunggu Jastiper', color: 'bg-yellow-100 text-yellow-700' },
  matched: { label: 'Tagihan Masuk', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Sudah Dibayar', color: 'bg-purple-100 text-purple-700' },
  selesai: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-500' },
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

    const queryStatus = (tab === 'selesai' || tab === 'paid') ? 'matched' : tab === 'cancelled' ? 'in:matched,cancelled' : tab

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
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Saya</h1>
          <p className="text-sm text-gray-400 mt-1">Pantau status permintaan barang kamu</p>
        </div>
        <button
          onClick={() => router.push('/requests/new')}
          className="bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Buat Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        {(['open', 'matched', 'paid', 'selesai', 'cancelled'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 pb-3 text-sm border-b-2 transition-colors ${
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
            {tab === 'open' ? 'Belum ada request yang aktif' : tab === 'matched' ? 'Belum ada tagihan masuk' : tab === 'paid' ? 'Belum ada request yang diproses' : tab === 'selesai' ? 'Belum ada request yang selesai' : 'Tidak ada request yang dibatalkan'}
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
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 mb-1 truncate">{req.product_name}</p>
                  <a
                    href={req.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:underline truncate block"
                  >
                    {req.product_url}
                  </a>
                </div>
                {/* Status Badge */}
                <span className={`flex-shrink-0 ml-4 text-xs font-semibold rounded-full px-3 py-1 border ${
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
                    : tab === 'matched' && req.payment_proof_url ? 'Direview Admin'
                    : tab === 'matched' ? 'Tagihan Masuk'
                    : tab === 'paid' ? 'Sudah Dibayar'
                    : tab === 'selesai' ? 'Selesai'
                    : 'Dibatalkan'}
                </span>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 rounded-lg p-4 mb-4">
                <div>
                  <p className="text-xs text-[#49BC9E] mb-1">Estimasi Barang Diterima</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(req.deadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#49BC9E] mb-1">Metode Pengiriman</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{req.delivery_pref === 'courier' ? 'Kirim Paket' : 'Meetup'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#49BC9E] mb-1">Maksimal Budget (IDR)</p>
                  <p className="text-sm font-semibold text-gray-900">{formatRupiah(req.max_budget_idr)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#49BC9E] mb-1">Jumlah</p>
                  <p className="text-sm font-semibold text-gray-900">{req.quantity} Pcs</p>
                </div>
              </div>

              {/* Catatan */}
              {req.notes && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Catatan:</p>
                  <p className="text-sm text-gray-500">{req.notes}</p>
                </div>
              )}

              {/* Tab Cancelled: request dibatalkan manual */}
              {tab === 'cancelled' && req.status === 'cancelled' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-600">Request dibatalkan</p>
                  <p className="text-xs text-gray-400 mt-1">Request ini dibatalkan sebelum ada jastiper yang mengambil.</p>
                </div>
              )}

              {tab === 'cancelled' && req.status === 'matched' && req.jastiper && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 space-y-3">
                  <p className="text-sm font-semibold text-red-700">Order Dibatalkan</p>
                  <div className="flex items-center gap-2">
                    {req.jastiper.avatar_url ? (
                      <img src={req.jastiper.avatar_url} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center text-xs font-semibold text-red-700 uppercase">
                        {req.jastiper.full_name?.[0] ?? '?'}
                      </div>
                    )}
                    <p className="text-sm text-red-700">{req.jastiper.full_name}</p>
                  </div>
                  <div className="text-xs text-red-600 space-y-1">
                    <p>Harga yang disepakati: <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(req.fixed_price_idr ?? 0)}</span></p>
                    {req.cancellation_reason && <p>Alasan: {req.cancellation_reason}</p>}
                  </div>
                </div>
              )}

              {/* Info jastiper + harga — tampil di semua tab matched kecuali cancelled */}
              {tab !== 'cancelled' && req.status === 'matched' && req.fixed_price_idr && (
                <div className={`border rounded-lg p-4 mb-4 ${
                  tab === 'matched'
                    ? 'bg-blue-50 border-blue-200'
                    : tab === 'paid'
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-sm font-semibold ${
                      tab === 'matched' ? 'text-blue-800'
                      : tab === 'paid' ? 'text-purple-800'
                      : 'text-green-800'
                    }`}>
                      {tab === 'matched' ? 'Tagihan dari Jastiper'
                       : tab === 'paid' ? 'Sedang Diproses Jastiper'
                       : 'Order Selesai'}
                    </p>
                    {tab === 'matched' && req.payment_expired_at && (
                      <span className="text-xs text-blue-600 font-medium">
                        ⏱ {formatExpiry(req.payment_expired_at)}
                      </span>
                    )}
                  </div>

                  {/* Info jastiper */}
                  {req.jastiper && (
                    <div className={`flex items-center gap-3 mb-3 pb-3 border-b ${
                      tab === 'matched' ? 'border-blue-200'
                      : tab === 'paid' ? 'border-purple-200'
                      : 'border-green-200'
                    }`}>
                      {req.jastiper.avatar_url ? (
                        <img src={req.jastiper.avatar_url} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold uppercase ${
                          tab === 'matched' ? 'bg-blue-200 text-blue-700'
                          : tab === 'paid' ? 'bg-purple-200 text-purple-700'
                          : 'bg-green-200 text-green-700'
                        }`}>
                          {req.jastiper.full_name?.[0] ?? '?'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${
                          tab === 'matched' ? 'text-blue-800'
                          : tab === 'paid' ? 'text-purple-800'
                          : 'text-green-800'
                        }`}>{req.jastiper.full_name}</p>
                        <p className={`text-xs ${
                          tab === 'matched' ? 'text-blue-600'
                          : tab === 'paid' ? 'text-purple-600'
                          : 'text-green-600'
                        }`}>
                          {tab === 'paid' ? 'Jastiper sedang memproses pesananmu' : 'Jastiper yang mengambil request ini'}
                        </p>
                      </div>
                      {req.jastiper.whatsapp_number && (
                        <a
                          href={`https://wa.me/${req.jastiper.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}

                  {/* Rincian harga */}
                  <div className="space-y-1.5 mb-3">
                    <div className={`flex justify-between items-start text-xs ${
                      tab === 'matched' ? 'text-blue-700'
                      : tab === 'paid' ? 'text-purple-700'
                      : 'text-green-700'
                    }`}>
                      <div>
                        <p>Harga fix (all-in)</p>
                        <p className="text-[11px] mt-0.5 opacity-70">Sudah termasuk harga barang, service fee jastiper & ongkir</p>
                      </div>
                      <span className="font-medium shrink-0 ml-3">{formatRupiah(req.fixed_price_idr)}</span>
                    </div>
                    <div className={`flex justify-between text-xs ${
                      tab === 'matched' ? 'text-blue-700'
                      : tab === 'paid' ? 'text-purple-700'
                      : 'text-green-700'
                    }`}>
                      <span>Platform fee Jastipal (5%)</span>
                      <span>{formatRupiah(Math.round(req.fixed_price_idr * 0.05))}</span>
                    </div>
                    <div className={`flex justify-between text-sm font-bold pt-1.5 border-t ${
                      tab === 'matched' ? 'text-blue-800 border-blue-200'
                      : tab === 'paid' ? 'text-purple-800 border-purple-200'
                      : 'text-green-800 border-green-200'
                    }`}>
                      <span>Total {tab === 'selesai' ? 'dibayar' : 'tagihan'}</span>
                      <span>{formatRupiah(req.fixed_price_idr + Math.round(req.fixed_price_idr * 0.05))}</span>
                    </div>
                  </div>

                  {/* Tombol bayar hanya di tab matched */}
                  {tab === 'matched' && (
                    req.payment_proof_url ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-center">
                        <p className="text-sm font-medium text-orange-700">⏳ Bukti transfer sedang direview admin</p>
                        <p className="text-xs text-orange-500 mt-1">Biasanya selesai dalam 1x24 jam</p>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => req.order_id ? router.push(`/orders/${req.order_id}/pay`) : router.push('/orders')}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium transition-all"
                        >
                          Bayar Sekarang
                        </button>
                        <p className="text-xs text-blue-500 text-center mt-2">
                          Tidak membayar = order otomatis dibatalkan setelah waktu habis
                        </p>
                      </>
                    )
                  )}
                  {tab === 'paid' && (
                    <p className="text-xs text-purple-500 text-center">
                      Jastiper akan mengupdate status saat barang siap dikirim
                    </p>
                  )}
                  {tab === 'selesai' && (
                    <p className="text-xs text-green-600 text-center">
                      Transaksi selesai — terima kasih telah menggunakan Jastipal!
                    </p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">{formatDate(req.created_at)}</p>
                {req.status === 'open' && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={cancellingId === req.id}
                    className="bg-[#49BC9E] hover:bg-[#3da88d] disabled:opacity-50 transition-colors text-white text-sm font-semibold px-6 py-2.5 rounded-lg"
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