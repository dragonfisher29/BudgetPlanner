# Budget Planner

A lightweight browser-based budget planner built with HTML, CSS, and JavaScript.

## Overview

This project helps users manage monthly budgets, fixed expenses, and flexible spending in a clean dashboard UI. It supports:

- multiple budget profiles (`Default`, `Holiday Planning`, `Summer Vacation`)
- monthly budget allocation and fixed expense tracking
- flexible spending control via slider and manual input
- savings target percentage sync with flexible spending
- live expense breakdown chart using Chart.js
- persistency via `localStorage`
- export/import JSON backup of budget profiles
- theme toggle (light/dark) and currency selection

## Features

- `Monthly Budget` input for the total allocation
- `Add Fixed Expense` form to track recurring costs
- `Flexible Spending Limit` slider and manual amount input
- `Desired Savings Target` percentage input synced to the flexible spending amount
- `Expense Allocation Breakdown` doughnut chart
- `Fixed Expenses Breakdown Ledger` with mark-as-paid and delete actions
- Profile switching to save and load separate budget contexts
- JSON export/import for backup and restore

## Getting Started

### Requirements

- Modern web browser (Chrome, Edge, Firefox, Safari)
- No build tools required

### Run locally

1. Open `index.html` in your browser.
2. Alternatively, serve the folder with a static web server and visit the served URL.

### Recommended local server commands

- Python 3:

```bash
python -m http.server 8000
```

- Node.js (if installed):

```bash
npx http-server .
```

Then open `http://localhost:8000` in your browser.

## File Structure

- `index.html` — main HTML view and form layout
- `style.css` — responsive UI styling and dark theme definitions
- `app.js` — application logic, state management, DOM bindings, chart rendering, and storage

## How it works

- The app stores `_multi_profile_engine_v3_` data in `localStorage`.
- Budget state is organized by profile in `globalBudgetEngine.profiles`.
- The flexible spending slider updates both manual amount and savings percentage.
- The savings percentage input also recalculates flexible spending automatically.
- Chart updates and ledger rendering refresh whenever state changes.

## Customization

- Change the available currencies in the `index.html` dropdown.
- Adjust the visual theme or layout in `style.css`.
- Add new profiles or modify state logic in `app.js`.

## Notes

- `localStorage` persists data per browser and profile.
- Exported JSON backups can be imported to restore state across sessions.
- The app uses Chart.js loaded from a CDN, so the browser needs internet access when first opening the page.

## Future Improvements

- Add validation and user-friendly error messages for invalid inputs.
- Support editing existing fixed expenses without deleting and re-adding.
- Add recurring expense categories and monthly rollover logic.
- Add mobile-first design improvements and accessibility enhancements.

## License

This project is provided as-is for personal or educational use.
