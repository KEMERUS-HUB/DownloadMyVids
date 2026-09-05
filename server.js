const express = require('express');
const path = require('path');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL diperlukan' });

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ success: false, message: 'URL YouTube tidak valid' });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnails?.[0]?.url || '';

    // Ambil semua format video
    const formats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .map(f => ({
        label: `${f.qualityLabel}`,
        url: f.url,
        quality: f.qualityLabel,
      }));

    // Sortir dari tertinggi ke terendah
    const order = ['1080p', '720p', '480p', '360p', '144p'];
    const sorted = formats.sort((a, b) => {
      const ia = order.indexOf(a.quality);
      const ib = order.indexOf(b.quality);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    // Hapus duplikat kualitas
    const seen = new Set();
    const unique = sorted.filter(f => {
      if (seen.has(f.quality)) return false;
      seen.add(f.quality);
      return true;
    });

    if (unique.length === 0) {
      throw new Error('Tidak ada format video yang tersedia');
    }

    res.json({
      success: true,
      data: {
        title,
        thumbnail,
        download: Object.fromEntries(unique.map(f => [f.label, f.url])),
      },
    });
  } catch (err) {
    console.error('[Scan] Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal memproses link YouTube' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));