(() => {
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
    
    // Console command history
    const commandHistory = [];
    let historyIndex = -1;
    
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
        }, 2);
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
                        <textarea id="consoleInput" placeholder="Enter JavaScript... (↑↓ for history)"></textarea>
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
        borderDark: '#d1d5db',
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
        borderDark: '#1e293b',
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
        }
        #consoleInput:focus {
            border-color: var(--accent);
        }
        
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

    const handleConsoleInput = (e) => {
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
        currentCleanHtml = doc.documentElement.outerHTML;
        
        // Display the HTML as-is
        elementsContainer.textContent = currentCleanHtml;
        log('Page HTML loaded in the Elements tab.', 'info');
    };
    addTrackedEventListener(document.getElementById('elementViewer'), 'click', handleElementViewer);
    
    // Copy HTML functionality
    const handleCopyHtml = () => {
        if (!currentCleanHtml) {
            handleElementViewer();
        }
        copyToClipboard(currentCleanHtml);
    };
    addTrackedEventListener(document.getElementById('copyHtml'), 'click', handleCopyHtml);

    // Element Inspector functionality
    let isSelectingElement = false;
    let selectedElement = null;
    let inspectorOverlay = null;
    let inspectorLabel = null;
    
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
        inspectorOverlay.style.left = `${rect.left + window.scrollX}px`;
        inspectorOverlay.style.top = `${rect.top + window.scrollY}px`;
        inspectorOverlay.style.width = `${rect.width}px`;
        inspectorOverlay.style.height = `${rect.height}px`;
        
        const selector = getElementSelector(element);
        const size = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
        inspectorLabel.textContent = `${selector} (${size})`;
        
        // Position label above or below element
        const labelTop = rect.top > 30 ? rect.top + window.scrollY - 25 : rect.bottom + window.scrollY + 5;
        inspectorLabel.style.left = `${Math.max(5, rect.left + window.scrollX)}px`;
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
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('click', handleElementClick, true);
        document.removeEventListener('touchend', handleTouchEnd);
    };
    
    const toggleSelectElement = () => {
        if (isSelectingElement) {
            stopSelectingElement();
        } else {
            startSelectingElement();
        }
    };
    
    addTrackedEventListener(selectElementBtn, 'click', toggleSelectElement);
    
    // Build breadcrumb path
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
            item.addEventListener('click', () => selectElement(el));
            elementBreadcrumb.appendChild(item);
        });
    };
    
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
    addTrackedEventListener(document.getElementById('editElementText'), 'click', () => {
        if (!selectedElement) return;
        
        const currentText = selectedElement.textContent;
        const newText = prompt('Edit element text content:', currentText);
        
        if (newText !== null) {
            selectedElement.textContent = newText;
            log('Updated element text content', 'info');
        }
    });
    
    // Delete element
    addTrackedEventListener(document.getElementById('deleteElement'), 'click', () => {
        if (!selectedElement) return;
        
        const selector = getElementSelector(selectedElement);
        if (confirm(`Are you sure you want to delete <${selector}>?`)) {
            const parent = selectedElement.parentNode;
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
        if (status === 'Error' || status >= 400) return 'error';
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
        <div class="about-version">v2.0.0</div>
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
        
        if (window.performance && performance.timing) {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
            const firstPaint = performance.getEntriesByType?.('paint')?.[0]?.startTime || 0;
            
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
            card.appendChild(createMetric('⏱️', 'Page Load Time', loadTime, 5000));
            card.appendChild(createMetric('📄', 'DOM Ready', domReady, 3000));
            card.appendChild(createMetric('🎨', 'First Paint', firstPaint, 2000));
            card.appendChild(createMetric('🔗', 'DNS Lookup', timing.domainLookupEnd - timing.domainLookupStart, 500));
            card.appendChild(createMetric('🤝', 'TCP Connection', timing.connectEnd - timing.connectStart, 500));
            card.appendChild(createMetric('⬇️', 'Response Time', timing.responseEnd - timing.requestStart, 2000));
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
    addTrackedEventListener(resizeHandle, 'touchstart', startResize);
    addTrackedEventListener(document, 'mousemove', doResize);
    addTrackedEventListener(document, 'touchmove', doResize);
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

    const consoleContainer = document.getElementById('dev-console');
    const minimizeButton = document.getElementById('consoleMinimize');
    const minimizeIcon = minimizeButton.querySelector('.nav-icon');

    let isMinimized = false;

    function toggleConsole() {
        isMinimized = !isMinimized;
        consoleContainer.classList.toggle('minimized', isMinimized);
        minimizeIcon.textContent = isMinimized ? '+' : '−';
        if (!isMinimized) {
            const consoleTab = document.getElementById('navConsole');
            consoleTab.click();
        }
    }

    addTrackedEventListener(minimizeButton, 'click', toggleConsole);
    
    log("Mobile Dev Console v2.0 initialized", "info");
    log("Drag the top handle to resize • Use ↑↓ keys for command history", "info");
})();
