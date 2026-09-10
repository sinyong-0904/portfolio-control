# Portfolio Control — Project Handoff & Maintenance Guide

> **IMPORTANT**
>
> This document is the persistent project memory and maintenance guide for Portfolio Control.
>
> Any AI assistant or human developer continuing this project must read this file **before modifying code**.

---

# 1. AI / Developer Compatibility

This document is intentionally **model-agnostic**.

It may be used by:

* ChatGPT
* Claude
* Gemini
* another coding assistant
* a human developer

Do **not** assume access to:

* previous conversations
* AI memory
* workspace/session state
* previously opened files
* cached repository contents

The persistent project context is:

1. the Git repository,
2. this `PROJECT_HANDOFF.md`,
3. the actual persisted application data.

For **implementation facts**, the latest verified Git HEAD takes precedence over this document.

If this document conflicts with the actual source code:

> Report the discrepancy and inspect the current source.

Do **not** guess which one is correct.

This document is the source of truth for:

* project intent
* maintenance rules
* important historical decisions
* accepted risks
* planned features

The latest verified Git HEAD is the source of truth for:

* actual functions
* actual variables
* actual selectors
* actual file structure
* actual implementation behavior

---

# 2. Project Purpose

Portfolio Control is a personal long-term portfolio-management web application.

Primary goals:

* Track long-term financial assets across retirement and investment accounts.
* Support allocation and rebalancing decisions.
* Track performance, growth, dividends, cash-like assets, and historical records.
* Synchronize portfolio state through Supabase.
* Allow the same portfolio to be viewed from multiple devices.
* Automatically update market prices and market indicators through GitHub Actions.
* Preserve long-term annual history without requiring the original Excel workbook.

Primary usage pattern:

* **Company desktop PC:** primary editing device.
* **Home notebook:** mainly viewing and occasional verification.
* **Mobile:** mainly viewing.
* The application is effectively a **single-writer personal system**.
* Expected authenticated users are the owner and spouse only.

This actual usage model matters when evaluating technical risks.

The goal is **not** to turn this project into a generic SaaS platform.

---

# 3. ABSOLUTE CODE-MODIFICATION RULES

These rules are mandatory.

They exist because previous AI-assisted development produced serious trust problems when code was proposed from remembered or assumed source structure instead of the actual repository.

## 3.1 HEAD → READ → VERIFY → PATCH

Every code modification must follow this sequence.

### Step 1 — HEAD

Determine the actual latest Git commit SHA.

Do not assume that a previously discussed SHA is still HEAD.

After the user creates a new commit, that commit becomes the next working HEAD.

### Step 2 — READ

Read the actual target file from that exact commit.

Prefer an immutable commit-based URL rather than the mutable `main` branch.

Conceptually:

```text
raw.githubusercontent.com/.../<COMMIT_SHA>/file.js
```

### Step 3 — VERIFY

Before proposing a patch, verify that every referenced item actually exists in that source.

This includes:

* function names
* variable names
* CSS selectors
* DOM attributes
* event handlers
* Ctrl+F anchor strings
* render functions
* save/load functions
* relevant call paths

For data-related modifications, trace the relevant path when necessary:

```text
UI
→ data mutation
→ save
→ Supabase
→ reload
→ render
```

### Step 4 — PATCH

Only after HEAD, READ, and VERIFY may a code patch be proposed.

Prefer precise instructions:

```text
Find this exact existing block:
...

Replace the entire block with:
...
```

or:

```text
Delete from this exact anchor:
...

through this exact ending anchor:
...
```

Avoid vague instructions such as:

> Put this somewhere inside the function.

---

# 4. Verification Receipt for Code Changes

When an AI assistant proposes a code modification, the answer should preferably begin with a short verification receipt.

Example:

```text
Verified HEAD:
<commit SHA>

Files directly inspected:
- file-a.js
- file-b.js

Verified anchors:
- function exampleA()
- .example-selector
- save()
```

This allows the user to distinguish verified patches from speculative advice.

If this information is absent, the user should treat the patch as potentially unverified.

---

# 5. Never Claim Verification Without Reading the Source

The phrases:

* "I checked the current code"
* "The current function is..."
* "The latest file contains..."
* "I confirmed..."

may only be used when the relevant file was actually retrieved and inspected during the current task.

Memory, previous conversations, and previously pasted fragments are **not** equivalent to current-source verification.

If repository access fails:

> Stop and state that the source could not be verified.

Never invent a likely function name, selector, DOM structure, or patch.

---

# 6. GitHub Cache / Stale-Main Problem

This project has experienced cases where retrieval of:

```text
.../main/file.js
```

returned stale content.

A new AI session has also previously experienced repository retrieval/cache-miss problems.

Therefore:

1. Determine the current HEAD SHA.
2. Prefer immutable commit URLs.
3. Treat that commit snapshot as the source of truth for the modification.
4. After a new user commit, promote the new commit SHA to the next working HEAD.

If mutable `main` and an immutable commit disagree, investigate rather than guessing.

Do **not** work around repository retrieval failure by relying on remembered code.

---

# 7. User-Provided Code Snippets

Even if the user pastes a code fragment, inspect the repository file when repository access is available.

If only the pasted fragment can be verified, explicitly state:

