# 🔄 Sistema de Sincronização Automática (Polling)

## 📦 O que foi implementado

Sistema completo de sincronização automática usando **polling inteligente** para que qualquer operação feita no painel administrativo seja refletida automaticamente para os usuários no catálogo e páginas de produtos, **sem necessidade de recarregar a página**.

> **Por que Polling e não Realtime?**
> O Supabase Realtime requer acesso ao "Database Replication" que está em Early Access fechado. Como alternativa, implementamos polling (verificação periódica) que funciona perfeitamente e não requer configuração extra no Supabase.

---

## 🚀 Como funciona

O sistema faz **verificações periódicas** (a cada 2-3 segundos) no banco de dados para detectar mudanças e atualizar a UI automaticamente.

### Fluxo de Sincronização:

```
Admin cria/edita/deleta produto
         ↓
Dados salvos no PostgreSQL
         ↓
Polling detecta mudança (2-3s)
         ↓
Frontend busca dados atualizados
         ↓
UI atualiza automaticamente
```

---

## 📁 Arquivos Criados

### Hooks Customizados

#### `hooks/use-polling-taxas.ts`
Hook para sincronização de taxas via polling.

**Funcionamento:**
- Verifica mudanças a cada **2 segundos**
- Compara hash dos dados (ativo + taxas + updated_at)
- Chama callback apenas quando detectar mudança

**Uso:**
```typescript
usePollingTaxas({
  enabled: true,
  interval: 2000, // 2 segundos
  onUpdate: (config) => {
    setCalculadoraAtiva(config.ativo)
    setTaxas(config.taxas)
  },
})
```

#### `hooks/use-polling-produtos.ts`
Hook para sincronização de produtos via polling.

**Funcionamento:**
- Verifica mudanças a cada **3 segundos**
- Compara lista de IDs + timestamps
- Busca produtos completos quando detectar mudança

**Uso:**
```typescript
usePollingProdutos({
  enabled: true,
  interval: 3000, // 3 segundos
  onUpdate: (produtos) => {
    setProdutos(produtos)
    recarregarCatalogo()
  },
})
```

---

## 🎯 Integrações

### 1. Catálogo (`app/(public)/page.tsx`)

**Sincronização de produtos:**
- ✅ Novo produto criado → aparece automaticamente (em ~3s)
- ✅ Produto editado → informações atualizadas automaticamente
- ✅ Produto desativado/deletado → removido do catálogo
- ✅ Respeitam filtros ativos (categoria, condição, busca)
- ✅ Evita duplicatas e produtos em destaque

**Intervalo:** 3 segundos

**Comportamento:**
```typescript
// A cada 3 segundos, verifica:
- Lista de produtos mudou?
  → SIM: Busca produtos completos e atualiza UI
  → NÃO: Não faz nada
```

### 2. Página do Produto (`app/(public)/produto/[slug]/page.tsx`)

**Sincronização de produto:**
- ✅ Produto editado → dados atualizados (preço, nome, fotos, etc.)
- ✅ Produto desativado → redireciona para catálogo
- ✅ Produto deletado → redireciona para catálogo

**Intervalo:** 3 segundos

**Sincronização de taxas:**
- ✅ Admin ativa calculadora → aparece automaticamente
- ✅ Admin desativa calculadora → desaparece automaticamente
- ✅ Admin muda taxas → valores recalculados automaticamente

**Intervalo:** 2 segundos

**Comportamento:**
```typescript
// A cada 3 segundos, verifica produto:
- updated_at mudou?
  → SIM: Atualiza produto na UI
  → NÃO: Não faz nada

// A cada 2 segundos, verifica taxas:
- Configuração mudou (ativo ou taxas)?
  → SIM: Atualiza calculadora
  → NÃO: Não faz nada
```

### 3. Calculadora de Parcelas (`components/public/calculadora-parcelas.tsx`)

**Sincronização via props:**
- ✅ Recebe `taxas` da página pai
- ✅ Recalcula automaticamente quando props mudam
- ✅ Não precisa de polling próprio (otimização)

---

## 🔧 Funcionalidades

### Para o Admin
- ✅ Criar produto → aparece no catálogo em ~3 segundos
- ✅ Editar produto → mudanças refletidas em ~3 segundos
- ✅ Editar preço → atualizado em ~3 segundos
- ✅ Desativar produto → some do catálogo em ~3 segundos
- ✅ Deletar produto → removido em ~3 segundos
- ✅ Ativar calculadora → aparece em todas as páginas em ~2 segundos
- ✅ Mudar taxas → valores recalculados em ~2 segundos

