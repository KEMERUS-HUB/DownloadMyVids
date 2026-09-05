# Downloadmyvids

Website untuk mendownload video dari berbagai sumber (YouTube, X, TikTok, Instagram, Facebook, dan lainnya).

## Cara Kerja

1. Tempelkan link video.
2. Klik **Scan Link** – sistem akan memproses link.
3. Pilih kualitas video yang diinginkan (144p, 360p, 480p, 720p, 1080p).
4. Klik **Download** untuk mengunduh video.

## Teknologi

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js + Express (hanya untuk serving static files)
- **API**: [Vevioz](https://api.vevioz.com) untuk mengekstrak link download

## Deploy ke Render

1. **Fork / clone** repositori ini ke akun GitHub Anda.
2. Login ke [Render](https://render.com), pilih **New +** → **Web Service**.
3. Hubungkan repositori GitHub.
4. Isi konfigurasi:
   - **Name**: `downloadmyvids` (atau sesuai keinginan)
   - **Environment**: `Node`
   - **Build Command**: (kosongkan, karena tidak perlu build)
   - **Start Command**: `npm start`
5. Klik **Deploy Web Service**.

Setelah selesai, website akan live di URL yang diberikan oleh Render.

> **Catatan**: Karena menggunakan API eksternal, pastikan koneksi internet dan CORS diizinkan. Jika terjadi error, coba gunakan proxy endpoint (tersedia di `server.js` dengan mengaktifkan route `/api/scan`).