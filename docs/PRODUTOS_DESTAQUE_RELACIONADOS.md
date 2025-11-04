# 🎯 Produtos em Destaque - Produtos Relacionados

## 📋 Visão Geral

Este sistema permite configurar **manualmente** os produtos relacionados que aparecem nas páginas dos produtos em destaque. Quando um usuário clica em um produto do banner, ele vai para a página desse produto, e lá aparecem produtos relacionados configuráveis.

## 🔄 Como Funciona

### Fluxo do Sistema

1. **Admin/Banners** → Configura quais produtos aparecem no banner de destaque
2. **Sistema automático** → Produtos do banner ganham a categoria virtual "🎯 Produtos em Destaque"
3. **Admin/Categorias** → Configura produtos relacionados para essa categoria virtual
4. **Site público** → Quando usuário clica em produto do banner, vê os produtos relacionados configurados

### Categoria Virtual "🎯 Produtos em Destaque"

- **ID fixo**: `00000000-0000-0000-0000-000000000001`
- **Visibilidade**: NÃO aparece no site público (`ativo = false`)
- **Função**: Agrupa produtos do banner para configuração de produtos relacionados
- **Automático**: Produtos ganham essa categoria ao virar destaque no banner

## ✨ Funcionalidades

### 1. **Configuração Global**
Configure produtos relacionados uma única vez para **todos** os produtos em destaque:

- ✅ **Seleção Automática**: Sistema escolhe produtos inteligentes automaticamente
- ✅ **Seleção Manual**: Escolha exatamente quais produtos aparecer
- ✅ **Range de Desconto**: Defina min/max (ex: 3% a 7%)
- ✅ **Aplicação Única**: Um clique configura todos os produtos

### 2. **Configuração Individual**
Configure produtos relacionados **produto por produto**:

- ✅ **Controle Total**: Cada produto em destaque tem sua própria config
- ✅ **Flexibilidade**: Alguns automático, outros manual
- ✅ **Desconto Customizado**: Cada produto pode ter seu próprio range
- ✅ **Interface Visual**: Veja todos os produtos em destaque e configure um a um

## 🚀 Como Usar

### Passo 1: Adicionar Produtos ao Banner

1. Vá em **Admin → Banners**
2. Adicione produtos ao banner de destaque
3. Sistema automaticamente atribui categoria virtual a esses produtos

### Passo 2: Configurar Produtos Relacionados

1. Vá em **Admin → Categorias**
2. Localize o card **"🎯 Produtos em Destaque - Produtos Relacionados"**
3. Clique em **"Configurar Produtos Relacionados dos Destaques"**

### Opção A: Configuração Global

**Use quando:** Todos os produtos em destaque devem ter os mesmos produtos relacionados

1. Na aba **"Configuração Global"**
2. Escolha entre:
   - **Automático**: Liga o toggle "Seleção Automática"
   - **Manual**: Desliga o toggle e selecione produtos
3. Defina o **Range de Desconto**:
   - Desconto Mínimo (ex: 3%)
   - Desconto Máximo (ex: 7%)
4. Clique em **"Salvar Configuração Global"**

✅ Todos os produtos em destaque usarão essa config!

### Opção B: Configuração Individual

**Use quando:** Cada produto em destaque deve ter produtos relacionados diferentes

1. Na aba **"Por Produto"**
2. Veja lista de todos os produtos em destaque
3. Para cada produto:
   - Clique em **"Configurar"**
   - Toggle "Seleção Automática" (on/off)
   - Se manual, selecione produtos específicos
   - Defina range de desconto individual
   - Clique em **"Salvar"**

✅ Cada produto terá sua própria configuração!

## 📊 Interface do Modal

### Tab "Configuração Global"

```
┌─────────────────────────────────────────┐
│ 🎯 Aplicar para Todos os Produtos       │
│                                         │
│ [✓] Seleção Automática                 │
│                                         │
│ Desconto Min: [3%]  Max: [7%]          │
│                                         │
│ ☐ Produto 1                            │
│ ☐ Produto 2                            │
│ ☐ Produto 3                            │
│                                         │
│ [Salvar Configuração Global]           │
└─────────────────────────────────────────┘
```

### Tab "Por Produto"

```
┌─────────────────────────────────────────┐
│ 📱 iPhone 15 Pro Max          [Config] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│   [✓] Seleção Automática               │
│   Min: [5%]  Max: [10%]                │
│   ☐ Produto A                          │
│   ☐ Produto B                          │
│   [Salvar]                             │
├─────────────────────────────────────────┤
│ 📱 iPhone 14                  [Config] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│   [ ] Seleção Automática               │
│   Min: [3%]  Max: [7%]                 │
│   ☑ Produto C                          │
│   ☑ Produto D                          │
│   [Salvar]                             │
└─────────────────────────────────────────┘
```

