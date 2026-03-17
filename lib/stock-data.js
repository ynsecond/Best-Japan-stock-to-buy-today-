const fetch = require('node-fetch');

// Yahoo Finance API for Japanese stocks
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const YAHOO_QUOTE_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

/**
 * Fetch historical price data for a Japanese stock ticker
 * @param {string} ticker - e.g. "7203" (Toyota)
 * @param {string} range - e.g. "3mo", "6mo", "1y"
 * @param {string} interval - e.g. "1d", "1wk"
 */
async function fetchHistoricalData(ticker, range = '6mo', interval = '1d') {
  const symbol = `${ticker}.T`;
  const url = `${YAHOO_FINANCE_BASE}${symbol}?range=${range}&interval=${interval}&includePrePost=false`;

  const resp = await fetch(url, { headers: HEADERS, timeout: 15000 });
  if (!resp.ok) throw new Error(`Yahoo Finance API error: ${resp.status}`);

  const data = await resp.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};

  const bars = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = quotes.open?.[i];
    const high = quotes.high?.[i];
    const low = quotes.low?.[i];
    const close = quotes.close?.[i];
    const volume = quotes.volume?.[i];
    if (close != null && volume != null) {
      bars.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        open: open ?? close,
        high: high ?? close,
        low: low ?? close,
        close,
        volume
      });
    }
  }
  return bars;
}

/**
 * Fetch current price for a ticker
 */
async function fetchCurrentPrice(ticker) {
  const symbol = `${ticker}.T`;
  const url = `${YAHOO_QUOTE_BASE}?symbols=${symbol}`;

  try {
    const resp = await fetch(url, { headers: HEADERS, timeout: 10000 });
    if (!resp.ok) {
      // Fallback: use chart API
      const bars = await fetchHistoricalData(ticker, '5d', '1d');
      if (bars.length > 0) return bars[bars.length - 1].close;
      return null;
    }
    const data = await resp.json();
    const quote = data.quoteResponse?.result?.[0];
    return quote?.regularMarketPrice ?? null;
  } catch (e) {
    // Fallback: use chart API
    try {
      const bars = await fetchHistoricalData(ticker, '5d', '1d');
      if (bars.length > 0) return bars[bars.length - 1].close;
    } catch (_) { /* ignore */ }
    return null;
  }
}

/**
 * Fetch quote summary for multiple tickers
 */
async function fetchQuotes(tickers) {
  const symbols = tickers.map(t => `${t}.T`).join(',');
  const url = `${YAHOO_QUOTE_BASE}?symbols=${symbols}`;

  try {
    const resp = await fetch(url, { headers: HEADERS, timeout: 20000 });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.quoteResponse?.result || [];
  } catch (e) {
    return [];
  }
}

/**
 * Get a curated list of major TSE stock tickers across sectors
 * Covers Nikkei 225, TOPIX Core 30, and high-liquidity stocks
 */
