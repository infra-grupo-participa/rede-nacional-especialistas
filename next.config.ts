import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node App na Hostinger (Passenger): o entrypoint é o server.js, que sobe o
  // Next em produção. Mesmo padrão do gps-thb — sem output standalone, que
  // conflita com o server.js custom (Next avisa e ignora o next start).
  // Há outro lockfile em C:\tmp; fixamos a raiz neste projeto.
  turbopack: { root: __dirname },
  images: {
    // Avatares/capas podem vir de qualquer URL (Supabase Storage, Instagram, etc).
    // Usamos <Image unoptimized>, mas mantemos remotePatterns liberado.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
