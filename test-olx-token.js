const accessToken = "253176062eef83cc531f7f5428c9a57d5fdfe39a";

fetch('https://apps.olx.com.br/oauth_api/basic_user_info', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({ access_token: accessToken }),
})
.then(response => {
  console.log('Status:', response.status);
  console.log('Status Text:', response.statusText);
  return response.text();
})
.then(text => {
  console.log('Resposta:', text);
  try {
    const json = JSON.parse(text);
    console.log('JSON:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('Não é JSON válido');
  }
})
.catch(err => {
  console.error('Erro:', err.message);
});
