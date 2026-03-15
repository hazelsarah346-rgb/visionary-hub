/**
 * Multi-provider AI: Claude (Anthropic) → Groq fallback → null
 * Set in Vercel environment:
 *   ANTHROPIC_API_KEY  — for Claude (best quality)
 *   GROQ_API_KEY       — for Groq llama (fast & free tier)
 */

import Anthropic from '@anthropic-ai/sdk';

function getClaudeClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? new Anthropic({ apiKey: key }) : null;
}

async function _groqChat(system, messages, model = 'llama-3.1-70b-versatile', maxTokens = 500) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, max_tokens: maxTokens,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) { console.error('[Groq]', e.message); return null; }
}

/**
 * Single-turn AI call. Tries Claude then Groq.
 */
export async function askClaude({ system, userMessage, model = 'claude-haiku-4-5', maxTokens = 400 }) {
  const client = getClaudeClient();
  if (client) {
    try {
      const r = await client.messages.create({
        model, max_tokens: maxTokens, system,
        messages: [{ role: 'user', content: userMessage }],
      });
      const t = r.content.find(b => b.type === 'text')?.text?.trim();
      if (t) return t;
    } catch (e) { console.error('[Claude]', e.message); }
  }
  return _groqChat(system, [{ role: 'user', content: userMessage }], 'llama-3.1-70b-versatile', maxTokens);
}

/**
 * Multi-turn chat. messages = [{role, content}]. Tries Claude then Groq.
 */
export async function chatClaude({ system, messages, model = 'claude-haiku-4-5', maxTokens = 500 }) {
  const client = getClaudeClient();
  if (client) {
    try {
      const r = await client.messages.create({ model, max_tokens: maxTokens, system, messages });
      const t = r.content.find(b => b.type === 'text')?.text?.trim();
      if (t) return t;
    } catch (e) { console.error('[Claude chat]', e.message); }
  }
  return _groqChat(system, messages, 'llama-3.1-70b-versatile', maxTokens);
}
