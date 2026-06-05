# Test Cases — Jastipal Functional Testing

Dokumen ini adalah ringkasan dan index dari 179 test case yang terdokumentasi lengkap di file `Jastipal_TestCases.xlsx`. Setiap baris pada tabel di bawah mencantumkan ID, nama, tipe, prioritas, dan status hasil eksekusi.

---

## Statistik Test Case

| Tipe | Jumlah |
|---|---|
| Happy Path | 96 |
| Edge Case | 38 |
| Negative | 45 |
| **Total** | **179** |

| Prioritas | Jumlah |
|---|---|
| High Priority | 120 |
| Medium / Low | 59 |

---

## Status Legend

| Status | Arti |
|---|---|
| PASS | Test case lulus sesuai expected result |
| FAIL | Ditemukan bug atau perilaku yang tidak sesuai |
| SKIP | Tidak dapat dieksekusi (kondisi data / dead flow) |
| DEAD | Fitur tidak aktif / dead code — test case tidak relevan |
| UX-BUG | Bukan bug fungsional, tapi berpotensi membingungkan pengguna |

---

## Modul 1 — Autentikasi (17 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-AUTH-01 | Login berhasil – email & password valid | Happy | High | PASS |
| TC-AUTH-02 | Login gagal – password salah | Negative | High | PASS |
| TC-AUTH-03 | Login gagal – email tidak terdaftar | Negative | High | PASS |
| TC-AUTH-04 | Login dengan akun frozen (is_frozen=true) | Negative | High | PASS |
| TC-AUTH-05 | URL param `?error=frozen` menampilkan pesan langsung | Edge | Medium | PASS |
| TC-AUTH-06 | Login via Google OAuth berhasil | Happy | High | PASS |
| TC-AUTH-07 | Login dengan field kosong (email+password) | Negative | Medium | PASS |
| TC-AUTH-08 | Register berhasil – email baru | Happy | High | PASS |
| TC-AUTH-09 | Register gagal – email sudah terdaftar | Negative | High | FAIL → [BUG-10] |
| TC-AUTH-10 | Register password terlalu pendek | Negative | Medium | PASS |
| TC-AUTH-11 | Register Google OAuth → user dibuat sebagai Buyer | Happy | High | PASS |
| TC-AUTH-12 | Admin login → redirect ke /admin | Happy | High | PASS |
| TC-AUTH-13 | Akses /dashboard tanpa login → redirect /login | Negative | High | PASS |
| TC-AUTH-14 | Tombol 'Masuk' disabled saat loading | Edge | Low | PASS |
| TC-AUTH-15 | Popup verifikasi email – klik 'Ke halaman masuk' | Happy | Medium | PASS |
| TC-AUTH-16 | Field email dengan format tidak valid | Negative | Medium | PASS |
| TC-AUTH-17 | Akses /login saat sudah login → redirect /dashboard | Edge | Medium | PASS |

## Modul 2 — Dashboard & Manajemen Peran (18 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-DASH-01 | Dashboard Buyer tampil trip & produk | Happy | High | PASS |
| TC-DASH-02 | Dashboard Jastiper tampil request buyer | Happy | High | PASS |
| TC-DASH-03 | Loading spinner saat activeRole belum ada | Edge | Low | PASS |
| TC-DASH-04 | Navbar Buyer tampil menu yang benar | Happy | High | PASS |
| TC-DASH-05 | Navbar Jastiper tampil menu yang benar | Happy | High | PASS |
| TC-DASH-06 | Switch role dari Buyer ke Jastiper di navbar | Happy | High | PASS |
| TC-DASH-07 | Logout dari navbar | Happy | High | PASS |
| TC-SJ-01 | Daftar sebagai Jastiper berhasil – semua field + KTP + selfie | Happy | High | PASS |
| TC-SJ-02 | Gagal – salah satu foto tidak diupload | Negative | High | PASS |
| TC-SJ-03 | Gagal – field wajib kosong | Negative | High | PASS |
| TC-SJ-04 | Navigasi dari navbar 'Daftar Jastiper' | Happy | Medium | PASS |
| TC-SJ-05 | Setelah daftar, KYC status = pending | Edge | High | PASS |
| TC-SJ-06 | User yang sudah Jastiper bisa akses halaman switch-to-jastiper | Edge | Medium | SKIP |
| TC-PR-01 | Edit nama & nomor telepon berhasil | Happy | Medium | PASS |
| TC-PR-02 | Upload avatar berhasil | Happy | Medium | PASS |
| TC-PR-03 | User yang sudah Jastiper bisa edit profil Jastiper | Happy | Medium | PASS |
| TC-PR-04 | Switch role dari Profile (toggle) | Happy | High | PASS |
| TC-PR-05 | Data terbaru tampil setelah update | Happy | Medium | PASS |

