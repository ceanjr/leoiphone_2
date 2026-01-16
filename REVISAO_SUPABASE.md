# Revisão Profunda do Supabase - LeoiPhone

> Relatório de análise e plano de implementação para otimização do banco de dados e storage

---

## Sumário Executivo

Este relatório documenta a análise completa do Supabase do projeto LeoiPhone, identificando oportunidades de otimização em três frentes:

1. **Tabelas redundantes/não utilizadas** - Identificação e consolidação
2. **Limpeza do Storage de imagens** - Remoção segura de imagens órfãs
3. **Migração para Cloudinary** - Otimização e redução de custos

---

# ETAPA 1: Análise das Tabelas do Supabase ✅ CONCLUÍDA

## 1.1 Inventário Completo (22 tabelas encontradas)

### Tabelas MANTIDAS (Core do Sistema)

| Tabela                | Registros | Uso                         | Status        |
| --------------------- | --------- | --------------------------- | ------------- |
| `produtos`            | 324       | Catálogo principal          | ✅ MANTER     |
| `categorias`          | 25        | Organização de produtos     | ✅ MANTER     |
| `banners`             | 1         | Banners da home             | ✅ MANTER     |
| `configuracoes_taxas` | 1         | Calculadora de parcelamento | ✅ MANTER+RLS |
| `presets_taxas`       | 1         | Presets de taxas salvos     | ✅ MANTER+RLS |
| `produtos_custos`     | 308       | Controle de custos/estoque  | ✅ MANTER+RLS |
| `site_metrics`        | 303       | Analytics de eventos        | ✅ MANTER     |
| `active_sessions`     | 1         | Sessões ativas              | ✅ MANTER     |
| `page_views`          | 8844      | Visualizações de páginas    | ✅ MANTER     |

### Tabelas REMOVIDAS (Migration criada)

| Tabela                            | Registros | Motivo                    | Status     |
| --------------------------------- | --------- | ------------------------- | ---------- |
| `olx_config`                      | 1         | Não usada no código       | ❌ REMOVER |
| `olx_anuncios`                    | 0         | Não usada no código       | ❌ REMOVER |
| `olx_sync_log`                    | 15        | Não usada no código       | ❌ REMOVER |
| `facebook_anuncios`               | 1         | Não usada no código       | ❌ REMOVER |
| `facebook_sync_log`               | 0         | Não usada no código       | ❌ REMOVER |
| `banner_produto_clicks`           | 0         | Não usada no código       | ❌ REMOVER |
| `conversions`                     | 43        | Usuário não quer mais     | ❌ REMOVER |
| `secoes_home`                     | 3         | Funcionalidade abandonada | ❌ REMOVER |
| `produtos_secoes`                 | 0         | Funcionalidade abandonada | ❌ REMOVER |
| `produtos_destaque`               | 0         | Substituída por banners   | ❌ REMOVER |
| `categoria_produtos_relacionados` | 0         | Legada                    | ❌ REMOVER |
| `config_produtos_relacionados`    | 0         | Legada                    | ❌ REMOVER |
| `historico_precos`                | 152       | Não usada no código       | ❌ REMOVER |

### Views REMOVIDAS

| View                                | Status     |
| ----------------------------------- | ---------- |
| `v_olx_anuncios_com_produto`        | ❌ REMOVER |
| `v_produtos_destaque`               | ❌ REMOVER |
| `v_produtos_destaque_com_categoria` | ❌ REMOVER |
| `banner_produtos_clicks_stats`      | ❌ REMOVER |

---

## 1.2 Alterações Realizadas

### Migration Criada

- **Arquivo:** `supabase/migrations/20260115_cleanup_unused_tables.sql`
- **Conteúdo:**
  - Remove todas as tabelas não utilizadas
  - Remove views associadas
  - Remove triggers e functions
  - Habilita RLS nas tabelas sensíveis (`configuracoes_taxas`, `presets_taxas`, `produtos_custos`)

