# 🔧 Configuração do Supabase Realtime

## ⚠️ IMPORTANTE: Configuração Obrigatória

Para o sistema de realtime funcionar, você **PRECISA** habilitar o Realtime no Supabase e configurar as tabelas. Siga os passos abaixo:

---

## 📋 Passo 1: Habilitar Realtime no Supabase

### 1.1 - Acessar Database Replication

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. No menu lateral, vá em **Database** → **Replication**
3. Você verá a lista de todas as tabelas do seu banco

### 1.2 - Habilitar Realtime para as Tabelas

**Tabelas que precisam ter Realtime habilitado:**

#### ✅ Tabela `produtos`
1. Encontre a tabela `produtos` na lista
2. Clique no toggle (switch) ao lado de `produtos`
3. O toggle deve ficar **VERDE** (habilitado)

#### ✅ Tabela `configuracoes_taxas`
1. Encontre a tabela `configuracoes_taxas` na lista
2. Clique no toggle (switch) ao lado de `configuracoes_taxas`
3. O toggle deve ficar **VERDE** (habilitado)

**Screenshot de referência:**
```
Database > Replication

Tables
┌──────────────────────────┬─────────────┐
│ Table                    │ Realtime    │
├──────────────────────────┼─────────────┤
│ produtos                 │ [x] ON      │ ← Deve estar ON
│ configuracoes_taxas      │ [x] ON      │ ← Deve estar ON
│ categorias               │ [ ] OFF     │
│ banners                  │ [ ] OFF     │
└──────────────────────────┴─────────────┘
```

---

## 📋 Passo 2: Verificar RLS (Row Level Security)

### 2.1 - Verificar Políticas de Leitura Pública

Execute no **SQL Editor** do Supabase:

```sql
-- Verificar políticas existentes para produtos
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'produtos';

-- Verificar políticas existentes para configuracoes_taxas
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'configuracoes_taxas';
```

### 2.2 - Criar Políticas se Não Existirem

#### Política para `produtos`:

```sql
-- Permitir leitura pública de produtos ativos
CREATE POLICY IF NOT EXISTS "Leitura pública de produtos ativos"
  ON produtos
  FOR SELECT
  USING (ativo = true AND deleted_at IS NULL);
```

#### Política para `configuracoes_taxas`:

```sql
-- Permitir leitura pública da configuração de taxas
CREATE POLICY IF NOT EXISTS "Leitura pública"
  ON configuracoes_taxas
  FOR SELECT
  USING (true);
```

---

## 📋 Passo 3: Testar Conexão Realtime

### Opção A: Usar Componente de Teste Visual (Recomendado)

1. **Adicione o componente de teste** em qualquer página:

```tsx
// app/(public)/produto/[slug]/page.tsx (ou qualquer outra página)
import { RealtimeTest } from '@/components/debug/realtime-test'

export default function Page() {
  return (
    <div>
      <RealtimeTest /> {/* ← Adicione esta linha */}
      {/* resto do código da página */}
    </div>
  )
}
```

2. **Acesse a página** no navegador
3. **Veja o widget** no canto inferior direito da tela
4. **Verifique os status:**
   - ✅ **Verde "Conectado"** = Realtime funcionando!
   - ❌ **Vermelho "Erro"** = Realtime NÃO habilitado
   - 🟡 **Amarelo "Conectando..."** = Aguardando conexão

5. **Teste a sincronização:**
   - Edite um produto no admin
   - Veja o evento aparecer no widget instantaneamente!

### Opção B: Verificar no Console do Navegador

1. Abra uma página do produto: `http://localhost:3000/produto/[algum-slug]`
2. Abra o Console do navegador (F12 → Console)

Você deve ver logs similares a:

```
✅ Logs Esperados (SUCESSO):
[useRealtimeTaxas] Iniciando subscrição de taxas...
[useRealtimeTaxas] Status da subscrição: SUBSCRIBED

[useRealtimeProdutos] Iniciando subscrição de produtos...
[useRealtimeProdutos] Status da subscrição: SUBSCRIBED
```

