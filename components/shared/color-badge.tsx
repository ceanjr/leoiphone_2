import { memo } from 'react'
import { getColorStyles, normalizeColorName } from '@/lib/color-utils'
import { getCorOficial, getContrastColor } from '@/lib/iphone-cores'
import { cn } from '@/lib/utils'

interface ColorBadgeProps {
  color: string
  productName?: string // Nome do produto para buscar cores oficiais
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const ColorBadge = memo(function ColorBadge({ color, productName, size = 'sm', className }: ColorBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  // Tentar usar cores oficiais do iphone-cores se productName for fornecido
  if (productName) {
    const corOficial = getCorOficial(productName, color)
    if (corOficial) {
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full font-medium',
            sizeClasses[size],
            className
          )}
          style={{
            backgroundColor: corOficial.hex,
            color: getContrastColor(corOficial.hex),
            border: 'none',
          }}
        >
          {corOficial.nome}
        </span>
      )
    }
  }

  // Fallback para classes Tailwind do color-utils
  const styles = getColorStyles(color)
  const displayName = normalizeColorName(color)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        styles.bg,
        styles.text,
        styles.border,
        sizeClasses[size],
        className
      )}
    >
      {displayName}
    </span>
  )
})

interface ColorBadgeListProps {
  colors: string[]
  size?: 'sm' | 'md' | 'lg'
  maxVisible?: number
  className?: string
}

export const ColorBadgeList = memo(function ColorBadgeList({ colors, size = 'sm', maxVisible, className }: ColorBadgeListProps) {
  if (!colors || colors.length === 0) return null

  const visibleColors = maxVisible ? colors.slice(0, maxVisible) : colors
  const remainingCount = colors.length - visibleColors.length

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {visibleColors.map((color, index) => (
        <ColorBadge key={`${color}-${index}`} color={color} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-zinc-500">+{remainingCount}</span>
      )}
    </div>
  )
})
