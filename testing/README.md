# Jastipal — Hasil Pengujian Fungsional

Folder ini berisi dokumentasi lengkap hasil pengujian fungsional terhadap aplikasi **Jastipal** — platform jasa titip berbasis escrow yang menghubungkan Buyer dan Jastiper.

> Pengujian dilakukan secara manual dengan pendekatan **grey-box testing**: dijalankan dari sisi antarmuka pengguna dengan referensi terhadap kode sumber dan basis data.

---

## Ringkasan Hasil

| Metrik | Nilai |
|---|---|
| **Total Test Case** | 179 |
| PASS | 162 |
| FAIL | 8 |
| SKIP | 9 |
| **PASS Rate** | **90,5%** |

| Kategori Temuan | Jumlah |
|---|---|
| Bug Kritikal | 2 (BUG-01, BUG-02) |
| Bug Tinggi | 4 (BUG-03, BUG-04, BUG-05, BUG-06) |
| Bug Sedang | 4 (BUG-07, BUG-08, BUG-09, BUG-10) |
| Dead Code / Dead Flow | 5 (DEAD-01 s/d DEAD-05) |
| Isu UX | 2 (UX-01, UX-02) |

---

## Temuan Kritikal

### BUG-01 — Duplikasi pesanan via 2 tab browser
Buyer dapat membuat dua pesanan untuk produk stok=1 melalui dua tab browser. Validasi stok hanya dilakukan di sisi browser — tidak ada pengecekan ulang di server.

### BUG-02 — Webhook iPaymu tidak diproses
Handler `/api/ipaymu/notify` menggunakan `request.json()` + field `orderId`, sementara iPaymu mengirim `application/x-www-form-urlencoded` dengan field `reference_id`. Jika buyer menutup browser sebelum redirect selesai, order stuck di `waiting_payment` selamanya.

---

## Isi Folder

| File | Deskripsi |
|---|---|
| [`LAPORAN_PENGUJIAN.md`](./LAPORAN_PENGUJIAN.md) | Laporan pengujian lengkap: metodologi, hasil per modul, seluruh temuan bug & rekomendasi |
| [`TEST_CASES.md`](./TEST_CASES.md) | Ringkasan & index 179 test case beserta status hasil eksekusi |
| `Jastipal_TestCases.xlsx` | File spreadsheet asli berisi detail seluruh test case |

---

## Info Pengujian

| | |
|---|---|
| **Periode** | 23 Mei 2026 – 25 Mei 2026 |
| **Platform** | Next.js 14 (App Router) + Supabase + iPaymu + Vercel |
| **URL Aplikasi** | https://jastipal.vercel.app/ |
| **Jenis Testing** | Manual Functional Testing (Grey-Box) |
| **Browser** | Google Chrome (versi terbaru) |
| **Lingkungan** | Production (Vercel) + akun khusus QA |
