const puppeteer = require('puppeteer');
const sleep = require('./utils');

async function scrapeHero(page, heroId) {
    const url = `https://m.mobilelegends.com/hero/detail?channelid=3054554&heroid=${heroId}`;
    console.log("Scraping hero:", heroId);
    await page.goto(url);

    // obj init
    const heroData = {
        id: heroId,
        name: null,
        role: [],
        lane: [],
        icons: {
            round: null,
            rectangle: null
        }
    }

    await sleep(2000);
    // click on the COUNTERS tab
    try {
        await page.evaluate(() => {
            const spans = document.querySelectorAll('span');
            for (let span of spans) {
                if (span.textContent.trim() === 'COUNTERS') {
                    span.click();
                    return true;
                }
            }
            return false;
        })
        await sleep(1000);
    } catch (e) {
        console.log('Errore click COUNTERS:', e.message);
    }

    // DATA EXTR

    // DATA - name
    const name = await page.evaluate(() => {
        const nameElement = document.querySelector('div.mt-text[data-node="2680124"] > span');
        return nameElement ? nameElement.textContent.trim() : null;
    })
    heroData.name = name;

    // DATA - role
    const roles = await page.evaluate(() => {
        const roleElements = document.querySelectorAll('[data-node="2695985"] span');
        const rolesArray = [];
        roleElements.forEach(span => {
            const text = span.textContent.trim();
            if (text) {
                rolesArray.push(text);
            }
        })
        return rolesArray;
    })
    heroData.role = roles;

    // DATA - lane
    const lanes = await page.evaluate(() => {
        const laneIconMap = {
            '91f817c656908a83c2e24eecb3b70986.svg': 'Gold Lane',
            'a3dbb075b4d8186c29f02f7d47da236a.svg': 'Roam',
            'facab1eacb218d767b5acb80304bfafd.svg': 'Mid Lane',
            'de611167c7310681135f0b4198137bfa.svg': 'Jungle',
            '6a246099f7eb83a8856306d8b4c84fc2.svg': 'Exp Lane'
        };

        const laneElements = document.querySelectorAll('[data-node="2683987"]');
        const lanesArray = [];

        if (laneElements.length > 0) {
            laneElements.forEach(el => {
                const imgEl = el.querySelector('img[src*=".svg"]');
                if (imgEl) {
                    const src = imgEl.getAttribute('src');
                    const fileName = src.split('/').pop();
                    if (laneIconMap[fileName]) {
                        lanesArray.push(laneIconMap[fileName]);
                    }
                }
            })
        }
        return lanesArray;
    })
    heroData.lane = lanes;

    // DATA - icons
    const icons = await page.evaluate(() => {
        const iconsObj = {
            round: null,
            rectangle: null
        };

        const images = document.querySelectorAll('.mt-tab-pane img');
        if (images.length > 1 && images[1]) {
            iconsObj.round = images[1].src
        }


        const rectangleImageElement = document.querySelector('[data-node="2680121"] img');
        if (rectangleImageElement) {
            iconsObj.rectangle = rectangleImageElement.getAttribute('src');
        }

        return iconsObj;
    })
    heroData.icons = icons;

    return heroData;

}

async function scrapeMultiple(idFrom, idTo) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const url = `https://m.mobilelegends.com/hero/detail?channelid=3054554&heroid=1`;
    await page.goto(url);

    await sleep(3000);
    // Gestisci popup Privacy Policy (se presente)
    try {
        await page.waitForSelector('.mt-cb-policy-close', { timeout: 3000 });
        await page.click('.mt-cb-policy-close'); // Click X per chiudere
        console.log('Popup Privacy Policy chiuso');
    } catch (e) {
        console.log('Nessun popup Privacy Policy');
    }
    await sleep(1000);

    // Gestisci popup cookies (se presente)
    try {
        await page.waitForSelector('#mt-cb-p', { timeout: 3000 });
        await page.click('#mt-cb-p'); // Click "Accept All"
        console.log('Popup cookies chiuso');
    } catch (e) {
        console.log('Nessun popup cookies');
    }
    await sleep(1000);

    let heroes = [];

    for (let i = idFrom; i <= idTo; i++) {
        const hero = await scrapeHero(page, i);
        heroes.push(hero);
    }

    console.log(JSON.stringify(heroes, null, 2));

    await browser.close();
}

scrapeMultiple(10, 15)

