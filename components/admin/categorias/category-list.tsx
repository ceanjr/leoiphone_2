'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  deleteCategoria,
  updateOrdemCategoria,
  toggleCategoriaAtivo,
} from '@/app/admin/categorias/actions'

interface Categoria {
  id: string
  nome: string
  slug: string
  ativo: boolean
  ordem: number
}

interface CategoryListProps {
  categories: Categoria[]
}

function SortableCategoryItem({
  category,
  index,
  totalCategories,
  onDelete,
  onToggleAtivo,
  isDeleting,
}: {
  category: Categoria
  index: number
  totalCategories: number
  onDelete: (id: string, nome: string) => void
  onToggleAtivo: (id: string, ativo: boolean) => void
  isDeleting: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3 ${
        isDragging ? 'z-50 shadow-lg' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none p-1 text-zinc-500 select-none hover:text-zinc-300 active:cursor-grabbing"
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="rotate-90">
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="6" r="1.5" />
          <circle cx="13" cy="6" r="1.5" />
          <circle cx="7" cy="14" r="1.5" />
          <circle cx="13" cy="14" r="1.5" />
        </svg>
      </div>

      {/* Category Info */}
      <div className="flex-1 select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
        <p className="font-medium text-white">{category.nome}</p>
        <p className="text-xs text-zinc-500">{category.slug}</p>
      </div>

      {/* Status Toggle */}
      <button
        type="button"
        onClick={() => onToggleAtivo(category.id, category.ativo)}
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
          category.ativo
            ? 'bg-green-900/30 text-green-400 hover:bg-green-900/40'
            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
        }`}
      >
        {category.ativo ? (
          <>
            <Eye className="mr-1 h-3 w-3" />
            Ativo
          </>
        ) : (
          <>
            <EyeOff className="mr-1 h-3 w-3" />
            Inativo
          </>
        )}
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/categorias/${category.id}/editar`}
          className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          title="Editar"
        >
          <Edit className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(category.id, category.nome)
          }}
          disabled={isDeleting === category.id}
          className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          title="Excluir"
          style={{ touchAction: 'manipulation' }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function CategoryList({ categories: initialCategories }: CategoryListProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string
    nome: string
  } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const updateCategoryOrder = async (updatedCategories: Categoria[]) => {
    const updates = updatedCategories.map((cat, index) => ({
      id: cat.id,
      ordem: index + 1,
    }))

    const results = await Promise.all(
      updates.map((update) => updateOrdemCategoria(update.id, update.ordem))
    )

    const hasError = results.some((result) => !result.success)
    if (hasError) {
      throw new Error('Erro ao atualizar ordem de uma ou mais categorias')
    }

    router.refresh()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id)
      const newIndex = categories.findIndex((cat) => cat.id === over.id)

      const newCategories = arrayMove(categories, oldIndex, newIndex)
      setCategories(newCategories)

      try {
        await updateCategoryOrder(newCategories)
        toast.success('Ordem atualizada')
      } catch (error) {
        toast.error('Erro ao atualizar ordem')
        // Reverter para a ordem original em caso de erro
        setCategories(categories)
      }
    }
  }

  const handleDeleteClick = (id: string, nome: string) => {
    setCategoryToDelete({ id, nome })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    setDeleting(categoryToDelete.id)
    setDeleteDialogOpen(false)

    const result = await deleteCategoria(categoryToDelete.id)

    if (result.success) {
      const newCategories = categories.filter((c) => c.id !== categoryToDelete.id)
      setCategories(newCategories)
      updateCategoryOrder(newCategories)
      toast.success('Categoria excluída com sucesso')
    } else {
      toast.error(result.error || 'Erro ao excluir categoria')
    }

    setDeleting(null)
    setCategoryToDelete(null)
  }

  const handleToggleAtivo = async (id: string, currentAtivo: boolean) => {
    const result = await toggleCategoriaAtivo(id, !currentAtivo)

    if (result.success) {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ativo: !currentAtivo } : cat))
      )
      toast.success(currentAtivo ? 'Categoria desativada' : 'Categoria ativada')
    } else {
      toast.error(result.error || 'Erro ao alterar status')
    }
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
        <p className="text-zinc-400">Nenhuma categoria cadastrada. Crie sua primeira categoria!</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={categories.map((cat) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            {categories.map((category, index) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                index={index}
                totalCategories={categories.length}
                onDelete={handleDeleteClick}
                onToggleAtivo={handleToggleAtivo}
                isDeleting={deleting}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir a categoria "${categoryToDelete?.nome}"? Categorias com produtos não podem ser excluídas.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  )
}
