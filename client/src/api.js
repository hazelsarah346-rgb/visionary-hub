import { supabase } from './lib/supabase';

const API = '/api';

async function fetchAPI(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

function useSupabase() {
  return supabase != null;
}

async function safeSupabase(fn, fallback) {
  try {
    return await fn();
  } catch (e) {
    console.warn('Supabase:', e?.message || e);
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}

export const api = {
  // Flow / Feed
  getFeed: async () => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(p => ({
          id: p.id,
          authorId: p.author_id,
          authorName: p.author_name,
          authorImg: p.author_img,
          content: p.content,
        imageUrl: p.image_url,
        mediaType: p.media_type || 'image',
        inspired: p.inspired ?? 0,
          encouraged: p.encouraged ?? 0,
          learned: p.learned ?? 0,
          createdAt: formatTime(p.created_at),
        }));
      }, () => []);
    }
    return fetchAPI('/feed').catch(() => []);
  },

  addPost: async (body) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('posts').insert({
        author_id: body.authorId || 'u1',
        author_name: body.authorName || 'Anonymous',
        author_img: body.authorImg || 'https://i.pravatar.cc/150?img=1',
        content: body.content || '',
        image_url: body.imageUrl || body.videoUrl || null,
        media_type: body.mediaType || (body.videoUrl ? 'video' : 'image'),
        inspired: 0,
        encouraged: 0,
        learned: 0,
      }).select().single();
      if (error) throw error;
      return {
        id: data.id,
        authorId: data.author_id,
        authorName: data.author_name,
        authorImg: data.author_img,
        content: data.content,
        imageUrl: data.image_url,
        mediaType: data.media_type || 'image',
        inspired: 0,
        encouraged: 0,
        learned: 0,
        createdAt: 'Just now',
      };
      }, () => { throw new Error('Could not add post'); });
    }
    return fetchAPI('/feed', { method: 'POST', body: JSON.stringify(body) });
  },

  reactToPost: async (postId, reaction) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data: post } = await supabase.from('posts').select(reaction).eq('id', postId).single();
        const val = ((post && post[reaction]) || 0) + 1;
        const { error } = await supabase.from('posts').update({ [reaction]: val }).eq('id', postId);
        if (error) throw error;
        return { ok: true };
      }, () => ({ ok: true }));
    }
    return fetchAPI(`/feed/${postId}/react`, { method: 'POST', body: JSON.stringify({ reaction }) });
  },

  // Mentors
  getMentors: async (q) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        let query = supabase.from('mentors').select('*');
        if (q && q.trim()) {
          query = query.or(`name.ilike.%${q}%,title.ilike.%${q}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(m => ({ id: m.id, name: m.name, title: m.title, quote: m.quote, img: m.img, stats: m.stats, persona: m.persona }));
      }, () => []);
    }
    return fetchAPI(q ? `/mentors?q=${encodeURIComponent(q)}` : '/mentors');
  },

  // Canvas
  getCanvases: async () => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('canvases').select('*');
        if (error) throw error;
        return data || [];
      }, () => []);
    }
    return fetchAPI('/canvases');
  },

  getCurrentCanvas: async () => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('current_canvas').select('*').eq('id', 1).single();
        if (error) throw error;
        return data ? { id: data.canvas_id, title: data.title } : { title: 'Your vision' };
      }, () => ({ title: 'Your vision' }));
    }
    return fetchAPI('/canvases/current');
  },

  updateCurrentCanvas: async (body) => {
    if (useSupabase() && body.title != null) {
      return safeSupabase(async () => {
        const { error } = await supabase.from('current_canvas').update({ title: body.title }).eq('id', 1);
        if (error) throw error;
        return { title: body.title };
      }, () => ({ title: body.title }));
    }
    return fetchAPI('/canvases/current', { method: 'PATCH', body: JSON.stringify(body) });
  },

  // Reflect / Journal
  getJournal: async () => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('journal').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(j => ({ id: j.id, content: j.content, text: j.content, createdAt: j.created_at }));
      }, () => []);
    }
    return fetchAPI('/journal');
  },

  addJournalEntry: async (body) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('journal').insert({ content: body.content || body.text || '' }).select().single();
        if (error) throw error;
        return data;
      }, () => { throw new Error('Could not save'); });
    }
    return fetchAPI('/journal', { method: 'POST', body: JSON.stringify(body) });
  },

  // Settings
  getSettings: async () => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'safe_mode').single();
        return { safeMode: data?.value === true };
      }, () => ({ safeMode: false }));
    }
    return fetchAPI('/settings');
  },

  setSafeMode: async (value) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        await supabase.from('settings').upsert({ key: 'safe_mode', value }, { onConflict: 'key' });
        return { safeMode: value };
      }, () => ({ safeMode: value }));
    }
    return fetchAPI('/settings/safe-mode', { method: 'PUT', body: JSON.stringify({ value }) });
  },

  // Upload - tries Supabase first, falls back to Express
  uploadFile: async (file) => {
    if (useSupabase()) {
      try {
        const path = `${Date.now()}-${file.name.replace(/\s+/g, '-').slice(-80)}`;
        const { data, error } = await supabase.storage.from('media').upload(path, file, { upsert: false, contentType: file.type });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
        return urlData.publicUrl;
      } catch (e) {
        console.warn('Supabase upload failed:', e?.message, '- trying local server');
      }
    }
    // Fallback: Express upload (ensure backend is running: npm run dev)
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Upload failed. Make sure the backend is running (npm run dev).');
    }
    const json = await res.json();
    const url = json?.url;
    if (!url) throw new Error('Upload failed: no URL returned');
    return url;
  },

  // Projects & Goals
  getProjects: async () => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(p => ({ id: p.id, name: p.name, status: p.status, progress: p.progress ?? 0, dueDate: p.due_date }));
      }, () => []);
    }
    return fetchAPI('/projects');
  },

  addProject: async (body) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('projects').insert({
          name: body.name || 'New project',
          status: 'in_progress',
          progress: 0,
        }).select().single();
        if (error) throw error;
        return { id: data.id, name: data.name, status: data.status, progress: data.progress ?? 0, dueDate: data.due_date };
      }, () => { throw new Error('Could not add project'); });
    }
    return fetchAPI('/projects', { method: 'POST', body: JSON.stringify(body) });
  },

  updateProject: async (id, body) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const updates = {};
        if (body.status != null) updates.status = body.status;
        if (body.progress != null) updates.progress = body.progress;
        const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }, () => null);
    }
    return fetchAPI(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  },

  getGoals: async () => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }, () => []);
    }
    return fetchAPI('/goals');
  },

  addGoal: async (body) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('goals').insert({ title: body.title || 'New goal', done: false }).select().single();
        if (error) throw error;
        return data;
      }, () => { throw new Error('Could not add goal'); });
    }
    return fetchAPI('/goals', { method: 'POST', body: JSON.stringify(body) });
  },

  updateGoal: async (id, body) => {
    if (useSupabase()) {
      return safeSupabase(async () => {
        const { data, error } = await supabase.from('goals').update({ done: body.done }).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }, () => null);
    }
    return fetchAPI(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  },

  // AI (always via API - needs server-side API key)
  aiChat: (mentor, messages) => fetchAPI('/ai/chat', { method: 'POST', body: JSON.stringify({ mentor, messages }) }),
  aiInsights: (journalEntries) => fetchAPI('/ai/insights', { method: 'POST', body: JSON.stringify({ journalEntries }) }),
  aiRefineVision: (currentTitle) => fetchAPI('/ai/refine-vision', { method: 'POST', body: JSON.stringify({ currentTitle }) }),
  aiRoadmap: (canvas) => fetchAPI('/ai/roadmap', { method: 'POST', body: JSON.stringify({ canvas }) }),
  aiTutor: (messages, mode, canvas, fileContent) => fetchAPI('/ai/tutor', { method: 'POST', body: JSON.stringify({ messages, mode, canvas, fileContent }) }),
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
