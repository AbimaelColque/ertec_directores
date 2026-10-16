// =============================================
// storage.js — ERTEC · Simulacro de Institucionalización
// Almacenamiento local + configuración + generador de simulacros
// =============================================

const Storage = {
  K: {
    SESSION: 'ertec_session', HISTORY: 'ertec_history', SETTINGS: 'ertec_settings',
    PENDING: 'ertec_pending', RESULT: 'ertec_result', REVIEW: 'ertec_review',
    CARGO: 'ertec_cargo', CHECK: 'ertec_check',
  },

  setSession(d)  { localStorage.setItem(this.K.SESSION, JSON.stringify({ ...d, ts: Date.now() })); },
  getSession()   {
    try {
      const s = JSON.parse(localStorage.getItem(this.K.SESSION));
      if (!s) return null;
      if (Date.now() - s.ts > 8 * 3600 * 1000) { this.clearSession(); return null; }
      return s;
    } catch { return null; }
  },
  clearSession() { localStorage.removeItem(this.K.SESSION); },

  setPending(id) { sessionStorage.setItem(this.K.PENDING, id); },
  getPending()   { return sessionStorage.getItem(this.K.PENDING); },
  clearPending() { sessionStorage.removeItem(this.K.PENDING); },

  setResult(r)  { sessionStorage.setItem(this.K.RESULT, JSON.stringify(r)); },
  getResult()   { try { return JSON.parse(sessionStorage.getItem(this.K.RESULT)); } catch { return null; } },
  clearResult() { sessionStorage.removeItem(this.K.RESULT); },

  setReview(d) { sessionStorage.setItem(this.K.REVIEW, JSON.stringify(d)); },
  getReview()  { try { return JSON.parse(sessionStorage.getItem(this.K.REVIEW)); } catch { return null; } },

  // Cargo al que postula (id de data/config.json)
  getCargo()  { return localStorage.getItem(this.K.CARGO) || ''; },
  setCargo(id){ localStorage.setItem(this.K.CARGO, id); },
  // Checklist de habilitación: { cargoId: { clave: true } }
  getChecks(cargo) { try { return (JSON.parse(localStorage.getItem(this.K.CHECK)) || {})[cargo] || {}; } catch { return {}; } },
  setCheck(cargo, key, val) {
    let all = {}; try { all = JSON.parse(localStorage.getItem(this.K.CHECK)) || {}; } catch {}
    all[cargo] = all[cargo] || {};
    if (val) all[cargo][key] = true; else delete all[cargo][key];
    localStorage.setItem(this.K.CHECK, JSON.stringify(all));
  },

  addResult(r) {
    const h = this.getHistory();
    h.unshift({ id: Date.now(),
      date: new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }), ...r });
    localStorage.setItem(this.K.HISTORY, JSON.stringify(h.slice(0, 40)));
  },
  getHistory()  { try { return JSON.parse(localStorage.getItem(this.K.HISTORY)) || []; } catch { return []; } },
  clearHistory(){ localStorage.removeItem(this.K.HISTORY); },

  getSettings() {
    try { return { darkMode: true, sound: true, showAnswers: true, ...JSON.parse(localStorage.getItem(this.K.SETTINGS)) }; }
    catch { return { darkMode: true, sound: true, showAnswers: true }; }
  },
  saveSettings(s) { localStorage.setItem(this.K.SETTINGS, JSON.stringify(s)); },

  getStats() {
    const h = this.getHistory();
    if (!h.length) return { totalExams: 0, avgScore: 0, bestScore: 0 };
    return {
      totalExams: h.length,
      avgScore:   Math.round(h.reduce((a, b) => a + b.percentage, 0) / h.length),
      bestScore:  Math.max(...h.map(x => x.percentage)),
    };
  },
  getRanking() { return this.getHistory().slice().sort((a, b) => b.percentage - a.percentage).slice(0, 10); },
};

