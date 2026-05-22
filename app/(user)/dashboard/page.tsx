'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── TYPES ──
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
  jastiper: { full_name: string; avatar_url: string | null; whatsapp_number: string | null } | null
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
type Request = {
  id: string
  buyer_id: string
  product_name: string
  product_url: string
  quantity: number
  max_budget_idr: number
  deadline: string
  delivery_pref: 'courier' | 'meetup'
  shipping_address: string | null
  meetup_location: string | null
  meetup_time: string | null
  notes: string | null
  created_at: string
  users: { full_name: string; avatar_url: string | null }
}

// ── UTILS ──
function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}
function formatRupiahPlain(n: number) { return new Intl.NumberFormat('id-ID').format(n) }
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
function daysLeftTrip(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  const days = Math.ceil(diff / 1000 / 60 / 60 / 24)
  if (days < 0) return { label: 'Sudah tiba', urgent: false }
  if (days === 0) return { label: 'Tiba hari ini', urgent: true }
  if (days <= 3) return { label: `${days} hari lagi`, urgent: true }
  return { label: `${days} hari lagi`, urgent: false }
}
function daysLeftReq(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  const days = Math.ceil(diff / 1000 / 60 / 60 / 24)
  if (days < 0) return { label: 'Kadaluarsa', urgent: true }
  if (days === 0) return { label: 'Hari ini', urgent: true }
  return { label: `${days} hari lagi`, urgent: days <= 3 }
}

// ── ICONS ──
function IconSearch() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function IconX({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function IconChevronDown() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
}
function IconMapPin() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function IconPlane() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
}
function IconPackage() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
}
function IconImage() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
}
function IconWhatsapp() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
}
function IconCheckCircle() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
}
function IconTruck() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
}
function IconUser() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function IconInfo({ size = 14, className = '' }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
}
function IconCheckCircleLg() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}
function IconAlertTriangle() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}

