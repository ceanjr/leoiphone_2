# Integração OLX - Guia Rápido de Uso

## 🚀 Setup Inicial (5 minutos)

### 1. Criar Tabelas no Banco de Dados

```bash
# No Supabase Dashboard (https://supabase.com)
# 1. Acesse seu projeto
# 2. Vá em "SQL Editor"
# 3. Cole e execute o conteúdo de:
supabase/migrations/create_olx_tables.sql
```

Ou via CLI do Supabase:
```bash
supabase db push
```

### 2. Obter Credenciais da OLX

1. **Envie email para**: suporteintegrador@olxbr.com
2. **Informe**:
   - Nome da empresa: Leo iPhone
   - Site: https://leoiphone.com.br
   - Descrição: Loja de iPhones seminovos
   - Contato: seu-email@dominio.com
   - Redirect URI: https://leoiphone.com.br/admin/anuncios

3. **Aguarde receber** (1-3 dias):
   - Client ID
   - Client Secret

### 3. Obter Access Token

**Opção A: OAuth Flow Manual** (recomendado)

```bash
# 1. Abra no navegador (substitua SEU_CLIENT_ID):
https://auth.olx.com.br/oauth/authorize?response_type=code&client_id=SEU_CLIENT_ID&redirect_uri=https://leoiphone.com.br/admin/anuncios&scope=basic%20ads

# 2. Autorize a aplicação
# 3. Copie o "code" da URL de retorno
# 4. Execute:

curl -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=CODIGO_COPIADO" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "redirect_uri=https://leoiphone.com.br/admin/anuncios"

# 5. Copie o "access_token" da resposta
```

**Opção B: Pedir ao suporte da OLX** (mais fácil)

Peça diretamente um access token de longa duração ao suporte.

### 4. Configurar no Sistema

1. Acesse: `https://leoiphone.com.br/admin/anuncios`
2. Clique na tab **"OLX"**
3. Clique em **"Configurar"**
4. Preencha:
   - **Client ID**: (recebido por email)
   - **Client Secret**: (recebido por email)
   - **Access Token**: (obtido no passo 3)
5. Ative **"Ativar sincronização"**
6. Clique em **"Testar Conexão"** ✅
7. **Salvar**

## 📱 Criando Seu Primeiro Anúncio

### Via Interface

1. Na tab OLX, clique em **"Novo Anúncio"**
2. Selecione um produto da lista
3. (Opcional) Customize:
   - Título: "iPhone 13 Pro Max 256GB Azul Sierra"
   - Descrição: Adicione detalhes extras
   - Categoria: "Celulares e Telefones"
4. Clique em **"Criar Anúncio"**
5. Aguarde confirmação ✅

### Via Código (Server Action)

```typescript
import { criarAnuncioOlx } from '@/app/admin/anuncios/olx-actions'

const resultado = await criarAnuncioOlx({
  produto_id: 'uuid-do-produto',
  titulo: 'iPhone 13 Pro Max 256GB', // Opcional
  descricao: 'Seminovo em perfeito estado', // Opcional
  categoria_olx: '23', // 23 = Celulares
})

if (resultado.success) {
  console.log('✅ Anúncio criado:', resultado.data)
} else {
  console.error('❌ Erro:', resultado.error)
}
```

## 🛠️ Operações Comuns

### Listar Anúncios

```typescript
import { listarAnunciosOlx } from '@/app/admin/anuncios/olx-actions'

const resultado = await listarAnunciosOlx()
console.log(resultado.data) // Array de anúncios
```

### Atualizar Anúncio

```typescript
import { atualizarAnuncioOlx } from '@/app/admin/anuncios/olx-actions'

await atualizarAnuncioOlx({
  anuncio_id: 'uuid-do-anuncio',
  titulo: 'Novo título aqui',
  preco: 4500.00,
})
```

### Remover Anúncio

```typescript
import { removerAnuncioOlx } from '@/app/admin/anuncios/olx-actions'

// Remove da OLX e do banco
await removerAnuncioOlx('uuid-do-anuncio')

// Ou apenas do banco (forçar local)
await removerAnuncioOlx('uuid-do-anuncio', true)
```

### Testar Conexão

```typescript
import { testarConexaoOlx } from '@/app/admin/anuncios/olx-actions'

const resultado = await testarConexaoOlx()
if (resultado.success) {
  console.log('✅ Conectado!', resultado.data)
} else {
  console.log('❌ Erro:', resultado.error)
}
```

