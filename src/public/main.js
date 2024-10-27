document.addEventListener("DOMContentLoaded", () => {
    const startTestingButton = document.querySelector("#start-testing");
    const urlInput = document.querySelector("#url-input");
    const statusDisplay = document.querySelector("#test-status");
    const reportLink = document.getElementById("report-link");
    const progressBar = document.getElementById("progress-bar");
    const estimatedTimeDisplay = document.getElementById("estimated-time");
    const humorTextDisplay = document.getElementById("humor-text");

    const humorMessages = [
        "Links are running everywhere!",
        "Get them, cowboy!",
        "The links are getting fried!",
        "Where were those links hiding?",
        "Roundin' up those links!",
        "Link lasso in full swing!",
        "Wrangling some tricky links!",
        "Riding through the wild web!",
        "Just one more link... or not!",
        "Almost got them all!",
        "Moujahed still didn't finish eating, so I'm still working",
        "Enes is the new Steve Jobs",
        "Rami is trying to create a new tool",
        "Sinan is running to solve everyone's issues",
        "Morad is pushing the engineers to work",
        "Ali Narin is trying to solve SEO issues",
        "Tougba is gathering Podcasts files",
        "Halid is depressed"
    ];

    let humorInterval;

    // Initialize socket connection
    const socket = io();
    socket.on("connect", () => {
        console.log("Socket connected");
    });

    socket.on("progress", ({ progress, estimatedTime }) => {
        progressBar.style.width = `${progress}%`;
        estimatedTimeDisplay.textContent = `Estimated Time: ${estimatedTime.toFixed(1)} seconds remaining`;
    });

    socket.on("report-ready", ({ reportPath }) => {
        clearInterval(humorInterval);
        humorTextDisplay.textContent = "";
        statusDisplay.textContent = "Completed";
        reportLink.innerHTML = `<a href="${reportPath}" target="_blank">View Report</a>`;
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected");
    });

    // Event listener for the Start Testing button
    startTestingButton.addEventListener("click", async () => {
        const url = urlInput.value.trim();
        if (!url) return alert("Please enter a URL to test.");

        statusDisplay.textContent = "In-Progress";
        progressBar.style.width = "0%";
        estimatedTimeDisplay.textContent = "Estimating...";
        reportLink.innerHTML = "";

        let messageIndex = 0;
        humorTextDisplay.textContent = humorMessages[messageIndex];
        humorInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % humorMessages.length;
            humorTextDisplay.textContent = humorMessages[messageIndex];
        }, 2000);

        try {
            const response = await fetch("/api/start-crawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });
            const data = await response.json();
            if (response.ok) {
                clearInterval(humorInterval);
                humorTextDisplay.textContent = "";
                statusDisplay.textContent = "Completed";
                reportLink.innerHTML = `<a href="${data.reportPath}" target="_blank">View Report</a>`;
            } else {
                statusDisplay.textContent = "Failed";
                clearInterval(humorInterval);
                humorTextDisplay.textContent = "";
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            statusDisplay.textContent = "Failed";
            clearInterval(humorInterval);
            humorTextDisplay.textContent = "";
            alert("An error occurred. Please check the console for details.");
        }
    });
});