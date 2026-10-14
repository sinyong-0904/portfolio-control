# Portfolio Control — Session Handoff

Updated: 2026-10-14

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

## 3. Historical Checkpoint — Before October 2026 Updates
> **Historical reference only.**
>
> The checkpoint `49f2596c92349477a75edb1804311d9e443a73ad` records the synchronized state before the October 2026 CAGR and OPI2 B2-3 changes.
>
> It is not the current development checkpoint. Refer to Section 8 and verify the latest GitHub main HEAD before starting work.

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

## 4. Historical Investigation — Simulation CAGR Mismatch (Completed)
> **Status: COMPLETED**
>
> Fix commit: `6126be64096939405b10259a3b967ee78f87059a`
>
> The investigation and implementation instructions below are retained for historical reference only.
>
> The CAGR mismatch has passed local testing, GitHub remote audit, Production verification, and Local Sync.
>
> Do not execute the historical patch instructions again unless new source evidence or a regression justifies reopening the issue.

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

## 5. Historical Implementation Plan — OPI2 B2-3 (Code Completed)
> **Status: CODE IMPLEMENTATION COMPLETED**
>
> Implementation commit: `9f4e61b3614546626f5989f26d20d91b00c2caf1`
>
> The implementation plan below is retained as historical context and must not be treated as an active development instruction.
>
> Code implementation, isolated tests, Production regression, and Local Sync are complete.
>
> Actual 2027 OPI2 payment, Supabase persistence, and integrated Annual Transition verification remain pending.
>
> Refer to Section 8 for the current verified state and future operational verification requirements.

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

#### 5. Source-Based Isolated Testing Policy

Portfolio Control development should use actual repository source and isolated execution tests whenever practical.

**Responsibility and execution model:**

1. The assistant independently reads and analyzes the actual GitHub source, preferably at a fixed commit SHA.
2. The assistant completes source tracing, patch design, and static analysis before requesting user-side execution.
3. When possible, the assistant obtains source files in an isolated temporary environment, applies the proposed patch, and executes relevant tests without modifying the user's repository.
4. If the assistant's temporary environment cannot access GitHub source, use the user's existing local Node.js environment as the execution fallback.
5. User-side Node.js tests must use actual repository functions whenever practical, rather than testing only independently recreated formulas.
6. Prefer applying the proposed patch locally first, then testing the same modified source that will later be uploaded to GitHub.
7. Consolidate meaningful scenarios into one comprehensive test instead of repeatedly requesting small verification commands.

**Testing requirements:**

- Use hypothetical test data isolated from Production.
- Test normal behavior, edge cases, regression risks, and relevant persistence or annual-transition behavior.
- Distinguish actual source-function execution from standalone arithmetic simulations.
- Distinguish isolated Node.js PASS from browser integration PASS and Production persistence PASS.
- Do not claim end-to-end verification based solely on isolated tests.
- Never save fictitious financial data into Production Supabase.

**User-side PowerShell / Node.js conventions:**

- Provide one copy-paste-ready PowerShell block whenever possible.
- State the expected number of PASS results before execution.
- Print concise `PASS |`, `FAIL |`, or `CHECK |` results.
- Suppress unnecessary logs and intermediate output.
- Avoid repeated environment checks or function-existence tests already confirmed.
- Request another test only when new code, new evidence, or a materially different verification objective justifies it.

**Execution principle:**

The assistant owns source inspection, implementation design, and test preparation.

The user performs only the local execution steps that cannot be completed in the assistant's environment.

**One comprehensive, meaningful test is preferred over many repetitive, low-value checks.**

#### 6. Patch Entry / Iterative Verification Policy

Development must balance correctness with executable progress.

Once requirements, authoritative source paths, state ownership, and a minimal reversible patch location are sufficiently understood, proceed to a local patch and execution tests.

Do not require complete proof of every hypothetical side effect before producing a testable patch.

**Patch entry conditions:**

1. Requirements and expected behavior are defined.
2. Relevant authoritative function bodies and load order have been inspected.
3. State ownership and persistence implications are understood.
4. A minimal, reversible patch can be identified.

After these conditions are met:

- Provide exact local modification code.
- Execute isolated tests where practical.
- Use localhost/browser verification to discover real integration issues.
- Fix observed failures iteratively.
- Audit the final diff and relevant regression paths before committing.
- Reopen architectural analysis only when new evidence demonstrates a material conflict, state-integrity risk, or requirement change.

Distinguish **local experimental patches** from **Production-approved patches**.

A local test failure is evidence for targeted correction, not automatic justification for restarting the entire design investigation.

**The purpose of pre-patch analysis is to make local experimentation safe, not to eliminate the need for experimentation.**
#### 7. Execution Completion Rule

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

### Completed Work — OPI2 Phase B2-3 Code Implementation

**Status: CODE IMPLEMENTATION / PRODUCTION DEPLOYMENT COMPLETED**

Verified checkpoint:

`9f4e61b3614546626f5989f26d20d91b00c2caf1`

Commit message:

`Handle OPI2 stock compensation in Performance metrics`

Modified file:

- `v35-performance-live.js`

Implementation:

