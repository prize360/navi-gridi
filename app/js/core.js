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
/* пространство хранения: у экспериментальной копии своё, чтобы не смешиваться с пилотом (тот же адрес prize360.github.io) */
G.NS = 'gridi';
G.ls = {
  get(k, d) { try { const v = localStorage.getItem(G.NS + '.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(G.NS + '.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
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
/* своя копия системного элемента после обновления библиотеки: новые поля из системного дописываются, свои правки не трогаются.
   У сценария — и в блоках с тем же id */
G.mergeNew = (sys, mine) => { const o = {...mine};
  for (const k in sys) if (!(k in o)) o[k] = sys[k];
  if (Array.isArray(sys.roles) && Array.isArray(o.roles)) o.roles = o.roles.map(r => { const sr = sys.roles.find(x => x.id === r.id); if (!sr) return r; const m = {...r}; for (const k in sr) if (!(k in m)) m[k] = sr[k]; return m; });
  if (mine._base && mine._base !== BUILT_SETTINGS.version) o._update = true;
  return o; };
G.lib = {
  local(kind) { return G.ls.get('lib.' + kind, {items: {}, removed: []}); },
  saveLocal(kind, v) { G.ls.set('lib.' + kind, v); },
  _cache: {},
  all(kind) {
    if (this._cache[kind]) return this._cache[kind];
    const loc = this.local(kind), out = [];
    for (const o of BUILT[kind]) {
      if (loc.removed.includes(o.id)) continue;
      /* правка участника сохраняется и после обновления библиотеки: новая version её не прячет */
      const li = loc.items[o.id] || null;
      out.push(li ? {...G.mergeNew(o, li), _local: 'changed'} : {...o});
    }
    for (const id in loc.items) if (!BUILT[kind].some(o => o.id === id)) out.push({...loc.items[id], _local: 'new'});
    return (this._cache[kind] = out);
  },
  get(kind, id) { return this.all(kind).find(o => o.id === id) || null; },
  save(kind, obj) {
    const loc = this.local(kind), o = {...obj, _base: BUILT_SETTINGS.version}; delete o._local; delete o._update;
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
    const head = `/* ${KINDS[kind]} Гриди. Описание полей — в документе разработки.\n   Скачано из Гриди ${new Date().toLocaleString('ru-RU')}. Замените этим файлом library/${kind}.js и поменяйте version в library/settings.js. */\n`;
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
/* правила сценария — в терминах ответа своего промта: правило в чужом формате модель выполняет вместо основного */
/* правила сценария уходят в промт разбора: пишите их в терминах ролей сценария и формы текста, без слов конкретной редакции */
G.rulesLint = (kind, rules) => 'Правила уточняют разбор, формат ответа они не меняют. Пишите в терминах ролей сценария (их названия — в списке блоков) и формы текста: заголовок, пункты, кнопка, подпись.';
const SYS_ROLES = {hero: {id: 'hero', name: 'Первый экран', meaning: 'Заголовок, главное сообщение и действие'}, cta: {id: 'cta', name: 'Целевое действие', meaning: 'Кнопка или форма — главное действие страницы'}, unparsed: {id: 'unparsed', name: 'Не разобрано', meaning: 'Абзацы, которые модель не разложила по блокам', verbatim: true, system: true}};
/* роль блока: из сценария, иначе — общая роль того же вида страницы (library/scenarios.js), иначе служебная */
const sharedRole = (sc, id) => { const r = (G.ROLES || []).find(x => x.id === id && x.kind === (sc.kind || 'landing')); if (!r) return null; const o = {...r}; delete o.kind; return o; };
G.roleId = id => (G.ROLE_ALIAS || {})[id] || id;
G.roleOf = (sc, roleId) => { roleId = G.roleId(roleId); return (sc.roles || []).find(r => r.id === roleId) || sharedRole(sc, roleId) || SYS_ROLES[roleId] || {id: roleId, name: roleId, meaning: ''}; };
/* все роли для выбора и для разбора: сначала роли сценария по порядку, потом остальные общие роли того же вида */
G.allRoles = sc => { const own = sc.roles || [], ids = new Set(own.map(r => r.id));
  return [...own, ...(G.ROLES || []).filter(r => r.kind === (sc.kind || 'landing') && !ids.has(r.id)).map(r => sharedRole(sc, r.id))]; };

/* ---------- хранение страниц: IndexedDB, запасной вариант — localStorage ---------- */
const DB = {db: null, fallback: false};
DB.open = () => new Promise(res => {
  if (DB.db || DB.fallback) return res();
  try {
    const r = indexedDB.open(G.NS, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('pages', {keyPath: 'id'});
    r.onsuccess = () => { DB.db = r.result; res(); };
    r.onerror = () => { DB.fallback = true; res(); };
  } catch (e) { DB.fallback = true; res(); }
});
const tx = (mode, fn) => new Promise((res, rej) => { const t = DB.db.transaction('pages', mode); const s = t.objectStore('pages'); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); });
/* формат хранения страницы: номер в самой странице. Поменяется формат — сюда добавляется шаг миграции,
   старые страницы участников обновятся при открытии, а не сломаются.
   Не переименовывать: базу G.NS, хранилище 'pages', ключи G.NS + '.*' — иначе у всех «пропадут» страницы. */
G.SCHEMA = 1;
G.migrate = p => {
  if (!p) return p;
  if (!p.schema) p.schema = 1;
  /* шаблон блока ищется по id; если id сменился, а название осталось — по названию */
  (p.blocks || []).forEach(b => { if (b.tpl && !G.tpl(b.tpl) && b.tplName) { const t = G.tplByName(b.tplName); if (t) b.tpl = t.id; } });
  return p;
};
G.store = {
  async list() { await DB.open(); const a = DB.fallback ? Object.values(G.ls.get('pages', {})) : await tx('readonly', s => s.getAll()); return (a || []).map(G.migrate); },
  async get(id) { await DB.open(); return G.migrate(DB.fallback ? G.ls.get('pages', {})[id] || null : await tx('readonly', s => s.get(id))); },
  async put(p) { p.updated = Date.now(); p.schema = p.schema || G.SCHEMA; (p.blocks || []).forEach(b => { const t = b.tpl && G.tpl(b.tpl); if (t) b.tplName = t.name; }); await DB.open(); if (DB.fallback) { const a = G.ls.get('pages', {}); a[p.id] = p; G.ls.set('pages', a); return; } return tx('readwrite', s => s.put(G.clone(p))); },
  async del(id) { await DB.open(); if (DB.fallback) { const a = G.ls.get('pages', {}); delete a[id]; G.ls.set('pages', a); return; } return tx('readwrite', s => s.delete(id)); },
};

/* ---------- разметка ----------
   Все правила — в документе разработки «Как Гриди разбирает текст». Номера в комментариях (Р1, В2…) — оттуда.
   Строки: [h1] [h2] [h3] заголовки · абзац · «- пункт» · «@ подпись» · «[кнопка] текст | ссылка» · «[картинка] подпись» · «a | b | c» строка таблицы.
   Связи строк — только по их положению, смысл текста не угадывается. Пустые строки смысла не имеют. */
const RX = {
  h: /^\[(h[1-4])\]\s*(.*)$/i, meta: /^@\s*(.*)$/, item: /^(?:[-–•*]|\d+[.)])\s+(.*)$/,
  btn: /^\[(?:кнопка|ссылка|button|btn|link)\]\s*(.*)$/i, img: /^\[(?:картинка|фото|image|img)\]\s*(.*)$/i,
};
G.RX = RX;
/* одна строка → вид. Единая грамматика для разбора, редактора «Текст» и промтов */
G.lineKind = l => {
  let m; l = String(l || '').trim();
  if ((m = l.match(RX.h))) return {k: m[1].toLowerCase(), t: m[2].trim()};
  if ((m = l.match(RX.meta))) return {k: 'meta', t: m[1].trim()};
  if ((m = l.match(RX.btn))) return {k: 'btn', t: m[1].trim()};
  if ((m = l.match(RX.img))) return {k: 'img', t: m[1].trim()};
  if ((m = l.match(RX.item))) return {k: 'li', t: m[1].trim()};
  return {k: 'p', t: l};
};
G.MARKED = l => G.lineKind(l).k !== 'p';
/* кнопка: «Текст | адрес» — адрес только если похож на ссылку */
G.splitBtn = t => { const um = String(t).match(/^(.*?)\s+\|\s+((?:https?:\/\/|www\.|\/|#|mailto:|tel:)\S*)$/i); return {txt: (um ? um[1] : t).trim(), url: um ? um[2] : ''}; };
/* Р2: деление пункта на заголовок и текст — по одному разделителю, общему для всех пунктов блока */
const TIME = /^((?:\d{1,2}[:.]\d{2}(?:\s*[–-]\s*\d{1,2}[:.]\d{2})?)|(?:\d{1,2}\s+(?:январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр)[а-яё]*))\s+(?:[—–-]\s+)?(\S.*)$/i;
const SPLIT = [
  {sep: ' — ', min: 1, rx: /^(.{1,90}?)\s+[—–]\s+(.+)$/},
  {sep: ': ', min: 2, rx: /^([^:]{1,70}):\s+(.+)$/},
  {sep: '. ', min: 2, rx: /^([^.!?:—–]{2,60}?)\.\s+(\S.*)$/},
  {sep: ' ', min: 1, rx: TIME},
];
G.splitItems = raws => {
  for (const S of SPLIT) if (raws.length >= S.min && raws.every(x => S.rx.test(x))) return raws.map(x => { const m = x.match(S.rx); return {title: m[1].trim(), text: m[2].trim(), sep: S.sep === ' — ' ? ' — ' : S.sep}; });
  return raws.map(x => ({title: '', text: x}));
};
/* Р6: таблица — две строки и больше с одинаковым числом « | » */
const cols = l => String(l).split(' | ').length;
G.isTable = rows => rows.length >= 2 && rows.every(r => r.includes(' | ') && !G.MARKED(r) && cols(r) === cols(rows[0]));
G.parse = text => {
  const src = {title: '', level: '', meta: [], paras: [], items: [], cta: [], images: [], urls: []};
  const L = String(text || '').split('\n').map(x => x.trim()).filter(Boolean).map(G.lineKind)
    /* пустой заголовок — не заголовок; «заголовок» длиннее 120 знаков — абзац */
    .filter(x => !(/^h/.test(x.k) && !x.t)).map(x => /^h/.test(x.k) && x.t.length > 120 ? {k: 'p', t: x.t} : x)
    .map(x => x.k === 'h4' ? {...x, k: 'h3'} : x);
  /* Р4: заголовок блока — первый [h1]/[h2]; [h3] — заголовок блока, только если он один в блоке и стоит до пунктов */
  const h3n = L.filter(x => x.k === 'h3').length, hasH12 = L.some(x => x.k === 'h1' || x.k === 'h2');
  let last = null, item = null; const raws = [];
  for (const x of L) {
    const isTitle = !src.title && !src.items.length && (x.k === 'h1' || x.k === 'h2' || (x.k === 'h3' && !hasH12 && h3n === 1));
    if (isTitle) { src.title = x.t; src.level = x.k; last = 'title'; item = null; }
    else if (/^h/.test(x.k)) { item = {title: x.t, text: '', meta: '', cta: '', h3: true}; src.items.push(item); last = 'card'; } /* Р3 */
    else if (x.k === 'meta') { if ((last === 'item' || last === 'card') && item) item.meta = item.meta ? item.meta + ' · ' + x.t : x.t; else src.meta.push(x.t); } /* Р1 */
    else if (x.k === 'btn') { const {txt, url} = G.splitBtn(x.t); if (!txt) continue;
      if ((last === 'item' || last === 'card') && item && !item.cta) { item.cta = txt; item.url = url; } else { src.cta.push(txt); src.urls[src.cta.length - 1] = url; } }
    else if (x.k === 'img') { src.images.push(x.t); }
    else if (x.k === 'li') { item = {raw: x.t, title: '', text: x.t, meta: '', cta: ''}; raws.push(item); src.items.push(item); last = 'item'; }
    else if (last === 'card' && item) { item.text = item.text ? item.text + '\n' + x.t : x.t; } /* Р3: абзацы под [h3] — текст карточки */
    else { src.paras.push(x.t); last = 'para'; item = null; }
  }
  /* Р2 */
  G.splitItems(raws.map(i => i.raw)).forEach((sp, k) => { Object.assign(raws[k], sp); delete raws[k].raw; });
  /* Р5: кнопки пунктов — только если кнопка есть у каждого пункта; иначе это кнопки блока, по порядку */
  if (src.items.some(i => i.cta) && !src.items.every(i => i.cta)) {
    const moved = src.items.filter(i => i.cta).map(i => ({txt: i.cta, url: i.url || ''}));
    src.items.forEach(i => { i.cta = ''; delete i.url; });
    const rest = src.cta.map((c, k) => ({txt: c, url: src.urls[k] || ''})), all = [...moved, ...rest];
    src.cta = all.map(x => x.txt); src.urls = all.map(x => x.url);
  }
  src.lead = src.paras.join('\n\n');
  src.table = G.isTable(src.paras.filter(p => p.includes(' | ')));
  return src;
};
/* ---------- разметка при вставке (В-правила): один раз, результат виден в «Тексте» и его можно поправить ---------- */
/* В2: список без маркеров — после строки с двоеточием идут строки на «;», последняя на «.» */
G.unmarkedLists = ls => {
  const out = [...ls], plain = l => l.trim() && !G.MARKED(l);
  for (let i = 0; i < out.length; i++) {
    if (!plain(out[i]) || !/:\s*$/.test(out[i].trim())) continue;
    let j = i + 1; while (j < out.length && plain(out[j]) && /;\s*$/.test(out[j].trim()) && out[j].trim().length <= 300) j++;
    const lastOk = j < out.length && plain(out[j]) && out[j].trim().length <= 300 && /[.!]\s*$/.test(out[j].trim());
    const n = j - (i + 1) + (lastOk ? 1 : 0);
    if (n >= 2) { for (let k = i + 1; k < i + 1 + n; k++) out[k] = '- ' + out[k].trim(); i += n; }
  }
  return out;
};
G.premark = text => {
  const used = new Set(); let ls = String(text || '').split('\n');
  const l2 = G.unmarkedLists(ls); if (l2.some((l, i) => l !== ls[i])) used.add('В2'); ls = l2;
  /* В3: строка «Текст | https://…» без разметки — кнопка */
  ls = ls.map(l => { const t = l.trim(); if (!G.MARKED(t) && t.split(' | ').length === 2 && /^.{1,60}\s\|\s(?:https?:\/\/|www\.)\S+$/.test(t)) { used.add('В3'); return '[кнопка] ' + t; } return l; });
  return {text: ls.join('\n'), used: [...used]};
};
G.serialize = (s, opts = {}) => {
  const o = [];
  const meta = () => (s.meta || []).filter(Boolean).forEach(m => o.push('@ ' + m));
  if (s.title) { o.push(`[${s.level || opts.level || 'h2'}] ${s.title}`); meta(); }
  if (s.lead) o.push(...String(s.lead).split(/\n+/).filter(Boolean));
  if (!s.title) meta();
  (s.items || []).forEach(i => {
    if (i.h3) { o.push('[h3] ' + i.title); if (i.text) o.push(...String(i.text).split('\n')); }
    else o.push('- ' + (i.title && i.text ? i.title + (i.sep || ' — ') + i.text : i.title || i.text));
    if (i.meta) o.push('@ ' + i.meta);
    if (i.cta) o.push('[кнопка] ' + i.cta + (i.url ? ' | ' + i.url : ''));
  });
  (s.images || []).forEach(c => o.push('[картинка] ' + c));
  (s.cta || []).forEach((c, k) => o.push('[кнопка] ' + c + ((s.urls || [])[k] ? ' | ' + s.urls[k] : '')));
  return o.join('\n');
};
G.src = b => { if (b._srcFor !== b.text) { b._src = G.parse(b.text); b._srcFor = b.text; } return b._src; };

/* ---------- страница ---------- */
G.newPage = (name, scenarioId, text) => ({schema: G.SCHEMA, id: G.uid('p'), name: name || 'Без названия', scenario: scenarioId, text: text || '', blocks: [], story: [], created: Date.now(), updated: Date.now()});
G.newBlock = (role, text = '') => ({id: G.uid(), role, text, tpl: null, tplLock: false, values: null, valuesFor: '', valuesBy: '', images: {}, tips: []});
G.stale = () => false; /* значений отдельно от текста больше нет */
G.paras = (text, max) => { const out = []; let n = 0; for (const l of String(text || '').split(/\n+/).map(x => x.trim()).filter(Boolean)) { if (max && n + l.length > max) break; out.push(l); n += l.length; } return out; };
/* целевое действие: роль блока или шаблон целевого действия (форма) — у статьи роли нет, но шаблон можно поставить */
G.isCta = b => b.role === 'cta' || b.role === 'subscribe' || (() => { const t = G.tpl(b.tpl); return !!(t && t.roles && t.roles.includes('cta')); })();

/* ---------- иконки: выбор из каталога и автоподбор по словам блока ---------- */
/* иконки — только из каталога репозитория; свои у пользователя только слова для поиска (теги) */
G.icons = () => BUILT.icons.map(b => { const l = G.lib.get('icons', b.id); return l && l._local ? {...b, tags: l.tags} : b; });
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
/* вставка из Google Docs и Word: заголовки, списки, картинки, таблицы → разметка */
G.htmlToMarkup = html => {
  const d = new DOMParser().parseFromString(html, 'text/html'), out = [];
  const walk = n => {
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase(), t = () => n.textContent.replace(/\s+/g, ' ').trim();
    if (/^h1$/.test(tag)) return out.push('[h1] ' + t());
    if (/^h2$/.test(tag)) return out.push('[h2] ' + t());
    if (/^h[3-6]$/.test(tag)) return out.push('[h3] ' + t());
    if (tag === 'li') return out.push('- ' + t());
    if (tag === 'img') return n.alt ? out.push('[картинка] ' + n.alt) : null;
    if (tag === 'tr') return out.push([...n.children].map(c => c.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
    if (tag === 'p' || tag === 'div' && !n.querySelector('p,div,li,h1,h2,h3,table,img')) {
      const x = t(), a = n.querySelector('a[href]');
      if (x && a && a.textContent.trim().length >= x.length / 2) out.push('[кнопка] ' + x + ' | ' + a.getAttribute('href'));
      else if (x) out.push(x);
      n.querySelectorAll('img').forEach(walk); return;
    }
    [...n.children].forEach(walk);
  };
  [...d.body.children].forEach(walk);
  return out.join('\n');
};
