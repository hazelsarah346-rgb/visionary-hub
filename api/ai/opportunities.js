/**
 * POST /api/ai/opportunities — AI opportunity search (scholarships, grants, etc.)
 * Body: { query, location?, canvas? }
 * Env: GROQ_API_KEY or ANTHROPIC_API_KEY
 */

import { askClaude } from '../_lib/claude.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { query, location, canvas } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query required' });
    const result = await searchOpportunities(query, location, canvas);
    return res.json({ result });
  } catch (e) {
    console.error('[opportunities]', e);
    return res.status(500).json({ error: e.message || 'Opportunities search failed' });
  }
}

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

  const userMessage = `Find 6 real, currently active opportunities matching: "${query}"${locationCtx}${canvasCtx}

Return ONLY this JSON array (nothing before or after):
[{"title":"Exact Program Name","type":"Scholarship","amount":"$5,000","deadline":"March 2026","field":"STEM/Business/Any","url":"https://real-website.org/program","description":"One motivating sentence — who this is for and why they should apply."}]

Types: Scholarship, Grant, Fellowship, Internship, or Competition only.
URLs must be direct program pages, not search engines. Include genuinely exciting, competitive programs.`;

  const result = await askClaude({
    system,
    userMessage,
    model: 'claude-haiku-4-5',
    maxTokens: 1400,
  });
  return result;
}
