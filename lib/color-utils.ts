// Mapeamento de cores para classes Tailwind
export const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  // Preto
  black: { bg: 'bg-black', text: 'text-white', border: 'border-zinc-700' },
  preto: { bg: 'bg-black', text: 'text-white', border: 'border-zinc-700' },
  'jet black': { bg: 'bg-black', text: 'text-white', border: 'border-zinc-700' },
  'space black': { bg: 'bg-black', text: 'text-white', border: 'border-zinc-700' },
  'black titanium': { bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-700' },
  midnight: { bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-700' },
  graphite: { bg: 'bg-zinc-800', text: 'text-white', border: 'border-zinc-600' },
  'space gray': { bg: 'bg-zinc-700', text: 'text-white', border: 'border-zinc-500' },

  // Branco/Prata
  white: { bg: 'bg-white', text: 'text-zinc-900', border: 'border-zinc-300' },
  branco: { bg: 'bg-white', text: 'text-zinc-900', border: 'border-zinc-300' },
  silver: { bg: 'bg-zinc-200', text: 'text-zinc-900', border: 'border-zinc-400' },
  prata: { bg: 'bg-zinc-200', text: 'text-zinc-900', border: 'border-zinc-400' },
  starlight: { bg: 'bg-zinc-100', text: 'text-zinc-900', border: 'border-zinc-300' },
  'white titanium': { bg: 'bg-zinc-100', text: 'text-zinc-900', border: 'border-zinc-300' },

  // Dourado
  gold: { bg: 'bg-yellow-600', text: 'text-white', border: 'border-yellow-700' },
  dourado: { bg: 'bg-yellow-600', text: 'text-white', border: 'border-yellow-700' },
  'rose gold': { bg: 'bg-rose-400', text: 'text-white', border: 'border-rose-500' },
  yellow: { bg: 'bg-yellow-400', text: 'text-zinc-900', border: 'border-yellow-500' },
  amarelo: { bg: 'bg-yellow-400', text: 'text-zinc-900', border: 'border-yellow-500' },
  'natural titanium': { bg: 'bg-amber-200', text: 'text-zinc-900', border: 'border-amber-300' },
  'desert titanium': { bg: 'bg-amber-300', text: 'text-zinc-900', border: 'border-amber-400' },

  // Azul
  blue: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  azul: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  'pacific blue': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
  'sierra blue': { bg: 'bg-blue-400', text: 'text-white', border: 'border-blue-500' },
  'blue titanium': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  'deep blue': { bg: 'bg-blue-700', text: 'text-white', border: 'border-blue-800' },
  'mist blue': { bg: 'bg-blue-300', text: 'text-zinc-900', border: 'border-blue-400' },
  'light blue': { bg: 'bg-blue-300', text: 'text-zinc-900', border: 'border-blue-400' },
  ultramarine: { bg: 'bg-blue-700', text: 'text-white', border: 'border-blue-800' },
  teal: { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },

  // Rosa
  pink: { bg: 'bg-pink-400', text: 'text-white', border: 'border-pink-500' },
  rosa: { bg: 'bg-pink-400', text: 'text-white', border: 'border-pink-500' },
  coral: { bg: 'bg-coral-400', text: 'text-white', border: 'border-coral-500' },

  // Roxo
  purple: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
  roxo: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
  'deep purple': { bg: 'bg-purple-700', text: 'text-white', border: 'border-purple-800' },
  lavender: { bg: 'bg-purple-300', text: 'text-zinc-900', border: 'border-purple-400' },

  // Verde
  green: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  verde: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  'midnight green': { bg: 'bg-emerald-700', text: 'text-white', border: 'border-emerald-800' },
  'alpine green': { bg: 'bg-green-600', text: 'text-white', border: 'border-green-700' },
  sage: { bg: 'bg-green-300', text: 'text-zinc-900', border: 'border-green-400' },

  // Vermelho
  red: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  vermelho: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  '(product)red': { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  'cosmic orange': { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700' },

  // Outros
  gardenia: { bg: 'bg-yellow-100', text: 'text-zinc-900', border: 'border-yellow-200' },
}

export function getColorStyles(colorName: string): { bg: string; text: string; border: string } {
  const normalized = colorName.toLowerCase().trim()
  return colorMap[normalized] || { bg: 'bg-zinc-700', text: 'text-white', border: 'border-zinc-600' }
}

export function normalizeColorName(colorName: string): string {
  // Mantém o nome original mas capitaliza
  return colorName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
