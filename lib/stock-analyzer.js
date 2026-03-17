const { fetchHistoricalData, fetchCurrentPrice, getTSETickerUniverse } = require('./stock-data');
const {
  sma, ema, rsi, macd, bollingerBands, atr, vwap, obv, stochastic, ichimoku
} = require('./technical-indicators');

// Ticker name mapping for display
const TICKER_NAMES = {
  '7203': 'トヨタ自動車', '7267': 'ホンダ', '7261': 'マツダ', '7269': 'スズキ',
  '7201': '日産自動車', '7270': 'SUBARU', '7202': 'いすゞ自動車', '7211': '三菱自動車',
  '6758': 'ソニーグループ', '6861': 'キーエンス', '6902': 'デンソー',
  '6501': '日立製作所', '6503': '三菱電機', '6504': '富士電機',
  '6594': '日本電産', '6752': 'パナソニック', '6762': 'TDK',
  '6770': 'アルプスアルパイン', '6857': 'アドバンテスト', '6920': 'レーザーテック',
  '6981': '村田製作所', '6988': '日東電工', '7735': 'SCREENホールディングス',
  '7751': 'キヤノン', '7752': 'リコー', '8035': '東京エレクトロン', '6146': 'ディスコ',
  '8306': '三菱UFJ', '8316': '三井住友FG', '8411': 'みずほFG',
  '8308': 'りそなHD', '8331': '千葉銀行', '8354': 'ふくおかFG',
  '8766': '東京海上HD', '8795': 'T&D HD', '8750': '第一生命HD',
  '8630': 'SOMPO HD', '8601': '大和証券', '8604': '野村HD',
  '9432': 'NTT', '9433': 'KDDI', '9434': 'ソフトバンク',
  '9984': 'ソフトバンクG', '4689': 'Zホールディングス', '4755': '楽天グループ',
  '3938': 'LINE', '4307': '野村総合研究所', '9613': 'NTTデータ',
  '4684': 'オービック', '3659': 'ネクソン', '9697': 'カプコン',
  '7974': '任天堂', '3635': 'コーエーテクモ',
  '8058': '三菱商事', '8031': '三井物産', '8001': '伊藤忠商事',
  '8053': '住友商事', '8002': '丸紅',
  '4502': '武田薬品', '4503': 'アステラス製薬', '4519': '中外製薬',
  '4523': 'エーザイ', '4568': '第一三共', '4578': '大塚HD',
  '4507': '塩野義製薬', '4543': 'テルモ', '4901': '富士フイルムHD',
  '4063': '信越化学工業', '4188': '三菱ケミカルG', '4005': '住友化学',
  '4021': '日産化学', '4042': '東ソー', '4183': '三井化学',
  '3407': '旭化成', '3402': '東レ',
  '5401': '日本製鉄', '5411': 'JFE HD', '5713': '住友金属鉱山',
  '5706': '三井金属鉱業', '5801': '古河電工', '5802': '住友電工', '5803': 'フジクラ',
  '1801': '大成建設', '1802': '大林組', '1803': '清水建設', '1812': '鹿島建設',
  '1925': '大和ハウス工業', '1928': '積水ハウス',
  '8801': '三井不動産', '8802': '三菱地所', '8830': '住友不動産',
  '2502': 'アサヒGHD', '2503': 'キリンHD', '2801': 'キッコーマン',
  '2802': '味の素', '2914': 'JT',
  '3382': 'セブン&アイ', '8267': 'イオン', '9843': 'ニトリHD',
  '9983': 'ファーストリテイリング', '7532': 'PPIHD',
  '5020': 'ENEOS HD', '9501': '東京電力HD', '9502': '中部電力', '1605': 'INPEX',
  '9020': 'JR東日本', '9021': 'JR西日本', '9022': 'JR東海',
  '9201': 'JAL', '9202': 'ANA',
  '6301': '小松製作所', '6305': '日立建機', '6326': 'クボタ',
  '6367': 'ダイキン工業', '6471': '日本精工', '7011': '三菱重工業', '7013': 'IHI',
  '2413': 'エムスリー', '3769': 'GMO-PG', '4661': 'オリエンタルランド',
  '6098': 'リクルートHD', '6273': 'SMC', '9766': 'コナミG',
};

