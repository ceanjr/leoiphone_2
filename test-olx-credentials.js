#!/usr/bin/env node

/**
 * Script para testar geração de token OLX via Client Credentials
 * 
 * Uso:
 *   node test-olx-credentials.js SEU_CLIENT_ID SEU_CLIENT_SECRET
 */

const https = require('https')
const { URLSearchParams } = require('url')

const [, , clientId, clientSecret] = process.argv

if (!clientId || !clientSecret) {
  console.error('❌ Uso: node test-olx-credentials.js CLIENT_ID CLIENT_SECRET')
  process.exit(1)
}

console.log('🔄 Gerando token OLX...')
console.log('Client ID:', clientId.substring(0, 10) + '...')

const params = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: clientId,
  client_secret: clientSecret,
  scope: 'autoupload',
})

const postData = params.toString()

const options = {
  hostname: 'auth.olx.com.br',
  port: 443,
  path: '/oauth/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    Accept: 'application/json',
  },
}

const req = https.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('\n📊 Resposta da OLX:')
    console.log('Status:', res.statusCode)
    console.log('Headers:', res.headers)
    console.log('\nBody:')
    
    try {
      const json = JSON.parse(data)
      console.log(JSON.stringify(json, null, 2))
      
      if (json.access_token) {
        console.log('\n✅ TOKEN OBTIDO COM SUCESSO!')
        console.log('\n📋 Access Token:')
        console.log(json.access_token)
        
        if (json.expires_in) {
          const expiresAt = new Date(Date.now() + json.expires_in * 1000)
          console.log('\n⏰ Expira em:', expiresAt.toLocaleString('pt-BR'))
        }
        
        console.log('\n💡 Copie o token acima e cole na interface web usando "Token Manual"')
      } else {
        console.error('\n❌ Token não retornado')
        if (json.error) {
          console.error('Erro:', json.error)
          console.error('Descrição:', json.error_description || 'N/A')
        }
      }
    } catch (e) {
      console.log(data)
      console.error('\n❌ Resposta não é JSON válido')
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message)
  process.exit(1)
})

req.write(postData)
req.end()