## 🎨 Comportamento no Site

### Página do Produto em Destaque

Quando usuário clica em produto do banner:

1. Vai para `/produto/iphone-15-pro-max`
2. Vê detalhes do produto
3. **Rola para baixo** → Seção "Produtos Relacionados"
4. Aparecem produtos configurados (automático ou manual)
5. Com desconto aleatório dentro do range definido

### Exemplo Visual

```
┌─────────────────────────────────────────────┐
│ 📱 iPhone 15 Pro Max 256GB                  │
│ R$ 8.999,00                                 │
│ [Adicionar ao Carrinho]                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🎯 Produtos Relacionados                    │
├─────────────┬─────────────┬─────────────────┤
│ Cabo USB-C  │ AirPods Pro │ Capinha Preta   │
│ R$ 59,90    │ R$ 1.899,00 │ R$ 89,90        │
│ -5% 56,40   │ -6% 1.785   │ -4% 86,30       │
└─────────────┴─────────────┴─────────────────┘
```

## 🗄️ Estrutura do Banco de Dados

### Categoria Virtual

```sql
categorias
├── id: '00000000-0000-0000-0000-000000000001'
├── nome: '🎯 Produtos em Destaque'
├── slug: 'produtos-destaque-virtual'
├── ativo: false (não aparece no site)
└── ordem: 999
```

### Configuração de Produtos Relacionados

```sql
categoria_produtos_relacionados
├── categoria_id: UUID (FK → categorias)
├── auto_select: BOOLEAN
├── produtos_selecionados: UUID[]
├── desconto_min: DECIMAL(5,2)
└── desconto_max: DECIMAL(5,2)
```

### Trigger Automático

```sql
-- Quando produto é adicionado ao banner (produtos_destaque)
-- Sistema automaticamente:
UPDATE produtos 
SET categoria_id = '00000000-0000-0000-0000-000000000001'
WHERE id = produto_do_banner;
```

## ⚙️ Server Actions

```typescript
// Buscar config global
getConfigProdutosRelacionadosDestaque()

// Salvar config global
updateConfigProdutosRelacionadosDestaque(
  autoSelect, 
  produtosSelecionados, 
  descontoMin, 
  descontoMax
)

// Listar produtos em destaque
listarProdutosEmDestaque()

// Configurar produto individual
updateConfigProdutoDestaqueIndividual(
  produtoId,
  autoSelect,
  produtosSelecionados,
  descontoMin,
  descontoMax
)

// Buscar produtos disponíveis
buscarProdutosParaRelacionados()
```

## 🔒 Segurança e Validações

✅ **Desconto válido**: Min não pode ser maior que Max  
✅ **Produtos únicos**: Não permite duplicatas  
✅ **Categoria oculta**: Não aparece no site público  
✅ **Revalidação**: Cache limpo automaticamente  
✅ **Tipo seguro**: TypeScript em todas as ações  

## 💡 Dicas de Uso

### Quando Usar Configuração Global

✅ Produtos em destaque são similares (todos iPhones)  
✅ Mesma estratégia de venda para todos  
✅ Quer manter consistência  
✅ Menos trabalho de configuração  

### Quando Usar Configuração Individual

✅ Produtos em destaque são diferentes (iPhone, iPad, AirPods)  
✅ Cada produto precisa de relacionados específicos  
✅ Descontos diferentes por categoria  
✅ Máximo controle sobre cada produto  

### Estratégia Recomendada

1. **Comece com Global** → Configure rápido para todos
2. **Teste no site** → Veja como fica
3. **Ajuste Individualmente** → Se algum produto precisa ser diferente
4. **Monitore Conversão** → Veja quais produtos relacionados vendem mais

## 🚨 Importante

⚠️ **Produtos do Banner**: Apenas produtos configurados no banner terão essa funcionalidade  
⚠️ **Categoria Virtual**: NÃO deletar a categoria "Produtos em Destaque"  
⚠️ **Conflito**: Config individual sobrescreve config global  
⚠️ **Cache**: Após salvar, pode demorar alguns segundos para atualizar  

## 📱 Mobile Friendly

✅ Interface responsiva  
✅ Checkboxes grandes  
✅ ScrollArea otimizada  
✅ Tabs mobile-friendly  
✅ Inputs adaptáveis  

## 🔧 Setup SQL

Execute no Supabase SQL Editor:

```sql
-- Arquivo: migrations/20251103_create_featured_category.sql
-- Cria categoria virtual e trigger automático
```

## 📈 Próximos Passos

Sugestões de melhorias:
- [ ] Analytics de cliques em produtos relacionados
- [ ] A/B Testing de configurações
- [ ] Sugestões inteligentes baseadas em vendas
- [ ] Histórico de configurações
- [ ] Importar/Exportar configurações

---

**Desenvolvido para Leo iPhone** 🍎
