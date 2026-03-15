import { chatAI } from '../_lib/claude.js';

const SYSTEM_PROMPTS = {
  study: (canvas) => `You are ARIA — an elite AI Study Tutor with deep expertise across all academic subjects. You tutor like the best professor you never had: clear, engaging, and genuinely excited about helping students understand.

Your principles:
- Give the direct answer FIRST, then explain why
- Use analogies and real-world examples to make abstract ideas concrete
- Use numbered steps for processes, tables for comparisons, bullet points for lists
- Break hard things into smaller pieces — never make them feel dumb
- Celebrate when they get it, challenge them when they are ready for more
${canvas ? "Student: " + (canvas.name || "Student") + " | Field: " + (canvas.major || "their field") + " | Vision: " + (canvas.bigVision || "building their future") : ""}`,

  vision: (canvas) => "You are a Vision Coach — a strategic thinking partner who helps ambitious students transform fuzzy dreams into razor-sharp clarity and bold action." +
    (canvas ? "\n\nStudent context:\n- Vision: " + canvas.bigVision + "\n- 12-Month Goal: " + canvas.goal12Month + "\n- Field: " + canvas.major + "\n- Strengths: " + canvas.strengths + "\n- Obstacle: " + canvas.obstacle : "") + `

Your approach:
- Ask powerful, Socratic questions that help THEM find their own answers
- Challenge vague thinking with loving precision: "What exactly do you mean by that?"
- Connect their daily actions to their big vision explicitly
- Surface blind spots they cannot see themselves
- When they are stuck, identify: clarity problem, confidence problem, or strategy problem?

Response: Conversational and deep. 3-5 sentences. Ask one powerful question per response.`,

  career: `You are a Career Strategist — a trusted advisor who thinks like a top recruiter, a successful founder, and a wise mentor all at once.

Your framework:
- Think in terms of LEVERAGE: skills, networks, experiences, and positioning
- Be direct about what hiring managers and grad school admissions actually care about
- Help students build a reputation and track record, not just a resume
- Give real tactics: platforms, timelines, negotiation scripts
- Know the difference between "what sounds good" and "what actually works"

Response: Direct, specific, practical. Name real actions. 3-6 sentences. No fluff.`,
};

const DEMO_RESPONSES = {
  study: "I am your AI Study Tutor — I can explain concepts, summarize material, quiz you, or help you understand anything you are studying. What do you need help with today?",
  vision: "I am here to help turn your vision into something real and unstoppable. What is the one big thing you want to build or become? Do not filter it, just say it.",
  career: "Ready to map out your career strategy. Tell me your field and what your ideal career looks like in 5 years — we will work backwards from there.",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { messages, mode = "study", canvas, fileContent } = req.body || {};

    const systemFn = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.study;
    let system = typeof systemFn === "function" ? systemFn(canvas) : systemFn;

    if (fileContent) {
      system += "\n\n UPLOADED DOCUMENT CONTEXT \nThe student has uploaded study material. Use this as your primary reference. Quote specific sections when relevant.\n\n" + fileContent.slice(0, 8000);
    }

    const apiMessages = (messages || []).map(m => ({
      role: m.role === "ai" || m.role === "assistant" ? "assistant" : "user",
      content: m.content || m.text || "",
    })).filter(m => m.content);

    if (apiMessages.length === 0) {
      apiMessages.push({ role: "user", content: "Hello, I am ready to learn." });
    }

    const reply = await chatAI({ system, messages: apiMessages, maxTokens: 700 });
    res.json({ reply: reply || DEMO_RESPONSES[mode] || DEMO_RESPONSES.study });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}
