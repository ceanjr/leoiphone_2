/**
 * Constantes centralizadas do projeto
 * Facilita manutenção e evita valores hardcoded espalhados
 */

/**
 * Ordem de modelos de iPhone para ordenação
 * Baseado no arquivo filtros.txt
 */
export const ORDEM_MODELOS = [
  'iPhone 7',
  'iPhone 7 Plus',
  'iPhone 8',
  'iPhone 8 Plus',
  'iPhone X',
  'iPhone XR',
  'iPhone XS',
  'iPhone XS Max',
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone 12',
  'iPhone 12 Mini',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13',
  'iPhone 13 Mini',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16',
  'iPhone 16 Plus',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
  'iPhone 17',
  'iPhone 17 Air',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
] as const

/**
 * Ordem de capacidades de armazenamento
 */
export const ORDEM_CAPACIDADES = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'] as const

/**
 * Intervalos de polling (em milissegundos)
 */
export const POLLING_INTERVALS = {
  produtos: 30000, // 30 segundos
  taxas: 30000, // 30 segundos
  dashboard: 10000, // 10 segundos
  sessoes: 300000, // 5 minutos
} as const

/**
 * Configurações de paginação
 */
export const PAGINATION = {
  produtosPorPagina: 20,
  produtosIniciaisMinimo: 20,
  produtosTopVisualizacoes: 5,
} as const

/**
 * Limites de upload
 */
export const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const

/**
 * Timeouts (em milissegundos)
 */
export const TIMEOUTS = {
  authCheck: 3000, // 3 segundos
  apiRequest: 30000, // 30 segundos
} as const

/**
 * Cores do tema
 */
export const THEME_COLORS = {
  brandYellow: 'var(--brand-yellow)',
  brandBlack: 'var(--brand-black)',
} as const

/**
 * URLs e endpoints
 */
export const ENDPOINTS = {
  supabaseStorage: 'https://aswejqbtejibrilrblnm.supabase.co/storage',
} as const

/**
 * Configurações de SEO
 */
export const SEO = {
  siteName: 'Léo iPhone',
  description: 'Encontre iPhones novos e seminovos com os melhores preços. Confira nosso catálogo completo!',
  twitterHandle: '@leoiphone',
  defaultImage: '/images/og-image.png',
} as const

/**
 * Configurações de analytics
 */
export const ANALYTICS = {
  usuariosOnlineWindow: 5 * 60 * 1000, // 5 minutos
  sessaoInativaTimeout: 30 * 60 * 1000, // 30 minutos
} as const
