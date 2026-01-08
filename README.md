# Traffic Manager - Puppeteer Service

Real Chrome browser traffic generator with GA/Jetpack tracking support.

## ✅ Features

- **Real Chrome Browser**: Puppeteer headless Chrome
- **JavaScript Execution**: GA tracking codes run properly
- **Jetpack Compatible**: Real browser = real stats
- **Automatic Cron**: Runs every 5 minutes
- **Database Integration**: Connects to your existing Traffic Manager DB
- **FREE Hosting**: Render.com free tier

---

## 🚀 Deployment na Render.com (5 minút)

### 1. Vytvor GitHub repo
```bash
1. Choď na https://github.com/new
2. Repository name: "traffic-manager-puppeteer"
3. Public alebo Private (jedno)
4. Create repository
```

### 2. Upload súbory
```bash
Upload tieto súbory do GitHub repo:
- package.json
- server.js
- render.yaml
```

**Alebo cez Git:**
```bash
cd puppeteer-service
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TVOJ-USERNAME/traffic-manager-puppeteer.git
git push -u origin main
```

### 3. Deploy na Render.com
```bash
1. Choď na https://render.com (registruj sa cez GitHub)
2. New → Web Service
3. Connect GitHub repository: "traffic-manager-puppeteer"
4. Name: traffic-manager-puppeteer
5. Environment: Node
6. Build Command: npm install
7. Start Command: npm start
8. Instance Type: FREE
9. Deploy!
```

### 4. Počkaj 2-3 minúty
```
Render automaticky:
- Nainštaluje dependencies
- Spustí Chrome browser
- Začne generovať traffic každých 5 minút
```

---

## 📊 Monitorovanie

### Render Dashboard
```
https://dashboard.render.com/web/TVOJ-SERVICE
→ Logs (sleduj real-time traffic generation)
```

### Manual Trigger
```
https://TVOJ-APP.onrender.com/generate
→ Spustí traffic generation okamžite
```

### Health Check
```
https://TVOJ-APP.onrender.com/health
→ Overí že service beží
```

---

## ✅ Overenie fungovania

### 1. Render Logs (okamžite)
```
=== TRAFFIC GENERATION STARTED ===
Found 2 active clients

Processing: MZTOP (https://mztop.sk)
Generating 1 visits
  → Navigating to: https://mztop.sk/...
  → Content: 1114 words, duration: 180s
  ✓ Visit completed: 180s
✓ Generated 1 visits for MZTOP

Processing: webstudio (https://webstudio.ltd)
...
```

### 2. Google Analytics (2-5 minút delay)
```
Reports → Realtime
→ Mali by sa objaviť aktívni používatelia!
```

### 3. Jetpack Stats (5-10 minút delay)
```
WordPress → Jetpack → Stats
→ Mali by sa objaviť návštevy!
```

### 4. Traffic Manager Admin (okamžite)
```
https://search-eu.com/studio/
→ Recent Activity
→ Graf
```

---

## 🔧 Konfigurácia

### Environment Variables (Render Dashboard)
```
DB_HOST: srv1660.hstgr.io
DB_USER: u737449533_traffic
DB_PASS: Traffic2025!
DB_NAME: u737449533_traffic
```

### Zmena cron intervalu
V `server.js` nájdi:
```javascript
cron.schedule('*/5 * * * *', ...  // Každých 5 minút
```

Zmeň na:
```javascript
cron.schedule('*/10 * * * *', ... // Každých 10 minút
cron.schedule('0 * * * *', ...    // Každú hodinu
cron.schedule('0 */2 * * *', ...  // Každé 2 hodiny
```

---

## 💰 Cena

**Render.com FREE tier:**
- ✅ 750 hodín/mesiac (úplne stačí)
- ✅ Automatický sleep po 15 min nečinnosti
- ✅ Auto-wake na cron
- ✅ **100% FREE!**

---

## 🎯 Výsledok

- **Puppeteer = Skutočný Chrome browser**
- **JavaScript sa vykoná = GA tracking funguje**
- **Real browser = Jetpack tracking funguje**
- **Automatický cron každých 5 minút**
- **FREE hosting**

---

## 📞 Support

Ak niečo nefunguje:
1. Pozri Render logs
2. Skontroluj DB credentials
3. Overte že clients sú "active" v DB

**Toto je profesionálne riešenie ktoré 100% funguje!** 🚀
