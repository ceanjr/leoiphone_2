# Troubleshooting - Produtos Relacionados

## Problema: Produtos relacionados não aparecem

### 1. Verificar se as migrations foram executadas

Execute as seguintes migrations no SQL Editor do Supabase:

```sql
-- Migration 1: Tabela de configurações por categoria
-- Arquivo: supabase/migrations/20250201000000_create_produtos_relacionados.sql
```

```sql
-- Migration 2: Tabela de configuração global
-- Arquivo: supabase/migrations/20250203000001_create_config_produtos_relacionados.sql
```

### 2. Verificar logs no console do navegador

Abra o DevTools (F12) e vá para a aba Console. Procure por mensagens com o prefixo:
- `[ProdutosRelacionados]` - Logs do componente
- `[getProdutosRelacionados]` - Logs da função de busca

**Logs esperados:**
```
[ProdutosRelacionados] Carregando... {produtoId: "...", categoriaId: "..."}
[getProdutosRelacionados] Config global: {ativo: true, desconto_global: 5}
[getProdutosRelacionados] Sistema ativo: true
[getProdutosRelacionados] Config categoria: {auto_select: true, ...}
[getProdutosRelacionados] Categoria atual: {nome: "iPhone 15"}
[getProdutosRelacionados] Retornando 3 produtos relacionados
[ProdutosRelacionados] Produtos carregados: 3
```

### 3. Verificar no Admin

1. Acesse **Admin → Categorias**
2. Verifique o painel "Produtos Relacionados" no topo
3. Certifique-se que:
   - Badge mostra "Ativo" (verde)
   - Switch está ligado (verde)
   - Desconto global está configurado (padrão 5%)

### 4. Se a configuração global não existir

Execute manualmente no SQL Editor:

```sql
-- Inserir configuração global padrão
INSERT INTO config_produtos_relacionados (ativo, desconto_global)
VALUES (true, 5.00)
ON CONFLICT DO NOTHING;
```

### 5. Se a configuração de categoria não existir

Execute manualmente no SQL Editor:

```sql
-- Inserir configurações padrão para todas as categorias
INSERT INTO categoria_produtos_relacionados (categoria_id, auto_select, desconto_percentual)
SELECT id, true, 5.00
FROM categorias
ON CONFLICT (categoria_id) DO NOTHING;
```

### 6. Verificar se há produtos no banco

```sql
-- Verificar quantos produtos ativos existem
SELECT COUNT(*) FROM produtos WHERE ativo = true AND deleted_at IS NULL;
```

Se não houver produtos ou houver apenas 1 produto, os produtos relacionados não serão exibidos.

### 7. Testar em uma página de produto específica

1. Acesse uma página de produto (ex: `/produto/iphone-15`)
2. Role até a seção "Produtos Relacionados"
3. Verifique os logs no console
4. Se aparecer "Produtos carregados: 0", verifique:
   - Se há produtos de outras categorias no banco
   - Se as configurações estão corretas
   - Se a lógica de relacionamento está funcionando

## Problema: Switch não aparece ou não funciona

### Verificar componente Switch

O Switch deve estar visível com cores:
- Verde quando ativo
- Cinza quando inativo

Se não aparecer:
1. Verifique se o import está correto em `app/admin/categorias/page.tsx`
2. Verifique se `@radix-ui/react-switch` está instalado:
   ```bash
   npm install @radix-ui/react-switch
   ```

### Testar manualmente

```tsx
// O Switch deve funcionar assim:
<Switch
  checked={configGlobalAtivo}
  onCheckedChange={handleToggleConfigGlobal}
  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-zinc-700"
/>
```

## Problema: Modal de desconto sem espaçamento

O modal foi corrigido com padding responsivo:
- Desktop: sem padding extra (usa o padrão do DialogContent)
- Mobile: padding de 4 (16px) nas laterais

Se ainda houver problemas, verifique se as classes estão sendo aplicadas:
```tsx
<DialogHeader className="px-4 sm:px-0">
<div className="space-y-4 px-4 py-4 sm:px-0">
<DialogFooter className="gap-2 px-4 sm:px-0">
```

## Comandos úteis para debug

### Verificar tabelas no Supabase

```sql
-- Verificar se as tabelas existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('config_produtos_relacionados', 'categoria_produtos_relacionados');

-- Ver configuração global
SELECT * FROM config_produtos_relacionados;

-- Ver configurações por categoria
SELECT
  c.nome as categoria,
  cpr.auto_select,
  cpr.desconto_percentual,
  array_length(cpr.produtos_selecionados, 1) as qtd_produtos_selecionados
FROM categoria_produtos_relacionados cpr
JOIN categorias c ON c.id = cpr.categoria_id;
```

### Limpar cache do navegador

Às vezes, o problema pode ser cache do navegador:
1. Abra DevTools (F12)
2. Clique com botão direito no botão de recarregar
3. Selecione "Esvaziar cache e recarregar"

## Suporte

Se o problema persistir:
1. Copie todos os logs do console
2. Verifique a aba Network para ver se as requisições estão falhando
3. Verifique se há erros no servidor (terminal onde o Next.js está rodando)