## 🏷️ Categorias OLX

Use estes IDs de categoria ao criar anúncios:

```typescript
const CATEGORIAS = {
  CELULARES: '23',        // Smartphones
  TABLETS: '4161',        // iPads
  ACESSORIOS: '93',       // Capas, fones, etc
  ELETRONICOS: '1020',    // Outros eletrônicos
}
```

## 📊 Monitoramento

### Verificar Status dos Anúncios

```sql
-- Ver anúncios com erro
SELECT produto_nome, erro_mensagem, created_at
FROM v_olx_anuncios_com_produto
WHERE status = 'erro'
ORDER BY created_at DESC;

-- Estatísticas
SELECT 
  status, 
  COUNT(*) as total
FROM olx_anuncios
GROUP BY status;
```

### Ver Logs de Sincronização

```sql
-- Últimos 10 logs
SELECT 
  acao,
  status,
  mensagem,
  created_at
FROM olx_sync_log
ORDER BY created_at DESC
LIMIT 10;

-- Logs de erro das últimas 24h
SELECT *
FROM olx_sync_log
WHERE status = 'erro'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🐛 Resolução de Problemas

### Erro: "Token inválido ou expirado"

**Solução:**
1. Obtenha novo access token (use refresh token ou OAuth flow)
2. Atualize nas configurações
3. Teste conexão novamente

### Erro: "Cliente OLX não configurado"

**Solução:**
1. Verifique se a configuração foi salva
2. Verifique se "Ativar sincronização" está marcado
3. Teste a conexão

### Anúncio criado mas não aparece na OLX

**Possíveis causas:**
- OLX está analisando o anúncio (pode demorar algumas horas)
- Produto não atende políticas da OLX
- Categoria errada

**Ação:**
1. Aguarde 2-4 horas
2. Verifique email do OLX por notificações
3. Consulte logs: `SELECT * FROM olx_sync_log WHERE anuncio_id = 'uuid'`

### Erro de conexão (NETWORK_ERROR)

**Solução:**
1. Verifique conexão com internet
2. Verifique se URL da API está correta: `https://api.olx.com.br`
3. Tente novamente após alguns minutos

### Rate Limit (Código 429)

**Solução:**
- OLX limita requisições (ex: 100 por hora)
- Aguarde antes de tentar novamente
- Implemente um sistema de fila se precisar criar muitos anúncios

## 📋 Checklist de Validação

Antes de colocar em produção:

- [ ] Tabelas criadas no Supabase
- [ ] Credenciais OAuth configuradas
- [ ] Teste de conexão OK
- [ ] Criou anúncio de teste com sucesso
- [ ] Anúncio apareceu na OLX
- [ ] Testou atualização de anúncio
- [ ] Testou remoção de anúncio
- [ ] Monitorou logs por 24h
- [ ] Documentou processo para equipe

## 🔗 Links Úteis

- **Documentação Completa**: `/docs/OLX_INTEGRATION.md`
- **API OLX**: https://developers.olx.com.br
- **Suporte OLX**: suporteintegrador@olxbr.com
- **Painel Admin**: `/admin/anuncios`

## 💡 Dicas

1. **Títulos**: Máximo 70 caracteres, seja direto
2. **Descrições**: Inclua specs (armazenamento, bateria, cor)
3. **Imagens**: Primeira imagem é a capa, use fotos de qualidade
4. **Preço**: Seja competitivo, OLX é muito sensível a preço
5. **Categorias**: Use a categoria correta para mais visibilidade
6. **Renovação**: OLX pode exigir renovação periódica (verifique)

## 🎯 Melhores Práticas

1. **Batch**: Evite criar muitos anúncios de uma vez (rate limit)
2. **Horários**: Publique em horários de pico (18h-21h)
3. **Atualizações**: Atualize preços regularmente
4. **Monitoramento**: Verifique logs diariamente
5. **Backup**: Sempre tenha backup das credenciais OAuth

---

**Pronto para começar?** 🚀

1. Execute a migration SQL
2. Configure suas credenciais
3. Crie seu primeiro anúncio!

**Precisando de ajuda?** Consulte `/docs/OLX_INTEGRATION.md` para documentação detalhada.
