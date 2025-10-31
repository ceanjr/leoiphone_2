# 📘 Guia Completo: Integração com Facebook Marketplace

> **Sistema implementado:** Automação de anúncios no Facebook Marketplace via Commerce API
> **Data:** 30 de Outubro de 2025

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo 1: Criar App no Facebook Developers](#passo-1-criar-app-no-facebook-developers)
4. [Passo 2: Configurar Facebook Business Manager](#passo-2-configurar-facebook-business-manager)
5. [Passo 3: Criar Catálogo de Produtos](#passo-3-criar-catálogo-de-produtos)
6. [Passo 4: Gerar Access Token](#passo-4-gerar-access-token)
7. [Passo 5: Configurar no Sistema](#passo-5-configurar-no-sistema)
8. [Passo 6: Executar Migration](#passo-6-executar-migration)
9. [Como Usar](#como-usar)
10. [Troubleshooting](#troubleshooting)
11. [Limitações e Considerações](#limitações-e-considerações)

---

## Visão Geral

Este sistema permite **automatizar a criação e gerenciamento de anúncios no Facebook Marketplace** diretamente pelo painel admin do site.

### O que o sistema faz:

✅ Criar anúncios de produtos no Facebook Marketplace
✅ Atualizar preço e disponibilidade automaticamente
✅ Remover anúncios quando produto é desativado
✅ Rastrear status de cada anúncio (anunciado, erro, pausado)
✅ Log completo de todas as operações

### O que o sistema NÃO faz:

❌ Responder mensagens de clientes automaticamente
❌ Processar pedidos pelo Facebook
❌ Gerenciar avaliações/reviews do Facebook

---

## Pré-requisitos

Antes de começar, você precisará ter:

- [ ] **Conta no Facebook** (pessoal)
- [ ] **Página do Facebook** para sua loja (ex: "Léo iPhone")
- [ ] **Facebook Business Manager** (gratuito)
- [ ] **Acesso ao código-fonte** do projeto (para executar migration)
- [ ] **Acesso admin** ao painel do sistema

---

## Passo 1: Criar App no Facebook Developers

### 1.1 Acessar Facebook Developers

1. Acesse: **https://developers.facebook.com**
2. Faça login com sua conta do Facebook
3. No menu superior, clique em **"Meus Apps"**
4. Clique em **"Criar App"**

### 1.2 Configurar o App

1. **Tipo de App:** Selecione "Nenhum" ou "Empresarial"
2. **Nome do App:** Digite "Léo iPhone Marketplace" (ou nome similar)
3. **Email de Contato:** Seu email profissional
4. **Conta Comercial:** Selecione sua conta do Business Manager
5. Clique em **"Criar App"**

### 1.3 Adicionar Produto Commerce

1. No dashboard do app, procure por **"Commerce"**
2. Clique em **"Configurar"** no card do Commerce
3. Aceite os termos de uso
4. Produto Commerce adicionado ✅

### 1.4 Copiar App ID e App Secret

1. No menu lateral, clique em **"Configurações" → "Básico"**
2. Copie o **"ID do App"** (algo como: `123456789012345`)
3. Copie o **"Chave Secreta do App"** (clique em "Mostrar")
   - ⚠️ **IMPORTANTE:** Mantenha essa chave em segredo!
4. Salve essas informações em um local seguro

---

## Passo 2: Configurar Facebook Business Manager

### 2.1 Acessar Business Manager

1. Acesse: **https://business.facebook.com**
2. Se ainda não tem, crie uma conta comercial:
   - Nome da Empresa: "Léo iPhone"
   - Seu Nome
   - Email Comercial

### 2.2 Adicionar Página do Facebook

1. No menu lateral, vá em **"Contas" → "Páginas"**
2. Clique em **"Adicionar" → "Adicionar uma Página"**
3. Se já tem página:
   - Selecione "Solicitar acesso a uma Página"
   - Digite o nome da página
   - Solicite acesso total
4. Se não tem:
   - Crie uma nova página para sua loja
   - Nome: "Léo iPhone"
   - Categoria: "Loja de Eletrônicos"

### 2.3 Vincular App ao Business Manager

1. No Business Manager, vá em **"Configurações da Empresa"**
2. Menu lateral: **"Contas" → "Apps"**
3. Clique em **"Adicionar" → "Adicionar um ID de App"**
4. Digite o **App ID** que copiou no Passo 1.4
5. Clique em **"Adicionar App"**

---

## Passo 3: Criar Catálogo de Produtos

### 3.1 Criar Catálogo no Business Manager

1. No Business Manager, vá em **"Commerce Manager"**
   - Ou acesse direto: **https://business.facebook.com/commerce**
2. Clique em **"Criar Catálogo"**
3. **Tipo de Catálogo:** Selecione **"Comércio eletrônico"**
4. **Nome do Catálogo:** "Léo iPhone - Produtos"
5. Clique em **"Criar"**

### 3.2 Configurar Catálogo

1. Após criar, você verá o dashboard do catálogo
2. No menu lateral, clique em **"Configurações"**
3. Copie o **"ID do Catálogo"** (algo como: `987654321098765`)
4. Salve esse ID em local seguro

### 3.3 Adicionar Método de Checkout (Opcional)

1. Ainda em "Configurações"
2. Seção **"Checkout"**
3. Selecione: **"Enviar mensagem para comprar"**
   - Isso direciona clientes para WhatsApp
4. Salvar configurações

### 3.4 Ativar Marketplace

1. No menu lateral do catálogo, clique em **"Configurações de Vendas"**
2. Ative a opção **"Facebook Marketplace"**
3. Configure:
   - **Local de venda:** Brasil
   - **Moeda:** BRL (Real Brasileiro)
   - **Categoria:** Eletrônicos
4. Salvar

---

## Passo 4: Gerar Access Token

### 4.1 Acessar Graph API Explorer

1. Acesse: **https://developers.facebook.com/tools/explorer/**
2. No topo, selecione seu **App** (Léo iPhone Marketplace)
3. Clique em **"Gerar Token de Acesso"**

### 4.2 Selecionar Permissões

1. Clique no botão **"Gerar Token"**
2. Uma janela abrirá pedindo permissões
3. Selecione as seguintes permissões:
   - ✅ `catalog_management`
   - ✅ `business_management`
   - ✅ `pages_read_engagement`
   - ✅ `pages_manage_metadata`
4. Clique em **"Continuar como [Seu Nome]"**
5. Aceite as permissões

### 4.3 Copiar Access Token

1. Após autorizar, você verá um token longo (começa com `EAABw...`)
2. **⚠️ IMPORTANTE:** Este token expira em 1-2 horas!
3. Precisamos converter para um **Long-Lived Token** (60 dias)

### 4.4 Converter para Long-Lived Token

**Opção A: Via Terminal (Recomendado)**

```bash
curl -i -X GET "https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=3013685975506295&client_secret=f5d7489af3df32719622e8261eaf642c&fb_exchange_token=EAAq07nII3XcBP3Vc9ZA3Y8eziSbg4CuXJxyiy48JPoqCJwPsXlr3hOEiy1HVjPEVqdUtZC1nZAH7sgEre7rCIcaDBiTs4GZCNWbsBoJFaeVpz5JyD7rSll7WEe3a1OEyW2lX9xArVGVIvbU9HSZA2ZAm9PaJz2yPt2K5uUXB6hc5m7c2VP5W3QOGenKIpoI3DEK5qcPIW4xZAFZBxWIHwv3O3WATH9rM2ZB5SXrly6TIUGe9uFWG6npeLOc1mN3aB1V5LJLKADA6XX01gVTJH5MQVJAZDZD"
```

Substitua:

- `{APP_ID}` → Seu App ID
- `{APP_SECRET}` → Seu App Secret
- `{SHORT_TOKEN}` → Token que copiou do Graph Explorer

Resposta será algo como:

```json
{
  "access_token": "EAABwzLixnjYBO...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

Copie o novo `access_token`.

**Opção B: Via Graph API Explorer**

1. No Graph API Explorer, após gerar o token
2. Clique no ícone "ℹ️" ao lado do token
3. Clique em **"Abrir no Depurador de Token de Acesso"**
4. No depurador, clique em **"Estender Token de Acesso"**
5. Copie o novo token (válido por 60 dias)

### 4.5 Salvar o Long-Lived Token

⚠️ **MUITO IMPORTANTE:**

- Este token é válido por **60 dias**
- Após 60 dias, você precisa **renovar** o token
- Guarde em local seguro (não compartilhe)

---

## Passo 5: Configurar no Sistema

### 5.1 Acessar Painel Admin

1. Acesse seu painel admin: **https://seusite.com/admin/anuncios**
2. Faça login com sua conta de administrador

### 5.2 Abrir Configurações

1. Na página de Anúncios, clique em **"Configurações"**
2. Um modal abrirá com o formulário

### 5.3 Preencher Credenciais

Preencha os campos com as informações que coletou:

| Campo                      | Valor               | Onde encontrar                           |
| -------------------------- | ------------------- | ---------------------------------------- |
| **App ID**                 | `123456789012345`   | Passo 1.4 - Configurações Básicas do App |
| **App Secret**             | `a1b2c3d4e5f6...`   | Passo 1.4 - Configurações Básicas do App |
| **Access Token**           | `EAABwzLixnjYBO...` | Passo 4.4 - Long-Lived Token             |
| **Catalog ID**             | `987654321098765`   | Passo 3.2 - Configurações do Catálogo    |
| **Page ID** (opcional)     | `111222333444555`   | Configurações da Página do Facebook      |
| **Business ID** (opcional) | `666777888999000`   | Configurações do Business Manager        |

### 5.4 Ativar Integração

1. Ative o switch **"Ativar Integração"**
2. (Opcional) Ative **"Sincronização Automática"**
   - Define intervalo em minutos (recomendado: 60)
3. Clique em **"Salvar Configuração"**

Se tudo estiver correto, verá a mensagem: ✅ **"Configuração salva com sucesso!"**

---

## Passo 6: Executar Migration

### 6.1 Conectar ao Supabase

1. Acesse o Supabase Dashboard: **https://supabase.com/dashboard**
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**

### 6.2 Executar SQL

1. Clique em **"New query"**
2. Copie todo o conteúdo do arquivo `supabase-migration-facebook-marketplace.sql`
3. Cole no editor SQL
4. Clique em **"Run"** (▶️)

Se tudo der certo, verá:

```
Success. No rows returned
```

### 6.3 Verificar Tabelas Criadas

1. No menu lateral, clique em **"Table Editor"**
2. Verifique se as seguintes tabelas foram criadas:
   - ✅ `facebook_anuncios`
   - ✅ `facebook_config`
   - ✅ `facebook_sync_log`
   - ✅ `v_anuncios_facebook_com_produto` (view)

---

## Como Usar

### Criar um Anúncio

1. Acesse **Admin → Anúncios**
2. Clique em **"Novo Anúncio"**
3. **Buscar Produto:**
   - Digite o nome ou código do produto
   - Clique em "Buscar"
4. **Selecionar Produto:**
   - Clique no produto desejado na lista
5. **Configurar Anúncio:**
   - **Título:** (pré-preenchido, pode editar)
   - **Descrição:** (pré-preenchida, pode editar)
6. Clique em **"Anunciar Produto"**

**Resultado:**

- Se sucesso: ✅ "Anúncio criado com sucesso no Facebook Marketplace!"
- Se erro: ❌ Mensagem de erro detalhada

### Visualizar Anúncios

Na página **Admin → Anúncios**, você verá:

- **Todos:** Lista completa de anúncios
- **Anunciados:** Apenas anúncios ativos no Facebook
- **Erro:** Anúncios que falharam
- **Pausados:** Anúncios pausados manualmente

Cada anúncio mostra:

- Imagem do produto
- Nome e código
- Preço atual
- Status (badge colorido)
- Facebook Product ID
- Data de sincronização

### Remover Anúncio

1. Na tabela de anúncios, clique no **menu ⋮** na linha do anúncio
2. Clique em **"Remover"**
3. Confirme a ação
4. O produto será removido do Facebook Marketplace

---

## Troubleshooting

### Erro: "Integração não está configurada"

**Causa:** Configurações do Facebook não foram salvas

**Solução:**

1. Vá em "Configurações"
2. Preencha todos os campos obrigatórios
3. Ative "Ativar Integração"
4. Salve

---

### Erro: "Invalid OAuth access token"

**Causa:** Access Token expirou ou está inválido

**Solução:**

1. Gere um novo Long-Lived Token (Passo 4)
2. Atualize nas Configurações
3. Tente novamente

---

### Erro: "Catalog not found"

**Causa:** Catalog ID está incorreto

**Solução:**

1. Acesse Commerce Manager
2. Copie o Catalog ID correto
3. Atualize nas Configurações

---

### Erro: "Product already exists"

**Causa:** Produto já está anunciado com o mesmo `retailer_id`

**Solução:**

1. Verifique na aba "Anunciados" se o produto já existe
2. Se sim, remova o anúncio antigo
3. Crie novamente

---

### Anúncio criado mas não aparece no Marketplace

**Causa:** Produto pode estar em análise pelo Facebook

**Solução:**

1. Aguarde 24-48 horas
2. Verifique no Commerce Manager se há rejeições
3. Produtos podem ser rejeitados se:
   - Imagem de baixa qualidade
   - Descrição com erros
   - Categoria incorreta
   - Preço muito baixo/alto

---

### Erro: "Insufficient permissions"

**Causa:** Access Token não tem as permissões necessárias

**Solução:**

1. No Graph API Explorer, gere novo token
2. Certifique-se de autorizar:
   - `catalog_management`
   - `business_management`
3. Converta para Long-Lived
4. Atualize nas Configurações

---

## Limitações e Considerações

### Limitações Técnicas

1. **Não é 100% Facebook Marketplace direto:**
   - Usa Facebook Catalog API
   - Produtos aparecem no Marketplace SE o catálogo estiver configurado
   - Não há controle sobre ranking/visibilidade

2. **Token expira a cada 60 dias:**
   - Você precisa renovar o Access Token manualmente
   - Sistema não renova automaticamente
   - Considere criar um cron job para renovação

3. **Limite de requisições:**
   - Facebook limita chamadas da API
   - Não crie/remova milhares de produtos de uma vez
   - Use com moderação

4. **Aprovação do Facebook:**
   - Produtos podem ser rejeitados
   - Não há controle sobre isso
   - Verifique Commerce Manager regularmente

### Boas Práticas

✅ **DO:**

- Mantenha imagens em alta qualidade
- Use descrições claras e precisas
- Atualize estoque regularmente
- Monitore logs de erro

❌ **DON'T:**

- Não crie anúncios duplicados
- Não use imagens genéricas da internet
- Não coloque preços muito fora do mercado
- Não tente "hackear" o sistema de ranqueamento

---

## API Reference (Para Desenvolvedores)

### Estrutura de Tabelas

```sql
-- Tabela principal de anúncios
facebook_anuncios (
  id UUID PRIMARY KEY,
  produto_id UUID REFERENCES produtos(id),
  facebook_product_id TEXT,
  facebook_catalog_id TEXT,
  status TEXT, -- 'pendente' | 'anunciado' | 'erro' | 'pausado' | 'removido'
  titulo TEXT,
  descricao TEXT,
  preco DECIMAL,
  disponibilidade TEXT, -- 'in stock' | 'out of stock'
  condicao TEXT, -- 'new' | 'refurbished' | 'used'
  erro_mensagem TEXT,
  sincronizado_em TIMESTAMP
)

-- Configurações
facebook_config (
  id UUID PRIMARY KEY,
  app_id TEXT,
  app_secret TEXT,
  access_token TEXT,
  catalog_id TEXT,
  sync_enabled BOOLEAN,
  auto_sync BOOLEAN
)

-- Logs de sincronização
facebook_sync_log (
  id UUID PRIMARY KEY,
  anuncio_id UUID,
  acao TEXT, -- 'criar' | 'atualizar' | 'remover'
  status TEXT, -- 'sucesso' | 'erro'
  mensagem TEXT,
  request_payload JSONB,
  response_data JSONB
)
```

### Server Actions

```typescript
// Criar anúncio
criarAnuncio({ produto_id, titulo?, descricao? })
// Retorna: { success, data?, error? }

// Atualizar anúncio
atualizarAnuncio({ anuncio_id, titulo?, descricao?, preco?, disponibilidade? })

// Remover anúncio
removerAnuncio(anuncio_id)

// Listar anúncios
listarAnuncios()

// Buscar produtos disponíveis
buscarProdutosDisponiveis(busca?)
```

### Facebook Graph API Wrapper

```typescript
import { FacebookGraphAPI } from '@/lib/facebook/graph-api'

const client = new FacebookGraphAPI(accessToken, catalogId)

// Criar produto
await client.createProduct({
  retailer_id: 'IPHONE15PM',
  name: 'iPhone 15 Pro Max 256GB',
  price: 7999.0,
  url: 'https://leoiphone.com.br/produto/...',
  image_url: 'https://...',
  availability: 'in stock',
  condition: 'new',
  brand: 'Apple',
})

// Atualizar produto
await client.updateProduct(productId, { price: 7499.0 })

// Remover produto
await client.deleteProduct(productId)
```

---

## Suporte

Se encontrar problemas:

1. **Verificar logs:**
   - Supabase: Tabela `facebook_sync_log`
   - Browser Console: Erros de JavaScript

2. **Documentação oficial:**
   - https://developers.facebook.com/docs/commerce-platform
   - https://developers.facebook.com/docs/graph-api

3. **Contato:**
   - Abra uma issue no GitHub do projeto
   - Email: suporte@leoiphone.com.br

---

## Changelog

**v1.0.0** (30/10/2025)

- ✅ Implementação inicial
- ✅ CRUD completo de anúncios
- ✅ Integração com Facebook Graph API
- ✅ Logs detalhados de sincronização
- ✅ UI responsiva no admin

---

**🎉 Sistema pronto para uso!**

Após seguir todos os passos, você poderá criar anúncios no Facebook Marketplace diretamente do seu admin.
