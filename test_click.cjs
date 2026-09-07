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
        
        // Wait for load
        await page.goto(`http://localhost:${port}`);
        await new Promise(r => setTimeout(r, 4000));
        
        // Find the "Buscar" tab and click it
        console.log("Clicking 'Buscar' tab...");
        const tabs = await page.$$('button');
        let clicked = false;
        for (const tab of tabs) {
            const text = await page.evaluate(el => el.textContent, tab);
            if (text && text.includes('Buscar')) {
                await tab.click();
                clicked = true;
                break;
            }
        }
        
        if (!clicked) {
            console.log("Could not find Buscar tab!");
        }
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Extract what is currently visible
        const html = await page.evaluate(() => {
            const searchDiv = document.body.innerText;
            return searchDiv;
        });
        console.log("[BODY TEXT AFTER CLICKING BUSCAR]");
        console.log(html.substring(0, 2000));
        
        await browser.close();
    } catch (e) {
        console.error(e);
    } finally {
        server.close();
    }
});
