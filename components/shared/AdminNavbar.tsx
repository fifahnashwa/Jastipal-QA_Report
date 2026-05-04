"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminNavbar() {
  const pathname = usePathname()
  const avatar = null

  const isActive = (path: string) => pathname === path

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-[87px]">

        {/* LEFT */}
        <div className="flex items-center gap-12">

          {/* LOGO */}
          <div className="flex items-center gap-2">
            <img
              src="/Logo Jastipal.svg"
              alt="Jastipal Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="font-semibold text-gray-900 text-lg">
              Jastipal
            </span>
          </div>

          {/* MENU */}
          <div className="flex items-center gap-8 text-sm">

            {/* DASHBOARD */}
            <Link
              href="/preview/admin/admin-dashboard"
              className={`relative font-medium ${
                isActive("/preview/admin/admin-dashboard")
                  ? "text-teal-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Dashboard
              {isActive("/preview/admin/admin-dashboard") && (
                <span className="absolute -bottom-[28px] left-0 right-0 h-[2px] bg-[#14B8A6]" />
              )}
            </Link>

            {/* KYC */}
            <Link
              href="/preview/admin/admin-kyc"
              className={`relative font-medium ${
                isActive("/preview/admin/admin-kyc")
                  ? "text-teal-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Verifikasi KYC
              {isActive("/preview/admin/admin-kyc") && (
                <span className="absolute -bottom-[28px] left-0 right-0 h-[2px] bg-[#14B8A6]" />
              )}
            </Link>

            <Link
              href="/preview/admin/admin-payment"
              className={`relative font-medium ${
                isActive("/preview/admin/admin-payment")
                  ? "text-teal-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Verifikasi Bayar
              {isActive("/preview/admin/admin-payment") && (
                <span className="absolute -bottom-[28px] left-0 right-0 h-[2px] bg-[#14B8A6]" />
              )}
            </Link>

            {/* USERS */}
            <Link
              href="/preview/admin/admin-users"
              className={`relative font-medium ${
                isActive("/preview/admin/admin-users")
                  ? "text-teal-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Users
              {isActive("/preview/admin/admin-users") && (
                <span className="absolute -bottom-[28px] left-0 right-0 h-[2px] bg-[#14B8A6]" />
              )}
            </Link>

          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <img
            src={avatar || "/Vector.svg"}
            alt="Admin Avatar"
            className="w-9 h-9 rounded-full object-cover border border-gray-200"
          />
          <span>Admin</span>
        </div>

      </div>
    </nav>
  )
}