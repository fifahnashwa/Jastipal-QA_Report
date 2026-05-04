"use client"

import { useState } from "react"
import AdminNavbar from "@/components/shared/AdminNavbar"

type Status = "Menunggu" | "Disetujui" | "Ditolak"

interface PaymentItem {
  id: number
  title: string
  buyer: string
  buyerEmail: string
  jastiper: string
  jastiperEmail: string
  method: string
  amount: string
  status: Status
  image: string
  reason?: string
}

export default function AdminPaymentSlicing() {
  const [activeTab, setActiveTab] = useState<Status>("Menunggu")
  const [selected, setSelected] = useState<PaymentItem | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [data, setData] = useState<PaymentItem[]>([
    {
      id: 1,
      title: "Pembayaran Jastip Jepang",
      buyer: "Dzaky Ananda",
      buyerEmail: "dzaky@student.ub.ac.id",
      jastiper: "Kim Jennie",
      jastiperEmail: "jennie@student.ub.ac.id",
      method: "Virtual Account BNI",
      amount: "Rp 646.500",
      status: "Menunggu",
      image: "/bukti-tf-dummy.svg",
    },
    {
      id: 2,
      title: "Pembayaran Jastip Jepang",
      buyer: "Dzaky Ananda",
      buyerEmail: "dzaky@student.ub.ac.id",
      jastiper: "Kim Jennie",
      jastiperEmail: "jennie@student.ub.ac.id",
      method: "Virtual Account BNI",
      amount: "Rp 646.500",
      status: "Disetujui",
      image: "/bukti-tf-dummy.svg",
    },
    {
      id: 3,
      title: "Pembayaran Jastip Jepang",
      buyer: "Dzaky Ananda",
      buyerEmail: "dzaky@student.ub.ac.id",
      jastiper: "Kim Jennie",
      jastiperEmail: "jennie@student.ub.ac.id",
      method: "Virtual Account BNI",
      amount: "Rp 646.500",
      status: "Ditolak",
      reason: "Bukti tidak sesuai",
      image: "/bukti-tf-dummy.svg",
    },
  ])

  const filtered = data.filter((i) => i.status === activeTab)

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <AdminNavbar />

      <div className="max-w-[1280px] mx-auto px-6 py-10">

        {/* HEADER */}
        <h1 className="text-[24px] font-semibold text-[#0F172A]">
          Verifikasi Pembayaran
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Cek dan approve bukti transfer dari buyer
        </p>

        {/* TABS */}
        <div className="flex gap-6 border-b mb-6">
          {(["Menunggu", "Disetujui", "Ditolak"] as Status[]).map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 cursor-pointer font-medium ${
                activeTab === tab
                  ? "text-teal-600 border-b-2 border-teal-500"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* GRID */}
        {filtered.length === 0 ? (
          <p className="text-gray-400">Tidak ada data</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-4"
              >
                {/* IMAGE */}
                <img
                  src={item.image}
                  className="w-full h-[140px] object-cover rounded-xl"
                />

                {/* TITLE */}
                <div className="flex justify-between items-center mt-4">
                  <p className="font-semibold text-[#0F172A]">
                    {item.title}
                  </p>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      item.status === "Menunggu"
                        ? "bg-orange-100 text-orange-600"
                        : item.status === "Disetujui"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* INFO */}
                <div className="bg-[#F1F5F9] rounded-xl p-3 mt-3 text-sm">
                  <p>
                    <span className="text-gray-400">Buyer</span><br />
                    <span className="font-semibold text-gray-900 text-[15px]">
                      {item.buyer}
                    </span>
                  </p>

                  <p className="mt-2">
                    <span className="text-gray-400">Metode Pembayaran</span><br />
                    <span className="font-semibold text-gray-900 text-[15px]">
                      {item.method}
                    </span>
                  </p>
                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center mt-4">
                  <p className="text-[#14B8A6] font-semibold text-[16px]">
                    {item.amount}
                  </p>

                  <button
                    onClick={() => setSelected(item)}
                    className="text-[#14B8A6] font-medium hover:underline"
                  >
                    Lihat Detail →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL DETAIL ================= */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setSelected(null); setRejectNote(""); }}>
          <div className="bg-white w-[600px] rounded-2xl p-6 shadow-xl relative" onClick={(e) => e.stopPropagation()}>

            {/* CLOSE */}
            <button
  onClick={() => {
    setSelected(null)
    setRejectNote("")
  }}
  className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 text-xl font-bold transition"
>
  ✕
</button>

            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
              Detail Bukti Transfer
            </h2>

            {/* USER (DINAMIS) */}
            <div className="mb-4">
              <p className="font-semibold text-[#0F172A]">
                {selected.buyer}
              </p>
              <p className="text-sm text-gray-500">
                {selected.buyerEmail}
              </p>
            </div>

            {/* INPUT */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Buyer</p>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  value={selected.buyer}
                  readOnly
                />
              </div>

              <div>
                <p className="text-gray-400 mb-1">Jastiper</p>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  value={selected.jastiper}
                  readOnly
                />
              </div>
            </div>

            {/* DETAIL */}
            <div className="mt-5 text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total dibayar</span>
                <span className="font-semibold text-gray-900">
                  {selected.amount}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Metode</span>
                <span className="font-semibold text-gray-900">
                  {selected.method}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Waktu transfer</span>
                <span className="font-semibold text-gray-900">
                  15 April 2026, 21:01
                </span>
              </div>
            </div>

            {/* IMAGE */}
            <div className="mt-5">
              <p className="text-sm text-gray-400 mb-2">
                Bukti Transfer
              </p>

              <img
                src={selected.image || "/bukti-tf-dummy.svg"}
                onClick={() => setPreviewImage(selected.image)}
                className="w-full rounded-xl border cursor-pointer"
              />

              <p className="text-center text-sm text-gray-500 mt-1">
                Klik untuk Perbesar
              </p>
            </div>

            {/* CATATAN */}
            {selected.status === "Menunggu" && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-1">
                  Catatan (wajib diisi jika menolak)
                </p>

                <input
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Contoh: Nominal tidak sesuai"
                  className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
                />
              </div>
            )}

            {/* STATUS */}
            {selected.status === "Disetujui" && (
              <div className="mt-4 bg-green-100 text-green-700 p-3 rounded-lg text-sm">
                ✔ Bukti pembayaran sudah disetujui oleh Admin
              </div>
            )}

            {selected.status === "Ditolak" && (
              <div className="mt-4 bg-red-100 text-red-600 p-3 rounded-lg text-sm">
                ✖ {selected.reason || "Pembayaran ditolak"}
              </div>
            )}

            {/* ACTION */}
            {selected.status === "Menunggu" && (
              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={() => setConfirmType("reject")}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Tolak
                </button>

                <button
                  onClick={() => setConfirmType("approve")}
                  className="px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488]"
                >
                  Setujui
                </button>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= CONFIRM ================= */}
      {confirmType && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white px-6 py-5 rounded-xl text-center shadow-xl w-[320px]">

            <p className="mb-5 text-gray-800 font-medium">
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
                  if (confirmType === "reject" && !rejectNote) {
                    alert("Catatan wajib diisi!")
                    return
                  }
                  if (confirmType === "approve") {
                    const updatedData = data.map(item =>
                      item.id === selected!.id ? { ...item, status: "Disetujui" as Status } : item
                    )
                    setData(updatedData)
                    setActiveTab("Disetujui")
                  } else if (confirmType === "reject") {
                    const updatedData = data.map(item =>
                      item.id === selected!.id ? { ...item, status: "Ditolak" as Status, reason: rejectNote } : item
                    )
                    setData(updatedData)
                    setActiveTab("Ditolak")
                  }
                  setConfirmType(null)
                  setSelected(null)
                  setRejectNote("")
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

      {/* ================= IMAGE PREVIEW ================= */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-w-[90%] max-h-[90%] rounded-xl"
          />
        </div>
      )}
    </div>
  )
}