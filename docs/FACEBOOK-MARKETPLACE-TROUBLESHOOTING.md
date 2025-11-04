# 🔍 Guia: Por que meus produtos não aparecem no Facebook Marketplace?

> **Situação**: Produto está no catálogo do Commerce Manager há 3+ dias mas não aparece no Marketplace público

---

## 📋 Checklist Completo de Diagnóstico

### 1. ✅ Catálogo Conectado ao Marketplace

**O que verificar:**
- Seu catálogo precisa estar configurado para vender no Marketplace

**Como verificar:**
1. Acesse: https://business.facebook.com/commerce_manager
2. Clique no seu catálogo
3. Vá em **Configurações** > **Vendas**
4. Verifique se **"Facebook Marketplace"** está **ATIVADO**

**❌ Se estiver desativado:**
- Clique em "Editar"
- Marque "Facebook Marketplace"  
- Salve as alterações
- Aguarde 24-48h para produtos serem processados

---

### 2. ✅ Produto Publicado (Não em Rascunho)

**O que verificar:**
- Produtos em "Draft" (rascunho) não aparecem no Marketplace

**Como verificar:**
1. Abra o produto no Commerce Manager
2. Veja o status no topo da página
3. Deve estar **"Active"** ou **"Ativo"**

**❌ Se estiver "Draft":**
- Clique no botão **"Publish"** ou **"Publicar"**
- Confirme a publicação
- Aguarde processamento (alguns minutos)

---

### 3. ✅ Disponibilidade Configurada

**O que verificar:**
- Campo `availability` deve estar como "in stock"

**Como verificar:**
1. Abra o produto no Commerce Manager
2. Procure o campo **"Availability"** ou **"Disponibilidade"**
3. Deve estar **"In Stock"** (Em estoque)

**❌ Se estiver "Out of Stock":**
- Edite o produto
- Altere para "In Stock"
- Salve

---

### 4. ✅ Campos Obrigatórios Preenchidos

**Campos OBRIGATÓRIOS do Facebook:**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `title` | ✅ SIM | Título do produto |
| `description` | ✅ SIM | Descrição detalhada |
| `price` | ✅ SIM | Preço em BRL |
| `image_link` | ✅ SIM | URL da imagem principal |
| `availability` | ✅ SIM | in stock / out of stock |
| `condition` | ✅ SIM | new / refurbished / used |
| `brand` | ⚠️ Recomendado | Marca (ex: Apple) |
| `google_product_category` | ⚠️ Recomendado | Categoria do produto |

**Como verificar:**
- No Commerce Manager, abra o produto
- Vá na aba **"Detalhes"** ou **"Details"**
- Verifique se todos os campos estão preenchidos

**Nosso sistema já envia todos esses campos!** 
Se algo estiver faltando, é erro no momento da sincronização.

---

### 5. ⏳ Aguardar Aprovação (24-72h)

**Tempo de análise:**
- **Produtos novos**: 24-48 horas
- **Primeira vez no catálogo**: até 72 horas  
- **Produtos editados**: 12-24 horas

**Status durante análise:**
- Status no sistema: "Anunciado"
- Status no Facebook: "Pending Review" ou "Em análise"
- Badge no admin: "🟡 Em análise"

**O que fazer:**
- Aguardar pacientemente
- Não reenviar o produto (pode atrasar mais)
- Verificar se não há erros no Commerce Manager

---

### 6. 📋 Políticas do Marketplace

**Seu produto DEVE:**
- ✅ Ser um item permitido (iPhones são permitidos!)
- ✅ Ter imagens de qualidade (mínimo 500x500px, recomendado 1200x1200px)
- ✅ Ter descrição honesta e completa
- ✅ Ter preço justo e em linha com o mercado
- ✅ Seguir as políticas de comércio do Facebook

**Seu produto NÃO PODE:**
- ❌ Usar palavras como "réplica", "falsificado", "cópia"
- ❌ Ter imagens de baixa qualidade ou com marcas d'água
- ❌ Ter preço muito acima ou abaixo do mercado
- ❌ Violar direitos autorais nas imagens
- ❌ Ter informações enganosas

**Links importantes:**
- Políticas: https://www.facebook.com/policies/commerce
- Itens proibidos: https://www.facebook.com/policies/commerce/prohibited_items

---

## 🔧 Como Diagnosticar no Admin

### No painel admin/anuncios:

1. **Coluna "Status Sistema":**
   - 🟢 Anunciado = Enviado para o Facebook ✅
   - 🔴 Erro = Problema no envio ❌
   - ⚪ Pendente = Aguardando envio

2. **Coluna "Status Marketplace":**
   - 🔵 No Marketplace = Produto ATIVO e público ✅
   - 🟡 Em análise = Aguardando aprovação ⏳
   - ⚪ Não sincronizado = Ainda não foi enviado ❌

3. **Clique no badge "Status Marketplace":**
   - Abre o Commerce Manager
   - Mostra status detalhado
   - Mostra motivo se rejeitado

4. **Menu de ações (⋮):**
   - "Gerenciar no Facebook" → Ver status completo
   - "Ver no Marketplace" → Ver página pública (só funciona se ativo)

---

## 🎯 Dicas para Aprovação Rápida

