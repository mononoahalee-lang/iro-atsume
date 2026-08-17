export const GENRES = ['木', '土', '石', '布', '花', '建物', '空', '食べ物', '植物', '人', '水', 'その他'] as const

export type Genre = (typeof GENRES)[number]
