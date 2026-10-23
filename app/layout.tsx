import type { Metadata } from "next";
// Fontes servidas pelo próprio site (sem pedidos à Google).
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
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
