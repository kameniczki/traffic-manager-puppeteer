/**
 * Traffic Manager - Puppeteer Service (FREE Proxy Rotation)
 * Uses free EU proxies for realistic traffic
 */

const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://search-eu.com/api/traffic-api.php';

// Proxy list (from environment variable)
const PROXY_LIST_RAW = process.env.PROXY_LIST || '';
let PROXY_LIST = [];
let currentProxyIndex = 0;

// Parse proxy list
function loadProxyList() {
    if (PROXY_LIST_RAW) {
        PROXY_LIST = PROXY_LIST_RAW.split(',').map(p => p.trim()).filter(p => p);
        console.log(`✓ Loaded ${PROXY_LIST.length} proxies for rotation`);
    } else {
        console.log('⚠ No proxy list - using direct connection');
    }
}

// Get next proxy with round-robin rotation
function getNextProxy() {
    if (PROXY_LIST.length === 0) return null;
    
    const proxy = PROXY_LIST[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % PROXY_LIST.length;
    
    // Determine protocol based on port
    const [host, port] = proxy.split(':');
    const portNum = parseInt(port);
    
    // Port-based protocol detection
    if ([80, 8080, 3128, 8888, 8111].includes(portNum)) {
        return `http://${proxy}`;
    } else if ([1080, 4145, 4153].includes(portNum)) {
        return `socks5://${proxy}`;
    } else {
        return `http://${proxy}`; // Default to HTTP
    }
}

// Get active clients from API
async function getActiveClients() {
    try {
        const response = await axios.get(`${API_BASE_URL}?action=get_clients`, {
            timeout: 10000
        });
        
        if (response.data.success) {
            console.log(`✓ Fetched ${response.data.clients.length} clients`);
            return response.data.clients;
        } else {
            console.error('API error:', response.data.error);
            return [];
        }
    } catch (error) {
        console.error('Failed to fetch clients:', error.message);
        return [];
    }
}

// Log traffic to API
async function logTraffic(clientId, visits, duration, status) {
    try {
        const formData = new URLSearchParams({
            client_id: clientId,
            visits: visits,
            duration: duration,
            status: status
        });
        
        await axios.post(`${API_BASE_URL}?action=log_traffic`, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 5000
        });
        
        console.log(`✓ Logged traffic for client ${clientId}`);
    } catch (error) {
        console.error('Failed to log:', error.message);
    }
}

// Generate search query
function generateSearchQuery(clientName, queryTypes) {
    const type = queryTypes[Math.floor(Math.random() * queryTypes.length)];
    const queries = {
        brand: [clientName, `${clientName} services`, `${clientName} website`],
        service: ['web development', 'website design', 'online marketing'],
        location: ['Nitra', 'Bratislava', 'Slovakia'],
        generic: ['professional services', 'business solutions']
    };
    const pool = queries[type] || queries.generic;
    return pool[Math.floor(Math.random() * pool.length)];
}

// Get search engine URL
function getSearchEngineUrl(engine, query) {
    const engines = {
        'Search EU': `https://search-eu.com/search.php?q=${encodeURIComponent(query)}`,
        'Google.sk': `https://www.google.sk/search?q=${encodeURIComponent(query)}`,
        'Google.cz': `https://www.google.cz/search?q=${encodeURIComponent(query)}`
    };
    return engines[engine] || engines['Search EU'];
}

// Simulate visit
async function simulateVisit(browser, url, referer, minTime, maxTime) {
    const page = await browser.newPage();
    
    try {
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Referer': referer });
        
        console.log(`  → ${url.substring(0, 60)}...`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const wordCount = await page.evaluate(() => document.body.innerText.split(/\s+/).length);
        let duration = Math.ceil(wordCount / 3);
        duration = Math.ceil(duration * 1.3);
        duration = Math.max(minTime, Math.min(maxTime, duration));
        
        console.log(`  → ${wordCount} words, ${duration}s`);
        
        // Simulate scrolling
        const scrolls = Math.floor(duration / 15);
        for (let i = 0; i < scrolls; i++) {
            await new Promise(r => setTimeout(r, 10000 + Math.random() * 10000));
            await page.evaluate(() => window.scrollBy({ top: 200 + Math.random() * 500, behavior: 'smooth' }));
        }
        
        const remaining = duration - (scrolls * 15);
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining * 1000));
        
        console.log(`  ✓ Completed: ${duration}s`);
        return duration;
    } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        return 0;
    } finally {
        await page.close();
    }
}

