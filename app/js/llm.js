/* Гриди — промты, модель, разбор ответов */
'use strict';
(() => {
const G = window.Gridi;

G.fill = (text, vars) => String(text).replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, k) => vars[k] != null ? vars[k] : '');
G.parseJSON = t => {
  t = String(t || '').trim(); const f = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) t = f[1].trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = Math.min(...['{', '['].map(c => t.indexOf(c)).filter(i => i >= 0)), z = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (isFinite(a) && z > a) { try { return JSON.parse(t.slice(a, z + 1)); } catch (e) {} }
  return null;
};

/* ---------- модель: свой ключ или вручную ---------- */
G.llmSettings = () => ({mode: 'manual', base: 'https://api.deepseek.com', model: 'deepseek-chat', key: '', ...G.ls.get('llm', {})});
G.log = [];
/* один запрос к модели: текст ответа; у части бесплатных моделей ответ лежит в reasoning, а content пустой */
G.callModel = async (st, prompt, {signal, max_tokens} = {}) => {
  const body = {model: st.model, messages: [{role: 'user', content: prompt}], temperature: 0.2}; if (max_tokens) body.max_tokens = max_tokens;
  const r = await fetch(st.base.replace(/\/$/, '') + '/chat/completions', {method: 'POST', signal, headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + st.key}, body: JSON.stringify(body)});
  const t = await r.text();
  if (!r.ok) { let m = ''; try { m = JSON.parse(t).error.message; } catch (e) {} const err = new Error(G.httpReason(r.status) + (m ? ` (${m.slice(0, 120)})` : '')); err.status = r.status; throw err; }
  let msg = {}; try { msg = JSON.parse(t).choices[0].message || {}; } catch (e) { throw new Error('Сервис ответил не в формате OpenAI API.'); }
  return String(msg.content || msg.reasoning_content || msg.reasoning || '').trim();
};
G.httpReason = c => c === 401 ? 'Ключ не подходит' : c === 402 ? 'Закончились деньги или лимит на ключе' : c === 404 ? 'Модель с таким названием не найдена' : c === 429 ? 'Лимит бесплатного тарифа: слишком много запросов, попробуйте через минуту' : c >= 500 ? 'Сервис модели сейчас недоступен' : 'Модель ответила ошибкой ' + c;
/* перед работой — короткая проверка, что модель отвечает и умеет вернуть JSON; результат помним 10 минут */
G.modelReady = async () => {
  const st = G.llmSettings(); if (st.mode !== 'api' || !st.key) return false;
  if (G._modelOkAt && Date.now() - G._modelOkAt < 600000) return true;
  const busy = G.ui.busy('Проверяю, что модель отвечает', {limit: 45});
  try { const a = await G.callModel(st, 'Верни только JSON без пояснений: {"ok": true}', {signal: busy.signal, max_tokens: 400}); const j = G.parseJSON(a);
    if (!j) throw new Error('модель отвечает, но не возвращает JSON — для адаптации она не подойдёт');
    G._modelOkAt = Date.now(); return true;
  } catch (e) { G.ui.toast(`Модель не готова: ${busy.timedOut ? 'не ответила за 45 секунд' : e.name === 'AbortError' ? 'проверка отменена' : e.message}. Этот запрос — вручную.`); return false; }
  finally { busy.done(); }
};
G.ask = async (label, prompt) => {
  if (G._asking) throw new Error('Модель ещё отвечает на прошлый запрос — дождитесь или отмените его.');
  const s = G.llmSettings(), rec = {label, prompt, at: new Date(), raw: '', ok: false};
  G.log.unshift(rec); G.log = G.log.slice(0, 30);
  G._asking = true;
  try {
    if (s.mode === 'api' && s.key && await G.modelReady()) {
      const busy = G.ui.busy(label, {limit: 240, slow: 'Бесплатные модели бывают медленными: ответ может идти 1–3 минуты.'});
      try { rec.raw = await G.callModel(s, prompt, {signal: busy.signal}); if (!rec.raw) throw new Error('Модель вернула пустой ответ'); }
      catch (e) {
        rec.err = e.message; G._modelOkAt = 0;
        if (e.name === 'AbortError' && !busy.timedOut) throw new Error('cancel');
        G.ui.toast((busy.timedOut ? 'Модель не ответила за 4 минуты' : /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? 'Модель недоступна из браузера' : e.message) + '. Переключаюсь на ручной режим для этого запроса.');
        rec.raw = '';
      } finally { busy.done(); }
    }
    if (!rec.raw) rec.raw = await G.ui.manualAsk(label, prompt);
  } finally { G._asking = false; }
  const json = G.parseJSON(rec.raw); rec.ok = !!json;
  { const st = G.ls.get('stats', {asks: {}}), a = st.asks[label] || (st.asks[label] = {n: 0, ok: 0, api: 0}); a.n++; if (json) a.ok++; if (s.mode === 'api' && s.key && !rec.err) a.api++; G.ls.set('stats', st); }
  if (!json) throw new Error('В ответе модели нет JSON. Попросите её вернуть только JSON.');
  return json;
};