- Reuses existing Growth `stockCompensation` as the OPI2 external-inflow source.
- Preserves manual GENERAL Samsung common-stock quantity and average-cost updates.
- Adds annual and cumulative OPI2 compensation helpers.
- Adjusts GENERAL and Total annual profit, YTD, cumulative profit, and TR.
- Reuses existing TWR/CAGR calculation paths.
- Preserves existing Growth calculation and account state ownership.
- Introduces no new Supabase persistence field or payment-confirmation UI.
- Preserves 2026 behavior.

Verified checks:

- JavaScript syntax and static source audit: PASS.
- OPI2 helper execution: PASS.
- Hypothetical 2027 payment and 2028 cumulative compensation tests: PASS.
- GENERAL/Total YTD and TR isolated calculation: PASS.
- Virtual DOM cumulative-profit presentation: PASS.
- Localhost 2026 regression: PASS.
- GitHub remote commit/diff audit: PASS.
- Production 2026 regression: PASS.
- Local HEAD synchronization and clean working tree: PASS.

**Verification limitations:**

- Hypothetical tests are not actual 2027 payment execution.
- Actual OPI2 payment entry, Supabase save/reload, and integrated Annual Transition have not been verified.
- No fictitious OPI2 payment data was saved to Production Supabase.
- Do not mark actual 2027 OPI2 operational behavior as verified.

### OPI2 × Annual Transition — Isolated Pre-Verification (2026-10-14)

**Status: COMPONENT-LEVEL ISOLATED VERIFICATION PASSED**

Verified implementation commit:

`9f4e61b3614546626f5989f26d20d91b00c2caf1`

Test scenario:

- Hypothetical OPI2 payment: March 2027
- Samsung common-stock payment: 600 shares at KRW 200,000
- Growth `stockCompensation`: 12,000 (unit: 10,000 KRW)
- GENERAL 2028 opening baseline: 12,600 (unit: 10,000 KRW)
- GENERAL 2028 hypothetical valuation: 13,230 (unit: 10,000 KRW)
- Subsequent investment gain: 630 (unit: 10,000 KRW)

Verification results:

1. Actual Annual Transition candidate generation: PASS.
2. Actual candidate validation with isolated fixtures: PASS.
3. OPI2 monthly history preserved across 2027→2028: PASS.
4. Actual Growth rollover execution in isolation: PASS.
5. Actual Performance rollover preview execution in isolation: PASS.
6. 2028 opening baseline and zero new OPI2 payment: PASS.
7. Memory persistence transaction, readback, and rollback scenarios: PASS.
8. Actual 2028 Performance function execution: PASS.
9. GENERAL/Total YTD, TR, and TWR calculations under isolated fixtures: PASS.
10. Original source state preservation: PASS.

**Verification boundaries:**

- These tests used hypothetical data and isolated Node.js execution.
- Growth rollover, Performance preview, Annual Transition transaction, and 2028 Performance were verified in separate controlled tests.
- A single integrated end-to-end Annual Transition transaction combining all actual components has not been verified.
- Actual Supabase persistence/reload and Production Annual Transition have not been verified.
- No fictitious OPI2 payment was saved to Production Supabase.

**Conclusion:**

No additional Production code change is justified by the isolated test results.

OPI2 B2-3 code implementation remains completed. Actual payment and integrated rollover verification remain pending.
### Pending Work — OPI2 Operational Verification

When an actual OPI2 payment occurs:

1. Record the payment in Growth `stockCompensation` for the actual payment month.
2. Update Samsung common-stock quantity and average cost in GENERAL holdings.
3. Verify GENERAL and Total annual profit, cumulative profit, YTD, TR, TWR, and CAGR.
4. Verify that payment value is classified as external inflow rather than investment profit.
5. Verify Supabase save/reload persistence.
6. Confirm that the payment is not counted twice.
7. Verify subsequent share-price changes are treated as investment performance.
8. Verify the annual rollover and subsequent-year cumulative performance.

**Safety:**

- Do not enter hypothetical OPI2 payments into Production.
- Localhost may use Production Supabase.
- Do not reopen the completed B2-3 code implementation without new source evidence, a regression, or a requirement change.

### Next Session Execution Requirements

1. Verify the latest GitHub main HEAD and read the updated handoff.
2. Treat OPI2 B2-3 code implementation as completed at the documented checkpoint.
3. Do not repeat completed OPI2 source investigation or patch design without new evidence.
4. Maintain the distinction between code verification and actual 2027 operational verification.
5. Identify the next pending project task from `PROJECT_HANDOFF.md` and related specifications.
6. Follow the autonomous development, patch-entry, isolated-testing, GitHub Web UI, Production verification, and Local Sync policies in Sections 6 and 7.
7. Continue independently until reaching a concrete user Next Action.

**Do not interpret completion of OPI2 code implementation as completion of actual payment or Annual Transition verification.**

### Session Handoff Maintenance

After an important verified checkpoint:

- Update the completed and pending work.
- Record the latest verified commit.
- Record verification status and outstanding risks.
- Remove or revise obsolete execution instructions.
- Keep this file concise rather than accumulating chronological debugging history.
