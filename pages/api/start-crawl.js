// pages/api/start-crawl.js
import path from "path";
import { crawlWebsite } from "../../src/crawler";
import { generateReport } from "../../src/reportGenerator";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        // Run the crawler
        const crawlResults = await crawlWebsite(url);

        // Generate the report
        const reportPath = await generateReport(crawlResults, url);

        // Return the path to the generated report
        res.status(200).json({ reportPath: `/reports/${path.basename(reportPath)}` });
    } catch (error) {
        console.error("Error during crawl:", error);
        res.status(500).json({ error: "Error during crawl" });
    }
}