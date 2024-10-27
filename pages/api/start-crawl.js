const { crawlWebsite } = require("../../src/crawler"); // Adjusted for relative path
const { generateReport } = require("../../src/reportGenerator");
const path = require("path");

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        const crawlResults = await crawlWebsite(url); // Ensure this function doesn’t use `io`
        const reportPath = await generateReport(crawlResults, url);
        res.status(200).json({ reportPath: `/reports/${path.basename(reportPath)}` });
    } catch (error) {
        console.error("Error during crawl:", error);
        res.status(500).json({ error: "Error during crawl" });
    }
};