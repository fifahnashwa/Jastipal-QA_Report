'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [stats, setStats] = useState({
    pendingKyc: 0,
    pendingPayment: 0,
    pendingDisputes: 0,
    totalUsers: 0,
    activeOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [
        { count: pendingKyc },
        { count: pendingPayment },
        { count: pendingDisputes },
        { count: totalUsers },
        { count: activeOrders },
      ] = await Promise.all([
        supabase.from('jastiper_profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
        supabase.from('escrow_transactions').select('*', { count: 'exact', head: true }).not('payment_proof_url', 'is', null).eq('status', 'held'),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['waiting_payment', 'processing', 'shipped']),
      ])

      setStats({
        pendingKyc: pendingKyc ?? 0,
        pendingPayment: pendingPayment ?? 0,
        pendingDisputes: pendingDisputes ?? 0,
        totalUsers: totalUsers ?? 0,
        activeOrders: activeOrders ?? 0,
      })
      setLoading(false)
    }
    init()
  }, [])

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1280px] mx-auto px-6 py-10 w-full">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-[24px] font-semibold text-[#0F172A]">Admin Dashboard</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Overview platform Jastipal</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-10">

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'KYC Menunggu', value: stats.pendingKyc, href: '/admin/kyc', urgent: stats.pendingKyc > 0 },
                { label: 'Bukti Transfer', value: stats.pendingPayment, href: '/admin/payments', urgent: stats.pendingPayment > 0 },
                { label: 'Disputes', value: stats.pendingDisputes, href: '/admin/disputes', urgent: stats.pendingDisputes > 0 },
                { label: 'Total User', value: stats.totalUsers, href: null, urgent: false },
                { label: 'Order Aktif', value: stats.activeOrders, href: null, urgent: false },
              ].map(card => (
                <div
                  key={card.label}
                  onClick={() => card.href && router.push(card.href)}
                  className={`bg-white border rounded-[12px] px-5 py-4 ${card.href ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm transition' : ''} ${card.urgent ? 'border-red-400 ring-2 ring-red-400' : 'border-[#E2E8F0]'}`}
                >
                  <p className="text-[14px] text-[#64748B]">{card.label}</p>
                  <h2 className="text-[28px] font-semibold mt-2 text-[#0F172A]">{card.value}</h2>
                  {card.urgent && <p className="text-xs text-red-500 mt-1 font-medium">Perlu ditindak</p>}
                </div>
              ))}
            </div>

            {/* AKSI CEPAT */}
            <div>
              <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">Aksi Cepat</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">

                {/* KYC */}
                <div
                  onClick={() => router.push('/admin/kyc')}
                  className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col hover:border-teal-400 hover:shadow-sm hover:scale-[1.01] transition cursor-pointer"
                >
                  <div className="w-12 h-12 bg-[#14B8A6] rounded-[10px] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-[#0F172A] text-[16px]">Verifikasi KYC</p>
                  <p className="text-[14px] text-[#64748B] mt-1">{stats.pendingKyc} pengajuan menunggu</p>
                </div>

                {/* PAYMENT */}
                <div
                  onClick={() => router.push('/admin/payments')}
                  className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col hover:border-teal-400 hover:shadow-sm hover:scale-[1.01] transition cursor-pointer"
                >
                  <div className="w-12 h-12 bg-[#14B8A6] rounded-[10px] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </div>
                  <p className="font-semibold text-[#0F172A] text-[16px]">Verifikasi Pembayaran</p>
                  <p className="text-[14px] text-[#64748B] mt-1">{stats.pendingPayment} bukti transfer menunggu</p>
                </div>

                {/* DISPUTES */}
                <div
                  onClick={() => router.push('/admin/disputes')}
                  className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col hover:border-teal-400 hover:shadow-sm hover:scale-[1.01] transition cursor-pointer"
                >
                  <div className="w-12 h-12 bg-[#14B8A6] rounded-[10px] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <p className="font-semibold text-[#0F172A] text-[16px]">Disputes</p>
                  <p className="text-[14px] text-[#64748B] mt-1">{stats.pendingDisputes} dispute menunggu</p>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}