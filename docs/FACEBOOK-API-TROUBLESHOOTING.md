# 🔧 Solução de Problemas - Facebook API

## ❌ Erro: "API access blocked"

### 🎯 Causas Comuns:

1. **Token de acesso expirado**
   - Tokens duram 60 dias
   - Após expirar, precisa gerar novo

2. **Token sem permissões corretas**
   - Precisa da permissão `catalog_management`
   - Precisa da permissão `business_management`

3. **App não tem acesso ao catálogo**
   - App precisa estar conectado ao Business Manager
   - Catálogo precisa estar no mesmo Business Manager

4. **Catálogo ID incorreto**
   - Verifique se o ID está correto
   - Copie direto da URL do Commerce Manager

5. **API antiga sendo usada**
   - ERRADA: `/catalog_id/products`
   - CORRETA: `/catalog_id/items_batch`

---

## ✅ Solução Passo a Passo:

### 1. Verificar Configuração Atual

No admin/anuncios:
1. Clique em **"Diagnosticar"** (botão no topo do card azul)
2. Leia os erros encontrados
3. Siga as recomendações

### 2. Gerar Novo Token de Acesso

1. Acesse: https://developers.facebook.com/tools/explorer
2. Selecione seu App
3. Clique em "Generate Access Token"
4. Marque as permissões:
   - ✅ `catalog_management`
   - ✅ `business_management`
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
5. Copie o token (começa com `EAA...`)
6. Cole em admin/anuncios > Configurações > Access Token
7. Salve

### 3. Verificar Catalog ID

1. Acesse: https://business.facebook.com/commerce_manager
2. Clique no seu catálogo
3. Na URL, copie o número após `/catalogs/`:
   ```
   https://business.facebook.com/commerce_manager/catalogs/1900672530660726
                                                              ^^^^^^^^^^^^^^^^^^
                                                              Este é o Catalog ID
   ```
4. Cole em admin/anuncios > Configurações > Catalog ID
5. Salve

### 4. Verificar Permissões do App

1. Acesse: https://business.facebook.com/settings
2. Vá em "Apps" > Seu App
3. Verifique se o App tem acesso a:
   - ✅ Commerce Manager
   - ✅ Seu catálogo de produtos
   - ✅ Sua página do Facebook

### 5. Testar Novamente

1. Limpe os anúncios antigos (botão "Limpar Todos")
2. Crie um novo anúncio
3. Aguarde a resposta
4. Se der erro, clique em "Diagnosticar" novamente

---

## 🔍 Códigos de Erro Comuns:

### 190 - Invalid OAuth 2.0 Access Token
**Causa:** Token inválido ou expirado  
**Solução:** Gerar novo token (passo 2)

### 10 - Application does not have permission
**Causa:** App sem acesso ao catálogo  
**Solução:** Adicionar App ao Commerce Manager (passo 4)

### 200 - Permissions error
**Causa:** Token sem permissão `catalog_management`  
**Solução:** Gerar token com permissões corretas (passo 2)

### 100 - Invalid parameter
**Causa:** Campos obrigatórios faltando ou formato errado  
**Solução:** Verificar se está usando a API correta (Marketplace Partner Item API)

---

## 📋 Checklist de Verificação:

- [ ] Token de acesso é válido e não expirou
- [ ] Token tem permissão `catalog_management`
- [ ] Catalog ID está correto
- [ ] App está conectado ao Commerce Manager
- [ ] App tem acesso ao catálogo
- [ ] Usando endpoint correto: `/items_batch`
- [ ] Enviando `item_type: PRODUCT_ITEM`
- [ ] Produto tem todos os campos obrigatórios:
  - [ ] `id`
  - [ ] `title`
  - [ ] `description`
  - [ ] `price` (formato: "4999.00 BRL")
  - [ ] `image_link`
  - [ ] `link`
  - [ ] `condition`
  - [ ] `brand`
  - [ ] `availability`

---

## 🆘 Ainda não funciona?

1. Execute o **Diagnóstico** no admin/anuncios
2. Copie TODAS as mensagens de erro
3. Verifique os logs no Supabase:
   ```sql
   SELECT * FROM facebook_sync_log 
   WHERE status = 'erro' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
4. Verifique se o produto existe no Commerce Manager
5. Tente criar manualmente no Commerce Manager para comparar

---

## 📚 Links Úteis:

- [Facebook Developers - Graph API Explorer](https://developers.facebook.com/tools/explorer)
- [Commerce Manager](https://business.facebook.com/commerce_manager)
- [Business Settings](https://business.facebook.com/settings)
- [Marketplace Partner API Docs](https://developers.facebook.com/docs/marketing-api/catalog/guides/marketplace)
- [Permissões do Facebook](https://developers.facebook.com/docs/permissions/reference)

---

## ✅ Tudo Funcionando?

Após resolver:
1. Teste criar um anúncio
2. Verifique o status: "pending_review"
3. Aguarde aprovação (24-48h)
4. Status muda para "active"
5. Produto aparece no Marketplace público! 🎉
