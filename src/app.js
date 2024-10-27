// src/app.js
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");

const { crawlWebsite } = require("./crawler");
const generateReport = require("./reportGenerator");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;
const history = []; // to store history across multiple runs

// Middleware setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Route to serve the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route to start the crawl
app.post("/start-crawl", async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).send("URL is required");
    }

    try {
        let linksCrawled = 0;
        const visitedLinks = new Set();

        const progressCallback = (progressData) => {
            io.emit("progress", progressData); // Emit progress and estimated time
        };

        const crawlResults = await crawlWebsite(url, progressCallback, visitedLinks);
        const reportPath = await generateReport(crawlResults, url);

        if (!history.includes(url)) history.push(url);
        res.json({ reportPath: `/reports/${path.basename(reportPath)}` });
    } catch (error) {
        console.error("Error during crawl:", error);
        res.status(500).json({ error: "Error during crawl" });
    }
});

// Serve generated reports
app.use("/reports", express.static(path.join(__dirname, "reports")));

// Start the server
server.listen(port, () => {
    console.log(`App is running at http://localhost:${port}`);
});