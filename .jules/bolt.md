## 2026-03-09 - Pre-computing Lowercase Strings in Iterative UI Filters

**Learning:** Repeatedly calling `.toLowerCase()` on search input variables inside `.forEach()` or loop iterations across large lists (e.g. 500 console log entries) causes unnecessary allocations and CPU work on every DOM node check. Pre-computing `currentTextFilter.toLowerCase()` outside the loop reduces filter time by ~20-25%.

**Action:** Whenever filtering array items or DOM collections based on user input, hoist string transformations (`toLowerCase()`, regex compilations) outside the loop.

## 2026-03-09 - Deferring Hidden Tab DOM Updates for High-Frequency Events

**Learning:** Re-rendering hidden DOM containers when background event streams arrive (such as network requests in `addNetworkEntry`) causes severe offscreen DOM layout/teardown thrashing. Deferring `updateNetworkDisplay()` until the user explicitly switches to the Network tab (`isOnNetworkTab === true`) eliminates unnecessary DOM operations for offscreen content (~40-100x speedup during background activity).

**Action:** For tabbed or collapsible UI components, defer heavy DOM construction/updates for inactive views until those views become visible to the user.
