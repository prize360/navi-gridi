/* Гриди — мобильный интерфейс: один размеченный текст, два режима.
   Заметки — текст и разметка (как заметки на телефоне), Страница — тот же текст в шаблонах.
   Любая правка в любом режиме — правка разметки блока (b.text). Логика сборки, подбора и выгрузки — общая с основным Гриди. */
'use strict';
(() => {
const G = window.Gridi, e = G.esc;
const A = {page: null, view: 'home', mode: 'note', sel: null, line: null};
const $app = document.getElementById('app');

/* ---------- иконки ---------- */
const I = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  tune: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M5 6h14M5 11h14M5 16h9"/></svg>',
  page: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="7" height="6" rx="1.5"/><rect x="13" y="14" width="7" height="6" rx="1.5"/></svg>',
  out: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  cut: '<svg viewBox="0 0 24 24"><path d="M4 12h3M10 12h4M17 12h3"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg>',
};

/* ---------- строки разметки ---------- */
const KINDS = [
  {k: 'p', label: 'Текст', g: ''},
  {k: 'h1', label: 'H1', g: 'H1'},
  {k: 'h2', label: 'H2', g: 'H2'},
  {k: 'h3', label: 'H3', g: 'H3'},
  {k: 'meta', label: 'Мета', g: '@'},
  {k: 'li', label: 'Пункт', g: '•'},
  {k: 'btn', label: 'Кнопка', g: '▸'},
  {k: 'img', label: 'Картинка', g: '▣'},
];
const KIND = Object.fromEntries(KINDS.map(x => [x.k, x]));
KIND.h4 = {k: 'h4', label: 'H4', g: 'H4'}; KIND.link = {k: 'link', label: 'Ссылка', g: '↗'};
const parseLine = l => {
  let m;
  if ((m = l.match(/^\[(h[1-4])\]\s*(.*)$/i))) return {k: m[1].toLowerCase(), t: m[2]};
  if ((m = l.match(/^@\s*(.*)$/))) return {k: 'meta', t: m[1]};
  if ((m = l.match(/^\[(?:кнопка|button|btn)\]\s*(.*)$/i))) return {k: 'btn', t: m[1]};
  if ((m = l.match(/^\[(?:ссылка|link)\]\s*(.*)$/i))) return {k: 'link', t: m[1]};
  if ((m = l.match(/^\[(?:картинка|фото|image|img)\]\s*(.*)$/i))) return {k: 'img', t: m[1]};
  if ((m = l.match(/^[-–•*]\s+(.*)$/))) return {k: 'li', t: m[1]};
  if ((m = l.match(/^\d+[.)]\s+(.*)$/))) return {k: 'li', t: m[1]};
  return {k: 'p', t: l};
};
const md = (k, t) => { if (!t) return ''; return /^h[1-4]$/.test(k) ? `[${k}] ${t}` : k === 'meta' ? '@ ' + t : k === 'btn' ? '[кнопка] ' + t : k === 'link' ? '[ссылка] ' + t : k === 'img' ? '[картинка] ' + t : k === 'li' ? '- ' + t : t; };
const lines = text => String(text || '').split('\n').map(x => x.trim()).filter(Boolean).map(parseLine);
const lineHTML = (k, t) => `<div class="ln" data-k="${k}" data-g="${e((KIND[k] || KIND.p).g)}">${t ? e(t) : '<br>'}</div>`;
const mkLine = (k, t) => { const d = document.createElement('div'); d.className = 'ln'; d.dataset.k = k; d.dataset.g = (KIND[k] || KIND.p).g; if (t) d.textContent = t; else d.innerHTML = '<br>'; return d; };
const setKind = (d, k) => { d.dataset.k = k; d.dataset.g = (KIND[k] || KIND.p).g; };

/* ---------- страница ---------- */
const sc = () => G.scenario(A.page.scenario);
const roleName = b => { const n = G.roleOf(sc(), b.role).name || b.role; return n.split(':')[0]; };
const defRole = () => { const s = sc(); return s.kind === 'article' ? 'content' : ((s.roles || []).find(r => r.id !== 'hero' && r.id !== 'cta') || {id: 'about'}).id; };
const repick = b => { if (b.tplLock) return; const r = G.rank(b, A.page)[0]; b.tpl = r ? r.t.id : null; };
const verdict = b => {
  const t = G.tpl(b.tpl); if (!t) return {txt: 'Шаблон не подобран', bad: true};
  const r = G.score(b, t, A.page), tier = r.tier || 0;
  return {txt: (G.TIERS[tier] || 'Подходит') + (!G.isLive(t) ? ', нужен дизайн' : ''), bad: tier >= 2 || !G.isLive(t)};
};
let saveT = null;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => A.page && G.store.put(A.page), 300); };

