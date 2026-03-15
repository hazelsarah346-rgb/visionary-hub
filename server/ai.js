/**
 * AI integration — Multi-provider: Claude (Anthropic) + Groq fallback.
 * Priority: Claude → Groq → Demo mode
 * Add to .env:
 *   ANTHROPIC_API_KEY=sk-ant-...  (Claude — best quality)
 *   GROQ_API_KEY=gsk_...          (Groq — fast & free tier)
 */

let AnthropicSDK;
try { AnthropicSDK = require('@anthropic-ai/sdk'); } catch (_) {}

// ── Claude ───────────────────────────────────────────────────────────────────
function getClaudeClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !AnthropicSDK) return null;
  return new (AnthropicSDK.default || AnthropicSDK)({ apiKey: key });
}

async function callClaude(system, userMessage, model = 'claude-haiku-4-5', maxTokens = 400) {
  const client = getClaudeClient();
  if (!client) return null;
  try {
    const res = await client.messages.create({
      model, max_tokens: maxTokens, system,
      messages: [{ role: 'user', content: userMessage }],
    });
    return res.content.find(b => b.type === 'text')?.text?.trim() || null;
  } catch (e) { console.error('[Claude]', e.message); return null; }
}

async function callClaudeChat(system, messages, model = 'claude-haiku-4-5', maxTokens = 500) {
  const client = getClaudeClient();
  if (!client) return null;
  try {
    const res = await client.messages.create({ model, max_tokens: maxTokens, system, messages });
    return res.content.find(b => b.type === 'text')?.text?.trim() || null;
  } catch (e) { console.error('[Claude chat]', e.message); return null; }
}

// ── Groq ─────────────────────────────────────────────────────────────────────
async function callGroq(system, userMessage, model = 'llama-3.1-8b-instant', maxTokens = 400) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, max_tokens: maxTokens,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }],
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) { console.error('[Groq]', e.message); return null; }
}

async function callGroqChat(system, messages, model = 'llama-3.1-8b-instant', maxTokens = 500) {
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
  } catch (e) { console.error('[Groq chat]', e.message); return null; }
}

// ── Smart AI — tries Claude first, falls back to Groq ────────────────────────
async function smartAI(system, userMessage, opts = {}) {
  const { claudeModel = 'claude-haiku-4-5', groqModel = 'llama-3.1-70b-versatile', maxTokens = 400 } = opts;
  return (await callClaude(system, userMessage, claudeModel, maxTokens))
      || (await callGroq(system, userMessage, groqModel, maxTokens))
      || null;
}

async function smartChat(system, messages, opts = {}) {
  const { claudeModel = 'claude-haiku-4-5', groqModel = 'llama-3.1-70b-versatile', maxTokens = 500 } = opts;
  return (await callClaudeChat(system, messages, claudeModel, maxTokens))
      || (await callGroqChat(system, messages, groqModel, maxTokens))
      || null;
}

// ── Mentor Chat ──────────────────────────────────────────────────────────────
const MENTOR_PERSONAS = {
  productivity: `You are a practical Productivity Mentor for students. Be warm but direct, 2-4 sentences. Focus on small wins and sustainable action.`,
  founder: `You are an inspiring Founder Mentor. Bold, energizing, 2-4 sentences. Connect their current step to a bigger vision.`,
  peer: `You are a supportive peer mentor. Warm, relatable, 2-4 sentences. Encourage mutual growth.`,
  career: `You are a Career Strategist for students. Direct, practical, 2-4 sentences. Give actionable next steps.`,
  default: `You are a supportive mentor in Visionary Hub. Warm, concise (2-4 sentences), encouraging. Focus on growth and action.`,
};
const MENTOR_DEMO = {
  productivity: "Every big vision is built one consistent day at a time. What's the one thing you can do today? Start there — momentum follows action.",
  founder: "The clearest sign of a future founder: you can't stop thinking about the problem. What's the smallest version of your idea you could build this week?",
  peer: "You're not building alone. Keep sharing your wins and struggles — that's exactly how great partnerships start.",
  career: "Map out three people in the career you want and study their path. Find one overlap with where you are now.",
  default: "You're doing the hard work of building a vision when most people don't even start. Keep going.",
};

async function chatWithMentor(mentor, messages) {
  const persona = mentor?.persona || 'default';
  const system = MENTOR_PERSONAS[persona] || MENTOR_PERSONAS.default;
  const apiMsgs = (messages || []).map(m => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.content || m.text || '',
  })).filter(m => m.content);
  if (!apiMsgs.length) apiMsgs.push({ role: 'user', content: "Hello, I need guidance." });
  const reply = await smartChat(system, apiMsgs);
  return reply || MENTOR_DEMO[persona] || MENTOR_DEMO.default;
}

// ── Journal Insights ─────────────────────────────────────────────────────────
async function getReflectionInsights(journalEntries) {
  const text = (journalEntries || []).slice(0, 10).map(j => j.content || j.text).filter(Boolean).join('\n\n');
  const system = `You are a compassionate reflection coach. Analyze journal entries:
1. One emotional pattern or theme (1 sentence)
2. One insight about their growth (1 sentence)
3. One actionable next step (1 short sentence)
Under 80 words. Warm and specific.`;
  const reply = await smartAI(system, text || "Not journaled yet.", { maxTokens: 200 });
  return reply || "Start journaling to unlock AI insights. I'll surface patterns and help you see your growth more clearly.";
}