// ── HELPERS ──
function formatTime(sec) {
  if (!sec && sec !== 0) return '--';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function applyTheme() {
  const s = Storage.getSettings();
  document.documentElement.setAttribute('data-theme', s.darkMode ? 'dark' : 'light');
  const btn = document.getElementById('btn-dark');
  if (btn) btn.textContent = s.darkMode ? '☀️' : '🌙';
}
function toggleTheme() { const s = Storage.getSettings(); s.darkMode = !s.darkMode; Storage.saveSettings(s); applyTheme(); }
function showToast(msg, ms = 2800) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), ms);
}
function showModal(title, desc, icon, onOk, onCancel) {
  const ov = document.getElementById('modal-overlay'); if (!ov) return;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent = desc;
  document.getElementById('modal-icon').textContent = icon;
  ov.classList.add('show');
  const clone = id => { const o = document.getElementById(id), n = o.cloneNode(true); o.parentNode.replaceChild(n, o); return n; };
  const close = () => ov.classList.remove('show');
  const ok = clone('modal-ok'), cancel = clone('modal-cancel');
  ok.addEventListener('click', () => { close(); if (onOk) onOk(); });
  cancel.addEventListener('click', () => { close(); if (onCancel) onCancel(); });
  cancel.style.display = (onCancel === null) ? 'none' : 'flex';
  if (onCancel === null) ok.textContent = 'Entendido';
}
function requireAuth(to = 'login.html') { if (!Storage.getSession()) { window.location.href = to; return false; } return true; }
function hideLoader() { const l = document.getElementById('loader'); if (l) { l.classList.add('out'); setTimeout(() => l.remove(), 600); } }

// Fechas ISO (AAAA-MM-DD) en hora local
function isoDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function daysTo(s) { const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((isoDate(s) - t) / 864e5); }
function fmtDate(s, long) {
  return isoDate(s).toLocaleDateString('es-BO', long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: '2-digit', month: 'short' });
}

// ── CONFIGURACIÓN: convocatoria + bibliografías ────────────────
// data/config.json  → cargos, cronograma, perfiles de examen, lista de bibliografías
// data/bib/<id>.json → UN archivo por bibliografía con sus preguntas
const Config = {
  _c: null, _banks: {},
  async load() {
    if (this._c) return this._c;
    if (location.protocol === 'file:') throw new Error('file');          // abierto con doble clic
    let r; try { r = await fetch('data/config.json', { cache: 'no-cache' }); } catch { throw new Error('red'); }
    if (!r.ok) throw new Error('404');                                   // la carpeta data/ no se subió
    try { this._c = await r.json(); } catch { throw new Error('json'); } // config.json con error de sintaxis
    return this._c;
  },
  bib(id)   { return this._c.bibliografias.find(b => b.id === id); },
  grupo(id) { return this._c.grupos.find(g => g.id === id); },
  cargo(id) { return this._c.cargos.find(c => c.id === id); },
  // Una pregunta es válida si tiene enunciado, ≥2 opciones y 'answer' apunta a una opción
  valid(q) { return q && q.question && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length; },
  async bank(id) {
    if (this._banks[id]) return this._banks[id];
    const b = this.bib(id); let list = [];
    try {
      const r = await fetch(b.archivo, { cache: 'no-cache' });
      if (r.ok) { const d = await r.json(); list = Array.isArray(d) ? d : (d.preguntas || []); }
    } catch { /* archivo ausente o con JSON inválido: banco vacío */ }
    list = list.filter(q => this.valid(q)).map(q => ({ ...q, bib: id, grupo: b.grupo, survey: !!b.survey }));
    return (this._banks[id] = list);
  },
  async counts() {
    const out = {};
    await Promise.all(this._c.bibliografias.map(async b => { out[b.id] = (await this.bank(b.id)).length; }));
    return out;
  },
};

