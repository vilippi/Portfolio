"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, usePresence } from "motion/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MailIcon, MapPinIcon, PhoneIcon, XIcon } from "lucide-react";
import { ContactCard } from "@/components/ui/contact-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { setScrollLocked } from "@/components/site/smooth-scroll";
import { contact, person } from "@/lib/content";

gsap.registerPlugin(useGSAP);

// O card de contato abre de qualquer lugar: dos links "#contato" (topo, menu,
// Skills) e do "Fale comigo" do Lippi Chat. Por isso o estado fica fora do React.
let isOpen = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
const getOpen = () => isOpen;
const getOpenOnServer = () => false;

export function openContact() {
  if (isOpen) return;
  // Trava o scroll já no clique: o Lenis também ouve cliques em âncoras e,
  // parado, não rola até o rodapé.
  setScrollLocked(true);
  isOpen = true;
  emit();
}

function closeContact() {
  isOpen = false;
  emit();
}

const CARD_SHADOW = "shadow-[0_40px_120px_-24px_var(--shadow)]"; // taste-skill-ignore: é um diálogo, flutua sobre a página
const CROSS = 12; // as cruzes dos cantos passam 12px da borda; o recorte as inclui
const EDGE_LINE = "pointer-events-none invisible absolute inset-x-0 top-0 h-px bg-ink opacity-0"; // taste-skill-ignore: só existe durante a abertura e o fechamento

// Onde a linha nasce: no meio da parte do card que está na tela (no celular o
// card pode ser mais alto que ela).
function openingLine(card: HTMLElement) {
  const r = card.getBoundingClientRect();
  const top = Math.max(r.top, 0);
  const bottom = Math.min(r.bottom, window.innerHeight);
  return { h: r.height, mid: (top + bottom) / 2 - r.top };
}

export default function ContactDialog() {
  const open = useSyncExternalStore(subscribe, getOpen, getOpenOnServer);

  // Todo link para o rodapé de contato abre o card no lugar. Sem JS, ele
  // continua levando ao rodapé.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element) || !e.target.closest('a[href="#contato"]')) return;
      e.preventDefault();
      openContact();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <AnimatePresence>{open && <ContactModal key="contact" />}</AnimatePresence>;
}

function ContactModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const topLine = useRef<HTMLSpanElement>(null);
  const bottomLine = useRef<HTMLSpanElement>(null);
  const opening = useRef<gsap.core.Timeline | null>(null);
  const [isPresent, safeToRemove] = usePresence();
  const titleId = useId();
  const fieldId = useId();
  const [tried, setTried] = useState(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    setScrollLocked(true);
    return () => {
      if (dialog.open) dialog.close();
      setScrollLocked(false);
    };
  }, []);

  // Abre do meio: uma linha nasce no centro e cresce até a largura do card;
  // depois ela se divide nas bordas de cima e de baixo e o card se abre entre
  // elas. Fechar faz o caminho inverso. O AnimatePresence espera o fim.
  useGSAP(
    () => {
      const card = cardRef.current!;
      const backdrop = backdropRef.current!;
      const [top, bottom] = [topLine.current!, bottomLine.current!];
      const done = () => safeToRemove?.();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (isPresent) gsap.fromTo([backdrop, card], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
        else gsap.to([backdrop, card], { autoAlpha: 0, duration: 0.2, onComplete: done });
        return;
      }

      // Fechou no meio da abertura: ela simplesmente volta.
      if (!isPresent && opening.current?.isActive()) {
        opening.current.eventCallback("onReverseComplete", done).timeScale(1.6).reverse();
        return;
      }

      // O recorte é escrito à mão a cada quadro: o navegador encurta o valor
      // calculado de inset() (dois lados iguais viram um só) e o GSAP, lendo
      // dali, perderia a borda de baixo.
      const { h, mid } = openingLine(card);
      const clip = { top: -CROSS, bottom: -CROSS };
      const drawClip = () => {
        card.style.clipPath = `inset(${clip.top}px ${-CROSS}px ${clip.bottom}px ${-CROSS}px)`;
      };

      if (isPresent) {
        clip.top = mid;
        clip.bottom = h - mid;
        drawClip();
        opening.current = gsap
          .timeline({ defaults: { ease: "expo.inOut" } })
          .set([top, bottom], { y: mid, scaleX: 0, autoAlpha: 1 })
          .fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0)
          .to([top, bottom], { scaleX: 1, duration: 0.45 }, 0.05)
          .addLabel("split", ">-0.08")
          .to(clip, { top: 0, bottom: 0, duration: 0.6, onUpdate: drawClip }, "split")
          .to(top, { y: 0, duration: 0.6 }, "split")
          .to(bottom, { y: h, duration: 0.6 }, "split")
          // As linhas somem enquanto as cruzes dos cantos aparecem inteiras.
          .addLabel("settle", ">-0.15")
          .to([top, bottom], { autoAlpha: 0, duration: 0.3, ease: "power1.out" }, "settle")
          .to(clip, { top: -CROSS, bottom: -CROSS, duration: 0.3, ease: "power1.out", onUpdate: drawClip }, "settle")
          .set(card, { clearProps: "clipPath" });
        return;
      }

      drawClip();
      gsap
        .timeline({ defaults: { ease: "expo.inOut" }, onComplete: done })
        .set(top, { y: 0 })
        .set(bottom, { y: h })
        .set([top, bottom], { scaleX: 1 })
        .to([top, bottom], { autoAlpha: 1, duration: 0.12, ease: "none" })
        .to(clip, { top: 0, bottom: 0, duration: 0.12, ease: "none", onUpdate: drawClip }, "<")
        .addLabel("join")
        .to(clip, { top: mid, bottom: h - mid, duration: 0.45, onUpdate: drawClip }, "join")
        .to([top, bottom], { y: mid, duration: 0.45 }, "join")
        .to([top, bottom], { scaleX: 0, duration: 0.35 }, ">-0.05")
        .to(backdrop, { autoAlpha: 0, duration: 0.35, ease: "power2.in" }, "<");
    },
    { dependencies: [isPresent], scope: ref },
  );

  const field = (name: keyof typeof contact.fields) => `${fieldId}-${name}`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        closeContact();
      }}
      onCancel={(e) => {
        e.preventDefault();
        closeContact();
      }}
      onClose={() => {
        // Fechado pelo navegador sem passar pela animação.
        if (!ref.current?.open) closeContact();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-ink backdrop:bg-transparent"
    >
      <div ref={backdropRef} aria-hidden="true" className="invisible absolute inset-0 bg-bg/80 opacity-0" />
      <div
        data-lenis-prevent
        onClick={(e) => e.target === e.currentTarget && closeContact()}
        className="relative flex size-full overflow-y-auto overscroll-contain p-[max(var(--gutter),24px)]"
      >
        <div className="relative m-auto w-full max-w-5xl">
          <div ref={cardRef} className="relative">
            <button
              type="button"
              onClick={closeContact}
              aria-label={contact.closeLabel}
              className="absolute right-3 top-3 z-1 grid size-10 cursor-pointer place-items-center rounded-md text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink"
            >
              <XIcon className="size-5" aria-hidden="true" />
            </button>

            <ContactCard
              title={contact.title}
              titleId={titleId}
              description={contact.description}
              className={CARD_SHADOW}
              formSectionClassName="md:pt-16"
              contactInfo={[
                { icon: MailIcon, label: contact.info.email, value: person.email },
                { icon: PhoneIcon, label: contact.info.phone, value: person.phone },
                { icon: MapPinIcon, label: contact.info.location, value: person.location },
              ]}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setTried(true);
                }}
                className="w-full space-y-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field("name")}>{contact.fields.name}</Label>
                  <Input id={field("name")} name="name" type="text" autoComplete="name" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field("email")}>{contact.fields.email}</Label>
                  <Input id={field("email")} name="email" type="email" autoComplete="email" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field("phone")}>{contact.fields.phone}</Label>
                  <Input id={field("phone")} name="phone" type="tel" autoComplete="tel" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field("message")}>{contact.fields.message}</Label>
                  <Textarea id={field("message")} name="message" required />
                </div>
                <Button className="w-full cursor-pointer" type="submit">
                  {contact.submit}
                </Button>
                <p role="status" className="text-sm text-muted-foreground">
                  {tried && (
                    <>
                      {contact.pending}{" "}
                      <a href={`mailto:${person.email}`} className="text-ink underline underline-offset-4">
                        {person.email}
                      </a>
                      .
                    </>
                  )}
                </p>
              </form>
            </ContactCard>
          </div>

          {/* As bordas que abrem o card: nascem juntas no meio e se separam */}
          <span ref={topLine} aria-hidden="true" className={EDGE_LINE} />
          <span ref={bottomLine} aria-hidden="true" className={EDGE_LINE} />
        </div>
      </div>
    </dialog>
  );
}
