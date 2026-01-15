'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createCategoria, updateCategoria } from '@/app/admin/categorias/actions'

interface Categoria {
  id: string
  nome: string
  slug: string
  ativo: boolean
  ordem: number
}

interface CategoryFormProps {
  category?: Categoria
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter()
  const isEditing = !!category

  const [nome, setNome] = useState(category?.nome || '')
  const [ativo, setAtivo] = useState(category?.ativo ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!nome.trim()) {
        throw new Error('Nome é obrigatório')
      }

      if (isEditing && category) {
        const result = await updateCategoria(category.id, {
          nome: nome.trim(),
          ativo,
        })

        if (!result.success) {
          throw new Error(result.error || 'Erro ao atualizar categoria')
        }

        toast.success('Categoria atualizada com sucesso!')
      } else {
        const result = await createCategoria({
          nome: nome.trim(),
          ativo,
        })

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar categoria')
        }

        toast.success('Categoria criada com sucesso!')
      }

      router.push('/admin/categorias')
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar categoria'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nome" className="text-white">
          Nome da Categoria *
        </Label>
        <Input
          id="nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoFocus
          className="border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500"
          placeholder="Ex: iPhone 15 Pro Max"
        />
        <p className="text-xs text-zinc-500">
          O slug será gerado automaticamente a partir do nome
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="ativo"
          checked={ativo}
          onCheckedChange={(checked) => setAtivo(!!checked)}
        />
        <Label htmlFor="ativo" className="cursor-pointer text-sm text-white">
          Categoria ativa (visível no site)
        </Label>
      </div>

      <div className="flex gap-4 border-t border-zinc-800 pt-6">
        <Button
          type="submit"
          disabled={loading || !nome.trim()}
          style={{
            backgroundColor: 'var(--brand-yellow)',
            color: 'var(--brand-black)',
          }}
          className="min-h-[44px] hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Atualizar' : 'Criar'} Categoria
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="min-h-[44px] border-zinc-700 text-white hover:bg-zinc-800"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
