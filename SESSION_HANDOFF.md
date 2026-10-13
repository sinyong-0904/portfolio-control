# Portfolio Control — Session Handoff

Updated: 2026-10-13

## 1. Purpose

This document provides a lightweight handoff for the next development session.

Read this file first, then verify the current GitHub HEAD and inspect the relevant actual source files.

This document does not replace `PROJECT_HANDOFF.md`, `ANNUAL_TRANSITION.md`, or `VERSION_OPERATIONS.md`.

Source priority:

1. Current GitHub main HEAD and actual source
2. Repository project management documents
3. Current conversation context
4. Model memory

Do not infer current implementation from previous conversations.

## 2. GitHub Access and Retry Policy

Repository:

https://github.com/sinyong-0904/portfolio-control

GitHub Raw/API access sometimes fails temporarily and succeeds on retry.

When access fails:

1. Retry the same URL.
2. Try `raw.githubusercontent.com`.
3. Try GitHub `blob/main` or commit-specific URLs.
4. Try GitHub REST API.
5. Retry using an alternative access method before requesting files from the user.

Do not interpret a temporary network or DNS failure as evidence that the repository or file does not exist.

Do not claim source verification when access was unsuccessful.

Request local source extraction or ZIP upload only after reasonable retries and alternative methods fail.

## 3. Current Checkpoint

Last confirmed synchronized checkpoint before creating this file:

`49f2596c92349477a75edb1804311d9e443a73ad`

Commit message:

`Add Samsung combined performance KPI`

On 2026-10-13, the user confirmed:

- Local branch: `main`
- `origin/main`: `49f2596c92349477a75edb1804311d9e443a73ad`
- Local HEAD: same commit
- Working tree: clean
- Local and remote synchronization: PASS

Creating this document will produce a newer commit. Therefore, always check the latest HEAD again.

The checkpoint above is historical, not a permanent HEAD reference.

## 4. Highest Priority — Simulation CAGR Mismatch

### Confirmed runtime values

- Performance pension combined SI CAGR: `8.889194958302383%`
- Financial Management long-term Simulation CAGR: `9.637727016550146%`
- Difference: `0.748532058247763 percentage points`

The user recalls that Simulation CAGR was originally designed to reference the Performance pension combined CAGR.

This architectural expectation must be verified against actual source and specifications.

### Investigation requirements

1. Read the current `SESSION_HANDOFF.md`.
2. Verify current GitHub main HEAD.
3. Read relevant sections of `PROJECT_HANDOFF.md`.
4. Locate the Financial Management Simulation CAGR implementation.
5. Trace its authoritative definition and call path.
6. Locate the Performance pension combined SI CAGR calculation.
7. Compare calculation periods, starting capital, cash flows, annualization, and return definitions.
8. Inspect duplicate definitions, overrides, helper functions, and script load order.
9. Determine whether Simulation should reuse the existing Performance CAGR directly.
10. Compare minimal-change solutions before proposing a patch.

Do not assume the difference is caused by a particular formula or date.

Do not implement another independent CAGR formula if an existing authoritative helper can be reused.

### Implementation and verification

If source evidence confirms that both values should match:

- Reuse the existing authoritative calculation.
- Minimize changed files and lines.
- Preserve stable root behavior.
- Avoid modifying unrelated Performance calculations.
- Verify the displayed CAGR and downstream long-term asset projections.
- Check refresh and reload behavior.
- Audit for stale overrides and load-order issues.

Use actual checkpoint source.

Provide exact existing and replacement code blocks, or precise insertion/deletion locations.

Do not invent source snippets.

### Completion conditions

- Static/source verification
- Local browser verification
- Simulation CAGR and Performance CAGR agreement
- Long-term Simulation regression verification
- GitHub commit/upload
- Remote source audit
- Production verification
- Local synchronization PASS

Until all applicable checks pass, do not mark the task complete.

## 5. Second Priority — OPI2 Phase B2-3

Resume only after the Simulation CAGR issue is completed.

### Completed phases

- A1: Growth stock compensation classification from 2027
- A2: Growth stacked contribution chart
- B1: Overview Samsung common/preferred stock combined presentation
- B2-1: GENERAL Performance treasury-share and other-holdings subrows
- B2-2: Combined Samsung stock Performance KPI

All above phases passed their documented Production and local synchronization checks at the previous checkpoint.

### Pending Phase B2-3

Objective:

Ensure correct OPI2 share compensation history, external inflow classification, Performance calculations, persistence, and annual rollover.

Principles:

- Existing GENERAL holdings remain authoritative for actual quantity, average cost, and market value.
- OPI2 grant/payment records may need a separate authoritative history.
- OPI2 payment value is external inflow, not investment profit.
- Subsequent share-price changes are investment performance.
- Growth `stockCompensation` and GENERAL `annualFlow()` currently use separate paths, according to prior source analysis.
- Avoid double counting and missing inflows.
- Reuse existing account, Performance, and Annual Transition calculations where possible.
- Avoid speculative historical migration and hardcoded adjustments.

Source paths to investigate:

- GENERAL holding edit/save
- `annualFlow()`
- Account summary
- Growth `stockCompensation` persistence
- Performance YTD/TR
- OPI2 payment history ownership
- Duplicate payment prevention
- Supabase save/reload
- Annual Transition/rollover

### Safety

Never save fictitious OPI2 grants into Production Supabase.

Prefer isolated Node-based tests using actual source.

Test:

- Initial payment
- Subsequent price movement
- Additional payment
- Duplicate payment
- Year transition
- Persistence and reload when safely testable

A rehearsal PASS does not imply Production persistence PASS.

## 6. Development Workflow

Required sequence:

HEAD → READ → VERIFY → PATCH → TEST → DIFF/AUDIT → COMMIT → HANDOFF

Before local modifications:

```powershell
git fetch origin
git status
git rev-parse origin/main
git rev-parse HEAD
```

For meaningful changes, use:

```powershell
git diff --ignore-space-at-eol -- <files>
```

For remote comparison:

```powershell
git diff --ignore-space-at-eol origin/main -- <files>
```

Preserve existing state ownership, persistence paths, and script load order.

Prefer minimal modifications in existing patch layers.

Do not modify Production/shared-state architecture without explicit user approval.

Localhost may connect to Production Supabase. Never assume localhost testing is isolated.

The user commonly uploads modified files through GitHub Web UI because push may be restricted on the company network.

Final completion condition:

**GitHub reflected → Production verified → local sync PASS**

## 7. Next Session Execution Instruction

Start with the Simulation CAGR mismatch.

Do not begin by asking the user to repeat the handoff or prior investigation.

Verify HEAD, read relevant source, trace both CAGR calculations, and continue through root-cause analysis, minimal patch planning, and verification design without unnecessary approval pauses.

Stop only when user action is required for editing, local testing, GitHub upload, or a significant architectural decision.

After completing the CAGR task, resume OPI2 B2-3.

Update this file after important checkpoints. Keep it concise and current rather than accumulating a full chronological history.