/* текст страницы для чата: блоки через границы с ролью; вставка такого текста восстанавливает страницу */
const shareText = p => [`=== ${p.name} · ${G.scenario(p.scenario).name}`, ...p.blocks.map(b => `--- ${G.roleOf(G.scenario(p.scenario), b.role).name}\n${b.text}`)].join('\n');
const isShare = t => /^---\s+\S/m.test(t);
const fromShare = (p, text) => {
  const head = text.match(/^===\s*(.*?)\s*·\s*(.+)$/m);
  if (head) { const s = G.lib.all('scenarios').find(x => x.name === head[2].trim()); if (s) p.scenario = s.id; if (head[1] && p.name === 'Без названия') p.name = head[1]; }
  const s = G.scenario(p.scenario), find = n => { n = n.trim().toLowerCase(); const r = (s.roles || []).find(r => r.name.toLowerCase() === n || r.id === n || r.name.toLowerCase().split(':')[0] === n.split(':')[0]); return r ? r.id : n.startsWith('первый') ? 'hero' : n.startsWith('целев') ? 'cta' : defRole(); };
  const blocks = []; let cur = null;
  for (const raw of text.split('\n')) {
    const m = raw.match(/^---\s+(.+)$/);
    if (m) { cur = G.newBlock(find(m[1]), ''); blocks.push(cur); continue; }
    if (/^===/.test(raw)) continue;
    if (!cur) { cur = G.newBlock(blocks.length ? defRole() : 'hero', ''); blocks.push(cur); }
    cur.text += (cur.text ? '\n' : '') + raw;
  }
  blocks.forEach(b => { b.text = b.text.trim(); });
  p.blocks = blocks.filter(b => b.text); p.text = p.blocks.map(b => b.text).join('\n\n');
  G.autoPick(p, true);
};

/* ---------- оболочка: тосты, шторки, ожидание модели ---------- */
const toast = text => {
  let box = document.querySelector('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; box.appendChild(t); setTimeout(() => t.remove(), 4200);
};
const sheet = (html, {onClose, cls = ''} = {}) => {
  const root = document.createElement('div'); root.className = 'sh-wrap';
  root.innerHTML = `<div class="sh-dim"></div><div class="sh ${cls}" role="dialog" aria-modal="true"><div class="sh-grab"></div>${html}</div>`;
  document.body.appendChild(root); requestAnimationFrame(() => root.classList.add('on'));
  const h = {root, $: s => root.querySelector(s), $$: s => [...root.querySelectorAll(s)], closed: false,
    close: (silent) => { if (h.closed) return; h.closed = true; root.classList.remove('on'); setTimeout(() => root.remove(), 220); if (!silent && onClose) onClose(); }};
  root.querySelector('.sh-dim').onclick = () => h.close();
  root.querySelectorAll('[data-close]').forEach(x => x.onclick = () => h.close());
  let y0 = null; const grab = root.querySelector('.sh-grab');
  grab.addEventListener('pointerdown', ev => { y0 = ev.clientY; grab.setPointerCapture(ev.pointerId); });
  grab.addEventListener('pointerup', ev => { if (y0 != null && ev.clientY - y0 > 40) h.close(); y0 = null; });
  return h;
};
const busy = (label, {limit = 180} = {}) => {
  document.querySelectorAll('.busy').forEach(x => x.remove());
  const ctl = new AbortController(), t0 = Date.now(), el = document.createElement('div');
  el.className = 'busy'; el.setAttribute('role', 'status');
  el.innerHTML = `<span class="spin"></span><span class="bt"><b>${e(label)}</b><small>Модель думает · <span class="sec">0 с</span></small></span><button class="pill sm ghost">Отменить</button>`;
  document.body.appendChild(el);
  const h = {signal: ctl.signal, timedOut: false, done: () => { clearInterval(tick); el.remove(); }};
  el.querySelector('button').onclick = () => ctl.abort();
  const tick = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); el.querySelector('.sec').textContent = s < 60 ? s + ' с' : Math.floor(s / 60) + ' мин ' + (s % 60) + ' с'; if (s >= limit) { h.timedOut = true; ctl.abort(); } }, 1000);
  return h;
};
/* модель не подключена: скопировать промт → вставить ответ */
const manualAsk = (label, prompt) => new Promise((res, rej) => {
  const s = sheet(`<div class="sh-h"><div><h2>${e(label)}</h2><p class="sub">Модель не подключена — отправьте промт в свою модель и вставьте ответ.</p></div><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><ol class="steps"><li><button class="pill pri" id="mCopy">Скопировать промт</button> <span class="hint">${prompt.length.toLocaleString('ru-RU')} зн.</span></li>
    <li>Вставьте в ChatGPT, DeepSeek или другую модель.</li>
    <li><textarea class="ta" id="mAns" rows="6" placeholder="Ответ модели целиком"></textarea><p class="hint err" id="mErr"></p></li></ol></div>
    <div class="sh-f"><button class="pill pri wide" id="mOk">Продолжить</button></div>`, {onClose: () => rej(new Error('cancel')), cls: 'tall'});
  s.$('#mCopy').onclick = async () => { await G.copy(prompt); toast('Промт скопирован'); };
  s.$('#mOk').onclick = () => { const v = s.$('#mAns').value; if (!G.parseJSON(v)) { s.$('#mErr').textContent = 'В ответе нет JSON. Попросите модель: «верни только JSON».'; return; } s.close(true); res(v); };
});
G.ui = {toast, busy, manualAsk};

