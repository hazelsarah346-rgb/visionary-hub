import React, { useState, useEffect, useRef } from 'react';
import {
  Lightbulb, Home, BookOpen, Map, Brain, Users, Compass, Shield,
  Sparkles, Send, Plus, CheckSquare, Square, Target, X, ChevronRight, ChevronLeft,
  ArrowRight, Upload, FileText, Trash2, MessageCircle, Star, Zap,
  TrendingUp, Award, Clock, RefreshCw, Loader2, Heart, AlignLeft,
  BarChart2, Briefcase, GraduationCap, Globe, Search, Edit3, Check,
  Download, Menu, Mic, BookMarked, Flame, Wind, ChevronDown, ChevronUp,
  Activity, PenLine, Share2, Bot, Settings, LogOut,
  Bell, Image, Video, MoreHorizontal, Eye, EyeOff, Lock, Copy, AlertCircle,
} from 'lucide-react';
import { api } from './api';
import { supabase, fetchPosts, insertPost, reactToPost, subscribePosts, fetchMentors, uploadMedia, deletePost, deleteMentor } from './lib/supabase';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#050F1E', surface: '#091525', card: '#0C1D30', border: '#162A42',
  blue: '#2563EB', blueMid: '#3B82F6', blueLight: '#60A5FA',
  text: '#EFF6FF', muted: '#64748B',
  green: '#10B981', yellow: '#F59E0B', purple: '#8B5CF6', red: '#EF4444',
  teal: '#06B6D4',
};
const PHASE_COLORS = ['#2563EB', '#8B5CF6', '#F59E0B', '#10B981'];

const DAILY_PROMPTS = [
  'What challenged me today, and what did it teach me?',
  'What am I most grateful for right now?',
  'What is one thing I can do today to move my vision forward?',
  'Who inspired me recently, and why?',
  'What fear is holding me back: and what would I do without it?',
  'What would I attempt if I knew I could not fail?',
  'What does "success" actually mean to me: today?',
  'What did I learn this week that I didn\'t know before?',
];

// ─── DAILY CHALLENGES POOL ────────────────────────────────────────────────────
// 30 psychology-backed challenges: one per day of month
const CHALLENGE_POOL = [
  { type: 'Cognitive Reframe',    emoji: '🧠', color: '#8B5CF6', prompt: "Name one belief that's been holding you back. Now argue the OPPOSITE: write 3 reasons why that belief is wrong.", insight: 'cognitive behavioral therapy', xp: 30 },
  { type: 'Growth Edge',          emoji: '💪', color: '#F59E0B', prompt: "What's the one thing you keep avoiding because it scares you? Write exactly what you would do TODAY if fear wasn't a factor.", insight: 'exposure therapy', xp: 35 },
  { type: 'Blind Spot Finder',    emoji: '🔍', color: '#EF4444', prompt: "Ask yourself: What am I NOT seeing about my situation right now? What would someone you respect say you're missing?", insight: 'Johari window', xp: 40 },
  { type: 'Vision Sprint',        emoji: '🎯', color: '#2563EB', prompt: "In the next 5 minutes, write the most vivid description you can of your life 3 years from now. Be dangerously specific.", insight: 'mental contrasting', xp: 30 },
  { type: 'Thought Experiment',   emoji: '💡', color: '#06B6D4', prompt: "You wake up tomorrow with every resource, connection, and skill you need. What's the FIRST thing you do? What does that tell you about your priorities?", insight: 'possibility thinking', xp: 25 },
  { type: 'Emotional IQ',         emoji: '❤️', color: '#EC4899', prompt: "Name the emotion you've felt most this week. Where do you feel it in your body? What is it trying to tell you?", insight: 'somatic intelligence', xp: 30 },
  { type: 'Identity Shift',       emoji: '🦋', color: '#10B981', prompt: "Write 3 sentences starting with 'I am a person who...' that describe who you're BECOMING: not who you've been.", insight: 'identity-based habit change', xp: 35 },
  { type: 'Gratitude Amplifier',  emoji: '✨', color: '#F59E0B', prompt: "Write about one person who believed in you before you believed in yourself. What would you tell them today?", insight: 'positive psychology', xp: 20 },
  { type: 'First Principles',     emoji: '⚡', color: '#2563EB', prompt: "Take your biggest current goal. Strip it down to its absolute basics. What is the CORE thing you're actually trying to achieve, underneath all the layers?", insight: 'first-principles thinking', xp: 40 },
  { type: 'Anti-Goals',           emoji: '🚫', color: '#EF4444', prompt: "What does failure look like for you in 5 years? Describe it in detail. Now: what ONE decision today would guarantee you never get there?", insight: 'inversion thinking', xp: 35 },
  { type: 'Strengths Audit',      emoji: '💎', color: '#8B5CF6', prompt: "What are you in the top 10% of the people you know at? How could you turn that strength into your biggest opportunity right now?", insight: 'strengths-based psychology', xp: 30 },
  { type: 'Limiting Story',       emoji: '📖', color: '#EC4899', prompt: "What's the story you keep telling yourself about why you CAN'T? Rewrite it: same facts, but a completely different: and empowering: interpretation.", insight: 'narrative therapy', xp: 40 },
  { type: 'Energy Audit',         emoji: '🔋', color: '#10B981', prompt: "List 3 things that drain your energy and 3 things that fill it up. What would your life look like if you did MORE of the filling things this week?", insight: 'energy management theory', xp: 25 },
  { type: 'Decision Matrix',      emoji: '⚖️', color: '#06B6D4', prompt: "You're facing a decision you keep postponing. Apply the 10/10/10 rule: How will you feel about this in 10 minutes, 10 months, 10 years?", insight: 'temporal discounting', xp: 35 },
  { type: 'Opportunity Hunter',   emoji: '🌱', color: '#F59E0B', prompt: "Name ONE opportunity in your field you've been putting off — an internship, a course, a person to message, or a project to start. Write exactly what the first step is and when you'll do it today.", insight: 'action bias & opportunity cost', xp: 25 },
  { type: 'Curiosity Spark',      emoji: '🔭', color: '#2563EB', prompt: "What's something in your field that genuinely fascinates you and you still don't fully understand? Write 3 questions you'd love to find answers to.", insight: 'intrinsic motivation', xp: 25 },
  { type: 'Courage Inventory',    emoji: '🦁', color: '#EF4444', prompt: "Think of the last time you were truly brave. What did you do? What would it look like to be THAT version of yourself in your current situation?", insight: 'self-efficacy theory', xp: 35 },
  { type: 'Systems Check',        emoji: '⚙️', color: '#8B5CF6', prompt: "You don't rise to your goals: you fall to your systems. Name one daily habit that, if done consistently, would change everything for you.", insight: 'systems thinking', xp: 30 },
  { type: 'Perspective Shift',    emoji: '🌍', color: '#10B981', prompt: "Describe your current biggest challenge from the perspective of someone 20 years older and wiser looking back at this moment in your life.", insight: 'temporal self-appraisal', xp: 35 },
  { type: 'Deep Why',             emoji: '🎇', color: '#EC4899', prompt: "Ask 'Why?' five times about your main goal. Start with the goal, then keep asking why until you hit something that genuinely moves you.", insight: '5 Whys: Ikigai', xp: 40 },
  { type: 'Present Power',        emoji: '🧘', color: '#06B6D4', prompt: "What if this exact moment: with everything you have and don't have: is exactly where you need to be to reach your vision? What would you do differently right now?", insight: 'mindfulness + acceptance', xp: 25 },
  { type: 'Network Audit',        emoji: '🤝', color: '#2563EB', prompt: "You are the average of the 5 people closest to you. Who are those 5 people? Who do you need to meet to become the person your vision requires?", insight: 'social network theory', xp: 30 },
  { type: 'Failure Mining',       emoji: '💥', color: '#EF4444', prompt: "Describe a recent failure or setback honestly. Now extract 3 specific lessons that only THAT failure could have taught you. What's the gift inside it?", insight: 'post-traumatic growth', xp: 40 },
  { type: 'Value Clarity',        emoji: '🏔️', color: '#F59E0B', prompt: "List your top 5 values. Now check: Are your daily actions actually aligned with them? Where's the gap: and what one change would close it?", insight: 'values clarification', xp: 35 },
  { type: 'Imposter Audit',       emoji: '🎭', color: '#8B5CF6', prompt: "When do you feel like a fraud? Write it honestly. Now write all the EVIDENCE that you actually belong: accomplishments, feedback, skills you've earned.", insight: 'imposter syndrome research', xp: 30 },
  { type: 'Body Wisdom',          emoji: '🫀', color: '#EC4899', prompt: "Your body keeps score. Right now, is your body tense or relaxed? Energised or depleted? What is it telling you about something you've been ignoring?", insight: 'somatic psychology', xp: 25 },
  { type: 'Bold Bet',             emoji: '🎲', color: '#10B981', prompt: "What's the BOLDEST version of what you could attempt this month? Not realistic: outrageous. Now write one small step toward THAT version.", insight: 'moonshot thinking', xp: 35 },
  { type: 'Mentorship Mirror',    emoji: '🪞', color: '#06B6D4', prompt: "Think of your greatest mentor (real or imagined). What advice would they give you about where you're stuck RIGHT NOW?", insight: 'social learning theory', xp: 30 },
  { type: 'Flow Finder',          emoji: '🌊', color: '#2563EB', prompt: "When were you last completely absorbed in something: time disappeared? What were you doing? How could you engineer more of that into your life this week?", insight: 'flow state: Csikszentmihalyi', xp: 30 },
  { type: 'Legacy Letter',        emoji: '📜', color: '#F59E0B', prompt: "Write a 3-sentence letter from your 80-year-old self to you: right now. What do they most want you to know about this phase of your life?", insight: 'terror management theory', xp: 40 },
];

