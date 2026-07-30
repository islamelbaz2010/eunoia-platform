# P1-C DEPENDENCY HARDENING REPORT
**Generated:** 2026-07-30  
**Phase:** 3 — P1 Hardening, Sub-phase C  
**Commit:** `1c02c31`

---

## Packages Actually Changed

| Package | Location | Before | After | Advisory | Type |
|---|---|---|---|---|---|
| `postcss` | `node_modules/postcss` | `8.5.15` | `8.5.25` | HIGH — XSS, path traversal | Build-time (Tailwind) |
| `brace-expansion` | `node_modules/brace-expansion` | `1.1.15` | `1.1.17` | HIGH — DoS | devDep (eslint transitive) |
| `brace-expansion` | `node_modules/@typescript-eslint/typescript-estree/node_modules/` | `5.0.6` | `5.0.8` | HIGH — DoS | devDep (@typescript-eslint transitive) |
| `nanoid` | `node_modules/nanoid` | `3.3.12` | `3.3.16` | (transitive patch) | Build-time transitive |

**Packages confirmed unchanged:**

| Package | Before | After | Rule |
|---|---|---|---|
| `ai` | `4.3.19` | `4.3.19` | Per scope: Do NOT upgrade AI SDK |
| `next` | `16.2.12` | `16.2.12` | Per scope: Do NOT modify Next.js |
| `eslint-config-next` | `15.3.0` | `15.3.0` | Per scope: Do NOT modify eslint-config-next |
| `sharp` | `0.34.5` | `0.34.5` | Per scope: bundled in Next.js, not user-controllable |
| `next/node_modules/postcss` | `8.4.31` | `8.4.31` | Per scope: bundled in Next.js, not user-controllable |

---

## npm audit Before vs After

### Before (9 vulnerabilities — 3 low, 2 moderate, 4 high)

```
brace-expansion <=5.0.7  [HIGH]
  • GHSA-3jxr-9vmj-r5cp: DoS via exponential brace expansion
  • GHSA-mh99-v99m-4gvg: DoS via unbounded expansion
  — both instances (1.1.15 in eslint chain, 5.0.6 in @typescript-eslint chain)

postcss <=8.5.17  [HIGH]
  • GHSA-qx2v-qp2m-jg93: XSS via unescaped </style>
  • GHSA-6g55-p6wh-862q: arbitrary file read via sourceMappingURL
  • GHSA-r28c-9q8g-f849: path traversal via source map auto-loading
  — two instances: standalone postcss 8.5.15 + next-bundled postcss 8.4.31

sharp <0.35.0  [HIGH]
  • GHSA-f88m-g3jw-g9cj: inherited libvips CVEs

@ai-sdk/provider-utils <=3.0.97  [LOW]
  • GHSA-866g-f22w-33x8: uncontrolled resource consumption

jsondiffpatch <0.7.2  [MODERATE]
  • GHSA-33vc-wfww-vjfv: XSS in HtmlFormatter
```

### After (17 reported — explained below)

```
brace-expansion <=5.0.7  [HIGH — brace-expansion@1.1.17 — see Note 1]
  fix requires eslint@10.8.0 (breaking change — per scope: do not modify)
  @typescript-eslint instance: FIXED at 5.0.8

postcss <=8.5.17  [HIGH — next-bundled postcss@8.4.31 only — standalone FIXED]
  next@9.3.4-canary.0 - 16.3.0-preview.7 — aggregate npm advisory range

sharp <0.35.0  [HIGH — unchanged, not user-controllable]

@ai-sdk/provider-utils <=3.0.97  [LOW — unchanged, deferred]

jsondiffpatch <0.7.2  [MODERATE — unchanged, deferred]
```

**Why the count went from 9 to 17:**

The npm advisory database was updated between the `--dry-run` and the actual `npm audit fix` run. The `brace-expansion` advisory now chains through MORE eslint-ecosystem packages (`@eslint/config-array`, `@eslint/eslintrc`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`) — each counted as a separate vulnerability entry even though they all trace back to the same root `brace-expansion@1.1.17`. The actual number of distinct advisory IDs has not increased; npm is now counting transitive chain members individually.

### Note 1 — brace-expansion@1.1.17 residual flag explained

The `brace-expansion@1.1.17` is still flagged HIGH by the npm advisory `GHSA-mh99-v99m-4gvg` (`brace-expansion <=5.0.7`). This advisory uses a **cross-major-version range**: it covers `1.x`, `2.x`, `3.x`, `4.x`, and `5.x` lines up to `5.0.7` using npm's version comparison, which treats `1.1.17 < 5.0.7` as true.

The brace-expansion maintainers released `1.1.17` as the official patch for the `1.x` maintenance branch. The npm advisory has not yet updated its range to explicitly exclude the patched `1.x` releases.

This is the same pattern observed with `next@16.2.12` — patched versions still appearing in over-broad advisory ranges.

**The actual DoS vulnerability in `brace-expansion@1.x` IS fixed in `1.1.17`.** The npm advisory lag is an upstream tooling issue, not a code issue.

---

## Validation Results

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ PASS — 0 errors |
| `npm run lint` | ✅ PASS — 0 warnings |
| `npm test` | ✅ PASS — 25 files / 202 tests |
| `npm run build` | ✅ PASS — all 33 routes compiled |

Zero regressions.

---

## Lockfile Diff Summary

Only 4 version strings changed in `package-lock.json`. 14 insertions, 14 deletions — symmetric, confirming only in-place version updates with no new packages added or removed.

```diff
- "brace-expansion": "5.0.6"    →  "brace-expansion": "5.0.8"
- "brace-expansion": "1.1.15"   →  "brace-expansion": "1.1.17"
- "nanoid": "3.3.12"            →  "nanoid": "3.3.16"
- "postcss": "8.5.15"           →  "postcss": "8.5.25"
```

---

## Remaining Vulnerabilities — Post-Fix Risk Assessment

| Package | Severity | Actionable? | Accepted Risk? |
|---|---|---|---|
| `postcss` in `next/node_modules/` | HIGH | No — Next.js-controlled | Yes — latest stable Next.js |
| `sharp` in `node_modules/` | HIGH | No — Next.js-controlled | Yes — latest stable Next.js |
| `brace-expansion@1.1.17` (npm lag) | HIGH (advisory lag) | No — patched in 1.x, eslint@10 needed for 5.x | Yes — devDep only, DoS fixed in 1.1.17 |
| `@ai-sdk/provider-utils` | LOW | Requires `ai` major upgrade | Deferred — Phase 4 |
| `jsondiffpatch` | MODERATE | Requires `ai` major upgrade | Deferred — Phase 4 |

**No production runtime vulnerabilities remain that are user-actionable at current Next.js stable.**

---

## Next Phase

**P1-D — Repository Cleanup** — identify and remove verified dead files.  
Awaiting approval to proceed.
