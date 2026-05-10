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
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('full_name, avatar_url, active_role')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserName(data.full_name ?? '')
        setAvatarUrl(data.avatar_url)
        setActiveRole(data.active_role ?? 'buyer')
        const names = (data.full_name ?? '').split(' ')
        setInitials(names.length >= 2 ? names[0][0] + names[1][0] : names[0]?.[0] ?? '?')
      }

      // hitung tagihan waiting_payment
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

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const navItems = activeRole === 'buyer'
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        )},
        { href: '/requests', label: 'Request', icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
        ), badge: pendingPaymentCount > 0 ? pendingPaymentCount : null },
        { href: '/orders', label: 'Pesanan', icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        )},
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        )},
        { href: '/orders', label: 'Pesanan', icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        )},
      ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img
                src="/Logo Jastipal.svg"
                alt="Jastipal Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-semibold text-gray-900 text-lg">Jastipal</span>
            </Link>

            {/* Nav items — desktop */}
            <div className="hidden sm:flex items-center h-16">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative h-full flex items-center gap-2 px-4 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-[#49BC9E]'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {item.icon}
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

          {/* Right side — role badge + avatar */}
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <span className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              activeRole === 'jastiper'
                ? 'bg-[#e6f7f3] text-[#2d9b7f]'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${activeRole === 'jastiper' ? 'bg-[#49BC9E]' : 'bg-gray-400'}`} />
              {activeRole === 'jastiper' ? 'Jastiper' : 'Buyer'}
            </span>

            {/* Avatar + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 hover:opacity-80 transition-all"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#e6f7f3] flex items-center justify-center text-xs font-semibold text-[#49BC9E] uppercase">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {userName}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden sm:block text-gray-400">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden">
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      Profil
                    </Link>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav — bottom bar */}
        <div className="sm:hidden flex border-t border-gray-200">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-[#49BC9E]'
                  : 'text-gray-400'
              }`}
            >
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="absolute top-1.5 right-1/4 w-4 h-4 bg-[#49BC9E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <Link
            href="/profile"
            className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              isActive('/profile')
                ? 'text-[#49BC9E]'
                : 'text-gray-400'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Profil
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}