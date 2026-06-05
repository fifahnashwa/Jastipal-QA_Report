# Laporan Pengujian Fungsional — Jastipal

**Jastipal** — Escrow-Protected Jastip Marketplace

| | |
|---|---|
| **Nama Proyek** | Jastipal MVP — Escrow Jastip Platform |
| **Jenis Pengujian** | Manual Functional Testing (Grey-Box) |
| **Platform** | Next.js 14 (App Router) + Supabase + iPaymu + Vercel |
| **Periode Pengujian** | 23 Mei 2026 – 25 Mei 2026 |
| **Versi Dokumen** | Final |

---

## 1. Ringkasan Eksekutif

Dokumen ini merupakan laporan hasil pengujian fungsional terhadap aplikasi Jastipal, platform jasa titip berbasis escrow yang menghubungkan Buyer dan Jastiper. Pengujian dilakukan secara manual dengan pendekatan grey-box testing (dijalankan dari sisi antarmuka pengguna dengan referensi terhadap kode sumber dan basis data untuk memverifikasi kebenaran hasil).

Pengujian mencakup seluruh alur utama aplikasi: autentikasi, manajemen peran, penelusuran produk dan permintaan, pembuatan listing dan trip, alur pesanan kedua flow (Flow A dan Flow B), pembayaran via iPaymu, sistem escrow, unggah bukti pembelian, pengajuan sengketa, dan panel administrasi.

| Total Test Case | PASS | FAIL | SKIP |
|---|---|---|---|
| **179** | **162** | **8** | **9** |

- **PASS rate: 90,5%**
- 10 temuan terdokumentasi
- 9 TC tidak dapat dieksekusi (SKIP/DEAD)

> Status SKIP mencakup test case yang tidak dapat dieksekusi karena fitur tidak dapat diakses dari antarmuka normal (dead code/dead flow), keterbatasan lingkungan pengujian, maupun kondisi data yang tidak dapat dipenuhi selama periode pengujian.

---

## 2. Tujuan Pengujian

- Memverifikasi bahwa seluruh fitur utama (Must) berjalan sesuai requirement yang disepakati, dari sisi antarmuka pengguna.
- Mengidentifikasi dan mendokumentasikan bug, dead code, dan isu UX sebelum aplikasi digunakan oleh pengguna nyata.
- Memastikan keamanan dasar: pengguna tidak dapat mengakses data atau fungsi milik pengguna lain.
- Memastikan alur transaksi end-to-end berjalan benar: registrasi → buat request/listing → bayar via iPaymu → konfirmasi terima → escrow release.
- Mengidentifikasi kode atau halaman yang sudah tidak aktif (dead code) agar dapat dibersihkan dari codebase.

---

## 3. Ruang Lingkup Pengujian

### 3.1 Yang Diuji

| No. | Modul | Cakupan |
|---|---|---|
| 1 | Autentikasi | Login email/password, Google OAuth, registrasi, frozen account, redirect admin, session guard |
| 2 | Dashboard & Manajemen Peran | Role-based view Buyer vs Jastiper, switch role, aktivasi Jastiper, navbar per role, logout |
| 3 | Browse Produk & Jelajah Permintaan | Jelajahi produk dari dashboard Buyer, filter negara, sort, search; Jastiper menjelajah request Buyer; kalkulasi platform fee 5% |
| 4 | Permintaan Buyer | Buat request baru (courier/meetup), validasi input, daftar permintaan, filter tab, expired payment |
| 5 | Listing & Trip Jastiper | Buat trip, tambah dan edit produk, manajemen stok, detail trip, access control per Jastiper |
| 6 | Alur Pesanan | Flow A (dari request), Flow B (dari listing), perubahan status, konfirmasi terima, tombol aksi per role dan status |
| 7 | Pembayaran (iPaymu) | Generate sesi QRIS, redirect sandbox, status order setelah pembayaran, webhook callback |
| 8 | Unggah Bukti Pembelian | Upload struk, foto toko, boarding pass, input nomor resi, access control halaman proof |
| 9 | Sengketa (Dispute) | Ajukan sengketa, alasan preset dan custom, duplikasi, field rekening refund, access control |
| 10 | Panel Administrasi | KYC Jastiper, resolusi sengketa, kelola pengguna (freeze/unfreeze), pencairan dana |
| 11 | Keamanan & Edge Case | Input XSS, akses tidak sah, race condition stok, duplikasi pesanan, double submit |

