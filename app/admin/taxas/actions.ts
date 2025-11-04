'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  configuracaoTaxasSchema,
  TAXAS_PADRAO,
  presetTaxasSchema,
  type ConfiguracaoTaxas,
  type TaxasConfig,
  type PresetTaxas,
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
  const { data: existing } = await (supabase as any)
    .from('configuracoes_taxas')
    .select('id')
    .limit(1)
    .single()

  let result

  if (existing) {
    // Atualizar existente
    const { data, error } = await (supabase as any)
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
    const { data, error } = await (supabase as any)
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

// ========================================
// PRESETS DE TAXAS
// ========================================

/**
 * Busca todos os presets de taxas
 */
export async function getPresets() {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('presets_taxas')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar presets:', error)
    return {
      presets: [],
      error: 'Erro ao carregar presets',
    }
  }

  return {
    presets: data as PresetTaxas[],
    error: null,
  }
}

/**
 * Cria um novo preset
 */
export async function createPreset(preset: Omit<PresetTaxas, 'id'>) {
  const supabase = await createClient()

  // Validar dados
  const validated = presetTaxasSchema.omit({ id: true }).safeParse(preset)

  if (!validated.success) {
    const firstError = validated.error.issues[0]?.message
    return {
      success: false,
      error: firstError || 'Dados inválidos',
    }
  }

  // Se for preset padrão, remover is_default dos outros
  if (validated.data.is_default) {
    await (supabase as any)
      .from('presets_taxas')
      .update({ is_default: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Atualizar todos
  }

  const { data, error } = await (supabase as any)
    .from('presets_taxas')
    .insert(validated.data)
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar preset:', error)
    return {
      success: false,
      error: error.message || 'Erro ao criar preset',
    }
  }

  revalidatePath('/admin/taxas')

  return {
    success: true,
    preset: data as PresetTaxas,
  }
}

/**
 * Atualiza um preset existente
 */
export async function updatePreset(id: string, preset: Partial<PresetTaxas>) {
  const supabase = await createClient()

  // Se for preset padrão, remover is_default dos outros
  if (preset.is_default) {
    await (supabase as any)
      .from('presets_taxas')
      .update({ is_default: false })
      .neq('id', id)
  }

  const { data, error } = await (supabase as any)
    .from('presets_taxas')
    .update(preset)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar preset:', error)
    return {
      success: false,
      error: error.message || 'Erro ao atualizar preset',
    }
  }

  revalidatePath('/admin/taxas')

  return {
    success: true,
    preset: data as PresetTaxas,
  }
}

/**
 * Deleta um preset
 */
export async function deletePreset(id: string) {
  const supabase = await createClient()

  const { error } = await (supabase as any).from('presets_taxas').delete().eq('id', id)

  if (error) {
    console.error('Erro ao deletar preset:', error)
    return {
      success: false,
      error: error.message || 'Erro ao deletar preset',
    }
  }

  revalidatePath('/admin/taxas')

  return {
    success: true,
  }
}

/**
 * Aplica um preset às taxas atuais
 */
export async function applyPreset(presetId: string) {
  const supabase = await createClient()

  // Buscar o preset
  const { data: preset, error: presetError } = await (supabase as any)
    .from('presets_taxas')
    .select('*')
    .eq('id', presetId)
    .single()

  if (presetError || !preset) {
    return {
      success: false,
      error: 'Preset não encontrado',
    }
  }

  // Buscar configuração atual
  const { configuracao } = await getConfiguracaoTaxas()

  // Aplicar taxas do preset
  return updateConfiguracaoTaxas({
    ativo: configuracao?.ativo ?? false,
    taxas: preset.taxas,
  })
}
