# Dragon Kingdom — simulasi game koin virtual

Proyek demo edukasi dengan frontend React + Vite, backend Express, PostgreSQL, dan RNG CSPRNG.
**Tidak ada uang asli, deposit, penarikan, atau hadiah bernilai uang.** Koin hanya berlaku di dalam simulasi.

## Fitur
- Lobby portrait dengan saldo, profil demo, dan tombol bermain.
- Mesin 5×3, 5 garis pembayaran, taruhan koin virtual, animasi sederhana.
- Backend menghitung hasil (browser tidak menentukan hasil).
- `crypto.randomInt()` untuk pemilihan simbol berbobot tanpa modulo bias.
- PostgreSQL transaction + `SELECT ... FOR UPDATE` untuk mencegah saldo dipakai bersamaan.
- Registrasi/login JWT, saldo, riwayat 20 putaran.
- Saldo awal demo 10.000 koin.

## Prasyarat
- Node.js 20+
- PostgreSQL 14+
- npm

## 1. Database
Buat database:
```bash
createdb dragon_kingdom
```
Atau melalui psql:
```sql
CREATE DATABASE dragon_kingdom;
```
Kemudian jalankan schema:
```bash
psql -d dragon_kingdom -f backend/database/schema.sql
```

## 2. Backend
```bash
cd backend
cp .env.example .env
```
Edit `.env`: isi `DATABASE_URL` dan ganti `JWT_SECRET` dengan string acak panjang.
```bash
npm install
npm run dev
```
API berjalan di `http://localhost:4000`.

## 3. Frontend
Terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Buka URL Vite yang ditampilkan (umumnya `http://localhost:5173`).

## Penggunaan
- Klik **Mulai Petualangan** untuk membuat akun demo otomatis (username lokal `dragon_guest`; password demo `DragonDemo123!`).
- Untuk akun pribadi, gunakan panel Login/Daftar.
- Lobby → Mainkan → pilih taruhan → SPIN.
- Saldo dan riwayat dimuat dari backend.

## API
- `POST /api/auth/register` `{ "username": "...", "password": "..." }`
- `POST /api/auth/login` `{ "username": "...", "password": "..." }`
- `GET /api/balance` (Bearer token)
- `GET /api/history` (Bearer token; 20 terakhir)
- `POST /api/spin` (Bearer token) `{ "betAmount": 100 }`

## Catatan RNG dan matematika
- Simbol dipilih dari bobot yang ditetapkan server menggunakan `crypto.randomInt(totalWeight)`.
- Lima garis pembayaran ditetapkan di `backend/src/game.js`.
- Pembayaran dihitung server-side; setiap garis dibayar jika 3 atau lebih simbol identik dimulai dari reel pertama.
- `winAmount` adalah jumlah pembayaran bruto dari garis yang menang; taruhan dikurangkan terpisah.
- RNG kriptografis tidak menjamin hasil menang. Bobot dan pembayaran hanya konfigurasi demo, bukan janji atau prediksi.
- Untuk mengubah simbol, bobot, atau hadiah, ubah `backend/src/game.js`.
- Ini bukan sistem perjudian uang asli dan tidak memiliki pembayaran tunai.

## Pengembangan/produksi
Tambahkan HTTPS, rate limiting, CORS origin spesifik, refresh-token/session management, audit log, backup, monitoring, dan pengujian sebelum deployment. Jangan gunakan konfigurasi `.env.example` sebagai kredensial produksi.
