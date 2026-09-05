const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parse JSON body
app.use(express.json());

// Middleware untuk static files
app.use(express.static(path.join(__dirname, 'public')));

// ===== PROXY ENDPOINT =====
app.post('/api/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL tidak boleh kosong' });
    }

    // Panggil API Vevioz dari server (bebas CORS)
    const response = await fetch('https://api.vevioz.com/api/button/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ url }),
    });

    const data = await response.json();
    res.json(data); // Kirim balik ke frontend
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal memproses link' });
  }
});

// Fallback: semua request ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
