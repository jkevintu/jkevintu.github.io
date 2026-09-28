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
    body: 'Then the only metric that matters: real people using the thing. At Firework that meant $1M+ ARR from AI products. At Agora, it’s voice agents running at scale.',
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
  { value: '$1M+', label: 'ARR from AI products', note: 'enterprise & S&P 500 at Firework', ink: 'pink' },
  { value: '48h', label: 'idea → working AI service', note: 'CaringAI, ElevenLabs hackathon', ink: 'yellow' },
  { value: '2×', label: 'founder', note: 'QuikForce · Life Is Limited', ink: 'blue' },
];

export type ModelId = 'antenna' | 'avatar' | 'servers' | 'funnel' | 'phone' | 'truck' | 'speaker' | 'cap';

export interface Build {
  title: string;
  org: string;
  years: string;
  body: string;
  tags: string[];
  model: ModelId;
  ink: InkName;
  featured?: boolean;
}

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
    title: 'AVA — AI Virtual Assistant',
    org: 'Firework',
    years: '2024',
    body: 'A video-native shopping assistant with a face, a voice and a brand-tuned brain, built on multimodal models and each brand’s own video library.',
    tags: ['Multimodal', 'RAG', 'Launch'],
    model: 'avatar',
    ink: 'pink',
  },
  {
    title: 'AI workflows for enterprise',
    org: 'Firework',
    years: '2020 — 2025',
    body: 'RAG, prompt engineering, TTS / STT and digital-agent generation shipped to enterprise and S&P 500 customers — $1M+ ARR.',
    tags: ['LLMOps', 'TTS / STT', 'Enterprise'],
    model: 'servers',
    ink: 'yellow',
  },
  {
    title: 'CMS Content Importer',
    org: 'Firework',
    years: 'Growth feature',
    body: 'Took social-video import from concept to reality, widening the content customers could bring in — and noticeably lifting DAU.',
    tags: ['Growth', '0 → 1', 'CMS'],
    model: 'funnel',
    ink: 'blue',
  },
  {
    title: 'CaringAI',
    org: 'ElevenLabs Hackathon',
    years: '2025',
    body: 'An AI companion that phones your loved ones to check in. Login, scheduling, calling and credits — built end-to-end in 48 hours.',
    tags: ['Voice AI', 'Twilio', 'Hackathon'],
    model: 'phone',
    ink: 'pink',
  },
  {
    title: 'QuikForce',
    org: 'Co-founder & CTO',
    years: '2015 — 2016',
    body: 'An on-demand moving marketplace in Cambridge, MA, with a machine-learning matcher that paired customers with the right movers.',
    tags: ['Founder', 'ML', 'Marketplace'],
    model: 'truck',
    ink: 'yellow',
  },
  {
    title: 'Elephant Gym & Fantimate',
    org: 'Life Is Limited',
    years: '2021 — now',
    body: 'The official site for Taiwanese math-rock band Elephant Gym, plus Fantimate — a Patreon-style membership platform for artists.',
    tags: ['Brand', 'Web', 'Creator economy'],
    model: 'speaker',
    ink: 'blue',
  },
  {
    title: 'Accessible admissions UI',
    org: 'Liaison International',
    years: '2017 — 2019',
    body: 'Front-end backbone for one of the largest centralized school-application platforms in the US, with an obsession for ADA / 508 accessibility.',
    tags: ['AngularJS', 'Accessibility', 'Scale'],
    model: 'cap',
    ink: 'pink',
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
    subtitle: 'AI platforms',
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
      { lv: '08', years: '2020 — 2025', role: 'Product Manager', org: 'Firework', note: 'AI products for enterprise & S&P 500 customers; $1M+ ARR.' },
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

export interface Quote {
  text: string;
  name: string;
  role: string;
  ink: InkName;
}

export const QUOTES: Quote[] = [
  {
    text: 'The most passionate and creative PM I have ever worked with. He consistently generates innovative ideas to enhance product usage and usability.',
    name: 'Jing Chen',
    role: 'Director of Engineering, Firework',
    ink: 'pink',
  },
  {
    text: 'His engineering insight immediately multiplied his ability to look at product with understanding the nuances needed to successfully build and launch a product, especially AI driven product.',
    name: 'Stefan Backor',
    role: 'Teammate at Firework',
    ink: 'blue',
  },
];

export const SIDE_QUESTS = [
  { label: 'Community', text: 'Co-hosted the Voice AI Mixer at Boston Tech Week, part of Convo AI World Boston (May 2026).' },
  { label: 'Writing', text: '“AI’s true value is beyond ROI” — why capability, not efficiency, is the real unlock.' },
  { label: 'Choir', text: 'President of the MIT Cambridge Chinese Choral Society (2017 — 2019).' },
] as const;
