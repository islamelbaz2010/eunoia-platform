# MASTER_SKILLS_PLUGINS_CONNECTORS — Cross-Reference Audit

**Status: audit only.** No code, routes, or database changed. Branch `research-intelligence-v1` remains frozen; this document is committed locally on `research-intelligence-v2-data-layer` only, not pushed.

**Input received:** a Markdown summary of the spreadsheet (`MASTER_SKILLS_PLUGINS_CONNECTORS.md`), not the raw `.xlsx` with all 10 sheets' full row-level detail. This audit works from that summary. Where the summary doesn't give enough detail to verify a claim, that's stated explicitly below rather than guessed — same evidence standard the V2 directive requires of Lead Finder itself.

---

## 0. The central finding, up front

`MASTER_SKILLS_PLUGINS_CONNECTORS.xlsx` is an inventory of **your personal, cross-business AI-operations stack** — Claude Skills, MCP connectors, Composio app-automations, and pipeline agents/workflows spanning **Eunoia Zones (ops/marketing), BahgaShop, Merge Numbers, a Manufacturing Workshop, and a separate video-content pipeline ("أفكار مسروقة")**. It is not an inventory of backend software components for the Eunoia Research Intelligence Platform's codebase.

That distinction matters because of a structural fact already established in the two prior audits and confirmed again here: **Claude Skills and MCP connectors run inside a Claude conversation, authenticated as you, with a human in the loop.** They are not libraries `app/api/research/leads/route.ts` can `import` and call automatically for an arbitrary paying customer at request time. This is the same reason `WebSearch`, the Drive connector, and the Meta Ads Library tool were ruled out as production assets in `RESEARCH_ASSET_AUDIT.md` §1 row 7 — the same rule applies to nearly everything in this new file, for the same reason, not a new one.

**One exception is worth flagging, unconfirmed:** the ~861 "Composio automation stubs" mentioned in the summary imply Composio is integrated. Composio (unlike pure Claude Skills/MCP) also ships a server-side SDK/REST API that can be called from ordinary backend code with an API key, independent of a Claude session. **If** any of the apps behind those 861 stubs are real company-data/enrichment APIs (e.g. Apollo, Crunchbase, Clearbit, Hunter — common Composio integrations), that would be the one genuinely new, production-callable data source this file surfaces. The summary doesn't name which apps are behind the stubs, so this is flagged as **open, not confirmed** — see §8.

---

## 1. Reusable Skills

| Skill (from summary) | Could it run inside `app/api/research/leads|talent/route.ts`? | Verdict |
|---|---|---|
| `lead-research-assistant` | No — it's a Claude Skill invoked by you in a chat session | **Not reusable as runtime code.** Reusable only as a *methodology reference*: if its prompt defines a lead-qualification rubric or field set, that's worth reading before finalizing Lead Finder V2's extraction/scoring rules (saves re-deriving a rubric from scratch) — but I don't have its actual prompt text in the summary, only its name. |
| `competitive-ads-extractor` | No, same reason | Same as above — possible spec reference for the later Competitor Intelligence module, not for the current Lead Finder/Talent Finder scope. |
| `cold-email`, `email-drafter`, `contract-reviewer`, `copywriting`, `ad-creative`, `social-content`, `pricing-strategy`, `page-cro`, `sales-enablement` (32 marketing + 25 custom skills generally) | No | Out of scope for the research/data-acquisition layer entirely — these are content/ops skills for running your businesses, not for discovering companies or talent. |
| ~861 Composio automation stubs | Unknown — depends on which apps | **Cannot evaluate.** The source file itself marks these "Confidence: Low... not yet individually evaluated" — I'm holding the same standard here rather than inventing a use for them. |

**Net: zero skills from this file are directly reusable as production code.** Their value, if any, is as design references for V2's extraction/scoring logic — pending you sharing the actual skill prompt text.

## 2. Reusable Connectors

The summary lists 18 active MCP connectors but names only a handful (Paytm, Pletor, Intercom×2) plus implies Gmail (used by `email-drafter`/`contract-reviewer`), Drive/Egnyte/Box (storage), ERPNext. None of these are usable as a Lead Finder/Talent Finder backend data source for the same structural reason as §0 — they're MCP connectors bound to your personal Claude session/account, not server-callable multi-tenant APIs.

**Already known not to apply** (carried over from `RESEARCH_ASSET_AUDIT.md`): Drive, Meta Ads Library, GitHub — same category, already ruled out.

**Open question, not resolved by the summary:** is Composio itself one of the 18, and if so, does its underlying API key belong to you (callable server-side) or only function via MCP-in-a-Claude-session? This is the one item worth a direct answer before concluding "nothing here is reusable" — see §8.

## 3. Reusable Workflows

