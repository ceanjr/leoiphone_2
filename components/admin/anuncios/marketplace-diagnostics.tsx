'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, HelpCircle, ExternalLink, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { diagnosticarFacebook } from '@/app/admin/anuncios/actions'
import { toast } from 'sonner'

export function MarketplaceDiagnostics() {
  const [diagnosticando, setDiagnosticando] = useState(false)
  const [diagnostico, setDiagnostico] = useState<any>(null)

  async function handleDiagnosticar() {
    setDiagnosticando(true)
    const result = await diagnosticarFacebook()
    setDiagnosticando(false)

    if (result.success && result.data) {
      setDiagnostico(result.data)
      if (result.data.errors.length === 0) {
        toast.success('Configuração está OK!')
      } else {
        toast.error('Encontrados problemas na configuração')
      }
    } else {
      toast.error('Erro ao diagnosticar')
    }
  }

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              Produtos não aparecem no Marketplace?
            </CardTitle>
            <CardDescription className="mt-2">
              Siga este checklist para diagnosticar o problema
            </CardDescription>
          </div>
          <Button
            onClick={handleDiagnosticar}
            disabled={diagnosticando}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            <Activity className="mr-2 h-4 w-4" />
            {diagnosticando ? 'Diagnosticando...' : 'Diagnosticar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resultado do Diagnóstico */}
        {diagnostico && (
          <Alert className={diagnostico.errors.length > 0 ? 'border-red-500/50' : 'border-green-500/50'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Resultado do Diagnóstico</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              {/* Configuração */}
              <div className="space-y-1">
                <p className="font-semibold">Configuração:</p>
                <ul className="space-y-1 text-sm">
                  <li className={diagnostico.config.hasAccessToken ? 'text-green-600' : 'text-red-600'}>
                    {diagnostico.config.hasAccessToken ? '✓' : '✗'} Access Token
                  </li>
                  <li className={diagnostico.config.hasCatalogId ? 'text-green-600' : 'text-red-600'}>
                    {diagnostico.config.hasCatalogId ? '✓' : '✗'} Catalog ID
                  </li>
                  {diagnostico.config.daysUntilExpiry !== null && (
                    <li className={diagnostico.config.tokenExpired ? 'text-red-600' : 'text-green-600'}>
                      {diagnostico.config.tokenExpired ? '✗' : '✓'} Token expira em{' '}
                      {diagnostico.config.daysUntilExpiry} dias
                    </li>
                  )}
                </ul>
              </div>

              {/* Erros */}
              {diagnostico.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="font-semibold text-red-600">Erros:</p>
                  <ul className="list-disc pl-5 text-sm text-red-600">
                    {diagnostico.errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Avisos */}
              {diagnostico.warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="font-semibold">Avisos:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {diagnostico.warnings.map((warning: string, i: number) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendações */}
              {diagnostico.recommendations.length > 0 && (
                <div className="space-y-1">
                  <p className="font-semibold">Recomendações:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {diagnostico.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Checklist */}
        <div className="space-y-3">
          <ChecklistItem
            title="1. Catálogo conectado ao Marketplace"
            description="Verifique se seu catálogo está configurado para o Marketplace"
            link="https://business.facebook.com/commerce_manager"
            linkText="Abrir Commerce Manager"
            instructions={[
              'Vá em Commerce Manager > Catálogos',
              'Clique no seu catálogo',
              'Em "Configurações" > "Vendas"',
              'Certifique-se que "Facebook Marketplace" está ATIVADO',
            ]}
          />

          <ChecklistItem
            title="2. Produto publicado (não em rascunho)"
            description="Produtos em rascunho não aparecem no Marketplace"
            instructions={[
              'Abra o produto no Commerce Manager',
              'Verifique se o status é "Ativo" ou "Active"',
              'Se estiver "Draft", clique em "Publish"',
            ]}
          />

          <ChecklistItem
            title="3. Disponibilidade configurada"
            description='Produto deve estar marcado como "In Stock"'
            instructions={[
              'No produto, verifique o campo "availability"',
              'Deve estar "in stock" (não "out of stock")',
              'Nosso sistema já envia correto, mas verifique no Facebook',
            ]}
          />

          <ChecklistItem
            title="4. Campos obrigatórios preenchidos"
            description="Facebook exige campos mínimos"
            instructions={[
              '✓ Título (title)',
              '✓ Descrição (description)',
              '✓ Preço (price)',
              '✓ Imagem (image_link)',
              '✓ Disponibilidade (availability)',
              '✓ Condição (condition)',
            ]}
          />

          <ChecklistItem
            title="5. Aguardar aprovação (24-48h)"
            description="Facebook analisa produtos novos antes de publicar"
            instructions={[
              'Produtos novos ficam "Em análise"',
              'Pode levar de 24 a 48 horas',
              'Verifique na coluna "Status Marketplace" da tabela',
              'Se rejeitado, o motivo aparecerá no Commerce Manager',
            ]}
          />

          <ChecklistItem
            title="6. Políticas do Marketplace"
            description="Produto deve seguir as políticas do Facebook"
            link="https://www.facebook.com/policies/commerce"
            linkText="Ver Políticas"
            instructions={[
              '✓ Sem itens proibidos',
              '✓ Imagens de qualidade',
              '✓ Descrição honesta',
              '✓ Preço justo',
            ]}
          />
        </div>

        {/* Dicas rápidas */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dicas para aprovação rápida</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Use imagens de alta qualidade (mínimo 500x500px)</li>
              <li>• Preencha descrição detalhada</li>
              <li>• Preço deve estar em linha com o mercado</li>
              <li>• Evite palavras suspeitas (réplica, falsificado, etc)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Status esperado */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h4 className="mb-3 font-semibold">Status esperados:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-zinc-400">Pendente/Em análise</span>
              <span className="text-zinc-500">→ Aguardando aprovação (24-48h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-zinc-400">No Marketplace</span>
              <span className="text-zinc-500">→ Produto aprovado e público ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-zinc-400">Erro</span>
              <span className="text-zinc-500">→ Verificar motivo no Commerce Manager</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ChecklistItemProps {
  title: string
  description: string
  link?: string
  linkText?: string
  instructions: string[]
}

function ChecklistItem({ title, description, link, linkText, instructions }: ChecklistItemProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-white">{title}</h4>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
        {link && (
          <Button variant="ghost" size="sm" asChild>
            <a href={link} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
        {instructions.map((instruction, index) => (
          <li key={index} className="flex items-start gap-2">
            {instruction.startsWith('✓') ? (
              <>
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                <span>{instruction.substring(1).trim()}</span>
              </>
            ) : (
              <>
                <span className="text-zinc-500">•</span>
                <span>{instruction}</span>
              </>
            )}
          </li>
        ))}
      </ul>

      {link && linkText && (
        <Button variant="link" size="sm" asChild className="mt-2 h-auto p-0 text-blue-400">
          <a href={link} target="_blank" rel="noopener noreferrer">
            {linkText} <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      )}
    </div>
  )
}