### Para o Usuário
- ✅ Navega no catálogo → vê produtos atualizados automaticamente
- ✅ Visualiza produto → preços/fotos/descrições sempre atualizados
- ✅ Vê calculadora → taxas sempre sincronizadas com o admin
- ✅ Sem necessidade de F5 ou reload de página
- ✅ Experiência moderna e fluida

---

## 📊 Exemplo de Uso

### Cenário 1: Admin cria novo produto

```
Timeline:
00:00 - Admin clica em "Salvar Produto" no painel
00:01 - Produto salvo no PostgreSQL
00:03 - Polling detecta novo produto
00:04 - Frontend busca dados completos
00:05 - Produto aparece no catálogo automaticamente
```

**Tempo total: ~5 segundos** ⚡

### Cenário 2: Admin muda preço

```
Timeline:
00:00 - Admin edita preço de R$ 2.800 para R$ 2.600
00:01 - UPDATE executado no PostgreSQL
00:03 - Polling detecta mudança no updated_at
00:04 - Frontend busca produto atualizado
00:05 - Preço muda de R$ 2.800 → R$ 2.600 automaticamente
00:06 - Calculadora recalcula parcelas automaticamente
```

**Tempo total: ~6 segundos** ⚡

### Cenário 3: Admin ativa calculadora

```
Timeline:
00:00 - Admin ativa toggle em /admin/taxas
00:01 - UPDATE em configuracoes_taxas
00:02 - Polling detecta mudança
00:03 - Frontend atualiza estado
00:04 - Calculadora aparece em todas as páginas abertas
```

**Tempo total: ~4 segundos** ⚡

---

## ⚡ Performance

### Otimizações Implementadas

1. **Hash comparison** - Só busca dados se hash mudou
2. **Debouncing natural** - Intervalos de 2-3s evitam sobrecarga
3. **Queries eficientes** - Busca apenas campos necessários para comparação
4. **Cleanup automático** - Remove intervals ao desmontar componentes
5. **Refs para memoização** - Evita re-renders desnecessários

### Impacto no Bundle

- `use-polling-produtos.ts`: ~2KB
- `use-polling-taxas.ts`: ~1.5KB
- **Total adicional: ~3.5KB**

### Impacto no Banco de Dados

**Carga por usuário:**
- Catálogo: ~1 query SELECT a cada 3s = **20 queries/minuto**
- Página produto: ~2 queries SELECT a cada 2-3s = **30 queries/minuto**

**Total:** ~50 queries/minuto por usuário ativo

> **Nota:** Supabase suporta milhares de queries por segundo. 50 queries/minuto é desprezível.

---

## 🔐 Segurança

### Row Level Security (RLS)

O polling respeita as políticas RLS configuradas:

```sql
-- Produtos: Leitura pública
CREATE POLICY "Leitura pública" ON produtos FOR SELECT
  USING (ativo = true AND deleted_at IS NULL);

-- Taxas: Leitura pública
CREATE POLICY "Leitura pública" ON configuracoes_taxas FOR SELECT
  USING (true);
```

### Validações

- ✅ Apenas produtos ativos são exibidos
- ✅ Produtos deletados removidos imediatamente
- ✅ Redirecionamento automático se produto não existir
- ✅ Comparação por hash evita updates desnecessários

---

## 🧪 Como Testar

### Teste 1: Criação de Produto Automática

1. Abra o catálogo (`http://localhost:3000`)
2. Em outra aba, crie um novo produto no admin
3. **Aguarde ~5 segundos**
4. ✅ **Resultado esperado:** Produto aparece no catálogo automaticamente

### Teste 2: Edição de Preço

1. Abra uma página de produto (`http://localhost:3000/produto/iphone-15-pro`)
2. Em outra aba, edite o preço do produto no admin
3. **Aguarde ~5 segundos**
4. ✅ **Resultado esperado:** Preço atualiza automaticamente

### Teste 3: Ativação da Calculadora

1. Abra uma página de produto
2. Abra o Console (F12) para ver logs
3. Em outra aba, ative o toggle em `/admin/taxas` e salve
4. **Aguarde ~3 segundos**
5. ✅ **Resultado esperado:**
   - Console mostra: `[ProdutoPage] Taxas atualizadas via polling`
   - Calculadora aparece automaticamente

### Teste 4: Mudança de Taxas

