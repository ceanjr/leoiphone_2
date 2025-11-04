import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { memo } from 'react'

interface BuscaFormProps {
  busca: string
  onBuscaChange: (value: string) => void
  onBuscaSubmit: (e: React.FormEvent) => void
  onLimpar: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

function BuscaFormComponent({
  busca,
  onBuscaChange,
  onBuscaSubmit,
  onLimpar,
  inputRef,
}: BuscaFormProps) {
  return (
    <form onSubmit={onBuscaSubmit} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Buscar por modelo, cor ou código..."
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        className="min-h-[44px] border-zinc-800 bg-zinc-900 pl-10 pr-10 text-white placeholder:text-zinc-500"
      />
      {busca && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLimpar}
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 text-zinc-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  )
}

export const BuscaForm = memo(BuscaFormComponent)
