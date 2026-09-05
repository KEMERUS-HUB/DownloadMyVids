const express = require('express');
const path = require('path');
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

    // Gunakan metode GET ke Vevioz (lebih simpel)
    const apiUrl = `https://api.vevioz.com/api/button/?url=${encodeURIComponent(url)}`;
    console.log(`[Proxy] Memanggil: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Downloadmyvids/1.0)',
      },
    });

    console.log(`[Proxy] Status response: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Error dari Vevioz: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        success: false,
        message: `API Vevioz error: ${response.status}`,
        detail: errorText,
      });
    }

    const data = await response.json();
    console.log(`[Proxy] Data diterima dari Vevioz:`, JSON.stringify(data).slice(0, 200) + '...');

    res.json(data);
  } catch (err) {
    console.error('[Proxy] Error internal:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan di server proxy',
      error: err.message,
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
