import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node App na Hostinger: build standalone para servir com `node server.js`.
  output: "standalone",
  // Há outro lockfile em C:\tmp; fixamos a raiz neste projeto.
  turbopack: { root: __dirname },
  images: {
    // Avatares/capas podem vir de qualquer URL (Supabase Storage, Instagram, etc).
    // Usamos <Image unoptimized>, mas mantemos remotePatterns liberado.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
