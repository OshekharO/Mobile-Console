# Mobile Console

A lightweight, in-browser developer console designed specifically for mobile web development and debugging.

## Features

- **Console**: Execute JavaScript code and view logs directly in the browser.
- **Elements**: View and edit the HTML structure of the current page.
- **Network**: Monitor and inspect network requests.
- **Info**: View device information and perform common tasks.
- **Theming**: Automatically adapts to light and dark modes.

## Usage

To use the Mobile Developer Console, you can create a bookmarklet with the following code:

```javascript
javascript:(function(){var script=document.createElement('script');script.src='https://raw.githack.com/OshekharO/Mobile-Console/main/main.js';document.body.appendChild(script);})();
```

## Customization

You can customize the console by modifying the CSS styles in the script. The console automatically detects and adapts to light and dark color schemes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
