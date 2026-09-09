import { currentStaff } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await currentStaff();
  if (!staff) return Response.json({ error: "Not signed in." }, { status: 401 });
  return Response.json(staff);
}
