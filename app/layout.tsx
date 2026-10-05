import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { event } from "@/lib/event.config";
import "./globals.css";

/** Grotesque closest to the Helvetica Now used across the NGS brand kit. */
const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(event.siteUrl),
  title: `${event.fullName} — Create Your Official Summit Identity`,
  description: `Upload your photo to create your official ${event.fullName} profile picture, attending card and invitation letter.`,
  openGraph: {
    title: `${event.fullName} — Create Your Official Summit Identity`,
    description: event.tagline,
    images: ["/brand/banner.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${event.fullName} — Create Your Official Summit Identity`,
    description: event.tagline,
    images: ["/brand/banner.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
