// A typical "looks right" attempt: Western grouping (threes) + minus sign.
// This is what a model often produces when it hand-rolls without catching the
// Indian lakh/crore grouping rule or the accounting-style negatives.
export function formatINR(amount) {
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(2);
  let [intPart, decPart] = fixed.split(".");
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // groups of THREE (wrong)
  const body = `₹${intPart}.${decPart}`;
  return negative ? `-${body}` : body;                      // minus, not parentheses
}
