# 🔄 Refatoração: Facebook Marketplace API

**Data:** 2025-11-01  
**Motivo:** Produtos não apareciam no Marketplace (estavam indo só para o catálogo)

---

## 🎯 Problema Identificado

### API Antiga (INCORRETA):
```typescript
// ❌ Commerce Platform API
POST /{catalog_id}/products

// Resultado:
// - Produtos iam para o CATÁLOGO
// - NÃO apareciam no MARKETPLACE automaticamente
```

### API Nova (CORRETA):
```typescript
// ✅ Marketplace Partner Item API
POST /{catalog_id}/items_batch
{
  "item_type": "PRODUCT_ITEM",
  "requests": [...]
}

// Resultado:
// - Produtos vão DIRETO para o MARKETPLACE
// - Aprovação e publicação automática
```

---

## 📋 O que foi alterado

### 1. **lib/facebook/graph-api.ts** - REESCRITO COMPLETAMENTE

#### Antes:
```typescript
class FacebookGraphAPI {
  // Usava: /{catalog_id}/products
  // Campos: name, image_url, url, price (centavos)
}
```

#### Depois:
```typescript
class FacebookMarketplaceAPI {
  // Usa: /{catalog_id}/items_batch
  // Campos: title, image_link, link, price (string "4999 BRL")
  // + campos partner_*
}
```

#### Principais mudanças:

| Antes | Depois | Motivo |
|-------|--------|--------|
| `name` | `title` | Nome correto da API |
| `image_url` | `image_link` | Nome correto da API |
| `url` | `link` | Nome correto da API |
| `price: 499900` | `price: "4999.00 BRL"` | Formato string |
| - | `additional_image_link[]` | Suporte a múltiplas imagens |
| - | `partner_*` campos | Marketplace-specific |

---

### 2. **Campos Marketplace Adicionados**

Agora enviamos TODOS os campos necessários para o Marketplace:

```typescript
{
  // Obrigatórios básicos
  id: "SKU123",
  title: "iPhone 14 Pro 256GB",
  description: "Descrição detalhada...",
  price: "4999.00 BRL",
  image_link: "https://...",
  brand: "Apple",
  availability: "in stock",
  condition: "used_like_new",
  link: "https://leoiphone.com.br/produto/...",
  
  // NOVOS: Campos Marketplace
  partner_product_checkout_uri: "URL de compra",
  partner_product_location: "Brasil",
  partner_delivery_method: ["shipping", "pickup"],
  partner_shipping_type: "calculated",
  partner_item_country: "BR",
  partner_seller_id: "leoiphone",
  
  // NOVO: Múltiplas imagens
  additional_image_link: [
    "foto2.jpg",
    "foto3.jpg",
    // ... até 10 imagens
  ],
  
  // NOVO: Atributos do produto
  partner_attribute_data: {
    color: "Azul",
    storage: "256GB",
    battery_health: "95%"
  },
  
  // NOVO: Política de devolução
  return_details: {
    return_days: "7",
    return_type: "SELLER_PAID_RETURN"
  }
}
```

---

### 3. **Múltiplas Imagens**

#### Antes:
- Enviava apenas 1 imagem (`foto_principal`)

#### Depois:
- Envia TODAS as fotos do produto:
  - `image_link`: foto principal
  - `additional_image_link`: até 10 fotos extras

```typescript
const allImages = produto.fotos?.filter(img => img) || []
const mainImage = produto.foto_principal || allImages[0]
const additionalImages = allImages.slice(1, 11) // 10 extras
```

---

### 4. **Formato Batch API**

#### Estrutura da request:

```typescript
POST /{catalog_id}/items_batch

{
  "access_token": "...",
  "item_type": "PRODUCT_ITEM",
  "requests": [
    {
      "method": "CREATE", // ou UPDATE, DELETE
      "data": {
        "id": "SKU123",
        "title": "...",
        // ... todos os campos
      }
    },
    // ... até 300 produtos por batch
  ]
}
```

---

## 🔧 Migração de Código

### Actions (app/admin/anuncios/actions.ts)

#### Antes:
```typescript
import { FacebookGraphAPI, produtoToFacebookProduct } from '@/lib/facebook/graph-api'

const fbClient = new FacebookGraphAPI(token, catalogId)
const fbProduct = produtoToFacebookProduct(produto, siteUrl)
await fbClient.createProduct(fbProduct)
```

#### Depois:
```typescript
import { FacebookMarketplaceAPI, produtoToMarketplaceProduct } from '@/lib/facebook/graph-api'

const fbClient = new FacebookMarketplaceAPI(token, catalogId)
const marketplaceProduct = produtoToMarketplaceProduct(produto, siteUrl)
await fbClient.createProduct(marketplaceProduct) // Usa batch internamente
```

---

## ✅ Compatibilidade

### O que NÃO mudou:

✓ Interface do admin (UI)  
✓ Banco de dados  
✓ Tipos TypeScript públicos  
✓ Fluxo de criação/edição/remoção  

### O que mudou:

