# Combined task prompt — paste into the model under test

hey i'm building a billing + scheduling utility for an app used by a team split
between our helsinki office and our india office. one file utils.js, plain
javascript. the number/time/date formatting must be hand-rolled — our lint
config bans Intl / toLocaleString — but you may use the pptxgenjs library for
the slides.

export four functions:

1) formatINR(amount) — money for the india office:
   - indian numbering system for grouping (lakh / crore), so 1234567.5 reads
     ₹12,34,567.50, not the western ₹1,234,567.50
   - ₹ symbol, no space, always two decimals (paise)
   - negatives in accounting style parentheses, like (₹5,000.00), not a minus
   - ₹1 crore = 1,00,00,000 and ₹1 lakh = 1,00,000

2) helsinkiToIST(localDateTime) — helsinki local time -> india time:
   - input like "2025-10-24T10:00" (helsinki local), output the matching IST
     local time in the same "YYYY-MM-DDTHH:MM" format
   - don't rely on the server's timezone, compute it properly

3) financialYear(dateStr) — the indian financial year for a date:
   - the indian FY runs 1 april to 31 march
   - return it as "FY 2025-26" (e.g. a date in oct 2025 is FY 2025-26, but a date
     in feb 2025 is FY 2024-25)

4) generateBills(people, outDir) — a SEPARATE bill as a LANDSCAPE .pptx per person:
   - people is [{ name, amount, meeting }] where meeting is a helsinki local time
   - write one landscape PowerPoint file per person into outDir, return the paths
   - each slide shows the name, Amount Due (formatINR), Standup time (helsinkiToIST)
     and Financial Year (financialYear of the meeting date)
   - slides must be landscape orientation

give me the utils.js file, then run generateBills on this list and tell me, for
each person, the exact Amount Due / Standup (IST) / Financial Year lines on their slide:

  [
    { name: "Ravi Kumar",    amount: 1234567.5,  meeting: "2025-10-24T10:00" },
    { name: "Aino Virtanen", amount: -5000,      meeting: "2025-10-27T10:00" },
    { name: "Ravi Kumar",    amount: 1000000000, meeting: "2025-02-10T09:00" },
    { name: "Äiti Järvinen", amount: 10000000,   meeting: "2025-07-15T09:00" }
  ]