1. Abra uma página de produto com calculadora expandida
2. Anote o valor da parcela 12x
3. Mude a taxa do 12x no admin (ex: de 10.3% para 12.0%)
4. **Aguarde ~3 segundos**
5. ✅ **Resultado esperado:** Valores recalculados automaticamente

### Teste 5: Desativação de Produto

1. Abra a página de um produto
2. Desative o produto no admin
3. **Aguarde ~5 segundos**
4. ✅ **Resultado esperado:** Redireciona para catálogo automaticamente

---

## 🐛 Troubleshooting

### Atualizações não aparecem

**Sintomas:** Mudanças não aparecem mesmo após aguardar

**Soluções:**
1. ✅ Abra o Console (F12) e procure por erros
2. ✅ Verifique se vê logs de `[usePollingTaxas]` ou `[usePollingProdutos]`
3. ✅ Confirme que salvou no admin (veja toast de sucesso)
4. ✅ Aguarde pelo menos 5 segundos

### Console mostra erros de permissão

**Sintomas:** `Error: permission denied for table produtos`

**Soluções:**
1. ✅ Verifique políticas RLS no Supabase
2. ✅ Execute:
   ```sql
   CREATE POLICY "Leitura pública" ON produtos FOR SELECT
     USING (ativo = true AND deleted_at IS NULL);
   ```

### Muitas queries no banco

**Sintomas:** Preocupação com carga no banco

**Solução:**
- ✅ Ajuste o intervalo nos hooks (ex: 5 ou 10 segundos)
- ✅ Em `use-polling-taxas.ts`, mude `interval: 2000` para `interval: 5000`
- ✅ Em `use-polling-produtos.ts`, mude `interval: 3000` para `interval: 5000`

---

## ⚙️ Configuração dos Intervalos

Você pode ajustar os intervalos de verificação:

### Para Taxas (mais crítico):
```typescript
// app/(public)/produto/[slug]/page.tsx
usePollingTaxas({
  enabled: true,
  interval: 2000, // ← Mude aqui (em milissegundos)
  onUpdate: handleTaxasUpdate,
})
```

### Para Produtos:
```typescript
// app/(public)/page.tsx
usePollingProdutos({
  enabled: true,
  interval: 3000, // ← Mude aqui (em milissegundos)
  onUpdate: handleProdutosUpdate,
})
```

**Recomendações:**
- **2-3 segundos:** Ideal para experiência em tempo real
- **5 segundos:** Bom equilíbrio entre UX e performance
- **10 segundos:** Menos carga, mas atualizações mais lentas

---

## 📝 Notas Técnicas

### Vantagens do Polling

✅ **Simples** - Não requer configuração no Supabase
✅ **Confiável** - Funciona sempre, sem dependências externas
✅ **Debugável** - Fácil de testar e diagnosticar
✅ **Flexível** - Intervalos ajustáveis por caso de uso

### Desvantagens do Polling

❌ **Delay de 2-5s** - Não é instantâneo (vs Realtime ~100ms)
❌ **Queries constantes** - Mais carga no banco (mas negligível)
❌ **Bateria mobile** - Pode consumir mais bateria (mínimo)

### Quando Migrar para Realtime?

Se no futuro o Supabase Realtime ficar disponível para você:
1. Substitua `use-polling-*` por `use-realtime-*`
2. Habilite Database Replication
3. Aproveite latência de ~100ms

Os arquivos de realtime já estão prontos em `hooks/use-realtime-*.ts`!

---

## ✅ Checklist de Implementação

- [x] Hook `use-polling-produtos.ts` criado
- [x] Hook `use-polling-taxas.ts` criado
- [x] Integrado no catálogo (página principal)
- [x] Integrado na página do produto
- [x] Calculadora sincroniza via props
- [x] Callbacks memoizados com useCallback
- [x] Cleanup de intervals implementado
- [x] Validações de produtos ativos/deletados
- [x] Redirecionamento automático quando produto é removido
- [x] Logs de debug para troubleshooting
- [x] Documentação completa criada

---

## 🎯 Próximas Melhorias (Opcional)

- [ ] Adicionar toast de notificação "Produto atualizado!"
- [ ] Indicador visual de "sincronizando..."
- [ ] Pausar polling quando aba não está ativa (Page Visibility API)
- [ ] Aumentar intervalo para 10s em mobile (economia de bateria)
- [ ] Migrar para WebSockets quando Realtime ficar disponível

---

**Implementado com ❤️ - Sistema de sincronização totalmente funcional! 🎉**

> **Funciona sem configuração extra no Supabase!** ✨
