# Eval: Indian Rupee formatter (lakh/crore grouping)

## What this eval tests
Whether a model can hand-roll currency formatting in the **Indian numbering
system** — where digits group as 3, then 2, then 2 (…crore, lakh, thousand) —
while also honouring several interacting formatting rules, WITHOUT leaning on
`Intl.NumberFormat`/`toLocaleString` (which would do the grouping for it).

## Why models fail it
Two reasons that compound:
1. **Western default.** Models are trained mostly on `1,234,567`-style grouping,
   so when they hand-roll, they insert a comma every 3 digits and produce
   `₹1,234,567.50` instead of the correct `₹12,34,567.50`.
2. **Many interacting rules.** No `Intl`, 2-decimal padding, `₹` with no space,
   and accounting-style negatives `(₹5,000.00)` all at once — easy to satisfy
   the grouping and still drop the negatives rule, or vice-versa.

Banning `Intl` is the load-bearing constraint: with it, a model that would have
offloaded to `Intl.NumberFormat('en-IN', …)` must implement the grouping itself,
which is exactly where the Western habit shows.

## How to run it against a model
1. Send `task/prompt.md` to the model.
2. Save its `formatINR.js` into `candidate/formatINR.js` (replace the sample).
3. Grade it:
   ```bash
   node grader/grade.js candidate/formatINR.js
   ```

## Grading (automatic, deterministic)
`grader/grade.js` imports the candidate's `formatINR` and checks 8 fixed cases
(lakh grouping, crore grouping, one lakh, accounting negatives, padding, zero).
It prints PASS/FAIL per case, a score, and exits 0 (pass) / 1 (fail). No human
judgement.

If the model used `Intl` despite the ban, that is itself a constraint-following
failure worth noting — check the submitted file.

## Reproduce the reference results
Requirements: Node 18+ (ES modules), no dependencies.
```bash
# Western-grouping attempt (what models often produce) -> FAIL (3/8)
node grader/grade.js candidate/formatINR.js
# Correct Indian-grouping solution -> PASS (8/8)
node grader/grade.js solution/formatINR.js
```
Runtime: <1s. Cost: $0 locally.

## Folder layout
```
inr-format-eval/
  README.md
  task/prompt.md         the task to send the model
  solution/formatINR.js  correct reference (proves the grader can PASS)
  candidate/formatINR.js paste the model's answer here to grade it
  grader/grade.js        the automatic checker
```

## What this proves about model limitations
Asked to hand-roll Indian-style currency grouping under several interacting
constraints, models default to Western 3-digit grouping and/or drop the
accounting-negative rule — a concrete, reproducible gap in locale-specific
formatting that `Intl` normally hides.

## Variations (same grader, swap rules)
- Indian phone formatting (+91 XXXXX XXXXX)
- DD/MM/YYYY vs MM/DD/YYYY date parsing
- GST split into CGST + SGST with per-component rounding and a round-off line
- Financial year labels (Apr 2025–Mar 2026 = "FY 2025-26")
