"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { skills } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const ease = [0.76, 0, 0.24, 1] as const;

export default function Skills() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        SplitText.create("[data-skills-statement]", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: 1,
              ease: "power4.out",
              stagger: 0.08,
              scrollTrigger: { trigger: "[data-skills-statement]", start: "top 82%", once: true },
            }),
        });

        gsap.from("[data-skills-rise]", {
          y: 24,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });

        gsap.from("[data-skills-row]", {
          y: 32,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: "[data-skills-list]", start: "top 95%", once: true },
        });

        gsap.from("[data-skills-arrow]", {
          xPercent: -60,
          autoAlpha: 0,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-skills-arrow]", start: "top 88%", once: true },
        });

        gsap.from("[data-skills-rule]", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.2,
          ease: "power3.inOut",
          scrollTrigger: { trigger: "[data-skills-rule]", start: "top 88%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      id="skills"
      ref={root}
      data-rail="Skills"
      aria-labelledby="skills-title"
      className="relative grid gap-[clamp(48px,6vw,96px)] bg-bg px-gutter py-[clamp(88px,10vw,180px)] md:grid-cols-[1fr_0.72fr] md:pl-[6.5vw] md:pr-[4vw]"
    >
      <div>
        <h2 id="skills-title" data-skills-rise className="text-[16px] font-medium text-ink">
          {skills.heading}
        </h2>
        <p
          data-skills-statement
          className="mt-[clamp(24px,2.6vw,44px)] max-w-[30ch] text-[clamp(21px,2.05vw,38px)] font-black uppercase leading-[1.08] tracking-[-0.01em] text-ink"
        >
          {skills.statement}
        </p>
        <span data-skills-rule aria-hidden="true" className="mt-[clamp(28px,2.6vw,44px)] block h-px w-full bg-line" />

        <a
          href="#contato"
          data-skills-rise
          className="group mt-[clamp(28px,3vw,48px)] inline-flex items-center gap-1.5 text-[15px] font-bold uppercase tracking-[0.01em] text-ink/90 transition-colors hover:text-ink"
        >
          {skills.contactLabel}
          <svg viewBox="0 0 12 12" className="size-[0.8em] transition-transform duration-500 group-hover:rotate-90" aria-hidden="true">
            <path d="M6 0c.4 3.2 2.8 5.6 6 6-3.2.4-5.6 2.8-6 6-.4-3.2-2.8-5.6-6-6 3.2-.4 5.6-2.8 6-6z" fill="currentColor" />
          </svg>
        </a>

        <a
          href="#contato"
          aria-label={skills.contactLabel}
          className="group mt-[clamp(56px,6vw,110px)] block w-[clamp(110px,9.2vw,170px)] text-accent"
        >
          <svg data-skills-arrow viewBox="0 0 160 112" className="w-full transition-[translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-4" aria-hidden="true">
            <path d="M0 42h104L66 0h40l54 56-54 56H66l38-42H0z" fill="currentColor" />
          </svg>
        </a>
      </div>

      <ul data-skills-list className="md:pt-[clamp(8px,1vw,20px)]">
        {skills.groups.map((group, i) => {
          const isOpen = open === i;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <li key={group.title} data-skills-row>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="group flex w-full items-center justify-between gap-6 py-[clamp(20px,2.2vw,38px)] text-left text-[clamp(28px,2.25vw,42px)] font-medium leading-none tracking-[-0.025em] text-ink"
                >
                  <span className="transition-transform duration-500 group-hover:translate-x-2">{group.title}</span>
                  <svg
                    viewBox="0 0 20 20"
                    className="size-[clamp(18px,1.2vw,22px)] shrink-0 text-ink/80 transition-transform duration-500"
                    style={{ transform: isOpen ? "rotate(135deg)" : "rotate(0deg)" }}
                    aria-hidden="true"
                  >
                    <path d="M10 1v18M1 10h18" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-label={group.title}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease }}
                    className="overflow-hidden"
                  >
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 pb-[clamp(20px,2.2vw,36px)] text-[clamp(17px,1.2vw,21px)] text-ink/80">
                      {group.items.map((item, j) => (
                        <motion.li
                          key={item}
                          initial={{ y: 12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, ease, delay: 0.12 + j * 0.04 }}
                        >
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
