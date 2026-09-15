import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { Toaster } from "react-hot-toast";
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

export const metadata: Metadata = {
  title: "Embassy Pharmaceutical & Chemicals Limited",
  description: "Your Visa to Healthy Living — trade catalogue and rep console.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
        <style>{`.serif{font-family:var(--font-newsreader),Georgia,serif}`}</style>
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
