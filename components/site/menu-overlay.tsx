"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { nav, person } from "@/lib/content";

const ease = [0.76, 0, 0.24, 1] as const;

export default function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          data-lenis-prevent
          className="fixed inset-0 z-[60] flex flex-col bg-accent px-gutter pb-gutter pt-[clamp(14px,1.6vw,24px)] text-accent-ink"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease }}
        >
          <div className="flex items-start justify-between">
            <p className="leading-[0.82]">
              <span className="block font-serif text-[clamp(26px,2.6vw,44px)] uppercase tracking-[-0.03em]">{person.firstName}</span>
              <span className="block text-[clamp(26px,2.6vw,44px)] font-extrabold uppercase tracking-[-0.04em]">{person.lastName}</span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar menu"
              className="flex size-[clamp(44px,3.6vw,62px)] items-center justify-center rounded-[10px] border-2 border-current transition-colors duration-300 hover:bg-accent-ink hover:text-accent"
            >
              <svg viewBox="0 0 20 20" className="w-[40%]" aria-hidden="true">
                <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav aria-label="Seções" className="mt-auto">
            <ul>
              {nav.map((item, i) => (
                <li key={item.id} className="overflow-clip">
                  <motion.a
                    href={`#${item.id}`}
                    onClick={onClose}
                    className="block py-1 text-[clamp(56px,11vw,180px)] font-extrabold uppercase leading-[0.9] tracking-[-0.05em] transition-[letter-spacing] duration-500 hover:tracking-[-0.02em]"
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "100%" }}
                    transition={{ duration: 0.7, ease, delay: 0.15 + i * 0.06 }}
                  >
                    {item.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
