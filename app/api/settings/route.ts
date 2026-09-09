import { dbConnect } from "@/app/lib/db";
import SettingModel from "@/models/Setting";
import { DEFAULT_HERO } from "@/app/lib/heroDefaults";

export const dynamic = "force-dynamic";

/** Public storefront settings (currently just the hero copy). */
export async function GET() {
  try {
    await dbConnect();
    const doc = await SettingModel.findById("storefront").lean();
    return Response.json({
      hero: {
        eyebrow: (doc as any)?.heroEyebrow || DEFAULT_HERO.eyebrow,
        headline: (doc as any)?.heroHeadline || DEFAULT_HERO.headline,
        subtext: (doc as any)?.heroSubtext || DEFAULT_HERO.subtext,
      },
    });
  } catch (err) {
    console.error("GET /api/settings", err);
    return Response.json({ hero: DEFAULT_HERO });
  }
}