> This patch is verified only against the supplied snippet.

Do not infer surrounding implementation.

---

# 8. Financial-Data Changes Require Invariants

Changes involving any of the following require extra care:

* holdings
* qty
* average price
* cash
* status
* Active / Closed
* dividends
* realized P&L
* portfolio_state
* save / restore
* Supabase
* valuation

Before changing these paths, identify the relevant invariants.

Example:

```text
Account value
=
Active holdings market value
+
account cash
```

For CHILD:

```text
Expected Active holdings:

GIRL
- TIME Nasdaq Bond 50
- ACE KRX Gold Spot

BOY
- TIME Nasdaq Bond 50
- ACE KRX Gold Spot
```

Owner cash must remain associated with the correct owner.

Closed records must not affect Active valuation.

A visually correct UI is not sufficient evidence of correct underlying state.

---

# 9. Large-File Limitation

GitHub web editing/upload has repeatedly failed with larger source files around the ~50 KB range.

Before proposing changes to a large file:

1. Prefer a minimal deletion/replacement if possible.
2. Avoid unnecessarily increasing file size.
3. If direct editing is impractical, consider a small patch file.
4. Before using a patch file, verify load order.
5. Verify that underlying core code will not recreate or override the patched state.

Do not create a patch that merely hides a recurring core mutation.


### Source Inspection / Runtime Verification 역할 분담

GitHub source 접근이 가능한 경우 source inspection은 AI가 직접 수행한다.

AI가 직접 확인할 항목:

- 함수 정의 위치
- 함수 override 관계
- script load order
- selector / DOM dependency
- CSS 위치
- save / persistence path
- 관련 helper / patch 존재 여부
- root / 와 /v35/ 의 공통/분리 구조

이러한 source 검색을 사용자에게 PowerShell, Console, VS Code 검색으로 대신 시키지 않는다.

사용자는 AI가 직접 확인할 수 없는 runtime 항목을 검증한다.

예:

- localhost 실제 DOM
- Supabase에서 load된 실제 state
- 실제 portfolio 값
- click / edit interaction
- Save 결과
- reload persistence
- browser computed style

Console 검증이 필요한 경우 AI는 실행할 전체 명령을 매번 다시 제공한다.

다음과 같은 모호한 지시는 사용하지 않는다.

- "아까와 동일한 명령"
- "위 명령을 다시 실행"
- "이전 snippet 사용"

긴 세션이나 새 세션에서도 사용자가 과거 메시지를 찾아 올라갈 필요가 없도록 한다.
---
# 9A. Company-PC Git / Deployment Constraint

The company-PC environment has a confirmed GitHub write restriction.

Observed behavior:

```text
git fetch / git ls-remote
→ works

git push
→ object upload begins/completes
→ HTTP 403 during Git smart-HTTP write
```

The company network uses an HTTPS proxy/DLP gateway.

Therefore this should **not** automatically be diagnosed as a Git Credential Manager problem.

Do not delete credentials or attempt SSH/firewall bypass merely to work around this restriction.

## Default company-PC workflow

The preferred workflow is:

```text
AI / local coding assistant
→ verify HEAD
→ read actual local source
→ implement
→ test
→ self-review
→ git add
→ local commit
→ STOP

User
→ identify files changed by the local commit
→ upload the completed files through GitHub Web UI
→ create the remote commit
→ verify GitHub Pages / Actions
→ verify the actual Web App
```

The local coding assistant must **not** assume that it can push.

Unless explicitly instructed otherwise:

> local commit is the final automated Git operation.

The user controls remote publication.

---

# 9B. Local Commit vs Remote Commit

Because company-PC local commits are reproduced through GitHub Web Upload, the local commit SHA and remote commit SHA may differ even when their file contents are identical.

Example:

```text
local:
A → LOCAL_COMMIT

remote:
A → WEB_COMMIT
```

This creates different Git history identities.

Before starting the next local development task:

1. fetch the latest remote state,
2. compare local and remote,
3. synchronize safely,
4. avoid creating unnecessary divergent history.

Do not assume that a local commit exists on GitHub merely because the user uploaded equivalent files through the Web UI.

---

# 9C. Large Files and Modularization Policy

Large files have caused practical problems with GitHub Web editing/upload in the company environment.

However:

> File size alone is not sufficient reason for a risky large-scale refactor.

Modularization should follow **functional ownership**, not arbitrary size thresholds.

Preferred policy:

* New substantial features should preferably live in focused modules.
* Avoid adding hundreds of lines to already-large legacy files when a clean module boundary exists.
* Do not split files merely to satisfy an arbitrary KB target.
* Do not rewrite stable financial logic merely for modular elegance.
* When touching an oversized legacy file, consider whether the affected responsibility can be safely extracted.
* Verify load order and global dependencies before extraction.
* Perform regression testing before considering the extraction complete.

Examples of appropriate independent modules:

```text
Growth chart
→ focused Growth-chart module

History Year-End Snapshot
→ focused History-snapshot module
```

This is especially useful because focused modules are easier to:

* review,
* test,
* upload through the Web UI,
* revert,
* and maintain across AI sessions.

---

# 9D. Experimental Refactoring