- ✅ Comunicação com Facebook (API)
- ✅ Formato dos dados enviados
- ✅ Campos adicionais
- ✅ Suporte a múltiplas imagens

---

## 📊 Comparação de APIs

| Feature | Commerce API (Antiga) | Marketplace API (Nova) |
|---------|----------------------|------------------------|
| Endpoint | `/products` | `/items_batch` |
| Formato | Individual POST | Batch |
| Destino | Catálogo | Marketplace direto |
| Imagens | 1 imagem | 11 imagens (1+10) |
| Campos partner_* | ❌ Não | ✅ Sim |
| Aprovação | Manual | Automática |
| Visibilidade | Catálogo | Marketplace público |
| Rate Limit | 200/hour | 30/min (300/batch) |

---

## 🚀 Benefícios da Refatoração

### 1. Produtos Aparecem no Marketplace
- ✅ API correta → produtos vão direto para Marketplace
- ✅ Não precisa configuração manual no Facebook
- ✅ Aprovação automática (24-48h)

### 2. Imagens Completas
- ✅ Todas as fotos do produto
- ✅ Cliente vê produto de todos os ângulos
- ✅ Aumenta confiança e conversão

### 3. Informações Completas
- ✅ Localização (Brasil)
- ✅ Método de entrega (envio + retirada)
- ✅ Política de devolução (7 dias)
- ✅ Atributos específicos (cor, bateria, etc)

### 4. Melhor Performance
- ✅ Batch de até 300 produtos
- ✅ Menos chamadas à API
- ✅ Rate limit adequado

---

## 📝 Exemplo Completo

### Produto no Sistema:
```json
{
  "id": "abc123",
  "nome": "iPhone 14 Pro 256GB Azul",
  "preco": 4999.00,
  "condicao": "seminovo",
  "nivel_bateria": 95,
  "foto_principal": "foto1.jpg",
  "fotos": ["foto1.jpg", "foto2.jpg", "foto3.jpg", "foto4.jpg"],
  "estoque": 1,
  "descricao": "iPhone em excelente estado..."
}
```

### Enviado para o Marketplace:
```json
{
  "id": "abc123",
  "title": "iPhone 14 Pro 256GB Azul",
  "description": "iPhone em excelente estado...\n\nBateria: 95% • Garantia: 3 meses",
  "price": "4999.00 BRL",
  "image_link": "https://.../foto1.jpg",
  "additional_image_link": [
    "https://.../foto2.jpg",
    "https://.../foto3.jpg",
    "https://.../foto4.jpg"
  ],
  "brand": "Apple",
  "availability": "in stock",
  "condition": "used_like_new",
  "link": "https://leoiphone.com.br/produto/iphone-14-pro-256gb",
  "partner_product_checkout_uri": "https://leoiphone.com.br/produto/iphone-14-pro-256gb",
  "partner_product_location": "Brasil",
  "partner_delivery_method": ["shipping", "pickup"],
  "partner_shipping_type": "calculated",
  "partner_item_country": "BR",
  "partner_seller_id": "leoiphone",
  "partner_attribute_data": {
    "color": "Azul",
    "storage": "256GB",
    "battery_health": "95%"
  },
  "return_details": {
    "return_days": "7",
    "return_type": "SELLER_PAID_RETURN"
  }
}
```

---

## ⚠️ Notas Importantes

### 1. Migração Gradual
- Produtos antigos (API antiga) continuam funcionando
- Novos produtos usam API nova automaticamente
- Não precisa reenviar produtos existentes

### 2. Aprovação
- Produtos novos entram em análise (24-48h)
- Status inicial: `pending_review`
- Após aprovação: `active` → aparece no Marketplace

### 3. Rate Limits
- **Antiga:** 200 requests/hora
- **Nova:** 30 requests/minuto (900/hora se otimizado)
- **Batch:** Até 300 produtos por request

### 4. Campos Obrigatórios
- Todos os campos obrigatórios estão sendo enviados
- Nosso sistema já tinha todas as informações necessárias
- Apenas o formato estava errado

---

## 🔗 Referências

- **Documentação:** `fb.md` na raiz do projeto
- **API Oficial:** Facebook Marketplace Partner Item API
- **Código:** `lib/facebook/graph-api.ts`
- **Actions:** `app/admin/anuncios/actions.ts`

---

## ✅ Checklist de Testes

Após deploy, verificar:

- [ ] Criar novo anúncio → produto vai para Marketplace
- [ ] Verificar múltiplas imagens no anúncio
- [ ] Status muda para "Em análise"
- [ ] Após 24-48h, status muda para "No Marketplace"
- [ ] Link "Ver no Marketplace" funciona
- [ ] Editar anúncio atualiza no Marketplace
- [ ] Remover anúncio remove do Marketplace
- [ ] Logs no banco de dados corretos

---

**Próximos passos:**
1. Deploy da refatoração
2. Criar novos anúncios com a API correta
3. Aguardar aprovação (24-48h)
4. Verificar produtos aparecendo no Marketplace

---

**Última atualização:** 2025-11-01
