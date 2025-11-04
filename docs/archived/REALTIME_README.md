# 🔄 Sistema de Sincronização em Tempo Real

## 📦 O que foi implementado

Sistema completo de sincronização em tempo real usando **Supabase Realtime** para que qualquer operação feita no painel administrativo seja refletida instantaneamente para os usuários no catálogo e páginas de produtos, **sem necessidade de recarregar a página**.

---

## 🚀 Como funciona

O sistema utiliza **PostgreSQL LISTEN/NOTIFY** através do Supabase Realtime para escutar mudanças nas tabelas do banco de dados e atualizar a UI automaticamente.

### Fluxo de Sincronização:

```
Admin cria/edita/deleta produto
         ↓
PostgreSQL dispara evento
         ↓
Supabase Realtime notifica
         ↓
Frontend recebe atualização
         ↓
UI atualiza automaticamente
```

---

## 📁 Arquivos Criados

### Hooks Customizados

#### `hooks/use-realtime-produtos.ts`
Hook para sincronização de produtos em tempo real.

**Eventos escutados:**
- `INSERT` - Quando um novo produto é criado
- `UPDATE` - Quando um produto é editado
- `DELETE` - Quando um produto é deletado (soft delete)

**Callbacks:**
```typescript
useRealtimeProdutos({
  enabled: true,
  onInsert: (produto) => { /* adicionar à lista */ },
  onUpdate: (produto) => { /* atualizar na lista */ },
  onDelete: (id) => { /* remover da lista */ },
})
```

#### `hooks/use-realtime-taxas.ts`
Hook para sincronização das configurações de taxas de parcelamento.

**Eventos escutados:**
- `INSERT` - Quando uma nova configuração é criada
- `UPDATE` - Quando a configuração é atualizada
- `DELETE` - Quando a configuração é deletada

**Callbacks:**
```typescript
useRealtimeTaxas({
  enabled: true,
  onUpdate: (config) => { /* atualizar taxas e status ativo */ },
})
```

---

## 🎯 Integrações

### 1. Catálogo (`app/(public)/page.tsx`)

**Sincronização de produtos:**
- ✅ Novo produto criado → aparece instantaneamente no catálogo
- ✅ Produto editado → informações atualizadas em tempo real
- ✅ Produto desativado/deletado → removido do catálogo
- ✅ Respeitam filtros ativos (categoria, condição, busca)
- ✅ Evita duplicatas e produtos em destaque

**Comportamento:**
```typescript
// Produto inserido
if (produto.ativo && !produto.deleted_at && !emDestaque) {
  adicionarAoCatalogo(produto)
}

// Produto atualizado
if (produto.ativo) {
  atualizarNoCatalogo(produto)
} else {
  removerDoCatalogo(produto)
}

// Produto deletado
removerDoCatalogo(produtoId)
```

### 2. Página do Produto (`app/(public)/produto/[slug]/page.tsx`)

**Sincronização de produtos:**
- ✅ Produto editado → dados atualizados (preço, nome, fotos, etc.)
- ✅ Produto desativado → redireciona para catálogo
- ✅ Produto deletado → redireciona para catálogo

**Sincronização de taxas:**
- ✅ Admin ativa calculadora → aparece instantaneamente
- ✅ Admin desativa calculadora → desaparece instantaneamente
- ✅ Admin muda taxas → valores recalculados em tempo real

**Comportamento:**
```typescript
// Produto atualizado
if (produto.slug === slugAtual) {
  if (!produto.ativo || produto.deleted_at) {
    window.location.href = '/catalogo' // Redireciona
  } else {
    atualizarProduto(produto) // Atualiza UI
  }
}

// Taxas atualizadas
setCalculadoraAtiva(config.ativo)
setTaxas(config.taxas)
// A calculadora recalcula automaticamente via props
```

### 3. Calculadora de Parcelas (`components/public/calculadora-parcelas.tsx`)

