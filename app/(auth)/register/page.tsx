'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  async function handleRegister() {
    setLoading(true)
    setError('')

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setRegisteredEmail(form.email)
    setShowPopup(true)
    setLoading(false)
  }

  async function handleGoogleRegister() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-0"
      style={{ backgroundColor: '#49BC9E', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Popup verifikasi email */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full shadow-xl text-center" style={{ maxWidth: '380px' }}>
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#F0FDF4' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#49BC9E" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-2" style={{ color: '#1F2937' }}>
              Cek email kamu!
            </h2>
            <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
              Kami telah mengirim link verifikasi ke
            </p>
            <p className="text-sm font-semibold mb-4 break-all" style={{ color: '#1F2937' }}>
              {registeredEmail}
            </p>
            <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>
              Klik link di email tersebut untuk mengaktifkan akun kamu. Cek folder spam jika tidak muncul dalam beberapa menit.
            </p>
            <a
              href="/login"
              className="block w-full rounded-lg py-3 text-sm font-semibold text-white text-center transition-all"
              style={{ backgroundColor: '#49BC9E' }}
            >
              Ke halaman masuk
            </a>
          </div>
        </div>
      )}

      {/* Form register */}
      <div
        className="bg-white w-full shadow-md rounded-2xl p-6 sm:p-8"
        style={{ maxWidth: '420px' }}
      >
        <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#1F2937' }}>Daftar akun</h1>
        <p className="text-sm mb-5 sm:mb-6" style={{ color: '#6B7280' }}>Bergabung dengan Jastipal</p>

        {error && (
          <div className="rounded-lg px-4 py-3 mb-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
            <p className="text-sm" style={{ color: '#E33629' }}>{error}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block" style={{ color: '#1F2937' }}>Nama</label>
          <input
            placeholder="Masukkan nama kamu"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
            style={{ border: '1px solid #D1D5DB', color: '#1F2937', backgroundColor: '#FFFFFF' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#49BC9E')}
            onBlur={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block" style={{ color: '#1F2937' }}>Email</label>
          <input
            type="email"
            placeholder="Masukkan email kamu"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
            style={{ border: '1px solid #D1D5DB', color: '#1F2937', backgroundColor: '#FFFFFF' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#49BC9E')}
            onBlur={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="mb-5 sm:mb-6">
          <label className="text-sm font-medium mb-1 block" style={{ color: '#1F2937' }}>Password</label>
          <input
            type="password"
            placeholder="Masukkan password"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
            style={{ border: '1px solid #D1D5DB', color: '#1F2937', backgroundColor: '#FFFFFF' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#49BC9E')}
            onBlur={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all"
          style={{
            backgroundColor: '#49BC9E',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#3DAA8E' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#49BC9E' }}
        >
          {loading ? 'Loading...' : 'Daftar'}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#D1D5DB' }}></div>
          <span className="text-xs" style={{ color: '#6B7280' }}>Atau</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#D1D5DB' }}></div>
        </div>

        <button
          onClick={handleGoogleRegister}
          className="w-full rounded-lg py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
          style={{ border: '1px solid #D1D5DB', color: '#1F2937', backgroundColor: '#FFFFFF' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Daftar dengan Google
        </button>

        <p className="text-center text-sm mt-5" style={{ color: '#6B7280' }}>
          Sudah punya akun?{' '}
          <a href="/login" className="font-semibold" style={{ color: '#3DAA8E' }}>Masuk</a>
        </p>
      </div>
    </div>
  )
}