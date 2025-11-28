(() => {
    // Check if the system is in dark mode
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    const theme = isDarkMode() ? 'dark' : 'light';
    
    // Configuration
    const MAX_NETWORK_ENTRIES = 100;
    const MAX_CONSOLE_ENTRIES = 500;
    
    // Store event listeners for cleanup
    const eventListeners = [];
    
    // Helper to add tracked event listeners
    const addTrackedEventListener = (element, event, handler) => {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
    };
    
    // Helper to safely stringify objects (handles circular references)
    const safeStringify = (obj) => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
            }
            return value;
        });
    };

    // HTML template for the dev console
    const consoleHTML = `
        <div id="dev-console" class="dev-console-container">
            <div class="dev-console-nav">
                <button class="dev-console-nav-button active" id="navConsole">Console</button>
                <button class="dev-console-nav-button" id="navElements">Elements</button>
                <button class="dev-console-nav-button" id="navNetwork">Network</button>
                <button class="dev-console-nav-button" id="navInfo">Info</button>
                <button class="dev-console-nav-button" id="consoleMinimize">_</button>
                <button class="dev-console-nav-button" id="consoleExit">×</button>
            </div>
            <div class="dev-console-body">
                <div id="sectionConsole" class="dev-console-section">
                    <div class="console-output"></div>
                    <div class="console-input-wrapper">
                        <button id="clearConsole">Clear Console</button>
                        <textarea id="consoleInput" placeholder="Enter JavaScript..."></textarea>
                    </div>
                </div>
                <div id="sectionElements" class="dev-console-section hidden">
                    <div class="elements-controls">
                        <button id="elementViewer">View HTML</button>
                    </div>
                    <div class="elements-container"></div>
                </div>
                <div id="sectionNetwork" class="dev-console-section hidden">
                    <div class="network-controls">
                        <button id="clearNetwork">Clear</button>
                    </div>
                    <div class="network-container"></div>
                    <div class="network-details hidden"></div>
                </div>
                <div id="sectionInfo" class="dev-console-section hidden">
                    <div id="deviceInfo" class="device-info"></div>
                    <div id="aboutInfo" class="about-info"></div>
                    <div class="info-controls">
                        <button id="clearCookies">Clear Cookies</button>
                        <button id="clearStorage">Clear Storage</button>
                        <button id="reloadPage">Reload Page</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // CSS variables for theming (reduces code duplication)
    const themeVars = theme === 'light' ? {
        bg: '#ffffff',
        bgSecondary: '#f0f0f0',
        bgTertiary: '#f5f5f5',
        text: '#000',
        textSecondary: '#888',
        border: '#ccc',
        borderLight: '#d0d0d0',
        borderDark: '#eee',
        activeBg: '#ffffff'
    } : {
        bg: '#1e1e1e',
        bgSecondary: '#2d2d2d',
        bgTertiary: '#2d2d2d',
        text: '#fff',
        textSecondary: '#aaa',
        border: '#3d3d3d',
        borderLight: '#3d3d3d',
        borderDark: '#3d3d3d',
        activeBg: '#3d3d3d'
    };

    // CSS styles for the dev console
    const consoleStyles = `
        .dev-console-container {
            --bg: ${themeVars.bg};
            --bg-secondary: ${themeVars.bgSecondary};
            --bg-tertiary: ${themeVars.bgTertiary};
            --text: ${themeVars.text};
            --text-secondary: ${themeVars.textSecondary};
            --border: ${themeVars.border};
            --border-light: ${themeVars.borderLight};
            --active-bg: ${themeVars.activeBg};
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50%;
            background: var(--bg);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            color: var(--text);
        }
        .dev-console-nav {
            display: flex;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-light);
        }
        .dev-console-nav-button {
            padding: 10px 15px;
            border: none;
            background: transparent;
            color: var(--text);
            cursor: pointer;
            font-size: 14px;
            flex-grow: 1;
            text-align: center;
        }
        .dev-console-nav-button.active {
            background: var(--active-bg);
            border-bottom: 2px solid #2196f3;
        }
        #consoleExit {
            flex-grow: 0;
            font-size: 20px;
            padding: 5px 15px;
        }
        .dev-console-body {
            flex-grow: 1;
            overflow-y: auto;
        }
        .dev-console-section {
            height: 100%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }
        .hidden {
            display: none !important;
        }
        .console-output, .network-container, .network-details, .elements-container {
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
            color: var(--text);
        }
        .console-input-wrapper {
            border-top: 1px solid var(--border);
            padding: 10px;
        }
        #consoleInput {
            width: 100%;
            height: 40px;
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 5px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 10px;
            color: var(--text);
            background: var(--bg);
            box-sizing: border-box;
        }
        .elements-controls, .network-controls, .info-controls {
            display: flex;
            padding: 10px;
            gap: 10px;
        }
        .elements-controls button, .network-controls button, .info-controls button, #clearConsole {
            flex-grow: 1;
            padding: 8px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 4px;
            cursor: pointer;
            color: var(--text);
        }
        .device-info {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 4px;
            margin: 10px;
            padding: 10px;
            font-size: 12px;
            color: var(--text);
        }
        .device-info h4, .device-info p {
            margin: 5px 0;
            color: var(--text);
        }
        .device-info h4 {
            margin-top: 0;
            margin-bottom: 10px;
        }
        .network-item {
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            color: var(--text);
            background: var(--bg);
        }
        .network-item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            color: var(--text);
        }
        .network-item-details {
            margin-top: 5px;
            font-size: 11px;
            color: var(--text);
        }
        .network-item-url {
            word-break: break-all;
        }
        .network-details {
            color: var(--text);
        }
        .network-details pre {
            white-space: pre-wrap;
            word-break: break-all;
            background: var(--bg-secondary);
            color: var(--text);
        }
        .back-button {
            margin-bottom: 10px;
            color: var(--text);
            width: 100%;
            height: 40px;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-secondary);
            cursor: pointer;
        }
        .elements-container {
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            overflow-x: auto;
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text);
        }
        .about-info {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 4px;
            margin: 10px;
            padding: 15px;
            font-size: 14px;
            color: var(--text);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .about-info h4 {
            margin-top: 0;
            margin-bottom: 10px;
            color: var(--text);
        }
        .about-info a {
            color: #2196f3;
            text-decoration: none;
        }
        .about-info a:hover {
            text-decoration: underline;
        }
        .dev-console-container.minimized {
            height: 30px;
            overflow: hidden;
        }
        #consoleMinimize {
            font-size: 18px;
            line-height: 14px;
        }
    `;

    // Inject HTML and CSS into the document
    const injectElement = (html) => {
        const div = document.createElement("div");
        div.innerHTML = html.trim();
        return div.firstChild;
    };

    document.body.appendChild(injectElement(consoleHTML));
    const style = document.createElement("style");
    style.textContent = consoleStyles;
    document.head.appendChild(style);

    // Console functionality
    const consoleOutput = document.querySelector(".console-output");
    const consoleInput = document.getElementById("consoleInput");

    const log = (message, type = "log") => {
        // Memory management: remove oldest entries if over limit
        while (consoleOutput.children.length >= MAX_CONSOLE_ENTRIES) {
            consoleOutput.removeChild(consoleOutput.firstChild);
        }
        
        const line = document.createElement("div");
        line.className = `console-${type}`;
        const timestamp = new Date().toLocaleTimeString();
        let color;
        switch (type) {
            case "error":
                color = "#ff0000";
                break;
            case "warn":
                color = "#ff9900";
                break;
            case "info":
                color = "#0099ff";
                break;
            case "input":
                color = themeVars.textSecondary;
                break;
            default:
                color = themeVars.text;
        }
        
        // Create elements safely to prevent XSS
        const timestampSpan = document.createElement("span");
        timestampSpan.style.color = themeVars.textSecondary;
        timestampSpan.textContent = `[${timestamp}]`;
        
        const typeSpan = document.createElement("span");
        typeSpan.style.color = color;
        typeSpan.textContent = ` [${type}] `;
        
        const messageSpan = document.createElement("span");
        messageSpan.style.color = themeVars.text;
        messageSpan.textContent = message;
        
        line.appendChild(timestampSpan);
        line.appendChild(typeSpan);
        line.appendChild(messageSpan);
        
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };

    const clearConsole = () => {
        consoleOutput.innerHTML = "";
        log("Console cleared", "info");
    };

    addTrackedEventListener(document.getElementById("clearConsole"), "click", clearConsole);

    const handleConsoleInput = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const code = consoleInput.value;
            log(`> ${code}`, "input");
            try {
                const result = eval(code);
                log(result);
            } catch (error) {
                log(`Error: ${error.message}`, "error");
            }
            consoleInput.value = "";
        }
    };
    addTrackedEventListener(consoleInput, "keydown", handleConsoleInput);

    // Navigation functionality
    const navButtons = document.querySelectorAll(".dev-console-nav-button");
    const sections = document.querySelectorAll(".dev-console-section");

    const handleNavClick = (button) => () => {
        const targetId = button.id.replace("nav", "section");
        sections.forEach((section) => section.classList.add("hidden"));
        document.getElementById(targetId)?.classList.remove("hidden");
        navButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
    };
    
    navButtons.forEach((button) => {
        addTrackedEventListener(button, "click", handleNavClick(button));
    });

    // Element Viewer functionality
    const handleElementViewer = () => {
        const elementsContainer = document.querySelector('.elements-container');
        const devConsole = document.getElementById('dev-console');
        devConsole.style.display = 'none';
        const html = document.documentElement.outerHTML;
        devConsole.style.display = '';
        
        // Remove the dev-console HTML from the output
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        doc.getElementById('dev-console').remove();
        const cleanHtml = doc.documentElement.outerHTML;
        
        // Display the HTML as-is
        elementsContainer.textContent = cleanHtml;
        log('Page HTML loaded in the Elements tab.', 'info');
    };
    addTrackedEventListener(document.getElementById('elementViewer'), 'click', handleElementViewer);

    // Network monitoring functionality
    const networkContainer = document.querySelector('.network-container');
    const networkDetails = document.querySelector('.network-details');
    let networkLog = [];

    const addNetworkEntry = (entry) => {
        // Memory management: remove oldest entries if over limit
        if (networkLog.length >= MAX_NETWORK_ENTRIES) {
            networkLog.shift();
        }
        networkLog.push(entry);
        updateNetworkDisplay();
    };

    const updateNetworkDisplay = () => {
        networkContainer.innerHTML = '';
        networkLog.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'network-item';
            
            // Create elements safely to prevent XSS
            const header = document.createElement('div');
            header.className = 'network-item-header';
            const urlSpan = document.createElement('span');
            urlSpan.className = 'network-item-url';
            urlSpan.textContent = entry.url;
            header.appendChild(urlSpan);
            
            // Create details elements safely using textContent
            const details = document.createElement('div');
            details.className = 'network-item-details';
            
            const statusDiv = document.createElement('div');
            statusDiv.textContent = `Status: ${entry.status}`;
            const methodDiv = document.createElement('div');
            methodDiv.textContent = `Method: ${entry.method}`;
            const typeDiv = document.createElement('div');
            typeDiv.textContent = `Type: ${entry.type}`;
            const timeDiv = document.createElement('div');
            timeDiv.textContent = `Time: ${entry.time}ms`;
            
            details.appendChild(statusDiv);
            details.appendChild(methodDiv);
            details.appendChild(typeDiv);
            details.appendChild(timeDiv);
            
            item.appendChild(header);
            item.appendChild(details);
            item.addEventListener('click', () => showNetworkDetails(index));
            networkContainer.appendChild(item);
        });
    };

    const showNetworkDetails = (index) => {
        const entry = networkLog[index];
        
        // Build content safely
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.textContent = 'Back to Network List';
        backButton.addEventListener('click', () => {
            networkDetails.classList.add('hidden');
            networkContainer.classList.remove('hidden');
        });
        
        const heading = document.createElement('h3');
        heading.textContent = 'Request Details';
        
        const pre = document.createElement('pre');
        pre.textContent = `URL: ${entry.url}
