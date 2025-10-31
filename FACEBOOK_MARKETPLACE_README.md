# 🛍️ Integração Facebook Marketplace - Sistema Léo iPhone

## 📋 Visão Geral

Sistema completo de automação de anúncios no **Facebook Marketplace** integrado ao painel admin do Léo iPhone.

### ✨ O que faz:

- ✅ **Criar anúncios** no Facebook Marketplace direto do admin
- ✅ **Buscar produtos** disponíveis para anunciar
- ✅ **Gerenciar anúncios** (atualizar, remover)
- ✅ **Monitorar status** (anunciado, erro, pausado)
- ✅ **Log completo** de todas as operações
- ✅ **Interface responsiva** e intuitiva

---

## 📁 Estrutura de Arquivos

```
leoiphone_2/
├── supabase-migration-facebook-marketplace.sql  # Migration do banco
│
├── lib/facebook/
│   └── graph-api.ts                             # Cliente Facebook API
│
├── types/
│   └── facebook.ts                              # TypeScript types
│
├── app/admin/anuncios/
│   ├── page.tsx                                 # Página principal
│   └── actions.ts                               # Server Actions
│
├── components/admin/anuncios/
│   ├── anuncios-manager.tsx                     # Manager (orquestrador)
│   ├── criar-anuncio-dialog.tsx                 # Diálogo criar anúncio
│   ├── anuncios-table.tsx                       # Tabela de anúncios
│   └── configuracao-dialog.tsx                  # Diálogo configurações
│
├── components/ui/
│   ├── scroll-area.tsx                          # Novo componente
│   └── tabs.tsx                                 # Novo componente
│
└── docs/
    ├── FACEBOOK_MARKETPLACE_SETUP.md            # Guia completo setup
    ├── FACEBOOK_MARKETPLACE_QUICK_START.md      # Quick start
    ├── FACEBOOK_MARKETPLACE_INSTALL.md          # Instruções instalação
    └── FACEBOOK_MARKETPLACE_README.md           # Este arquivo
```

---

## 🚀 Como Instalar

### 1. Instalar Dependências

```bash
npm install @radix-ui/react-scroll-area @radix-ui/react-tabs
```

### 2. Executar Migration

No Supabase SQL Editor, execute:
```sql
-- Conteúdo de supabase-migration-facebook-marketplace.sql
```

### 3. Adicionar ao Sidebar

Edite `components/admin/sidebar.tsx` e adicione a rota:

```typescript
{
  label: 'Anúncios Facebook',
  icon: Store,
  href: '/admin/anuncios',
}
```

### 4. Configurar Facebook

Siga o guia em `FACEBOOK_MARKETPLACE_SETUP.md`:
- Criar App no Facebook Developers
- Configurar Business Manager
- Gerar Access Token
- Configurar no Admin

---

## 📊 Fluxo de Uso

