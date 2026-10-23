import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getApiKey() {
  const envContent = fs.readFileSync(path.join(rootDir, '.env.local'), 'utf8');
  const match = envContent.match(/OPENROUTER_API_KEY=["']?([^"'\r\n]+)/);
  return match ? match[1] : null;
}

async function testOpenRouter() {
  const apiKey = getApiKey();
  console.log('Testing with API key prefix:', apiKey ? apiKey.slice(0, 15) + '...' : 'NONE');

  const models = [
    'anthropic/claude-3.7-sonnet',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    'anthropic/claude-3.5-haiku',
    'deepseek/deepseek-chat',
  ];

  for (const model of models) {
    console.log(`\n--- Test model: ${model} ---`);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://getspecial.app',
          'X-Title': 'GetSpecial Test',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Dis bonjour et ton nom en 5 mots.' }],
          max_tokens: 30,
        }),
      });

      console.log('HTTP Status:', res.status, res.statusText);
      const text = await res.text();
      console.log('Response body:', text.slice(0, 300));
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
  }
}

testOpenRouter();
