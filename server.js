const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // opsional, bisa pakai global fetch
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL diperlukan' });

    // Gunakan API YouTube yang stabil
    const apiUrl = `https://yt-downloader-api.vercel.app/api?url=${encodeURIComponent(url)}`;
    console.log('[Proxy] Memanggil:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Downloadmyvids/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[API] Error response:', text);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Data diterima:', JSON.stringify(data).slice(0, 300));

    // Format response dari API ini: { title, thumbnail, download: { '720p': 'url', ... } }
    if (!data.download || Object.keys(data.download).length === 0) {
      throw new Error('Tidak ada link download');
    }

    // Kirim balik dengan format yang sama seperti sebelumnya
    const qualities = Object.entries(data.download).map(([label, url]) => ({ label, url }));
    const downloadObj = {};
    qualities.forEach(q => { downloadObj[q.label] = q.url; });

    res.json({
      success: true,
      data: {
        title: data.title || 'Video',
        thumbnail: data.thumbnail || '',
        download: downloadObj,
      },
    });

  } catch (err) {
    console.error('[Scan] Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal memproses link' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
