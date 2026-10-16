# Findly Search 🔍

Findly Search adalah aplikasi mesin pencari web modern berbasis full-stack (**React.js + Express.js**) yang memanfaatkan **Tavily Search API** untuk menyajikan hasil pencarian internet secara terstruktur, menyediakan fitur ekspor instan (**PDF, CSV, JSON**), serta pengunduhan berkas aman dari sumber web dengan proteksi **Server-Side Request Forgery (SSRF)**.

Proyek ini dirancang secara terstruktur dan modular untuk memenuhi kebutuhan tugas/proyek mata kuliah **Pemrograman Web Lanjut**.

---

## 📑 Daftar Isi

- [1. Fungsi dan Tujuan Website](#1-fungsi-dan-tujuan-website)
- [2. Fitur Utama](#2-fitur-utama)
- [3. Arsitektur Aplikasi](#3-arsitektur-aplikasi)
- [4. Teknologi yang Digunakan](#4-teknologi-yang-digunakan)
- [5. Struktur Direktori](#5-struktur-direktori)
- [6. Panduan Instalasi & Menjalankan](#6-panduan-instalasi--menjalankan)
- [7. Konfigurasi Tavily Search API Key](#7-konfigurasi-tavily-search-api-key)
- [8. Dokumentasi REST API](#8-dokumentasi-rest-api)
- [9. Keamanan & Proteksi SSRF](#9-keamanan--proteksi-ssrf)
- [10. Pengujian (Testing)](#10-pengujian-testing)
- [11. Keterbatasan Fitur](#11-keterbatasan-fitur)

---

## 1. Fungsi dan Tujuan Website

Findly Search adalah **antarmuka mesin pencari web cerdas** (*Smart Search Engine Interface*) yang memiliki fungsi-fungsi utama berikut:

1. **Mesin Pencari Web Berbasis API Eksternal (Tavily Search API)**:
   Aplikasi ini tidak membangun database sendiri atau mengindeks seluruh internet secara manual, melainkan mengambil hasil pencarian web paling mutakhir secara *real-time* melalui Tavily Search API lewat backend Express.js.
2. **Ekspor Hasil Pencarian Multi-Format**:
   Pengguna dapat langsung mengekspor daftar pencarian ke:
   - **PDF**: Dokumen laporan resmi dengan format kop, metadata, dan tabel rapi.
   - **CSV**: Lembar kerja berstandar RFC4180 dengan UTF-8 BOM yang dapat langsung dibuka rapi di Microsoft Excel.
   - **JSON**: Struktur data mentah terformat untuk analisis data atau tugas pemrograman lanjutan.
3. **Pengunduhan Berkas Terproteksi (Safe Downloader & Anti-SSRF)**:
   Menyediakan tombol unduh jika tautan sumber mengarah ke dokumen publik (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.zip`, dll) dengan validasi keamanan menyeluruh guna mencegah serangan siber SSRF (*Server-Side Request Forgery*).
4. **Isolasi Keamanan Kunci API**:
   Kunci API Tavily disimpan aman di sisi server (backend) dan tidak pernah dibocorkan ke browser pengguna atau repository publik.

---

## 2. Fitur Utama

### A. Pencarian Web Cepat & Bersih
- Pencarian kata kunci menggunakan antarmuka interaktif dan tombol Enter.
- Integrasi resmi ke **Tavily Search API** melalui Express Backend.
- Menampilkan judul, domain/favicon sumber, cuplikan konten, status berkas, dan waktu publikasi.
- Pengaturan jumlah hasil (10, 15, atau 20 item).
- Indikator pemuatan (*shimmer skeleton*), pesan jika hasil tidak ditemukan, dan penanganan error yang jelas.

### B. Ekspor Hasil Pencarian
- **PDF**: Menghasilkan dokumen laporan profesional menggunakan `jsPDF` dan `jspdf-autotable`.
- **CSV**: Ekspor berstandar RFC4180 dengan encoding UTF-8 BOM yang kompatibel langsung dengan Microsoft Excel.
- **JSON**: Ekspor struktur data lengkap dan rapi.

### C. Pengunduhan Berkas Terproteksi (Safe Downloader)
- Deteksi otomatis URL yang mengarah ke file dokumen (`.pdf`, `.docx`, `.xlsx`, `.pptx`, `.csv`, `.txt`, `.zip`, `.json`, gambar, dll).
- Endpoint `/api/download` memvalidasi protokol, resolusi DNS, dan memblokir alamat IP privat/loopback/cloud metadata (SSRF).
- Batas ukuran berkas maksimal **20 MB** dengan pemeriksaan `Content-Length` dan proteksi streaming byte limiter.
- Sanitasi nama berkas pada header `Content-Disposition`.

---

## 3. Arsitektur Aplikasi

```text
+---------------+          +------------------+          +-------------------------+
|               |  (1)     |                  |  (2)     |                         |
| React Client  | -------> |  Express Server  | -------> |    Tavily Search API    |
| (Vite Port    |          |  (Port 5000)     | <------- |   (api.tavily.com)      |
|  5173)        | <------- |                  |  (3)     |                         |
+---------------+  (4)     +------------------+          +-------------------------+
       |                            |
       |                            | (Unduhan Berkas)
       | (5) Request Download       v
       +-----------------------> Validasi URL / DNS / Anti-SSRF
                                    |
                                    v (6) Streaming Data (Maks 20 MB)
                                 Server Sumber Web Publik
```

1. Pengguna memasukkan kata kunci di antarmuka React.
2. Frontend mengirim permintaan pencarian ke backend Express (`/api/search`).
3. Backend menyematkan API key rahasia dan memanggil Tavily Search API.
4. Backend menormalisasi hasil dan mengirimkan JSON bersih ke frontend.
5. Jika pengguna mengunduh berkas, permintaan diarahkan melalui `/api/download`.
6. Backend memverifikasi URL, memastikan IP tujuan bukan internal (SSRF Prevention), dan mengalirkan (*stream*) berkas langsung ke browser pengguna.

---

## 4. Teknologi yang Digunakan

### Frontend
- **React.js 18** & **Vite**: Single Page Application cepat dan efisien.
- **Vanilla CSS3**: Desain modern (*Cyber-Glass Dark Mode*), tipografi *Plus Jakarta Sans*, variabel CSS, dan transisi halus.
- **Axios**: HTTP Client untuk komunikasi API dan penerimaan stream binary file (*Blob*).
- **jsPDF & jspdf-autotable**: Generator dokumen PDF terstruktur di sisi klien.
- **Lucide React**: Ikon antarmuka modern.

### Backend
- **Node.js** & **Express.js**: REST API server.
- **ipaddr.js**: Pustaka validasi rentang IP privat/restricted (IPv4 & IPv6).
- **express-rate-limit**: Pembatasan laju permintaan (*rate limiting*) untuk proteksi abuse.
- **cors**: Konfigurasi keamanan origin akses lintas domain.
- **dotenv**: Manajemen variabel lingkungan aman.
- **Axios**: HTTP Client dengan kontrol manual redirect dan pembatalan stream.

---

## 5. Struktur Direktori

```text
findly-search/
├── package.json              # Skrip root helper (dev, test, build)
├── README.md                 # Dokumentasi komprehensif proyek
├── backend/
│   ├── package.json          # Dependensi backend Node.js
│   ├── .env.example          # Template konfigurasi environment
│   ├── .env                  # File environment aktif (berisi API key)
│   ├── .gitignore
│   └── src/
│       ├── server.js         # Entry point server Express
│       ├── config.js         # Pengaturan port, kuota, & timeout
│       ├── test_suite.js     # Skrip pengujian otomatis (18 skenario)
│       ├── routes/
│       │   └── api.js        # Endpoint /health, /search, /download
│       └── services/
│           ├── braveSearch.js    # Klien integrasi Tavily / Web Search API
│           └── safeDownloader.js # Anti-SSRF, DNS check, & file streamer
└── frontend/
    ├── package.json          # Dependensi frontend React
    ├── index.html            # HTML template & Google Fonts
    ├── vite.config.js        # Konfigurasi proxy Vite
    ├── .gitignore
    └── src/
        ├── main.jsx          # Entry point React DOM
        ├── App.jsx           # Komponen utama state & orkestrasi
        ├── style.css         # Design system Vanilla CSS
        ├── components/
        │   ├── Navbar.jsx          # Navigasi & indikator status API
        │   ├── HeroSearch.jsx      # Input pencarian & saran chip
        │   ├── ResultsToolbar.jsx  # Statistik & tombol ekspor
        │   ├── ResultCard.jsx      # Kartu hasil pencarian & aksi unduh
        │   ├── LoadingSkeleton.jsx # Animasi shimmer pemuatan
        │   ├── EmptyState.jsx      # Tampilan status kosong
        │   ├── ErrorAlert.jsx      # Panduan interaktif error & setup key
        │   ├── Toast.jsx           # Notifikasi pop-up dinamis
        │   └── Footer.jsx          # Informasi lisensi & atribusi
        ├── services/
        │   └── api.js              # Klien API Axios frontend
        └── utils/
            └── exportUtils.js      # Generator ekspor PDF, CSV, JSON
```

---

## 6. Panduan Instalasi & Menjalankan

### Menjalankan Backend (Port 5000)
Buka terminal di folder `backend`:
```powershell
npm.cmd run dev
# atau:
node --watch src/server.js
```
Backend akan aktif di: `http://localhost:5000`

### Menjalankan Frontend (Port 5173)
Buka terminal kedua di folder `frontend`:
```powershell
npm.cmd run dev
```
Buka browser Anda di: `http://localhost:5173`

---

## 7. Konfigurasi Tavily Search API Key

Aplikasi menggunakan **Tavily Search API**. Untuk mendapatkan API Key gratis:

1. Kunjungi portal resmi Tavily: [https://tavily.com/](https://tavily.com/).
2. Buat akun gratis (Free tier 1.000 pencarian per bulan).
3. Salin API Key (berawalan `tvly-...`) dari dashboard Anda.
4. Buka file `backend/.env` dan simpan token Anda:
   ```env
   TAVILY_API_KEY=tvly-dev-xxxxxx...
   ```
5. Simpan file `.env`. Backend akan otomatis mendeteksi dan mengaktifkan Tavily Search API!

---

## 8. Dokumentasi REST API

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Respons Sukses (200 OK)**:
  ```json
  {
    "status": "ok",
    "service": "Findly Search API",
    "timestamp": "2026-10-14T12:00:00.000Z",
    "provider": "tavily",
    "braveConfigured": true,
    "maxDownloadSizeMb": 20
  }
  ```

### 2. Pencarian Web
- **Endpoint**: `GET /api/search?q={query}&count={count}`
- **Parameter**:
  - `q` (*string, required*): Kata kunci pencarian.
  - `count` (*integer, optional*): Jumlah hasil (1 - 20, default: 10).
- **Status Codes**: 200, 400, 401, 429, 500.

### 3. Pengunduhan Berkas Terproteksi
- **Endpoint**: `GET /api/download?url={encoded_url}`
- **Parameter**:
  - `url` (*string, required*): URL dokumen yang ingin diunduh.
- **Status Codes**: 200 (Streaming attachment), 400, 403 (SSRF blocked), 413 (>20MB), 415.

---

## 9. Keamanan & Proteksi SSRF

Fitur download pada aplikasi ini menerapkan standar keamanan **Defense in Depth**:

1. **Whitelisting Protokol**: Hanya mengizinkan skema `http://` dan `https://`. Protokol `file://`, `gopher://`, `ftp://` ditolak seketika.
2. **Resolusi DNS Menyeluruh**: Domain di-resolve ke seluruh record IPv4 dan IPv6. Jika terdapat record yang menunjuk ke IP internal/loopback, permintaan diblokir.
3. **Penyaringan Rentang IP Terlarang**:
   - Loopback: `127.0.0.0/8`, `::1`
   - Private Networks: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`
   - Link-Local & Cloud Metadata: `169.254.0.0/16`, `fe80::/10` (mencegah eksfiltrasi kredensial AWS/GCP/Azure)
   - IPv4-mapped IPv6: `::ffff:127.0.0.1`
4. **Validasi Redirect Manual**: Pengalihan HTTP (301, 302, 307) diuji ulang pada setiap hop sebelum diunduh.
5. **Streaming Byte Limiter**: Stream data diputus otomatis jika transfer melebihi 20 MB.
6. **Sanitasi Path Traversal**: Karakter berbahaya dinetralkan dari nama berkas pada header `Content-Disposition`.

---

## 10. Pengujian (Testing)

Jalankan pengujian otomatis:
```bash
npm.cmd test
```
Seluruh 18 skenario uji keamanan SSRF, validasi query, dan endpoint REST API lulus (**18/18 PASS**).

---

## 11. Keterbatasan Fitur

- **Kuota API Pihak Ketiga**: Kuota pencarian bergantung pada tier akun Tavily (Free: 1.000 kueri/bulan).
- **Pengunduhan Berkas Eksternal**: Beberapa server sumber dapat memblokir bot pengunduh (*anti-hotlinking* atau CAPTCHA).
- **Ukuran Berkas**: Pengunduhan berkas dibatasi maksimal 20 MB.
- **Halaman Web HTML**: URL yang mengarah ke halaman web biasa (HTML) diarahkan untuk dibuka melalui tautan sumber asli.
