const express = require('express');
const path = require('path');
const { lmna } = require('@lmna22/aio-downloader');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== PROXY ENDPOINT =====
app.post('/api/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL tidak boleh kosong' });
    }

    console.log(`[Proxy] Menerima URL: ${url}`);

    // Gunakan aio-downloader untuk auto-detect platform
    const result = await lmna.youtube(url, 5); // 5 = 1080p
    
    // Coba deteksi platform lain jika YouTube gagal
    // Atau gunakan aioDownloader untuk auto-detect
    // Karena lmna.youtube hanya untuk YouTube, kita coba fallback ke aioDownloader
    
    // Cara alternatif: gunakan aioDownloader untuk semua platform
    const { aioDownloader } = require('@lmna22/aio-downloader');
    const data = await aioDownloader(url);
    
    if (!data || !data.status) {
      throw new Error(data?.message || 'Gagal memproses link');
    }

    // Format response dari aioDownloader:
    // { status: true, platform: 'YouTube', title: '...', data: { result: Buffer, type: 'mp4', ... } }
    // Kita perlu mengubah ke format yang sama seperti Vevioz agar frontend tetap jalan

    const platform = data.platform || 'Unknown';
    const title = data.data?.title || data.title || 'Video';
    const thumbnail = data.data?.thumbnail || data.thumbnail || '';

    // Kumpulkan semua link download yang tersedia
    const qualities = [];
    
    // Coba ambil dari data.data (hasil spesifik platform)
    const mediaData = data.data || {};
    
    // YouTube: biasanya ada videoUrls dengan berbagai kualitas
    if (mediaData.videoUrls && Array.isArray(mediaData.videoUrls)) {
      mediaData.videoUrls.forEach((item, index) => {
        if (item.url) {
          let label = item.quality || item.resolution || `Quality ${index + 1}`;
          if (label.includes('1080')) label = '1080p';
          else if (label.includes('720')) label = '720p';
          else if (label.includes('480')) label = '480p';
          else if (label.includes('360')) label = '360p';
          else if (label.includes('144')) label = '144p';
          qualities.push({ label, url: item.url });
        }
      });
    }
    
    // Jika ada result langsung (Buffer), kita tidak bisa kasih URL karena sudah di-download
    // Tapi aioDownloader biasanya return URL, bukan buffer
    // Coba cari di media
    if (mediaData.media) {
      const media = mediaData.media;
      if (Array.isArray(media)) {
        media.forEach(item => {
          if (item.url) {
            let label = item.quality || item.resolution || 'Video';
            qualities.push({ label, url: item.url });
          }
        });
      } else if (media.url) {
        qualities.push({ label: 'Video', url: media.url });
      }
    }

    // Jika masih kosong, coba ambil dari field lain
    if (qualities.length === 0) {
      // Cari semua field yang mengandung URL
      const findUrls = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === 'string' && val.startsWith('http')) {
            let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (label.toLowerCase().includes('1080')) label = '1080p';
            else if (label.toLowerCase().includes('720')) label = '720p';
            else if (label.toLowerCase().includes('480')) label = '480p';
            else if (label.toLowerCase().includes('360')) label = '360p';
            else if (label.toLowerCase().includes('144')) label = '144p';
            qualities.push({ label, url: val });
          } else if (typeof val === 'object' && val !== null) {
            findUrls(val, `${path}.${key}`);
          }
        }
      };
      findUrls(data);
    }

    // Hapus duplikat URL
    const seen = new Set();
    const uniqueQualities = qualities.filter(q => {
      if (seen.has(q.url)) return false;
      seen.add(q.url);
      return true;
    });

    if (uniqueQualities.length === 0) {
      throw new Error('Tidak ditemukan link download untuk video ini');
    }

    // Kirim response dengan format yang sama seperti sebelumnya
    res.json({
      success: true,
      data: {
        title: title,
        thumbnail: thumbnail,
        download: Object.fromEntries(uniqueQualities.map(q => [q.label, q.url])),
        platform: platform,
      }
    });

  } catch (err) {
    console.error('[Proxy] Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Terjadi kesalahan saat memproses link'
    });
  }
});

// Static files & fallback
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});