### 3.2 Yang Tidak Diuji

- Performance testing dan load testing
- Automated testing (Playwright / Cypress / unit test)
- Pengujian API secara langsung menggunakan tools seperti Postman
- Kompatibilitas lintas browser secara menyeluruh — pengujian dilakukan pada Google Chrome versi terbaru
- Integrasi end-to-end webhook iPaymu (tidak dapat disimulasikan penuh di lingkungan sandbox)
- Halaman dan flow yang dikategorikan Dead (lihat Bagian 6.2): `/listings`, `/orders/:id/pay`, `/admin/payments`

---

## 4. Pendekatan & Metodologi

Pengujian dilakukan secara manual dengan pendekatan grey-box testing, dijalankan dari sisi antarmuka pengguna (black-box) dengan referensi terhadap kode sumber dan struktur basis data untuk memverifikasi kebenaran expected result dan menyusun test case yang akurat.

### 4.1 Jenis Pengujian

| Jenis Testing | Deskripsi | Contoh Skenario |
|---|---|---|
| Functional Testing | Memverifikasi setiap fitur berjalan sesuai requirement dari sisi pengguna | Buyer buat request, Jastiper ambil, Buyer bayar, status berubah |
| Negative Testing | Menguji respons sistem terhadap input tidak valid atau aksi di luar alur | Login password salah, tampil pesan error yang tepat |
| Edge Case Testing | Menguji kondisi batas dan skenario tidak umum | Order produk stok=1 oleh dua pengguna secara bersamaan |
| Security Testing | Memastikan akses data terotorisasi dan data terlindungi | Buyer tidak bisa akses order milik pengguna lain |
| Code Review Finding | Temuan yang diidentifikasi dari membaca kode, bukan hanya dari eksekusi test case | iPaymu notify handler format mismatch (BUG-02) |

### 4.2 Tools & Lingkungan Pengujian

| Komponen | Detail |
|---|---|
| **URL Aplikasi** | https://jastipal.vercel.app/ |
| **Browser** | Google Chrome (versi terbaru) |
| **Lingkungan** | Production (Vercel) dengan data testing pada akun khusus QA |
| **Database Inspection** | Supabase Dashboard |
| **Payment Sandbox** | iPaymu Sandbox Environment |

---

## 5. Hasil Pengujian per Modul

| No. | Modul | Total | PASS | FAIL | SKIP | Catatan |
|---|---|---|---|---|---|---|
| 1 | Autentikasi | 17 | 16 | 1 | — | TC-AUTH-09: sistem mengirim email verifikasi ulang, bukan pesan error email sudah terdaftar (BUG-10) |
| 2 | Dashboard & Manajemen Peran | 18 | 17 | — | 1 | TC-SJ-06: skip — akses halaman switch-to-jastiper untuk user yang sudah Jastiper adalah by design |
| 3 | Browse Produk & Jelajah Permintaan | 25 | 23 | 1 | 1 | TC-BL-02: pencarian nama Jastiper tidak berfungsi (BUG-09) |
| 4 | Permintaan Buyer | 15 | 15 | — | — | Seluruh test case lulus |
| 5 | Listing & Trip Jastiper | 24 | 22 | 1 | 1 | TC-TD-02: edit produk tanpa validasi nama dan harga (BUG-06) |
| 6 | Alur Pesanan | 15 | 12 | 1 | 2 | TC-ORD-15: duplikasi pesanan via 2 tab browser (BUG-01); TC-ORD-07: batalkan tanpa konfirmasi dialog (UX-01) |
| 7 | Pembayaran (iPaymu) | 5 | 4 | 1 | — | TC-PAY-08: webhook notify handler tidak dapat memproses format iPaymu (BUG-02) |
| 8 | Unggah Bukti Pembelian | 9 | 8 | — | 1 | TC-UP-09: fungsi konfirmasi meetup tidak terpasang di antarmuka (DEAD-02) |
| 9 | Sengketa (Dispute) | 8 | 7 | 1 | — | TC-DS-05: escrow langsung berstatus released setelah pembayaran (BUG-03) |
| 10 | Panel Administrasi | 33 | 31 | — | 2 | TC-DIS-05 dan TC-ADI-07: kondisi data tidak terpenuhi saat pengujian |
| 11 | Keamanan & Edge Case | 10 | 7 | 2 | 1 | TC-SEC-01: XSS tersimpan di DB (BUG-04); TC-SEC-07: race condition stok (BUG-05) |
| | **TOTAL** | **179** | **162** | **8** | **9** | PASS rate: 90,5% |

