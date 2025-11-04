'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { salvarConfigOlx } from '../olx-actions'

export default function OAuthOlxPage() {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [redirectUri, setRedirectUri] = useState('https://leoiphone.com.br/admin/anuncios/oauth-olx')
  const [authCode, setAuthCode] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [step, setStep] = useState(1)
  const [authUrl, setAuthUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [useManualToken, setUseManualToken] = useState(false)
  const [useClientCredentials, setUseClientCredentials] = useState(false)

  async function handleClientCredentialsFlow() {
    if (!clientId || !clientSecret) {
      toast.error('Preencha Client ID e Client Secret')
      return
    }

    setLoading(true)
    
    try {
      console.log('[OAUTH] Tentando fluxo client_credentials via backend...')
      
      // Usar nossa API backend para evitar CORS
      const response = await fetch('/api/olx-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      })

      const data = await response.json()
      
      console.log('[OAUTH] Resposta:', { status: response.status, success: data.success })

      if (!response.ok || !data.success) {
        const errorMsg = data.error || data.message || 'Erro ao obter token'
        
        // Mostrar erro com mais detalhes
        toast.error(`Erro: ${errorMsg}`, { duration: 5000 })
        
        console.error('[OAUTH] Erro completo:', data)
        
        // Mostrar detalhes do erro se disponível
        if (data.details) {
          console.error('[OAUTH] Detalhes:', data.details)
        }
        
        // Mostrar sugestões se disponíveis
        if (data.suggestions) {
          console.log('[OAUTH] Sugestões:', data.suggestions)
          setTimeout(() => {
            data.suggestions.forEach((s: string, i: number) => {
              setTimeout(() => {
                toast.info(s, { duration: 4000 })
              }, i * 1000)
            })
          }, 500)
        }
        
        setLoading(false)
        return
      }

      if (!data.access_token) {
        toast.error('Token não retornado pela API')
        setLoading(false)
        return
      }

      console.log('[OAUTH] ✅ Token obtido com sucesso!')

      // Salvar no banco
      const saveResult = await salvarConfigOlx({
        client_id: clientId,
        client_secret: clientSecret,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: data.expires_in 
          ? new Date(Date.now() + (data.expires_in * 1000)).toISOString()
          : undefined,
        sync_enabled: true,
      })

      if (saveResult.success) {
        toast.success('✅ Token obtido e salvo com sucesso!')
        setStep(3)
      } else {
        toast.error(saveResult.error || 'Erro ao salvar configuração')
      }
    } catch (error: any) {
      console.error('[OAUTH] Erro:', error)
      toast.error('Erro de rede: ' + error.message)
    }
    
    setLoading(false)
  }

  function handleGenerateAuthUrl() {
    if (!clientId || !redirectUri) {
      toast.error('Preencha Client ID e Redirect URI')
      return
    }

    // Gerar URL de autorização
    const scope = 'autoupload'
    const responseType = 'code'
    const state = 'oauth_flow_' + Date.now()
    
    const url = `https://auth.olx.com.br/oauth?client_id=${encodeURIComponent(clientId)}&response_type=${responseType}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    
    setAuthUrl(url)
    setStep(2)
  }

  async function handleExchangeCode() {
    if (!authCode) {
      toast.error('Informe o código de autorização')
      return
    }

    setLoading(true)
    
    try {
      // Trocar código por access token
      const response = await fetch('https://auth.olx.com.br/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: authCode,
          redirect_uri: redirectUri,
        }),
      })

      const data = await response.json()
      
      console.log('Resposta do token:', data)

      if (!response.ok) {
        toast.error(`Erro: ${data.error_description || data.error || 'Erro ao trocar código'}`)
        setLoading(false)
        return
      }

      // Salvar no banco
      const saveResult = await salvarConfigOlx({
        client_id: clientId,
        client_secret: clientSecret,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
        sync_enabled: true,
      })

      if (saveResult.success) {
        toast.success('✅ Token obtido e salvo com sucesso!')
        setStep(3)
      } else {
        toast.error(saveResult.error || 'Erro ao salvar configuração')
      }
    } catch (error: any) {
      console.error('Erro ao trocar código:', error)
      toast.error('Erro de rede: ' + error.message)
    }
    
    setLoading(false)
  }

  async function handleSaveManualToken() {
    if (!manualToken) {
      toast.error('Informe o Access Token')
      return
    }

    setLoading(true)
    
    try {
      // Salvar no banco
      const saveResult = await salvarConfigOlx({
        client_id: clientId || 'manual',
        client_secret: clientSecret || 'manual',
        access_token: manualToken,
        sync_enabled: true,
      })

      if (saveResult.success) {
        toast.success('✅ Token salvo com sucesso!')
        setStep(3)
      } else {
        toast.error(saveResult.error || 'Erro ao salvar configuração')
      }
    } catch (error: any) {
      console.error('Erro ao salvar token:', error)
      toast.error('Erro: ' + error.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurar OAuth OLX</CardTitle>
          <CardDescription>
            Configure a autenticação OAuth2 com a OLX para publicar anúncios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Opções de método */}
          <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <h3 className="font-semibold">Escolha o Método de Autenticação:</h3>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <input
                  type="radio"
                  id="clientCredentials"
                  name="authMethod"
                  checked={useClientCredentials && !useManualToken}
                  onChange={() => {
                    setUseClientCredentials(true)
                    setUseManualToken(false)
                  }}
                  className="mt-1 h-4 w-4"
                />
                <label htmlFor="clientCredentials" className="text-sm">
                  <strong className="text-green-500">✅ Client Credentials (Recomendado)</strong>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Fluxo direto - apenas precisa de Client ID e Secret
                  </p>
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="radio"
                  id="manualToken"
                  name="authMethod"
                  checked={useManualToken}
                  onChange={() => {
                    setUseManualToken(true)
                    setUseClientCredentials(false)
                  }}
                  className="mt-1 h-4 w-4"
                />
                <label htmlFor="manualToken" className="text-sm">
                  <strong>Token Manual</strong>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Cole um token já gerado pelo suporte OLX
                  </p>
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="radio"
                  id="oauthFlow"
                  name="authMethod"
                  checked={!useManualToken && !useClientCredentials}
                  onChange={() => {
                    setUseManualToken(false)
                    setUseClientCredentials(false)
                  }}
                  className="mt-1 h-4 w-4"
                />
                <label htmlFor="oauthFlow" className="text-sm">
                  <strong>OAuth Flow (Browser)</strong>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Fluxo completo com autorização no navegador
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Client Credentials Method */}
          {useClientCredentials && !useManualToken ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🔑 Client Credentials Flow</h3>
              
              <Alert>
                <AlertDescription>
                  Este é o método mais simples e direto. Basta fornecer suas credenciais e o token será gerado automaticamente.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Client ID *</Label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Digite o Client ID da OLX"
                />
              </div>

              <div>
                <Label>Client Secret *</Label>
                <Input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Digite o Client Secret da OLX"
                />
              </div>

              <Button 
                onClick={handleClientCredentialsFlow} 
                disabled={!clientId || !clientSecret || loading}
                className="w-full"
              >
                {loading ? 'Gerando token...' : '🚀 Gerar Token Automaticamente'}
              </Button>

              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertDescription className="text-xs">
                  💡 Se der erro, suas credenciais podem estar inativas. Entre em contato com: <strong>suporteintegrador@olxbr.com</strong>
                </AlertDescription>
              </Alert>
            </div>
          ) : useManualToken ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Inserir Token Manualmente</h3>
              
              <Alert>
                <AlertDescription>
                  Se você já tem um Access Token gerado no portal da OLX, cole-o abaixo.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Access Token *</Label>
                <Input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Cole o Access Token aqui"
                  className="font-mono"
                />
              </div>

              <div>
                <Label>Client ID (opcional)</Label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Client ID"
                />
              </div>

              <div>
                <Label>Client Secret (opcional)</Label>
                <Input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Client Secret"
                />
              </div>

              <Button onClick={handleSaveManualToken} disabled={!manualToken || loading}>
                {loading ? 'Salvando...' : '💾 Salvar Token'}
              </Button>
            </div>
          ) : (
            <>
          {/* Step 1: Informações do App */}
          {step >= 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. Informações da Aplicação</h3>
              
              <div>
                <Label>Client ID *</Label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Digite o Client ID da OLX"
                />
              </div>

              <div>
                <Label>Client Secret *</Label>
                <Input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Digite o Client Secret da OLX"
                />
              </div>

              <div>
                <Label>Redirect URI *</Label>
                <Input
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  placeholder="https://leoiphone.com.br/admin/anuncios/oauth-olx"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Esta URL deve estar cadastrada no portal de desenvolvedores da OLX
                </p>
              </div>

              <Button onClick={handleGenerateAuthUrl} disabled={!clientId || !clientSecret || !redirectUri}>
                Gerar URL de Autorização
              </Button>
            </div>
          )}

          {/* Step 2: Autorizar */}
          {step >= 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. Autorizar Aplicação</h3>
              
              <Alert>
                <AlertDescription>
                  Clique no botão abaixo para abrir a página de autorização da OLX. 
                  Faça login e autorize a aplicação. Depois, copie o código que aparecerá na URL.
                </AlertDescription>
              </Alert>

              <Button onClick={() => window.open(authUrl, '_blank')}>
                🔗 Abrir Página de Autorização da OLX
              </Button>

              <div className="rounded bg-zinc-900 p-3">
                <p className="text-xs font-mono break-all text-zinc-400">{authUrl}</p>
              </div>

              <div>
                <Label>Código de Autorização *</Label>
                <Input
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Cole o código que apareceu na URL após autorizar"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Após autorizar, você será redirecionado para uma URL com o parâmetro <code>?code=...</code>
                </p>
              </div>

              <Button onClick={handleExchangeCode} disabled={!authCode || loading}>
                {loading ? 'Trocando código...' : '🔄 Trocar Código por Token'}
              </Button>
            </div>
          )}

          {/* Step 3: Sucesso */}
          {step >= 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-500">3. ✅ Configuração Concluída!</h3>
              
              <Alert className="border-green-500/50 bg-green-500/10">
                <AlertDescription>
                  Token obtido e salvo com sucesso! Você pode fechar esta página e voltar para a gestão de anúncios.
                </AlertDescription>
              </Alert>

              <Button onClick={() => window.location.href = '/admin/anuncios'}>
                ← Voltar para Anúncios
              </Button>
            </div>
          )}
            </>
          )}

          {/* Instruções */}
          <div className="mt-8 rounded border border-zinc-800 bg-zinc-950 p-4">
            <h4 className="mb-2 font-semibold">📖 Soluções para Erro "oops.olx.com.br":</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <strong className="text-red-500">❌ Problema Comum:</strong>
                <p className="mt-1">
                  O portal de OAuth da OLX (<code>auth.olx.com.br</code>) frequentemente apresenta instabilidade 
                  e redireciona para <code>oops.olx.com.br</code>.
                </p>
              </div>

              <div>
                <strong className="text-green-500">✅ Solução Recomendada:</strong>
                <ol className="ml-4 mt-1 list-decimal space-y-2">
                  <li>
                    Use o método <strong>Client Credentials</strong> (primeira opção acima)
                    <ul className="ml-4 mt-1 list-disc">
                      <li>Mais rápido e direto</li>
                      <li>Não depende do portal web da OLX</li>
                      <li>Token gerado via API</li>
                    </ul>
                  </li>
                  <li>
                    Se suas credenciais estiverem inativas, entre em contato com:
                    <div className="mt-1 rounded bg-black p-2">
                      <code className="text-xs text-blue-400">suporteintegrador@olxbr.com</code>
                    </div>
                  </li>
                  <li>
                    Ou gere um token via cURL:
                    <div className="mt-2 rounded bg-black p-2">
                      <code className="text-xs">
                        curl -X POST https://auth.olx.com.br/oauth/token \<br/>
                        &nbsp;&nbsp;-d "grant_type=client_credentials" \<br/>
                        &nbsp;&nbsp;-d "client_id=SEU_CLIENT_ID" \<br/>
                        &nbsp;&nbsp;-d "client_secret=SEU_CLIENT_SECRET" \<br/>
                        &nbsp;&nbsp;-d "scope=autoupload"
                      </code>
                    </div>
                    <p className="mt-1 text-xs">Depois cole o <code>access_token</code> retornado usando o método "Token Manual"</p>
                  </li>
                </ol>
              </div>

              <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3">
                <strong className="text-yellow-500">⚠️ Importante:</strong>
                <ul className="ml-4 mt-1 list-disc space-y-1">
                  <li>Tokens da OLX geralmente expiram em 30-60 dias</li>
                  <li>Guarde suas credenciais em local seguro</li>
                  <li>Não compartilhe seu Client Secret</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
