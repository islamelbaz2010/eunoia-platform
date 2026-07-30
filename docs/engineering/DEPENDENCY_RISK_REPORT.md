# DEPENDENCY RISK REPORT
**Generated:** 2026-07-30  
**Phase:** P1-C — Dependency Hardening  
**Purpose:** Full risk analysis required BEFORE any dependency changes are made.

---

## Audit Snapshot

```
9 vulnerabilities (3 low, 2 moderate, 4 high)
```

### Vulnerability Inventory

| Package | Severity | Advisory | Fix Method |
|---|---|---|---|
| `brace-expansion@1.1.15` | HIGH | GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg | `npm audit fix` (safe) |
| `brace-expansion@5.0.6` | HIGH | GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg | `npm audit fix` (safe) |
| `postcss@8.5.15` (standalone) | HIGH | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849 | `npm audit fix` (safe) |
| `postcss` (inside next) | HIGH | Same as above | Not user-controllable — see Note A |
| `sharp` (inside next) | HIGH | GHSA-f88m-g3jw-g9cj | Not user-controllable — see Note A |
| `@ai-sdk/provider-utils <=3.0.97` | LOW | GHSA-866g-f22w-33x8 | Major version bump required — see Note B |
| `jsondiffpatch <0.7.2` | MODERATE | GHSA-33vc-wfww-vjfv | Major version bump required — see Note B |
| `nanoid@3.3.12` | LOW | (included in safe audit fix) | `npm audit fix` (safe) |

---

## Package Analysis

### 1. `brace-expansion` (HIGH DoS — GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg)

| Field | Value |
|---|---|
| Current version | `1.1.15` (in `node_modules/brace-expansion`) + `5.0.6` (in `@typescript-eslint/typescript-estree/node_modules/`) |
| Target version | `1.1.17` + `5.0.8` |
| Reason | DoS via exponential-time expansion of consecutive non-expanding `{}` groups; out-of-memory process crash via unbounded expansion |
| Breaking changes | None. Patch version update to a pure string-processing library. |
| Risk | **None.** Both are transitive dependencies of ESLint/TypeScript-ESLint (devDependencies). Never executed in the Next.js runtime or any production code path. |
| Rollback plan | `npm install` from previous lockfile. Worst case: ESLint output changes (will be caught by lint run). |
| Usage in codebase | Zero direct imports — only used at build/lint time |

**Recommendation: APPROVE via `npm audit fix`.**

---

### 2. `postcss@8.5.15` (standalone) (HIGH — GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849)

| Field | Value |
|---|---|
| Current version | `8.5.15` |
| Target version | `8.5.25` |
| Reason | XSS via unescaped `</style>` in CSS stringify output; arbitrary file read via attacker-controlled `sourceMappingURL`; path traversal via previous source map auto-loading |
| Breaking changes | None. Patch update within PostCSS 8.x stable line. |
| Risk | **Low.** Used by `@tailwindcss/postcss` (build-time CSS processing). The XSS and file-read vulnerabilities apply to tooling, not to production request handlers. |
| Rollback plan | `npm install postcss@8.5.15` |
| Usage in codebase | Build-time only — Tailwind CSS compilation |

**Recommendation: APPROVE via `npm audit fix`.**

---

### 3. `postcss` bundled inside `next` (HIGH — same advisories as above)

**Note A — NOT user-controllable.**

`node_modules/next/node_modules/postcss` is bundled by Next.js and cannot be upgraded independently. The npm advisory marks the entire range `9.3.4-canary.0 - 16.3.0-preview.7` as affected. The "fix" npm suggests (`npm audit fix --force`) would downgrade Next.js to `9.3.3` — a 7-major-version regression. This is categorically rejected.

`next@16.2.12` is the latest stable 16.x release. No newer stable Next.js has been released. This vulnerability is not user-actionable without a Next.js patch release.

**Action:** None. Monitor Next.js releases. Accept risk.

---

### 4. `sharp` bundled inside `next` (HIGH — GHSA-f88m-g3jw-g9cj)

**Note A (continued) — NOT user-controllable.**

`node_modules/sharp` is installed by Next.js for image optimization. CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 are inherited libvips vulnerabilities. The npm "fix" is again a Next.js 9.3.3 downgrade — rejected for the same reasons.

Image optimization is not a core platform capability (no `<Image>` components with dynamic external sources observed in the codebase). The blast radius of these libvips CVEs is limited.

**Action:** None. Monitor Next.js releases. Accept risk.

---

### 5. `ai@4.3.19` / `@ai-sdk/provider-utils <=3.0.97` (LOW — GHSA-866g-f22w-33x8)

