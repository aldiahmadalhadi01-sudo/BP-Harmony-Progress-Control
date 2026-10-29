# BPMS — WORK ORDER & PROGRESS CONTROL SYSTEM
**Aplikasi Manajemen Work Order & Monitoring Progres Bengkel Body Repair & Paint**

BPMS adalah sistem manajemen operasional bengkel body repair dan paint yang mengelola siklus hidup Work Order (WO), pemantauan Work In Progress (WIP), eksekusi transaksi Unit Close, serta pemantauan target penyelesaian unit (H-3, H-2, H-1, TODAY, OVERDUE) dan capaian On-Time Delivery (OTD).

Aplikasi ini menggunakan **React + Vite** di frontend, **Node.js (Express & Vercel Serverless Functions)** di backend, dan **Google Sheets** sebagai database utama. Anda dapat menyinkronkan data dengan Google Sheets menggunakan **Google Apps Script Web App (Tanpa Service Account)** ataupun **Google Cloud Service Account**.

---

## 🚀 Fitur Utama

1. **Dashboard Operasional Real-Time**
   - 6 Kartu Metrik KPI: Total WIP Aktif, Unit Close Bulan Ini, Target Selesai Hari Ini, Mendekati Target (H-3 s/d H-1), Unit Terlambat (Overdue), dan Persentase On-Time Delivery (OTD).
   - 4 Grafik Visual (Chart.js): Volume WO Masuk per Bulan, Unit Close per Bulan, Komparasi OTD (YA vs TIDAK), dan Distribusi Unit per Tahapan Progress.
   - Tabel Cepat Prioritas: Target Hari Ini, Unit Terlambat, dan Unit Dihentikan (*Job Stopped*).

2. **Input Work Order (WO) Baru**
   - Form pendaftaran WO dengan validasi duplikasi `no_wo` di seluruh database (WIP & UNIT_CLOSE).
   - Date picker untuk Tanggal Estimasi, Tanggal In, dan Target Selesai.
   - Kolom terpisah untuk `item_jasa`, `item_part`, `tambahan_jasa`, dan `tambahan_part`.
   - Status pengerjaan fleksibel (Bongkar, Ketok / Las, Dempul, Epoxy, Cat / Oven, Poles, Pasang, Finishing & QC, Cuci & Siap Delivery).
   - Fitur *Job Stopped* (YA / TIDAK) beserta catatan alasan kendala.

3. **Manajemen Unit WIP (Work In Progress)**
   - Tabel data responsif dengan pencarian global, filter tanggal, filter vendor, filter progress, dan filter status job stopped.
   - Sorting dinamis dan pagination.
   - Modal Detail lengkap, Modal Edit data WO, dan Modal Transaksi Unit Close.

4. **Transaksi Unit Close yang Aman & Tervalidasi**
   - Modal konfirmasi penutupan unit dengan date picker `aktual_unit_selesai` (default tanggal lokal Asia/Jakarta).
   - Kalkulasi otomatis On-Time Delivery (OTD): **YA** jika `aktual <= estimasi`, **TIDAK** jika `aktual > estimasi`.
   - Transaksi terverifikasi: data dicatat ke `UNIT_CLOSE` terlebih dahulu, diverifikasi keberadaannya, kemudian dihapus dari `WIP` untuk mencegah kehilangan data atau penutupan ganda (*idempotent & concurrency lock*).

5. **Histori Unit Close & Ekspor CSV**
   - Arsip seluruh kendaraan yang telah diserahterimakan ke konsumen.
   - Filter OTD, vendor, tanggal aktual selesai, dan unduh laporan dalam format file `.csv`.

6. **Monitoring Target Selesai (Batas Waktu)**
   - Kalkulasi selisih hari kalender murni berdasarkan zona waktu **Asia/Jakarta (WIB)**:
     - `OVERDUE`: Target terlewati dan unit belum close (Merah).
     - `TODAY`: Target jatuh tempo hari ini (Oranye).
     - `H-1`: Target besok / 1 hari lagi (Kuning).
     - `H-2`: Target 2 hari lagi (Biru muda).
     - `H-3`: Target 3 hari lagi (Biru).
     - `ON TRACK`: Target lebih dari 3 hari ke depan (Hijau).
   - Pengurutan prioritas: unit yang terlambat dan target hari ini otomatis berada di posisi teratas.

---

## 🗄️ Struktur Database Google Sheets (`BPMS_WO_DATABASE`)

Spreadsheet minimal berisi dua tab worksheet dengan header kolom persis seperti berikut:

### 1. Worksheet `WIP` (19 Kolom)
```text
no_wo, tanggal_estimasi, tanggal_in, estimasi_selesai, no_polisi, tipe_kendaraan, nama_customer, no_hp, asuransi, item_jasa, item_part, tambahan_jasa, tambahan_part, vendor, progress, job_stopped, keterangan, created_at, updated_at
```

