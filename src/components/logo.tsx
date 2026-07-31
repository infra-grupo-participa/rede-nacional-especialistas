import { C, F } from "@/lib/tokens";

/* Logo oficial do Time Holding Brasil (selo circular laranja). Grande no header,
   com o nome ao lado. `so` = só o selo (sem texto). */
export function Logo({ altura = 44, so = false }: { altura?: number; so?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/thb-logo.png"
        alt="Time Holding Brasil"
        style={{ height: altura, width: "auto", display: "block", flexShrink: 0 }}
      />
      {!so && (
        <span className="hidden leading-none sm:flex sm:flex-col">
          <span style={{ fontFamily: F.serif, fontWeight: 800, fontSize: 15, color: C.ink, letterSpacing: "-0.01em" }}>
            Rede Nacional
          </span>
          <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 2 }}>
            de Especialistas
          </span>
        </span>
      )}
    </span>
  );
}
