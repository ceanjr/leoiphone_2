'use client'

import { useEffect, useState } from 'react'
import type React from 'react'
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  updateOrdemCategoria,
  toggleCategoriaAtivo,
} from './actions'

interface Categoria {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ativo: boolean
  ordem: number
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
  })
  const [saving, setSaving] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => {
    loadCategorias()
  }, [])

  async function loadCategorias() {
    setLoading(true)
    const { categorias: data } = await getCategorias()
    setCategorias(data)
    setLoading(false)
  }

  function handleOpenDialog(categoria?: Categoria) {
    if (categoria) {
      setEditingCategoria(categoria)
      setFormData({
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        ativo: categoria.ativo,
      })
    } else {
      setEditingCategoria(null)
      setFormData({ nome: '', descricao: '', ativo: true })
    }
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)

    if (editingCategoria) {
      const result = await updateCategoria(editingCategoria.id, formData)
      if (result.success) {
        toast.success('Categoria atualizada com sucesso!')
        setDialogOpen(false)
        loadCategorias()
      } else {
        toast.error(result.error || 'Erro ao atualizar categoria')
      }
    } else {
      const result = await createCategoria(formData)
      if (result.success) {
        toast.success('Categoria criada com sucesso!')
        setDialogOpen(false)
        loadCategorias()
      } else {
        toast.error(result.error || 'Erro ao criar categoria')
      }
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!categoriaToDelete) return

    const result = await deleteCategoria(categoriaToDelete)
    if (result.success) {
      toast.success('Categoria excluída com sucesso!')
      setDeleteDialogOpen(false)
      setCategoriaToDelete(null)
      loadCategorias()
    } else {
      toast.error(result.error || 'Erro ao excluir categoria')
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    const result = await toggleCategoriaAtivo(id, !ativo)
    if (result.success) {
      toast.success(ativo ? 'Categoria desativada' : 'Categoria ativada')
      loadCategorias()
    } else {
      toast.error(result.error || 'Erro ao alterar status')
    }
  }

  async function moveCategoria(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categorias.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newCategorias = [...categorias]
    const temp = newCategorias[index]
    newCategorias[index] = newCategorias[newIndex]
    newCategorias[newIndex] = temp

    // Atualizar ordens localmente
    setCategorias(newCategorias)

    // Atualizar no banco
    await updateOrdemCategoria(newCategorias[index].id, index + 1)
    await updateOrdemCategoria(newCategorias[newIndex].id, newIndex + 1)

    toast.success('Ordem atualizada')
  }

  async function persistOrdem(novasCategorias: Categoria[]) {
    // Persiste a nova ordem no banco (1-based)
    await Promise.all(
      novasCategorias.map((c, idx) => updateOrdemCategoria(c.id, idx + 1))
    )
  }

  function handleDragStart(
    e: React.DragEvent<HTMLTableRowElement>,
    id: string
  ) {
    setDraggingId(id)
    try {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    } catch {}
  }

  function handleDragOver(
    e: React.DragEvent<HTMLTableRowElement>,
    overId: string
  ) {
    e.preventDefault()
    try {
      e.dataTransfer.dropEffect = 'move'
    } catch {}
    setDragOverId(overId)
  }

  function handleDragEnter(
    e: React.DragEvent<HTMLTableRowElement>,
    overId: string
  ) {
    e.preventDefault()
    setDragOverId(overId)
  }

  function handleDragLeave() {
    setDragOverId(null)
  }

  async function handleDrop(
    e: React.DragEvent<HTMLTableRowElement>,
    targetId: string
  ) {
    e.preventDefault()
    const sourceId = draggingId || (() => {
      try {
        return e.dataTransfer.getData('text/plain')
      } catch {
        return ''
      }
    })()

    setDraggingId(null)
    setDragOverId(null)

    if (!sourceId || sourceId === targetId) return

    const sourceIndex = categorias.findIndex((c) => c.id === sourceId)
    const targetIndex = categorias.findIndex((c) => c.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const novas = [...categorias]
    const [moved] = novas.splice(sourceIndex, 1)
    novas.splice(targetIndex, 0, moved)

    // Atualiza localmente as ordens para feedback imediato
    const novasComOrdem = novas.map((c, idx) => ({ ...c, ordem: idx + 1 }))
    setCategorias(novasComOrdem)

    await persistOrdem(novas)
    toast.success('Ordem atualizada')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="text-center">
          <div className="relative mx-auto h-8 w-8 animate-pulse">
            <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
          </div>
          <p className="mt-4 text-sm text-zinc-400">Carregando categorias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">Categorias</h2>
          <p className="text-xs text-zinc-400 md:text-sm">
            Gerencie as categorias de produtos
          </p>
        </div>

        <Button
          onClick={() => handleOpenDialog()}
          className="w-full sm:w-auto"
          style={{
            backgroundColor: 'var(--brand-yellow)',
            color: 'var(--brand-black)',
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {categorias.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center md:p-12">
          <p className="text-zinc-400">Nenhuma categoria cadastrada ainda.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Clique em &quot;Nova Categoria&quot; para adicionar a primeira categoria.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Ordem</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Nome</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium text-zinc-400 md:table-cell">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((categoria, index) => (
                  <tr
                    key={categoria.id}
                    className={`border-b border-zinc-800 hover:bg-zinc-800/50 ${
                      draggingId === categoria.id ? 'opacity-60' : ''
                    } ${dragOverId === categoria.id ? 'bg-zinc-800/70' : ''}`}
                    onDragOver={(e) => handleDragOver(e, categoria.id)}
                    onDragEnter={(e) => handleDragEnter(e, categoria.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, categoria.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          draggable
                          onDragStart={(e) => handleDragStart(e, categoria.id)}
                          className="cursor-grab text-zinc-600 hover:text-zinc-400"
                          aria-label="Arrastar para reordenar"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveCategoria(index, 'up')}
                            disabled={index === 0}
                            className="text-zinc-500 hover:text-white disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveCategoria(index, 'down')}
                            disabled={index === categorias.length - 1}
                            className="text-zinc-500 hover:text-white disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                        <span className="text-sm text-zinc-500">{categoria.ordem}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-white">{categoria.nome}</div>
                        <div className="text-xs text-zinc-500">{categoria.slug}</div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="max-w-xs truncate text-sm text-zinc-400">
                        {categoria.descricao || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleAtivo(categoria.id, categoria.ativo)}
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                          categoria.ativo
                            ? 'bg-green-900/30 text-green-400 hover:bg-green-900/40'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                        }`}
                      >
                        {categoria.ativo ? (
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
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(categoria)}
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCategoriaToDelete(categoria.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="h-8 w-8 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingCategoria
                ? 'Atualize as informações da categoria'
                : 'Preencha os dados da nova categoria'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="border-zinc-800 bg-zinc-950 text-white"
                placeholder="Ex: iPhone 15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="border-zinc-800 bg-zinc-950 text-white"
                rows={3}
                placeholder="Descrição opcional da categoria"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: !!checked })
                }
              />
              <Label htmlFor="ativo" className="cursor-pointer text-sm">
                Categoria ativa
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.nome.trim()}
              style={{
                backgroundColor: 'var(--brand-yellow)',
                color: 'var(--brand-black)',
              }}
            >
              {saving ? 'Salvando...' : editingCategoria ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita. Categorias com produtos não podem ser excluídas."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
