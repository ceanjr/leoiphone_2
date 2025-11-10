# 🚨 AÇÕES URGENTES DE SEGURANÇA

## ⚠️ O QUE ACONTECEU?

GitGuardian detectou que sua **Supabase Service Role Key** estava exposta nos commits do GitHub.

## ✅ O QUE JÁ FOI FEITO

- ✅ Removido chaves hardcoded de 4 scripts
- ✅ Scripts agora usam variáveis de ambiente
- ✅ Commit de segurança criado
- ✅ Documentação de segurança adicionada

## 🚨 O QUE VOCÊ PRECISA FAZER AGORA (URGENTE!)

### 1. ROTACIONAR A CHAVE NO SUPABASE (5 minutos)

```
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings → API
4. Na seção "Service Role Key", clique em "Reveal"
5. Clique em "Generate new service role key" ou use o botão de rotação
6. COPIE A NOVA CHAVE
7. A chave antiga será invalidada automaticamente
```

### 2. ATUALIZAR .env.local (1 minuto)

Abra `.env.local` e substitua:

```bash
SUPABASE_SERVICE_ROLE_KEY=sua_nova_chave_aqui
```

### 3. FAZER PUSH DAS CORREÇÕES (1 minuto)

```bash
git push origin main
```

### 4. (OPCIONAL MAS RECOMENDADO) LIMPAR HISTÓRICO DO GIT

⚠️ **ATENÇÃO:** Isso reescreve o histórico! Faça backup antes!

```bash
# Opção 1: Remover apenas os scripts do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/fix-*.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Opção 2: Usar BFG Repo-Cleaner (mais rápido)
# Download: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files 'fix-*.ts' .git

# Depois:
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (avise colaboradores!)
git push origin --force --all
```

## 🔍 VERIFICAR SE A CHAVE ANTIGA AINDA ESTÁ NO HISTÓRICO

```bash
# Ver se aparece a chave antiga
git log -S "service_role" --all --oneline

# Se aparecer algo, significa que precisa limpar o histórico
```

## 📞 PRECISA DE AJUDA?

- **Supabase Support:** https://supabase.com/support
- **GitHub Support:** https://support.github.com
- **Documentação completa:** Ver `SECURITY_FIX_URGENTE.md`

## ✅ CHECKLIST

- [ ] Rotacionei a chave no Supabase
- [ ] Atualizei .env.local com a nova chave
- [ ] Fiz git push das correções
- [ ] (Opcional) Limpei o histórico do git
- [ ] Testei que os scripts funcionam com a nova chave
- [ ] Avisei colaboradores (se houver)

---

**PRAZO:** Execute os passos 1, 2 e 3 IMEDIATAMENTE!
**TEMPO ESTIMADO:** 10 minutos
