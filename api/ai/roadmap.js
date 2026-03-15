import { askAI } from '../_lib/claude.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { canvas, activity, mode, question, roadmap } = req.body || {};

    // ── SUGGESTION CHAT MODE ─────────────────────────────────────────────
    // When mode === 'chat', user is asking a specific question about their journey
    if (mode === 'chat') {
      const system = buildChatSystem(canvas, roadmap, activity);
      const reply = await askAI({ system, userMessage: question || 'What should I focus on next?', model: 'claude-sonnet-4-6', maxTokens: 700 });
      return res.json({ reply: reply || "Let's think through that together. What specifically is blocking you right now?" });
    }

    // ── FULL ROADMAP GENERATION ──────────────────────────────────────────
    const system = buildRoadmapSystem();
    const userMessage = buildUserMessage(canvas, activity);

    const result = await askAI({ system, userMessage, model: 'claude-sonnet-4-6', maxTokens: 1800 });

    if (result) {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json(parsed);
        }
      } catch (_) {}
    }

    res.json(getDefaultRoadmap(canvas));
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────

function buildRoadmapSystem() {
  return `You are a world-class life coach and career strategist for undergraduate students and career switchers.

Analyse the student's profile AND their real activity, then generate a deeply personalised roadmap with specific action guidance.

Return ONLY valid JSON in this exact format:
{
  "phases": [
    {
      "phase": 1,
      "label": "Foundation",
      "timeframe": "Months 1-3",
      "theme": "One focused theme for this phase",
      "milestones": ["specific milestone 1", "specific milestone 2", "specific milestone 3", "specific milestone 4"],
      "howTo": ["Concrete step A", "Concrete step B", "Concrete step C"],
      "focusArea": "The single most important focus",
      "successSign": "How they will know this phase is complete"
    }
  ],
  "northStar": "Their 2-3 year vision in one powerful sentence",
  "firstStep": "The ONE action they can take TODAY — specific, tiny, doable in under an hour",
  "activityInsight": "2-3 honest sentences analysing what their activity reveals about where they are now and what they need most. Be direct and encouraging. Reference their journal or notes if available.",
  "suggestions": [
    {
      "title": "Short action title",
      "detail": "Specific, practical instruction tailored to their field and goal",
      "why": "One sentence on why this matters for their specific journey",
      "priority": "high"
    }
  ]
}

Rules:
- All 4 phases must be present
- Milestones must be SPECIFIC to their field, vision and 12-month goal — never generic
- howTo must give real, practical steps a student can actually follow
- suggestions must be 3-5 items ordered by impact
- activityInsight MUST reference their actual data (journal patterns, completed tasks, notes) when available — never generic if data exists
- firstStep must be small enough to do today — not a project, a single action`;
}

function buildChatSystem(canvas, roadmap, activity) {
  const canvasSummary = canvas
    ? `Student: ${canvas.name || 'Student'} | Field: ${canvas.major || 'Not set'} | Vision: "${canvas.bigVision || 'Not set'}" | 12-month goal: "${canvas.goal12Month || 'Not set'}"`
    : 'A student figuring out their path.';

  const roadmapSummary = roadmap
    ? `Roadmap north star: "${roadmap.northStar}". Phases: ${roadmap.phases?.map(p => p.label).join(' → ')}.`
    : 'No roadmap generated yet.';

  const activitySummary = buildActivitySummary(activity);

  return `You are a direct, practical career and life coach for an undergraduate student or career switcher.

Student context:
${canvasSummary}

Their roadmap:
${roadmapSummary}

${activitySummary}

Answer their question with:
- Specific, actionable advice tuned to THEIR field and goal — not generic
- Real resources, platforms, strategies where relevant
- Honest guidance — if something is hard, say so and show how to get through it
- 3-5 short paragraphs max — every sentence must be useful, no filler`;
}

function buildUserMessage(canvas, activity) {
  const canvasText = canvas
    ? `STUDENT PROFILE:
Name: ${canvas.name || 'Student'}
Field / Major: ${canvas.major || 'Not specified'}
Big Vision: ${canvas.bigVision || 'Not specified'}
Core Strengths: ${canvas.strengths || 'Not specified'}
Main Obstacle: ${canvas.obstacle || 'Not specified'}
12-Month Goal: ${canvas.goal12Month || 'Not specified'}`
    : 'STUDENT PROFILE: A student building a meaningful career.';

  const activityText = buildActivitySummary(activity);
  return [canvasText, activityText, 'Generate their personalised roadmap based on ALL of the above.']
    .filter(Boolean).join('\n\n');
}

