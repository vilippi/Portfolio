import type { Metadata } from "next";
import SmoothScroll from "@/components/site/smooth-scroll";
import Header from "@/components/site/header";
import ScrollPercent from "@/components/site/scroll-percent";
import SectionRail from "@/components/site/section-rail";
import { person } from "@/lib/content";
import { instrumentSerif, interTight, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: `${person.firstName} ${person.lastName} · ${person.role}`,
  description: `Portfólio de ${person.firstName} ${person.lastName}, ${person.role.toLowerCase()}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("js-motion")`,
          }}
        />
      </head>
      <body>
        <SmoothScroll>
          <Header />
          <ScrollPercent />
          <SectionRail />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