### 2. Worksheet `UNIT_CLOSE` (22 Kolom)
```text
no_wo, tanggal_estimasi, tanggal_in, estimasi_selesai, no_polisi, tipe_kendaraan, nama_customer, no_hp, asuransi, item_jasa, item_part, tambahan_jasa, tambahan_part, vendor, progress, job_stopped, keterangan, created_at, updated_at, aktual_unit_selesai, ontime_delivery, closed_at
```

> **Tips:** Anda dapat menggunakan tombol **"Inisialisasi Otomatis via API"** di modal *Setup Google Sheets* pada aplikasi untuk membuat kedua worksheet dan menuliskan header kolom secara otomatis.

---

## ⚙️ Panduan Setup Google Service Account

Agar backend dapat membaca dan menulis data ke Google Sheets:

1. Buka [Google Cloud Console](https://console.cloud.google.com).
2. Buat project baru (atau pilih project yang ada).
3. Buka menu **APIs & Services > Library**, cari **Google Sheets API**, lalu klik **Enable**.
4. Buka menu **APIs & Services > Credentials**, klik **Create Credentials > Service Account**.
5. Beri nama service account (misal: `bpms-sheets-service`), lalu klik **Create and Continue**.
6. Klik service account yang baru dibuat, masuk ke tab **Keys**, klik **Add Key > Create new key**, pilih format **JSON**.
7. Simpan file JSON yang terunduh. Di dalamnya terdapat field `client_email` dan `private_key`.
8. Buat Google Spreadsheet baru di browser, beri nama `BPMS_WO_DATABASE`.
9. Klik tombol **Bagikan (Share)** di pojok kanan atas spreadsheet, lalu undang email service account (dari `client_email`) dengan hak akses **Editor**.
10. Salin **Spreadsheet ID** dari URL browser:
    `https://docs.google.com/spreadsheets/d/`**`[SPREADSHEET_ID_ANDA]`**`/edit`

---

## 🔑 Konfigurasi Environment Variables

Buat file `.env` di direktori root aplikasi (atau masukkan ke menu Environment Variables di Vercel):

```env
# Google Cloud Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL="bpms-service@project-id.iam.gserviceaccount.com"

# Private key dari file JSON (pastikan newline dipertahankan atau format \n)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwgg...=\n-----END PRIVATE KEY-----\n"

# Spreadsheet ID Google Sheets Anda
GOOGLE_SHEETS_SPREADSHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
```

> **Catatan Keamanan:** Kredensial Google Service Account hanya digunakan pada sisi server/backend (Node.js/Vercel Serverless Functions) dan **tidak pernah dikirim ke browser / frontend**.

---

## 💻 Menjalankan Aplikasi Secara Lokal

1. **Install dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

3. **Build untuk produksi:**
   ```bash
   npm run build
   ```

---

## 🚀 Panduan Deployment ke GitHub & Vercel

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "feat: initial commit BPMS Work Order & Progress Control System"
git branch -M main
git remote add origin https://github.com/username-anda/bpms-work-order.git
git push -u origin main
```

### 2. Deploy ke Vercel
1. Masuk ke [Vercel Dashboard](https://vercel.com) dan klik **Add New > Project**.
2. Hubungkan repository GitHub Anda.
3. Pada halaman konfigurasi project:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Di bagian **Environment Variables**, tambahkan 3 variabel berikut:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
5. Klik **Deploy**.
6. Setelah deployment selesai, buka aplikasi Anda dan uji status database melalui tombol **"Setup Google Sheets"** di header/sidebar.

---

## 📡 Daftar Endpoint Backend API

- `GET /api/health` — Memeriksa status kesehatan API dan konektivitas Google Sheets.
- `POST /api/setup-sheets` — Membuat worksheet `WIP` dan `UNIT_CLOSE` beserta header kolom otomatis.
- `POST /api/seed-data` — Mengisi data operasional bengkel contoh ke spreadsheet jika masih kosong.
- `GET /api/dashboard` — Menghitung ringkasan KPI, tren bulanan, distribusi progress, dan prioritas unit.
- `GET /api/wip` — Mengambil daftar unit WIP aktif dengan pencarian dan filter.
- `POST /api/wip` — Menambahkan Work Order baru ke worksheet WIP (validasi no_wo unik).
- `GET /api/wip/:no_wo` — Mengambil data detail satu Work Order.
- `PUT /api/wip/:no_wo` — Memperbarui data Work Order di WIP.
- `POST /api/wip/:no_wo/close` — Menutup unit: verifikasi WIP, hitung OTD, tulis ke UNIT_CLOSE, hapus dari WIP.
- `GET /api/unit-close` — Mengambil daftar arsip unit yang telah selesai.
- `GET /api/target-selesai` — Mengambil daftar unit WIP yang dikelompokkan berdasarkan selisih hari target.
- `GET /api/export/unit-close` — Mengunduh seluruh data Unit Close dalam format file CSV.
