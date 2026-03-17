const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const { analyzeAndFindBestStock } = require('./lib/stock-analyzer');
const { fetchCurrentPrice } = require('./lib/stock-data');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Setup ---
const db = new Database(path.join(__dirname, 'data', 'history.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS detection_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    sector TEXT,
    detected_at TEXT NOT NULL,
    detected_price REAL NOT NULL,
    current_price REAL,
    change_pct REAL,
    reasons TEXT,
    scores TEXT,
    last_updated TEXT
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

// Find the best stock to buy today
app.post('/api/find-best-stock', async (req, res) => {
  try {
    const result = await analyzeAndFindBestStock();
    if (!result) {
      return res.status(404).json({ error: '分析可能な銘柄が見つかりませんでした。' });
    }

    // Save to history
    const stmt = db.prepare(`
      INSERT INTO detection_history (ticker, name, sector, detected_at, detected_price, current_price, change_pct, reasons, scores, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(
      result.ticker,
      result.name,
      result.sector || '',
      now,
      result.price,
      result.price,
      JSON.stringify(result.reasons),
      JSON.stringify(result.scores),
      now
    );

    res.json(result);
  } catch (err) {
    console.error('Error finding best stock:', err);
    res.status(500).json({ error: '銘柄分析中にエラーが発生しました: ' + err.message });
  }
});

// Get detection history
app.get('/api/history', (req, res) => {
  const rows = db.prepare('SELECT * FROM detection_history ORDER BY detected_at DESC').all();
  res.json(rows);
});

// Update prices for all history items
app.post('/api/history/update-prices', async (req, res) => {
  try {
    const rows = db.prepare('SELECT id, ticker, detected_price FROM detection_history').all();
    const updateStmt = db.prepare(`
      UPDATE detection_history SET current_price = ?, change_pct = ?, last_updated = ? WHERE id = ?
    `);

    const now = new Date().toISOString();
    let updated = 0;

    for (const row of rows) {
      try {
        const currentPrice = await fetchCurrentPrice(row.ticker);
        if (currentPrice !== null) {
          const changePct = ((currentPrice - row.detected_price) / row.detected_price) * 100;
          updateStmt.run(currentPrice, changePct, now, row.id);
          updated++;
        }
      } catch (e) {
        console.error(`Failed to update price for ${row.ticker}:`, e.message);
      }
    }

    res.json({ updated, total: rows.length });
  } catch (err) {
    console.error('Error updating prices:', err);
    res.status(500).json({ error: '価格更新中にエラーが発生しました。' });
  }
});

// Delete a history item
app.delete('/api/history/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM detection_history WHERE id = ?');
  const result = stmt.run(req.params.id);
  if (result.changes > 0) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'レコードが見つかりません。' });
  }
});

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`🚀 Best Japan Stock Picker running at http://localhost:${PORT}`);
});
