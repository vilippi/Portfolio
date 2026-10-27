import Hero from "@/components/sections/hero";
import About from "@/components/sections/about";
import Projects from "@/components/sections/projects";
import Skills from "@/components/sections/skills";
import Footer from "@/components/sections/footer";
import PerspectiveTunnelHero from "@/components/ui/perspective-tunnel-hero";
import { projects, tunnel } from "@/lib/content";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Projects />
      <PerspectiveTunnelHero
        id="galeria"
        rail="Galeria"
        items={projects.map((p) => ({ src: p.image, title: p.title, href: p.href }))}
        kicker={tunnel.kicker}
        title={[tunnel.title[0], tunnel.title[1]]}
        hint={tunnel.hint}
        prompt={tunnel.prompt}
      />
      <Skills />
      <Footer />
    </main>
  );
}
