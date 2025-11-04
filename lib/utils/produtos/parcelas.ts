import type { TaxasConfig } from '@/lib/validations/taxas'

export interface Parcela {
  numero: number // 1, 2, 3, ..., 18
  taxa: number // Taxa percentual (ex: 1.6 para 1.6%)
  valorParcela: number // Valor de cada parcela
  valorTotal: number // Valor total com juros
  semJuros: boolean // true se for 1x (sem juros)
}

/**
 * Calcula o valor da parcela com taxa aplicada
 * Fórmula: parcela = (preco * (1 + taxa/100)) / numero_parcelas
 */
export function calcularValorParcela(
  precoBase: number,
  numeroParcelas: number,
  taxa: number
): number {
  if (numeroParcelas <= 0) return 0
  if (precoBase <= 0) return 0

  const precoComJuros = precoBase * (1 + taxa / 100)
  return precoComJuros / numeroParcelas
}

/**
 * Calcula o valor total com taxa aplicada
 */
export function calcularValorTotal(precoBase: number, taxa: number): number {
  if (precoBase <= 0) return 0
  return precoBase * (1 + taxa / 100)
}

/**
 * Gera array com todas as parcelas calculadas
 */
export function calcularTodasParcelas(
  precoBase: number,
  taxas: TaxasConfig
): Parcela[] {
  const parcelas: Parcela[] = []

  // Iterar de 1x até 18x
  for (let i = 1; i <= 18; i++) {
    const chave = `${i}x` as keyof TaxasConfig
    const taxa = taxas[chave]

    const valorTotal = calcularValorTotal(precoBase, taxa)
    const valorParcela = calcularValorParcela(precoBase, i, taxa)

    parcelas.push({
      numero: i,
      taxa,
      valorParcela,
      valorTotal,
      semJuros: false, // Todas as parcelas têm juros
    })
  }

  return parcelas
}

/**
 * Formata valor monetário em Real Brasileiro
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

/**
 * Formata parcela para exibição (ex: "12x de R$ 250,00")
 */
export function formatarParcela(parcela: Parcela): string {
  return `${parcela.numero}x de ${formatarMoeda(parcela.valorParcela)}`
}

/**
 * Encontra a maior parcela (geralmente 18x)
 */
export function encontrarMaiorParcela(parcelas: Parcela[]): Parcela | null {
  if (parcelas.length === 0) return null
  return parcelas[parcelas.length - 1]
}

/**
 * Encontra a parcela sem juros (1x)
 */
export function encontrarParcelaSemJuros(parcelas: Parcela[]): Parcela | null {
  return parcelas.find((p) => p.semJuros) || null
}

/**
 * Calcula economia ao pagar à vista vs parcelado
 */
export function calcularEconomia(
  precoBase: number,
  parcelaComJuros: Parcela
): number {
  return parcelaComJuros.valorTotal - precoBase
}
