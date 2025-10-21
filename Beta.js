(() => {
    // Check if the system is in dark mode
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    let theme = isDarkMode() ? 'dark' : 'light';

    // HTML template for the dev console with Tailwind CSS
    const consoleHTML = `
        <div id="dev-console" class="fixed bottom-0 left-0 w-full h-1/2 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out">
            <!-- Header -->
            <div class="flex justify-between items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-2">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Developer Console</span>
                    <div class="flex items-center space-x-1 text-xs">
                        <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">Mobile</span>
                        <span id="console-status" class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">Active</span>
                    </div>
                </div>
                <div class="flex space-x-1">
                    <button id="consoleMinimize" class="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button id="consoleExit" class="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white rounded transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- Navigation Tabs -->
            <div class="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 nav-buttons-container">
                <button id="navConsole" class="nav-button flex-1 py-2 px-4 text-sm font-medium text-center border-b-2 border-blue-500 text-blue-600 dark:text-blue-400">Console</button>
                <button id="navElements" class="nav-button flex-1 py-2 px-4 text-sm font-medium text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Elements</button>
                <button id="navNetwork" class="nav-button flex-1 py-2 px-4 text-sm font-medium text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Network</button>
                <button id="navInfo" class="nav-button flex-1 py-2 px-4 text-sm font-medium text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Info</button>
            </div>
            
            <!-- Console Content -->
            <div class="flex-1 overflow-hidden flex flex-col">
                <!-- Console Section -->
                <div id="sectionConsole" class="h-full flex flex-col">
                    <div class="console-output flex-1 overflow-y-auto p-3 font-mono text-sm bg-white dark:bg-gray-900"></div>
                    <div class="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <div class="flex space-x-2 mb-2">
                            <button id="clearConsole" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm transition-colors">Clear</button>
                            <button id="consoleSettings" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm transition-colors">Settings</button>
                        </div>
                        <div class="flex">
                            <textarea id="consoleInput" placeholder="Enter JavaScript code..." class="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                            <button id="executeCode" class="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r transition-colors">Run</button>
                        </div>
                    </div>
                </div>
                
                <!-- Elements Section -->
                <div id="sectionElements" class="h-full flex flex-col hidden">
                    <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div class="flex space-x-2">
                            <button id="elementViewer" class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors">View HTML</button>
                            <button id="refreshElements" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm transition-colors">Refresh</button>
                            <button id="copyHTML" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm transition-colors">Copy HTML</button>
                        </div>
                    </div>
                    <div class="elements-container flex-1 overflow-auto p-3 bg-white dark:bg-gray-900 font-mono text-xs"></div>
                </div>
                
                <!-- Network Section -->
                <div id="sectionNetwork" class="h-full flex flex-col hidden">
                    <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div class="flex space-x-2">
                            <button id="clearNetwork" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm transition-colors">Clear</button>
                            <button id="toggleRecording" class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors">Pause</button>
                        </div>
                    </div>
                    <div class="network-container flex-1 overflow-auto p-3 bg-white dark:bg-gray-900"></div>
                    <div id="networkDetails" class="network-details hidden flex-1 overflow-auto p-3 bg-white dark:bg-gray-900"></div>
                </div>
                
                <!-- Info Section -->
                <div id="sectionInfo" class="h-full flex flex-col hidden">
                    <div class="flex-1 overflow-auto p-3 bg-white dark:bg-gray-900">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div id="deviceInfo" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"></div>
                            <div id="aboutInfo" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"></div>
                        </div>
                        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            <button id="clearCookies" class="p-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors">Clear Cookies</button>
                            <button id="clearStorage" class="p-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors">Clear Storage</button>
                            <button id="clearAll" class="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors">Clear All Data</button>
                            <button id="reloadPage" class="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors">Reload Page</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Custom CSS for additional styling
    const customStyles = `
        .console-output::-webkit-scrollbar {
            width: 6px;
        }
        .console-output::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .console-output::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
        }
        .dark .console-output::-webkit-scrollbar-track {
            background: #2d3748;
        }
        .dark .console-output::-webkit-scrollbar-thumb {
            background: #4a5568;
        }
        
        .network-container::-webkit-scrollbar,
        .elements-container::-webkit-scrollbar {
            width: 6px;
        }
        .network-container::-webkit-scrollbar-track,
        .elements-container::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .network-container::-webkit-scrollbar-thumb,
        .elements-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
        }
        .dark .network-container::-webkit-scrollbar-track,
        .dark .elements-container::-webkit-scrollbar-track {
            background: #2d3748;
        }
        .dark .network-container::-webkit-scrollbar-thumb,
        .dark .elements-container::-webkit-scrollbar-thumb {
            background: #4a5568;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .console-entry {
            animation: fadeIn 0.2s ease-out;
        }
        
        @media (max-width: 640px) {
            .dev-console-container {
                height: 60% !important;
            }
            .dev-console-container.minimized {
                height: 40px !important;
            }
            .nav-buttons-container {
                flex-wrap: wrap;
            }
            .nav-button {
                flex: 1 0 33%;
                font-size: 12px;
                padding: 8px 4px;
            }
        }
    `;

    // Inject HTML into the document
    const injectElement = (html) => {
        const div = document.createElement("div");
        div.innerHTML = html.trim();
        return div.firstChild;
    };

    // Add Font Awesome for icons
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fontAwesome);

    // Add Tailwind CSS
    const tailwind = document.createElement('script');
    tailwind.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(tailwind);

    // Add custom styles
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);

    document.body.appendChild(injectElement(consoleHTML));

    // Console functionality
    const consoleOutput = document.querySelector(".console-output");
    const consoleInput = document.getElementById("consoleInput");
    const executeButton = document.getElementById("executeCode");

    // Improved log function with better formatting
    const log = (message, type = "log") => {
        const line = document.createElement("div");
        line.className = `console-entry py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        // Determine color based on log type
        let typeColor, textColor;
        switch (type) {
            case "error":
                typeColor = "text-red-500";
                textColor = "text-red-700 dark:text-red-300";
                break;
            case "warn":
                typeColor = "text-yellow-500";
                textColor = "text-yellow-700 dark:text-yellow-300";
                break;
            case "info":
                typeColor = "text-blue-500";
                textColor = "text-blue-700 dark:text-blue-300";
                break;
            case "input":
                typeColor = "text-purple-500";
                textColor = "text-purple-700 dark:text-purple-300";
                break;
            default:
                typeColor = "text-gray-500";
                textColor = "text-gray-700 dark:text-gray-300";
        }
        
        line.innerHTML = `
            <div class="flex items-start">
                <span class="text-xs text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">[${timestamp}]</span>
                <span class="${typeColor} text-xs font-medium w-16 flex-shrink-0">${type.toUpperCase()}</span>
                <span class="${textColor} flex-1 break-words">${message}</span>
            </div>
        `;
        
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };

    // Clear console function
    const clearConsole = () => {
        consoleOutput.innerHTML = "";
        log("Console cleared", "info");
    };

    document.getElementById("clearConsole").addEventListener("click", clearConsole);

    // Execute JavaScript code
    const executeCode = () => {
        const code = consoleInput.value.trim();
        if (!code) return;
        
        log(`> ${code}`, "input");
        try {
            const result = eval(code);
            if (result !== undefined) {
                log(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
            }
        } catch (error) {
            log(`Error: ${error.message}`, "error");
        }
        consoleInput.value = "";
        consoleInput.focus();
    };

    consoleInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            executeCode();
        }
    });

    executeButton.addEventListener("click", executeCode);

    // FIXED: Navigation functionality
    const navButtons = document.querySelectorAll(".nav-button");
    const sections = document.querySelectorAll("[id^='section']");

    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.id.replace("nav", "section");
            
            // Update active states
            navButtons.forEach((btn) => {
                btn.classList.remove("border-blue-500", "text-blue-600", "dark:text-blue-400");
                btn.classList.add("border-transparent", "text-gray-500", "dark:text-gray-400");
            });
            
            button.classList.remove("border-transparent", "text-gray-500", "dark:text-gray-400");
            button.classList.add("border-blue-500", "text-blue-600", "dark:text-blue-400");
            
            // Show/hide sections - FIXED: Properly hide all sections first
            sections.forEach((section) => {
                section.classList.add("hidden");
            });
            
            // Show the target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove("hidden");
            }
        });
    });

    // Element Viewer functionality
    document.getElementById('elementViewer').addEventListener('click', () => {
        const elementsContainer = document.querySelector('.elements-container');
        const devConsole = document.getElementById('dev-console');
        
        // Temporarily hide console to get clean HTML
        devConsole.style.display = 'none';
        const html = document.documentElement.outerHTML;
        devConsole.style.display = '';
        
        // Remove the dev-console HTML from the output
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const consoleElement = doc.getElementById('dev-console');
        if (consoleElement) consoleElement.remove();
        
        // Format and display the HTML
        const cleanHtml = doc.documentElement.outerHTML;
        elementsContainer.textContent = formatHTML(cleanHtml);
        log('Page HTML loaded in the Elements tab.', 'info');
    });

    // Format HTML for better readability
    const formatHTML = (html) => {
        let formatted = '';
        let indent = 0;
        const tokens = html.split(/(<[^>]*>)/);
        
        tokens.forEach(token => {
            if (token.startsWith('</')) {
                indent--;
            }
            
            if (token.trim()) {
                formatted += '  '.repeat(Math.max(0, indent)) + token + '\n';
            }
            
            if (token.startsWith('<') && !token.startsWith('</') && !token.endsWith('/>') && !token.includes('</')) {
                indent++;
            }
        });
        
        return formatted;
    };

    // Copy HTML to clipboard
    document.getElementById('copyHTML').addEventListener('click', () => {
        const elementsContainer = document.querySelector('.elements-container');
        const htmlContent = elementsContainer.textContent;
        
        if (!htmlContent) {
            log('No HTML content to copy. Please load HTML first.', 'warn');
            return;
        }
        
        navigator.clipboard.writeText(htmlContent).then(() => {
            log('HTML copied to clipboard', 'info');
        }).catch(err => {
            log(`Failed to copy HTML: ${err}`, 'error');
        });
    });

    // Refresh elements
    document.getElementById('refreshElements').addEventListener('click', () => {
        document.getElementById('elementViewer').click();
    });

    // Network monitoring functionality
    const networkContainer = document.querySelector('.network-container');
    const networkDetails = document.getElementById('networkDetails');
    let networkLog = [];
    let isRecording = true;

    const addNetworkEntry = (entry) => {
        if (!isRecording) return;
        
        networkLog.push(entry);
        updateNetworkDisplay();
    };

    const updateNetworkDisplay = () => {
        networkContainer.innerHTML = '';
        
        if (networkLog.length === 0) {
            networkContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <i class="fas fa-network-wired text-4xl mb-2"></i>
                    <p>No network requests recorded</p>
                    <p class="text-sm">Network requests will appear here as they happen</p>
                </div>
            `;
            return;
        }
        
        networkLog.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = `network-item p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors`;
            
            // Determine status color
            let statusColor = 'text-gray-500';
            if (entry.status >= 200 && entry.status < 300) statusColor = 'text-green-500';
            else if (entry.status >= 300 && entry.status < 400) statusColor = 'text-yellow-500';
            else if (entry.status >= 400) statusColor = 'text-red-500';
            else if (entry.status === 'Error') statusColor = 'text-red-500';
            
            item.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm truncate ${statusColor}">${entry.method} ${entry.status}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 truncate">${entry.url}</div>
                    </div>
                    <div class="flex items-center space-x-2 ml-2 flex-shrink-0">
                        <span class="text-xs text-gray-500 dark:text-gray-400">${entry.time}ms</span>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => showNetworkDetails(index));
            networkContainer.appendChild(item);
        });
    };

    const showNetworkDetails = (index) => {
        const entry = networkLog[index];
        
        // Determine status color
        let statusColor = 'text-gray-500';
        if (entry.status >= 200 && entry.status < 300) statusColor = 'text-green-500';
        else if (entry.status >= 300 && entry.status < 400) statusColor = 'text-yellow-500';
        else if (entry.status >= 400) statusColor = 'text-red-500';
        else if (entry.status === 'Error') statusColor = 'text-red-500';
        
        networkDetails.innerHTML = `
            <div class="border-b border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                <button id="backToNetwork" class="flex items-center text-blue-500 hover:text-blue-600 transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i> Back to Network List
                </button>
            </div>
            <div class="p-4 overflow-auto">
                <h3 class="text-lg font-medium mb-4">Request Details</h3>
                
                <div class="mb-6">
                    <h4 class="font-medium mb-2">General</h4>
                    <div class="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div><span class="font-medium">URL:</span> <span class="break-all">${entry.url}</span></div>
                            <div><span class="font-medium">Method:</span> ${entry.method}</div>
                            <div><span class="font-medium">Status:</span> <span class="${statusColor}">${entry.status}</span></div>
                            <div><span class="font-medium">Type:</span> ${entry.type}</div>
                            <div><span class="font-medium">Time:</span> ${entry.time}ms</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="font-medium mb-2">Request Headers</h4>
                    <pre class="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs overflow-auto max-h-40">${formatHeaders(entry.requestHeaders)}</pre>
                </div>
                
                <div class="mb-6">
                    <h4 class="font-medium mb-2">Request Body</h4>
                    <pre class="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs overflow-auto max-h-40">${entry.requestBody}</pre>
                </div>
                
                <div class="mb-6">
                    <h4 class="font-medium mb-2">Response Headers</h4>
                    <pre class="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs overflow-auto max-h-40">${formatHeaders(entry.responseHeaders)}</pre>
                </div>
                
                <div class="mb-6">
                    <h4 class="font-medium mb-2">Response Body</h4>
                    <pre class="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs overflow-auto max-h-60">${entry.responseBody}</pre>
                </div>
            </div>
        `;
        
        networkDetails.querySelector('#backToNetwork').addEventListener('click', () => {
            networkDetails.classList.add('hidden');
            networkContainer.classList.remove('hidden');
        });
        
        networkDetails.classList.remove('hidden');
        networkContainer.classList.add('hidden');
    };
    
    const formatHeaders = (headers) => {
        if (!headers || Object.keys(headers).length === 0) {
            return 'No headers';
        }
        return Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join('\n');
    };

    const clearNetworkLog = () => {
        networkLog = [];
        updateNetworkDisplay();
        networkDetails.classList.add('hidden');
        networkContainer.classList.remove('hidden');
        log("Network log cleared", "info");
    };

    document.getElementById('clearNetwork').addEventListener('click', clearNetworkLog);

    // Toggle network recording
    document.getElementById('toggleRecording').addEventListener('click', function() {
        isRecording = !isRecording;
        this.textContent = isRecording ? 'Pause' : 'Resume';
        this.classList.toggle('bg-green-500', isRecording);
        this.classList.toggle('bg-yellow-500', !isRecording);
        this.classList.toggle('hover:bg-green-600', isRecording);
        this.classList.toggle('hover:bg-yellow-600', !isRecording);
        
        log(`Network recording ${isRecording ? 'resumed' : 'paused'}`, "info");
    });

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
                        requestBody = JSON.stringify(request.body, null, 2);
                    } catch (e) {
                        requestBody = '[Unable to stringify request body]';
                    }
                }
            }

            const response = await originalFetch(...args);
            const time = performance.now() - start;
            const clone = response.clone();
            let responseBody = await clone.text();
            
            // Try to format JSON responses for better readability
            try {
                const jsonResponse = JSON.parse(responseBody);
                responseBody = JSON.stringify(jsonResponse, null, 2);
            } catch (e) {
                // Not JSON, keep as is
            }
            
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
            const time = performance.now() - start;
            addNetworkEntry({
                url: args[0],
                method: args[1]?.method || 'GET',
                status: 'Error',
                type: 'fetch',
                time: time.toFixed(2),
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
                        requestBody = JSON.stringify(this._networkInfo.body, null, 2);
                    } catch (e) {
                        requestBody = '[Unable to stringify request body]';
                    }
                }
            }
            
            let responseBody = this.responseText;
            // Try to format JSON responses for better readability
            try {
                const jsonResponse = JSON.parse(responseBody);
                responseBody = JSON.stringify(jsonResponse, null, 2);
            } catch (e) {
                // Not JSON, keep as is
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
                responseBody: responseBody
            });
        });
        
        // Also capture errors
        this.addEventListener('error', () => {
            const time = performance.now() - this._networkInfo.start;
            addNetworkEntry({
                url: this._networkInfo.url,
                method: this._networkInfo.method,
                status: 'Error',
                type: 'xhr',
                time: time.toFixed(2),
                requestHeaders: this._networkInfo.requestHeaders,
                requestBody: 'No request body',
                responseHeaders: {},
                responseBody: 'Network request failed'
            });
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

    document.getElementById("clearAll").addEventListener("click", () => {
        // Clear cookies
        document.cookie.split(";").forEach((cookie) => {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear console
        clearConsole();
        
        // Clear network
        clearNetworkLog();
        
        log("All data cleared", "info");
    });

    document.getElementById("reloadPage").addEventListener("click", () => {
        window.location.reload();
    });

    // About Info
    const aboutInfo = document.getElementById("aboutInfo");
    aboutInfo.innerHTML = `
        <h4 class="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">About</h4>
        <div class="space-y-2 text-sm">
            <p><span class="font-medium">Created by:</span> Saksham Shekher</p>
            <p><span class="font-medium">GitHub:</span> <a href="https://github.com/OshekharO" target="_blank" class="text-blue-500 hover:text-blue-600 transition-colors">https://github.com/OshekharO</a></p>
            <p><span class="font-medium">Version:</span> 2.0.0</p>
            <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">Mobile Developer Console with enhanced UI and features</p>
        </div>
    `;

    // Device Info
    const deviceInfo = document.getElementById("deviceInfo");
    deviceInfo.innerHTML = `
        <h4 class="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">Device Info</h4>
        <div class="space-y-2 text-sm">
            <p><span class="font-medium">User Agent:</span> <span class="text-xs break-all">${navigator.userAgent}</span></p>
            <p><span class="font-medium">Platform:</span> ${navigator.platform}</p>
            <p><span class="font-medium">Screen Size:</span> ${window.screen.width}x${window.screen.height}</p>
            <p><span class="font-medium">Viewport Size:</span> ${window.innerWidth}x${window.innerHeight}</p>
            <p><span class="font-medium">Device Pixel Ratio:</span> ${window.devicePixelRatio}</p>
            <p><span class="font-medium">Browser Language:</span> ${navigator.language}</p>
            <p><span class="font-medium">Online Status:</span> <span class="${navigator.onLine ? 'text-green-500' : 'text-red-500'}">${navigator.onLine ? 'Online' : 'Offline'}</span></p>
        </div>
    `;

    // Close button functionality
    document.getElementById("consoleExit").addEventListener("click", () => {
        document.getElementById("dev-console").remove();
        log("Console closed", "info");
    });

    // Override console methods
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    };

    ["log", "error", "warn", "info", "debug"].forEach((method) => {
        console[method] = (...args) => {
            const message = args.map((arg) => {
                if (typeof arg === "object" && arg !== null) {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(" ");
            
            log(message, method);
            originalConsole[method].apply(console, args);
        };
    });

    // Minimize functionality
    const consoleContainer = document.getElementById('dev-console');
    const minimizeButton = document.getElementById('consoleMinimize');
    let isMinimized = false;

    function toggleConsole() {
        isMinimized = !isMinimized;
        
        if (isMinimized) {
            consoleContainer.classList.add('minimized');
            consoleContainer.style.height = '40px';
            minimizeButton.innerHTML = '<i class="fas fa-plus"></i>';
            document.getElementById('console-status').textContent = 'Minimized';
            document.getElementById('console-status').classList.remove('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
            document.getElementById('console-status').classList.add('bg-yellow-100', 'dark:bg-yellow-900', 'text-yellow-800', 'dark:text-yellow-200');
        } else {
            consoleContainer.classList.remove('minimized');
            consoleContainer.style.height = '50%';
            minimizeButton.innerHTML = '<i class="fas fa-minus"></i>';
            document.getElementById('console-status').textContent = 'Active';
            document.getElementById('console-status').classList.remove('bg-yellow-100', 'dark:bg-yellow-900', 'text-yellow-800', 'dark:text-yellow-200');
            document.getElementById('console-status').classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
        }
    }

    minimizeButton.addEventListener('click', toggleConsole);
    
    // Settings functionality
    document.getElementById('consoleSettings').addEventListener('click', () => {
        log('Settings feature coming soon!', 'info');
    });
    
    // Initialize network display
    updateNetworkDisplay();
    
    log("Mobile Developer Console initialized successfully", "info");
    log("Try executing some JavaScript in the console below", "info");
})();