## Modul 3 — Browse Produk & Jelajah Permintaan (25 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-BL-01 | Daftar listing tampil – ada trip aktif | Happy | High | PASS |
| TC-BL-02 | Search trip berdasarkan title/negara/deskripsi | Happy | Medium | FAIL → [BUG-09] |
| TC-BL-03 | Filter by negara (dropdown) | Happy | Medium | PASS |
| TC-BL-04 | Sort by 'Segera Tiba' | Happy | Low | PASS |
| TC-BL-05 | Order modal muncul saat klik tombol order produk | Happy | High | PASS |
| TC-BL-06 | Order berhasil – kota & alamat diisi | Happy | High | PASS |
| TC-BL-07 | Kalkulasi: sekota (25rb) vs beda kota (50rb) | Edge | High | PASS |
| TC-BL-08 | Platform fee 5% dihitung dari total_price_idr × qty | Edge | High | PASS |
| TC-BL-09 | Order gagal – alamat kosong | Negative | High | PASS |
| TC-BL-10 | Order gagal – kota kosong | Negative | High | PASS |
| TC-BL-11 | Quantity tidak bisa melebihi stok produk | Negative | Medium | PASS |
| TC-BL-12 | Produk dengan stock=0 tidak muncul | Edge | Medium | PASS |
| TC-BL-13 | User tidak login → redirect /login | Negative | High | PASS |
| TC-BL-14 | Empty state – tidak ada trip/listing tersedia | Edge | Medium | SKIP |
| TC-DJR-01 | Daftar request buyer tampil di dashboard Jastiper | Happy | High | PASS |
| TC-DJR-02 | Filter delivery_pref (courier/meetup) | Happy | Medium | PASS |
| TC-DJR-03 | Filter deadline 'Urgent' (≤3 hari) | Edge | Medium | PASS |
| TC-DJR-04 | Sort by budget tertinggi | Happy | Low | PASS |
| TC-DJR-05 | Search request berdasarkan nama produk | Happy | Medium | PASS |
| TC-DJR-06 | Modal ambil request tampil saat klik request | Happy | High | PASS |
| TC-DJR-07 | Ambil request berhasil – harga fix valid | Happy | High | PASS |
| TC-DJR-08 | Ambil request gagal – harga melebihi max budget | Negative | High | PASS |
| TC-DJR-09 | Ambil request gagal – harga kosong | Negative | High | PASS |
| TC-DJR-10 | Buyer (bukan Jastiper) tidak bisa akses dashboard Jastiper | Negative | High | PASS |
| TC-DJR-10B | Ambil request gagal – harga tidak valid (nol atau bukan angka) | Negative | High | PASS |

## Modul 4 — Permintaan Buyer (15 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-MR-01 | Tab 'Menunggu' tampil request status open | Happy | High | PASS |
| TC-MR-02 | Tab 'Tagihan' tampil request yang sudah diambil Jastiper | Happy | High | PASS |
| TC-MR-03 | Klik 'Bayar Sekarang' – redirect ke iPaymu | Happy | High | PASS |
| TC-MR-04 | Tab 'Dibatalkan' tampil request cancelled | Happy | Medium | PASS |
| TC-MR-05 | Buat request baru dari tombol '+ Tambah Request' | Happy | High | PASS |
| TC-MR-06 | Empty state tiap tab | Edge | Low | PASS |
| TC-MR-07 | Payment expired – label "Kadaluarsa" tampil | Edge | High | PASS |
| TC-NR-01 | Buat request berhasil – courier, semua field diisi | Happy | High | PASS |
| TC-NR-02 | Buat request berhasil – meetup, isi lokasi & waktu | Happy | High | PASS |
| TC-NR-03 | Gagal – product_url kosong | Negative | High | PASS |
| TC-NR-04 | Gagal – pilih courier tapi shipping_address kosong | Negative | High | PASS |
| TC-NR-05 | Gagal – pilih meetup tapi lokasi/waktu kosong | Negative | High | PASS |
| TC-NR-06 | Toggle delivery_pref mengubah field yang muncul | Edge | Medium | PASS |
| TC-NR-07 | Quantity minimal 1 | Edge | Medium | PASS |
| TC-NR-08 | Akses /requests/new tanpa login → redirect | Negative | High | PASS |

