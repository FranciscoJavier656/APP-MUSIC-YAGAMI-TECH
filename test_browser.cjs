const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*all', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Server running on port ${port}`);
    
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
            }
        });
        
        page.on('pageerror', error => {
            console.log(`[BROWSER PAGE_ERROR] ${error.message}`);
        });

        await page.goto(`http://localhost:${port}`);
        
        // Wait for 3.5 seconds to see if anything crashes
        await new Promise(r => setTimeout(r, 3500));
        
        // Output body HTML
        const html = await page.evaluate(() => document.body.innerHTML);
        console.log("[BODY HTML LENGTH]", html.length);
        if (html.includes("Fatal Error")) {
            console.log("[FOUND FATAL ERROR IN HTML]");
            console.log(html.substring(0, 500));
        } else {
            console.log("No fatal error in HTML.");
        }
        
        await browser.close();
    } catch (e) {
        console.error(e);
    } finally {
        server.close();
    }
});
