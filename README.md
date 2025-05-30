# 📈 Predict-Crypto

**Analyse technique automatisée de cryptomonnaies avec envoi sur Discord, utilisant l'API Binance, OpenAI et Node.js.**

---

## ⭐ Fonctionnalités

- Récupère les données OHLCV de cryptos via l'API Binance
- Calcule de nombreux indicateurs techniques (RSI, MACD, SMA, EMA, Bollinger, ATR, Stochastique…)
- Génère une analyse technique synthétique grâce à l'API OpenAI (GPT-4o-mini)
- Envoie automatiquement l'analyse sur un salon Discord via Webhook
- Configuration simple via fichiers JSON et variables d'environnement

---

## 🛠️ Technologies utilisées

- **Node.js** (ES Modules)
- **node-fetch** (requêtes HTTP)
- **dotenv** (gestion des variables d'environnement)
- **API Binance** (données de marché)
- **API OpenAI** (analyse IA)
- **Discord Webhook** (notification)

---

## 📁 Structure du projet

```
Predict-Crypto/
│
├── binance.js         # Récupération et calculs sur les données Binance
├── discord.js         # Envoi de messages sur Discord via Webhook
├── openai.js          # Analyse technique via OpenAI
├── index.js           # Point d'entrée principal
├── json/
│   └── crypto.json    # Liste des cryptos à analyser
├── .env               # Variables d'environnement (à créer)
├── package.json
└── .gitignore
```

---

## ⚙️ Installation

1. **Cloner le dépôt**  
   ```bash
   git clone <url_du_repo>
   cd Predict-Crypto
   ```

2. **Installer les dépendances**  
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**  
   Crée un fichier `.env` à la racine avec :
   ```
   OPENAI_API_KEY=ta_cle_openai
   DISCORD_WEBHOOK_URL=ton_webhook_discord
   ```

4. **Définir les cryptos à analyser**  
   Modifie le fichier `json/crypto.json` :
   ```json
   {
     "crypto": [
       "eth/usdt",
       "btc/usdt"
     ]
   }
   ```

---

## 🚀 Utilisation

Lance simplement le script principal :
```bash
node index.js
```

L'analyse sera générée pour chaque crypto listée et envoyée sur Discord.

---

## 📦 Scripts et dépendances

- **Dépendances principales** :  
  - dotenv
  - node-fetch

---

## 📝 Exemple de message Discord généré

> 📊 Analyse ETH/USDT (4h) [Prix actuel : **xxxx**] :  
> Tendance actuelle : ...  
> Supports clés : ...  
> Résistances clés : ...  
> Plan de trade recommandé : ...  
> ...  
> *~12 Jours de bougies traités, sur une Timeframe **4h**, IA: gpt-4o-mini*

---

## 🔒 Sécurité

- Ne partage jamais ton fichier `.env` ni ta clé OpenAI.
- Les fichiers `.env` et `node_modules` sont déjà ignorés par git. 