---

## 6. Temuan Utama

### 6.1 Bug & Isu Fungsional

#### BUG-01 — Kritikal: Duplikasi pesanan via dua tab browser

**Dampak:** Pembeli dapat membuat dua pesanan untuk produk stok=1 melalui dua tab browser. Validasi stok hanya dilakukan di sisi browser dan tidak divalidasi ulang di server. Keduanya dapat dibayar, memaksa Jastiper memenuhi dua pesanan dari satu barang.

**Rekomendasi:** Tambahkan validasi stok di sisi server sebelum menyimpan pesanan, atau gunakan atomic transaction di database.

---

#### BUG-02 — Kritikal: Notifikasi pembayaran iPaymu tidak diproses

**Dampak:** Flow pembayaran via redirect normal tetap berjalan — order ter-update ke `processing` saat buyer diarahkan kembali ke aplikasi. Namun tanpa webhook sebagai backup, jika buyer menutup browser atau koneksi terputus sebelum redirect selesai, order akan stuck di status `waiting_payment` selamanya tanpa mekanisme pemulihan otomatis.

**Rekomendasi:** Ganti `request.json()` dengan `request.formData()` dan petakan `formData.get("reference_id")` ke `orderId` di handler `/api/ipaymu/notify`.

---

#### BUG-03 — Tinggi: Status escrow DB misleading setelah pembayaran

**Dampak:** `released_at` terisi di saat yang sama dengan `paid_at`, padahal dana fisik baru bisa dicairkan admin setelah order berstatus `delivered` dan admin menekan "Tandai Sudah Dicairkan". Kondisi DB yang tidak akurat ini berpotensi menyebabkan kebingungan dan error logika jika alur disbursement diotomasi di masa mendatang.

**Rekomendasi:** Di handler `/api/ipaymu/return`, ubah update escrow menjadi `status="held"`, `paid_at=now()`, `released_at=NULL`. Field `released_at` dan status `"released"` hanya diisi saat buyer mengkonfirmasi penerimaan (`handleDelivered`).

---

#### BUG-04 — Tinggi: Input berbahaya (XSS) tersimpan di database

**Dampak:** Input mengandung karakter HTML dapat tersimpan di database tanpa sanitasi. React mencegah eksekusi saat ini, namun berpotensi menjadi celah keamanan jika ada penggunaan `dangerouslySetInnerHTML` di masa mendatang.

**Rekomendasi:** Tambahkan sanitasi input di sisi server untuk seluruh field teks yang dapat diinput pengguna.

---

#### BUG-05 — Tinggi: Race condition stok — dua pengguna order bersamaan

**Dampak:** Dua pengguna dapat memesan produk stok=1 secara bersamaan dan keduanya lolos karena tidak ada validasi stok di level database.

**Rekomendasi:** Implementasikan atomic stock decrement: `UPDATE listings SET stock=stock-qty WHERE id=X AND stock>=qty`, atau gunakan Supabase Edge Function.