// ── Vision Refiner ───────────────────────────────────────────────────────────
async function refineVision(currentTitle) {
  const system = `You are a vision clarity coach. Rewrite the vision as one compelling sentence: specific, action-oriented, energizing, under 20 words. If empty, suggest a powerful starter vision for an ambitious student.`;
  const reply = await smartAI(system, currentTitle || "Help me define my vision.", { maxTokens: 100 });
  return reply || (currentTitle ? `${currentTitle} — one bold step at a time.` : "Build something that solves a real problem and creates lasting impact.");
}

// ── Roadmap Generator ────────────────────────────────────────────────────────
async function generateRoadmap(canvas) {
  const system = `You are a strategic life coach. Generate a 4-phase roadmap in JSON:
{"phases":[{"phase":1,"label":"Foundation","timeframe":"Months 1-3","theme":"...","milestones":["...","...","...","..."],"focusArea":"...","successSign":"..."},...],"northStar":"...","firstStep":"..."}
Make milestones SPECIFIC to the student's actual vision and major. Return ONLY valid JSON.`;

  const canvasText = canvas
    ? `Name: ${canvas.name}, Major: ${canvas.major}, Vision: ${canvas.bigVision}, Strengths: ${canvas.strengths}, Obstacle: ${canvas.obstacle}, Goal: ${canvas.goal12Month}`
    : "Ambitious student wanting to make an impact.";

  const result = await smartAI(system, canvasText, { claudeModel: 'claude-sonnet-4-6', groqModel: 'llama-3.3-70b-versatile', maxTokens: 1200 });
  if (result) {
    try { return JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || ''); } catch (_) {}
  }
  return null;
}

// ── AI Tutor ─────────────────────────────────────────────────────────────────
async function tutorChat(messages, mode, canvas, fileContent) {
  const prompts = {
    study: `You are an expert AI Study Tutor. Be concise. Use tables for comparisons. Answer exactly what's asked. No markdown symbols.`,
    vision: `You are a Vision Coach. ${canvas ? `Student vision: ${canvas.bigVision}. Goal: ${canvas.goal12Month}.` : ''} Ask powerful questions. Be specific. Help them take action today.`,
    career: `You are a Career Strategist for students. Specific, actionable career advice. Be direct and honest.`,
  };
  const system = (fileContent ? `${prompts[mode] || prompts.study}\n\nUploaded material:\n${fileContent.slice(0, 8000)}` : (prompts[mode] || prompts.study));
  const apiMsgs = (messages || []).map(m => ({
    role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content || m.text || '',
  })).filter(m => m.content);
  if (!apiMsgs.length) apiMsgs.push({ role: 'user', content: "Hello" });
  const reply = await smartChat(system, apiMsgs);
  return reply || "I'm your AI assistant. What would you like to explore?";
}

// ── Opportunities Search ──────────────────────────────────────────────────────
async function searchOpportunities(query, location, canvas) {
  const system = `You are an expert opportunity researcher helping ambitious students find real programs to apply to. You know about scholarships, grants, fellowships, internships, and competitions worldwide — including programs open to Caribbean, Jamaican, and developing-world students.

STRICT RULES:
- Only include programs that genuinely exist and are currently active (2025-2026)
- Every entry MUST have a real, working URL to the actual program website (not google or search pages)
- Be motivating — frame each opportunity as something worth going after
- Mix LOCAL programs relevant to the student's country AND internationally-open programs
- NO placeholder data, NO made-up programs, NO example.com URLs
- Return ONLY a valid JSON array, absolutely nothing else`;

  const locationCtx = location ? `\nStudent is based in: ${location}. Prioritize: (1) programs open to ${location}/Caribbean students, (2) fully international programs anyone can apply to, (3) remote-friendly opportunities.` : '';
  const canvasCtx = canvas?.field ? `\nStudent field/major: ${canvas.field}. Goal: ${canvas.goal || 'Not specified'}.` : '';

  const prompt = `Find 6 real, currently active opportunities matching: "${query}"${locationCtx}${canvasCtx}

Return ONLY this JSON array (nothing before or after):
[{"title":"Exact Program Name","type":"Scholarship","amount":"$5,000","deadline":"March 2026","field":"STEM/Business/Any","url":"https://real-website.org/program","description":"One motivating sentence — who this is for and why they should apply."}]

Types: Scholarship, Grant, Fellowship, Internship, or Competition only.
URLs must be direct program pages, not search engines. Include genuinely exciting, competitive programs.`;

  const result = await smartAI(system, prompt, {
    claudeModel: 'claude-haiku-4-5',
    groqModel: 'llama-3.3-70b-versatile',
    maxTokens: 1400
  });
  return result;
}

module.exports = { chatWithMentor, getReflectionInsights, refineVision, generateRoadmap, tutorChat, searchOpportunities };
