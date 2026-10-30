"use client";

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import { useTheme } from "@/components/site/theme";
import { footer } from "@/lib/content";
import { interTight, jetbrainsMono } from "@/lib/fonts";

// As cores do canvas acompanham o tema. No escuro, a tinta é a do preset "night".
const PALETTES = {
  dark: { background: "#0a0a0a", warm: "#6215B4" },
  light: { background: "#f2f0eb", ink: "#0a0a0a", warm: "#6215B4" },
};

// O canvas do footer precisa do nome real da família (o next/font gera um nome
// com hash), por isso as fontes vão como `style.fontFamily`, não como var(--font-*).
export default function Footer() {
  const theme = useTheme();

  return (
    <div id="contato" data-rail="Contato" className="w-full">
      <HalftoneWordmarkFooter
        wordmark={footer.wordmark}
        label={footer.label}
        meta={footer.meta}
        columns={footer.columns}
        preset="night"
        palette={PALETTES[theme]}
        fontFamily={interTight.style.fontFamily}
        fontWeight={800}
        monoFamily={jetbrainsMono.style.fontFamily}
        height="100svh"
      />
    </div>
  );
}
