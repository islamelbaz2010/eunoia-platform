# PACKAGE JSON
**Audit Date:** 2026-07-30  
**Source:** `package.json` (direct read)

---

## Metadata

| Field | Value |
|---|---|
| name | `eunoia-intelligence-web` |
| version | `0.1.0` |
| private | `true` |

---

## Scripts

| Script | Command | Notes |
|---|---|---|
| `dev` | `next dev` | Local development server |
| `build` | `next build` | Production build |
| `postinstall` | `prisma generate` | Auto-generates Prisma client after npm install |
| `start` | `next start` | Production server |
| `lint` | `eslint .` | ESLint 9 flat config |
| `typecheck` | `tsc --noEmit` | TypeScript strict check |
| `test` | `vitest run` | Single-run test suite (no watch mode) |

**Gaps:**
- No `test:watch` script
- No `test:coverage` script
- No `db:migrate` or `db:push` script (Supabase SQL is manual)
- No `db:seed` script

---

## Dependencies (production)

| Package | Version | Purpose |
|---|---|---|
| `@prisma/client` | ^6.6.0 | Prisma ORM client |
| `@radix-ui/react-dialog` | ^1.1.6 | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | ^2.1.6 | Dropdown menus |
| `@radix-ui/react-label` | ^2.1.2 | Form labels |
| `@radix-ui/react-progress` | ^1.1.2 | Progress bars |
| `@radix-ui/react-scroll-area` | ^1.2.3 | Scroll area |
| `@radix-ui/react-select` | ^2.1.6 | Select inputs |
| `@radix-ui/react-separator` | ^1.1.2 | Visual separators |
| `@radix-ui/react-slot` | ^1.2.0 | Slot pattern for component composition |
| `@radix-ui/react-switch` | ^1.2.6 | Toggle switch |
| `@radix-ui/react-tabs` | ^1.1.3 | Tab navigation |
| `@radix-ui/react-tooltip` | ^1.2.3 | Tooltips |
| `@supabase/ssr` | ^0.5.2 | Supabase SSR helpers for Next.js |
| `@supabase/supabase-js` | ^2.49.4 | Supabase JS client |
| `@tailwindcss/postcss` | ^4.3.0 | Tailwind PostCSS plugin |
| `@upstash/ratelimit` | ^2.0.5 | Sliding window rate limiter |
| `@upstash/redis` | ^1.34.9 | Redis HTTP client |
| `ai` | ^4.3.16 | Vercel AI SDK v4 |
| `class-variance-authority` | ^0.7.1 | CVA for variant-based styling |
| `clsx` | ^2.1.1 | Conditional className utility |
| `framer-motion` | ^12.40.0 | Animation library |
| `lucide-react` | ^0.488.0 | Icon set |
| `next` | ^16.2.6 | Next.js framework |
| `next-intl` | ^4.1.0 | i18n (internationalization) |
| `openai` | ^4.96.2 | OpenAI API client |
| `prisma` | ^6.19.3 | Prisma ORM (CLI + runtime) |
| `react` | ^19.0.0 | React core |
| `react-dom` | ^19.0.0 | React DOM |
| `resend` | ^6.12.4 | Transactional email |
| `sonner` | ^2.0.1 | Toast notifications |
| `tailwind-merge` | ^3.2.0 | Merge Tailwind classes safely |
| `tailwindcss` | ^4.1.4 | Utility-first CSS |
| `tw-animate-css` | ^1.4.0 | Tailwind animation utilities |
| `zod` | ^3.24.1 | Schema validation |

**Notes:**
- `ai` (Vercel AI SDK v4) is installed but **not actively used** in any current route — the codebase uses the raw `openai` SDK directly
- `framer-motion` is present; `components/motion/fade-in.tsx` is the only current usage
- `next-intl` is configured but internationalization is not actively exercised (no `/[locale]/` route segments)

---

## devDependencies

| Package | Version | Purpose |
|---|---|---|
| `@types/node` | ^22.14.1 | Node.js type definitions |
| `@types/react` | ^19.1.0 | React type definitions |
| `@types/react-dom` | ^19.1.0 | React DOM type definitions |
| `eslint` | ^9.24.0 | Linter |
| `eslint-config-next` | 15.3.0 | Next.js ESLint rules |
| `typescript` | ^5.8.3 | TypeScript compiler |
| `vitest` | 4.1.9 | Test runner (pinned, not ^) |

**Notes:**
- `vitest` is pinned at `4.1.9` (no caret) — intentional to prevent breaking changes
- `eslint-config-next` at `15.3.0` while `next` is at `^16.2.6` — minor version mismatch (lint works, but should be aligned)
- No `@testing-library` — all tests use Vitest's built-in assertions on pure functions
- No E2E framework (no Playwright/Cypress)