/* ---------- экраны ---------- */
const render = () => { A.view === 'home' ? home() : editor(); };
const go = async (view, id) => {
  A.view = view; A.sel = null; A.line = null;
  if (view === 'edit') { A.page = await G.store.get(id); if (!A.page) { A.view = 'home'; } else A.mode = A.page.blocks.length ? 'page' : 'note'; }
  location.hash = view === 'edit' && A.page ? '#/p/' + A.page.id : '#/';
  render();
};

/* 1. Мои страницы */
const home = async () => {
  const list = (await G.store.list()).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const d = t => new Date(t).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});
  $app.innerHTML = `<header class="hd"><div class="logo"><span class="lg-mark"></span>Гриди</div><button class="ib round" id="hMenu" aria-label="Настройки">${I.menu}</button></header>
    <main class="home">${list.length ? `<ul class="cards">${list.map(p => `<li><button class="card" data-id="${e(p.id)}"><b>${e(p.name)}</b><small>${e(G.scenario(p.scenario).name)} · ${p.blocks.length ? G.num(p.blocks.length, 'блок', 'блока', 'блоков') : 'черновик'} · ${d(p.updated)}</small></button><button class="ib" data-more="${e(p.id)}" aria-label="Ещё">${I.dots}</button></li>`).join('')}</ul>`
      : `<div class="empty"><p>Здесь будут ваши страницы.</p><p class="hint">Вставьте текст — Гриди соберёт из него страницу по шаблонам.</p>${G.examples.length ? `<p class="hint">Или откройте пример:</p><div class="chips">${G.examples.map((x, i) => `<button class="chip" data-ex="${i}">${e(x.name)}</button>`).join('')}</div>` : ''}</div>`}</main>
    <div class="dock"><button class="pill grad wide" id="hNew">Новая страница</button></div>`;
  $app.querySelectorAll('.card').forEach(c => c.onclick = () => go('edit', c.dataset.id));
  $app.querySelectorAll('[data-ex]').forEach(c => c.onclick = async () => { const p = G.fromExample(G.examples[+c.dataset.ex]); if (!p.blocks.length && p.text) { G.assemble(p); } G.autoPick(p, true); await G.store.put(p); go('edit', p.id); });
  $app.querySelectorAll('[data-more]').forEach(c => c.onclick = () => {
    const p = list.find(x => x.id === c.dataset.more);
    const s = sheet(`<div class="sh-h"><h2>${e(p.name)}</h2></div><div class="sh-b list"><button class="row" id="rDup">Дублировать</button><button class="row danger" id="rDel">Удалить</button></div>`);
    s.$('#rDup').onclick = async () => { const n = {...G.clone(p), id: G.uid('p'), name: p.name + ' (копия)'}; await G.store.put(n); s.close(); home(); };
    s.$('#rDel').onclick = async () => { if (!confirm('Удалить страницу «' + p.name + '»?')) return; await G.store.del(p.id); s.close(); home(); };
  });
  $app.querySelector('#hNew').onclick = async () => { const s0 = G.lib.all('scenarios').find(x => x.kind === 'article') || G.lib.all('scenarios')[0]; const p = G.newPage('Без названия', s0.id, ''); await G.store.put(p); go('edit', p.id); };
  $app.querySelector('#hMenu').onclick = settings;
};

