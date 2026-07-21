# 10 — Frontend

**Evidence basis:** All page files, component files, CSS, layout files inspected.

---

## Technology Stack

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.6 | Framework, App Router |
| React | 19.0 | UI library |
| TypeScript | 5.8.3 | Type safety |
| Tailwind CSS | 4.1.4 | Utility classes |
| Radix UI | Multiple | Accessible component primitives |
| Framer Motion | 12.40.0 | Animations |
| Lucide React | 0.488.0 | Icons |
| next-intl | 4.1.0 | i18n |
| class-variance-authority | 0.7.1 | Component variants |

---

## Page Inventory

| Route | Status | SSR/CSR | Notes |
|---|---|---|---|
| `/` | ✅ Active | SSR | Landing page |
| `/(auth)/login` | ✅ Active | CSR likely | Standard Supabase auth |
| `/(auth)/signup` | ✅ Active | CSR likely | Standard Supabase auth |
| `/(auth)/forgot-password` | ✅ Active | CSR likely | Reset password |
| `/auth/callback` | ✅ Active | SSR | Supabase callback |
| `/dashboard` | ✅ Active | SSR | Reports count, recent reports (server component) |
| `/dashboard/real-estate` | ✅ Active | CSR | `'use client'`, full report engine |
| `/dashboard/research` | ✅ Active | CSR? | Research hub |
| `/dashboard/research/leads` | ✅ Active | CSR | `'use client'`, Lead Finder |
| `/dashboard/research/talent` | ✅ Active | CSR | `'use client'`, Talent Finder |
| `/dashboard/reports` | ✅ Active | SSR+CSR | Server loads data, client handles UI |
| `/dashboard/onboarding` | ⚠️ Placeholder | Unknown | Page exists, no content |
| `/dashboard/settings` | ⚠️ Placeholder | Unknown | Page exists, no content |
| `/dashboard/analytics` | ⚠️ Placeholder | Unknown | Page exists, no content |
| `/dashboard/error` | ✅ Active | CSR | Error boundary |
| `/dashboard/loading` | ✅ Active | SSR | Loading state |
| `/market-intelligence` | ⚠️ Placeholder | Unknown | Page exists, no content |
| `/demo` | ✅ Active | CSR? | Public demo page |

---

## Component Library

**Location:** `components/`

| Component | Purpose |
|---|---|
| `components/dashboard/header.tsx` | Dashboard top header |
| `components/dashboard/sidebar.tsx` | Dashboard navigation sidebar |
| `components/dashboard/shell.tsx` | Dashboard layout wrapper |
| `components/logo.tsx` | Platform logo |
| `components/motion/fade-in.tsx` | Framer Motion fade-in wrapper |
| `components/ui/badge.tsx` | Badge (Radix CVA) |
| `components/ui/button.tsx` | Button (Radix CVA) |
| `components/ui/card.tsx` | Card container |
| `components/ui/switch.tsx` | Toggle switch (Radix) |

**Finding:** The UI component library is minimal — 5 primitive components. The major feature pages (real-estate, leads, talent, reports) embed hundreds of lines of inline CSS via `<style>` tags rather than using these components. This creates two parallel styling systems with no reuse.

---

## Styling Architecture Issues

### Inline CSS (`<style>` tag approach)
Every major page embeds a large `const styles = \`...\`` string injected as `<style>{styles}</style>`. For example:
- `app/dashboard/real-estate/page.tsx` — 180 lines of CSS embedded as a string literal
- `app/dashboard/research/leads/page.tsx` — 53 lines of CSS embedded
- `app/dashboard/reports/reports-client.tsx` — 94 lines of CSS embedded

**Problems:**
1. **No caching:** Inline styles are not cached by the browser (unlike external stylesheets or CSS modules)
2. **No deduplication:** Identical CSS rules (`.ri-page`, `.ri-topbar`, etc.) are duplicated across leads and talent pages
3. **No type safety:** CSS class names are strings; typos are not caught at compile time
4. **Dual system:** Components in `components/ui/` use Tailwind; pages use inline CSS

**Recommendation:** Migrate pages to Tailwind utilities or CSS modules. At minimum, extract shared styles to a single CSS module.

---

## i18n Status

**Package:** `next-intl` 4.1.0  
**Config:** `next.config.ts:4` — `createNextIntlPlugin('./i18n/request.ts')` ✅

**Finding:** The i18n plugin is configured, but:
- No message JSON files found in the repository (no `/messages/*.json` or `/locales/*.json`)
- The app uses both `next-intl` and manual bilingual strings throughout components
- The real-estate page duplicates Arabic/English via `lang` state toggle — bypassing the i18n system entirely

**Assessment:** `next-intl` is configured but not fully implemented. The bilingual implementation is ad-hoc and inconsistent.

---

## Accessibility

**Positive signals:**
- Radix UI components (Button, Dialog, Select, etc.) are accessibility-compliant by design
- `<label>` elements are used for form inputs in the research pages
- `rel="noopener noreferrer"` on external links — ✅

**Concerns:**
- Inline CSS class-based components (`.ri-page`, `.ei-page`) don't use Radix — accessibility not guaranteed
- No `aria-*` attributes observed on custom interactive elements in the inline-styled pages
- `dangerouslySetInnerHTML` used in SWOT component (`app/dashboard/real-estate/page.tsx:889`) for emoji HTML strings — safe content but bypasses React's XSS protection for that node

---

## Mobile Responsiveness

**Finding:** Most pages use CSS Grid with `grid-template-columns: 1fr 1fr` which collapses poorly on mobile without explicit breakpoints. The inline CSS systems lack `@media` queries except for one `@media print` block. The dashboard shell and sidebar appear designed for desktop.

**Assessment:** Not mobile-optimized. Acceptable for a B2B tool targeting desktop business users, but limits total addressable market.

---

## Frontend Code Quality

| Issue | Severity |
|---|---|
| Inline `<style>` CSS throughout major pages | MEDIUM |
| Dual styling systems (Tailwind + inline) | MEDIUM |
| i18n configured but not used | LOW |
| `dangerouslySetInnerHTML` for emoji strings | LOW |
| No mobile responsiveness | LOW (B2B desktop product) |
| Framer Motion used for 1 component | LOW |
| Unused component imports not detected (Radix components declared but some may be unused) | LOW |
