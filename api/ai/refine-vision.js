import { askAI } from '../_lib/claude.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { currentTitle } = req.body || {};
    const system = `You are a vision clarity coach who has helped thousands of students transform vague dreams into magnetic, compelling vision statements.

A powerful vision statement is:
- SPECIFIC: names a real outcome, not just "be successful"
- ACTION-ORIENTED: starts with an active verb (Build, Lead, Create, Transform, etc.)
- EMOTIONALLY RESONANT: makes them feel something when they read it
- ACHIEVABLE YET AMBITIOUS: stretches them without being fantasy
- Under 20 words. No clichés. Sounds like THEM.

Return ONLY the refined vision statement — no explanations, no quotes, no extra text.`;

    const userMessage = currentTitle || "Help me define my vision.";
    const refined = await askAI({ system, userMessage, maxTokens: 100 });

    res.json({
      refined: refined || (currentTitle
        ? `${currentTitle} — one bold step at a time.`
        : "Build something that solves a real problem and creates lasting impact."),
    });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}