// ── GENERADOR DE SIMULACROS ────────────────────────────────────
// Ids de modo:  cargo:<id> · grupo:<id> · bib:<id>
const Modes = {
  // Reparte n preguntas entre varias bibliografías de forma pareja (round-robin)
  _balanced(pools, n) {
    const qs = pools.map(p => shuffle(p)), out = [];
    while (out.length < n && qs.some(p => p.length)) qs.forEach(p => { if (out.length < n && p.length) out.push(p.pop()); });
    return out;
  },
  async _byGroup(gid) {
    const bibs = Config._c.bibliografias.filter(b => b.grupo === gid);
    return Promise.all(bibs.map(b => Config.bank(b.id)));
  },
  label(id) {
    if (!Config._c || !id) return id;
    const [t, k] = id.split(':');
    if (t === 'cargo') return `Simulacro · ${Config.cargo(k)?.corto || k}`;
    if (t === 'grupo') return `Práctica · ${Config.grupo(k)?.nombre || k}`;
    if (t === 'bib')   return `Bibliografía · ${Config.bib(k)?.nombre || k}`;
    return id;
  },
  // → { id, name, icon, minutes, pass, questions[], requested, short }
  async build(id) {
    const cfg = await Config.load();
    const [t, k, opt] = id.split(':');
    const P = cfg.practica;

    if (t === 'cargo') {
      const cargo = Config.cargo(k); if (!cargo) return null;
      const perfil = cfg.perfiles[cargo.perfil] || cfg.perfiles.general;
      // Reparto por grupo según pesos; los grupos sin preguntas ceden su peso a los demás
      const pools = {};
      for (const g of Object.keys(perfil.pesos)) pools[g] = await this._byGroup(g);
      const avail = Object.fromEntries(Object.entries(pools).map(([g, ps]) => [g, ps.reduce((a, p) => a + p.length, 0)]));
      const act = Object.keys(perfil.pesos).filter(g => avail[g] > 0);
      const wsum = act.reduce((a, g) => a + perfil.pesos[g], 0) || 1;
      const totalAvail = act.reduce((a, g) => a + avail[g], 0);
      const total = Math.min(perfil.preguntas, totalAvail);
      const need = {}; let given = 0;
      act.forEach(g => { need[g] = Math.min(avail[g], Math.floor(total * perfil.pesos[g] / wsum)); given += need[g]; });
      // completar hasta 'total' repartiendo lo restante en proporción a los pesos (solo grupos con banco libre)
      while (given < total) {
        const spare = act.filter(g => need[g] < avail[g]); if (!spare.length) break;
        const ws = spare.reduce((a, g) => a + perfil.pesos[g], 0), rem = total - given; let added = 0;
        spare.forEach(g => { const add = Math.min(avail[g] - need[g], Math.floor(rem * perfil.pesos[g] / ws)); need[g] += add; added += add; });
        if (!added) { const g = spare.sort((a, b) => perfil.pesos[b] - perfil.pesos[a])[0]; need[g]++; added = 1; }
        given += added;
      }
      let questions = [];
      act.forEach(g => { questions = questions.concat(this._balanced(pools[g], need[g])); });
      return { id, name: this.label(id), icon: '🎯', official: true, cargo: cargo.id,
        minutes: Math.max(5, Math.ceil(perfil.minutos * (questions.length / perfil.preguntas))), pass: perfil.aprobacion,
        questions, requested: perfil.preguntas, short: questions.length < perfil.preguntas };
    }

    if (t === 'grupo') {
      const g = Config.grupo(k); if (!g) return null;
      const pools = await this._byGroup(k);
      const total = pools.reduce((a, p) => a + p.length, 0);
      const want = k === 'encuesta' ? Math.min(P.porGrupo, 15) : P.porGrupo;
      const questions = this._balanced(pools, Math.min(want, total));
      return { id, name: this.label(id), icon: g.icono, minutes: Math.max(5, Math.ceil(questions.length * P.segundosPorPregunta / 60)),
        pass: cfg.perfiles.general.aprobacion, questions, requested: want, short: questions.length < want };
    }

    if (t === 'bib') {
      const b = Config.bib(k); if (!b) return null;
      const pool = await Config.bank(k);
      const want = opt === 'all' ? pool.length : P.preguntas;
      const questions = shuffle(pool).slice(0, want);
      return { id, name: this.label(id), icon: b.icono, minutes: Math.max(5, Math.ceil(questions.length * P.segundosPorPregunta / 60)),
        pass: cfg.perfiles.general.aprobacion, questions, requested: want, short: questions.length < want };
    }
    return null;
  },
};
