import { z } from 'zod'

// Schema para uma taxa individual
const taxaSchema = z
  .number()
  .min(0, 'Taxa não pode ser negativa')
  .max(50, 'Taxa não pode exceder 50%')
  .finite('Taxa deve ser um número válido')

// Schema para o objeto de taxas (1x até 18x)
export const taxasSchema = z.object({
  '1x': taxaSchema,
  '2x': taxaSchema,
  '3x': taxaSchema,
  '4x': taxaSchema,
  '5x': taxaSchema,
  '6x': taxaSchema,
  '7x': taxaSchema,
  '8x': taxaSchema,
  '9x': taxaSchema,
  '10x': taxaSchema,
  '11x': taxaSchema,
  '12x': taxaSchema,
  '13x': taxaSchema,
  '14x': taxaSchema,
  '15x': taxaSchema,
  '16x': taxaSchema,
  '17x': taxaSchema,
  '18x': taxaSchema,
})

// Schema completo para configurações de taxas
export const configuracaoTaxasSchema = z.object({
  ativo: z.boolean(),
  exibir_catalogo: z.boolean().default(true),
  exibir_produto: z.boolean().default(true),
  taxas: taxasSchema,
})

// Tipo TypeScript inferido do schema
export type TaxasConfig = z.infer<typeof taxasSchema>
export type ConfiguracaoTaxas = z.infer<typeof configuracaoTaxasSchema>

// Valores padrão das taxas
export const TAXAS_PADRAO: TaxasConfig = {
  '1x': 0.0,
  '2x': 1.6,
  '3x': 2.5,
  '4x': 3.3,
  '5x': 4.1,
  '6x': 4.9,
  '7x': 5.8,
  '8x': 6.7,
  '9x': 7.6,
  '10x': 8.5,
  '11x': 9.4,
  '12x': 10.3,
  '13x': 12.1,
  '14x': 13.0,
  '15x': 13.9,
  '16x': 14.8,
  '17x': 15.7,
  '18x': 16.6,
}

// Helper para validar se um objeto tem o formato correto de taxas
export function isTaxasConfig(obj: unknown): obj is TaxasConfig {
  return taxasSchema.safeParse(obj).success
}

// Schema para presets de taxas
export const presetTaxasSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  taxas: taxasSchema,
  is_default: z.boolean().default(false),
})

export type PresetTaxas = z.infer<typeof presetTaxasSchema>

// Helper para formatar taxa como porcentagem
export function formatarTaxa(taxa: number): string {
  return `${taxa.toFixed(2)}%`
}
