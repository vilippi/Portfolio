"use client";

import { toggleTheme, useTheme } from "@/components/site/theme";

function Moon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`w-[42%] ${className}`} aria-hidden="true">
      <path
        d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Sun({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`w-[46%] ${className}`} aria-hidden="true">
      <circle cx="10" cy="10" r="3.4" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M10 1.8v1.6M10 16.6v1.6M1.8 10h1.6M16.6 10h1.6M4.2 4.2l1.1 1.1M14.7 14.7l1.1 1.1M4.2 15.8l1.1-1.1M14.7 5.3l1.1-1.1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// O Switch de tema do cabeçalho: um trilho da altura dos outros botões, com
// um botão que desliza (lua no escuro, sol no claro). A posição sai da
// variante `light:` do CSS, e não do estado do React, para já nascer certa.
export default function ThemeSwitch() {
  const light = useTheme() === "light";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      aria-label="Tema claro"
      data-header-item
      data-intro
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className="group relative flex h-(--sw-h) w-(--sw-w) shrink-0 items-center rounded-[10px] border-2 border-ink/90 p-[clamp(3px,0.3vw,5px)] text-ink [--sw-h:clamp(44px,3.6vw,62px)] [--sw-w:calc(var(--sw-h)*1.8)]"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-center text-ink/35 transition-colors duration-300 group-hover:text-ink/70">
        <Moon />
      </span>
      <span aria-hidden="true" className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-center text-ink/35 transition-colors duration-300 group-hover:text-ink/70">
        <Sun />
      </span>
      <span
        aria-hidden="true"
        className="relative z-1 flex aspect-square h-full items-center justify-center rounded-[6px] bg-ink text-bg transition-[translate] duration-500 ease-[cubic-bezier(0.3,1.35,0.5,1)] light:translate-x-[calc(var(--sw-w)-var(--sw-h))]"
      >
        <Moon className="light:hidden" />
        <Sun className="hidden light:block" />
      </span>
    </button>
  );
}
