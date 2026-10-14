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

### GitHub Commit / Production / Local Sync Policy

Company network policy prevents terminal-based `git push`.

The established Portfolio Control deployment workflow is:

1. Complete source verification, minimal code modification, and local testing.
2. Run PowerShell verification and meaningful diff audits.
3. Use GitHub Web UI → **Add file → Upload files**.
4. Upload **only the modified files**, preserving their repository paths.
5. Use the exact commit message provided by the assistant.
6. After committing, the user provides the GitHub commit URL.
7. The assistant independently inspects the remote commit, changed files, and actual diff.
8. Verify Production behavior after GitHub Pages deployment.
9. Synchronize the local repository with the confirmed remote HEAD.
10. Verify local HEAD, origin/main, and working tree cleanliness.

**Do not instruct the user to run terminal `git push`.**

**Do not mark a task complete before remote commit audit, Production verification, and local synchronization have passed.**

### PowerShell Verification Output Policy

All PowerShell commands provided for user-side verification must follow these conventions:

- Provide a single copy-paste-ready code block.
- Print concise `PASS |`, `FAIL |`, or `CHECK |` results instead of raw command output.
- State the expected number of PASS results before the command.
- Suppress unnecessary Git output, verbose logs, and intermediate values.
- Stop potentially destructive or dependent operations when prerequisite checks fail.
- Clearly distinguish actual verification from assumptions.
- When a check fails, provide a focused follow-up diagnostic command using the same output convention.

Example expected output:

```text
PASS | Local HEAD matches origin/main
PASS | Expected files changed
PASS | CAGR reference verified
PASS | No unexpected changes
```

### Final Completion Gate

A development task is complete only when:

**GitHub Web UI commit PASS → Remote commit/diff audit PASS → Production verification PASS → Local synchronization PASS**

The assistant must not declare completion based solely on local browser testing, successful upload, or a clean local working tree.

**GitHub reflected → Production verified → local sync PASS**

## 7. Development Execution / Next Action Policy

#### 1. Definition of "Proceed"

When the user says "진행", "계속", "다음 진행", "keep going", or similar, it is an explicit instruction to continue development autonomously until reaching the next actionable execution step.

The assistant must independently perform all work it can reasonably complete, including:

- Reading actual GitHub source through Raw/API or available alternative access paths.
- Tracing authoritative definitions, overrides, load order, dependencies, and persistence paths.
- Investigating root causes and comparing minimal-change solutions.
- Completing implementation design and preparing exact modification code.
- Performing available static analysis and independent tests.

**Research summaries, intermediate findings, investigation plans, and statements such as "additional verification is needed" do not constitute completion of a "Proceed" instruction.**

Do not stop merely because another source file, function, or dependency needs investigation.

#### 2. Definition of "Next Action"

A Next Action must be a concrete, executable development step, not a description of remaining work.

Valid Next Actions include:

1. **Implementation Decision:** Present a specific architectural or state-ownership choice that genuinely requires user authorization.
2. **Code Modification:** Provide the exact file, insertion/replacement location, verified existing code, and complete replacement code.
3. **Localhost Verification:** Provide specific browser test steps and expected results.
4. **Pre-Commit Static Test:** Perform source, dependency, regression, and meaningful diff audits; provide executable PASS/FAIL/CHECK tests only where local execution is necessary.
5. **GitHub Web UI Commit:** Identify only the modified files and provide the exact commit message.
6. **Remote Commit Audit:** Inspect the user-provided commit URL, changed files, actual diff, and source integrity.
7. **Production Verification:** Specify concrete checks against the deployed application.
8. **Local Synchronization:** Verify remote/local HEAD alignment and clean working tree.

A Next Action must clearly identify:

- What the user must do.
- Exactly where or how to do it.
- Expected outcome or PASS criteria.
- What happens next after the result is provided.

**"Do not modify anything", "wait", "no user action is required", or "further investigation is needed" are not valid Next Actions when the assistant can continue working independently.**

#### 3. Stop / Handoff Conditions

The assistant should stop and hand work to the user only when one of the following conditions is met:

- The user must apply a verified code modification locally.
- A local browser, Node.js, or other environment-specific test must be executed by the user.
- The user must upload modified files through GitHub Web UI.
- A significant architecture, state ownership, persistence, Production, or shared-state decision requires explicit user authorization.
- All reasonable GitHub Raw/API and alternative access attempts have failed, and further progress genuinely requires user intervention.