| Field | Value |
|---|---|
| Current version | `ai@4.3.19` |
| Target version | `ai@7.0.42` (npm recommendation) |
| Reason | Uncontrolled resource consumption (DoS) in AI SDK streaming primitives |
| Breaking changes | **Massive.** v4 → v7 is a 3-major-version jump. The Vercel AI SDK redesigned its streaming, tool-calling, and provider APIs across v5, v6, and v7. |
| Risk of upgrading | **Critical.** Even though grep finds zero `from 'ai'` imports in the codebase today, `ai` is a direct `package.json` dependency (`"ai": "^4.3.16"`). An accidental v7 upgrade could silently break any route that uses AI SDK patterns not caught by static grep (e.g., dynamic requires, runtime-resolved imports). The build would likely pass but behavior could change. |
| Risk of NOT upgrading | **Low.** The vulnerability is a DoS in streaming resource handling. This platform uses the AI SDK for OpenAI integration in research routes. If the SDK is called from production, the DoS requires an attacker to control the stream — which in this architecture means the attacker is OpenAI's response. The practical exploitability is minimal. |
| Rollback plan | N/A — not recommended |

**Recommendation: DEFER.** Do not upgrade. No `from 'ai'` imports found in codebase suggests it may be an unused or partially-integrated dependency. The breaking changes and low exploitability make this a Phase 4 item (Module Completion), not a P1 hardening item.

---

### 6. `jsondiffpatch <0.7.2` (MODERATE — GHSA-33vc-wfww-vjfv)

Transitive dependency of `ai@4.x`. The XSS vulnerability is in `HtmlFormatter::nodeBegin` — a rendering helper for diff visualization. This is not used by any server-side request handler in this codebase. Upgrade path requires `ai@7.0.42`.

**Recommendation: DEFER** (tied to `ai` upgrade decision above).

---

### 7. `eslint-config-next` version alignment (P1-01)

| Field | Value |
|---|---|
| Current version | `15.3.0` |
| Next.js version | `16.2.12` |
| Target version | N/A |
| Breaking changes | Cannot determine |
| Risk | **Moderate if forced.** There is NO stable `eslint-config-next@16.x` release. The only 16.x versions available are preview releases: `16.3.0-preview.6` through `16.3.0-preview.10`. Installing a preview ESLint config just to match the major version number introduces more risk than the version gap. |

`eslint-config-next@15.3.0` is the latest STABLE release. The version mismatch (15 vs 16) causes no runtime errors, no build failures, and no test failures — it only means some Next.js 16-specific lint rules are not active.

**Recommendation: DEFER.** No safe alignment target exists. Keep `15.3.0`. Revisit when `eslint-config-next@16.x` stable is released.

---

## Approval Request

### Approved safe changes — awaiting owner go-ahead

**Change Set 1:** Run `npm audit fix` (safe — no force)

This will apply the following patches:
- `postcss` `8.5.15` → `8.5.25` (HIGH XSS — standalone, build-time)
- `brace-expansion` `1.1.15` → `1.1.17` (HIGH DoS — devDependency, lint-time)
- `brace-expansion` `5.0.6` → `5.0.8` (HIGH DoS — devDependency, lint-time)
- `nanoid` `3.3.12` → `3.3.16` (transitive patch)

All four are patch-level changes to transitive devDependencies used only at build/lint time.

**Validation after change:**
1. `npm run typecheck` — must PASS
2. `npm run lint` — must PASS
3. `npm test` — must PASS (all 202 tests)
4. `npm run build` — must PASS

### Rejected (do not do)
- `ai` → v7: REJECT. Breaking change, unclear usage, low exploitability.
- `next` downgrade to 9.3.3: REJECT. Catastrophic regression.
- `eslint-config-next` 15→16 preview: REJECT. No stable 16.x exists.

### Deferred (Phase 4+)
- Bundled `postcss`/`sharp` inside Next.js: Monitor Next.js release feed.
- `ai`/`jsondiffpatch` upgrade: Phase 4 (Module Completion) when AI SDK usage is audited.

---

## Residual Risk After Approved Changes

After `npm audit fix`:

| Package | Severity | Status |
|---|---|---|
| `postcss` inside `next` | HIGH | Accepted — Next.js-controlled, latest 16.x |
| `sharp` inside `next` | HIGH | Accepted — Next.js-controlled, latest 16.x |
| `@ai-sdk/provider-utils` | LOW | Deferred — tied to ai major upgrade |
| `jsondiffpatch` | MODERATE | Deferred — tied to ai major upgrade |

Residual HIGH vulnerabilities are not user-actionable. They are acknowledged and tracked.

---

**Awaiting approval to execute Change Set 1: `npm audit fix` (safe).**