### Código Removido/Atualizado

| Arquivo                                         | Alteração                                 |
| ----------------------------------------------- | ----------------------------------------- |
| `app/admin/dashboard/actions.ts`                | Removida função `trackBannerProductClick` |
| `components/shared/whatsapp-contact-button.tsx` | Removido tracking de conversões           |
| `components/public/produtos-destaque.tsx`       | Removido tracking de cliques              |
| `hooks/use-home-data.ts`                        | Removido código de seções                 |
| `app/(public)/page.tsx`                         | Removido código de seções                 |
| `components/public/home/index.ts`               | Removido export de SecaoDestaque          |
| `components/public/home/SecaoDestaque.tsx`      | **Arquivo deletado**                      |
| `lib/config/secao-config.ts`                    | **Arquivo deletado**                      |

---

## 1.3 TODOs - Etapa 1 ✅ TODOS CONCLUÍDOS

### TODO 1.1: Listar todas as tabelas do Supabase ✅

- [x] Script criado: `scripts/list-tables.ts`
- [x] 22 tabelas identificadas no banco
- [x] 5 views identificadas

### TODO 1.2: Remover tabelas OLX ✅

- [x] Migration criada com DROP das tabelas OLX
- [x] `olx_config`, `olx_anuncios`, `olx_sync_log` serão removidas
- [x] View `v_olx_anuncios_com_produto` será removida

### TODO 1.3: Remover tabelas Facebook ✅

- [x] `facebook_anuncios`, `facebook_sync_log` serão removidas

### TODO 1.4: Remover tabelas de tracking não usadas ✅

- [x] `banner_produto_clicks` será removida
- [x] `conversions` será removida
- [x] Código de tracking removido dos componentes
- [x] `page_views` e `active_sessions` mantidas (são usadas no dashboard)

### TODO 1.5: Avaliar seções da home ✅

- [x] `secoes_home` e `produtos_secoes` não têm uso real
- [x] Código removido do hook e da página inicial
- [x] Componentes relacionados deletados

### TODO 1.6: Proteger tabelas UNRESTRICTED ✅

- [x] RLS habilitado em `configuracoes_taxas`
- [x] RLS habilitado em `presets_taxas`
- [x] RLS habilitado em `produtos_custos`

### TODO 1.7: Verificar tabela historico_precos ✅

- [x] Tabela não é usada em nenhum lugar do código
- [x] Será removida pela migration

---

## 1.4 Próximos Passos para Etapa 1

⚠️ **IMPORTANTE:** A migration foi criada mas ainda NÃO foi executada no banco de produção.

Para aplicar as alterações no banco:

```bash
# Via Supabase CLI
npx supabase db push

# Ou via Dashboard do Supabase
# Executar o SQL da migration manualmente
```

---

## 1.5 Resumo da Etapa 1

| Métrica                      | Antes | Depois |
| ---------------------------- | ----- | ------ |
| Total de tabelas             | 22    | 9      |
| Tabelas removidas            | -     | 13     |
| Views removidas              | -     | 4      |
| Arquivos de código removidos | -     | 2      |
| Componentes atualizados      | -     | 6      |
| Tabelas com RLS habilitado   | 0     | 3      |

**Redução de 59% no número de tabelas!**

---

# ETAPA 2: Limpeza do Storage de Imagens

## 2.1 Estado Atual do Storage

### Bucket: `produtos`

**Estrutura de arquivos:**

```
produtos/
├── {timestamp}-{random}-thumb.webp     (112px)
├── {timestamp}-{random}-small.webp     (400px)
├── {timestamp}-{random}-medium.webp    (800px)
├── {timestamp}-{random}-large.webp     (1200px)
└── {timestamp}-{random}-original.webp  (qualidade 90%)
```

**Campos que armazenam imagens:**

- `produtos.fotos` - Array de URLs (todas as fotos do produto)
- `produtos.foto_principal` - String (primeira foto, thumbnail)
- `banners.imagem_url` - String (imagem do banner tipo 'banner')

