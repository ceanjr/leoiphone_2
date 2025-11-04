# Integração com OLX Brasil - Documentação

## 📋 Visão Geral

Este documento explica como configurar e usar a integração com a API da OLX Brasil para publicação automática de anúncios de produtos.

## 🔑 Obtendo Credenciais da OLX

### 1. Registro da Aplicação

Para usar a API da OLX, você precisa registrar sua aplicação e obter credenciais OAuth2.

**Passos:**

1. Entre em contato com OLX pelo email: **suporteintegrador@olxbr.com**
2. Envie as seguintes informações:
   - Nome do cliente
   - Nome da aplicação
   - Descrição do projeto
   - Website/URL da aplicação
   - Telefone de contato
   - Email de contato
   - URLs de redirecionamento OAuth (redirect URIs)

3. Aguarde aprovação (geralmente 1-3 dias úteis)
4. Você receberá:
   - **Client ID** - Identificador da sua aplicação
   - **Client Secret** - Senha secreta da aplicação

### 2. Obtendo Access Token (OAuth 2.0)

#### Método 1: Flow OAuth Completo (Recomendado)

```bash
# 1. Redirecionar usuário para autorização
https://auth.olx.com.br/oauth/authorize?
  response_type=code&
  client_id=SEU_CLIENT_ID&
  redirect_uri=SUA_REDIRECT_URI&
  scope=basic%20ads

# 2. Após autorização, OLX redireciona com o código
https://sua-redirect-uri.com/callback?code=CODIGO_TEMPORARIO

# 3. Trocar código por access token
curl -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=CODIGO_TEMPORARIO" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "redirect_uri=SUA_REDIRECT_URI"

# Resposta:
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### Método 2: Refresh Token

Use o refresh token para obter um novo access token quando expirar:

```bash
curl -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=SEU_REFRESH_TOKEN" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET"
```

## ⚙️ Configuração no Sistema

### 1. Executar Migração do Banco de Dados

```bash
# Aplicar a migration SQL no Supabase
psql -h SEU_HOST -U postgres -d postgres < supabase/migrations/create_olx_tables.sql

# Ou via Supabase Dashboard:
# 1. Acesse o Supabase Dashboard
# 2. Vá em SQL Editor
# 3. Cole o conteúdo de create_olx_tables.sql
# 4. Execute
```

### 2. Configurar no Painel Admin

1. Acesse: `/admin/anuncios`
2. Clique na tab **OLX**
3. Clique em **Configurar**
4. Preencha os campos:
   - **Client ID**: Seu Client ID da OLX
   - **Client Secret**: Seu Client Secret da OLX
   - **Access Token**: Token OAuth2 obtido
5. Ative o switch **Ativar sincronização**
6. Clique em **Testar Conexão** para verificar
7. Salve a configuração

## 📝 Criando Anúncios

### Pelo Painel Admin

1. Na tab **OLX**, clique em **Novo Anúncio**
2. Selecione o produto da lista
3. (Opcional) Personalize:
   - Título (máx 70 caracteres)
   - Descrição
   - Categoria OLX
4. Clique em **Criar Anúncio**

### Programaticamente

```typescript
import { criarAnuncioOlx } from '@/app/admin/anuncios/olx-actions'

const resultado = await criarAnuncioOlx({
  produto_id: 'uuid-do-produto',
  titulo: 'iPhone 13 Pro Max 256GB Seminovo',
  descricao: 'iPhone em perfeito estado, bateria 95%',
  categoria_olx: '23', // Celulares
})

if (resultado.success) {
  console.log('Anúncio criado:', resultado.data)
} else {
  console.error('Erro:', resultado.error)
}
```

## 🏷️ Categorias OLX

As categorias mais usadas para produtos iPhone:

| Categoria | ID | Descrição |
|-----------|-----|-----------|
| Celulares e Telefones | 23 | Smartphones em geral |
| Tablets | 4161 | iPads e tablets |
| Acessórios para Celular | 93 | Capas, fones, carregadores |
| Eletrônicos | 1020 | Outros eletrônicos |

Para ver todas as categorias disponíveis, use:

```typescript
import { buscarCategoriasOlx } from '@/app/admin/anuncios/olx-actions'

const resultado = await buscarCategoriasOlx()
console.log(resultado.data)
```

## 📊 Estrutura de Dados

### Produto → Anúncio OLX

O sistema converte automaticamente os produtos para o formato OLX:

```typescript
// Produto do sistema
{
  nome: "iPhone 13 Pro Max 256GB Azul Sierra",
  preco: 4999.00,
  condicao: "seminovo",
  nivel_bateria: 95,
  armazenamento: "256GB",
  cor: "Azul Sierra",
  fotos: ["url1.jpg", "url2.jpg", "url3.jpg"]
}

