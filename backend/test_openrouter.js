const fs = require('fs');
const axios = require('axios');

async function test() {
  // Read API Key from backend/.env
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/OPENROUTER_API_KEY\s*=\s*(.*)/);
  const apiKey = match ? match[1].trim() : null;

  if (!apiKey) {
    console.error('❌ Could not find OPENROUTER_API_KEY in .env file');
    process.exit(1);
  }

  console.log('Using API Key:', apiKey.substring(0, 10) + '...');

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello, are you working?'
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-OpenRouter-Title': 'FinVision AI Assistant'
        }
      }
    );

    console.log('✅ Response:', response.data);
  } catch (error) {
    console.error('❌ Error calling OpenRouter:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

test();
