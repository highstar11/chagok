export const theme = {
  colors: {
    bgTop: '#E6F0FF',
    bgMid: '#F4EDFF',
    bgBottom: '#FFF1EA',
    blobA: 'rgba(96,165,250,0.45)',
    blobB: 'rgba(192,132,252,0.35)',
    blobC: 'rgba(251,146,60,0.28)',
    text: '#14161B',
    subText: '#667085',
    accent: '#3B82F6',
    danger: '#EF4444',
    track: 'rgba(20,22,27,0.08)',
    glassBorder: 'rgba(255,255,255,0.75)',
    white: '#FFFFFF'
  },
  // 항목별 진행 막대 색
  category: {
    food: '#F97316',
    transport: '#3B82F6',
    clothes: '#A855F7',
    culture: '#EC4899',
    shopping: '#10B981',
  },
} as const;

export type AppTheme = typeof theme;