## Modul 5 — Listing & Trip Jastiper (24 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-MT-01 | Daftar trip Jastiper tampil di tab Open | Happy | High | PASS |
| TC-MT-02 | Tab 'Closed' tampil trip yang ditutup | Happy | Medium | PASS |
| TC-MT-03 | Klik card trip → navigasi ke trip detail | Happy | Medium | PASS |
| TC-MT-04 | Buat trip baru dari tombol di header | Happy | High | PASS |
| TC-MT-05 | Empty state – belum ada trip | Edge | Low | SKIP |
| TC-MT-06 | Buyer (bukan Jastiper) tidak bisa akses /trips | Negative | High | PASS |
| TC-NT-01 | Buat trip berhasil – semua field diisi | Happy | High | PASS |
| TC-NT-02 | Upload gambar trip berhasil | Happy | Medium | PASS |
| TC-NT-03 | Gagal – title kosong | Negative | High | PASS |
| TC-NT-04 | Gagal – trip_country kosong | Negative | High | PASS |
| TC-NT-05 | Arrival_city wajib diisi – error jika kosong | Negative | Medium | PASS |
| TC-NT-06 | Buyer tidak bisa akses /trips/new | Negative | High | PASS |
| TC-NT-07 | Preview gambar tampil sebelum submit | Edge | Low | PASS |
| TC-TD-01 | Detail trip tampil – title, negara, produk | Happy | High | PASS |
| TC-TD-02 | Edit produk inline di trip detail | Happy | High | FAIL → [BUG-06] |
| TC-TD-03 | Hapus produk dari trip | Happy | Medium | PASS |
| TC-TD-04 | Navigasi ke tambah produk | Happy | High | PASS |
| TC-TD-05 | Jastiper lain tidak bisa akses trip ini | Negative | High | PASS |
| TC-AP-01 | Tambah produk ke trip berhasil | Happy | High | PASS |
| TC-AP-02 | Total harga dihitung otomatis real-time | Happy | High | PASS |
| TC-AP-03 | Gagal – product_name kosong | Negative | High | PASS |
| TC-AP-04 | Upload gambar produk berhasil | Happy | Medium | PASS |
| TC-AP-05 | Daftar produk existing tampil di halaman ini | Happy | Medium | PASS |
| TC-AP-06 | Jastiper lain tidak bisa tambah produk ke trip ini | Negative | High | PASS |

## Modul 6 — Alur Pesanan (15 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-ORD-01 | Buyer – Tab 'Menunggu' menampilkan waiting_payment | Happy | High | PASS |
| TC-ORD-02 | Buyer – Tab 'Diproses' menampilkan processing DAN shipped | Happy | High | PASS |
| TC-ORD-03 | Buyer – Order waiting_payment dengan proof → badge 'Direview' | Edge | High | DEAD → [DEAD-04] |
| TC-ORD-04 | Buyer – shipped: tombol 'Konfirmasi Diterima' + 'Laporkan Kendala' | Happy | High | PASS |
| TC-ORD-05 | Buyer – Konfirmasi Diterima → status delivered | Happy | High | PASS |
| TC-ORD-06 | Buyer – Tombol dispute tidak tampil jika sudah ada dispute | Edge | High | PASS |
| TC-ORD-07 | Buyer – Batalkan order waiting_payment | Happy | Medium | UX-BUG → [UX-01] |
| TC-ORD-08 | Buyer – Tab Selesai dan Dibatalkan | Happy | Medium | PASS |
| TC-ORD-09 | Jastiper – Tab "Perlu Diproses" = waiting_payment + processing | Happy | High | PASS |
| TC-ORD-10 | Jastiper – Tab 'Dikirim' = shipped saja | Happy | High | PASS |
| TC-ORD-11 | Jastiper – processing: tombol 'Upload Struk & Input Nomor Resi' | Happy | High | PASS |
| TC-ORD-12 | Jastiper – meetup order processing: 'Upload Struk & Konfirmasi Meetup' | Happy | High | PASS |
| TC-ORD-13 | Order tidak tampil cross-user | Negative | High | PASS |
| TC-ORD-14 | Empty state per tab | Edge | Low | PASS |
| TC-ORD-15 | Duplicate order produk stok=1 via 2 tab browser | Edge | High | FAIL → [BUG-01] |

