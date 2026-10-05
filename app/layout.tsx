import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Only the sans font: the app shows no code, so no mono font is needed.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipe Finder",
  description: "Dimmi cosa c'è nel tuo frigorifero e ti suggerirò una ricetta.",
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
