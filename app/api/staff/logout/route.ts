import { clearStaffCookie } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearStaffCookie();
  return Response.json({ ok: true });
}
