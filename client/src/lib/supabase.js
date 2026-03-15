import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ─── FEED ─────────────────────────────────────────────────────────────────────
export async function fetchPosts() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('fetchPosts:', error.message); return []; }
  return (data || []).map(normalizePost);
}

export async function insertPost({ authorName, authorImg, content, imageUrl, mediaType, userId }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        author_name: authorName || 'Visionary',
        author_img: authorImg || null,
        content: content || '',
        image_url: imageUrl || null,
        media_type: mediaType || null,
        author_id: userId || null,
      }])
      .select()
      .single();
    if (error) { console.error('insertPost error:', error.message, error.details); return null; }
    return normalizePost(data);
  } catch (e) {
    console.error('insertPost exception:', e.message);
    return null;
  }
}

export async function reactToPost(id, reaction) {
  if (!supabase) return;
  // reaction: 'inspired' | 'encouraged' | 'learned' | 'reflect'
  if (!['inspired', 'encouraged', 'learned', 'reflect'].includes(reaction)) return;
  const col = reaction; // columns match exactly
  const { data: current } = await supabase.from('posts').select(col).eq('id', id).single();
  const newVal = ((current || {})[col] || 0) + 1;
  await supabase.from('posts').update({ [col]: newVal }).eq('id', id);
}

export function subscribePosts(callback) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('posts-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
      callback(normalizePost(payload.new));
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ─── MENTORS ──────────────────────────────────────────────────────────────────
export async function fetchMentors() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('mentors').select('*').order('name');
  if (error) { console.error('fetchMentors:', error.message); return []; }
  // Only show mentors that have been explicitly approved — hides all demo/seed data
  return (data || [])
    .filter(m => m.status === 'approved')
    .map(m => ({
      id: m.id,
      name: m.name,
      title: m.title,
      img: m.img,
      quote: m.quote,
      persona: m.persona,
      field: m.field || m.persona || 'General',
      verified: m.verified || false,
      status: m.status,
      stats: (() => { try { return m.stats ? (typeof m.stats === 'string' ? JSON.parse(m.stats) : m.stats) : { mentored: 0, rating: 5.0 }; } catch { return { mentored: 0, rating: 5.0 }; } })(),
    }));
}

export async function updatePost(id, content, userId) {
  if (!supabase || !content?.trim()) return null;
  let q = supabase.from('posts').update({ content: content.trim() }).eq('id', id);
  if (userId) q = q.eq('author_id', userId);
  const { data, error } = await q.select().single();
  if (error) { console.error('updatePost:', error.message); return null; }
  return normalizePost(data);
}

export async function deletePost(id, userId) {
  if (!supabase) return;
  // Only delete your own post — client-side guard (pair with RLS for full security)
  let q = supabase.from('posts').delete().eq('id', id);
  if (userId) q = q.eq('author_id', userId);
  await q;
}

export async function deleteMentor(id) {
  if (!supabase) return;
  await supabase.from('mentors').delete().eq('id', id);
}

// Clears ONLY the current user's own posts — never touches other users' data
export async function clearMyPosts(userId) {
  if (!supabase || !userId) return;
  await supabase.from('posts').delete().eq('author_id', userId);
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
// Bucket name in Supabase Storage: "media"
// Create it in: Supabase Dashboard → Storage → New Bucket → "media" → Public ✓
export async function uploadMedia(file) {
  if (!supabase || !file) return null;
  try {
    const ext = file.name.split('.').pop();
    const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) { console.error('uploadMedia:', error.message); return null; }
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    console.error('uploadMedia exception:', e.message);
    return null;
  }
}

// ─── USER DATA SYNC (cross-device: web + phone) ───────────────────────────────
// Requires this table in Supabase:
//
// CREATE TABLE user_data (
//   user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
//   canvas jsonb, journal jsonb DEFAULT '[]',
//   roadmap jsonb, roadmap_done jsonb DEFAULT '{}',
//   xp integer DEFAULT 0, streak integer DEFAULT 0,
//   last_challenge text, vb_goals jsonb DEFAULT '[]',
//   tutor_notes text DEFAULT '', profile jsonb DEFAULT '{}',
//   updated_at timestamptz DEFAULT now()
// );
// ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "own data" ON user_data FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

export async function loadUserData(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('loadUserData:', error.message);
      return null;
    }
    return data || null;
  } catch (e) {
    console.error('loadUserData exception:', e.message);
    return null;
  }
}

export async function saveUserData(userId, payload) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('user_data').upsert(
      { user_id: userId, ...payload, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  } catch (e) {
    console.error('saveUserData exception:', e.message);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function normalizePost(p) {
  return {
    id: p.id,
    authorId: p.author_id || null,
    authorName: p.author_name || 'Visionary',
    authorImg: p.author_img || null,
    content: p.content || '',
    mediaUrl: p.image_url || null,
    mediaType: p.media_type || (p.image_url ? 'image' : null),
    inspired: p.inspired || 0,
    encouraged: p.encouraged || 0,
    learned: p.learned || 0,
    reflect: p.reflect || 0,
    time: p.created_at ? timeAgo(p.created_at) : 'Just now',
  };
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
