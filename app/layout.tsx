import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { PwaRegister } from "./components/PwaRegister";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  adjustFontFallback: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://babs-inventory.vercel.app";
const SITE_TITLE = "Embassy Pharmaceutical & Chemicals Limited";
const SITE_DESCRIPTION =
  "Wholesale pharmaceutical and healthcare products in Nigeria. Browse the trade catalogue and order by the box or packet online — no account needed.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Embassy Pharmaceutical",
    "wholesale pharmacy Nigeria",
    "pharmaceutical distributor Nigeria",
    "buy medicine wholesale",
    "pharmacy trade catalogue",
    "healthcare products Nigeria",
  ],
  applicationName: "Embassy",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_NG",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Embassy",
  },
  icons: {
    icon: "/pwa/icon-192.png",
    shortcut: "/pwa/icon-192.png",
    apple: "/pwa/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F2A3D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
        <style>{`.serif{font-family:var(--font-newsreader),Georgia,serif}`}</style>
        <PwaRegister />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--navy)",
              color: "#fff",
              borderRadius: "var(--r-pill)",
              padding: "10px 18px",
              fontSize: "14.5px",
              fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              boxShadow: "var(--shadow-md)",
            },
            success: { iconTheme: { primary: "var(--sage)", secondary: "#fff" } },
            error: { iconTheme: { primary: "var(--gold)", secondary: "var(--navy)" } },
          }}
        />
      </body>
    </html>
  );
}