## Modul 7 — Pembayaran iPaymu (5 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-PAY-01 | Generate payment URL berhasil | Happy | High | PASS |
| TC-PAY-02 | Webhook callback berhasil – order jadi processing | Happy | High | PASS |
| TC-PAY-03 | User cancel di halaman iPaymu → order tetap waiting | Happy | Medium | PASS |
| TC-PAY-07 | Loading state saat klik bayar | Edge | Low | PASS |
| TC-PAY-08 | Webhook notify handler format mismatch | Negative | Critical | FAIL → [BUG-02] |

## Modul 8 — Unggah Bukti Pembelian (9 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-UP-01 | Upload struk (courier) + tracking number berhasil | Happy | High | PASS |
| TC-UP-02 | Upload struk (meetup) berhasil – tanpa tracking | Happy | High | PASS |
| TC-UP-03 | Upload foto toko (store photo) opsional | Happy | Medium | PASS |
| TC-UP-04 | Upload boarding pass opsional | Happy | Medium | PASS |
| TC-UP-05 | Gagal submit – struk tidak diupload | Negative | High | PASS |
| TC-UP-06 | Gagal – courier tanpa nomor resi | Negative | High | PASS |
| TC-UP-07 | Jastiper lain tidak bisa upload proof order ini | Negative | High | PASS |
| TC-UP-08 | Akses jika order bukan status processing → redirect | Edge | High | PASS |
| TC-UP-09 | Meetup order: jastiper klik "Konfirmasi Meetup Selesai" → status delivered | Edge | High | DEAD → [DEAD-02] |

## Modul 9 — Sengketa / Dispute (8 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-DS-01 | Ajukan dispute berhasil – pilih alasan preset | Happy | High | PASS |
| TC-DS-02 | Ajukan dispute dengan alasan 'Lainnya' + custom text | Happy | High | PASS |
| TC-DS-03 | Gagal submit – alasan kosong | Negative | High | PASS |
| TC-DS-04 | Duplicate dispute pada order yang sama – tampil notifikasi | Edge | High | PASS |
| TC-DS-05 | Escrow tetap 'held' saat dispute open | Edge | High | FAIL → [BUG-03] |
| TC-DS-06 | Buyer lain tidak bisa akses dispute order ini | Negative | High | PASS |
| TC-DS-07 | Isi bank_name + bank_account untuk pencairan refund | Happy | Medium | PASS |
| TC-DS-08 | Jastiper juga bisa ajukan dispute | Happy | Medium | PASS |

## Modul 10 — Panel Administrasi (33 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-AD-01 | Admin berhasil akses /admin/dashboard | Happy | High | PASS |
| TC-AD-02 | Non-admin tidak bisa akses /admin | Negative | High | PASS |
| TC-AD-03 | Stats counter di-fetch dari Supabase | Happy | High | PASS |
| TC-AD-04 | Navigasi ke /admin/kyc dari card KYC | Happy | Medium | PASS |
| TC-AD-05 | Navigasi ke /admin/payments dari card Pembayaran | Happy | Medium | PASS |
| TC-AK-01 | Tab 'Pending' tampil KYC menunggu | Happy | High | PASS |
| TC-AK-02 | Approve KYC Jastiper | Happy | High | PASS |
| TC-AK-03 | Reject KYC Jastiper – butuh alasan | Negative | High | PASS |
| TC-AK-04 | Reject KYC dengan alasan diisi | Happy | High | PASS |
| TC-AK-05 | Tab 'Approved' dan 'Rejected' tampil data sesuai | Happy | Medium | PASS |
| TC-AK-06 | Preview KTP & selfie Jastiper | Happy | High | PASS |
| TC-AK-07 | Empty state – tidak ada KYC pending | Edge | Low | PASS |
| TC-APM-01 | iPaymu payment tampil badge 'Terverifikasi Otomatis' | Edge | High | PASS |
| TC-APM-02 | Tab 'Disetujui' dan 'Ditolak' tampil riwayat | Happy | Medium | PASS |
| TC-APM-03 | Empty state – tidak ada payment pending | Edge | Low | PASS |
| TC-DIS-01 | Daftar order delivered yang butuh disbursement tampil | Happy | High | PASS |
| TC-DIS-02 | Tandai Disbursed – update admin_note | Happy | High | PASS |
| TC-DIS-03 | Tab 'Disbursed' tampil order yang sudah diproses | Happy | Medium | PASS |
| TC-DIS-04 | Tampil info bank jastiper untuk transfer manual | Happy | High | PASS |
| TC-DIS-05 | Empty state – tidak ada pending disbursement | Edge | Low | SKIP |
| TC-ADI-01 | Daftar dispute 'open' tampil | Happy | High | PASS |
| TC-ADI-02 | Lihat detail dispute + info order | Happy | High | PASS |
| TC-ADI-03 | Resolve – Refund ke buyer (input resolution wajib) | Happy | High | PASS |
| TC-ADI-04 | Resolve – Release ke Jastiper | Happy | High | PASS |
| TC-ADI-05 | Gagal resolve – resolution kosong | Negative | High | PASS |
| TC-ADI-06 | Tab 'resolved' tampil riwayat | Happy | Medium | PASS |
| TC-ADI-07 | Empty state – tidak ada dispute open | Edge | Low | SKIP |
| TC-AU-01 | Daftar semua user tampil | Happy | High | PASS |
| TC-AU-02 | Search user berhasil | Happy | High | PASS |
| TC-AU-03 | Freeze akun user – butuh alasan | Negative | High | PASS |
| TC-AU-04 | Freeze akun user berhasil | Happy | High | PASS |
| TC-AU-05 | Unfreeze akun user berhasil | Happy | High | PASS |
| TC-AU-06 | Tombol modal berubah berdasarkan status frozen | Edge | Medium | PASS |

