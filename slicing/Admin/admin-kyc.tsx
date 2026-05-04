"use client"

import { useState } from "react"
import AdminNavbar from "@/components/shared/AdminNavbar"

type KYCStatus = "Menunggu" | "Disetujui" | "Ditolak"

interface KYCUser {
  id: number
  name: string
  email: string
  country: string
  fee: string
  status: KYCStatus
  avatar: string
  phone: string
  bio: string
  rejectReason?: string
}

export default function AdminKYCSlicing() {
  const [activeTab, setActiveTab] = useState<KYCStatus>("Menunggu")
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(null)

  const [kycList, setKycList] = useState<KYCUser[]>([
    {
      id: 1,
      name: "Kim Jennie",
      email: "jennierubyjane@student.ub.ac.id",
      country: "Japan",
      fee: "10%",
      status: "Menunggu",
      avatar: "/avatar-default.png",
      phone: "+62 85810393050",
      bio: "Ayo hijaukan dan hidupkan dunia!",
    },
    {
      id: 2,
      name: "Kim Jennie",
      email: "jennierubyjane@student.ub.ac.id",
      country: "Japan",
      fee: "10%",
      status: "Disetujui",
      avatar: "/avatar-default.png",
      phone: "+62 85810393050",
      bio: "Ayo hijaukan dan hidupkan dunia!",
    },
    {
      id: 3,
      name: "Kim Jennie",
      email: "jennierubyjane@student.ub.ac.id",
      country: "Japan",
      fee: "10%",
      status: "Ditolak",
      avatar: "/avatar-default.png",
      phone: "+62 85810393050",
      bio: "Ayo hijaukan dan hidupkan dunia!",
      rejectReason: "Foto KTP buram",
    },
  ])

  const filteredData = kycList.filter((i) => i.status === activeTab)

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <AdminNavbar />

      <div className="max-w-[1280px] mx-auto px-6 py-10">

        {/* HEADER */}
        <h1 className="text-[24px] font-semibold text-[#0F172A] mb-6">
          Verifikasi KYC
        </h1>

        {/* TABS */}
        <div className="flex gap-6 border-b mb-6">
          {["Menunggu", "Disetujui", "Ditolak"].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab as KYCStatus)}
              className={`pb-2 cursor-pointer relative font-medium ${
                activeTab === tab ? "text-[#14B8A6]" : "text-gray-500"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#14B8A6]" />
              )}
            </div>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((user) => (
            <div key={user.id} className="bg-white border border-[#E2E8F0] rounded-2xl px-6 py-5">

              {/* TOP */}
              <div className="flex justify-between">
                <div className="flex gap-4">
                  <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="text-[18px] font-semibold text-[#0F172A]">
                      {user.name}
                    </p>
                    <p className="text-[14px] text-[#64748B]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="w-[1px] h-10 bg-[#E2E8F0]" />
              </div>

              {/* BOX */}
              <div className="mt-4 bg-[#F1F5F9] rounded-2xl px-5 py-4 flex justify-between">
                <div>
                  <p className="text-[13px] text-gray-500 mb-1">Domisili</p>
                  <p className="text-[15px] font-semibold text-gray-900">
                    {user.country}
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-gray-500 mb-1">Service Fee</p>
                  <p className="text-[15px] font-semibold text-gray-900">
                    Fee {user.fee}
                  </p>
                </div>
              </div>

              {/* BOTTOM */}
              <div className="flex justify-between mt-5">

                <span
                  className={`text-[12px] px-4 py-1.5 rounded-full font-medium ${
                    user.status === "Menunggu"
                      ? "bg-orange-100 text-orange-500"
                      : user.status === "Disetujui"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  {user.status}
                </span>

                <button
                  onClick={() => setSelectedUser(user)}
                  className="text-[#14B8A6] text-[14px] font-medium"
                >
                  Lihat Detail →
                </button>

              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ================= MODAL ================= */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedUser(null)}
        >

          <div
            className="bg-white w-[650px] rounded-2xl p-6 shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900">
                Detail Pengajuan KYC
              </h2>
              <button
  onClick={() => {
    setSelectedUser(null)
    setRejectReason("")
  }}
  className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 text-xl font-bold transition"
>
  ✕
</button>
            </div>

            {/* USER */}
            <div className="flex gap-3 mb-5">
              <img src={selectedUser.avatar} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            {/* FORM */}
            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-[13px] text-gray-500 mb-1">Domisili</p>
                  <input
                    value={selectedUser.country}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <p className="text-[13px] text-gray-500 mb-1">Service Fee</p>
                  <input
                    value={selectedUser.fee}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

              </div>

              <div>
                <p className="text-[13px] text-gray-500 mb-1">WhatsApp</p>
                <input
                  value={selectedUser.phone}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

              <div>
                <p className="text-[13px] text-gray-500 mb-1">Bio</p>
                <textarea
                  value={selectedUser.bio}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

            </div>

            {/* IMAGE */}
            <div className="grid grid-cols-2 gap-4 mt-5">
              <img src="/ktp-logo.svg" className="rounded-xl border" />
              <img src="/pegang-ktp.svg" className="rounded-xl border" />
            </div>

            {/* MENUNGGU */}
            {selectedUser.status === "Menunggu" && (
              <>
                <div className="mt-4">
                  <p className="text-[13px] text-gray-500 mb-1">
                    Alasan penolakan (wajib jika menolak)
                  </p>
                  <input
                    placeholder="Contoh: Foto KTP buram"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-5">
                  <button
                    onClick={() => setConfirmType("reject")}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg"
                  >
                    Tolak
                  </button>

                  <button
                    onClick={() => setConfirmType("approve")}
                    className="px-4 py-2 bg-[#14B8A6] text-white rounded-lg"
                  >
                    Setujui
                  </button>
                </div>
              </>
            )}

            {/* DISETUJUI */}
            {selectedUser.status === "Disetujui" && (
              <div className="mt-5 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                ✓ Sudah disetujui sebagai Jastiper
              </div>
            )}

            {/* DITOLAK */}
            {selectedUser.status === "Ditolak" && (
              <div className="mt-5 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                Ditolak: {selectedUser.rejectReason}
              </div>
            )}

          </div>
        </div>
      )}

      {/* CONFIRM */}
      {confirmType && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white px-6 py-5 rounded-xl text-center shadow-xl w-[320px]">

            <p className="mb-5 text-gray-900 font-medium">
              {confirmType === "approve"
                ? "Yakin ingin menyetujui?"
                : "Yakin ingin menolak?"}
            </p>

            <div className="flex gap-3 justify-center">

              <button
                onClick={() => setConfirmType(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={() => {
                  if (confirmType === "reject" && !rejectReason) {
                    alert("Alasan wajib diisi")
                    return
                  }

                  const newStatus = confirmType === "approve" ? "Disetujui" : "Ditolak"

                  setKycList((prev) =>
                    prev.map((i) =>
                      i.id === selectedUser?.id
                        ? {
                            ...i,
                            status: newStatus as KYCStatus,
                            rejectReason: confirmType === "reject" ? rejectReason : undefined,
                          }
                        : i
                    )
                  )

                  setActiveTab(newStatus as KYCStatus)
                  setConfirmType(null)
                  setSelectedUser(null)
                  setRejectReason("")
                }}
                className={`px-4 py-2 text-white rounded-lg ${
                  confirmType === "approve"
                    ? "bg-[#14B8A6]"
                    : "bg-red-500"
                }`}
              >
                Ya
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}