/* настройки: модель и импорт */
const settings = () => {
  const st = G.llmSettings();
  const s = sheet(`<div class="sh-h"><h2>Настройки</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b">
      <p class="lbl">Модель</p>
      <div class="seg wide" id="sMode"><button data-v="manual" class="${st.mode !== 'api' ? 'on' : ''}">Вручную</button><button data-v="api" class="${st.mode === 'api' ? 'on' : ''}">Свой ключ</button></div>
      <p class="hint">Вручную — Гриди даст промт, вы отправите его в свою модель и вставите ответ.</p>
      <div id="sApi" ${st.mode === 'api' ? '' : 'hidden'}>
        <label class="lbl" for="sBase">Адрес API (формат OpenAI)</label><input class="in" id="sBase" value="${e(st.base)}">
        <label class="lbl" for="sModel">Модель</label><input class="in" id="sModel" value="${e(st.model)}">
        <label class="lbl" for="sKey">Ключ — хранится только в этом браузере</label><input class="in" id="sKey" type="password" value="${e(st.key)}" autocomplete="off">
      </div>
      <p class="lbl">Страница от коллеги</p>
      <label class="pill ghost wide file">Открыть архив или page.json<input type="file" id="sImp" accept=".zip,.json,application/zip,application/json"></label>
      <p class="hint">Текст страницы из чата просто вставьте в новую страницу.</p>
    </div>
    <div class="sh-f"><button class="pill pri wide" id="sOk">Сохранить</button></div>`, {cls: 'tall'});
  let mode = st.mode === 'api' ? 'api' : 'manual';
  s.$$('#sMode button').forEach(b => b.onclick = () => { mode = b.dataset.v; s.$$('#sMode button').forEach(x => x.classList.toggle('on', x === b)); s.$('#sApi').hidden = mode !== 'api'; });
  s.$('#sOk').onclick = () => { G.ls.set('llm', {mode, base: s.$('#sBase').value.trim(), model: s.$('#sModel').value.trim(), key: s.$('#sKey').value.trim()}); G._modelOkAt = 0; s.close(); toast('Сохранено'); };
  s.$('#sImp').onchange = async ev => { try { await G.importProject(ev.target.files[0]); s.close(); toast('Страница добавлена'); home(); } catch (err) { toast(err.message); } };
};

/* 2. Редактор */
const editor = () => {
  const p = A.page, b = A.sel && p.blocks.find(x => x.id === A.sel), v = b && verdict(b);
  const miss = p.blocks.length ? G.missing(p).length : 0;
  const title = b ? `<b>${e(roleName(b))}</b><small class="${v.bad ? 'bad' : ''}">${e(v.txt)}</small>` : `<b>${e(p.name)}</b><small>${e(sc().name)}${p.blocks.length ? ' · ' + (G.len(p.blocks.map(x => x.text).join('')) / 1000).toFixed(1).replace('.0', '') + 'k знаков' : ''}</small>`;
  $app.innerHTML = `<header class="hd"><button class="ib round" id="eBack" aria-label="Назад">${I.back}</button><button class="ttl" id="eTtl">${title}</button>
      ${p.blocks.length ? `<div class="seg" id="eMode" role="tablist"><button data-m="note" class="${A.mode === 'note' ? 'on' : ''}" aria-label="Заметки">${I.note}</button><button data-m="page" class="${A.mode === 'page' ? 'on' : ''}" aria-label="Страница">${I.page}</button></div>
      <button class="ib round dark" id="eOut" aria-label="Выгрузка">${I.out}${miss ? `<span class="badge">${miss}</span>` : ''}</button>` : `<button class="ib round" id="eTune" aria-label="Настройки страницы">${I.tune}</button>`}</header>
    <main id="eMain"></main><div class="dock" id="eDock"></div>`;
  $app.querySelector('#eBack').onclick = () => { if (A.sel) { A.sel = null; editor(); return; } save(); go('home'); };
  $app.querySelector('#eTtl').onclick = () => { if (!A.sel) pageSettings(); };
  const tn = $app.querySelector('#eTune'); if (tn) tn.onclick = pageSettings;
  $app.querySelectorAll('#eMode button').forEach(x => x.onclick = () => { A.mode = x.dataset.m; A.sel = null; if (A.mode === 'page') p.blocks.forEach(repick); save(); editor(); });
  const out = $app.querySelector('#eOut'); if (out) out.onclick = exportSheet;
  if (!p.blocks.length) draft(); else if (A.mode === 'note') notes(); else canvas();
};

/* настройки страницы: название и сценарий */
const pageSettings = () => {
  const p = A.page, all = G.lib.all('scenarios');
  const s = sheet(`<div class="sh-h"><h2>Страница</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><label class="lbl" for="psName">Название</label><input class="in" id="psName" value="${e(p.name)}">
    <p class="lbl">Сценарий</p><div class="chips" id="psSc">${all.map(x => `<button class="chip ${x.id === p.scenario ? 'on' : ''}" data-id="${e(x.id)}">${e(x.name)}</button>`).join('')}</div>
    ${p.blocks.length ? '<p class="hint">Смена сценария меняет набор ролей блоков. Текст не меняется.</p>' : ''}</div>
    <div class="sh-f"><button class="pill pri wide" id="psOk">Готово</button></div>`);
  let scId = p.scenario;
  s.$$('#psSc .chip').forEach(c => c.onclick = () => { scId = c.dataset.id; s.$$('#psSc .chip').forEach(x => x.classList.toggle('on', x === c)); });
  s.$('#psOk').onclick = () => { p.name = s.$('#psName').value.trim() || p.name; if (scId !== p.scenario) { p.scenario = scId; const roles = (G.scenario(scId).roles || []).map(r => r.id); p.blocks.forEach(b => { if (!roles.includes(b.role) && b.role !== 'hero' && b.role !== 'cta') b.role = defRole(); b.tplLock = false; repick(b); }); } save(); s.close(); editor(); };
};

