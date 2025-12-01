# Repository Guidelines

## Project Structure & Module Organization
- Core logic lives in `src/game` (board, dice, players, turn flow). UI panels sit in `src/game/UI`, and shared helpers in `src/utils`. PIXI and Howler assets (images, sounds) go under `src/assets`.
- Entry point is `src/index.js`, which boots the `Game` class and attaches the PIXI canvas to the DOM. Tests are colocated in `tests` with `*.test.js` names.

## Build, Test, and Development Commands
- `npm install` - install dependencies (PIXI, Howler, Jest, Vite).
- `npm run dev` - start the Vite dev server for the canvas game; hot-reloads PIXI scenes.
- `npm run build` - type-check then bundle the game with Vite for production output.
- `npm run preview` - serve the production bundle locally for a quick sanity check.
- `npm test` - run Jest in Node using `--experimental-vm-modules` (see `jest.config.cjs`). Keep tests fast; prefer unit-level coverage of game flow and UI helpers.

## Coding Style & Naming Conventions
- Use ES modules with named exports. Classes are `PascalCase` (e.g., `Game`, `LogPanel`); instances and functions are `camelCase` (e.g., `currentPlayer`, `showMainMenu`).
- Prefer `const`/`let`, 4-space indentation, and semicolons. Keep functions small and pure; move PIXI drawing into dedicated methods to ease testing.
- Organize UI-specific logic in `src/game/UI` and game mechanics in `src/game` to avoid cross-coupling.

## Testing Guidelines
- Tests live in `tests` and mirror module names (`Board` -> `board.test.js`). Use Jest assertions; sinon/chai/mocha are available if integration-style helpers are needed, but default to Jest.
- Aim to cover turn sequencing, dice behavior, log output, and UI state toggles. When adding UI, expose small helpers that can be exercised without a canvas.
- Run `npm test` locally before opening a PR.

## Commit & Pull Request Guidelines
- Write imperative, concise commit subjects (e.g., `Add capture logging`, `Fix dice roll clamp`). Group related changes per commit when possible.
- PRs should summarize intent, list key changes, and reference issues. Include before/after screenshots or short clips for UI updates. Note any testing performed (`npm test`, manual playthrough).

## Security & Configuration Tips
- Do not commit large assets or secrets; keep external references in environment variables or configuration files ignored by Git.
- If adding new assets, place them under `src/assets` and document their source and license in the PR description.

## Version History
- 0.0.1 — Initial TypeScript migration scaffolded from the JavaScript project; basic build/test wiring established.
