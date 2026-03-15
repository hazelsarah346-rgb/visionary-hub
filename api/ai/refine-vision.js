import { askClaude } from '../_lib/claude.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { currentTitle } = req.body || {};
    const system = `You are a vision clarity coach for student visionaries.
Rewrite their goal/vision as a single compelling sentence that is:
- Specific and outcome-focused (not vague like "be successful")
- Action-oriented (clear, measurable direction)
- Energizing (makes them feel the possibility)
- Under 20 words
If empty input, suggest a powerful starter vision for an ambitious student.`;

    const userMessage = currentTitle || "Help me define my vision.";
    const refined = await askClaude({ system, userMessage, maxTokens: 100 });

    res.json({
      refined: refined || (currentTitle
        ? `${currentTitle} — one bold step at a time.`
        : "Build something that solves a real problem and creates lasting impact."),
    });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}
