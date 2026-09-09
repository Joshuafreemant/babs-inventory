import { dbConnect } from "@/app/lib/db";
import SettingModel from "@/models/Setting";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { cleanHero, DEFAULT_HERO } from "@/app/lib/heroDefaults";

export const dynamic = "force-dynamic";

/** Update the storefront hero copy. */
export async function PATCH(req: Request) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const hero = cleanHero(await req.json());

    await SettingModel.findByIdAndUpdate(
      "storefront",
      {
        $set: {
          heroEyebrow: hero.eyebrow,
          heroHeadline: hero.headline,
          heroSubtext: hero.subtext,
        },
      },
      { upsert: true, new: true }
    );

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "settings.hero",
      target: "storefront hero",
      detail: hero.headline.slice(0, 80),
    });

    return Response.json({ hero });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/admin/settings", err);
    return Response.json({ error: "Could not save the hero." }, { status: 500 });
  }
}

/** Reset the hero to the built-in default. */
export async function DELETE() {
  try {
    const staff = await requireStaff();
    await dbConnect();
    await SettingModel.findByIdAndUpdate(
      "storefront",
      {
        $set: {
          heroEyebrow: DEFAULT_HERO.eyebrow,
          heroHeadline: DEFAULT_HERO.headline,
          heroSubtext: DEFAULT_HERO.subtext,
        },
      },
      { upsert: true }
    );
    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "settings.hero",
      target: "storefront hero",
      detail: "reset to default",
    });
    return Response.json({ hero: DEFAULT_HERO });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/admin/settings", err);
    return Response.json({ error: "Could not reset the hero." }, { status: 500 });
  }
}