## Modul 11 — Keamanan & Edge Case (10 TC)

| ID | Nama | Tipe | Prioritas | Status |
|---|---|---|---|---|
| TC-SEC-01 | XSS di input nama produk | Negative | High | FAIL → [BUG-04] |
| TC-SEC-02 | Akses /admin tanpa login → redirect /login | Negative | High | PASS |
| TC-SEC-03 | Akses halaman protected tanpa session → redirect | Negative | High | PASS |
| TC-SEC-04 | Double submit order – loading mencegah | Edge | High | PASS |
| TC-SEC-05 | Double submit payment proof | Edge | High | DEAD → [DEAD-01] |
| TC-SEC-06 | Akses /orders/:id/proof dari buyer (bukan jastiper) | Negative | High | PASS |
| TC-SEC-07 | Race condition: 2 user order produk stok=1 bersamaan | Edge | High | FAIL → [BUG-05] |
| TC-SEC-08 | Halaman 404 untuk route tidak valid | Edge | Low | PASS |
| TC-SEC-09 | Jastiper di-freeze saat ada order aktif | Edge | High | PASS |
| TC-SEC-10 | Admin tidak bisa akses halaman user biasa (/orders) | Edge | Medium | PASS |

---

## Referensi Bug & Temuan

| ID | Tingkat | Ringkasan | TC Terkait |
|---|---|---|---|
| BUG-01 | Kritikal | Duplikasi pesanan via 2 tab browser | TC-ORD-15 |
| BUG-02 | Kritikal | Webhook iPaymu tidak diproses (format mismatch) | TC-PAY-08 |
| BUG-03 | Tinggi | Status escrow `released` langsung saat pembayaran | TC-DS-05 |
| BUG-04 | Tinggi | XSS payload tersimpan di DB tanpa sanitasi | TC-SEC-01 |
| BUG-05 | Tinggi | Race condition stok — 2 user order bersamaan | TC-SEC-07 |
| BUG-06 | Tinggi | Edit produk bisa simpan nama kosong & harga Rp 0 | TC-TD-02 |
| BUG-07 | Sedang | Penandaan field wajib (*) tidak konsisten | TC-NR-01, TC-NR-03 |
| BUG-08 | Sedang | Input budget negatif dapat tersimpan | TC-NR-03 |
| BUG-09 | Sedang | Pencarian nama Jastiper tidak berfungsi | TC-BL-02 |
| BUG-10 | Sedang | Registrasi email terdaftar tidak menampilkan error | TC-AUTH-09 |
| DEAD-01 | Dead Page | `/orders/:id/pay` tidak bisa diakses dari flow aktif | TC-SEC-05 |
| DEAD-02 | Dead Function | `handleMeetupDone` tidak terpasang ke UI | TC-UP-09 |
| DEAD-03 | Dead Feature | Admin "Verifikasi Bayar" selalu 0 | — |
| DEAD-04 | Dead State | Badge "Direview" tidak pernah tercapai | TC-ORD-03 |
| DEAD-05 | Dead Flow | MyListingsPage & /listings/new adalah sisa alur lama | — |
| UX-01 | UX Bug | Batalkan order tanpa konfirmasi dialog | TC-ORD-07 |
| UX-02 | UX Bug | Pencarian admin tidak menggunakan debounce | TC-AU-02 |

---

> Detail lengkap setiap test case (preconditions, test steps, expected result, actual result) tersedia di file `Jastipal_TestCases.xlsx`.
