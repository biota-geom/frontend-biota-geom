# BiotaGeom Frontend Guidelines

## Stack

- React, TypeScript, Vite, Tailwind CSS, ESLint, Prettier, React Router DOM and Zustand (global state — auth only, for now).
- New source files must use TypeScript or TSX. Do not migrate code to JavaScript.
- Do not recreate the Vite project or replace working configuration without a clear need.

## Architecture

- `src/app`: global app setup, router and providers. Do not place business rules here.
- `src/app/router`: route paths, redirects and React Router configuration. Keep route strings centralized.
- `src/assets`: static assets, split into `icons`, `images` and `logos`.
- `src/components`: reusable components that are not owned by a single feature.
- `src/components/ui`: small UI primitives needed by current implementation.
- `src/components/layout`: shared structural layout components, when they become necessary.
- `src/components/feedback`: shared loading, empty, error and placeholder states.
- `src/features`: domain-specific code, rules and types.
- `src/pages`: route-level page composition.
- `src/services/api`: backend communication (fetch wrapper, per-domain API modules). Components call these, never `fetch` directly. Do not add fake APIs — real endpoints only.
- `src/hooks`, `src/types`, `src/utils` and `src/constants`: shared code only when there is real reuse.
- `src/styles`: Tailwind entry point, shared theme tokens and minimal global base styles.
- `src/tests`: tests organized by components, pages, routes, services, state and mocks.

## Admin And Company Contexts

- This version has a single user flow: Administrator.
- No RBAC and no role-based dashboards — that's still true and intentional. Authentication guards do exist (`ProtectedRoute`/`PublicOnlyRoute`); the only distinction between users is whether they're logged in. The backend's `is_admin` field exists for future use and must not drive any frontend behavior today.
- Keep global administration under `pages/admin` and company context under `pages/company`.
- `Admin > Legislation` is the global legislation catalog.
- `Company > Legislation` is legislation applicable to one company.
- `Admin > Indicators` is the global indicators catalog.
- `Company > Indicators` is indicators monitored for one company.

## Routes

- Keep route paths in `src/app/router/routes.ts`.
- `/` redirects by auth status: `/admin/companies` when authenticated, `/login` otherwise.
- `/login` and `/register` are public-only (`PublicOnlyRoute`) — an authenticated user hitting either is redirected away, back to wherever they came from if known.
- `/admin/*` and `/companies/*` require authentication (`ProtectedRoute`); an unauthenticated visit redirects to `/login`, preserving the intended destination in `location.state.from` for post-login redirect.
- `/admin/companies` contains the visual listing backed by explicit mock data; it is not a backend integration.
- `/admin` redirects to `/admin/companies`.
- `/companies/:companyId` redirects to `/companies/:companyId/dashboard`.
- Creation flows should open modals from their listing/context pages. Do not add `/new` routes unless the product decision changes.
- Editing flows may be modal-based or page-based depending on future Figma/product definition. Do not assume one pattern globally.
- Screens outside the login and current company-listing skeleton must use the shared route placeholder until their design and behavior are defined.

## TypeScript

- Keep strict typing.
- Do not use `any` unless there is a documented reason.
- Type props and events when needed.
- Keep feature-specific types close to their feature.
- Avoid duplicating shared types.

## Components

- Keep page components focused on composition.
- Create abstractions only when they remove real duplication or clarify a responsibility.
- Do not split every HTML element into its own component.

## Styling

- Tailwind CSS is the required styling standard for components and pages.
- Keep utility classes directly in JSX/TSX. Do not create CSS Modules or component-specific stylesheets.
- Keep `src/styles/global.css` as the single CSS entry point. It may contain the Tailwind import, shared `@theme` tokens and minimal `@layer base` rules only.
- Reuse the named Tailwind theme tokens for colors, borders, radii and shadows instead of repeating values when a token already exists.
- Use arbitrary Tailwind values only when the design requires a value that is intentionally specific and not reusable.
- Do not add Material UI, Bootstrap or another UI library unless explicitly approved.
- Preserve the visual direction from Figma, but do not implement screens outside the current scope.
- Do not invent screens that are not present in the references or not requested.

## Backend Integration

- Real API calls go through `src/services/api` only — components never call `fetch` directly. `VITE_API_BASE_URL` configures the base URL (see `.env.example`).
- Auth (register/login/refresh) is fully wired to the real backend. Other domains (companies, licenses, indicators, etc.) still use mocked UI data — the `.mock.ts`/`MOCK_` naming rule stays in force for those.
- Temporary mocked UI data (non-auth) must be explicit in file names and exports, using patterns such as `.mock.ts` and `MOCK_`.

## Authentication

- State lives in a Zustand store (`src/features/auth/useAuth.ts`), not React Context — call the hook directly, no provider wrapper needed anywhere in the tree.
- Tokens live in `localStorage` under `biota.auth.*` (see `authStorage.ts`). Access token: 15 min. Refresh token: 7 days, **not rotated** — a refresh call returns only a new access token.
- `src/services/api/http.ts` owns the 401 → silent refresh → retry-once flow, including single-flight coalescing of concurrent 401s. Never reimplement this per-component.
- App boot calls `useAuth().bootstrap()` once (wired in `AppRouter`, not in `AppRoutes` — tests that render `<AppRoutes/>` directly must seed the store explicitly via `src/tests/mocks/renderWithAuth.tsx` instead of relying on bootstrap).
- User-facing auth errors are intentionally generic and PT-BR (e.g. "As credenciais inseridas não foram encontradas") — the backend's `message` is rendered verbatim. Do not "improve" them into more specific text; that's a deliberate anti-enumeration measure on the backend side.
- The `@biotageom.com.br` email allowlist is enforced server-side only. Never add a client-side check for it, and never hint at the real domain anywhere in the UI (labels, placeholders, copy) — form placeholders use a generic example (`seuemail@empresa.com`) on purpose, since revealing the actual domain would leak a rule the backend is intentionally not disclosing.
- All identifiers/comments/logs in English; all user-visible copy and errors in PT-BR, centralized in `src/features/auth/authMessages.ts`.

### Testing gotcha: mocking `services/api/authApi` in tests

`vi.mock('../../services/api/authApi', ...)` only intercepts modules imported **after** the mock is registered within that test file's own hoisting scope. Do not import the real `useAuth` (or anything that transitively imports `authApi`) from a global `setupFiles` script — that loads the real module before any test file's `vi.mock` can take effect, and the mock silently never applies. This is why `src/tests/setup.ts` does not touch the auth store; use `src/tests/mocks/renderWithAuth.tsx`'s `seedAuthState`/`renderWithAuth` to set store state explicitly per test instead.

## Tests

- Use Vitest, React Testing Library, `@testing-library/jest-dom`, `@testing-library/user-event` and jsdom.
- Add tests for implemented behavior only.
- Do not add tests for features that do not exist yet.
- Keep test files near their subject inside `src/tests`.

## Figma References

- Use Figma images to understand identity, modules, naming and future navigation.
- Implement only the requested screen or flow for the current task.
- If a button or feature has no defined screen, leave structure or a short TODO instead of inventing behavior.

## Commits

- Use Conventional Commits with English messages.
- Main prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:` and `test:`.
- Do not commit automatically unless explicitly requested.
