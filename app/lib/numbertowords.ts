const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (r) {
    if (h) parts.push("and");
    parts.push(
      r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? "-" + ONES[r % 10] : ""}`
    );
  }
  return parts.join(" ");
}

/** 370000 -> "Three Hundred and Seventy Thousand Naira Only" */
export function nairaInWords(amount: number): string {
  let n = Math.floor(Math.abs(amount));
  if (n === 0) return "Zero Naira Only";

  const parts: string[] = [];
  for (let i = 0; n > 0; i++, n = Math.floor(n / 1000)) {
    const chunk = n % 1000;
    if (!chunk) continue;
    let words = belowThousand(chunk);
    // "One Million and Fifty" style
    if (i === 0 && chunk < 100 && n >= 1000) words = `and ${words}`;
    parts.unshift(SCALES[i] ? `${words} ${SCALES[i]}` : words);
  }
  return `${parts.join(" ")} Naira Only`;
}