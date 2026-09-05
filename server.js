const express = require('express');
const path = require('path');
const { aioDownloader } = require('@lmna22/aio-downloader');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL diperlukan' });
    }
    console.log('[Scan] URL:', url);

    const result = await aioDownloader(url);
    if (!result || !result.status) {
      throw new Error(result?.message || 'Gagal memproses link');
    }

    const data = result.data || {};
    const title = data.title || result.title || 'Video';
    const thumbnail = data.thumbnail || '';
    const download = data.download || {};

    // Kumpulkan kualitas
    const qualities = [];
    for (const [key, value] of Object.entries(download)) {
      if (typeof value === 'string' && value.startsWith('http')) {
        let label = key;
        // Normalisasi label
        if (label.match(/1080/i)) label = '1080p';
        else if (label.match(/720/i)) label = '720p';
        else if (label.match(/480/i)) label = '480p';
        else if (label.match(/360/i)) label = '360p';
        else if (label.match(/144/i)) label = '144p';
        else label = label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        qualities.push({ label, url: value });
      }
    }

    if (qualities.length === 0) {
      throw new Error('Tidak ditemukan link download');
    }

    res.json({
      success: true,
      data: {
        title,
        thumbnail,
        download: Object.fromEntries(qualities.map(q => [q.label, q.url]))
      }
    });

  } catch (err) {
    console.error('[Scan] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));