// 網站文案的單一來源。內容整理自 LinkedIn（2026-09），改這裡就好。
import type { InkName } from '../lib/iso/palette';
import type { StationId } from '../lib/iso/island';

export const SITE = {
  url: 'https://jkevintu.com',
  name: 'Kevin (K2) Tu',
  title: 'Kevin (K2) Tu — Product, AI Systems & Design Engineering',
  description:
    'K2 turns fuzzy ideas into products that actually run — with product thinking, AI systems and design engineering. Sr. Product Manager, AI at Agora, building Agent Studio.',
  email: 'ktu@jkevintu.com',
  location: 'Sunnyvale, CA',
  links: {
    linkedin: 'https://www.linkedin.com/in/jkevintu',
    github: 'https://github.com/jkevintu',
  },
} as const;

export const HERO = {
  eyebrow: 'Kevin (K2) Tu · Product × AI × Design Engineering',
  lineA: 'Fuzzy ideas in.',
  lineB: 'Working products out.',
  lede: 'I’m K2 — a product manager who still ships code. I use product thinking, AI systems and design engineering to turn half-formed ideas into products that actually run.',
  now: 'Now: Sr. PM, AI @ Agora — building Agent Studio',
} as const;

export interface Chapter {
  id: StationId;
  stage: string;
  place: string;
  title: string;
  body: string;
  tags: string[];
  ink: InkName;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'fog',
    stage: '01',
    place: 'The Fog',
    title: 'Every product starts as fog.',
    body: 'A hunch, a complaint, a sketch on a napkin. I like it here — fog is where the interesting problems hide, and where most teams stall.',
    tags: ['Discovery', 'User research', 'Signal vs. noise'],
    ink: 'blue',
  },
  {
    id: 'lighthouse',
    stage: '02',
    place: 'The Lighthouse',
    title: 'Find the real problem.',
    body: 'Before anything gets built, I get painfully clear on who it’s for, what “working” means, and what we’re choosing not to do. Roadmaps, pricing and positioning are just that clarity, written down.',
    tags: ['Product strategy', 'Roadmap', 'Pricing', 'Positioning'],
    ink: 'pink',
  },
  {
    id: 'core',
    stage: '03',
    place: 'The AI Core',
    title: 'Wire in real intelligence.',
    body: 'RAG, prompt pipelines, speech-to-text, text-to-speech, real-time voice agents. I design AI systems that customers pay for — not demos that die after the keynote.',
    tags: ['LLMs', 'RAG', 'Voice agents', 'STT / TTS'],
    ink: 'blue',
  },
  {
    id: 'workshop',
    stage: '04',
    place: 'The Workshop',
    title: 'Build it for real.',
    body: 'A decade-plus as an engineer means I prototype in production-grade code, not slides. Design, front-end, accessibility — the details that make a product feel inevitable.',
    tags: ['Prototyping', 'Front-end', 'UX', 'Accessibility'],
    ink: 'yellow',
  },
  {
    id: 'launch',
    stage: '05',
    place: 'The Launch Pad',
    title: 'Ship it. Watch it run.',
    body: 'Then the only metric that matters: real people using the thing. At Firework that meant AI products used by enterprise and S&P 500 brands. At Agora, it’s voice agents running at scale.',
    tags: ['Go-to-market', 'Metrics', 'Iteration'],
    ink: 'pink',
  },
];

export const NOW = {
  role: 'Sr. Product Manager, AI',
  org: 'Agora',
  since: 'May 2025',
  where: 'Santa Clara, CA',
  title: 'Building Agent Studio at Agora.',
  body: 'I lead Agent Studio — Agora’s platform for building and deploying AI voice agents at scale. I own the roadmap, pricing and positioning, working across product, engineering and go-to-market.',
  chips: ['Voice AI', 'Real-time', 'Developer platform', 'Pricing & GTM'],
} as const;

export interface Stat {
  value: string;
  label: string;
  note: string;
  ink: InkName;
}

export const STATS: Stat[] = [
  { value: '15+', label: 'years shipping on the web', note: 'since 2011 — Boston to the Bay', ink: 'blue' },
  { value: '6', label: 'AI patent filings', note: 'co-inventor · generative video, 2024', ink: 'yellow' },
  { value: '2×', label: 'founder', note: 'QuikForce · Life Is Limited', ink: 'pink' },
];

export type ModelId =
  | 'antenna'
  | 'avatar'
  | 'servers'
  | 'funnel'
  | 'phone'
  | 'truck'
  | 'speaker'
  | 'cap'
  | 'mic'
  | 'press'
  | 'patron';

export interface Link {
  label: string;
  /** 沒有 href 表示還沒上線，只顯示文字 */
  href?: string;
}

export interface Build {
  title: string;
  org: string;
  years: string;
  body: string;
  tags: string[];
  model: ModelId;
  ink: InkName;
  featured?: boolean;
  link?: Link;
}

