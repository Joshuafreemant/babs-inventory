import { normalizePhone, displayPhone } from "./phone";

/** Storefront contact info — shown to customers, edited by staff in Settings. */
export interface Contact {
  phone: string; // normalised digits, e.g. "2348032219087", or "" if unset
  email: string;
}

export const DEFAULT_CONTACT: Contact = { phone: "", email: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ContactInputError extends Error {}

/** Parses + validates staff input. Throws ContactInputError on a bad (non-empty) value. */
export function cleanContact(input: any): Contact {
  const rawPhone = typeof input?.phone === "string" ? input.phone.trim() : "";
  const rawEmail = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";

  let phone = "";
  if (rawPhone) {
    const n = normalizePhone(rawPhone);
    if (!n) throw new ContactInputError("That phone number doesn't look right.");
    phone = n;
  }

  let email = "";
  if (rawEmail) {
    if (!EMAIL_RE.test(rawEmail)) throw new ContactInputError("That email address doesn't look right.");
    email = rawEmail.slice(0, 100);
  }

  return { phone, email };
}

/** Display-friendly phone for the storefront / settings form. */
export function displayContactPhone(c: Contact): string {
  return c.phone ? displayPhone(c.phone) : "";
}