/* 2а. Пустая страница: вставить текст и собрать */
const draft = () => {
  const p = A.page, main = $app.querySelector('#eMain');
  main.innerHTML = `<textarea class="draft" id="dTxt" placeholder="Вставьте или напишите текст.\n\nРазметка не обязательна — Гриди разложит текст сам. Можно вставить и текст страницы, присланный коллегой.">${e(p.text || '')}</textarea>`;
  const ta = main.querySelector('#dTxt'); setTimeout(() => ta.focus(), 50);
  ta.oninput = () => { p.text = ta.value; save(); };
  $app.querySelector('#eDock').innerHTML = `<button class="pill grad wide" id="dGo">Собрать ${sc().kind === 'article' ? 'статью' : 'страницу'}</button>`;
  $app.querySelector('#dGo').onclick = () => build(ta.value);
};
const build = async text => {
  const p = A.page; text = String(text || '').trim(); if (!text) return toast('Сначала вставьте текст.');
  p.text = text;
  try {
    if (isShare(text)) fromShare(p, text);
    else if (G.fullyMarked(text)) { G.assemble(p); G.autoPick(p, true); }
    else { const j = await G.ask('Разбор: ' + sc().name, G.segPrompt(p)); const r = G.applySeg(p, j); if (r.lost) toast(`Модель пропустила ${G.num(r.lost, 'абзац', 'абзаца', 'абзацев')} — они в последнем блоке.`); }
  } catch (err) { if (err.message !== 'cancel') toast(err.message); return; }
  if (p.name === 'Без названия') { const h = p.blocks.find(b => b.role === 'hero'); const t = h && G.src(h).title; if (t) p.name = t.slice(0, 80); }
  A.mode = 'page'; await G.store.put(p); editor();
};

/* 2б. Заметки: блоки — линии с ролью, строки — разметка */
const notes = () => {
  const p = A.page, main = $app.querySelector('#eMain');
  main.innerHTML = `<div class="note">${p.blocks.map((b, i) => `<section class="nb" data-id="${e(b.id)}">
      <button class="nb-line" data-role="${e(b.id)}"><span>${e(roleName(b))}</span></button>
      <div class="ed" contenteditable="true" spellcheck="true" data-id="${e(b.id)}">${(lines(b.text).length ? lines(b.text) : [{k: 'p', t: ''}]).map(l => lineHTML(l.k, l.t)).join('')}</div></section>`).join('')}
    <button class="nb-add" id="nAdd">${I.plus}<span>Блок</span></button></div>`;
  main.querySelectorAll('.ed').forEach(bindEd);
  main.querySelectorAll('[data-role]').forEach(x => x.onclick = () => blockMenu(x.dataset.role));
  main.querySelector('#nAdd').onclick = () => { const nb = G.newBlock(defRole(), ''); p.blocks.push(nb); save(); notes(); const ed = main.querySelector(`.ed[data-id="${nb.id}"]`); ed && caretTo(ed.firstChild, 0); };
  fmtBar();
};