The assistant must **not** stop for:

- Additional source tracing that the assistant can perform.
- Duplicate-definition, override, or script-load-order investigation.
- Dependency or persistence analysis.
- Comparison of implementation alternatives.
- Static audits or isolated tests executable in the assistant's environment.
- Intermediate findings without a concrete user action.

#### 4. User Workload Minimization

GitHub source inspection is the assistant's responsibility.

Do not repeatedly ask the user to run PowerShell commands to search for functions, check string existence, extract code, or inspect source files that can be read directly from GitHub.

Reserve user-side PowerShell commands for necessary local modification verification, isolated execution tests, Git synchronization, and other operations unavailable to the assistant.

When PowerShell is required:

- Provide a single copy-paste-ready block.
- Use concise `PASS |`, `FAIL |`, or `CHECK |` output.
- State the expected number of PASS results.
- Avoid repeating previously passed checks without new evidence.

#### 5. Execution Completion Rule

The assistant should continue independently until a genuine Next Action is reached.

**Analysis progress is not an execution milestone.**

Do not represent a research summary, incomplete patch proposal, or deferred investigation as a completed development step.

A development task is fully complete only after:

**GitHub Web UI commit PASS → Remote commit audit PASS → Production verification PASS → Local synchronization PASS**

## 8. Next Session Execution Instruction

### Current Completed Work

**Simulation CAGR mismatch — COMPLETED**

- Fix commit: `6126be64096939405b10259a3b967ee78f87059a`
- Simulation now references the live Performance pension combined CAGR.
- Local browser verification: PASS
- GitHub remote commit audit: PASS
- Production verification: PASS
- Local synchronization and clean working tree: PASS

Do not reopen this completed issue without new source evidence, a regression, or a requirement change.

### Current Active Work — OPI2 Phase B2-3

Resume OPI2 B2-3 implementation as the highest-priority development task.

The following implementation decisions have already been approved:

1. The user manually enters the OPI2 payment amount in Growth `stockCompensation` for the actual payment month.
2. The user manually updates the Samsung common-stock quantity and average cost in GENERAL holdings.
3. Temporary Performance distortion between these two independent inputs is acceptable.
4. Performance should normalize after both inputs are completed.
5. Reuse Growth `stockCompensation` as the authoritative OPI2 external-inflow amount.
6. Do not introduce a separate payment-confirmation UI or persistence state.
7. Preserve existing GENERAL holdings as the authoritative source for actual quantity, average cost, and market value.
8. Do not globally modify `annualFlow()`, `cumContribution()`, or Growth calculations without verified necessity.
9. Ensure consistency across GENERAL and Total annual profit, YTD, cumulative profit, TR, TWR, CAGR, and annual rollover.
10. Never write fictitious OPI2 payment data into Production Supabase.

Example scenario for isolated testing:

- Expected payment: March/April 2027
- Samsung common-stock quantity: 30 → 630 shares
- Average cost: 54,700 → approximately 193,081 KRW
- OPI2 payment: 600 shares × 200,000 KRW = 120,000,000 KRW
- Growth `stockCompensation`: 12,000 (unit: 10,000 KRW)

This is a hypothetical test case, not actual portfolio data.

### Immediate Execution Requirements

1. Verify the latest GitHub main HEAD and read the actual relevant source.
2. Recheck the final authoritative Performance calculation paths, including cumulative profit/TR and annual rollover.
3. Audit previous B2-3 patch proposals against current source. Do not assume earlier unverified code is safe.
4. Finalize the smallest correct implementation.
5. Provide exact modification locations and complete verified replacement code.
6. Proceed to isolated tests, local verification, GitHub Web UI commit, remote audit, Production verification, and local synchronization.

**Do not stop after reporting intermediate findings or saying that additional investigation is needed.**

Continue autonomously until reaching a concrete Next Action as defined in Section 7.

### Session Handoff Maintenance

After an important verified checkpoint:

- Update the completed and pending work.
- Record the latest verified commit.
- Record verification status and outstanding risks.
- Remove or revise obsolete execution instructions.
- Keep this file concise rather than accumulating chronological debugging history.
