const fs = require("fs").promises;
const path = require("path");

async function generateReport(io, history, url) {
    const timestamp = Date.now();
    const reportDir = path.join(__dirname, "reports", `report_${timestamp}`);
    const reportPath = path.join(reportDir, "report.html");

    // Ensure the report directory exists
    await fs.mkdir(reportDir, { recursive: true });

    // Start building the HTML report content
    let reportContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Website Crawler Report</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                img { max-width: 100px; }
            </style>
        </head>
        <body>
            <h1>Website Crawler Report</h1>
            <p>URL Crawled: ${url}</p>
            <p>Timestamp: ${new Date(timestamp).toLocaleString()}</p>
            <table>
                <tr>
                    <th>URL</th>
                    <th>Loading Time (ms)</th>
                    <th>Screenshot</th>
                    <th>Issue</th>
                    <th>Solution</th>
                </tr>
    `;

    // Loop through the history and add each entry to the table
    for (const entry of history) {
        const screenshotPath = entry.screenshot ? path.basename(entry.screenshot) : "N/A";
        const screenshotCell = entry.screenshot
            ? `<img src="../screenshots/${screenshotPath}" alt="Screenshot" width="200">`
            : "N/A";

        reportContent += `
            <tr>
                <td>${entry.url}</td>
                <td>${entry.loadingTime || "N/A"}</td>
                <td>${screenshotCell}</td>
                <td>${entry.issue || "N/A"}</td>
                <td>${entry.solution || "N/A"}</td>
            </tr>
        `;
    }

    // Close the HTML tags
    reportContent += `
            </table>
        </body>
        </html>
    `;

    // Write the report content to an HTML file
    await fs.writeFile(reportPath, reportContent);
    console.log("Report generated successfully at:", reportPath);

    // Emit the report-ready event with the report path
    io.emit("report-ready", { reportPath });
    return reportPath;
}

module.exports = { generateReport };