---

#### BUG-06 — Tinggi: Form edit produk tidak memvalidasi input

**Dampak:** Nama produk dapat disimpan kosong dan harga dapat di-set ke Rp 0. Tidak ada pesan error ke pengguna. Produk dengan data tidak valid tampil di halaman penelusuran Buyer.

**Rekomendasi:** Tambahkan validasi yang sama dengan form tambah produk: nama wajib diisi, harga harus lebih dari Rp 0.

---

#### BUG-07 — Sedang: Penandaan field wajib (*) tidak konsisten

**Dampak:** Field wajib di form permintaan tidak ditandai dengan tanda bintang. Pesan error juga generik tanpa menyebutkan field spesifik yang kosong.

**Rekomendasi:** Tambahkan tanda `*` di semua label field wajib dan perbarui pesan error agar spesifik per field.

---

#### BUG-08 — Sedang: Input budget negatif dapat tersimpan

**Dampak:** Buyer dapat memasukkan nilai negatif pada field Maksimal Budget (contoh: -29000) dan tersimpan ke database.

**Rekomendasi:** Tambahkan validasi nilai minimum > 0 di `handleSubmit`.

---

#### BUG-09 — Sedang: Pencarian nama Jastiper tidak berfungsi

**Dampak:** Placeholder kolom pencarian menyebutkan "cari jastiper" namun logika filter tidak menyertakan nama Jastiper. Hanya judul trip, negara, dan deskripsi yang difilter.

**Rekomendasi:** Tambahkan nama Jastiper dalam logika pencarian, atau perbarui teks placeholder agar tidak menyesatkan pengguna.

---

#### BUG-10 — Sedang: Registrasi dengan email terdaftar tidak menampilkan pesan error

**Dampak:** Buyer yang mencoba mendaftar menggunakan email yang sudah terdaftar tidak mendapat feedback apapun — pengguna tidak tahu harus melakukan apa selanjutnya.

**Rekomendasi:** Tangkap kondisi duplicate email dari respons Supabase dan tampilkan pesan yang jelas, misalnya: *"Email ini sudah terdaftar. Silakan login atau gunakan email lain."*

---

### 6.2 Fitur Tidak Aktif (Dead Code)

Fitur-fitur berikut masih ada dalam kode program namun tidak dapat diakses atau tidak berfungsi dalam alur aplikasi saat ini.

| ID | Fitur | Keterangan | Rekomendasi |
|---|---|---|---|
| DEAD-01 | Halaman pembayaran manual (`/orders/:id/pay`) | Masih ada di kode namun tidak ada satu pun tautan yang mengarah ke sana | Hapus dari codebase atau dokumentasikan sebagai deprecated |
| DEAD-02 | Tombol konfirmasi meetup selesai (Jastiper) | Fungsi `handleMeetupDone` terdefinisi namun tidak dipasang ke tombol manapun | Implementasikan tombol di `renderActions`, atau hapus fungsi |
| DEAD-03 | Verifikasi pembayaran manual di panel admin | Menu Verifikasi Bayar di panel admin selalu kosong karena `payment_proof_url` tidak pernah terisi dalam alur iPaymu | Evaluasi relevansi halaman ini dan pertimbangkan untuk menghapusnya |
| DEAD-04 | Badge "Direview" di halaman pesanan | Kondisi `waiting_payment && payment_proof_url != null` tidak pernah tercapai dalam flow normal | Hapus kondisi dan badge ini dari UI |
| DEAD-05 | Halaman My Listings (`/listings`) | Sisa alur lama sebelum sistem trip diimplementasikan. Tidak ada entry point aktif | Pertimbangkan menghapus halaman ini dari codebase |

### 6.3 Isu UX & Tampilan

