/**
 * Multi-provider AI: Claude (Anthropic) → OpenAI → Groq fallback
 * Set in Vercel Environment Variables:
 *   ANTHROPIC_API_KEY  — Claude (best quality, recommended)
 *   OPENAI_API_KEY     — OpenAI GPT-4o (great alternative)
 *   GROQ_API_KEY       — Groq llama (fast & free tier fallback)
 */

import Anthropic from '@anthropic-ai/sdk';

// ── Claude ───────────────────────────────────────────────────────────────────
function getClaudeClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? new Anthropic({ apiKey: key }) : null;
}

// ── OpenAI ───────────────────────────────────────────────────────────────────
async function _openaiChat(system, messages, model = 'gpt-4o-mini', maxTokens = 500) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, max_tokens: maxTokens,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) { console.error('[OpenAI]', e.message); return null; }
}

// ── Groq ─────────────────────────────────────────────────────────────────────
async function _groqChat(system, messages, model = 'llama-3.3-70b-versatile', maxTokens = 500) {
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
 * Single-turn AI call. Tries Claude → OpenAI → Groq.
 */
export async function askAI({
  system, userMessage,
  model = 'claude-haiku-4-5',
  claudeModel,
  openaiModel = 'gpt-4o-mini',
  groqModel = 'llama-3.3-70b-versatile',
  maxTokens = 400,
}) {
  const cm = claudeModel || model;
  // Claude
  const client = getClaudeClient();
  if (client) {
    try {
      const r = await client.messages.create({
        model: cm, max_tokens: maxTokens, system,
        messages: [{ role: 'user', content: userMessage }],
      });
      const t = r.content.find(b => b.type === 'text')?.text?.trim();
      if (t) return t;
    } catch (e) { console.error('[Claude]', e.message); }
  }
  // OpenAI
  const openai = await _openaiChat(system, [{ role: 'user', content: userMessage }], openaiModel, maxTokens);
  if (openai) return openai;
  // Groq
  return _groqChat(system, [{ role: 'user', content: userMessage }], groqModel, maxTokens);
}

/**
 * Multi-turn chat. messages = [{role, content}]. Tries Claude → OpenAI → Groq.
 */
export async function chatAI({
  system, messages,
  model = 'claude-haiku-4-5',
  claudeModel,
  openaiModel = 'gpt-4o-mini',
  groqModel = 'llama-3.3-70b-versatile',
  maxTokens = 500,
}) {
  const cm = claudeModel || model;
  // Claude
  const client = getClaudeClient();
  if (client) {
    try {
      const r = await client.messages.create({ model: cm, max_tokens: maxTokens, system, messages });
      const t = r.content.find(b => b.type === 'text')?.text?.trim();
      if (t) return t;
    } catch (e) { console.error('[Claude chat]', e.message); }
  }
  // OpenAI
  const openai = await _openaiChat(system, messages, openaiModel, maxTokens);
  if (openai) return openai;
  // Groq
  return _groqChat(system, messages, groqModel, maxTokens);
}

// Legacy aliases — existing api files still import these names
export const askClaude = askAI;
export const chatClaude = chatAI;