### Imagens:
- ✅ Use fotos de alta qualidade (1200x1200px ou maior)
- ✅ Fundo limpo (branco ou neutro)
- ✅ Produto bem iluminado
- ✅ Múltiplos ângulos
- ❌ Evite marcas d'água
- ❌ Evite montagens ou edições pesadas

### Título:
- ✅ Claro e descritivo: "iPhone 14 Pro 256GB Azul Seminovo"
- ✅ Inclua modelo, capacidade, cor
- ❌ Evite CAPS LOCK
- ❌ Evite emojis excessivos
- ❌ Evite caracteres especiais

### Descrição:
- ✅ Detalhada (mínimo 100 caracteres)
- ✅ Mencione condição, acessórios, garantia
- ✅ Seja honesto sobre o estado
- ❌ Não copie/cole descrições genéricas
- ❌ Não use linguagem enganosa

### Preço:
- ✅ Justo e competitivo
- ✅ Em linha com o mercado
- ❌ Não superfature
- ❌ Não subprecifique (pode parecer fraude)

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: "Produto em análise há mais de 3 dias"

**Possíveis causas:**
- Facebook está com atraso nas análises
- Produto precisa de análise manual
- Há pendências no catálogo

**Solução:**
1. Abra o produto no Commerce Manager
2. Veja se há mensagens ou avisos
3. Se nada aparecer, aguarde mais 24h
4. Se persistir, entre em contato com suporte do Facebook

---

### Problema 2: "Produto rejeitado"

**O que fazer:**
1. Abra o produto no Commerce Manager
2. Veja o **motivo da rejeição** (geralmente aparece em vermelho)
3. Corrija o problema (imagem, descrição, preço, etc)
4. Salve as alterações
5. Produto será reanalisado automaticamente

**Motivos comuns de rejeição:**
- Imagem de baixa qualidade
- Descrição muito curta ou genérica
- Preço suspeito
- Categoria incorreta
- Violação de políticas

---

### Problema 3: "Status sempre pendente"

**Causa:**
- Produto não foi enviado ao Facebook
- Erro na sincronização

**Solução:**
1. No admin/anuncios, veja a coluna "Status Sistema"
2. Se estiver "Erro", clique em "Gerenciar no Facebook"
3. Veja a mensagem de erro
4. Corrija o problema no produto
5. Tente sincronizar novamente (ou remova e crie novo anúncio)

---

### Problema 4: "Link do Marketplace não funciona"

**Causa:**
- Produto ainda não está público
- Produto está em análise
- Produto foi rejeitado

**Solução:**
- Use o link **"Gerenciar no Facebook"** (sempre funciona)
- Verifique o status no Commerce Manager
- Link do Marketplace só funciona quando produto está **ATIVO**

---

## 📊 Status Esperados por Fase

### Fase 1: Recém criado (0-30min)
- Status Sistema: 🟡 Pendente
- Status Marketplace: ⚪ Não sincronizado
- **O que fazer:** Aguardar envio automático

### Fase 2: Enviado (30min-2h)
- Status Sistema: 🟢 Anunciado
- Status Marketplace: 🟡 Em análise
- **O que fazer:** Aguardar análise do Facebook

### Fase 3: Em análise (24-72h)
- Status Sistema: 🟢 Anunciado
- Status Marketplace: 🟡 Em análise
- **O que fazer:** Aguardar aprovação

### Fase 4: Aprovado (após análise)
- Status Sistema: 🟢 Anunciado
- Status Marketplace: 🔵 No Marketplace
- **O que fazer:** Nada! Produto está no ar ✅

### Fase 5: Rejeitado (se houver problema)
- Status Sistema: 🔴 Erro
- Status Marketplace: ❌ Erro
- **O que fazer:** Ver motivo e corrigir

---

## 🔗 Links Úteis

### Commerce Manager:
https://business.facebook.com/commerce_manager

### Seu Catálogo:
https://business.facebook.com/commerce_manager/catalogs/{seu_catalog_id}

### Políticas:
https://www.facebook.com/policies/commerce

### Suporte Facebook:
https://www.facebook.com/business/help

---

## 💡 Atalhos no Admin

Na página **admin/anuncios**:

1. **Botão "Produtos não aparecem no Marketplace?"**
   → Mostra este guia completo

2. **Badge "Status Marketplace" (clicável)**
   → Abre Commerce Manager do produto

3. **Menu ⋮ > "Gerenciar no Facebook"**
   → Abre Commerce Manager (sempre funciona)

4. **Menu ⋮ > "Ver no Marketplace"**
   → Abre página pública (só se ativo)

---

## ✅ Resumo: O que fazer AGORA

Se seus produtos estão no catálogo há 3+ dias e não aparecem:

1. ✅ Verifique se catálogo está conectado ao Marketplace
2. ✅ Confirme que produtos estão "Active" (não "Draft")
3. ✅ Verifique campo "availability" = "in stock"
4. ✅ Confira todos os campos obrigatórios
5. ✅ Abra produto no Commerce Manager e veja se há mensagens
6. ✅ Se tudo estiver OK, aguarde mais 24h
7. ✅ Se persistir, entre em contato com suporte do Facebook

---

**Documento criado em:** 2025-11-01  
**Última atualização:** 2025-11-01