function buildActivitySummary(activity) {
  if (!activity) return '';
  const parts = [];

  if (activity.completedMilestones > 0)
    parts.push(`Completed milestones: ${activity.completedMilestones} (they are taking action)`);

  if (activity.journalEntries?.length > 0) {
    const snippets = activity.journalEntries
      .slice(-5)
      .map(e => `"${(e.response || e.content || '').slice(0, 150)}"`)
      .filter(Boolean)
      .join('\n');
    if (snippets)
      parts.push(`Recent journal reflections (last ${Math.min(5, activity.journalEntries.length)} entries):\n${snippets}`);
  }

  if (activity.tutorNotes?.trim())
    parts.push(`Study notes (excerpt): "${activity.tutorNotes.slice(0, 300)}"`);

  if (activity.daysActive > 0)
    parts.push(`Days active on platform: ${activity.daysActive}`);

  return parts.length > 0 ? 'STUDENT ACTIVITY:\n' + parts.join('\n\n') : '';
}

// ─── FALLBACK ────────────────────────────────────────────────────────────────

function getDefaultRoadmap(canvas) {
  const field = canvas?.major || 'your field';
  const goal = canvas?.goal12Month || 'your 12-month goal';
  return {
    phases: [
      {
        phase: 1, label: 'Foundation', timeframe: 'Months 1-3',
        theme: 'Get clear, get skilled, get started',
        milestones: [
          'Write your personal brand statement in one sentence',
          `Complete one core course or certification in ${field}`,
          'Set up a professional LinkedIn or portfolio page',
          'Identify 3 people doing what you want — study how they got there',
        ],
        howTo: [
          `Search for beginner resources and free courses specific to ${field}`,
          'Write a 3-sentence bio: who you are, what you do, where you\'re going',
          'Message one person you admire — genuine, specific, no ask attached',
        ],
        focusArea: 'Clarity and skill foundation',
        successSign: 'You can explain your vision in 60 seconds and feel confident doing it',
      },
      {
        phase: 2, label: 'Momentum', timeframe: 'Months 4-9',
        theme: 'Build real proof and real connections',
        milestones: [
          'Complete one real project that demonstrates your skills',
          'Apply to 2–3 internships, programmes or opportunities',
          'Have 3 genuine conversations with professionals in your field',
          `Make visible progress toward: ${goal}`,
        ],
        howTo: [
          'Start a small, finishable project — not perfect, just done and real',
          'Use LinkedIn, events, communities to find people one step ahead of you',
          'Ask for a 15-minute conversation, not a job — curiosity, not desperation',
        ],
        focusArea: 'Action and proof of work',
        successSign: 'You have something real to show — proof you can do the thing',
      },
      {
        phase: 3, label: 'Impact', timeframe: 'Months 10-18',
        theme: 'Create outcomes others can see',
        milestones: [
          'Lead or own a significant project or initiative',
          'Secure mentorship with someone 5+ years ahead of you',
          'Share your work publicly — post, present, publish or pitch',
          'Reflect deeply and double down on what is working',
        ],
        howTo: [
          'Volunteer to lead something — a team, project, event, or campaign',
          'Reach out to potential mentors with a clear ask and your proof of work',
          'Write one public piece about what you\'ve learned — blog, LinkedIn, or case study',
        ],
        focusArea: 'Ownership and real-world outcomes',
        successSign: 'Others reach out to you because of what you have built or shared',
      },
      {
        phase: 4, label: 'Scale', timeframe: 'Year 2+',
        theme: 'Grow your impact and build legacy',
        milestones: [
          'Mentor someone one step behind you',
          'Expand your work to a broader audience or greater impact',
          'Commit clearly to your 3-year vision',
          'Build 5+ deep, reciprocal professional relationships',
        ],
        howTo: [
          'Say yes to leadership — roles, speaking, mentoring — even when you feel unready',
          'Systematise what works so it can scale without just you doing more hours',
          'Invest in a few deep relationships rather than many shallow ones',
        ],
        focusArea: 'Leadership and legacy',
        successSign: 'You are creating opportunities for others, not just yourself',
      },
    ],
    northStar: canvas?.bigVision || 'Build something meaningful that creates real value for others',
    firstStep: 'Write your vision in one sentence right now — then put it somewhere you see every day.',
    activityInsight: 'Complete your Vision Canvas so every phase of this roadmap is specific to your actual goals. The more context you give, the more useful and personal this becomes.',
    suggestions: [
      { title: 'Complete your Vision Canvas', detail: 'Fill in your Vision Canvas so your roadmap is built around your real goals, not a template.', why: 'Generic roadmaps don\'t produce real results — yours should be built for you.', priority: 'high' },
      { title: 'Tick off one milestone today', detail: 'Pick the smallest milestone from Phase 1 and finish it in the next 24 hours — not a plan, a done thing.', why: 'Momentum starts with one small completed action, not a big idea.', priority: 'high' },
      { title: 'Write 3 journal entries this week', detail: 'Reflect on what you\'re feeling, what\'s blocking you, and what you\'re proud of — 3 short honest entries.', why: 'Your reflections help the AI give you better, more personal guidance over time.', priority: 'medium' },
    ],
  };
}
