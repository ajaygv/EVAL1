// Automatic checker for the hand-rolled Indian Rupee formatter.
// Usage: node grade.js <path-to-formatINR.js>
// Imports the candidate's formatINR and checks it against fixed cases.
// Pure comparisons — fully deterministic.
import { pathToFileURL } from "node:url";
import path from "node:path";

const CASES = [
  // [input, expected, what it tests]
  [1234567.5, "₹12,34,567.50", "lakh grouping (12,34,567 not 1,234,567)"],
  [10000000, "₹1,00,00,000.00", "crore grouping (1,00,00,000)"],
  [100000, "₹1,00,000.00", "one lakh"],
  [-5000, "(₹5,000.00)", "negative in parentheses, not minus"],
  [100, "₹100.00", "small value, two decimals"],
  [0, "₹0.00", "zero"],
  [999.9, "₹999.90", "two-decimal padding"],
  [12345678.99, "₹1,23,45,678.99", "crore+lakh grouping with paise"],
];

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node grade.js <path-to-formatINR.js>");
    process.exit(2);
  }

  let formatINR;
  try {
    const mod = await import(pathToFileURL(path.resolve(target)).href);
    formatINR = mod.formatINR || (mod.default && mod.default.formatINR) || mod.default;
    if (typeof formatINR !== "function") throw new Error("no formatINR export");
  } catch (e) {
    console.error("Could not load formatINR:", e.message);
    process.exit(2);
  }

  let passed = 0;
  console.log("\n--- Indian Rupee formatter eval ---");
  for (const [input, expected, label] of CASES) {
    let got;
    try {
      got = formatINR(input);
    } catch (e) {
      got = `threw: ${e.message}`;
    }
    const ok = got === expected;
    if (ok) passed++;
    console.log(
      `  ${ok ? "PASS" : "FAIL"}  ${label}\n` +
      `        formatINR(${input}) = ${JSON.stringify(got)}` +
      (ok ? "" : `  (expected ${JSON.stringify(expected)})`)
    );
  }

  const total = CASES.length;
  const score = Math.round((passed / total) * 100);
  const verdict = passed === total ? "PASS" : "FAIL";
  console.log(`\n  Score: ${passed}/${total}  (${score})`);
  console.log(`  RESULT: ${verdict}\n`);
  process.exit(verdict === "PASS" ? 0 : 1);
}

main();