// ══════════════════════════════════════════
// BUYER VIEW — Browse Listings
// ══════════════════════════════════════════
function BuyerView({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [trips, setTrips] = useState<Trip[]>([])
  const [allTrips, setAllTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'arrival_soon'>('newest')
  const [countries, setCountries] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; trip: Trip } | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => { fetchTrips() }, [])

  useEffect(() => {
    let filtered = [...allTrips]
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(q) || t.trip_country?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) || t.products.some(p => p.product_name?.toLowerCase().includes(q))
      )
    }
    if (filterCountry) filtered = filtered.filter(t => t.trip_country === filterCountry)
    if (sortBy === 'arrival_soon') filtered.sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime())
    else filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setTrips(filtered)
  }, [search, filterCountry, sortBy, allTrips])

  async function fetchTrips() {
    setLoading(true)
    const { data: tripsData } = await supabase.from('trips').select('id, jastiper_id, title, description, trip_country, arrival_date, arrival_city, image_url, status, created_at').eq('status', 'open').neq('jastiper_id', userId).order('created_at', { ascending: false })
    if (!tripsData || tripsData.length === 0) { setTrips([]); setAllTrips([]); setLoading(false); return }
    const jastiperIds = [...new Set(tripsData.map((t: any) => t.jastiper_id).filter(Boolean))]
    let userMap: Record<string, any> = {}
    let waMap: Record<string, string | null> = {}
    if (jastiperIds.length > 0) {
      const { data: usersData } = await supabase.from('users').select('id, full_name, avatar_url').in('id', jastiperIds)
      ;(usersData ?? []).forEach((u: any) => { userMap[u.id] = u })
      const { data: jpData } = await supabase.from('jastiper_profiles').select('user_id, whatsapp_number').in('user_id', jastiperIds)
      ;(jpData ?? []).forEach((jp: any) => { waMap[jp.user_id] = jp.whatsapp_number })
    }
    const tripIds = tripsData.map((t: any) => t.id)
    const { data: productsData } = await supabase.from('listings').select('id, trip_id, product_name, product_url, image_url, description, product_price_idr, service_fee_idr, shipping_fee_idr, total_price_idr, stock, status').in('trip_id', tripIds).eq('status', 'open')
    const productsMap: Record<string, Product[]> = {}
    ;(productsData ?? []).forEach((p: any) => {
      if (p.stock <= 0) return
      if (!productsMap[p.trip_id]) productsMap[p.trip_id] = []
      productsMap[p.trip_id].push(p)
    })
    const mapped = tripsData.map((t: any) => ({
      ...t,
      jastiper: userMap[t.jastiper_id] ? { full_name: userMap[t.jastiper_id].full_name, avatar_url: userMap[t.jastiper_id].avatar_url, whatsapp_number: waMap[t.jastiper_id] ?? null } : null,
      products: productsMap[t.id] ?? [],
    })).filter((t: any) => t.products.length > 0)
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
    setOrderLoading(true); setOrderError('')
    const isSameCity = buyerCity.trim().toLowerCase() === (trip.arrival_city ?? '').toLowerCase()
    const domesticShipping = isSameCity ? 25000 : 50000
    const platformFee = Math.round(product.total_price_idr * quantity * 0.05)
    const total = (product.total_price_idr * quantity) + platformFee + domesticShipping
    const { data: orderData, error: orderErr } = await supabase.from('orders').insert({ buyer_id: userId, jastiper_id: trip.jastiper_id, listing_id: product.id, flow_type: 'flow_b', product_url: product.product_url, product_name: product.product_name, quantity, delivery_pref: 'courier', shipping_address: `${shippingAddress}, ${buyerCity}`, status: 'waiting_payment' }).select('id').single()
    if (orderErr) { setOrderError('Gagal membuat order: ' + orderErr.message); setOrderLoading(false); return }
    const { data: latestListing } = await supabase.from('listings').select('stock').eq('id', product.id).single()
    if (latestListing) await supabase.from('listings').update({ stock: Math.max(0, latestListing.stock - quantity) }).eq('id', product.id)
    await supabase.from('order_pricing').insert({ order_id: orderData.id, product_price_idr: product.product_price_idr * quantity, service_fee_idr: product.service_fee_idr * quantity, shipping_fee_idr: product.shipping_fee_idr * quantity + domesticShipping, platform_fee_idr: platformFee, estimated_customs_idr: 0, total_idr: total })
    await supabase.from('escrow_transactions').insert({ order_id: orderData.id, amount_idr: total, status: 'held' })
    setOrderSuccess(`Order berhasil! Total: ${formatRupiah(total)}`)
    setSelectedProduct(null); setBuyerCity(''); setShippingAddress(''); setQuantity(1); setOrderLoading(false)
  }

  return (
    <div className="w-full">
      {selectedProduct && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 w-full sm:max-w-md shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-sm font-bold text-gray-900">Konfirmasi Order</h2>
              <button onClick={() => { setSelectedProduct(null); setOrderError('') }} className="text-gray-400 hover:text-gray-600"><IconX size={18} /></button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="flex gap-3">
                {selectedProduct.product.image_url ? <img src={selectedProduct.product.image_url} className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><IconImage /></div>}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm line-clamp-2">{selectedProduct.product.product_name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedProduct.trip.title}</p>
                  <p className="text-xs text-gray-500">{selectedProduct.trip.trip_country} · Tiba {formatDate(selectedProduct.trip.arrival_date)}</p>
                </div>
              </div>
              {selectedProduct.trip.jastiper && (
                <div className="flex items-center gap-2">
                  {selectedProduct.trip.jastiper.avatar_url ? <img src={selectedProduct.trip.jastiper.avatar_url} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-[#e6f7f3] flex items-center justify-center text-xs font-medium text-[#49BC9E] uppercase">{selectedProduct.trip.jastiper.full_name?.[0] ?? '?'}</div>}
                  <p className="text-xs text-gray-600">{selectedProduct.trip.jastiper.full_name}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Jumlah <span className="text-red-400">*</span></label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-medium">-</button>
                  <span className="text-sm font-semibold text-gray-900 w-6 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(selectedProduct.product.stock ?? 1, q + 1))} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-medium">+</button>
                  <span className="text-xs text-gray-400">Stok: {selectedProduct.product.stock}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Kota pengiriman <span className="text-red-400">*</span></label>
                  <input placeholder="Contoh: Malang, Surabaya, Jakarta" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#49BC9E] text-gray-900" value={buyerCity} onChange={e => setBuyerCity(e.target.value)} />
                  {buyerCity && selectedProduct.trip.arrival_city && (
                    <p className="text-xs mt-1 font-medium">
                      {buyerCity.trim().toLowerCase() === selectedProduct.trip.arrival_city.toLowerCase()
                        ? <span className="text-[#2d9b7f] flex items-center gap-1"><IconCheckCircle /> Sekota — ongkir Rp 25.000</span>
                        : <span className="text-orange-500 flex items-center gap-1"><IconTruck /> Beda kota ({selectedProduct.trip.arrival_city}) — ongkir Rp 50.000</span>}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Alamat lengkap <span className="text-red-400">*</span></label>
                  <textarea rows={2} placeholder="Jl. Contoh No. 123, Kecamatan, Kota" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#49BC9E] text-gray-900 resize-none" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
                </div>
              </div>
              {(() => {
                const isSameCity = buyerCity.trim().toLowerCase() === (selectedProduct.trip.arrival_city ?? '').toLowerCase()
                const domesticShipping = buyerCity ? (isSameCity ? 25000 : 50000) : 0
                const platformFee = Math.round(selectedProduct.product.total_price_idr * quantity * 0.05)
                const total = (selectedProduct.product.total_price_idr * quantity) + platformFee + domesticShipping
                return (
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500"><span>Harga produk {quantity > 1 ? `(x${quantity})` : ''}</span><span>{formatRupiah(selectedProduct.product.product_price_idr * quantity)}</span></div>
                    {selectedProduct.product.service_fee_idr > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Service fee</span><span>{formatRupiah(selectedProduct.product.service_fee_idr)}</span></div>}
                    {selectedProduct.product.shipping_fee_idr > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Ongkir luar negeri</span><span>{formatRupiah(selectedProduct.product.shipping_fee_idr)}</span></div>}
                    {buyerCity && <div className="flex justify-between text-xs text-gray-500"><span>Ongkir domestik {isSameCity ? '(sekota)' : '(beda kota)'}</span><span>{formatRupiah(domesticShipping)}</span></div>}
                    <div className="flex justify-between text-xs text-gray-500"><span>Platform fee (5%)</span><span>{formatRupiah(platformFee)}</span></div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200"><span>Total</span><span>{formatRupiah(total)}</span></div>
                    {!buyerCity && <p className="text-xs text-gray-400 italic">*Isi kota untuk melihat total dengan ongkir domestik</p>}
                  </div>
                )
              })()}
              {orderError && <p className="text-red-500 text-xs">{orderError}</p>}
              <div className="flex gap-2 pb-1">
                <button onClick={() => { setSelectedProduct(null); setOrderError('') }} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Batal</button>
                <button onClick={handleOrder} disabled={orderLoading} className="flex-1 bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">{orderLoading ? 'Memproses...' : 'Order Sekarang'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Jelajahi Produk</h1>
        <p className="text-xs text-gray-500 mt-0.5">Temukan produk yang telah disediakan oleh jastiper di seluruh negeri!</p>
      </div>

      {orderSuccess && (
        <div className="mb-4 bg-[#e6f7f3] border border-[#b3e8d9] rounded-xl px-3 py-2.5 flex items-center justify-between">
          <p className="text-xs text-[#2d9b7f] font-medium">{orderSuccess}</p>
          <button onClick={() => { setOrderSuccess(''); router.push('/orders') }} className="text-[#49BC9E] ml-3 text-xs underline shrink-0">Lihat pesanan →</button>
        </div>
      )}

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
        <input type="text" placeholder="Cari produk, negara, atau jastiper..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#49BC9E] bg-white text-gray-900" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><IconX size={13} /></button>}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <div className="relative shrink-0">
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="appearance-none text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-2 bg-white text-gray-700 outline-none focus:border-[#49BC9E] cursor-pointer">
            <option value="">Semua negara</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><IconChevronDown /></span>
        </div>
        <div className="relative shrink-0">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="appearance-none text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-2 bg-white text-gray-700 outline-none focus:border-[#49BC9E] cursor-pointer">
            <option value="newest">Terbaru</option>
            <option value="arrival_soon">Tiba paling cepat</option>
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><IconChevronDown /></span>
        </div>
        <div className="flex items-center ml-auto shrink-0">
          <p className="text-xs text-gray-500 whitespace-nowrap">{trips.length} trip</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-200 border-t-[#49BC9E] rounded-full animate-spin"></div></div>
      ) : trips.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
          <p className="text-sm text-gray-500">Tidak ada trip yang tersedia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => {
            const dl = daysLeftTrip(trip.arrival_date)
            return (
              <div key={trip.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {trip.image_url && <img src={trip.image_url} className="w-full h-36 sm:h-48 object-cover" alt={trip.title} />}
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 mb-3">{trip.title}</h2>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <div className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                      <div className="flex items-center gap-1 text-gray-400 mb-0.5"><IconMapPin /><span className="text-[10px]">Negara</span></div>
                      <p className="text-xs font-semibold text-gray-900 truncate">{trip.trip_country}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                      <div className="flex items-center gap-1 text-gray-400 mb-0.5"><IconPlane /><span className="text-[10px]">Tiba</span></div>
                      <p className={`text-xs font-semibold leading-tight ${dl.urgent ? 'text-orange-500' : 'text-gray-900'}`}>{formatDate(trip.arrival_date)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                      <div className="flex items-center gap-1 text-gray-400 mb-0.5"><IconPackage /><span className="text-[10px]">Produk</span></div>
                      <p className="text-xs font-semibold text-gray-900">{trip.products.length} item</p>
                    </div>
                  </div>
                  {trip.description && <div className="mb-3"><p className="text-[10px] text-gray-400 mb-0.5">Deskripsi</p><p className="text-xs text-gray-700 line-clamp-2">{trip.description}</p></div>}
                  {trip.jastiper && (
                    <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                      <span className="text-gray-400 shrink-0"><IconUser /></span>
                      {trip.jastiper.avatar_url ? <img src={trip.jastiper.avatar_url} className="w-5 h-5 rounded-full object-cover shrink-0" /> : <div className="w-5 h-5 rounded-full bg-[#e6f7f3] flex items-center justify-center text-[10px] font-medium text-[#49BC9E] uppercase shrink-0">{trip.jastiper.full_name?.[0] ?? '?'}</div>}
                      <p className="text-xs text-gray-600 flex-1 truncate">{trip.jastiper.full_name}</p>
                      {trip.jastiper.whatsapp_number && (
                        <a href={`https://wa.me/${trip.jastiper.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-md px-2 py-1 text-[10px] font-medium shrink-0">
                          <IconWhatsapp /> WA
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {trip.products.map(product => (
                    <div key={product.id} className="flex gap-2.5 p-3">
                      {product.image_url ? <img src={product.image_url} className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><IconImage /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug">{product.product_name}</p>
                        <button onClick={() => router.push(`/trips/${trip.id}/products/${product.id}`)} className="text-[10px] text-[#49BC9E] hover:underline text-left">Lihat detail →</button>
                        {product.description && <p className="text-[10px] text-gray-400 italic mt-0.5 line-clamp-1">{product.description}</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">Stok: {product.stock}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-xs font-bold text-gray-900 text-right leading-snug">{formatRupiah(product.total_price_idr)}</p>
                        <p className="text-[10px] text-gray-400">+5% fee</p>
                        <button onClick={() => { setSelectedProduct({ product, trip }); setOrderError('') }} className="bg-[#49BC9E] hover:bg-[#3da88d] text-white rounded-lg px-2.5 py-1 text-[10px] font-medium">Order</button>
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

// ══════════════════════════════════════════
// JASTIPER VIEW — Browse Requests
// ══════════════════════════════════════════
function JastiperView({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [requests, setRequests] = useState<Request[]>([])
  const [allRequests, setAllRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Request | null>(null)
  const [fixedPrice, setFixedPrice] = useState('')
  const [takingLoading, setTakingLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'courier' | 'meetup'>('all')
  const [filterDeadline, setFilterDeadline] = useState<'all' | 'urgent' | 'week'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'budget_high' | 'deadline_soon'>('newest')
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showValidationPopup, setShowValidationPopup] = useState(false)

  useEffect(() => {
    let filtered = [...allRequests]
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(r => r.product_name?.toLowerCase().includes(q) || r.product_url?.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q))
    }
    if (filterDelivery !== 'all') filtered = filtered.filter(r => r.delivery_pref === filterDelivery)
    if (filterDeadline === 'urgent') filtered = filtered.filter(r => Math.ceil((new Date(r.deadline).getTime() - Date.now()) / 1000 / 60 / 60 / 24) <= 3)
    else if (filterDeadline === 'week') filtered = filtered.filter(r => Math.ceil((new Date(r.deadline).getTime() - Date.now()) / 1000 / 60 / 60 / 24) <= 7)
    if (sortBy === 'budget_high') filtered.sort((a, b) => b.max_budget_idr - a.max_budget_idr)
    else if (sortBy === 'deadline_soon') filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    else filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setRequests(filtered)
  }, [search, filterDelivery, filterDeadline, sortBy, allRequests])

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    setLoading(true)
    const { data } = await supabase.from('requests').select('id, buyer_id, product_name, product_url, quantity, max_budget_idr, deadline, delivery_pref, shipping_address, meetup_location, meetup_time, notes, created_at, users!requests_buyer_id_fkey(full_name, avatar_url)').eq('status', 'open').order('created_at', { ascending: false })
    setAllRequests((data as any) ?? [])
    setRequests((data as any) ?? [])
    setLoading(false)
  }

  async function handleTakeRequest() {
    if (!fixedPrice) { setError('Harga fix wajib diisi'); return }
    const price = parseFloat(fixedPrice.replace(/\./g, '').replace(/,/g, ''))
    if (isNaN(price) || price <= 0) { setError('Harga tidak valid'); return }
    if (price > selected!.max_budget_idr) { setError(`Harga fix tidak boleh melebihi max budget buyer (${formatRupiah(selected!.max_budget_idr)})`); return }
    setTakingLoading(true); setError('')
    const paymentExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error: reqError } = await supabase.from('requests').update({ jastiper_id: userId, fixed_price_idr: price, status: 'matched', payment_expired_at: paymentExpiredAt }).eq('id', selected!.id)
    if (reqError) { setError('Gagal mengambil request: ' + reqError.message); setTakingLoading(false); return }
    const orderPayload: any = { buyer_id: selected!.buyer_id, jastiper_id: userId, request_id: selected!.id, flow_type: 'flow_a', product_url: selected!.product_url, product_name: selected!.product_name, quantity: selected!.quantity, delivery_pref: selected!.delivery_pref, notes: selected!.notes, status: 'waiting_payment' }
    if (selected!.delivery_pref === 'courier') orderPayload.shipping_address = selected!.shipping_address
    else { orderPayload.meetup_location = selected!.meetup_location; orderPayload.meetup_time = selected!.meetup_time }
    const { data: orderData, error: orderError } = await supabase.from('orders').insert(orderPayload).select('id').single()
    if (orderError) { setError('Gagal membuat order: ' + orderError.message); setTakingLoading(false); return }
    const platformFee = Math.round(price * 0.05)
    await supabase.from('order_pricing').insert({ order_id: orderData.id, product_price_idr: price, service_fee_idr: 0, shipping_fee_idr: 0, platform_fee_idr: platformFee, estimated_customs_idr: 0, total_idr: price + platformFee })
    await supabase.from('escrow_transactions').insert({ order_id: orderData.id, amount_idr: price + platformFee, status: 'held' })
    setSuccess(`Request berhasil diambil! Tagihan sebesar ${formatRupiah(price + platformFee)} sudah dikirim ke buyer.`)
    setSelected(null); setFixedPrice(''); setTakingLoading(false); setShowSuccessPopup(true); fetchRequests()
  }

  const numericDealPrice = Number(fixedPrice.replace(/\./g, '').replace(/,/g, '')) || 0
  const platformFee = Math.round(numericDealPrice * 0.05)
  const totalInvoice = numericDealPrice + platformFee

  return (
    <main className="min-h-screen">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold text-[#1E293B]">Jelajah Permintaan</h1>
        <p className="mt-0.5 text-xs text-[#64748B]">Temukan permintaan titip yang bisa kamu ambil</p>
      </div>

      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconSearch /></span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama produk, URL, atau catatan..." className="w-full h-10 rounded-xl border border-[#CBD5E1] bg-white pl-9 pr-4 text-sm text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#59D3B4]" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><IconX size={14} /></button>}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <select value={filterDelivery} onChange={e => setFilterDelivery(e.target.value as any)} className="text-xs border border-[#CBD5E1] rounded-lg px-3 py-2 bg-white text-[#475569] outline-none focus:border-[#59D3B4] shrink-0">
          <option value="all">Semua pengiriman</option><option value="courier">Courier</option><option value="meetup">Meetup</option>
        </select>
        <select value={filterDeadline} onChange={e => setFilterDeadline(e.target.value as any)} className="text-xs border border-[#CBD5E1] rounded-lg px-3 py-2 bg-white text-[#475569] outline-none focus:border-[#59D3B4] shrink-0">
          <option value="all">Semua deadline</option><option value="urgent">Urgent (≤ 3 hari)</option><option value="week">Minggu ini</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-xs border border-[#CBD5E1] rounded-lg px-3 py-2 bg-white text-[#475569] outline-none focus:border-[#59D3B4] shrink-0">
          <option value="newest">Terbaru</option><option value="budget_high">Budget tertinggi</option><option value="deadline_soon">Deadline terdekat</option>
        </select>
        <div className="flex items-center ml-auto shrink-0">
          <p className="text-xs text-[#64748B] whitespace-nowrap">{requests.length} request{requests.length !== allRequests.length ? ` dari ${allRequests.length}` : ''}</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <p className="text-xs text-green-700">{success}</p>
          <button onClick={() => setSuccess('')} className="text-green-500 ml-3 shrink-0"><IconX size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-200 border-t-[#59D3B4] rounded-full animate-spin"></div></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3"><IconSearch /></div>
          <p className="text-sm text-[#64748B]">Belum ada request yang tersedia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const dl = daysLeftReq(req.deadline)
            return (
              <div key={req.id} className="bg-white border border-[#CBD5E1] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {req.users?.avatar_url ? <img src={req.users.avatar_url} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-600 uppercase">{req.users?.full_name?.[0] ?? '?'}</div>}
                  <p className="text-xs text-[#64748B]">{req.users?.full_name}</p>
                  <span className="text-[#CBD5E1]">·</span>
                  <p className="text-[10px] text-[#94A3B8]">{formatDate(req.created_at)}</p>
                </div>
                <h2 className="text-sm font-bold text-[#0F172A] mb-1">{req.product_name}</h2>
                <a href={req.product_url} target="_blank" rel="noopener noreferrer" className="inline-block text-[#64748B] text-[10px] break-all hover:underline mb-3">{req.product_url}</a>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5"><p className="text-[10px] text-[#94A3B8] font-medium">Batas Waktu</p><h3 className={`mt-0.5 text-xs font-bold ${dl.urgent ? 'text-red-500' : 'text-[#1E293B]'}`}>{formatDate(req.deadline)}{dl.urgent && <span className="text-[10px] font-normal ml-1">({dl.label})</span>}</h3></div>
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5"><p className="text-[10px] text-[#94A3B8] font-medium">Metode Pengiriman</p><h3 className="mt-0.5 text-xs font-bold text-[#1E293B]">{req.delivery_pref === 'courier' ? 'Kirim Paket' : 'Meetup'}</h3></div>
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5"><p className="text-[10px] text-[#94A3B8] font-medium">Maks. Budget</p><h3 className="mt-0.5 text-xs font-bold text-[#1E293B]">Rp {formatRupiahPlain(req.max_budget_idr)}</h3></div>
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5"><p className="text-[10px] text-[#94A3B8] font-medium">Jumlah</p><h3 className="mt-0.5 text-xs font-bold text-[#1E293B]">{req.quantity} Pcs</h3></div>
                </div>
                {req.delivery_pref === 'courier' && req.shipping_address && <div className="flex items-start gap-1.5 text-[10px] text-[#64748B] mb-3"><IconMapPin />{req.shipping_address}</div>}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
                  {req.notes ? <div><p className="text-xs font-bold text-[#0F172A]">Catatan:</p><p className="mt-1 text-xs text-[#64748B] leading-relaxed">{req.notes}</p></div> : <div />}
                  <button onClick={() => { setSelected(req); setFixedPrice(''); setError('') }} className="w-full sm:w-auto bg-[#49BC9E] hover:bg-[#1b977f] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm shadow-teal-200 shrink-0">Ambil Permintaan</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-[560px] bg-white rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-sm font-bold text-[#0F172A]">Ambil Permintaan</h2>
              <button onClick={() => { setSelected(null); setFixedPrice(''); setError('') }}><IconX size={20} /></button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="border border-[#E2E8F0] rounded-xl px-3 py-2 bg-[#F8FAFC]"><p className="text-[10px] text-[#94A3B8] font-medium">Nama Barang</p><h3 className="mt-0.5 text-sm font-bold text-[#1E293B]">{selected.product_name}</h3></div>
              <div className="border border-[#E2E8F0] rounded-xl px-3 py-2 bg-[#F8FAFC]"><p className="text-[10px] text-[#94A3B8] font-medium">Batas Budget</p><h3 className="mt-0.5 text-sm font-bold text-[#1E293B]">Rp {formatRupiahPlain(selected.max_budget_idr)}</h3></div>
              <div>
                <label className="text-xs font-medium text-[#1E293B]">Masukkan harga deal (IDR)</label>
                <div className="mt-1.5 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">Rp</span>
                  <input type="text" value={fixedPrice} onChange={e => { const rawValue = e.target.value.replace(/\D/g, ''); setFixedPrice(rawValue ? Number(rawValue).toLocaleString('id-ID') : '') }} placeholder="Masukkan harga deal" className="w-full h-10 rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 text-sm text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#59D3B4]" />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[#64748B]"><IconInfo size={13} /><p className="text-xs">Harga tidak boleh melebihi budget pembeli</p></div>
              </div>
              {numericDealPrice > 0 && (
                <div className="border border-[#CBD5E1] rounded-xl p-3">
                  <h3 className="text-sm font-bold text-[#0F172A] mb-2">Ringkasan Harga</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3"><p className="text-xs text-[#64748B]">Harga (Produk & Fee Jastiper)</p><p className="text-xs font-medium text-[#1E293B]">Rp {formatRupiahPlain(numericDealPrice)}</p></div>
                    <div className="flex items-center justify-between gap-3"><p className="text-xs text-[#64748B]">Platform Fee (5%)</p><p className="text-xs font-medium text-[#1E293B]">Rp {formatRupiahPlain(platformFee)}</p></div>
                  </div>
                  <div className="border-t border-[#E2E8F0] mt-2 pt-2 flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-[#0F172A]">Total Tagihan</h3><h3 className="text-sm font-bold text-[#59D3B4]">IDR {formatRupiahPlain(totalInvoice)}</h3></div>
                </div>
              )}
              <div className="bg-[#EEF4FF] border border-[#D6E4FF] rounded-xl p-3 flex items-start gap-2.5">
                <IconInfo size={15} className="text-[#1D4ED8] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#1D4ED8] leading-relaxed">Tagihan akan otomatis dikirim ke pembeli setelah request diambil, dan pembayaran harus diselesaikan dalam 24 jam sebelum order dibatalkan otomatis.</p>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-2 pb-1">
                <button onClick={() => { setSelected(null); setFixedPrice(''); setError('') }} className="flex-1 h-10 rounded-xl border border-[#CBD5E1] text-[#64748B] text-sm font-medium hover:bg-gray-50">Kembali</button>
                <button onClick={() => { if (!numericDealPrice || numericDealPrice > selected.max_budget_idr) { setShowValidationPopup(true); return } handleTakeRequest() }} disabled={takingLoading} className="flex-1 h-10 rounded-xl bg-[#59D3B4] hover:bg-[#4CC2A5] text-white text-sm font-semibold disabled:opacity-50">{takingLoading ? 'Memproses...' : 'Ambil'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[300px] bg-white rounded-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto"><IconCheckCircleLg /></div>
            <h2 className="mt-3 text-base font-bold text-[#0F172A]">Permintaan Berhasil Diambil</h2>
            <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">Tagihan otomatis akan dikirim ke pembeli dan menunggu pembayaran.</p>
            <button onClick={() => setShowSuccessPopup(false)} className="mt-4 w-full h-10 rounded-xl bg-[#59D3B4] hover:bg-[#4CC2A5] text-white text-sm font-semibold">Oke</button>
          </div>
        </div>
      )}

      {showValidationPopup && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[300px] bg-white rounded-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto"><IconAlertTriangle /></div>
            <h2 className="mt-3 text-base font-bold text-[#0F172A]">Harga Deal Tidak Valid</h2>
            <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">Pastikan harga deal sudah diisi dan tidak melebihi budget pembeli.</p>
            <button onClick={() => setShowValidationPopup(false)} className="mt-4 w-full h-10 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-semibold">Mengerti</button>
          </div>
        </div>
      )}
    </main>
  )
}

// ══════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════
export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [activeRole, setActiveRole] = useState<'buyer' | 'jastiper' | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('users').select('active_role').eq('id', user.id).single()
      setActiveRole(data?.active_role ?? 'buyer')
    }
    init()
  }, [])

  if (!activeRole || !userId) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#49BC9E] rounded-full animate-spin"></div>
    </div>
  )

  if (activeRole === 'jastiper') return <JastiperView userId={userId} />
  return <BuyerView userId={userId} />
}