// Main traffic generation
async function generateTraffic() {
    console.log('\n=== TRAFFIC GENERATION ===');
    console.log(new Date().toISOString());
    
    const clients = await getActiveClients();
    if (clients.length === 0) return;
    
    for (const client of clients) {
        console.log(`\n[${client.name}]`);
        
        const visitsPerDay = client.visits_per_day;
        let visitsPerInterval = Math.max(1, Math.ceil(visitsPerDay / 288));
        visitsPerInterval = Math.min(visitsPerInterval, 2);
        
        console.log(`Generating ${visitsPerInterval} visits`);
        
        const customUrls = JSON.parse(client.custom_urls || '[]');
        const discoveredUrls = JSON.parse(client.discovered_urls || '[]');
        const allUrls = [client.url, ...customUrls, ...discoveredUrls].filter(Boolean);
        
        const searchEngines = JSON.parse(client.search_engines || '["Search EU"]');
        const queryTypes = JSON.parse(client.query_types || '["brand"]');
        
        let successCount = 0;
        const startTime = Date.now();
        
        for (let i = 0; i < visitsPerInterval; i++) {
            // Get proxy for this visit
            const proxy = getNextProxy();
            
            let browser;
            try {
                const launchOptions = {
                    args: [...chromium.args],
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless
                };
                
                if (proxy) {
                    console.log(`Using proxy: ${proxy}`);
                    launchOptions.args.push(`--proxy-server=${proxy}`);
                }
                
                browser = await puppeteer.launch(launchOptions);
                
                const targetUrl = allUrls[Math.floor(Math.random() * allUrls.length)];
                const query = generateSearchQuery(client.name, queryTypes);
                const searchEngine = searchEngines[Math.floor(Math.random() * searchEngines.length)];
                const referer = getSearchEngineUrl(searchEngine, query);
                
                const utmParams = new URLSearchParams({
                    utm_source: searchEngine.toLowerCase().replace(/\s+/g, ''),
                    utm_medium: 'organic',
                    utm_campaign: 'search_traffic',
                    utm_term: query
                });
                
                const finalUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${utmParams}`;
                
                const duration = await simulateVisit(
                    browser,
                    finalUrl,
                    referer,
                    client.min_time || 40,
                    client.max_time || 180
                );
                
                if (duration > 0) successCount++;
                
            } catch (error) {
                console.error(`Browser error: ${error.message}`);
            } finally {
                if (browser) await browser.close();
            }
        }
        
        const totalDuration = Math.floor((Date.now() - startTime) / 1000);
        await logTraffic(client.id, successCount, totalDuration, 'success');
        
        console.log(`[${client.name}] ✓ ${successCount}/${visitsPerInterval} in ${totalDuration}s`);
    }
    
    console.log('\n=== COMPLETED ===\n');
}

// Endpoints
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        proxies: PROXY_LIST.length,
        uptime: process.uptime()
    });
});

app.get('/generate', async (req, res) => {
    res.json({ status: 'started' });
    generateTraffic().catch(console.error);
});

// Start
app.listen(PORT, async () => {
    console.log(`\n🚀 Traffic Manager Puppeteer`);
    console.log(`   Port: ${PORT}`);
    console.log(`   API: ${API_BASE_URL}`);
    
    loadProxyList();
    
    console.log('\n📡 Testing API...');
    const clients = await getActiveClients();
    if (clients.length > 0) {
        console.log(`✓ API OK (${clients.length} clients)`);
    }
    
    cron.schedule('*/5 * * * *', () => {
        console.log('\n⏰ CRON TRIGGERED');
        generateTraffic().catch(console.error);
    });
    
    console.log('⏰ Cron: Every 5 minutes');
    
    setTimeout(() => {
        console.log('\n🎬 INITIAL RUN');
        generateTraffic().catch(console.error);
    }, 30000);
    
    console.log('✅ Ready!\n');
});