const SECTOR_MAP = {
  '7203': '自動車', '7267': '自動車', '7261': '自動車', '7269': '自動車',
  '7201': '自動車', '7270': '自動車', '7202': '自動車', '7211': '自動車',
  '6758': '電機', '6861': '電機', '6902': '電機', '6501': '電機',
  '6503': '電機', '6504': '電機', '6594': '電機', '6752': '電機',
  '6762': '電機', '6770': '電機', '6857': '半導体', '6920': '半導体',
  '6981': '電子部品', '6988': '電子部品', '7735': '半導体', '7751': '電機',
  '7752': '電機', '8035': '半導体', '6146': '半導体',
  '8306': '銀行', '8316': '銀行', '8411': '銀行', '8308': '銀行',
  '8331': '銀行', '8354': '銀行', '8766': '保険', '8795': '保険',
  '8750': '保険', '8630': '保険', '8601': '証券', '8604': '証券',
  '9432': '通信', '9433': '通信', '9434': '通信', '9984': 'IT',
  '4689': 'IT', '4755': 'IT', '3938': 'IT', '4307': 'IT', '9613': 'IT',
  '4684': 'IT', '3659': 'ゲーム', '9697': 'ゲーム', '7974': 'ゲーム', '3635': 'ゲーム',
  '8058': '商社', '8031': '商社', '8001': '商社', '8053': '商社', '8002': '商社',
  '4502': '医薬品', '4503': '医薬品', '4519': '医薬品', '4523': '医薬品',
  '4568': '医薬品', '4578': '医薬品', '4507': '医薬品', '4543': '医療機器',
  '4901': '精密化学', '4063': '化学', '4188': '化学', '4005': '化学',
  '4021': '化学', '4042': '化学', '4183': '化学', '3407': '化学', '3402': '繊維',
  '5401': '鉄鋼', '5411': '鉄鋼', '5713': '非鉄金属', '5706': '非鉄金属',
  '5801': '非鉄金属', '5802': '非鉄金属', '5803': '非鉄金属',
  '1801': '建設', '1802': '建設', '1803': '建設', '1812': '建設',
  '1925': '建設', '1928': '建設', '8801': '不動産', '8802': '不動産', '8830': '不動産',
  '2502': '食品', '2503': '食品', '2801': '食品', '2802': '食品', '2914': '食品',
  '3382': '小売', '8267': '小売', '9843': '小売', '9983': '小売', '7532': '小売',
  '5020': 'エネルギー', '9501': '電力', '9502': '電力', '1605': '資源',
  '9020': '運輸', '9021': '運輸', '9022': '運輸', '9201': '空運', '9202': '空運',
  '6301': '機械', '6305': '機械', '6326': '機械', '6367': '機械',
  '6471': '機械', '7011': '重工', '7013': '重工',
  '2413': 'ヘルステック', '3769': 'IT', '4661': 'レジャー',
  '6098': 'サービス', '6273': '機械', '9766': 'ゲーム',
};

/**
 * Analyze a single stock using multiple technical and quantitative strategies
 * Returns a composite score (higher = stronger buy signal)
 */
