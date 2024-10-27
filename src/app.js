const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors"); // Import CORS

const { crawlWebsite } = require("./crawler"); // Ensure this is correctly exported from crawler.js
const { generateReport } = require("./reportGenerator"); // Ensure this is correctly exported from reportGenerator.js

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(cors()); // Apply CORS middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Define the start-crawl route
app.post("/api/start-crawl", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        const crawlResults = await crawlWebsite(url, io); // Start crawling with real-time updates
        const reportPath = await generateReport(io, crawlResults, url); // Generate the report

        res.json({ reportPath: `/reports/${path.basename(reportPath)}` });
    } catch (error) {
        console.error("Error during crawl:", error);
        res.status(500).json({ error: "Error during crawl" });
    }
});

// Serve generated reports
app.use("/reports", express.static(path.join(__dirname, "reports")));

// Handle socket.io connections
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