Large refactoring should not begin directly on the known-good local `main`.

Preferred workflow:

```text
clean main
→ create local refactor branch
→ implement/refactor
→ make incremental local commits
→ test
→ compare with main
```

If the experiment fails:

```text
git switch main
```

restores the local working tree to the known-good main state.

Important:

> Switching the local branch does NOT roll back a version already committed to GitHub `main`.

If a problematic refactor has already been published to remote `main`, restore the Web App through a remote revert/rollback commit.

Before significant refactoring, create or identify a known-good stable tag/release when practical.

---

# 9E. AI Implementation Completion Protocol

An AI coding assistant must not treat "code written" as equivalent to "task complete."

Before creating the local commit, it should perform a requirement-level self-audit.

The completion report should include:

```text
1. Requirement checklist
2. Changed files
3. Data-source changes
4. Calculation changes
5. Persistence/schema changes
6. Regression risks
7. Tests performed
8. Known limitations
```

Each explicit user requirement should be marked individually.

Example:

```text
Requirements

[PASS] Existing Growth table unchanged
[PASS] X-axis always shows Jan-Dec
[PASS] Future months remain empty
[PASS] Left Y-axis shows monthly total change
[PASS] Right Y-axis shows valuation
[PASS] Positive bars are blue
[PASS] Negative bars are red
[PASS] Each bar has a visible value label
[PASS] Valuation line stops at the latest real month
```

A requirement should not be marked PASS merely because related code exists.

The assistant should explain how it verified the requirement.

Only after this self-audit should the local commit be created.

---

# 9F. Risk-Based Review Policy

Not every modification requires the same review intensity.

## Low-risk / UI-only changes

Examples:

* chart layout
* CSS
* labels
* visual alignment
* read-only presentation using an existing calculation source

Preferred workflow:

```text
Implementing AI
→ implementation
→ test
→ Completion Protocol
→ local commit
→ user GitHub upload
→ user Web App verification
```

Independent second-AI review is optional.

---

## High-risk changes

Examples:

* portfolio_state schema
* holdings mutation
* qty / avg / cash
* save / restore
* Supabase persistence
* historical financial records
* financial calculations
* migrations
* Year-End Snapshot architecture

Preferred workflow:

```text
Implementing AI
→ inspect source
→ produce design/schema plan first

Independent reviewing AI
→ review design
→ challenge assumptions
→ verify maintainability and data invariants

User
→ approve design

Implementing AI
→ implement
→ test
→ Completion Protocol
→ local commit

User
→ publish through GitHub

Independent reviewing AI
→ inspect actual remote commit
→ final review

User
→ production regression
```

Do not skip the design-review stage for high-risk financial-data architecture merely because the implementing AI is confident.

---

# 9G. History Table Snapshot — Current Architecture

The previous Year-End Snapshot architecture was abandoned before production implementation.

Do **not** reintroduce the former:

* TEST / DRAFT / FINAL state machine,
* automatic year-end reconstruction,
* late-finalize reconstruction logic,
* immutable FINAL / supersede workflow,
* annual Performance recalculation inside History,
* target-year financial recalculation inside History.

The production implementation uses a deliberately simpler model:

> The user explicitly snapshots the table currently visible in the live application.

History does not recalculate historical financial values.

## Production Snapshot Types

Three snapshot types are supported:

* `performance`
* `growth_dividend`
* `cash_like`

The UI sources are:

* Overview → Performance
* Growth & Dividend → Monthly Financial Asset Growth + Dividend Status
* Cash Management → Cash-Like Assets

The former separate Dividend Account Total table was removed from the live Growth & Dividend view because the Dividend Status table already contains its total row.

## Snapshot Workflow

The user:

1. opens the relevant live table,
2. presses `Snapshot`,
3. selects the target year,
4. confirms the save.

If a snapshot already exists for the same:

`user_id + year + snapshot_type`

the application displays the existing snapshot timestamp and asks for confirmation before replacement.

Confirmed replacement uses UPSERT semantics.

Snapshots may be created at any time.

There is no system-level concept of TEST, DRAFT, or FINAL.

The user determines when the displayed live table is worth preserving.

## Storage

2026+ table snapshots are stored separately from `portfolio_state` in Supabase:

`public.portfolio_table_snapshots`

The table uses:

* `user_id`
* `year`
* `snapshot_type`
* `schema_version`
* `captured_at`
* `valuation_date`
* `snapshot_data`
* `updated_at`

A unique constraint exists on:

`(user_id, year, snapshot_type)`

RLS is enabled for the new table.

Authenticated users may access only rows whose `user_id` matches `auth.uid()`.

The repository schema source is:

`sql/create_portfolio_table_snapshots.sql`

## Historical Integrity

Snapshot data is captured as structured table data:

* headers,
* rows,
* table metadata.

Do not store raw HTML.

Do not recalculate the historical table later using current financial formulas, current mappings, or current market prices.

The central invariant is:

> History displays the values that were visible when the user explicitly created that snapshot.

Each History section displays:

* snapshot capture date/time,
* valuation date when available.

## 2025 Compatibility

The existing 2025 frozen legacy History remains unchanged.

The unified History UI combines:

* 2025 → existing legacy renderer,
* 2026+ → Supabase table snapshots.