**Sincronização via props:**
- ✅ Recebe `taxas` da página pai
- ✅ Recalcula automaticamente quando props mudam
- ✅ Não precisa de hook próprio (otimização)

---

## 🔧 Funcionalidades

### Para o Admin
- ✅ Criar produto → aparece imediatamente no catálogo público
- ✅ Editar produto → mudanças refletidas instantaneamente
- ✅ Desativar produto → some do catálogo em tempo real
- ✅ Deletar produto → removido instantaneamente
- ✅ Ativar calculadora → aparece em todas as páginas de produtos
- ✅ Mudar taxas → valores recalculados em tempo real

### Para o Usuário
- ✅ Navega no catálogo → vê produtos atualizados em tempo real
- ✅ Visualiza produto → preços/fotos/descrições sempre atualizados
- ✅ Vê calculadora → taxas sempre sincronizadas com o admin
- ✅ Sem necessidade de F5 ou reload de página
- ✅ Experiência fluida e moderna

---

## 📊 Exemplo de Uso

### Cenário 1: Admin cria novo produto

```
Timeline:
00:00 - Admin clica em "Salvar Produto" no painel
00:01 - PostgreSQL INSERT dispara evento
00:02 - Supabase Realtime notifica clients conectados
00:03 - Catálogo público recebe produto via useRealtimeProdutos
00:04 - Produto aparece no catálogo sem reload
```

### Cenário 2: Admin muda preço

```
Timeline:
00:00 - Admin edita preço de R$ 2.800 para R$ 2.600
00:01 - PostgreSQL UPDATE dispara evento
00:02 - Supabase Realtime notifica
00:03 - Página do produto recebe atualização
00:04 - Preço muda de R$ 2.800 → R$ 2.600 sem reload
00:05 - Calculadora recalcula parcelas automaticamente
```

### Cenário 3: Admin ativa calculadora

```
Timeline:
00:00 - Admin ativa toggle em /admin/taxas
00:01 - PostgreSQL UPDATE em configuracoes_taxas
00:02 - Supabase Realtime notifica
00:03 - Todas páginas de produtos recebem atualização
00:04 - Calculadora aparece instantaneamente em todas as páginas
```

---

## ⚡ Performance

### Otimizações Implementadas

1. **Callbacks memoizados** - Usando `useCallback` para evitar re-renders
2. **Queries eficientes** - Busca apenas dados necessários após evento
3. **Evita duplicatas** - Verifica antes de adicionar produto
4. **Cleanup automático** - Remove subscriptions ao desmontar componentes
5. **Props propagation** - Calculadora não precisa de hook próprio

### Impacto no Bundle

- `use-realtime-produtos.ts`: ~2KB
- `use-realtime-taxas.ts`: ~1.5KB
- Supabase Realtime client: já incluído no projeto
- **Total adicional: ~3.5KB**

---

## 🔐 Segurança

### Row Level Security (RLS)

O Realtime respeita as políticas RLS configuradas:

```sql
-- Produtos: Leitura pública, escrita apenas admin
CREATE POLICY "Leitura pública" ON produtos FOR SELECT USING (ativo = true);
CREATE POLICY "Admin pode modificar" ON produtos FOR ALL USING (auth.role() = 'admin');

-- Taxas: Leitura pública, escrita apenas admin
CREATE POLICY "Leitura pública" ON configuracoes_taxas FOR SELECT USING (true);
CREATE POLICY "Admin pode modificar" ON configuracoes_taxas FOR ALL USING (auth.role() = 'admin');
```

### Validações

- ✅ Eventos só processados se dados válidos
- ✅ Produtos inativos não adicionados ao catálogo
- ✅ Produtos deletados removidos imediatamente
- ✅ Redirecionamento automático se produto não existir

---

## 🧪 Como Testar

### Teste 1: Criação de Produto em Tempo Real

