const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;

async function ensureDirectoryExists(dir) {
    await fs.mkdir(dir, { recursive: true });
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

function isSameDomain(url, baseDomain) {
    try {
        const urlDomain = new URL(url).hostname;
        return urlDomain === baseDomain;
    } catch {
        return false;
    }
}

async function crawlPage(page, url, visitedLinks, progressCallback, baseDomain, startTime) {
    if (visitedLinks.has(url) || !isValidUrl(url) || !isSameDomain(url, baseDomain)) {
        console.log(`Skipping URL: ${url}`);
        return [];
    }
    visitedLinks.add(url);

    console.log(`Loading URL: ${url}`);
    const pageLoadStartTime = Date.now();
    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        const loadingTime = Date.now() - pageLoadStartTime;

        const screenshotPath = path.join(__dirname, "screenshots", `${Date.now()}-${Math.random()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Get links on the page
        let links = await page.$$eval("a[href]", (anchors) => anchors.map((a) => a.href));
        links = Array.from(new Set(links)).filter(
            (link) => isValidUrl(link) && isSameDomain(link, baseDomain) && !visitedLinks.has(link)
        );

        // Calculate and update progress and estimated time
        const completedLinks = visitedLinks.size;
        const totalLinks = completedLinks + links.length;
        const progress = (completedLinks / totalLinks) * 100;
        const elapsedTime = (Date.now() - startTime) / 1000; // seconds
        const remainingTime = completedLinks > 0 ? ((elapsedTime / completedLinks) * (totalLinks - completedLinks)).toFixed(1) : 0;

        progressCallback({
            progress: Math.min(progress, 100),
            estimatedTime: Math.max(remainingTime, 1),
        });

        // Recursively crawl the remaining links
        const results = [{ url, loadingTime, screenshot: screenshotPath }];
        for (const link of links) {
            const subPageData = await crawlPage(page, link, visitedLinks, progressCallback, baseDomain, startTime);
            results.push(...subPageData);
        }

        return results;
    } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        return [];
    }
}

async function crawlWebsite(url, progressCallback, visitedLinks = new Set()) {
    await ensureDirectoryExists(path.join(__dirname, "screenshots"));
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const baseDomain = new URL(url).hostname;
    const startTime = Date.now(); // Track overall start time for better estimated time calculation
    const results = await crawlPage(page, url, visitedLinks, progressCallback, baseDomain, startTime);

    await browser.close();
    return results;
}

module.exports = { crawlWebsite };