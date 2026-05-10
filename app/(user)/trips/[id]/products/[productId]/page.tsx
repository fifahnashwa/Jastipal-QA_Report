'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

type Product = {
  id: string
  trip_id: string
  jastiper_id: string
  product_name: string
  image_url: string | null
  product_price_idr: number
  service_fee_idr: number
  shipping_fee_idr: number
  total_price_idr: number
  stock: number
  status: string
}

type Trip = {
  id: string
  title: string
  trip_country: string
  arrival_date: string
  arrival_city: string | null
  jastiper_id: string
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

export default function ProductDetailPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const tripId = params.id as string
  const productId = params.productId as string

  const [product, setProduct] = useState<Product | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [activeRole, setActiveRole] = useState<'buyer' | 'jastiper'>('buyer')

  const [showOrder, setShowOrder] = useState(false)
  const [buyerCity, setBuyerCity] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState('')

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

      const { data: productData } = await supabase
        .from('listings')
        .select('id, trip_id, jastiper_id, product_name, image_url, product_price_idr, service_fee_idr, shipping_fee_idr, total_price_idr, stock, status')
        .eq('id', productId)
        .single()

      if (!productData) { router.push('/browse-listings'); return }
      setProduct(productData as any)

      const { data: tripData } = await supabase
        .from('trips')
        .select('id, title, trip_country, arrival_date, arrival_city, jastiper_id')
        .eq('id', tripId)
        .single()

      if (!tripData) { router.push('/browse-listings'); return }

      const { data: jastiperUser } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', (tripData as any).jastiper_id)
        .single()

      const { data: jastiperProfile } = await supabase
        .from('jastiper_profiles')
        .select('whatsapp_number')
        .eq('user_id', (tripData as any).jastiper_id)
        .single()

      setTrip({
        ...(tripData as any),
        jastiper: jastiperUser ? {
          full_name: jastiperUser.full_name,
          avatar_url: jastiperUser.avatar_url,
          whatsapp_number: jastiperProfile?.whatsapp_number ?? null,
        } : null,
      })

      setLoading(false)
    }
    init()
  }, [])

  async function handleOrder() {
    if (!product || !trip || !userId) return
    if (!buyerCity.trim()) { setOrderError('Kota pengiriman wajib diisi'); return }
    if (!shippingAddress.trim()) { setOrderError('Alamat pengiriman wajib diisi'); return }

    setOrderLoading(true)
    setOrderError('')

    const isSameCity = buyerCity.trim().toLowerCase() === (trip.arrival_city ?? '').toLowerCase()
    const domesticShipping = isSameCity ? 25000 : 50000
    const platformFee = Math.round(product.total_price_idr * 0.05)
    const total = product.total_price_idr + platformFee + domesticShipping

    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        jastiper_id: trip.jastiper_id,
        listing_id: product.id,
        flow_type: 'flow_b',
        product_name: product.product_name,
        quantity: 1,
        delivery_pref: 'courier',
        shipping_address: `${shippingAddress}, ${buyerCity}`,
        status: 'waiting_payment',
      })
      .select('id')
      .single()

    if (orderErr) { setOrderError('Gagal membuat order: ' + orderErr.message); setOrderLoading(false); return }

    await supabase.from('order_pricing').insert({
      order_id: orderData.id,
      product_price_idr: product.product_price_idr,
      service_fee_idr: product.service_fee_idr,
      shipping_fee_idr: product.shipping_fee_idr + domesticShipping,
      platform_fee_idr: platformFee,
      estimated_customs_idr: 0,
      total_idr: total,
    })

    await supabase.from('escrow_transactions').insert({
      order_id: orderData.id,
      amount_idr: total,
      status: 'held',
    })

    setOrderSuccess(`Order berhasil! Total: ${formatRupiah(total)}`)
    setShowOrder(false)
    setOrderLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#49BC9E] rounded-full animate-spin"></div>
    </div>
  )

  if (!product || !trip) return null

  const isSameCity = buyerCity.trim().toLowerCase() === (trip.arrival_city ?? '').toLowerCase()
  const domesticShipping = buyerCity ? (isSameCity ? 25000 : 50000) : 0
  const platformFee = Math.round(product.total_price_idr * 0.05)
  const total = product.total_price_idr + platformFee + domesticShipping

  return (
    <div className="max-w-lg">

      {/* Order modal */}
      {showOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Konfirmasi Order</h2>
              <button
                onClick={() => { setShowOrder(false); setOrderError('') }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Kota pengiriman <span className="text-red-400">*</span>
                  </label>
                  <input
                    placeholder="Contoh: Malang, Surabaya"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#49BC9E] transition-colors text-gray-900"
                    value={buyerCity}
                    onChange={e => setBuyerCity(e.target.value)}
                  />
                  {buyerCity && trip.arrival_city && (
                    <p className="text-xs mt-1 font-medium">
                      {isSameCity
                        ? <span className="text-[#2d9b7f]">✓ Sekota dengan jastiper — ongkir Rp 25.000</span>
                        : <span className="text-orange-500">📦 Beda kota ({trip.arrival_city}) — ongkir Rp 50.000</span>
                      }
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Alamat lengkap <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Jl. Contoh No. 123, Kecamatan"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#49BC9E] transition-colors text-gray-900 resize-none"
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Harga produk</span>
                  <span>{formatRupiah(product.product_price_idr)}</span>
                </div>
                {product.service_fee_idr > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Service fee</span>
                    <span>{formatRupiah(product.service_fee_idr)}</span>
                  </div>
                )}
                {product.shipping_fee_idr > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Ongkir luar negeri</span>
                    <span>{formatRupiah(product.shipping_fee_idr)}</span>
                  </div>
                )}
                {buyerCity && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Ongkir domestik {isSameCity ? '(sekota)' : '(beda kota)'}</span>
                    <span>{formatRupiah(domesticShipping)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Platform fee (5%)</span>
                  <span>{formatRupiah(platformFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatRupiah(total)}</span>
                </div>
                {!buyerCity && (
                  <p className="text-xs text-gray-400 italic">*Isi kota untuk melihat total dengan ongkir</p>
                )}
              </div>

              {orderError && <p className="text-red-500 text-sm">{orderError}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowOrder(false); setOrderError('') }}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleOrder}
                  disabled={orderLoading}
                  className="flex-1 bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {orderLoading ? 'Memproses...' : 'Order Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </button>

      {/* Success toast */}
      {orderSuccess && (
        <div className="mb-5 bg-[#e6f7f3] border border-[#b3e8d9] rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-[#2d9b7f] font-medium">{orderSuccess}</p>
          <button
            onClick={() => router.push('/orders')}
            className="text-[#49BC9E] ml-4 text-xs underline shrink-0"
          >
            Lihat pesanan →
          </button>
        </div>
      )}

      {/* Foto produk */}
      {product.image_url ? (
        <img src={product.image_url} className="w-full h-56 object-cover rounded-2xl mb-5" alt={product.product_name} />
      ) : (
        <div className="w-full h-40 bg-gray-100 rounded-2xl mb-5 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}

      {/* Info produk */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">{product.product_name}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 border ${
            product.status === 'open'
              ? 'bg-[#e6f7f3] text-[#2d9b7f] border-[#b3e8d9]'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            {product.status === 'open' ? 'Tersedia' : 'Tidak tersedia'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Stok</p>
            <p className="text-sm font-semibold text-gray-900">{product.stock} pcs</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Harga produk</p>
            <p className="text-sm font-semibold text-gray-900">{formatRupiah(product.product_price_idr)}</p>
          </div>
          {product.service_fee_idr > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Service fee</p>
              <p className="text-sm font-semibold text-gray-900">{formatRupiah(product.service_fee_idr)}</p>
            </div>
          )}
          {product.shipping_fee_idr > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Ongkir luar negeri</p>
              <p className="text-sm font-semibold text-gray-900">{formatRupiah(product.shipping_fee_idr)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Total (belum termasuk ongkir domestik)</p>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(product.total_price_idr)}</p>
          </div>
        </div>
      </div>

      {/* Info trip */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Info Trip</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span>✈️</span>
            <span className="text-gray-700">{trip.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span className="text-gray-700">{trip.trip_country}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span className="text-gray-700">Tiba di {trip.arrival_city ?? '-'} · {formatDate(trip.arrival_date)}</span>
          </div>
          <div className="pt-2 border-t border-gray-100 mt-1">
            <p className="text-xs text-gray-400">Ongkir domestik: sekota Rp 25.000 · beda kota Rp 50.000</p>
          </div>
        </div>
      </div>

      {/* Info jastiper */}
      {trip.jastiper && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Jastiper</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {trip.jastiper.avatar_url ? (
                <img src={trip.jastiper.avatar_url} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#e6f7f3] flex items-center justify-center text-sm font-semibold text-[#49BC9E] uppercase">
                  {trip.jastiper.full_name?.[0] ?? '?'}
                </div>
              )}
              <p className="font-medium text-gray-900">{trip.jastiper.full_name}</p>
            </div>
            {trip.jastiper.whatsapp_number && (
              <a
                href={`https://wa.me/${trip.jastiper.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* Tombol order */}
      {activeRole === 'buyer' && product.status === 'open' && !orderSuccess && (
        <button
          onClick={() => setShowOrder(true)}
          className="w-full bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-xl py-3 text-sm font-semibold transition-colors"
        >
          Order Sekarang
        </button>
      )}
    </div>
  )
}