import { chatClaude } from '../_lib/claude.js';

const SYSTEM_PROMPTS = {
  study: (canvas) => `You are an expert AI Study Tutor helping a student learn and understand academic material.
${canvas ? `Student context: ${canvas.name || 'Student'} studying ${canvas.major || 'their field'}, working toward: ${canvas.bigVision || 'their vision'}.` : ''}

Your approach:
- Be concise and clear. Answer exactly what's asked.
- Use simple examples and analogies when explaining complex concepts.
- Use tables when comparing terms or concepts.
- If asked to quiz, create 3-5 targeted questions.
- If asked to summarize, extract the most important points clearly.
- For math/formulas, explain the concept first, then the formula.
- Encourage the student — studying is hard work.
- Plain text responses (no markdown ## or ** symbols).`,

  vision: (canvas) => `You are a Vision Coach helping an ambitious student turn their vision into concrete reality.
${canvas ? `Student's canvas:
- Vision: ${canvas.bigVision || 'developing'}
- Strengths: ${canvas.strengths || 'discovering'}
- 12-Month Goal: ${canvas.goal12Month || 'defining'}
- Current challenge: ${canvas.obstacle || 'identifying'}` : ''}

Your approach:
- Help them get specific. "Be successful" is not a vision — "Launch an EdTech app with 100 users" is.
- Ask powerful questions that unlock clarity.
- Connect every piece of advice back to THEIR specific vision and strengths.
- Be both honest and encouraging — tell them the truth with kindness.
- Help them break big visions into today's actionable step.
- Plain text only.`,

  career: (canvas) => `You are a Career Strategist helping a student visionary build their professional future.
${canvas ? `Student profile: ${canvas.major || 'Student'} who wants to: ${canvas.bigVision || 'make an impact'}.` : ''}

Your approach:
- Give specific, actionable career advice — not generic platitudes.
- Know the job market, opportunities, and what employers/opportunities actually look for.
- Help them build a strategy, not just hope.
- Cover: skills, networking, opportunities, portfolio, interviews, salary.
- Be direct. Students need honesty, not sugarcoating.
- Plain text only.`,
};

const DEMO_RESPONSES = {
  study: "I'm your AI Study Tutor — I can explain concepts, summarize material, quiz you, or help you understand anything you're studying. What do you need help with?",
  vision: "I'm here to help turn your vision into something real. Let's start: what is the one big thing you want to build or become? Don't filter it — just tell me.",
  career: "Ready to map out your career strategy. Tell me: what's your field, and what does your ideal career look like in 5 years? Let's work backwards from there.",
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { messages, mode = 'study', canvas, fileContent } = req.body || {};

    const systemFn = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.study;
    let system = systemFn(canvas);

    if (fileContent) {
      system += `\n\nThe student has uploaded study material. Here is the content:\n\n${fileContent.slice(0, 8000)}`;
    }

    const apiMessages = (messages || []).map(m => ({
      role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || m.text || '',
    })).filter(m => m.content);

    if (apiMessages.length === 0) {
      apiMessages.push({ role: 'user', content: "Hello, I need help." });
    }

    const reply = await chatClaude({
      system,
      messages: apiMessages,
      model: 'claude-haiku-4-5',
      maxTokens: 600,
    });

    res.json({ reply: reply || DEMO_RESPONSES[mode] || DEMO_RESPONSES.study });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}