// 精選 6 件（3×2）。之後有新作品就直接替換，不必湊滿。
export const BUILDS: Build[] = [
  {
    title: 'Agent Studio',
    org: 'Agora',
    years: '2025 — now',
    body: 'A platform for building and deploying AI voice agents at scale. I lead roadmap, pricing and positioning across product, engineering and GTM.',
    tags: ['Voice AI', 'Platform', 'Pricing'],
    model: 'antenna',
    ink: 'blue',
    featured: true,
  },
  {
    title: 'Makeready',
    org: 'Own product',
    years: '2026 — now',
    body: 'A proofing platform for design studios. It lines up approved copy against the finished PDF, flags missing, extra and changed text — Chinese included — and tracks review to sign-off.',
    tags: ['Design studios', 'CJK proofing', 'AI-built'],
    model: 'press',
    ink: 'yellow',
    link: { label: 'makeready.design' },
  },
  {
    title: 'Karakuma',
    org: 'Side project',
    years: '2026 — now',
    body: 'Karaoke-party rooms in the browser. Open a room, share a link or QR code, and friends queue YouTube songs from their phones into one live playlist. Built with AI coding agents.',
    tags: ['Party app', 'Real-time', 'AI-built'],
    model: 'mic',
    ink: 'pink',
    link: { label: 'karakuma.com', href: 'https://karakuma.com' },
  },
  {
    title: 'AVA — AI Virtual Assistant',
    org: 'Firework',
    years: '2024',
    body: 'A video-native shopping assistant with a face, a voice and a brand-tuned brain, built on multimodal models and each brand’s own video library.',
    tags: ['Multimodal', 'RAG', 'Launch'],
    model: 'avatar',
    ink: 'yellow',
    link: {
      label: 'firework.com',
      href: 'https://firework.com/blog/firework-launches-ava-the-virtual-shopping-assistant-giving-a-face-to-e-commerce',
    },
  },
  {
    title: 'Elephant Gym',
    org: 'Life Is Limited',
    years: '2021 — 2024',
    body: 'The official website for Taiwanese math-rock band Elephant Gym: a custom WordPress theme running as a Vue app, later extended with a trilingual personality test for their album Dreams.',
    tags: ['WordPress', 'Vue', 'Music'],
    model: 'speaker',
    ink: 'pink',
    link: { label: 'elephantgym.co', href: 'https://elephantgym.co' },
  },
  {
    title: 'Fantimate Club',
    org: 'Client · Life Is Limited',
    years: '2022 — 2024',
    body: 'A patron-style platform that gives creators a public space to connect with their fans. Client work: early front-end on the club app, plus Shopify pages for artist and fan campaigns.',
    tags: ['Client work', 'Creator economy', 'Nuxt'],
    model: 'patron',
    ink: 'blue',
    link: { label: 'club.fantimate.com', href: 'https://club.fantimate.com/spacen/' },
  },
];

export interface Level {
  lv: string;
  years: string;
  role: string;
  org: string;
  note: string;
}

export interface World {
  name: string;
  subtitle: string;
  ink: InkName;
  levels: Level[];
}

export const WORLDS: World[] = [
  {
    name: 'World 3',
    subtitle: 'AI Builder',
    ink: 'pink',
    levels: [
      { lv: '10', years: '2025 — now', role: 'Sr. Product Manager, AI', org: 'Agora', note: 'Agent Studio — AI voice agents at scale.' },
      { lv: '09', years: '2021 — now', role: 'Founder & Principal', org: 'Life Is Limited Corp', note: 'Product, brand and software for artists and musicians in Taiwan.' },
    ],
  },
  {
    name: 'World 2',
    subtitle: 'Engineer → PM',
    ink: 'blue',
    levels: [
      { lv: '08', years: '2020 — 2025', role: 'Product Manager', org: 'Firework', note: 'AI products for enterprise & S&P 500 customers.' },
      { lv: '07', years: '2017 — 2019', role: 'Senior UI Developer', org: 'Liaison International', note: 'Accessible front-end for a national admissions platform.' },
      { lv: '06', years: '2016 — 2017', role: 'Senior Frontend Developer', org: 'Gamer Sensei', note: 'Rebuilt the product into a full e-commerce platform; SEO, testing, mentoring.' },
    ],
  },
  {
    name: 'World 1',
    subtitle: 'Boston builder',
    ink: 'yellow',
    levels: [
      { lv: '05', years: '2015 — 2016', role: 'Co-founder & CTO', org: 'QuikForce', note: 'ML-matched moving marketplace, Cambridge, MA.' },
      { lv: '04', years: '2013 — 2015', role: 'Web Developer', org: 'EF Educational Tours', note: 'Web development for educational travel.' },
      { lv: '03', years: '2011 — 2014', role: 'Contractor', org: 'MIT Media Lab', note: 'Projects with professors and students.' },
      { lv: '02', years: '2012 — 2013', role: 'Junior UI Developer', org: 'Online Buddies', note: 'Main product front-end and Asian-language support.' },
      { lv: '01', years: '2011 — 2012', role: 'Software Developer', org: 'Sourcemap', note: 'Supply-chain mapping for desktop and mobile.' },
    ],
  },
];