Do not migrate 2025 unless explicitly requested.

## Income & Tax

Income & Tax is not part of the table snapshot payload.

Keep the existing Income & Tax behavior unless a separate requirement explicitly changes it.

## Persistence Isolation

`portfolio_table_snapshots` is physically separate from `portfolio_state`.

Therefore normal portfolio-state saves or restores must not delete table snapshots.

Do not move these snapshots back into the whole-blob `portfolio_state` architecture.

## Implementation Ownership

Primary implementation:

* `v34-table-snapshot.js`
* `v34-table-snapshot.css`
* `sql/create_portfolio_table_snapshots.sql`

Load integration:

* `index.html`

The implementation intentionally avoids modifying the large financial calculation files.

History table snapshots must remain a presentation-state preservation feature, not a second financial calculation engine.

## Simplicity Rule

This feature is the reference example for the project's simplicity-first design principle:

> Prefer the smallest mechanism that directly satisfies the user's actual workflow before introducing generalized lifecycle, reconstruction, migration, or recovery architecture.

Do not add complexity merely for hypothetical future requirements.

---


# 10. General Design Principle

Portfolio Control is a personal long-term financial record.

Prefer:

```text
data correctness
→ historical integrity
→ maintainability
→ simple UX
→ additional features
```

Avoid clever automation when a simple explicit user action is safer.

Do not rewrite stable financial logic merely for architectural elegance.

When a known theoretical risk has extremely low probability under the actual single-writer usage model, weigh the regression risk of changing stable core logic before modifying it.

---

# 11. Architecture — High Level

The repository is a static browser application with multiple legacy and v3.3 JavaScript layers.

Important categories include:

```text
app1.js
app2.js
app3.js
    Base application and legacy logic

patch-v31.js
patch-v32.js
patch-v321.js
patch-v322.js
    Legacy evolution / migration layers

v33-core.js
    Major v3.3 integration/data/market layer

v33-dashboard.js
    Overview/dashboard rendering

v33-tabs-*
    Final tab/navigation structure

v33-views*
    v3.3 view-related rendering

v33-ops*
    Operations-related functionality

v33-lifecycle.js
v33-lifecycle-v2.js
    Holding lifecycle / Closed / Reactivate logic

v33-child-editor.js
    Current CHILD holdings UI

v33-closed-delete.js
    Permanent deletion of Closed holding records

v33-manual-market.js
    Manual VKOSPI/gold fallback values

v33-backup.js
    Safe Backup/Restore layer

scripts/update_market.py
    Market-indicator updater

scripts/update_korea.py
    Korean listed-asset price updater
```

Because the application evolved through patches:

> **Load order matters.**

Do not add another wrapper/override without checking existing ownership first.

Always inspect the current repository because filenames and ownership may evolve.

---

# 12. Current UI

The application currently contains eight main tabs.

Major functional areas include:

* Overview
* Allocation
* Holdings / account holdings
* Operations / financial management
* Performance
* Growth & dividends
* History
* Market / market prices

The exact current tab names and renderer must always be verified against HEAD before modification.

---

# 13. Table Alignment Convention

Financial tables use this visual convention:

* identifying text / row-label columns → left aligned
* numeric/value columns → right aligned
* numeric input fields → right aligned
* asset-name sticky columns → left aligned

This convention was explicitly chosen after comparing other alignment styles.

Preserve it.

---

# 14. Navigation Active-State Convention

The currently selected main tab should be visually highlighted.

The implementation was added as a UI improvement after all tabs previously appeared white.

Before changing navigation styling, inspect the current tab renderer and active-state class.

Do not assume `.active`, `.on`, or another class without verifying the actual source.

---

# 15. Allocation Policy

Current Core Allocation ordering is:

```text
NASDAQ
S&P500
US-CVD
K-DVD
BOND
GOLD
```

This ordering conceptually follows:

```text
EQUITY
INCOME
HEDGE
```

Target allocation editing is intentionally **not currently implemented**.

Reason:

Target allocation is a policy variable used for rebalancing decisions.

Making targets casually editable risks changing the investment rule in response to market movements.

If target editing is added later, use guardrails:

* explicit "Edit targets" mode
* total must equal 100%
* before/after summary
* effective date
* change reason
* preferably target-change history

Do not make target cells casually inline-editable.

---

# 16. CHILD Account

Real child names must not be used.

Canonical owner/display names:

```text
GIRL
BOY
```

The previous Korean names were intentionally anonymized.

Current CHILD UI follows the same general holdings style as other accounts.

Features include:

* qty editable
* average price editable
* * holding
* Save/Recalculate
* separate GIRL cash
* separate BOY cash
* market-price-based valuation
* lifecycle support

Owner-specific cash is stored through CHILD profiles.

---

# 17. CHILD Duplicate Bug — Critical Historical Context

A duplicate-holding bug was found after CHILD owner anonymization.

## Root Cause

Legacy `ensureChildV33()` logic in `v33-core.js` contained hardcoded CHILD defaults:

```text
child-h1
child-h2
child-h3
child-h4
```

using the previous Korean owner names.

After owners became GIRL/BOY:

