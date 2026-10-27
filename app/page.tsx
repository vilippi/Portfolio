import Hero from "@/components/sections/hero";
import About from "@/components/sections/about";
import Projects from "@/components/sections/projects";
import Skills from "@/components/sections/skills";
import Footer from "@/components/sections/footer";
import { StaticGallery } from "@/components/ui/perspective-tunnel-hero";
import { projects, tunnel } from "@/lib/content";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      {/* O túnel roda dentro do pin de Projetos; sem movimento, vira esta grade. */}
      <Projects />
      <StaticGallery
        className="hidden motion-reduce:block"
        items={projects.map((p) => ({ src: p.image, title: p.title, href: p.href }))}
        kicker={tunnel.kicker}
        title={[tunnel.title[0], tunnel.title[1]]}
      />
      <Skills />
      <Footer />
    </main>
  );
}
