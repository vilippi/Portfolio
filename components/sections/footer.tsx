import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import { footer } from "@/lib/content";
import { interTight, jetbrainsMono } from "@/lib/fonts";

// O canvas do footer precisa do nome real da família (o next/font gera um nome
// com hash), por isso as fontes vão como `style.fontFamily`, não como var(--font-*).
export default function Footer() {
  return (
    <div id="contato" data-rail="Contato" className="w-full">
      <HalftoneWordmarkFooter
        wordmark={footer.wordmark}
        label={footer.label}
        meta={footer.meta}
        columns={footer.columns}
        preset="night"
        palette={{ background: "#0a0a0a", warm: "#6215B4" }}
        fontFamily={interTight.style.fontFamily}
        fontWeight={800}
        monoFamily={jetbrainsMono.style.fontFamily}
        height="clamp(480px, 74svh, 680px)"
      />
    </div>
  );
}
