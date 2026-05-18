const createAvatarSvg = ({
  bgStart,
  bgEnd,
  accent,
  armor,
  visor,
  skin,
  hair,
  stripe,
  emblem,
  mood = 'visor'
}) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgStart}" />
      <stop offset="100%" stop-color="${bgEnd}" />
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.95" />
      <stop offset="100%" stop-color="${visor}" stop-opacity="0.95" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="32" fill="url(#bg)" />
  <circle cx="104" cy="22" r="14" fill="${accent}" fill-opacity="0.18" />
  <circle cx="24" cy="104" r="18" fill="${accent}" fill-opacity="0.12" />
  <path d="M20 100c12-18 30-28 44-28s32 10 44 28v16H20z" fill="${armor}" />
  <path d="M32 102c10-14 21-20 32-20s22 6 32 20v14H32z" fill="${stripe}" fill-opacity="0.28" />
  <path d="M64 20c18 0 33 14 33 32v10c0 18-15 33-33 33S31 80 31 62V52c0-18 15-32 33-32z" fill="${skin}" />
  ${
    mood === 'helmet'
      ? `<path d="M29 55c0-22 16-38 35-38s35 16 35 38v3H29z" fill="${armor}" />
         <path d="M40 52c4-11 13-17 24-17s20 6 24 17v7H40z" fill="url(#glow)" />
         <path d="M35 53l8-12 8 6-4 18H36z" fill="${armor}" />
         <path d="M93 53l-8-12-8 6 4 18h11z" fill="${armor}" />`
      : `<path d="M33 52c3-19 16-31 31-31s28 12 31 31v2H33z" fill="${hair}" />
         <path d="M46 31c7-6 13-8 18-8s11 2 18 8c-4 6-8 9-18 9s-14-3-18-9z" fill="${hair}" />`
  }
  <rect x="40" y="53" width="48" height="12" rx="6" fill="url(#glow)" />
  <circle cx="50" cy="59" r="3" fill="#fff" fill-opacity="0.8" />
  <path d="M53 73c4 4 8 6 11 6 4 0 8-2 11-6" stroke="#2d1d22" stroke-width="3.5" stroke-linecap="round" fill="none" />
  <path d="M47 47h34l8 10H39z" fill="${armor}" fill-opacity="0.68" />
  <path d="M64 80l8 13-8 8-8-8z" fill="${emblem}" />
  <path d="M47 99h34l6 18H41z" fill="${armor}" />
  <path d="M56 100h16v14H56z" fill="${stripe}" fill-opacity="0.48" />
  <rect x="17" y="17" width="94" height="94" rx="26" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="2.5" />
</svg>`;

const toDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const baseAvatars = [
  {
    id: 'vanguard-01',
    name: 'Vanguard Rex',
    rarity: 'Legendary',
    mood: 'helmet',
    bgStart: '#0b1023',
    bgEnd: '#1f0f3a',
    accent: '#22d3ee',
    armor: '#1f2937',
    visor: '#38bdf8',
    skin: '#c78d6b',
    hair: '#141414',
    stripe: '#8b5cf6',
    emblem: '#facc15'
  },
  {
    id: 'ember-02',
    name: 'Ember Strike',
    rarity: 'Epic',
    mood: 'visor',
    bgStart: '#1e0f15',
    bgEnd: '#40121c',
    accent: '#fb7185',
    armor: '#27272a',
    visor: '#f97316',
    skin: '#d9a07d',
    hair: '#f97316',
    stripe: '#ef4444',
    emblem: '#fde047'
  },
  {
    id: 'cypher-03',
    name: 'Cypher Volt',
    rarity: 'Rare',
    mood: 'helmet',
    bgStart: '#071826',
    bgEnd: '#112f49',
    accent: '#60a5fa',
    armor: '#0f172a',
    visor: '#22d3ee',
    skin: '#b98060',
    hair: '#111827',
    stripe: '#10b981',
    emblem: '#38bdf8'
  },
  {
    id: 'nova-04',
    name: 'Nova Fang',
    rarity: 'Epic',
    mood: 'visor',
    bgStart: '#1a1238',
    bgEnd: '#3a175f',
    accent: '#a78bfa',
    armor: '#312e81',
    visor: '#f472b6',
    skin: '#e0aa84',
    hair: '#111827',
    stripe: '#7c3aed',
    emblem: '#e879f9'
  },
  {
    id: 'raider-05',
    name: 'Raider Wolf',
    rarity: 'Common',
    mood: 'helmet',
    bgStart: '#111827',
    bgEnd: '#1f2937',
    accent: '#4ade80',
    armor: '#374151',
    visor: '#86efac',
    skin: '#bb7f5d',
    hair: '#0f172a',
    stripe: '#22c55e',
    emblem: '#d1fae5'
  },
  {
    id: 'mirage-06',
    name: 'Mirage Jet',
    rarity: 'Rare',
    mood: 'visor',
    bgStart: '#10243f',
    bgEnd: '#1d4f91',
    accent: '#38bdf8',
    armor: '#1e293b',
    visor: '#67e8f9',
    skin: '#c18c68',
    hair: '#111827',
    stripe: '#0ea5e9',
    emblem: '#f8fafc'
  },
  {
    id: 'onyx-07',
    name: 'Onyx Ghost',
    rarity: 'Legendary',
    mood: 'helmet',
    bgStart: '#09090b',
    bgEnd: '#27272a',
    accent: '#c084fc',
    armor: '#111827',
    visor: '#e879f9',
    skin: '#a87457',
    hair: '#111827',
    stripe: '#8b5cf6',
    emblem: '#f5d0fe'
  },
  {
    id: 'pulse-08',
    name: 'Pulse Ace',
    rarity: 'Common',
    mood: 'visor',
    bgStart: '#0f172a',
    bgEnd: '#12364c',
    accent: '#2dd4bf',
    armor: '#1f2937',
    visor: '#14b8a6',
    skin: '#d39b77',
    hair: '#0f172a',
    stripe: '#06b6d4',
    emblem: '#99f6e4'
  }
];

export const AVATAR_COLLECTION = baseAvatars.map((avatar) => ({
  ...avatar,
  imageSrc: toDataUri(createAvatarSvg(avatar))
}));

export const DEFAULT_AVATAR_ID = AVATAR_COLLECTION[0].id;

export const RARITY_STYLES = {
  Common: 'border-slate-500/40 bg-slate-500/10 text-slate-200',
  Rare: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  Epic: 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200',
  Legendary: 'border-amber-400/40 bg-amber-500/10 text-amber-200'
};

export const getAvatarById = (avatarId) => (
  AVATAR_COLLECTION.find((avatar) => avatar.id === avatarId) || AVATAR_COLLECTION[0]
);

