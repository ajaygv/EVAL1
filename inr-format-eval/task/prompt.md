# Task prompt — paste into the model under test

hey i need a small utility for an indian billing app. write a function
formatINR(amount) in plain javascript, exported from a file formatINR.js.

important constraints, our lint config bans them so please follow exactly:
- do NOT use Intl.NumberFormat or toLocaleString, hand-roll the formatting
- no external libraries

rules for the output:
- use the indian numbering system for grouping (lakh / crore), e.g. twelve lakh
  thirty four thousand five hundred sixty seven point five should read
  ₹12,34,567.50 — not the western ₹1,234,567.50
- prefix with the ₹ symbol, no space before the number
- always show exactly two decimal places (paise)
- show negative amounts in accounting style, in parentheses, e.g. (₹5,000.00),
  not with a minus sign
- ₹1 crore is 1,00,00,000 and ₹1 lakh is 1,00,000

give me just the formatINR.js file.
