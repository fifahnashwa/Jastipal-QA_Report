'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const [adminName, setAdminName] = useState('')
  const [pendingKyc, setPendingKyc] = useState(0)
  const [pendingPayment, setPendingPayment] = useState(0)
  const [pendingDisputes, setPendingDisputes] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('users')
        .select('full_name, is_admin')
        .eq('id', user.id)
        .single()

      if (!data?.is_admin) { router.push('/dashboard'); return }
      setAdminName(data.full_name ?? 'Admin')

      const { count: kycCount } = await supabase
        .from('jastiper_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('kyc_status', 'pending')
      setPendingKyc(kycCount ?? 0)

      const { count: payCount } = await supabase
        .from('escrow_transactions')
        .select('*', { count: 'exact', head: true })
        .not('payment_proof_url', 'is', null)
        .eq('status', 'held')
      setPendingPayment(payCount ?? 0)

      const { count: disputeCount } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
      setPendingDisputes(disputeCount ?? 0)
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

  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      badge: null,
    },
    {
      href: '/admin/kyc',
      label: 'Verifikasi KYC',
      badge: pendingKyc > 0 ? pendingKyc : null,
    },
    {
      href: '/admin/payments',
      label: 'Verifikasi Bayar',
      badge: pendingPayment > 0 ? pendingPayment : null,
    },
    {
      href: '/admin/users',
      label: 'Users',
      badge: null,
    },
    {
      href: '/admin/disputes',
      label: 'Disputes',
      badge: pendingDisputes > 0 ? pendingDisputes : null,
    },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-[#E2E8F0] sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-[87px]">

          {/* LEFT: Logo + Nav */}
          <div className="flex items-center gap-12">

            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <img
                src="/Logo Jastipal.svg"
                alt="Jastipal Logo"
                className="w-12 h-12 object-contain"
              />
              <span className="font-semibold text-gray-900 text-lg">Jastipal</span>
            </Link>

            {/* Menu (desktop) */}
            <div className="hidden sm:flex items-center gap-8 text-sm">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-teal-600'
                      : 'text-[#64748B] hover:text-gray-800'
                  }`}
                >
                  {item.label}

                  {/* Badge notif */}
                  {item.badge && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}

                  {/* Active underline indicator */}
                  {isActive(item.href) && (
                    <span className="absolute -bottom-[33px] left-0 right-0 h-[2px] bg-[#14B8A6]" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT: Avatar + Nama + Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:opacity-80 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-xs font-semibold text-red-600 uppercase border border-gray-200">
                {adminName[0] ?? 'A'}
              </div>
              <span className="hidden sm:block text-sm text-[#64748B] max-w-[100px] truncate">
                {adminName || 'Admin'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden sm:block text-gray-400">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Login sebagai</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{adminName}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-all"
                  >
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

        {/* Mobile bottom bar */}
        <div className="sm:hidden flex border-t border-gray-200">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-all ${
                isActive(item.href) ? 'text-teal-600' : 'text-gray-400'
              }`}
            >
              {item.label}
              {item.badge && (
                <span className="absolute top-1.5 right-1/4 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
     <main className="max-w-[1280px] mx-auto px-6">
  {children}
</main>
    </div>
  )
}