```
┌─────────────────────────────────────────────┐
│  Admin acessa /admin/anuncios               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Clica em "Novo Anúncio"                    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Busca produto no sistema                   │
│  (Ex: "iPhone 15 Pro Max")                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Seleciona produto da lista                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Configura título e descrição               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Clica em "Anunciar Produto"                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Sistema chama Facebook Graph API           │
│  POST /v18.0/{catalog_id}/products          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Produto criado no Facebook Catalog         │
│  Retorna: { id: "12345..." }                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Sistema salva anúncio no banco             │
│  Status: "anunciado"                        │
│  facebook_product_id: "12345..."            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Facebook mostra produto no Marketplace     │
│  (após aprovação, 24-48h)                   │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Estrutura do Banco

### Tabelas Criadas

**1. facebook_anuncios**
- Armazena todos os anúncios criados
- Campos principais: produto_id, facebook_product_id, status, preço

**2. facebook_config**
- Credenciais da integração Facebook
- Configurações de sincronização

**3. facebook_sync_log**
- Log de todas as operações (criar, atualizar, remover)
- Request e response do Facebook

**4. v_anuncios_facebook_com_produto** (view)
- Join de anúncios + produtos para facilitar queries

---

## 🔑 Configurações Necessárias

No Admin → Anúncios → Configurações:

| Campo | Descrição | Onde encontrar |
|-------|-----------|----------------|
| **App ID** | ID do app no Facebook Developers | Configurações Básicas |
| **App Secret** | Chave secreta do app | Configurações Básicas |
| **Access Token** | Token de longa duração (60 dias) | Graph API Explorer |
| **Catalog ID** | ID do catálogo no Commerce Manager | Configurações do Catálogo |
| **Page ID** | ID da página do Facebook (opcional) | Sobre da Página |
| **Business ID** | ID da conta comercial (opcional) | Business Settings |

---

## 📱 Interface do Admin

### Página Principal

**Tabs:**
- Todos (total de anúncios)
- Anunciados (ativos no Facebook)
- Erro (que falharam)
- Pausados (desativados)

**Ações:**
- Buscar produtos
- Configurações
- Novo Anúncio

### Tabela de Anúncios

**Colunas:**
- Imagem do produto
- Nome e código
- Preço
- Status (badge colorido)
- Facebook Product ID
- Data de sincronização
- Ações (menu)

**Status possíveis:**
- 🟢 Anunciado (verde)
- 🔴 Erro (vermelho)
- ⚪ Pausado (cinza)
- 🟡 Pendente (amarelo)
- ⚫ Removido (cinza escuro)

---

## 🛠️ API Reference (Desenvolvedores)

### Server Actions

```typescript
// Criar anúncio
import { criarAnuncio } from '@/app/admin/anuncios/actions'

const result = await criarAnuncio({
  produto_id: 'uuid-do-produto',
  titulo: 'iPhone 15 Pro Max 256GB',
  descricao: 'Novo lacrado com garantia Apple'
})

// Retorna:
{
  success: true | false,
  data?: AnuncioComProduto,
  error?: string,
  message?: string
}
```

```typescript
// Atualizar anúncio
import { atualizarAnuncio } from '@/app/admin/anuncios/actions'

await atualizarAnuncio({
  anuncio_id: 'uuid-do-anuncio',
  preco: 7499.00,
  disponibilidade: 'out of stock'
})
```

```typescript
// Remover anúncio
import { removerAnuncio } from '@/app/admin/anuncios/actions'

await removerAnuncio('uuid-do-anuncio')
```

### Facebook Graph API Client

```typescript
import { FacebookGraphAPI } from '@/lib/facebook/graph-api'

const client = new FacebookGraphAPI(accessToken, catalogId)

// Criar produto
const response = await client.createProduct({
  retailer_id: 'IPHONE15PM256',
  name: 'iPhone 15 Pro Max 256GB Preto',
  description: 'iPhone novo lacrado...',
  url: 'https://leoiphone.com.br/produto/...',
  image_url: 'https://storage.supabase.co/...',
  price: 7999.00, // em reais (converte automático)
  currency: 'BRL',
  availability: 'in stock',
  condition: 'new',
  brand: 'Apple',
  category: 'Smartphones',
  inventory: 5
})

