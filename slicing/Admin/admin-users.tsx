"use client"

import { useState } from "react"
import AdminNavbar from "@/components/shared/AdminNavbar"

type UserStatus = "Aktif" | "Dibekukan"

interface UserItem {
  id: number
  name: string
  email: string
  avatar: string
  joinDate: string
  status: UserStatus
  country?: string
  fee?: string
  phone?: string
  bio?: string
  ktpImage?: string
  selfieImage?: string
}

export default function AdminUsersSlicing() {
  const [users, setUsers] = useState<UserItem[]>([
    {
      id: 1,
      name: "Kim Jennie",
      email: "jennierubyjane@student.ub.ac.id",
      avatar: "/avatar-default.png",
      joinDate: "14 April 2026",
      status: "Aktif",
      country: "Japan",
      fee: "10%",
      phone: "+62 85810393050",
      bio: "Ayo hijaukan dan hidupkan dunia!",
      ktpImage: "/ktp-logo.svg",
      selfieImage: "/pegang-ktp.svg",
    },
    {
      id: 2,
      name: "Kim Jennie",
      email: "jennierubyjane@student.ub.ac.id",
      avatar: "/avatar-default.png",
      joinDate: "14 April 2026",
      status: "Dibekukan",
      country: "Japan",
      fee: "10%",
      phone: "+62 85810393050",
      bio: "Ayo hijaukan dan hidupkan dunia!",
      ktpImage: "/ktp-logo.svg",
      selfieImage: "/pegang-ktp.svg",
    },
    {
      id: 3,
      name: "Kim Jennie",
      email: "jennierubyjane@student.ub.ac.id",
      avatar: "/avatar-default.png",
      joinDate: "14 April 2026",
      status: "Aktif",
      country: "Japan",
      fee: "10%",
      phone: "+62 85810393050",
      bio: "Ayo hijaukan dan hidupkan dunia!",
      ktpImage: "/ktp-logo.svg",
      selfieImage: "/pegang-ktp.svg",
    },
    {
      id: 4,
      name: "Kim Jennie",
      email: "jennierubyjane@student.ub.ac.id",
      avatar: "/avatar-default.png",
      joinDate: "14 April 2026",
      status: "Aktif",
      country: "Japan",
      fee: "10%",
      phone: "+62 85810393050",
      bio: "Ayo hijaukan dan hidupkan dunia!",
      ktpImage: "/ktp-logo.svg",
      selfieImage: "/pegang-ktp.svg",
    },
  ])

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserItem | null>(null)
  const [confirmType, setConfirmType] = useState<"freeze" | "unfreeze" | null>(null)

  const handleToggleFreeze = (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      if (user.status === "Aktif") {
        setSelectedUser(user)
        setConfirmType("freeze")
      } else {
        setSelectedUser(user)
        setConfirmType("unfreeze")
      }
    }
  }

  const handleConfirmAction = () => {
    if (!selectedUser) return

    setUsers(prev =>
      prev.map(user =>
        user.id === selectedUser.id
          ? {
              ...user,
              status: confirmType === "freeze" ? "Dibekukan" : "Aktif",
            }
          : user
      )
    )

    setConfirmType(null)
    setSelectedUser(null)
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <AdminNavbar />

      <div className="max-w-[1280px] mx-auto px-6 py-10">

        {/* HEADER */}
        <h1 className="text-[24px] font-semibold text-[#0F172A] mb-2">
          Manajemen User
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Kelola semua akun user platform Jastipal
        </p>

        {/* USER LIST */}
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center justify-between"
            >

              {/* LEFT - USER INFO */}
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover"
                />

                <div>
                  <p className="font-semibold text-[#0F172A] text-lg">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    {user.email}
                  </p>
                  <p className="text-sm text-gray-400">
                    Bergabung {user.joinDate}
                  </p>
                </div>
              </div>

              {/* RIGHT - ACTIONS */}
              <div className="flex items-center gap-3">

                <button
                  onClick={() => handleToggleFreeze(user.id)}
                  className={`px-5 py-2 rounded-lg font-medium transition ${
                    user.status === "Aktif"
                      ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      : "border border-red-300 text-red-600 hover:bg-red-50"
                  }`}
                >
                  {user.status === "Aktif" ? "Bekukan" : "Aktifkan"}
                </button>

                <button
                  onClick={() => setSelectedUserDetail(user)}
                  className="px-5 py-2 bg-[#14B8A6] text-white rounded-lg font-medium hover:bg-[#0d9488] transition"
                >
                  Lihat
                </button>

              </div>

            </div>
          ))}
        </div>

      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {confirmType && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white px-6 py-5 rounded-xl text-center shadow-xl w-[320px]">

            <p className="mb-5 text-gray-900 font-medium">
              {confirmType === "freeze"
                ? `Yakin ingin membekukan akun ${selectedUser.name}?`
                : `Yakin ingin mengaktifkan kembali akun ${selectedUser.name}?`}
            </p>

            <div className="flex gap-3 justify-center">

              <button
                onClick={() => {
                  setConfirmType(null)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-white rounded-lg ${
                  confirmType === "freeze"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-[#14B8A6] hover:bg-[#0d9488]"
                }`}
              >
                Ya
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ================= DETAIL PROFIL MODAL ================= */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedUserDetail(null)}>
          <div className="bg-white w-[500px] rounded-2xl p-6 shadow-xl relative" onClick={(e) => e.stopPropagation()}>

            {/* CLOSE */}
            <button
              onClick={() => setSelectedUserDetail(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold transition"
            >
              ✕
            </button>

            {/* HEADER */}
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
              Detail Profil
            </h2>

            {/* USER INFO */}
            <div className="flex gap-3 mb-5">
              <img
                src={selectedUserDetail.avatar}
                alt={selectedUserDetail.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{selectedUserDetail.name}</p>
                <p className="text-sm text-gray-500">{selectedUserDetail.email}</p>
              </div>
            </div>

            {/* FORM */}
            <div className="space-y-4">

              <div>
                <p className="text-[13px] text-gray-500 mb-1">Domisili</p>
                <input
                  value={selectedUserDetail.country || ""}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

              <div>
                <p className="text-[13px] text-gray-500 mb-1">Service Fee</p>
                <input
                  value={selectedUserDetail.fee || ""}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

              <div>
                <p className="text-[13px] text-gray-500 mb-1">WhatsApp</p>
                <input
                  value={selectedUserDetail.phone || ""}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

              <div>
                <p className="text-[13px] text-gray-500 mb-1">Bio</p>
                <textarea
                  value={selectedUserDetail.bio || ""}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

            </div>

            {/* DOKUMEN KYC */}
            <div className="mt-5">
              <p className="text-[13px] text-gray-500 mb-3">Dokumen KYC</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <img
                    src={selectedUserDetail.ktpImage || "/ktp-logo.svg"}
                    className="rounded-xl border"
                  />
                  <p className="text-xs text-gray-400 text-center mt-1">KTP atau Passport</p>
                </div>
                <div>
                  <img
                    src={selectedUserDetail.selfieImage || "/pegang-ktp.svg"}
                    className="rounded-xl border"
                  />
                  <p className="text-xs text-gray-400 text-center mt-1">Selfie dengan KTP</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
