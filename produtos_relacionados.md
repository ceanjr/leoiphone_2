# Implementação de Produtos Relacionados

## Objetivo

Adicionar seção de produtos relacionados na página de produto com recomendações inteligentes e gerenciamento manual por categoria.

## Requisitos Funcionais

### 1. Exibição na Página do Produto

- Adicionar seção "Produtos Relacionados" abaixo da descrição (acima das especificações) do produto
- Layout minimalista exibindo até 3 produtos
- Cada produto deve mostrar:
  - Nome do produto
  - Preço original (riscado)
  - Preço com 5% de desconto
  - Ícone visual indicando desconto (ex: tag, porcentagem, oferta)
- Design responsivo

### 2. Lógica de Relacionamento Automático

Implementar sistema inteligente baseado em:

**Para iPhones e Smartphones:**

- Cabos (USB-C, Lightning, USB-C to USB-C)
- Carregadores (20w, portáteis, veiculares, sem fio)
- Fones de Ouvido (Airpods, JBL, Peining)
- Capinhas/películas (se houver categoria específica)
- Outros acessórios Apple (AirTag, Pencil)

**Para Apple Watch:**

- Carregadores sem fio
- Cabos USB-C
- Outros Apple Watch (modelos diferentes)

**Para iPad/Tablets:**

- Apple Pencil (1ª e 2ª geração, USB-C, Baseus)
- Capas com teclado
- Carregadores USB-C

**Para Cabos/Carregadores:**

- Outros cabos/carregadores
- Power banks
- Carregadores veiculares

**Regras de Seleção:**

- Por padrão, selecionar 3 produtos aleatórios da lista de relacionados
- Priorizar produtos em estoque (Ativo = "Sim")
- Evitar sugerir o mesmo produto sendo visualizado
- Se houver configuração manual, usar essa configuração

### 3. Gerenciamento em Admin/Categorias

**Interface:**

- No card de cada categoria, adicionar botão "Configurar Produtos Relacionados"
- Botão deve abrir modal (desktop) ou bottom sheet (mobile)

**Modal/Bottom Sheet deve conter:**

- Toggle: "Usar seleção automática" (padrão: ativo)
- Se toggle desativado, mostrar:
  - Continuar mostrando os produtos relacionados de forma aleatória, mas quando houver seleção manual, priorizar seleção manual
  - Lista de todos os produtos disponíveis (com busca/filtro)
  - Checkbox para selecionar produtos específicos
  - Indicador visual de quantos produtos estão selecionados
  - Limite de seleção configurável (sugestão: 5-10 produtos para rotação aleatória)
- Botões: "Salvar" e "Cancelar"

**Armazenamento:**

- Salvar configuração no banco de dados associada à categoria
- Estrutura sugerida:

```json
  {
    "categoria_id": "iPhone 13",
    "auto_select": true/false,
    "produtos_relacionados": ["id1", "id2", "id3", ...]
  }
- Adapte para que faça sentido no nosso projeto
```

### 4. Cálculo de Desconto

- Aplicar 5% de desconto sobre o preço original
- O valor do desconto deve poder ser alterado em admin/categorias ao lado do botão nova categoria
- Exibir ambos os preços (original riscado + com desconto)
- Formatar valores em BRL (R$ X.XXX,XX)

## Especificações Técnicas

### Componentes a Criar/Modificar:

1. `ProdutosRelacionados.tsx` - Componente de exibição
2. `ModalProdutosRelacionados.tsx` - Modal de configuração
3. API endpoint para salvar/buscar configurações
4. Função utilitária para lógica de seleção automática

### Pontos de atenção

- Analise nossos produtos e faça uma seleção aleatória inteligente de produtos relacionados para cada categoria
- Evitar recomendar um celular para alguem que está na página de um celular
- A seleção inteligente deve ser aleatória, mas a partir do momento que é feita, os produtos relacionados não mudam
- No admin/categorias, também deve ter um botão de resetar produtos relacionados, onde ao clicar aleatoriza novamente os produtos.

### Considerações de UX:

- Loading state durante carregamento dos produtos
- Fallback se não houver produtos relacionados
- Animação suave ao carregar produtos
- Os produtos relacionados devem ser do tipo checkbox
- Caso o usuario selecione um produto no checkbox, ao clicar em enviar para whatsapp, deve-se ter no texto do whatsapp o produto da pagina + produtos do checkbox e no link que também é enviado para o whatsapp, ao acessá-lo, já deve levar para a página com os checkbox selecionados

### Acessibilidade:

- Labels adequados para screen readers
- Contraste suficiente para ícone de desconto
- Navegação por teclado funcional no modal

## Entregáveis

1. Componente de produtos relacionados funcional
2. Sistema de gerenciamento em admin/categorias
3. Lógica de seleção automática implementada
4. Persistência de configurações manuais
5. Testes básicos de funcionamento

## Adicionais

- Aproveite e faça correções no código: Modal (mobile bottom sheet) de whatsapp está bugado e fica no meio da tela
- Ao abrir o site (já autenticado), a tela pisca algumas vezes como se tivesse um modal querendo abrir mas desaparecendo
- O botão "tenho interesse" está bugado no mobile, saindo um pouco da tela. Diminua o tamanho do botão no whatsapp ou transforme-o em um link (devidamente estilizado) com icone