// Anúncio OLX
{
  subject: "iPhone 13 Pro Max 256GB Azul Sierra",
  body: "iPhone 13 Pro Max em excelente estado...",
  category: 23,
  type: "s", // venda
  price: {
    value: 499900, // centavos
    currency: "BRL"
  },
  location: {
    address: {
      city: "São Paulo",
      state: "SP"
    }
  },
  images: ["url1.jpg", "url2.jpg", "url3.jpg"]
}
```

## 🔄 Gerenciamento de Anúncios

### Atualizar Anúncio

```typescript
import { atualizarAnuncioOlx } from '@/app/admin/anuncios/olx-actions'

await atualizarAnuncioOlx({
  anuncio_id: 'uuid-do-anuncio',
  titulo: 'Novo título',
  preco: 4799.00,
})
```

### Remover Anúncio

```typescript
import { removerAnuncioOlx } from '@/app/admin/anuncios/olx-actions'

// Remove da OLX e do banco local
await removerAnuncioOlx('uuid-do-anuncio')

// Remove apenas do banco local (forçar)
await removerAnuncioOlx('uuid-do-anuncio', true)
```

### Listar Anúncios

```typescript
import { listarAnunciosOlx } from '@/app/admin/anuncios/olx-actions'

const resultado = await listarAnunciosOlx()
console.log(resultado.data) // Array de anúncios com dados do produto
```

## 🐛 Tratamento de Erros

### Erros Comuns

| Erro | Código | Solução |
|------|--------|---------|
| Token inválido/expirado | 401 | Gere novo access token |
| Sem permissão | 403 | Verifique scopes do token |
| Categoria inválida | 400 | Use ID de categoria válido |
| Limite de rate | 429 | Aguarde e tente novamente |
| Erro de rede | NETWORK_ERROR | Verifique conexão |

### Logs

Todos os erros são salvos na tabela `olx_sync_log`:

```sql
SELECT * FROM olx_sync_log 
WHERE status = 'erro' 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📈 Monitoramento

### View de Anúncios

Use a view `v_olx_anuncios_com_produto` para ver anúncios com dados completos:

```sql
SELECT 
  produto_nome,
  preco,
  status,
  erro_mensagem,
  sincronizado_em
FROM v_olx_anuncios_com_produto
WHERE status = 'erro'
ORDER BY created_at DESC;
```

### Estatísticas

```sql
-- Total por status
SELECT status, COUNT(*) as total
FROM olx_anuncios
GROUP BY status;

-- Taxa de sucesso (últimas 24h)
SELECT 
  COUNT(CASE WHEN status = 'sucesso' THEN 1 END)::float / COUNT(*) * 100 as taxa_sucesso
FROM olx_sync_log
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

## 🔐 Segurança

### Armazenamento de Tokens

- Tokens são armazenados criptografados no Supabase
- Nunca exponha tokens em logs ou código cliente
- Use variáveis de ambiente em produção

### RLS (Row Level Security)

Para ativar RLS nas tabelas OLX, descomente no arquivo SQL:

```sql
ALTER TABLE olx_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso olx_config" ON olx_config FOR ALL 
USING (auth.role() = 'authenticated');
```

## 📚 Referências

- [OLX Brasil - Documentação API](https://developers.olx.com.br/anuncio/api/home.html)
- [OAuth 2.0 - OLX](https://developers.olx.com.br/anuncio/api/oauth.html)
- [OLX Group Developer Hub](https://developer.olxgroup.com/docs/api-reference)

## 🆘 Suporte

Para problemas com a API da OLX:
- Email: suporteintegrador@olxbr.com
- Documentação: https://developers.olx.com.br

Para problemas com esta integração:
- Verifique os logs em `olx_sync_log`
- Teste a conexão no painel de configuração
- Revise as credenciais OAuth

## ✅ Checklist de Implementação

- [x] Criar tipos TypeScript (`types/olx.ts`)
- [x] Criar cliente da API (`lib/olx/api-client.ts`)
- [x] Criar tabelas no Supabase (`supabase/migrations/create_olx_tables.sql`)
- [x] Implementar server actions (`app/admin/anuncios/olx-actions.ts`)
- [x] Criar componente OlxManager (`components/admin/anuncios/olx-manager.tsx`)
- [x] Atualizar página com tabs (`app/admin/anuncios/page.tsx`)
- [x] Documentação completa

## 🚀 Próximos Passos

1. Executar migration SQL no Supabase
2. Obter credenciais OAuth da OLX
3. Configurar no painel admin
4. Testar criação de anúncio
5. Monitorar logs e ajustar conforme necessário
