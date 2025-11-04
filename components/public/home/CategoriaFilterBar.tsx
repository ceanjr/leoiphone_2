import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { memo } from 'react'

interface Categoria {
  id: string
  nome: string
}

interface CategoriaFilterBarProps {
  categoriaFiltro: string
  categorias: Categoria[]
  onCategoriaChange: (value: string) => void
  dropdownSide?: 'top' | 'bottom'
  triggerRef?: React.RefObject<HTMLButtonElement | null>
  onOpenChange?: (open: boolean) => void
}

function CategoriaFilterBarComponent({
  categoriaFiltro,
  categorias,
  onCategoriaChange,
  dropdownSide = 'bottom',
  triggerRef,
  onOpenChange,
}: CategoriaFilterBarProps) {
  return (
    <div className="max-w-md flex-1">
      <Label className="mb-1.5 block text-xs font-semibold text-zinc-400 md:hidden">
        Filtrar por Categoria
      </Label>
      <Select value={categoriaFiltro} onValueChange={onCategoriaChange} onOpenChange={onOpenChange}>
        <SelectTrigger
          ref={triggerRef}
          className="min-h-[44px] border-zinc-800 bg-zinc-900 text-white"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className="max-h-[48vh] border-zinc-800 bg-zinc-900 md:max-h-[400px]"
          position="popper"
          side={dropdownSide}
          sideOffset={4}
        >
          <SelectItem value="todas">Todas as Categorias</SelectItem>
          {categorias.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export const CategoriaFilterBar = memo(CategoriaFilterBarComponent)
