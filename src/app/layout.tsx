import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rede Nacional de Especialistas — Time Holding Brasil",
  description:
    "A comunidade do Time Holding Brasil: especialistas de todo o Brasil, artigos, discussões e conexões diretas.",
};

export const viewport: Viewport = {
  themeColor: "#FE7413",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