export const SPAWN = { title: 'B.S., Computer Science & Engineering', org: 'Yuan Ze University' } as const;

export interface Patent {
  /** 公開號（同一發明的 US / WO 放在一起） */
  numbers: string[];
  title: string;
}

/** 共同發明人，2024 年公開 */
export const PATENTS: Patent[] = [
  { numbers: ['US 2024/0185306 A1'], title: 'Text-driven AI-assisted short-form video creation in an e-commerce environment' },
  { numbers: ['US 2024/0233775 A1', 'WO 2024/151578 A1'], title: 'Augmented performance replacement in a short-form video' },
  { numbers: ['US 2024/0267573 A1'], title: 'Livestream with synthetic scene insertion' },
  { numbers: ['US 2024/0290024 A1'], title: 'Dynamic synthetic video chat agent replacement' },
  { numbers: ['US 2024/0428827 A1'], title: 'Expandable video loop with replacement audio' },
];

/** Google Patents 連結：US 2024/0185306 A1 → US20240185306A1 */
export const patentUrl = (number: string): string =>
  `https://patents.google.com/patent/${number.replace(/[\s/]/g, '')}`;

export interface Award {
  year: string;
  event: string;
  prize: string;
  role: string;
  project: string;
  note: string;
}

export const AWARDS: Award[] = [
  {
    year: '2014',
    event: 'IDHack',
    prize: 'Grand Prize',
    role: 'Team lead',
    project: 'Peace Corps opportunity portal',
    note: 'Rebuilt the Peace Corps volunteer-recruiting portal around a simple, personalized workflow.',
  },
  {
    year: '2014',
    event: 'BattleHack',
    prize: 'context.io Prize',
    role: 'Lead developer',
    project: 'PotholeSonar',
    note: 'Sound alerts that steer cyclists around potholes, built on Boston open data and GPS.',
  },
];

export interface Quote {
  text: string;
  name: string;
  role: string;
}

export const PULL_QUOTE: Quote = {
  text: 'The most passionate and creative PM I have ever worked with.',
  name: 'Jing Chen',
  role: 'Director of Engineering, Firework',
};

export interface CommunityRole {
  org: string;
  role: string;
  /** 年份或地點 */
  years: string;
  text: string;
  ink: InkName;
  featured?: boolean;
  link?: Link;
}

// 社群角色：職稱、年份與 Café Philo 的角色是 K2 本人提供；其餘描述盡量以公開資料查證。
export const COMMUNITY: CommunityRole[] = [
  {
    org: 'SF Taiwan Day 2024',
    role: 'General convener',
    years: '2024 · Oakland Coliseum',
    text: 'A day of baseball and Taiwanese heritage at the Oakland Coliseum, where NVIDIA CEO Jensen Huang threw the ceremonial first pitch.',
    ink: 'yellow',
    featured: true,
  },
  {
    org: 'TARO — Taiwanese American Roots Organization',
    role: 'President',
    years: '2026 — now',
    text: 'Connecting people to Taiwan through educational and cultural programs — sports, music and the arts. I also built its website.',
    ink: 'pink',
    link: { label: 'taro-us.org', href: 'https://taro-us.org' },
  },
  // Temporarily hidden at the owner's request (2026-10-06).
  // To restore this entry, uncomment the object below.
  // {
  //   org: 'FAPA Northern California',
  //   role: 'Chapter President',
  //   years: '2024 — 2026',
  //   text: 'The Formosan Association for Public Affairs: Taiwan advocacy with Congress, plus community events across the Bay Area.',
  //   ink: 'blue',
  // },
  {
    org: 'SF Pride · Team Taiwan',
    role: 'Head of Marketing & PR',
    years: '2025 — 2026',
    text: 'Marketing and PR for Team Taiwan, the Taiwanese contingent marching in the San Francisco Pride Parade.',
    ink: 'pink',
  },
  {
    org: 'Café Philo (哲學星期五)',
    role: 'Host & designer',
    years: 'Boston · Bay Area',
    text: 'The Taipei-born civic salon for thinking out loud together. I hosted conversations and designed event visuals for its Boston and Bay Area chapters.',
    ink: 'yellow',
  },
  {
    org: 'Voice AI Mixer · Boston Tech Week',
    role: 'Co-host',
    years: '2026',
    text: 'Brought together founders, operators and investors building in voice and conversational AI, as part of Convo AI World Boston.',
    ink: 'blue',
  },
  {
    org: 'MIT Cambridge Chinese Choral Society',
    role: 'President',
    years: '2017 — 2019',
    text: 'Led the choir in sharing cultures with the community through the study and performance of choral music.',
    ink: 'pink',
  },
];
