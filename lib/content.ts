// Conteúdo provisório do portfólio. Tudo que é texto, link ou imagem de
// projeto vem daqui, para trocar pelos dados reais num lugar só.

export const person = {
  firstName: "Vitor",
  lastName: "Lippi",
  monogram: "VL",
  role: "Desenvolvedor Front-end",
  email: "contato@vitorlippi.dev",
  location: "São Paulo, Brasil",
  status: "Disponível para projetos",
}

export const nav = [
  { id: "sobre", label: "Sobre" },
  { id: "projetos", label: "Projetos" },
  { id: "skills", label: "Skills" },
  { id: "contato", label: "Contato" },
]

export const about = {
  // Cada parte com `serif: true` sai em Instrument Serif itálico.
  statement: [
    { text: "Como " },
    { text: "desenvolvedor criativo", serif: true },
    { text: ", eu construo experiências web sob medida, unindo precisão técnica e " },
    { text: "emoção", serif: true },
    { text: "." },
  ],
  paragraph:
    "Meu nome é Vitor. Sou desenvolvedor apaixonado por criar, e construo experiências digitais memoráveis, sempre buscando o encontro entre arte e informação.",
  linkLabel: "Info",
}

export type Project = {
  title: string
  date: string
  image: string
  href: string
}

const cdn = (path: string) => `https://cdn.21st.dev/assets/mirror/${path}.jpg`

export const projects: Project[] = [
  { title: "Projeto Aurora", date: "01 2026", href: "#", image: cdn("c3/c3fbd2afa140223999a441b32ed986f61d473930002708df805a81532a326aac") },
  { title: "Overtake", date: "11 2025", href: "#", image: cdn("9d/9d8b2f675a5814476ada3736ce439bcda23c5c389e0ebf9b25d8a0c09f3bbcfe") },
  { title: "Anima", date: "09 2025", href: "#", image: cdn("8b/8bb738bf2f00d7f7ed3c3ec034adb9938ad38f4be4ac191d632a6a11ad525574") },
  { title: "Beyond the Clouds", date: "07 2025", href: "#", image: cdn("ac/ac5ac700b188d7ef16ee9dab868098b59f15c440db3f71d4e8c03262a3287577") },
  { title: "Zenith", date: "05 2025", href: "#", image: cdn("ef/ef25eff6ce655fba459b3b7e7711524dc92499aa18f6c7dbea9a0fcc56a8f908") },
  { title: "Prisma DB", date: "03 2025", href: "#", image: cdn("f2/f28b370a5dcbf76240f1504579c4b05fc0ff0bb990a42aff8dc2f73a5dc46072") },
  { title: "ChromaBlock", date: "12 2024", href: "#", image: cdn("f2/f26a1eac85704dda924820392dedfb72d51d8261d35354f83b35d683617295f3") },
  { title: "Fluxo App", date: "10 2024", href: "#", image: cdn("77/7755d23eaaa0aa5b403343f44afa7a29b2d06d3065fe54c602b14ba01d00f2aa") },
  { title: "Éter", date: "08 2024", href: "#", image: cdn("65/657317761fe9058a1d43711b13c543a71eb5199b7a5d9abf4c28479674e39cf7") },
]

export const tunnel = {
  kicker: "Arquivo completo",
  title: ["Todos os", "projetos."],
  hint: "Continue rolando para atravessar o arquivo.",
  prompt: "Role para explorar",
}

export const skills = {
  heading: "Skills",
  statement:
    "Desenvolvedor front-end, focado em interfaces animadas, apaixonado por desenvolvimento web e design.",
  contactLabel: "Fale comigo",
  groups: [
    { title: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML & CSS"] },
    { title: "Animação & 3D", items: ["GSAP", "Motion", "Three.js", "WebGL", "Lenis"] },
    { title: "Backend", items: ["Node.js", "APIs REST", "GraphQL", "Python"] },
    { title: "Bancos de dados", items: ["PostgreSQL", "MongoDB", "Redis", "Prisma"] },
    { title: "DevOps & Ferramentas", items: ["Git", "Docker", "Vercel", "CI/CD", "Figma"] },
    { title: "Sistemas & Segurança", items: ["Linux", "Redes", "Autenticação", "Boas práticas OWASP"] },
  ],
}

export const footer = {
  wordmark: "vitor",
  label: "Vitor Lippi",
  meta: "©2026 · São Paulo",
  columns: [
    { title: "Trabalho", links: [{ label: "Projetos", href: "#projetos" }, { label: "Skills", href: "#skills" }, { label: "Sobre", href: "#sobre" }] },
    { title: "Redes", links: [{ label: "GitHub", href: "#" }, { label: "LinkedIn", href: "#" }, { label: "Instagram", href: "#" }] },
    { title: "Contato", links: [{ label: "contato@vitorlippi.dev", href: "mailto:contato@vitorlippi.dev" }, { label: "+55 11 00000 0000", href: "#" }] },
  ],
}
