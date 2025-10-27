import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
} as const

const sizeAttrMap = {
  sm: '32px',
  md: '48px',
  lg: '64px',
  xl: '96px',
} as const

export function Loading({ size = 'md', className, text }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('relative animate-pulse', sizeMap[size])}>
        <Image
          src="/icons/loading.svg"
          alt="Carregando..."
          fill
          className="object-contain brightness-150 grayscale opacity-40"
          sizes={sizeAttrMap[size]}
          priority
          style={{ filter: 'invert(0.8)' }}
        />
      </div>
      {text && (
        <p className="text-sm text-zinc-400 animate-pulse">{text}</p>
      )}
    </div>
  )
}

// Variante para tela cheia
export function LoadingScreen({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Loading size="xl" text={text} />
    </div>
  )
}

// Variante para overlay
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Loading size="lg" text={text} />
    </div>
  )
}
