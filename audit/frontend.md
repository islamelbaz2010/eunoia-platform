# Frontend Audit

**Score: 56 / 100**

---

## Page Inventory

| Route | Type | Auth Guard | Loading State | Error State | Accessibility | Notes |
|---|---|---|---|---|---|---|
| `/` | Server Component | ✅ (redirect to /market-intelligence or /dashboard) | N/A | N/A | N/A | Redirect-only |
| `/login` | Client Component | ✅ (redirects if authed) | ✅ Button disabled | ✅ Error display | ⚠️ | |
| `/signup` | Client Component | ✅ | ✅ | ✅ | ⚠️ | |
| `/forgot-password` | Client Component | ✅ | Unknown | Unknown | ⚠️ | Not fully inspected |
| `/demo` | Client Component | ❌ (public) | ✅ | ✅ | ⚠️ | Bilingual AR/EN |
| `/market-intelligence` | Server Component | ✅ | N/A | N/A | ❌ | Entire content is iframe |
| `/dashboard` | Server Component | ✅ (layout) | ✅ | N/A | ⚠️ | Shell wrapper |
| `/dashboard/onboarding` | Client Component | ✅ (via client-side check) | ✅ | ✅ | ⚠️ | |
| `/dashboard/real-estate` | `'use client'` | Layout | ✅ | ✅ | ⚠️ | 1111-line monolith |
| `/dashboard/research` | `'use client'` | Layout | ✅ | ✅ | ⚠️ | |
| `/dashboard/research/leads` | Unknown | Layout | Unknown | Unknown | ⚠️ | |
| `/dashboard/research/talent` | Unknown | Layout | Unknown | Unknown | ⚠️ | |
| `/dashboard/analytics` | `'use client'` | Layout | N/A | N/A | ⚠️ | Static content, wrong type |
| `/dashboard/reports` | Server (split) | Layout | ✅ | ✅ | ⚠️ | Correct server+client split |
| `/dashboard/settings` | Server Component | Layout | N/A | N/A | ⚠️ | Read-only shell |
| `/dashboard/error` | Error boundary | N/A | N/A | ✅ | ⚠️ | Next.js error boundary |
| `/dashboard/loading` | Loading UI | N/A | ✅ | N/A | N/A | Next.js loading boundary |

---

## Component Inventory

### Active Components

| Component | File | Type | Issues |
|---|---|---|---|
| `Shell` | `components/dashboard/shell.tsx` | Client | High client-boundary; wraps entire dashboard |
| `Header` | `components/dashboard/header.tsx` | Client | Redundant `getUser()` call client-side |
| `Sidebar` | `components/dashboard/sidebar.tsx` | Client | Navigation only |
| `Logo` | `components/logo.tsx` | Unknown | |
| `Badge` | `components/ui/badge.tsx` | Client | Radix-free implementation |
| `Button` | `components/ui/button.tsx` | Client | CVA-based |
| `Card` | `components/ui/card.tsx` | Client | |
| `Switch` | `components/ui/switch.tsx` | Client | Uses `@radix-ui/react-switch` |

### Dead Components

| Component | File | Reason |
|---|---|---|
| `FadeIn` | `components/motion/fade-in.tsx` | Zero usages under `app/`; wraps dead `framer-motion` dep |

---

## Client Boundary Analysis

### The `Shell` Problem [PROVEN]

`components/dashboard/shell.tsx` is marked `'use client'` and wraps every single dashboard page. This means the entire dashboard chrome (navigation sidebar, header) ships as client-rendered JavaScript even when the page itself is server-rendered.

**Impact:** Every dashboard page has a larger-than-necessary JavaScript bundle because the shell creates a client boundary at the top of the component tree.

**What's correct today:** `app/dashboard/reports/page.tsx` correctly uses a server component (no `'use client'`) that imports `Shell` from the server side and delegates only the interactive list to `reports-client.tsx`. This is the right pattern.

**What's wrong:** `app/dashboard/analytics/page.tsx` is marked `'use client'` at the top level but contains only static JSX with no `useState`, `useEffect`, or event handlers. It should be a server component.

### Redundant Client-Side Auth Call [PROVEN]

`components/dashboard/header.tsx:17` calls `supabase.auth.getUser()` on the client to render an avatar initial. This:
1. Makes a network request to Supabase from the browser on every dashboard page load
2. Duplicates auth work the server-side layout has already done
3. Creates a flash where the avatar initial is absent, then appears