function analyzeStock(bars) {
  if (!bars || bars.length < 60) return null;

  const closes = bars.map(b => b.close);
  const volumes = bars.map(b => b.volume);
  const n = closes.length;
  const latestClose = closes[n - 1];

  const scores = {};
  const reasons = [];

  // === 1. Trend Analysis (トレンド分析) ===
  const sma5 = sma(closes, 5);
  const sma25 = sma(closes, 25);
  const sma75 = sma(closes, 75);

  // Golden cross detection (5日線が25日線を上抜け)
  if (sma5[n - 1] && sma25[n - 1] && sma5[n - 2] && sma25[n - 2]) {
    if (sma5[n - 1] > sma25[n - 1] && sma5[n - 2] <= sma25[n - 2]) {
      scores.goldenCross = 15;
      reasons.push('ゴールデンクロス発生（5日/25日移動平均線）');
    } else if (sma5[n - 1] > sma25[n - 1]) {
      scores.trendUp = 8;
      reasons.push('短期上昇トレンド継続中');
    }
  }

  // Triple moving average alignment (パーフェクトオーダー)
  if (sma5[n - 1] && sma25[n - 1] && sma75[n - 1]) {
    if (sma5[n - 1] > sma25[n - 1] && sma25[n - 1] > sma75[n - 1]) {
      scores.perfectOrder = 10;
      reasons.push('パーフェクトオーダー成立（強い上昇相場）');
    }
  }

  // Price above key moving averages
  if (sma25[n - 1] && latestClose > sma25[n - 1]) {
    scores.aboveSma25 = 5;
  }

  // === 2. RSI Analysis (RSI分析) ===
  const rsiValues = rsi(closes, 14);
  const latestRsi = rsiValues[n - 1];
  if (latestRsi != null) {
    if (latestRsi >= 30 && latestRsi <= 45) {
      scores.rsiOversold = 12;
      reasons.push(`RSI反発ゾーン (${latestRsi.toFixed(1)}) - 売られすぎから回復中`);
    } else if (latestRsi > 45 && latestRsi <= 60) {
      scores.rsiNeutral = 6;
      reasons.push(`RSI適正水準 (${latestRsi.toFixed(1)})`);
    } else if (latestRsi > 70) {
      scores.rsiOverbought = -5;
    } else if (latestRsi < 30) {
      // Check if RSI is turning up from oversold
      if (n >= 3 && rsiValues[n - 2] != null && latestRsi > rsiValues[n - 2]) {
        scores.rsiReversal = 10;
        reasons.push(`RSI底打ち反転シグナル (${latestRsi.toFixed(1)})`);
      }
    }
  }

  // === 3. MACD Analysis (MACD分析) ===
  const macdResult = macd(closes);
  const mLine = macdResult.macdLine;
  const sig = macdResult.signal;
  const hist = macdResult.histogram;

  if (mLine[n - 1] != null && sig[n - 1] != null) {
    // MACD golden cross
    if (mLine[n - 1] > sig[n - 1] && mLine[n - 2] != null && sig[n - 2] != null && mLine[n - 2] <= sig[n - 2]) {
      scores.macdCross = 14;
      reasons.push('MACDゴールデンクロス発生');
    }
    // MACD histogram turning positive
    if (hist[n - 1] > 0 && hist[n - 2] != null && hist[n - 2] <= 0) {
      scores.macdHistPositive = 8;
      reasons.push('MACDヒストグラムがプラス転換');
    }
    // MACD above zero line and rising
    if (mLine[n - 1] > 0 && mLine[n - 2] != null && mLine[n - 1] > mLine[n - 2]) {
      scores.macdBullish = 5;
    }
  }

  // === 4. Bollinger Bands (ボリンジャーバンド分析) ===
  const bb = bollingerBands(closes, 20, 2);
  if (bb.lower[n - 1] != null && bb.upper[n - 1] != null) {
    const bbWidth = (bb.upper[n - 1] - bb.lower[n - 1]) / bb.middle[n - 1];

    // Price bouncing off lower band
    if (latestClose <= bb.lower[n - 1] * 1.02 && closes[n - 1] > closes[n - 2]) {
      scores.bbBounce = 12;
      reasons.push('ボリンジャーバンド下限からの反発');
    }
    // Squeeze (low volatility → breakout potential)
    if (bbWidth < 0.05) {
      scores.bbSqueeze = 7;
      reasons.push('ボリンジャーバンドスクイーズ（ブレイクアウト予兆）');
    }
  }

  // === 5. Volume Analysis (出来高分析) ===
  const volSma20 = sma(volumes, 20);
  if (volSma20[n - 1] != null && volumes[n - 1] > 0) {
    const volRatio = volumes[n - 1] / volSma20[n - 1];
    if (volRatio > 2.0 && closes[n - 1] > closes[n - 2]) {
      scores.volumeSurge = 12;
      reasons.push(`出来高急増（通常の${volRatio.toFixed(1)}倍）+ 株価上昇`);
    } else if (volRatio > 1.5 && closes[n - 1] > closes[n - 2]) {
      scores.volumeUp = 7;
      reasons.push(`出来高増加（通常の${volRatio.toFixed(1)}倍）`);
    }
  }

  // OBV trend
  const obvValues = obv(bars);
  if (obvValues.length >= 10) {
    const obvSma = sma(obvValues.slice(-20), 10);
    if (obvSma.length >= 2) {
      const lastObvSma = obvSma[obvSma.length - 1];
      const prevObvSma = obvSma[obvSma.length - 2];
      if (lastObvSma != null && prevObvSma != null && lastObvSma > prevObvSma) {
        scores.obvRising = 5;
        reasons.push('OBV上昇トレンド（買い圧力増加）');
      }
    }
  }

  // === 6. Ichimoku Cloud (一目均衡表分析) ===
  if (bars.length >= 52) {
    const ich = ichimoku(bars);
    const i = n - 1;

    // Price above cloud
    if (ich.senkouA[i] != null && ich.senkouB[i] != null) {
      const cloudTop = Math.max(ich.senkouA[i], ich.senkouB[i]);
      const cloudBottom = Math.min(ich.senkouA[i], ich.senkouB[i]);

      if (latestClose > cloudTop) {
        scores.ichimokuAboveCloud = 8;
        reasons.push('一目均衡表: 雲の上（強気シグナル）');
      }
      // Breaking above cloud
      if (closes[n - 2] <= cloudTop && latestClose > cloudTop) {
        scores.ichimokuBreakout = 12;
        reasons.push('一目均衡表: 雲抜け発生（強い買いシグナル）');
      }
    }

    // Tenkan > Kijun (転換線 > 基準線)
    if (ich.tenkan[i] != null && ich.kijun[i] != null && ich.tenkan[i] > ich.kijun[i]) {
      scores.ichimokuTK = 5;
    }
  }

  // === 7. Stochastic (ストキャスティクス) ===
  const stoch = stochastic(bars);
  if (stoch.kLine[n - 1] != null && stoch.dLine[n - 1] != null) {
    if (stoch.kLine[n - 1] < 30 && stoch.kLine[n - 1] > stoch.dLine[n - 1]) {
      scores.stochBullish = 8;
      reasons.push('ストキャスティクス: 売られすぎゾーンからの反転');
    }
  }

  // === 8. Momentum & Price Action (モメンタム) ===
  // Recent price momentum (5-day return)
  if (n >= 6) {
    const fiveDayReturn = (latestClose - closes[n - 6]) / closes[n - 6] * 100;
    if (fiveDayReturn > 0 && fiveDayReturn <= 5) {
      scores.momentum = 6;
      reasons.push(`直近5日間の騰落率: +${fiveDayReturn.toFixed(1)}%`);
    } else if (fiveDayReturn > 5) {
      scores.strongMomentum = 4; // Slightly less as it might be overextended
    }
  }

  // Consecutive up days
  let consecutiveUp = 0;
  for (let i = n - 1; i > 0 && i > n - 6; i--) {
    if (closes[i] > closes[i - 1]) consecutiveUp++;
    else break;
  }
  if (consecutiveUp >= 3 && consecutiveUp <= 5) {
    scores.consecutiveUp = 5;
    reasons.push(`${consecutiveUp}日連続上昇中`);
  }

  // === 9. Support/Resistance (サポート・レジスタンス) ===
  // Price near recent support that held
  const recentLows = bars.slice(-20).map(b => b.low);
  const supportLevel = Math.min(...recentLows);
  if (latestClose < supportLevel * 1.03 && latestClose > supportLevel) {
    scores.nearSupport = 8;
    reasons.push('直近サポートライン付近（反発期待）');
  }

  // === 10. Volatility Assessment (ボラティリティ) ===
  const atrValues = atr(bars, 14);
  if (atrValues[n - 1] != null) {
    const atrPct = (atrValues[n - 1] / latestClose) * 100;
    if (atrPct >= 1.5 && atrPct <= 4.0) {
      scores.volatility = 4;
      reasons.push(`適正ボラティリティ (ATR: ${atrPct.toFixed(1)}%)`);
    }
  }

  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);

  return {
    totalScore,
    scores,
    reasons,
    latestClose,
    latestRsi
  };
}

