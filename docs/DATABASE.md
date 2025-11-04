# 🗄️ Documentação do Banco de Dados - Léo iPhone

> Guia completo da estrutura do banco de dados PostgreSQL no Supabase

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tabelas](#tabelas)
- [Relacionamentos](#relacionamentos)
- [Índices](#índices)
- [Policies RLS](#policies-rls)
- [Functions e Triggers](#functions-e-triggers)
- [Storage](#storage)
- [Queries Comuns](#queries-comuns)

---

## 🎯 Visão Geral

### Tecnologia
- **Banco**: PostgreSQL 15+
- **Provider**: Supabase
- **Segurança**: Row Level Security (RLS) habilitado
- **Features**: Triggers, Functions, Policies

### Diagrama ER (Simplificado)

```
┌──────────────┐         ┌──────────────┐
│  categorias  │◄────┐   │   produtos   │
└──────────────┘     │   └──────────────┘
                     │          ▲
                     │          │
                     └──────────┤
                                │
┌──────────────┐                │
│secoes_home   │                │
└──────────────┘                │
       ▲                        │
       │                        │
       └────────┬───────────────┘
                │
        ┌───────────────┐
        │produtos_secoes│
        └───────────────┘

┌──────────────┐         ┌──────────────┐
│ avaliacoes   │────────►│   produtos   │
└──────────────┘         └──────────────┘

┌──────────────┐
│   banners    │
└──────────────┘

┌──────────────────┐         ┌──────────────┐
│visualizacoes_    │────────►│   produtos   │
│    diarias       │         └──────────────┘
└──────────────────┘

┌──────────────────┐         ┌──────────────┐
│historico_precos  │────────►│   produtos   │
└──────────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐
│  favoritos   │────────►│   produtos   │
└──────────────┘         └──────────────┘
```

---

## 📊 Tabelas

### `categorias`

Categorias de produtos (ex: iPhone 15, iPhone 14, Acessórios)

```sql
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos**:
- `id`: UUID único
- `nome`: Nome da categoria (ex: "iPhone 15 Pro Max")
- `slug`: URL-friendly (ex: "iphone-15-pro-max")
- `ordem`: Ordem de exibição
- `ativo`: Se está visível no catálogo
- `created_at`, `updated_at`: Timestamps automáticos

**Índices**:
- `idx_categorias_slug` - Busca por slug
- `idx_categorias_ativo` - Filtro de ativos
- `idx_categorias_ordem` - Ordenação

**Exemplos**:
| id | nome | slug | ordem | ativo |
|----|------|------|-------|-------|
| uuid-1 | iPhone 15 Pro Max | iphone-15-pro-max | 1 | true |
| uuid-2 | iPhone 15 | iphone-15 | 2 | true |

---

### `produtos`

Produtos (iPhones novos e seminovos)

```sql
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_produto TEXT UNIQUE,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  nivel_bateria INTEGER CHECK (nivel_bateria >= 0 AND nivel_bateria <= 100),
  condicao TEXT NOT NULL CHECK (condicao IN ('novo', 'seminovo')),
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  garantia TEXT DEFAULT 'nenhuma'
    CHECK (garantia IN ('nenhuma', '3_meses', '6_meses', '1_ano')),
  acessorios JSONB DEFAULT '{"caixa": false, "carregador": false, "capinha": false, "pelicula": false}'::jsonb,
  fotos TEXT[] NOT NULL DEFAULT '{}',
  foto_principal TEXT,
  ativo BOOLEAN DEFAULT true,
  estoque INTEGER DEFAULT 1,
  visualizacoes_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Campos Principais**:
- `codigo_produto`: Código interno (opcional, único)
- `nome`: Nome do produto
- `slug`: URL (gerado do nome)
- `preco`: Preço em reais (decimal)
- `nivel_bateria`: 0-100 (null se novo)
- `condicao`: 'novo' ou 'seminovo'
- `categoria_id`: FK para categorias
- `garantia`: Tipo de garantia
- `acessorios`: JSON com itens inclusos
- `fotos`: Array de URLs
- `foto_principal`: URL da foto principal
- `estoque`: Quantidade disponível
- `deleted_at`: Soft delete (null = ativo)

**Constraints**:
- `nivel_bateria` entre 0 e 100
- `condicao` apenas 'novo' ou 'seminovo'
- `garantia` apenas valores específicos
- `slug` único (para URLs)
- `codigo_produto` único (se fornecido)

**Índices**:
- `idx_produtos_categoria` - Join com categorias
- `idx_produtos_ativo` - Filtro de ativos
- `idx_produtos_slug` - Busca por slug
- `idx_produtos_preco` - Ordenação por preço
- `idx_produtos_condicao` - Filtro novo/seminovo
- `idx_produtos_deleted` - Soft delete
- `idx_produtos_created` - Ordenação recentes

**Exemplo de acessorios (JSONB)**:
```json
{
  "caixa": true,
  "carregador": true,
  "capinha": false,
  "pelicula": true
}
```

---

### `avaliacoes`

Avaliações de clientes

```sql
CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  depoimento TEXT NOT NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  aprovado BOOLEAN DEFAULT false,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos**:
- `nome_cliente`: Nome de quem avaliou
- `nota`: 1 a 5 estrelas
- `depoimento`: Texto da avaliação
- `produto_id`: FK opcional (avaliação geral ou de produto)
- `aprovado`: Se foi aprovada pelo admin
- `destaque`: Se deve aparecer em destaque

**Índices**:
- `idx_avaliacoes_aprovado` - Filtro aprovadas
- `idx_avaliacoes_produto` - Avaliações de um produto
- `idx_avaliacoes_nota` - Ordenação por nota
- `idx_avaliacoes_destaque` - Destacadas

**Workflow**:
1. Cliente envia avaliação (`aprovado = false`)
2. Admin aprova (`aprovado = true`)
3. Admin pode destacar (`destaque = true`)
4. Aparece no site apenas se `aprovado = true`

---

### `banners`

Banners do carrossel da home

```sql
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  tipo_link TEXT NOT NULL CHECK (tipo_link IN ('externo', 'produto', 'categoria')),
  link_valor TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos**:
- `titulo`: Título do banner
- `imagem_url`: URL da imagem
- `tipo_link`: Para onde o banner leva
- `link_valor`: Valor do link (URL, produto ID, etc.)
- `ordem`: Ordem de exibição
- `ativo`: Se está visível

**Tipos de Link**:
- `externo`: URL externa (link_valor = "https://...")
- `produto`: Produto específico (link_valor = produto_id)
- `categoria`: Categoria específica (link_valor = categoria_id)

**Índices**:
- `idx_banners_ativo` - Filtro ativos
- `idx_banners_ordem` - Ordenação

---

### `secoes_home`

Seções de destaque da homepage

```sql
CREATE TABLE secoes_home (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT UNIQUE NOT NULL
    CHECK (tipo IN ('destaques', 'promocoes', 'lancamentos')),
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos**:
- `tipo`: Identificador único da seção
- `titulo`: Título exibido (ex: "Produtos em Destaque")
- `subtitulo`: Subtítulo (ex: "Os melhores iPhones...")
- `ativo`: Se está visível
- `ordem`: Ordem de exibição

**Dados Iniciais**:
```sql
INSERT INTO secoes_home (tipo, titulo, subtitulo, ordem) VALUES
  ('destaques', 'Produtos em Destaque', 'Os melhores iPhones selecionados para você', 1),
  ('promocoes', 'Promoções Imperdíveis', 'Ofertas especiais com os melhores preços', 2),
  ('lancamentos', 'Lançamentos', 'Novidades recém-chegadas', 3);
```

**Índices**:
- `idx_secoes_tipo` - Busca por tipo
- `idx_secoes_ativo` - Filtro ativos
- `idx_secoes_ordem` - Ordenação

---

### `produtos_secoes`

Relacionamento many-to-many entre produtos e seções

```sql
CREATE TABLE produtos_secoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  secao_id UUID NOT NULL REFERENCES secoes_home(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id, secao_id)
);
```

**Campos**:
- `produto_id`: FK para produtos
- `secao_id`: FK para secoes_home
- `ordem`: Ordem do produto dentro da seção
- UNIQUE: Produto não pode estar duplicado na mesma seção

**Uso**:
```sql
-- Buscar produtos da seção "destaques"
SELECT p.* FROM produtos p
JOIN produtos_secoes ps ON p.id = ps.produto_id
JOIN secoes_home s ON ps.secao_id = s.id
WHERE s.tipo = 'destaques'
ORDER BY ps.ordem;
```

**Índices**:
- `idx_produtos_secoes_produto` - Join com produtos
- `idx_produtos_secoes_secao` - Join com seções
- `idx_produtos_secoes_ordem` - Ordenação

---

### `visualizacoes_diarias`

Analytics agregado de visualizações por dia

```sql
CREATE TABLE visualizacoes_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  total_views INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id, data)
);
```

**Campos**:
- `produto_id`: FK para produtos
- `data`: Data (sem hora)
- `total_views`: Contador de views naquele dia
- UNIQUE: Uma linha por produto por dia

**Como Funciona**:
```sql
-- Incrementar view
INSERT INTO visualizacoes_diarias (produto_id, data, total_views)
VALUES ('uuid', CURRENT_DATE, 1)
ON CONFLICT (produto_id, data)
DO UPDATE SET total_views = visualizacoes_diarias.total_views + 1;
```

**Índices**:
- `idx_visualizacoes_produto` - Agregar por produto
- `idx_visualizacoes_data` - Filtro por data

---

### `historico_precos`

Histórico de mudanças de preço

```sql
CREATE TABLE historico_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  preco_anterior DECIMAL(10,2) NOT NULL,
  preco_novo DECIMAL(10,2) NOT NULL,
  percentual_mudanca DECIMAL(5,2),
  alterado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos**:
- `produto_id`: FK para produtos
- `preco_anterior`: Preço antes da mudança
- `preco_novo`: Novo preço
- `percentual_mudanca`: % de aumento/redução
- `alterado_por`: FK para usuário que alterou

**Trigger Automático**:
Registra automaticamente quando o preço de um produto muda

**Índices**:
- `idx_historico_produto` - Histórico de um produto
- `idx_historico_data` - Ordenação cronológica

---

### `favoritos`

Produtos favoritados por usuários

```sql
CREATE TABLE favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos**:
- `user_id`: FK para usuário logado (nullable)
- `produto_id`: FK para produtos
- `session_id`: ID de sessão para não-logados

**Suporta**:
- Usuários logados (via `user_id`)
- Usuários anônimos (via `session_id`)

**Índices**:
- `idx_favoritos_user` - Favoritos de um usuário
- `idx_favoritos_produto` - Quem favoritou um produto
- `idx_favoritos_session` - Favoritos de sessão anônima

---

## 🔗 Relacionamentos

### Um para Muitos (1:N)

```
categorias (1) ──► (N) produtos
produtos (1) ──► (N) avaliacoes
produtos (1) ──► (N) visualizacoes_diarias
produtos (1) ──► (N) historico_precos
produtos (1) ──► (N) favoritos
```

### Muitos para Muitos (N:M)

```
produtos (N) ◄──► produtos_secoes ◄──► (M) secoes_home
```

---

## 📑 Índices

### Por que Índices?

- **Performance**: Queries mais rápidas
- **Joins**: Relacionamentos eficientes
- **Filtros**: Busca rápida

### Lista Completa

```sql
-- Categorias
CREATE INDEX idx_categorias_slug ON categorias(slug);
CREATE INDEX idx_categorias_ativo ON categorias(ativo) WHERE ativo = true;
CREATE INDEX idx_categorias_ordem ON categorias(ordem);

-- Produtos
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo) WHERE ativo = true;
CREATE INDEX idx_produtos_slug ON produtos(slug);
CREATE INDEX idx_produtos_preco ON produtos(preco);
CREATE INDEX idx_produtos_condicao ON produtos(condicao);
CREATE INDEX idx_produtos_codigo ON produtos(codigo_produto);
CREATE INDEX idx_produtos_deleted ON produtos(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_produtos_created ON produtos(created_at DESC);

-- Avaliacoes
CREATE INDEX idx_avaliacoes_aprovado ON avaliacoes(aprovado) WHERE aprovado = true;
CREATE INDEX idx_avaliacoes_produto ON avaliacoes(produto_id);
CREATE INDEX idx_avaliacoes_nota ON avaliacoes(nota);
CREATE INDEX idx_avaliacoes_destaque ON avaliacoes(destaque) WHERE destaque = true;

-- Banners
CREATE INDEX idx_banners_ativo ON banners(ativo) WHERE ativo = true;
CREATE INDEX idx_banners_ordem ON banners(ordem);

-- Seções
CREATE INDEX idx_secoes_tipo ON secoes_home(tipo);
CREATE INDEX idx_secoes_ativo ON secoes_home(ativo) WHERE ativo = true;
CREATE INDEX idx_secoes_ordem ON secoes_home(ordem);

-- Produtos-Seções
CREATE INDEX idx_produtos_secoes_produto ON produtos_secoes(produto_id);
CREATE INDEX idx_produtos_secoes_secao ON produtos_secoes(secao_id);
CREATE INDEX idx_produtos_secoes_ordem ON produtos_secoes(secao_id, ordem);

-- Visualizações
CREATE INDEX idx_visualizacoes_produto ON visualizacoes_diarias(produto_id);
CREATE INDEX idx_visualizacoes_data ON visualizacoes_diarias(data DESC);

-- Histórico
CREATE INDEX idx_historico_produto ON historico_precos(produto_id);
CREATE INDEX idx_historico_data ON historico_precos(created_at DESC);

-- Favoritos
CREATE INDEX idx_favoritos_user ON favoritos(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_favoritos_produto ON favoritos(produto_id);
CREATE INDEX idx_favoritos_session ON favoritos(session_id) WHERE session_id IS NOT NULL;
```

---

## 🔐 Policies RLS (Row Level Security)

### Categorias

```sql
-- Leitura pública
CREATE POLICY "Categorias ativas são públicas" ON categorias
  FOR SELECT
  USING (ativo = true);

-- Admins podem tudo
CREATE POLICY "Admins podem gerenciar categorias" ON categorias
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Produtos

```sql
-- Leitura pública (apenas ativos e não deletados)
CREATE POLICY "Produtos ativos são públicos" ON produtos
  FOR SELECT
  USING (ativo = true AND deleted_at IS NULL);

-- Admins podem tudo
CREATE POLICY "Admins podem gerenciar produtos" ON produtos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Avaliações

```sql
-- Leitura pública (apenas aprovadas)
CREATE POLICY "Avaliações aprovadas são públicas" ON avaliacoes
  FOR SELECT
  USING (aprovado = true);

-- Qualquer um pode criar
CREATE POLICY "Qualquer um pode criar avaliação" ON avaliacoes
  FOR INSERT
  WITH CHECK (true);

-- Admins podem gerenciar
CREATE POLICY "Admins podem gerenciar avaliações" ON avaliacoes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Banners, Seções, etc.

Similar ao padrão:
- **SELECT**: Público para ativos
- **ALL**: Authenticated (admins)

---

## ⚙️ Functions e Triggers

### Function: Incrementar Visualização

```sql
CREATE OR REPLACE FUNCTION incrementar_visualizacao(p_produto_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Incrementa contador diário
  INSERT INTO visualizacoes_diarias (produto_id, data, total_views)
  VALUES (p_produto_id, CURRENT_DATE, 1)
  ON CONFLICT (produto_id, data)
  DO UPDATE SET total_views = visualizacoes_diarias.total_views + 1;

  -- Incrementa contador total
  UPDATE produtos
  SET visualizacoes_total = visualizacoes_total + 1
  WHERE id = p_produto_id;
END;
$$;
```

**Uso**:
```sql
SELECT incrementar_visualizacao('produto-uuid');
```

### Function: Registrar Mudança de Preço

```sql
CREATE OR REPLACE FUNCTION registrar_mudanca_preco()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.preco IS DISTINCT FROM NEW.preco THEN
    INSERT INTO historico_precos (
      produto_id,
      preco_anterior,
      preco_novo,
      percentual_mudanca,
      alterado_por
    ) VALUES (
      NEW.id,
      OLD.preco,
      NEW.preco,
      ((NEW.preco - OLD.preco) / OLD.preco) * 100,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;
```

**Trigger**:
```sql
CREATE TRIGGER trigger_historico_precos
AFTER UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION registrar_mudanca_preco();
```

### Function: Atualizar updated_at

```sql
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

**Triggers em Todas as Tabelas**:
```sql
CREATE TRIGGER trigger_categorias_updated_at
BEFORE UPDATE ON categorias
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

-- Repetir para: produtos, avaliacoes, banners, secoes_home
```

---

## 📦 Storage

### Bucket: `produtos`

**Configuração**:
- **Nome**: produtos
- **Público**: Sim (read)
- **Tamanho Máximo**: 5MB por arquivo
- **Tipos Permitidos**: image/jpeg, image/jpg, image/png, image/webp

**Estrutura de Pastas**:
```
produtos/
└── [timestamp]-[random].[ext]
    ├── 1706123456789-abc123.jpg
    ├── 1706123457890-def456.png
    └── ...
```

**Políticas**:
```sql
-- Leitura pública
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

-- Upload apenas admins
CREATE POLICY "Admins podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'produtos');

-- Update/Delete apenas admins
CREATE POLICY "Admins podem atualizar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'produtos');

CREATE POLICY "Admins podem deletar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'produtos');
```

---

## 📝 Queries Comuns

### Listar Produtos do Catálogo

```sql
SELECT
  p.*,
  c.nome as categoria_nome,
  c.slug as categoria_slug
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.ativo = true
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 20 OFFSET 0;
```

### Buscar Produto por Slug

```sql
SELECT
  p.*,
  c.nome as categoria_nome
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.slug = 'iphone-15-pro-max-256gb'
  AND p.ativo = true
  AND p.deleted_at IS NULL;
```

### Produtos de uma Seção

```sql
SELECT p.*, ps.ordem
FROM produtos p
JOIN produtos_secoes ps ON p.id = ps.produto_id
JOIN secoes_home s ON ps.secao_id = s.id
WHERE s.tipo = 'destaques'
  AND s.ativo = true
  AND p.ativo = true
  AND p.deleted_at IS NULL
ORDER BY ps.ordem ASC;
```

### Estatísticas do Dashboard

```sql
-- Total de produtos
SELECT COUNT(*) FROM produtos WHERE deleted_at IS NULL;

-- Produtos ativos
SELECT COUNT(*) FROM produtos WHERE ativo = true AND deleted_at IS NULL;

-- Produtos por categoria
SELECT c.nome, COUNT(p.id) as total
FROM categorias c
LEFT JOIN produtos p ON c.id = p.categoria_id AND p.deleted_at IS NULL
GROUP BY c.id, c.nome
ORDER BY total DESC;

-- Produtos mais visualizados (últimos 30 dias)
SELECT p.nome, SUM(v.total_views) as views
FROM produtos p
JOIN visualizacoes_diarias v ON p.id = v.produto_id
WHERE v.data >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.nome
ORDER BY views DESC
LIMIT 10;
```

### Avaliações Pendentes

```sql
SELECT
  a.*,
  p.nome as produto_nome,
  p.foto_principal
FROM avaliacoes a
LEFT JOIN produtos p ON a.produto_id = p.id
WHERE a.aprovado = false
ORDER BY a.created_at DESC;
```

---

## 🔄 Manutenção

### Backup

```sql
-- Exportar dados
pg_dump -h seu-host -U postgres -d seu-banco > backup.sql

-- Restaurar
psql -h seu-host -U postgres -d seu-banco < backup.sql
```

### Limpar Dados Antigos

```sql
-- Deletar visualizações antigas (> 1 ano)
DELETE FROM visualizacoes_diarias
WHERE data < CURRENT_DATE - INTERVAL '1 year';

-- Deletar histórico de preços antigo (> 2 anos)
DELETE FROM historico_precos
WHERE created_at < NOW() - INTERVAL '2 years';
```

### Analisar Performance

```sql
-- Ver queries lentas
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Ver índices não usados
SELECT * FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

---

## ✅ Checklist de Alterações no Banco

Ao modificar o banco:

- [ ] Atualizar SQL schema file
- [ ] Criar/atualizar índices
- [ ] Atualizar políticas RLS
- [ ] Atualizar tipos TypeScript
- [ ] Testar queries
- [ ] **Atualizar este documento (DATABASE.md)**
- [ ] Atualizar FILE-MAP.md
- [ ] Fazer backup antes de aplicar em produção

---

**📅 Última atualização**: 2025-01-25
**📊 Total de tabelas**: 9
**🔐 RLS**: Habilitado em todas
**📦 Storage**: 1 bucket (produtos)
