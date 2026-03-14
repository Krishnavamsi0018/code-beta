const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const path    = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Test route ───────────────────────────────────────────────
app.get('/test', async (req, res) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
        max_tokens: 50
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (text) {
      res.send('✅ Groq works! Response: ' + text);
    } else {
      res.send('❌ Groq error: ' + JSON.stringify(data));
    }
  } catch (err) {
    res.send('❌ Error: ' + err.message);
  }
});

// ── Main proxy route ─────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { system, messages } = req.body;

  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not set!');
    return res.status(500).json({ content: [{ text: 'GROQ_API_KEY not set in .env file' }] });
  }

  const userText = messages && messages.length > 0
    ? messages[messages.length - 1].content
    : 'Hello';

  console.log('📨 User asked:', userText.slice(0, 80));

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: system || 'You are a helpful coding tutor.' },
          { role: 'user',   content: userText }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log('📬 Groq status:', response.status);

    if (!response.ok) {
      console.error('❌ Groq error:', JSON.stringify(data));
      return res.json({ content: [{ text: 'API error: ' + (data.error?.message || 'Unknown error') }] });
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      console.error('❌ Empty response:', JSON.stringify(data));
      return res.json({ content: [{ text: 'I got an empty response. Please try again!' }] });
    }

    console.log('✅ Groq replied:', text.slice(0, 80));
    res.json({ content: [{ text }] });

  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    res.status(500).json({ content: [{ text: 'Server error: ' + err.message }] });
  }
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  CodeBeta server running!`);
  console.log(`👉  Open http://localhost:${PORT}`);
  console.log(`🧪  Test Groq at http://localhost:${PORT}/test`);
  console.log(`🔑  Groq Key: ${process.env.GROQ_API_KEY ? '✅ Found' : '❌ MISSING'}\n`);
});
