// src/crawler.js

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;

// Ensure screenshots directory exists
async function ensureDirectoryExists(dir) {
    await fs.mkdir(dir, { recursive: true });
}

// Check if the URL is valid
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Check if URL is on the same domain
function isSameDomain(url, baseDomain) {
    try {
        const urlDomain = new URL(url).hostname;
        return urlDomain === baseDomain;
    } catch {
        return false;
    }
}

// Function to attempt page load with retries
async function tryPageGoto(page, url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
            return;
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed for URL: ${url}`);
            if (i === retries - 1) {
                console.error(`Failed to load URL after ${retries} attempts: ${url}`);
                throw error;
            }
        }
    }
}

// Crawl a single page and capture its data
async function crawlPage(page, url, visitedLinks, progressCallback, baseDomain, startTime, depth = 0, maxDepth = 3) {
    if (depth > maxDepth || visitedLinks.has(url) || !isValidUrl(url) || !isSameDomain(url, baseDomain)) {
        console.log(`Skipping URL: ${url}`);
        return [];
    }
    visitedLinks.add(url);

    console.log(`Loading URL: ${url}`);
    const pageLoadStartTime = Date.now();
    try {
        await tryPageGoto(page, url);
        const loadingTime = Date.now() - pageLoadStartTime;

        const screenshotPath = path.join(__dirname, "screenshots", `${Date.now()}-${Math.random()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Get links on the page
        let links = await page.$$eval("a[href]", (anchors) => anchors.map((a) => a.href));
        links = Array.from(new Set(links)).filter(
            (link) => isValidUrl(link) && isSameDomain(link, baseDomain) && !visitedLinks.has(link)
        );

        const completedLinks = visitedLinks.size;
        const totalLinks = completedLinks + links.length;
        const progress = (completedLinks / totalLinks) * 100;
        const elapsedTime = (Date.now() - startTime) / 1000;
        const remainingTime = completedLinks > 0 ? ((elapsedTime / completedLinks) * (totalLinks - completedLinks)).toFixed(1) : 0;

        progressCallback({
            progress: Math.min(progress, 100),
            estimatedTime: Math.max(remainingTime, 1),
        });

        const results = [{ url, loadingTime, screenshot: screenshotPath }];
        for (const link of links) {
            const subPageData = await crawlPage(page, link, visitedLinks, progressCallback, baseDomain, startTime, depth + 1, maxDepth);
            results.push(...subPageData);
        }

        return results;
    } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        return [];
    }
}

// Main function to crawl the website
async function crawlWebsite(url, io) {
    await ensureDirectoryExists(path.join(__dirname, "screenshots"));
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const baseDomain = new URL(url).hostname;
    const startTime = Date.now();

    const results = await crawlPage(page, url, new Set(), (progressData) => {
        io.emit("progress", progressData);
    }, baseDomain, startTime);

    await browser.close();
    return results;
}

module.exports = { crawlWebsite };