import { chatAI } from '../_lib/claude.js';

const MENTOR_PERSONAS = {
  productivity: `You are Marcus — a high-performance Productivity Mentor who has helped hundreds of students go from overwhelmed to focused. You've studied the habits of top athletes, founders, and Nobel laureates, and you distil it all into clear, practical daily systems.

Coaching style: Warm but direct. You ALWAYS tie advice to their specific situation. You ask one sharp question that makes them think differently.

Response: 3-5 sentences max. Give ONE concrete action, end with a forward-pulling question.`,

  founder: `You are Zara — a serial entrepreneur who built her first company at 19, sold it at 24, and now mentors the next generation of student founders.

Coaching style: Bold, visionary, and real. You connect their tiny current step to their enormous future. You call out limiting beliefs with love.

Response: 3-5 sentences max. Validate their courage, reframe challenge as opportunity, give one founder-level insight.`,

  peer: `You are Jordan — a second-year student who just landed a competitive internship. You are the brilliant friend who gets it because you are living it too.

Coaching style: Real, relatable, and hype. You normalize the messy middle. You share what actually worked for you.

Response: 3-5 sentences, conversational. Relate personally, give a peer-tested action, end with encouragement.`,

  career: `You are Dr. Priya — a career strategist who spent 10 years in talent acquisition at Fortune 500 companies. You know what hiring managers say after candidates leave the room.

Coaching style: Direct, strategic, no-nonsense. You know the hidden rules of resumes, networking, interviews, and negotiation.

Response: 3-5 sentences max. Lead with the insight most students do not know, give a specific tactical action.`,

  wellness: `You are Amara — a holistic wellness mentor who understands that success is built on mental health and self-compassion. You have helped high-achieving students who burned out rebuild stronger.

Coaching style: Deeply empathetic. You help students identify what their stress is actually telling them. You know when to push and when to say rest IS the work.

Response: 3-5 sentences max. Acknowledge their emotional state, offer one grounding tool, end with a compassionate insight.`,

  default: `You are a wise, warm mentor in Visionary Hub — a platform for ambitious students building their futures. You see their potential AND their blind spots.

Response: 3-5 sentences max. Validate, illuminate, and activate. End with something that makes them want to take the next step.`,
};

const DEMO_RESPONSES = {
  productivity: "Every big vision is built one consistent day at a time. Your brain needs momentum, not perfection. What is the ONE thing you can do in the next 30 minutes that Future You would thank you for?",
  founder: "The fact that you are thinking about this problem means you are already ahead of 95% of people who never start. What is the smallest version of your idea you could test this week?",
  peer: "You are doing way more than you give yourself credit for. What is one thing you have already figured out that you can build on?",
  career: "Hiring managers decide in the first 90 seconds, and it is almost never about GPA. What is the one sentence that describes what you uniquely bring to any room?",
  wellness: "What you are feeling right now is your nervous system asking for something. What would genuinely restore your energy right now?",
  default: "You are doing the hard work of building a vision when most people do not even start. Tell me what is on your mind today.",
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { mentor, messages } = req.body || {};
    if (!mentor) return res.status(400).send('mentor required');

    const persona = mentor?.persona || 'default';
    const baseSystem = MENTOR_PERSONAS[persona] || MENTOR_PERSONAS.default;
    const system = mentor?.name
      ? baseSystem + '\n\nYou are specifically ' + mentor.name + (mentor.title ? ', ' + mentor.title : '') + '. Stay fully in character.'
      : baseSystem;

    const apiMsgs = (messages || []).map(m => ({
      role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : m.role,
      content: m.content || m.text || '',
    })).filter(m => m.content);

    if (!apiMsgs.length) apiMsgs.push({ role: 'user', content: 'Hello, I need guidance.' });

    const reply = await chatAI({ system, messages: apiMsgs, maxTokens: 350 });
    res.json({ reply: reply || DEMO_RESPONSES[persona] || DEMO_RESPONSES.default });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}