function getTSETickerUniverse() {
  return [
    // --- 自動車・輸送機器 (Automobiles & Transport Equipment) ---
    '7203', // トヨタ自動車
    '7267', // ホンダ
    '7261', // マツダ
    '7269', // スズキ
    '7201', // 日産自動車
    '7270', // SUBARU
    '7202', // いすゞ自動車
    '7211', // 三菱自動車
    // --- 電機・精密機器 (Electronics & Precision) ---
    '6758', // ソニーグループ
    '6861', // キーエンス
    '6902', // デンソー
    '6501', // 日立製作所
    '6503', // 三菱電機
    '6504', // 富士電機
    '6594', // 日本電産
    '6752', // パナソニック
    '6762', // TDK
    '6770', // アルプスアルパイン
    '6857', // アドバンテスト
    '6920', // レーザーテック
    '6981', // 村田製作所
    '6988', // 日東電工
    '7735', // SCREENホールディングス
    '7751', // キヤノン
    '7752', // リコー
    '8035', // 東京エレクトロン
    '6146', // ディスコ
    // --- 銀行・金融 (Banks & Finance) ---
    '8306', // 三菱UFJフィナンシャル・グループ
    '8316', // 三井住友フィナンシャルグループ
    '8411', // みずほフィナンシャルグループ
    '8308', // りそなホールディングス
    '8331', // 千葉銀行
    '8354', // ふくおかフィナンシャルグループ
    '8766', // 東京海上ホールディングス
    '8795', // T&Dホールディングス
    '8750', // 第一生命ホールディングス
    '8630', // SOMPOホールディングス
    '8601', // 大和証券グループ本社
    '8604', // 野村ホールディングス
    // --- 通信・IT (Telecom & IT) ---
    '9432', // 日本電信電話 (NTT)
    '9433', // KDDIe
    '9434', // ソフトバンク
    '9984', // ソフトバンクグループ
    '4689', // Zホールディングス
    '4755', // 楽天グループ
    '3938', // LINE
    '4307', // 野村総合研究所
    '9613', // NTTデータグループ
    '4684', // オービック
    '3659', // ネクソン
    '9697', // カプコン
    '7974', // 任天堂
    '3635', // コーエーテクモ
    // --- 商社 (Trading Companies) ---
    '8058', // 三菱商事
    '8031', // 三井物産
    '8001', // 伊藤忠商事
    '8053', // 住友商事
    '8002', // 丸紅
    // --- 医薬品・ヘルスケア (Pharma & Healthcare) ---
    '4502', // 武田薬品工業
    '4503', // アステラス製薬
    '4519', // 中外製薬
    '4523', // エーザイ
    '4568', // 第一三共
    '4578', // 大塚ホールディングス
    '4507', // 塩野義製薬
    '4543', // テルモ
    '4901', // 富士フイルムホールディングス
    // --- 素材・化学 (Materials & Chemicals) ---
    '4063', // 信越化学工業
    '4188', // 三菱ケミカルグループ
    '4005', // 住友化学
    '4021', // 日産化学
    '4042', // 東ソー
    '4183', // 三井化学
    '3407', // 旭化成
    '3402', // 東レ
    // --- 鉄鋼・非鉄金属 (Steel & Non-Ferrous Metals) ---
    '5401', // 日本製鉄
    '5411', // JFEホールディングス
    '5713', // 住友金属鉱山
    '5706', // 三井金属鉱業
    '5801', // 古河電気工業
    '5802', // 住友電気工業
    '5803', // フジクラ
    // --- 建設・不動産 (Construction & Real Estate) ---
    '1801', // 大成建設
    '1802', // 大林組
    '1803', // 清水建設
    '1812', // 鹿島建設
    '1925', // 大和ハウス工業
    '1928', // 積水ハウス
    '8801', // 三井不動産
    '8802', // 三菱地所
    '8830', // 住友不動産
    // --- 食品・飲料 (Food & Beverages) ---
    '2502', // アサヒグループホールディングス
    '2503', // キリンホールディングス
    '2801', // キッコーマン
    '2802', // 味の素
    '2914', // JT (日本たばこ産業)
    // --- 小売・サービス (Retail & Services) ---
    '3382', // セブン&アイ・ホールディングス
    '8267', // イオン
    '9843', // ニトリホールディングス
    '9983', // ファーストリテイリング
    '7532', // パン・パシフィック・インターナショナルHD
    // --- エネルギー・電力 (Energy & Utilities) ---
    '5020', // ENEOSホールディングス
    '9501', // 東京電力ホールディングス
    '9502', // 中部電力
    '1605', // INPEX
    // --- 運輸 (Transportation) ---
    '9020', // JR東日本
    '9021', // JR西日本
    '9022', // JR東海
    '9201', // JAL
    '9202', // ANA
    // --- 機械 (Machinery) ---
    '6301', // 小松製作所
    '6305', // 日立建機
    '6326', // クボタ
    '6367', // ダイキン工業
    '6471', // 日本精工
    '7011', // 三菱重工業
    '7013', // IHI
    // --- その他注目銘柄 (Other Notable) ---
    '2413', // エムスリー
    '3769', // GMOペイメントゲートウェイ
    '4661', // オリエンタルランド
    '6098', // リクルートホールディングス
    '6273', // SMC
    '9766', // コナミグループ
  ];
}

module.exports = {
  fetchHistoricalData,
  fetchCurrentPrice,
  fetchQuotes,
  getTSETickerUniverse
};
