# Panduan publikasi Dragon Kingdom

Panduan ini menyiapkan aplikasi agar bisa dipublikasikan. Deploy membutuhkan akun milik pemilik proyek pada Vercel, Render, dan Neon; file proyek saja tidak dapat membuat website publik tanpa akun dan persetujuan pemilik.

## A. Buat database PostgreSQL di Neon
1. Buat akun di https://neon.tech/ lalu buat project PostgreSQL.
2. Salin connection string PostgreSQL dari dashboard Neon.
3. Buka SQL Editor Neon, jalankan seluruh isi `backend/database/schema.sql`.
4. Simpan connection string secara privat. Jangan masukkan ke frontend atau repositori publik.

## B. Deploy backend ke Render
1. Unggah folder proyek ke repositori GitHub milikmu.
2. Di https://render.com/, pilih **New → Blueprint** dan hubungkan repositori tersebut.
3. Render akan membaca `render.yaml`. Pastikan service `dragon-kingdom-api` dibuat.
4. Isi environment variable `DATABASE_URL` dengan connection string Neon.
5. Untuk sementara isi `CLIENT_ORIGIN` dengan domain frontend Vercel setelah langkah C selesai.
6. Deploy. URL backend akan berbentuk `https://dragon-kingdom-api.onrender.com`.
7. Tes `https://NAMA-SERVICE.onrender.com/api/health`; hasil yang benar: `{"ok":true}`.

## C. Deploy frontend ke Vercel
1. Di https://vercel.com/, pilih **Add New → Project**, lalu impor repositori GitHub.
2. Atur **Root Directory** ke `frontend`.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Tambahkan environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://NAMA-SERVICE.onrender.com/api`
5. Deploy. Vercel akan memberikan domain publik, misalnya `https://dragon-kingdom.vercel.app`.

## D. Hubungkan CORS
1. Kembali ke Render → service `dragon-kingdom-api` → Environment.
2. Set `CLIENT_ORIGIN` ke domain Vercel yang benar, misalnya `https://dragon-kingdom.vercel.app` (tanpa garis miring di akhir).
3. Redeploy backend jika diminta.
4. Tes website: daftar akun, login, lihat saldo, lakukan putaran demo, lalu periksa riwayat.

## Catatan penting
- Nama domain `dragon-kingdom.vercel.app` hanya contoh/target; ketersediaannya bergantung pada Vercel.
- Jangan membagikan `DATABASE_URL`, `JWT_SECRET`, password, atau token.
- Jika memakai domain Vercel preview dan production, atur CORS dengan hati-hati; jangan gunakan wildcard untuk produksi.
- Render free service dapat tidur saat tidak aktif sehingga permintaan pertama mungkin lambat.
- Game ini hanya simulasi koin virtual tanpa deposit, penarikan, atau hadiah uang.
- Sebelum dibuka publik, uji alur daftar/login/spin/history dan periksa log backend.
