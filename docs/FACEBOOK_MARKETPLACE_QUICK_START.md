# 🚀 Quick Start: Facebook Marketplace Integration

## ✅ Arquivos Implementados

Todos os arquivos necessários já foram criados:

### Banco de Dados
- ✅ `supabase-migration-facebook-marketplace.sql` - Migration completa

### Backend
- ✅ `lib/facebook/graph-api.ts` - Cliente Facebook Graph API
- ✅ `types/facebook.ts` - TypeScript types
- ✅ `app/admin/anuncios/actions.ts` - Server Actions

### Frontend
- ✅ `app/admin/anuncios/page.tsx` - Página principal
- ✅ `components/admin/anuncios/anuncios-manager.tsx` - Manager
- ✅ `components/admin/anuncios/criar-anuncio-dialog.tsx` - Diálogo criar
- ✅ `components/admin/anuncios/anuncios-table.tsx` - Tabela
- ✅ `components/admin/anuncios/configuracao-dialog.tsx` - Configurações

### Documentação
- ✅ `FACEBOOK_MARKETPLACE_SETUP.md` - Guia completo de setup

---

## 📝 Próximos Passos

### 1. Adicionar Rota no Sidebar

Edite `components/admin/sidebar.tsx` e adicione:

```typescript
import { Facebook } from 'lucide-react' // ou Store

const routes = [
  // ... rotas existentes
  {
    label: 'Anúncios Facebook',
    icon: Facebook,
    href: '/admin/anuncios',
    color: 'text-blue-500',
  },
]
```

### 2. Executar Migration

```bash
# Copie o conteúdo de supabase-migration-facebook-marketplace.sql
# Cole no SQL Editor do Supabase
# Execute
```

### 3. Instalar Dependências (se necessário)

Verifique se já tem instalado:
```bash
npm install @radix-ui/react-switch @radix-ui/react-scroll-area
```

Se os componentes já existem em `components/ui/`, não precisa instalar.

### 4. Configurar Facebook

Siga o guia completo em `FACEBOOK_MARKETPLACE_SETUP.md`

**Resumo rápido:**
1. Criar App no Facebook Developers
2. Adicionar produto Commerce
3. Criar Catálogo no Business Manager
4. Gerar Long-Lived Access Token
5. Configurar no Admin → Anúncios → Configurações

### 5. Testar

1. Acesse `/admin/anuncios`
2. Configure credenciais
3. Clique em "Novo Anúncio"
4. Busque um produto
5. Anuncie

---

## 🔑 Credenciais Necessárias

```env
# Não precisa adicionar ao .env
# São salvos no banco de dados (tabela facebook_config)
# Mas se quiser:

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_CATALOG_ID=
```

---

## 🎯 Fluxo Completo

```
1. Admin busca produto no sistema
        ↓
2. Seleciona produto que quer anunciar
        ↓
3. Configura título e descrição
        ↓
4. Clica em "Anunciar Produto"
        ↓
5. Sistema chama Facebook Graph API
        ↓
6. Produto é criado no Facebook Catalog
        ↓
7. Facebook mostra no Marketplace automaticamente
        ↓
8. Status fica "Anunciado" no admin
```

---

## 📊 Estrutura de Dados

**Produto do Sistema → Facebook Product:**

```typescript
{
  // Sistema
  id: "uuid",
  nome: "iPhone 15 Pro Max 256GB",
  preco: 7999.00,
  estoque: 5,
  condicao: "novo",

  // ↓ Converte para ↓

  // Facebook
  retailer_id: "IPHONE15PM256", // codigo_produto
  name: "iPhone 15 Pro Max 256GB",
  price: 799900, // em centavos
  availability: "in stock",
  condition: "new",
  brand: "Apple",
  category: "Smartphones",
  url: "https://leoiphone.com.br/produto/iphone-15-pro-max-256gb",
  image_url: "https://storage.supabase.co/..."
}
```

---

## 🐛 Troubleshooting Rápido

### Erro: "Integração não configurada"
→ Configure em Configurações (ícone ⚙️)

### Erro: "Invalid OAuth token"
→ Token expirou, gere novo Long-Lived Token

### Erro: "Catalog not found"
→ Verifique se Catalog ID está correto

### Produto não aparece no Marketplace
→ Aguarde 24-48h (Facebook analisa produtos)

### Componente não encontrado
```bash
# Se faltar Switch, Label ou ScrollArea:
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add label
npx shadcn-ui@latest add scroll-area
```

---

## 📚 Referências Úteis

- **Facebook Graph API Explorer:** https://developers.facebook.com/tools/explorer
- **Commerce API Docs:** https://developers.facebook.com/docs/commerce-platform
- **Business Manager:** https://business.facebook.com
- **Supabase Dashboard:** https://supabase.com/dashboard

---

## ✨ Features Implementadas

- [x] Criar anúncios no Facebook
- [x] Buscar produtos disponíveis
- [x] Atualizar preço/disponibilidade
- [x] Remover anúncios
- [x] Logs detalhados de sincronização
- [x] Interface responsiva
- [x] Filtros por status (Anunciados/Erro/Pausados)
- [x] Preview de produto antes de anunciar
- [x] Configurações no painel admin
- [x] Validação de campos

---

## 🚧 Features Futuras (Opcional)

- [ ] Sincronização automática via cron job
- [ ] Renovação automática de Access Token
- [ ] Bulk create (criar múltiplos anúncios de uma vez)
- [ ] Atualização automática quando produto muda
- [ ] Notificações quando anúncio tem erro
- [ ] Dashboard com métricas do Facebook
- [ ] Integração com Facebook Insights API

---

## 💡 Dicas

1. **Mantenha imagens em alta qualidade** (mín. 1024x1024)
2. **Use descrições claras** (evite ALL CAPS)
3. **Monitore logs regularmente** (tabela `facebook_sync_log`)
4. **Renove token antes de expirar** (configure lembrete a cada 50 dias)
5. **Teste com poucos produtos primeiro** antes de anunciar tudo

---

**🎉 Sistema pronto! Boa sorte com os anúncios no Facebook Marketplace!**
