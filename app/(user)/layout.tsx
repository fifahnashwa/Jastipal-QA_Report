'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState('')
  const [activeRole, setActiveRole] = useState<'buyer' | 'jastiper'>('buyer')
  const [isJastiper, setIsJastiper] = useState(false)
  const [userId, setUserId] = useState('')
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data } = await supabase
        .from('users')
        .select('full_name, avatar_url, active_role, is_jastiper')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserName(data.full_name ?? '')
        setAvatarUrl(data.avatar_url)
        setActiveRole(data.active_role ?? 'buyer')
        setIsJastiper(data.is_jastiper ?? false)
        const names = (data.full_name ?? '').split(' ')
        setInitials(names.length >= 2 ? names[0][0] + names[1][0] : names[0]?.[0] ?? '?')
      }

      const { data: matchedReqs } = await supabase
        .from('requests')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('status', 'matched')

      if (matchedReqs && matchedReqs.length > 0) {
        const reqIds = matchedReqs.map((r: any) => r.id)
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('request_id', reqIds)
          .eq('status', 'waiting_payment')
        setPendingPaymentCount(count ?? 0)
      }
    }
    init()
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSwitchRole() {
    const newRole = activeRole === 'buyer' ? 'jastiper' : 'buyer'
    await supabase.from('users').update({ active_role: newRole }).eq('id', userId)
    setActiveRole(newRole)
    setShowDropdown(false)
    router.push('/dashboard')
  }

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const navItems = activeRole === 'buyer'
    ? [
        {
          href: '/dashboard',
          label: 'Jelajahi Produk',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          ),
        },
        {
          href: '/requests',
          label: 'Request Saya',
          badge: pendingPaymentCount > 0 ? pendingPaymentCount : null,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          ),
        },
        {
          href: '/orders',
          label: 'Pesanan',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          ),
        },
        ...(!isJastiper ? [{
          href: '/profile/switch-to-jastiper',
          label: 'Daftar Jastiper',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          ),
        }] : []),
      ]
    : [
        {
          href: '/dashboard',
          label: 'Jelajah Permintaan',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          ),
        },
        {
          href: '/orders',
          label: 'Pesanan',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          ),
        },
        {
          href: '/trips',
          label: 'Perjalanan Saya',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
            </svg>
          ),
        },
      ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">

      {/* ── TOP NAVBAR ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-[87px] flex items-center justify-between">

          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/Logo Jastipal.svg" alt="Jastipal Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
              <span className="font-semibold text-gray-900 text-base sm:text-lg">Jastipal</span>
            </Link>

            <div className="hidden sm:flex items-center gap-8 h-[87px]">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative h-full flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive(item.href) ? 'text-[#49BC9E]' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="w-4 h-4 bg-[#49BC9E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#49BC9E]" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              activeRole === 'jastiper' ? 'bg-[#e6f7f3] text-[#2d9b7f]' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${activeRole === 'jastiper' ? 'bg-[#49BC9E]' : 'bg-gray-400'}`} />
              {activeRole === 'jastiper' ? 'Jastiper' : 'Buyer'}
            </span>

            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 hover:opacity-80 transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#e6f7f3] flex items-center justify-center text-xs font-semibold text-[#49BC9E] uppercase">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{userName}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden sm:block text-gray-400">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden">
                    <Link href="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      Profil
                    </Link>
                    <div className="border-t border-gray-100" />
                    {isJastiper && (
                      <button onClick={handleSwitchRole} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                          <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                        </svg>
                        {activeRole === 'buyer' ? 'Mode Jastiper' : 'Mode Buyer'}
                      </button>
                    )}
                    <div className="border-t border-gray-100" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      {mounted && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
          <div className="flex items-stretch">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                  isActive(item.href) ? 'text-[#49BC9E]' : 'text-gray-400'
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span className="absolute top-2 left-1/2 ml-2 w-4 h-4 bg-[#49BC9E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <Link
              href="/profile"
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive('/profile') ? 'text-[#49BC9E]' : 'text-gray-400'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Profil
            </Link>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <main className="max-w-5xl mx-auto px-4 py-4 pb-24 sm:pb-6">
        {children}
      </main>

    </div>
  )
}