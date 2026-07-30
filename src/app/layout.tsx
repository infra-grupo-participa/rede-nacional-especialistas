import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Uma fonte só no site inteiro (novo design). Exposta como --font-inter para os
// tokens (F.serif = F.sans = F.mono = Inter).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rede Nacional de Especialistas — Time Holding Brasil",
  description:
    "Encontre um especialista: profissionais formados e certificados pelos Espaços de Instrução do Time Holding Brasil, em todo o Brasil.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`h-full ${inter.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
