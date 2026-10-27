// Combined checker: Indian Rupee formatting + Helsinki->IST + Indian FY +
// per-person landscape .pptx bills (with hidden edge cases in the data).
// Usage: node grade.js <path-to-utils.js>
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";

function pptxText(file) {
  let xml = "";
  for (let i = 1; i <= 20; i++) {
    try {
      xml += execFileSync("unzip", ["-p", file, `ppt/slides/slide${i}.xml`], {
        encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
      });
    } catch { break; }
  }
  return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(" ");
}
function pptxIsLandscape(file) {
  try {
    const xml = execFileSync("unzip", ["-p", file, "ppt/presentation.xml"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    });
    const m = xml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
    return m ? Number(m[1]) > Number(m[2]) : false;
  } catch { return false; }
}

const INR_CASES = [
  [1234567.5, "₹12,34,567.50", "lakh grouping"],
  [10000000, "₹1,00,00,000.00", "crore grouping"],
  [1000000000, "₹1,00,00,00,000.00", "arab grouping (100 crore)"],
  [-5000, "(₹5,000.00)", "negative in parentheses"],
  [999.9, "₹999.90", "two-decimal padding"],
];
const TZ_CASES = [
  ["2025-10-24T10:00", "2025-10-24T12:30", "summer (gap 2:30)"],
  ["2025-10-27T10:00", "2025-10-27T13:30", "winter (gap 3:30)"],
  ["2025-07-15T09:00", "2025-07-15T11:30", "mid-summer"],
  ["2025-02-10T09:00", "2025-02-10T12:30", "winter morning"],
];
const FY_CASES = [
  ["2025-10-24T10:00", "FY 2025-26", "October -> current FY"],
  ["2025-02-10T09:00", "FY 2024-25", "February -> previous FY"],
  ["2025-04-01T00:00", "FY 2025-26", "April 1 -> new FY starts"],
  ["2025-03-31T23:59", "FY 2024-25", "March 31 -> still previous FY"],
];

// Hidden edge cases live HERE, in the data, not in the prompt:
//  - "Ravi Kumar" appears TWICE (file-name collision)
//  - an arab-sized amount
//  - a Finnish name with ä
const PEOPLE = [
  { name: "Ravi Kumar", amount: 1234567.5, meeting: "2025-10-24T10:00" },
  { name: "Aino Virtanen", amount: -5000, meeting: "2025-10-27T10:00" },
  { name: "Ravi Kumar", amount: 1000000000, meeting: "2025-02-10T09:00" },
  { name: "Äiti Järvinen", amount: 10000000, meeting: "2025-07-15T09:00" },
];
const EXPECT = [
  { inr: "₹12,34,567.50", ist: "2025-10-24T12:30", fy: "FY 2025-26" },
  { inr: "(₹5,000.00)", ist: "2025-10-27T13:30", fy: "FY 2025-26" },
  { inr: "₹1,00,00,00,000.00", ist: "2025-02-10T12:30", fy: "FY 2024-25" },
  { inr: "₹1,00,00,000.00", ist: "2025-07-15T11:30", fy: "FY 2025-26" },
];

async function main() {
  const target = process.argv[2];
  if (!target) { console.error("Usage: node grade.js <path-to-utils.js>"); process.exit(2); }
  let mod;
  try { mod = await import(pathToFileURL(path.resolve(target)).href); }
  catch (e) { console.error("Could not load utils:", e.message); process.exit(2); }

  let passed = 0, total = 0;
  const run = (label, fn, cases) => {
    console.log(`\n  [${label}]`);
    if (typeof fn !== "function") { console.log(`    FAIL  export ${label} is missing`); total += cases.length; return; }
    for (const [input, expected, note] of cases) {
      total++;
      let got; try { got = fn(input); } catch (e) { got = `threw: ${e.message}`; }
      const ok = got === expected;
      if (ok) passed++;
      console.log(`    ${ok ? "PASS" : "FAIL"}  ${note}: ${JSON.stringify(got)}` + (ok ? "" : `  (expected ${JSON.stringify(expected)})`));
    }
  };

  console.log("\n--- India/Finland utils eval ---");
  run("formatINR", mod.formatINR, INR_CASES);
  run("helsinkiToIST", mod.helsinkiToIST, TZ_CASES);
  run("financialYear", mod.financialYear, FY_CASES);

  console.log("\n  [generateBills -> landscape .pptx per person]");
  if (typeof mod.generateBills !== "function") {
    console.log("    FAIL  export generateBills is missing");
    total += 2 + EXPECT.length * 3;
  } else {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "bills-"));
    try { await mod.generateBills(PEOPLE, outDir); } catch (e) { console.log(`    generateBills threw: ${e.message}`); }
    const files = fs.readdirSync(outDir).filter((f) => f.endsWith(".pptx")).map((f) => path.join(outDir, f));

    // Hidden catch: duplicate names must NOT collapse into one file.
    total++;
    const countOk = files.length === PEOPLE.length;
    if (countOk) passed++;
    console.log(`    ${countOk ? "PASS" : "FAIL"}  one file per person: got ${files.length}, expected ${PEOPLE.length}` +
      (countOk ? "" : "  (duplicate name overwrote a file)"));

    // All generated slides must be landscape.
    total++;
    const allLandscape = files.length > 0 && files.every(pptxIsLandscape);
    if (allLandscape) passed++;
    console.log(`    ${allLandscape ? "PASS" : "FAIL"}  all slides landscape`);

    // Every person's values must appear somewhere across the generated files.
    const allText = files.map(pptxText).join("\n");
    EXPECT.forEach((exp, i) => {
      for (const [field, needle] of [["amount", exp.inr], ["IST time", exp.ist], ["FY", exp.fy]]) {
        total++;
        const ok = allText.includes(needle);
        if (ok) passed++;
        console.log(`    ${ok ? "PASS" : "FAIL"}  person ${i + 1} ${field} ${JSON.stringify(needle)} present` + (ok ? "" : "  (missing)"));
      }
    });
  }

  const score = Math.round((passed / total) * 100);
  const verdict = passed === total ? "PASS" : "FAIL";
  console.log(`\n  Score: ${passed}/${total}  (${score})`);
  console.log(`  RESULT: ${verdict}\n`);
  process.exit(verdict === "PASS" ? 0 : 1);
}

main();
