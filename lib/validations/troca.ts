import { z } from 'zod'

export const trocaSchema = z
  .object({
    modelo: z
      .string()
      .min(3, 'Informe o modelo do seu aparelho')
      .max(100, 'Modelo muito longo'),
    armazenamento: z.enum(['64GB', '128GB', '256GB', '512GB', '1TB']).refine(
      (val) => !!val,
      'Selecione o armazenamento'
    ),
    estadoConservacao: z
      .enum(['praticamente-novo', 'boas-condicoes', 'condicoes-razoaveis'])
      .refine((val) => !!val, 'Selecione o estado de conservação'),
    pecasTrocadas: z.boolean(),
    descricaoPecas: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.pecasTrocadas && !data.descricaoPecas?.trim()) {
        return false
      }
      return true
    },
    {
      message: 'Descreva quais peças foram trocadas',
      path: ['descricaoPecas'],
    }
  )

export type TrocaFormData = z.infer<typeof trocaSchema>

export const estadoConservacaoLabels = {
  'praticamente-novo': 'Praticamente Novo',
  'boas-condicoes': 'Em Boas Condições',
  'condicoes-razoaveis': 'Em Condições Razoáveis',
} as const

export const armazenamentoOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'] as const
