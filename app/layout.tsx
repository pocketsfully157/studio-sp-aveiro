import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STUDIO SP | Aveiro",
  description: "Cabelo, estética, manicura e massagens em Aveiro. Marque online com confirmação imediata.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="antialiased">{children}</body>
    </html>
  );
}