/**
 * Main function: Find the best stock to buy today from TSE universe
 */
async function analyzeAndFindBestStock() {
  const tickers = getTSETickerUniverse();
  const results = [];
  const batchSize = 5;
  let progress = 0;

  console.log(`Analyzing ${tickers.length} stocks...`);

  // Process in batches to avoid rate limiting
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const promises = batch.map(async (ticker) => {
      try {
        const bars = await fetchHistoricalData(ticker, '6mo', '1d');
        if (!bars || bars.length < 60) return null;

        const analysis = analyzeStock(bars);
        if (!analysis) return null;

        return {
          ticker,
          name: TICKER_NAMES[ticker] || ticker,
          sector: SECTOR_MAP[ticker] || '不明',
          price: analysis.latestClose,
          totalScore: analysis.totalScore,
          scores: analysis.scores,
          reasons: analysis.reasons,
          rsi: analysis.latestRsi
        };
      } catch (err) {
        console.error(`Error analyzing ${ticker}: ${err.message}`);
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(r => { if (r && r.totalScore > 0) results.push(r); });

    progress += batch.length;
    console.log(`  Progress: ${progress}/${tickers.length}`);

    // Small delay between batches to be respectful to the API
    if (i + batchSize < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  if (results.length === 0) return null;

  // Sort by total score descending
  results.sort((a, b) => b.totalScore - a.totalScore);

  const best = results[0];
  console.log(`\nBest stock found: ${best.ticker} ${best.name} (Score: ${best.totalScore})`);

  return best;
}

module.exports = { analyzeAndFindBestStock, analyzeStock };