| ID | Isu | Keterangan |
|---|---|---|---|
| UX-01 | Pembatalan pesanan tanpa konfirmasi dialog | Tombol Batalkan langsung mengeksekusi pembatalan tanpa dialog konfirmasi |
| UX-02 | Pencarian admin tidak menggunakan debounce | Kolom pencarian di halaman kelola pengguna memicu query ke database sejak karakter pertama diketik |

---

## 7. Rekomendasi

### 7.1 Wajib Diperbaiki Sebelum Peluncuran

Temuan berikut berdampak langsung pada keamanan transaksi dan kepercayaan pengguna:

- **BUG-01** — Tambahkan validasi stok di sisi server untuk mencegah duplikasi pesanan pada produk dengan stok terbatas
- **BUG-02** — Perbaiki handler notifikasi iPaymu: ganti `request.json()` dengan form-urlencoded parsing, petakan `reference_id` ke `orderId`
- **BUG-03** — Perbaiki handler `/api/ipaymu/return`: set escrow `status="held"` saat bayar, bukan `"released"`. `released_at` hanya diisi saat Buyer konfirmasi terima
- **BUG-04** — Implementasikan sanitasi input server-side untuk mencegah karakter berbahaya tersimpan di database
- **BUG-05** — Implementasikan atomic stock decrement di database untuk mencegah race condition pada stok terbatas

### 7.2 Dapat Diperbaiki Pasca Peluncuran

- **BUG-06** — Tambahkan validasi pada form edit produk: nama tidak boleh kosong, harga harus lebih dari Rp 0
- **BUG-07** — Standardisasi penanda field wajib (`*`) di seluruh formulir dan perbarui pesan error
- **BUG-08** — Tambahkan validasi nilai minimum pada field Maksimal Budget
- **BUG-09** — Perbaiki logika pencarian agar mencakup nama Jastiper, atau perbarui teks placeholder
- **BUG-10** — Tambahkan penanganan respons duplicate email dari Supabase
- **UX-01** — Tambahkan dialog konfirmasi sebelum pembatalan pesanan diproses
- **UX-02** — Implementasikan debounce pada input pencarian admin
- **DEAD-02** — Implementasikan tombol konfirmasi meetup selesai untuk Jastiper, atau hapus kode yang tidak digunakan
- **DEAD-01, 03, 04, 05** — Bersihkan halaman dan logika yang sudah tidak aktif dari codebase

---

## 8. Kesimpulan

Dari total 179 test case yang direncanakan, **162 berhasil lulus (PASS)** dengan PASS rate 90,5%, 8 menghasilkan temuan yang memerlukan perbaikan (FAIL), dan 9 dilewati karena keterbatasan fitur atau lingkungan pengujian (SKIP).

Secara keseluruhan, sebagian besar fitur aplikasi telah berjalan dengan baik. Autentikasi, manajemen peran, penelusuran produk, pembuatan pesanan, unggah bukti pembelian, pengajuan sengketa, dan panel administrasi berfungsi sesuai ekspektasi.

Namun demikian, ditemukan **dua temuan kritikal** yang berkaitan langsung dengan keandalan sistem:

1. Mekanisme escrow memiliki cacat di level database: status released_at terisi bersamaan dengan paid_at saat pembayaran masuk, sebelum buyer mengkonfirmasi penerimaan. Meskipun pencairan dana fisik tetap membutuhkan aksi manual admin, kondisi DB yang tidak akurat ini berpotensi menyebabkan error logika jika alur disbursement diotomasi di masa mendatang
2. Celah duplikasi pesanan berpotensi merugikan Jastiper yang harus memenuhi dua pesanan dari satu barang.

> Dengan kondisi saat ini, aplikasi Jastipal **belum direkomendasikan untuk diluncurkan kepada publik**. Perbaikan terhadap BUG-01 dan BUG-02 merupakan prioritas mutlak yang harus diselesaikan dan diverifikasi ulang sebelum peluncuran. Setelah kedua temuan tersebut diperbaiki, aplikasi dapat dipertimbangkan untuk memasuki tahap soft launch dengan pengguna terbatas.