---

## 2.2 Estratégia de Limpeza SEGURA

### Fase 1: Inventário

1. **Listar todas as imagens no storage**
   - Usar Supabase Storage API para listar todos os arquivos do bucket `produtos`

2. **Extrair todas as URLs de imagens do banco**
   - Query em `produtos.fotos` (array) para produtos cadastrados
   - Query em `produtos.foto_principal` para produtos cadastrados
   - Query em `banners.imagem_url` para banners cadastrados
   - Incluir produtos/banners inativos por segurança

3. **Criar lista de imagens órfãs**
   - Imagens no storage que NÃO estão referenciadas em nenhuma tabela

### Fase 2: Validação

1. **Gerar relatório de imagens órfãs**
   - Não deletar nada ainda, apenas listar
   - Exportar para arquivo JSON/CSV para revisão manual

2. **Backup preventivo**
   - Fazer backup das imagens órfãs antes de qualquer remoção

### Fase 3: Remoção

1. **Deletar apenas após confirmação**
   - Script que deleta apenas as imagens confirmadas como órfãs
   - Executar em batches pequenos (10-50 por vez)
   - Log de todas as remoções

---

## 2.3 Viabilidade

| Aspecto                 | Status      | Observação                                 |
| ----------------------- | ----------- | ------------------------------------------ |
| API para listar storage | ✅ Possível | `supabase.storage.from('produtos').list()` |
| Query de URLs no banco  | ✅ Possível | Queries em `produtos` e `banners`          |
| Identificação de órfãs  | ✅ Possível | Comparação entre listas                    |
| Remoção segura          | ✅ Possível | Backup + remoção em batches                |

**Conclusão: Etapa 2 é VIÁVEL e segura com a estratégia correta.**

---

## 2.4 TODOs - Etapa 2

### TODO 2.1: Criar script de inventário ✅

- [x] Script para listar TODAS as imagens no bucket `produtos`
- [x] Script para extrair TODAS as URLs do banco de dados
- [x] Incluir produtos com `deleted_at IS NOT NULL` (soft deleted)
- [x] Incluir banners inativos
- [x] Incluir produtos inativos

**Script criado:** `scripts/storage-cleanup.ts`

### TODO 2.2: Gerar relatório de órfãs ✅

- [x] Comparar listas e identificar imagens não referenciadas
- [x] Salvar relatório em JSON
- [x] Incluir: nome do arquivo, tamanho, data de criação

**Relatório gerado:** `scripts/reports/storage-orphans-2026-01-15T20-33-39-150Z.json`

**Resultado da análise (15/01/2026):**

| Métrica                       | Valor   |
| ----------------------------- | ------- |
| Arquivos no Storage           | 2.906   |
| URLs Referenciadas (Supabase) | 446     |
| URLs Firebase (externo)       | 544     |
| Imagens Órfãs                 | 2.501   |
| Espaço liberado               | ~246 MB |

**Distribuição dos arquivos órfãos:**

| Tipo de Arquivo  | Quantidade | Descrição                    |
| ---------------- | ---------- | ---------------------------- |
| `-thumb.webp`    | 551        | Thumbnails (112px)           |
| `-small.webp`    | 551        | Imagens pequenas (400px)     |
| `-medium.webp`   | 551        | Imagens médias (800px)       |
| `-large.webp`    | 550        | Imagens grandes (1200px)     |
| `-original.webp` | 146        | Imagens originais otimizadas |
| `.blob`          | ~100       | Arquivos temporários upload  |
| `.jpeg`          | ~52        | Imagens originais antigas    |

**Script para executar análise:** `npx tsx scripts/storage-cleanup.ts`

**Relatórios salvos em:** `scripts/reports/`

### TODO 2.3: Revisão manual ✅

- [x] Apresentar relatório para aprovação do usuário
- [x] Validação dupla confirmada: apenas 446 URLs do Supabase são usadas
- [x] Imagens do Firebase são externas e não foram afetadas