/* ---------- пересборка под другой сценарий: новая страница-копия ---------- */
G.convertPrompt = (page, sc) => {
  const p = G.lib.all('prompts').find(x => x.id === 'convert');
  const src = page.blocks.length ? page.blocks.map(b => b.text).join('\n\n') : page.text;
  return G.fill(p.text, {'тип': sc.name, 'действие': sc.action || 'нет', 'структура': sc.roles.map(r => `- ${r.name}${r.items ? ' — до ' + r.items + ' пунктов' : ''}`).join('\n'), 'правила': (sc.rules || []).map(r => '- ' + r).join('\n'), 'материал': String(src).slice(0, sc.maxText || 14000)});
};
G.convertPage = async (page, scId) => {
  const sc = G.scenario(scId), j = await G.ask('Пересборка: ' + sc.name, G.convertPrompt(page, sc));
  if (!j || !j.text) throw new Error('В ответе нет текста страницы.');
  const np = G.newPage(page.name.replace(/ \(.+\)$/, '') + ' (' + sc.name.toLowerCase() + ')', scId, String(j.text).replace(/\\n/g, '\n'));
  G.assemble(np); np.story = (j.notes || []).map(String);
  return np;
};

/* ---------- разбор: промт ---------- */
G.segPrompt = (page, scObj) => {
  const sc = scObj || G.scenario(page.scenario), art = sc.kind === 'article';
  const p = G.lib.all('prompts').find(x => x.stage === 'split' && x.for === (art ? 'article' : 'landing'));
  const paras = G.paras(page.text, sc.maxText);
  return G.fill(p.text, {
    'тип': sc.name, 'действие': sc.action,
    'структура': sc.roles.map(r => `${r.id} — ${r.name}${r.items ? ' — до ' + r.items : ''}${r.kinds ? ' — kind: ' + Object.keys(r.kinds).join(', ') : ''}`).join('\n'),
    'правила': (sc.rules || []).map(r => '- ' + r).join('\n'),
    'размер': (sc.rhythm && sc.rhythm.maxRun) || 1000,
    'абзацы': paras.map((l, i) => art ? `[${i + 1}|${l.length}] ${l}` : `[${i + 1}] ${l}`).join('\n'),
  });
};
const refs = (v, P) => {
  if (v == null || v === '') return [];
  const out = [];
  for (const part of String(v).split(/[,\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/); if (!m) continue;
    const a = +m[1], z = m[2] ? +m[2] : a;
    for (let i = a; i <= z && i - a < 200; i++) if (P[i - 1] != null) out.push(i);
  }
  return out;
};
const txt = (v, P) => refs(v, P).map(i => P[i - 1]).join('\n');
const stripMarks = s => String(s || '').replace(/^\s*(\[(h[1-4]|кнопка|картинка)\]|@|[-•]\s)\s*/i, '').trim();

/* ответ разбора → блоки */
/* страховка ответа разбора статьи: повторы убираются, потерянные абзацы возвращаются в текст,
   очевидное (оглавление, «Читайте также», строки таблицы) — по правилам, а не по модели */
/* оглавление («Содержание», «Что в статье») и пункты под ним — служебные строки, в разбор не идут */
const TOC = /^(\[h[1-4]\]\s*)?(содержание|оглавление|что в статье|в статье)\s*:?$/i;
const tocLines = P => {
  const out = [];
  P.forEach((l, n) => { if (TOC.test(l)) { out.push(n + 1); for (let i = n + 1; i < P.length && /^(?:[-–•*]|\d+[.)])\s+/.test(P[i]); i++) out.push(i + 1); } });
  return out;
};
/* абзац, который отсылает к другому материалу, — cta: «Подробнее — в материале», «…— здесь», «в разделе дайджестов» */
const REF = /(^(читайте|читать|смотрите) также(?![а-яё])|подробнее\s*[—–-]?\s*(в|на|здесь|по ссылке)(?![а-яё])|[—–-]\s*здесь\.?$|(^|\s)в разделе(?![а-яё])|полная версия(?![а-яё])|^узнать (больше|подробнее)(?![а-яё])|^\[ссылка\])/i;
G.fixSplit = (json, P) => {
  const blocks = (json.blocks || []).map(b => ({...b})), used = new Set();
  const toc = tocLines(P); toc.forEach(i => used.add(i));
  const keys = ['h', 'paras', 'author', 'button'];
  const take = v => refs(v, P).filter(i => !used.has(i) && used.add(i));
  for (const b of blocks) {
    for (const k of keys) if (b[k]) b[k] = take(b[k]).join(',');
    if (Array.isArray(b.items)) b.items = b.items.map(x => ({h: take(x.h).join(','), p: take(x.p).join(',')})).filter(x => x.h || x.p);
    else if (b.items) b.items = take(b.items).join(',');
  }
  const out = blocks.filter(b => keys.some(k => b[k]) || (b.items && b.items.length));
  if (toc.length) out.splice(Math.max(0, out.findIndex(b => b.type !== 'head') < 0 ? out.length : out.findIndex(b => b.type !== 'head')), 0, {type: 'skip', paras: toc.join(',')});
  /* потерянные абзацы — в ближайший текст перед ними или новым текстом */
  const where = b => Math.min(...[...keys.flatMap(k => refs(b[k], P)), ...(Array.isArray(b.items) ? b.items.flatMap(x => [...refs(x.h, P), ...refs(x.p, P)]) : refs(b.items, P))]);
  P.forEach((txt, n) => {
    const i = n + 1; if (used.has(i)) return;
    let at = out.findIndex(b => where(b) > i); if (at < 0) at = out.length;
    const prev = out[at - 1];
    if (prev && prev.type === 'text') prev.paras = [prev.paras, i].filter(Boolean).join(',');
    else out.splice(at, 0, {type: /^(поделиться)/i.test(txt) ? 'skip' : 'text', paras: String(i)});
    used.add(i);
  });
  /* правила без модели */
  for (const b of out) {
    const ps = refs(b.paras, P);
    if (ps.length === 1 && REF.test(P[ps[0] - 1]) && (b.type === 'text' || b.type === 'short')) b.type = 'cta';
    /* баннер: картинка и ссылка-кнопка в одном блоке — cta, а не подпись к картинке */
    if (b.type === 'image' && ps.some(i => /^\[картинка\]/i.test(P[i - 1])) && ps.some(i => /^\[ссылка\]/i.test(P[i - 1]))) { b.type = 'cta'; b.button = String(ps.filter(i => /^\[ссылка\]/i.test(P[i - 1])).pop()); b.paras = ps.filter(i => String(i) !== b.button).join(','); }
    if (ps.length > 1 && ps.every(i => P[i - 1].includes(' | ')) && b.type === 'text') b.type = 'table';
  }
  return {...json, blocks: out};
};
G.applySeg = (page, json) => {
  const sc = G.scenario(page.scenario), P = G.paras(page.text, sc.maxText).map(stripMarks), roles = sc.roles.map(r => r.id);
  const blocks = [];
  if (sc.kind === 'article') {
    json = G.fixSplit(json, P);
    let pendingTitle = '', firstText = true;
    for (const x of json.blocks || []) {
      const ty = x.type || 'text';
      if (ty === 'skip') continue;
      const h = x.h ? txt(x.h, P) : '';
      if (ty === 'head') { const ps = refs(x.paras, P).map(i => P[i - 1]); blocks.push(G.newBlock('hero', G.serialize({title: ps[0] || '', level: 'h1', meta: ps.slice(1).filter(l => l.length < 90), lead: ps.slice(1).filter(l => l.length >= 90).join('\n')}))); continue; }
      if (ty === 'text') {
        const body = refs(x.paras, P).filter(i => String(i) !== String(x.h)).map(i => P[i - 1]).join('\n');
        if (!body && h) { pendingTitle = h; continue; }
        const title = h || pendingTitle; pendingTitle = '';
        if (firstText && !title && G.len(body) <= 600 && !blocks.some(b => b.role === 'content')) blocks.push(G.newBlock('lead', body));
        else blocks.push(G.newBlock('content', G.serialize({title, lead: body})));
        firstText = false; continue;
      }
      const v = {title: pendingTitle || h, lead: '', items: [], meta: [], cta: [], images: []}; pendingTitle = '';
      if (ty === 'short') v.lead = txt(x.paras, P);
      if (ty === 'list') {
        v.items = Array.isArray(x.items) ? x.items.map(i => ({title: txt(i.h, P), text: txt(i.p, P), h3: true})) : refs(x.items, P).map(i => G.splitItem(P[i - 1]));
        const intro = refs(x.paras, P).map(i => P[i - 1]).join('\n'); if (intro) v.lead = intro;
      }
      if (ty === 'cta') { v.lead = refs(x.paras, P).filter(i => String(i) !== String(x.button)).map(i => P[i - 1]).join('\n'); if (x.button) v.cta = [txt(x.button, P)]; }
      if (ty === 'quote') { v.lead = refs(x.paras, P).filter(i => String(i) !== String(x.author)).map(i => P[i - 1]).join('\n'); if (x.author) v.meta = [txt(x.author, P)]; }
      if (ty === 'number') { const ps = refs(x.paras, P).map(i => P[i - 1]); v.items = [{title: ps[0] || '', text: ps.slice(1).join(' ')}]; }
      if (ty === 'table') v.lead = refs(x.paras, P).map(i => P[i - 1]).join('\n');
      if (ty === 'faq') v.items = (Array.isArray(x.items) ? x.items : []).map(i => ({title: txt(i.h, P), text: txt(i.p, P), h3: true}));
      if (ty === 'image') v.images = refs(x.paras, P).map(i => P[i - 1]);
      const b = G.newBlock('vrez', G.serialize(v, {level: 'h3'}));
      if (ty === 'table') b.tpl = 'table', b.tplLock = true;
      if (ty === 'faq') b.tpl = 'accordion', b.tplLock = true;
      blocks.push(b);
    }
  } else {
    for (const x of json.blocks || []) {
      const role = roles.includes(x.role || x.slot) ? (x.role || x.slot) : 'about';
      let items = [];
      if (typeof x.items === 'string') items = refs(x.items, P).map(i => G.splitItem(P[i - 1]));
      else items = (x.items || []).map(i => ({title: i.title || '', text: i.p ? txt(i.p, P) : i.text || '', meta: i.meta || '', cta: i.cta || ''}));
      const lead = [x.lead, txt(x.paras, P)].filter(Boolean).join('\n');
      const b = G.newBlock(role, G.serialize({title: x.title || '', level: role === 'hero' ? 'h1' : 'h2', meta: x.meta ? [x.meta] : [], lead, items, cta: (x.cta || []).filter(Boolean), images: x.images || []}));
      b.tips = (x.tips || []).filter(Boolean);
      blocks.push(b);
    }
  }
  /* текст не теряется: абзацы исходника, которых нет ни в одном блоке, — в конец отдельным блоком */
  const norm = t => String(t || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
  const all = norm(blocks.map(b => b.text).join(' '));
  const lost = P.filter(x => { const n = norm(x); return n.length > 3 && !all.includes(n.slice(0, 60)); });
  if (lost.length) { const role = sc.kind === 'article' ? 'content' : (roles.includes('about') ? 'about' : roles.find(r => r !== 'hero' && r !== 'cta') || roles[0]);
    const b = G.newBlock(role, lost.join('\n')); b.tips = [`Модель не разложила эти ${G.num(lost.length, 'абзац', 'абзаца', 'абзацев')} — разнесите по блокам сами или запустите разбор ещё раз.`]; blocks.push(b); }
  page.blocks = blocks; page.story = (json.story || []).filter(Boolean);
  G.autoPick(page);
  return {lost: lost.length, total: P.length};
};

/* ---------- сборка по разметке, без модели ---------- */
G.assemble = page => {
  const sc = G.scenario(page.scenario), lines = String(page.text || '').split('\n'), blocks = [];
  if (sc.kind === 'article') {
    let cur = null, mode = '';
    const flush = () => { if (cur && cur.lines.join('').trim()) blocks.push(G.newBlock(cur.role, cur.lines.join('\n').trim())); cur = null; mode = ''; };
    const start = (role, l) => { flush(); cur = {role, lines: l ? [l] : []}; };
    for (const raw of lines) {
      const l = raw.trim(); if (!l) continue;
      if (/^-{3,}$/.test(l)) { flush(); continue; } /* --- — новый блок */
      const isH1 = /^\[h1\]/i.test(l), isH2 = /^\[h2\]/i.test(l), isList = /^(?:[-–•*]|\d+[.)])\s+/.test(l) || /^\[h3\]/i.test(l), isImg = /^\[(картинка|фото)\]/i.test(l), isBtn = /^\[кнопка\]/i.test(l), isMeta = /^@/.test(l), isTable = l.includes(' | ');
      if (isH1) { start('hero', l); mode = 'hero'; continue; }
      if (mode === 'hero' && (isMeta)) { cur.lines.push(l); continue; }
      if (isH2) { start('content', l); mode = 'text'; continue; }
      if (isImg) { if (mode !== 'img') { start('vrez'); mode = 'img'; } cur.lines.push(l); continue; }
      if (isTable) { if (mode !== 'table') { start('vrez'); mode = 'table'; } cur.lines.push(l); continue; }
      if (isList) { if (mode !== 'list') { const keepTitle = cur && cur.role === 'content' && cur.lines.length === 1 && /^\[h2\]/i.test(cur.lines[0]) ? cur.lines.pop() : null; if (keepTitle !== null && !cur.lines.length) cur = null; start('vrez', keepTitle); mode = 'list'; } cur.lines.push(l); continue; }
      if (isBtn) {
        if (cur && cur.role === 'content') { const prev = cur.lines[cur.lines.length - 1] || ''; const take = prev && !/^\[/.test(prev) && prev.length <= 240 ? cur.lines.pop() : null; start('vrez', take); cur.lines.push(l); mode = 'cta'; }
        else if (cur && mode !== 'quote') cur.lines.push(l); else { start('vrez', l); mode = 'cta'; }
        continue;
      }
      if (isMeta && cur && cur.role === 'content') { const prev = cur.lines[cur.lines.length - 1] || ''; if (/^[«"„“]/.test(prev)) { cur.lines.pop(); start('vrez', prev); cur.lines.push(l); mode = 'quote'; continue; } }
      if (mode === 'list' && cur && /^\[h3\]/i.test(cur.lines[cur.lines.length - 1] || '')) { cur.lines.push(l); continue; }
      if (mode === 'hero' && !blocks.some(b => b.role === 'lead')) { start('lead', l); mode = 'lead'; continue; }
      if (mode !== 'text') { start('content'); mode = 'text'; }
      cur.lines.push(l);
    }
    flush();
    blocks.forEach(b => { if (b.role === 'vrez' && G.src(b).table) { b.tpl = 'table'; b.tplLock = true; } });
  } else {
    const order = sc.roles.map(r => r.id).filter(r => r !== 'hero');
    let cur = null;
    for (const raw of lines) {
      const l = raw.trim();
      if (/^-{3,}$/.test(l)) { if (cur) blocks.push(cur); cur = G.newBlock('', ''); continue; } /* --- — новый блок */
      if (/^\[h[12]\]/i.test(l)) { if (cur) blocks.push(cur); cur = G.newBlock(/^\[h1\]/i.test(l) ? 'hero' : '', l); continue; }
      if (!cur) cur = G.newBlock('hero', '');
      cur.text += (cur.text ? '\n' : '') + l;
    }
    if (cur) blocks.push(cur);
    blocks.forEach(b => b.text = b.text.trim());
    const used = new Set(['hero']), free = () => order.filter(r => !used.has(r));
    blocks.forEach((b, i) => {
      if (b.role) return;
      const title = G.src(b).title, last = i === blocks.length - 1, btnOnly = G.src(b).cta.length && !G.src(b).items.length;
      let best = null, bs = 0;
      for (const r of free()) { const sc0 = G.roleMatch(G.roleOf(sc, r), title); if (sc0 > bs) { bs = sc0; best = r; } }
      if (!best && last && btnOnly && free().includes('cta')) best = 'cta';
      if (!best) best = free().find(r => r !== 'cta') || order[order.length - 1];
      b.role = best; used.add(best);
    });
    blocks.forEach(b => { const s0 = G.src(b); if (s0.table && !s0.items.length) { b.tpl = 'table'; b.tplLock = true; } });
  }
  page.blocks = blocks; page.story = [];
  G.autoPick(page);
};
/* роль по заголовку блока: ключевые слова роли + её название и смысл */
const KEYS = {audience: ['кому', 'для кого', 'подойд', 'полезн'], speakers: ['спикер', 'эксперт', 'ведущ', 'выступ'], program: ['программ', 'расписан', 'план'], how: ['как попасть', 'как подключ', 'как это работа', 'шаг', 'как получить', 'как начать'], faq: ['вопрос', 'faq', 'ответ'], location: ['место', 'адрес', 'как добрат', 'локац', 'где'], cta: ['регистрац', 'заявк', 'записат', 'оформ', 'начать курс'], benefits: ['выгод', 'преимущ', 'что получ', 'возможност'], why: ['зачем', 'почему', 'проблем'], proof: ['отзыв', 'клиент', 'доверя', 'уже польз'], pricing: ['цен', 'тариф', 'стоимост', 'сколько стоит'], results: ['научит', 'результат', 'навык'], author: ['автор', 'преподава'], gallery: ['галере', 'фото'], more: ['материал', 'читайте', 'ещё'], about: ['что это', 'о мероприят', 'формат', 'о курсе', 'о продукте']};
G.roleMatch = (role, title) => {
  const t = String(title || '').toLowerCase(); if (!t) return 0;
  let s = 0;
  for (const k of [...(role.keywords || []), ...(KEYS[role.id] || [])]) if (t.includes(k)) s += 3;
  for (const w of (role.name + ' ' + (role.meaning || '')).toLowerCase().split(/[^а-яёa-z]+/).filter(w => w.length > 4)) if (t.includes(w.slice(0, 5))) s += 1;
  return s;
};
G.fullyMarked = text => /^\s*\[h1\]/im.test(text) && /^\s*\[h2\]/im.test(text);

/* ---------- адаптация и прогоны ---------- */
const spec = t => {
  const top = (t.fields || []).filter(f => f.role !== 'num').map(f => `${f.k} (${f.label}) ≤${f.max}`).join('; ');
  const rep = t.items ? `\nЭлементы: ${t.items.any ? 'сколько угодно' : 'ровно ' + t.items.n + ' шт.'}; поля: ${t.items.fields.filter(f => f.role !== 'num').map(f => `${f.k} (${f.label}) ≤${f.max}`).join('; ')}` : '';
  return `Шаблон «${t.name}»\nПоля: ${top || 'нет'}${rep}`;
};
/* задание на блок: что именно не так с текстом в выбранном шаблоне — из тех же правил, что и группы в меню шаблона */
G.blockTask = (b, page) => {
  const t = G.tpl(b.tpl); if (!t) return ''; const r = G.score(b, t, page), s = G.src(b), ti = t.items, out = [];
  if (ti && !ti.any && s.items.length < ti.n) out.push(`сделай ровно ${ti.n} пунктов из того, что есть: раздели крупные или переформулируй; новых фактов не выдумывай`);
  if (ti && !ti.any && s.items.length > ti.n) out.push(`сведи к ${ti.n} пунктам: объедини близкие по смыслу так, чтобы содержание всех ${s.items.length} пунктов сохранилось — ничего не выбрасывай`);
  if (r.over) { const of = G.overflow(b, page); out.push(`сократи до лимита каждое поле: ${of.map(x => `${x.label} — на ${x.over}+ зн.`).join(', ') || 'текст длиннее на ' + r.over + ' зн.'}; лимит — жёсткий потолок, целься на 10% короче; переформулируй, а не обрывай`); }
  const why = r.why || [];
  if (why.some(w => /лишняя кнопка|пустая кнопка/.test(w))) out.push('в шаблоне кнопок больше, чем в тексте — предложи подпись по смыслу блока и целевого действия: глагол и результат');
  if (s.meta.length && (t.fields || []).some(f => ['badge', 'meta', 'qname', 'qcap'].includes(f.role))) out.push('бейдж, дату, автора, имя и должность бери из исходника без изменений');
  why.filter(w => /^пуст(ое|ой|ые) (поле|заголовок|текст)/.test(w)).forEach(w => out.push('заполни ' + w.replace(/^пуст\S+ (поле )?/, '').replace(/[«»]/g, '') + ' по смыслу блока'));
  if (why.some(w => /пустые (должности|кнопки у элементов)/.test(w))) out.push('заполни недостающие поля у пунктов по смыслу, без новых фактов');
  r.bad.forEach(x => out.push('учти: ' + x));
  return out.length ? 'Задача: ' + out.join('; ').replace(/\.+$/, '') + '.' : '';
};
const srcText = b => {
  const s = G.src(b), o = [];
  if (s.title) o.push('Заголовок: ' + s.title);
  if (s.meta.length) o.push('Мета: ' + s.meta.join(' · '));
  if (s.lead) o.push('Текст: ' + s.lead);
  s.items.forEach((it, i) => o.push(`Пункт ${i + 1}: ${[it.title, it.text, it.meta].filter(Boolean).join(' | ')}${it.cta ? ' | кнопка: ' + it.cta : ''}`));
  if (s.images.length) o.push('Подписи картинок: ' + s.images.join('; '));
  if (s.cta.length) o.push('Кнопки: ' + s.cta.join(', '));
  return o.join('\n');
};
const fieldsJSON = (b, page) => {
  const t = G.tpl(b.tpl), v = G.values(b, page), lab = f => ({value: '', label: f.label, max: f.max});
  const top = {}; (t.fields || []).forEach(f => { if (f.role !== 'num') top[f.k] = {...lab(f), value: v.top[f.k] || ''}; });
  const items = (v.items || []).map(it => { const o = {}; (t.items.fields || []).forEach(f => { if (f.role !== 'num') o[f.k] = {...lab(f), value: it[f.k] || ''}; }); return o; });
  if (v.head !== undefined) top.head = {value: v.head, label: G.HEAD.label, max: G.HEAD.max};
  return JSON.stringify({id: b.id, template: t.name, top, items});
};
G.adaptable = (b, prompt, page) => { const t = G.tpl(b.tpl), r = G.roleOf(G.scenario(page.scenario), b.role); return !!t && !t.verbatim && !r.verbatim && (prompt.input !== 'source' || b.text.trim()); };
G.adaptPrompt = (page, p, part, askVals = {}) => {
  const sc = G.scenario(page.scenario);
  const blocks = part.map(b => p.input === 'source'
    ? `### id: ${b.id} (${G.roleOf(sc, b.role).name})\n${spec(G.tpl(b.tpl))}${G.blockTask(b, page) ? '\n' + G.blockTask(b, page) : ''}${G.needsHead(b, G.tpl(b.tpl)) ? `\nЗаголовок раздела над блоком — ключ head в top, ≤${G.HEAD.max}` : ''}\nИсходник:\n${srcText(b)}`
    : fieldsJSON(b, page)).join('\n\n');
  return G.fill(p.text, {...askVals, 'тип': sc.name, 'действие': sc.action, 'блоки': blocks});
};
G.runAdapt = async (page, promptId, blockIds, askVals = {}) => {
  const p = G.prompt(promptId);
  /* укладка всей страницы — только блоки, где текст не подходит шаблону; свои промты и один блок — как выбрано */
  const needs = b => { const t = G.tpl(b.tpl), r = t && G.score(b, t, page); return !r || (r.tier || 0) > 0 || r.over > 0; };
  const list = page.blocks.filter(b => (!blockIds || blockIds.includes(b.id)) && G.adaptable(b, p, page) && (blockIds || p.id !== 'fit' || needs(b)));
  if (!list.length) { G.ui.toast(p.id === 'fit' && !blockIds ? 'Текст всех блоков уже подходит шаблонам — укладывать нечего.' : 'Нечего адаптировать: у блоков нет шаблонов или их текст не адаптируется.'); return 0; }
  let done = 0;
  /* один запрос на все блоки */
  { const part = list;
    const json = await G.ask(p.name, G.adaptPrompt(page, p, part, askVals));
    const got = Array.isArray(json) ? json : json.blocks || [];
    for (const [ri, r] of got.entries()) {
      /* блок — по id; если модель перепутала id, а блоков столько же — по порядку */
      const b = part.find(x => x.id === r.id) || (got.length === part.length ? part[ri] : null); if (!b) continue;
      const tt = G.tpl(b.tpl), byLabel = o => { if (!o || typeof o !== 'object') return o; const m = {}; for (const [k, x] of Object.entries(o)) { const f = [...(tt.fields || []), ...((tt.items && tt.items.fields) || [])].find(f => f.k === k || f.label === k); m[f ? f.k : k] = x; } return m; };
      r.top = byLabel(r.top) || {}; if (Array.isArray(r.items)) r.items = r.items.map(byLabel);
      /* модель положила поля шаблона в items, хотя у шаблона их нет (частая ошибка у цитаты: имя и должность) */
      if (!tt.items && Array.isArray(r.items)) r.items.forEach(it => Object.entries(it || {}).forEach(([k, x]) => { if ((tt.fields || []).some(f => f.k === k) && r.top[k] == null) r.top[k] = x; }));
      const t = G.tpl(b.tpl), cur = G.values(b, page), s = G.src(b), top = {}, items = [];
      const val = x => (x && typeof x === 'object' ? x.value : x);
      let bi = 0;
      for (const f of t.fields || []) {
        let v = r.top && r.top[f.k] != null ? String(val(r.top[f.k])) : cur.top[f.k] || '';
        if (f.role === 'btn' && p.input === 'source') { v = s.cta[bi] || v; bi++; }
        top[f.k] = v;
      }
      if (t.items) (cur.items || []).forEach((it, k) => { const ri = (r.items || [])[k] || {}, o = {}; for (const f of t.items.fields) o[f.k] = f.role === 'num' ? String(k + 1) : ri[f.k] != null ? String(val(ri[f.k])) : it[f.k] || ''; items.push(o); });
      if (t.items && p.input === 'source' && t.items.any && (r.items || []).length > items.length) for (let k = items.length; k < r.items.length; k++) { const o = {}; for (const f of t.items.fields) o[f.k] = String(val(r.items[k][f.k]) || ''); items.push(o); }
      const nv = {top, items}; if (cur.head !== undefined) nv.head = r.top && r.top.head != null ? String(val(r.top.head)) : cur.head;
      G.setValues(b, nv, p.id); done++;
    }
  }
  return done;
};
})();