/* редактор строк: один блок — один contenteditable, строка — div с видом разметки */
const blockOf = ed => A.page.blocks.find(b => b.id === ed.dataset.id);
const sync = ed => {
  [...ed.childNodes].forEach(n => {
    if (n.nodeType === 3) { if (n.textContent.trim()) ed.replaceChild(mkLine('p', n.textContent), n); else n.remove(); }
    else if (n.nodeType === 1 && !n.classList.contains('ln')) { if (n.tagName === 'BR') n.remove(); else { n.className = 'ln'; setKind(n, n.dataset.k || 'p'); } }
  });
  if (!ed.children.length) ed.appendChild(mkLine('p', ''));
  const b = blockOf(ed); if (!b) return;
  b.text = [...ed.children].map(d => md(d.dataset.k, d.textContent.replace(/ /g, ' ').trim())).filter(Boolean).join('\n');
  b.values = null; save();
};
const curLine = () => { const s = getSelection(); if (!s.rangeCount) return null; const n = s.anchorNode; const el = n && (n.nodeType === 1 ? n : n.parentElement); return el ? el.closest('.ln') : null; };
const caretTo = (node, off) => { if (!node) return; const r = document.createRange(), s = getSelection(); const tn = node.firstChild && node.firstChild.nodeType === 3 ? node.firstChild : node; r.setStart(tn, Math.min(off, tn.nodeType === 3 ? tn.length : 0)); r.collapse(true); s.removeAllRanges(); s.addRange(r); node.closest('.ed') && node.closest('.ed').focus(); };
const splitAt = ln => { const s = getSelection(), r = s.getRangeAt(0); const a = document.createRange(); a.selectNodeContents(ln); a.setEnd(r.startContainer, r.startOffset); const z = document.createRange(); z.selectNodeContents(ln); z.setStart(r.endContainer, r.endOffset); return {before: a.toString(), after: z.toString()}; };
const bindEd = ed => {
  ed.addEventListener('input', () => sync(ed));
  ed.addEventListener('keydown', ev => {
    const ln = curLine(); if (!ln || !ed.contains(ln)) return;
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault(); const {before, after} = splitAt(ln), k = ln.dataset.k;
      if (k === 'li' && !before.trim() && !after.trim()) { setKind(ln, 'p'); sync(ed); fmtSync(); return; }
      if (before) ln.textContent = before; else ln.innerHTML = '<br>';
      const nl = mkLine(k === 'li' ? 'li' : 'p', after); ln.after(nl); caretTo(nl, 0); sync(ed); return;
    }
    if (ev.key === 'Backspace') {
      const s = getSelection(); if (!s.isCollapsed) return; const {before, after} = splitAt(ln); if (before) return;
      if (ln.dataset.k !== 'p') { ev.preventDefault(); setKind(ln, 'p'); sync(ed); fmtSync(); return; }
      const prev = ln.previousElementSibling; if (!prev) return;
      ev.preventDefault(); const pt = prev.textContent; prev.textContent = pt + after; if (!prev.textContent) prev.innerHTML = '<br>'; ln.remove(); caretTo(prev, pt.length); sync(ed);
    }
  });
  ed.addEventListener('paste', ev => {
    ev.preventDefault(); const txt = (ev.clipboardData || window.clipboardData).getData('text/plain') || '';
    const ls = txt.split(/\r?\n/).map(x => x.trim()).filter(Boolean); if (!ls.length) return;
    document.execCommand('insertText', false, ls[0]);
    let at = curLine(); ls.slice(1).forEach(l => { const x = parseLine(l), nl = mkLine(x.k, x.t); at.after(nl); at = nl; });
    if (ls.length > 1) caretTo(at, at.textContent.length);
    sync(ed);
  });
};

/* панель разметки над клавиатурой: вид строки и разделить блок */
let fmtEl = null;
const fmtBar = () => {
  if (fmtEl) fmtEl.remove();
  fmtEl = document.createElement('div'); fmtEl.className = 'fmt'; fmtEl.hidden = true;
  fmtEl.innerHTML = `<div class="fmt-row">${KINDS.map(x => `<button data-k="${x.k}"><i>${e(x.g || 'Аа')}</i><span>${e(x.label)}</span></button>`).join('')}<button data-split><i>${I.cut}</i><span>Разделить</span></button></div>`;
  document.body.appendChild(fmtEl);
  fmtEl.addEventListener('pointerdown', ev => ev.preventDefault());
  fmtEl.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { const ln = A.line; if (!ln || !ln.isConnected) return; setKind(ln, ln.dataset.k === x.dataset.k && x.dataset.k !== 'p' ? 'p' : x.dataset.k); sync(ln.closest('.ed')); fmtSync(); });
  fmtEl.querySelector('[data-split]').onclick = splitBlock;
  const vv = window.visualViewport, place = () => { if (vv) fmtEl.style.bottom = Math.max(0, innerHeight - vv.height - vv.offsetTop) + 'px'; };
  if (vv) { vv.addEventListener('resize', place); vv.addEventListener('scroll', place); } place();
};
const fmtSync = () => {
  if (!fmtEl || !fmtEl.isConnected) return;
  const ln = curLine(), on = !!(ln && ln.closest('.ed') && A.view === 'edit');
  if (on) A.line = ln;
  fmtEl.hidden = !on;
  const cur = (A.line && A.line.isConnected) ? A.line.dataset.k : '';
  fmtEl.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x.dataset.k === cur));
  const sp = fmtEl.querySelector('[data-split]'); sp.hidden = !!document.querySelector('.sh-wrap');
};
document.addEventListener('selectionchange', () => { const ln = curLine(); if (ln && ln.closest('.ed')) A.line = ln; fmtSync(); });

