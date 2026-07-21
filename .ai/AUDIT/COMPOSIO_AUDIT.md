# Composio-Specific Audit — Lead Finder / Talent Finder / Company Research / Market Research

**Branch:** `research-intelligence-v2-data-layer`. `research-intelligence-v1` untouched. Local commit only — no push, no merge, no deploy, per standing instruction.

**Status: audit only.** No code, routes, or database changed to produce this document.

**Scope:** Composio specifically — nothing else. This does not re-litigate `MASTER_SKILLS_CROSS_REFERENCE.md` (Skills/Connectors/Workflows/Agents in general); it drills into the one open thread that document flagged in its §8.

---

## 0. Evidence check, done before writing anything else

Before answering the 8 questions, four checks were run to establish what's actually observable from *this* session:

| Check | Result |
|---|---|
| `ToolSearch` for `"composio"` across every tool available to this session (including deferred MCP tools) | **Zero matches.** No tool named or described as Composio exists in this session's toolset. |
| The 6 MCP servers actually connected to this session, by their own self-reported instructions | ThreeJS helper, a Google-Drive-style file connector, Meta/Facebook Ads Manager (campaigns/catalog/insights/pixel), Higgsfield (image/video/3D/game generation), Buffer (social-media publishing/scheduling), GitHub. None of the six identifies itself as Composio-brokered; none matches Composio's typical generic action-execution tool-naming pattern. |
| Repo-wide search for `composio`, `apollo.io`, `clearbit`, `hunter.io`, `crunchbase` in `*.ts`, `*.tsx`, `*.json`, `*.md`, `*.env*` | Zero matches, except `MASTER_SKILLS_CROSS_REFERENCE.md` — the document *I* wrote last turn, which only speculates about Composio. No code, config, or dependency references it. |
| `.env.local`, `.env.local.example`, `.env.example`, `package.json` key/dependency names | No `COMPOSIO_*` env var of any kind. No `composio-core` / `@composio/*` package. No enrichment-provider key (Apollo/Clearbit/Hunter/Crunchbase) of any kind. |

**Conclusion, up front:** this Claude Code session has **zero observable connection** to whatever Composio account is described in `MASTER_SKILLS_PLUGINS_CONNECTORS.md`. That file documents a different product surface — your personal Claude.ai chat account, where Skills + Composio are configured — which this coding session has no API key for, no MCP bridge to, and cannot query in any way. The 6 MCP servers connected *to this session* were provisioned for this coding environment specifically and are unrelated to that personal stack.

This isn't a "couldn't find it, moving on" gap — it's a hard boundary: there is no credential, no tool, and no API surface in this environment that can list, call, or test a single Composio action. Every answer below is constrained by that fact rather than worked around with assumption.

---

## 1–8. The requested audit categories

| # | Category | Finding |
|---|---|---|
| 1 | Available Composio apps | **Not observable from this session.** Zero apps reachable. The xlsx summary names ~861 stub rows but no app names. |
| 2 | Available Composio actions | **Not observable.** No action list reachable from here at any granularity. |
| 3 | Available Composio connectors | **Not observable.** The "18 active MCP connectors" in the summary are bound to your personal Claude.ai account/session — a different session and a different authentication context than this one. |
| 4 | Available enrichment providers (Apollo/Crunchbase/Clearbit/Hunter-style) | **No evidence either way.** Nothing in this repo, this session, or the xlsx summary names a specific enrichment provider. This was the exact open question flagged in `MASTER_SKILLS_CROSS_REFERENCE.md` §8 — still unresolved, for the same reason. |
| 5 | Available search providers | **No evidence of any.** Nothing reachable here behaves like a search API (Google/Bing/SerpAPI/Tavily/Exa-style); confirmed absent from `package.json` already in `RESEARCH_ASSET_AUDIT.md` §1.2, and Composio doesn't change that from this session. |
| 6 | Available company intelligence providers | **No evidence of any** beyond the Meta Ads Library search already inventoried in `RESEARCH_ASSET_AUDIT.md` (row 7) and `RESEARCH_DATA_LAYER_DESIGN.md` §2 — and that one is a native MCP tool in *this* session, not a Composio connector, and was already ruled production-non-callable for the same agent-session-only reason. |
| 7 | Available recruitment providers | **No evidence of any.** Nothing resembling a job-board/ATS/recruiting API is reachable from this session or named in the xlsx summary. |
| 8 | Available CRM providers | **No evidence of any.** Nothing resembling Salesforce/HubSpot/Pipedrive-style CRM access is reachable from this session or named in the xlsx summary. |

