(() => {
 function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
 }

 let theme = isDarkMode() ? 'dark' : 'light';

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

 const consoleStyles = `
    .dev-console-container {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 50%;
        background: ${theme === 'light' ? '#ffffff' : '#1e1e1e'};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .dev-console-nav {
        display: flex;
        background: ${theme === 'light' ? '#f0f0f0' : '#2d2d2d'};
        border-bottom: 1px solid ${theme === 'light' ? '#d0d0d0' : '#3d3d3d'};
    }
    .dev-console-nav-button {
        padding: 10px 15px;
        border: none;
        background: transparent;
        color: ${theme === 'light' ? '#000' : '#fff'};
        cursor: pointer;
        font-size: 14px;
        flex-grow: 1;
        text-align: center;
    }
    .dev-console-nav-button.active {
        background: ${theme === 'light' ? '#ffffff' : '#3d3d3d'};
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
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .console-input-wrapper {
        border-top: 1px solid ${theme === 'light' ? '#eee' : '#3d3d3d'};
        padding: 10px;
    }
    #consoleInput {
        width: 100%;
        height: 40px;
        border: 1px solid ${theme === 'light' ? '#ccc' : '#3d3d3d'};
        border-radius: 4px;
        padding: 5px;
        font-family: monospace;
        font-size: 12px;
        margin-top: 10px;
        color: ${theme === 'light' ? '#000' : '#fff'};
        background: ${theme === 'light' ? '#fff' : '#2d2d2d'};
    }
    .elements-controls, .network-controls, .info-controls {
        display: flex;
        padding: 10px;
        gap: 10px;
    }
    .elements-controls button, .network-controls button, .info-controls button, #clearConsole {
        flex-grow: 1;
        padding: 8px;
        background: ${theme === 'light' ? '#f0f0f0' : '#3d3d3d'};
        border: 1px solid ${theme === 'light' ? '#ccc' : '#4d4d4d'};
        border-radius: 4px;
        cursor: pointer;
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .device-info {
        background: ${theme === 'light' ? '#f0f0f0' : '#2d2d2d'};
        border: 1px solid ${theme === 'light' ? '#ccc' : '#3d3d3d'};
        border-radius: 4px;
        margin: 10px;
        padding: 10px;
        font-size: 12px;
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .device-info h4 {
        margin-top: 0;
        margin-bottom: 10px;
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .device-info p {
        margin: 5px 0;
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .network-item {
        border: 1px solid ${theme === 'light' ? '#ccc' : '#3d3d3d'};
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        color: ${theme === 'light' ? '#000' : '#fff'};
        background: ${theme === 'light' ? '#fff' : '#2d2d2d'};
    }
    .network-item-header {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .network-item-details {
        margin-top: 5px;
        font-size: 11px;
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .network-item-url {
        word-break: break-all;
    }
    .network-details {
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .network-details pre {
        white-space: pre-wrap;
        word-break: break-all;
        background: ${theme === 'light' ? '#f0f0f0' : '#2d2d2d'};
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .back-button {
        margin-bottom: 10px;
        color: ${theme === 'light' ? '#000' : '#fff'};
        width: 100%;
        height: 40px;
        border: 1px solid ${theme === 'light' ? '#ccc' : '#3d3d3d'};
        border-radius: 4px;
        background: ${theme === 'light' ? '#f0f0f0' : '#3d3d3d'};
    }
    .elements-container {
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        overflow-x: auto;
        background-color: ${theme === 'light' ? '#f5f5f5' : '#2d2d2d'};
        border: 1px solid ${theme === 'light' ? '#ccc' : '#3d3d3d'};
        border-radius: 4px;
        color: ${theme === 'light' ? '#000' : '#fff'};
    }
    .about-info {
        background: ${theme === 'light' ? '#ffffff' : '#2d2d2d'};
        border: 1px solid ${theme === 'light' ? '#ccc' : '#3d3d3d'};
        border-radius: 4px;
        margin: 10px;
        padding: 15px;
        font-size: 14px;
        color: ${theme === 'light' ? '#000' : '#fff'};
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
     }
     .about-info h4 {
        margin-top: 0;
        margin-bottom: 10px;
        color: ${theme === 'light' ? '#000' : '#fff'};
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
    .html-controls {
        margin-bottom: 10px;
    }
    .html-controls button {
        margin-right: 10px;
    }
    .html-content {
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 12px;
    }
    .html-content .tag {
        color: #0000ff;
    }
    .html-content .collapsible {
        cursor: pointer;
    }
    .html-content .collapsible.collapsed > * {
        display: none;
    }
    .html-content .collapsible.collapsed > .tag:first-child {
        display: inline;
    }
    .network-detail-section {
        margin-bottom: 20px;
    }
    .network-detail-section h4 {
        margin-bottom: 5px;
    }
    .copy-button {
        margin-top: 5px;
    }
`;

 // Inject HTML and CSS
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
    color = theme === 'light' ? "#888888" : "#aaaaaa";
    break;
   default:
    color = theme === 'light' ? "#000000" : "#ffffff";
  }
  line.innerHTML = `<span style="color: ${theme === 'light' ? '#888' : '#aaa'};">[${timestamp}]</span> <span style="color: ${color};">[${type}]</span> <span style="color: ${theme === 'light' ? '#000' : '#fff'};">${message}</span>`;
  consoleOutput.appendChild(line);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
 };

 const clearConsole = () => {
  consoleOutput.innerHTML = "";
  log("Console cleared", "info");
 };

 document.getElementById("clearConsole").addEventListener("click", clearConsole);

 consoleInput.addEventListener("keydown", (e) => {
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
 });

 // Navigation functionality
 const navButtons = document.querySelectorAll(".dev-console-nav-button");
 const sections = document.querySelectorAll(".dev-console-section");

 navButtons.forEach((button) => {
  button.addEventListener("click", () => {
   const targetId = button.id.replace("nav", "section");
   sections.forEach((section) => section.classList.add("hidden"));
   document.getElementById(targetId)?.classList.remove("hidden");
   navButtons.forEach((btn) => btn.classList.remove("active"));
   button.classList.add("active");
  });
 });

 // Element Viewer functionality
