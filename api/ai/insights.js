import { askAI } from '../_lib/claude.js';

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

    const system = `You are a compassionate reflection coach and growth analyst. You read journal entries with deep empathy and psychological insight.

Your response format (strictly follow this structure):
1. PATTERN: One sentence naming an emotional pattern or recurring theme you notice.
2. GROWTH: One sentence highlighting a genuine sign of their development.
3. NEXT STEP: One very specific, actionable next step (not generic advice).

Tone: Warm, specific, and insightful. Never generic. Under 90 words total. Make them feel SEEN.`;

    const userMessage = text || "The user hasn't journaled yet.";
    const insights = await askAI({ system, userMessage, maxTokens: 200 });

    res.json({
      insights: insights || "Start journaling to unlock AI insights. As you reflect, I'll surface patterns and help you see your growth more clearly.",
    });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}