1. Supabase contained GIRL/BOY holdings.
2. Legacy migration searched for the old owner names.
3. It concluded the default holdings were missing.
4. It pushed four default holdings again.
5. CHILD migration converted the new legacy owners to GIRL/BOY.
6. Eight Active records resulted.

The duplicates even had identical IDs.

## Permanent Fix

Known fix commit:

```text
923338850c7267670b44e7794ac27521e90f7ab5
```

The `CHILD_DEFAULTS.forEach(...)` automatic holding-recreation block was removed from `ensureChildV33()`.

Existing duplicate Active records were cleaned by retaining one record for each duplicate ID.

Verification:

```text
first refresh
→ 4 Active holdings

second refresh
→ still 4

another PC
→ 4
```

No recurring recreation was observed.

## Rule

**Never reintroduce logic that creates real holdings with real quantities merely because a holding is absent.**

Schema migration must not recreate investment positions.

---

# 18. Holding Lifecycle

Holdings support:

```text
Active
→ Close
→ Closed history
→ Reactivate
```

Full lifecycle regression has been performed successfully.

Closed history now provides:

```text
[Reactivate] [Delete]
```

`v33-closed-delete.js` implements permanent deletion.

Important historical edge case:

An Active and Closed CHILD record may share the same ID.

Therefore Closed deletion must identify:

```text
matching ID
AND
non-Active status
```

Never delete an Active record merely by ID.

Closed deletion and Supabase synchronization were verified across PCs.

---

# 19. Market Price Architecture

Two main scheduled GitHub Actions exist.

## Update Market Prices

KST schedule:

```text
07:30
12:00
16:30
```

## Update Korea Prices

KST schedule:

```text
12:00
16:30
```

The noon update was intentionally added because portfolio purchases are often made in the afternoon and Allocation should use reasonably current market prices.

The 12:00 scheduled runs were verified successfully in production on:

* desktop
* notebook
* mobile

---

# 20. VKOSPI Automation

VKOSPI was originally manual because a convenient official source was difficult to use.

It is now automated.

Source:

```text
Investing.com
KSVKOSPI
```

A dedicated GitHub Actions test verified that the GitHub runner can fetch the page and extract the live value.

An early production implementation produced an invalid approximately `-99.98%` daily change because the previous-close parser matched an unrelated number.

The implementation was changed to parse Investing.com's displayed percentage-change value directly.

Known related commit:

```text
89060466432df563ead6f20687ade486a2112200
```

Always verify the current implementation before changing it.

---

# 21. Gold Automation

Gold monitoring exists mainly to detect unusually large Korean-versus-international gold premiums.

Automatic source:

```text
https://gold-kr.web.app/
```

GitHub Actions runner access was tested successfully.

Values extracted:

```text
GOLD_KR
    KRX domestic gold spot
    KRW/g

GOLD_INTL
    international gold converted to KRW/g
```

Premium:

```text
(GOLD_KR / GOLD_INTL - 1) * 100
```

The parser was validated against the premium displayed by the source itself.

Example successful test:

```text
GOLD_INTL: 197152 KRW/g
GOLD_KR:   195760 KRW/g

Calculated premium: -0.71%
Source premium:     -0.71%
```

The manual VKOSPI/gold input system remains intentionally available as a fallback.

Automatic DB values take priority when available.

---

# 22. Gold Daily-Change Display

GOLD_KR and GOLD_INTL currently do not necessarily have valid previous-day values.

Therefore:

```text
changePct = null
```

must not render as:

```text
0.00%
```

JavaScript behavior:

```text
Number(null) === 0
```

previously caused a fake zero-percent display.

The dashboard was modified so null/undefined/empty market-change values display no percentage.

Preserve this behavior unless actual previous-day gold data is implemented.

---

# 23. Manual Market Fallback

Manual indicators include:

* VKOSPI
* domestic gold
* international gold

They were moved into portfolio state so they participate in backup/synchronization.

Automatic values now have priority.

Manual values remain intentionally available as fallback in case an external source changes or fails.

Do not remove the fallback merely because current automation works.

---

# 24. Backup / Restore

Backup exports the portfolio `data` structure.

Safe restore functionality exists in:

```text
v33-backup.js
```

It adds:

* backup validation
* confirmation
* pre-restore safety backup download
* restore
* migration/rollover
* save/cloud persistence
* render

Backup was verified to include:

```text
manualMarket
childProfiles
owner-specific CHILD cash
```

At one stage, a true home-notebook end-to-end Restore test remained pending.

Before claiming Restore is fully production-verified, confirm whether that test has since been completed.

---

# 25. Security / Accepted Risks

A Pro audit was performed under a general public/multi-user web-application threat model.

Actual usage is much narrower:

* personal application
* effectively single writer
* company PC is primary editor
* notebook/mobile mainly read-only
* owner/spouse are expected users

## 25.1 Supabase RLS

`portfolio_state` RLS was found to be disabled.

This is a known security risk.

The user understands that portfolio composition, quantities, average prices, and asset scale are privacy information but do not themselves provide brokerage-account credentials.

The user has chosen to accept this risk for now.

Status:

```text
Known / Accepted Risk
```

Do not repeatedly reopen this issue unless security hardening is explicitly requested.

## 25.2 Save Race

