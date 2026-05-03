import AdminNavbar from '@/components/shared/AdminNavbar'

export default function AdminDashboardSlicing() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col w-full">

      {/* NAVBAR */}
      <AdminNavbar />

      {/* CONTENT */}
      <div className="max-w-[1280px] mx-auto px-6 py-10 w-full">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-[24px] font-semibold text-[#0F172A]">
            Admin Dashboard
          </h1>
          <p className="text-[14px] text-[#64748B] mt-1">
            Overview platform Jastipal
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            "KYC Menunggu",
            "Bukti Transfer",
            "Total User",
            "Order Aktif",
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border border-[#E2E8F0] rounded-[12px] px-5 py-4"
            >
              <p className="text-[14px] text-[#64748B]">{item}</p>
              <h2 className="text-[28px] font-semibold mt-2 text-[#0F172A]">
                0
              </h2>
            </div>
          ))}
        </div>

        {/* AKSI CEPAT */}
        <div>
          <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">
            Aksi Cepat
          </h2>

          <div className="grid grid-cols-2 gap-6">

            {/* KYC */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col hover:border-teal-400 hover:shadow-sm transition">
              
              <div className="w-12 h-12 bg-[#14B8A6] rounded-[10px] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>

              <p className="font-semibold text-[#0F172A] text-[16px]">
                Verifikasi KYC
              </p>

              <p className="text-[14px] text-[#64748B] mt-1">
                0 pengajuan menunggu
              </p>
            </div>

            {/* PAYMENT */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col hover:border-teal-400 hover:shadow-sm transition">
              
              <div className="w-12 h-12 bg-[#14B8A6] rounded-[10px] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>

              <p className="font-semibold text-[#0F172A] text-[16px]">
                Verifikasi Pembayaran
              </p>

              <p className="text-[14px] text-[#64748B] mt-1">
                0 bukti transfer menunggu
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}