(() => {
    // Check if the system is in dark mode
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    let theme = isDarkMode() ? 'dark' : 'light';

    // HTML template for the dev console with inline Tailwind-like styles
    const consoleHTML = `
        <div id="dev-console" class="mobile-console">
            <!-- Header -->
            <div class="console-header">
                <div class="header-left">
                    <span class="console-title">Developer Console</span>
                    <div class="status-badges">
                        <span class="badge badge-mobile">Mobile</span>
                        <span id="console-status" class="badge badge-active">Active</span>
                    </div>
                </div>
                <div class="header-controls">
                    <button id="consoleMinimize" class="control-btn">
                        <span class="minimize-icon">−</span>
                    </button>
                    <button id="consoleExit" class="control-btn exit-btn">
                        <span class="exit-icon">×</span>
                    </button>
                </div>
            </div>
            
            <!-- Navigation Tabs -->
            <div class="nav-tabs">
                <button id="navConsole" class="nav-tab active">Console</button>
                <button id="navElements" class="nav-tab">Elements</button>
                <button id="navNetwork" class="nav-tab">Network</button>
                <button id="navInfo" class="nav-tab">Info</button>
            </div>
            
            <!-- Console Content -->
            <div class="console-content">
                <!-- Console Section -->
                <div id="sectionConsole" class="console-section active">
                    <div class="console-output" id="consoleOutput"></div>
                    <div class="console-input-area">
                        <div class="console-controls">
                            <button id="clearConsole" class="console-btn">Clear</button>
                            <button id="consoleSettings" class="console-btn">Settings</button>
                        </div>
                        <div class="input-wrapper">
                            <textarea id="consoleInput" placeholder="Enter JavaScript code..." class="console-input"></textarea>
                            <button id="executeCode" class="execute-btn">Run</button>
                        </div>
                    </div>
                </div>
                
                <!-- Elements Section -->
                <div id="sectionElements" class="console-section">
                    <div class="section-controls">
                        <button id="elementViewer" class="action-btn primary">View HTML</button>
                        <button id="refreshElements" class="action-btn secondary">Refresh</button>
                        <button id="copyHTML" class="action-btn secondary">Copy HTML</button>
                    </div>
                    <div class="elements-container scrollable-content" id="elementsContainer"></div>
                </div>
                
                <!-- Network Section -->
                <div id="sectionNetwork" class="console-section">
                    <div class="section-controls">
                        <button id="clearNetwork" class="action-btn secondary">Clear</button>
                        <button id="toggleRecording" class="action-btn primary">Pause</button>
                    </div>
                    <div class="network-container scrollable-content" id="networkContainer"></div>
                    <div id="networkDetails" class="network-details scrollable-content"></div>
                </div>
                
                <!-- Info Section -->
                <div id="sectionInfo" class="console-section">
                    <div class="info-content scrollable-content">
                        <div class="info-grid">
                            <div id="deviceInfo" class="info-card"></div>
                            <div id="aboutInfo" class="info-card"></div>
                        </div>
                        <div class="action-grid">
                            <button id="clearCookies" class="action-btn danger">Clear Cookies</button>
                            <button id="clearStorage" class="action-btn danger">Clear Storage</button>
                            <button id="clearAll" class="action-btn danger">Clear All Data</button>
                            <button id="reloadPage" class="action-btn primary">Reload Page</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Complete CSS with Tailwind-like styling
    const consoleStyles = `
        .mobile-console {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50%;
            background: ${theme === 'light' ? '#ffffff' : '#111827'};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
            color: ${theme === 'light' ? '#374151' : '#f9fafb'};
            border-top: 1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'};
        }

        .console-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: ${theme === 'light' ? '#f9fafb' : '#1f2937'};
            border-bottom: 1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'};
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .console-title {
            font-size: 14px;
            font-weight: 600;
            color: ${theme === 'light' ? '#374151' : '#f9fafb'};
        }

        .status-badges {
            display: flex;
            gap: 6px;
        }

        .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }

        .badge-mobile {
            background: ${theme === 'light' ? '#dbeafe' : '#1e3a8a'};
            color: ${theme === 'light' ? '#1e40af' : '#dbeafe'};
        }

        .badge-active {
            background: ${theme === 'light' ? '#dcfce7' : '#14532d'};
            color: ${theme === 'light' ? '#166534' : '#dcfce7'};
        }

        .badge-minimized {
            background: ${theme === 'light' ? '#fef3c7' : '#713f12'};
            color: ${theme === 'light' ? '#92400e' : '#fef3c7'};
        }

        .header-controls {
            display: flex;
            gap: 4px;
        }

        .control-btn {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: ${theme === 'light' ? '#6b7280' : '#9ca3af'};
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        }

        .control-btn:hover {
            background: ${theme === 'light' ? '#e5e7eb' : '#374151'};
        }

        .exit-btn:hover {
            background: #ef4444;
            color: white;
        }

        .nav-tabs {
            display: flex;
            background: ${theme === 'light' ? '#f3f4f6' : '#1f2937'};
            border-bottom: 1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'};
        }

        .nav-tab {
            flex: 1;
            padding: 12px 8px;
            border: none;
            background: transparent;
            color: ${theme === 'light' ? '#6b7280' : '#9ca3af'};
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .nav-tab.active {
            color: ${theme === 'light' ? '#2563eb' : '#3b82f6'};
            border-bottom-color: ${theme === 'light' ? '#2563eb' : '#3b82f6'};
        }

        .nav-tab:hover:not(.active) {
            color: ${theme === 'light' ? '#374151' : '#f3f4f6'};
        }

        .console-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .console-section {
            flex: 1;
            display: none;
            flex-direction: column;
            overflow: hidden;
        }

        .console-section.active {
            display: flex;
        }

        .scrollable-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* Scrollbar Styling */
        .scrollable-content::-webkit-scrollbar {
            width: 6px;
        }

        .scrollable-content::-webkit-scrollbar-track {
            background: ${theme === 'light' ? '#f1f5f9' : '#374151'};
        }

        .scrollable-content::-webkit-scrollbar-thumb {
            background: ${theme === 'light' ? '#cbd5e1' : '#4b5563'};
            border-radius: 3px;
        }

        .scrollable-content::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'light' ? '#94a3b8' : '#6b7280'};
        }

        .console-output {
            flex: 1;
            padding: 12px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            line-height: 1.4;
            background: ${theme === 'light' ? '#ffffff' : '#111827'};
            overflow-y: auto;
        }

        .console-entry {
            padding: 4px 0;
            border-bottom: 1px solid ${theme === 'light' ? '#f3f4f6' : '#1f2937'};
            animation: fadeIn 0.2s ease-out;
        }

        .console-entry:last-child {
            border-bottom: none;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .console-input-area {
            border-top: 1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'};
            padding: 12px;
            background: ${theme === 'light' ? '#f9fafb' : '#1f2937'};
        }

        .console-controls {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }

        .console-btn {
            padding: 6px 12px;
            border: 1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'};
            border-radius: 6px;
            background: ${theme === 'light' ? '#ffffff' : '#374151'};
            color: ${theme === 'light' ? '#374151' : '#f9fafb'};
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .console-btn:hover {
            background: ${theme === 'light' ? '#f3f4f6' : '#4b5563'};
        }

        .input-wrapper {
            display: flex;
            gap: 0;
        }

        .console-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'};
            border-right: none;
            border-radius: 6px 0 0 6px;
            background: ${theme === 'light' ? '#ffffff' : '#1f2937'};
            color: ${theme === 'light' ? '#374151' : '#f9fafb'};
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            resize: none;
            outline: none;
        }

        .console-input:focus {
            border-color: ${theme === 'light' ? '#3b82f6' : '#60a5fa'};
        }

        .execute-btn {
            padding: 8px 16px;
            border: 1px solid ${theme === 'light' ? '#3b82f6' : '#3b82f6'};
            border-radius: 0 6px 6px 0;
            background: ${theme === 'light' ? '#3b82f6' : '#3b82f6'};
            color: white;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
        }

        .execute-btn:hover {
            background: ${theme === 'light' ? '#2563eb' : '#2563eb'};
        }

        .section-controls {
            padding: 12px;
            background: ${theme === 'light' ? '#f9fafb' : '#1f2937'};
            border-bottom: 1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'};
            display: flex;
            gap: 8px;
        }

        .action-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
        }

        .action-btn.primary {
            background: ${theme === 'light' ? '#3b82f6' : '#3b82f6'};
            color: white;
        }

        .action-btn.primary:hover {
            background: ${theme === 'light' ? '#2563eb' : '#2563eb'};
        }

        .action-btn.secondary {
            background: ${theme === 'light' ? '#e5e7eb' : '#4b5563'};
            color: ${theme === 'light' ? '#374151' : '#f9fafb'};
        }

        .action-btn.secondary:hover {
            background: ${theme === 'light' ? '#d1d5db' : '#6b7280'};
        }

        .action-btn.danger {
            background: ${theme === 'light' ? '#ef4444' : '#dc2626'};
            color: white;
        }

        .action-btn.danger:hover {
            background: ${theme === 'light' ? '#dc2626' : '#b91c1c'};
        }

        .elements-container {
            padding: 12px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 11px;
            line-height: 1.3;
            white-space: pre-wrap;
            background: ${theme === 'light' ? '#ffffff' : '#111827'};
        }

        .network-container, .network-details {
            padding: 12px;
            background: ${theme === 'light' ? '#ffffff' : '#111827'};
        }

        .network-item {
            padding: 12px;
            margin-bottom: 8px;
            border: 1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'};
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: ${theme === 'light' ? '#f9fafb' : '#1f2937'};
        }

        .network-item:hover {
            background: ${theme === 'light' ? '#f3f4f6' : '#374151'};
        }

        .info-content {
            padding: 12px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }

        @media (min-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        .info-card {
            padding: 16px;
            border: 1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'};
            border-radius: 8px;
            background: ${theme === 'light' ? '#f9fafb' : '#1f2937'};
        }

        .info-card h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: ${theme === 'light' ? '#374151' : '#f9fafb'};
        }

        .info-card p {
            margin: 6px 0;
            font-size: 12px;
            color: ${theme === 'light' ? '#6b7280' : '#d1d5db'};
        }

        .action-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
        }

        @media (min-width: 640px) {
            .action-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        @media (min-width: 1024px) {
            .action-grid {
                grid-template-columns: 1fr 1fr 1fr 1fr;
            }
        }

        .mobile-console.minimized {
            height: 44px;
        }

        .mobile-console.minimized .console-content,
        .mobile-console.minimized .nav-tabs {
            display: none;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
            .mobile-console {
                height: 60%;
            }
            
            .nav-tabs {
                flex-wrap: wrap;
            }
            
            .nav-tab {
                flex: 1 0 50%;
                font-size: 12px;
                padding: 10px 4px;
            }
            
            .section-controls {
                flex-wrap: wrap;
            }
            
            .action-btn {
                flex: 1;
                min-width: 120px;
            }
        }

        /* Log type colors */
        .log-timestamp {
            color: ${theme === 'light' ? '#9ca3af' : '#6b7280'};
        }

        .log-type-info {
            color: ${theme === 'light' ? '#3b82f6' : '#60a5fa'};
        }

        .log-type-warn {
            color: ${theme === 'light' ? '#f59e0b' : '#fbbf24'};
        }

        .log-type-error {
            color: ${theme === 'light' ? '#ef4444' : '#f87171'};
        }

        .log-type-input {
            color: ${theme === 'light' ? '#8b5cf6' : '#a78bfa'};
        }

        .log-message {
            color: ${theme === 'light' ? '#374151' : '#f9fafb'};
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

    // Initialize all functionality after DOM is ready
    function initializeConsole() {
        // Console functionality
        const consoleOutput = document.getElementById("consoleOutput");
        const consoleInput = document.getElementById("consoleInput");
        const executeButton = document.getElementById("executeCode");

        // Improved log function with better formatting
        const log = (message, type = "log") => {
            const line = document.createElement("div");
            line.className = `console-entry`;
            
            const timestamp = new Date().toLocaleTimeString();
            
            // Determine color based on log type
            let typeClass = 'log-type-info';
            switch (type) {
                case "error":
                    typeClass = 'log-type-error';
                    break;
                case "warn":
                    typeClass = 'log-type-warn';
                    break;
                case "info":
                    typeClass = 'log-type-info';
                    break;
                case "input":
                    typeClass = 'log-type-input';
                    break;
                default:
                    typeClass = 'log-type-info';
            }
            
            line.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                    <span class="log-timestamp" style="flex-shrink: 0; min-width: 60px;">[${timestamp}]</span>
                    <span class="${typeClass}" style="flex-shrink: 0; min-width: 50px; font-weight: 500;">${type.toUpperCase()}</span>
                    <span class="log-message" style="flex: 1; word-break: break-word;">${message}</span>
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

        // Navigation functionality - FIXED
        const navTabs = document.querySelectorAll(".nav-tab");
        const consoleSections = document.querySelectorAll(".console-section");

        navTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                const targetId = tab.id.replace("nav", "section");
                
                // Update active states
                navTabs.forEach((t) => t.classList.remove("active"));
                consoleSections.forEach((section) => section.classList.remove("active"));
                
                tab.classList.add("active");
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add("active");
                }
            });
        });

        // Element Viewer functionality
        document.getElementById('elementViewer').addEventListener('click', () => {
            const elementsContainer = document.getElementById('elementsContainer');
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
            const elementsContainer = document.getElementById('elementsContainer');
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
        const networkContainer = document.getElementById('networkContainer');
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
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: ${theme === 'light' ? '#9ca3af' : '#6b7280'}; text-align: center; padding: 40px 20px;">
                        <div style="font-size: 32px; margin-bottom: 16px;">📡</div>
                        <p style="margin: 0 0 8px 0; font-weight: 500;">No network requests recorded</p>
                        <p style="margin: 0; font-size: 14px;">Network requests will appear here as they happen</p>
                    </div>
                `;
                return;
            }
            
            networkLog.forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = `network-item`;
                
                // Determine status color
                let statusColor = theme === 'light' ? '#6b7280' : '#9ca3af';
                if (entry.status >= 200 && entry.status < 300) statusColor = '#10b981';
                else if (entry.status >= 300 && entry.status < 400) statusColor = '#f59e0b';
                else if (entry.status >= 400) statusColor = '#ef4444';
                else if (entry.status === 'Error') statusColor = '#ef4444';
                
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 14px; color: ${statusColor}; margin-bottom: 4px;">
                                ${entry.method} ${entry.status}
                            </div>
                            <div style="font-size: 12px; color: ${theme === 'light' ? '#6b7280' : '#9ca3af'}; word-break: break-all;">
                                ${entry.url}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                            <span style="font-size: 12px; color: ${theme === 'light' ? '#6b7280' : '#9ca3af'};">${entry.time}ms</span>
                            <span style="color: ${theme === 'light' ? '#9ca3af' : '#6b7280'};">→</span>
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
            let statusColor = theme === 'light' ? '#6b7280' : '#9ca3af';
            if (entry.status >= 200 && entry.status < 300) statusColor = '#10b981';
            else if (entry.status >= 300 && entry.status < 400) statusColor = '#f59e0b';
            else if (entry.status >= 400) statusColor = '#ef4444';
            else if (entry.status === 'Error') statusColor = '#ef4444';
            
            networkDetails.innerHTML = `
                <div style="border-bottom: 1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}; padding: 12px; background: ${theme === 'light' ? '#f9fafb' : '#1f2937'};">
                    <button id="backToNetwork" style="display: flex; align-items: center; background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 14px; padding: 0;">
                        <span style="margin-right: 8px;">←</span> Back to Network List
                    </button>
                </div>
                <div style="padding: 16px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: ${theme === 'light' ? '#374151' : '#f9fafb'};">Request Details</h3>
                    
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${theme === 'light' ? '#374151' : '#f9fafb'};">General</h4>
                        <div style="background: ${theme === 'light' ? '#f9fafb' : '#1f2937'}; border-radius: 6px; padding: 12px; font-size: 14px;">
                            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                                <div><strong>URL:</strong> <span style="word-break: break-all;">${entry.url}</span></div>
                                <div><strong>Method:</strong> ${entry.method}</div>
                                <div><strong>Status:</strong> <span style="color: ${statusColor}">${entry.status}</span></div>
                                <div><strong>Type:</strong> ${entry.type}</div>
                                <div><strong>Time:</strong> ${entry.time}ms</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${theme === 'light' ? '#374151' : '#f9fafb'};">Request Headers</h4>
                        <pre style="background: ${theme === 'light' ? '#f9fafb' : '#1f2937'}; border-radius: 6px; padding: 12px; font-size: 12px; overflow: auto; max-height: 160px; margin: 0; white-space: pre-wrap;">${formatHeaders(entry.requestHeaders)}</pre>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${theme === 'light' ? '#374151' : '#f9fafb'};">Request Body</h4>
                        <pre style="background: ${theme === 'light' ? '#f9fafb' : '#1f2937'}; border-radius: 6px; padding: 12px; font-size: 12px; overflow: auto; max-height: 160px; margin: 0; white-space: pre-wrap;">${entry.requestBody}</pre>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${theme === 'light' ? '#374151' : '#f9fafb'};">Response Headers</h4>
                        <pre style="background: ${theme === 'light' ? '#f9fafb' : '#1f2937'}; border-radius: 6px; padding: 12px; font-size: 12px; overflow: auto; max-height: 160px; margin: 0; white-space: pre-wrap;">${formatHeaders(entry.responseHeaders)}</pre>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${theme === 'light' ? '#374151' : '#f9fafb'};">Response Body</h4>
                        <pre style="background: ${theme === 'light' ? '#f9fafb' : '#1f2937'}; border-radius: 6px; padding: 12px; font-size: 12px; overflow: auto; max-height: 240px; margin: 0; white-space: pre-wrap;">${entry.responseBody}</pre>
                    </div>
                </div>
            `;
            
            networkDetails.querySelector('#backToNetwork').addEventListener('click', () => {
                networkDetails.classList.add('hidden');
                networkContainer.style.display = 'block';
                networkDetails.style.display = 'none';
            });
            
            networkContainer.style.display = 'none';
            networkDetails.style.display = 'block';
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
            networkDetails.style.display = 'none';
            networkContainer.style.display = 'block';
            log("Network log cleared", "info");
        };

        document.getElementById('clearNetwork').addEventListener('click', clearNetworkLog);

        // Toggle network recording
        document.getElementById('toggleRecording').addEventListener('click', function() {
            isRecording = !isRecording;
            this.textContent = isRecording ? 'Pause' : 'Resume';
            this.style.background = isRecording ? '#3b82f6' : '#f59e0b';
            
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
            <h4>About</h4>
            <p><strong>Created by:</strong> Saksham Shekher</p>
            <p><strong>GitHub:</strong> <a href="https://github.com/OshekharO" target="_blank" style="color: #3b82f6; text-decoration: none;">https://github.com/OshekharO</a></p>
            <p><strong>Version:</strong> 2.0.0</p>
            <p style="margin-top: 12px; font-size: 11px; color: ${theme === 'light' ? '#9ca3af' : '#6b7280'};">Mobile Developer Console with enhanced UI and features</p>
        `;

        // Device Info
        const deviceInfo = document.getElementById("deviceInfo");
        deviceInfo.innerHTML = `
            <h4>Device Info</h4>
            <p><strong>User Agent:</strong> <span style="word-break: break-all; font-size: 11px;">${navigator.userAgent}</span></p>
            <p><strong>Platform:</strong> ${navigator.platform}</p>
            <p><strong>Screen Size:</strong> ${window.screen.width}x${window.screen.height}</p>
            <p><strong>Viewport Size:</strong> ${window.innerWidth}x${window.innerHeight}</p>
            <p><strong>Device Pixel Ratio:</strong> ${window.devicePixelRatio}</p>
            <p><strong>Browser Language:</strong> ${navigator.language}</p>
            <p><strong>Online Status:</strong> <span style="color: ${navigator.onLine ? '#10b981' : '#ef4444'}">${navigator.onLine ? 'Online' : 'Offline'}</span></p>
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
                minimizeButton.innerHTML = '<span class="minimize-icon">+</span>';
                document.getElementById('console-status').textContent = 'Minimized';
                document.getElementById('console-status').className = 'badge badge-minimized';
            } else {
                consoleContainer.classList.remove('minimized');
                minimizeButton.innerHTML = '<span class="minimize-icon">−</span>';
                document.getElementById('console-status').textContent = 'Active';
                document.getElementById('console-status').className = 'badge badge-active';
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
        
        // Force initial scrollable content setup
        setTimeout(() => {
            const scrollableElements = document.querySelectorAll('.scrollable-content');
            scrollableElements.forEach(el => {
                el.style.display = 'block';
                el.style.overflow = 'auto';
            });
        }, 100);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeConsole);
    } else {
        initializeConsole();
    }
})();
