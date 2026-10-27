// A typical "looks right" attempt that slips on several things:
// Western grouping + minus sign; fixed +3:30 offset (ignores Finland DST);
// calendar-year "financial year"; and name-based filenames that overwrite
// duplicate-named people.
import pptxgen from "pptxgenjs";

export function formatINR(amount) {
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(2);
  let [intPart, decPart] = fixed.split(".");
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // western threes (wrong)
  const body = `₹${intPart}.${decPart}`;
  return negative ? `-${body}` : body;
}

const pad = (n) => String(n).padStart(2, "0");

export function helsinkiToIST(localDateTime) {
  const [datePart, timePart] = localDateTime.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi) + (3 * 60 + 30) * 60 * 1000);
  return (
    `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}` +
    `T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`
  );
}

export function financialYear(dateStr) {
  const y = Number(dateStr.split("-")[0]);            // calendar year (ignores April boundary)
  const endYY = String((y + 1) % 100).padStart(2, "0");
  return `FY ${y}-${endYY}`;
}

export async function generateBills(people, outDir = ".") {
  const paths = [];
  for (const p of people) {
    const file = `${outDir}/${p.name.replace(/\s+/g, "_")}.pptx`; // duplicates overwrite
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
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
