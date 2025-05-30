import fetch from 'node-fetch';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';


function calculateSMA(data, period, key = 'close') {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null); // pas assez de données pour calculer
        continue;
      }
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j][key];
      }
      sma.push(sum / period);
    }
    return sma;
  }
  

  function calculateRSI(data, period = 14, key = 'close') {
    const rsi = [];
    let gains = 0;
    let losses = 0;
  
    // Calcul des premiers gains et pertes moyens
    for (let i = 1; i <= period; i++) {
      const change = data[i][key] - data[i - 1][key];
      if (change > 0) gains += change;
      else losses += -change;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    rsi[period] = 100 - (100 / (1 + avgGain / avgLoss));
  
    // Calcul des RSI suivants
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i][key] - data[i - 1][key];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rsi[i] = 100 - (100 / (1 + avgGain / avgLoss));
    }
  
    // Remplir les premiers indices avec null car non calculés
    for (let i = 0; i < period; i++) {
      rsi[i] = null;
    }
    return rsi;
  }

  function calculateBollingerBands(data, period = 20, stdDevMult = 2, key = 'close') {
    const sma = calculateSMA(data, period, key);
    const bands = data.map((item, i) => {
      if (i < period - 1) {
        return { middle: null, upper: null, lower: null };
      }
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sumSq += Math.pow(data[j][key] - sma[i], 2);
      }
      const stdDev = Math.sqrt(sumSq / period);
      return {
        middle: sma[i],
        upper: sma[i] + stdDevMult * stdDev,
        lower: sma[i] - stdDevMult * stdDev
      };
    });
    return bands;
  }

  function calculateATR(data, period = 14) {
    const trs = [];
    for (let i = 1; i < data.length; i++) {
      const highLow = data[i].high - data[i].low;
      const highClose = Math.abs(data[i].high - data[i - 1].close);
      const lowClose = Math.abs(data[i].low - data[i - 1].close);
      trs.push(Math.max(highLow, highClose, lowClose));
    }
    const atr = [];
    let sum = 0;
    for (let i = 0; i < trs.length; i++) {
      sum += trs[i];
      if (i < period - 1) {
        atr.push(null);
      } else if (i === period - 1) {
        atr.push(sum / period);
      } else {
        const currentAtr = (atr[atr.length - 1] * (period - 1) + trs[i]) / period;
        atr.push(currentAtr);
      }
    }
    atr.unshift(null); // Parce que TR commence à 1, on décale pour aligner avec data
    return atr;
  }

  function calculateStochasticOscillator(data, kPeriod = 14, dPeriod = 3) {
    const kValues = [];
    const dValues = [];
    for (let i = 0; i < data.length; i++) {
      if (i < kPeriod - 1) {
        kValues.push(null);
        dValues.push(null);
        continue;
      }
      let lowMin = Infinity;
      let highMax = -Infinity;
      for (let j = i - kPeriod + 1; j <= i; j++) {
        if (data[j].low < lowMin) lowMin = data[j].low;
        if (data[j].high > highMax) highMax = data[j].high;
      }
      const close = data[i].close;
      const k = highMax === lowMin ? 0 : ((close - lowMin) / (highMax - lowMin)) * 100;
      kValues.push(k);
  
      if (i < kPeriod - 1 + dPeriod - 1) {
        dValues.push(null);
      } else {
        // Moyenne mobile simple des kValues pour %D
        let sum = 0;
        for (let x = i - dPeriod + 1; x <= i; x++) {
          sum += kValues[x];
        }
        dValues.push(sum / dPeriod);
      }
    }
    return { kValues, dValues };
  }
  
  function calculateEMA(data, period, key = 'close') {
    const ema = [];
    const k = 2 / (period + 1);
    let prevEma = null;
    for (let i = 0; i < data.length; i++) {
      const price = data[i][key];
      if (i < period - 1) {
        ema.push(null);
      } else if (i === period - 1) {
        // SMA initiale pour lancer l'EMA
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) sum += data[j][key];
        prevEma = sum / period;
        ema.push(prevEma);
      } else {
        const currentEma = price * k + prevEma * (1 - k);
        ema.push(currentEma);
        prevEma = currentEma;
      }
    }
    return ema;
  }

  function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9, key = 'close') {
    const emaFast = calculateEMA(data, fastPeriod, key);
    const emaSlow = calculateEMA(data, slowPeriod, key);
    const macdLine = [];
    for (let i = 0; i < data.length; i++) {
      if (emaFast[i] === null || emaSlow[i] === null) {
        macdLine.push(null);
      } else {
        macdLine.push(emaFast[i] - emaSlow[i]);
      }
    }
    const signalLine = calculateEMA(macdLine.map(v => ({ close: v === null ? 0 : v })), signalPeriod, 'close');
    const histogram = macdLine.map((v, i) => (v === null || signalLine[i] === null ? null : v - signalLine[i]));
    return { macdLine, signalLine, histogram };
  }
  
  export async function getBinanceKlines(symbol, interval = '1d', limit = 100) {
    const url = `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
    const data = await res.json();
  
    const klines = data.map(c => ({
      openTime: new Date(c[0]),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
      closeTime: new Date(c[6]),
      quoteAssetVolume: parseFloat(c[7]),
      numberOfTrades: c[8],
      takerBuyBaseVolume: parseFloat(c[9]),
      takerBuyQuoteVolume: parseFloat(c[10])
    }));
  
    // Calcul indicateurs
    const sma20 = calculateSMA(klines, 20);
    const sma50 = calculateSMA(klines, 50);
    const sma200 = calculateSMA(klines, 200);
  
    const ema12 = calculateEMA(klines, 12);
    const ema26 = calculateEMA(klines, 26);
  
    const macd = calculateMACD(klines);
  
    const rsi14 = calculateRSI(klines);
  
    const bollinger = calculateBollingerBands(klines);
  
    const atr14 = calculateATR(klines);
  
    const stochastic = calculateStochasticOscillator(klines);
  
    // Ajout des indicateurs à chaque kline
    const enrichedKlines = klines.map((kline, i) => ({
      ...kline,
      sma20: sma20[i],
      sma50: sma50[i],
      sma200: sma200[i],
      ema12: ema12[i],
      ema26: ema26[i],
      macdLine: macd.macdLine[i],
      macdSignal: macd.signalLine[i],
      macdHistogram: macd.histogram[i],
      rsi14: rsi14[i],
      bollingerMiddle: bollinger[i].middle,
      bollingerUpper: bollinger[i].upper,
      bollingerLower: bollinger[i].lower,
      atr14: atr14[i],
      stochasticK: stochastic.kValues[i],
      stochasticD: stochastic.dValues[i],
    }));
  
    return enrichedKlines;
  }