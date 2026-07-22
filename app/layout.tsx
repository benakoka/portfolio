import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://benakoka.com"),
  title: "Ben Akoka | Data Analyst & Researcher",
  description: "Portfolio of Ben Akoka, a Statistics & Data Science student at UC Santa Barbara focused on analytics, machine learning, and data science.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
    },
  },
  openGraph: {
    title: "Ben Akoka | Data Analyst & Researcher",
    description: "Portfolio of Ben Akoka, a Statistics & Data Science student at UC Santa Barbara focused on analytics, machine learning, and data science.",
    type: "website",
    url: "https://benakoka.com/",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ben Akoka | Data Analyst & Researcher",
    description: "Portfolio of Ben Akoka, a Statistics & Data Science student at UC Santa Barbara focused on analytics, machine learning, and data science.",
    images: ["/assets/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#e6ebf0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full bg-ink text-paper antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