/* разделить блок по текущей строке: эта строка и ниже — новый блок */
const splitBlock = () => {
  const ln = A.line; if (!ln || !ln.isConnected) return toast('Поставьте курсор в строку, с которой начнётся новый блок.');
  const ed = ln.closest('.ed'), b = blockOf(ed), p = A.page; if (!ln.previousElementSibling) return toast('Это уже начало блока.');
  const tail = []; let n = ln; while (n) { tail.push(n); n = n.nextElementSibling; }
  const nb = G.newBlock(b.role === 'hero' ? defRole() : b.role, tail.map(d => md(d.dataset.k, d.textContent.trim())).filter(Boolean).join('\n'));
  tail.forEach(d => d.remove()); sync(ed); b.tplLock = false;
  p.blocks.splice(p.blocks.indexOf(b) + 1, 0, nb); save(); notes();
  const ned = $app.querySelector(`.ed[data-id="${nb.id}"]`); ned && caretTo(ned.firstChild, 0);
};

/* линия блока: роль, объединить, удалить */
const blockMenu = id => {
  const p = A.page, b = p.blocks.find(x => x.id === id), i = p.blocks.indexOf(b), s0 = sc();
  const roles = [...(s0.roles || [])]; if (!roles.some(r => r.id === 'hero')) roles.unshift({id: 'hero', name: 'Первый экран'});
  const s = sheet(`<div class="sh-h"><h2>Блок ${i + 1}</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><p class="lbl">Роль блока</p><div class="chips" id="bmR">${roles.map(r => `<button class="chip ${r.id === b.role ? 'on' : ''}" data-r="${e(r.id)}">${e(r.name.split(':')[0])}</button>`).join('')}</div>
    <div class="list">${i > 0 ? '<button class="row" id="bmUp">Объединить с блоком выше</button>' : ''}<button class="row danger" id="bmDel">Удалить блок</button></div></div>`);
  s.$$('#bmR .chip').forEach(c => c.onclick = () => { b.role = c.dataset.r; b.tplLock = false; repick(b); save(); s.close(); render(); });
  const up = s.$('#bmUp'); if (up) up.onclick = () => { const pr = p.blocks[i - 1]; pr.text = [pr.text, b.text].filter(Boolean).join('\n'); pr.tplLock = false; p.blocks.splice(i, 1); repick(pr); save(); s.close(); render(); };
  s.$('#bmDel').onclick = () => { if (b.text.trim() && !confirm('Удалить блок вместе с текстом?')) return; p.blocks.splice(i, 1); save(); s.close(); A.sel = null; render(); };
};

/* 2в. Страница: тот же текст в шаблонах */
const canvas = () => {
  const p = A.page, main = $app.querySelector('#eMain');
  main.innerHTML = `<div class="cv">${p.blocks.map(b => { const t = G.tpl(b.tpl), v = verdict(b);
    return `<div class="cb ${A.sel === b.id ? 'sel' : ''} ${v.bad ? 'warn' : ''}" data-id="${e(b.id)}"><div class="wf-page">${G.wireBlock(t, G.values(b, p), G.wireImgs(b, t))}</div></div>`; }).join('')}</div>`;
  main.querySelectorAll('.cb').forEach(x => x.onclick = () => { A.sel = x.dataset.id; editor(); blockSheet(); });
  const dock = $app.querySelector('#eDock');
  dock.innerHTML = `<div class="float"><button class="ib" id="cNote" aria-label="Текст">Аа</button><button class="ib" id="cAdd" aria-label="Добавить блок">${I.plus}</button></div>`;
  dock.querySelector('#cNote').onclick = () => { A.mode = 'note'; editor(); };
  dock.querySelector('#cAdd').onclick = () => { const nb = G.newBlock(defRole(), ''); p.blocks.push(nb); save(); A.sel = nb.id; editor(); textSheet(nb); };
  if (A.sel) { const el = main.querySelector(`.cb[data-id="${A.sel}"]`); el && el.scrollIntoView({block: 'center'}); }
};