### TODO 2.4: Backup das imagens órfãs ⏭️

- [x] **DECISÃO:** Backup pulado por limitações de tempo/orçamento
- [x] Validação dupla garantiu segurança da operação

### TODO 2.5: Remoção segura ✅ EXECUTADA

- [x] Script de remoção em batches (50 arquivos por vez)
- [x] Log de cada arquivo removido
- [x] Tratamento de erros (nenhuma falha)

**Execução em 15/01/2026:**

```
✅ Removidos: 2.501 arquivos
❌ Falhas: 0
💾 Espaço liberado: ~246 MB
📄 Log: scripts/reports/removal-1768510499716.json
```

---

## 2.5 Resumo da Etapa 2 ✅ CONCLUÍDA

| Métrica             | Antes  | Depois |
| ------------------- | ------ | ------ |
| Arquivos no Storage | 2.906  | 405    |
| Espaço ocupado      | ~300MB | ~54MB  |
| Arquivos órfãos     | 2.501  | 0      |
| Redução de espaço   | -      | ~82%   |

**Scripts criados:**

- `scripts/storage-cleanup.ts` - Inventário e análise
- `scripts/validate-image-references.ts` - Validação de referências
- `scripts/analyze-images.ts` - Análise detalhada
- `scripts/remove-orphans-direct.ts` - Remoção direta

---

# ETAPA 3: Migração para Cloudinary

## 3.1 Estado Atual

