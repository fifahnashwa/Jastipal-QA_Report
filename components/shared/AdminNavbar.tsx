export default function AdminNavbar() {
  const avatar = null // Kalau ada API, foto profil

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-[87px]">

        {/* LEFT */}
        <div className="flex items-center gap-16">

          {/* LOGO */}
          <div className="flex items-center gap-1">
            <img
              src="/Logo Jastipal.svg"
              alt="Jastipal Logo"
              className="w-14 h-14 object-contain" // 🔥 dibesarin dari 8 → 10
            />
            <span className="font-semibold text-gray-900 text-lg">
              Jastipal
            </span>
          </div>

          {/* MENU */}
          <div className="flex items-center gap-6 text-sm">

            {/* ACTIVE */}
            <div className="relative">
              <span className="text-teal-600 font-medium">
                Dashboard
              </span>
              <span className="absolute -bottom-[28px] left-0 right-0 h-[2px] bg-[#14B8A6]" />
            </div>

            <span className="text-gray-500 hover:text-gray-800 cursor-pointer">
              Verifikasi KYC
            </span>

            <span className="text-gray-500 hover:text-gray-800 cursor-pointer">
              Verifikasi Bayar
            </span>

            <span className="text-gray-500 hover:text-gray-800 cursor-pointer">
              Users
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <img
            src={avatar || "/Vector.svg"}
            alt="Admin Avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <span className="font-medium">Admin</span>
        </div>
      </div>
    </nav>
  )
}   