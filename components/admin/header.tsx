import { memo } from 'react'

interface HeaderProps {
  title: string
  description?: string
}

function HeaderComponent({ title, description }: HeaderProps) {
  return (
    <div className="flex min-h-[64px] items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-white md:text-xl">{title}</h1>
        {description && <p className="hidden text-sm text-zinc-400 sm:block">{description}</p>}
      </div>
    </div>
  )
}

export const Header = memo(HeaderComponent)
