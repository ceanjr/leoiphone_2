import { createClient } from '@/lib/supabase/server'

/**
 * Diagnóstico completo da API do Facebook Marketplace
 */
export async function diagnosticarFacebookAPI() {
  const diagnostico = {
    timestamp: new Date().toISOString(),
    config: {
      hasAccessToken: false,
      hasAppId: false,
      hasAppSecret: false,
      hasCatalogId: false,
      syncEnabled: false,
      tokenExpired: false,
      daysUntilExpiry: null as number | null,
    },
    permissions: [] as string[],
    errors: [] as string[],
    warnings: [] as string[],
    recommendations: [] as string[],
  }

  try {
    const supabase = await createClient()

    // 1. Verificar configuração
    const { data: config, error: configError } = await (
      supabase.from('facebook_config') as any
    )
      .select('*')
      .single()

    if (configError || !config) {
      diagnostico.errors.push('Configuração do Facebook não encontrada')
      diagnostico.recommendations.push(
        'Configure o Facebook em admin/anuncios > Configurações'
      )
      return diagnostico
    }

    // 2. Verificar campos obrigatórios
    diagnostico.config.hasAccessToken = !!config.access_token
    diagnostico.config.hasAppId = !!config.app_id
    diagnostico.config.hasAppSecret = !!config.app_secret
    diagnostico.config.hasCatalogId = !!config.catalog_id
    diagnostico.config.syncEnabled = config.sync_enabled

    if (!config.access_token) {
      diagnostico.errors.push('Access Token não configurado')
      diagnostico.recommendations.push('Adicione o Access Token nas configurações')
    }

    if (!config.catalog_id) {
      diagnostico.errors.push('Catalog ID não configurado')
      diagnostico.recommendations.push('Adicione o Catalog ID nas configurações')
    }

    // 3. Verificar expiração do token
    if (config.token_expires_at) {
      const expiryDate = new Date(config.token_expires_at)
      const now = new Date()
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      diagnostico.config.daysUntilExpiry = daysUntilExpiry
      diagnostico.config.tokenExpired = daysUntilExpiry <= 0

      if (daysUntilExpiry <= 0) {
        diagnostico.errors.push('Token de acesso EXPIRADO')
        diagnostico.recommendations.push('Gere um novo token de acesso')
      } else if (daysUntilExpiry <= 7) {
        diagnostico.warnings.push(`Token expira em ${daysUntilExpiry} dias`)
        diagnostico.recommendations.push('Renove o token em breve')
      }
    }

    // 4. Testar conexão com API (se possível)
    if (config.access_token && config.catalog_id) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${config.catalog_id}?access_token=${config.access_token}&fields=id,name`
        )

        const data = await response.json()

        if (data.error) {
          diagnostico.errors.push(`API Error: ${data.error.message}`)

          // Analisar erro específico
          if (data.error.code === 190) {
            diagnostico.errors.push('Token inválido ou expirado')
            diagnostico.recommendations.push('Gere um novo token de acesso')
          } else if (data.error.code === 10) {
            diagnostico.errors.push('Sem permissão para acessar o catálogo')
            diagnostico.recommendations.push(
              'Verifique as permissões do App no Facebook Business'
            )
          } else if (data.error.code === 200) {
            diagnostico.errors.push('Sem permissão para a operação')
            diagnostico.recommendations.push(
              'Adicione a permissão "catalog_management" ao token'
            )
          }
        } else {
          diagnostico.warnings.push('✅ Conexão com API funcionando')
          diagnostico.warnings.push(`Catálogo: ${data.name || data.id}`)
        }
      } catch (error: any) {
        diagnostico.errors.push(`Erro ao testar API: ${error.message}`)
      }
    }

    // 5. Verificar permissões necessárias
    const permissoesNecessarias = [
      'catalog_management',
      'business_management',
      'pages_show_list',
      'pages_read_engagement',
    ]

    diagnostico.recommendations.push(
      'Certifique-se que o token tem as permissões:',
      ...permissoesNecessarias.map((p) => `  - ${p}`)
    )

    // 6. Verificar endpoints
    if (!diagnostico.config.tokenExpired && config.access_token) {
      diagnostico.warnings.push(
        '📍 Endpoint correto: /{catalog_id}/items_batch'
      )
      diagnostico.warnings.push('📍 item_type: PRODUCT_ITEM')
      diagnostico.warnings.push('📍 method: CREATE')
    }

    return diagnostico
  } catch (error: any) {
    diagnostico.errors.push(`Erro ao diagnosticar: ${error.message}`)
    return diagnostico
  }
}

/**
 * Guia de solução de problemas
 */
export const TROUBLESHOOTING_GUIDE = {
  'API access blocked': {
    causas: [
      'Token de acesso expirado',
      'Token sem permissões corretas',
      'App não tem acesso ao catálogo',
      'Catálogo ID incorreto',
      'Restrições da API',
    ],
    solucoes: [
      '1. Gerar novo token de acesso (60 dias)',
      '2. Verificar permissões: catalog_management, business_management',
      '3. Confirmar que o App tem acesso ao Commerce Manager',
      '4. Verificar Catalog ID nas configurações',
      '5. Usar API correta: Marketplace Partner Item API',
    ],
  },
  'Invalid OAuth 2.0 Access Token': {
    causas: ['Token inválido', 'Token expirado', 'Token revogado'],
    solucoes: [
      '1. Gerar novo token no Facebook Developers',
      '2. Copiar token completo (começa com EAA...)',
      '3. Colar nas configurações de admin/anuncios',
      '4. Salvar configuração',
    ],
  },
  'Permissions error': {
    causas: ['App sem permissões', 'Token sem escopo correto'],
    solucoes: [
      '1. Ir em Facebook App Settings',
      '2. Adicionar permissões: catalog_management',
      '3. Gerar novo token com permissões',
      '4. Atualizar configuração',
    ],
  },
}
