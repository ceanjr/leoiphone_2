/**
 * Configuração de seções especiais da HomePage
 */

export type SecaoTipo = 'destaques' | 'promocoes' | 'lancamentos'

export interface SecaoConfig {
  icon: string
  borderColor: string
  bgGradient: string
  badge: string
  badgeColor: string
}

export const SECAO_CONFIGS: Record<SecaoTipo, SecaoConfig> = {
  destaques: {
    icon: '⭐',
    borderColor: 'var(--brand-yellow)',
    bgGradient:
      'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(234, 179, 8, 0.02) 100%)',
    badge: 'Destaque',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  promocoes: {
    icon: '🔥',
    borderColor: '#ef4444',
    bgGradient:
      'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)',
    badge: 'Promoção',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  lancamentos: {
    icon: '🚀',
    borderColor: '#3b82f6',
    bgGradient:
      'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
    badge: 'Novo',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
}

export function getSecaoConfig(tipo: SecaoTipo): SecaoConfig {
  return SECAO_CONFIGS[tipo] || SECAO_CONFIGS.destaques
}
