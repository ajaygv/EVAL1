// Correct reference — billing + scheduling helpers for an India/Finland team.
// Formatting is hand-rolled (no Intl). Slides use pptxgenjs.
import pptxgen from "pptxgenjs";

// ---------- Indian Rupee formatting ----------
export function formatINR(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    throw new Error("formatINR expects a number");
  }
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  let lastThree = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  if (rest !== "") {
    lastThree = "," + lastThree;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  }
  const body = `₹${rest + lastThree}.${decPart}`;
  return negative ? `(${body})` : body;
}

// ---------- Helsinki local -> India (IST) local ----------
function lastSundayDate(year, monthIndex) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  return lastDay.getUTCDate() - lastDay.getUTCDay();
}
function helsinkiOffsetHours(year, monthIndex, day) {
  const marLast = lastSundayDate(year, 2);
  const octLast = lastSundayDate(year, 9);
  const afterMarch = monthIndex > 2 || (monthIndex === 2 && day >= marLast);
  const beforeOct = monthIndex < 9 || (monthIndex === 9 && day < octLast);
  return afterMarch && beforeOct ? 3 : 2;
}
const pad = (n) => String(n).padStart(2, "0");

export function helsinkiToIST(localDateTime) {
  const [datePart, timePart] = localDateTime.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const offset = helsinkiOffsetHours(y, mo - 1, d);
  const utc = new Date(Date.UTC(y, mo - 1, d, h - offset, mi));
  const ist = new Date(utc.getTime() + (5 * 60 + 30) * 60 * 1000);
  return (
    `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}` +
    `T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`
  );
}

// ---------- Indian Financial Year (April 1 - March 31) ----------
export function financialYear(dateStr) {
  const [y, mo] = dateStr.split("T")[0].split("-").map(Number);
  const startYear = mo >= 4 ? y : y - 1;            // Jan–Mar belong to the previous FY
  const endYY = String((startYear + 1) % 100).padStart(2, "0");
  return `FY ${startYear}-${endYY}`;
}

// ---------- Per-person landscape PPTX bills ----------
export async function generateBills(people, outDir = ".") {
  const paths = [];
  const used = new Set();
  for (const p of people) {
    // Guard against duplicate names overwriting each other's file.
    let base = p.name.replace(/\s+/g, "_");
    let file = `${outDir}/${base}.pptx`;
    let n = 2;
    while (used.has(file)) file = `${outDir}/${base}_${n++}.pptx`;
    used.add(file);

    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 — landscape
    const slide = pptx.addSlide();
    slide.addText("INVOICE", { x: 0.5, y: 0.4, fontSize: 28, bold: true });
    slide.addText(`Bill To: ${p.name}`, { x: 0.5, y: 1.4, fontSize: 18 });
    slide.addText(`Amount Due: ${formatINR(p.amount)}`, { x: 0.5, y: 2.2, fontSize: 18 });
    slide.addText(`Standup (IST): ${helsinkiToIST(p.meeting)}`, { x: 0.5, y: 3.0, fontSize: 18 });
    slide.addText(`Financial Year: ${financialYear(p.meeting)}`, { x: 0.5, y: 3.8, fontSize: 18 });
    await pptx.writeFile({ fileName: file });
    paths.push(file);
  }
  return paths;
}
