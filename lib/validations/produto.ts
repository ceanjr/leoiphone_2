import { z } from 'zod'

export const produtoCustoSchema = z.object({
  custo: z.number().min(0, 'O custo não pode ser negativo'),
  estoque: z.number().int().min(1, 'O estoque deve ser no mínimo 1'),
  codigo: z.string().optional().nullable().transform(val => val || null),
})

export const produtoSchema = z.object({
  codigo_produto: z.string().optional().nullable().transform(val => val || undefined),
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional().nullable().transform(val => val || undefined),
  preco: z.number().min(0.01, 'O preço deve ser maior que zero'),
  nivel_bateria: z.number().min(0).max(100).optional().nullable().transform(val => val || undefined),
  condicao: z.enum(['novo', 'seminovo']),
  categoria_id: z.string().uuid('Selecione uma categoria'),
  garantia: z.enum(['nenhuma', '3_meses', '6_meses', '1_ano']).default('nenhuma'),
  cores: z.array(z.string()).optional().nullable().transform(val => val || undefined),
  acessorios: z.object({
    caixa: z.boolean().default(false),
    carregador: z.boolean().default(false),
    cabo: z.boolean().default(false),
    capinha: z.boolean().default(false),
    pelicula: z.boolean().default(false),
  }),
  fotos: z.array(z.string().url()).min(1, 'Adicione pelo menos 1 foto'),
  foto_principal: z.string().url().optional().nullable().transform(val => val || undefined),
  ativo: z.boolean().default(true),
  estoque: z.number().int().min(0, 'O estoque não pode ser negativo').default(1),
})

export type ProdutoFormData = z.infer<typeof produtoSchema>
export type ProdutoCustoFormData = z.infer<typeof produtoCustoSchema>
