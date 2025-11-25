# Repository Guidelines

## Project Structure & Module Organization
- `Utils/`: core runtime modules (`WKit.js`, `WEventbus.js`, `GlobalDataPublisher.js`, `fx.js`) used by all dashboards; treat these as single source of truth.
- `example_dashboard_01/`: full Sales dashboard with `components/`, `views/`, `styles/`, and page lifecycle scripts; includes `mock_server/` for local API and `dataset_sample/` JSON fixtures.
- `example_dashboard_02/`: lean reference dashboard with `scripts/`, `styles/`, `views/` showing the same patterns with less scaffolding.
- `IOT_API/`: standalone Node/Express API server for IoT monitoring data.
- `IOT_Dashboard/`: reference component and page scripts plus design notes (`DESIGN_PROCESS.md`).

## Build, Test, and Development Commands
- Install deps once per server: `cd IOT_API && npm install`; `cd example_dashboard_01/mock_server && npm install`.
- Run IoT API: `cd IOT_API && npm start` (prod) or `npm run dev` (nodemon hot reload).
- Run dashboard mock API: `cd example_dashboard_01/mock_server && npm start` (or `npm run dev`).
- Frontend examples are static HTML/JS; open `example_dashboard_01/views/*.html` or `example_dashboard_02/views/*.html` in a host that serves relative assets.

## Coding Style & Naming Conventions
- JavaScript with FP helpers (`fx.go`, `fx.map`, `fx.each`) and pub/sub (`WEventbus`) - prefer composition over mutation.
- Indent 2 spaces; favor `const`/`let` over `var`; keep functions pure where possible.
- Event names are prefixed with `@` (`@productClicked`); data topics use lowerCamelCase (`salesRealtime`).
- Component files use PascalCase + role suffix (`ProductList_register.js`, `SalesChart_destroy.js`); match related HTML/CSS filenames.

## Testing Guidelines
- No automated tests yet; validate changes by running the relevant API server(s) and exercising components in the example dashboards.
- When adding logic, include console assertions or lightweight guards, and prefer small, composable helpers under `Utils/` for reusability.
- If you add tests, colocate them near the module they cover and mirror the filename (`WKit.test.js`).

## Commit & Pull Request Guidelines
- Write imperative, scoped commits (`dashboard: tighten 3d event guard`, `utils: harden fetch retry`).
- PRs should state motivation, summarize behavior changes, list affected modules/paths, and include screenshots or request/response samples when UI or API payloads change.
- Link issues or tasks when available and note any follow-up work.

## Security & Configuration Tips
- Do not commit secrets; keep API keys/config in local env files ignored by git.
- Mock/API ports default to 3000 - avoid collisions or document overrides.
- When touching `Utils/`, note breaking changes in docs and coordinate with dashboard example owners.
