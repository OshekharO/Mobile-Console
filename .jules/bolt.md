## 2026-04-04 - Defer DOM rendering for inactive tab logs
**Learning:** In dev console tools that capture continuous events (such as network requests or background logs), updating the DOM on every single event while the user is viewing another tab causes unnecessary layout recalculations and DOM operations.
**Action:** Always check tab visibility state before triggering DOM re-renders for continuous background logs, deferring full container DOM rebuilds until the user actually switches to that tab.
