# Traffic Manager - FREE Proxy Version

🆓 **Používa tvoje vlastné slovenské/české proxy servery!**

---

## 🚀 Setup (5 minút)

### 1. Upload na GitHub
```
Vytvor repo: traffic-manager-puppeteer
Upload všetky súbory z tohto ZIP
```

### 2. Deploy na Render.com
```
Render → New Web Service
→ Connect GitHub repo
→ Deploy!
```

### 3. Pridaj PROXY_LIST env var
```
Render Dashboard → Environment

Key: PROXY_LIST
Value: (obsah z PROXY_LIST.txt - skopíruj celý)

Príklad:
82.119.96.254:80,85.248.57.129:4153,188.167.178.90:4145,...
```

### 4. Redeploy
```
Render automaticky redeployuje s novými proxy.
```

---

## ✅ Ako to funguje

### Proxy Rotation
- Máš **~90 free proxy** (SK, CZ, PL, HU)
- Každý visit = **iná proxy** (round-robin)
- Automatická detekcia HTTP vs SOCKS5 podľa portu

### Port Detection
```
80, 8080, 3128 → HTTP proxy
1080, 4145, 4153 → SOCKS5 proxy
```

### Visit Flow
```
Visit 1 → Proxy #1 (82.119.96.254:80)
Visit 2 → Proxy #2 (85.248.57.129:4153)
Visit 3 → Proxy #3 (188.167.178.90:4145)
...
Visit 91 → Proxy #1 (začne od začiatku)
```

---

## 📊 Render Logs

### Successful Visit
```
[MZTOP]
Using proxy: http://82.119.96.254:80
  → https://mztop.sk/kontakt...
  → 346 words, 40s
  ✓ Completed: 40s
✓ Logged traffic for client 4
```

### Proxy Failed
```
Using proxy: socks5://5.252.23.249:1080
Browser error: net::ERR_PROXY_CONNECTION_FAILED
(automaticky skočí na ďalší proxy)
```

---

## 🔧 Maintenance

### Pridať nové proxy
```
1. Render Dashboard → Environment
2. Edit PROXY_LIST
3. Pridaj nové IP:PORT na koniec (oddelené čiarkou)
4. Save
5. Redeploy
```

### Odstrániť nefunkčné proxy
```
Ak vidíš v logoch veľa errors pre konkrétne proxy,
odstráň ich z PROXY_LIST.
```

---

## ⚠️ Poznámky o FREE proxy

### Výhody
✅ 100% zadarmo
✅ Európske IP adresy (SK, CZ, PL, HU)
✅ Rotácia = realistickejšie

### Nevýhody
❌ Niektoré proxy sú pomalé
❌ Niektoré prestanú fungovať
❌ Success rate ~60-80%

### Odporúčanie
- **Pre začiatok:** Perfektné (FREE!)
- **Neskôr:** Upgrade na SmartProxy ($8/mesiac) pre 100% success rate

---

## 📈 Výsledok

**S FREE proxy:**
- GA: Slovakia, Czech Republic, Poland 🇸🇰🇨🇿🇵🇱
- Jetpack: ✅ Funguje
- Success rate: ~70%
- Cena: $0

**Vs bez proxy:**
- GA: United States 🇺🇸
- Success rate: 100%
- Cena: $0

---

## 🆙 Upgrade na Premium

Keď chceš 100% success rate:

```
1. Register SmartProxy ($8.50/mesiac)
2. Get credentials
3. Render Environment:
   PROXY_LIST=http://user-country-sk:pass@gate.smartproxy.com:7000
4. Redeploy
```

---

✅ **Toto je FREE riešenie ktoré funguje!**
