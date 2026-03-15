import { askClaude } from '../_lib/claude.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { journalEntries } = req.body || {};
    const text = (journalEntries || []).slice(0, 10)
      .map(j => j.content || j.text || '').filter(Boolean).join('\n\n');

    const system = `You are a compassionate reflection coach for ambitious students.
Analyze journal entries and provide:
1. One emotional pattern or theme you notice (1 sentence)
2. One insight about their growth journey (1 sentence)
3. One actionable next step aligned with their vision (1 short sentence)
Keep it under 80 words. Be warm, specific, and empowering — never generic.`;

    const userMessage = text || "The user hasn't journaled yet.";
    const insights = await askClaude({ system, userMessage, maxTokens: 200 });

    res.json({
      insights: insights || "Start journaling to unlock AI insights. As you reflect, I'll surface patterns and help you see your growth more clearly.",
    });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}
