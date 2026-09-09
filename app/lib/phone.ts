/**
 * Normalise a phone number to the international digits Termii expects
 * (country code + number, no "+", no spaces). Nigeria-aware.
 *
 *   0803 221 9087  -> 2348032219087
 *   +2348032219087 -> 2348032219087
 *   8032219087     -> 2348032219087
 *   233201234567   -> 233201234567   (already international, left alone)
 */
export function normalizePhone(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const hadPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  // local Nigerian format: 0XXXXXXXXXX (11 digits)
  if (!hadPlus && digits.length === 11 && digits.startsWith("0")) {
    digits = "234" + digits.slice(1);
  }
  // 10 digits, no country code, no leading 0 -> assume Nigeria
  else if (!hadPlus && digits.length === 10) {
    digits = "234" + digits;
  }

  // final sanity: a real international number is 10-15 digits
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

/** Pretty-print a stored (normalised) number for display. */
export function displayPhone(normalized: string): string {
  if (normalized.startsWith("234") && normalized.length === 13) {
    const n = "0" + normalized.slice(3);
    return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  }
  return "+" + normalized;
}
