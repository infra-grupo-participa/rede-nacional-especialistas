import type { NextConfig } from "next";

// Host público (sem protocolo/barra) — usado para liberar Server Actions atrás
// do proxy reverso da Hostinger. Enquanto não há domínio próprio, o provisório
// entra na lista fixa abaixo.
const APP_HOST = (process.env.NEXT_PUBLIC_APP_URL || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Node App na Hostinger (Passenger): o entrypoint é o server.js, que sobe o
  // Next em produção. Mesmo padrão do gps-thb — sem output standalone, que
  // conflita com o server.js custom (Next avisa e ignora o next start).
  // (Sem `turbopack.root`: `__dirname` pode vir undefined no boot de produção
  //  e derrubar o processo — o gps-thb não usa e roda. O warning de múltiplos
  //  lockfiles em C:\tmp é só ruído de dev.)

  // Server Actions / SSR atrás do proxy reverso (LiteSpeed/Hostinger): confia na
  // origem do domínio público para não bloquear mutações (login, publicar, votar,
  // comentar) por divergência de Origin × Host — o que dava 500 em produção.
  experimental: {
    serverActions: {
      allowedOrigins: [
        "dimgrey-boar-969575.hostingersite.com",
        ...(APP_HOST ? [APP_HOST] : []),
      ],
    },
  },

  images: {
    // Avatares/capas podem vir de qualquer URL (Supabase Storage, Instagram, etc).
    // Usamos <Image unoptimized>, mas mantemos remotePatterns liberado.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  // Evita que um CDN/proxy sirva HTML antigo apontando para chunks já
  // substituídos após deploy (lição herdada do sip/gps na Hostinger). Os assets
  // versionados em /_next/static continuam com cache longo e imutável.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
