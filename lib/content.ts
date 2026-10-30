// Conteúdo provisório do portfólio. Tudo que é texto, link ou imagem de
// projeto vem daqui, para trocar pelos dados reais num lugar só.

export const person = {
  firstName: "Vitor",
  lastName: "Lippi",
  monogram: "VL",
  role: "Desenvolvedor FullStack",
  email: "contato@vitorlippi.dev",
  phone: "+55 11 00000 0000",
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
    { text: "Sou desenvolvedor " },
    { text: "FullStack", serif: true },
    { text: ", apaixonado por programação. Gosto de criar " },
    { text: "soluções", serif: true },
    { text: " e de aprender sempre mais." },
  ],
  paragraph:
    "Meu nome é Vitor. Faço freelas desde 2023 e, em 2024, entrei na Softpark, onde trabalho até hoje. Antes disso, passei cinco anos na contabilidade.",
  linkLabel: "Info",
}

// Lippi Chat, a janela que o "Info" do Sobre abre. Quem pergunta fica à
// esquerda ("them"); as respostas do Vitor, à direita ("me").
export type ChatMessage = { from: "them" | "me"; text: string }

export type ChatConversation = {
  id: string
  title: string
  initials: string
  time: string
  messages: ChatMessage[]
}

const conversations: ChatConversation[] = [
  {
    id: "trabalhos",
    title: "Trabalhos",
    initials: "T",
    time: "09:41",
    messages: [
      { from: "them", text: "Oi, Vitor! Como foi o começo da sua carreira?" },
      { from: "me", text: "Comecei com 15 anos, trabalhando com contabilidade. Fiquei nisso de 2018 a 2023." },
      { from: "me", text: "Só que a área que eu gosto é programação, então resolvi mudar." },
      { from: "them", text: "E onde você trabalha hoje?" },
      { from: "me", text: "Na Softpark, desde 2024. Sou desenvolvedor FullStack júnior e atuo como PJ." },
      { from: "them", text: "O que você já fez por lá?" },
      { from: "me", text: "Fiz do zero o SIGEM, sistema da Prefeitura de Rio Claro, com React e Python. O Portal de Rio Claro também começou do zero, em React." },
      { from: "them", text: "E os freelas?" },
      { from: "me", text: "Faço desde 2023 e continuo fazendo. Já entreguei bots em Python e landing pages com React e IA." },
      { from: "me", text: "E o Chatix, um CRM para WhatsApp. Com ele a empresa tem mais controle, não perde venda, acompanha o atendimento de cada funcionário e monta campanhas que fazem sentido." },
      { from: "them", text: "O que você prioriza num freela?" },
      { from: "me", text: "O resultado. Sempre penso em como o projeto vai ajudar a vender e no que dá pra automatizar." },
      { from: "them", text: "Você ainda pega projeto?" },
      { from: "me", text: "Pego, sim! Se tiver uma ideia, me chama no botão aqui embaixo." },
    ],
  },
  {
    id: "formacoes",
    title: "Formações",
    initials: "F",
    time: "Ontem",
    messages: [
      { from: "them", text: "Você fez faculdade?" },
      { from: "me", text: "Estou terminando Ciência da Computação na Universidade Paulista (UNIP)." },
      { from: "me", text: "Comecei em 2022 e a previsão é dezembro de 2026." },
      { from: "them", text: "E cursos?" },
      { from: "me", text: "Vários. Fiz cursos da Anthropic, Alura, Hashtag Treinamentos, DIO, Itaú e Bradesco." },
      { from: "them", text: "Sobre o quê?" },
      { from: "me", text: "Os assuntos variam bastante, vão de IA até Excel." },
    ],
  },
  {
    id: "fora-do-codigo",
    title: "Fora do Código",
    initials: "FC",
    time: "Sáb.",
    messages: [
      { from: "them", text: "O que você curte fazer fora do código?" },
      { from: "me", text: "Sou viciado em Pokémon, esporte em geral e videogame." },
      { from: "them", text: "Joga o quê?" },
      { from: "me", text: "Jogo de tudo, mas ultimamente tenho jogado mais coisa competitiva, tipo CS2." },
      { from: "them", text: "Foi por causa dos jogos que você começou a programar?" },
      { from: "me", text: "Foi! Eu queria criar os meus próprios jogos. Aí descobri o desenvolvimento de software, e hoje é com isso que eu trabalho." },
      { from: "them", text: "E o que você ouve?" },
      { from: "me", text: "Sou eclético. Se a música é boa, eu ouço, e o gênero depende muito do humor do dia." },
      { from: "them", text: "Se não fosse dev, seria o quê?" },
      { from: "me", text: "Jornalista esportivo. Amo futebol e amo jornalismo." },
    ],
  },
]

export const chat = {
  title: "Lippi Chat",
  listTitle: "Conversas",
  contactPrompt: "Quer saber mais?",
  contactLabel: "Fale comigo",
  conversations,
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

// Card que todo link "#contato" abre. O envio ainda não está ligado: o
// formulário avisa e indica o e-mail.
export const contact = {
  title: "Vamos conversar",
  description:
    "Tem um projeto, uma vaga ou só quer trocar uma ideia? Me manda uma mensagem que eu respondo em até um dia útil.",
  info: { email: "E-mail", phone: "Telefone", location: "Localização" },
  fields: { name: "Nome", email: "E-mail", phone: "Telefone", message: "Mensagem" },
  submit: "Enviar mensagem",
  pending: "O envio pelo site ainda não está ligado. Por enquanto, escreva direto para",
  closeLabel: "Fechar contato",
}

export const footer = {
  wordmark: "vitor",
  label: "Vitor Lippi",
  meta: "©2026 · São Paulo",
  columns: [
    { title: "Trabalho", links: [{ label: "Projetos", href: "#projetos" }, { label: "Skills", href: "#skills" }, { label: "Sobre", href: "#sobre" }] },
    { title: "Redes", links: [{ label: "GitHub", href: "#" }, { label: "LinkedIn", href: "#" }, { label: "Instagram", href: "#" }] },
    { title: "Contato", links: [{ label: "contato@vitorlippi.dev", href: "mailto:contato@vitorlippi.dev" }, { label: person.phone, href: "#" }] },
  ],
}
