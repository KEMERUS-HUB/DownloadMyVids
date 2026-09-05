const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk static files
app.use(express.static(path.join(__dirname, 'public')));

// (Opsional) Route proxy untuk menghindari CORS – bisa diaktifkan jika diperlukan
// app.use(express.json());
// app.post('/api/scan', async (req, res) => { ... });

// Fallback: semua request ke index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});