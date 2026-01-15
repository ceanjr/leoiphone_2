'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { GripVertical, Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react'
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
}

function SortableBannerItem({
  banner,
  index,
  totalItems,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  banner: Banner
  index: number
  totalItems: number
  onToggle: () => void
  onDelete: () => void
  isToggling: boolean
  isDeleting: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
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
      className={`group rounded-lg border bg-zinc-900 p-4 transition-all ${
        isDragging
          ? 'z-50 border-yellow-500 shadow-lg shadow-yellow-500/20'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Desktop Layout */}
      <div className="hidden items-center gap-3 md:flex">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-400 active:cursor-grabbing"
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate font-medium text-white">{banner.titulo}</h3>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span
              className={`rounded px-1.5 py-0.5 ${
                banner.tipo === 'banner'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-purple-500/10 text-purple-400'
              }`}
            >
              {banner.tipo === 'banner' ? 'Imagem' : 'Produtos'}
            </span>
            {banner.tipo === 'produtos_destaque' && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {banner.produtos_destaque?.length || 0} produtos
              </span>
            )}
            {banner.countdown_ends_at && <span className="text-yellow-400">Com countdown</span>}
          </div>
        </div>

        {/* Status Toggle */}
        <button
          onClick={onToggle}
          disabled={isToggling}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            banner.ativo
              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
          }`}
        >
          {banner.ativo ? (
            <>
              <Eye className="h-3 w-3" />
              Ativo
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3" />
              Inativo
            </>
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/banners/${banner.id}/editar`}
            className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Banner Info */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white">{banner.titulo}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={`rounded px-1.5 py-0.5 ${
                banner.tipo === 'banner'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-purple-500/10 text-purple-400'
              }`}
            >
              {banner.tipo === 'banner' ? 'Imagem' : 'Produtos'}
            </span>
            {banner.tipo === 'produtos_destaque' && (
              <span className="flex items-center gap-1 text-zinc-500">
                <Package className="h-3 w-3" />
                {banner.produtos_destaque?.length || 0} produtos
              </span>
            )}
            {banner.countdown_ends_at && <span className="text-yellow-400">Com countdown</span>}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-4">
          {/* Status Button */}
          <button
            onClick={onToggle}
            disabled={isToggling}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              banner.ativo
                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
            }`}
          >
            {banner.ativo ? (
              <>
                <Eye className="h-4 w-4" />
                Ativo
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Inativo
              </>
            )}
          </button>

          {/* Edit and Delete Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/banners/${banner.id}/editar`}
              className="flex items-center gap-1 rounded-md bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 rounded-md bg-red-500/10 p-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
              Apagar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BannerList({ banners: initialBanners }: BannerListProps) {
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

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setToggling(id)
    const result = await toggleBannerAtivo(id, !currentStatus)
    if (result.success) {
      // Se ativou, desativa todos os outros e move para o topo
      if (!currentStatus) {
        setBanners((prev) => {
          const updated = prev.map((b) => ({
            ...b,
            ativo: b.id === id,
          }))
          // Move o banner ativado para o início
          const activatedBanner = updated.find((b) => b.id === id)
          const otherBanners = updated.filter((b) => b.id !== id)
          return activatedBanner ? [activatedBanner, ...otherBanners] : updated
        })
        toast.success('Banner ativado e movido para o topo')
      } else {
        setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ativo: false } : b)))
        toast.success('Banner desativado')
      }
      router.refresh()
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {banners.map((banner, index) => (
              <SortableBannerItem
                key={banner.id}
                banner={banner}
                index={index}
                totalItems={banners.length}
                onToggle={() => handleToggle(banner.id, banner.ativo)}
                onDelete={() =>
                  setDeleteDialog({ open: true, id: banner.id, titulo: banner.titulo })
                }
                isToggling={toggling === banner.id}
                isDeleting={deleting === banner.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: '', titulo: '' })}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir{' '}
              <strong className="text-white">&quot;{deleteDialog.titulo}&quot;</strong>? Esta ação
              não pode ser desfeita.
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