document.getElementById('elementViewer').addEventListener('click', () => {
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
    
    // Format HTML with syntax highlighting
    const formattedHtml = formatHtml(cleanHtml);
    elementsContainer.innerHTML = `
        <div class="html-controls">
            <button id="copyHtml">Copy HTML</button>
            <button id="expandAll">Expand All</button>
            <button id="collapseAll">Collapse All</button>
        </div>
        <pre class="html-content">${formattedHtml}</pre>
    `;
    
    // Add event listeners for new buttons
    document.getElementById('copyHtml').addEventListener('click', () => {
        navigator.clipboard.writeText(cleanHtml).then(() => {
            log('HTML copied to clipboard', 'info');
        });
    });
    
    document.getElementById('expandAll').addEventListener('click', () => {
        document.querySelectorAll('.html-content .collapsible').forEach(el => el.classList.remove('collapsed'));
    });
    
    document.getElementById('collapseAll').addEventListener('click', () => {
        document.querySelectorAll('.html-content .collapsible').forEach(el => el.classList.add('collapsed'));
    });
    
    // Add click event for collapsible elements
    document.querySelectorAll('.html-content .collapsible').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            el.classList.toggle('collapsed');
        });
    });
    
    log('Page HTML loaded in the Elements tab.', 'info');
});

