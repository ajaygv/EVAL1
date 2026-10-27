// Correct reference solution.
// Indian number system: the last 3 digits form one group, then every group
// to the left is 2 digits (…,crore,lakh,thousand,hundreds). Negatives are shown
// in parentheses (accounting style), two decimals always, ₹ with no space.
export function formatINR(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    throw new Error("formatINR expects a number");
  }

  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(2);          // always 2 decimals
  const [intPart, decPart] = fixed.split(".");

  let lastThree = intPart.slice(-3);
  let rest = intPart.slice(0, -3);

  if (rest !== "") {
    lastThree = "," + lastThree;
    // group the remaining digits in TWOS (Indian system), not threes
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  }

  const grouped = rest + lastThree;
  const body = `₹${grouped}.${decPart}`;
  return negative ? `(${body})` : body;
}
