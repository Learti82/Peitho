import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Peitho — Platforma e Tenderëve",
    template: "%s | Peitho",
  },
  description:
    "Peitho — Platforma e bazuar në AI për përgatitjen e ofertave për tendera publik në Kosovë dhe Shqipëri.",
  keywords: ["tender", "prokurimi publik", "ofertë", "Kosovë", "Shqipëri"],
  authors: [{ name: "Peitho" }],
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sq" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="h-full font-sans antialiased bg-background">
        {children}
      </body>
    </html>
  );
}
