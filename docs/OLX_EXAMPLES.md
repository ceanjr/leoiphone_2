# Exemplos de Uso - Integração OLX

Este arquivo contém exemplos práticos de como usar a integração OLX em diferentes cenários.

## 📝 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Criar Anúncios](#criar-anúncios)
3. [Gerenciar Anúncios](#gerenciar-anúncios)
4. [Automações](#automações)
5. [Consultas SQL](#consultas-sql)

---

## Configuração Inicial

### Exemplo 1: Salvar Configuração OAuth

```typescript
import { salvarConfigOlx } from '@/app/admin/anuncios/olx-actions'

async function configurarOlx() {
  const resultado = await salvarConfigOlx({
    client_id: 'seu_client_id_aqui',
    client_secret: 'seu_client_secret_aqui',
    access_token: 'seu_access_token_aqui',
    sync_enabled: true,
    auto_sync: false,
    sync_interval_minutes: 60,
  })

  if (resultado.success) {
    console.log('✅ Configuração salva!')
  } else {
    console.error('❌ Erro:', resultado.error)
  }
}
```

### Exemplo 2: Testar Conexão

```typescript
import { testarConexaoOlx } from '@/app/admin/anuncios/olx-actions'

async function verificarConexao() {
  const resultado = await testarConexaoOlx()
  
  if (resultado.success) {
    console.log('✅ Conectado à OLX!')
    console.log('Dados do usuário:', resultado.data)
  } else {
    console.error('❌ Falha na conexão:', resultado.error)
  }
}
```

---

## Criar Anúncios

### Exemplo 3: Criar Anúncio Simples

```typescript
import { criarAnuncioOlx } from '@/app/admin/anuncios/olx-actions'

async function publicarProduto(produtoId: string) {
  const resultado = await criarAnuncioOlx({
    produto_id: produtoId,
  })

  if (resultado.success) {
    console.log('✅ Anúncio criado!')
    console.log('ID do anúncio:', resultado.data.id)
    console.log('ID na OLX:', resultado.data.olx_ad_id)
  } else {
    console.error('❌ Erro:', resultado.error)
  }
}

// Uso
publicarProduto('uuid-do-produto-aqui')
```

### Exemplo 4: Criar Anúncio Customizado

```typescript
import { criarAnuncioOlx } from '@/app/admin/anuncios/olx-actions'

async function publicarComCustomizacao(produtoId: string) {
  const resultado = await criarAnuncioOlx({
    produto_id: produtoId,
    titulo: 'iPhone 13 Pro Max 256GB Azul Sierra - Seminovo Premium',
    descricao: `
      iPhone 13 Pro Max em PERFEITO ESTADO!
      
      📱 Especificações:
      • Armazenamento: 256GB
      • Cor: Azul Sierra
      • Bateria: 95% de saúde
      • Estado: Seminovo, sem arranhões
      
      📦 Acompanha:
      • Caixa original
      • Carregador original
      • Cabo Lightning
      • Garantia de 3 meses
      
      🚚 Entrega rápida para todo Brasil!
      💳 Parcele em até 12x no cartão
      
      Entre em contato para mais informações!
    `,
    categoria_olx: '23', // Celulares
  })

  return resultado
}
```

### Exemplo 5: Publicar Múltiplos Produtos

```typescript
import { criarAnuncioOlx, buscarProdutosDisponiveisOlx } from '@/app/admin/anuncios/olx-actions'
import { toast } from 'sonner'

async function publicarEmLote() {
  // Buscar produtos disponíveis
  const { data: produtos } = await buscarProdutosDisponiveisOlx()
  
  if (!produtos || produtos.length === 0) {
    console.log('Nenhum produto disponível')
    return
  }

  // Publicar um por vez (respeitar rate limits)
  for (const produto of produtos) {
    console.log(`Publicando: ${produto.nome}...`)
    
    const resultado = await criarAnuncioOlx({
      produto_id: produto.id,
    })

    if (resultado.success) {
      console.log(`✅ ${produto.nome} publicado!`)
      toast.success(`${produto.nome} publicado com sucesso!`)
    } else {
      console.error(`❌ Erro em ${produto.nome}:`, resultado.error)
      toast.error(`Erro ao publicar ${produto.nome}`)
    }

    // Aguardar 2 segundos entre publicações (evitar rate limit)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('Publicação em lote concluída!')
}
```

---

## Gerenciar Anúncios

### Exemplo 6: Listar Anúncios

```typescript
import { listarAnunciosOlx } from '@/app/admin/anuncios/olx-actions'

async function verAnuncios() {
  const resultado = await listarAnunciosOlx()
  
  if (resultado.success && resultado.data) {
    console.log(`Total de anúncios: ${resultado.data.length}`)
    
    // Agrupar por status
    const porStatus = resultado.data.reduce((acc, anuncio) => {
      acc[anuncio.status] = (acc[anuncio.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('Por status:', porStatus)
    
    // Listar os 5 mais recentes
    const recentes = resultado.data.slice(0, 5)
    console.log('\nAnúncios recentes:')
    recentes.forEach(a => {
      console.log(`- ${a.produto_nome} (${a.status})`)
    })
  }
}
```

### Exemplo 7: Atualizar Preço

```typescript
import { atualizarAnuncioOlx, listarAnunciosOlx } from '@/app/admin/anuncios/olx-actions'

async function atualizarPrecos(desconto: number) {
  const { data: anuncios } = await listarAnunciosOlx()
  
  if (!anuncios) return
  
  for (const anuncio of anuncios) {
    if (anuncio.status !== 'anunciado') continue
    
    const novoPreco = anuncio.preco * (1 - desconto / 100)
    
    const resultado = await atualizarAnuncioOlx({
      anuncio_id: anuncio.id,
      preco: novoPreco,
    })
    
    if (resultado.success) {
      console.log(`✅ ${anuncio.produto_nome}: R$ ${anuncio.preco} → R$ ${novoPreco}`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// Aplicar 10% de desconto em todos
atualizarPrecos(10)
```

### Exemplo 8: Remover Anúncios Antigos

```typescript
import { removerAnuncioOlx, listarAnunciosOlx } from '@/app/admin/anuncios/olx-actions'

async function limparAnunciosAntigos(diasAtras: number = 30) {
  const { data: anuncios } = await listarAnunciosOlx()
  
  if (!anuncios) return
  
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasAtras)
  
  const antigos = anuncios.filter(a => {
    const dataAnuncio = new Date(a.created_at)
    return dataAnuncio < dataLimite
  })
  
  console.log(`Encontrados ${antigos.length} anúncios com mais de ${diasAtras} dias`)
  
  for (const anuncio of antigos) {
    console.log(`Removendo: ${anuncio.produto_nome}...`)
    
    const resultado = await removerAnuncioOlx(anuncio.id)
    
    if (resultado.success) {
      console.log(`✅ Removido`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
```

### Exemplo 9: Republicar Anúncios com Erro

```typescript
import { 
  listarAnunciosOlx, 
  removerAnuncioOlx, 
  criarAnuncioOlx 
} from '@/app/admin/anuncios/olx-actions'

async function republicarErros() {
  const { data: anuncios } = await listarAnunciosOlx()
  
  if (!anuncios) return
  
  const comErro = anuncios.filter(a => a.status === 'erro')
  
  console.log(`Encontrados ${comErro.length} anúncios com erro`)
  
  for (const anuncio of comErro) {
    console.log(`\nRepublicando: ${anuncio.produto_nome}`)
    
    // 1. Remover o anúncio com erro
    await removerAnuncioOlx(anuncio.id, true) // forceLocal = true
    
    // 2. Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 3. Criar novamente
    const resultado = await criarAnuncioOlx({
      produto_id: anuncio.produto_id,
      titulo: anuncio.titulo,
      descricao: anuncio.descricao,
    })
    
    if (resultado.success) {
      console.log(`✅ Republicado com sucesso!`)
    } else {
      console.error(`❌ Erro novamente:`, resultado.error)
    }
    
    // Aguardar entre republicações
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}
```

---

## Automações

### Exemplo 10: Sincronização Automática

```typescript
import { 
  listarAnunciosOlx, 
  atualizarAnuncioOlx 
} from '@/app/admin/anuncios/olx-actions'
import { createClient } from '@/lib/supabase/server'

async function sincronizarEstoque() {
  const supabase = await createClient()
  const { data: anuncios } = await listarAnunciosOlx()
  
  if (!anuncios) return
  
  for (const anuncio of anuncios) {
    // Buscar produto atualizado
    const { data: produto } = await supabase
      .from('produtos')
      .select('preco, estoque')
      .eq('id', anuncio.produto_id)
      .single()
    
    if (!produto) continue
    
    // Se preço mudou, atualizar
    if (produto.preco !== anuncio.preco) {
      console.log(`Atualizando preço de ${anuncio.produto_nome}`)
      
      await atualizarAnuncioOlx({
        anuncio_id: anuncio.id,
        preco: produto.preco,
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('Sincronização concluída!')
}

// Executar a cada hora
setInterval(sincronizarEstoque, 60 * 60 * 1000)
```

### Exemplo 11: Notificar Erros

```typescript
import { listarAnunciosOlx } from '@/app/admin/anuncios/olx-actions'

async function monitorarErros() {
  const { data: anuncios } = await listarAnunciosOlx()
  
  if (!anuncios) return
  
  const comErro = anuncios.filter(a => a.status === 'erro')
  
  if (comErro.length > 0) {
    console.log(`⚠️ ALERTA: ${comErro.length} anúncios com erro!`)
    
    // Enviar notificação (email, Slack, etc)
    const mensagem = comErro.map(a => 
      `• ${a.produto_nome}: ${a.erro_mensagem}`
    ).join('\n')
    
    console.log('\nErros:\n', mensagem)
    
    // Aqui você pode integrar com:
    // - Nodemailer (email)
    // - Slack webhook
    // - Discord webhook
    // - Telegram bot
  }
}

// Verificar a cada 15 minutos
setInterval(monitorarErros, 15 * 60 * 1000)
```

---

## Consultas SQL

### Exemplo 12: Relatório de Performance

```sql
-- Anúncios por status
SELECT 
  status,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual
FROM olx_anuncios
GROUP BY status
ORDER BY quantidade DESC;

-- Top 5 produtos mais anunciados
SELECT 
  produto_nome,
  COUNT(*) as total_anuncios,
  SUM(CASE WHEN status = 'anunciado' THEN 1 ELSE 0 END) as ativos,
  SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as erros
FROM v_olx_anuncios_com_produto
GROUP BY produto_nome
ORDER BY total_anuncios DESC
LIMIT 5;

-- Anúncios criados por dia (última semana)
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as criados,
  COUNT(*) FILTER (WHERE status = 'anunciado') as sucesso,
  COUNT(*) FILTER (WHERE status = 'erro') as erro
FROM olx_anuncios
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;
```

### Exemplo 13: Análise de Erros

```sql
-- Erros mais comuns
SELECT 
  SUBSTRING(erro_mensagem, 1, 100) as erro,
  COUNT(*) as ocorrencias
FROM olx_anuncios
WHERE status = 'erro'
GROUP BY SUBSTRING(erro_mensagem, 1, 100)
ORDER BY ocorrencias DESC
LIMIT 10;

-- Produtos que falharam mais
SELECT 
  produto_nome,
  COUNT(*) as tentativas,
  MAX(erro_mensagem) as ultimo_erro
FROM v_olx_anuncios_com_produto
WHERE status = 'erro'
GROUP BY produto_nome
ORDER BY tentativas DESC;

-- Log de erros nas últimas 24h
SELECT 
  acao,
  mensagem,
  created_at
FROM olx_sync_log
WHERE status = 'erro'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Exemplo 14: Limpeza de Dados

```sql
-- Remover anúncios de produtos deletados
DELETE FROM olx_anuncios
WHERE produto_id IN (
  SELECT id FROM produtos WHERE deleted_at IS NOT NULL
);

-- Limpar logs antigos (mais de 90 dias)
DELETE FROM olx_sync_log
WHERE created_at < NOW() - INTERVAL '90 days';

-- Resetar anúncios com erro para tentar novamente
UPDATE olx_anuncios
SET status = 'pendente', erro_mensagem = NULL
WHERE status = 'erro'
  AND created_at >= NOW() - INTERVAL '7 days';
```

---

## 🎯 Dicas de Uso

1. **Rate Limits**: Sempre adicione delay entre requisições (1-2 segundos)
2. **Logs**: Monitore `olx_sync_log` diariamente
3. **Erros**: Use `republicarErros()` semanalmente
4. **Preços**: Sincronize com `sincronizarEstoque()` regularmente
5. **Limpeza**: Execute queries de limpeza mensalmente

---

## 📚 Referências

- [Documentação Completa](./OLX_INTEGRATION.md)
- [Guia Rápido](./OLX_QUICK_START.md)
- [Resumo da Implementação](./OLX_IMPLEMENTATION_SUMMARY.md)

**Precisa de mais exemplos?** Consulte a documentação ou crie uma issue! 🚀
