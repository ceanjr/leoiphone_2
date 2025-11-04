# Solução para Erro "oops.olx.com.br" ao Gerar Token

## 🔴 Problema

Ao tentar gerar um token OAuth da OLX pelo portal `auth.olx.com.br`, você é redirecionado para `oops.olx.com.br` com erro.

## ✅ Soluções Disponíveis

### Opção 1: Client Credentials (RECOMENDADO) ⭐

Esta é a forma mais direta e confiável de obter um token.

**Via Interface Web:**
1. Acesse: `/admin/anuncios/oauth-olx`
2. Selecione "Client Credentials (Recomendado)"
3. Preencha:
   - Client ID
   - Client Secret
4. Clique em "Gerar Token Automaticamente"

**Via Linha de Comando:**
```bash
node test-olx-credentials.js SEU_CLIENT_ID SEU_CLIENT_SECRET
```

O script irá:
- Conectar diretamente à API da OLX
- Gerar o token
- Exibir o token na tela
- Mostrar a data de expiração

### Opção 2: Token Manual

Se você já tem um token (fornecido pelo suporte OLX):

1. Acesse: `/admin/anuncios/oauth-olx`
2. Selecione "Token Manual"
3. Cole o token
4. Clique em "Salvar Token"

### Opção 3: cURL

```bash
curl -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "scope=autoupload"
```

Resposta esperada:
```json
{
  "access_token": "seu_token_aqui",
  "token_type": "bearer",
  "expires_in": 2592000
}
```

## 🆘 Se Nenhuma Opção Funcionar

### Possíveis Causas:

1. **Credenciais Inativas**
   - Suas credenciais podem ter expirado
   - Entre em contato: `suporteintegrador@olxbr.com`
   - Solicite reativação do seu Client ID

2. **API Temporariamente Indisponível**
   - Tente novamente mais tarde
   - Verifique status da API

3. **Credenciais Incorretas**
   - Verifique se copiou corretamente
   - Client ID e Secret são case-sensitive
   - Não deve haver espaços no início/fim

## 📋 Checklist de Diagnóstico

- [ ] Tenho Client ID e Client Secret válidos
- [ ] As credenciais estão ativas (verificar com suporte OLX)
- [ ] Tentei o método Client Credentials
- [ ] Verifiquei os logs do console do navegador (F12)
- [ ] Tentei via cURL para descartar problemas de rede
- [ ] Entrei em contato com suporte se necessário

## 🔧 Melhorias Implementadas

### Backend API (`/api/olx-token`)
- Evita problemas de CORS
- Logs detalhados para debug
- Tratamento de erros robusto

### Interface Atualizada
- 3 métodos de autenticação claramente separados
- Instruções contextuais
- Feedback visual melhorado

### Script de Teste
- Teste direto via linha de comando
- Útil para diagnosticar problemas
- Não depende do frontend

## 📞 Contato OLX

**Suporte Integrador:**
- Email: `suporteintegrador@olxbr.com`
- Assunto sugerido: "Reativação de credenciais OAuth - Client ID: [SEU_ID]"

**Informações para incluir no email:**
- Seu Client ID
- Data da última vez que funcionou (se aplicável)
- Mensagem de erro recebida
- Tipo de integração (autoupload)

## ⚠️ Notas Importantes

1. **Tokens Expiram:** Geralmente 30-60 dias
2. **Guarde em Local Seguro:** Nunca compartilhe seu Client Secret
3. **Use HTTPS:** Sempre use conexão segura
4. **Teste Antes de Usar:** Use a função "Testar Conexão" após salvar

## 🎯 Próximos Passos Após Obter Token

1. Token salvo ✅
2. Testar conexão na interface
3. Criar primeiro anúncio de teste
4. Verificar se anúncio aparece na OLX
5. Configurar sincronização automática (se desejado)