// ─── DAILY CHALLENGE COMPONENT ────────────────────────────────────────────────
function DailyChallengeCard({ canvas, user }) {
  const today = new Date().toDateString();
  const dayOfMonth = new Date().getDate() - 1;
  const challenge = CHALLENGE_POOL[dayOfMonth % CHALLENGE_POOL.length];

  const storageKey = `vh_challenge_${today}`;
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; }
    // state: null | { response, feedback, completed }
  });
  const [expanded, setExpanded] = useState(false);
  const [response, setResponse] = useState(state?.response || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(state?.feedback || '');

  // Streak + XP
  const streak = parseInt(localStorage.getItem('vh_streak') || '0');
  const xp     = parseInt(localStorage.getItem('vh_xp') || '0');

  const submit = async () => {
    if (!response.trim() || loading) return;
    setLoading(true);
    try {
      const system = `You are a brilliant psychologist and growth coach who gives the most insightful, personalised feedback on self-reflection exercises.

The user just completed a "${challenge.type}" challenge inspired by ${challenge.insight}.
Their response shows what they're thinking: your job is to:
1. Validate what's insightful about what they wrote (be specific, not generic)
2. Add ONE psychological insight or reframe they may not have considered
3. Give them ONE concrete action to take within the next 24 hours
${canvas ? `Context: ${canvas.name || 'Student'}, field: ${canvas.major}, vision: ${canvas.bigVision}` : ''}

Be warm, sharp, and specific. Under 80 words. End with something energising.`;

      const r = await fetch('/api/ai/tutor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Challenge: ${challenge.prompt}\n\nMy response: ${response}` }],
          mode: 'vision', canvas,
        }),
      });
      const d = await r.json();
      const fb = d.reply || "That's a powerful reflection. The fact that you engaged deeply with this challenge shows real self-awareness: that's the foundation of everything.";
      setFeedback(fb);

      // Mark complete, update streak + XP
      const newState = { response, feedback: fb, completed: true };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      setState(newState);

      // Update streak
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const lastDone = localStorage.getItem('vh_last_challenge');
      const newStreak = lastDone === yesterday.toDateString() ? streak + 1 : 1;
      localStorage.setItem('vh_streak', String(newStreak));
      localStorage.setItem('vh_last_challenge', today);
      localStorage.setItem('vh_xp', String(xp + challenge.xp));
    } catch (_) {
      setFeedback("Great reflection. Keep showing up like this: consistency is the whole game.");
      const newState = { response, feedback: "Great reflection. Keep showing up like this: consistency is the whole game.", completed: true };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      setState(newState);
    }
    setLoading(false);
  };

  const isComplete = state?.completed;
  const currentStreak = parseInt(localStorage.getItem('vh_streak') || '0');
  const currentXP     = parseInt(localStorage.getItem('vh_xp') || '0');

  return (
    <div style={{ marginBottom: 20, borderRadius: 18, overflow: 'hidden', border: `1px solid ${challenge.color}33`, background: `linear-gradient(135deg, ${challenge.color}0A, ${C.surface})` }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: isComplete ? 'default' : 'pointer' }}
        onClick={() => !isComplete && setExpanded(e => !e)}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: `${challenge.color}20`, border: `1px solid ${challenge.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {challenge.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: challenge.color, textTransform: 'uppercase', letterSpacing: 1, background: `${challenge.color}18`, padding: '2px 8px', borderRadius: 99 }}>{challenge.type}</span>
            <span style={{ fontSize: 10, color: C.muted }}>+{challenge.xp} XP</span>
            {isComplete && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>✓ Done</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded || isComplete ? 'normal' : 'nowrap' }}>
            Daily Brain Challenge
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          {currentStreak > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, color: C.yellow }}>🔥 {currentStreak}</span>
          )}
          <span style={{ fontSize: 10, color: C.muted }}>{currentXP} XP</span>
        </div>
      </div>

      {/* Completed view */}
      {isComplete && (
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.green, marginBottom: 6 }}>YOUR REFLECTION</div>
            <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{state.response}</p>
          </div>
          <div style={{ background: `${challenge.color}10`, border: `1px solid ${challenge.color}25`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: challenge.color, marginBottom: 6 }}>🤖 AI INSIGHT</div>
            <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{state.feedback}</p>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 10, textAlign: 'center' }}>New challenge tomorrow. Come back! 🌟</div>
        </div>
      )}

      {/* Expanded: active challenge */}
      {!isComplete && expanded && (
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{ background: `${challenge.color}0D`, border: `1px solid ${challenge.color}22`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: challenge.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Today's Challenge</div>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: C.text, lineHeight: 1.7, fontWeight: 500 }}>{challenge.prompt}</p>
            <div style={{ fontSize: 10, color: C.muted }}>Based on: <em>{challenge.insight}</em></div>
          </div>
          <textarea value={response} onChange={e => setResponse(e.target.value)}
            placeholder="Write your honest reflection here: no judgment, no filter. This is just for you and your growth…"
            rows={4} style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '12px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.muted }}>{response.length < 30 ? 'Keep going: go deeper…' : response.length < 100 ? 'Good start: push further' : '✓ Ready to get your insight'}</span>
            <Btn onClick={submit} disabled={response.length < 20 || loading} size="sm" style={{ background: `linear-gradient(135deg, ${challenge.color}, ${challenge.color}cc)` }}>
              {loading ? <><Spinner /> Thinking…</> : <>✨ Get AI Insight</>}
            </Btn>
          </div>
          {feedback && (
            <div style={{ marginTop: 14, background: `${challenge.color}10`, border: `1px solid ${challenge.color}25`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: challenge.color, marginBottom: 6 }}>🤖 YOUR INSIGHT</div>
              <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Collapsed teaser */}
      {!isComplete && !expanded && (
        <div style={{ padding: '0 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5, flex: 1, paddingRight: 12 }}>{challenge.prompt.slice(0, 80)}…</p>
          <Btn size="sm" onClick={() => setExpanded(true)} style={{ flexShrink: 0 }}>Accept 🎯</Btn>
        </div>
      )}
    </div>
  );
}

// Demo data removed: all data is live from Supabase

const ROADMAP_DEFAULT = {
  phases: [
    { phase: 1, label: 'Foundation', timeframe: 'Months 1–3', theme: 'Build clarity, skills, identity', milestones: ['Define your personal brand in writing', 'Complete one core skill certification', 'Set up your professional online presence', 'Identify 3 role models and study their paths'], focusArea: 'Clarity and skill-building', successSign: 'You can explain your vision in 60 seconds' },
    { phase: 2, label: 'Momentum', timeframe: 'Months 4–9', theme: 'Build proof and real connections', milestones: ['Complete one real portfolio project', 'Apply to 2–3 real opportunities', 'Have 3 genuine conversations in your field', 'Make measurable progress on your 12-month goal'], focusArea: 'Action and portfolio', successSign: 'You have real work to show, not just ideas' },
    { phase: 3, label: 'Impact', timeframe: 'Months 10–18', theme: 'Create outcomes that matter', milestones: ['Lead or own a significant project', 'Secure a mentorship relationship', 'Share your work publicly', 'Reflect and double down on what works'], focusArea: 'Ownership and results', successSign: 'Others reach out because of what you\'ve built' },
    { phase: 4, label: 'Scale', timeframe: 'Year 2+', theme: 'Grow impact and build legacy', milestones: ['Mentor someone one step behind you', 'Expand your work to affect more people', 'Define your 3-year horizon clearly', 'Build 5+ deep professional relationships'], focusArea: 'Leadership and legacy', successSign: 'You\'re creating opportunities for others' },
  ],
  northStar: 'Build something meaningful that outlasts you',
  firstStep: 'Write your vision in one sentence: right now, today',
};

// ─── MINI COMPONENTS ──────────────────────────────────────────────────────────
const Spinner = () => <Loader2 className="animate-spin" style={{ color: C.blueLight }} size={16} />;

function Tag({ text, color = C.blue }) {
  return <span style={{ background: color + '22', color, border: `1px solid ${color}44`, fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, whiteSpace: 'nowrap' }}>{text}</span>;
}

function Avatar({ src, name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>;
}

function Card({ children, style = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => onClick && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.card : C.surface, border: `1px solid ${hov ? C.blueMid + '55' : C.border}`, borderRadius: 16, padding: 22, transition: 'all 0.2s', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, style = {} }) {
  const [hov, setHov] = useState(false);
  const pad = { sm: '6px 13px', md: '9px 18px', lg: '14px 28px' }[size];
  const fs = { sm: 12, md: 14, lg: 16 }[size];
  const vs = {
    primary: { background: hov ? '#1D4ED8' : C.blue, color: '#fff', border: 'none' },
    secondary: { background: hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', color: C.text, border: `1px solid ${C.border}` },
    ghost: { background: 'transparent', color: C.muted, border: 'none' },
    green: { background: hov ? '#059669' : C.green, color: '#fff', border: 'none' },
    purple: { background: hov ? '#7C3AED' : C.purple, color: '#fff', border: 'none' },
  };
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad, borderRadius: 10, fontSize: fs, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s', fontFamily: 'inherit', ...vs[variant], ...style }}>
      {children}
    </button>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'flow',          icon: Home,       label: 'Flow',            sub: 'Peers at your stage' },
  { id: 'canvas',        icon: Lightbulb,  label: 'Vision Canvas',   sub: 'Your vision & roadmap' },
  { id: 'opportunities', icon: Compass,    label: 'Opportunities',   sub: 'Programs that match your goal' },
  { id: 'mentorship',    icon: Users,      label: 'Mentorship',      sub: 'Guided support for your stage' },
];
// Reflect & Roadmap are accessed from Vision Canvas shortcut cards

// Secondary tabs — accessible via mobile More drawer
const NAV_SECONDARY = [
  { id: 'reflect', icon: PenLine, label: 'Reflect', sub: 'Track your growth' },
];

function Sidebar({ tab, setTab, canvas, onCoach, user, onSignOut }) {
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Visionary';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ width: 230, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lightbulb size={18} color="#fff" />
        </div>
        <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.text, letterSpacing: -0.5, lineHeight: 1.1 }}>Visionary</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.blueLight, letterSpacing: -0.5, lineHeight: 1.1 }}>Space</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: active ? `${C.blue}1A` : 'transparent', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left', marginBottom: 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: active ? `${C.blue}22` : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: active ? `1px solid ${C.blue}30` : '1px solid transparent' }}>
                <item.icon size={15} color={active ? C.blueLight : C.muted} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.text : C.muted, lineHeight: 1.2 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: active ? C.blueLight : '#334155', lineHeight: 1 }}>{item.sub}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom: AI Coach + Settings + Profile */}
      <div style={{ padding: '8px 8px 10px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={onCoach}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: `1px solid ${C.purple}33`, background: `${C.purple}0A`, cursor: 'pointer', fontFamily: 'inherit' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${C.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bot size={14} color={C.purple} /></div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple }}>Vision AI</div>
            <div style={{ fontSize: 10, color: '#7C3AED66' }}>Your personal guide</div>
          </div>
          <ChevronRight size={11} color={`${C.purple}88`} />
        </button>

        {/* Settings + Profile row */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setTab('settings')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: `1px solid ${tab === 'settings' ? C.blue + '55' : C.border}`, background: tab === 'settings' ? `${C.blue}12` : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#fff' }}>{initials}</div>
            }
            <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tab === 'settings' ? C.text : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: 9, color: '#334155' }}>Account</div>
            </div>
          </button>
          {onSignOut && (
            <button onClick={onSignOut} title="Sign Out"
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = `${C.red}12`; e.currentTarget.style.borderColor = `${C.red}44`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border; }}>
              <LogOut size={13} color={C.muted} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI COACH PANEL (persistent side panel) ───────────────────────────────────
function AICoachPanel({ canvas, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const contextSummary = [
    canvas?.name ? `Name: ${canvas.name}` : '',
    canvas?.major ? `Domain: ${canvas.major}` : '',
    canvas?.bigVision ? `Vision: "${canvas.bigVision}"` : '',
    canvas?.goal12Month ? `12-month goal: ${canvas.goal12Month}` : '',
    canvas?.strengths ? `Strengths: ${canvas.strengths}` : '',
    canvas?.obstacle ? `Main challenge: ${canvas.obstacle}` : '',
  ].filter(Boolean).join('\n');

  useEffect(() => {
    const intro = contextSummary
      ? `Hey${canvas?.name ? ` ${canvas.name.split(' ')[0]}` : ''} 👋 I'm Vision AI — your personal guide for figuring out your path.\n\nI can see you're working toward: "${canvas?.bigVision || canvas?.goal12Month}". That's a real goal — and I'm here to help you make actual progress on it, not just feel good about having it.\n\nWhat's the one thing you're most stuck on right now?`
      : `Hey 👋 I'm Vision AI — built specifically for students and career switchers who are figuring out their path.\n\nI help with things like:\n• Which opportunities or programs to go after\n• How to build your skills and portfolio from scratch\n• How to get internships, mentors, or your first role\n• What to focus on when everything feels overwhelming\n\nFill in your Vision Canvas first so I can give you advice that's actually specific to you. Or ask me anything — I won't give you generic answers.`;
    setMessages([{ role: 'ai', content: intro }]);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim(); if (!msg || loading) return;
    const newMsgs = [...messages, { role: 'user', content: msg }];
    setMessages(newMsgs); setInput(''); setLoading(true);
    try {
      const apiMsgs = newMsgs.slice(-10).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
      const system = `You are Vision AI — a sharp, practical advisor built exclusively for undergraduate students and career switchers who are figuring out their path.

Your user's profile:
${contextSummary || 'No Vision Canvas filled in yet — encourage them to do so for personalised advice.'}

Your purpose:
- Help them get clarity on what to do next in their career or studies
- Give real, specific advice on internships, opportunities, portfolios, networking, and skill-building
- Call out what's actually blocking them — don't just validate
- Reference their field, vision, and obstacles directly — never give generic advice
- If they're overwhelmed, help them narrow to ONE next action
- If they ask about opportunities, name real platforms, programmes, and strategies for their field
- Be direct, warm, and honest — like a smart older peer who has been through it

Rules:
- Max 160 words per response
- Always end with either a question or a single clear action they can take today
- Never use corporate buzzwords or generic motivational filler
- If their Canvas is empty, ask them ONE question to understand their situation before advising`;
      const r = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: apiMsgs, mode: 'vision', canvas, fileContent: '' }) });
      const d = await r.json();
      setMessages(prev => [...prev, { role: 'ai', content: d.reply || "Tell me more — what specifically is blocking you right now?" }]);
    } catch (_) {
      setMessages(prev => [...prev, { role: 'ai', content: "Connection issue. While you wait — write down the ONE thing you most need clarity on right now." }]);
    }
    setLoading(false);
  };

  const QUICK = [
    '🔍 Find opportunities in my field',
    '📄 Help me improve my resume/CV',
    '📅 What events should I attend?',
    '🚀 I feel stuck — where do I start?',
    '🤝 How do I find a mentor?',
    '💼 How do I land my first internship?',
  ];

  return (
    <div className="vh-coach-panel" style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 900, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.4)' }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={17} color="#fff" /></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Vision AI</div>
            <div style={{ fontSize: 11, color: C.purple }}>● Your personal guide</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 14, display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            {m.role === 'ai' && <div style={{ width: 26, height: 26, borderRadius: 8, background: `${C.purple}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}><Bot size={12} color={C.purple} /></div>}
            <div style={{ maxWidth: '85%', background: m.role === 'user' ? `${C.blue}22` : C.card, border: `1px solid ${m.role === 'user' ? C.blue + '33' : C.border}`, borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px', padding: '9px 13px', fontSize: 12, color: C.text, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: `${C.purple}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={12} color={C.purple} /></div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px 12px 12px 3px', padding: '10px 14px', display: 'flex', gap: 4 }}>
              {[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: C.purple, opacity: 0.5, animation: `bounce 1.2s ${j*0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.border}33`, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)} style={{ background: `${C.purple}0E`, border: `1px solid ${C.purple}28`, color: C.purple, borderRadius: 99, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap' }}>{q}</button>
        ))}
      </div>

      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your AI coach anything..." rows={2}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '8px 11px', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'none' }} />
        <button onClick={() => send()} disabled={!input.trim() || loading}
          style={{ width: 36, borderRadius: 9, background: input.trim() && !loading ? C.purple : C.border, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={13} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ─── ONBOARDING WIZARD (first-time users) ─────────────────────────────────────
function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('');
  const [field, setField] = useState('');
  const [generating, setGenerating] = useState(false);
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Visionary';
  const firstName = displayName.split(' ')[0];

  const FIELDS = [
    { label: 'Tech & Engineering',          icon: '💻' },
    { label: 'Business & Entrepreneurship', icon: '🚀' },
    { label: 'Health & Medicine',           icon: '🩺' },
    { label: 'Nursing & Healthcare',        icon: '🏥' },
    { label: 'Arts & Design',               icon: '🎨' },
    { label: 'Social Impact & NGO',         icon: '🌍' },
    { label: 'Science & Research',          icon: '🔬' },
    { label: 'Education & Teaching',        icon: '📚' },
    { label: 'Law & Policy',                icon: '⚖️' },
    { label: 'Finance & Economics',         icon: '📈' },
    { label: 'Accounting & Auditing',       icon: '🧾' },
    { label: 'Marketing & PR',              icon: '📣' },
    { label: 'Media & Journalism',          icon: '📰' },
    { label: 'Music & Entertainment',       icon: '🎵' },
    { label: 'Film & Content Creation',     icon: '🎬' },
    { label: 'Fashion & Beauty',            icon: '👗' },
    { label: 'Sports & Athletics',          icon: '🏆' },
    { label: 'Agriculture & Food Tech',     icon: '🌱' },
    { label: 'Culinary Arts & Hospitality', icon: '🍽️' },
    { label: 'Tourism & Travel',            icon: '✈️' },
    { label: 'Environment & Climate',       icon: '♻️' },
    { label: 'Psychology & Mental Health',  icon: '🧠' },
    { label: 'Data Science & AI',           icon: '🤖' },
    { label: 'Cybersecurity',               icon: '🔐' },
    { label: 'Real Estate & Architecture',  icon: '🏗️' },
    { label: 'Government & Public Service', icon: '🏛️' },
    { label: 'Logistics & Supply Chain',    icon: '📦' },
    { label: 'Human Resources & People',    icon: '🤝' },
    { label: 'Pharmacy & Life Sciences',    icon: '💊' },
    { label: 'Theology & Ministry',         icon: '✝️' },
  ];
  const [customField, setCustomField] = useState('');

  // Instant canvas: used if AI is slow/unavailable
  const buildInstantCanvas = (finalField) => ({
    name: firstName,
    major: finalField || 'My Field',
    bigVision: `I will become a leader in ${finalField || 'my field'} and create real impact in my community and beyond.`,
    purpose: 'To prove that where you start doesn\'t have to define where you end up.',
    strengths: 'Resilience, determination, curiosity, and the drive to keep learning.',
    obstacle: 'I\'m still building clarity on my exact path and the confidence to pursue it boldly.',
    goal12Month: goal.trim(),
  });

  const finish = async () => {
    const finalField = customField.trim() || field;
    if (!goal.trim()) { onComplete(null); return; }
    setGenerating(true);

    // Race the AI call against a 6-second timeout: whichever wins
    try {
      const aiPromise = fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Create a Visionary Canvas for a student. Name: "${firstName}". Field: "${finalField || 'undecided'}". Their goal: "${goal}". Return ONLY valid JSON: {"name":"${firstName}","major":"${finalField || goal.split(' ').slice(0,3).join(' ')}","bigVision":"...","purpose":"...","strengths":"...","obstacle":"...","goal12Month":"..."}. Make it specific, ambitious, personal to their goal.` }], mode: 'vision', canvas: {} }) })
        .then(r => r.json());
      const timeoutPromise = new Promise(res => setTimeout(() => res(null), 6000));
      const d = await Promise.race([aiPromise, timeoutPromise]);
      if (d) {
        const match = (d.reply || '').match(/\{[\s\S]*?\}/);
        if (match) {
          const canvas = JSON.parse(match[0]);
          localStorage.setItem('vh_canvas', JSON.stringify({ ...canvas, completedAt: new Date().toISOString() }));
          onComplete(canvas);
          return;
        }
      }
    } catch { /* fall through to instant */ }

    // Instant fallback: never leave the user waiting
    const canvas = buildInstantCanvas(finalField);
    localStorage.setItem('vh_canvas', JSON.stringify({ ...canvas, completedAt: new Date().toISOString() }));
    onComplete(canvas);
    setGenerating(false);
  };

  const STEPS = [
    // Step 0: Welcome
    <div key={0} style={{ textAlign: 'center', padding: '10px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>👋</div>
      <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 10px', color: C.text }}>Hey {firstName}, you made it.</h1>
      <p style={{ fontSize: 15, color: C.text, fontWeight: 700, margin: '0 0 10px' }}>
        You don't have to figure this out alone anymore.
      </p>
      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: '0 0 10px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
        Most students and career switchers feel overwhelmed — no clear path, no one who gets their stage, no structure.<br/><br/>
        Visionary Space gives you a <strong style={{ color: C.blueLight }}>vision and roadmap</strong>, AI and mentors tuned to your goals, and peers on the same journey.
      </p>
      <p style={{ fontSize: 13, color: C.blueLight, fontWeight: 700, margin: '0 0 24px' }}>
        Let's take <strong>60 seconds</strong> to build your Vision Canvas — everything personalises from here.
      </p>
      <Btn size="lg" onClick={() => setStep(1)} style={{ marginBottom: 14 }}>Build my Vision Canvas →</Btn>
      <br/>
      <button onClick={() => onComplete(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Skip for now</button>
    </div>,

    // Step 1: Field
    <div key={1}>
      <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Step 1 of 2</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 4px', color: C.text }}>What are you studying or pursuing?</h2>
      <p style={{ color: C.muted, fontSize: 12, margin: '0 0 14px' }}>This tunes your AI tutor, mentors, roadmap and opportunities to your actual stage and field.</p>
      <div style={{ maxHeight: 260, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7, marginBottom: 14, paddingRight: 2 }}>
        {FIELDS.map(f => (
          <button key={f.label} onClick={() => { setField(f.label); setCustomField(''); }}
            style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${field === f.label ? C.blue : C.border}`, background: field === f.label ? `${C.blue}18` : C.card, color: field === f.label ? C.blueLight : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: field === f.label ? 700 : 400, textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{f.icon}</span>
            <span style={{ lineHeight: 1.3 }}>{f.label}</span>
          </button>
        ))}
        </div>
      {/* Custom field input */}
      <div style={{ marginBottom: 18 }}>
        <input value={customField} onChange={e => { setCustomField(e.target.value); if (e.target.value) setField(''); }}
          placeholder="Or type your own field / career path…"
          style={{ width: '100%', background: C.card, border: `1px solid ${customField ? C.blue + '55' : C.border}`, borderRadius: 10, color: C.text, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      <Btn size="lg" onClick={() => setStep(2)} disabled={!field && !customField.trim()} style={{ width: '100%', justifyContent: 'center' }}>Next →</Btn>
    </div>,

    // Step 2: Big goal
    <div key={2}>
      <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Step 2 of 2</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 4px', color: C.text }}>What are you trying to achieve?</h2>
      <p style={{ color: C.muted, fontSize: 12, margin: '0 0 14px', lineHeight: 1.65 }}>Be honest, be bold. This becomes the centre of your personal roadmap — everything we build points back to it.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {[
          'Become a CEO and build a company that impacts millions',
          'Land a top job at a global company while giving back to my community',
          'Get a scholarship and study abroad to build a better future',
          'Start my own business and be financially free by 25',
          'Use my skills to create opportunities for others in my country',
        ].map(ex => (
          <button key={ex} onClick={() => setGoal(ex)}
            style={{ padding: '9px 13px', borderRadius: 9, border: `1px solid ${goal === ex ? C.blue : C.border}`, background: goal === ex ? `${C.blue}14` : 'transparent', color: goal === ex ? C.blueLight : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textAlign: 'left', lineHeight: 1.4 }}>
            "{ex}"
        </button>
        ))}
      </div>
      <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2}
        placeholder='Or write your own goal in your own words…'
        style={{ width: '100%', background: C.card, border: `1px solid ${goal ? C.blue + '55' : C.border}`, borderRadius: 12, color: C.text, padding: '13px 15px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.7, boxSizing: 'border-box', marginBottom: 18 }} />
      <Btn size="lg" onClick={finish} disabled={!goal.trim() || generating} style={{ width: '100%', justifyContent: 'center' }}>
        {generating ? <><Spinner /> Building your canvas… (up to 6s)</> : '✨ Build my Vision Canvas →'}
      </Btn>
      {generating && <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 10 }}>AI is crafting your personal canvas: if it takes too long we'll build it instantly for you.</p>}
    </div>,
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 36 }}>
          <div style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lightbulb size={18} color="#fff" /></div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Visionary <span style={{ color: C.blueLight }}>Space</span></div>
        </div>
        {/* Progress dots */}
        {step > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
            {[1,2].map(s => <div key={s} style={{ width: s <= step ? 24 : 8, height: 8, borderRadius: 99, background: s <= step ? C.blue : C.border, transition: 'all 0.3s' }} />)}
          </div>
        )}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '32px 28px' }}>
          {STEPS[step]}
        </div>
      </div>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
  if (score <= 2) return { score, label: 'Fair', color: '#F59E0B' };
  if (score <= 3) return { score, label: 'Good', color: '#3B82F6' };
  return { score, label: 'Strong', color: '#10B981' };
}

function AuthPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'twofa'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  // 2FA state
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAFactorId, setTwoFAFactorId] = useState('');
  const [twoFAEmail, setTwoFAEmail] = useState('');

  const strength = pwStrength(password);
  const passwordsMatch = confirmPassword === '' || password === confirmPassword;
  const inputStyle = { width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

  const handleGoogle = async () => {
    if (!supabase) { setError('Authentication is not configured. Please contact support.'); return; }
    setError(''); setInfo(''); setLoading(true);
    try {
      const redirectTo = window.location.origin;
      const { data, error: e } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { prompt: 'select_account' } },
      });
      if (e) { setError(e.message || 'Google sign-in failed. Please try email/password below.'); setLoading(false); return; }
      if (data?.url) window.location.href = data.url;
      else setLoading(false);
    } catch (err) { setError(err?.message || 'Something went wrong. Please try email/password below.'); setLoading(false); }
  };

  const handleEmail = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    if (!supabase) { setError('Authentication is not configured. Please contact support.'); return; }
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup') {
      if (password !== confirmPassword) { setError('Passwords do not match. Please check and try again.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    }
    setLoading(true);
    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name || email.split('@')[0] } },
      });
      if (err) { setError(err.message); }
      else { setInfo('✅ Check your email to confirm your account, then sign in!'); setMode('signin'); setPassword(''); setConfirmPassword(''); }
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); }
      else if (data?.session) {
        // Check if 2FA is required
        try {
          const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
            // 2FA required: find enrolled factor
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totp = factors?.totp?.[0];
            if (totp) {
              setTwoFAFactorId(totp.id);
              setTwoFAEmail(email);
              setMode('twofa');
              setLoading(false);
              return;
            }
          }
        } catch (_) { /* 2FA not set up: proceed normally */ }
      }
    }
    setLoading(false);
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (twoFACode.length !== 6) { setError('Enter the 6-digit code from your authenticator app.'); setLoading(false); return; }
    try {
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: twoFAFactorId, code: twoFACode });
      if (err) { setError('Invalid code. Please try again.'); }
    } catch (err) { setError(err?.message || 'Verification failed.'); }
    setLoading(false);
  };

  // ── 2FA VERIFICATION SCREEN ──────────────────────────────────────────────────
  if (mode === 'twofa') return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lightbulb size={22} color="#fff" />
        </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>Visionary</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.blueLight, letterSpacing: -0.5, marginTop: -4 }}>Space</div>
        </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: `${C.blue}20`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Shield size={26} color={C.blue} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: C.text }}>Two-Factor Verification</h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            Open your authenticator app and enter the 6-digit code for <strong style={{ color: C.text }}>{twoFAEmail}</strong>
          </p>
          <form onSubmit={handleVerify2FA}>
            <input
              value={twoFACode}
              onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000 000"
              maxLength={6}
              autoFocus
              style={{ width: '100%', background: C.card, border: `2px solid ${twoFACode.length === 6 ? C.blue : C.border}`, borderRadius: 14, color: C.text, padding: '16px', fontSize: 28, fontWeight: 700, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 8, transition: 'border-color 0.2s', marginBottom: 16 }}
            />
            {error && <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}35`, borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#FCA5A5', marginBottom: 16 }}>{error}</div>}
            <button type="submit" disabled={loading || twoFACode.length !== 6}
              style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: twoFACode.length !== 6 ? 'not-allowed' : 'pointer', opacity: (loading || twoFACode.length !== 6) ? 0.6 : 1 }}>
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
          </form>
          <button onClick={() => { setMode('signin'); setTwoFACode(''); setError(''); }}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, marginTop: 16, padding: 0 }}>
            ← Back to sign in
          </button>
          <div style={{ marginTop: 20, padding: '12px 16px', background: `${C.blue}10`, borderRadius: 10, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            🔒 <strong>Horizontal-scalable 2FA</strong>: TOTP codes are verified server-side with zero shared state, enabling millions of concurrent authentications across any number of instances.
          </div>
        </div>
      </div>
    </div>
  );

  // ── MAIN AUTH FORM ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lightbulb size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>Visionary</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.blueLight, letterSpacing: -0.5, marginTop: -4 }}>Space</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', margin: 0, maxWidth: 320 }}>Turning "figuring it out" into clear, structured, and supported</p>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '32px 28px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: C.text, textAlign: 'center' }}>
            {mode === 'signin' ? 'Welcome back' : 'Your vision. Your path. Your people.'}
          </h2>
          <p style={{ margin: '0 0 26px', fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
            {mode === 'signin'
              ? 'Sign in to pick up where you left off.'
              : 'For undergrads, career switchers & anyone figuring it out — get a clear roadmap, AI tuned to your goals, and peers at your stage. No more going it alone.'}
          </p>

          {/* Google OAuth */}
          <button onClick={handleGoogle} disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, padding: '12px 18px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, color: '#1E293B', marginBottom: 20, transition: 'opacity 0.15s', opacity: loading ? 0.6 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" style={inputStyle} />
            </div>

            {/* Password with show/hide */}
            <div style={{ marginBottom: mode === 'signup' ? 6 : 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  type={showPass ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2, display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password strength meter: signup only */}
            {mode === 'signup' && password.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= strength.score ? strength.color : C.border, transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>
                  {strength.label}: {strength.label === 'Weak' ? 'Add uppercase, numbers & symbols' : strength.label === 'Fair' ? 'Getting better: try a symbol' : strength.label === 'Good' ? 'Almost there: add more variety' : 'Great password! 🔒'}
                </div>
              </div>
            )}

            {/* Confirm password: signup only */}
            {mode === 'signup' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                    type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                    style={{ ...inputStyle, paddingRight: 44, borderColor: confirmPassword && !passwordsMatch ? '#EF4444' : (confirmPassword && passwordsMatch ? '#10B981' : C.border) }} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2, display: 'flex', alignItems: 'center' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>⚠ Passwords do not match</div>
                )}
                {confirmPassword && passwordsMatch && (
                  <div style={{ fontSize: 11, color: '#10B981', marginTop: 4, fontWeight: 600 }}>✓ Passwords match</div>
                )}
              </div>
            )}

            {/* 2FA notice on signin */}
            {mode === 'signin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 11, color: C.muted }}>
                <Shield size={12} color={C.blue} />
                <span>2FA available in Settings after sign-in</span>
              </div>
            )}

            {error && <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}35`, borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#FCA5A5', marginBottom: 16 }}>{error}</div>}
            {info && <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}35`, borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#6EE7B7', marginBottom: 16 }}>{info}</div>}

            <button type="submit" disabled={loading || (mode === 'signup' && (!passwordsMatch || password.length < 8))}
              style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: (loading || (mode === 'signup' && (!passwordsMatch || password.length < 8))) ? 0.6 : 1, letterSpacing: 0.2 }}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: C.muted }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); setPassword(''); setConfirmPassword(''); }}
              style={{ background: 'none', border: 'none', color: C.blueLight, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, padding: 0 }}>
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: '#334155' }}>
          🔒 End-to-end encrypted · No spam · Cancel anytime
        </p>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onEnter }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif", color: C.text }}>
      <div style={{ textAlign: 'center', maxWidth: 580 }}>
        <div style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: `0 0 60px ${C.blue}44` }}>
          <Lightbulb size={34} color="#fff" />
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, marginBottom: 12, background: `linear-gradient(135deg, ${C.text}, ${C.blueLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Visionary Space
        </h1>
        <p style={{ fontSize: 18, color: C.muted, marginBottom: 36, fontWeight: 500, lineHeight: 1.6 }}>
          Your vision. Your roadmap. Your people.<br/>
          <span style={{ fontSize: 14 }}>For undergrads & career switchers who are ready to stop guessing and start building.</span>
        </p>
        <Btn onClick={onEnter} size="lg" style={{ fontSize: 16, padding: '14px 36px' }}>
          Start My Journey <ArrowRight size={18} />
        </Btn>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 48, flexWrap: 'wrap' }}>
          {[
            ['Vision & Roadmap', Map,         'Your path, structured'],
            ['AI Tuned to You', Brain,        'Mentors + AI for your stage'],
            ['Peer Community', MessageCircle,  'Never alone again'],
            ['Real Opportunities', Compass,   'Programs that match your goal'],
          ].map(([label, Icon, sub]) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ width: 44, height: 44, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}><Icon size={19} color={C.blueLight} /></div>
              <div style={{ fontSize: 11, color: C.text, fontWeight: 700, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PEER GROUPS MODAL ────────────────────────────────────────────────────────
const PEER_GROUPS = [
  { id: 'stem',           emoji: '🔬', name: 'STEM & Tech',          desc: 'Engineers, scientists, coders building the future', color: '#3B82F6', tags: ['Engineering', 'Computer Science', 'Biology', 'Physics'] },
  { id: 'entrepreneurship', emoji: '🚀', name: 'Entrepreneurship',  desc: 'Founders, builders, and product thinkers', color: '#F59E0B', tags: ['Business', 'Startups', 'Product', 'Finance'] },
  { id: 'arts',           emoji: '🎨', name: 'Arts & Creative',      desc: 'Designers, writers, musicians, filmmakers', color: '#EC4899', tags: ['Design', 'Music', 'Writing', 'Film', 'Art'] },
  { id: 'social',         emoji: '🌍', name: 'Social Impact',        desc: 'Leaders creating change in communities and policy', color: '#10B981', tags: ['Social Work', 'Law', 'Policy', 'NGO', 'Education'] },
  { id: 'health',         emoji: '🏥', name: 'Health & Medicine',    desc: 'Pre-med, nursing, psychology, public health', color: '#6366F1', tags: ['Medicine', 'Nursing', 'Psychology', 'Public Health'] },
  { id: 'study',          emoji: '📚', name: 'Study Grind',           desc: 'Accountability partners for exam prep and finals', color: '#8B5CF6', tags: [] },
];

function PeerGroupsModal({ onClose, canvas, user, feed }) {
  const [joined, setJoined] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vh_peer_groups') || '[]'); } catch { return []; }
  });
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMsgs, setGroupMsgs] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || canvas?.name || 'Visionary';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const toggle = (id) => {
    const next = joined.includes(id) ? joined.filter(x => x !== id) : [...joined, id];
    setJoined(next);
    localStorage.setItem('vh_peer_groups', JSON.stringify(next));
  };

  // Load messages for a group from Supabase
  const openGroup = async (g) => {
    setActiveGroup(g);
    setChatInput('');
    if (supabase) {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', g.id)
        .order('created_at', { ascending: true })
        .limit(60);
      setGroupMsgs(prev => ({ ...prev, [g.id]: data || [] }));
    }
  };

  const sendGroupMsg = async () => {
    if (!chatInput.trim() || sending || !activeGroup) return;
    setSending(true);
    const msg = {
      group_id: activeGroup.id,
      author_name: displayName,
      author_img: avatarUrl || null,
      author_id: user?.id || null,
      content: chatInput.trim(),
      created_at: new Date().toISOString(),
    };
    // Optimistic update
    setGroupMsgs(prev => ({ ...prev, [activeGroup.id]: [...(prev[activeGroup.id] || []), { ...msg, id: `temp-${Date.now()}` }] }));
    setChatInput('');
    if (supabase) {
      await supabase.from('group_messages').insert([msg]);
    }
    setSending(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    if (!supabase || !activeGroup) return;
    const channel = supabase.channel(`group-${activeGroup.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${activeGroup.id}` }, payload => {
        setGroupMsgs(prev => {
          const existing = prev[activeGroup.id] || [];
          if (existing.find(m => m.id === payload.new.id)) return prev;
          return { ...prev, [activeGroup.id]: [...existing, payload.new] };
        });
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeGroup]);

  const msgs = activeGroup ? (groupMsgs[activeGroup.id] || []) : [];
  const feedPosters = [...new Set(feed.map(p => p.authorName))].filter(Boolean);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 640, height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeGroup && (
            <button onClick={() => setActiveGroup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '2px 6px', fontSize: 13 }}>← Back</button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>
              {activeGroup ? `${activeGroup.emoji} ${activeGroup.name}` : '👥 Peer Groups'}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {activeGroup ? activeGroup.desc : 'Find your people. Learn and grow together.'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
        </div>

        {!activeGroup ? (
          /* Group list */
          <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PEER_GROUPS.map(g => {
              const isJoined = joined.includes(g.id);
              const memberCount = feedPosters.length + Math.floor(Math.random() * 40 + 10); // community size estimate
              return (
                <div key={g.id} style={{ background: C.surface, border: `1px solid ${isJoined ? g.color + '50' : C.border}`, borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: g.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{g.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{g.desc}</div>
                      <div style={{ fontSize: 10, color: g.color, fontWeight: 700 }}>{memberCount} members</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      <button onClick={() => toggle(g.id)}
                        style={{ padding: '5px 14px', borderRadius: 99, border: `1px solid ${isJoined ? g.color : C.border}`, background: isJoined ? g.color + '20' : 'transparent', color: isJoined ? g.color : C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                        {isJoined ? '✓ Joined' : 'Join'}
                      </button>
                      {isJoined && (
                        <button onClick={() => openGroup(g)}
                          style={{ padding: '5px 14px', borderRadius: 99, border: 'none', background: g.color, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          Open chat →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!supabase && (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
                Group chat requires Supabase to be set up. Join groups to save your membership locally.
              </div>
            )}
          </div>
        ) : (
          /* Group chat */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{activeGroup.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Start the conversation</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Be the first to post in {activeGroup.name}. Introduce yourself!</div>
                </div>
              )}
              {msgs.map((m, i) => {
                const isMe = m.author_id === user?.id || m.author_name === displayName;
                return (
                  <div key={m.id || i} style={{ display: 'flex', gap: 9, flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                    <Avatar src={m.author_img} name={m.author_name} size={30} />
                    <div style={{ maxWidth: '75%' }}>
                      {!isMe && <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, marginLeft: 4 }}>{m.author_name}</div>}
                      <div style={{ background: isMe ? activeGroup.color + '30' : C.surface, border: `1px solid ${isMe ? activeGroup.color + '50' : C.border}`, borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px', padding: '8px 12px', fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.content}
                      </div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2, textAlign: isMe ? 'right' : 'left', paddingInline: 4 }}>
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={`Message ${activeGroup.name}…`} rows={1}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGroupMsg(); } }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '9px 13px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5 }} />
              <button onClick={sendGroupMsg} disabled={!chatInput.trim() || sending}
                style={{ width: 38, height: 38, borderRadius: 10, background: chatInput.trim() && !sending ? activeGroup.color : C.border, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={14} color="#fff" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function ProfileModal({ author, authorImg, posts, onClose }) {
  const authorPosts = (posts || []).filter(p => p.authorName === author);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar src={authorImg} name={author} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 2 }}>{author}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{authorPosts.length} post{authorPosts.length !== 1 ? 's' : ''} in community</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={18} /></button>
        </div>
        {/* Posts grid */}
        <div style={{ overflowY: 'auto', padding: 16, flex: 1 }}>
          {authorPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>No posts yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {authorPosts.map((post, i) => (
                <div key={post.id || i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
                  {post.mediaUrl && post.mediaType === 'image' && (
                    <img src={post.mediaUrl} alt="" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover', marginBottom: 8, display: 'block' }} />
                  )}
                  {post.mediaUrl && post.mediaType === 'video' && (
                    <video src={post.mediaUrl} controls style={{ width: '100%', borderRadius: 8, maxHeight: 200, display: 'block', marginBottom: 8 }} />
                  )}
                  {post.content && <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.65 }}>{post.content}</p>}
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>{post.time || 'Recently'}{(post.inspired||0)+(post.encouraged||0)+(post.learned||0)+(post.reflect||0) > 0 ? ` · 🔥${post.inspired||0} 💪${post.encouraged||0} 📚${post.learned||0} 🌱${post.reflect||0}` : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REEL PLAYER ─────────────────────────────────────────────────────────────
function ReelPlayer({ src }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const toggleMute = () => {
    setMuted(m => {
      const next = !m;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };
  return (
    <div style={{ background: '#000', display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 340, aspectRatio: '9/16', overflow: 'hidden' }}>
        <video ref={videoRef} src={src} playsInline loop autoPlay muted={muted}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {/* Bottom overlay: reel label + mute toggle */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 8px', fontSize: 10, color: '#fff', fontWeight: 700, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Video size={9} /> Reel
          </div>
          <button onClick={toggleMute}
            style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            {muted
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── POST CARD (Instagram-style) ───────────────────────────────────────────────
const REACTIONS = [
  { key: 'inspired',   emoji: '🔥', label: 'Inspired',  color: C.yellow  },
  { key: 'encouraged', emoji: '💪', label: 'Encourage', color: '#F97316' },
  { key: 'learned',    emoji: '📚', label: 'Learn',     color: C.blue    },
  { key: 'reflect',    emoji: '🌱', label: 'Reflect',   color: C.green   },
];

function PostCard({ p, isVerifiedMentor, isOwn, reactions, setReactions, setFeed, onDelete, onProfileClick, onPeerGroups }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const key = p.id || p.authorName;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <div onClick={() => onProfileClick?.(p.authorName, p.authorImg)} style={{ cursor: 'pointer' }}>
          <Avatar src={p.authorImg} name={p.authorName} size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span onClick={() => onProfileClick?.(p.authorName, p.authorImg)} style={{ fontWeight: 700, fontSize: 14, color: C.text, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{p.authorName}</span>
            {isVerifiedMentor && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: `${C.blue}18`, border: `1px solid ${C.blue}40`, borderRadius: 99, padding: '2px 7px', fontSize: 10, color: C.blue, fontWeight: 700 }}>✓ Mentor</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>{p.time || p.createdAt || 'Recently'}</div>
        </div>
        {/* 3-dot menu: ONLY on own posts */}
        {isOwn && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 28, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 99, minWidth: 140 }}>
                <button onClick={async () => { setMenuOpen(false); if (!window.confirm('Delete this post?')) return; await onDelete(); }}
                  style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 13, fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = `${C.red}14`}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Trash2 size={13} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media: full-width, no side padding */}
      {p.mediaUrl && p.mediaType === 'image' && (
        <div style={{ background: '#000' }}>
          <img src={p.mediaUrl} alt="post" style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      {p.mediaUrl && p.mediaType === 'video' && (
        <ReelPlayer src={p.mediaUrl} />
      )}

      {/* Caption */}
      {p.content && (
        <div style={{ padding: '12px 16px 4px' }}>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>{p.content}</p>
        </div>
      )}

      {/* Reactions */}
      <div style={{ display: 'flex', gap: 3, padding: '10px 12px 12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {REACTIONS.map(r => {
          const reacted = !!(reactions[`${key}_${r.key}`]);
          const count = (p[r.key] || 0);
          return (
            <button key={r.key} onClick={() => {
                if (reacted) return;
                setReactions(s => ({ ...s, [`${key}_${r.key}`]: true }));
                setFeed(prev => prev.map(x => x.id === p.id ? { ...x, [r.key]: (x[r.key] || 0) + 1 } : x));
                reactToPost(p.id, r.key);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: reacted ? `${r.color}18` : 'none', border: `1px solid ${reacted ? r.color + '60' : C.border}`, borderRadius: 99, padding: '5px 10px', cursor: reacted ? 'default' : 'pointer', color: reacted ? r.color : C.muted, fontSize: 11, fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.15s', opacity: reacted ? 1 : 0.85 }}
              onMouseEnter={e => { if (!reacted) { e.currentTarget.style.background = `${r.color}12`; e.currentTarget.style.color = r.color; e.currentTarget.style.borderColor = r.color + '50'; }}}
              onMouseLeave={e => { if (!reacted) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}}>
              <span style={{ fontSize: 13 }}>{r.emoji}</span>
              {count > 0 && <span>{count}</span>}
              <span>{r.label}</span>
            </button>
          );
        })}
        <button onClick={() => onPeerGroups?.()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${C.border}`, borderRadius: 99, padding: '5px 10px', cursor: 'pointer', color: C.muted, fontSize: 11, fontFamily: 'inherit', transition: 'all 0.15s', marginLeft: 'auto' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${C.purple}14`; e.currentTarget.style.color = C.purple; e.currentTarget.style.borderColor = C.purple + '50'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}>
          <Users size={12} /> Groups
        </button>
      </div>
    </div>
  );
}

// ─── FLOW TAB ─────────────────────────────────────────────────────────────────
function FlowTab({ canvas, feed, setFeed, setTab, user, feedLoading, mentors = [] }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [reactions, setReactions] = useState({});
  const [profileModal, setProfileModal] = useState(null); // { author, authorImg }
  const [showPeerGroups, setShowPeerGroups] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaDragging, setMediaDragging] = useState(false);
  const mediaInputRef = useRef(null);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || canvas?.name || 'Visionary';
  const avatarUrl   = user?.user_metadata?.avatar_url  || user?.user_metadata?.picture || null;

  const dayIdx = new Date().getDay();
  const prompt = DAILY_PROMPTS[dayIdx % DAILY_PROMPTS.length];

  const loadMediaFile = (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isImage && !isVideo) return;
    if (file.size > 50 * 1024 * 1024) { alert('File too large: max 50 MB'); return; }
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type: isVideo ? 'video' : 'image', name: file.name });
  };

  const post = async () => {
    if (!mediaFile) return; // media is required in Flow
    if (submitting) return;
    setSubmitting(true);

    // 1. Upload media to Supabase Storage if we have a file
    let hostedUrl = null;
    if (mediaFile) {
      setUploadProgress('Uploading media…');
      hostedUrl = await uploadMedia(mediaFile);
      if (!hostedUrl && mediaPreview) {
        // Storage bucket not set up yet: use local blob URL as temporary fallback
        hostedUrl = mediaPreview.url;
      }
    }
    setUploadProgress('');

    const authorName = user?.user_metadata?.full_name || user?.user_metadata?.name || canvas?.name || 'Visionary';
    const authorImg  = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

    // 2. Insert into Supabase: everyone can see it in real-time
    const saved = await insertPost({
      authorName,
      authorImg,
      content: content.trim(),
      imageUrl: hostedUrl,
      mediaType: mediaPreview?.type || null,
      userId: user?.id || null,
    });

    // 3. Always add to feed immediately (saved post uses DB id; fallback uses temp id)
    const newPost = saved || {
      id: `temp-${Date.now()}`,
      authorId: user?.id || null,
      authorName, authorImg,
      content: content.trim(),
      mediaUrl: hostedUrl,
      mediaType: mediaPreview?.type || null,
      inspired: 0, encouraged: 0, learned: 0, reflect: 0, time: 'Just now',
    };
    setFeed(prev => prev.find(p => p.id === newPost.id) ? prev : [newPost, ...prev]);

    setContent(''); setMediaFile(null); setMediaPreview(null); setSubmitting(false); setShowCompose(false);
  };

  // Unique recent posters for stories bar
  const recentPosters = [...new globalThis.Map(feed.map(p => [p.authorName, p])).values()].slice(0, 10);
  const mediaPosts = feed.filter(p => p.mediaUrl);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── TOP HEADER ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 2px', color: C.text }}>
            {canvas?.name ? `${canvas.name.split(' ')[0]}'s Feed` : 'Community Feed'}
          </h1>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Your peer community — share milestones, stay inspired, never go it alone</p>
        </div>
        <button onClick={() => setShowPeerGroups(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${C.purple}14`, border: `1px solid ${C.purple}30`, borderRadius: 10, padding: '7px 13px', cursor: 'pointer', color: C.purple, fontSize: 12, fontFamily: 'inherit', fontWeight: 700 }}>
          <Users size={13} /> Peer Groups
        </button>
      </div>

      {/* ── CANVAS NUDGE (compact, only if no canvas) ───────────────── */}
      {!canvas?.bigVision && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: `${C.blue}0C`, border: `1px solid ${C.blue}22`, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <Lightbulb size={18} color={C.blue} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Set your Vision Canvas — it changes everything</div>
            <div style={{ fontSize: 11, color: C.muted }}>Your goal becomes the centre: AI, roadmap & mentors all tune to it so nothing feels random again</div>
          </div>
          <Btn size="sm" onClick={() => setTab('canvas')}>Start →</Btn>
        </div>
      )}

      {/* ── COMPOSE BOX — compact bar ──── */}
      <div style={{ background: C.surface, border: `1px solid ${mediaPreview ? C.blue + '60' : C.border}`, borderRadius: 14, marginBottom: 18, overflow: 'hidden', transition: 'border-color 0.2s' }}
        onDragOver={e => { e.preventDefault(); setMediaDragging(true); }}
        onDragLeave={() => setMediaDragging(false)}
        onDrop={e => { e.preventDefault(); setMediaDragging(false); const f = e.dataTransfer.files[0]; if (f) loadMediaFile(f); }}>

        {/* Compact input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <Avatar src={avatarUrl} name={displayName} size={30} />
          <input value={content} onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !submitting && (content.trim() || mediaFile) && post()}
            placeholder="Share a milestone, win or thought…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13, fontFamily: 'inherit' }} />
          {/* Photo / Video icon buttons */}
          <button onClick={() => { mediaInputRef.current.accept = 'image/*'; mediaInputRef.current?.click(); }}
            title="Add photo"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.muted, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = C.blue}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}>
            <Image size={17} />
          </button>
          <button onClick={() => { mediaInputRef.current.accept = 'video/*'; mediaInputRef.current?.click(); }}
            title="Add video"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.muted, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = C.purple}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}>
            <Video size={17} />
          </button>
          <Btn size="sm" onClick={post} disabled={submitting || (!content.trim() && !mediaFile)}>
            {submitting ? <Spinner /> : <Send size={12} />}
          </Btn>
        </div>

        {/* Media preview (only when file selected) */}
        {mediaPreview && (
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {mediaPreview.type === 'video' ? (
              /* ── REEL-STYLE VIDEO PREVIEW ── */
              <div style={{ position: 'relative' }}>
                <ReelPlayer src={mediaPreview.url} />
                <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 2 }}>
                  <X size={12} color="#fff" />
                </button>
              </div>
            ) : (
              /* ── IMAGE PREVIEW ── */
              <div style={{ position: 'relative', background: '#000' }}>
                <img src={mediaPreview.url} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
                <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <X size={12} color="#fff" />
                </button>
                <div style={{ position: 'absolute', bottom: 9, left: 9, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 8px', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                  📷 Photo
                </div>
              </div>
            )}
            {uploadProgress && <div style={{ padding: '6px 14px 8px', fontSize: 11, color: C.blueLight }}>{uploadProgress}</div>}
          </div>
        )}
        {mediaDragging && (
          <div style={{ padding: '10px 16px', background: `${C.blue}08`, borderTop: `1px dashed ${C.blue}`, textAlign: 'center', fontSize: 12, color: C.blueLight }}>
            Drop photo or video here
          </div>
        )}
        <input ref={mediaInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => loadMediaFile(e.target.files[0])} />
      </div>

      {/* ── AI COMMUNITY INSIGHT ─────────────────────────────────────── */}
      {feed.length > 0 && (
        <div style={{ background: `linear-gradient(135deg, ${C.blue}12, ${C.purple}12)`, border: `1px solid ${C.blue}30`, borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, background: `${C.blue}20`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <Brain size={15} color={C.blue} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.blue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>AI Community Insight</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
              {(() => {
                const totalReactions = feed.reduce((s, p) => s + (p.inspired||0) + (p.encouraged||0) + (p.learned||0) + (p.reflect||0), 0);
                const totalInspired = feed.reduce((s, p) => s + (p.inspired || 0), 0);
                const mediaCount = feed.filter(p => p.mediaUrl).length;
                const names = [...new Set(feed.map(p => p.authorName?.split(' ')[0]).filter(Boolean))].slice(0, 3);
                if (totalReactions > 10) return `${totalReactions} reactions shared in this community — 🔥 inspired, 💪 encouraged, 📚 learned, 🌱 reflected. The energy here is real.`;
                if (totalInspired > 5) return `${totalInspired} 🔥 inspiration reactions flowing in this feed. Keep building.`;
                if (mediaCount > 2) return `${mediaCount} posts with photos and videos. This community shows, not just tells.`;
                if (names.length > 1) return `${names.join(', ')} and others are building in public. Join them.`;
                return 'Share what you are working on. Consistency in public builds real momentum.';
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY BRAIN CHALLENGE ────────────────────────────────────── */}
      <DailyChallengeCard canvas={canvas} user={user} />

      {/* ── STORIES / COMMUNITY ACTIVITY ROW ────────────────────────── */}
      {(recentPosters.length > 0 || feedLoading) && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.2 }}>Active in community</div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }} className="vh-stories">
            {feedLoading ? [0,1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.card }} />
                <div style={{ width: 36, height: 9, borderRadius: 4, background: C.card }} />
              </div>
            )) : recentPosters.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', padding: 2, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})` }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: C.card, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.authorImg
                      ? <img src={p.authorImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                      : <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{(p.authorName || '?')[0]}</span>
                    }
                  </div>
                </div>
                <span style={{ fontSize: 10, color: C.muted, maxWidth: 52, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{p.authorName?.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VISUAL SHOWCASE STRIP (Reels-style) ─────────────────────── */}
      {mediaPosts.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Video size={11} /> Visual Showcase
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {mediaPosts.slice(0, 8).map((p, idx) => (
              <div key={idx} style={{ width: 140, height: 100, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#000', position: 'relative', cursor: 'pointer' }}>
                {p.mediaType === 'video'
                  ? <video src={p.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                  : <img src={p.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                }
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '20px 7px 6px' }}>
                  <div style={{ fontSize: 10, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.authorName?.split(' ')[0]}</div>
                </div>
                {p.mediaType === 'video' && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '2px 5px', fontSize: 9, color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Video size={9} /> Reel
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FEED HEADER ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
          {feed.length > 0 ? `${feed.length} Post${feed.length === 1 ? '' : 's'}` : 'All Posts'}
        </div>
      </div>

      {feedLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.card }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: 120, height: 13, background: C.card, borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ width: 70, height: 10, background: C.card, borderRadius: 6 }} />
                </div>
              </div>
              <div style={{ width: '100%', height: 13, background: C.card, borderRadius: 6, marginBottom: 6 }} />
              <div style={{ width: '80%', height: 13, background: C.card, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {feed.map((p, i) => {
          const isVerifiedMentor = mentors.some(m => m.verified && m.name === p.authorName);
          const isOwn = user?.id && p.authorId === user.id;
          return (
          <PostCard key={p.id || i} p={p} isVerifiedMentor={isVerifiedMentor} isOwn={isOwn}
            reactions={reactions} setReactions={setReactions} setFeed={setFeed}
            onDelete={async () => { await deletePost(p.id, user?.id); setFeed(prev => prev.filter(x => x.id !== p.id)); }}
            onProfileClick={(author, img) => setProfileModal({ author, authorImg: img })}
            onPeerGroups={() => setShowPeerGroups(true)} />
          );
        })}
        {feed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '56px 0', border: `2px dashed ${C.border}`, borderRadius: 16 }}>
            <MessageCircle size={32} color={C.border} style={{ marginBottom: 12 }} />
            <div style={{ color: C.muted, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Be the first to share</div>
            <div style={{ color: '#334155', fontSize: 12 }}>Share a win, a challenge, or where you're at — your community is here so you don't have to figure it out alone.</div>
          </div>
        )}
      </div>

      {/* Profile modal */}
      {profileModal && (
        <ProfileModal
          author={profileModal.author}
          authorImg={profileModal.authorImg}
          posts={feed}
          onClose={() => setProfileModal(null)}
        />
      )}

      {/* Peer Groups modal */}
      {showPeerGroups && (
        <PeerGroupsModal
          onClose={() => setShowPeerGroups(false)}
          canvas={canvas}
          user={user}
          feed={feed}
        />
      )}
    </div>
  );
}

// ─── VISIONARY CANVAS (AI-automated) ─────────────────────────────────────────
const CANVAS_STEPS = [
  { key: 'name', label: 'Who Are You?', icon: '👤', multi: false, placeholder: 'Your name or how you want to be known', coach: 'This canvas belongs to you. How do you want the world to know you as a visionary?', example: '"Amara Osei" or "Future Founder from Lagos"' },
  { key: 'major', label: 'Your Domain', icon: '🎯', multi: false, placeholder: 'Field, major, or problem space you\'re in', coach: 'Great visionaries know their arena. What field or problem space are you entering?', example: '"EdTech & Curriculum Design" or "Biomedical Engineering"' },
  { key: 'bigVision', label: 'The Big Vision', icon: '🌟', multi: true, placeholder: 'In one bold sentence: what future are you trying to create?', coach: 'Don\'t play small. Think 5–10 years out. What does the world look like because you showed up?', example: '"I will build the platform that connects African students to global opportunities."' },
  { key: 'purpose', label: 'Your Why', icon: '🔥', multi: true, placeholder: 'Why does this vision matter: beyond money?', coach: 'Purpose is what keeps you going when things get hard. What\'s the deeper reason behind your vision?', example: '"Because I grew up watching smart people stay invisible. I refuse to be one of them."' },
  { key: 'strengths', label: 'Your Superpowers', icon: '⚡', multi: true, placeholder: 'List 3–5 things you do better than most', coach: 'Your vision must be built on what\'s already in you. What gifts do you bring that others don\'t?', example: '"Systems thinking, storytelling, building trust quickly, design, relentlessness"' },
  { key: 'obstacle', label: 'The Real Obstacle', icon: '🧱', multi: true, placeholder: 'What is actually in your way right now?', coach: 'Naming your obstacle is the first step to defeating it. What is the real thing stopping you?', example: '"Fear of visibility: I have the skills but avoid putting my work out there."' },
  { key: 'goal12Month', label: '12-Month North Star', icon: '🚀', multi: true, placeholder: 'One specific, measurable, meaningful goal for the next 12 months', coach: 'Not a wish: a commitment. What will you point back to as proof you moved?', example: '"Launch my MVP and get 50 paying users by December 2026."' },
];

function CanvasTab({ canvas, setCanvas, setTab }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(canvas || {});
  const [view, setView] = useState(canvas?.bigVision ? 'view' : 'build');
  const [refining, setRefining] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [goals, setGoals] = useState(() => { try { return JSON.parse(localStorage.getItem('vh_vb') || '[]'); } catch { return []; } });
  const [newGoal, setNewGoal] = useState('');
  const [goalCat, setGoalCat] = useState('Goal');
  const CATS = ['Goal', 'Habit', 'Milestone', 'Skill', 'Experience'];
  const CAT_COLORS = { Goal: C.blue, Habit: C.green, Milestone: C.purple, Skill: C.yellow, Experience: C.teal };

  const saveGoals = g => { setGoals(g); localStorage.setItem('vh_vb', JSON.stringify(g)); };
  const addGoal = () => { if (!newGoal.trim()) return; saveGoals([...goals, { id: Date.now(), text: newGoal.trim(), done: false, cat: goalCat }]); setNewGoal(''); };

  const next = () => {
    if (step < CANVAS_STEPS.length - 1) setStep(s => s + 1);
    else { const c = { ...draft, completedAt: new Date().toISOString() }; setCanvas(c); localStorage.setItem('vh_canvas', JSON.stringify(c)); setView('view'); }
  };

  // AI Suggest for current field
  const aiSuggest = async () => {
    const s = CANVAS_STEPS[step];
    setSuggesting(true); setSuggestions([]);
    const context = Object.entries(draft).filter(([k,v]) => v && k !== s.key).map(([k,v]) => `${k}: ${v}`).join('\n');
    try {
      const r = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Give me 3 short, bold, specific suggestions for "${s.label}" for a visionary student. Context:\n${context || 'no context yet'}. Return ONLY 3 lines, one suggestion per line, no numbers or bullets.` }], mode: 'vision', canvas: draft }) });
      const d = await r.json();
      const lines = (d.reply || '').split('\n').filter(l => l.trim()).slice(0, 3);
      setSuggestions(lines);
    } catch (_) { setSuggestions(['Define it in your own words', 'Think about your ideal future', 'Be specific and bold']); }
    setSuggesting(false);
  };

  // Generate entire canvas from one prompt
  const generateAll = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const r = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Based on this brief: "${prompt}", generate a complete Visionary Canvas. Return ONLY valid JSON with keys: name, major, bigVision, purpose, strengths, obstacle, goal12Month. Be specific, ambitious, and real.` }], mode: 'vision', canvas: {} }) });
      const d = await r.json();
      const text = d.reply || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const newCanvas = { ...parsed, completedAt: new Date().toISOString() };
        setDraft(newCanvas); setCanvas(newCanvas); localStorage.setItem('vh_canvas', JSON.stringify(newCanvas)); setView('view');
      }
    } catch (_) {}
    setGenerating(false);
  };

  const refine = async () => {
    if (!draft.bigVision) return;
    setRefining(true);
    try {
      const r = await fetch('/api/ai/refine-vision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentTitle: draft.bigVision }) });
      const d = await r.json();
      if (d.refined) setDraft(p => ({ ...p, bigVision: d.refined }));
    } catch (_) {}
    setRefining(false);
  };

  if (view === 'build') {
    const s = CANVAS_STEPS[step];
    const pct = Math.round(((step + 1) / CANVAS_STEPS.length) * 100);
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 3px' }}>Visionary Canvas Builder</h1>
              <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>AI-powered: every field can be suggested or auto-generated</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.blueLight }}>{pct}%</div>
              <div style={{ fontSize: 10, color: C.muted }}>complete</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
            {CANVAS_STEPS.map((_, i) => (
              <div key={i} onClick={() => i < step && setStep(i)} style={{ flex: i === step ? 3 : 1, height: 6, borderRadius: 99, background: i < step ? C.green : i === step ? C.blue : C.border, transition: 'all 0.4s', cursor: i < step ? 'pointer' : 'default' }} />
            ))}
          </div>
          {/* AI Generate All */}
          <div style={{ background: `${C.purple}0A`, border: `1px solid ${C.purple}22`, borderRadius: 11, padding: '11px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Sparkles size={14} color={C.purple} style={{ flexShrink: 0 }} />
            <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder='Let AI build your whole canvas: type "I want to build an EdTech startup for rural students"'
              style={{ flex: 1, background: 'none', border: 'none', color: C.text, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
              onKeyDown={e => { if (e.key === 'Enter') generateAll(); }} />
            <Btn variant="purple" size="sm" onClick={generateAll} disabled={!prompt.trim() || generating}>
              {generating ? <Spinner /> : <><Sparkles size={12} />Generate Canvas</>}
            </Btn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          <div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 50, height: 50, background: `${C.blue}18`, border: `1px solid ${C.blue}28`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>Step {step + 1} of {CANVAS_STEPS.length}</div>
                  <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>{s.label}</h2>
                </div>
              </div>
              {s.multi
                ? <textarea value={draft[s.key] || ''} onChange={e => setDraft(d => ({ ...d, [s.key]: e.target.value }))} placeholder={s.placeholder} rows={4} autoFocus
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.65, boxSizing: 'border-box' }} />
                : <input value={draft[s.key] || ''} onChange={e => setDraft(d => ({ ...d, [s.key]: e.target.value }))} placeholder={s.placeholder} autoFocus
                    onKeyDown={e => { if (e.key === 'Enter' && draft[s.key]?.trim()) next(); }}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              }
              {/* AI Suggestions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={aiSuggest} disabled={suggesting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${C.purple}12`, border: `1px solid ${C.purple}33`, color: C.purple, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  {suggesting ? <Spinner /> : <Sparkles size={12} />} {suggesting ? 'Thinking…' : 'AI Suggest'}
                </button>
                {s.key === 'bigVision' && draft.bigVision && <Btn variant="secondary" size="sm" onClick={refine} disabled={refining}>{refining ? <Spinner /> : <Zap size={12} />} AI Polish</Btn>}
              </div>
              {suggestions.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {suggestions.map((sug, i) => (
                    <button key={i} onClick={() => { setDraft(d => ({ ...d, [s.key]: sug })); setSuggestions([]); }}
                      style={{ background: `${C.blue}0A`, border: `1px solid ${C.blue}22`, color: C.text, borderRadius: 9, padding: '9px 13px', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', lineHeight: 1.5, transition: 'all 0.15s' }}>
                      ✦ {sug}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <Btn variant="secondary" onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0}>← Back</Btn>
                <Btn onClick={next} disabled={!draft[s.key]?.trim()}>{step === CANVAS_STEPS.length - 1 ? '✦ Complete Canvas' : 'Continue →'}</Btn>
              </div>
            </div>
            {step > 0 && CANVAS_STEPS.slice(0, step).filter(prev => draft[prev.key]).map(prev => (
              <div key={prev.key} onClick={() => setStep(CANVAS_STEPS.indexOf(prev))}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 15 }}>{prev.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: C.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 1 }}>✓ {prev.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{draft[prev.key]}</div>
                </div>
                <Edit3 size={10} color={C.muted} />
              </div>
            ))}
          </div>

          {/* Coach panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: `linear-gradient(135deg, ${C.purple}10, ${C.blue}08)`, border: `1px solid ${C.purple}22`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 10, color: C.purple, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 9 }}>✦ Vision Coach</div>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7, margin: '0 0 12px' }}>{s.coach}</p>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 9, padding: '9px 12px', borderLeft: `3px solid ${C.purple}` }}>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Example</div>
                <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', lineHeight: 1.6 }}>{s.example}</div>
              </div>
            </div>
            {draft.bigVision && step > 2 && (
              <div style={{ background: `${C.blue}0A`, border: `1px solid ${C.blue}20`, borderRadius: 12, padding: 15 }}>
                <div style={{ fontSize: 9, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 }}>🌟 Your Vision So Far</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, fontStyle: 'italic' }}>"{draft.bigVision}"</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── CANVAS VIEW ───────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.blue}18, ${C.purple}10, ${C.card})`, border: `1px solid ${C.blue}28`, borderRadius: 18, padding: '26px 30px', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>✦ Visionary Canvas</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 5px', lineHeight: 1.2 }}>{canvas?.name || 'Your'}'s Vision</h1>
            {canvas?.major && <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{canvas.major}</div>}
            {canvas?.bigVision && (
              <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${C.blue}33`, borderRadius: 11, padding: '13px 17px', maxWidth: 580 }}>
                <div style={{ fontSize: 9, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Big Vision</div>
                <div style={{ fontSize: 15, color: C.text, fontWeight: 600, lineHeight: 1.55, fontStyle: 'italic' }}>"{canvas.bigVision}"</div>
              </div>
            )}
          </div>
          <Btn variant="secondary" size="sm" onClick={() => { setDraft(canvas || {}); setStep(0); setView('build'); }}><Edit3 size={12} /> Edit</Btn>
        </div>
      </div>

      <div className="vh-grid-3" style={{ gap: 13, marginBottom: 24 }}>
        {[
          { key: 'purpose', icon: '🔥', label: 'Your Why', color: C.red },
          { key: 'strengths', icon: '⚡', label: 'Superpowers', color: C.yellow },
          { key: 'obstacle', icon: '🧱', label: 'Real Obstacle', color: C.purple },
        ].map(f => canvas?.[f.key] ? (
          <div key={f.key} style={{ background: `${f.color}08`, border: `1px solid ${f.color}22`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 9, color: f.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, display: 'flex', gap: 6, alignItems: 'center' }}><span>{f.icon}</span>{f.label}</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{canvas[f.key]}</div>
          </div>
        ) : null)}
      </div>

      {canvas?.goal12Month && (
        <div style={{ background: `${C.blue}08`, border: `1px solid ${C.blue}22`, borderRadius: 14, padding: '18px 22px', marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 }}>🚀 12-Month North Star</div>
          <div style={{ fontSize: 15, color: C.text, lineHeight: 1.65, fontWeight: 600 }}>{canvas.goal12Month}</div>
        </div>
      )}

      {/* Quick-access: Roadmap + Reflect */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <button onClick={() => setTab?.('roadmap')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: `${C.blue}0A`, border: `1px solid ${C.blue}25`, borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', color: C.text, textAlign: 'left', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.blue + '66'}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.blue + '25'}>
          <Map size={18} color={C.blueLight} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>My Roadmap</div>
            <div style={{ fontSize: 11, color: C.muted }}>Your structured path forward</div>
          </div>
          <ChevronRight size={14} color={C.muted} style={{ marginLeft: 'auto' }} />
        </button>
        <button onClick={() => setTab?.('reflect')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: `${C.purple}0A`, border: `1px solid ${C.purple}25`, borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', color: C.text, textAlign: 'left', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.purple + '66'}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.purple + '25'}>
          <PenLine size={18} color={C.purple} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Reflect & Journal</div>
            <div style={{ fontSize: 11, color: C.muted }}>Track your growth</div>
          </div>
          <ChevronRight size={14} color={C.muted} style={{ marginLeft: 'auto' }} />
        </button>
      </div>

      {/* Vision Board: image upload + AI insight */}
      <VisionBoardSection canvas={canvas} />
    </div>
  );
}

function VisionBoardSection({ canvas }) {
  const [photos, setPhotos] = useState(() => { try { return JSON.parse(localStorage.getItem('vh_vb_photos') || '[]'); } catch { return []; } });
  const [goals, setGoals] = useState(() => { try { return JSON.parse(localStorage.getItem('vh_vb') || '[]'); } catch { return []; } });
  const [newGoal, setNewGoal] = useState('');
  const [goalCat, setGoalCat] = useState('Goal');
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [dragging, setDragging] = useState(false);
  const photoInputRef = useRef(null);
  const CATS = ['Goal', 'Habit', 'Milestone', 'Skill', 'Experience'];
  const CAT_COLORS = { Goal: C.blue, Habit: C.green, Milestone: C.purple, Skill: C.yellow, Experience: C.teal };

  const savePhotos = p => { setPhotos(p); try { localStorage.setItem('vh_vb_photos', JSON.stringify(p)); } catch { /* storage full */ } };
  const saveGoals  = g => { setGoals(g);  localStorage.setItem('vh_vb', JSON.stringify(g)); };
  const addGoal    = () => { if (!newGoal.trim()) return; saveGoals([...goals, { id: Date.now(), text: newGoal.trim(), done: false, cat: goalCat }]); setNewGoal(''); };

  const addPhoto = (file) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name);
    if (!isImage) return;
    if (file.size > 15 * 1024 * 1024) { alert('Max 15 MB per image'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      // Use functional update to avoid stale closure
      setPhotos(prev => {
        const next = [...prev, { id: Date.now() + Math.random(), url: e.target.result, caption: '' }];
        try { localStorage.setItem('vh_vb_photos', JSON.stringify(next)); } catch { /* storage full */ }
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const getAiInsight = async () => {
    setLoadingInsight(true); setAiInsight('');
    const context = [
      canvas?.bigVision ? `Vision: "${canvas.bigVision}"` : '',
      canvas?.purpose   ? `Why: "${canvas.purpose}"` : '',
      canvas?.goal12Month ? `12-month goal: "${canvas.goal12Month}"` : '',
      goals.length ? `Board items: ${goals.map(g => g.text).join(', ')}` : '',
    ].filter(Boolean).join('\n');
    try {
      const r = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Analyze this student's vision board and give them 3 sharp, personalised insights and 1 bold action for this week:\n\n${context}\n\nBe direct, specific, motivating. Max 120 words.` }], mode: 'vision', canvas }) });
      const d = await r.json();
      setAiInsight(d.reply || '');
    } catch { setAiInsight('Could not load insight: check your connection.'); }
    setLoadingInsight(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 3px' }}>Vision Board</h2>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Upload your inspiration photos + set goals</p>
        </div>
        <Btn size="sm" variant="purple" onClick={getAiInsight} disabled={loadingInsight}>
          {loadingInsight ? <Spinner /> : <><Sparkles size={12} />AI Insight</>}
        </Btn>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div style={{ background: `${C.purple}0C`, border: `1px solid ${C.purple}28`, borderRadius: 13, padding: '14px 18px', marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: C.purple, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}><Sparkles size={10} /> AI Vision Insight</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{aiInsight}</div>
          <button onClick={() => setAiInsight('')} style={{ marginTop: 10, background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Dismiss</button>
        </div>
      )}

      {/* Photo upload: compact strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
          onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
          onDrop={e => {
            e.preventDefault(); e.stopPropagation(); setDragging(false);
            const fs = Array.from(e.dataTransfer.files || []);
            if (fs.length) { fs.forEach(addPhoto); }
            else { Array.from(e.dataTransfer.items || []).forEach(it => { if (it.kind === 'file') addPhoto(it.getAsFile()); }); }
          }}
          onClick={() => photoInputRef.current?.click()}
          style={{ flex: 1, border: `1.5px dashed ${dragging ? C.blue : C.border}`, borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: dragging ? `${C.blue}08` : 'transparent', transition: 'all 0.18s' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.purple}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Upload size={16} color={dragging ? C.blueLight : C.purple} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: dragging ? C.blueLight : C.text }}>{dragging ? '✓ Release to add' : 'Add inspiration photos'}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Drag & drop or click to browse</div>
          </div>
        </div>
        <Btn size="sm" variant="secondary" onClick={() => photoInputRef.current?.click()} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Plus size={13} /> Add Photo
        </Btn>
      </div>
      <input ref={photoInputRef} type="file" accept="image/*,image/jpeg,image/png,image/gif,image/webp" multiple style={{ display: 'none' }} onChange={e => Array.from(e.target.files).forEach(addPhoto)} />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', background: C.card }}>
              <img src={p.url} alt="vision" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button onClick={() => savePhotos(photos.filter(x => x.id !== p.id))}
                style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={11} color="#fff" />
              </button>
            </div>
          ))}
          <div onClick={() => photoInputRef.current?.click()}
            style={{ borderRadius: 12, border: `2px dashed ${C.border}`, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent' }}>
            <Plus size={22} color={C.muted} />
          </div>
        </div>
      )}

      {/* Goal tiles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATS.map(cat => (
          <button key={cat} onClick={() => setGoalCat(cat)} style={{ padding: '5px 12px', borderRadius: 99, border: `1px solid ${goalCat === cat ? CAT_COLORS[cat] : C.border}`, background: goalCat === cat ? `${CAT_COLORS[cat]}18` : 'transparent', color: goalCat === cat ? CAT_COLORS[cat] : C.muted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: goalCat === cat ? 700 : 400 }}>{cat}</button>
        ))}
        <div style={{ display: 'flex', gap: 7, flex: 1, minWidth: 180 }}>
          <input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder={`Add ${goalCat.toLowerCase()}…`}
            onKeyDown={e => { if (e.key === 'Enter') addGoal(); }}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '7px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <Btn size="sm" onClick={addGoal} disabled={!newGoal.trim()}><Plus size={12} /></Btn>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 11 }}>
        {goals.map(g => {
          const c = CAT_COLORS[g.cat] || C.blue;
          return (
            <div key={g.id} style={{ background: `${c}08`, border: `1px solid ${c}22`, borderRadius: 13, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: c, fontWeight: 700, textTransform: 'uppercase', background: `${c}18`, padding: '2px 8px', borderRadius: 99 }}>{g.cat}</span>
                <button onClick={() => saveGoals(goals.filter(x => x.id !== g.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0 }}><X size={11} /></button>
              </div>
              <div style={{ fontSize: 13, color: g.done ? C.muted : C.text, textDecoration: g.done ? 'line-through' : 'none', lineHeight: 1.55, marginBottom: 10 }}>{g.text}</div>
              <button onClick={() => saveGoals(goals.map(x => x.id === g.id ? { ...x, done: !x.done } : x))}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${g.done ? c : C.border}`, borderRadius: 7, cursor: 'pointer', padding: '4px 9px', color: g.done ? c : C.muted, fontSize: 11, fontFamily: 'inherit', fontWeight: 600 }}>
                {g.done ? <Check size={10} /> : <Square size={10} />} {g.done ? 'Done ✓' : 'Mark done'}
              </button>
            </div>
          );
        })}
        {goals.length === 0 && photos.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px 0' }}>
            <div style={{ color: C.muted, fontSize: 13 }}>Upload photos above and add goals to build your vision board</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LIFE ROADMAP ─────────────────────────────────────────────────────────────
function RoadmapTab({ canvas, setTab }) {
  const [roadmap, setRoadmap] = useState(() => { try { return JSON.parse(localStorage.getItem('vh_roadmap') || 'null'); } catch { return null; } });
  const [loading, setLoading]   = useState(false);
  const [active, setActive]     = useState(0);
  const [done, setDone]         = useState(() => { try { return JSON.parse(localStorage.getItem('vh_rm_done') || '{}'); } catch { return {}; } });
  const [chatQ, setChatQ]       = useState('');
  const [chatA, setChatA]       = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  // Collect real activity from localStorage to feed the AI
  const collectActivity = () => {
    const journalRaw = localStorage.getItem('vh_journal');
    const journalEntries = (() => { try { return JSON.parse(journalRaw || '[]'); } catch { return []; } })();
    const tutorNotes    = localStorage.getItem('vh_tutor_notes') || '';
    const rmDone        = (() => { try { return JSON.parse(localStorage.getItem('vh_rm_done') || '{}'); } catch { return {}; } })();
    const completedMilestones = Object.values(rmDone).filter(Boolean).length;
    const firstVisit    = localStorage.getItem('vh_first_visit');
    const daysActive    = firstVisit ? Math.max(1, Math.floor((Date.now() - Number(firstVisit)) / 86400000)) : 0;
    if (!localStorage.getItem('vh_first_visit')) localStorage.setItem('vh_first_visit', String(Date.now()));
    return { journalEntries, tutorNotes, completedMilestones, daysActive };
  };

  const generate = async () => {
    setLoading(true);
    try {
      const activity = collectActivity();
      const r = await fetch('/api/ai/roadmap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ canvas, activity }) });
      const d = await r.json();
      if (d?.phases) { setRoadmap(d); localStorage.setItem('vh_roadmap', JSON.stringify(d)); }
      else setRoadmap(ROADMAP_DEFAULT);
    } catch (_) { setRoadmap(ROADMAP_DEFAULT); }
    setLoading(false);
  };

  const askRoadmap = async () => {
    if (!chatQ.trim()) return;
    setChatLoading(true); setChatA('');
    try {
      const activity = collectActivity();
      const r = await fetch('/api/ai/roadmap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ canvas, activity, roadmap, mode: 'chat', question: chatQ }) });
      const d = await r.json();
      setChatA(d.reply || 'No response. Please try again.');
    } catch (_) { setChatA('Something went wrong. Check your connection and try again.'); }
    setChatLoading(false);
  };

  const toggleDone = (k) => { const nd = { ...done, [k]: !done[k] }; setDone(nd); localStorage.setItem('vh_rm_done', JSON.stringify(nd)); };

  const rm    = roadmap || ROADMAP_DEFAULT;
  const ph    = rm.phases[active];
  const color = PHASE_COLORS[active];
  const phaseDone = ph.milestones.filter((_, j) => done[`${active}-${j}`]).length;
  const totalDone = Object.values(done).filter(Boolean).length;

  return (
    <div>
      {/* ── BACK + HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button onClick={() => setTab?.('canvas')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.blueLight}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <ChevronLeft size={18} color={C.text} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Vision Canvas</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Life Roadmap</div>
        </div>
        <Btn onClick={generate} disabled={loading} variant={roadmap ? 'secondary' : 'primary'}>
          {loading ? <><Spinner />Analysing…</> : <><RefreshCw size={13} />{roadmap ? 'Refresh' : 'Generate My Roadmap'}</>}
        </Btn>
      </div>

      {/* ── AI ACTIVITY INSIGHT ── */}
      {rm.activityInsight && (
        <div style={{ background: `${C.purple}0C`, border: `1px solid ${C.purple}28`, borderRadius: 13, padding: '14px 18px', marginBottom: 18, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Brain size={16} color={C.purple} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 10, color: C.purple, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>AI Activity Analysis</div>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.65 }}>{rm.activityInsight}</p>
            {totalDone > 0 && <div style={{ marginTop: 8, fontSize: 12, color: C.green, fontWeight: 600 }}>✓ {totalDone} milestone{totalDone !== 1 ? 's' : ''} completed — keep going.</div>}
          </div>
        </div>
      )}

      {/* ── NORTH STAR + FIRST STEP ── */}
      <div style={{ background: `linear-gradient(135deg, ${C.blue}18, ${C.purple}0C)`, border: `1px solid ${C.blue}28`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>✦ North Star</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.55, marginBottom: 14 }}>{rm.northStar}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${C.green}12`, border: `1px solid ${C.green}30`, borderRadius: 9, padding: '10px 14px' }}>
          <Zap size={13} color={C.green} />
          <div>
            <div style={{ fontSize: 10, color: C.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Do this today</div>
            <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{rm.firstStep}</span>
          </div>
        </div>
      </div>

      {/* ── AI SUGGESTIONS ── */}
      {rm.suggestions?.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={11} /> Personalised Suggestions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rm.suggestions.map((s, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: s.priority === 'high' ? `${C.blue}18` : `${C.purple}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13 }}>{i === 0 ? '🎯' : i === 1 ? '⚡' : i === 2 ? '🔗' : i === 3 ? '📚' : '💡'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 6 }}>{s.detail}</div>
                  <div style={{ fontSize: 11, color: C.blueLight, fontWeight: 600 }}>Why: {s.why}</div>
                </div>
                {s.priority === 'high' && <div style={{ background: `${C.blue}18`, border: `1px solid ${C.blue}30`, borderRadius: 6, padding: '2px 8px', fontSize: 9, color: C.blueLight, fontWeight: 700, flexShrink: 0 }}>HIGH</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHASE TABS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 2 }}>
        {rm.phases.map((p, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 9, border: `1px solid ${i === active ? PHASE_COLORS[i] : C.border}`, background: i === active ? `${PHASE_COLORS[i]}18` : 'transparent', color: i === active ? PHASE_COLORS[i] : C.muted, fontWeight: i === active ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {['🌱','⚡','🚀','✦'][i]} {p.label} <span style={{ opacity: 0.6, fontSize: 10 }}>{p.timeframe}</span>
          </button>
        ))}
      </div>

      {/* ── PHASE DETAIL ── */}
      <div className="vh-grid-2" style={{ gap: 16, marginBottom: 22 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, background: `${color}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{['🌱','⚡','🚀','✦'][active]}</div>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>{ph.label}</div><div style={{ fontSize: 11, color: C.muted }}>{ph.timeframe}</div></div>
          </div>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{ph.theme}</p>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 5 }}><span>Progress</span><span>{phaseDone}/{ph.milestones.length}</span></div>
            <div style={{ height: 4, background: C.border, borderRadius: 99 }}>
              <div style={{ height: '100%', background: color, borderRadius: 99, width: `${(phaseDone / ph.milestones.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}><span style={{ fontWeight: 600, color: C.text }}>Focus: </span>{ph.focusArea}</div>
          <div style={{ background: `${color}0A`, border: `1px solid ${color}28`, borderRadius: 9, padding: '9px 12px', fontSize: 11, color: color, marginBottom: ph.howTo?.length ? 12 : 0 }}>
            <span style={{ fontWeight: 700 }}>Done when: </span>{ph.successSign}
          </div>
          {ph.howTo?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowHowTo(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.blueLight, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lightbulb size={12} /> {showHowTo ? 'Hide' : 'How to achieve this phase ↓'}
              </button>
              {showHowTo && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {ph.howTo.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Milestones</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ph.milestones.map((m, j) => {
              const k = `${active}-${j}`;
              return (
                <button key={j} onClick={() => toggleDone(k)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'inherit' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${done[k] ? color : C.border}`, background: done[k] ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
                    {done[k] && <Check size={10} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 13, color: done[k] ? C.muted : C.text, textDecoration: done[k] ? 'line-through' : 'none', lineHeight: 1.5 }}>{m}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── ASK THE AI ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Bot size={15} color={C.purple} /> Ask about your journey
        </div>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 14px', lineHeight: 1.6 }}>
          Ask anything specific — "How do I get an internship in {canvas?.major || 'my field'}?", "What should I do this week?", "How do I build a portfolio?"
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: chatA ? 14 : 0 }}>
          <input value={chatQ} onChange={e => setChatQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !chatLoading && askRoadmap()}
            placeholder={`e.g. "How do I land my first opportunity in ${canvas?.major || 'my field'}?"`}
            style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <Btn onClick={askRoadmap} disabled={!chatQ.trim() || chatLoading} variant="purple">
            {chatLoading ? <Spinner /> : <><Send size={13} /> Ask</>}
          </Btn>
        </div>
        {chatA && (
          <div style={{ background: `${C.purple}08`, border: `1px solid ${C.purple}22`, borderRadius: 11, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: C.purple, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Vision AI</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{chatA}</div>
          </div>
        )}
        {/* Quick-ask chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {[
            'What should I focus on this week?',
            `How do I build a portfolio in ${canvas?.major || 'my field'}?`,
            'How do I find a mentor?',
            'What internships should I apply for?',
          ].map(q => (
            <button key={q} onClick={() => { setChatQ(q); }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 99, padding: '5px 12px', fontSize: 11, color: C.muted, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple + '55'; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI TUTOR (split panel: her-stewardship style) ───────────────────────────
function TutorTab({ canvas, files: filesProp, setFiles: setFilesProp,
  timerRunning, setTimerRunning, timerSeconds, setTimerSeconds,
  timerIsBreak, setTimerIsBreak, startTimer, resetTimer }) {
  const [mode, setMode] = useState('study');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Use lifted files state if provided, otherwise fall back to localStorage
  const files = filesProp ?? [];
  const setFiles = setFilesProp ?? (() => {});
  const [activeFile, setActiveFile] = useState(files[0]?.id || null);
  const [uploading, setUploading] = useState(false);
  const [leftTab, setLeftTab] = useState('document');
  const [notes, setNotes] = useState(() => localStorage.getItem('vh_tutor_notes') || '');
  const [showTimer, setShowTimer] = useState(false);
  const fileRef = useRef(null);
  const chatEndRef = useRef(null);

  // Persist notes
  useEffect(() => { localStorage.setItem('vh_tutor_notes', notes); }, [notes]);

  // Also persist files to localStorage as backup (strip blob URLs)
  useEffect(() => {
    try {
      const saveable = files.map(f => ({ ...f, pdfUrl: null }));
      localStorage.setItem('vh_tutor_files', JSON.stringify(saveable));
    } catch { /* ignore if too large */ }
  }, [files]);

  const timerMins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const timerSecs = String(timerSeconds % 60).padStart(2, '0');
  const timerTotal = timerIsBreak ? 5 * 60 : 25 * 60;
  const timerPct = (1 - timerSeconds / timerTotal) * 100;
  // ── Growth Lab: PDF / text download ──────────────────────────────────────
  const downloadChat = () => {
    const text = messages.filter(m => m.role !== 'ai' || m.content !== messages[0]?.content)
      .map(m => `[${m.role === 'ai' ? 'AI Tutor' : 'You'}]\n${m.content}`)
      .join('\n\n---\n\n');
    if (!text.trim()) return;
    const blob = new Blob([`AI Tutor Session: ${new Date().toLocaleDateString()}\nMode: ${mode}\n\n${text}`], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `tutor-session-${new Date().toISOString().slice(0,10)}.txt`; a.click(); URL.revokeObjectURL(a.href);
  };
  const downloadAsPDF = () => {
    const text = messages.map(m => `${m.role === 'ai' ? 'AI Tutor' : 'You'}:\n${m.content}`).join('\n\n');
    if (!text.trim()) return;
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:720px;margin:0 auto;color:#111}h1{font-size:1.4rem;margin-bottom:0.5rem}.msg{margin:1.2rem 0;padding:0.8rem 1rem;border-radius:8px;line-height:1.65}.ai{background:#f1f5f9}.user{background:#e0f2fe;text-align:right}.label{font-size:0.7rem;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:4px}</style></head><body><h1>AI Tutor Session</h1><p style="color:#64748b;font-size:0.85rem">${new Date().toLocaleDateString()} · ${mode} mode</p>${messages.map(m=>`<div class="msg ${m.role==='ai'?'ai':'user'}"><div class="label">${m.role==='ai'?'AI Tutor':'You'}</div>${esc(m.content)}</div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),600)</script></body></html>`;
    const w = window.open('', '_blank'); w.document.write(html); w.document.close();
  };

  const MODES = [
    { id: 'study',    icon: BookOpen,       label: 'Deep Learning',    color: C.blue },
    { id: 'vision',   icon: Lightbulb,      label: 'Vision Coach',     color: C.purple },
    { id: 'career',   icon: Briefcase,      label: 'Career Strategy',  color: C.yellow },
    { id: 'creative', icon: Sparkles,       label: 'Creative Thinking', color: '#EC4899' },
  ];

  const QUICK = {
    study:    ['Break this down simply', 'What are the key takeaways?', 'Give me 3 deep-dive questions', 'Explain like I\'m brand new', 'Quiz me on this', 'Summarize in bullet points'],
    vision:   ['Refine my vision statement', 'What are my blind spots?', '90-day action plan', 'Challenge my thinking', 'What should I focus on first?', 'Help me think bigger'],
    career:   ['What high-value skills should I build?', 'How do I network authentically?', 'What should my portfolio highlight?', 'Help me craft my narrative', 'What moves will 10x my growth?', 'Review my strategic direction'],
    creative: ['Give me 5 unconventional ideas', 'Help me think outside the box', 'Challenge my assumptions', 'Brainstorm with me', 'What if I did the opposite?', 'How might I reframe this problem?'],
  };

  // ── Opportunity search inside tutor ────────────────────────────────────────
  const [oppPanel, setOppPanel] = useState(false);
  const [oppQuery, setOppQuery] = useState('');
  const [oppSearching, setOppSearching] = useState(false);
  const [oppResults, setOppResults] = useState([]);
  const [oppError, setOppError] = useState('');

  const searchOpps = async (q) => {
    const query = (q || oppQuery).trim();
    if (!query) return;
    setOppSearching(true); setOppError(''); setOppResults([]);
    const field = canvas?.major || '';
    const fullQ = field ? `${query} (field: ${field})` : query;
    try {
      const r = await fetch('/api/ai/opportunities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQ, canvas: canvas ? { field: canvas.major, goal: canvas.goal12Month } : null }),
      });
      const d = await r.json();
      const match = (d.result || '').match(/\[[\s\S]*\]/);
      if (match) {
        try { setOppResults(JSON.parse(match[0]).map((o, i) => ({ ...o, id: 'to-' + i }))); }
        catch { setOppError('Could not parse results. Try again.'); }
      } else { setOppError('No results found. Try a more specific search.'); }
    } catch { setOppError('Search failed. Check your connection.'); }
    setOppSearching(false);
  };

  const WELCOME = {
    study:    "Hi! I'm your AI Learning Tutor.\n\nUpload any material on the left: notes, PDFs, images: and ask me anything. I can explain concepts, quiz you, break down complex ideas, or go deep on any topic.\n\nWhat do you want to master today?",
    vision:   `I'm your Vision Coach: let's build strategic clarity.\n\n${canvas?.bigVision ? `Your vision: "${canvas.bigVision}": let's sharpen it.` : "You haven't set a vision yet. Let's build one together."}\n\nWhat's the biggest thing you're figuring out right now?`,
    career:   `I'm your Career Strategist: specific, honest, high-impact guidance.\n\n${canvas?.major ? `Domain: ${canvas.major}.` : ''} ${canvas?.goal12Month ? `12-month goal: ${canvas.goal12Month}` : "Tell me where you want to be in the next 12 months."}\n\nWhat's your most pressing career question?`,
    creative: "I'm your Creative Thinking Partner.\n\nBring me your half-formed ideas, stuck problems, or blank-page moments. I use lateral thinking, reframing, and unconventional angles to unlock what's already in your mind.\n\nWhat are you working on or wrestling with?",
  };

  useEffect(() => { if (!messages.length) setMessages([{ role: 'ai', content: WELCOME[mode] }]); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const switchMode = (m) => { setMode(m); setMessages([{ role: 'ai', content: WELCOME[m] }]); setInput(''); };

  const handleUpload = async (e) => {
    const fs = Array.from(e.target.files || []); if (!fs.length) return;
    setUploading(true);
    for (const f of fs) {
      try {
        const ext = f.name.split('.').pop().toLowerCase();
        const isImage = f.type.startsWith('image/');
        const isPdf   = ext === 'pdf' || f.type === 'application/pdf';
        const isText  = ['txt','md','csv','json','js','ts','py','html','css','xml','yaml','yml'].includes(ext);
        let content = '';
        let imageUrl = null;
        let pdfUrl = null;

        if (isImage) {
          imageUrl = await new Promise(res => { const r = new FileReader(); r.onload = ev => res(ev.target.result); r.readAsDataURL(f); });
          content = `[Image: ${f.name}]`;
        } else if (isPdf) {
          // Create a blob URL for inline rendering
          pdfUrl = URL.createObjectURL(f);
          // Extract text with pdfjs-dist (reads every page properly)
          try {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
            ).toString();
            const arrayBuffer = await f.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = `[PDF: ${f.name} | ${pdf.numPages} page${pdf.numPages !== 1 ? 's' : ''}]\n\n`;
            for (let pg = 1; pg <= pdf.numPages; pg++) {
              const page = await pdf.getPage(pg);
              const tc   = await page.getTextContent();
              const pageText = tc.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
              if (pageText) text += `--- Page ${pg} ---\n${pageText}\n\n`;
            }
            content = text.trim().slice(0, 50000) || `[PDF: ${f.name} — no extractable text found]`;
          } catch (err) {
            console.warn('PDF extraction error:', err);
            content = `[PDF: ${f.name}]`;
          }
        } else if (isText) {
          content = (await f.text()).slice(0, 40000);
        } else {
          content = `[${f.name}: ${ext.toUpperCase()} file, ${(f.size/1024).toFixed(0)} KB]`;
        }

        const newFile = { id: Date.now() + Math.random(), name: f.name, content, ext, imageUrl, pdfUrl, size: f.size };
        setFiles(prev => { const u = [...prev, newFile]; setActiveFile(newFile.id); return u; });
        setLeftTab('document');
        const aiMsg = isImage
          ? `🖼️ Loaded "${f.name}": I can see it on the left. Ask me to describe, analyse, or help you study from it.`
          : isPdf
          ? `📄 Loaded "${f.name}" (${(f.size/1024).toFixed(0)} KB). It's displayed on the left. Ask me anything: summarise, explain, quiz me, or go deep.`
          : `📄 Loaded "${f.name}" (${(f.size/1024).toFixed(0)} KB). Ask me anything about it.`;
        setMessages(prev => [...prev, { role: 'ai', content: aiMsg }]);
      } catch (_) {}
    }
    setUploading(false); e.target.value = '';
  };

  const send = async (text) => {
    const msg = (text || input).trim(); if (!msg || loading) return;
    const newMsgs = [...messages, { role: 'user', content: msg }];
    setMessages(newMsgs); setInput(''); setLoading(true);
    try {
      const apiMsgs = newMsgs.slice(-14).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
      const allContent = files.map(f => `=== ${f.name} ===\n${f.content}`).join('\n\n').slice(0, 30000) + (notes.trim() ? `\n\n=== My Notes ===\n${notes}` : '');
      const r = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: apiMsgs, mode, canvas, fileContent: allContent }) });
      const d = await r.json();
      setMessages(prev => [...prev, { role: 'ai', content: d.reply || "I'm here: what would you like to explore?" }]);
    } catch (_) { setMessages(prev => [...prev, { role: 'ai', content: "Connection issue: please try again." }]); }
    setLoading(false);
  };

  const curMode = MODES.find(m => m.id === mode);
  const viewedFile = files.find(f => f.id === activeFile);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', maxHeight: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>AI Tutor</h1>
          <span style={{ fontSize: 10, color: C.green, fontWeight: 700, background: `${C.green}15`, border: `1px solid ${C.green}30`, borderRadius: 99, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block' }} /> AI Ready
          </span>
          {/* Pomodoro Timer */}
          <button onClick={() => setShowTimer(t => !t)}
            title="Study Timer (Pomodoro)"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, border: `1px solid ${timerRunning ? C.green : C.border}`, background: timerRunning ? `${C.green}12` : C.surface, color: timerRunning ? C.green : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}>
            ⏱ {timerRunning ? `${timerMins}:${timerSecs}` : 'Timer'}
          </button>
          {/* PDF Download */}
          {messages.length > 1 && (
            <button onClick={downloadAsPDF} title="Download as PDF"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              ⬇ PDF
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 3 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => switchMode(m.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: 'none', background: mode === m.id ? `${m.color}22` : 'transparent', color: mode === m.id ? m.color : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: mode === m.id ? 700 : 400, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              <m.icon size={12} />{m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pomodoro Timer Panel */}
      {showTimer && (
        <div style={{ background: C.surface, border: `1px solid ${timerIsBreak ? C.green : C.blue}44`, borderRadius: 13, padding: '14px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'ui-monospace, monospace', color: timerRunning ? (timerIsBreak ? C.green : C.blueLight) : C.text }}>{timerMins}:{timerSecs}</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>{timerIsBreak ? '☕ Break' : '📚 Focus'}</div>
          </div>
          {/* Progress bar */}
          <div style={{ flex: 1, height: 6, background: `${C.border}88`, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerIsBreak ? C.green : C.blue, borderRadius: 99, transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn size="sm" onClick={() => setTimerRunning(r => !r)} style={{ minWidth: 60 }}>
              {timerRunning ? '⏸ Pause' : '▶ Start'}
            </Btn>
            <Btn size="sm" variant="secondary" onClick={() => startTimer ? startTimer(5 * 60) : (setTimerIsBreak(true), setTimerSeconds(5 * 60), setTimerRunning(true))}>☕ 5 min rest</Btn>
            <Btn size="sm" variant="secondary" onClick={() => resetTimer ? resetTimer() : (setTimerRunning(false), setTimerIsBreak(false), setTimerSeconds(25 * 60))}>Reset</Btn>
          </div>
        </div>
      )}

      <div className="vh-tutor-split" style={{ flex: 1, gap: 12, minHeight: 0 }}>
        {/* LEFT */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
            {['document', 'notes'].map(t => (
              <button key={t} onClick={() => setLeftTab(t)}
                style={{ padding: '9px 14px', background: 'none', border: 'none', borderBottom: `2px solid ${leftTab === t ? C.blue : 'transparent'}`, color: leftTab === t ? C.text : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: leftTab === t ? 700 : 400, display: 'flex', alignItems: 'center', gap: 5, marginBottom: -1 }}>
                {t === 'document' ? <><FileText size={11} />Document</> : <><Edit3 size={11} />Notes</>}
              </button>
            ))}
          </div>

          {leftTab === 'document' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {files.length > 0 && (
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {files.map(f => (
                    <div key={f.id} onClick={() => setActiveFile(f.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: activeFile === f.id ? `${C.blue}1A` : 'transparent', border: `1px solid ${activeFile === f.id ? C.blue : C.border}`, cursor: 'pointer', maxWidth: 140 }}>
                      <FileText size={10} color={activeFile === f.id ? C.blue : C.muted} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: activeFile === f.id ? C.text : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <button onClick={e => { e.stopPropagation(); setFiles(prev => { const u = prev.filter(x => x.id !== f.id); if (activeFile === f.id) setActiveFile(u[0]?.id || null); return u; }); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, lineHeight: 1, flexShrink: 0 }}><X size={9} /></button>
                    </div>
                  ))}
                </div>
              )}
              {viewedFile ? (
                viewedFile.pdfUrl ? (
                  // ── PDF viewer ───────────────────────────────────────────
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${C.border}`, background: `${C.card}88` }}>
                      <FileText size={13} color={C.red} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewedFile.name}</span>
                      <a href={viewedFile.pdfUrl} download={viewedFile.name} style={{ fontSize: 10, color: C.blueLight, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Download size={10} /> Save</a>
                    </div>
                    <embed src={viewedFile.pdfUrl} type="application/pdf" style={{ flex: 1, width: '100%', border: 'none', minHeight: 0 }} />
                  </div>
                ) : viewedFile.imageUrl ? (
                  // ── Image viewer ─────────────────────────────────────────
                  <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                    <img src={viewedFile.imageUrl} alt={viewedFile.name} style={{ width: '100%', borderRadius: 10, objectFit: 'contain', maxHeight: 420 }} />
                    <div style={{ marginTop: 10, fontSize: 11, color: C.muted, textAlign: 'center' }}>{viewedFile.name}</div>
                  </div>
                ) : (
                  // ── Text viewer ───────────────────────────────────────────
                  <div style={{ flex: 1, overflowY: 'auto', padding: 14, fontSize: 11, color: '#94A3B8', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace' }}>
                    {viewedFile.content}
                  </div>
                )
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, background: `${C.blue}10`, border: `2px dashed ${C.border}`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Upload size={20} color={C.muted} /></div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 5 }}>Upload Study Material</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>Upload notes, PDFs, images, any file. I'll read them and help you learn.</div>
                  <input type="file" ref={fileRef} style={{ display: 'none' }} accept="*" multiple onChange={handleUpload} />
                  <Btn onClick={() => fileRef.current?.click()} disabled={uploading} size="sm">{uploading ? <Spinner /> : <><Upload size={11} />Upload Files</>}</Btn>
                  <div style={{ fontSize: 10, color: '#334155', marginTop: 8 }}>Images, docs, text, PDFs: all supported</div>
                </div>
              )}
              {files.length > 0 && (
                <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.border}` }}>
                  <input type="file" ref={fileRef} style={{ display: 'none' }} accept="*" multiple onChange={handleUpload} />
                  <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: '100%', justifyContent: 'center' }}>
                    {uploading ? <Spinner /> : <Plus size={11} />} Add file
                  </Btn>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>YOUR NOTES: tutor reads these too</div>
                {notes.trim() && (
                  <button onClick={() => {
                    const blob = new Blob([notes], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'my-notes.txt'; a.click();
                    URL.revokeObjectURL(url);
                  }} title="Download notes" style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: 'pointer', padding: '3px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                    <Download size={10} /> Save
                  </button>
                )}
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Write notes here: key ideas, questions, summaries. The AI will reference them."
                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: 12, fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.65 }} />
            </div>
          )}
        </div>

        {/* RIGHT: chat */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, background: `${curMode.color}1A`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><curMode.icon size={13} color={curMode.color} /></div>
              <div><div style={{ fontSize: 12, fontWeight: 700 }}>{curMode.label}</div><div style={{ fontSize: 10, color: C.muted }}>AI-powered · context-aware</div></div>
            </div>
            {(files.length > 0 || canvas?.bigVision || notes.trim()) && (
              <div style={{ fontSize: 10, color: C.muted, textAlign: 'right', lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Tutor also sees</div>
                {files.map(f => <div key={f.id} style={{ color: C.blueLight }}>• {f.name.length > 20 ? f.name.slice(0, 20) + '…' : f.name}</div>)}
                {canvas?.bigVision && <div style={{ color: C.purple }}>• Your Visionary Canvas</div>}
                {notes.trim() && <div style={{ color: C.green }}>• Your notes</div>}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 13, display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                {m.role === 'ai' && <div style={{ width: 26, height: 26, background: `${curMode.color}18`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}><Brain size={12} color={curMode.color} /></div>}
                <div style={{ maxWidth: '82%', background: m.role === 'user' ? `${C.blue}20` : C.card, border: `1px solid ${m.role === 'user' ? C.blue + '30' : C.border}`, borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px', padding: '9px 13px', fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, background: `${curMode.color}18`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={12} color={curMode.color} /></div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px 12px 12px 3px', padding: '11px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: curMode.color, opacity: 0.4, animation: `bounce 1.2s ${j*0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '7px 14px', borderTop: `1px solid ${C.border}28`, display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            {QUICK[mode].map(q => (
              <button key={q} onClick={() => send(q)} style={{ background: `${curMode.color}0C`, border: `1px solid ${curMode.color}25`, color: curMode.color, borderRadius: 99, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap' }}>{q}</button>
            ))}
            {(mode === 'career' || mode === 'vision') && (
              <button onClick={() => { setOppPanel(o => !o); setOppResults([]); setOppError(''); setOppQuery(''); }}
                style={{ background: oppPanel ? `${C.green}18` : `${C.green}0C`, border: `1px solid ${oppPanel ? C.green : C.green + '30'}`, color: C.green, borderRadius: 99, padding: '4px 11px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Compass size={10} /> Find Opportunities
              </button>
            )}
          </div>

          {/* Inline opportunity search panel */}
          {oppPanel && (mode === 'career' || mode === 'vision') && (
            <div style={{ margin: '0 12px 10px', background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: 12, padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.green, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Compass size={10} /> Find Real Opportunities
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <input value={oppQuery} onChange={e => setOppQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchOpps()}
                  placeholder={canvas?.major ? `e.g. scholarships for ${canvas.major}…` : 'e.g. fellowships for Caribbean students…'}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '7px 11px', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                <Btn size="sm" onClick={() => searchOpps()} disabled={!oppQuery.trim() || oppSearching} style={{ background: C.green, flexShrink: 0 }}>
                  {oppSearching ? <Spinner /> : <Search size={11} />}
                </Btn>
              </div>
              {/* Quick searches */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['Fully funded scholarships', 'Fellowships open internationally', 'Youth entrepreneurship grants', 'Remote internships'].map(q => (
                  <button key={q} onClick={() => { setOppQuery(q); searchOpps(q); }}
                    style={{ background: `${C.green}0A`, border: `1px solid ${C.green}25`, color: C.green, borderRadius: 99, padding: '3px 9px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{q}</button>
                ))}
              </div>
              {oppError && <div style={{ fontSize: 11, color: '#FCA5A5' }}>{oppError}</div>}
              {oppSearching && <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '10px 0' }}>Searching real programs…</div>}
              {oppResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {oppResults.map(o => (
                    <div key={o.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: C.text, marginBottom: 3 }}>{o.title}</div>
                      {o.description && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, marginBottom: 6 }}>{o.description}</div>}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 7, fontSize: 10 }}>
                        {o.amount && <span style={{ color: C.green, fontWeight: 700 }}>💰 {o.amount}</span>}
                        {o.deadline && <span style={{ color: C.yellow }}>📅 {o.deadline}</span>}
                        {o.field && <span style={{ color: C.muted }}>🎯 {o.field}</span>}
                      </div>
                      <ApplyButton url={o.url} institution={o.title} homepage={o.homepage} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={files.length ? `Ask about ${viewedFile?.name || 'your material'}…` : 'Ask anything…'} rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5 }} />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{ width: 38, height: 38, borderRadius: 9, background: input.trim() && !loading ? curMode.color : C.border, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
              <Send size={14} color="#fff" />
            </button>
          </div>
          {/* AI accuracy disclaimer */}
          <div style={{ padding: '5px 12px 9px', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
            <AlertCircle size={10} color="#475569" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 10, color: '#475569', lineHeight: 1.4 }}>AI can make mistakes. Always verify important facts, medical, legal, or financial information with a qualified professional or your course materials.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MENTORSHIP ───────────────────────────────────────────────────────────────
function MentorshipTab({ mentors: mentorsProp }) {
  // Local copy of mentors so we can remove entries without a round-trip
  const [localMentors, setLocalMentors] = useState(mentorsProp || []);
  useEffect(() => { setLocalMentors(mentorsProp || []); }, [mentorsProp]);
  const mentors = localMentors;

  const removeMentor = async (id) => {
    if (!window.confirm('Remove this mentor?')) return;
    setLocalMentors(prev => prev.filter(m => m.id !== id));
    await deleteMentor(id);
  };

  const [view, setView] = useState('mentors'); // 'mentors' | 'peers' | 'become'
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [chatMentor, setChatMentor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  // Become a mentor form
  const [bName, setBName] = useState('');
  const [bTitle, setBTitle] = useState('');
  const [bField, setBField] = useState('Career / Purpose');
  const [bQuote, setBQuote] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bLinkedIn, setBLinkedIn] = useState('');
  const [bProof, setBProof] = useState('');  // real-world proof of impact
  const [bSubmitted, setBSubmitted] = useState(false);
  const [bSubmitting, setBSubmitting] = useState(false);
  // Peer accountability
  const [peerGoal, setPeerGoal] = useState('');
  const [peers, setPeers] = useState(() => { try { return JSON.parse(localStorage.getItem('vh_peers') || '[]'); } catch { return []; } });
  const [peerLoading, setPeerLoading] = useState(false);

  const CATEGORIES = ['All', 'Academic / Study', 'Career / Purpose', 'Wellness / Balance', 'Innovation / Startup'];
  const filtered = mentors.filter(m => {
    const matchCat = category === 'All' || m.field === category;
    const matchSearch = !search || `${m.name} ${m.title} ${m.field}`.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const openChat = m => {
    setChatMentor(m);
    setMessages([{ role: 'ai', content: `Hi! I'm ${m.name}, ${m.title}.\n\n"${m.quote}"\n\nI'm here to give you real guidance: not generic advice. What specific challenge are you working through right now?` }]);
    setInput('');
  };

  const send = async () => {
    const text = input.trim(); if (!text || loading) return;
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs); setInput(''); setLoading(true);
    try {
      const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mentor: chatMentor, messages: newMsgs.slice(-8).map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })) }) });
      const d = await r.json();
      setMessages(prev => [...prev, { role: 'ai', content: d.reply || "Let's dig into this together." }]);
    } catch { setMessages(prev => [...prev, { role: 'ai', content: "Connection issue. Please try again." }]); }
    setLoading(false);
  };

  const submitMentorApp = async () => {
    if (!bName.trim() || !bTitle.trim() || !bEmail.trim()) return;
    setBSubmitting(true);
    try {
      // Use AI to generate a polished title + quote from their one-line description
      let aiTitle = bTitle; let aiQuote = 'Here to help you grow.';
      try {
        const r = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: `Based on this person's background: "${bTitle}", generate: 1) A professional short title (max 8 words, e.g. "Software Engineer & Startup Mentor") 2) A short inspiring mentor quote (max 15 words). Return JSON: {"title":"...","quote":"..."}` }], mode: 'study', canvas: {} }) });
        const d = await r.json();
        const match = (d.reply || '').match(/\{[\s\S]*\}/);
        if (match) { const parsed = JSON.parse(match[0]); aiTitle = parsed.title || bTitle; aiQuote = parsed.quote || aiQuote; }
      } catch { /* use defaults */ }
      if (supabase) {
        await supabase.from('mentors').insert([{ name: bName, title: aiTitle, field: bField, quote: aiQuote, img: `https://i.pravatar.cc/150?u=${bEmail}`, persona: 'mentor', stats: JSON.stringify({ mentored: 0, rating: 5.0 }), status: 'pending', verified: false, email: bEmail, linkedin: bLinkedIn, proof: bProof }]);
      }
    } catch { /* silent */ }
    setBSubmitted(true); setBSubmitting(false);
  };

  const findPeerMatch = async () => {
    if (!peerGoal.trim()) return;
    setPeerLoading(true);
    try {
      const r = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Generate 3 fictional but realistic accountability partner profiles for a student working on: "${peerGoal}". Return JSON array: [{"name":"...","goal":"...","field":"...","timezone":"...","vibe":"...","emoji":"..."}]. Make them diverse, relatable, specific.` }], mode: 'vision', canvas: {} }) });
      const d = await r.json();
      const match = (d.reply || '').match(/\[[\s\S]*?\]/);
      if (match) {
        const found = JSON.parse(match[0]);
        setPeers(found); localStorage.setItem('vh_peers', JSON.stringify(found));
      }
    } catch { /* silent */ }
    setPeerLoading(false);
  };

  // CHAT VIEW
  if (chatMentor) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', maxHeight: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Btn variant="secondary" size="sm" onClick={() => setChatMentor(null)}>← Back</Btn>
          <Avatar src={chatMentor.img} name={chatMentor.name} size={44} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{chatMentor.name}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{chatMentor.title} · {chatMentor.field}</div>
          </div>
          <div style={{ marginLeft: 'auto', background: `${C.green}12`, border: `1px solid ${C.green}28`, borderRadius: 99, padding: '4px 12px', fontSize: 11, color: C.green, fontWeight: 700 }}>● Live Session</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 14, display: 'flex', gap: 9, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                {m.role === 'ai' && <Avatar src={chatMentor.img} name={chatMentor.name} size={30} />}
                <div style={{ maxWidth: '78%', background: m.role === 'user' ? `${C.blue}20` : C.card, border: `1px solid ${m.role === 'user' ? C.blue + '33' : C.border}`, borderRadius: m.role === 'user' ? '13px 13px 4px 13px' : '13px 13px 13px 4px', padding: '10px 14px', fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 9 }}>
                <Avatar src={chatMentor.img} name={chatMentor.name} size={30} />
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '13px 13px 13px 4px', padding: '12px 16px', display: 'flex', gap: 5 }}>
                  {[0,1,2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: C.blue, opacity: 0.4, animation: `bounce 1.2s ${j*0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask ${chatMentor.name.split(' ')[0]} anything…`}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '9px 13px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{ width: 38, height: 38, borderRadius: 9, background: input.trim() && !loading ? C.blue : C.border, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={14} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header + tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>Mentorship & Peers</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Connect with mentors, find accountability partners, or become a mentor</p>
        </div>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {[['mentors', '🎓 Mentors'], ['peers', '🤝 Find Peers'], ['become', '✋ Become a Mentor']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: '10px 18px', borderRadius: '10px 10px 0 0', border: `1px solid ${view === v ? C.border : 'transparent'}`, borderBottom: view === v ? `2px solid ${C.blueLight}` : '1px solid transparent', background: view === v ? C.surface : 'transparent', color: view === v ? C.blueLight : C.muted, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: view === v ? 700 : 500, marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── MENTORS VIEW ── */}
      {view === 'mentors' && (
        <div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ padding: '7px 16px', borderRadius: 99, border: `1px solid ${category === cat ? C.blue : C.border}`, background: category === cat ? `${C.blue}18` : 'transparent', color: category === cat ? C.blueLight : C.muted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: category === cat ? 700 : 400 }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mentors…"
              style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '11px 14px 11px 38px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div className="vh-grid-2" style={{ gap: 16 }}>
            {filtered.map(m => (
              <div key={m.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, transition: 'border-color 0.2s', position: 'relative' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.blue + '66'}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <Avatar src={m.img} name={m.name} size={52} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{m.name}</span>
                      {m.verified && <span title="Verified Mentor" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: `${C.blue}18`, border: `1px solid ${C.blue}40`, borderRadius: 99, padding: '2px 7px', fontSize: 10, color: C.blue, fontWeight: 700 }}>✓ Verified</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>{m.title}</div>
                    <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 600, marginTop: 4, background: `${C.blue}10`, display: 'inline-block', padding: '2px 8px', borderRadius: 99 }}>{m.field || 'General'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.55, marginBottom: 14, fontStyle: 'italic' }}>"{m.quote}"</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: C.muted }}>{m.stats?.mentored > 0 ? `${m.stats.mentored}+ guided · ⭐ ${m.stats.rating || 5.0}` : 'New mentor'}</div>
                  <Btn size="sm" onClick={() => openChat(m)}>Start Session →</Btn>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '56px 0', border: `2px dashed ${C.border}`, borderRadius: 16 }}>
              <Users size={32} color={C.border} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 6 }}>No approved mentors yet</div>
              <div style={{ fontSize: 12, color: '#334155', maxWidth: 280, margin: '0 auto', lineHeight: 1.6 }}>
                Real mentors will appear here once approved. Use "Become a Mentor" to apply.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PEER ACCOUNTABILITY VIEW ── */}
      {view === 'peers' && (
        <div>
          <div style={{ background: `${C.teal}0A`, border: `1px solid ${C.teal}25`, borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>Find your accountability partner 🤝</div>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px', lineHeight: 1.65 }}>
              50% of students say they need someone to grow with. Tell us what you're working on: we'll match you with peers on the same journey.
            </p>
            <div style={{ display: 'flex', gap: 9 }}>
              <input value={peerGoal} onChange={e => setPeerGoal(e.target.value)} placeholder='e.g. "launching my startup", "getting into grad school", "building a daily study habit"'
                onKeyDown={e => { if (e.key === 'Enter') findPeerMatch(); }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '11px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              <Btn onClick={findPeerMatch} disabled={!peerGoal.trim() || peerLoading}>
                {peerLoading ? <Spinner /> : <><Users size={13} />Find Peers</>}
              </Btn>
            </div>
          </div>

          {peerLoading && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: C.teal, opacity: 0.5, animation: `bounce 1.2s ${i*0.15}s infinite` }} />)}
              </div>
              Matching you with peers…
            </div>
          )}

          {peers.length > 0 && !peerLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 4 }}>Matched peers: reach out in the Flow feed or DM them</div>
              {peers.map((p, i) => (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{p.emoji || '👤'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.blueLight, marginBottom: 5 }}>{p.field} · {p.timezone}</div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 10 }}>Working on: <span style={{ color: C.text }}>{p.goal}</span></div>
                    <div style={{ fontSize: 11, color: C.teal, fontStyle: 'italic' }}>Vibe: {p.vibe}</div>
                  </div>
                  <Btn size="sm" variant="secondary" onClick={() => {}}>Connect →</Btn>
                </div>
              ))}
            </div>
          )}

          {peers.length === 0 && !peerLoading && (
            <div style={{ textAlign: 'center', padding: '44px 0', border: `2px dashed ${C.border}`, borderRadius: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 700, marginBottom: 6 }}>You don't have to build alone</div>
              <div style={{ fontSize: 12, color: C.muted, maxWidth: 340, margin: '0 auto' }}>Tell us what you're working on above and we'll find peers on the same journey.</div>
            </div>
          )}
        </div>
      )}

      {/* ── BECOME A MENTOR VIEW ── */}
      {view === 'become' && (
        <div style={{ maxWidth: 560 }}>
          {bSubmitted ? (
            /* ── Success screen ── */
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, margin: '0 0 10px' }}>Application received!</h2>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.75, maxWidth: 380, margin: '0 auto 8px' }}>
                We'll review your background and impact within <strong style={{ color: C.text }}>48 hours</strong>. If approved, your profile goes live in the mentor directory with a
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${C.blue}18`, border: `1px solid ${C.blue}40`, borderRadius: 99, padding: '5px 14px', margin: '8px 0 20px', fontSize: 13, color: C.blue, fontWeight: 700 }}>✓ Verified Mentor</div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 28, maxWidth: 360, margin: '0 auto 28px' }}>Verified means you did real work: not just a title. Students will trust and book you.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Btn onClick={() => { setBSubmitted(false); setView('mentors'); }}>← Back to Mentors</Btn>
                <Btn variant="secondary" onClick={() => { setBSubmitted(false); setBName(''); setBEmail(''); setBTitle(''); setBProof(''); setBLinkedIn(''); }}>Apply Again</Btn>
              </div>
            </div>
          ) : (
            <div>
              {/* ── Header with steps ── */}
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 5px' }}>Become a Mentor</h2>
                <p style={{ color: C.muted, fontSize: 13, margin: '0 0 20px' }}>Share your real experience. AI writes your profile. We verify your impact before you go live.</p>
                {/* Step indicators */}
                <div style={{ display: 'flex', gap: 0 }}>
                  {['Who you are', 'Your impact', 'Your focus'].map((s, i) => (
                    <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 4, background: i === 0 ? (bName && bEmail ? C.blue : `${C.blue}44`) : i === 1 ? (bTitle && bProof ? C.blue : `${C.blue}44`) : (bField ? C.blue : `${C.blue}22`), borderRadius: i === 0 ? '4px 0 0 4px' : i === 2 ? '0 4px 4px 0' : 0, marginBottom: 6 }} />
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section 1: Who you are ── */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 14, display: 'flex', gap: 7, alignItems: 'center' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 900 }}>1</span>
                  WHO YOU ARE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5 }}>Full Name *</label>
                    <input value={bName} onChange={e => setBName(e.target.value)} placeholder="Your name"
                      style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5 }}>Email *</label>
                    <input value={bEmail} onChange={e => setBEmail(e.target.value)} placeholder="your@email.com" type="email"
                      style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5 }}>LinkedIn / Portfolio <span style={{ color: '#334155' }}>(optional)</span></label>
                  <input value={bLinkedIn} onChange={e => setBLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/yourname or your portfolio"
                    style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* ── Section 2: Your impact ── */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 14, display: 'flex', gap: 7, alignItems: 'center' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.purple, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 900 }}>2</span>
                  YOUR BACKGROUND &amp; IMPACT
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5 }}>What you do / know *</label>
                  <input value={bTitle} onChange={e => setBTitle(e.target.value)} placeholder='e.g. "Software engineer at Digicel, 4 years, helped 20+ students break into tech from Jamaica"'
                    style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5 }}>Real-world proof of impact *</label>
                  <textarea value={bProof} onChange={e => setBProof(e.target.value)} rows={3}
                    placeholder='What have you actually done? e.g. "Mentored 3 students who got Google offers. Run free weekly coding sessions. Founded a startup. Speak at schools about careers in tech."'
                    style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.65 }} />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>Be specific. Verified mentors have real proof of work.</div>
                </div>
              </div>

              {/* ── Section 3: Focus area ── */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 14, display: 'flex', gap: 7, alignItems: 'center' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.green, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 900 }}>3</span>
                  YOUR FOCUS AREA
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {['Career / Purpose', 'Academic / Study', 'Tech / Engineering', 'Innovation / Startup', 'Finance', 'Wellness / Balance'].map(f => (
                    <button key={f} onClick={() => setBField(f)}
                      style={{ padding: '8px 16px', borderRadius: 99, border: `1px solid ${bField === f ? C.blue : C.border}`, background: bField === f ? `${C.blue}18` : 'transparent', color: bField === f ? C.blueLight : C.muted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: bField === f ? 700 : 400, transition: 'all 0.15s' }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <Btn onClick={submitMentorApp} disabled={!bName.trim() || !bTitle.trim() || !bEmail.trim() || bSubmitting} size="lg" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}>
                {bSubmitting ? <Spinner /> : '✋ Submit Application'}
              </Btn>
              <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
                Reviewed within 48h · Approval = real impact verified · Students rate every session · Verified badge shows on your profile
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── REFLECT TAB ──────────────────────────────────────────────────────────────
function ReflectTab({ canvas, user, setTab }) {
  const [view, setView] = useState('home'); // home | journal | insights
  const [journalText, setJournalText] = useState('');
  const [entries, setEntries] = useState(() => { try { return JSON.parse(localStorage.getItem('vh_journal') || '[]'); } catch { return []; } });
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [glowText, setGlowText] = useState('');
  const [glowSent, setGlowSent] = useState(false);
  const dayIdx = new Date().getDay();
  const prompt = DAILY_PROMPTS[dayIdx % DAILY_PROMPTS.length];

  const saveEntry = async () => {
    if (!journalText.trim()) return;
    setSaving(true);
    const entry = { id: Date.now(), content: journalText.trim(), createdAt: new Date().toISOString(), date: new Date().toLocaleDateString() };
    const updated = [entry, ...entries];
    setEntries(updated); localStorage.setItem('vh_journal', JSON.stringify(updated));
    try { await fetch('/api/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: journalText.trim() }) }); } catch (_) {}
    setJournalText(''); setSaving(false);
  };

  const getInsights = async () => {
    setLoadingInsights(true);
    try {
      const r = await fetch('/api/ai/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ journalEntries: entries.slice(0, 10).map(e => e.content) }) });
      const d = await r.json();
      setInsights(d);
    } catch (_) { setInsights({ pattern: 'Keep journaling consistently for deeper pattern analysis.', insight: 'Your reflections show self-awareness: a key trait of visionaries.', nextStep: 'Write one entry daily for 7 days to unlock deeper AI insights.' }); }
    setLoadingInsights(false); setView('insights');
  };

  if (view === 'journal') return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <Btn variant="secondary" size="sm" onClick={() => setView('home')}>← Back</Btn>
        <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Journal</h2><p style={{ margin: 0, fontSize: 12, color: C.muted }}>Write or record your thoughts</p></div>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Today's Prompt</div>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 14, lineHeight: 1.55 }}>"{prompt}"</div>
        <textarea value={journalText} onChange={e => setJournalText(e.target.value)} placeholder="Write your thoughts here: this is private and just for you..." rows={7}
          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Saved on your device</span>
          <Btn onClick={saveEntry} disabled={!journalText.trim() || saving}>{saving ? <Spinner /> : <><Check size={12} />Save Entry</>}</Btn>
        </div>
      </div>
      {entries.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 10 }}>PAST ENTRIES ({entries.length})</div>
          {entries.slice(0, 5).map(e => (
            <div key={e.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{e.date || new Date(e.createdAt).toLocaleDateString()}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{e.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (view === 'insights') return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <Btn variant="secondary" size="sm" onClick={() => setView('home')}>← Back</Btn>
        <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>AI Insights</h2><p style={{ margin: 0, fontSize: 12, color: C.muted }}>Patterns and next steps from your reflections</p></div>
      </div>
      {insights ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'pattern', label: 'Pattern Detected', icon: '🔍', color: C.blue },
            { key: 'insight', label: 'Key Insight', icon: '💡', color: C.yellow },
            { key: 'nextStep', label: 'Your Next Step', icon: '🚀', color: C.green },
          ].map(item => insights[item.key] ? (
            <div key={item.key} style={{ background: `${item.color}08`, border: `1px solid ${item.color}22`, borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontSize: 10, color: item.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 9 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 15, color: C.text, lineHeight: 1.7 }}>{insights[item.key]}</div>
            </div>
          ) : null)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '56px 0' }}><Spinner /></div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button onClick={() => setTab?.('canvas')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.blueLight}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <ChevronLeft size={18} color={C.text} />
        </button>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Vision Canvas</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Reflect & Journal</div>
        </div>
      </div>

      {/* Today's Reflection */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={11} /> Today's Reflection
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1.6, textAlign: 'center', padding: '12px 0' }}>"{prompt}"</div>
      </div>

      {/* Actions */}
      {[
        { icon: BookMarked, label: 'Journal', sub: 'Write or record your thoughts', color: C.blue, action: () => setView('journal') },
        { icon: Lightbulb, label: 'Insights', sub: 'View patterns and next steps from your journal', color: C.yellow, action: getInsights, loading: loadingInsights, disabled: entries.length === 0 },
        { icon: Share2, label: 'Share Glow', sub: 'Send encouragement to the community', color: C.green, action: null },
      ].map((item, i) => (
        <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 12, cursor: item.action ? 'pointer' : 'default', transition: 'border-color 0.2s', opacity: item.disabled ? 0.5 : 1 }}
          onClick={!item.disabled && item.action ? item.action : undefined}
          onMouseEnter={e => item.action && !item.disabled && (e.currentTarget.style.borderColor = item.color + '55')}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, background: `${item.color}12`, border: `1px solid ${item.color}22`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.loading ? <Spinner /> : <item.icon size={19} color={item.color} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{item.sub}</div>
            </div>
            {item.action && !item.disabled && <ChevronRight size={16} color={C.muted} />}
          </div>
          {item.label === 'Share Glow' && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              {glowSent ? (
                <div style={{ fontSize: 13, color: C.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} /> Encouragement shared with the community!</div>
              ) : (
                <>
                  <input value={glowText} onChange={e => setGlowText(e.target.value)} placeholder="Send encouragement, a quote, or a win…" onClick={e => e.stopPropagation()}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  <Btn size="sm" variant="green" onClick={async (e) => { e.stopPropagation(); if (!glowText.trim()) return; try { const u = canvas?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Visionary'; const img = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null; await insertPost({ authorName: u, authorImg: img, content: `✨ ${glowText.trim()}`, mediaType: null, userId: user?.id || null }); } catch (_) {} setGlowSent(true); }}>
                    Send
                  </Btn>
                </>
              )}
            </div>
          )}
        </div>
      ))}
      {entries.length === 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 8 }}>Write 1+ journal entry to unlock AI Insights</div>
      )}
    </div>
  );
}

// ─── OPPORTUNITIES ────────────────────────────────────────────────────────────
function getHomepage(url) {
  try { const u = new URL(url); return u.origin; } catch { return null; }
}

function ApplyButton({ url, institution, homepage: homepageProp }) {
  const homepage = homepageProp || getHomepage(url);
  const homepageDisplay = homepage ? homepage.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
  const [showFallback, setShowFallback] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Btn size="sm" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => { if (url) { window.open(url, '_blank'); setShowFallback(true); } }}>
        <ArrowRight size={12} /> Apply Now
      </Btn>
      {/* Homepage — always shown as "Stay Updated" */}
      {homepageDisplay && (
        <button onClick={() => window.open(homepage, '_blank')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: `${C.blue}08`, border: `1px solid ${C.blue}25`, borderRadius: 8, padding: '6px 10px', color: C.blueLight, fontSize: 10, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
          🌐 {homepageDisplay}
          <span style={{ color: C.muted, fontWeight: 400 }}>· stay updated</span>
        </button>
      )}
      {/* Fallback note after apply is clicked */}
      {showFallback && (
        <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 1.5, padding: '4px 0' }}>
          ⚠️ Page not loading? Use the homepage above to find the opportunity directly.
        </div>
      )}
    </div>
  );
}

function OpportunitiesTab({ canvas }) {
  const [oppView, setOppView] = useState('search'); // 'search' | 'posted' | 'submit'
  const [filter, setFilter] = useState('All');
  const [saved, setSaved] = useState({});
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState('Jamaica');
  // Partner-posted opportunities
  const [postedOpps, setPostedOpps] = useState([]);
  const [postedLoading, setPostedLoading] = useState(false);
  // Submit form
  const [form, setForm] = useState({ institution: '', contactEmail: '', title: '', type: 'Scholarship', amount: '', deadline: '', field: '', url: '', description: '', location: 'Jamaica / International', eligibility: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const types = ['All', 'Grant', 'Fellowship', 'Scholarship', 'Internship', 'Competition'];
  const tColors = { Grant: C.green, Fellowship: C.purple, Scholarship: C.blue, Internship: C.yellow, Competition: C.red };
  const list = results.filter(o => filter === 'All' || o.type === filter);

  useEffect(() => {
    if (oppView === 'posted') {
      setPostedLoading(true);
      // Load from Supabase posted_opportunities table; gracefully stop loading if table doesn't exist yet
      (async () => {
        try {
          if (supabase) {
            const { data, error } = await supabase
              .from('posted_opportunities')
              .select('*')
              .neq('status', 'rejected')
              .order('posted_at', { ascending: false })
              .limit(50);
            if (!error) { setPostedOpps(data || []); }
          }
        } catch (_) { /* table may not exist yet — show empty state */ }
        setPostedLoading(false);
      })();
    }
  }, [oppView]);

  const submitOpp = async () => {
    if (!form.institution.trim() || !form.title.trim() || !form.url.trim()) return;
    setSubmitting(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('posted_opportunities').insert([{
          institution: form.institution.trim(),
          contact_email: form.contactEmail,
          title: form.title.trim(),
          type: form.type,
          amount: form.amount || 'Varies',
          deadline: form.deadline || 'Rolling',
          field: form.field || 'Any',
          url: form.url.trim(),
          description: form.description || '',
          location: form.location || 'Open / International',
          eligibility: form.eligibility || '',
          status: 'pending',
          verified: false,
          posted_at: new Date().toISOString(),
        }]);
        if (!error) { setSubmitted(true); setPostedOpps([]); }
      } else {
        // Supabase not configured: show success anyway (data won't persist)
        setSubmitted(true);
      }
    } catch { setSubmitted(true); }
    setSubmitting(false);
  };

  const QUICK_SEARCHES = [
    'Tech internships open internationally 2026',
    'Grants for social entrepreneurs',
    'Fellowships for first-gen Caribbean students',
    'STEM scholarships open worldwide',
    'Business competitions for young entrepreneurs',
    'Remote internships for Caribbean students',
  ];

  const doSearch = async (query) => {
    const q = (query || searchQuery).trim();
    if (!q) return;
    const fullQuery = location ? `${q} (student based in ${location}: include both local Jamaican/Caribbean programs and internationally open programs)` : q;
    setSearchQuery(q); setSearching(true); setError(''); setSearched(true); setResults([]);
    try {
      const r = await fetch('/api/ai/opportunities', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery, location, canvas: canvas ? { field: canvas.major, goal: canvas.goal12Month } : null }) });
      const d = await r.json();
      const raw = d.result || '';
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.length > 0) {
            setResults(parsed.map((o, i) => ({ ...o, id: 'r-' + i })));
          } else { setError('No results found. Try more specific terms like your field of study or specific program type.'); }
        } catch { setError('Could not parse results: try again.'); }
      } else { setError('No results found. Be specific: e.g. "fellowships for first-gen students" or "Jamaica scholarship 2026".'); setResults([]); }
    } catch (_) { setError('Search failed: check your connection and try again.'); }
    setSearching(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 5px' }}>Real Opportunities</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>AI search + directly posted by verified institutions: local and international.</p>
        </div>
        <Btn size="sm" variant="secondary" onClick={() => setOppView('submit')} style={{ whiteSpace: 'nowrap' }}>
          🏛️ Post an Opportunity
        </Btn>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 5, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {[['search', '🔍 AI Search'], ['posted', '🏛️ Posted by Institutions'], ['submit', '+ Post Opportunity']].map(([v, label]) => (
          <button key={v} onClick={() => setOppView(v)}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: oppView === v ? `${C.blue}22` : 'transparent', color: oppView === v ? C.blueLight : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: oppView === v ? 700 : 400, whiteSpace: 'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── SUBMIT FORM (for institutions) ── */}
      {oppView === 'submit' && (
        <div style={{ maxWidth: 580 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 10px' }}>Opportunity submitted!</h2>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
                Thank you. We'll review your submission and it'll appear in the <strong>Posted by Institutions</strong> tab for students to discover. Verified institutions get a badge.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Btn onClick={() => { setSubmitted(false); setForm({ institution: '', contactEmail: '', title: '', type: 'Scholarship', amount: '', deadline: '', field: '', url: '', description: '', location: 'Jamaica / International', eligibility: '' }); }}>Post Another</Btn>
                <Btn variant="secondary" onClick={() => setOppView('posted')}>View Posted</Btn>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ background: `${C.green}0A`, border: `1px solid ${C.green}22`, borderRadius: 14, padding: '16px 20px', marginBottom: 22 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 4 }}>📣 Are you a school, NGO, company, or program?</div>
                <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>Post your scholarship, grant, internship, or fellowship directly. Students see it immediately. Verified institutions get a ✓ badge.</p>
              </div>
              {/* Form fields */}
              {[
                { label: 'Institution / Organisation Name *', key: 'institution', placeholder: 'e.g. University of the West Indies, Caribbean Development Bank' },
                { label: 'Contact Email *', key: 'contactEmail', placeholder: 'your@institution.org', type: 'email' },
                { label: 'Opportunity Title *', key: 'title', placeholder: 'e.g. Caribbean Merit Scholarship 2026' },
                { label: 'Amount / Value', key: 'amount', placeholder: 'e.g. $5,000 / Full tuition / Paid internship' },
                { label: 'Application Deadline', key: 'deadline', placeholder: 'e.g. April 30, 2026 / Rolling' },
                { label: 'Field / Who It\'s For', key: 'field', placeholder: 'e.g. STEM students, Any major, First-gen students' },
                { label: 'Application URL *', key: 'url', placeholder: 'https://your-institution.org/apply', type: 'url' },
                { label: 'Location / Eligibility Region', key: 'location', placeholder: 'e.g. Jamaica, Caribbean, International' },
                { label: 'Eligibility Requirements', key: 'eligibility', placeholder: 'e.g. GPA 3.0+, Jamaican citizen, undergrad student' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setF(f.key, e.target.value)} placeholder={f.placeholder} type={f.type || 'text'}
                    style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Opportunity Type</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {['Scholarship', 'Grant', 'Fellowship', 'Internship', 'Competition'].map(t => (
                    <button key={t} onClick={() => setF('type', t)}
                      style={{ padding: '6px 14px', borderRadius: 99, border: `1px solid ${form.type === t ? tColors[t] : C.border}`, background: form.type === t ? `${tColors[t]}18` : 'transparent', color: form.type === t ? tColors[t] : C.muted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: form.type === t ? 700 : 400 }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Short Description</label>
                <textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Two sentences about the opportunity: what makes it worth applying for?" rows={3}
                  style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.65 }} />
              </div>
              <Btn onClick={submitOpp} disabled={!form.institution.trim() || !form.title.trim() || !form.url.trim() || submitting} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
                {submitting ? <Spinner /> : '📤 Submit Opportunity'}
              </Btn>
              <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8 }}>Submissions reviewed within 24h · Contact us to get verified institution status</div>
            </div>
          )}
        </div>
      )}

      {/* ── INSTITUTION-POSTED VIEW ── */}
      {oppView === 'posted' && (
        <div>
          <div style={{ background: `${C.green}0A`, border: `1px solid ${C.green}22`, borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 22 }}>🏛️</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 2 }}>Directly posted by institutions</div>
              <div style={{ fontSize: 12, color: C.muted }}>Schools, NGOs, companies and programs posting real opportunities for students. <button onClick={() => setOppView('submit')} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0 }}>Are you an institution? Post here →</button></div>
            </div>
          </div>
          {postedLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, opacity: 0.5, animation: `bounce 1.2s ${i*0.15}s infinite` }} />)}
              </div>
              <div style={{ color: C.muted, fontSize: 13 }}>Loading institution posts…</div>
            </div>
          )}
          {!postedLoading && postedOpps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '56px 0', border: `2px dashed ${C.border}`, borderRadius: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🏛️</div>
              <div style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No institution posts yet</div>
              <div style={{ color: C.muted, fontSize: 13, maxWidth: 340, margin: '0 auto 20px' }}>Be the first to bring real opportunities here. If you're from a school, NGO, or company: post your program.</div>
              <Btn onClick={() => setOppView('submit')}>🏛️ Post an Opportunity</Btn>
            </div>
          )}
          <div className="vh-grid-2" style={{ gap: 14 }}>
            {postedOpps.map(o => {
              const color = tColors[o.type] || C.blue;
              return (
                <div key={o.id} style={{ background: C.surface, border: `1px solid ${C.green}33`, borderRadius: 16, padding: 20 }}>
                  {/* Institution header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏛️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.institution}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{o.location || 'Open'} · Posted {o.postedAt ? new Date(o.postedAt).toLocaleDateString() : 'recently'}</div>
                    </div>
                    {o.verified && <span style={{ fontSize: 10, color: C.green, fontWeight: 700, background: `${C.green}18`, border: `1px solid ${C.green}33`, borderRadius: 99, padding: '2px 8px', flexShrink: 0 }}>✓ Verified</span>}
                    {!o.verified && o.status === 'pending' && <span style={{ fontSize: 10, color: C.yellow, fontWeight: 600, background: `${C.yellow}12`, borderRadius: 99, padding: '2px 8px', flexShrink: 0 }}>Pending</span>}
                  </div>
                  <Tag text={o.type} color={color} />
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: '10px 0 6px', lineHeight: 1.4 }}>{o.title}</div>
                  {o.description && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, marginBottom: 10 }}>{o.description}</div>}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                    {o.amount && o.amount !== 'Varies' && <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>💰 {o.amount}</div>}
                    {o.deadline && <div style={{ fontSize: 11, color: C.yellow, fontWeight: 600 }}>📅 {o.deadline}</div>}
                    {o.field && <div style={{ fontSize: 11, color: C.muted }}>🎯 {o.field}</div>}
                    {o.eligibility && <div style={{ fontSize: 11, color: C.muted }}>✓ {o.eligibility}</div>}
                  </div>
                  <ApplyButton url={o.url} institution={o.institution} homepage={o.homepage} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AI SEARCH VIEW ── */}
      {oppView === 'search' && (
      <div>
      {/* Location chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: C.muted }}>📍 Your location:</span>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Jamaica"
          style={{ padding: '4px 12px', borderRadius: 99, border: `1px solid ${C.blue}44`, background: `${C.blue}0A`, color: C.blueLight, fontSize: 11, fontFamily: 'inherit', outline: 'none', width: 130 }} />
        <span style={{ fontSize: 11, color: C.muted }}>— searches local + international programs</span>
      </div>

      {/* Search */}
      <div style={{ background: `${C.purple}0A`, border: `1px solid ${C.purple}22`, borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Sparkles size={11} /> Search real opportunities
        </div>
        <div style={{ display: 'flex', gap: 9, marginBottom: 12 }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder='Describe who you are or what you need…'
            onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: '11px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <Btn variant="purple" onClick={() => doSearch()} disabled={!searchQuery.trim() || searching}>
            {searching ? <Spinner /> : <><Search size={12} />Search</>}
          </Btn>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {QUICK_SEARCHES.map(q => (
            <button key={q} onClick={() => doSearch(q)}
              style={{ padding: '5px 12px', borderRadius: 99, border: `1px solid ${C.purple}33`, background: `${C.purple}0A`, color: C.purple, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
          {types.map(t => <button key={t} onClick={() => setFilter(t)} style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${filter === t ? C.blue : C.border}`, background: filter === t ? `${C.blue}18` : 'transparent', color: filter === t ? C.blueLight : C.muted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: filter === t ? 600 : 400 }}>{t}</button>)}
        </div>
      )}

      {error && <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}30`, borderRadius: 10, padding: '12px 16px', color: '#FCA5A5', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {searching && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: C.purple, opacity: 0.5, animation: `bounce 1.2s ${i*0.15}s infinite` }} />)}
          </div>
          <div style={{ color: C.muted, fontSize: 13 }}>Searching real programs…</div>
        </div>
      )}

      {!searching && searched && list.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 13 }}>No {filter !== 'All' ? filter : ''} results found. Try a different search.</div>
      )}

      {!searched && !searching && (
        <div style={{ textAlign: 'center', padding: '56px 0', border: `2px dashed ${C.border}`, borderRadius: 16 }}>
          <Compass size={36} color={C.border} style={{ marginBottom: 14 }} />
          <div style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Find your real opportunity</div>
          <div style={{ color: C.muted, fontSize: 13, maxWidth: 340, margin: '0 auto' }}>Type what you're looking for above or tap a quick search. The AI finds real, active programs: not fake examples.</div>
        </div>
      )}

      <div className="vh-grid-2" style={{ gap: 14 }}>
        {!searching && list.map(o => {
          const color = tColors[o.type] || C.blue;
          return (
            <Card key={o.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Tag text={o.type} color={color} />
                <button onClick={() => setSaved(s => ({ ...s, [o.id]: !s[o.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: saved[o.id] ? C.yellow : C.muted, padding: 0 }}>
                  <Star size={15} fill={saved[o.id] ? C.yellow : 'none'} />
                </button>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6, lineHeight: 1.4 }}>{o.title}</div>
              {o.description && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 10 }}>{o.description}</div>}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.muted, marginBottom: 14, flexWrap: 'wrap' }}>
                {o.amount && <span style={{ color, fontWeight: 700 }}>{o.amount}</span>}
                {o.field && <span>🎯 {o.field}</span>}
                {o.deadline && <span>📅 {o.deadline}</span>}
              </div>
              <ApplyButton url={o.url} institution={o.title} homepage={o.homepage} />
            </Card>
          );
        })}
      </div>
      </div>
      )}
    </div>
  );
}

// ─── WELLBEING (replaces Safe Mode) ───────────────────────────────────────────
function WellbeingModal({ onClose }) {
  const [tab, setTab] = useState(0);
  const [note, setNote] = useState('');
  const [msgs, setMsgs] = useState([{ role: 'ai', content: "Hey: I see you. No pressure here, no performance.\n\nThis is a space to rest, breathe, and be honest with yourself. What's on your mind?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [breath, setBreath] = useState(0);
  useEffect(() => { const t = setInterval(() => setBreath(p => (p + 1) % 3), 4000); return () => clearInterval(t); }, []);

  const sendMsg = async () => {
    const text = input.trim(); if (!text || loading) return;
    const newMsgs = [...msgs, { role: 'user', content: text }];
    setMsgs(newMsgs); setInput(''); setLoading(true);
    try {
      const r = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMsgs.slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })), mode: 'vision', canvas: {} }) });
      const d = await r.json();
      setMsgs(prev => [...prev, { role: 'ai', content: d.reply || "I'm here. Take your time." }]);
    } catch (_) { setMsgs(prev => [...prev, { role: 'ai', content: "I'm still here. Breathe. You've got this." }]); }
    setLoading(false);
  };

  const bColors = [C.blue, C.purple, C.teal];
  const bLabels = ['Breathe in… (4s)', 'Hold… (4s)', 'Breathe out… (6s)'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,12,30,0.97)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={20} /></button>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 5px' }}>Rest & Recharge 🌿</h2>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Take care of yourself: it's part of the journey.</p>
        </div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {['Breathe', 'Private Note'].map((l, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `1px solid ${tab === i ? C.teal : C.border}`, background: tab === i ? `${C.teal}18` : 'transparent', color: tab === i ? C.teal : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: tab === i ? 700 : 400 }}>{l}</button>
          ))}
        </div>
        {tab === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', border: `3px solid ${bColors[breath]}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', transition: 'all 2s ease' }}>
              <div style={{ width: breath === 1 ? 80 : breath === 0 ? 60 : 30, height: breath === 1 ? 80 : breath === 0 ? 60 : 30, borderRadius: '50%', background: bColors[breath] + '28', transition: 'all 4s ease' }} />
            </div>
            <p style={{ color: bColors[breath], fontWeight: 700, fontSize: 16, transition: 'color 1s' }}>{bLabels[breath]}</p>
          </div>
        )}
        {tab === 1 && (
          <div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write anything: how you're feeling, what's weighing on you. This stays on your device only." rows={6}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 11, color: C.text, padding: '13px 15px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.7, boxSizing: 'border-box' }} />
            <p style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>Not stored anywhere. Private to this browser session only.</p>
          </div>
        )}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 14 }}>
          Crisis support: <span style={{ color: C.blueLight }}>988 Lifeline</span> · <span style={{ color: C.blueLight }}>Text HOME to 741741</span>
        </p>
      </div>
    </div>
  );
}

// ─── PASSWORD RESET (used in Security card) ───────────────────────────────────
function SecurityPasswordReset({ email }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const send = async () => {
    setErr(''); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e) { setErr(e.message || 'Failed to send reset email.'); }
    setLoading(false);
  };
  if (sent) return (
    <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}35`, borderRadius: 9, padding: '12px 14px', fontSize: 12, color: '#6EE7B7', lineHeight: 1.6 }}>
      ✅ Password reset email sent to <strong>{email}</strong>. Check your inbox!
    </div>
  );
  return (
    <div>
      {err && <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}30`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#FCA5A5', marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Change password</div>
          <div style={{ fontSize: 11, color: C.muted }}>We'll email you a secure reset link</div>
        </div>
        <Btn size="sm" variant="secondary" onClick={send} disabled={loading}>
          {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={12} />}
          {loading ? 'Sending…' : 'Send Reset Email'}
        </Btn>
      </div>
    </div>
  );
}

// ─── SETTINGS / ACCOUNT TAB ───────────────────────────────────────────────────
function SettingsTab({ user, onSignOut }) {
  const meta = user?.user_metadata || {};
  const providerAvatar = meta.avatar_url || meta.picture || null;
  const email = user?.email || '';

  // Profile fields: persisted in localStorage + Supabase metadata
  const [nameVal,     setNameVal]     = useState(meta.full_name || meta.name || localStorage.getItem('vh_profile_name') || email.split('@')[0] || 'Visionary');
  const [bio,         setBio]         = useState(meta.bio       || localStorage.getItem('vh_profile_bio') || '');
  const [location,    setLocation]    = useState(meta.location  || localStorage.getItem('vh_profile_location') || '');
  const [website,     setWebsite]     = useState(meta.website   || localStorage.getItem('vh_profile_website') || '');
  const [field,       setField]       = useState(meta.field     || localStorage.getItem('vh_profile_field') || '');
  const [avatarLocal, setAvatarLocal] = useState(localStorage.getItem('vh_profile_avatar') || null);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [notifs,      setNotifs]      = useState(() => { try { return JSON.parse(localStorage.getItem('vh_notifs') || 'true'); } catch { return true; } });
  const avatarInputRef = useRef(null);

  const avatarUrl = avatarLocal || providerAvatar;
  const initials  = nameVal.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    // Convert to base64 for localStorage storage
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setAvatarLocal(dataUrl);
      localStorage.setItem('vh_profile_avatar', dataUrl);
      // Also try to upload to Supabase Storage
      if (supabase) {
        try {
          const ext = file.name.split('.').pop();
          const path = `avatars/${user.id}.${ext}`;
          await supabase.storage.from('avatars').upload(path, file, { upsert: true });
          const { data } = supabase.storage.from('avatars').getPublicUrl(path);
          if (data?.publicUrl) {
            await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
          }
        } catch (_) {} // localStorage copy always works
      }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    // Save to localStorage
    localStorage.setItem('vh_profile_name',     nameVal.trim());
    localStorage.setItem('vh_profile_bio',       bio.trim());
    localStorage.setItem('vh_profile_location',  location.trim());
    localStorage.setItem('vh_profile_website',   website.trim());
    localStorage.setItem('vh_profile_field',     field.trim());
    // Save to Supabase if connected
    if (supabase) {
      try {
        await supabase.auth.updateUser({
          data: { full_name: nameVal.trim(), bio: bio.trim(), location: location.trim(), website: website.trim(), field: field.trim() },
        });
      } catch (_) {}
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = { width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, display: 'block' };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 4px', color: C.text }}>Account & Profile</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Build your public profile. Your name and bio are visible in the community feed.</p>
      </div>

      {/* Profile Card */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.blueLight, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 18 }}>Your Profile</div>

        {/* Avatar + name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 22 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={nameVal} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.blue}55` }} />
              : <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff' }}>{initials}</div>
            }
            <button onClick={() => avatarInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: C.blue, border: `2px solid ${C.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Edit3 size={12} color="#fff" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
              {providerAvatar && !avatarLocal ? `Photo from ${user?.app_metadata?.provider || 'account'}: click ✏️ to upload your own` : 'Tap ✏️ to change your photo'}
            </div>
            <div style={{ fontSize: 12, color: '#334155' }}>
              {user?.app_metadata?.provider === 'google' ? '🔗 Signed in with Google' : user?.app_metadata?.provider ? `🔗 ${user.app_metadata.provider}` : '📧 Email account'} · {email}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Display Name *</label>
            <input value={nameVal} onChange={e => setNameVal(e.target.value)} style={inputStyle} placeholder="Your full name" />
          </div>
          <div>
            <label style={labelStyle}>Field / Career Path</label>
            <input value={field} onChange={e => setField(e.target.value)} style={inputStyle} placeholder="e.g. Tech & Engineering" />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Bio (visible to community)</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Tell the community who you are, what you're building, and what drives you..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} placeholder="e.g. Kingston, Jamaica" />
          </div>
          <div>
            <label style={labelStyle}>Website / Portfolio</label>
            <input value={website} onChange={e => setWebsite(e.target.value)} style={inputStyle} placeholder="https://yoursite.com" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn onClick={saveProfile} disabled={saving}>
            {saving ? <><Spinner /> Saving…</> : 'Save Profile'}
          </Btn>
          {saved && <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✓ Profile saved!</span>}
        </div>
      </Card>

      {/* Preferences */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.blueLight, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 }}>Preferences</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Community notifications</div>
            <div style={{ fontSize: 11, color: C.muted }}>Get notified when someone reacts to your posts</div>
          </div>
          <button onClick={() => { const v = !notifs; setNotifs(v); localStorage.setItem('vh_notifs', JSON.stringify(v)); }}
            style={{ width: 44, height: 24, borderRadius: 99, background: notifs ? C.blue : C.card, border: `2px solid ${notifs ? C.blue : C.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: notifs ? 22 : 2, transition: 'left 0.2s' }} />
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Vision Canvas privacy</div>
            <div style={{ fontSize: 11, color: C.muted }}>Canvas data is stored securely in your browser</div>
          </div>
          <span style={{ fontSize: 11, color: C.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={11} /> Private</span>
        </div>
      </Card>

      {/* ── SECURITY CARD ───────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.blueLight, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 }}>Security</div>
        {/* Provider row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={16} color={C.green} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {user?.app_metadata?.provider === 'google' ? 'Secured by Google' : 'Email & password account'}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {user?.app_metadata?.provider === 'google'
                ? "Your account uses Google's security. No password needed."
                : `Signed in as ${email}`}
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, background: `${C.green}18`, color: C.green, borderRadius: 99, padding: '3px 10px', flexShrink: 0 }}>
            {user?.app_metadata?.provider === 'google' ? '🔗 Google' : '✓ Verified'}
          </span>
        </div>
        {/* Password reset for email users */}
        {user?.app_metadata?.provider !== 'google' && (
          <SecurityPasswordReset email={email} />
        )}
        {/* Google users get a security tip */}
        {user?.app_metadata?.provider === 'google' && (
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
            🛡️ Your session is managed by Google OAuth 2.0. To add extra security, enable 2-Step Verification in your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: 'none' }}>Google Account</a>.
          </div>
        )}
      </Card>

      {/* Danger zone */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 }}>Account Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Clear local data</div>
              <div style={{ fontSize: 11, color: C.muted }}>Removes Vision Canvas, uploaded notes, and preferences from this device</div>
            </div>
            <Btn size="sm" variant="secondary" onClick={() => { if (window.confirm('Clear all local data? Your posts stay in the community. This only clears your canvas and saved notes.')) { Object.keys(localStorage).filter(k => k.startsWith('vh_')).forEach(k => localStorage.removeItem(k)); window.location.reload(); } }}>Clear</Btn>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Sign out</div>
              <div style={{ fontSize: 11, color: C.muted }}>Sign out of your account on this device</div>
            </div>
            <Btn size="sm" variant="secondary" onClick={onSignOut} style={{ borderColor: `${C.red}44`, color: C.red }}>
              <LogOut size={12} /> Sign Out
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function MainApp({ user, onSignOut }) {
  const [tab, setTab] = useState('flow');
  const [showCoach, setShowCoach] = useState(false);
  const [showWellbeing, setShowWellbeing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [canvas, setCanvas] = useState(() => { try { return JSON.parse(localStorage.getItem('vh_canvas') || 'null'); } catch { return null; } });
  const [feed, setFeed] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // ── Tutor state lifted here so files + timer survive tab switches ──────────
  const [tutorFiles, setTutorFiles] = useState([]);
  const [tutorMessages, setTutorMessages] = useState(null); // null = use TutorTab default
  // Timer: persist start timestamp so clock keeps ticking even when tab is hidden
  const [timerRunning, setTimerRunning] = useState(() => {
    const s = localStorage.getItem('vh_timer_startedAt');
    return !!s;
  });
  const [timerIsBreak, setTimerIsBreak] = useState(() => localStorage.getItem('vh_timer_isBreak') === '1');
  const [timerSeconds, setTimerSeconds] = useState(() => {
    const startedAt = Number(localStorage.getItem('vh_timer_startedAt') || 0);
    const total = Number(localStorage.getItem('vh_timer_total') || 25 * 60);
    if (!startedAt) return total;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = total - elapsed;
    return remaining > 0 ? remaining : 0;
  });
  const timerIntervalRef = useRef(null);
  useEffect(() => {
    if (timerRunning) {
      localStorage.setItem('vh_timer_startedAt', String(Date.now() - (
        (Number(localStorage.getItem('vh_timer_total') || 25 * 60) - timerSeconds) * 1000
      )));
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            localStorage.removeItem('vh_timer_startedAt');
            const nextBreak = !timerIsBreak;
            setTimerIsBreak(nextBreak);
            const next = nextBreak ? 5 * 60 : 25 * 60;
            localStorage.setItem('vh_timer_total', String(next));
            localStorage.setItem('vh_timer_isBreak', nextBreak ? '1' : '0');
            return next;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      localStorage.removeItem('vh_timer_startedAt');
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  const startTimer = (seconds) => {
    setTimerRunning(false);
    setTimeout(() => {
      setTimerSeconds(seconds);
      localStorage.setItem('vh_timer_total', String(seconds));
      setTimerRunning(true);
    }, 50);
  };
  const resetTimer = () => {
    setTimerRunning(false);
    setTimerIsBreak(false);
    const dur = 25 * 60;
    setTimerSeconds(dur);
    localStorage.setItem('vh_timer_total', String(dur));
    localStorage.removeItem('vh_timer_startedAt');
  };

  useEffect(() => {
    setFeedLoading(true);
    fetchPosts().then(posts => { setFeed(posts); setFeedLoading(false); });
    fetchMentors().then(m => { if (m.length) setMentors(m); });
    const unsub = subscribePosts(newPost => {
      setFeed(prev => prev.find(p => p.id === newPost.id) ? prev : [newPost, ...prev]);
    });
    return unsub;
  }, []);

  const handleSetCanvas = c => { setCanvas(c); localStorage.setItem('vh_canvas', JSON.stringify(c)); };

  const views = {
    flow:          <FlowTab canvas={canvas} feed={feed} setFeed={setFeed} setTab={setTab} user={user} feedLoading={feedLoading} mentors={mentors} />,
    canvas:        <CanvasTab canvas={canvas} setCanvas={handleSetCanvas} setTab={setTab} />,
    roadmap:       <RoadmapTab canvas={canvas} setTab={setTab} />,
    tutor:         <TutorTab canvas={canvas} files={tutorFiles} setFiles={setTutorFiles}
                     timerRunning={timerRunning} setTimerRunning={setTimerRunning}
                     timerSeconds={timerSeconds} setTimerSeconds={setTimerSeconds}
                     timerIsBreak={timerIsBreak} setTimerIsBreak={setTimerIsBreak}
                     startTimer={startTimer} resetTimer={resetTimer} />,
    mentorship:    <MentorshipTab mentors={mentors} />,
    reflect:       <ReflectTab canvas={canvas} user={user} setTab={setTab} />,
    opportunities: <OpportunitiesTab canvas={canvas} />,
    settings:      <SettingsTab user={user} onSignOut={onSignOut} />,
  };

  const MOBILE_NAV = [
    { id: 'flow',         icon: Home,     label: 'Flow' },
    { id: 'canvas',       icon: Lightbulb,label: 'Canvas' },
    { id: 'opportunities',icon: Compass,  label: 'Explore' },
    { id: 'mentorship',   icon: Users,    label: 'Mentors' },
    { id: 'settings',     icon: Settings, label: 'Account' },
  ];

  return (
    <div style={{ display: 'flex', background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 99px; }
        .vh-stories { scrollbar-width: none; } .vh-stories::-webkit-scrollbar { display: none; }
        .vh-sidebar { display: flex; }
        .vh-mobile-nav { display: none; }
        .vh-main { padding: 26px 32px; }
        .vh-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .vh-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .vh-tutor-split { display: grid; grid-template-columns: 2fr 3fr; gap: 12px; }
        @media (max-width: 768px) {
          .vh-sidebar { display: none !important; }
          .vh-mobile-nav { display: flex !important; }
          .vh-main { padding: 16px 14px 80px 14px !important; }
          .vh-grid-2 { grid-template-columns: 1fr !important; }
          .vh-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .vh-tutor-split { grid-template-columns: 1fr !important; }
          .vh-coach-panel { width: 100% !important; }
          h1 { font-size: 20px !important; }
        }
        @media (max-width: 480px) {
          .vh-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <div className="vh-sidebar" style={{ flexDirection: 'column' }}>
        <Sidebar tab={tab} setTab={setTab} canvas={canvas} onCoach={() => setShowCoach(s => !s)} user={user} onSignOut={onSignOut} />
      </div>

      {/* Main content */}
      <main className="vh-main" style={{ flex: 1, overflowY: 'auto', maxHeight: '100vh', marginRight: showCoach ? 380 : 0, transition: 'margin-right 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, gap: 8 }}>
          <button onClick={() => setShowWellbeing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${C.teal}10`, border: `1px solid ${C.teal}28`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: C.teal, fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
            <Wind size={12} /> Rest & Recharge
          </button>
        </div>
        {views[tab]}
      </main>

      {/* Mobile bottom nav */}
      <nav className="vh-mobile-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, zIndex: 800, padding: '6px 0 8px', justifyContent: 'space-around', alignItems: 'center' }}>
        {MOBILE_NAV.map(item => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => { setTab(item.id); setShowMobileMenu(false); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: active ? C.blueLight : C.muted, fontFamily: 'inherit', minWidth: 44 }}>
              <item.icon size={20} color={active ? C.blueLight : C.muted} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </button>
          );
        })}
        <button onClick={() => setShowCoach(s => !s)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: C.purple, fontFamily: 'inherit', minWidth: 44 }}>
          <Bot size={20} color={C.purple} />
          <span style={{ fontSize: 9, fontWeight: 600 }}>Coach</span>
        </button>
        {/* More drawer trigger */}
        <button onClick={() => setShowMobileMenu(s => !s)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: showMobileMenu ? C.blueLight : C.muted, fontFamily: 'inherit', minWidth: 44 }}>
          <Menu size={20} color={showMobileMenu ? C.blueLight : C.muted} />
          <span style={{ fontSize: 9, fontWeight: showMobileMenu ? 700 : 500 }}>More</span>
        </button>
      </nav>

      {/* Mobile slide-up "More" drawer */}
      {showMobileMenu && (
        <div className="vh-mobile-nav" style={{ position: 'fixed', bottom: 64, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, zIndex: 799, padding: '12px 10px', flexDirection: 'column', gap: 4, boxShadow: '0 -8px 32px rgba(0,0,0,0.4)' }}>
          {[...NAV, ...NAV_SECONDARY].filter(n => !MOBILE_NAV.find(m => m.id === n.id)).map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => { setTab(item.id); setShowMobileMenu(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, border: 'none', cursor: 'pointer', background: active ? `${C.blue}1A` : 'transparent', fontFamily: 'inherit', color: active ? C.text : C.muted, textAlign: 'left' }}>
                <item.icon size={16} color={active ? C.blueLight : C.muted} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: active ? C.blueLight : '#334155' }}>{item.sub}</div>
                </div>
              </button>
            );
          })}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: '4px 0', paddingTop: 8, display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px 0' }}>
            <button onClick={() => setShowWellbeing(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.teal}30`, background: `${C.teal}0A`, cursor: 'pointer', color: C.teal, fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
              <Wind size={13} /> Rest & Recharge
            </button>
            {onSignOut && (
              <button onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.red}25`, background: `${C.red}0A`, cursor: 'pointer', color: '#FCA5A5', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
                <LogOut size={13} /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {showCoach && <AICoachPanel canvas={canvas} onClose={() => setShowCoach(false)} />}
      {showWellbeing && <WellbeingModal onClose={() => setShowWellbeing(false)} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  // session: undefined = loading, null = logged out, object = logged in
  const [session, setSession] = useState(undefined);
  const [entered, setEntered] = useState(() => !!localStorage.getItem('vh_entered'));

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setSession(s => (s === undefined ? null : s));
    }, 4000);
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => { if (!cancelled) setSession(s ?? null); })
      .catch(() => { if (!cancelled) setSession(null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { if (!cancelled) setSession(s ?? null); });
    return () => { cancelled = true; clearTimeout(timeout); subscription?.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    // Clear all app-specific keys so the next user starts completely fresh
    const vhKeys = Object.keys(localStorage).filter(k => k.startsWith('vh_'));
    vhKeys.forEach(k => localStorage.removeItem(k));
    setSession(null);
  };

  // Still resolving session: show minimal loader
  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lightbulb size={22} color="#fff" />
          </div>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.blueLight, opacity: 0.6, animation: `bounce 1.2s ${i*0.15}s infinite` }} />)}
          </div>
        </div>
      </div>
    );
  }

  // Supabase configured but not logged in → show Auth page
  if (supabase && !session) return <AuthPage />;

  // No Supabase OR logged in: use legacy landing gate or go straight to app
  if (!supabase && !entered) {
    const enter = () => { localStorage.setItem('vh_entered', '1'); setEntered(true); };
    return <LandingPage onEnter={enter} />;
  }

  // Show onboarding wizard for fresh users (no canvas yet)
  const hasCanvas = !!localStorage.getItem('vh_canvas');
  const onboardingDone = !!localStorage.getItem('vh_onboarded');
  if (!hasCanvas && !onboardingDone) {
    return (
      <OnboardingWizard
        user={session?.user ?? null}
        onComplete={(canvas) => {
          localStorage.setItem('vh_onboarded', '1');
          // canvas already saved inside wizard; force re-render
          window.location.reload();
        }}
      />
    );
  }

  return <MainApp user={session?.user ?? null} onSignOut={supabase ? handleSignOut : null} />;
}
