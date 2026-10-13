const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const orMatch = envLocal.match(/OPENROUTER_API_KEY=(.*)/);
let orKey = orMatch ? orMatch[1].trim() : '';
orKey = orKey.replace(/^["']|["']$/g, '');

const antMatch = envLocal.match(/ANTHROPIC_API_KEY=(.*)/);
let antKey = antMatch ? antMatch[1].trim() : '';
antKey = antKey.replace(/^["']|["']$/g, '');

console.log('OpenRouter Key length:', orKey.length);
console.log('Anthropic Key length:', antKey.length);

async function testGenerationChain() {
  // 1. TEST GPT-4o-mini (via OpenRouter)
  console.log('\n--- 1. TEST GPT-4O-MINI (RÉDACTION POST) ---');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${orKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://getspecial.dev',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es le rédacteur réseaux sociaux de GetSpecial pour les restaurants. Rédige un post court, percutant et gourmand en français pour Instagram.',
          },
          {
            role: 'user',
            content: 'Restaurant: Le Bistrot Parisien. Promotion: Formule Burger Charolais + Pinte à 17€. Contexte: Match ce soir à 20h. Mot-code comptoir: MATCH17. Public: Amateurs de sport et habitués.',
          },
        ],
      }),
    });
    const data = await res.json();
    if (data.choices?.[0]?.message?.content) {
      console.log('GPT-4o-mini SUCCESS:\n', data.choices[0].message.content.slice(0, 200) + '...');
    } else {
      console.log('GPT-4o-mini Error:', data);
    }
  } catch (e) {
    console.error('GPT-4o-mini Exception:', e.message);
  }

  // 2. TEST CLAUDE (via Anthropic SDK ou OpenRouter)
  console.log('\n--- 2. TEST CLAUDE (PROMPT D IMAGE) ---');
  const claudeCandidates = ['anthropic/claude-haiku-4.5', 'anthropic/claude-3.5-haiku-20241022', 'anthropic/claude-3-5-sonnet', 'anthropic/claude-3.5-sonnet:beta'];
  for (const mod of claudeCandidates) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://getspecial.dev',
        },
        body: JSON.stringify({
          model: mod,
          messages: [
            {
              role: 'system',
              content: 'Tu es le directeur artistique de GetSpecial. Rédige un prompt ultra-détaillé en anglais pour un générateur d\'image photoréaliste. Pas de texte dans l\'image.',
            },
            {
              role: 'user',
              content: 'Plat: Gourmet cheeseburger avec cheddar coulant et frites croustillantes. Ambiance: Bistro chaleureux, comptoir en zinc, lumière tamisée de soirée de match. Format: 1:1 carré.',
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        console.log(`Claude [${mod}] SUCCESS (Prompt Image):\n`, data.choices[0].message.content.slice(0, 200) + '...');
        break;
      } else {
        console.log(`Claude [${mod}] Error:`, data.error?.message || data);
      }
    } catch (e) {
      console.error(`Claude [${mod}] Exception:`, e.message);
    }
  }

  // 3. TEST GPT-IMAGE-2 (via OpenRouter Images)
  console.log('\n--- 3. TEST GPT-IMAGE-2 / OPENROUTER IMAGES ---');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${orKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-image-2',
        prompt: 'Professional food photography of a gourmet cheeseburger on a rustic wooden board, soft warm lighting, shallow depth of field',
      }),
    });
    const data = await res.json();
    console.log('OpenRouter Images status:', res.status, data.error || (data.data ? 'Image generated!' : data));
  } catch (e) {
    console.error('Image Exception:', e.message);
  }
}

testGenerationChain();
