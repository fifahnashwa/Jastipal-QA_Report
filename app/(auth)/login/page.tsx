'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    if (searchParams.get('error') === 'frozen') {
      setError('Akun kamu telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.')
    }
  }, [searchParams])

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (signInError) {
      setError('Email atau password salah.')
      setLoading(false)
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin, is_frozen')
      .eq('id', data.user.id)
      .single()

    if (userData?.is_frozen) {
      await supabase.auth.signOut()
      setError('Akun kamu telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.')
      setLoading(false)
      return
    }

    if (userData?.is_admin) {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  async function handleGoogleLogin() {
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
      <div
        className="bg-white w-full shadow-md rounded-2xl p-6 sm:p-8"
        style={{ maxWidth: '420px' }}
      >
        <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#1F2937' }}>Masuk Akun</h1>
        <p className="text-sm mb-5 sm:mb-6" style={{ color: '#6B7280' }}>Selamat datang kembali di Jastipal</p>

        {error && (
          <div className="rounded-lg px-4 py-3 mb-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
            <p className="text-sm" style={{ color: '#E33629' }}>{error}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block" style={{ color: '#1F2937' }}>Email</label>
          <input
            type="email"
            placeholder="Masukkan email"
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
          onClick={handleLogin}
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
          {loading ? 'Loading...' : 'Masuk'}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#D1D5DB' }}></div>
          <span className="text-xs" style={{ color: '#6B7280' }}>Atau</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#D1D5DB' }}></div>
        </div>

        <button
          onClick={handleGoogleLogin}
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
          Masuk dengan Google
        </button>

        <p className="text-center text-sm mt-5" style={{ color: '#6B7280' }}>
          Belum punya akun?{' '}
          <a href="/register" className="font-semibold" style={{ color: '#3DAA8E' }}>Daftar</a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#49BC9E' }}>
        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}