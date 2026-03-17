/**
 * テクニカル指標計算モジュール
 * Technical Indicators for Japanese Stock Analysis
 */

/**
 * Simple Moving Average
 */
function sma(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Exponential Moving Average
 */
function ema(data, period) {
  const result = [];
  const k = 2 / (period + 1);

  // First value is SMA
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
  }
  if (data.length < period) return data.map(() => null);

  result.length = period - 1;
  result.fill(null);
  result.push(sum / period);

  for (let i = period; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

/**
 * RSI (Relative Strength Index)
 */
function rsi(closes, period = 14) {
  const result = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }
  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
function macd(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEma = ema(closes, fastPeriod);
  const slowEma = ema(closes, slowPeriod);

  const macdLine = closes.map((_, i) => {
    if (fastEma[i] == null || slowEma[i] == null) return null;
    return fastEma[i] - slowEma[i];
  });

  const validMacd = macdLine.filter(v => v != null);
  const signalLine = ema(validMacd, signalPeriod);

  // Align signal line with macd line
  const signal = new Array(closes.length).fill(null);
  let si = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] != null) {
      signal[i] = signalLine[si] ?? null;
      si++;
    }
  }

  const histogram = closes.map((_, i) => {
    if (macdLine[i] == null || signal[i] == null) return null;
    return macdLine[i] - signal[i];
  });

  return { macdLine, signal, histogram };
}

/**
 * Bollinger Bands
 */
function bollingerBands(closes, period = 20, multiplier = 2) {
  const middle = sma(closes, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < closes.length; i++) {
    if (middle[i] == null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += Math.pow(closes[j] - middle[i], 2);
    }
    const std = Math.sqrt(sumSq / period);
    upper.push(middle[i] + multiplier * std);
    lower.push(middle[i] - multiplier * std);
  }

  return { upper, middle, lower };
}

/**
 * Average True Range (ATR)
 */
function atr(bars, period = 14) {
  const trueRanges = [];
  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      trueRanges.push(bars[i].high - bars[i].low);
    } else {
      const tr = Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close)
      );
      trueRanges.push(tr);
    }
  }
  return sma(trueRanges, period);
}

/**
 * Volume Weighted Average Price approximation over N days
 */
function vwap(bars, period = 20) {
  const result = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let totalPV = 0, totalV = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const typical = (bars[j].high + bars[j].low + bars[j].close) / 3;
      totalPV += typical * bars[j].volume;
      totalV += bars[j].volume;
    }
    result.push(totalV > 0 ? totalPV / totalV : null);
  }
  return result;
}

/**
 * On-Balance Volume (OBV)
 */
function obv(bars) {
  const result = [0];
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].close > bars[i - 1].close) {
      result.push(result[i - 1] + bars[i].volume);
    } else if (bars[i].close < bars[i - 1].close) {
      result.push(result[i - 1] - bars[i].volume);
    } else {
      result.push(result[i - 1]);
    }
  }
  return result;
}

/**
 * Stochastic Oscillator (%K and %D)
 */
function stochastic(bars, kPeriod = 14, dPeriod = 3) {
  const kLine = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < kPeriod - 1) {
      kLine.push(null);
      continue;
    }
    let highest = -Infinity, lowest = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (bars[j].high > highest) highest = bars[j].high;
      if (bars[j].low < lowest) lowest = bars[j].low;
    }
    const range = highest - lowest;
    kLine.push(range === 0 ? 50 : ((bars[i].close - lowest) / range) * 100);
  }

  const validK = kLine.filter(v => v != null);
  const dValues = sma(validK, dPeriod);
  const dLine = new Array(bars.length).fill(null);
  let di = 0;
  for (let i = 0; i < bars.length; i++) {
    if (kLine[i] != null) {
      dLine[i] = dValues[di] ?? null;
      di++;
    }
  }

  return { kLine, dLine };
}

/**
 * Ichimoku Cloud (一目均衡表) - essential for Japanese stock analysis
 */
function ichimoku(bars, tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52) {
  const highLow = (start, end) => {
    let highest = -Infinity, lowest = Infinity;
    for (let i = start; i <= end; i++) {
      if (bars[i].high > highest) highest = bars[i].high;
      if (bars[i].low < lowest) lowest = bars[i].low;
    }
    return (highest + lowest) / 2;
  };

  const tenkan = []; // 転換線
  const kijun = [];  // 基準線
  const senkouA = []; // 先行スパンA
  const senkouB = []; // 先行スパンB
  const chikou = [];  // 遅行スパン

  for (let i = 0; i < bars.length; i++) {
    tenkan.push(i >= tenkanPeriod - 1 ? highLow(i - tenkanPeriod + 1, i) : null);
    kijun.push(i >= kijunPeriod - 1 ? highLow(i - kijunPeriod + 1, i) : null);

    if (tenkan[i] != null && kijun[i] != null) {
      senkouA.push((tenkan[i] + kijun[i]) / 2);
    } else {
      senkouA.push(null);
    }

    senkouB.push(i >= senkouBPeriod - 1 ? highLow(i - senkouBPeriod + 1, i) : null);
  }

  return { tenkan, kijun, senkouA, senkouB };
}

module.exports = {
  sma, ema, rsi, macd, bollingerBands, atr, vwap, obv, stochastic, ichimoku
};
