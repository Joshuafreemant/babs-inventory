import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://babs-inventory.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // the rep console needs a staff login and has nothing for a crawler to
      // index — keep it out of search results entirely
      disallow: "/console",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
