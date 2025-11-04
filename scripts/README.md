# Scripts de Manutenção

Scripts utilitários para manutenção, migração e análise do projeto.

## 📥 Importação

### `importar-custos-inteligente.ts`
Importa custos de produtos a partir de arquivo CSV.
- Matching inteligente por nome/código
- Validação de dados
- Tratamento de erros

**Uso:**
```bash
npx tsx scripts/importar-custos-inteligente.ts caminho/arquivo.csv
```

### `analisar-qualidade-importacao.ts`
Analisa qualidade dos dados importados e gera relatório de inconsistências.
- Valida integridade de dados
- Detecta duplicações
- Identifica campos faltantes

**Uso:**
```bash
npx tsx scripts/analisar-qualidade-importacao.ts
```

## 🔧 Manutenção

### `fix-produtos-hoje.ts`
Corrige dados de produtos com problemas.
- Normalização de campos
- Correção de valores inválidos
- Atualização em lote

**Uso:**
```bash
npx tsx scripts/fix-produtos-hoje.ts
```

### `fix-slugs-duplicados.ts`
Garante unicidade de slugs de produtos.
- Detecta slugs duplicados
- Gera novos slugs únicos
- Atualiza banco de dados

**Uso:**
```bash
npx tsx scripts/fix-slugs-duplicados.ts
```

## 🛠️ Utilitários

### `executar-migration.ts`
Executa migrations SQL manuais.
- Aplica migrations específicas
- Rollback disponível
- Log de execução

**Uso:**
```bash
npx tsx scripts/executar-migration.ts
```

### `check-custos-stats.ts`
Exibe estatísticas sobre custos de produtos.
- Total de custos registrados
- Produtos sem custo
- Análise de margens

**Uso:**
```bash
npx tsx scripts/check-custos-stats.ts
```

## ⚙️ Configuração

Todos os scripts utilizam variáveis de ambiente do arquivo `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (quando necessário)

## 📝 Notas

- Scripts usam `console.log` para output (não logger)
- Execute sempre de dentro do diretório do projeto
- Faça backup antes de executar scripts de correção
- Scripts de importação validam dados antes de inserir

## 🗄️ Arquivados

Scripts arquivados (trabalho concluído) estão em `/scripts/archived/`