The Pro audit identified a theoretical save race if another save occurs while cloud persistence is already busy.

Given the actual single-writer/manual workflow, the user considers the scenario extremely unlikely.

Changing core persistence also carries regression risk.

Status:

```text
Known / Accepted Risk
```

Do not modify core save/flush logic unless:

* the use case changes,
* multi-device editing becomes common,
* or an actual incident occurs.

---

# 26. NEXT TODO — Growth Monthly Graph

This is the preferred next implementation task.

## Existing Table

Do **not** replace or redesign the existing:

```text
2026 월별 금융자산 Growth
```

table.

Keep it unchanged.

## Add One Graph Directly Below It

The graph should show monthly portfolio growth.

### X Axis

```text
1월 ... 12월
```

### Total Change

Use bars.

Zero is the central baseline.

```text
positive total change
→ blue bar upward

negative total change
→ red bar downward
```

### Valuation

Use:

```text
line + point
```

on a separate right-side Y axis.

Purpose:

See both:

* monthly change
* total valuation trajectory

in one graph.

## Do Not Add Unnecessary Mode Switching

An earlier concept considered:

```text
Monthly / 2025 / YTD / TR
```

switches.

This was rejected.

Final requirement:

> one simple monthly Growth graph.

## Implementation Guidance

Before coding:

1. Read the actual latest Growth renderer.
2. Read the actual existing financial-management Simulation graph implementation.
3. Identify the chart library and style already used.
4. Reuse that implementation/library/style where practical.
5. Reuse the exact same data source as the existing Growth table.

Do not create a second independent Growth calculation source merely for the chart.

---
# 27. History Table Snapshot — Production Requirement

The previous generalized Year-End Snapshot design was abandoned before production implementation.

The current production design is intentionally simple:

> The user snapshots the live table that is currently visible and stores that structured table state under a selected History year.

History is a storage and rendering feature.

History must not become a second financial calculation engine.

---

# 28. Snapshot Sources

Three snapshot types are supported.

## Performance

Source:

`Overview → Performance`

Snapshot type:

`performance`

The snapshot stores the table values visible to the user at capture time.

## Growth & Dividend

Sources:

* Monthly Financial Asset Growth
* Dividend Status

Snapshot type:

`growth_dividend`

These two tables are stored together as one snapshot group.

The former separate Dividend Account Total table is not part of the current UI or snapshot requirement because the Dividend Status table already contains its total row.

## Cash-Like Assets

Source:

`Cash Management → Cash-Like Assets`

Snapshot type:

`cash_like`

---

# 29. User-Controlled Snapshot Workflow

Snapshot creation is explicitly user-triggered.

Workflow:

1. open the live source table,
2. press the Snapshot button,
3. select the History year,
4. confirm the save.

Snapshots may be created at any time.

The system does not attempt to determine whether the current date is the true year-end date.

The system does not automatically create a year-end snapshot.

The user decides when the currently displayed data should be preserved.

For the current year, the current year should be the default selection.

Do not allow accidental future-year snapshot creation.

If a non-current historical year is selected, show an additional warning because the current live table is about to replace historical data for another year.

---

# 30. Re-Snapshot / Replacement

Only one active snapshot exists for each:

`user_id + year + snapshot_type`

If a snapshot already exists for that combination:

1. show that a snapshot already exists,
2. show its previous capture timestamp,
3. ask for explicit confirmation,
4. replace it only after confirmation.

Replacement uses UPSERT semantics.

There is no TEST / DRAFT / FINAL lifecycle.

There is no immutable FINAL concept.

There is no automatic supersede/archive workflow.

If future requirements need snapshot version history, design that feature separately rather than adding it speculatively now.

---

# 31. Snapshot Data Contract

Snapshots must store structured data, not raw HTML.

Minimum table structure:

* table key,
* table title,
* headers,
* rows.

Snapshot metadata must include:

* target year,
* snapshot type,
* schema version,
* captured timestamp,
* valuation date when available.

The stored values represent what the user saw at snapshot time.

Do not later reconstruct the snapshot using:

* current market prices,
* current holdings,
* current mappings,
* current Performance formulas,
* current Growth formulas,
* current Cash formulas.

The historical rendering rule is:

> Render stored snapshot values. Do not recalculate them.

---

# 32. Supabase Persistence

2026+ table snapshots are stored in:

`public.portfolio_table_snapshots`

This table is separate from:

`portfolio_state`

The current schema source is:

`sql/create_portfolio_table_snapshots.sql`

Snapshot types:

* `performance`
* `growth_dividend`
* `cash_like`

Unique key:

`(user_id, year, snapshot_type)`

RLS is enabled.

The authenticated role has the required table privileges.

Row policies restrict access to:

`auth.uid() = user_id`

Do not move table snapshots into the existing whole-blob `portfolio_state`.

The separation exists so that normal portfolio-state saves, stale-device saves, or portfolio backup restores do not silently remove historical table snapshots.

---

# 33. History Rendering

The History UI uses a unified year selector.

## 2025

Use the existing frozen legacy History renderer.

Do not migrate or reinterpret the 2025 data.

## 2026+

Use the table snapshot renderer.

For each stored snapshot section display:

* snapshot capture date/time,
* valuation date when available,
* the stored table or tables.

