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
                    <button id="inspectorToggle">Toggle Inspector</button>
                </div>
                <div id="elements-container" class="elements-container"></div>
            </div>
            <div id="sectionNetwork" class="dev-console-section hidden">
                <div class="network-controls">
                    <button id="clearNetwork">Clear</button>
                    <input type="text" id="networkFilter" placeholder="Filter requests...">
                    <select id="networkTypeFilter">
                        <option value="all">All Types</option>
                        <option value="fetch">Fetch</option>
                        <option value="xhr">XHR</option>
                    </select>
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
        transition: height 0.3s ease;
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
      .highlight {
        background-color: yellow;
        outline: 2px solid red;
      }
      .object-preview {
        cursor: pointer;
        color: #2196f3;
      }
      .object-expanded {
        margin-left: 20px;
      }
      .syntax-string { color: #a31515; }
      .syntax-number { color: #098658; }
      .syntax-boolean { color: #0000ff; }
      .syntax-null { color: #0000ff; }
      .syntax-key { color: #2196f3; }
      #networkFilter, #networkTypeFilter {
        padding: 5px;
        margin-right: 10px;
        border-radius: 4px;
        border: 1px solid ${theme === 'light' ? '#ccc' : '#3d3d3d'};
      }
      @media (max-width: 768px) {
        .dev-console-container {
          font-size: 14px;
        }
        .dev-console-nav-button {
          padding: 8px 10px;
          font-size: 12px;
        }
        #consoleInput {
          font-size: 14px;
        }
      }
      .inspector-active {
        outline: 2px solid red !important;
      }
      #elements-container {
        height: 100%;
        overflow: auto;
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

 // Load Luna DOM Viewer
 const lunaStylesheet = document.createElement('link');
 lunaStylesheet.rel = 'stylesheet';
 lunaStylesheet.href = '//cdn.jsdelivr.net/npm/luna-dom-viewer/luna-dom-viewer.css';
 document.head.appendChild(lunaStylesheet);

 const lunaScript = document.createElement('script');
 lunaScript.src = '//cdn.jsdelivr.net/npm/luna-dom-viewer/luna-dom-viewer.js';
 document.head.appendChild(lunaScript);

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
  line.innerHTML = `<span style="color: ${theme === 'light' ? '#888' : '#aaa'};">[${timestamp}]</span> <span style="color: ${color};">[${type}]</span> <span style="color: ${theme === 'light' ? '#000' : '#fff'};">${prettyPrint(message)}</span>`;
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

 // Element Inspector functionality
let isInspectorActive = false;
const elementsContainer = document.querySelector('.elements-container');
let domViewer;

document.getElementById('elementViewer').addEventListener('click', () => {
    const devConsole = document.getElementById('dev-console');
    devConsole.style.display = 'none';
    const html = document.documentElement.outerHTML;
    devConsole.style.display = '';
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.getElementById('dev-console').remove();
    
    if (!domViewer) {
        domViewer = new LunaDomViewer(elementsContainer);
    }
    domViewer.set(doc.documentElement);
    domViewer.expand();
    
    log('Page HTML loaded in the Elements tab.', 'info');
});

document.getElementById('inspectorToggle').addEventListener('click', () => {
    isInspectorActive = !isInspectorActive;
    document.body.style.cursor = isInspectorActive ? 'crosshair' : '';
    log(isInspectorActive ? 'Inspector activated. Click on an element to inspect.' : 'Inspector deactivated.', 'info');
    
    if (isInspectorActive) {
        document.addEventListener('mouseover', highlightElement);
        document.addEventListener('click', inspectElement, true);
    } else {
        document.removeEventListener('mouseover', highlightElement);
        document.removeEventListener('click', inspectElement, true);
        removeHighlight();
    }
});

function highlightElement(e) {
    if (isInspectorActive) {
        removeHighlight();
        e.target.classList.add('inspector-active');
    }
}

function removeHighlight() {
    const highlighted = document.querySelector('.inspector-active');
    if (highlighted) {
        highlighted.classList.remove('inspector-active');
    }
}

function inspectElement(e) {
    if (isInspectorActive) {
        e.preventDefault();
        e.stopPropagation();
        const element = e.target;
        
        if (!domViewer) {
            domViewer = new LunaDomViewer(elementsContainer);
        }
        domViewer.set(element);
        domViewer.expand();
        
        log('Element inspected and loaded in the Elements tab.', 'info');
        
        // Deactivate inspector after inspection
        isInspectorActive = false;
        document.body.style.cursor = '';
        document.removeEventListener('mouseover', highlightElement);
        document.removeEventListener('click', inspectElement, true);
        removeHighlight();
    }
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
    const filter = document.getElementById('networkFilter').value.toLowerCase();
    const typeFilter = document.getElementById('networkTypeFilter').value;
    
    networkContainer.innerHTML = '';
    networkLog.filter(entry => {
        return (entry.url.toLowerCase().includes(filter) || entry.type.toLowerCase().includes(filter))
            && (typeFilter === 'all' || entry.type === typeFilter);
    }).forEach((entry, index) => {
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
        <pre>
URL: ${entry.url}
Method: ${entry.method}
Status: ${entry.status}
Type: ${entry.type}
Time: ${entry.time}ms

Request Headers:
${formatHeaders(entry.requestHeaders)}

Request Body:
${syntaxHighlight(entry.requestBody)}

Response Headers:
${formatHeaders(entry.responseHeaders)}

Response Body:
${syntaxHighlight(entry.responseBody)}
        </pre>
    `;
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
document.getElementById('networkFilter').addEventListener('input', updateNetworkDisplay);
document.getElementById('networkTypeFilter').addEventListener('change', updateNetworkDisplay);

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

// Pretty-print for Objects
function prettyPrint(obj) {
    if (typeof obj === 'object' && obj !== null) {
        return `<span class="object-preview" onclick="this.nextElementSibling.classList.toggle('hidden'); this.textContent = this.textContent === '▶' ? '▼' : '▶';">▶</span> <span class="object-expanded hidden">${JSON.stringify(obj, null, 2)}</span>`;
    }
    return syntaxHighlight(JSON.stringify(obj));
}

// Syntax Highlighting
function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>');
    return json.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, function (match) {
        var cls = 'syntax-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'syntax-key';
            } else {
                cls = 'syntax-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'syntax-boolean';
        } else if (/null/.test(match)) {
            cls = 'syntax-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// Performance Optimizations
const debounce = (func, delay) => {
    let inDebounce;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(context, args), delay);
    }
};

const debouncedUpdateNetworkDisplay = debounce(updateNetworkDisplay, 300);

// Use a virtual DOM for large network logs
class VirtualScroller {
    constructor(container, items, rowHeight) {
        this.container = container;
        this.items = items;
        this.rowHeight = rowHeight;
        this.visibleItems = Math.ceil(container.clientHeight / rowHeight);
        this.scrollTop = 0;
        this.startIndex = 0;
        this.endIndex = this.visibleItems;

        this.container.style.height = `${items.length * rowHeight}px`;
        this.container.style.overflowY = 'auto';
        this.container.addEventListener('scroll', this.onScroll.bind(this));

        this.render();
    }

    onScroll() {
        const newScrollTop = this.container.scrollTop;
        const delta = newScrollTop - this.scrollTop;
        this.scrollTop = newScrollTop;

        if (Math.abs(delta) > this.visibleItems * this.rowHeight) {
            this.startIndex = Math.floor(this.scrollTop / this.rowHeight);
        } else {
            this.startIndex += Math.floor(delta / this.rowHeight);
        }

        this.startIndex = Math.max(0, Math.min(this.startIndex, this.items.length - this.visibleItems));
        this.endIndex = Math.min(this.startIndex + this.visibleItems, this.items.length);

        this.render();
    }

    render() {
        const fragment = document.createDocumentFragment();
        for (let i = this.startIndex; i < this.endIndex; i++) {
            const item = this.items[i];
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.top = `${i * this.rowHeight}px`;
            div.style.height = `${this.rowHeight}px`;
            div.innerHTML = item;
            fragment.appendChild(div);
        }

        this.container.innerHTML = '';
        this.container.appendChild(fragment);
    }
}

// Initialize the console
log("Mobile Dev Console initialized", "info");
})();
