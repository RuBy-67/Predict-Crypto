import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { getBinanceKlines } from "./binance.js";
import { analyzeWithOpenAI } from "./openai.js";
import { postDiscordWebhook } from "./discord.js";

dotenv.config();

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

async function main() {
  try {
    // Lire la liste des cryptos
    const raw = await readFile("./json/crypto.json", "utf-8");
    const { crypto: cryptos } = JSON.parse(raw);

    for (const symbol of cryptos) {
      const symbolBinance = symbol.replace("/", "").toUpperCase();

      // Récupérer les données 4h (ex: 70 dernières bougies)
      const klines = await getBinanceKlines(symbolBinance, "4h", 70);

      // Formater les données en texte simple pour OpenAI
      const ohlcFullText = klines
        .map(
          (k) =>
            `${k.openTime.toISOString().slice(0, 10)},${k.open},${k.high},${
              k.low
            },${k.close},${k.volume.toFixed(2)},${k.quoteAssetVolume.toFixed(
              2
            )},${k.numberOfTrades},${k.takerBuyBaseVolume.toFixed(2)}`
        )
        .join("\n");

      // Prendre la dernière bougie (la plus récente) pour les indicateurs
      const last = klines[klines.length - 1];

      // Construire la chaîne des indicateurs formatés pour le prompt
      const indicatorsText = `RSI(14) : **${last.rsi14?.toFixed(2) ?? "N/A"}**, MACD : **${last.macdLine?.toFixed(4) ?? "N/A"}** (signal : **${last.macdSignal?.toFixed(4) ?? "N/A"}**, histogramme : **${last.macdHistogram?.toFixed(4) ?? "N/A"}**), SMA20 : **${last.sma20?.toFixed(4) ?? "N/A"}**, SMA50 : **${last.sma50?.toFixed(4) ?? "N/A"}**, SMA200 : **${last.sma200?.toFixed(4) ?? "N/A"}**, EMA12 : **${last.ema12?.toFixed(4) ?? "N/A"}**, EMA26 : **${last.ema26?.toFixed(4) ?? "N/A"}**, Bollinger Bands : upper **${last.bollingerUpper?.toFixed(4) ?? "N/A"}**, middle **${last.bollingerMiddle?.toFixed(4) ?? "N/A"}**, lower **${last.bollingerLower?.toFixed(4) ?? "N/A"}**, ATR14 : **${last.atr14?.toFixed(4) ?? "N/A"}**, Stoch %K : **${last.stochasticK?.toFixed(2) ?? "N/A"}**, %D : **${last.stochasticD?.toFixed(2) ?? "N/A"}**`;

      const prompt = `Tu es un expert en analyse technique de marché dans le secteur des cryptomonnaies, spécialisé dans l'interprétation des données OHLCV sur une timeframe de 4h.
Voici les données OHLC sur une timeframe de 4h pour ${symbol} (format: date, open, high, low, close, volume, quoteAssetVolume, numberOfTrades, takerBuyBaseVolume) :
${ohlcFullText}

Indicateurs techniques calculés sur les dernières bougies :
${indicatorsText}

En te basant uniquement sur ces données, réalise une analyse technique synthétique sous la forme suivante (texte brut, uniquement les chiffres et le symbole entre ** et **, sans code ni markdown) :

📊 Analyse ${symbol.toUpperCase()} (4h) [Prix actuel : **${last.close}**] :

Tendance actuelle : [Haussière/Baissière/Range] en précisant la probabilitée de la tendance (X%, Y%, Z%)
Patterns détectés : [liste des patterns détectés, ou "Aucun"]  
Supports clés : [valeurs en USDT/USD ou "Non identifiés"]  
Résistances clés : [valeurs en USDT/USD ou "Non identifiées"]  
Indicateurs : [RSI, MACD, autres indicateurs pertinents, ou "Indicateurs non calculés"]  

Plan de trade recommandé (Long ou Short) :  
- Point d'entrée optimal (pas forcément au prix actuel, privilégier un niveau technique) :  
- Stop loss :  
- Take profit(s) :  


Donne ensuite un plan de trade plus risqué mais qui a un profit potentiel plus élevé,
- Point d'entrée optimal (pas forcément au prix actuel, privilégier un niveau technique) :  
- Stop loss :  
- Take profit(s) :  

Merci de justifier le point d'entrée choisi en fonction des indicateurs et niveaux techniques. (pour les 2 trades)
N'utilise pas le prix actuel comme point d'entrée sauf si c'est justifié par les indicateurs.
Le point d'entrée ne doit pas être non plus supèrieur au prix actuel.

Si tu proposes un trade, précise le pourcentage de chance de succès, fonction des indicateurs et niveaux techniques (difficulté).
Donne également le profit potentiel en %, fonction du point d'entrée, du stop loss et du take profit.
Donne également le montant en USDT de la position à ouvrir, fonction du point d'entrée, du stop loss et du take profit et donc sont profit potentiel.
Si tu proposes à la fois un long et un short, écrit les points d'entrée, stop loss et take profit pour chaque trade et leurs probabilités de succès (risque encouru).


Conclusion : [phrase synthétique résumant l’analyse et conseils éventuels ainsi que l'attitude à adopter, et essaie de prédire la prochaine bougie]

Fournis une réponse concise et claire, adaptée à un post Discord, sans utiliser de balises markdown ni formatage spécial. Ne donne que des informations fiables basées sur les données fournies, et évite toute supposition non justifiée.
`;
      // Appeler OpenAI
      const analysis = await analyzeWithOpenAI(prompt);

      // Poster sur Discord
      const messageDiscord = `${analysis}\n\n *~12 Jours de bougies traités, sur une Timeframe **4h**, IA: gpt-4o-mini\n\n> Toute décision d’investissement est prise sous la seule responsabilité de l’utilisateur, qui assume pleinement les risques liés à ses choix financiers, y compris la perte totale ou partielle de son capital.*\n\n**-------------------------------------------------** `;
      
      for (let i = 0; i < messageDiscord.length; i += 2000) {
        await postDiscordWebhook(webhookUrl, messageDiscord.slice(i, i + 2000));
      }
    }
  } catch (err) {
    console.error("Erreur:", err);
  }
}

main();
