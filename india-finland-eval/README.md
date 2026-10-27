# Eval: India/Finland locale utils (rupee formatting + Helsinki→IST)

## What this eval tests
One `utils.js` with three hand-rolled, locale-specific functions a real
India/Finland team would need, under interacting constraints and no `Intl`:

1. **formatINR(amount)** — Indian numbering (lakh/crore: 3 digits then 2s),
   ₹ no space, 2 decimals, accounting-style negatives `(₹5,000.00)`.
2. **helsinkiToIST(localDateTime)** — Helsinki local → India (IST) local,
   where the gap is **+3:30 in winter but +2:30 in summer** because Finland
   observes DST and India does not.
3. **financialYear(dateStr)** — the Indian financial year (1 Apr – 31 Mar) as
   "FY 2025-26"; Jan–Mar belong to the previous FY.
4. **generateBills(people, outDir)** — a SEPARATE **landscape .pptx** bill per
   person, reusing the formatters, so every amount/time/FY must be locale-correct
   across many generated PowerPoint files at once.

## Hidden edge cases (in the DATA, not the prompt)
The grader's `people` list quietly plants three traps the prompt never mentions —
the catch is whether the model handles them unprompted:
- **Duplicate name** ("Ravi Kumar" twice) → name-based filenames overwrite one
  bill. The grader checks the file COUNT equals the number of people.
- **Arab-sized amount** (₹1,00,00,00,000.00) → tests the grouping generalises
  past crore.
- **Finnish name** ("Äiti Järvinen", with ä) → tests filename/encoding handling.

## Requirements
Node 18+ and `pptxgenjs` for the slide generation, plus the `unzip` command
(used by the grader to read the generated .pptx files):
```bash
npm install pptxgenjs
```

## Why models fail it
Two independent locale habits, either of which fails the eval:
- **Rupee grouping:** models default to Western `1,234,567` grouping and/or a
  minus sign instead of parentheses.
- **Timezone gap:** models apply a fixed "India is 3.5h ahead of Finland"
  offset, which is only true in winter — every summer time comes out an hour off.

Combining them raises the load: a model can get the formatting right and still
drop the DST handling, or vice-versa. `Intl` is banned so both must be
hand-rolled, which is where the Western / fixed-offset habits show.

## How to run it against a model
1. Send `task/prompt.md` to the model.
2. Save its `utils.js` into `candidate/utils.js`.
3. Grade it:
   ```bash
   node grader/grade.js candidate/utils.js
   ```

## Grading (automatic, deterministic)
`grader/grade.js` checks 6 rupee cases + 5 timezone cases (summer, winter,
midnight crossing, spring-forward weekend). Prints PASS/FAIL per case, a combined
score, exits 0 (pass) / 1 (fail).

## Reproduce the reference results
Requirements: Node 18+ (ES modules), no dependencies.
```bash
# Western grouping + fixed offset (typical slips) -> FAIL (3/11)
node grader/grade.js candidate/utils.js
# Correct locale-aware solution -> PASS (11/11)
node grader/grade.js solution/utils.js
```
Runtime: <1s. Cost: $0 locally.

## What to check in the model's prose answer
- `formatINR(12345678.99)` → should be `₹1,23,45,678.99` (Indian grouping)
- 10:00 Helsinki standup → **12:30 IST on 2025-10-24** but **13:30 IST on
  2025-10-27**. If both come out the same, it used a fixed offset — caught.

## Folder layout
```
india-finland-eval/
  README.md
  task/prompt.md         the combined task to send the model
  solution/utils.js      correct reference (proves the grader can PASS)
  candidate/utils.js     paste the model's answer here to grade it
  grader/grade.js        the automatic checker
```
