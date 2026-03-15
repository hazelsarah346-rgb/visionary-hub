import { chatWithMentor } from '../../server/ai.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  try {
    const { mentor, messages } = req.body || {};
    if (!mentor) return res.status(400).send('mentor required');
    const reply = await chatWithMentor(mentor, messages || []);
    res.json({ reply });
  } catch (e) {
    res.status(500).send(String(e.message));
  }
}
