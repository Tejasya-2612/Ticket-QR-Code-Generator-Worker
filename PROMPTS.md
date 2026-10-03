# Prompt Trace

## Prompt 1 — Project inspection and scope

Actual user brief: “You are the senior full-stack engineer responsible for implementing Client Project 4” and “First inspect C:\Client Project 4.” The directory did not exist. The brief specified a React/Vite worker UI, TDD, ticket QR creation/history, accessible validation and failure states, and a separate database/API architecture plan without real backend infrastructure.

## Prompt 2 — TDD test suite

Actual user instruction: “DO NOT immediately write the final implementation. The workflow must be: PHASE 1: Write the test suite first. PHASE 2: Run the tests and confirm that the relevant tests fail because the implementation does not yet exist.” Wrote tests for the empty state, required and malformed values, success payload/QR/history, loading, request failure/retry, analytics, and text sanitization. The first run failed because `src/App.jsx` and `src/utils/sanitize.js` did not exist.

## Prompt 3 — Minimal UI and service implementation

Actual user instruction: “Implement the minimum amount of code necessary to make the tests pass,” while keeping the architectural/database planning separate and using mock/in-memory data only. Added the React form, QR display, session history, validation, sanitizer, delayed in-memory service, retryable failure state, and simulated analytics.

## Prompt 4 — Architecture and API contracts

Actual user instruction: “The primary architectural deliverables must include: Definitive database schema; ERD; API contracts; Data validation rules; Error handling strategy.” Added PostgreSQL schema and Mermaid ERD, REST request/response contracts, validation rules, and error strategy under `docs/`.

## Prompt 5 — Accessibility and visual treatment

Actual user instruction: “Accessibility is a strict requirement” and “Use a clean monochromatic corporate design.” Used labeled native form controls, field error associations, live loading feedback, semantic sections, keyboard focus styles, and a responsive grayscale layout.

## Prompt 6 — Final verification

Actual user instruction: “Run the complete test suite,” “Run the project's lint command,” and “Run the production build,” followed by repository inspection. Final results: `npm test` passed (9 tests), `npm run lint` passed with no warnings or errors, and `npm run build` succeeded. Inspected tracked source/docs for accidental secrets and unsafe raw HTML insertion; none were found.
