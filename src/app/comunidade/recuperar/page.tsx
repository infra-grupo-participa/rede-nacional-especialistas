import type { Metadata } from "next";
import { TelaRecuperar } from "@/comunidade/components/entrada/tela-senha";

export const metadata: Metadata = { title: "Encontrar minha conta" };

export default function RecuperarPage() {
  return <TelaRecuperar />;
}
