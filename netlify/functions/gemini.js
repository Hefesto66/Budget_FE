
// Netlify já inclui fetch nativamente em funções, mas para compatibilidade local:
let fetchFn;
try {
  fetchFn = fetch;
} catch {
  fetchFn = require('node-fetch');
}

exports.handler = async function(event, context) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GEMINI_API_KEY não definida no ambiente.' })
      };
    }

    const { prompt } = JSON.parse(event.body || '{}');
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Prompt não fornecido.' })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;

    const response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Erro da API Gemini', details: errText })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno na função Gemini', details: err.message })
    };
  }
};