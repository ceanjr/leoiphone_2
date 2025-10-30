'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  configuracaoTaxasSchema,
  TAXAS_PADRAO,
  type ConfiguracaoTaxas,
  type TaxasConfig,
} from '@/lib/validations/taxas'

interface ConfiguracaoTaxasRow {
  id: string
  ativo: boolean
  taxas: TaxasConfig
  created_at: string
  updated_at: string
  updated_by: string | null
}

/**
 * Busca a configuração de taxas ativa
 */
export async function getConfiguracaoTaxas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('configuracoes_taxas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // Se não houver configuração, retornar padrão
    if (error.code === 'PGRST116') {
      return {
        configuracao: {
          id: null,
          ativo: false,
          taxas: TAXAS_PADRAO,
          created_at: null,
          updated_at: null,
          updated_by: null,
        },
        error: null,
      }
    }

    console.error('Erro ao buscar configuração de taxas:', error)
    return {
      configuracao: null,
      error: 'Erro ao carregar configurações',
    }
  }

  return {
    configuracao: data as ConfiguracaoTaxasRow,
    error: null,
  }
}

/**
 * Busca se a calculadora está ativa (para uso público)
 */
export async function isCalculadoraAtiva(): Promise<boolean> {
  const { configuracao } = await getConfiguracaoTaxas()
  return configuracao?.ativo ?? false
}

/**
 * Atualiza a configuração de taxas
 */
export async function updateConfiguracaoTaxas(config: ConfiguracaoTaxas) {
  const supabase = await createClient()

  // Validar dados
  const validated = configuracaoTaxasSchema.safeParse(config)

  if (!validated.success) {
    const firstError = validated.error.issues[0]?.message
    return {
      success: false,
      error: firstError || 'Dados inválidos',
    }
  }

  // Buscar configuração existente
  const { data: existing } = await supabase
    .from('configuracoes_taxas')
    .select('id')
    .limit(1)
    .single()

  let result

  if (existing) {
    // Atualizar existente
    const { data, error } = await supabase
      .from('configuracoes_taxas')
      .update({
        ativo: validated.data.ativo,
        taxas: validated.data.taxas,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    result = { data, error }
  } else {
    // Criar novo
    const { data, error } = await supabase
      .from('configuracoes_taxas')
      .insert({
        ativo: validated.data.ativo,
        taxas: validated.data.taxas,
      })
      .select()
      .single()

    result = { data, error }
  }

  if (result.error) {
    console.error('Erro ao salvar configuração:', result.error)
    return {
      success: false,
      error: result.error.message || 'Erro ao salvar configurações',
    }
  }

  // Revalidar cache das páginas públicas
  revalidatePath('/', 'layout')
  revalidatePath('/produto/[slug]', 'page')
  revalidatePath('/admin/taxas')

  return {
    success: true,
    configuracao: result.data as ConfiguracaoTaxasRow,
  }
}

/**
 * Restaura taxas para valores padrão
 */
export async function restaurarTaxasPadrao() {
  return updateConfiguracaoTaxas({
    ativo: false,
    taxas: TAXAS_PADRAO,
  })
}

/**
 * Ativa ou desativa a calculadora
 */
export async function toggleCalculadora(ativo: boolean) {
  const { configuracao } = await getConfiguracaoTaxas()

  if (!configuracao) {
    return {
      success: false,
      error: 'Configuração não encontrada',
    }
  }

  return updateConfiguracaoTaxas({
    ativo,
    taxas: configuracao.taxas,
  })
}
