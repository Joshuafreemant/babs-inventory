import { dbConnect } from "@/app/lib/db";
import SettingModel from "@/models/Setting";
import { DEFAULT_HERO } from "@/app/lib/heroDefaults";
import { DEFAULT_CONTACT } from "@/app/lib/contactDefaults";
import { DEFAULT_PAYMENT } from "@/app/lib/paymentDefaults";

export const dynamic = "force-dynamic";

/** Public storefront settings — hero copy, contact info, bank transfer details. */
export async function GET() {
  try {
    await dbConnect();
    const doc = await SettingModel.findById("storefront").lean<any>();
    return Response.json({
      hero: {
        eyebrow: doc?.heroEyebrow || DEFAULT_HERO.eyebrow,
        headline: doc?.heroHeadline || DEFAULT_HERO.headline,
        subtext: doc?.heroSubtext || DEFAULT_HERO.subtext,
      },
      contact: {
        phone: doc?.contactPhone || DEFAULT_CONTACT.phone,
        email: doc?.contactEmail || DEFAULT_CONTACT.email,
      },
      payment: {
        bankName: doc?.bankName || DEFAULT_PAYMENT.bankName,
        accountNumber: doc?.bankAccountNumber || DEFAULT_PAYMENT.accountNumber,
        accountName: doc?.bankAccountName || DEFAULT_PAYMENT.accountName,
      },
    });
  } catch (err) {
    console.error("GET /api/settings", err);
    return Response.json({ hero: DEFAULT_HERO, contact: DEFAULT_CONTACT, payment: DEFAULT_PAYMENT });
  }
}