❌ **Se ver isso, Realtime NÃO está habilitado:**
```
[useRealtimeTaxas] Status da subscrição: CHANNEL_ERROR
[useRealtimeTaxas] Status da subscrição: TIMED_OUT
```

---

## 📋 Passo 4: Testar Atualização em Tempo Real

### 4.1 - Preparar Teste

1. **Aba 1:** Abra uma página de produto
   - URL: `http://localhost:3000/produto/iphone-15-pro`
   - Abra Console (F12)

2. **Aba 2:** Abra o admin de taxas
   - URL: `http://localhost:3000/admin/taxas`

### 4.2 - Executar Teste

1. Na **Aba 2 (admin)**, ative o toggle da calculadora
2. Clique em "Salvar Configurações"
3. Vá para **Aba 1 (produto)** e observe o console

### 4.3 - Resultado Esperado

**Console da Aba 1 deve mostrar:**
```
[useRealtimeTaxas] Evento recebido: UPDATE
[useRealtimeTaxas] Payload: {...}
[useRealtimeTaxas] Taxas atualizadas: { ativo: true, taxas: {...} }
[ProdutoPage] Taxas atualizadas via realtime: { ativo: true, taxas: {...} }
```

**Na tela da Aba 1:**
- ✅ A calculadora deve **aparecer instantaneamente** sem reload

---

## 🐛 Troubleshooting

### Problema 1: Status "CHANNEL_ERROR"

**Sintomas:**
```
[useRealtimeTaxas] Status da subscrição: CHANNEL_ERROR
```

**Soluções:**
1. ✅ Verifique se Realtime está habilitado em Database → Replication
2. ✅ Confirme que RLS permite leitura pública (`SELECT`)
3. ✅ Verifique se há errors no Supabase Dashboard → Logs

### Problema 2: Status "SUBSCRIBED" mas eventos não chegam

**Sintomas:**
- Console mostra `SUBSCRIBED`
- Mas não mostra `Evento recebido: UPDATE`

**Soluções:**
1. ✅ Execute UPDATE manual no SQL Editor:
   ```sql
   UPDATE configuracoes_taxas
   SET ativo = NOT ativo
   WHERE id = (SELECT id FROM configuracoes_taxas LIMIT 1);
   ```
2. ✅ Verifique se a política RLS permite SELECT
3. ✅ Verifique se não há filtros bloqueando os eventos

### Problema 3: Erro "relation does not exist"

**Sintomas:**
```
ERROR: relation "configuracoes_taxas" does not exist
```

**Soluções:**
1. ✅ Execute a migration SQL:
   ```bash
   # Use o arquivo correto
   supabase-migration-taxas-sem-rls.sql
   ```
2. ✅ Verifique se a tabela existe:
   ```sql
   SELECT * FROM configuracoes_taxas;
   ```

### Problema 4: CORS ou Network Error

**Sintomas:**
- Erros de CORS no console
- Conexão recusada

**Soluções:**
1. ✅ Verifique variáveis de ambiente:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
   ```
2. ✅ Confirme que URL e Key estão corretas
3. ✅ Reinicie o servidor Next.js

---

## ✅ Checklist Final

Antes de reportar que "não funciona", verifique:

- [ ] Realtime habilitado em Database → Replication para `produtos`
- [ ] Realtime habilitado em Database → Replication para `configuracoes_taxas`
- [ ] RLS policies criadas para leitura pública
- [ ] Console mostra `Status da subscrição: SUBSCRIBED`
- [ ] Migration SQL executada (tabela `configuracoes_taxas` existe)
- [ ] Variáveis de ambiente corretas (.env.local)
- [ ] Servidor Next.js reiniciado após mudanças

---

## 📞 Suporte

Se após seguir todos os passos ainda não funcionar:

1. Tire screenshot de:
   - Database → Replication (mostrando tabelas)
   - Console do navegador (mostrando logs)
   - SQL Editor com `SELECT * FROM configuracoes_taxas`

2. Compartilhe os logs do console

---

**Configuração necessária apenas UMA VEZ. Depois funciona automaticamente! 🚀**