function formatHtml(html) {
    let formatted = '';
    let indent = 0;
    const lines = html.split(/>\\s*</);
    lines.forEach((line, index) => {
        if (index > 0) formatted += '<';
        if (line.indexOf('/') === 0 && indent > 0) indent--;
        formatted += '  '.repeat(indent) + line.trim();
        if (line.indexOf('/') !== 0 && line.indexOf('/>') === -1) indent++;
        if (index < lines.length - 1) formatted += '>';
        formatted += '\\n';
    });
    
    // Add collapsible feature
    formatted = formatted.replace(/<([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
        return `<span class="collapsible"><span class="tag"><${tag}${attrs}></span>`;
    });
    formatted = formatted.replace(/<\\/([a-z0-9]+)>/gi, (match, tag) => {
        return `</span><span class="tag"></${tag}></span>`;
    });
    
    return formatted;
}

 // Network monitoring functionality
const networkContainer = document.querySelector('.network-container');
const networkDetails = document.querySelector('.network-details');
let networkLog = [];

const addNetworkEntry = (entry) => {
    networkLog.push(entry);
    updateNetworkDisplay();
};

const updateNetworkDisplay = () => {
    networkContainer.innerHTML = '';
    networkLog.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'network-item';
        item.innerHTML = `
            <div class="network-item-header">
                <span class="network-item-url">${entry.url}</span>
            </div>
            <div class="network-item-details">
                <div>Status: ${entry.status}</div>
                <div>Method: ${entry.method}</div>
                <div>Type: ${entry.type}</div>
                <div>Time: ${entry.time}ms</div>
            </div>
        `;
        item.addEventListener('click', () => showNetworkDetails(index));
        networkContainer.appendChild(item);
    });
};

const showNetworkDetails = (index) => {
    const entry = networkLog[index];
    networkDetails.innerHTML = `
        <button class="back-button">Back to Network List</button>
        <h3>Request Details</h3>
        <div class="network-detail-section">
            <h4>General</h4>
            <pre>
URL: ${entry.url}
Method: ${entry.method}
Status: ${entry.status}
Type: ${entry.type}
Time: ${entry.time}ms
            </pre>
            <button class="copy-button" data-content="general">Copy</button>
        </div>
        <div class="network-detail-section">
            <h4>Request Headers</h4>
            <pre>${formatHeaders(entry.requestHeaders)}</pre>
            <button class="copy-button" data-content="requestHeaders">Copy</button>
        </div>
        <div class="network-detail-section">
            <h4>Request Body</h4>
            <pre>${entry.requestBody}</pre>
            <button class="copy-button" data-content="requestBody">Copy</button>
        </div>
        <div class="network-detail-section">
            <h4>Response Headers</h4>
            <pre>${formatHeaders(entry.responseHeaders)}</pre>
            <button class="copy-button" data-content="responseHeaders">Copy</button>
        </div>
        <div class="network-detail-section">
            <h4>Response Body</h4>
            <pre>${entry.responseBody}</pre>
            <button class="copy-button" data-content="responseBody">Copy</button>
        </div>
    `;
    
    networkDetails.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.dataset.content;
            let textToCopy = '';
            switch (content) {
                case 'general':
                    textToCopy = `URL: ${entry.url}\\nMethod: ${entry.method}\\nStatus: ${entry.status}\\nType: ${entry.type}\\nTime: ${entry.time}ms`;
                    break;
                case 'requestHeaders':
                    textToCopy = formatHeaders(entry.requestHeaders);
                    break;
                case 'requestBody':
                    textToCopy = entry.requestBody;
                    break;
                case 'responseHeaders':
                    textToCopy = formatHeaders(entry.responseHeaders);
                    break;
                case 'responseBody':
                    textToCopy = entry.responseBody;
                    break;
            }
            navigator.clipboard.writeText(textToCopy).then(() => {
                log(`${content} copied to clipboard`, 'info');
            });
        });
    });
    
    networkDetails.querySelector('.back-button').addEventListener('click', () => {
        networkDetails.classList.add('hidden');
        networkContainer.classList.remove('hidden');
    });
    networkDetails.classList.remove('hidden');
    networkContainer.classList.add('hidden');
};
 
const formatHeaders = (headers) => {
    return Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join('\\n');
};

