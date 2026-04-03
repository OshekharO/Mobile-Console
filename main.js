(() => {
    // Prevent double-injection: if the console already exists, toggle its visibility and exit
    const existingConsole = document.getElementById('dev-console');
    if (existingConsole) {
        existingConsole.classList.toggle('hidden');
        return;
    }

    // Check if the system is in dark mode
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    let theme = isDarkMode() ? 'dark' : 'light';
    
    // Configuration
    const MAX_NETWORK_ENTRIES = 100;
    const MAX_CONSOLE_ENTRIES = 500;
    const MIN_CONSOLE_HEIGHT = 100;
    const MAX_CONSOLE_HEIGHT_PERCENT = 90;
    const AUTOCOMPLETE_BLUR_DELAY_MS = 150; // Delay to allow click on autocomplete items before hiding
    const MIN_AUTOCOMPLETE_LENGTH = 2; // Minimum characters needed to trigger autocomplete
    const MAX_AUTOCOMPLETE_RESULTS = 10; // Maximum number of autocomplete suggestions
    
    // Console command history
    const commandHistory = [];
    let historyIndex = -1;
    
    // Store event listeners for cleanup
    const eventListeners = [];
    
    // Helper to add tracked event listeners
    const addTrackedEventListener = (element, event, handler, options) => {
        element.addEventListener(event, handler, options);
        eventListeners.push({ element, event, handler, options });
    };
    
    // Helper to remove tracked event listeners
    const removeTrackedEventListener = (element, event, handler, options) => {
        element.removeEventListener(event, handler, options);
        const index = eventListeners.findIndex(
            l => l.element === element && l.event === event && l.handler === handler
        );
        if (index !== -1) {
            eventListeners.splice(index, 1);
        }
    };
    
    // Helper to safely stringify objects (handles circular references, BigInt, functions, symbols)
    const safeStringify = (obj) => {
        const seen = new WeakSet();
        try {
            return JSON.stringify(obj, (key, value) => {
                if (typeof value === 'bigint') return `${value}n`;
                if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
                if (typeof value === 'symbol') return value.toString();
                if (typeof value === 'undefined') return '[undefined]';
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) return '[Circular]';
                    seen.add(value);
                }
                return value;
            }, 2);
        } catch (e) {
            return String(obj);
        }
    };

    // HTML template for the dev console
    const consoleHTML = `
        <div id="dev-console" class="dev-console-container">
            <div class="dev-console-resize-handle" id="resizeHandle"></div>
            <div class="dev-console-nav">
                <button class="dev-console-nav-button active" id="navConsole" title="Console">
                    <span class="nav-icon">⌘</span><span class="nav-text">Console</span>
                </button>
                <button class="dev-console-nav-button" id="navElements" title="Elements">
                    <span class="nav-icon">◇</span><span class="nav-text">Elements</span>
                </button>
                <button class="dev-console-nav-button" id="navNetwork" title="Network">
                    <span class="nav-icon">⇄</span><span class="nav-text">Network</span>
                </button>
                <button class="dev-console-nav-button" id="navStorage" title="Storage">
                    <span class="nav-icon">▤</span><span class="nav-text">Storage</span>
                </button>
                <button class="dev-console-nav-button" id="navCookies" title="Cookies">
                    <span class="nav-icon">🍪</span><span class="nav-text">Cookies</span>
                </button>
                <button class="dev-console-nav-button" id="navInfo" title="Info">
                    <span class="nav-icon">ⓘ</span><span class="nav-text">Info</span>
                </button>
                <button class="dev-console-nav-button nav-action" id="themeToggle" title="Toggle Theme">
                    <span class="nav-icon" id="themeIcon">◐</span>
                </button>
                <button class="dev-console-nav-button nav-action" id="consoleMinimize" title="Minimize">
                    <span class="nav-icon">−</span>
                </button>
                <button class="dev-console-nav-button nav-action" id="consoleExit" title="Close">
                    <span class="nav-icon">×</span>
                </button>
            </div>
            <div class="dev-console-body">
                <div id="sectionConsole" class="dev-console-section">
                    <div class="console-filter-wrapper">
                        <input type="text" id="consoleFilter" placeholder="Filter logs..." class="console-filter-input" />
                        <div class="console-filter-buttons">
                            <button class="filter-btn active" data-filter="all">All</button>
                            <button class="filter-btn" data-filter="log">Log</button>
                            <button class="filter-btn" data-filter="error">Error</button>
                            <button class="filter-btn" data-filter="warn">Warn</button>
                            <button class="filter-btn" data-filter="info">Info</button>
                        </div>
                    </div>
                    <div class="console-output"></div>
                    <div class="console-input-wrapper">
                        <button id="clearConsole" class="action-btn">🗑 Clear</button>
                        <button id="exportLogs" class="action-btn">📤 Export</button>
                        <textarea id="consoleInput" placeholder="Enter JavaScript... (↑↓ for history, Tab for autocomplete)"></textarea>
                        <div id="autocompleteList" class="autocomplete-list hidden"></div>
                    </div>
                </div>
                <div id="sectionElements" class="dev-console-section hidden">
                    <div class="elements-controls">
                        <button id="selectElement" class="action-btn">🎯 Select Element</button>
                        <button id="elementViewer" class="action-btn">📄 View HTML</button>
                        <button id="copyHtml" class="action-btn">📋 Copy HTML</button>
                    </div>
                    <div id="elementBreadcrumb" class="element-breadcrumb hidden"></div>
                    <div id="elementDetails" class="element-details hidden">
                        <div class="element-details-header">
                            <span id="elementTagName" class="element-tag-name"></span>
                            <button id="closeElementDetails" class="close-details-btn">×</button>
                        </div>
                        <div class="element-details-tabs">
                            <button class="element-tab-btn active" data-tab="attributes">Attributes</button>
                            <button class="element-tab-btn" data-tab="styles">Styles</button>
                            <button class="element-tab-btn" data-tab="computed">Computed</button>
                        </div>
                        <div id="attributesPanel" class="element-panel">
                            <div id="elementAttributes" class="element-attributes"></div>
                            <div class="add-attribute-wrapper">
                                <input type="text" id="newAttrName" placeholder="Name" class="attr-input" />
                                <input type="text" id="newAttrValue" placeholder="Value" class="attr-input" />
                                <button id="addAttribute" class="action-btn small">+ Add</button>
                            </div>
                        </div>
                        <div id="stylesPanel" class="element-panel hidden">
                            <div id="elementStyles" class="element-styles"></div>
                            <div class="add-style-wrapper">
                                <input type="text" id="newStyleProp" placeholder="Property" class="style-input" />
                                <input type="text" id="newStyleValue" placeholder="Value" class="style-input" />
                                <button id="addStyle" class="action-btn small">+ Add</button>
                            </div>
                        </div>
                        <div id="computedPanel" class="element-panel hidden">
                            <input type="text" id="computedFilter" placeholder="Filter computed styles..." class="computed-filter-input" />
                            <div id="computedStyles" class="computed-styles"></div>
                        </div>
                        <div class="element-actions">
                            <button id="editElementText" class="action-btn">✏️ Edit Text</button>
                            <button id="deleteElement" class="action-btn danger">🗑 Delete</button>
                            <button id="copyElementHtml" class="action-btn">📋 Copy HTML</button>
                        </div>
                    </div>
                    <div class="elements-container"></div>
                </div>
                <div id="sectionNetwork" class="dev-console-section hidden">
                    <div class="network-controls">
                        <input type="text" id="networkFilter" placeholder="Filter requests..." class="network-filter-input" />
                        <button id="clearNetwork" class="action-btn">🗑 Clear</button>
                    </div>
                    <div class="network-container"></div>
                    <div class="network-details hidden"></div>
                </div>
                <div id="sectionStorage" class="dev-console-section hidden">
                    <div class="storage-controls">
                        <button class="storage-tab-btn active" data-storage="local">localStorage</button>
                        <button class="storage-tab-btn" data-storage="session">sessionStorage</button>
                        <button id="refreshStorage" class="action-btn">🔄 Refresh</button>
                    </div>
                    <div class="storage-container"></div>
                </div>
                <div id="sectionCookies" class="dev-console-section hidden">
                    <div class="cookies-controls">
                        <input type="text" id="cookieFilter" placeholder="Filter cookies..." class="cookie-filter-input" />
                        <button id="refreshCookies" class="action-btn">🔄 Refresh</button>
                        <button id="addCookie" class="action-btn">➕ Add</button>
                        <button id="clearAllCookies" class="action-btn danger">🗑 Clear All</button>
                    </div>
                    <div class="cookies-container"></div>
                </div>
                <div id="sectionInfo" class="dev-console-section hidden">
                    <div class="info-tabs">
                        <button class="info-tab-btn active" data-info="device">Device</button>
                        <button class="info-tab-btn" data-info="performance">Performance</button>
                        <button class="info-tab-btn" data-info="about">About</button>
                    </div>
                    <div id="deviceInfo" class="device-info info-panel"></div>
                    <div id="performanceInfo" class="performance-info info-panel hidden"></div>
                    <div id="aboutInfo" class="about-info info-panel hidden"></div>
                    <div class="info-controls">
                        <button id="clearCookies" class="action-btn">🍪 Clear Cookies</button>
                        <button id="clearStorage" class="action-btn">🗂 Clear Storage</button>
                        <button id="reloadPage" class="action-btn">🔄 Reload Page</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // CSS variables for theming (reduces code duplication)
    const getThemeVars = (currentTheme) => currentTheme === 'light' ? {
        bg: '#ffffff',
        bgSecondary: '#f5f6f7',
        bgTertiary: '#eef1f4',
        text: '#1a1a2e',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        borderLight: '#f3f4f6',
        activeBg: '#ffffff',
        accent: '#3b82f6',
        accentLight: '#60a5fa',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        shadow: 'rgba(0, 0, 0, 0.08)'
    } : {
        bg: '#0f0f23',
        bgSecondary: '#1a1a2e',
        bgTertiary: '#16213e',
        text: '#e2e8f0',
        textSecondary: '#94a3b8',
        border: '#334155',
        borderLight: '#475569',
        activeBg: '#1e293b',
        accent: '#60a5fa',
        accentLight: '#93c5fd',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        shadow: 'rgba(0, 0, 0, 0.3)'
    };

    let themeVars = getThemeVars(theme);

    // CSS styles for the dev console
    const getConsoleStyles = (vars) => `
        .dev-console-container {
            --bg: ${vars.bg};
            --bg-secondary: ${vars.bgSecondary};
            --bg-tertiary: ${vars.bgTertiary};
            --text: ${vars.text};
            --text-secondary: ${vars.textSecondary};
            --border: ${vars.border};
            --border-light: ${vars.borderLight};
            --active-bg: ${vars.activeBg};
            --accent: ${vars.accent};
            --accent-light: ${vars.accentLight};
            --success: ${vars.success};
            --warning: ${vars.warning};
            --error: ${vars.error};
            --shadow: ${vars.shadow};
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
            box-shadow: 0 -4px 20px var(--shadow);
            color: var(--text);
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            transition: height 0.2s ease-out;
        }
        .dev-console-resize-handle {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 12px;
            cursor: ns-resize;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            z-index: 10001;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }
        .dev-console-resize-handle::after {
            content: '';
            width: 40px;
            height: 4px;
            background: var(--border);
            border-radius: 2px;
            transition: background 0.2s;
        }
        .dev-console-resize-handle:hover::after,
        .dev-console-resize-handle:active::after {
            background: var(--accent);
        }
        .dev-console-nav {
            display: flex;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-light);
            padding: 4px 4px 0 4px;
            gap: 2px;
            flex-wrap: wrap;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }
        .dev-console-nav-button {
            padding: 8px 12px;
            border: none;
            background: transparent;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            border-radius: 8px 8px 0 0;
            transition: all 0.15s ease;
            flex-grow: 1;
            justify-content: center;
            min-width: fit-content;
        }
        .dev-console-nav-button:hover {
            background: var(--bg-tertiary);
            color: var(--text);
        }
        .dev-console-nav-button.active {
            background: var(--bg);
            color: var(--accent);
            font-weight: 500;
        }
        .dev-console-nav-button.nav-action {
            flex-grow: 0;
            padding: 8px 10px;
            color: var(--text-secondary);
        }
        .dev-console-nav-button.nav-action:hover {
            color: var(--text);
            background: var(--bg-tertiary);
        }
        .nav-icon {
            font-size: 14px;
        }
        .nav-text {
            font-size: 11px;
        }
        @media (max-width: 480px) {
            .nav-text { display: none; }
            .dev-console-nav-button { padding: 10px 8px; }
            .nav-icon { font-size: 16px; }
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
        
        /* Console Filter */
        .console-filter-wrapper {
            padding: 6px 8px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .console-filter-wrapper::-webkit-scrollbar {
            display: none;
        }
        .console-filter-input, .network-filter-input {
            flex: 1;
            min-width: 100px;
            padding: 5px 8px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text);
            font-size: 11px;
            outline: none;
            transition: border-color 0.15s;
        }
        .console-filter-input:focus, .network-filter-input:focus {
            border-color: var(--accent);
        }
        .console-filter-buttons {
            display: flex;
            gap: 3px;
            flex-shrink: 0;
        }
        .filter-btn {
            padding: 4px 6px;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg);
            color: var(--text-secondary);
            font-size: 9px;
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
        }
        .filter-btn:hover {
            background: var(--bg-tertiary);
        }
        .filter-btn.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }
        
        .console-output, .network-container, .network-details, .elements-container, .storage-container {
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 12px;
            line-height: 1.5;
            color: var(--text);
        }
        .console-entry {
            padding: 4px 8px;
            margin: 2px 0;
            border-radius: 4px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            transition: background 0.1s;
        }
        .console-entry:hover {
            background: var(--bg-secondary);
        }
        .console-entry .timestamp {
            color: var(--text-secondary);
            font-size: 10px;
            white-space: nowrap;
        }
        .console-entry .type-badge {
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .console-entry .message {
            flex: 1;
            word-break: break-word;
        }
        .console-entry .copy-btn {
            opacity: 0;
            padding: 2px 6px;
            border: none;
            background: var(--bg-tertiary);
            color: var(--text-secondary);
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            transition: opacity 0.15s;
        }
        .console-entry:hover .copy-btn {
            opacity: 1;
        }
        .console-entry .copy-btn:hover {
            background: var(--accent);
            color: white;
        }
        .console-entry.log .type-badge { background: var(--bg-tertiary); color: var(--text); }
        .console-entry.error .type-badge { background: #fee2e2; color: var(--error); }
        .console-entry.warn .type-badge { background: #fef3c7; color: var(--warning); }
        .console-entry.info .type-badge { background: #dbeafe; color: var(--accent); }
        .console-entry.input .type-badge { background: var(--bg-tertiary); color: var(--text-secondary); }
        .console-entry.error { border-left: 3px solid var(--error); }
        .console-entry.warn { border-left: 3px solid var(--warning); }
        
        .console-input-wrapper {
            border-top: 1px solid var(--border);
            padding: 10px;
            display: flex;
            gap: 8px;
            align-items: flex-end;
            background: var(--bg-secondary);
            position: relative;
            flex-wrap: wrap;
        }
        #consoleInput {
            flex: 1;
            min-height: 36px;
            max-height: 100px;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 8px 12px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 12px;
            color: var(--text);
            background: var(--bg);
            box-sizing: border-box;
            resize: none;
            outline: none;
            transition: border-color 0.15s;
            min-width: 150px;
        }
        #consoleInput:focus {
            border-color: var(--accent);
        }
        
        /* Autocomplete styles */
        .autocomplete-list {
            position: absolute;
            bottom: 100%;
            left: 10px;
            right: 10px;
            max-height: 200px;
            overflow-y: auto;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: 0 -4px 12px var(--shadow);
            z-index: 10002;
            margin-bottom: 5px;
        }
        .autocomplete-item {
            padding: 8px 12px;
            cursor: pointer;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 12px;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid var(--border);
        }
        .autocomplete-item:last-child {
            border-bottom: none;
        }
        .autocomplete-item:hover,
        .autocomplete-item.selected {
            background: var(--bg-tertiary);
        }
        .autocomplete-item .type {
            font-size: 9px;
            padding: 2px 5px;
            border-radius: 3px;
            background: var(--bg-secondary);
            color: var(--text-secondary);
        }
        .autocomplete-item .type.keyword { background: #dbeafe; color: var(--accent); }
        .autocomplete-item .type.method { background: #d1fae5; color: var(--success); }
        .autocomplete-item .type.property { background: #fef3c7; color: var(--warning); }
        .autocomplete-item .type.history { background: #f3e8ff; color: #7c3aed; }
        
        /* Action buttons */
        .action-btn {
            padding: 6px 10px;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            color: var(--text);
            font-size: 11px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            transition: all 0.15s;
            white-space: nowrap;
            flex-shrink: 0;
            min-width: 0;
        }
        .action-btn:hover {
            background: var(--bg-tertiary);
            border-color: var(--accent);
        }
        .action-btn:active {
            transform: scale(0.98);
        }
        @media (max-width: 400px) {
            .action-btn {
                padding: 5px 8px;
                font-size: 10px;
            }
        }
        
        .elements-controls, .network-controls, .info-controls, .storage-controls {
            display: flex;
            padding: 6px 8px;
            gap: 6px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
            flex-shrink: 0;
        }
        .elements-controls::-webkit-scrollbar,
        .network-controls::-webkit-scrollbar,
        .info-controls::-webkit-scrollbar,
        .storage-controls::-webkit-scrollbar {
            display: none;
        }
        
        /* Storage styles */
        .storage-tab-btn {
            padding: 5px 10px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text-secondary);
            font-size: 11px;
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .storage-tab-btn:hover {
            background: var(--bg-tertiary);
        }
        .storage-tab-btn.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }
        .storage-container {
            padding: 10px;
        }
        .storage-item {
            display: flex;
            padding: 8px 12px;
            margin: 4px 0;
            background: var(--bg-secondary);
            border-radius: 6px;
            gap: 12px;
            align-items: flex-start;
        }
        .storage-item .key {
            font-weight: 600;
            color: var(--accent);
            min-width: 80px;
            max-width: 120px;
            word-break: break-all;
            flex-shrink: 0;
        }
        .storage-item .value {
            flex: 1;
            color: var(--text);
            word-break: break-all;
            font-family: monospace;
            font-size: 11px;
            min-width: 0;
        }
        .storage-item .actions {
            display: flex;
            gap: 4px;
            flex-shrink: 0;
        }
        .storage-item .delete-btn {
            padding: 4px 8px;
            border: none;
            background: var(--error);
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
        }
        .storage-empty {
            text-align: center;
            padding: 40px;
            color: var(--text-secondary);
        }
        
        /* Cookies styles */
        .cookies-controls {
            display: flex;
            padding: 6px 8px;
            gap: 6px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .cookies-controls::-webkit-scrollbar {
            display: none;
        }
        .cookie-filter-input {
            flex: 1;
            min-width: 100px;
            padding: 5px 8px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text);
            font-size: 11px;
            outline: none;
            transition: border-color 0.15s;
        }
        .cookie-filter-input:focus {
            border-color: var(--accent);
        }
        .cookies-container {
            padding: 10px;
            overflow-y: auto;
            flex: 1;
        }
        .cookie-item {
            display: flex;
            flex-direction: column;
            padding: 10px 12px;
            margin: 4px 0;
            background: var(--bg-secondary);
            border-radius: 6px;
            gap: 6px;
        }
        .cookie-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .cookie-item .name {
            font-weight: 600;
            color: var(--accent);
            word-break: break-all;
        }
        .cookie-item .value {
            color: var(--text);
            word-break: break-all;
            font-family: monospace;
            font-size: 11px;
            background: var(--bg);
            padding: 6px 8px;
            border-radius: 4px;
        }
        .cookie-item .meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            font-size: 10px;
            color: var(--text-secondary);
        }
        .cookie-item .meta span {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .cookie-item .actions {
            display: flex;
            gap: 4px;
            flex-shrink: 0;
        }
        .cookie-item .edit-btn,
        .cookie-item .delete-btn {
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
        }
        .cookie-item .edit-btn {
            background: var(--bg-tertiary);
            color: var(--text);
        }
        .cookie-item .edit-btn:hover {
            background: var(--accent);
            color: white;
        }
        .cookie-item .delete-btn {
            background: var(--error);
            color: white;
        }
        
        /* Info tabs */
        .info-tabs {
            display: flex;
            gap: 4px;
            padding: 6px 8px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .info-tabs::-webkit-scrollbar {
            display: none;
        }
        .info-tab-btn {
            padding: 5px 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text-secondary);
            font-size: 11px;
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .info-tab-btn:hover {
            background: var(--bg-tertiary);
        }
        .info-tab-btn.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }
        .info-panel {
            flex: 1;
            overflow-y: auto;
        }
        
        .device-info, .performance-info {
            margin: 10px;
            padding: 0;
        }
        .info-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 10px;
        }
        .info-card h4 {
            margin: 0 0 10px 0;
            color: var(--accent);
            font-size: 13px;
            font-weight: 600;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid var(--border);
            font-size: 12px;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-row .label {
            color: var(--text-secondary);
        }
        .info-row .value {
            color: var(--text);
            font-weight: 500;
            text-align: right;
            max-width: 60%;
            word-break: break-all;
        }
        
        /* Performance metrics */
        .perf-metric {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
        }
        .perf-metric .metric-icon {
            font-size: 18px;
        }
        .perf-metric .metric-info {
            flex: 1;
        }
        .perf-metric .metric-label {
            font-size: 11px;
            color: var(--text-secondary);
        }
        .perf-metric .metric-value {
            font-size: 16px;
            font-weight: 600;
            color: var(--text);
        }
        .perf-bar {
            height: 4px;
            background: var(--bg-tertiary);
            border-radius: 2px;
            margin-top: 4px;
            overflow: hidden;
        }
        .perf-bar-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s;
        }
        .perf-bar-fill.good { background: var(--success); }
        .perf-bar-fill.warning { background: var(--warning); }
        .perf-bar-fill.bad { background: var(--error); }
        
        .network-item {
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            cursor: pointer;
            background: var(--bg-secondary);
            transition: all 0.15s;
        }
        .network-item:hover {
            border-color: var(--accent);
            box-shadow: 0 2px 8px var(--shadow);
        }
        .network-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        .network-item-method {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            background: var(--accent);
            color: white;
        }
        .network-item-status {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }
        .network-item-status.success { background: #d1fae5; color: var(--success); }
        .network-item-status.error { background: #fee2e2; color: var(--error); }
        .network-item-status.redirect { background: #fef3c7; color: var(--warning); }
        .network-item-url {
            word-break: break-all;
            font-size: 12px;
            color: var(--text);
        }
        .network-item-details {
            display: flex;
            gap: 12px;
            margin-top: 6px;
            font-size: 11px;
            color: var(--text-secondary);
        }
        .network-details {
            color: var(--text);
        }
        .network-details pre {
            white-space: pre-wrap;
            word-break: break-all;
            background: var(--bg-secondary);
            color: var(--text);
            padding: 12px;
            border-radius: 8px;
            font-size: 11px;
        }
        .back-button {
            margin-bottom: 10px;
            color: var(--text);
            width: 100%;
            height: 40px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--bg-secondary);
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s;
        }
        .back-button:hover {
            background: var(--bg-tertiary);
            border-color: var(--accent);
        }
        .elements-container {
            white-space: pre-wrap;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 12px;
            padding: 10px;
            overflow-x: auto;
            background-color: var(--bg-secondary);
            margin: 10px;
            border-radius: 8px;
            color: var(--text);
        }
        .about-info {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px;
            padding: 20px;
            text-align: center;
        }
        .about-logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .about-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 4px;
        }
        .about-version {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 16px;
        }
        .about-info a {
            color: var(--accent);
            text-decoration: none;
        }
        .about-info a:hover {
            text-decoration: underline;
        }
        .about-links {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 16px;
        }
        .about-link {
            padding: 8px 16px;
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text);
            text-decoration: none;
            font-size: 12px;
            transition: all 0.15s;
        }
        .about-link:hover {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
            text-decoration: none;
        }
        .dev-console-container.minimized {
            height: 44px !important;
            overflow: hidden;
        }
        .dev-console-container.minimized .dev-console-body,
        .dev-console-container.minimized .dev-console-resize-handle {
            display: none;
        }
        
        /* Toast notification */
        .dev-console-toast {
            position: fixed;
            bottom: calc(50% + 20px);
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            background: var(--text);
            color: var(--bg);
            border-radius: 6px;
            font-size: 12px;
            z-index: 10002;
            animation: toastFade 2s ease forwards;
        }
        @keyframes toastFade {
            0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
            15% { opacity: 1; transform: translateX(-50%) translateY(0); }
            85% { opacity: 1; }
            100% { opacity: 0; }
        }
        
        /* Element Inspector Styles */
        .element-inspector-overlay {
            position: fixed;
            pointer-events: none;
            z-index: 9998;
            border: 2px solid var(--accent);
            background: rgba(59, 130, 246, 0.1);
            transition: all 0.1s ease;
        }
        .element-inspector-label {
            position: fixed;
            z-index: 9999;
            background: var(--accent);
            color: white;
            padding: 4px 8px;
            font-size: 11px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            border-radius: 4px;
            pointer-events: none;
            white-space: nowrap;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .element-breadcrumb {
            display: flex;
            flex-wrap: nowrap;
            gap: 4px;
            padding: 6px 8px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 10px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .element-breadcrumb::-webkit-scrollbar {
            display: none;
        }
        .breadcrumb-item {
            color: var(--text-secondary);
            cursor: pointer;
            padding: 2px 5px;
            border-radius: 4px;
            transition: all 0.15s;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .breadcrumb-item:hover {
            background: var(--bg-tertiary);
            color: var(--text);
        }
        .breadcrumb-item.active {
            background: var(--accent);
            color: white;
        }
        .breadcrumb-separator {
            color: var(--text-secondary);
        }
        .element-details {
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            max-height: 60%;
            overflow-y: auto;
        }
        .element-details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            border-bottom: 1px solid var(--border);
        }
        .element-tag-name {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 14px;
            font-weight: 600;
            color: var(--accent);
        }
        .close-details-btn {
            border: none;
            background: transparent;
            color: var(--text-secondary);
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.15s;
        }
        .close-details-btn:hover {
            background: var(--bg-tertiary);
            color: var(--text);
        }
        .element-details-tabs {
            display: flex;
            gap: 4px;
            padding: 6px 8px;
            border-bottom: 1px solid var(--border);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .element-details-tabs::-webkit-scrollbar {
            display: none;
        }
        .element-tab-btn {
            padding: 5px 10px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text-secondary);
            font-size: 10px;
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .element-tab-btn:hover {
            background: var(--bg-tertiary);
        }
        .element-tab-btn.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }
        .element-panel {
            padding: 8px;
            max-height: 200px;
            overflow-y: auto;
        }
        .element-attributes, .element-styles {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .attr-row, .style-row {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 6px;
            background: var(--bg);
            border-radius: 6px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 10px;
        }
        .attr-name, .style-prop {
            color: var(--accent);
            font-weight: 600;
            min-width: 60px;
            max-width: 80px;
            word-break: break-all;
            flex-shrink: 0;
        }
        .attr-value, .style-value {
            flex: 1;
            color: var(--success);
            word-break: break-all;
            min-width: 0;
        }
        .attr-value input, .style-value input {
            width: 100%;
            padding: 3px 5px;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-secondary);
            color: var(--text);
            font-family: inherit;
            font-size: inherit;
        }
        .attr-value input:focus, .style-value input:focus {
            border-color: var(--accent);
            outline: none;
        }
        .attr-delete, .style-delete {
            padding: 3px 5px;
            border: none;
            background: transparent;
            color: var(--error);
            cursor: pointer;
            border-radius: 4px;
            font-size: 11px;
            flex-shrink: 0;
        }
        .attr-delete:hover, .style-delete:hover {
            background: var(--error);
            color: white;
        }
        .add-attribute-wrapper, .add-style-wrapper {
            display: flex;
            gap: 4px;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid var(--border);
            flex-wrap: nowrap;
        }
        .attr-input, .style-input {
            flex: 1;
            min-width: 0;
            padding: 5px 6px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text);
            font-size: 11px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        }
        .attr-input:focus, .style-input:focus {
            border-color: var(--accent);
            outline: none;
        }
        .action-btn.small {
            padding: 6px 10px;
            font-size: 11px;
        }
        .action-btn.danger {
            border-color: var(--error);
            color: var(--error);
        }
        .action-btn.danger:hover {
            background: var(--error);
            color: white;
        }
        .action-btn.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }
        .computed-filter-input {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text);
            font-size: 12px;
            margin-bottom: 10px;
        }
        .computed-filter-input:focus {
            border-color: var(--accent);
            outline: none;
        }
        .computed-styles {
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-height: 180px;
            overflow-y: auto;
        }
        .computed-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 8px;
            background: var(--bg);
            border-radius: 4px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 10px;
        }
        .computed-prop {
            color: var(--text-secondary);
        }
        .computed-value {
            color: var(--text);
            max-width: 50%;
            text-align: right;
            word-break: break-all;
        }
        .element-actions {
            display: flex;
            gap: 6px;
            padding: 8px;
            border-top: 1px solid var(--border);
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .element-actions::-webkit-scrollbar {
            display: none;
        }
        .selecting-element {
            cursor: crosshair !important;
        }
        .selecting-element * {
            cursor: crosshair !important;
        }
        
        /* Modal dialog styles */
        .dev-console-modal-overlay {
            --modal-bg: ${vars.bg};
            --modal-bg-secondary: ${vars.bgSecondary};
            --modal-bg-tertiary: ${vars.bgTertiary};
            --modal-text: ${vars.text};
            --modal-text-secondary: ${vars.textSecondary};
            --modal-border: ${vars.border};
            --modal-accent: ${vars.accent};
            --modal-accent-light: ${vars.accentLight};
            --modal-error: ${vars.error};
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10003;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        }
        .dev-console-modal {
            background: var(--modal-bg);
            border-radius: 12px;
            padding: 20px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            box-sizing: border-box;
        }
        .dev-console-modal h3 {
            margin: 0 0 15px 0;
            color: var(--modal-text);
            font-size: 16px;
        }
        .dev-console-modal p {
            margin: 0 0 15px 0;
            color: var(--modal-text-secondary);
            font-size: 13px;
        }
        .dev-console-modal input,
        .dev-console-modal textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--modal-border);
            border-radius: 8px;
            background: var(--modal-bg-secondary);
            color: var(--modal-text);
            font-size: 13px;
            margin-bottom: 15px;
            box-sizing: border-box;
            font-family: inherit;
        }
        .dev-console-modal textarea {
            min-height: 80px;
            resize: vertical;
        }
        .dev-console-modal input:focus,
        .dev-console-modal textarea:focus {
            outline: none;
            border-color: var(--modal-accent);
        }
        .dev-console-modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .dev-console-modal-btn {
            padding: 8px 16px;
            border: 1px solid var(--modal-border);
            border-radius: 6px;
            background: var(--modal-bg-secondary);
            color: var(--modal-text);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.15s;
        }
        .dev-console-modal-btn:hover {
            background: var(--modal-bg-tertiary);
        }
        .dev-console-modal-btn.primary {
            background: var(--modal-accent);
            color: white;
            border-color: var(--modal-accent);
        }
        .dev-console-modal-btn.primary:hover {
            background: var(--modal-accent-light);
        }
        .dev-console-modal-btn.danger {
            background: var(--modal-error);
            color: white;
            border-color: var(--modal-error);
        }
        .dev-console-modal-btn.danger:hover {
            opacity: 0.9;
        }
    `;
    
    let consoleStyles = getConsoleStyles(themeVars);

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
    let currentLogFilter = 'all';
    let currentTextFilter = '';

    // Toast notification helper
    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'dev-console-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };

    // Copy to clipboard helper
    const copyToClipboard = (text) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied to clipboard!');
            }).catch(() => {
                showToast('Failed to copy');
            });
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('Copied to clipboard!');
            } catch (e) {
                showToast('Failed to copy');
            }
            document.body.removeChild(textarea);
        }
    };

    // Mobile-friendly modal dialogs
    const showModal = (options) => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'dev-console-modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'dev-console-modal';
            
            const title = document.createElement('h3');
            title.textContent = options.title || 'Dialog';
            modal.appendChild(title);
            
            if (options.message) {
                const message = document.createElement('p');
                message.textContent = options.message;
                modal.appendChild(message);
            }
            
            let inputEl = null;
            if (options.input) {
                inputEl = document.createElement(options.multiline ? 'textarea' : 'input');
                inputEl.type = 'text';
                inputEl.value = options.defaultValue || '';
                inputEl.placeholder = options.placeholder || '';
                modal.appendChild(inputEl);
            }
            
            const buttons = document.createElement('div');
            buttons.className = 'dev-console-modal-buttons';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'dev-console-modal-btn';
            cancelBtn.textContent = options.cancelText || 'Cancel';
            cancelBtn.addEventListener('click', () => {
                overlay.remove();
                resolve(options.input ? null : false);
            });
            buttons.appendChild(cancelBtn);
            
            const confirmBtn = document.createElement('button');
            confirmBtn.className = `dev-console-modal-btn ${options.danger ? 'danger' : 'primary'}`;
            confirmBtn.textContent = options.confirmText || 'OK';
            confirmBtn.addEventListener('click', () => {
                overlay.remove();
                resolve(options.input ? inputEl.value : true);
            });
            buttons.appendChild(confirmBtn);
            
            modal.appendChild(buttons);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            if (inputEl) {
                inputEl.focus();
                inputEl.select();
            }
        });
    };
    
    const showPrompt = (title, defaultValue = '', placeholder = '') => {
        return showModal({
            title,
            input: true,
            multiline: true,
            defaultValue,
            placeholder,
            confirmText: 'Save'
        });
    };
    
    const showConfirm = (title, message, danger = false) => {
        return showModal({
            title,
            message,
            danger,
            confirmText: danger ? 'Delete' : 'Confirm'
        });
    };

    const log = (message, type = "log") => {
        // Memory management: remove oldest entries if over limit
        while (consoleOutput.children.length >= MAX_CONSOLE_ENTRIES) {
            consoleOutput.removeChild(consoleOutput.firstChild);
        }
        
        const entry = document.createElement("div");
        entry.className = `console-entry ${type}`;
        entry.dataset.type = type;
        entry.dataset.message = String(message).toLowerCase();
        const timestamp = new Date().toLocaleTimeString();
        
        // Create timestamp span
        const timestampSpan = document.createElement("span");
        timestampSpan.className = "timestamp";
        timestampSpan.textContent = timestamp;
        
        // Create type badge
        const typeBadge = document.createElement("span");
        typeBadge.className = "type-badge";
        typeBadge.textContent = type;
        
        // Create message span
        const messageSpan = document.createElement("span");
        messageSpan.className = "message";
        messageSpan.textContent = message;
        
        // Create copy button
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            copyToClipboard(message);
        });
        
        entry.appendChild(timestampSpan);
        entry.appendChild(typeBadge);
        entry.appendChild(messageSpan);
        entry.appendChild(copyBtn);
        
        // Apply current filters
        if (currentLogFilter !== 'all' && type !== currentLogFilter) {
            entry.style.display = 'none';
        }
        if (currentTextFilter && !String(message).toLowerCase().includes(currentTextFilter.toLowerCase())) {
            entry.style.display = 'none';
        }
        
        consoleOutput.appendChild(entry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };

    // Console filtering
    const applyConsoleFilters = () => {
        const entries = consoleOutput.querySelectorAll('.console-entry');
        entries.forEach(entry => {
            const matchesType = currentLogFilter === 'all' || entry.dataset.type === currentLogFilter;
            const matchesText = !currentTextFilter || entry.dataset.message.includes(currentTextFilter.toLowerCase());
            entry.style.display = matchesType && matchesText ? '' : 'none';
        });
    };

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        addTrackedEventListener(btn, 'click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLogFilter = btn.dataset.filter;
            applyConsoleFilters();
        });
    });

    // Text filter
    const consoleFilterInput = document.getElementById('consoleFilter');
    addTrackedEventListener(consoleFilterInput, 'input', (e) => {
        currentTextFilter = e.target.value;
        applyConsoleFilters();
    });

    const clearConsole = () => {
        consoleOutput.innerHTML = "";
        log("Console cleared", "info");
    };

    addTrackedEventListener(document.getElementById("clearConsole"), "click", clearConsole);

    // Autocomplete functionality
    const autocompleteList = document.getElementById('autocompleteList');
    let autocompleteIndex = -1;
    let autocompleteItems = [];
    
    // JavaScript keywords and common methods for autocomplete
    const jsKeywords = [
        'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
        'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false',
        'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
        'new', 'null', 'return', 'static', 'super', 'switch', 'this', 'throw',
        'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield'
    ];
    
    const commonMethods = [
        'console.log', 'console.error', 'console.warn', 'console.info', 'console.table',
        'document.getElementById', 'document.querySelector', 'document.querySelectorAll',
        'document.createElement', 'document.body', 'document.head',
        'window.location', 'window.navigator', 'window.localStorage', 'window.sessionStorage',
        'JSON.parse', 'JSON.stringify', 'Object.keys', 'Object.values', 'Object.entries',
        'Array.from', 'Array.isArray', 'Math.random', 'Math.floor', 'Math.ceil', 'Math.round',
        'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'fetch',
        'addEventListener', 'removeEventListener', 'getAttribute', 'setAttribute',
        'querySelector', 'querySelectorAll', 'appendChild', 'removeChild', 'innerHTML',
        'textContent', 'classList', 'style', 'forEach', 'map', 'filter', 'reduce', 'find'
    ];
    
    const commonProperties = [
        'length', 'prototype', 'constructor', 'name', 'value', 'id', 'className',
        'parentNode', 'childNodes', 'firstChild', 'lastChild', 'nextSibling', 'previousSibling',
        'innerWidth', 'innerHeight', 'outerWidth', 'outerHeight', 'scrollX', 'scrollY'
    ];
    
    const getAutocompleteItems = (input) => {
        if (!input || input.length < MIN_AUTOCOMPLETE_LENGTH) return [];
        
        const lastWord = input.split(/[\s()\[\]{};,]+/).pop().toLowerCase();
        if (!lastWord || lastWord.length < MIN_AUTOCOMPLETE_LENGTH) return [];
        
        const items = [];
        
        // Filter keywords
        jsKeywords.forEach(kw => {
            if (kw.toLowerCase().startsWith(lastWord)) {
                items.push({ text: kw, type: 'keyword' });
            }
        });
        
        // Filter methods
        commonMethods.forEach(method => {
            if (method.toLowerCase().includes(lastWord)) {
                items.push({ text: method, type: 'method' });
            }
        });
        
        // Filter properties
        commonProperties.forEach(prop => {
            if (prop.toLowerCase().startsWith(lastWord)) {
                items.push({ text: prop, type: 'property' });
            }
        });
        
        // Also include command history items
        commandHistory.forEach(cmd => {
            if (cmd.toLowerCase().includes(lastWord) && cmd !== input) {
                items.push({ text: cmd, type: 'history' });
            }
        });
        
        // Limit and sort by relevance
        return items.slice(0, MAX_AUTOCOMPLETE_RESULTS).sort((a, b) => {
            // Prioritize items that start with the input
            const aStarts = a.text.toLowerCase().startsWith(lastWord);
            const bStarts = b.text.toLowerCase().startsWith(lastWord);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.text.length - b.text.length;
        });
    };
    
    const showAutocomplete = (items) => {
        if (items.length === 0) {
            hideAutocomplete();
            return;
        }
        
        autocompleteItems = items;
        autocompleteIndex = -1;
        autocompleteList.innerHTML = '';
        
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            
            const typeSpan = document.createElement('span');
            typeSpan.className = `type ${item.type}`;
            typeSpan.textContent = item.type;
            
            const textSpan = document.createElement('span');
            textSpan.textContent = item.text;
            
            div.appendChild(typeSpan);
            div.appendChild(textSpan);
            
            div.addEventListener('click', () => {
                insertAutocomplete(item.text);
            });
            
            autocompleteList.appendChild(div);
        });
        
        autocompleteList.classList.remove('hidden');
    };
    
    const hideAutocomplete = () => {
        autocompleteList.classList.add('hidden');
        autocompleteItems = [];
        autocompleteIndex = -1;
    };
    
    const insertAutocomplete = (text) => {
        const input = consoleInput.value;
        const words = input.split(/[\s()\[\]{};,]+/);
        const lastWord = words.pop();
        
        // Replace the last word with the selected autocomplete text
        const prefix = input.slice(0, input.length - lastWord.length);
        consoleInput.value = prefix + text;
        consoleInput.focus();
        hideAutocomplete();
    };
    
    const updateAutocompleteSelection = () => {
        const items = autocompleteList.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === autocompleteIndex);
        });
        
        // Scroll selected item into view
        if (autocompleteIndex >= 0 && items[autocompleteIndex]) {
            items[autocompleteIndex].scrollIntoView({ block: 'nearest' });
        }
    };
    
    addTrackedEventListener(consoleInput, 'input', () => {
        const items = getAutocompleteItems(consoleInput.value);
        showAutocomplete(items);
    });
    
    addTrackedEventListener(consoleInput, 'blur', () => {
        // Delay to allow click on autocomplete item
        setTimeout(hideAutocomplete, AUTOCOMPLETE_BLUR_DELAY_MS);
    });

    // Export logs functionality
    const exportLogs = () => {
        const entries = consoleOutput.querySelectorAll('.console-entry');
        const logs = [];
        
        entries.forEach(entry => {
            logs.push({
                timestamp: entry.querySelector('.timestamp')?.textContent || '',
                type: entry.dataset.type || 'log',
                message: entry.querySelector('.message')?.textContent || ''
            });
        });
        
        const exportData = {
            exported: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            logs: logs,
            networkLog: networkLog
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `console-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        log('Logs exported successfully', 'info');
        showToast('Logs exported!');
    };
    
    addTrackedEventListener(document.getElementById('exportLogs'), 'click', exportLogs);

    const handleConsoleInput = (e) => {
        // Handle autocomplete navigation
        if (!autocompleteList.classList.contains('hidden')) {
            if (e.key === 'Tab' || (e.key === 'ArrowDown' && autocompleteItems.length > 0)) {
                e.preventDefault();
                if (autocompleteItems.length > 0) {
                    autocompleteIndex = (autocompleteIndex + 1) % autocompleteItems.length;
                    updateAutocompleteSelection();
                }
                return;
            }
            if (e.key === 'ArrowUp' && autocompleteItems.length > 0) {
                e.preventDefault();
                autocompleteIndex = autocompleteIndex <= 0 ? autocompleteItems.length - 1 : autocompleteIndex - 1;
                updateAutocompleteSelection();
                return;
            }
            if (e.key === 'Enter' && autocompleteIndex >= 0) {
                e.preventDefault();
                insertAutocomplete(autocompleteItems[autocompleteIndex].text);
                return;
            }
            if (e.key === 'Escape') {
                hideAutocomplete();
                return;
            }
        } else if (e.key === 'Tab') {
            // Tab with autocomplete hidden: show suggestions if input has content
            e.preventDefault();
            const items = getAutocompleteItems(consoleInput.value);
            if (items.length > 0) {
                showAutocomplete(items);
                autocompleteIndex = 0;
                updateAutocompleteSelection();
            }
            return;
        }
        
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const code = consoleInput.value.trim();
            if (!code) return;
            
            // Add to history
            if (commandHistory[commandHistory.length - 1] !== code) {
                commandHistory.push(code);
            }
            historyIndex = commandHistory.length;
            
            log(`> ${code}`, "input");
            try {
                const result = eval(code);
                log(typeof result === 'undefined' ? 'undefined' : (typeof result === "object" ? safeStringify(result) : String(result)));
            } catch (error) {
                log(`Error: ${error.message}`, "error");
            }
            consoleInput.value = "";
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                consoleInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                consoleInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                consoleInput.value = "";
            }
        }
    };
    addTrackedEventListener(consoleInput, "keydown", handleConsoleInput);

    // Navigation functionality
    const navButtons = document.querySelectorAll(".dev-console-nav-button:not(.nav-action)");
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
    let currentCleanHtml = '';
    
    // Helper function to get clean HTML without displaying it
    const getCleanHtml = () => {
        const devConsole = document.getElementById('dev-console');
        devConsole.style.display = 'none';
        const html = document.documentElement.outerHTML;
        devConsole.style.display = '';
        
        // Remove the dev-console HTML from the output
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const parsedDevConsole = doc.getElementById('dev-console');
        if (parsedDevConsole) {
            parsedDevConsole.remove();
        }
        return doc.documentElement.outerHTML;
    };
    
    const handleElementViewer = () => {
        const elementsContainer = document.querySelector('.elements-container');
        currentCleanHtml = getCleanHtml();
        
        // Hide element inspector panels when viewing HTML
        const breadcrumb = document.getElementById('elementBreadcrumb');
        const details = document.getElementById('elementDetails');
        if (breadcrumb) breadcrumb.classList.add('hidden');
        if (details) details.classList.add('hidden');
        selectedElement = null;
        
        // Display the HTML as-is
        if (elementsContainer) {
            elementsContainer.textContent = currentCleanHtml;
        }
        log('Page HTML loaded in the Elements tab.', 'info');
    };
    addTrackedEventListener(document.getElementById('elementViewer'), 'click', handleElementViewer);
    
    // Copy HTML functionality
    const handleCopyHtml = () => {
        // Get fresh clean HTML and copy it without displaying
        const cleanHtml = getCleanHtml();
        copyToClipboard(cleanHtml);
    };
    addTrackedEventListener(document.getElementById('copyHtml'), 'click', handleCopyHtml);

    // Element Inspector functionality
    let isSelectingElement = false;
    let selectedElement = null;
    let inspectorOverlay = null;
    let inspectorLabel = null;
    let wasMinimizedBeforeSelection = false;
    
    const selectElementBtn = document.getElementById('selectElement');
    const elementBreadcrumb = document.getElementById('elementBreadcrumb');
    const elementDetails = document.getElementById('elementDetails');
    const elementTagName = document.getElementById('elementTagName');
    const elementAttributes = document.getElementById('elementAttributes');
    const elementStyles = document.getElementById('elementStyles');
    const computedStyles = document.getElementById('computedStyles');
    const computedFilterInput = document.getElementById('computedFilter');
    
    // Create inspector overlay and label
    const createInspectorElements = () => {
        if (!inspectorOverlay) {
            inspectorOverlay = document.createElement('div');
            inspectorOverlay.className = 'element-inspector-overlay';
            document.body.appendChild(inspectorOverlay);
        }
        if (!inspectorLabel) {
            inspectorLabel = document.createElement('div');
            inspectorLabel.className = 'element-inspector-label';
            document.body.appendChild(inspectorLabel);
        }
    };
    
    const removeInspectorElements = () => {
        if (inspectorOverlay) {
            inspectorOverlay.remove();
            inspectorOverlay = null;
        }
        if (inspectorLabel) {
            inspectorLabel.remove();
            inspectorLabel = null;
        }
    };
    
    const getElementSelector = (element) => {
        let selector = element.tagName.toLowerCase();
        if (element.id) {
            selector += `#${element.id}`;
        } else if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).filter(c => c && !c.startsWith('element-inspector'));
            if (classes.length > 0) {
                selector += `.${classes.slice(0, 2).join('.')}`;
            }
        }
        return selector;
    };
    
    const updateInspectorOverlay = (element) => {
        if (!element || !inspectorOverlay || !inspectorLabel) return;
        
        const rect = element.getBoundingClientRect();
        // position:fixed is relative to the viewport, so use rect coordinates directly
        inspectorOverlay.style.left = `${rect.left}px`;
        inspectorOverlay.style.top = `${rect.top}px`;
        inspectorOverlay.style.width = `${rect.width}px`;
        inspectorOverlay.style.height = `${rect.height}px`;
        
        const selector = getElementSelector(element);
        const size = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
        inspectorLabel.textContent = `${selector} (${size})`;
        
        // Position label above or below element (no scroll offset needed for fixed positioning)
        const labelTop = rect.top > 30 ? rect.top - 25 : rect.bottom + 5;
        inspectorLabel.style.left = `${Math.max(5, rect.left)}px`;
        inspectorLabel.style.top = `${labelTop}px`;
    };
    
    const hideInspectorOverlay = () => {
        if (inspectorOverlay) {
            inspectorOverlay.style.width = '0';
            inspectorOverlay.style.height = '0';
        }
        if (inspectorLabel) {
            inspectorLabel.textContent = '';
        }
    };
    
    const isDevConsoleElement = (element) => {
        const devConsole = document.getElementById('dev-console');
        return devConsole && (devConsole.contains(element) || element === devConsole || 
               element.classList.contains('element-inspector-overlay') ||
               element.classList.contains('element-inspector-label') ||
               element.classList.contains('dev-console-toast'));
    };
    
    const handleMouseMove = (e) => {
        if (!isSelectingElement) return;
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && !isDevConsoleElement(element)) {
            updateInspectorOverlay(element);
        }
    };
    
    const handleTouchMove = (e) => {
        if (!isSelectingElement) return;
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && !isDevConsoleElement(element)) {
            updateInspectorOverlay(element);
        }
    };
    
    const handleElementClick = (e) => {
        if (!isSelectingElement) return;
        
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && !isDevConsoleElement(element)) {
            e.preventDefault();
            e.stopPropagation();
            selectElement(element);
            stopSelectingElement();
        }
    };
    
    const handleTouchEnd = (e) => {
        if (!isSelectingElement) return;
        
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && !isDevConsoleElement(element)) {
            e.preventDefault();
            selectElement(element);
            stopSelectingElement();
        }
    };
    
    const startSelectingElement = () => {
        isSelectingElement = true;
        createInspectorElements();
        document.body.classList.add('selecting-element');
        selectElementBtn.classList.add('active');
        selectElementBtn.innerHTML = '❌ Cancel';
        
        // Minimize the console to allow selecting elements at the bottom
        const consoleEl = document.getElementById('dev-console');
        wasMinimizedBeforeSelection = consoleEl.classList.contains('minimized');
        if (!wasMinimizedBeforeSelection) {
            consoleEl.classList.add('minimized');
        }
        
        addTrackedEventListener(document, 'mousemove', handleMouseMove);
        addTrackedEventListener(document, 'touchmove', handleTouchMove);
        addTrackedEventListener(document, 'click', handleElementClick, true);
        addTrackedEventListener(document, 'touchend', handleTouchEnd);
        
        log('Element selection mode activated. Click on any element to inspect it.', 'info');
    };
    
    const stopSelectingElement = () => {
        isSelectingElement = false;
        document.body.classList.remove('selecting-element');
        selectElementBtn.classList.remove('active');
        selectElementBtn.innerHTML = '🎯 Select Element';
        hideInspectorOverlay();
        removeInspectorElements();
        
        // Restore the console state if it wasn't minimized before
        const consoleEl = document.getElementById('dev-console');
        if (!wasMinimizedBeforeSelection) {
            consoleEl.classList.remove('minimized');
        }
        
        removeTrackedEventListener(document, 'mousemove', handleMouseMove);
        removeTrackedEventListener(document, 'touchmove', handleTouchMove);
        removeTrackedEventListener(document, 'click', handleElementClick, true);
        removeTrackedEventListener(document, 'touchend', handleTouchEnd);
    };
    
    const toggleSelectElement = () => {
        if (isSelectingElement) {
            stopSelectingElement();
        } else {
            startSelectingElement();
        }
    };
    
    addTrackedEventListener(selectElementBtn, 'click', toggleSelectElement);
    
    // Build breadcrumb path — uses event delegation to avoid listener leaks
    let breadcrumbPathElements = [];
    
    const buildBreadcrumb = (element) => {
        elementBreadcrumb.innerHTML = '';
        elementBreadcrumb.classList.remove('hidden');
        
        const path = [];
        let current = element;
        while (current && current !== document.documentElement.parentNode) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                path.unshift(current);
            }
            current = current.parentNode;
        }
        
        // Store path for the delegated click handler
        breadcrumbPathElements = path;
        
        path.forEach((el, index) => {
            if (index > 0) {
                const sep = document.createElement('span');
                sep.className = 'breadcrumb-separator';
                sep.textContent = ' › ';
                elementBreadcrumb.appendChild(sep);
            }
            
            const item = document.createElement('span');
            item.className = 'breadcrumb-item';
            if (el === element) {
                item.classList.add('active');
            }
            item.textContent = getElementSelector(el);
            item.dataset.pathIndex = String(index);
            elementBreadcrumb.appendChild(item);
        });
    };
    
    // Single delegated listener for all breadcrumb clicks — registered once
    addTrackedEventListener(elementBreadcrumb, 'click', (e) => {
        const item = e.target.closest('.breadcrumb-item');
        if (!item) return;
        const index = parseInt(item.dataset.pathIndex, 10);
        const el = breadcrumbPathElements[index];
        if (el) selectElement(el);
    });
    
    // Display element attributes
    const displayAttributes = (element) => {
        elementAttributes.innerHTML = '';
        
        if (element.attributes.length === 0) {
            const empty = document.createElement('div');
            empty.style.color = 'var(--text-secondary)';
            empty.style.padding = '10px';
            empty.textContent = 'No attributes';
            elementAttributes.appendChild(empty);
            return;
        }
        
        Array.from(element.attributes).forEach(attr => {
            const row = document.createElement('div');
            row.className = 'attr-row';
            
            const name = document.createElement('span');
            name.className = 'attr-name';
            name.textContent = attr.name;
            
            const value = document.createElement('span');
            value.className = 'attr-value';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = attr.value;
            input.addEventListener('change', () => {
                element.setAttribute(attr.name, input.value);
                log(`Updated attribute "${attr.name}" to "${input.value}"`, 'info');
            });
            value.appendChild(input);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'attr-delete';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => {
                element.removeAttribute(attr.name);
                displayAttributes(element);
                log(`Removed attribute "${attr.name}"`, 'info');
            });
            
            row.appendChild(name);
            row.appendChild(value);
            row.appendChild(deleteBtn);
            elementAttributes.appendChild(row);
        });
    };
    
    // Display inline styles
    const displayInlineStyles = (element) => {
        elementStyles.innerHTML = '';
        
        const inlineStyle = element.style;
        const styleCount = inlineStyle.length;
        
        if (styleCount === 0) {
            const empty = document.createElement('div');
            empty.style.color = 'var(--text-secondary)';
            empty.style.padding = '10px';
            empty.textContent = 'No inline styles';
            elementStyles.appendChild(empty);
            return;
        }
        
        for (let i = 0; i < styleCount; i++) {
            const prop = inlineStyle[i];
            const value = inlineStyle.getPropertyValue(prop);
            
            const row = document.createElement('div');
            row.className = 'style-row';
            
            const propSpan = document.createElement('span');
            propSpan.className = 'style-prop';
            propSpan.textContent = prop;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'style-value';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.addEventListener('change', () => {
                element.style.setProperty(prop, input.value);
                log(`Updated style "${prop}" to "${input.value}"`, 'info');
            });
            valueSpan.appendChild(input);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'style-delete';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => {
                element.style.removeProperty(prop);
                displayInlineStyles(element);
                log(`Removed style "${prop}"`, 'info');
            });
            
            row.appendChild(propSpan);
            row.appendChild(valueSpan);
            row.appendChild(deleteBtn);
            elementStyles.appendChild(row);
        }
    };
    
    // Display computed styles
    let currentComputedFilter = '';
    
    const displayComputedStyles = (element) => {
        computedStyles.innerHTML = '';
        
        const computed = window.getComputedStyle(element);
        const allProps = Array.from(computed);
        
        const filteredProps = allProps.filter(prop => {
            if (!currentComputedFilter) return true;
            const value = computed.getPropertyValue(prop);
            return prop.toLowerCase().includes(currentComputedFilter.toLowerCase()) ||
                   value.toLowerCase().includes(currentComputedFilter.toLowerCase());
        });
        
        filteredProps.forEach(prop => {
            const value = computed.getPropertyValue(prop);
            
            const row = document.createElement('div');
            row.className = 'computed-row';
            
            const propSpan = document.createElement('span');
            propSpan.className = 'computed-prop';
            propSpan.textContent = prop;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'computed-value';
            valueSpan.textContent = value;
            
            row.appendChild(propSpan);
            row.appendChild(valueSpan);
            computedStyles.appendChild(row);
        });
    };
    
    addTrackedEventListener(computedFilterInput, 'input', (e) => {
        currentComputedFilter = e.target.value;
        if (selectedElement) {
            displayComputedStyles(selectedElement);
        }
    });
    
    // Select and display element
    const selectElement = (element) => {
        selectedElement = element;
        
        // Clear HTML view when selecting an element
        const elementsContainer = document.querySelector('.elements-container');
        if (elementsContainer) {
            elementsContainer.textContent = '';
        }
        
        // Build breadcrumb
        buildBreadcrumb(element);
        
        // Show element details panel
        elementDetails.classList.remove('hidden');
        
        // Display tag name
        const selector = getElementSelector(element);
        elementTagName.textContent = `<${selector}>`;
        
        // Display attributes
        displayAttributes(element);
        
        // Display inline styles
        displayInlineStyles(element);
        
        // Display computed styles
        displayComputedStyles(element);
        
        log(`Selected element: <${selector}>`, 'info');
    };
    
    // Close element details
    addTrackedEventListener(document.getElementById('closeElementDetails'), 'click', () => {
        elementDetails.classList.add('hidden');
        elementBreadcrumb.classList.add('hidden');
        selectedElement = null;
    });
    
    // Element details tab navigation
    const elementPanels = document.querySelectorAll('.element-panel');
    document.querySelectorAll('.element-tab-btn').forEach(btn => {
        addTrackedEventListener(btn, 'click', () => {
            document.querySelectorAll('.element-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            elementPanels.forEach(p => p.classList.add('hidden'));
            document.getElementById(btn.dataset.tab + 'Panel').classList.remove('hidden');
        });
    });
    
    // Add new attribute
    addTrackedEventListener(document.getElementById('addAttribute'), 'click', () => {
        if (!selectedElement) return;
        
        const nameInput = document.getElementById('newAttrName');
        const valueInput = document.getElementById('newAttrValue');
        const name = nameInput.value.trim();
        const value = valueInput.value;
        
        if (name) {
            selectedElement.setAttribute(name, value);
            displayAttributes(selectedElement);
            nameInput.value = '';
            valueInput.value = '';
            log(`Added attribute "${name}=${value}"`, 'info');
        }
    });
    
    // Add new style
    addTrackedEventListener(document.getElementById('addStyle'), 'click', () => {
        if (!selectedElement) return;
        
        const propInput = document.getElementById('newStyleProp');
        const valueInput = document.getElementById('newStyleValue');
        const prop = propInput.value.trim();
        const value = valueInput.value.trim();
        
        if (prop && value) {
            selectedElement.style.setProperty(prop, value);
            displayInlineStyles(selectedElement);
            propInput.value = '';
            valueInput.value = '';
            log(`Added style "${prop}: ${value}"`, 'info');
        }
    });
    
    // Edit element text
    addTrackedEventListener(document.getElementById('editElementText'), 'click', async () => {
        if (!selectedElement) return;
        
        const currentText = selectedElement.textContent;
        const newText = await showPrompt('Edit Element Text', currentText, 'Enter new text content...');
        
        if (newText !== null) {
            selectedElement.textContent = newText;
            log('Updated element text content', 'info');
        }
    });
    
    // Delete element
    addTrackedEventListener(document.getElementById('deleteElement'), 'click', async () => {
        if (!selectedElement) return;
        
        const selector = getElementSelector(selectedElement);
        const confirmed = await showConfirm(
            'Delete Element',
            `Are you sure you want to delete <${selector}>?`,
            true
        );
        
        if (confirmed) {
            selectedElement.remove();
            selectedElement = null;
            elementDetails.classList.add('hidden');
            elementBreadcrumb.classList.add('hidden');
            log(`Deleted element <${selector}>`, 'info');
        }
    });
    
    // Copy element HTML
    addTrackedEventListener(document.getElementById('copyElementHtml'), 'click', () => {
        if (!selectedElement) return;
        copyToClipboard(selectedElement.outerHTML);
    });

    // Network monitoring functionality
    const networkContainer = document.querySelector('.network-container');
    const networkDetails = document.querySelector('.network-details');
    let networkLog = [];
    let networkFilterText = '';

    const addNetworkEntry = (entry) => {
        // Memory management: remove oldest entries if over limit
        if (networkLog.length >= MAX_NETWORK_ENTRIES) {
            networkLog.shift();
        }
        networkLog.push(entry);
        updateNetworkDisplay();
    };
    
    const getStatusClass = (status) => {
        if (status === 'Error' || status === 'Aborted' || status >= 400) return 'error';
        if (status >= 300) return 'redirect';
        return 'success';
    };

    const updateNetworkDisplay = () => {
        networkContainer.innerHTML = '';
        const filteredLog = networkLog.filter(entry => {
            if (!networkFilterText) return true;
            return entry.url.toLowerCase().includes(networkFilterText.toLowerCase()) ||
                   entry.method.toLowerCase().includes(networkFilterText.toLowerCase());
        });
        
        if (filteredLog.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'storage-empty';
            empty.textContent = networkLog.length === 0 ? 'No network requests captured yet' : 'No matching requests';
            networkContainer.appendChild(empty);
            return;
        }
        
        filteredLog.forEach((entry, index) => {
            const actualIndex = networkLog.indexOf(entry);
            const item = document.createElement('div');
            item.className = 'network-item';
            
            // Create header with method and status
            const header = document.createElement('div');
            header.className = 'network-item-header';
            
            const methodSpan = document.createElement('span');
            methodSpan.className = 'network-item-method';
            methodSpan.textContent = entry.method;
            
            const statusSpan = document.createElement('span');
            statusSpan.className = `network-item-status ${getStatusClass(entry.status)}`;
            statusSpan.textContent = entry.status;
            
            header.appendChild(methodSpan);
            header.appendChild(statusSpan);
            
            // Create URL display
            const urlSpan = document.createElement('div');
            urlSpan.className = 'network-item-url';
            urlSpan.textContent = entry.url;
            
            // Create details elements safely using textContent
            const details = document.createElement('div');
            details.className = 'network-item-details';
            
            const typeSpan = document.createElement('span');
            typeSpan.textContent = `Type: ${entry.type}`;
            const timeSpan = document.createElement('span');
            timeSpan.textContent = `${entry.time}ms`;
            
            details.appendChild(typeSpan);
            details.appendChild(timeSpan);
            
            item.appendChild(header);
            item.appendChild(urlSpan);
            item.appendChild(details);
            item.addEventListener('click', () => showNetworkDetails(actualIndex));
            networkContainer.appendChild(item);
        });
    };

    // Network filter
    const networkFilterInput = document.getElementById('networkFilter');
    addTrackedEventListener(networkFilterInput, 'input', (e) => {
        networkFilterText = e.target.value;
        updateNetworkDisplay();
    });

    const showNetworkDetails = (index) => {
        const entry = networkLog[index];
        
        // Build content safely
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.innerHTML = '← Back to Network List';
        backButton.addEventListener('click', () => {
            networkDetails.classList.add('hidden');
            networkContainer.classList.remove('hidden');
        });
        
        const heading = document.createElement('h3');
        heading.textContent = 'Request Details';
        heading.style.margin = '0 0 10px 0';
        heading.style.color = themeVars.text;
        
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
        // args[0] may be a string URL or a Request object
        const isRequestObj = args[0] instanceof Request;
        const requestUrl = isRequestObj ? args[0].url : String(args[0]);
        const requestOptions = isRequestObj ? args[0] : (args[1] || {});
        const requestMethod = (isRequestObj ? args[0].method : args[1]?.method) || 'GET';

        try {
            let requestBody = 'No request body';
            if (requestOptions.body) {
                if (typeof requestOptions.body === 'string') {
                    requestBody = requestOptions.body;
                } else if (requestOptions.body instanceof FormData) {
                    requestBody = '[FormData]';
                } else if (requestOptions.body instanceof URLSearchParams) {
                    requestBody = requestOptions.body.toString();
                } else if (requestOptions.body instanceof Blob) {
                    requestBody = '[Blob]';
                } else {
                    try {
                        requestBody = safeStringify(requestOptions.body);
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
                url: requestUrl,
                method: requestMethod,
                status: response.status,
                type: 'fetch',
                time: time.toFixed(2),
                requestHeaders: requestOptions.headers || {},
                requestBody: requestBody,
                responseHeaders: Object.fromEntries(response.headers.entries()),
                responseBody: responseBody
            });
            return response;
        } catch (error) {
            addNetworkEntry({
                url: requestUrl,
                method: requestMethod,
                status: 'Error',
                type: 'fetch',
                time: (performance.now() - start).toFixed(2),
                requestHeaders: requestOptions.headers || {},
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
    
    const handleXHRResponse = function(statusOverride) {
        if (!this._networkInfo) return;
        
        const time = performance.now() - this._networkInfo.start;
        let requestBody = 'No request body';
        if (this._networkInfo.body) {
            if (typeof this._networkInfo.body === 'string') {
                requestBody = this._networkInfo.body;
            } else if (this._networkInfo.body instanceof FormData) {
                requestBody = '[FormData]';
            } else if (this._networkInfo.body instanceof URLSearchParams) {
                requestBody = this._networkInfo.body.toString();
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
        const isAbnormal = statusOverride !== undefined;
        addNetworkEntry({
            url: this._networkInfo.url,
            method: this._networkInfo.method,
            status: isAbnormal ? statusOverride : this.status,
            type: 'xhr',
            time: time.toFixed(2),
            requestHeaders: this._networkInfo.requestHeaders,
            requestBody: requestBody,
            responseHeaders: isAbnormal ? {} : parseResponseHeaders(this.getAllResponseHeaders()),
            responseBody: statusOverride === 'Error' ? 'Network Error' :
                          statusOverride === 'Aborted' ? 'Request Aborted' :
                          this.responseText
        });
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (this._networkInfo) {
            this._networkInfo.body = body;
        }
        this.addEventListener('load', function() {
            handleXHRResponse.call(this);
        });
        this.addEventListener('error', function() {
            handleXHRResponse.call(this, 'Error');
        });
        this.addEventListener('abort', function() {
            handleXHRResponse.call(this, 'Aborted');
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
        showToast("Cookies cleared");
    };
    addTrackedEventListener(document.getElementById("clearCookies"), "click", handleClearCookies);

    const handleClearStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
        log("Local and Session storage cleared", "info");
        showToast("Storage cleared");
        updateStorageDisplay();
    };
    addTrackedEventListener(document.getElementById("clearStorage"), "click", handleClearStorage);

    const handleReloadPage = () => {
        window.location.reload();
    };
    addTrackedEventListener(document.getElementById("reloadPage"), "click", handleReloadPage);

    // Storage Viewer functionality
    const storageContainer = document.querySelector('.storage-container');
    let currentStorageType = 'local';
    
    const updateStorageDisplay = () => {
        const storage = currentStorageType === 'local' ? localStorage : sessionStorage;
        storageContainer.innerHTML = '';
        
        if (storage.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'storage-empty';
            empty.textContent = `No items in ${currentStorageType}Storage`;
            storageContainer.appendChild(empty);
            return;
        }
        
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            const value = storage.getItem(key);
            
            const item = document.createElement('div');
            item.className = 'storage-item';
            
            const keySpan = document.createElement('span');
            keySpan.className = 'key';
            keySpan.textContent = key;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'value';
            // Try to format JSON values
            try {
                const parsed = JSON.parse(value);
                valueSpan.textContent = safeStringify(parsed);
            } catch {
                valueSpan.textContent = value;
            }
            
            const actions = document.createElement('div');
            actions.className = 'actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.addEventListener('click', () => {
                storage.removeItem(key);
                updateStorageDisplay();
                log(`Removed "${key}" from ${currentStorageType}Storage`, 'info');
            });
            
            actions.appendChild(deleteBtn);
            item.appendChild(keySpan);
            item.appendChild(valueSpan);
            item.appendChild(actions);
            storageContainer.appendChild(item);
        }
    };
    
    // Storage tab buttons
    document.querySelectorAll('.storage-tab-btn').forEach(btn => {
        addTrackedEventListener(btn, 'click', () => {
            document.querySelectorAll('.storage-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStorageType = btn.dataset.storage;
            updateStorageDisplay();
        });
    });
    
    addTrackedEventListener(document.getElementById('refreshStorage'), 'click', updateStorageDisplay);
    
    // Initialize storage display when tab is clicked
    addTrackedEventListener(document.getElementById('navStorage'), 'click', updateStorageDisplay);

    // Cookies Viewer functionality
    const cookiesContainer = document.querySelector('.cookies-container');
    let cookieFilterText = '';
    
    // Parse cookies into an array of objects
    const parseCookies = () => {
        const cookies = [];
        if (!document.cookie) return cookies;
        
        document.cookie.split(';').forEach(cookie => {
            const [name, ...valueParts] = cookie.trim().split('=');
            if (name) {
                cookies.push({
                    name: name.trim(),
                    value: valueParts.join('=') || ''
                });
            }
        });
        
        return cookies;
    };
    
    // Helper function to clear a cookie with multiple path attempts
    const clearCookie = (cookieName) => {
        const paths = ['/', '', window.location.pathname];
        const domain = window.location.hostname;
        const expiry = new Date(0).toUTCString();
        
        paths.forEach(path => {
            // Try without domain
            document.cookie = `${cookieName}=;expires=${expiry};path=${path}`;
            // Try with domain
            document.cookie = `${cookieName}=;expires=${expiry};path=${path};domain=${domain}`;
            // Try with domain starting with dot (for subdomains)
            if (domain.indexOf('.') !== -1) {
                document.cookie = `${cookieName}=;expires=${expiry};path=${path};domain=.${domain}`;
            }
        });
    };
    
    const updateCookiesDisplay = () => {
        const cookies = parseCookies();
        cookiesContainer.innerHTML = '';
        
        const filteredCookies = cookies.filter(cookie => {
            if (!cookieFilterText) return true;
            return cookie.name.toLowerCase().includes(cookieFilterText.toLowerCase()) ||
                   cookie.value.toLowerCase().includes(cookieFilterText.toLowerCase());
        });
        
        if (filteredCookies.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'storage-empty';
            empty.textContent = cookies.length === 0 ? 'No cookies found' : 'No matching cookies';
            cookiesContainer.appendChild(empty);
            return;
        }
        
        filteredCookies.forEach(cookie => {
            const item = document.createElement('div');
            item.className = 'cookie-item';
            
            const header = document.createElement('div');
            header.className = 'cookie-item-header';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'name';
            nameSpan.textContent = cookie.name;
            
            const actions = document.createElement('div');
            actions.className = 'actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = '✏️ Edit';
            editBtn.addEventListener('click', async () => {
                const newValue = await showPrompt(`Edit Cookie: ${cookie.name}`, cookie.value, 'Enter new value...');
                if (newValue !== null) {
                    document.cookie = `${cookie.name}=${newValue};path=/`;
                    updateCookiesDisplay();
                    log(`Updated cookie "${cookie.name}"`, 'info');
                }
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑';
            deleteBtn.addEventListener('click', async () => {
                const confirmed = await showConfirm('Delete Cookie', `Are you sure you want to delete "${cookie.name}"?`, true);
                if (confirmed) {
                    clearCookie(cookie.name);
                    updateCookiesDisplay();
                    log(`Deleted cookie "${cookie.name}"`, 'info');
                }
            });
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            header.appendChild(nameSpan);
            header.appendChild(actions);
            
            const valueSpan = document.createElement('div');
            valueSpan.className = 'value';
            // Try to decode and format the value
            try {
                const decoded = decodeURIComponent(cookie.value);
                try {
                    const parsed = JSON.parse(decoded);
                    valueSpan.textContent = safeStringify(parsed);
                } catch {
                    valueSpan.textContent = decoded;
                }
            } catch {
                valueSpan.textContent = cookie.value;
            }
            
            item.appendChild(header);
            item.appendChild(valueSpan);
            cookiesContainer.appendChild(item);
        });
    };
    
    // Cookie filter
    const cookieFilterInput = document.getElementById('cookieFilter');
    addTrackedEventListener(cookieFilterInput, 'input', (e) => {
        cookieFilterText = e.target.value;
        updateCookiesDisplay();
    });
    
    // Refresh cookies button
    addTrackedEventListener(document.getElementById('refreshCookies'), 'click', updateCookiesDisplay);
    
    // Add cookie button
    addTrackedEventListener(document.getElementById('addCookie'), 'click', async () => {
        const name = await showPrompt('Add Cookie - Name', '', 'Enter cookie name...');
        if (!name) return;
        
        const value = await showPrompt('Add Cookie - Value', '', 'Enter cookie value...');
        if (value === null) return;
        
        document.cookie = `${name}=${encodeURIComponent(value)};path=/`;
        updateCookiesDisplay();
        log(`Added cookie "${name}"`, 'info');
        showToast('Cookie added!');
    });
    
    // Clear all cookies button
    addTrackedEventListener(document.getElementById('clearAllCookies'), 'click', async () => {
        const confirmed = await showConfirm('Clear All Cookies', 'Are you sure you want to delete all cookies?', true);
        if (confirmed) {
            document.cookie.split(";").forEach((cookie) => {
                const cookieName = cookie.split('=')[0].trim();
                if (cookieName) {
                    clearCookie(cookieName);
                }
            });
            updateCookiesDisplay();
            log('All cookies cleared', 'info');
            showToast('All cookies cleared!');
        }
    });
    
    // Initialize cookies display when tab is clicked
    addTrackedEventListener(document.getElementById('navCookies'), 'click', updateCookiesDisplay);

    // Info tab navigation
    const infoPanels = document.querySelectorAll('.info-panel');
    document.querySelectorAll('.info-tab-btn').forEach(btn => {
        addTrackedEventListener(btn, 'click', () => {
            document.querySelectorAll('.info-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            infoPanels.forEach(p => p.classList.add('hidden'));
            document.getElementById(btn.dataset.info + 'Info').classList.remove('hidden');
        });
    });

    // About Info - improved design
    const aboutInfo = document.getElementById("aboutInfo");
    aboutInfo.innerHTML = `
        <div class="about-logo">🛠️</div>
        <div class="about-title">Mobile Dev Console</div>
        <div class="about-version">v2.1.0</div>
        <p style="color: var(--text-secondary); margin: 10px 0;">A lightweight in-browser developer console for mobile web debugging</p>
        <p style="color: var(--text); margin: 10px 0;">Created by <strong>Saksham Shekher</strong></p>
        <div class="about-links">
            <a href="https://github.com/OshekharO" target="_blank" rel="noopener noreferrer" class="about-link">GitHub</a>
            <a href="https://github.com/OshekharO/Mobile-Console" target="_blank" rel="noopener noreferrer" class="about-link">Repository</a>
        </div>
    `;

    // Device Info - improved design with cards
    const deviceInfo = document.getElementById("deviceInfo");
    
    const createInfoCard = (title, items) => {
        const card = document.createElement('div');
        card.className = 'info-card';
        const cardTitle = document.createElement('h4');
        cardTitle.textContent = title;
        card.appendChild(cardTitle);
        
        items.forEach(([label, value]) => {
            const row = document.createElement('div');
            row.className = 'info-row';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'label';
            labelSpan.textContent = label;
            const valueSpan = document.createElement('span');
            valueSpan.className = 'value';
            valueSpan.textContent = value;
            row.appendChild(labelSpan);
            row.appendChild(valueSpan);
            card.appendChild(row);
        });
        
        return card;
    };
    
    // Browser info
    deviceInfo.appendChild(createInfoCard('Browser', [
        ['User Agent', navigator.userAgent],
        ['Platform', navigator.platform],
        ['Language', navigator.language],
        ['Cookies Enabled', navigator.cookieEnabled ? 'Yes' : 'No'],
        ['Online', navigator.onLine ? 'Yes' : 'No']
    ]));
    
    // Display info
    deviceInfo.appendChild(createInfoCard('Display', [
        ['Screen Size', `${window.screen.width} × ${window.screen.height}`],
        ['Viewport Size', `${window.innerWidth} × ${window.innerHeight}`],
        ['Color Depth', `${window.screen.colorDepth}-bit`],
        ['Pixel Ratio', window.devicePixelRatio],
        ['Orientation', window.screen.orientation?.type || 'N/A']
    ]));
    
    // Connection info (if available)
    if (navigator.connection) {
        deviceInfo.appendChild(createInfoCard('Connection', [
            ['Type', navigator.connection.effectiveType || 'N/A'],
            ['Downlink', `${navigator.connection.downlink || 'N/A'} Mbps`],
            ['RTT', `${navigator.connection.rtt || 'N/A'} ms`],
            ['Save Data', navigator.connection.saveData ? 'Enabled' : 'Disabled']
        ]));
    }

    // Performance Info
    const performanceInfo = document.getElementById("performanceInfo");
    
    const updatePerformanceMetrics = () => {
        performanceInfo.innerHTML = '';
        
        // Prefer Navigation Timing Level 2; fall back to deprecated Level 1
        const nt2 = performance.getEntriesByType?.('navigation')?.[0];
        const timing = performance.timing;
        const firstPaint = performance.getEntriesByType?.('paint')?.[0]?.startTime || 0;

        const navTiming = nt2 ? {
            loadTime:     nt2.loadEventEnd,
            domReady:     nt2.domContentLoadedEventEnd,
            firstPaint,
            dnsLookup:    nt2.domainLookupEnd - nt2.domainLookupStart,
            tcpConnect:   nt2.connectEnd - nt2.connectStart,
            responseTime: nt2.responseEnd - nt2.requestStart
        } : timing ? {
            loadTime:     timing.loadEventEnd - timing.navigationStart,
            domReady:     timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint,
            dnsLookup:    timing.domainLookupEnd - timing.domainLookupStart,
            tcpConnect:   timing.connectEnd - timing.connectStart,
            responseTime: timing.responseEnd - timing.requestStart
        } : null;

        if (navTiming) {
            const createMetric = (icon, label, value, maxValue, unit = 'ms') => {
                const metric = document.createElement('div');
                metric.className = 'perf-metric';
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'metric-icon';
                iconSpan.textContent = icon;
                
                const info = document.createElement('div');
                info.className = 'metric-info';
                
                const labelEl = document.createElement('div');
                labelEl.className = 'metric-label';
                labelEl.textContent = label;
                
                const valueEl = document.createElement('div');
                valueEl.className = 'metric-value';
                valueEl.textContent = value > 0 ? `${value.toFixed(0)}${unit}` : 'N/A';
                
                const bar = document.createElement('div');
                bar.className = 'perf-bar';
                const fill = document.createElement('div');
                fill.className = 'perf-bar-fill';
                const percent = Math.min(100, (value / maxValue) * 100);
                fill.style.width = `${percent}%`;
                fill.classList.add(percent < 33 ? 'good' : percent < 66 ? 'warning' : 'bad');
                bar.appendChild(fill);
                
                info.appendChild(labelEl);
                info.appendChild(valueEl);
                info.appendChild(bar);
                
                metric.appendChild(iconSpan);
                metric.appendChild(info);
                
                return metric;
            };
            
            performanceInfo.appendChild(createInfoCard('Page Load Metrics', []));
            const card = performanceInfo.querySelector('.info-card');
            card.appendChild(createMetric('⏱️', 'Page Load Time', navTiming.loadTime, 5000));
            card.appendChild(createMetric('📄', 'DOM Ready', navTiming.domReady, 3000));
            card.appendChild(createMetric('🎨', 'First Paint', navTiming.firstPaint, 2000));
            card.appendChild(createMetric('🔗', 'DNS Lookup', navTiming.dnsLookup, 500));
            card.appendChild(createMetric('🤝', 'TCP Connection', navTiming.tcpConnect, 500));
            card.appendChild(createMetric('⬇️', 'Response Time', navTiming.responseTime, 2000));
        }
        
        // Memory info (Chrome only)
        if (performance.memory) {
            performanceInfo.appendChild(createInfoCard('Memory', [
                ['Used JS Heap', `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`],
                ['Total JS Heap', `${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB`],
                ['Heap Limit', `${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`]
            ]));
        }
    };
    
    // Update performance when tab is clicked
    addTrackedEventListener(document.getElementById('navInfo'), 'click', updatePerformanceMetrics);
    
    // Theme toggle functionality
    const handleThemeToggle = () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        themeVars = getThemeVars(theme);
        style.textContent = getConsoleStyles(themeVars);
        document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
        log(`Theme switched to ${theme} mode`, 'info');
    };
    addTrackedEventListener(document.getElementById('themeToggle'), 'click', handleThemeToggle);
    
    // Resize handle functionality
    const resizeHandle = document.getElementById('resizeHandle');
    const consoleEl = document.getElementById('dev-console');
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    
    const startResize = (e) => {
        isResizing = true;
        startY = e.clientY || e.touches?.[0]?.clientY;
        startHeight = consoleEl.offsetHeight;
        document.body.style.userSelect = 'none';
    };
    
    const doResize = (e) => {
        if (!isResizing) return;
        e.preventDefault(); // Prevent page scroll while resizing on touch
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        const delta = startY - clientY;
        const newHeight = Math.max(MIN_CONSOLE_HEIGHT, Math.min(window.innerHeight * MAX_CONSOLE_HEIGHT_PERCENT / 100, startHeight + delta));
        consoleEl.style.height = `${newHeight}px`;
    };
    
    const stopResize = () => {
        isResizing = false;
        document.body.style.userSelect = '';
    };
    
    addTrackedEventListener(resizeHandle, 'mousedown', startResize);
    addTrackedEventListener(resizeHandle, 'touchstart', startResize, { passive: false });
    addTrackedEventListener(document, 'mousemove', doResize);
    addTrackedEventListener(document, 'touchmove', doResize, { passive: false });
    addTrackedEventListener(document, 'mouseup', stopResize);
    addTrackedEventListener(document, 'touchend', stopResize);

    // Cleanup function for removing event listeners and restoring originals
    const cleanup = () => {
        // Remove all tracked event listeners
        eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        eventListeners.length = 0;
        
        // Clean up element inspector
        if (isSelectingElement) {
            stopSelectingElement();
        }
        removeInspectorElements();
        document.body.classList.remove('selecting-element');
        
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

    const minimizeButton = document.getElementById('consoleMinimize');
    const minimizeIcon = minimizeButton.querySelector('.nav-icon');

    let isMinimized = false;

    function toggleConsole() {
        isMinimized = !isMinimized;
        consoleEl.classList.toggle('minimized', isMinimized);
        minimizeIcon.textContent = isMinimized ? '+' : '−';
        if (!isMinimized) {
            const consoleTab = document.getElementById('navConsole');
            consoleTab.click();
        }
    }

    addTrackedEventListener(minimizeButton, 'click', toggleConsole);
    
    // Global keyboard shortcuts
    const handleGlobalKeydown = (e) => {
        // Don't handle shortcuts if user is typing in an input
        const activeEl = document.activeElement;
        const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        
        // Escape key - minimize console
        if (e.key === 'Escape' && !isTyping) {
            if (!isMinimized) {
                toggleConsole();
            }
            return;
        }
        
        // Ctrl/Cmd + K - clear console
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            clearConsole();
            return;
        }
        
        // Ctrl/Cmd + Shift + C - toggle console visibility
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            toggleConsole();
            return;
        }
        
        // Ctrl/Cmd + Shift + E - export logs
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            exportLogs();
            return;
        }
    };
    
    addTrackedEventListener(document, 'keydown', handleGlobalKeydown);
    
    log("Mobile Dev Console v2.1.0 initialized", "info");
    log("Shortcuts: Escape to minimize • Cmd/Ctrl+K to clear • Tab for autocomplete", "info");
})();
