'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const testimonials = [
  {
    name: 'Sari Dewi',
    role: 'Buyer dari Jakarta',
    avatar: 'SD',
    color: 'bg-[#e6f7f3] text-[#2d9b7f]',
    text: 'Akhirnya bisa beli skincare Korea yang gak ada di Indonesia! Prosesnya gampang banget, bayar lewat escrow jadi tenang karena uang aku aman sampai barang dateng.',
  },
  {
    name: 'Rizky Fauzan',
    role: 'Jastiper aktif, sering ke Jepang',
    avatar: 'RF',
    color: 'bg-blue-100 text-blue-600',
    text: 'Sebagai jastiper, Jastipal bantu aku dapetin penghasilan tambahan dari trip yang udah direncanain. Sistem escrow-nya juga bikin aku yakin pembayaran pasti cair setelah barang sampai.',
  },
  {
    name: 'Tiara Putri',
    role: 'Buyer dari Surabaya',
    avatar: 'TP',
    color: 'bg-purple-100 text-purple-600',
    text: 'Udah coba beli tas dari Eropa lewat Jastipal. Jastiper-nya responsif dan update terus. Yang paling suka adalah sistem disputenya, kalau ada masalah ada admin yang bantu.',
  },
  {
    name: 'Budi Santoso',
    role: 'Jastiper, rutin ke Malaysia & Singapura',
    avatar: 'BS',
    color: 'bg-orange-100 text-orange-600',
    text: 'Platform yang rapi dan profesional. Aku bisa buat katalog trip dengan mudah, buyer langsung bisa order produk yang aku list. Pencairan dana juga jelas prosesnya.',
  },
  {
    name: 'Mega Lestari',
    role: 'Buyer dari Bandung',
    avatar: 'ML',
    color: 'bg-pink-100 text-pink-600',
    text: 'Request barang di Jastipal gampang banget! Tinggal masukin produk yang mau dibeli sama budget max, terus ada jastiper yang langsung ambil. Barang sampai sesuai ekspektasi!',
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/Logo Jastipal.svg" alt="Jastipal" className="h-8 w-auto" />
              <span className="text-xl font-bold tracking-tight text-gray-900">Jastipal</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/login')}
                style={{ height: '36px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '13px', paddingBottom: '13px', background: '#1F3149', borderRadius: '8px', display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 600, lineHeight: '24px', whiteSpace: 'nowrap' }}>Masuk</span>
              </button>
              <button
                onClick={() => router.push('/register')}
                style={{ height: '36px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '13px', paddingBottom: '13px', background: 'white', borderRadius: '8px', outline: '1.5px solid #1F3149', outlineOffset: '-1.5px', display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ color: '#1F3149', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 600, lineHeight: '24px', whiteSpace: 'nowrap' }}>Daftar</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#00A991] min-h-screen flex flex-col justify-center relative overflow-hidden pt-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full flex flex-col sm:flex-row items-center justify-between gap-10 py-20">
          <div className="flex flex-col gap-7 max-w-[700px] w-full">
            <div className="flex flex-col gap-5">
              <h1 style={{ fontSize: '36px', fontFamily: 'Inter, sans-serif', fontWeight: 700, lineHeight: '45px', maxWidth: '680px' }}>
                <span style={{ color: 'white' }}>Titip beli dari </span>
                <span style={{ color: '#1F3149' }}>luar negeri </span>
                <span style={{ color: 'white' }}>dengan aman dan terpercaya.</span>
              </h1>
              <p style={{ color: 'white', fontSize: '16px', fontFamily: 'Inter, sans-serif', fontWeight: 500, lineHeight: '24px', maxWidth: '552px' }}>
                Jastipal menghubungkan buyer dengan jasa titip terpercaya. Dana kamu tetap aman melalui sistem escrow sampai barang sampai di tanganmu.
              </p>
            </div>
            <button
              onClick={() => router.push('/register')}
              style={{ height: '50px', paddingLeft: '40px', paddingRight: '40px', paddingTop: '13px', paddingBottom: '13px', background: '#1F3149', borderRadius: '100px', display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}
            >
              <span style={{ color: 'white', fontSize: '16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, lineHeight: '24px', whiteSpace: 'nowrap' }}>Mulai Sekarang</span>
            </button>
          </div>
          <div className="w-full sm:w-auto flex justify-center sm:justify-end flex-shrink-0">
            <img src="/asset-koper.svg" alt="Koper" style={{ width: '600px', height: 'auto' }} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 w-full pointer-events-none">
          <img src="/asset-awan.svg" alt="" className="w-full object-cover" />
        </div>
      </section>

      {/* Cara kerja Buyer */}
      <section className="py-24 px-6 bg-[#FFFFFF]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1F3149]">Gimana Cara Kerjanya?</h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              Belanja dari luar negeri kini jadi lebih mudah, aman, dan tanpa ribet. Jastipal menyediakan dua cara utama yang bisa kamu pilih sesuai kebutuhan.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-full bg-[#00A991]/10 flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A991" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1F3149]">Request Barang</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Punya barang incaran dari luar negeri? Buat request dengan budget maksimal, lalu jastiper yang sesuai akan mengambil request dan menetapkan harga final.
              </p>
              <div className="space-y-3">
                {['Buat request barang dengan budget maksimal', 'Jastiper ambil order & tetapkan harga', 'Bayar melalui escrow Jastipal', 'Barang diterima & dana cair ke jastiper'].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-[#00A991] shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-full bg-[#00A991]/10 flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A991" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1F3149]">Cari Produk Luar Negeri</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Ingin langsung belanja? Kamu bisa melihat katalog trip dari jastiper yang sedang bepergian ke luar negeri dan memilih produk yang tersedia.
              </p>
              <div className="space-y-3">
                {['Lihat trip jastiper yang tersedia', 'Pilih produk dari katalog trip', 'Order & bayar melalui escrow Jastipal', 'Barang diterima & dana cair ke jastiper'].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-[#00A991] shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cara kerja Jastiper */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-[#00A991]/10 text-[#00A991] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">Untuk Jastiper</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1F3149]">Hasilkan dari Trip Kamu</h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              Lagi trip ke luar negeri? Jadikan perjalananmu lebih bernilai dengan membantu buyer mendapatkan produk yang mereka inginkan.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Ambil Request Buyer */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-full bg-[#1F3149]/10 flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F3149" strokeWidth="1.8">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <line x1="9" y1="12" x2="15" y2="12"/>
                  <line x1="9" y1="16" x2="13" y2="16"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1F3149]">Ambil Request Buyer</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Browse permintaan dari buyer, pilih yang sesuai dengan rencana tripmu, dan tetapkan harga fix yang tidak melebihi budget buyer.
              </p>
              <div className="space-y-3">
                {[
                  'Daftar & verifikasi KYC sebagai jastiper',
                  'Browse request buyer yang tersedia',
                  'Ambil request & tetapkan harga fix',
                  'Buyer bayar via escrow',
                  'Beli barang & upload struk pembelian',
                  'Kirim ke buyer & upload resi',
                  'Buyer konfirmasi terima dan dana cair ke kamu',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-[#1F3149] shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buat Trip & Katalog */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-full bg-[#1F3149]/10 flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F3149" strokeWidth="1.8">
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1F3149]">Buat Trip & Katalog Produk</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Punya rencana trip? Buat trip dan tambahkan produk ke katalog. Buyer bisa langsung order dari katalogmu sebelum kamu berangkat.
              </p>
              <div className="space-y-3">
                {[
                  'Daftar & verifikasi KYC sebagai jastiper',
                  'Buat trip dengan info negara & tanggal tiba',
                  'Tambah produk ke katalog trip (harga, stok, foto)',
                  'Buyer browse & order produkmu',
                  'Buyer bayar via escrow',
                  'Beli barang & upload struk pembelian',
                  'Buyer konfirmasi terima dan dana cair ke kamu',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-[#1F3149] shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA jastiper */}
          <div className="mt-10 text-center">
      
          </div>
        </div>
      </section>

      {/* Kenapa Jastipal */}
      <section className="bg-[#FFFFFF] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1F3149]">Kenapa Jastipal?</h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto leading-relaxed">
              Jastipal hadir untuk memberikan pengalaman titip beli dari luar negeri yang lebih aman, transparan, dan terpercaya.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 rounded-full bg-[#00A991]/10 flex items-center justify-center mx-auto mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A991" strokeWidth="1.8">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3 text-[#1F3149]">Dana Aman di Escrow</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Pembayaran tidak langsung masuk ke jastiper. Dana akan ditahan di escrow dan baru dicairkan setelah buyer menerima barang dan melakukan konfirmasi.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 rounded-full bg-[#00A991]/10 flex items-center justify-center mx-auto mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A991" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3 text-[#1F3149]">Jastiper Terverifikasi</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Semua jastiper wajib melalui proses KYC dan verifikasi admin sebelum dapat menerima pesanan, sehingga transaksi menjadi lebih terpercaya.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 rounded-full bg-[#00A991]/10 flex items-center justify-center mx-auto mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A991" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <line x1="9" y1="10" x2="15" y2="10"/>
                  <line x1="12" y1="7" x2="12" y2="13"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3 text-[#1F3149]">Ada Sistem Dispute</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Jika terjadi kendala, buyer dapat membuka dispute dan admin akan membantu menyelesaikan masalah. Dana tetap aman sampai transaksi selesai.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimoni */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1F3149]">Apa Kata Mereka?</h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto leading-relaxed">
              Ribuan buyer dan jastiper sudah merasakan kemudahan bertransaksi di Jastipal.
            </p>
          </div>

          {/* Slider */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {testimonials.map((t, i) => (
                <div key={i} className="w-full flex-shrink-0 px-2">
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${t.color}`}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-[#1F3149]">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.role}</p>
                      </div>
                      {/* Stars */}
                      <div className="ml-auto flex gap-0.5">
                        {[...Array(5)].map((_, s) => (
                          <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#00A991" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed italic">"{t.text}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`rounded-full transition-all ${activeSlide === i ? 'w-6 h-2.5 bg-[#00A991]' : 'w-2.5 h-2.5 bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FFFFFF] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#00A991] rounded-3xl px-8 sm:px-12 py-14 flex flex-col sm:flex-row items-center justify-between gap-10 overflow-hidden relative">
            <div className="flex flex-col gap-6 max-w-md items-center text-center sm:items-start sm:text-left">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">Siap titip beli dari luar negeri?</h2>
                <p className="text-white/80 text-sm leading-relaxed">Daftar gratis dan nikmati pengalaman belanja luar negeri yang lebih aman, mudah, dan terpercaya bersama jastiper pilihan.</p>
              </div>
              <button
                onClick={() => router.push('/register')}
                style={{ height: '50px', paddingLeft: '40px', paddingRight: '40px', background: '#1F3149', borderRadius: '100px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ color: 'white', fontSize: '16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, lineHeight: '24px', whiteSpace: 'nowrap' }}>Mulai Sekarang</span>
              </button>
            </div>
            <div className="flex-shrink-0">
              <img src="/asset-bola.svg" alt="" style={{ width: '280px', height: 'auto' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1F3149] px-6 sm:px-12 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
            <img src="/Logo Jastipal 1.svg" alt="Jastipal" className="h-8 w-auto" />
            <span className="text-white text-xl font-bold">Jastipal</span>
          </div>
          <div className="border-t border-white/20 mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-white/60 text-sm">©2026 Jastipal. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}