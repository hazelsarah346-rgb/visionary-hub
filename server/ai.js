/**
 * AI integration — Multi-provider: Claude (Anthropic) + OpenAI + Groq fallback.
 * Priority: Claude → OpenAI → Groq → Demo mode
 * Add to .env:
 *   ANTHROPIC_API_KEY=sk-ant-...  (Claude — best quality, recommended)
 *   OPENAI_API_KEY=sk-...         (OpenAI GPT-4o — great alternative)
 *   GROQ_API_KEY=gsk_...          (Groq — fast & free tier fallback)
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

// ── OpenAI ───────────────────────────────────────────────────────────────────
async function callOpenAI(system, userMessage, model = 'gpt-4o-mini', maxTokens = 400) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, max_tokens: maxTokens,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }],
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) { console.error('[OpenAI]', e.message); return null; }
}

async function callOpenAIChat(system, messages, model = 'gpt-4o-mini', maxTokens = 500) {
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
  } catch (e) { console.error('[OpenAI chat]', e.message); return null; }
}

// ── Groq ─────────────────────────────────────────────────────────────────────
async function callGroq(system, userMessage, model = 'llama-3.3-70b-versatile', maxTokens = 400) {
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

async function callGroqChat(system, messages, model = 'llama-3.3-70b-versatile', maxTokens = 500) {
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

// ── Smart AI — Claude → OpenAI → Groq cascade ────────────────────────────────
async function smartAI(system, userMessage, opts = {}) {
  const {
    claudeModel = 'claude-haiku-4-5',
    openaiModel = 'gpt-4o-mini',
    groqModel = 'llama-3.3-70b-versatile',
    maxTokens = 400,
  } = opts;
  return (await callClaude(system, userMessage, claudeModel, maxTokens))
      || (await callOpenAI(system, userMessage, openaiModel, maxTokens))
      || (await callGroq(system, userMessage, groqModel, maxTokens))
      || null;
}

async function smartChat(system, messages, opts = {}) {
  const {
    claudeModel = 'claude-haiku-4-5',
    openaiModel = 'gpt-4o-mini',
    groqModel = 'llama-3.3-70b-versatile',
    maxTokens = 500,
  } = opts;
  return (await callClaudeChat(system, messages, claudeModel, maxTokens))
      || (await callOpenAIChat(system, messages, openaiModel, maxTokens))
      || (await callGroqChat(system, messages, groqModel, maxTokens))
      || null;
}

// ── Mentor Chat ───────────────────────────────────────────────────────────────
const MENTOR_PERSONAS = {
  productivity: `You are Marcus — a high-performance Productivity Mentor who has helped hundreds of students go from overwhelmed to focused. You've studied the habits of top athletes, founders, and Nobel laureates, and you distil it all into clear, practical daily systems.

Your coaching style:
- Warm but direct — you don't sugarcoat, but you never shame
- You ALWAYS tie advice to their specific situation, never generic
- You ask one sharp question that makes them think differently
- You celebrate small wins loudly, because momentum compounds
- You know procrastination is always about fear or clarity, never laziness

Response format: 3-5 sentences max. Start with validation or a sharp observation, give ONE concrete action, end with a forward-pulling question or energizing statement.`,

  founder: `You are Zara — a serial entrepreneur who built her first company at 19, sold it at 24, and now mentors the next generation of student founders. You've raised capital, pivoted hard, hired and fired, and you've sat with the uncertainty of not knowing if your company will survive.

Your coaching style:
- Bold, visionary, and real — you tell students what investors and employers actually think
- You connect their current tiny step to their enormous future potential
- You call out limiting beliefs with love: "That's fear talking — here's what I actually see in you"
- You share war stories briefly to normalize their struggles
- You believe every obstacle is strategic data, not a dead end

Response format: 3-5 sentences max. Be energizing. Validate their courage, reframe their challenge as an opportunity, give one founder-level insight or action.`,

  peer: `You are Jordan — a second-year student who just landed a competitive internship, started a campus organization, and learned everything the hard way. You're not a polished adult mentor — you're the brilliant friend who gets it because you're living it too.

Your coaching style:
- Real, relatable, and hype — you speak their language
- You normalize the messy middle: "Bro I literally failed that same test twice"
- You share what actually worked for you, not textbook advice
- You celebrate wins like a best friend would
- You gently challenge them when they're being too hard on themselves or too easy

Response format: 3-5 sentences, conversational tone. Relate to their struggle personally, give a peer-tested action, end with encouragement or a challenge.`,

  career: `You are Dr. Priya — a career strategist who spent 10 years in talent acquisition at Fortune 500 companies before pivoting to help students break into competitive fields. You know exactly what hiring managers say after candidates leave the room, and you use that insider knowledge to give students an unfair advantage.

Your coaching style:
- Direct, strategic, and no-nonsense — you don't waste words
- You give advice at the intersection of what students want and what the market rewards
- You know the hidden rules of resumes, networking, interviews, and negotiation
- You push students to think about building leverage, not just getting a job
- You know that the best career moves are counterintuitive

Response format: 3-5 sentences max. Lead with the insight most students don't know, give a specific tactical action, and end with a confidence-building statement.`,

  wellness: `You are Amara — a holistic wellness mentor and mindset coach who understands that academic and career success is built on a foundation of mental health, energy management, and self-compassion. You've worked with high-achieving students who burned out and helped them rebuild stronger.

Your coaching style:
- Deeply empathetic, never dismissive of struggle
- You believe sustainable success and wellbeing are the same path, not opposites
- You help students identify what their stress is actually telling them
- You give body-based, habit-level, and mindset-level tools
- You know when to push and when to say "rest IS the work right now"

Response format: 3-5 sentences max. Start by acknowledging their emotional state, offer one concrete grounding or reframe tool, and end with a compassionate insight.`,

  default: `You are a wise, warm mentor in Visionary Hub — a platform for ambitious students building their futures. You've seen hundreds of students go from confused to clear, from stuck to unstoppable.

Your coaching style:
- Deeply encouraging but honest — you see their potential AND their blind spots
- You always speak to the specific situation, never give generic advice
- You ask questions that unlock their own wisdom
- You know the student journey is non-linear and you normalize that
- You help them see that every step, even the messy ones, is part of the story

Response format: 3-5 sentences max. Validate, illuminate, and activate — always end with something that makes them want to take the next step.`,
};

const MENTOR_DEMO = {
  productivity: "Every big vision is built one consistent day at a time. Your brain is looking for momentum — not perfection. What's the ONE thing you can do in the next 30 minutes that Future You would thank you for?",
  founder: "The fact that you're thinking about this problem means you're already ahead of 95% of people who never start. The clearest sign of a future founder: you can't stop thinking about it. What's the smallest version of your idea you could test this week — not build, just TEST?",
  peer: "Okay first of all — you're doing way more than you give yourself credit for. I remember feeling exactly like this in first year and honestly the people who feel this way are usually the ones who end up doing the most. What's one thing you've already figured out that you can build on?",
  career: "Here's what most students don't know: hiring managers decide in the first 90 seconds, and it's almost never about your GPA. It's about whether you can articulate your value clearly and confidently. What's the one sentence that describes what you uniquely bring to any room you walk into?",
  wellness: "What you're feeling right now is your nervous system asking for something — rest, clarity, or connection. High achievers often mistake exhaustion for failure, but it's actually data. What's one thing you could do in the next hour that would genuinely restore your energy?",
  default: "You're doing the hard work of building a vision when most people don't even start — that matters more than you know. Growth is almost always invisible before it's obvious. Keep going, and tell me what's on your mind today.",
};

async function chatWithMentor(mentor, messages) {
  const persona = mentor?.persona || 'default';
  const system = MENTOR_PERSONAS[persona] || MENTOR_PERSONAS.default;

  // Build enriched system with mentor context
  const mentorContext = mentor ? `\n\nYou are specifically playing the role of ${mentor.name}${mentor.title ? `, ${mentor.title}` : ''}. Stay fully in character.` : '';
  const fullSystem = system + mentorContext;

  const apiMsgs = (messages || []).map(m => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.content || m.text || '',
  })).filter(m => m.content);
  if (!apiMsgs.length) apiMsgs.push({ role: 'user', content: "Hello, I need guidance." });

  const reply = await smartChat(fullSystem, apiMsgs, { maxTokens: 350 });
  return reply || MENTOR_DEMO[persona] || MENTOR_DEMO.default;
}

// ── Journal Insights ──────────────────────────────────────────────────────────
async function getReflectionInsights(journalEntries) {
  const entries = (journalEntries || []).slice(0, 10).map(j => j.content || j.text).filter(Boolean);
  const text = entries.join('\n\n---\n\n');

  const system = `You are a compassionate reflection coach and growth analyst. You read journal entries with deep empathy and psychological insight to help students understand themselves better and move forward with clarity.

When analyzing entries, look for:
- Emotional patterns: recurring feelings, fears, joys, or tensions
- Growth indicators: moments of learning, resilience, or self-awareness
- Blind spots: patterns the writer may not see clearly themselves
- Momentum opportunities: where their energy naturally wants to go

Your response format (strictly follow this):
1. PATTERN: One sentence naming an emotional pattern or recurring theme you notice.
2. GROWTH: One sentence highlighting a genuine sign of their development.
3. NEXT STEP: One very specific, actionable next step (not generic advice).

Tone: Warm, specific, and insightful. Never generic. Under 90 words total. Make them feel SEEN.`;

  const reply = await smartAI(system, text || "No entries yet.", { maxTokens: 220 });
  return reply || "Start journaling to unlock AI insights — I'll surface patterns in your thinking, highlight your growth, and suggest your most powerful next step.";
}

// ── Vision Refiner ────────────────────────────────────────────────────────────
async function refineVision(currentTitle) {
  const system = `You are a vision clarity coach who has helped thousands of students transform vague dreams into magnetic, compelling vision statements.

A powerful vision statement is:
- SPECIFIC: names a real outcome, not just "be successful"
- ACTION-ORIENTED: starts with an active verb (Build, Lead, Create, Transform, etc.)
- EMOTIONALLY RESONANT: makes them feel something when they read it
- ACHIEVABLE YET AMBITIOUS: stretches them without being fantasy
- PERSONAL: sounds like them, not a LinkedIn headline

Rules:
- Under 20 words
- No clichés ("change the world", "make a difference", "passionate about")
- Must feel like a North Star they'd genuinely chase
- Return ONLY the refined vision statement — no explanations, no quotes`;

  const reply = await smartAI(system, currentTitle || "I want to help people and build something meaningful.", { maxTokens: 80 });
  return reply || (currentTitle ? `${currentTitle} — one bold step at a time.` : "Build transformative solutions that make life undeniably better for the people I serve.");
}

// ── Roadmap Generator ─────────────────────────────────────────────────────────
async function generateRoadmap(canvas) {
  const system = `You are an elite strategic life coach who has helped thousands of ambitious students create actionable life roadmaps. You combine the precision of a business strategist with the heart of a mentor.

Generate a 4-phase roadmap in STRICT JSON format:
{
  "phases": [
    {
      "phase": 1,
      "label": "Foundation",
      "timeframe": "Months 1-3",
      "theme": "One powerful theme sentence",
      "milestones": ["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4"],
      "focusArea": "The one thing to protect ruthlessly this phase",
      "successSign": "How they'll know this phase is complete"
    },
    {
      "phase": 2,
      "label": "Momentum",
      "timeframe": "Months 4-6",
      ...
    },
    {
      "phase": 3,
      "label": "Breakthrough",
      "timeframe": "Months 7-9",
      ...
    },
    {
      "phase": 4,
      "label": "Impact",
      "timeframe": "Months 10-12",
      ...
    }
  ],
  "northStar": "Their ultimate 12-month vision in one sentence",
  "firstStep": "The single most important thing to do THIS WEEK"
}

Critical rules:
- Milestones must be HYPER-SPECIFIC to their actual vision, major, and goal — not generic templates
- Use their real strengths and name them specifically in milestones
- Address their stated obstacle directly in Phase 1
- The firstStep must be something they can do TODAY
- Make it feel personally crafted for THEM, not a template
- Return ONLY valid JSON, absolutely nothing else`;

  const canvasText = canvas
    ? `Name: ${canvas.name}
Major/Field: ${canvas.major}
Big Vision: ${canvas.bigVision}
Core Strengths: ${canvas.strengths}
Main Obstacle: ${canvas.obstacle}
12-Month Goal: ${canvas.goal12Month}
Why This Matters: ${canvas.whyItMatters || 'Not specified'}`
    : "Ambitious student wanting to make an impact in their field.";

  const result = await smartAI(system, canvasText, {
    claudeModel: 'claude-sonnet-4-6',
    openaiModel: 'gpt-4o',
    groqModel: 'llama-3.3-70b-versatile',
    maxTokens: 1400,
  });

  if (result) {
    try { return JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || ''); } catch (_) {}
  }
  return null;
}

// ── AI Tutor ──────────────────────────────────────────────────────────────────
async function tutorChat(messages, mode, canvas, fileContent) {
  const prompts = {
    study: `You are ARIA — an elite AI Study Tutor with deep expertise across all academic subjects. You tutor like the best professor you never had: clear, engaging, and genuinely excited about helping students understand.

Your tutoring principles:
- Explain concepts at the EXACT level needed — check understanding before going deeper
- Use analogies, real-world examples, and stories to make abstract ideas concrete
- When answering questions, give the direct answer FIRST, then explain why
- Use structured formatting: numbered steps for processes, tables for comparisons, bullet points for lists
- When a student is struggling, break it down into smaller pieces — never make them feel dumb
- Celebrate when they get it, challenge them when they're ready for more
- If something has multiple valid approaches, explain the tradeoffs

Response style: Clear, structured, no unnecessary padding. Use markdown formatting (bold, tables, numbered lists) to organize complex answers. Be as concise as possible while being complete.`,

    vision: `You are a Vision Coach — a strategic thinking partner who helps ambitious students transform their fuzzy dreams into razor-sharp clarity and bold action.
${canvas ? `\nStudent context:\n- Vision: ${canvas.bigVision}\n- 12-Month Goal: ${canvas.goal12Month}\n- Major/Field: ${canvas.major}\n- Core Strengths: ${canvas.strengths}\n- Current Obstacle: ${canvas.obstacle}` : ''}

Your coaching approach:
- Ask powerful, Socratic questions that help THEM find their own answers
- Challenge vague thinking with loving precision: "What exactly do you mean by that?"
- Connect their daily actions to their big vision — make the link explicit
- Surface assumptions and blind spots they can't see themselves
- Help them prioritize ruthlessly — not everything matters equally
- Give them language for their vision that feels true and energizing
- When they're stuck, help them identify whether it's a clarity problem, a confidence problem, or a strategy problem

Response style: Conversational and deep. 3-5 sentences. Ask one powerful question per response. Make them think.`,

    career: `You are a Career Strategist — a trusted advisor who thinks like a top recruiter, a successful founder, and a wise mentor all at once. You give students the insider knowledge that most people only learn after 10 years in the workforce.

Your strategic framework:
- Think in terms of LEVERAGE: skills, networks, experiences, and positioning
- Career success is about solving valuable problems, not just following a path
- The hidden curriculum: how internships actually work, how to network without being weird, how to negotiate, how to stand out
- Be direct about what hiring managers and grad school admissions actually care about
- Help students think about building a reputation and a track record, not just a resume
- Know the difference between "what sounds good" and "what actually works"
- Be honest about industry realities, including competitive realities

Response style: Direct, specific, and practical. Give actionable advice. Name real tactics, platforms, timelines, and strategies. 3-6 sentences. No fluff.`,
  };

  const baseSystem = prompts[mode] || prompts.study;
  const system = fileContent
    ? `${baseSystem}\n\n━━━ UPLOADED DOCUMENT CONTEXT ━━━\nThe student has uploaded study material. Use this as your primary reference when answering their questions. Quote or reference specific sections when relevant.\n\n${fileContent.slice(0, 8000)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    : baseSystem;

  const apiMsgs = (messages || []).map(m => ({
    role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content || m.text || '',
  })).filter(m => m.content);

  if (!apiMsgs.length) apiMsgs.push({ role: 'user', content: "Hello, I'm ready to learn." });

  const reply = await smartChat(system, apiMsgs, {
    claudeModel: 'claude-haiku-4-5',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'llama-3.3-70b-versatile',
    maxTokens: 700,
  });
  return reply || "I'm your AI learning partner. Ask me anything — a concept to explain, a problem to solve, or a strategy to build.";
}

// ── Opportunities Search ───────────────────────────────────────────────────────
async function searchOpportunities(query, location, canvas) {
  const system = `You are an elite opportunity researcher with comprehensive knowledge of global scholarships, fellowships, grants, internships, and competitions available to students. You specialize in finding opportunities for students from the Caribbean, Jamaica, and developing nations, and you know which programs are genuinely open to international and underrepresented applicants.

Your expertise includes:
- Fully-funded scholarships (Chevening, Commonwealth, DAAD, Fulbright, CARICOM programs, etc.)
- Competitive fellowships (Rhodes, Gates Cambridge, Schwarzman, Obama Foundation, etc.)
- Tech & startup programs (Google for Startups, Y Combinator, MLH, Meta, etc.)
- Government & NGO grants for youth entrepreneurship and social impact
- Remote-friendly internships and virtual programs accessible globally
- Regional programs specifically for Caribbean and developing-world students

STRICT RULES:
- Only include programs that GENUINELY EXIST and are currently active in 2025-2026
- Every URL must be the real, direct program page — not Google, not search pages, not homepages
- If you're not 100% certain a URL is correct, use the organization's main domain
- Be specific about eligibility — note if open to international students, Caribbean students, etc.
- Frame each opportunity as something WORTH applying for — what makes it special?
- Return ONLY a valid JSON array, absolutely nothing else`;

  const locationCtx = location
    ? `\n\nStudent location: ${location}. PRIORITY ORDER:\n1. Programs specifically for ${location}/Caribbean/developing-world students\n2. Programs explicitly open to international students from any country\n3. Remote/virtual programs accessible globally\nDo NOT list US-only, EU-only, or citizenship-restricted programs unless the student qualifies.`
    : '';

  const canvasCtx = canvas?.field
    ? `\nStudent's field/major: ${canvas.field}. Goal: ${canvas.goal || 'Not specified'}. Tailor opportunities to this field where possible.`
    : '';

  const prompt = `Find 6 real, currently active opportunities that match: "${query}"${locationCtx}${canvasCtx}

Return ONLY this JSON array (no text before or after, no markdown code blocks):
[
  {
    "title": "Exact Official Program Name",
    "type": "Scholarship",
    "amount": "$5,000" or "Fully Funded" or "Varies",
    "deadline": "Month Year or Rolling",
    "field": "STEM / Business / Any / etc.",
    "url": "https://actual-program-website.org/apply",
    "description": "One compelling sentence: who this is for, what you get, and why it's worth applying."
  }
]

Types must be one of: Scholarship, Grant, Fellowship, Internship, Competition
Make these genuinely exciting, competitive, and REAL.`;

  const result = await smartAI(system, prompt, {
    claudeModel: 'claude-haiku-4-5',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'llama-3.3-70b-versatile',
    maxTokens: 1600,
  });
  return result;
}

// ── Post Caption Generator ────────────────────────────────────────────────────
async function generateCaption(context) {
  const system = `You are a social media coach for ambitious students sharing their journey on Visionary Hub — a platform where student visionaries, entrepreneurs, and high achievers share their progress and inspire each other.

Write captions that are:
- Authentic and personal — sounds like a real student, not a brand
- Motivating without being cringe — real talk, not empty positivity
- Story-driven — shares a specific moment, win, struggle, or lesson
- Ends with something that invites engagement (question, challenge, or insight)
- 2-4 sentences max
- Uses 2-3 relevant emojis naturally
- NO hashtags

Tone: Like a high-achieving friend sharing a real update, not a LinkedIn post.`;

  const reply = await smartAI(system, context || "I just made progress on my vision.", { maxTokens: 120 });
  return reply || null;
}

module.exports = {
  chatWithMentor,
  getReflectionInsights,
  refineVision,
  generateRoadmap,
  tutorChat,
  searchOpportunities,
  generateCaption,
  // expose for direct use
  smartAI,
  smartChat,
};
