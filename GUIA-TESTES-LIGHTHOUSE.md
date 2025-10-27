# 🔬 Guia de Testes Lighthouse - Performance

## 📋 Mensagens Esperadas Durante o Teste

### ✅ **Mensagens Positivas (Normais):**

1. **"Images loaded lazily and replaced with placeholders"**
   - ✅ Isso é **BOM** - significa que lazy loading está funcionando
   - ✅ Lighthouse está testando o comportamento de carregamento diferido
   - ✅ Load events sendo adiados corretamente

2. **"Load events are deferred"**
   - ✅ Eventos de load sendo adiados para melhor performance
   - ✅ Lighthouse está validando que imagens não bloqueiam o render

---

## 🧪 Como Testar Corretamente no Lighthouse

### **1. Preparação do Ambiente**

```bash
# 1. Build de produção
npm run build

# 2. Iniciar servidor de produção
npm start
```

### **2. Configuração do Lighthouse**

**No Chrome DevTools:**

1. Abrir **DevTools** (F12)
2. Ir na aba **"Lighthouse"**
3. Configurar:
   ```
   Mode: Navigation
   Device: Mobile
   Categories: ✅ Performance, ✅ Accessibility, ✅ Best Practices, ✅ SEO
   ```

4. **Importante - Configurações Avançadas:**
   - ✅ Clear storage: Habilitado
   - ✅ Simulated throttling: Habilitado
   - ✅ Device: Moto G Power (ou similar)

5. Clicar em **"Analyze page load"**

### **3. Executar Teste em Modo Anônimo**

**Por que modo anônimo?**
- ✅ Sem extensões do navegador interferindo
- ✅ Sem cache anterior
- ✅ Resultado mais preciso

```bash
# Abrir Chrome em modo anônimo
Ctrl + Shift + N (Windows/Linux)
Cmd + Shift + N (Mac)
```

---

## 📊 Métricas a Observar

### **Core Web Vitals:**

| Métrica | Meta | Esperado |
|---------|------|----------|
| **LCP** | < 2.5s | 1.5-2.2s ✅ |
| **FID** | < 100ms | < 50ms ✅ |
| **CLS** | < 0.1 | 0.05-0.08 ✅ |
| **FCP** | < 1.8s | 0.8-1.0s ✅ |
| **TBT** | < 200ms | 50-80ms ✅ |
| **SI** | < 3.4s | 2.0-2.8s ✅ |

### **Scores Esperados:**

- 🟢 **Performance**: 85-92+
- 🟢 **Accessibility**: 90-95+
- 🟢 **Best Practices**: 95-100
- 🟢 **SEO**: 100

---

## 🎯 Interpretando Mensagens do Lighthouse

### **✅ Mensagens Boas (Ignorar):**

```
[Intervention] Images loaded lazily and replaced with placeholders
→ Significa: Lazy loading funcionando corretamente

[Intervention] Load events are deferred
→ Significa: Eventos otimizados para melhor performance

DNS prefetch for https://...
→ Significa: DNS otimizado está funcionando
```

### **⚠️ Avisos que Podem Aparecer (Normais):**

```
Route /admin/dashboard couldn't be rendered statically
→ Esperado: Rotas admin usam autenticação dinâmica

Lighthouse was unable to determine the language of the page
→ Solução: Já temos lang="pt-BR" no HTML ✅
```

### **❌ Erros Críticos (Não devem aparecer):**

```
Largest Contentful Paint element was not detected
→ Se aparecer: verificar se imagens estão carregando

Cumulative Layout Shift > 0.1
→ Se aparecer: verificar dimensões fixas nas imagens
```

---

## 🔧 Troubleshooting

### **Se Performance < 85:**

1. **Verificar se está em produção:**
   ```bash
   npm run build && npm start
   # NÃO usar: npm run dev
   ```

2. **Limpar cache:**
   ```bash
   # DevTools → Application → Clear storage
   # Ou: Ctrl + Shift + Del
   ```

3. **Testar em modo anônimo**

4. **Verificar Network throttling:**
   - Lighthouse deve usar "Simulated throttling"
   - Não usar "Applied throttling" manualmente

### **Se LCP > 2.5s:**

1. Verificar se banner tem `priority`:
   ```tsx
   <Image priority />
   ```

2. Verificar sizes responsivos:
   ```tsx
   sizes="(max-width: 768px) 100vw, 1200px"
   ```

3. Verificar se imagem é otimizada (WebP/AVIF)

### **Se CLS > 0.1:**

1. Verificar dimensões fixas:
   ```tsx
   <div className="aspect-square">
     <Image fill />
   </div>
   ```

2. Verificar skeleton loaders:
   ```tsx
   loading={() => <div className="h-[300px] animate-pulse" />}
   ```

---

## 📈 Melhorando Ainda Mais (95+)

### **1. Adicionar Fontes Otimizadas:**

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

// Usar no body:
<body className={inter.variable}>
```

### **2. Preload de Recursos Críticos:**

```tsx
// app/layout.tsx
<head>
  <link 
    rel="preload" 
    href="URL_BANNER_PRINCIPAL" 
    as="image"
    type="image/webp"
  />
</head>
```

### **3. Implementar Service Worker (PWA):**

```bash
npm install next-pwa
```

---

## 📱 Teste Mobile vs Desktop

### **Mobile (Prioridade):**
- Usa throttling: 4x CPU slowdown, 4G network
- Score geralmente 10-15 pontos menor
- **Meta**: 85+ em Mobile

### **Desktop:**
- Sem throttling significativo
- Score geralmente mais alto
- **Meta**: 95+ em Desktop

---

## 🎬 Checklist de Teste Final

- [ ] Build de produção executado
- [ ] Servidor rodando em modo produção (npm start)
- [ ] Navegador em modo anônimo
- [ ] DevTools aberto (F12)
- [ ] Lighthouse configurado para Mobile
- [ ] Storage limpo antes do teste
- [ ] Sem outras abas/extensões interferindo
- [ ] Aguardar teste completo (1-2 minutos)
- [ ] Verificar todas as 4 categorias
- [ ] Salvar relatório (Download report)
- [ ] Comparar antes/depois

---

## 📊 Exemplo de Comando de Teste via CLI

```bash
# Instalar Lighthouse CLI
npm install -g lighthouse

# Executar teste
lighthouse http://localhost:3000 \
  --output html \
  --output-path ./lighthouse-report.html \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices,seo

# Ver relatório
open lighthouse-report.html
```

---

## ✅ Validação em Produção (Vercel)

Após deploy:

```bash
# Testar URL de produção
lighthouse https://seu-dominio.vercel.app \
  --output json \
  --output-path ./production-report.json
```

**Ferramentas Online:**
- PageSpeed Insights: https://pagespeed.web.dev/
- WebPageTest: https://www.webpagetest.org/
- GTmetrix: https://gtmetrix.com/

---

**Data**: 2025-10-27
**Status**: ✅ Guia completo para testes Lighthouse