The 6 cataloged workflows (1 fully working, 1 external-tool-working, 1 half-working, 3 proposed) all belong to the **"أفكار مسروقة" video-content pipeline** — an entirely different product (video production), unrelated to company/talent research. **None apply to Research Intelligence.**

## 4. Reusable Agents

The 9 agent roles are, per the summary, also internal to the "أفكار مسروقة" pipeline (7 pipeline roles + 1 proposed + 2 frameworks). **None apply to Research Intelligence.**

## 5. Reusable Research Assets

Nothing in this file is a "research asset" in the sense the V2 architecture needs (a dataset, taxonomy, or benchmark). The closest thing — `lead-research-assistant`'s presumed methodology — is covered in §1 as a possible spec reference, not an asset to import.

## 6. Reusable Search Capabilities

**None.** Nothing in this file performs or exposes a callable search/lookup API distinct from what was already ruled out in `RESEARCH_ASSET_AUDIT.md` (native `WebSearch`, Drive search, Meta Ads Library search — all agent-session-only). The Composio question in §8 is the only open thread.

## 7. Components That Eliminate New Development

**None confirmed.** Every component in this file that touches "research" or "leads" (the skill, not a connector) is a conversational tool for you to run yourself — it doesn't eliminate the need to build `SearchProvider → SourceCollector → Extractor → Normalizer → Scorer` for the live product, because none of it is callable from the deployed app at request time for an arbitrary customer. The Data Acquisition Layer architecture in `RESEARCH_DATA_LAYER_DESIGN.md` stands as designed — this file does not replace any piece of it.

---

## 8. The one open thread worth resolving before finalizing

**Question: is Composio integrated with a server-side API key (yours), and if so, which apps does it connect to behind the ~861 automation stubs?**

This matters because if Composio brokers a real company-data/enrichment API (Apollo/Crunchbase/Clearbit/Hunter-style), that's a legitimate, ToS-compliant, already-paid-for(?) data source that could **replace or augment** the planned Google-Custom-Search-plus-website-fetch approach in `RESEARCH_DATA_LAYER_DESIGN.md` §7 — potentially better data quality, possibly different (or zero additional) cost depending on your existing Composio plan. I can't confirm or rule this out from the summary alone; it doesn't name the underlying apps.

**What I'd need to answer it:** the `CONNECTORS` or `MCP_SERVERS` sheet rows (the actual 18 connector names + the Composio app list), not just the summary's headline counts.

---

## Summary

### What can be reused
- **Nothing executable.** All 74 detailed skills + 18 connectors + 6 workflows + 9 agents are conversational/personal-account tools, not backend-callable production infrastructure — confirming the same boundary already drawn in `RESEARCH_ASSET_AUDIT.md`.
- **Possibly a methodology reference**: `lead-research-assistant` and `competitive-ads-extractor` skill prompts, if shared, could shortcut writing Lead Finder V2 / Competitor Intelligence extraction-and-scoring rubrics — but this is a design input, not code reuse.

### What should be built
Unchanged from `RESEARCH_DATA_LAYER_DESIGN.md`: the full `SearchProvider → SourceCollector → Extractor → Normalizer → Scorer` module, plus the Lead Finder V2 / Talent Finder V2 wiring described there. Nothing in this file removes any item from that plan.

### What should NOT be built anymore
- Nothing changes here either — there was no overlap to eliminate. (For completeness: don't attempt to wire Claude Skills or MCP connectors directly into `app/api/research/*` routes — structurally not possible, not a question of effort.)

### Expected cost savings
**$0 confirmed.** Conditional upside only: if Composio (§8) turns out to expose a real company-data API you already pay for, that could reduce or replace the ~$0–15/mo Google Custom Search cost estimated in `RESEARCH_DATA_LAYER_DESIGN.md` §11 — unconfirmed pending the connector list.

### Expected development-time savings
**0 of the ~6–8 dev-days estimated in `RESEARCH_DATA_LAYER_DESIGN.md` §10 are eliminated.** Conditional upside only: if Composio exposes a usable company-data action, it could shrink or remove the `SearchProvider`/`SourceCollector`/`Extractor` work (roughly 2–3.5 of those days), since a structured API response needs far less extraction/normalization than scraped HTML — unconfirmed pending §8.

---

## Items the source file flagged that are explicitly out of scope here

For transparency (seen, not ignored, not acted on): Paytm for Business (likely disconnect), Pletor (purpose unclear), duplicate Intercom connection, file-storage fragmentation (Drive/Egnyte/Box), ERPNext trial status, character-consistency issue in the video pipeline. These are real items in your operations but belong to other businesses/tools, not the Eunoia Research Intelligence Platform — no action taken or recommended here.

---

Waiting for your answer on §8 (Composio) and your approval before any implementation.
