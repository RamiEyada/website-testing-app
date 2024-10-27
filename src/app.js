// src/app.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");

const { crawlWebsite } = require("./crawler");
const { generateReport } = require("./reportGenerator");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Serve the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Start crawl endpoint
app.post("/api/start-crawl", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        const crawlResults = await crawlWebsite(url);
        const reportPath = await generateReport(crawlResults, url);
        res.json({ reportPath: `/reports/${path.basename(reportPath)}` });
    } catch (error) {
        console.error("Error during crawl:", error);
        res.status(500).json({ error: "Error during crawl" });
    }
});

// Serve generated reports
app.use("/reports", express.static(path.join(__dirname, "reports")));

// Socket.io connection handling
io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});