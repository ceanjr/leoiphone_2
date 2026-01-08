# 🔧 Guia de Manutenção - Léo iPhone

**Última atualização:** 08/01/2026

## ⏱️ Longevidade Estimada

Com as melhorias implementadas:
- **Expectativa realista:** 12-18 meses sem manutenção obrigatória
- **Expectativa otimista:** 18-24 meses com monitoramento básico

---

## ✅ Melhorias Implementadas (08/01/2026)

### 1. Versões Travadas
- ✅ Todas as dependências com versões exatas (sem `^` ou `~`)
- ✅ Garante builds reprodutíveis e previsíveis
- ✅ Evita atualizações automáticas que podem quebrar o site

### 2. Dependências Críticas Atualizadas
- ✅ `@supabase/supabase-js`: 2.76.1 → **2.90.1** (14 versões, correções de segurança)
- ✅ `@supabase/ssr`: 0.7.0 → **0.8.0** (melhorias de autenticação)
- ✅ `zod`: 4.1.12 → **4.3.5** (validação mais segura)
- ✅ `react-hook-form`: 7.65.0 → **7.70.0** (correções de bugs)

### 3. Package Lock Fixo
- ✅ `package-lock.json` gerado e commitado
- ✅ Garante versões exatas de TODAS as dependências transitivas
- ✅ Mesmo build em qualquer máquina/servidor

### 4. Documentação de Ambiente
- ✅ `.env.example` criado com todas as variáveis necessárias
- ✅ Comentários explicativos para cada variável
- ✅ Facilita setup em novos ambientes

### 5. Remoção Completa do PWA
- ✅ Service Workers removidos (causa de travamentos em mobile)
- ✅ 267 pacotes desnecessários removidos
- ✅ Build mais leve e rápido

---

## 🚨 Pontos de Atenção (Verificar Trimestralmente)

### 1. Token OAuth OLX ⚠️ **CRÍTICO**
- **Frequência:** A cada 3 meses
- **O que fazer:**
  1. Acessar: `/admin/anuncios`
  2. Verificar se a integração OLX está funcionando
  3. Se expirado, renovar via OAuth (botão na interface)
- **Impacto se falhar:** Anúncios automáticos na OLX param de funcionar

### 2. Limites do Supabase
- **Frequência:** Mensal
- **O que verificar:**
  - Dashboard: https://supabase.com/dashboard/project/_/settings/billing
  - Verificar uso de storage (imagens)
  - Verificar uso de bandwidth
  - Verificar número de requisições
- **Plano atual:** Gratuito (limite: 500 MB storage, 2 GB bandwidth/mês)

### 3. Vulnerabilidades de Segurança
- **Frequência:** Trimestral
- **Comando:** `npm audit`
- **Ação:** Se houver vulnerabilidades críticas, atualizar apenas os pacotes afetados
- **Status atual:** 4 vulnerabilidades (3 moderate, 1 critical) - não bloqueantes

### 4. Certificado SSL
- **Frequência:** Automático (Vercel renova)
- **Verificação manual:** Semestral
- **URL:** https://www.leoiphone.com.br

---

## 📋 Checklist de Manutenção Trimestral

Execute esta checklist a cada 3 meses:

```
Data: _____/_____/_____

□ 1. Token OLX ainda válido?
   Testado em: /admin/anuncios
   Status: ⬜ OK  ⬜ Precisa renovar

□ 2. Supabase dentro dos limites?
   Dashboard verificado em: https://supabase.com/dashboard
   Storage usado: _____ MB / 500 MB
   Bandwidth usado: _____ GB / 2 GB
   Status: ⬜ OK  ⬜ Próximo ao limite

□ 3. Vulnerabilidades de segurança?
   Comando: npm audit
   Críticas: _____ | Altas: _____ | Moderadas: _____
   Status: ⬜ OK  ⬜ Precisa atualizar

□ 4. Build funciona?
   Comando: npm run build
   Status: ⬜ OK  ⬜ Erros encontrados

□ 5. Site no ar?
   URL: https://www.leoiphone.com.br
   Status: ⬜ OK  ⬜ Offline

□ 6. Fluxos críticos testados?
   ⬜ Login admin funciona
   ⬜ Criar/editar produto funciona
   ⬜ Upload de imagens funciona
   ⬜ Catálogo público carrega

□ 7. Backup do banco realizado?
   Via: Supabase Dashboard → Database → Backups
   Status: ⬜ OK  ⬜ Pendente

Observações:
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 🆘 Cenários de Emergência

### Site Fora do Ar
1. Verificar status do Vercel: https://vercel.com/status
2. Verificar status do Supabase: https://status.supabase.com
3. Verificar logs do Vercel: Dashboard → Deployment → Logs
4. Se for erro de build, fazer rollback para deploy anterior

### Banco de Dados Corrompido
1. Restaurar backup mais recente
2. Supabase → Database → Backups → Restore
3. Verificar integridade dos dados

### Imagens Não Carregam
1. Verificar storage do Supabase: Dashboard → Storage
2. Verificar permissões públicas do bucket
3. Verificar se atingiu limite de bandwidth

### Login Admin Não Funciona
1. Verificar se sessão expirou (fazer logout/login)
2. Limpar cookies do navegador
3. Verificar logs de autenticação no Supabase

---

## 🔄 Quando Atualizar Dependências

**Regra geral:** EVITE atualizações desnecessárias

**Atualizar APENAS se:**
- ✅ Há vulnerabilidade crítica de segurança (CVSS > 7.0)
- ✅ Bug que afeta funcionalidade essencial
- ✅ Nova feature indispensável

**Como atualizar com segurança:**
1. Criar branch de teste: `git checkout -b test/update-deps`
2. Atualizar package específico: `npm install pacote@versao`
3. Testar build: `npm run build`
4. Testar localmente: `npm run dev`
5. Se OK, fazer deploy em staging primeiro
6. Se staging OK, merge para main

---

## 📞 Contatos de Emergência

### Serviços
- **Vercel Support:** https://vercel.com/help
- **Supabase Support:** https://supabase.com/support
- **Domínio (Registro.br):** https://registro.br

### Credenciais (Guardar em local seguro)
- [ ] Login Vercel
- [ ] Login Supabase
- [ ] Login Registro.br
- [ ] Chaves API (em `.env.local`)

---

## 📚 Recursos Úteis

- **Documentação Next.js:** https://nextjs.org/docs
- **Documentação Supabase:** https://supabase.com/docs
- **Documentação Vercel:** https://vercel.com/docs

---

## 🎯 Próximas Melhorias Recomendadas (Futuro)

### Curto Prazo (1-3 meses)
- [ ] Implementar monitoramento de uptime (UptimeRobot)
- [ ] Configurar alertas de erro (Sentry.io)
- [ ] Criar backup automático semanal

### Médio Prazo (3-6 meses)
- [ ] Implementar testes automatizados básicos
- [ ] Configurar CI/CD com verificações automáticas
- [ ] Otimizar imagens (WebP/AVIF)

### Longo Prazo (6-12 meses)
- [ ] Migrar para React 20 quando estável
- [ ] Considerar cache de produtos (Redis)
- [ ] Implementar SSR seletivo

---

**Última revisão:** 08/01/2026
**Próxima revisão recomendada:** 08/04/2026 (3 meses)