**Fix:** Pass `user` as a prop from the server layout to the header component, eliminating the client-side auth call.

---

## CSS / Styling Analysis

- **Tailwind CSS 4** used with custom PostCSS setup (`postcss.config.mjs`). No traditional `tailwind.config.js` — uses CSS-native `@theme` directives in `globals.css`.
- **Inline styles** heavily used in dashboard pages (`app/dashboard/page.tsx`, `real-estate/page.tsx`). Mixed approach: some Tailwind classes, some inline style objects. Inconsistent but functional.
- **Custom CSS variables** defined in `globals.css` for theme (gold, cream, midnight, surface).
- No design system tokens documented.
- No `globals.css` class naming conflicts identified (classes are either Tailwind utilities or inline styles).

---

## Accessibility Assessment

**Overall: POOR** — no systematic accessibility audit was conducted during development.

Issues identified across pages:
- Inline styles throughout (`app/dashboard/page.tsx`) bypass Tailwind's responsive utilities
- No `aria-label` on icon-only buttons (e.g., sidebar navigation items)
- No `role` attributes on custom interactive elements
- No focus-visible styles confirmed on all interactive elements
- Arabic text (`dir="rtl"`) is correctly applied on demo page but inconsistently applied on the dashboard
- No skip-to-content link
- Keyboard navigation not verified
- Color contrast not verified (gold `#b8922a` on white `#fff` — likely fails WCAG AA for small text)
- `<iframe>` in market-intelligence page has `title` attribute ✅ but no fallback content

**Severity for B2B SaaS in MENA:** Accessibility requirements are less strictly enforced than in Western markets, but enterprise/government clients may require WCAG 2.1 AA compliance.

---

## Responsive Design

- Dashboard uses CSS Grid and Flexbox with fixed `px` values in inline styles — not responsive via Tailwind breakpoints
- Demo page uses `dir="rtl"` but no systematic `@media` responsive breakpoints visible in inline styles
- `app/market-intelligence/page.tsx` uses `flex: 1` on iframe — works on desktop, questionable on mobile
- No confirmed mobile testing

---

## Loading States

| Page | Has Loading State | Type |
|---|---|---|
| Dashboard home | ✅ | Suspense via `app/dashboard/loading.tsx` |
| Real estate | ✅ | In-component spinner |
| Research | ✅ | In-component spinner |
| Reports | ✅ | In-component spinner |
| Settings | ❌ | No loading state |
| Analytics | N/A | Static content |

---

## Error States

| Page | Has Error State | Type |
|---|---|---|
| Dashboard home | ✅ | `app/dashboard/error.tsx` (Next.js error boundary) |
| Real estate | ✅ | In-component error display |
| Research | ✅ | In-component error display |
| Auth pages | ✅ | Inline form error messages |
| Settings | ❌ | No error handling |

---

## Performance — Frontend Bundle

- **`framer-motion`**: fully dead dependency — zero real usages. Removes 100KB+ from client bundle when deleted.
- **8 unused Radix packages**: never imported by any component. Remove to reduce `node_modules` and potential for future accidental import.
- **`components/dashboard/shell.tsx`** client boundary: forces entire dashboard shell into client bundle. No RSC optimization for chrome.
- **`app/dashboard/analytics/page.tsx`** marked `'use client'` unnecessarily: eliminates any streaming SSR benefit for this page.

---

## i18n (`next-intl`)

`next-intl` is installed and configured via `next.config.ts` (wraps with `createNextIntlPlugin`). The `i18n/request.ts` file exists. However:
- Only the demo page shows bilingual (AR/EN) content — and it uses hardcoded strings, not i18n keys
- The dashboard uses hardcoded English strings
- The real estate page uses hardcoded Arabic/English text directly

**Assessment:** `next-intl` appears to be infrastructure-in-place that was never fully activated. No message files (`.json` locale files) were found in the file tree. The package is likely unused dead weight at this stage.

---

## SEO

| Page | `metadata` export | OG tags | Sitemap | Robots |
|---|---|---|---|---|
| `/` | ❌ | ❌ | ❌ | ❌ |
| `/login` | ❌ | ❌ | N/A | N/A |
| `/market-intelligence` | ✅ (`title`) | ❌ | ❌ | ❌ |
| `/dashboard/*` | ❌ | ❌ | N/A (auth-gated) | N/A |

**Assessment:** No systematic SEO setup. Not critical for a B2B SaaS dashboard but the public-facing pages (`/`, `/demo`, `/market-intelligence`) should have basic metadata.
