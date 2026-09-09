/** Build the catalogue URL, optionally tagged with a rep's referral code. */
export function catalogueUrl(ref?: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://embassypharma.example";
  return ref ? `${origin}/?ref=${encodeURIComponent(ref)}` : `${origin}/`;
}

/** wa.me deep link that opens WhatsApp with a pre-filled message. */
export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export const SHARE_MESSAGE = (url: string) =>
  `Browse and order from the Embassy Pharmaceutical catalogue — no account needed:\n${url}`;
