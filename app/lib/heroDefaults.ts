/** Storefront hero copy — the default, and the shape stored in `setting/storefront`. */
export interface Hero {
  eyebrow: string;
  headline: string;
  subtext: string;
}

export const DEFAULT_HERO: Hero = {
  eyebrow: "Ijele 2026 · 99th PSN Annual Conference",
  headline: "Embassy at Ijele 2026 — browse the catalogue, order whenever you're ready.",
  subtext:
    "Live at the 99th Annual National Conference of the Pharmaceutical Society of Nigeria, International Convention Centre, Awka, Anambra State. No account needed — sold by the box, order any quantity that suits you.",
};

export function cleanHero(input: any): Hero {
  const s = (v: any, max: number, fallback: string) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;
  return {
    eyebrow: s(input?.eyebrow ?? input?.heroEyebrow, 80, DEFAULT_HERO.eyebrow),
    headline: s(input?.headline ?? input?.heroHeadline, 240, DEFAULT_HERO.headline),
    subtext: s(input?.subtext ?? input?.heroSubtext, 400, DEFAULT_HERO.subtext),
  };
}
