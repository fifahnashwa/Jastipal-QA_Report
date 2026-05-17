'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Trip = {
  id: string
  jastiper_id: string
  title: string
  description: string | null
  trip_country: string
  arrival_date: string
  arrival_city: string | null
  image_url: string | null
  status: string
  created_at: string
  jastiper: {
    full_name: string
    avatar_url: string | null
    whatsapp_number: string | null
  } | null
  products: Product[]
}

type Product = {
  id: string
  product_name: string
  product_url: string | null
  image_url: string | null
  description: string | null
  product_price_idr: number
  service_fee_idr: number
  shipping_fee_idr: number
  total_price_idr: number
  stock: number
  status: string
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysLeft(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  const days = Math.ceil(diff / 1000 / 60 / 60 / 24)
  if (days < 0) return { label: 'Sudah tiba', urgent: false }
  if (days === 0) return { label: 'Tiba hari ini', urgent: true }
  if (days <= 3) return { label: `${days} hari lagi`, urgent: true }
  return { label: `${days} hari lagi`, urgent: false }
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
function IconMapPin() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function IconPlane() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  )
}
function IconPackage() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
}
function IconImage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}
function IconEmpty() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function IconWhatsapp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}
function IconCheckCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function IconTruck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )
}
function IconUser() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function BrowseListingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [trips, setTrips] = useState<Trip[]>([])
  const [allTrips, setAllTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'arrival_soon'>('newest')
  const [countries, setCountries] = useState<string[]>([])
  const [userId, setUserId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; trip: Trip } | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      fetchTrips(user.id)
    }
    init()
  }, [])

  useEffect(() => {
    let filtered = [...allTrips]

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.trip_country?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.products.some(p => p.product_name?.toLowerCase().includes(q))
      )
    }

    if (filterCountry) {
      filtered = filtered.filter(t => t.trip_country === filterCountry)
    }

    if (sortBy === 'arrival_soon') {
      filtered.sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime())
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    setTrips(filtered)
  }, [search, filterCountry, sortBy, allTrips])

  async function fetchTrips(uid: string) {
    setLoading(true)

    const { data: tripsData } = await supabase
      .from('trips')
      .select('id, jastiper_id, title, description, trip_country, arrival_date, arrival_city, image_url, status, created_at')
      .eq('status', 'open')
      .neq('jastiper_id', uid)
      .order('created_at', { ascending: false })

    if (!tripsData || tripsData.length === 0) { setTrips([]); setAllTrips([]); setLoading(false); return }

    const jastiperIds = [...new Set(tripsData.map((t: any) => t.jastiper_id).filter(Boolean))]
    let userMap: Record<string, { full_name: string; avatar_url: string | null }> = {}
    let waMap: Record<string, string | null> = {}

    if (jastiperIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', jastiperIds)
      ;(usersData ?? []).forEach((u: any) => { userMap[u.id] = { full_name: u.full_name, avatar_url: u.avatar_url } })

      const { data: jpData } = await supabase
        .from('jastiper_profiles')
        .select('user_id, whatsapp_number')
        .in('user_id', jastiperIds)
      ;(jpData ?? []).forEach((jp: any) => { waMap[jp.user_id] = jp.whatsapp_number })
    }

    const tripIds = tripsData.map((t: any) => t.id)
    const { data: productsData } = await supabase
      .from('listings')
      .select('id, trip_id, product_name, product_url, image_url, description, product_price_idr, service_fee_idr, shipping_fee_idr, total_price_idr, stock, status')
      .in('trip_id', tripIds)
      .eq('status', 'open')

    const productsMap: Record<string, Product[]> = {}
    ;(productsData ?? []).forEach((p: any) => {
      if (p.stock <= 0) return
      if (!productsMap[p.trip_id]) productsMap[p.trip_id] = []
      productsMap[p.trip_id].push(p)
    })

    const mapped = tripsData
      .map((t: any) => ({
        ...t,
        jastiper: userMap[t.jastiper_id] ? {
          full_name: userMap[t.jastiper_id].full_name,
          avatar_url: userMap[t.jastiper_id].avatar_url,
          whatsapp_number: waMap[t.jastiper_id] ?? null,
        } : null,
        products: productsMap[t.id] ?? [],
      }))
      .filter((t: any) => t.products.length > 0)

    const uniqueCountries = [...new Set(mapped.map((t: any) => t.trip_country).filter(Boolean))]
    setCountries(uniqueCountries as string[])
    setAllTrips(mapped)
    setTrips(mapped)
    setLoading(false)
  }

  async function handleOrder() {
    if (!selectedProduct || !userId) return
    if (!buyerCity.trim()) { setOrderError('Kota pengiriman wajib diisi'); return }
    if (!shippingAddress.trim()) { setOrderError('Alamat pengiriman wajib diisi'); return }
    if (quantity < 1) { setOrderError('Jumlah minimal 1'); return }

    const { product, trip } = selectedProduct

    if (quantity > (product.stock ?? 1)) { setOrderError(`Stok tidak cukup, tersisa ${product.stock}`); return }
    setOrderLoading(true)
    setOrderError('')

    const isSameCity = buyerCity.trim().toLowerCase() === (trip.arrival_city ?? '').toLowerCase()
    const domesticShipping = isSameCity ? 25000 : 50000

    const platformFee = Math.round(product.total_price_idr * quantity * 0.05)
    const total = (product.total_price_idr * quantity) + platformFee + domesticShipping

    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        jastiper_id: trip.jastiper_id,
        listing_id: product.id,
        flow_type: 'flow_b',
        product_url: product.product_url,
        product_name: product.product_name,
        quantity: quantity,
        delivery_pref: 'courier',
        shipping_address: `${shippingAddress}, ${buyerCity}`,
        status: 'waiting_payment',
      })
      .select('id')
      .single()

    if (orderErr) { setOrderError('Gagal membuat order: ' + orderErr.message); setOrderLoading(false); return }

    const { data: latestListing } = await supabase
      .from('listings')
      .select('stock')
      .eq('id', product.id)
      .single()

    if (latestListing) {
      await supabase
        .from('listings')
        .update({ stock: Math.max(0, latestListing.stock - quantity) })
        .eq('id', product.id)
    }

    await supabase.from('order_pricing').insert({
      order_id: orderData.id,
      product_price_idr: product.product_price_idr * quantity,
      service_fee_idr: product.service_fee_idr * quantity,
      shipping_fee_idr: product.shipping_fee_idr * quantity + domesticShipping,
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
    setSelectedProduct(null)
    setBuyerCity('')
    setShippingAddress('')
    setQuantity(1)
    setOrderLoading(false)
  }

  return (
    // ✅ FIX: w-full menggantikan max-w-2xl
    <div className="w-full">

      {/* Modal order — ✅ FIX: muncul dari bawah di mobile (sheet), centered di sm */}
      {selectedProduct && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 w-full sm:max-w-md shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-gray-900">Konfirmasi Order</h2>
              <button
                onClick={() => { setSelectedProduct(null); setOrderError('') }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">

              {/* Product info */}
              <div className="flex gap-3">
                {selectedProduct.product.image_url ? (
                  <img src={selectedProduct.product.image_url} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <IconImage />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm line-clamp-2">{selectedProduct.product.product_name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedProduct.trip.title}</p>
                  <p className="text-xs text-gray-500">{selectedProduct.trip.trip_country} · Tiba {formatDate(selectedProduct.trip.arrival_date)}</p>
                </div>
              </div>

              {/* Jastiper */}
              {selectedProduct.trip.jastiper && (
                <div className="flex items-center gap-2">
                  {selectedProduct.trip.jastiper.avatar_url ? (
                    <img src={selectedProduct.trip.jastiper.avatar_url} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#e6f7f3] flex items-center justify-center text-xs font-medium text-[#49BC9E] uppercase">
                      {selectedProduct.trip.jastiper.full_name?.[0] ?? '?'}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">{selectedProduct.trip.jastiper.full_name}</p>
                </div>
              )}

              {/* Quantity input */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Jumlah <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-medium transition-colors"
                  >-</button>
                  <span className="text-sm font-semibold text-gray-900 w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(selectedProduct.product.stock ?? 1, q + 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-medium transition-colors"
                  >+</button>
                  <span className="text-xs text-gray-400">Stok: {selectedProduct.product.stock}</span>
                </div>
              </div>

              {/* Input kota & alamat */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Kota pengiriman <span className="text-red-400">*</span>
                  </label>
                  <input
                    placeholder="Contoh: Malang, Surabaya, Jakarta"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#49BC9E] transition-colors text-gray-900"
                    value={buyerCity}
                    onChange={e => setBuyerCity(e.target.value)}
                  />
                  {buyerCity && selectedProduct.trip.arrival_city && (
                    <p className="text-xs mt-1 font-medium">
                      {buyerCity.trim().toLowerCase() === selectedProduct.trip.arrival_city.toLowerCase()
                        ? (
                          <span className="text-[#2d9b7f] flex items-center gap-1">
                            <IconCheckCircle /> Sekota — ongkir Rp 25.000
                          </span>
                        ) : (
                          <span className="text-orange-500 flex items-center gap-1">
                            <IconTruck /> Beda kota ({selectedProduct.trip.arrival_city}) — ongkir Rp 50.000
                          </span>
                        )
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
                    placeholder="Jl. Contoh No. 123, Kecamatan, Kota"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#49BC9E] transition-colors text-gray-900 resize-none"
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Rincian harga */}
              {(() => {
                const isSameCity = buyerCity.trim().toLowerCase() === (selectedProduct.trip.arrival_city ?? '').toLowerCase()
                const domesticShipping = buyerCity ? (isSameCity ? 25000 : 50000) : 0
                const platformFee = Math.round(selectedProduct.product.total_price_idr * quantity * 0.05)
                const total = (selectedProduct.product.total_price_idr * quantity) + platformFee + domesticShipping
                return (
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Harga produk {quantity > 1 ? `(x${quantity})` : ''}</span>
                      <span>{formatRupiah(selectedProduct.product.product_price_idr * quantity)}</span>
                    </div>
                    {selectedProduct.product.service_fee_idr > 0 && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Service fee</span>
                        <span>{formatRupiah(selectedProduct.product.service_fee_idr)}</span>
                      </div>
                    )}
                    {selectedProduct.product.shipping_fee_idr > 0 && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Ongkir luar negeri</span>
                        <span>{formatRupiah(selectedProduct.product.shipping_fee_idr)}</span>
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
                      <p className="text-xs text-gray-400 italic">*Isi kota untuk melihat total dengan ongkir domestik</p>
                    )}
                  </div>
                )
              })()}

              {orderError && <p className="text-red-500 text-sm">{orderError}</p>}

              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => { setSelectedProduct(null); setOrderError('') }}
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

      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Jelajahi Produk</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Temukan produk yang telah disediakan oleh jastiper di seluruh negeri!</p>
      </div>

      {/* Success toast */}
      {orderSuccess && (
        <div className="mb-4 bg-[#e6f7f3] border border-[#b3e8d9] rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-[#2d9b7f] font-medium">{orderSuccess}</p>
          <button
            onClick={() => { setOrderSuccess(''); router.push('/orders') }}
            className="text-[#49BC9E] ml-4 text-xs underline shrink-0"
          >
            Lihat pesanan →
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <IconSearch />
        </span>
        <input
          type="text"
          placeholder="Cari produk, negara, atau jastiper..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#49BC9E] transition-colors bg-white text-gray-900"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <IconX size={14} />
          </button>
        )}
      </div>

      {/* Filters — ✅ FIX: scroll horizontal di mobile agar tidak wrap */}
      <div className="flex gap-2 mb-5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        <div className="relative shrink-0">
          <select
            value={filterCountry}
            onChange={e => setFilterCountry(e.target.value)}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white text-gray-700 outline-none focus:border-[#49BC9E] transition-colors cursor-pointer"
          >
            <option value="">Semua negara</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <IconChevronDown />
          </span>
        </div>
        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white text-gray-700 outline-none focus:border-[#49BC9E] transition-colors cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="arrival_soon">Tiba paling cepat</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <IconChevronDown />
          </span>
        </div>
        <div className="flex items-center ml-auto shrink-0">
          <p className="text-xs text-gray-500 whitespace-nowrap">{trips.length} trip tersedia</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#49BC9E] rounded-full animate-spin"></div>
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <IconEmpty />
          </div>
          <p className="text-sm text-gray-500">Tidak ada trip yang tersedia</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {trips.map(trip => {
            const dl = daysLeft(trip.arrival_date)
            return (
              <div key={trip.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

                {/* Trip cover image */}
                {trip.image_url && (
                  <img src={trip.image_url} className="w-full h-36 sm:h-52 object-cover" alt={trip.title} />
                )}

                {/* Trip header */}
                <div className="p-4 sm:p-5 border-b border-gray-100">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{trip.title}</h2>

                  {/* Stats grid — ✅ FIX: lebih compact di mobile */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <IconMapPin />
                        <span className="text-[10px] sm:text-xs">Negara</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{trip.trip_country}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <IconPlane />
                        <span className="text-[10px] sm:text-xs hidden xs:inline">Tiba</span>
                      </div>
                      <p className={`text-[11px] sm:text-sm font-semibold leading-tight ${dl.urgent ? 'text-orange-500' : 'text-gray-900'}`}>
                        {formatDate(trip.arrival_date)}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <IconPackage />
                        <span className="text-[10px] sm:text-xs">Produk</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">{trip.products.length} item</p>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  {trip.description && (
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs text-gray-400 mb-1">Deskripsi</p>
                      <p className="text-xs sm:text-sm text-gray-700 line-clamp-3 sm:line-clamp-none">{trip.description}</p>
                    </div>
                  )}

                  {/* Jastiper */}
                  {trip.jastiper && (
                    <div className="flex items-center gap-2 pt-3 sm:pt-4 border-t border-gray-100">
                      <span className="text-gray-400 shrink-0">
                        <IconUser />
                      </span>
                      {trip.jastiper.avatar_url ? (
                        <img src={trip.jastiper.avatar_url} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#e6f7f3] flex items-center justify-center text-xs font-medium text-[#49BC9E] uppercase shrink-0">
                          {trip.jastiper.full_name?.[0] ?? '?'}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 flex-1 truncate">{trip.jastiper.full_name}</p>
                      {trip.jastiper.whatsapp_number && (
                        <a
                          href={`https://wa.me/${trip.jastiper.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors shrink-0"
                        >
                          <IconWhatsapp />
                          WA
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Products */}
                <div className="divide-y divide-gray-100">
                  {trip.products.map(product => (
                    <div key={product.id} className="flex gap-2 sm:gap-3 p-3 sm:p-4">
                      {product.image_url ? (
                        <img src={product.image_url} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <IconImage />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">{product.product_name}</p>
                        <button
                          onClick={() => router.push(`/trips/${trip.id}/products/${product.id}`)}
                          className="text-[11px] text-[#49BC9E] hover:text-[#3da88d] hover:underline text-left transition-colors"
                        >
                          Lihat detail →
                        </button>
                        {product.description && (
                          <p className="text-[11px] text-gray-400 italic mt-0.5 line-clamp-1">{product.description}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-0.5">Stok: {product.stock}</p>
                      </div>
                      {/* ✅ FIX: kolom harga+tombol lebih rapat di mobile */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 text-right">{formatRupiah(product.total_price_idr)}</p>
                        <p className="text-[10px] text-gray-400">+5% fee</p>
                        <button
                          onClick={() => { setSelectedProduct({ product, trip }); setOrderError('') }}
                          className="bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors"
                        >
                          Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}