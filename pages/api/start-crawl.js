// pages/api/start-crawl.js
export default function handler(req, res) {
    if (req.method === 'POST') {
        // Your crawling function logic
        res.status(200).json({ message: "Crawl started successfully!" });
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}