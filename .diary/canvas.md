## 2025-05-20 - Bookmarklet Design Tokens & CSS Variable Encapsulation

**Learning:** In a single-file, in-browser mobile debugging bookmarklet (`main.js`) with CSS-in-JS injection, hardcoded hex values in badges/type tags bypass light/dark theme adaptation. Extending `getThemeVars` with semantic background/color tokens (`errorBg`, `warningBg`, `infoBg`, `successBg`, `purpleBg`, `purpleText`) and exposing them as CSS variables (`--error-bg`, `--font-mono`, etc.) on `.dev-console-container` enables theme-aware badge rendering across light and dark modes without inline DOM style manipulation.

**Action:** Whenever adding new visual badges or typography rules in `main.js`, always declare the semantic token in `getThemeVars` and reference the CSS custom variable (e.g. `var(--info-bg)`, `var(--font-mono)`) inside `getConsoleStyles`.
