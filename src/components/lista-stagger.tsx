"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* Lista com entrada escalonada (stagger): cada filho sobe com fade em cascata.
   Uso: <ListaStagger className="space-y-2">{items.map(...)}</ListaStagger>.
   Cada filho deve ser um <ItemStagger> (ou usar o wrapper direto). */

export function ListaStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="oculto"
      animate="visivel"
      variants={{
        visivel: { transition: { staggerChildren: 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function ItemStagger({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        oculto: { opacity: 0, y: 10 },
        visivel: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
