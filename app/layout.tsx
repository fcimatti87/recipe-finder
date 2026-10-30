import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Only the sans font: the app shows no code, so no mono font is needed.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_TITLE = "Recipe Finder";
const SITE_DESCRIPTION = "Dimmi cosa c'è nel tuo frigorifero e ti suggerirò una ricetta.";

export const metadata: Metadata = {
  title: SITE_TITLE, // crucial for SEO as it helps search engines understand what the webpage is about
  description: SITE_DESCRIPTION, // is often displayed in search engine results
  metadataBase: new URL('https://recipe-finder-fc.vercel.app'),
  openGraph: { // enhances the way a webpage is represented when shared on social media platforms
    type: "website",
    url: "/", // with metadataBase set, Next.js transforms "/" into the same full address
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Recipe Finder",
    locale: "it_IT",
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
