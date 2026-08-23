# BiotaGeom Frontend Guidelines

## Stack

- React, TypeScript, Vite, ESLint, Prettier and React Router DOM.
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
- `src/services/api`: future backend communication only. Do not add fake APIs.
- `src/hooks`, `src/types`, `src/utils` and `src/constants`: shared code only when there is real reuse.
- `src/styles`: global reset, tokens and base styles.
- `src/tests`: tests organized by components, pages, routes and mocks.

## Admin And Company Contexts

- This version has a single user flow: Administrator.
- Do not add roles, RBAC, authorization guards or multiple dashboards by profile.
- Keep global administration under `pages/admin` and company context under `pages/company`.
- `Admin > Legislation` is the global legislation catalog.
- `Company > Legislation` is legislation applicable to one company.
- `Admin > Indicators` is the global indicators catalog.
- `Company > Indicators` is indicators monitored for one company.

## Routes

- Keep route paths in `src/app/router/routes.ts`.
- `/` redirects to `/login`.
- `/login` contains the only implemented screen in the initial architecture stage.
- `/admin` redirects to `/admin/companies`.
- `/companies/:companyId` redirects to `/companies/:companyId/dashboard`.
- Creation flows should open modals from their listing/context pages. Do not add `/new` routes unless the product decision changes.
- Editing flows may be modal-based or page-based depending on future Figma/product definition. Do not assume one pattern globally.
- Future screens must use the shared route placeholder until their design and behavior are defined.

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

- Use CSS Modules for component styles.
- Use `src/styles/tokens.css` for shared colors, borders, radius, shadows and other reusable visual decisions.
- Do not add Tailwind, Material UI, Bootstrap or another UI library unless explicitly approved.
- Preserve the visual direction from Figma, but do not implement screens outside the current scope.
- Do not invent screens that are not present in the references or not requested.

## Backend Integration

- Do not call backend APIs during this stage.
- Do not create fake API clients, fake endpoints, JWTs, localStorage sessions or mock backend responses.
- `services/api` may exist as structure for future implementation only.
- Login currently performs temporary navigation only; real authentication must wait for backend availability.
- Temporary mocked UI data must be explicit in file names and exports, using patterns such as `.mock.ts` and `MOCK_`.

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
