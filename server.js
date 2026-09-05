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

    // Coba gunakan Vevioz dulu (support banyak platform)
    let data = await tryVevioz(url);
    if (data) {
      return res.json(data);
    }

    // Jika Vevioz gagal, coba YouTube-specific API
    if (isYouTubeUrl(url)) {
      console.log('[Proxy] Vevioz gagal, mencoba tubemp3.cc untuk YouTube');
      data = await tryTubemp3(url);
      if (data) {
        return res.json(data);
      }
    }

    // Jika semua gagal
    return res.status(500).json({
      success: false,
      message: 'Tidak dapat memproses link. Pastikan link valid dan platform didukung.',
    });
  } catch (err) {
    console.error('[Proxy] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- Fungsi helper ----------
async function tryVevioz(url) {
  try {
    const formData = new URLSearchParams();
    formData.append('url', url);

    const response = await fetch('https://api.vevioz.com/api/button/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://vevioz.com',
        'Referer': 'https://vevioz.com/',
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Vevioz] Status ${response.status}, response: ${text.slice(0, 200)}`);
      return null;
    }

    const json = await response.json();
    if (json.success) {
      console.log('[Vevioz] Berhasil');
      return json;
    } else {
      console.log('[Vevioz] Gagal (success: false)');
      return null;
    }
  } catch (err) {
    console.error('[Vevioz] Exception:', err.message);
    return null;
  }
}

async function tryTubemp3(url) {
  try {
    const apiUrl = `https://api.tubemp3.cc/api/ytdl?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Downloadmyvids/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`[Tubemp3] Status ${response.status}`);
      return null;
    }

    const json = await response.json();
    // Format response tubemp3: { title, thumbnail, download: { '720p': 'url', ... } }
    if (json && json.download) {
      // Ubah ke format yang sama seperti Vevioz
      const qualities = Object.entries(json.download).map(([label, url]) => ({ label, url }));
      return {
        success: true,
        data: {
          title: json.title || 'Video',
          thumbnail: json.thumbnail || '',
          download: Object.fromEntries(qualities.map(q => [q.label, q.url])),
        },
      };
    }
    return null;
  } catch (err) {
    console.error('[Tubemp3] Exception:', err.message);
    return null;
  }
}

function isYouTubeUrl(url) {
  return /(youtube\.com|youtu\.be)/i.test(url);
}

// Static files & fallback
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