const clearNetworkLog = () => {
    networkLog = [];
    updateNetworkDisplay();
    networkDetails.classList.add('hidden');
    networkContainer.classList.remove('hidden');
};

document.getElementById('clearNetwork').addEventListener('click', clearNetworkLog);

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
                    requestBody = JSON.stringify(request.body);
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
            url: args[0],
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
            url: args[0],
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
    this._networkInfo.requestHeaders[header] = value;
    originalXHRSetRequestHeader.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
    this._networkInfo.body = body;
    this.addEventListener('load', () => {
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
                    requestBody = JSON.stringify(this._networkInfo.body);
                } catch (e) {
                    requestBody = '[Unable to stringify request body]';
                }
            }
        }
        addNetworkEntry({
            url: this._networkInfo.url,
            method: this._networkInfo.method,
            status: this.status,
            type: 'xhr',
            time: time.toFixed(2),
            requestHeaders: this._networkInfo.requestHeaders,
            requestBody: requestBody,
            responseHeaders: parseResponseHeaders(this.getAllResponseHeaders()),
            responseBody: this.responseText
        });
    });
    originalXHRSend.apply(this, arguments);
};

const parseResponseHeaders = (headerStr) => {
    const headers = {};
    if (!headerStr) {
        return headers;
    }
    const headerPairs = headerStr.trim().split('\\u000d\\u000a');
    for (let i = 0; i < headerPairs.length; i++) {
        const headerPair = headerPairs[i];
        const index = headerPair.indexOf('\\u003a\\u0020');
        if (index > 0) {
            const key = headerPair.substring(0, index);
            const val = headerPair.substring(index + 2);
            headers[key] = val;
        }
    }
    return headers;
};
 
 // Info functionality
 document.getElementById("clearCookies").addEventListener("click", () => {
  document.cookie.split(";").forEach((cookie) => {
   document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });
  log("Cookies cleared", "info");
 });

 document.getElementById("clearStorage").addEventListener("click", () => {
  localStorage.clear();
  sessionStorage.clear();
  log("Local and Session storage cleared", "info");
 });

 document.getElementById("reloadPage").addEventListener("click", () => {
  window.location.reload();
 });

 // About Info
const aboutInfo = document.getElementById("aboutInfo");
aboutInfo.innerHTML = `
    <h4>About</h4>
    <p>Created by: Saksham Shekher</p>
    <p>GitHub: <a href="https://github.com/OshekharO" target="_blank">https://github.com/OshekharO</a></p>
`;

 // Device Info
 const deviceInfo = document.getElementById("deviceInfo");
 deviceInfo.innerHTML = `
        <h4>Device Info</h4>
        <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
        <p><strong>Platform:</strong> ${navigator.platform}</p>
        <p><strong>Screen Size:</strong> ${window.screen.width}x${window.screen.height}</p>
        <p><strong>Viewport Size:</strong> ${window.innerWidth}x${window.innerHeight}</p>
        <p><strong>Device Pixel Ratio:</strong> ${window.devicePixelRatio}</p>
        <p><strong>Browser Language:</strong> ${navigator.language}</p>
    `;

 // Close button functionality
 document.getElementById("consoleExit").addEventListener("click", () => {
    document.getElementById("dev-console").remove();
});

 // Override console methods
 const originalConsole = { ...console };
 ["log", "error", "warn", "info"].forEach((method) => {
  console[method] = (...args) => {
    log(args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" "), method);
    originalConsole[method](...args);
  };
 });

const consoleContainer = document.getElementById('dev-console');
const minimizeButton = document.getElementById('consoleMinimize');

let isMinimized = false;

function toggleConsole() {
    isMinimized = !isMinimized;
    consoleContainer.classList.toggle('minimized', isMinimized);
    minimizeButton.textContent = isMinimized ? '+' : '−';
}

minimizeButton.addEventListener('click', toggleConsole);
 
 log("Mobile Dev Console initialized", "info");
})();
