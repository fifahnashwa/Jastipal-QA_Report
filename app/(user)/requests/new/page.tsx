'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type DeliveryPref = 'courier' | 'meetup'

export default function NewRequestPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    product_url: '',
    product_name: '',
    quantity: 1,
    max_budget_idr: '',
    deadline: '',
    delivery_pref: 'courier' as DeliveryPref,
    shipping_address: '',
    meetup_location: '',
    meetup_time: '',
    notes: '',
  })

  function set(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.product_url || !form.product_name || !form.max_budget_idr || !form.deadline) {
      setError('Mohon lengkapi semua field yang wajib diisi')
      return
    }
    if (form.delivery_pref === 'courier' && !form.shipping_address) {
      setError('Alamat pengiriman wajib diisi untuk pilihan courier')
      return
    }
    if (form.delivery_pref === 'meetup' && (!form.meetup_location || !form.meetup_time)) {
      setError('Lokasi dan waktu meetup wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const payload: any = {
      buyer_id: user.id,
      product_url: form.product_url,
      product_name: form.product_name,
      quantity: form.quantity,
      max_budget_idr: parseFloat(form.max_budget_idr),
      deadline: form.deadline,
      delivery_pref: form.delivery_pref,
      notes: form.notes || null,
      status: 'open',
    }

    if (form.delivery_pref === 'courier') {
      payload.shipping_address = form.shipping_address
    } else {
      payload.meetup_location = form.meetup_location
      payload.meetup_time = new Date(form.meetup_time).toISOString()
    }

    const { error: insertError } = await supabase.from('requests').insert(payload)

    if (insertError) {
      setError('Gagal membuat request: ' + insertError.message)
      setLoading(false)
      return
    }

    router.push('/requests')
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Back + Title */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </button>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Buat Permintaan</h1>
        <p className="text-sm text-gray-500">Kasih tahu kami barang apa yang ingin kamu beli dari luar negeri.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">

        {/* Card: Detail Produk */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Detail Produk</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Link Produk</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-[#49BC9E] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <input
                type="url"
                placeholder="Tempel URL dari Amazon, Shopee JP, Olive Young, dll."
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
                value={form.product_url}
                onChange={e => set('product_url', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Kami akan mencoba mengambil detail produk secara otomatis.</p>
          </div>

          {/* Nama produk + jumlah — stack di mobile, row di desktop */}
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="w-full sm:flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Produk</label>
              <input
                placeholder="Contoh: Sony WH-1000XM5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#49BC9E] transition-colors"
                value={form.product_name}
                onChange={e => set('product_name', e.target.value)}
              />
            </div>
            <div className="w-full sm:w-36">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => set('quantity', Math.max(1, form.quantity - 1))}
                  className="px-4 sm:px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200"
                >
                  -
                </button>
                <span className="flex-1 text-center text-sm text-gray-900 py-2.5">{form.quantity}</span>
                <button
                  type="button"
                  onClick={() => set('quantity', form.quantity + 1)}
                  className="px-4 sm:px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors border-l border-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Budget & Tenggat Waktu */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Budget & Tenggat Waktu</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Maksimal Budget (IDR)</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-[#49BC9E] transition-colors">
              <span className="text-sm text-gray-400 font-medium flex-shrink-0">Rp</span>
              <input
                type="number"
                min={0}
                placeholder="Masukkan budget Anda"
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
                value={form.max_budget_idr}
                onChange={e => set('max_budget_idr', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
              <span className="flex-shrink-0 mt-0.5">ⓘ</span>
              Jastiper akan menyesuaikan harga akhir agar tetap dalam batas budget. Tagihan dikirim setelah request disetujui.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimasi Barang Diterima</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-[#49BC9E] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent min-w-0"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Tanggal terakhir barang harus tiba di kamu</p>
          </div>
        </div>

        {/* Card: Pengiriman */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Pengiriman</h2>

          <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pengiriman</label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => set('delivery_pref', 'courier')}
              className={`flex items-center justify-center sm:justify-start gap-2 border rounded-lg px-3 sm:px-4 py-3 transition-colors ${
                form.delivery_pref === 'courier'
                  ? 'border-[#49BC9E] bg-[#e6f7f3] text-[#49BC9E]'
                  : 'border-gray-200 text-gray-700 hover:border-[#49BC9E]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
              <span className="text-sm">Kirim Paket</span>
            </button>
            <button
              type="button"
              onClick={() => set('delivery_pref', 'meetup')}
              className={`flex items-center justify-center sm:justify-start gap-2 border rounded-lg px-3 sm:px-4 py-3 transition-colors ${
                form.delivery_pref === 'meetup'
                  ? 'border-[#49BC9E] bg-[#e6f7f3] text-[#49BC9E]'
                  : 'border-gray-200 text-gray-700 hover:border-[#49BC9E]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Meetup</span>
            </button>
          </div>

          {form.delivery_pref === 'courier' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alamat pengiriman <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Jl. Merdeka No. 12, Kel. Kauman, Kec. Klojen, Malang, Jawa Timur 65119"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#49BC9E] transition-colors resize-none"
                value={form.shipping_address}
                onChange={e => set('shipping_address', e.target.value)}
              />
            </div>
          )}

          {form.delivery_pref === 'meetup' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lokasi meetup <span className="text-red-400">*</span>
                </label>
                <input
                  placeholder="Contoh: Mall Olympic Garden, Malang"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#49BC9E] transition-colors"
                  value={form.meetup_location}
                  onChange={e => set('meetup_location', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Waktu meetup <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#49BC9E] transition-colors"
                  value={form.meetup_time}
                  onChange={e => set('meetup_time', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card: Catatan */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Catatan untuk Jastiper</h2>
          <textarea
            placeholder="Tambahkan catatan khusus (misalnya: packaging, struk, warna, dll.)"
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#49BC9E] transition-colors resize-none"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        {/* Submit — full width di mobile, rata kanan di desktop */}
        <div className="flex justify-end pb-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto bg-[#49BC9E] hover:bg-[#3da88d] transition-colors text-white text-sm font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Mengirim request...' : 'Kirim Request'}
          </button>
        </div>

      </div>
    </div>
  )
}