1. Abra o catálogo em uma aba (`http://localhost:3000`)
2. Abra o admin em outra aba (`http://localhost:3000/admin/produtos`)
3. Crie um novo produto
4. ✅ **Resultado esperado:** Produto aparece no catálogo sem reload

### Teste 2: Edição de Preço

1. Abra uma página de produto (`http://localhost:3000/produto/iphone-15-pro`)
2. Em outra aba, edite o preço do produto no admin
3. ✅ **Resultado esperado:** Preço atualiza instantaneamente na página

### Teste 3: Ativação da Calculadora

1. Abra várias páginas de produtos
2. Em outra aba, ative o toggle em `/admin/taxas`
3. ✅ **Resultado esperado:** Calculadora aparece em todas as páginas sem reload

### Teste 4: Mudança de Taxas

1. Abra uma página de produto com calculadora expandida
2. Mude a taxa do 12x de 10.3% para 12.0% no admin
3. ✅ **Resultado esperado:** Valores recalculados instantaneamente

### Teste 5: Desativação de Produto

1. Abra a página de um produto
2. Desative o produto no admin
3. ✅ **Resultado esperado:** Redireciona para catálogo automaticamente

---

## 🐛 Troubleshooting

### Realtime não funciona

**Sintomas:** Mudanças não aparecem sem reload

**Soluções:**
1. ✅ Verifique se Realtime está habilitado no Supabase
   - Dashboard → Settings → API → Realtime
2. ✅ Confirme que RLS policies permitem leitura pública
3. ✅ Verifique console do navegador por erros de conexão
4. ✅ Teste conexão: `supabase.channel('test').subscribe()`

### Atualizações duplicadas

**Sintomas:** Produto aparece múltiplas vezes

**Soluções:**
1. ✅ Verificar lógica de duplicatas em `handleProdutoInsert`
2. ✅ Confirmar que `useCallback` está sendo usado corretamente
3. ✅ Verificar se hooks não estão sendo chamados múltiplas vezes

### Produto não aparece após criação

**Sintomas:** Produto criado no admin mas não aparece no catálogo

**Soluções:**
1. ✅ Verificar se produto está `ativo = true`
2. ✅ Confirmar que `deleted_at IS NULL`
3. ✅ Verificar se produto não está em banners de destaque
4. ✅ Checar se filtros do catálogo não estão ocultando

---

## 📝 Notas Técnicas

### Supabase Realtime Limitations

1. **Broadcast delay:** ~100-500ms típico
2. **Max connections:** 500 simultâneas (plano gratuito)
3. **Payload size:** Max 1MB por mensagem
4. **Events:** INSERT, UPDATE, DELETE (não SELECT)

### Boas Práticas

1. **Sempre usar cleanup** - Remover subscriptions ao desmontar
2. **Memoizar callbacks** - Evitar re-renders desnecessários
3. **Validar dados** - Sempre verificar se produto é válido
4. **Fetch completo** - Buscar dados completos com JOINs após evento
5. **Error handling** - Capturar erros de conexão

---

## 🎯 Próximas Melhorias (Opcional)

- [ ] Toast de notificação quando produto atualiza
- [ ] Indicador visual de "sincronizando..."
- [ ] Offline support com queue de updates
- [ ] Realtime para categorias e banners
- [ ] Analytics de conexões realtime ativas
- [ ] Retry automático em caso de desconexão

---

## ✅ Checklist de Implementação

- [x] Hook `use-realtime-produtos.ts` criado
- [x] Hook `use-realtime-taxas.ts` criado
- [x] Integrado no catálogo (página principal)
- [x] Integrado na página do produto
- [x] Calculadora sincroniza via props
- [x] Callbacks memoizados com useCallback
- [x] Cleanup de subscriptions implementado
- [x] Validações de produtos ativos/deletados
- [x] Redirecionamento automático quando produto é removido
- [x] Documentação completa criada

---

**Implementado com ❤️ usando Supabase Realtime**

Sistema de sincronização em tempo real totalmente funcional! 🎉
