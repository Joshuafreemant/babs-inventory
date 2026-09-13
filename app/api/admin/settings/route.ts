import { dbConnect } from "@/app/lib/db";
import SettingModel from "@/models/Setting";
import { requireAdmin } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { cleanHero, DEFAULT_HERO } from "@/app/lib/heroDefaults";
import { cleanContact } from "@/app/lib/contactDefaults";
import { cleanPayment } from "@/app/lib/paymentDefaults";

export const dynamic = "force-dynamic";

const HERO_KEYS = ["eyebrow", "headline", "subtext", "heroEyebrow", "heroHeadline", "heroSubtext"];
const CONTACT_KEYS = ["phone", "email", "contactPhone", "contactEmail"];
const PAYMENT_KEYS = ["bankName", "accountNumber", "accountName"];

/**
 * Update storefront settings. Admins only. The body may contain any mix of
 * hero / contact / payment fields — only the section(s) present are touched,
 * so the hero form and the contact/payment forms can save independently.
 */
export async function PATCH(req: Request) {
  try {
    const staff = await requireAdmin();
    await dbConnect();
    const body = await req.json();

    const set: Record<string, string> = {};
    const changed: string[] = [];
    const result: Record<string, unknown> = {};

    if (HERO_KEYS.some((k) => k in body)) {
      const hero = cleanHero(body);
      set.heroEyebrow = hero.eyebrow;
      set.heroHeadline = hero.headline;
      set.heroSubtext = hero.subtext;
      changed.push(`hero: ${hero.headline.slice(0, 60)}`);
      result.hero = hero;
    }

    if (CONTACT_KEYS.some((k) => k in body)) {
      let contact;
      try {
        contact = cleanContact(body);
      } catch (e: any) {
        return Response.json({ error: e.message }, { status: 400 });
      }
      set.contactPhone = contact.phone;
      set.contactEmail = contact.email;
      changed.push(`contact: ${contact.phone || "—"} / ${contact.email || "—"}`);
      result.contact = contact;
    }

    if (PAYMENT_KEYS.some((k) => k in body)) {
      const payment = cleanPayment(body);
      set.bankName = payment.bankName;
      set.bankAccountNumber = payment.accountNumber;
      set.bankAccountName = payment.accountName;
      changed.push(`payment: ${payment.bankName || "—"} / ${payment.accountNumber || "—"}`);
      result.payment = payment;
    }

    if (Object.keys(set).length === 0) {
      return Response.json({ error: "Nothing to save." }, { status: 400 });
    }

    await SettingModel.findByIdAndUpdate("storefront", { $set: set }, { upsert: true, new: true });

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "settings.update",
      target: "storefront settings",
      detail: changed.join("; "),
    });

    return Response.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/admin/settings", err);
    return Response.json({ error: "Could not save settings." }, { status: 500 });
  }
}

/** Reset the hero to the built-in default. Contact/payment are left alone. */
export async function DELETE() {
  try {
    const staff = await requireAdmin();
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
