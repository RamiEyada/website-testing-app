const { crawlWebsite } = require("../src/crawler"); // Ensure paths are correct
const { generateReport } = require("../src/reportGenerator");

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        const crawlResults = await crawlWebsite(url); // Run the crawler
        const reportPath = await generateReport(crawlResults, url); // Generate the report

        res.status(200).json({ reportPath: `/reports/${path.basename(reportPath)}` });
    } catch (error) {
        console.error("Error during crawl:", error);
        res.status(500).json({ error: "Error during crawl" });
    }
};