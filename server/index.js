require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db } = require('./db');
const { chatWithMentor, getReflectionInsights, refineVision, generateRoadmap, tutorChat, searchOpportunities } = require('./ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype) ||
      /^video\/(mp4|webm|quicktime|ogg)$/i.test(file.mimetype);
    cb(null, ok);
  },
});

app.get('/api/feed', (req, res) => {
  try {
    const { posts } = db.data;
    res.json(posts || []);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.use('/uploads', express.static(uploadsDir));

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/feed', (req, res) => {
  try {
    const { content, authorName, authorImg, imageUrl, videoUrl, mediaType } = req.body || {};
    const post = {
      id: String(Date.now()),
      authorId: 'u1',
      authorName: authorName || 'Anonymous',
      authorImg: authorImg || 'https://i.pravatar.cc/150?img=1',
      content: content || '',
      imageUrl: imageUrl || videoUrl || null,
      mediaType: mediaType || 'image',
      inspired: 0,
      encouraged: 0,
      learned: 0,
      createdAt: 'Just now',
    };
    db.update(d => { d.posts = d.posts || []; d.posts.unshift(post); });
    res.json(post);
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.post('/api/feed/:id/react', (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body || {};
    if (!['inspired', 'encouraged', 'learned'].includes(reaction)) {
      return res.status(400).send('Invalid reaction');
    }
    db.update(d => {
      const p = (d.posts || []).find(x => x.id === id);
      if (p) p[reaction] = (p[reaction] || 0) + 1;
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.get('/api/mentors', (req, res) => {
  try {
    let { mentors } = db.data;
    mentors = mentors || [];
    const q = (req.query.q || '').toLowerCase();
    if (q) {
      mentors = mentors.filter(m =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.title || '').toLowerCase().includes(q)
      );
    }
    res.json(mentors);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.get('/api/canvases', (req, res) => {
  try {
    const { canvases } = db.data;
    res.json(canvases || []);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.get('/api/canvases/current', (req, res) => {
  try {
    const { currentCanvas } = db.data;
    res.json(currentCanvas || { title: 'Start a Community Garden' });
  } catch (e) {
    res.status(500).json({});
  }
});

app.put('/api/canvases/:id/current', (req, res) => {
  try {
    const { id } = req.params;
    const { canvases } = db.data;
    const canvas = (canvases || []).find(c => c.id === id);
    if (canvas) {
      db.update(d => { d.currentCanvas = { id: canvas.id, title: canvas.name }; });
    }
    res.json(db.data.currentCanvas);
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.patch('/api/canvases/current', (req, res) => {
  try {
    const { title } = req.body || {};
    db.update(d => {
      if (!d.currentCanvas) d.currentCanvas = {};
      if (title != null) d.currentCanvas.title = title;
    });
    res.json(db.data.currentCanvas);
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.get('/api/journal', (req, res) => {
  try {
    const { journal } = db.data;
    res.json(journal || []);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.post('/api/journal', (req, res) => {
  try {
    const entry = { id: String(Date.now()), ...req.body, createdAt: new Date().toISOString() };
    db.update(d => { d.journal = d.journal || []; d.journal.unshift(entry); });
    res.json(entry);
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.get('/api/settings', (req, res) => {
  try {
    const { settings } = db.data;
    res.json(settings || { safeMode: false });
  } catch (e) {
    res.status(500).json({ safeMode: false });
  }
});

app.put('/api/settings/safe-mode', (req, res) => {
  try {
    const { value } = req.body || {};
    db.update(d => {
      d.settings = d.settings || {};
      d.settings.safeMode = Boolean(value);
    });
    res.json(db.data.settings);
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.get('/api/projects', (req, res) => {
  try {
    const { projects } = db.data;
    res.json(projects || []);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name } = req.body || {};
    const project = { id: String(Date.now()), name: name || 'New project', status: 'in_progress', progress: 0, dueDate: null };
    db.update(d => { d.projects = d.projects || []; d.projects.unshift(project); });
    res.json(project);
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.patch('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body || {};
    let out;
    db.update(d => {
      const p = (d.projects || []).find(x => x.id === id);
      if (p) {
        if (status != null) p.status = status;
        if (progress != null) p.progress = progress;
        out = p;
      }
    });
    res.json(out || {});
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.get('/api/goals', (req, res) => {
  try {
    const { goals } = db.data;
    res.json(goals || []);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.post('/api/goals', (req, res) => {
  try {
    const { title } = req.body || {};
    const goal = { id: String(Date.now()), title: title || 'New goal', done: false };
    db.update(d => { d.goals = d.goals || []; d.goals.unshift(goal); });
    res.json(goal);
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.patch('/api/goals/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { done } = req.body || {};
    let out;
    db.update(d => {
      const g = (d.goals || []).find(x => x.id === id);
      if (g) {
        if (done != null) g.done = done;
        out = g;
      }
    });
    res.json(out || {});
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

// --- AI Routes ---
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { mentor, messages } = req.body || {};
    if (!mentor) return res.status(400).send('mentor required');
    const reply = await chatWithMentor(mentor, messages || []);
    res.json({ reply });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.post('/api/ai/insights', async (req, res) => {
  try {
    const { journalEntries } = req.body || {};
    const insights = await getReflectionInsights(journalEntries || []);
    res.json({ insights });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.post('/api/ai/refine-vision', async (req, res) => {
  try {
    const { currentTitle } = req.body || {};
    const refined = await refineVision(currentTitle);
    res.json({ refined });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.post('/api/ai/roadmap', async (req, res) => {
  try {
    const { canvas } = req.body || {};
    const roadmap = await generateRoadmap(canvas);
    if (roadmap) return res.json(roadmap);
    res.status(503).json({ error: 'Add ANTHROPIC_API_KEY for AI roadmap generation' });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.post('/api/ai/tutor', async (req, res) => {
  try {
    const { messages, mode, canvas, fileContent } = req.body || {};
    const reply = await tutorChat(messages || [], mode || 'study', canvas, fileContent);
    res.json({ reply });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.post('/api/ai/opportunities', async (req, res) => {
  try {
    const { query, location, canvas } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query required' });
    const result = await searchOpportunities(query, location, canvas);
    res.json({ result });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

// ── Institution-Posted Opportunities ─────────────────────────────────────────
app.get('/api/posted-opportunities', (req, res) => {
  try {
    const data = db.data;
    const opps = (data.postedOpportunities || []).filter(o => o.status !== 'rejected');
    res.json(opps);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.post('/api/posted-opportunities', (req, res) => {
  try {
    const { institution, contactEmail, title, type, amount, deadline, field, url, description, location, eligibility } = req.body || {};
    if (!institution || !title || !url) return res.status(400).json({ error: 'institution, title, and url are required' });
    const opp = {
      id: `opp-${Date.now()}`,
      institution: institution.trim(),
      contactEmail: contactEmail || '',
      title: title.trim(),
      type: type || 'Scholarship',
      amount: amount || 'Varies',
      deadline: deadline || 'Rolling',
      field: field || 'Any',
      url: url.trim(),
      description: description || '',
      location: location || 'Open / International',
      eligibility: eligibility || '',
      status: 'pending', // pending | approved | rejected
      postedAt: new Date().toISOString(),
      verified: false,
    };
    db.update(d => {
      d.postedOpportunities = d.postedOpportunities || [];
      d.postedOpportunities.unshift(opp);
    });
    res.json(opp);
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api)/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Visionary Hub API running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GROQ_API_KEY) {
    console.log('(No AI keys set — using demo mode. Add ANTHROPIC_API_KEY or GROQ_API_KEY to .env)');
  } else if (process.env.ANTHROPIC_API_KEY) {
    console.log('(AI: Claude + Groq fallback enabled)');
  } else {
    console.log('(AI: Groq fallback only)');
  }
});
