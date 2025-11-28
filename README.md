# Mobile Console

A lightweight, in-browser developer console designed specifically for mobile web development and debugging. No installation required – just add a bookmarklet and debug any website on your mobile device!

## ✨ Features

### Console Tab
- Execute JavaScript code directly in the browser
- View console logs (log, error, warn, info) with color-coded badges
- Filter logs by type (All, Log, Error, Warn, Info) or search by text
- Command history navigation with ↑/↓ arrow keys
- Copy individual log entries to clipboard
- Clear console with one click

### Elements Tab
- View the complete HTML structure of the current page
- Copy the entire HTML to clipboard
- Clean output excludes the dev console itself

### Network Tab
- Monitor all Fetch and XMLHttpRequest network requests
- View request/response details including headers and body
- Filter requests by URL or method
- Color-coded status indicators (success, redirect, error)
- Track request timing

### Storage Tab
- Inspect localStorage and sessionStorage
- View, copy, and delete individual storage items
- Switch between storage types with tabs
- JSON values are automatically formatted

### Info Tab
- **Device Info**: User agent, platform, language, screen size, viewport, orientation
- **Performance Metrics**: Page load time, DOM ready, first paint, DNS lookup, TCP connection, response time
- **About**: Version info and project links

### General Features
- 🎨 **Theme Toggle**: Switch between light and dark modes (auto-detects system preference)
- 📐 **Resizable**: Drag the top handle to resize the console height
- ➖ **Minimize**: Collapse the console to a minimal navigation bar
- 🍪 **Quick Actions**: Clear cookies, clear storage, reload page

## 🚀 Usage

### Create a Bookmarklet

1. Create a new bookmark in your browser
2. Name it "Mobile Console" (or any name you prefer)
3. Paste the following code as the URL:

```javascript
javascript:(function(){var script=document.createElement('script');script.src='https://raw.githack.com/OshekharO/Mobile-Console/main/main.js';document.body.appendChild(script);})();
```

4. Save the bookmark
5. Navigate to any website and tap/click the bookmarklet to launch the console

> **Note**: The bookmarklet loads the script from GitHub via raw.githack.com CDN. For security-sensitive environments, consider self-hosting the `main.js` file.

### Tips
- Use ↑ and ↓ arrow keys to navigate through command history
- Drag the handle at the top of the console to resize
- Click the minimize button (−) to collapse the console
- Click the theme toggle (◐) to switch between light and dark modes

## 🎨 Customization

The console automatically detects and adapts to your system's light or dark color scheme. You can also manually toggle the theme using the theme button in the navigation bar.

For advanced customization, you can modify the CSS variables in the `getThemeVars` function within `main.js`.

## 🔄 Alternatives

If you prefer other mobile debugging tools, here are some popular alternatives:

### vConsole

```javascript
javascript:(function() {
    var script = document.createElement('script');
    script.src = "https://unpkg.com/vconsole@latest/dist/vconsole.min.js";
    document.body.appendChild(script);
    script.onload = function() {
        var vConsole = new window.VConsole();
    };
})();
```

### Eruda

```javascript
javascript:(function () { var script = document.createElement('script'); script.src="https://cdn.jsdelivr.net/npm/eruda@3.4.3/eruda.min.js"; document.body.append(script); script.onload = function () { eruda.init(); } })();
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
