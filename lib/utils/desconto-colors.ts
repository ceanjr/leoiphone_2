/**
 * Gera uma cor baseada na porcentagem de desconto
 * Quanto maior o desconto, mais amarelo/dourado
 * Quanto menor o desconto, mais verde
 */
export function getDescontoColor(percentual: number): {
  bg: string
  text: string
  border: string
} {
  // Normalizar para 0-1 baseado em uma escala de 0-10%
  const normalized = Math.min(percentual / 10, 1)

  if (normalized <= 0.3) {
    // Verde claro (3-4%)
    return {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
    }
  } else if (normalized <= 0.5) {
    // Verde-amarelo (4-5%)
    return {
      bg: 'bg-lime-500/20',
      text: 'text-lime-400',
      border: 'border-lime-500/30',
    }
  } else if (normalized <= 0.7) {
    // Amarelo esverdeado (5-7%)
    return {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
    }
  } else if (normalized <= 0.85) {
    // Amarelo (7-8.5%)
    return {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    }
  } else {
    // Dourado/laranja (8.5-10%+)
    return {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
    }
  }
}

/**
 * Gera um desconto aleatório entre min e max
 * Mantém 2 casas decimais
 */
export function gerarDescontoAleatorio(min: number, max: number): number {
  const desconto = Math.random() * (max - min) + min
  return Math.round(desconto * 100) / 100
}