If a snapshot type has not yet been saved for the selected year, show an explicit empty-state message.

The current implementation must preserve compatibility with the existing History note/sticky behavior.

---

# 34. Income & Tax

Income & Tax remains outside the table snapshot payload.

The existing Income & Tax behavior remains in place.

Do not duplicate Income & Tax inside:

`portfolio_table_snapshots`

Any future change to Income & Tax editability, annual rollover, or tax finalization is a separate requirement.

---

# 35. Implementation and Validation Status

## Implementation Files

Primary implementation:

* `v34-table-snapshot.js`
* `v34-table-snapshot.css`
* `sql/create_portfolio_table_snapshots.sql`

Integration:

* `index.html`

The implementation intentionally avoids modifying the large financial calculation files.

## Production Commits

Core Table Snapshot implementation:

`ec16047f7857f7360fb7ddce9a09b45ec907e724`

Database schema source:

`dc8bd44bd0e642a2c7da8cbce2e242c91ca54593`

## Verified Behavior

The following behavior has been verified in production:

* Performance snapshot creation,
* Growth + Dividend snapshot creation,
* Cash-Like Assets snapshot creation,
* Supabase persistence,
* History 2026 rendering,
* existing 2025 History preservation,
* snapshot capture timestamp display,
* valuation-date display,
* re-snapshot confirmation,
* UPSERT replacement,
* live Cash-Like value update followed by re-snapshot and correct History replacement,
* reload persistence,
* cross-device History visibility,
* removal of the redundant Dividend Account Total table from the live Growth & Dividend view.

## Known Architecture

History table snapshots preserve presentation data.

They do not preserve or execute historical financial calculation logic.

This is intentional.

The authoritative historical fact is:

> the structured table state explicitly captured by the user.

## Future History Analytics

Future multi-year History charts may use stored structured snapshot data.

Do not implement those charts until explicitly requested.

Do not redesign the current snapshot storage merely to anticipate hypothetical analytics.

---
# 35A. Overview Performance 2×4 KPI

현재 구현 파일:

v33-overview-performance-kpi.js

기능 구현 checkpoint:

ef3f378b7458897e9fdb167713c0efc63972311c

Commit:

Add Overview Performance 2x4 KPI cards

Overview → Performance KPI는 desktop 기준 2 rows × 4 columns이다.

배치:

Row 1
1. 연금합산 {YY} YTD
2. 연금합산 SI CAGR
3. Total {YY} YTD
4. Total SI CAGR

Row 2
5. 삼성전자우 {YY} YTD
6. 삼성전자우 TR
7. Household Asset {YY} YTD
8. Household Asset TR

YTD 카드 표시:

+x.xx% (증감액)

증감액은 YTD %보다 작은 font와 muted color를 사용한다.

Accent:

- 기존 SI CAGR: blue
- 삼성전자우 TR: purple
- Household Asset TR: green

이 기능은 새로운 Performance 계산 engine이 아니다.

Authoritative source:

연금합산 / Total
→ 기존 Performance calculation / presentation

삼성전자우
→ holdingMetric 및 Market yearStart

Household Asset
→ 기존 Growth / v32MonthlyRows

Overview 전용 annual state 또는 별도의 YTD 계산 engine을 만들지 않는다.

동일한 v33-overview-performance-kpi.js를 root / 와 /v35/ 에서 공통으로 load한다.

단 Annual Transition behavior는 /v35/ 전용이다.

2026 runtime 검증:

root /
→ PASS

/v35/
→ PASS

/v35/ 의 SI CAGR은 v35의 year-aware / dynamic-duration semantics를 사용하므로 root / 의 SI CAGR과 반드시 동일할 필요는 없다.

2027 Performance rollover simulation:

연금합산 27 YTD
→ +0.00% (0만원)
→ PASS

Total 27 YTD
→ +0.00% (0만원)
→ PASS

2027 Growth rollover dry-run:

Household Asset 27 YTD authoritative start state
→ +0.00% (0만원)
→ PASS

삼성전자우:

27 YTD label
→ PASS

27 YTD value
→ 아직 2027 기준으로 유효하지 않음

원인:

holding YTD = current / market.yearStart - 1

Market yearStart rollover가 아직 구현되지 않았다.

이 문제를 Overview 전용 계산으로 우회하지 않는다.

Phase 8 Integrated Annual Rollover에서 authoritative Market state를 수정하여 해결한다.

자세한 내용은 ANNUAL_TRANSITION.md를 따른다.

---
# 36. Regression Checklist Before Next Stable Release

At minimum verify the following.

## Overview

* total financial assets
* account valuations
* Performance table
* market cards

## Allocation

* Core allocation
* Sleeve allocation
* target/current weights
* rebalancing status

## Holdings

* qty
* avg
* cash
* valuation
* Save/Recalculate
* * holding

## CHILD

Expected Active holdings:

```text
GIRL = 2
BOY  = 2
Total = 4
```

Verify:

* owner cash
* valuation
* no duplicate recreation

## Lifecycle

* Close
* Cancel close
* Closed history
* Reactivate
* Delete Closed record

## Operations / Financial Management

* existing records
* cash-like assets
* Simulation graph

## Performance

