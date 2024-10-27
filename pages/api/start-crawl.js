const { crawlWebsite } = require("../src/crawler"); // Ensure paths are correct
const { generateReport } = require("../src/reportGenerator");
const path = require("path");

module.exports = async (req, res) => {
    // Check if the method is POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        // Run the crawler on the provided URL
        const crawlResults = await crawlWebsite(url);

        // Generate the report and get the path
        const reportPath = await generateReport(crawlResults, url);

        // Send the report path as response
        res.status(200).json({ reportPath: `/reports/${path.basename(reportPath)}` });
    } catch (error) {
        console.error("Error during crawl:", error);
        res.status(500).json({ error: "Error during crawl" });
    }
};