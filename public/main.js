// public/main.js

document.addEventListener("DOMContentLoaded", () => {
    const startTestingButton = document.querySelector("#start-testing");
    const urlInput = document.querySelector("#url-input");
    const statusDisplay = document.querySelector("#test-status");
    const reportLink = document.getElementById("report-link");
    const progressBar = document.getElementById("progress-bar");
    const estimatedTimeDisplay = document.getElementById("estimated-time");
    const humorTextDisplay = document.getElementById("humor-text");

    let testingInProgress = false;  // Track whether a test is in progress
    let humorInterval;
    let pollingInterval;

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

    // Function to toggle button state
    function toggleButton() {
        if (testingInProgress) {
            startTestingButton.textContent = "Stop Testing";
            startTestingButton.style.backgroundColor = "red";
        } else {
            startTestingButton.textContent = "Start Testing";
            startTestingButton.style.backgroundColor = "green";
        }
    }

    // Function to stop the test
    function stopTesting() {
        testingInProgress = false;
        toggleButton();
        clearInterval(humorInterval);
        clearInterval(pollingInterval);
        statusDisplay.textContent = "Stopped";
        progressBar.style.width = "0%";
        estimatedTimeDisplay.textContent = "Canceled";
        humorTextDisplay.textContent = "";
        // Optionally: send a "cancel" request to the server if backend supports it
    }

    // Function to poll progress periodically
    async function pollProgress() {
        try {
            const response = await fetch("/api/progress");
            const { progress, estimatedTime } = await response.json();
            progressBar.style.width = `${progress}%`;
            estimatedTimeDisplay.textContent = `Estimated Time: ${estimatedTime.toFixed(1)} seconds remaining`;

            if (progress === 100) {
                clearInterval(pollingInterval);
                statusDisplay.textContent = "Completed";
                testingInProgress = false;
                toggleButton();
            }
        } catch (error) {
            console.error("Error polling progress:", error);
        }
    }

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
        testingInProgress = false;
        toggleButton();
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected");
    });

    // Event listener for the Start/Stop Testing button
    startTestingButton.addEventListener("click", async () => {
        if (testingInProgress) {
            stopTesting();  // Stop the test if already in progress
            return;
        }

        const url = urlInput.value.trim();
        if (!url) return alert("Please enter a URL to test.");

        // Start the test
        testingInProgress = true;
        toggleButton();
        statusDisplay.textContent = "In-Progress";
        progressBar.style.width = "0%";
        estimatedTimeDisplay.textContent = "Estimating...";
        reportLink.innerHTML = "";

        // Set humor messages
        let messageIndex = 0;
        humorTextDisplay.textContent = humorMessages[messageIndex];
        humorInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % humorMessages.length;
            humorTextDisplay.textContent = humorMessages[messageIndex];
        }, 2000);

        // Poll for progress every few seconds
        pollingInterval = setInterval(pollProgress, 3000);

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
                stopTesting();  // Stop the test in case of an error
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            stopTesting();  // Stop the test in case of an error
            alert("An error occurred. Please check the console for details.");
        }
    });
});