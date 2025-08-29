// This code runs only after the entire HTML document is fully loaded.
document.addEventListener("DOMContentLoaded", () => {
    // We're storing references to different parts of our website so we can change them with JavaScript.
    const splashPage = document.getElementById("splash-page");
    const workerForm = document.getElementById("worker-form");
    const adminLoginForm = document.getElementById("admin-login-form");
    const mainApp = document.getElementById("main-app");
    const workerSuccess = document.getElementById("worker-success");
    const issuesList = document.getElementById("issues-list");
    const logoutBtn = document.getElementById("logout-btn");
    const statusFilter = document.getElementById("status-filter");
    const closeTabBtn = document.getElementById("close-tab-btn");
    const workerIssuePriorityInput = document.getElementById("worker-issue-priority");
    const exitBtn = document.getElementById("exit-btn");

    // These are fixed values and variables we'll use throughout the script.
    const ADMIN_USER = "admin";
    const ADMIN_PASS = "password";
    const ISSUES_STORAGE_KEY = "issueTrackerIssues";
    let issues = []; // This array will hold all the 'issue' data.

    // These functions perform the main actions of the app, like showing pages or saving data.
    /**
     * Hides all pages and shows only the one we want.
     * @param {HTMLElement} pageToShow The page element to display.
     */
    function showPage(pageToShow) {
        // First, hide every page by removing the 'active' class.
        document.querySelectorAll(".page").forEach((page) => {
            page.classList.remove("active");
        });
        // Then, show the correct page by adding the 'active' class.
        pageToShow.classList.add("active");
        // We only show the Logout button on the main admin page.
        logoutBtn.style.display = pageToShow === mainApp ? "block" : "none";
    }

    /**
     * Loads saved issues from the browser's storage and puts them on the page.
     */
    function loadIssues() {
        try {
            const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
            if (storedIssues) {
                // If there's data, convert it from a text string back into a JavaScript array.
                issues = JSON.parse(storedIssues).sort((a, b) => b.createdAt - a.createdAt);
            }
        } catch (error) {
            console.error("Failed to parse issues from localStorage:", error);
            issues = []; // If data is broken, start with an empty list.
        }
        renderIssues();
    }

    /**
     * Saves the current list of issues to the browser's storage.
     */
    function saveIssues() {
        // Convert the issues array into a text string before saving.
        localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
    }

    /**
     * Puts the issues onto the web page as visible cards.
     */
    function renderIssues() {
        issuesList.innerHTML = ""; // Clear out any old issues first.
        const filterStatus = statusFilter.value;
        const filteredIssues = issues.filter((issue) =>
            filterStatus === "all" || issue.status === filterStatus
        );

        if (filteredIssues.length === 0) {
            issuesList.innerHTML = '<p class="no-issues-message">No issues found for this filter. 🧐</p>';
            return;
        }

        // Go through each issue and create an HTML card for it
        filteredIssues.forEach((issue) => {
            const issueCard = document.createElement("div");
            issueCard.className = `issue-card ${issue.status}`;
            issueCard.setAttribute('data-id', issue.id); // Store the issue's ID on the card.
            issueCard.innerHTML = `
                <h3>${issue.title}</h3>
                <p>${issue.description}</p>
                <div class="meta">
                    <span>Status: <span class="status-badge status-${issue.status}">${issue.status}</span></span>
                    <span>Priority: <span class="priority-badge priority-${issue.priority}">${issue.priority}</span></span>
                </div>
                <div class="issue-actions">
                    <button class="resolve-btn">${issue.status === "open" ? "Resolve" : "Re-open"}</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;
            issuesList.appendChild(issueCard);
        });
    }

    /**
     * Checks if the admin is logged in when the app starts.
     */
    function checkAuthentication() {
        if (localStorage.getItem("isAuthenticated") === "true") {
            // If logged in, show the main app and load issues.
            showPage(mainApp);
            loadIssues();
        } else {
            // If not logged in, show the initial splash page.
            showPage(splashPage);
        }
    }

    // These lines of code listen for clicks or form submissions and run a function when they happen.
    // Show the "Report an Issue" form when the button is clicked.
    document.getElementById("worker-btn").addEventListener("click", () => showPage(workerForm));
    // Show the "Admin Login" form.
    document.getElementById("admin-btn").addEventListener("click", () => showPage(adminLoginForm));

    // This handles when a user is submitting a new issue.
    document.getElementById("issue-report-form").addEventListener("submit", (e) => {
        e.preventDefault(); // Stop the form from doing its default action (reloading the page).
        const title = document.getElementById("worker-issue-title").value.trim();
        const description = document.getElementById("worker-issue-description").value.trim();
        const priority = workerIssuePriorityInput.value;

        if (title && description) {
            const newIssue = {
                id: Date.now().toString(), // Create a unique ID for the new issue.
                title,
                description,
                status: "open",
                priority: priority,
                createdAt: new Date().getTime(),
            };
            issues.push(newIssue);
            issues.sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first.
            saveIssues();
            e.target.reset(); // Clear the form fields.
            showPage(workerSuccess); 
        } else {
            alert("Please enter a title, description, and select a priority.");
        }
    });

    // Handle admin login.
    document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            localStorage.setItem("isAuthenticated", "true"); // Save that the user is logged in.
            showPage(mainApp);
            loadIssues();
            e.target.reset();
        } else {
            alert("Invalid credentials");
        }
    });

    // Handle logout.
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("isAuthenticated"); // Remove the login status.
        showPage(splashPage);
    });

    // Handle filtering
    statusFilter.addEventListener("change", renderIssues);

    // Close the browser tab.
    closeTabBtn.addEventListener("click", () => {
        window.close();
    });

    // Handle the exit button click (closes the tab)
    exitBtn.addEventListener("click", () => {
        window.close();
    });

    // "Resolve" and "Delete" buttons inside each issue card
    issuesList.addEventListener("click", (e) => {
        const issueCard = e.target.closest('.issue-card');
        if (!issueCard) return;

        const id = issueCard.dataset.id;
        if (e.target.classList.contains("resolve-btn")) {
            
            const issue = issues.find((i) => i.id === id);
            if (issue) {
                issue.status = issue.status === "open" ? "resolved" : "open";
                saveIssues();
                renderIssues();
            }
        } else if (e.target.classList.contains("delete-btn")) {
           
            issues = issues.filter((i) => i.id !== id);
            saveIssues();
            renderIssues();
        }
    });

    
    // This is the starting point of the application.
    checkAuthentication();
});