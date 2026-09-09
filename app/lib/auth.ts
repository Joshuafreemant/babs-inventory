import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

/** Staff session — httpOnly cookie carrying a signed JWT. Customers have none. */

export const STAFF_COOKIE = "embassy_staff";

export interface StaffSession {
  id: string;
  name: string;
  staffId: string;
  role: "rep" | "admin";
}

function secret(): string {
  const s = process.env.JWT_KEY;
  if (!s) throw new Error("JWT_KEY is not set");
  return s;
}

export function signStaffToken(session: StaffSession): string {
  return jwt.sign(session, secret(), { expiresIn: "12h" });
}

export function verifyStaffToken(token: string): StaffSession | null {
  try {
    const decoded = jwt.verify(token, secret()) as any;
    if (!decoded?.id || !decoded?.staffId) return null;
    return {
      id: decoded.id,
      name: decoded.name,
      staffId: decoded.staffId,
      role: decoded.role === "admin" ? "admin" : "rep",
    };
  } catch {
    return null;
  }
}

export async function setStaffCookie(token: string) {
  (await cookies()).set(STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearStaffCookie() {
  (await cookies()).set(STAFF_COOKIE, "", { path: "/", maxAge: 0 });
}

/** Read + verify the current staff session from the request cookies. */
export async function currentStaff(): Promise<StaffSession | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return null;
  return verifyStaffToken(token);
}

/** Guard for console API routes. Returns the session or throws a 401 Response. */
export async function requireStaff(): Promise<StaffSession> {
  const s = await currentStaff();
  if (!s) {
    throw new Response(JSON.stringify({ error: "Not signed in." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return s;
}
