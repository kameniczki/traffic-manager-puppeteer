/**
 * Traffic Manager - Puppeteer Service
 * Real Chrome browser for GA/Jetpack tracking
 */

const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cron = require('node-cron');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || 'srv1660.hstgr.io',
    user: process.env.DB_USER || 'u737449533_traffic',
    password: process.env.DB_PASS || 'Traffic2025!',
    database: process.env.DB_NAME || 'u737449533_traffic',
    waitForConnections: true,
    connectionLimit: 10
};

let pool;

// Initialize database connection
async function initDatabase() {
    try {
        pool = mysql.createPool(DB_CONFIG);
        console.log('Database connected');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// Get active clients from database
async function getActiveClients() {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM clients WHERE status = ? ORDER BY id',
            ['active']
        );
        return rows;
    } catch (error) {
        console.error('Failed to fetch clients:', error);
        return [];
    }
}

// Log traffic to database
async function logTraffic(clientId, visits, duration, status) {
    try {
        await pool.query(
            `INSERT INTO traffic_logs 
            (client_id, visits_generated, started_at, completed_at, duration, status) 
            VALUES (?, ?, NOW(), NOW(), ?, ?)`,
            [clientId, visits, duration, status]
        );
        
        await pool.query(
            'UPDATE clients SET total_visits = total_visits + ?, last_run = NOW() WHERE id = ?',
            [visits, clientId]
        );
    } catch (error) {
        console.error('Failed to log traffic:', error);
    }
}

// Generate search query
function generateSearchQuery(clientName, queryTypes) {
    const type = queryTypes[Math.floor(Math.random() * queryTypes.length)];
    
    const queries = {
        brand: [clientName, `${clientName} services`, `${clientName} website`],
        service: ['web development', 'website design', 'online marketing', 'SEO services'],
        location: ['Nitra', 'Bratislava', 'Slovakia', 'Central Europe'],
        generic: ['professional services', 'business solutions', 'quality service']
    };
    
    const pool = queries[type] || queries.generic;
    return pool[Math.floor(Math.random() * pool.length)];
}

// Get search engine URL
function getSearchEngineUrl(engine, query) {
    const engines = {
        'Search EU': `https://search-eu.com/search.php?q=${encodeURIComponent(query)}`,
        'Google.sk': `https://www.google.sk/search?q=${encodeURIComponent(query)}`,
        'Google.cz': `https://www.google.cz/search?q=${encodeURIComponent(query)}`,
        'Seznam.cz': `https://www.seznam.cz/hledani?q=${encodeURIComponent(query)}`
    };
    
    return engines[engine] || engines['Search EU'];
}

// Simulate realistic visit with Puppeteer
async function simulateVisit(browser, url, referer, minTime, maxTime) {
    const page = await browser.newPage();
    
    try {
        // Set realistic viewport
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        });
        
        // Set user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        
        // Set referer
        await page.setExtraHTTPHeaders({
            'Referer': referer
        });
        
        console.log(`  → Navigating to: ${url}`);
        
        // Navigate to page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Calculate visit duration based on page content
        const wordCount = await page.evaluate(() => {
            return document.body.innerText.split(/\s+/).length;
        });
        
        // 200-250 words per minute = ~3-4 words per second
        let duration = Math.ceil(wordCount / 3);
        duration = Math.ceil(duration * 1.3); // +30% thinking time
        duration = Math.max(minTime, Math.min(maxTime, duration));
        
        console.log(`  → Content: ${wordCount} words, duration: ${duration}s`);
        
        // Simulate reading with random scrolls
        const scrolls = Math.floor(duration / 15);
        for (let i = 0; i < scrolls; i++) {
            await new Promise(resolve => setTimeout(resolve, 10000 + Math.random() * 10000));
            
            // Random scroll
            await page.evaluate(() => {
                window.scrollBy({
                    top: 200 + Math.random() * 500,
                    behavior: 'smooth'
                });
            });
        }
        
        // Wait remaining time
        const elapsed = scrolls * 15;
        if (duration > elapsed) {
            await new Promise(resolve => setTimeout(resolve, (duration - elapsed) * 1000));
        }
        
        console.log(`  ✓ Visit completed: ${duration}s`);
        
        return duration;
        
    } catch (error) {
        console.error(`  ✗ Visit failed: ${error.message}`);
        return 0;
    } finally {
        await page.close();
    }
}

