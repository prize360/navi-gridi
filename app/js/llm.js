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

/* ---------- разбор: одна кнопка «Разобрать» ----------
   1) Гриди собирает страницу по разметке (G.assemble) — это основа, текст не теряется;
   2) модель видит строки с номерами и текущие блоки и возвращает только группировку и роли:
      какие строки — какой блок, какая строка заголовок/пункт/подпись, подсказка к блоку.
   Текст пишет не модель: Гриди собирает блоки из исходных строк, разметка автора (кнопки, ссылки, списки) остаётся как была.
   Правил про конкретные слова («Содержание», «Читайте также»…) нет: всё решается по форме, служебное встаёт в подходящий шаблон. */
const MARK = /^\s*(\[(h[1-4]|кнопка|ссылка|button|btn|link|картинка|фото|image|img)\]|@|(?:[-–•*]|\d+[.)])\s)/i;
G.parseLines = page => G.paras(String(page.text || '').split('\n').filter(l => !/^\s*-{3,}\s*$/.test(l)).join('\n'), G.scenario(page.scenario).maxText);
/* блоки сборки по разметке → номера строк (сборка строки не меняет, только группирует) */
const baseRanges = (blocks, R) => { let k = 0; return blocks.map(b => { const ids = [];
  for (const l of b.text.split('\n').map(x => x.trim()).filter(Boolean)) { let j = k; while (j < R.length && R[j].trim() !== l) j++; if (j < R.length) { ids.push(j + 1); k = j + 1; } }
  return ids; }); };
const span = ids => { if (!ids.length) return ''; const out = []; let a = ids[0], p = a; for (const x of ids.slice(1).concat([null])) { if (x === p + 1) { p = x; continue; } out.push(a === p ? '' + a : a + '-' + p); a = p = x; } return out.join(','); };
const nums = (v, n) => { const out = []; for (const part of String(v == null ? '' : v).split(/[,;\s]+/).filter(Boolean)) { const m = part.match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/); if (!m) continue; const a = +m[1], b = m[2] ? +m[2] : a; for (let i = Math.min(a, b); i <= Math.max(a, b) && i <= n; i++) if (i >= 1) out.push(i); } return out; };
G.parsePrompt = page => {
  const sc = G.scenario(page.scenario), P = G.prompt('parse'), R = G.parseLines(page);
  const base = G.newPage('', page.scenario, R.join('\n')); G.assemble(base); const rg = baseRanges(base.blocks, R);
  const marks = new Map(); rg.forEach((ids, i) => { if (ids.length) marks.set(ids[0], `== блок ${i + 1}: ${base.blocks[i].role}`); });
  return G.fill(P.text, {
    'тип': sc.name, 'действие': sc.action || 'нет', 'размер': (sc.rhythm && sc.rhythm.maxRun) || 1000,
    'роли': sc.roles.map(r => `${r.id} — ${r.name}${r.meaning ? ': ' + r.meaning : ''}${r.items ? ' (до ' + r.items + ' пунктов)' : ''}`).join('\n'),
    'правила': (sc.rules || []).map(r => '- ' + r).join('\n') || '—',
    'строки': R.map((l, i) => (marks.has(i + 1) ? marks.get(i + 1) + '\n' : '') + `[${i + 1}] ${l}`).join('\n'),
  });
};
/* ответ модели → блоки. Плохой или пустой ответ — остаётся сборка по разметке */
G.applyParse = (page, json) => {
  const sc = G.scenario(page.scenario), R = G.parseLines(page), n = R.length, roles = sc.roles.map(r => r.id).concat(['hero', 'cta']);
  const all = String(page.text || '').split(/\n+/).map(x => x.trim()).filter(Boolean), rest = all.slice(n).join('\n');
  const base = G.newPage('', page.scenario, R.join('\n')); G.assemble(base);
  const owner = new Array(n + 1).fill(-1), out = [];
  for (const x of (json && Array.isArray(json.blocks) ? json.blocks : [])) {
    const ids = [...new Set(nums(x.lines || x.paras, n))].filter(i => owner[i] < 0); if (!ids.length) continue;
    const k = out.length; ids.forEach(i => owner[i] = k);
    out.push({x, ids});
  }
  const lost = []; for (let i = 1; i <= n; i++) if (owner[i] < 0) lost.push(i);
  /* модель не ответила или потеряла больше четверти строк — страница по разметке, без её правок */
  if (!out.length || lost.length > n / 4) { page.blocks = base.blocks; page.story = []; page.parsedBy = 'markup'; }
  else {
    const baseRole = i => { const b = base.blocks.find(bb => bb.text.split('\n').some(l => l.trim() === R[i - 1].trim())); return b ? b.role : roles[0]; };
    const blocks = out.map(({x, ids}) => {
      ids.sort((a, b) => a - b);
      const set = k => new Set(nums(x[k], n).filter(i => ids.includes(i)));
      const T = set('title'), I = set('items'), M = set('meta');
      const role = roles.includes(x.role) ? x.role : baseRole(ids[0]);
      let first = true;
      const text = ids.map(i => { const l = R[i - 1]; if (MARK.test(l)) { first = false; return l; }
        if (T.has(i) && l.length <= 120) { const h = role === 'hero' && first ? 'h1' : first ? 'h2' : 'h3'; first = false; return `[${h}] ${l}`; }
        first = false;
        if (I.has(i) && l.length <= 300) return '- ' + l;
        if (M.has(i) && l.length <= 120) return '@ ' + l;
        return l; }).join('\n');
      let tx = text; const hs = (tx.match(/^\[h3\]/gim) || []).length; if (role !== 'hero' && hs === 1 && /^\[h3\]/i.test(tx)) tx = tx.replace(/^\[h3\]/i, '[h2]');
      const b = G.newBlock(role, tx); const tip = String(x.tip || '').trim(); if (tip) b.tips = [tip.slice(0, 240)];
      return b;
    });
    /* строки, которые модель не разложила, — в конец, в «Не разобрано» */
    if (lost.length) { const b = G.newBlock('unparsed', lost.map(i => R[i - 1]).join('\n')); b.tips = [`Модель не разложила ${G.num(lost.length, 'строку', 'строки', 'строк')} — перенесите их в нужные блоки или удалите блок.`]; blocks.push(b); }
    /* первый экран один: соседние блоки с этой ролью — один блок, строки без разметки под заголовком — подписи */
    for (let i = blocks.length - 1; i > 0; i--) if (blocks[i].role === 'hero' && blocks[i - 1].role === 'hero') { blocks[i - 1].text += '\n' + blocks[i].text.split('\n').map(l => MARK.test(l) || l.length > 80 ? l : '@ ' + l).join('\n'); blocks[i - 1].tips = [...(blocks[i - 1].tips || []), ...(blocks[i].tips || [])]; blocks.splice(i, 1); }
    page.blocks = blocks; page.story = (json.story || []).filter(Boolean).map(String); page.parsedBy = 'model';
  }
  /* текст длиннее лимита разбора — хвост по разметке */
  if (rest) { const tail = G.newPage('', page.scenario, rest); G.assemble(tail); page.blocks.push(...tail.blocks); }
  page.blocks.forEach(b => { const s0 = G.src(b); if (s0.table && !s0.items.length && !b.tplLock && b.role !== 'unparsed') { b.tpl = 'table'; b.tplLock = true; } });
  G.autoPick(page);
  return {total: n, lost: page.parsedBy === 'model' ? lost.length : 0, byModel: page.parsedBy === 'model'};
};

