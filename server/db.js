const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function read() {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    const initial = getInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function write(data) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getInitialData() {
  return {
    settings: { safeMode: false },
    posts: [],
    mentors: [],
    canvases: [],
    currentCanvas: null,
    journal: [],
    projects: [],
    goals: [],
    postedOpportunities: [],
  };
}

const db = {
  get data() { return read(); },
  set data(val) { write(val); },
  update(fn) {
    const d = read();
    fn(d);
    write(d);
  },
};

module.exports = { db };