// Retorna:
{
  id: '12345678901234',
  success: true
}
```

---

## 🐛 Troubleshooting

### "Integração não configurada"
→ Configure em Admin → Anúncios → Configurações

### "Invalid OAuth token"
→ Token expirou (renova a cada 60 dias)
→ Gere novo no Graph API Explorer

### "Catalog not found"
→ Catalog ID incorreto
→ Copie ID correto do Commerce Manager

### Produto criado mas não aparece no Marketplace
→ Facebook demora 24-48h para aprovar
→ Verifique no Commerce Manager se foi rejeitado

### Erro de permissões
→ Access Token precisa ter:
  - `catalog_management`
  - `business_management`

---

## 📈 Métricas e Logs

### Dashboard Metrics (Futuro)

Possível implementar:
- Total de anúncios ativos
- Taxa de aprovação do Facebook
- Produtos mais anunciados
- Erros mais comuns

### Logs Detalhados

Todo anúncio gera log em `facebook_sync_log`:
- Ação realizada (criar/atualizar/remover)
- Status (sucesso/erro)
- Payload enviado ao Facebook
- Response do Facebook
- Timestamp

**Query útil:**
```sql
-- Ver logs de erros
SELECT * FROM facebook_sync_log
WHERE status = 'erro'
ORDER BY created_at DESC
LIMIT 20;
```

---

## ⚠️ Limitações

### Técnicas

1. **Access Token expira a cada 60 dias**
   - Necessário renovação manual
   - Considere implementar renovação automática

2. **Não é API direta do Marketplace**
   - Usa Facebook Catalog API
   - Produtos aparecem no Marketplace SE catálogo configurado

3. **Sem controle de ranqueamento**
   - Facebook decide ordem dos produtos
   - Não há como "promover" produtos via API

4. **Limite de requisições**
   - Facebook limita chamadas API por hora
   - Evite criar/remover milhares de produtos de uma vez

### Operacionais

1. **Aprovação do Facebook**
   - Produtos podem ser rejeitados
   - Motivos: imagem ruim, descrição inadequada, preço suspeito

2. **Tempo de aprovação**
   - 24-48 horas em média
   - Primeiro produto pode demorar mais

3. **Política de Comércio**
   - Seguir regras do Facebook Commerce
   - Proibido: réplicas, produtos ilegais, etc.

---

## 🚧 Melhorias Futuras

### Features planejadas:

- [ ] **Sincronização automática**
  - Cron job que atualiza preços/estoque periodicamente

- [ ] **Renovação automática de token**
  - Script que renova Access Token antes de expirar

- [ ] **Bulk operations**
  - Criar múltiplos anúncios de uma vez
  - Atualização em massa

- [ ] **Notificações**
  - Email quando anúncio tem erro
  - Alerta quando token vai expirar

- [ ] **Dashboard analytics**
  - Métricas de conversão
  - Produtos mais visualizados no Facebook

- [ ] **Integração com Facebook Insights**
  - Ver quantas pessoas viram cada produto
  - Taxa de cliques

---

## 📚 Documentação Completa

| Arquivo | Descrição |
|---------|-----------|
| `FACEBOOK_MARKETPLACE_README.md` | Este arquivo (visão geral) |
| `FACEBOOK_MARKETPLACE_SETUP.md` | Guia passo a passo completo |
| `FACEBOOK_MARKETPLACE_QUICK_START.md` | Resumo rápido para desenvolvedores |
| `FACEBOOK_MARKETPLACE_INSTALL.md` | Instruções técnicas de instalação |

---

## 🔗 Links Úteis

- **Facebook Developers:** https://developers.facebook.com
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer
- **Commerce Manager:** https://business.facebook.com/commerce
- **Business Manager:** https://business.facebook.com
- **API Docs:** https://developers.facebook.com/docs/commerce-platform

---

## 💡 Suporte

**Dúvidas técnicas:**
- Leia `FACEBOOK_MARKETPLACE_SETUP.md`
- Verifique logs em `facebook_sync_log`
- Consulte Facebook API Docs

**Problemas comuns:**
- Ver seção Troubleshooting acima
- Verificar token no Graph API Explorer
- Conferir permissões do app

---

## ✅ Status do Projeto

**Versão:** 1.0.0
**Status:** ✅ Pronto para produção
**Última atualização:** 30 de Outubro de 2025

### Features implementadas:

- ✅ CRUD completo de anúncios
- ✅ Integração Facebook Graph API
- ✅ Interface admin responsiva
- ✅ Logs detalhados
- ✅ Gestão de configurações
- ✅ Validação de dados
- ✅ Error handling robusto
- ✅ Documentação completa

---

**🎉 Sistema pronto para usar! Boa sorte com as vendas no Facebook Marketplace!**

---

## 📞 Contato

Para suporte ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

**Desenvolvido por:** Claude (Anthropic)
**Projeto:** Léo iPhone E-Commerce Platform
**Stack:** Next.js 16 + Supabase + Facebook Graph API