/* шторка блока: промты, подходящие шаблоны, текст, картинка */
const blockSheet = () => {
  const p = A.page, b = p.blocks.find(x => x.id === A.sel); if (!b) return;
  const fit = G.prompt('fit'), ps = [fit, ...G.lib.all('prompts').filter(x => x.stage === 'adapt' && !x.system && x.id !== 'fit')].filter(Boolean);
  const ranked = G.rank(b, p).slice(0, 8);
  const tierOf = r => G.TIERS[r.tier || 0] || '';
  const s = sheet(`<div class="sh-b">
      <div class="chips scroll" id="bsP"><button class="chip" id="bsText">${I.pen}Текст</button>${ps.map(x => `<button class="chip" data-p="${e(x.id)}">${e(x.id === 'fit' ? 'Уложить в шаблон' : x.name)}</button>`).join('')}</div>
      <p class="lbl">Шаблон</p>
      <div class="tvs">${ranked.map(r => `<button class="tv ${r.t.id === b.tpl ? 'on' : ''}" data-t="${e(r.t.id)}"><div class="tv-pv"><div class="wf-page">${G.wireBlock(r.t, G.autoFill(b, r.t, p), G.wireImgs(b, r.t))}</div></div><span class="tv-n">${e(r.t.name)}</span><span class="tv-v ${(r.tier || 0) >= 2 || !G.isLive(r.t) ? 'bad' : ''}">${e(tierOf(r))}${!G.isLive(r.t) ? ' · нужен дизайн' : ''}</span></button>`).join('') || '<p class="hint">Подходящих шаблонов нет — поправьте разметку блока.</p>'}</div>
      <div class="list"><button class="row" id="bsRole">Роль: ${e(roleName(b))}</button></div>
    </div>`, {onClose: () => { A.sel = null; editor(); }, cls: 'block'});
  s.$('#bsText').onclick = () => { s.close(true); textSheet(b); };
  s.$('#bsRole').onclick = () => { s.close(true); blockMenu(b.id); };
  s.$$('[data-p]').forEach(c => c.onclick = async () => {
    const pr = G.prompt(c.dataset.p); let vals = {};
    if (pr.ask && pr.ask.length) { for (const a of pr.ask) { const v = window.prompt(a.label, ''); if (v == null) return; vals[a.k] = v.trim(); } }
    if (!G.adaptable(b, pr, p)) return toast('Этот блок не переписывается: у его шаблона текст как есть.');
    try { const n = await G.runAdapt(p, pr.id, [b.id], vals); if (n) { repick(b); save(); toast(`«${pr.name}»: текст блока обновлён — и в заметке тоже`); s.close(true); editor(); blockSheet(); } }
    catch (err) { if (err.message !== 'cancel') toast(err.message); }
  });
  s.$$('[data-t]').forEach(c => c.onclick = () => { b.tpl = c.dataset.t; b.tplLock = true; b.values = null; save(); s.close(true); editor(); blockSheet(); });
};

/* правка текста блока со страницы: тот же редактор строк — правка разметки */
const textSheet = b => {
  const s = sheet(`<div class="sh-h"><h2>${e(roleName(b))}</h2><button class="pill pri sm" data-close>Готово</button></div>
    <div class="sh-b"><div class="ed solo" contenteditable="true" spellcheck="true" data-id="${e(b.id)}">${(lines(b.text).length ? lines(b.text) : [{k: 'p', t: ''}]).map(l => lineHTML(l.k, l.t)).join('')}</div></div>`,
    {onClose: () => { if (!b.text.trim()) A.page.blocks = A.page.blocks.filter(x => x.id !== b.id); else repick(b); save(); A.sel = b.text.trim() ? b.id : null; if (fmtEl) fmtEl.hidden = true; editor(); if (A.sel) blockSheet(); }, cls: 'tall'});
  const ed = s.$('.ed'); bindEd(ed); fmtBar(); fmtEl.classList.add('over');
  setTimeout(() => caretTo(ed.lastElementChild, ed.lastElementChild.textContent.length), 120);
};

/* 3. Выгрузка */
const exportSheet = () => {
  const p = A.page; p.blocks.forEach(repick);
  const miss = G.missing(p);
  const s = sheet(`<div class="sh-h"><h2>Выгрузка</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="list">
      <button class="row" id="xShare"><b>Поделиться текстом</b><small>В любой чат. Вставка этого текста в Гриди собирает ту же страницу.</small></button>
      <button class="row" id="xZip"><b>Архив для вёрстки</b><small>Текст по полям, схема, ТЗ на картинки с именами слотов</small></button>
    </div>
    ${miss.length ? `<p class="lbl">Нужен дизайн · ${miss.length}</p><ul class="miss">${miss.map(m => `<li><b>${e(m.role.split(':')[0])}</b><small>${e(m.need || '')}</small></li>`).join('')}</ul>` : '<p class="hint">Для всех блоков есть шаблоны в админке.</p>'}
    </div>`, {cls: 'tall'});
  s.$('#xShare').onclick = async () => { const t = shareText(p); if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) { try { await navigator.share({title: p.name, text: t}); return; } catch (err) { if (err.name === 'AbortError') return; } } await G.copy(t); toast('Текст страницы скопирован — вставьте в чат'); };
  s.$('#xZip').onclick = async () => { try { await G.doExport(p); } catch (err) { toast(err.message); } };
};

/* ---------- старт ---------- */
const st = document.createElement('style'); st.textContent = G.WIRE_CSS; document.head.appendChild(st);
const route = () => { const m = location.hash.match(/^#\/p\/(.+)$/); if (m && (!A.page || A.page.id !== m[1])) go('edit', m[1]); else if (!m && A.view !== 'home') go('home'); };
addEventListener('hashchange', route);
const m0 = location.hash.match(/^#\/p\/(.+)$/); if (m0) go('edit', m0[1]); else render();
G.m = {A, shareText, fromShare, build, lines, parseLine};
})();
