# Actual running application screenshots

Images are browser captures of Daymark with a fictional account and API-created sample tasks. They are not mockups. Generated credentials are kept only in ignored `.local/demo-account.json` and are excluded from the source package.

| Screen | File |
| --- | --- |
| Login | [login.png](../docs/screenshots/login.png) |
| Registration | [registration.png](../docs/screenshots/registration.png) |
| Dashboard | [dashboard.png](../docs/screenshots/dashboard.png) |
| Task list | [task-list.png](../docs/screenshots/task-list.png) |
| Task creation | [task-creation.png](../docs/screenshots/task-creation.png) |
| Task editing | [task-editing.png](../docs/screenshots/task-editing.png) |
| Categories and counts | [categories.png](../docs/screenshots/categories.png) |
| Priorities and ordering | [priorities.png](../docs/screenshots/priorities.png) |
| Deadline tracking | [deadlines.png](../docs/screenshots/deadlines.png) |
| Kanban board | [board.png](../docs/screenshots/board.png) |
| Mobile dashboard | [mobile.png](../docs/screenshots/mobile.png) |

Capture metadata: [capture.json](../docs/screenshots/capture.json). Desktop viewport: 1440×1050; mobile: 390×844. Full-page images include content below the fold. Dashboard, board and mobile captures were visually inspected.

Reproduce using `node scripts/capture.mjs` after installing frontend dependencies/Playwright and starting Docker. `CAPTURE_URL` and `PLAYWRIGHT_CHANNEL` select another local server or installed browser. Each execution creates a fresh fictional account through the real API.
