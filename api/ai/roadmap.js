import { askClaude } from '../_lib/claude.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { canvas } = req.body || {};

    const system = `You are a strategic life coach and career planner for ambitious students.
Generate a personalized 4-phase life roadmap in JSON format based on the student's Visionary Canvas.

Return ONLY valid JSON in this exact format:
{
  "phases": [
    {
      "phase": 1,
      "label": "Foundation",
      "timeframe": "Months 1-3",
      "theme": "One-sentence theme for this phase",
      "milestones": ["milestone 1", "milestone 2", "milestone 3", "milestone 4"],
      "focusArea": "The single most important focus",
      "successSign": "How they'll know this phase is complete"
    },
    ... (phases 2, 3, 4)
  ],
  "northStar": "Their ultimate 3-year vision in one sentence",
  "firstStep": "The ONE thing to do in the next 24 hours"
}

Phase themes:
- Phase 1 (Foundation, Months 1-3): Build the base — clarity, skills, identity
- Phase 2 (Momentum, Months 4-9): Take action — projects, network, portfolio
- Phase 3 (Impact, Months 10-18): Make your mark — real outcomes, leadership
- Phase 4 (Scale, Year 2+): Build legacy — mentor others, grow bigger

Make milestones SPECIFIC to the student's vision, major, and goal — not generic.`;

    const canvasText = canvas
      ? `Student profile:
Name: ${canvas.name || 'Unknown'}
Major/Field: ${canvas.major || 'Not specified'}
Big Vision: ${canvas.bigVision || 'Not specified'}
Core Strengths: ${canvas.strengths || 'Not specified'}
Main Obstacle: ${canvas.obstacle || 'Not specified'}
12-Month Goal: ${canvas.goal12Month || 'Not specified'}`
      : "A student who wants to build a meaningful career and make a real impact.";

    const result = await askClaude({
      system,
      userMessage: canvasText,
      model: 'claude-sonnet-4-6',
      maxTokens: 1200,
    });

    if (result) {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json(parsed);
        }
      } catch (_) {}
    }

    // Fallback roadmap
    res.json(getDefaultRoadmap(canvas));
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}

function getDefaultRoadmap(canvas) {
  const field = canvas?.major || 'your field';
  const goal = canvas?.goal12Month || 'your 12-month goal';
  return {
    phases: [
      {
        phase: 1, label: "Foundation", timeframe: "Months 1-3",
        theme: "Get clear, get skilled, get started",
        milestones: [
          "Define your personal brand in writing",
          `Complete one core certification in ${field}`,
          "Set up your professional online presence",
          "Identify 3 role models and study their paths",
        ],
        focusArea: "Clarity and skill-building",
        successSign: "You can explain your vision to anyone in 60 seconds",
      },
      {
        phase: 2, label: "Momentum", timeframe: "Months 4-9",
        theme: "Build proof, build connections",
        milestones: [
          "Complete one real project that shows your skills",
          "Apply to 2-3 internships or opportunities",
          "Have 3 genuine conversations with people in your field",
          `Make measurable progress toward: ${goal}`,
        ],
        focusArea: "Action and portfolio building",
        successSign: "You have something real to show — proof of work",
      },
      {
        phase: 3, label: "Impact", timeframe: "Months 10-18",
        theme: "Create outcomes that matter",
        milestones: [
          "Lead or own a significant project",
          "Secure a mentorship with someone 5 years ahead",
          "Share your work publicly — post, present, or publish",
          "Reflect on what's working and double down",
        ],
        focusArea: "Ownership and real-world outcomes",
        successSign: "Others are reaching out because of what you've built",
      },
      {
        phase: 4, label: "Scale", timeframe: "Year 2+",
        theme: "Grow your impact, build your legacy",
        milestones: [
          "Mentor someone one step behind you",
          "Expand your work to affect more people",
          "Define your 3-year vision and commit to it",
          "Build 5+ deep professional relationships",
        ],
        focusArea: "Leadership and legacy",
        successSign: "You're creating opportunities for others, not just yourself",
      },
    ],
    northStar: canvas?.bigVision || "Build something meaningful that outlasts you",
    firstStep: "Write down your vision in one sentence — right now, today",
  };
}