* account rows
* aggregate rows
* previously Excel-reconciled values

## Growth & Dividend

* existing table unchanged
* new graph uses the same source
* dividend tables unchanged

## History

* 2025 unchanged
* 2026+ snapshot creation
* snapshot persistence
* snapshot immutability
* Income & Tax editability

## Market

* DB reload
* VKOSPI
* GOLD_KR
* GOLD_INTL
* gold premium
* manual fallback

## Automation

* Update Market Prices schedule
* Update Korea Prices schedule

## Multi-Device

Verify read consistency on at least:

```text
desktop
notebook
mobile
```

## Backup

Create a JSON backup after major schema changes.

If History Snapshot adds new fields, confirm they are included in backup.

---

# 37. How to Continue in a New AI Session

This section applies equally to ChatGPT, Claude, Gemini, another coding assistant, or a human developer.

Start with a message similar to:

```text
This is the Portfolio Control project:

https://github.com/sinyong-0904/portfolio-control

새 AI 세션에서는 다음 문서를 먼저 읽는다.

1. PROJECT_HANDOFF.md
2. ANNUAL_TRANSITION.md
3. VERSION_OPERATIONS.md

각 문서의 역할은 다음과 같다.

PROJECT_HANDOFF.md
- 코드 수정 및 유지보수 절차
- HEAD → READ → VERIFY → PATCH 원칙
- 프로젝트의 주요 구조와 현재 작업 상태

ANNUAL_TRANSITION.md
- 연도 전환 설계
- Phase 1~7 구현 및 검증 상태
- Phase 8 Integrated Annual Rollover 요구사항

VERSION_OPERATIONS.md
- /v35/ Production / Authoritative Writer 정책
- root / Stable Reference 정책
- 버전 공존 및 비교 원칙

새 세션은 과거 대화 내용을 알고 있다고 가정하지 않는다.

위 3개 문서와 최신 Git HEAD만 읽고도 현재 작업을 이어갈 수 있어야 한다.

Before proposing any code:
1. determine the latest HEAD commit SHA,
2. read the actual files from that immutable commit,
3. verify every function/selector/anchor you reference,
4. only then propose a patch.

Do not rely on remembered or assumed code.

Continue with the next TODO listed in PROJECT_HANDOFF.md.
```

If repository retrieval returns stale `main` content or a cache miss:

```text
Do not guess.

Resolve the latest HEAD SHA and retry using immutable commit URLs.
```

If repository access still fails:

> Stop.

Do not generate code based on assumed repository structure.

---
# 38. Current Preferred Work Order

현재 Phase 8 코드 구현 전 기능 checkpoint:

ef3f378b7458897e9fdb167713c0efc63972311c

Commit:

Add Overview Performance 2x4 KPI cards

현재 상태:

History Table Snapshot
→ COMPLETE

v3.5 Annual Transition Phase 1~7
→ IMPLEMENTED
→ future-year simulation VERIFIED
→ 세부 내용은 ANNUAL_TRANSITION.md 참고

/v35/ authoritative-writer coexistence
→ 실제 portfolio edit / Save / reload로 VERIFIED

Overview Performance 2×4 KPI
→ COMPLETE

Actual Integrated Annual Rollover
→ NOT YET IMPLEMENTED

다음 주요 작업:

Phase 8 — Actual Integrated Annual Rollover

Phase 8 코드 수정 전에 반드시:

1. local repository를 최신 remote HEAD와 sync
2. PROJECT_HANDOFF.md 확인
3. ANNUAL_TRANSITION.md 확인
4. VERSION_OPERATIONS.md 확인
5. immutable HEAD의 실제 Phase 1~7 source 확인
6. Phase 8 implementation plan 작성
7. high-risk design review 수행
8. 사용자 승인
9. 실제 구현

Phase 1~7에서 이미 검증된 future-year behavior를 Phase 8 actual rollover의 specification으로 사용한다.

새로운 source/runtime evidence 없이 기존 검증 결과를 임의로 재설계하지 않는다.

Phase 8 필수 누락사항:

Market yearStart rollover

현재 holding YTD:

current / yearStart - 1

2027 simulation에서 business-year label만 27로 전환할 경우 삼성전자우 YTD가 기존 2026 yearStart를 계속 사용하는 것이 실제 확인되었다.

따라서 Phase 8에서 Market yearStart를 authoritative하게 rollover해야 한다.

Overview 전용 workaround를 만들지 않는다.

구체적인 Phase 8 요구사항은 ANNUAL_TRANSITION.md를 따른다.

버전 운영 정책은 VERSION_OPERATIONS.md를 따른다.

---

# 39. Final Maintenance Rule

Portfolio Control은 여러 세대의 compatibility logic과 patch layer가 존재한다.

따라서 유지보수 순서는 다음을 기본으로 한다.

HEAD
→ READ
→ VERIFY
→ ownership / load order 확인
→ invariant 확인
→ 최소 수정안 선택
→ PATCH
→ static self-review
→ localhost runtime verification
→ Completion Protocol
→ 사용자 commit 승인
→ remote commit verification

architectural elegance보다 다음을 우선한다.

correct financial state
→ preserved historical meaning
→ minimal regression surface
→ maintainability across future AI sessions