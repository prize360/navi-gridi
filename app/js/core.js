/* Гриди — ядро: библиотека, хранение, разметка блока */
'use strict';
window.Gridi = window.Gridi || {};
const G = window.Gridi;

/* ---------- мелочи ---------- */
G.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
G.len = s => String(s || '').length;
G.uid = (p = 'b') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
G.clone = o => JSON.parse(JSON.stringify(o));
G.plural = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? many : b > 1 && b < 5 ? few : b === 1 ? one : many; };
G.num = (n, one, few, many) => n + ' ' + G.plural(n, one, few, many);
G.download = (name, data, type = 'text/plain;charset=utf-8') => {
  const blob = data instanceof Blob ? data : new Blob([data], {type});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};
G.copy = async text => {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} t.remove(); return ok;
  }
};
G.ls = {
  get(k, d) { try { const v = localStorage.getItem('gridi.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('gridi.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
};

/* ---------- библиотека: встроенные файлы + локальные правки ---------- */
const BUILT = {templates: [], scenarios: [], prompts: [], icons: []};
let BUILT_SETTINGS = {version: '—', krea: []};
G.library = {
  add(kind, arr) { (BUILT[kind] = BUILT[kind] || []).push(...arr.map(o => ({...o}))); if (G.lib) G.lib.bump(); },
  settings(o) { BUILT_SETTINGS = {...BUILT_SETTINGS, ...o}; },
  examples(arr) { G.examples = arr || []; },
};
const KINDS = {templates: 'Шаблоны', scenarios: 'Сценарии', prompts: 'Промты', icons: 'Иконки'};
G.KINDS = KINDS; G.examples = G.examples || [];
/* пример страницы → новая копия: id и даты свои, блоки — глубокая копия */
G.fromExample = x => ({...G.clone(x), id: G.uid('p'), created: Date.now(), updated: Date.now(), story: []});
G.lib = {
  local(kind) { return G.ls.get('lib.' + kind, {items: {}, removed: []}); },
  saveLocal(kind, v) { G.ls.set('lib.' + kind, v); },
  _cache: {},
  all(kind) {
    if (this._cache[kind]) return this._cache[kind];
    const loc = this.local(kind), out = [];
    for (const o of BUILT[kind]) {
      if (loc.removed.includes(o.id)) continue;
      const li = loc.items[o.id] && loc.items[o.id]._base === BUILT_SETTINGS.version ? loc.items[o.id] : null;
      out.push(li ? {...li, _local: 'changed'} : {...o});
    }
    for (const id in loc.items) if (!BUILT[kind].some(o => o.id === id)) out.push({...loc.items[id], _local: 'new'});
    return (this._cache[kind] = out);
  },
  get(kind, id) { return this.all(kind).find(o => o.id === id) || null; },
  save(kind, obj) {
    const loc = this.local(kind), o = {...obj, _base: BUILT_SETTINGS.version}; delete o._local;
    loc.items[o.id] = o; loc.removed = loc.removed.filter(x => x !== o.id); this.saveLocal(kind, loc); G.lib.bump();
  },
  remove(kind, id) {
    const loc = this.local(kind); delete loc.items[id];
    if (BUILT[kind].some(o => o.id === id)) loc.removed.push(id);
    this.saveLocal(kind, loc); G.lib.bump();
  },
  revert(kind, id) { const loc = this.local(kind); delete loc.items[id]; loc.removed = loc.removed.filter(x => x !== id); this.saveLocal(kind, loc); G.lib.bump(); },
  resetAll(kind) { this.saveLocal(kind, {items: {}, removed: []}); G.lib.bump(); },
  changes(kind) { const l = this.local(kind); return Object.keys(l.items).length + l.removed.length; },
  isBuiltIn(kind, id) { return BUILT[kind].some(o => o.id === id); },
  settings() { const loc = G.ls.get('settings', {}); return {...BUILT_SETTINGS, ...loc, krea: (BUILT_SETTINGS.krea || []).map(k => ({...k, url: (loc.kreaUrls || {})[k.size] || k.url}))}; },
  version() { return BUILT_SETTINGS.version; },


  bump() { G._tplIndex = null; this._cache = {}; },
  /* файл библиотеки целиком — заменить в репозитории */
  fileText(kind) {
    const head = `/* ${KINDS[kind]} Гриди. Описание полей — docs/library.md.\n   Скачано из Гриди ${new Date().toLocaleString('ru-RU')}. Замените этим файлом library/${kind}.js и поменяйте version в library/settings.js. */\n`;
    const items = this.all(kind).map(o => { const c = {...o}; delete c._local; delete c._base; return c; });
    const ser = o => ' ' + JSON.stringify(o).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1: ').replace(/,(?=[a-zA-Z_"{\[])/g, ', ');
    return head + `Gridi.library.add('${kind}', [\n` + items.map(ser).join(',\n') + '\n]);\n';
  },
};

/* шаблоны: по id, по названию (старому или новому) */
G.tpls = () => G.lib.all('templates');
/* шаблоны из чужих макетов: живут только в этом браузере, в библиотеку и меню не попадают, дальше не передаются как библиотека */
G.imported = {
  all() { return G.ls.get('imported.templates', {}); },
  add(t) { const a = this.all(); a[t.id] = t; G.ls.set('imported.templates', a); G._tplIndex = null; },
};
G.tpl = id => { if (!id) return null; if (!G._tplIndex) { G._tplIndex = {...G.imported.all()}; for (const t of G.tpls()) G._tplIndex[t.id] = t; } return G._tplIndex[id] || null; };
G.tplByName = name => G.tpls().find(t => t.id === name || t.name === name || (t.status && t.status.rename === name)) || null;
G.scenario = id => G.lib.get('scenarios', id) || G.lib.all('scenarios')[0];
G.prompt = id => G.lib.get('prompts', id);
const SYS_ROLES = {hero: {id: 'hero', name: 'Первый экран', meaning: 'Заголовок, главное сообщение и действие'}, cta: {id: 'cta', name: 'Целевое действие', meaning: 'Кнопка или форма — главное действие страницы'}};
G.roleOf = (sc, roleId) => (sc.roles || []).find(r => r.id === roleId) || SYS_ROLES[roleId] || {id: roleId, name: roleId, meaning: ''};

/* ---------- хранение страниц: IndexedDB, запасной вариант — localStorage ---------- */
const DB = {db: null, fallback: false};
DB.open = () => new Promise(res => {
  if (DB.db || DB.fallback) return res();
  try {
    const r = indexedDB.open('gridi', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('pages', {keyPath: 'id'});
    r.onsuccess = () => { DB.db = r.result; res(); };
    r.onerror = () => { DB.fallback = true; res(); };
  } catch (e) { DB.fallback = true; res(); }
});
const tx = (mode, fn) => new Promise((res, rej) => { const t = DB.db.transaction('pages', mode); const s = t.objectStore('pages'); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); });
G.store = {
  async list() { await DB.open(); if (DB.fallback) return Object.values(G.ls.get('pages', {})); return tx('readonly', s => s.getAll()); },
  async get(id) { await DB.open(); if (DB.fallback) return G.ls.get('pages', {})[id] || null; return tx('readonly', s => s.get(id)); },
  async put(p) { p.updated = Date.now(); await DB.open(); if (DB.fallback) { const a = G.ls.get('pages', {}); a[p.id] = p; G.ls.set('pages', a); return; } return tx('readwrite', s => s.put(G.clone(p))); },
  async del(id) { await DB.open(); if (DB.fallback) { const a = G.ls.get('pages', {}); delete a[id]; G.ls.set('pages', a); return; } return tx('readwrite', s => s.delete(id)); },
};

/* ---------- разметка блока ----------
   Блок редактора — обычный текст с лёгкой разметкой:
   [h1] / [h2] / [h3] заголовок   @ метаданные   - пункт — пояснение
   [кнопка] текст                 [картинка] подпись
   Остальные строки — абзацы. */
const RX = {
  h: /^\[(h[1-4])\]\s*(.*)$/i, meta: /^@\s*(.*)$/, item: /^(?:[-–•*]|\d+[.)])\s+(.*)$/,
  btn: /^\[(?:кнопка|ссылка|button|btn|link)\]\s*(.*)$/i, img: /^\[(?:картинка|фото|image|img)\]\s*(.*)$/i,
};
G.splitItem = s => {
  s = String(s || '').trim();
  let m = s.match(/^(.{1,90}?)(\s+[—–]\s+)(.+)$/);
  if (!m) m = s.match(/^([^:]{1,70})(:\s+)(.+)$/);
  return m ? {title: m[1].trim(), text: m[3].trim(), sep: m[2]} : {title: '', text: s};
};
G.parse = text => {
  const src = {title: '', level: '', meta: [], paras: [], items: [], cta: [], images: [], urls: []};
  let last = null, item = null;
  for (const raw of String(text || '').split('\n')) {
    const l = raw.trim(); if (!l) { if (item && item._h) item = null; last = null; continue; }
    let m;
    if ((m = l.match(RX.h))) {
      const lv = m[1].toLowerCase();
      if (!src.title && !src.items.length && (lv !== 'h3' || !src.paras.length)) { src.title = m[2].trim(); src.level = lv; last = 'title'; item = null; }
      else { item = {title: m[2].trim(), text: '', meta: '', cta: '', _h: true}; src.items.push(item); last = 'item'; }
    } else if ((m = l.match(RX.meta))) {
      if (last === 'item' && item) item.meta = item.meta ? item.meta + ' · ' + m[1] : m[1]; else src.meta.push(m[1].trim());
    } else if ((m = l.match(RX.btn))) {
      const [txt, url] = m[1].split(/\s+\|\s+(?=\S+$)/); if (url) src.urls.push(url);
      /* ссылка «Читайте также: Название | адрес» — название в текст, начало до двоеточия — подпись кнопки */
      const lk = /^\[(ссылка|link)\]/i.test(l) && txt.match(/^([^:]{2,24}):\s*(.+)$/);
      if (lk && !(last === 'item' && item)) { src.paras.push(lk[2].trim()); src.cta.push(lk[1].trim()); }
      else if (last === 'item' && item && !item.cta) item.cta = txt.trim(); else src.cta.push(txt.trim());
    } else if ((m = l.match(RX.img))) { src.images.push(m[1].trim()); last = 'img'; }
    else if ((m = l.match(RX.item))) { item = {...G.splitItem(m[1]), meta: '', cta: ''}; src.items.push(item); last = 'item'; }
    else if (item && item._h) { item.text = item.text ? item.text + '\n' + l : l; last = 'item'; }
    else { src.paras.push(l); last = 'para'; item = null; }
  }
  src.items.forEach(i => delete i._h);
  src.lead = src.paras.join('\n\n');
  src.table = src.paras.filter(p => p.includes(' | ')).length >= 2;
  return src;
};
G.serialize = (s, opts = {}) => {
  const o = [];
  const meta = () => (s.meta || []).filter(Boolean).forEach(m => o.push('@ ' + m));
  if (s.title) { o.push(`[${s.level || opts.level || 'h2'}] ${s.title}`); meta(); }
  if (s.lead) o.push(...String(s.lead).split(/\n+/).filter(Boolean));
  if (!s.title) meta();
  (s.items || []).forEach(i => {
    if (i.h3) { o.push('[h3] ' + i.title); if (i.text) o.push(i.text); }
    else o.push('- ' + (i.title && i.text ? i.title + (i.sep || ' — ') + i.text : i.title || i.text));
    if (i.meta) o.push('@ ' + i.meta);
    if (i.cta) o.push('[кнопка] ' + i.cta);
  });
  (s.images || []).forEach(c => o.push('[картинка] ' + c));
  (s.cta || []).forEach(c => o.push('[кнопка] ' + c));
  return o.join('\n');
};
G.src = b => { if (b._srcFor !== b.text) { b._src = G.parse(b.text); b._srcFor = b.text; } return b._src; };

/* ---------- страница ---------- */
G.newPage = (name, scenarioId, text) => ({id: G.uid('p'), name: name || 'Без названия', scenario: scenarioId, text: text || '', blocks: [], story: [], created: Date.now(), updated: Date.now()});
G.newBlock = (role, text = '') => ({id: G.uid(), role, text, tpl: null, tplLock: false, values: null, valuesFor: '', valuesBy: '', images: {}, tips: []});
G.stale = () => false; /* значений отдельно от текста больше нет */
G.paras = (text, max) => { const out = []; let n = 0; for (const l of String(text || '').split(/\n+/).map(x => x.trim()).filter(Boolean)) { if (max && n + l.length > max) break; out.push(l); n += l.length; } return out; };
/* целевое действие: роль блока или шаблон целевого действия (форма) — у статьи роли нет, но шаблон можно поставить */
G.isCta = b => b.role === 'cta' || b.role === 'subscribe' || (() => { const t = G.tpl(b.tpl); return !!(t && t.roles && t.roles.includes('cta')); })();

/* ---------- иконки: выбор из каталога и автоподбор по словам блока ---------- */
G.icons = () => BUILT.icons; /* только каталог из репозитория: свои SVG не загружаются */
const stem = w => w.toLowerCase().replace(/ё/g, 'е').slice(0, 5);
const words = s => String(s || '').toLowerCase().split(/[^а-яёa-z0-9]+/i).filter(w => w.length >= 3).map(stem);
G.iconMatch = (text, n = 12) => {
  const q = new Set(words(text)); if (!q.size) return [];
  return G.icons().map(ic => { const tw = words(ic.name + ' ' + (ic.tags || '')); let sc = 0; tw.forEach(w => { if (q.has(w)) sc++; }); return {ic, sc}; }).filter(x => x.sc).sort((a, b) => b.sc - a.sc).slice(0, n).map(x => x.ic);
};
/* текст слота: у элемента — его заголовок и текст, у блока — заголовок и первый абзац */
G.iconText = (b, key) => { const s = G.src(b); if (key && key[0] === 'i') { const it = s.items[+key.slice(1)] || {}; return [it.title, it.text].join(' '); } return [s.title, s.lead].join(' '); };
/* выбранная иконка или подобранная автоматически */
G.iconFor = (b, key) => { const im = (b.images || {})[key] || {}; if (im.icon) { const ic = G.icons().find(x => x.id === im.icon); if (ic) return {ic, auto: false}; } const m = G.iconMatch(G.iconText(b, key), 1)[0]; return m ? {ic: m, auto: true} : null; };
