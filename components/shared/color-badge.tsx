import { memo } from 'react'
import { getColorStyles, normalizeColorName } from '@/lib/color-utils'
import { cn } from '@/lib/utils'

interface ColorBadgeProps {
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const ColorBadge = memo(function ColorBadge({ color, size = 'sm', className }: ColorBadgeProps) {
  const styles = getColorStyles(color)
  const displayName = normalizeColorName(color)

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

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