## Per-connector evaluation table (as requested: name / purpose / production-callable? / cost / rate limits / integration effort / expected value)

**Table intentionally left empty.** Populating it would mean inventing connector names, costs, and rate limits that aren't in evidence anywhere — exactly the "treat it like real analysis instead of invented analysis" failure mode the source xlsx itself warned against for its own ~861 unevaluated stub rows (`MASTER_SKILLS_PLUGINS_CONNECTORS.md` §5). Holding this audit to the same standard: zero rows, not zero-effort placeholder rows.

The closest thing to a real row, for transparency — already covered, not new:

| Connector | Purpose | Production-callable from `app/api/research/*`? | Cost | Rate limits | Integration effort | Expected value |
|---|---|---|---|---|---|---|
| Meta/Facebook Ads Library search (this session's MCP, not Composio) | Public ad-transparency search | **No** — agent-session tool, requires this coding session's own auth, not a server API key your deployed app holds | Free (public API) but irrelevant here | Unknown from here | N/A — not callable | None for Lead/Talent/Company/Market research; already rejected for this reason in `RESEARCH_ASSET_AUDIT.md` row 7 |

## Which acquisition-pipeline stage could a Composio connector replace?

**Cannot determine.** The question — does any connector replace/accelerate `SearchProvider`, `SourceCollector`, `Extractor`, or `Normalizer` — requires knowing at least one real app name behind the Composio stubs. None is available from any source checked in §0. This is the same blocker as `MASTER_SKILLS_CROSS_REFERENCE.md` §8, now confirmed from the technical/session side rather than just the document side: even if you *could* name the apps, this session has no mechanism to call them, since Composio's server-side SDK/API key (if one exists on your account) is not present anywhere in this repo or environment.

---

## Deliverables

### 1. High-value connectors
**None confirmed.** Zero Composio connectors are observable, so none can be scored "high value" without inventing the score.

### 2. Low-value connectors
**None confirmed**, same reason.

### 3. Connectors to ignore
By the same already-applied standard (`MASTER_SKILLS_CROSS_REFERENCE.md`): everything Composio-related stays "open, not actionable" rather than "ignored" — there isn't enough evidence yet to even rule items out individually. What **can** be confidently set aside, because it's directly observable from this session:
- The 6 MCP servers connected to *this* coding session (ThreeJS, Drive-style file connector, Meta Ads Manager, Higgsfield, Buffer, GitHub) — none is an enrichment/search/company-intelligence/recruitment/CRM provider, none is Composio-brokered, and none is reachable from the deployed app at request time regardless (same structural boundary as every other agent-session tool in this audit chain).

### 4. Estimated development-time savings
**0 of the ~6–8 dev-days in `RESEARCH_DATA_LAYER_DESIGN.md` §10 confirmed-eliminated.** No change from `MASTER_SKILLS_CROSS_REFERENCE.md`'s figure — this audit narrowed the question but didn't get new evidence to act on.

### 5. Estimated cost savings
**$0 confirmed.** Same as before — no change.

### 6. Recommendation
Don't spend more audit time guessing at Composio from inside this session — it's structurally blind to it. Two ways to actually close this out, in order of effort:

1. **Cheapest:** in your Claude.ai session (the one with Skills/Composio configured), ask it to list your connected Composio apps and their available actions, and paste that output here (or into the repo). That's the one artifact every audit in this chain has been blocked on.
2. **More complete:** open the Composio dashboard directly (wherever your account manages it) and export the connected-apps list — or share the actual `CONNECTORS`/`MCP_SERVERS` sheet rows from `MASTER_SKILLS_PLUGINS_CONNECTORS.xlsx` (not just the Markdown summary), which should have one row per real connector rather than the 2 aggregated stub rows the summary describes.

Until one of those lands, the only confirmed, zero-unknown path forward is the one already designed and approved-pending in `RESEARCH_DATA_LAYER_DESIGN.md`: build `SearchProvider` on Google Custom Search JSON API. It has a known cost ($0–~$15/mo), a known integration effort (0.5–1 day), and depends on nothing currently unverifiable. Recommend proceeding on that basis unless/until Composio evidence arrives — at which point it could be swapped in or layered on without restructuring the pipeline, since `SearchProvider`/`SourceCollector` were already designed as interfaces for exactly this kind of provider substitution (`RESEARCH_DATA_LAYER_DESIGN.md` §9).

---

Waiting for approval before any implementation, route change, or database change.