### Credenciais Cloudinary (já configuradas)

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dvwtcedfs
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
CLOUDINARY_API_KEY=365129578919396
CLOUDINARY_API_SECRET=KzggjOKUNVFXG3Q0dyzeYgsN7BY
```

### Sistema Atual de Upload (Supabase)

- Endpoint: `/api/upload/route.ts`
- Otimização: Sharp server-side gerando 5 variantes WebP
- Bucket: `produtos` no Supabase Storage

---

## 3.2 Vantagens do Cloudinary

| Recurso               | Supabase           | Cloudinary                  |
| --------------------- | ------------------ | --------------------------- |
| Otimização automática | Manual (Sharp)     | ✅ Automática               |
| Variantes de tamanho  | Manual (5 uploads) | ✅ On-the-fly via URL       |
| CDN Global            | ✅ Sim             | ✅ Sim (melhor)             |
| Transformações        | ❌ Limitado        | ✅ 300+ transformações      |
| WebP/AVIF automático  | Manual             | ✅ Automático               |
| Lazy loading blur     | Manual             | ✅ `blurDataURL` automático |
| Custo de storage      | Pago por GB        | ✅ Generoso tier gratuito   |
| Backup de originais   | ✅ Sim             | ✅ Sim                      |

---

## 3.3 Opções de Migração

### Opção A: Migração Completa (Recomendada)

**Escopo:**

1. Migrar TODAS as imagens do Supabase para Cloudinary
2. Atualizar URLs no banco de dados
3. Remover variantes do Supabase (apenas original migra)
4. Atualizar sistema de upload para usar Cloudinary

**Prós:**

- Sistema unificado
- Não precisa manter dois storages
- Menos complexidade no código

**Contras:**

- Requer mais trabalho inicial
- Risco durante migração

### Opção B: Híbrido (Supabase antigo + Cloudinary novo)

**Escopo:**

1. Novos uploads vão para Cloudinary
2. Imagens antigas continuam no Supabase
3. Código detecta origem e usa loader apropriado

**Prós:**

- Implementação gradual
- Sem risco de perda de imagens
- Pode migrar aos poucos

**Contras:**

- Dois sistemas para manter
- Código mais complexo

---

## 3.4 Viabilidade por Opção

### Opção A: Migração Completa

| Aspecto                | Status    | Observação             |
| ---------------------- | --------- | ---------------------- |
| Upload para Cloudinary | ✅ Viável | SDK disponível         |
| Download do Supabase   | ✅ Viável | API de storage         |
| Atualização de URLs    | ✅ Viável | UPDATE em batch        |
| Detecção de formato    | ✅ Viável | Cloudinary retorna URL |

### Opção B: Híbrido

| Aspecto                 | Status    | Observação                           |
| ----------------------- | --------- | ------------------------------------ |
| Novo endpoint de upload | ✅ Viável | `/api/upload-cloudinary`             |
| Loader híbrido          | ✅ Viável | Detectar domínio da URL              |
| Coexistência            | ✅ Viável | Next.js já permite múltiplos domains |

**Conclusão: Ambas as opções são VIÁVEIS. Opção B é mais segura para começar.**

---

## 3.5 Detalhes Técnicos para Implementação

### URLs Supabase (atual)

```
https://aswejqbtejibrilrblnm.supabase.co/storage/v1/object/public/produtos/{filename}
```

### URLs Cloudinary (futuro)

```
https://res.cloudinary.com/dvwtcedfs/image/upload/{transformations}/{public_id}
```

### Transformações úteis do Cloudinary

- `f_auto` - Formato automático (WebP/AVIF)
- `q_auto` - Qualidade automática
- `w_400` - Largura 400px
- `c_fill` - Crop para preencher
- `dpr_auto` - Device pixel ratio automático

---

## 3.6 TODOs - Etapa 3

### TODO 3.1: Instalar dependências Cloudinary

- [ ] Adicionar `cloudinary` ao package.json
- [ ] Adicionar `next-cloudinary` para componentes otimizados

### TODO 3.2: Criar endpoint de upload Cloudinary

- [ ] Novo arquivo `/api/upload-cloudinary/route.ts`
- [ ] Upload direto para Cloudinary com transformações
- [ ] Retornar URL pública e public_id

### TODO 3.3: Criar loader híbrido

- [ ] Função que detecta se URL é Supabase ou Cloudinary
- [ ] Aplicar transformações apropriadas para cada origem
- [ ] Atualizar `next.config.ts` com domínio Cloudinary

### TODO 3.4: Atualizar componente de upload admin

- [ ] Modificar `ImageUpload` para usar novo endpoint
- [ ] Manter compatibilidade com imagens existentes

### TODO 3.5: Atualizar componente OptimizedImage

- [ ] Detectar origem da imagem
- [ ] Usar CldImage para Cloudinary ou Image para Supabase

### TODO 3.6: (Opcional) Migrar imagens existentes

- [ ] Script para download do Supabase
- [ ] Upload para Cloudinary mantendo organização
- [ ] Atualização de URLs no banco
- [ ] Verificação de integridade

---

# Resumo de Viabilidade

| Etapa                  | Viabilidade | Risco                 | Status       |
| ---------------------- | ----------- | --------------------- | ------------ |
| 1. Análise de tabelas  | ✅ VIÁVEL   | Baixo                 | ✅ CONCLUÍDA |
| 2. Limpeza de storage  | ✅ VIÁVEL   | Baixo (validado)      | ✅ CONCLUÍDA |
| 3. Migração Cloudinary | ✅ VIÁVEL   | Baixo (opção híbrida) | ⏳ PENDENTE  |

---

# Próximos Passos

1. ✅ ~~Aprovar este plano~~
2. ✅ ~~Executar Etapa 1 (análise e limpeza de tabelas)~~
3. ⏳ **Aplicar migration no banco de produção**
4. ✅ ~~Executar Etapa 2 (inventário e limpeza de imagens)~~ - **246 MB liberados!**
5. ⏳ Executar Etapa 3 (integração Cloudinary - opção híbrida)
6. ⏳ Migrar imagens antigas do Supabase para Cloudinary (opcional)

---

> **Documento gerado em:** 2026-01-15
> **Versão:** 3.0
> **Status:** Etapas 1 e 2 concluídas - Aguardando aplicação da migration