// Main traffic generation function
async function generateTraffic() {
    console.log('=== TRAFFIC GENERATION STARTED ===');
    const startTime = Date.now();
    
    const clients = await getActiveClients();
    console.log(`Found ${clients.length} active clients`);
    
    if (clients.length === 0) {
        console.log('No active clients found');
        return;
    }
    
    // Launch browser with optimized chromium
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless
    });
    
    try {
        for (const client of clients) {
            console.log(`\nProcessing: ${client.name} (${client.url})`);
            
            // Calculate visits for 5-minute interval
            const visitsPerDay = client.visits_per_day;
            const intervalsPerDay = 24 * 12; // 5-minute intervals
            let visitsPerInterval = Math.max(1, Math.ceil(visitsPerDay / intervalsPerDay));
            
            // Limit to 2 visits per interval (to prevent timeout)
            visitsPerInterval = Math.min(visitsPerInterval, 2);
            
            console.log(`Generating ${visitsPerInterval} visits`);
            
            // Get URLs
            const customUrls = JSON.parse(client.custom_urls || '[]');
            const discoveredUrls = JSON.parse(client.discovered_urls || '[]');
            const allUrls = [client.url, ...customUrls, ...discoveredUrls].filter(Boolean);
            
            // Get settings
            const searchEngines = JSON.parse(client.search_engines || '["Search EU"]');
            const queryTypes = JSON.parse(client.query_types || '["brand"]');
            
            let successCount = 0;
            
            for (let i = 0; i < visitsPerInterval; i++) {
                // Random URL
                const targetUrl = allUrls[Math.floor(Math.random() * allUrls.length)];
                
                // Generate query and search engine
                const query = generateSearchQuery(client.name, queryTypes);
                const searchEngine = searchEngines[Math.floor(Math.random() * searchEngines.length)];
                const referer = getSearchEngineUrl(searchEngine, query);
                
                // Add UTM parameters
                const utmParams = new URLSearchParams({
                    utm_source: searchEngine.toLowerCase().replace(/\s+/g, ''),
                    utm_medium: 'organic',
                    utm_campaign: 'search_traffic',
                    utm_term: query
                });
                
                const finalUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${utmParams}`;
                
                // Simulate visit
                const duration = await simulateVisit(
                    browser,
                    finalUrl,
                    referer,
                    client.min_time || 40,
                    client.max_time || 180
                );
                
                if (duration > 0) {
                    successCount++;
                }
            }
            
            // Log to database
            const totalDuration = Math.floor((Date.now() - startTime) / 1000);
            await logTraffic(client.id, successCount, totalDuration, 'success');
            
            console.log(`✓ Generated ${successCount} visits for ${client.name}`);
        }
    } catch (error) {
        console.error('Traffic generation error:', error);
    } finally {
        await browser.close();
    }
    
    const totalDuration = Math.floor((Date.now() - startTime) / 1000);
    console.log(`\n=== TRAFFIC GENERATION COMPLETED in ${totalDuration}s ===\n`);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'traffic-manager-puppeteer' });
});

// Manual trigger endpoint
app.get('/generate', async (req, res) => {
    res.json({ status: 'started', message: 'Traffic generation started' });
    generateTraffic().catch(console.error);
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize database
    await initDatabase();
    
    // Schedule cron job (every 5 minutes)
    cron.schedule('*/5 * * * *', () => {
        console.log('\n--- CRON TRIGGERED ---');
        generateTraffic().catch(console.error);
    });
    
    console.log('Cron scheduled: Every 5 minutes');
    
    // Run once on startup (after 10 seconds)
    setTimeout(() => {
        console.log('\n--- INITIAL RUN ---');
        generateTraffic().catch(console.error);
    }, 10000);
});
