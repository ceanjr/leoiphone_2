import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { memo, useEffect, useState } from 'react'

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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detectar se é mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prevenir autofocus no mobile ao montar o componente
  useEffect(() => {
    if (isMobile && inputRef?.current) {
      // Remove o foco se estiver focado
      if (document.activeElement === inputRef.current) {
        inputRef.current.blur()
      }
    }
  }, [isMobile, inputRef])

  return (
    <form onSubmit={onBuscaSubmit} className="relative flex-1">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Buscar por modelo ou código..."
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        className="min-h-[44px] border-zinc-800 bg-zinc-900 pr-10 pl-10 text-white placeholder:text-zinc-500"
        autoFocus={false}
        autoComplete="off"
        // Prevenir comportamento padrão de alguns navegadores mobile
        onFocus={(e) => {
          // Se é mobile e o usuário não clicou diretamente, remove o foco
          if (isMobile && !e.currentTarget.dataset.userFocus) {
            e.currentTarget.blur()
          }
        }}
        onClick={(e) => {
          // Marcar que foi clique do usuário
          e.currentTarget.dataset.userFocus = 'true'
        }}
        onBlur={(e) => {
          // Limpar marcador
          delete e.currentTarget.dataset.userFocus
        }}
      />
      {busca && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLimpar}
          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-0 text-zinc-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  )
}

export const BuscaForm = memo(BuscaFormComponent)
