'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
import { GripVertical, Edit, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, ImageIcon, Package } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { updateOrdemBanner, toggleBannerAtivo, deleteBanner } from '@/app/admin/banners/actions'

interface Banner {
  id: string
  titulo: string
  subtitulo: string | null
  link: string | null
  imagem_url: string
  ativo: boolean
  ordem: number
  tipo: 'banner' | 'produtos_destaque'
  produtos_destaque: Array<{ produto_id: string; preco_promocional: number }>
  countdown_ends_at: string | null
  active_from: string | null
  active_until: string | null
}

interface BannerListProps {
  banners: Banner[]
  onEdit: (banner: Banner) => void
}

function SortableBannerItem({
  banner,
  index,
  totalItems,
  onEdit,
  onMoveUp,
  onMoveDown,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  banner: Banner
  index: number
  totalItems: number
  onEdit: (banner: Banner) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
  onDelete: () => void
  isToggling: boolean
  isDeleting: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-lg border bg-zinc-900 p-3 transition-all ${
        isDragging
          ? 'z-50 border-yellow-500 shadow-lg shadow-yellow-500/20'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-400 active:cursor-grabbing"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Preview */}
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-zinc-950">
        {banner.tipo === 'banner' && banner.imagem_url ? (
          <Image
            src={banner.imagem_url}
            alt={banner.titulo}
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1">
            {banner.tipo === 'produtos_destaque' ? (
              <>
                <Package className="h-5 w-5 text-zinc-600" />
                <span className="text-[10px] text-zinc-600">
                  {banner.produtos_destaque?.length || 0} produtos
                </span>
              </>
            ) : (
              <ImageIcon className="h-6 w-6 text-zinc-600" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-white">{banner.titulo}</h3>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className={`rounded px-1.5 py-0.5 ${
            banner.tipo === 'banner'
              ? 'bg-blue-500/10 text-blue-400'
              : 'bg-purple-500/10 text-purple-400'
          }`}>
            {banner.tipo === 'banner' ? 'Imagem' : 'Produtos'}
          </span>
          {banner.countdown_ends_at && (
            <span className="text-yellow-400">Com countdown</span>
          )}
        </div>
      </div>

      {/* Mobile: Arrows */}
      <div className="flex flex-col gap-1 md:hidden">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-30"
          title="Mover para cima"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === totalItems - 1}
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-30"
          title="Mover para baixo"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Toggle Status */}
        <button
          onClick={onToggle}
          disabled={isToggling}
          className={`rounded-full p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            banner.ativo
              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
          }`}
          title={banner.ativo ? 'Desativar' : 'Ativar'}
        >
          {banner.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(banner)}
          className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-yellow-400"
          title="Editar"
        >
          <Edit className="h-4 w-4" />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function BannerList({ banners: initialBanners, onEdit }: BannerListProps) {
  const router = useRouter()
  const [banners, setBanners] = useState(initialBanners)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; titulo: string }>({
    open: false,
    id: '',
    titulo: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id)
      const newIndex = banners.findIndex((b) => b.id === over.id)

      const newBanners = arrayMove(banners, oldIndex, newIndex)
      setBanners(newBanners)

      // Update order for all affected items
      for (let i = 0; i < newBanners.length; i++) {
        if (newBanners[i].ordem !== i + 1) {
          await updateOrdemBanner(newBanners[i].id, i + 1)
        }
      }

      toast.success('Ordem atualizada')
      router.refresh()
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newBanners = arrayMove(banners, index, index - 1)
    setBanners(newBanners)

    await updateOrdemBanner(newBanners[index - 1].id, index)
    await updateOrdemBanner(newBanners[index].id, index + 1)

    toast.success('Ordem atualizada')
    router.refresh()
  }

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return
    const newBanners = arrayMove(banners, index, index + 1)
    setBanners(newBanners)

    await updateOrdemBanner(newBanners[index].id, index + 1)
    await updateOrdemBanner(newBanners[index + 1].id, index + 2)

    toast.success('Ordem atualizada')
    router.refresh()
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setToggling(id)
    const result = await toggleBannerAtivo(id, !currentStatus)
    if (result.success) {
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ativo: !currentStatus } : b))
      )
      toast.success(currentStatus ? 'Banner desativado' : 'Banner ativado')
    } else {
      toast.error(result.error || 'Erro ao alterar status')
    }
    setToggling(null)
  }

  const handleDelete = async () => {
    const { id, titulo } = deleteDialog
    setDeleteDialog({ open: false, id: '', titulo: '' })
    setDeleting(id)

    const result = await deleteBanner(id)
    if (result.success) {
      setBanners((prev) => prev.filter((b) => b.id !== id))
      toast.success(`"${titulo}" excluído`)
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao excluir')
    }
    setDeleting(null)
  }

  if (banners.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
        <p className="text-zinc-400">Nenhum banner cadastrado.</p>
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={banners.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {banners.map((banner, index) => (
              <SortableBannerItem
                key={banner.id}
                banner={banner}
                index={index}
                totalItems={banners.length}
                onEdit={onEdit}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                onToggle={() => handleToggle(banner.id, banner.ativo)}
                onDelete={() => setDeleteDialog({ open: true, id: banner.id, titulo: banner.titulo })}
                isToggling={toggling === banner.id}
                isDeleting={deleting === banner.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: '', titulo: '' })}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir <strong className="text-white">&quot;{deleteDialog.titulo}&quot;</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