Method: ${entry.method}
Status: ${entry.status}
Type: ${entry.type}
Time: ${entry.time}ms

Request Headers:
${formatHeaders(entry.requestHeaders)}

Request Body:
${entry.requestBody}

Response Headers:
${formatHeaders(entry.responseHeaders)}

Response Body:
${entry.responseBody}`;
        
        networkDetails.innerHTML = '';
        networkDetails.appendChild(backButton);
        networkDetails.appendChild(heading);
        networkDetails.appendChild(pre);
        networkDetails.classList.remove('hidden');
        networkContainer.classList.add('hidden');
    };
    
    const formatHeaders = (headers) => {
        if (!headers || typeof headers !== 'object') return '';
        return Object.entries(headers).map(([key, value]) => {
            // Safely convert to string to handle any type of value
            const safeKey = String(key);
            const safeValue = String(value);
            return `${safeKey}: ${safeValue}`;
        }).join('\n');
    };

    const clearNetworkLog = () => {
        networkLog = [];
        updateNetworkDisplay();
        networkDetails.classList.add('hidden');
        networkContainer.classList.remove('hidden');
    };

    addTrackedEventListener(document.getElementById('clearNetwork'), 'click', clearNetworkLog);

    // Override fetch and XMLHttpRequest to monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const start = performance.now();
        try {
            const request = args[1] || {};
            let requestBody = 'No request body';
            if (request.body) {
                if (typeof request.body === 'string') {
                    requestBody = request.body;
                } else if (request.body instanceof FormData) {
                    requestBody = '[FormData]';
                } else if (request.body instanceof URLSearchParams) {
                    requestBody = request.body.toString();
                } else if (request.body instanceof Blob) {
                    requestBody = '[Blob]';
                } else {
                    try {
                        requestBody = safeStringify(request.body);
                    } catch (e) {
                        requestBody = '[Unable to stringify request body]';
                    }
                }
            }

            const response = await originalFetch(...args);
            const time = performance.now() - start;
            const clone = response.clone();
            const responseBody = await clone.text();
            addNetworkEntry({
                url: String(args[0]),
                method: request.method || 'GET',
                status: response.status,
                type: 'fetch',
                time: time.toFixed(2),
                requestHeaders: request.headers || {},
                requestBody: requestBody,
                responseHeaders: Object.fromEntries(response.headers.entries()),
                responseBody: responseBody
            });
            return response;
        } catch (error) {
            addNetworkEntry({
                url: String(args[0]),
                method: args[1]?.method || 'GET',
                status: 'Error',
                type: 'fetch',
                time: (performance.now() - start).toFixed(2),
                requestHeaders: args[1]?.headers || {},
                requestBody: 'No request body',
                responseHeaders: {},
                responseBody: error.message
            });
            throw error;
        }
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function(...args) {
        this._networkInfo = {
            url: args[1],
            method: args[0],
            start: performance.now(),
            requestHeaders: {}
        };
        originalXHROpen.apply(this, args);
    };

    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (this._networkInfo) {
            this._networkInfo.requestHeaders[header] = value;
        }
        originalXHRSetRequestHeader.apply(this, arguments);
    };
    
    const handleXHRResponse = function(isError = false) {
        if (!this._networkInfo) return;
        
        const time = performance.now() - this._networkInfo.start;
        let requestBody = 'No request body';
        if (this._networkInfo.body) {
            if (typeof this._networkInfo.body === 'string') {
                requestBody = this._networkInfo.body;
            } else if (this._networkInfo.body instanceof FormData) {
                requestBody = '[FormData]';
            } else if (this._networkInfo.body instanceof Blob) {
                requestBody = '[Blob]';
            } else {
                try {
                    requestBody = safeStringify(this._networkInfo.body);
                } catch (e) {
                    requestBody = '[Unable to stringify request body]';
                }
            }
        }
        addNetworkEntry({
            url: this._networkInfo.url,
            method: this._networkInfo.method,
            status: isError ? 'Error' : this.status,
            type: 'xhr',
            time: time.toFixed(2),
            requestHeaders: this._networkInfo.requestHeaders,
            requestBody: requestBody,
            responseHeaders: parseResponseHeaders(this.getAllResponseHeaders()),
            responseBody: isError ? 'Network Error' : this.responseText
        });
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (this._networkInfo) {
            this._networkInfo.body = body;
        }
        this.addEventListener('load', function() {
            handleXHRResponse.call(this, false);
        });
        this.addEventListener('error', function() {
            handleXHRResponse.call(this, true);
        });
        originalXHRSend.apply(this, arguments);
    };

    const parseResponseHeaders = (headerStr) => {
        const headers = {};
        if (!headerStr) {
            return headers;
        }
        const headerPairs = headerStr.trim().split('\u000d\u000a');
        for (let i = 0; i < headerPairs.length; i++) {
            const headerPair = headerPairs[i];
            const index = headerPair.indexOf('\u003a\u0020');
            if (index > 0) {
                const key = headerPair.substring(0, index);
                const val = headerPair.substring(index + 2);
                headers[key] = val;
            }
        }
        return headers;
    };
    
    // Info functionality
    const handleClearCookies = () => {
        document.cookie.split(";").forEach((cookie) => {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
        log("Cookies cleared", "info");
    };
    addTrackedEventListener(document.getElementById("clearCookies"), "click", handleClearCookies);

    const handleClearStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
        log("Local and Session storage cleared", "info");
    };
    addTrackedEventListener(document.getElementById("clearStorage"), "click", handleClearStorage);

    const handleReloadPage = () => {
        window.location.reload();
    };
    addTrackedEventListener(document.getElementById("reloadPage"), "click", handleReloadPage);

    // About Info - use safe DOM methods
    const aboutInfo = document.getElementById("aboutInfo");
    const aboutTitle = document.createElement("h4");
    aboutTitle.textContent = "About";
    const aboutCreator = document.createElement("p");
    aboutCreator.textContent = "Created by: Saksham Shekher";
    const aboutGithub = document.createElement("p");
    aboutGithub.textContent = "GitHub: ";
    const githubLink = document.createElement("a");
    githubLink.href = "https://github.com/OshekharO";
    githubLink.target = "_blank";
    githubLink.rel = "noopener noreferrer";
    githubLink.textContent = "https://github.com/OshekharO";
    aboutGithub.appendChild(githubLink);
    aboutInfo.appendChild(aboutTitle);
    aboutInfo.appendChild(aboutCreator);
    aboutInfo.appendChild(aboutGithub);

    // Device Info - use safe DOM methods
    const deviceInfo = document.getElementById("deviceInfo");
    const deviceTitle = document.createElement("h4");
    deviceTitle.textContent = "Device Info";
    deviceInfo.appendChild(deviceTitle);
    
    const deviceInfoItems = [
        ["User Agent", navigator.userAgent],
        ["Platform", navigator.platform],
        ["Screen Size", `${window.screen.width}x${window.screen.height}`],
        ["Viewport Size", `${window.innerWidth}x${window.innerHeight}`],
        ["Device Pixel Ratio", window.devicePixelRatio],
        ["Browser Name", navigator.appName],
        ["Browser Language", navigator.language]
    ];
    
    deviceInfoItems.forEach(([label, value]) => {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = `${label}: `;
        p.appendChild(strong);
        p.appendChild(document.createTextNode(value));
        deviceInfo.appendChild(p);
    });

    // Cleanup function for removing event listeners and restoring originals
    const cleanup = () => {
        // Remove all tracked event listeners
        eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        eventListeners.length = 0;
        
        // Restore original console methods
        ["log", "error", "warn", "info"].forEach((method) => {
            console[method] = originalConsole[method];
        });
        
        // Restore original fetch
        window.fetch = originalFetch;
        
        // Restore original XMLHttpRequest methods
        XMLHttpRequest.prototype.open = originalXHROpen;
        XMLHttpRequest.prototype.send = originalXHRSend;
        XMLHttpRequest.prototype.setRequestHeader = originalXHRSetRequestHeader;
        
        // Remove style element
        style.remove();
    };

    // Close button functionality with cleanup
    const handleConsoleExit = () => {
        cleanup();
        document.getElementById("dev-console").remove();
    };
    addTrackedEventListener(document.getElementById("consoleExit"), "click", handleConsoleExit);

    // Override console methods - call original and log to dev console
    const originalConsole = { ...console };
    ["log", "error", "warn", "info"].forEach((method) => {
        console[method] = (...args) => {
            // Call original console method to maintain devtools functionality
            originalConsole[method].apply(console, args);
            // Log to dev console using safe stringify
            log(args.map((arg) => (typeof arg === "object" ? safeStringify(arg) : String(arg))).join(" "), method);
            return args.length <= 1 ? args[0] : args;
        };
    });

    const consoleContainer = document.getElementById('dev-console');
    const minimizeButton = document.getElementById('consoleMinimize');

    let isMinimized = false;

    function toggleConsole() {
        isMinimized = !isMinimized;
        consoleContainer.classList.toggle('minimized', isMinimized);
        minimizeButton.textContent = isMinimized ? '+' : '−';
        if (!isMinimized) {
            const consoleTab = document.getElementById('navConsole');
            consoleTab.click();
        }
    }

    addTrackedEventListener(minimizeButton, 'click', toggleConsole);
    
    log("Mobile Dev Console initialized", "info");
})();