/* ---------- сборка по разметке, без модели ---------- */
G.assemble = page => {
  const sc = G.scenario(page.scenario), lines = String(page.text || '').split('\n'), blocks = [];
  if (sc.kind === 'article') {
    let cur = null, mode = ''; const h3s = new Set();
    const flush = () => { if (cur && cur.lines.join('').trim()) blocks.push(G.newBlock(cur.role, cur.lines.join('\n').trim())); cur = null; mode = ''; };
    const start = (role, l) => { flush(); cur = {role, lines: l ? [l] : []}; };
    for (const raw of lines) {
      const l = raw.trim(); if (!l) continue;
      if (/^-{3,}$/.test(l)) { flush(); continue; } /* --- — новый блок */
      const isH1 = /^\[h1\]/i.test(l), isH2 = /^\[h[23]\]/i.test(l), isList = /^(?:[-–•*]|\d+[.)])\s+/.test(l), isImg = /^\[(картинка|фото)\]/i.test(l), isBtn = /^\[кнопка\]/i.test(l), isMeta = /^@/.test(l), isTable = l.includes(' | ');
      if (isH1) { start('hero', l); mode = 'hero'; continue; }
      if (mode === 'hero' && (isMeta)) { cur.lines.push(l); continue; }
      /* короткие строки сразу под заголовком (автор, дата, рубрика) — подписи первого экрана */
      if (mode === 'hero' && cur.lines.length < 4 && !/^\[|^(?:[-–•*]|\d+[.)])\s/.test(l) && l.length <= 80 && !/[.!?…]$/.test(l)) { cur.lines.push('@ ' + l); continue; }
      /* раздел: заголовок, открывающий блок, — H2 (H3 исходника тоже: в гриде это самостоятельный блок) */
      if (isH2) { start('content', l.replace(/^\[h3\]/i, '[h2]')); if (/^\[h3\]/i.test(l)) h3s.add(blocks.length); mode = 'text'; continue; }
      if (isImg) { if (mode !== 'img') { start('vrez'); mode = 'img'; } cur.lines.push(l); continue; }
      if (isTable) { if (mode !== 'table') { start('vrez'); mode = 'table'; } cur.lines.push(l); continue; }
      if (isList) { if (mode !== 'list') { const last = cur && cur.role === 'content' ? cur.lines[cur.lines.length - 1] || '' : '';
        /* заголовок списка: раздел из одного заголовка или короткая строка без точки прямо перед пунктами */
        const keepTitle = cur && cur.role === 'content' && cur.lines.length === 1 && /^\[h2\]/i.test(cur.lines[0]) ? cur.lines.pop() : last && !/^\[|^@/.test(last) && last.length <= 80 && !/[.!?…:;,]$/.test(last) ? '[h2] ' + cur.lines.pop() : null; if (keepTitle !== null && !cur.lines.length) cur = null; start('vrez', keepTitle); mode = 'list'; } cur.lines.push(l); continue; }
      if (isBtn) {
        if (cur && cur.role === 'content') { const prev = cur.lines[cur.lines.length - 1] || ''; const take = prev && !/^\[/.test(prev) && prev.length <= 240 ? cur.lines.pop() : null; start('vrez', take); cur.lines.push(l); mode = 'cta'; }
        else if (cur && mode !== 'quote') cur.lines.push(l); else { start('vrez', l); mode = 'cta'; }
        continue;
      }
      if (isMeta && cur && cur.role === 'content') { const prev = cur.lines[cur.lines.length - 1] || ''; if (/^[«"„“]/.test(prev)) { cur.lines.pop(); start('vrez', prev); cur.lines.push(l); mode = 'quote'; continue; } }
      if (mode === 'hero' && !blocks.some(b => b.role === 'lead')) { start('lead', l); mode = 'lead'; continue; }
      if (mode !== 'text') { start('content'); mode = 'text'; }
      cur.lines.push(l);
    }
    flush();
    /* подряд несколько коротких подразделов H3 (заголовок + один короткий абзац) — это перечисление: один врез с пунктами-H3 */
    const shortSub = (b, i) => h3s.has(i) && b.role === 'content' && b.text.split('\n').length === 2 && b.text.split('\n')[1].length <= 300 && !/^\[/.test(b.text.split('\n')[1]);
    for (let i = 0; i < blocks.length; i++) { let j = i; while (j < blocks.length && shortSub(blocks[j], j)) j++;
      if (j - i >= 2) { const v = G.newBlock('vrez', blocks.slice(i, j).map(b => b.text.replace(/^\[h2\]/i, '[h3]')).join('\n')); blocks.splice(i, j - i, v); for (const k of [...h3s]) { h3s.delete(k); if (k >= j) h3s.add(k - (j - i) + 1); } } }
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
    : fieldsJSON(b, page) + (p.id === 'fix' && G.fixNotes(b, page).length ? '\nЗамечания:\n' + G.fixNotes(b, page).map(x => '- ' + x).join('\n') : '')).join('\n\n');
  return G.fill(p.text, {...askVals, 'тип': sc.name, 'действие': sc.action, 'блоки': blocks});
};
/* ---------- исправление по проверке: сначала код, потом модель только по замечаниям ---------- */
/* замечания, которые правятся текстом блока (остальные — шаблон, дизайн, порядок — модель не трогает) */
const FIXABLE = /длиннее|Кнопка «|ложная срочность|Пустой блок/i;
G.fixNotes = (b, page) => G.checks(page).filter(c => c.block === b && c.level !== 'info' && FIXABLE.test(c.text)).map(c => c.text);
/* что чинится без модели: H1 вне первого экрана → H2, второй первый экран и второе целевое действие → обычный блок */
G.fixByCode = page => {
  const sc = G.scenario(page.scenario), plain = (sc.roles.find(r => !['hero', 'cta', 'subscribe'].includes(r.id)) || {id: 'content'}).id;
  let n = 0;
  page.blocks.forEach((b, i) => { if (i > 0 && b.role !== 'hero' && /^\s*\[h1\]/im.test(b.text)) { b.text = b.text.replace(/^(\s*)\[h1\]/im, '$1[h2]'); n++; } });
  const heroes = page.blocks.filter(b => b.role === 'hero'); heroes.slice(1).forEach(b => { b.role = plain; b.text = b.text.replace(/^(\s*)\[h1\]/im, '$1[h2]'); n++; });
  const ctas = page.blocks.filter(b => G.isCta(b) && (b.role === 'cta' || b.role === 'subscribe')); ctas.slice(1).forEach(b => { b.role = plain; n++; });
  if (n) G.autoPick(page);
  return n;
};
G.runFix = async page => {
  const byCode = G.fixByCode(page);
  const ids = page.blocks.filter(b => G.adaptable(b, G.prompt('fix'), page) && G.fixNotes(b, page).length).map(b => b.id);
  G.lastNotes = [];
  const byModel = ids.length ? await G.runAdapt(page, 'fix', ids) : 0;
  return {byCode, byModel, asked: ids.length, notes: G.lastNotes};
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
    G.lastNotes = (json && Array.isArray(json.notes) ? json.notes : []).map(String).filter(Boolean);
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
