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
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
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
  {k: 'btn', label: 'Кнопка', g: '▸'}, /* кнопка и ссылка — одно: текст, адрес через « | » */
  {k: 'img', label: 'Картинка', g: '▣'},
];
const KIND = Object.fromEntries(KINDS.map(x => [x.k, x]));
KIND.h4 = {k: 'h4', label: 'H4', g: 'H4'};
const parseLine = l => {
  let m;
  if ((m = l.match(/^\[(h[1-4])\]\s*(.*)$/i))) return {k: m[1].toLowerCase(), t: m[2]};
  if ((m = l.match(/^@\s*(.*)$/))) return {k: 'meta', t: m[1]};
  if ((m = l.match(/^\[(?:кнопка|ссылка|button|btn|link)\]\s*(.*)$/i))) return {k: 'btn', t: m[1]};
  if ((m = l.match(/^\[(?:картинка|фото|image|img)\]\s*(.*)$/i))) return {k: 'img', t: m[1]};
  if ((m = l.match(/^[-–•*]\s+(.*)$/))) return {k: 'li', t: m[1]};
  if ((m = l.match(/^\d+[.)]\s+(.*)$/))) return {k: 'li', t: m[1]};
  return {k: 'p', t: l};
};
const md = (k, t) => { if (!t) return ''; return /^h[1-4]$/.test(k) ? `[${k}] ${t}` : k === 'meta' ? '@ ' + t : k === 'btn' ? '[кнопка] ' + t : k === 'img' ? '[картинка] ' + t : k === 'li' ? '- ' + t : t; };
const tidy = arr => arr.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
const lines = text => { const t = tidy(String(text || '').split('\n').map(x => x.trim())); return t ? t.split('\n').map(l => l ? parseLine(l) : {k: 'p', t: ''}) : []; };
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
  /* шторка тянется за ручку и шапку: вниз — свернуть или закрыть, вверх — на весь экран */
  const sh = root.querySelector('.sh'), grips = [root.querySelector('.sh-grab'), root.querySelector('.sh-h')].filter(Boolean);
  /* сначала компактно; на весь экран сразу — только правка текста */
  let y0 = null, dy = 0, moved = false, fromGrab = false;
  const down = ev => { if (ev.target.closest('button,input,textarea,a,label')) return; y0 = ev.clientY; dy = 0; moved = false; fromGrab = ev.currentTarget.classList.contains('sh-grab'); sh.classList.add('drag'); ev.currentTarget.setPointerCapture(ev.pointerId); };
  const move = ev => { if (y0 == null) return; dy = ev.clientY - y0; if (Math.abs(dy) > 4) moved = true;
    sh.style.transform = dy > 0 ? `translateY(${dy}px)` : ''; if (dy < 0 && !sh.classList.contains('full')) sh.style.height = Math.min(innerHeight * .92, sh.offsetHeight - dy * .15 + 0) + 'px'; };
  const up = () => { if (y0 == null) return; sh.classList.remove('drag'); sh.style.transform = ''; sh.style.height = ''; y0 = null;
    if (!moved) { if (fromGrab) sh.classList.toggle('full'); return; }
    if (dy < -50) sh.classList.add('full');
    else if (dy > 80) { if (sh.classList.contains('full') && dy < 260) sh.classList.remove('full'); else h.close(); } };
  grips.forEach(g => { g.addEventListener('pointerdown', down); g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up); });
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

/* подтверждение на месте: первая нажатая кнопка меняет подпись, вторая — выполняет */
const sure = (btn, label, run) => { if (btn.dataset.sure) return run(); btn.dataset.sure = 1; btn.textContent = label + ' — нажмите ещё раз'; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.sure; } }, 4000); };
/* вопросы промта (например, тон или тема интеграции) — шторкой */
const askVals = pr => new Promise(res => {
  const s = sheet(`<div class="sh-h"><h2>${e(pr.name)}</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b">${pr.ask.map(a => `<label class="lbl" for="ask-${e(a.k)}">${e(a.label)}</label><textarea class="ta" rows="3" id="ask-${e(a.k)}" placeholder="${e(a.placeholder || '')}"></textarea>`).join('')}</div>
    <div class="sh-f"><button class="pill pri wide" id="askOk">Запустить</button></div>`, {onClose: () => res(null)});
  s.$('#askOk').onclick = () => { const o = {}; pr.ask.forEach(a => o[a.k] = s.$('#ask-' + CSS.escape(a.k)).value.trim()); s.close(true); res(o); };
});

/* ---------- экраны ---------- */
/* плавный переход между состояниями: браузер сам анимирует снимок до/после (только opacity и transform) */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const morph = (fn, kind = 'fade') => { if (reduce || !document.startViewTransition) return fn(); document.documentElement.dataset.vt = kind; const t = document.startViewTransition(fn); t.finished.finally(() => delete document.documentElement.dataset.vt); };
const render = () => { A.view === 'home' ? home() : editor(); };
const go = async (view, id) => {
  A.view = view; A.sel = null; A.line = null;
  if (view === 'edit') { A.page = await G.store.get(id); if (!A.page) { A.view = 'home'; } else A.mode = A.page.blocks.length ? 'page' : 'note'; }
  location.hash = view === 'edit' && A.page ? '#/p/' + A.page.id : '#/';
  morph(render, view === 'edit' ? 'push' : 'pop');
};

/* 1. Главная: вкладки сценариев, страницы — сеткой обложек */
const TABS = [['article', 'Статьи'], ['course', 'Курсы'], ['event', 'События'], ['sale', 'Продукты'], ['promo', 'Промо']];
const cover = p => { const b = p.blocks.find(x => x.role === 'hero') || p.blocks[0];
  if (!b) return `<div class="tl-empty">${e((p.text || p.name).slice(0, 60))}</div>`;
  return `<div class="tl-pv">${blockHTML(b, p)}</div>`; };
const home = async () => {
  const all = (await G.store.list()).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const tabs = TABS.filter(([id]) => G.lib.get('scenarios', id));
  A.tab = A.tab || G.ls.get('tab', 'article'); if (!tabs.some(([id]) => id === A.tab)) A.tab = (tabs[0] || ['article'])[0];
  const list = all.filter(p => p.scenario === A.tab), other = all.filter(p => !tabs.some(([id]) => id === p.scenario) && A.tab === tabs[0][0]);
  const pages = [...list, ...other], slots = Math.max(0, 9 - pages.length);
  const exs = G.examples.map((x, k) => ({x, k})).filter(o => o.x.scenario === A.tab);
  $app.innerHTML = `<header class="hd"><div class="logo"><img class="lg-mark" src="${G.LOGO || ''}" alt="">Гриди</div><button class="ib round" id="hMenu" aria-label="Меню">${I.menu}</button></header>
    <nav class="tabs" role="tablist">${tabs.map(([id, n]) => `<button role="tab" class="${id === A.tab ? 'on' : ''}" data-tab="${id}">${n}</button>`).join('')}</nav>
    <main class="home"><div class="grid">${pages.map(p => `<button class="tl" data-id="${e(p.id)}" style="view-transition-name:p-${e(p.id)}">${cover(p)}<span class="tl-n">${e(p.name)}</span></button>`).join('')}${'<span class="tl-slot"></span>'.repeat(slots)}</div>
      ${!pages.length ? `<p class="hint center">Здесь будут ${(tabs.find(([id]) => id === A.tab) || [, 'страницы'])[1].toLowerCase()}. Вставьте текст — Гриди соберёт страницу по шаблонам.</p>${exs.length ? `<div class="chips center">${exs.map(o => `<button class="chip" data-ex="${o.k}">Пример: ${e(o.x.name)}</button>`).join('')}</div>` : ''}` : ''}</main>
    <div class="dock"><button class="pill grad wide" id="hNew">Новая страница</button></div>`;
  $app.querySelectorAll('[data-tab]').forEach(c => c.onclick = () => { A.tab = c.dataset.tab; G.ls.set('tab', A.tab); morph(home); });
  $app.querySelectorAll('.tl').forEach(c => { let t = null;
    c.onclick = () => { if (c.dataset.held) { delete c.dataset.held; return; } go('edit', c.dataset.id); };
    c.addEventListener('pointerdown', () => { t = setTimeout(() => { c.dataset.held = 1; pageMenu(all.find(x => x.id === c.dataset.id)); }, 480); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => c.addEventListener(ev, () => clearTimeout(t)));
    c.addEventListener('contextmenu', ev => { ev.preventDefault(); c.dataset.held = 1; pageMenu(all.find(x => x.id === c.dataset.id)); }); });
  $app.querySelectorAll('[data-ex]').forEach(c => c.onclick = async () => { const p = G.fromExample(G.examples[+c.dataset.ex]); if (!p.blocks.length && p.text) { G.assemble(p); } G.autoPick(p, true); await G.store.put(p); go('edit', p.id); });
  $app.querySelector('#hNew').onclick = async () => { const p = G.newPage('Без названия', A.tab, ''); await G.store.put(p); go('edit', p.id); };
  $app.querySelector('#hMenu').onclick = settings;
  requestAnimationFrame(() => $app.querySelectorAll('.tl-pv').forEach(x => x.style.setProperty('--k', x.clientWidth / 560)));
};
/* долгое нажатие на обложку: переименовать, дублировать, удалить */
const pageMenu = p => {
  const s = sheet(`<div class="sh-h"><h2>${e(p.name)}</h2></div><div class="sh-b"><div class="list"><button class="row" id="rDup">Дублировать</button><button class="row danger" id="rDel">Удалить</button></div></div>`);
  s.$('#rDup').onclick = async () => { const n = {...G.clone(p), id: G.uid('p'), name: p.name + ' (копия)'}; await G.store.put(n); s.close(); home(); };
  s.$('#rDel').onclick = () => sure(s.$('#rDel'), 'Удалить навсегда', async () => { await G.store.del(p.id); s.close(); morph(home); });
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
      <p class="lbl">Библиотека</p>
      <a class="pill ghost wide" href="${window.GRIDI_LIB_URL || 'index.html#/lib/templates'}">Шаблоны, сценарии и промты</a>
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
  const y0 = scrollY, p = A.page, b = A.sel && p.blocks.find(x => x.id === A.sel), v = b && verdict(b);
  const miss = p.blocks.length ? G.missing(p).length : 0;
  const title = b ? `<b>${e(roleName(b))}</b><small class="${v.bad ? 'bad' : ''}">${e(v.txt)}</small>` : `<b>${e(p.name)}</b><small>${e(sc().name)}${p.blocks.length ? ' · ' + (G.len(p.blocks.map(x => x.text).join('')) / 1000).toFixed(1).replace('.0', '') + 'k знаков' : ''}</small>`;
  $app.innerHTML = `<header class="hd ${b ? 'editing' : ''}" id="eHd"><div class="hd-edit"><div class="hfield" id="eField">${b ? `<b>${e(roleName(b))}</b><small class="${v.bad ? 'bad' : ''}">${e(v.txt)}</small>` : ''}</div><button class="ib round ok" id="eOk" aria-label="Готово">${I.check}</button></div>
    <button class="ib round" id="eBack" aria-label="Назад">${I.back}</button><button class="ttl" id="eTtl">${title}</button>
      ${p.blocks.length ? `<button class="ib round" id="ePrev" aria-label="Превью">${I.eye}</button>
      <button class="ib round dark" id="eOut" aria-label="Выгрузка">${I.out}${miss ? `<span class="badge">${miss}</span>` : ''}</button>` : `<button class="ib round" id="eTune" aria-label="Настройки страницы">${I.tune}</button>`}</header>
    <main id="eMain"></main><div class="dock" id="eDock"></div>`;
  $app.querySelector('#eBack').onclick = () => { if (A.sel) { A.sel = null; editor(); return; } save(); go('home'); };
  $app.querySelector('#eTtl').onclick = () => { if (!A.sel) pageSettings(); };
  $app.querySelector('#eOk').onclick = () => { const a = document.activeElement; if (a && a.closest && a.closest('.ed')) { a.blur(); getSelection().removeAllRanges(); fmtSync(); return; }
    document.querySelectorAll('.sh-wrap').forEach(x => x.remove()); A.sel = null; editor(); };
  const tn = $app.querySelector('#eTune'); if (tn) tn.onclick = pageSettings;
  const pv = $app.querySelector('#ePrev'); if (pv) pv.onclick = preview;
  const out = $app.querySelector('#eOut'); if (out) out.onclick = exportView;
  if (!p.blocks.length) return draft();
  A.mode === 'note' ? notes() : canvas();
  island();
  /* перерисовка не сбрасывает положение; прокрутка к блоку — только когда к нему переходят */
  if (A.jump) { const el = $app.querySelector(`[data-id="${A.jump}"]`); if (el) { el.scrollIntoView({block: A.jumpTop ? 'start' : 'center'}); if (A.jumpTop) scrollBy(0, -96); } A.jump = null; A.jumpTop = false; } else scrollTo(0, y0);
};
/* нижний островок: текст ↔ шаблоны и новый блок */
const island = () => {
  const p = A.page, dock = $app.querySelector('#eDock');
  dock.innerHTML = `<div class="float"><div class="seg slide ${A.mode === 'page' ? 'r' : ''}" role="tablist"><button data-m="note" class="${A.mode === 'note' ? 'on' : ''}" aria-label="Текст">${I.note}</button><button data-m="page" class="${A.mode === 'page' ? 'on' : ''}" aria-label="Шаблоны">${I.page}</button></div><button class="ib" id="dAdd" aria-label="Добавить блок">${I.plus}</button></div>`;
  dock.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { if (A.mode === x.dataset.m) return;
    dock.querySelector('.seg').classList.toggle('r', x.dataset.m === 'page');
    /* блок, который сейчас на экране, остаётся на экране и в другом режиме */
    const top = [...$app.querySelectorAll('[data-id]')].find(el => el.getBoundingClientRect().bottom > 120);
    setTimeout(() => morph(() => { A.mode = x.dataset.m; A.sel = null; G.autoPick(p); save(); A.jump = top && top.dataset.id; A.jumpTop = true; editor(); }, 'mode'), 160); });
  dock.querySelector('#dAdd').onclick = () => { const nb = G.newBlock(defRole(), ''); p.blocks.push(nb); save();
    if (A.mode === 'note') { notes(); checksBar(); const ed = $app.querySelector(`.ed[data-id="${nb.id}"]`); ed && caretTo(ed.firstChild, 0); }
    else { A.sel = nb.id; editor(); textSheet(nb); } };
};
/* замечания — сверху страницы, цветом по важности; закрытые не возвращаются, пока не изменится текст замечания */
const checksBar = () => {
  const p = A.page, main = $app.querySelector('#eMain'); p.dismissed = p.dismissed || [];
  const order = {error: 0, warn: 1, info: 2};
  const all = G.checks(p).filter(c => !p.dismissed.includes(c.text)).sort((a, b) => order[a.level] - order[b.level]);
  if (!all.length) return;
  const box = document.createElement('div'); box.className = 'checks';
  const open = A.checksOpen, shown = open ? all : all.slice(0, 2);
  box.innerHTML = shown.map((c, i) => `<div class="ck ck-${c.level}"><button class="ck-t" data-i="${i}">${e(c.text)}</button><button class="ck-x" data-x="${i}" aria-label="Скрыть">${I.x}</button></div>`).join('')
    + (all.length > 2 ? `<button class="ck-more" id="ckMore">${open ? 'Свернуть' : 'Ещё ' + G.num(all.length - 2, 'замечание', 'замечания', 'замечаний')}</button>` : '');
  main.prepend(box);
  box.querySelectorAll('[data-x]').forEach(x => x.onclick = () => { p.dismissed.push(shown[+x.dataset.x].text); save(); box.remove(); checksBar(); });
  box.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { const c = shown[+x.dataset.i]; if (!c.block) return;
    if (A.mode === 'page') { A.sel = c.block.id; A.jump = c.block.id; editor(); blockSheet(); }
    else { const el = $app.querySelector(`.nb[data-id="${c.block.id}"]`); el && el.scrollIntoView({block: 'start', behavior: 'smooth'}); } });
  const mo = box.querySelector('#ckMore'); if (mo) mo.onclick = () => { A.checksOpen = !open; box.remove(); checksBar(); };
};
/* превью: страница как увидит читатель, без рамок и замечаний */
const preview = () => {
  const p = A.page; G.autoPick(p);
  const el = document.createElement('div'); el.className = 'pv';
  el.innerHTML = `<header class="hd"><button class="ib round" id="pvX" aria-label="Закрыть">${I.x}</button><div class="ttl"><b>Превью</b><small>${e(p.name)}</small></div></header>
    <div class="pv-b">${p.blocks.map(b => blockHTML(b, p)).join('')}</div>`;
  morph(() => { document.body.appendChild(el); document.body.classList.add('noscroll'); }, 'push');
  el.querySelector('#pvX').onclick = () => morph(() => { el.remove(); document.body.classList.remove('noscroll'); }, 'pop');
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
  const p = A.page, main = $app.querySelector('#eMain'), iss = issuesOf(p);
  main.innerHTML = `<div class="note">${p.blocks.map((b, i) => `<section class="nb" data-id="${e(b.id)}" style="view-transition-name:b-${e(b.id)}">
      <button class="nb-line ${iss[b.id] ? 'warn' : ''}" data-role="${e(b.id)}"><span>${e(roleName(b))}</span>${mediaHint(b)}</button>
      <div class="ed" contenteditable="true" spellcheck="true" data-id="${e(b.id)}">${(lines(b.text).length ? lines(b.text) : [{k: 'p', t: ''}]).map(l => lineHTML(l.k, l.t)).join('')}</div></section>`).join('')}
    </div>`;
  main.querySelectorAll('.ed').forEach(bindEd);
  main.querySelectorAll('[data-role]').forEach(x => x.onclick = () => blockMenu(x.dataset.role));
  fmtBar();
};

/* картинка из шаблона: в тексте её нет, слот даёт шаблон — подпись на линии блока, чтобы не было сюрприза на странице */
const mediaHint = b => { const t = G.tpl(b.tpl); if (!t || !t.media || lines(b.text).some(l => l.k === 'img')) return '';
  const what = t.media.kind === 'icon' ? 'иконки' : t.media.kind === 'photo' ? 'фото' : 'картинки'; return `<em class="nb-m">${what} из шаблона</em>`; };
/* редактор строк: один блок — один contenteditable, строка — div с видом разметки */
const blockOf = ed => A.page.blocks.find(b => b.id === ed.dataset.id);
const sync = ed => {
  [...ed.childNodes].forEach(n => {
    if (n.nodeType === 3) { if (n.textContent.trim()) ed.replaceChild(mkLine('p', n.textContent), n); else n.remove(); }
    else if (n.nodeType === 1 && !n.classList.contains('ln')) { if (n.tagName === 'BR') n.remove(); else { n.className = 'ln'; setKind(n, n.dataset.k || 'p'); } }
  });
  if (!ed.children.length) ed.appendChild(mkLine('p', ''));
  const b = blockOf(ed); if (!b) return;
  b.text = tidy([...ed.children].map(d => md(d.dataset.k, d.textContent.replace(/\u00a0/g, ' ').trim())));
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
      /* выход из списка: пустая строка остаётся разделителем — дальше текст и кнопки относятся к блоку, а не к пункту */
      if (k === 'li' && !before.trim() && !after.trim()) { setKind(ln, 'p'); const nl = mkLine('p', ''); ln.after(nl); caretTo(nl, 0); sync(ed); fmtSync(); return; }
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
const fmtBar = (into) => {
  if (fmtEl) fmtEl.remove();
  fmtEl = document.createElement('div'); fmtEl.className = 'fmt'; fmtEl.hidden = true;
  /* роли строки — в шапке на месте названия, рядом ✓: клавиатура их не закрывает */
  fmtEl.innerHTML = `<div class="fmt-row">${KINDS.map(x => `<button data-k="${x.k}"><i>${e(x.g || 'Аа')}</i><span>${e(x.label)}</span></button>`).join('')}<button data-split><i>${I.cut}</i><span>Разделить</span></button></div>`;
  const host = into || document.getElementById('eField'); (host || document.body).appendChild(fmtEl);
  fmtEl.addEventListener('pointerdown', ev => ev.preventDefault());
  fmtEl.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { const ln = A.line; if (!ln || !ln.isConnected) return; setKind(ln, ln.dataset.k === x.dataset.k && x.dataset.k !== 'p' ? 'p' : x.dataset.k); sync(ln.closest('.ed')); fmtSync(); });
  fmtEl.querySelector('[data-split]').onclick = splitBlock;
  if (!fmtBar.bound) { fmtBar.bound = true; document.addEventListener('focusout', () => setTimeout(fmtSync, 50)); }
};
const touch = matchMedia('(pointer: coarse)').matches;
const keyboardOpen = () => { if (!touch) return true; const vv = window.visualViewport; return !!vv && innerHeight - vv.height > 120; };
const fmtSync = () => {
  if (!fmtEl || !fmtEl.isConnected) return;
  const ln = curLine(), ed = document.activeElement && document.activeElement.closest && document.activeElement.closest('.ed');
  /* панель — только пока редактируешь: курсор в тексте и, на телефоне, открыта клавиатура */
  const on = !!(ln && ed && ed.contains(ln) && A.view === 'edit');
  if (on) A.line = ln;
  fmtEl.hidden = !on; document.body.classList.toggle('typing', on);
  const hd = document.getElementById('eHd'); if (hd && !A.sel) hd.classList.toggle('editing', on);
  const cur = (A.line && A.line.isConnected) ? A.line.dataset.k : '';
  fmtEl.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x.dataset.k === cur));
  const sp = fmtEl.querySelector('[data-split]'); sp.hidden = !!document.querySelector('.sh-wrap');
};
document.addEventListener('selectionchange', () => { const ln = curLine(), live = !!(ln && ln.closest('.ed') && document.activeElement && document.activeElement.contains(ln)); document.querySelectorAll('.ln.cur').forEach(x => (x !== ln || !live) && x.classList.remove('cur')); if (live) { A.line = ln; ln.classList.add('cur'); } fmtSync(); });

/* разделить блок по текущей строке: эта строка и ниже — новый блок */
const splitBlock = () => {
  const ln = A.line; if (!ln || !ln.isConnected) return toast('Поставьте курсор в строку, с которой начнётся новый блок.');
  const ed = ln.closest('.ed'), b = blockOf(ed), p = A.page; if (!ln.previousElementSibling) return toast('Это уже начало блока.');
  const tail = []; let n = ln; while (n) { tail.push(n); n = n.nextElementSibling; }
  const nb = G.newBlock(b.role === 'hero' ? defRole() : b.role, tidy(tail.map(d => md(d.dataset.k, d.textContent.trim()))));
  tail.forEach(d => d.remove()); sync(ed); b.tplLock = false;
  p.blocks.splice(p.blocks.indexOf(b) + 1, 0, nb); save(); editor();
  const ned = $app.querySelector(`.ed[data-id="${nb.id}"]`); ned && caretTo(ned.firstChild, 0);
};

/* линия блока: роль, объединить, удалить */
const blockMenu = id => {
  const p = A.page, b = p.blocks.find(x => x.id === id), i = p.blocks.indexOf(b), s0 = sc();
  const roles = [...(s0.roles || [])]; if (!roles.some(r => r.id === 'hero')) roles.unshift({id: 'hero', name: 'Первый экран'});
  const s = sheet(`<div class="sh-h"><h2>Блок ${i + 1}</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><p class="lbl">Роль блока</p><div class="chips" id="bmR">${roles.map(r => `<button class="chip ${r.id === b.role ? 'on' : ''}" data-r="${e(r.id)}">${e(r.name.split(':')[0])}</button>`).join('')}</div>
    <div class="list"><button class="row" id="bmTpl">Шаблон блока</button>${i > 0 ? `<button class="row" id="bmMvU">Переместить выше</button>` : ''}${i < p.blocks.length - 1 ? `<button class="row" id="bmMvD">Переместить ниже</button>` : ''}${i > 0 ? '<button class="row" id="bmUp">Объединить с блоком выше</button>' : ''}<button class="row danger" id="bmDel">Удалить блок</button></div></div>`);
  const mv = d => { p.blocks.splice(i, 1); p.blocks.splice(i + d, 0, b); save(); s.close(); render(); const el = $app.querySelector(`[data-id="${b.id}"]`); el && el.scrollIntoView({block: 'center'}); };
  const mu = s.$('#bmMvU'); if (mu) mu.onclick = () => mv(-1);
  const md2 = s.$('#bmMvD'); if (md2) md2.onclick = () => mv(1);
  s.$('#bmTpl').onclick = () => { s.close(); A.mode = 'page'; G.autoPick(p); A.sel = b.id; A.jump = b.id; editor(); blockSheet(); };
  s.$$('#bmR .chip').forEach(c => c.onclick = () => { b.role = c.dataset.r; b.tplLock = false; repick(b); save(); s.close(); render(); });
  const up = s.$('#bmUp'); if (up) up.onclick = () => { const pr = p.blocks[i - 1]; pr.text = [pr.text, b.text].filter(Boolean).join('\n'); pr.tplLock = false; p.blocks.splice(i, 1); repick(pr); save(); s.close(); render(); };
  s.$('#bmDel').onclick = () => sure(s.$('#bmDel'), 'Удалить вместе с текстом', () => { p.blocks.splice(i, 1); save(); s.close(); A.sel = null; render(); });
};

/* ---------- ряды: больше 4 пунктов — несколько шаблонов подряд, меньший ряд первым ----------
   В тексте блок один; на странице он раскладывается на ряды по 2–4 пункта. */
const GRID = G.GRID_LAYOUTS;
const sibling = (t, k) => { const c = t.ctor; if (c) { const key = o => JSON.stringify({...o, n: 0}); const x = G.tpls().find(y => y.ctor && y.ctor.type === c.type && key(y.ctor.p) === key(c.p) && +y.ctor.p.n === k); if (x) return x; }
  return {...t, items: {...t.items, n: k}, cols: Math.min(k, 4), _virtual: true}; };
const rowsPlan = (b, t) => { if (!t || !t.items || !GRID.includes(t.layout)) return null; const n = G.src(b).items.length; return n > 4 ? G.rowsOf(n) : null; };
/* один сломанный блок не должен ронять всю страницу: показываем заглушку и пишем в консоль */
const blockHTML = (b, p, t = G.tpl(b.tpl)) => { try { return blockHTML0(b, p, t); } catch (err) { console.error('Блок не отрисовался', b, err); return `<div class="wf-page"><section class="wf wf-none"><div class="wf-empty">Блок не отрисовался: ${e(err.message)}</div></section></div>`; } };
const blockHTML0 = (b, p, t) => {
  const plan = rowsPlan(b, t);
  if (!plan) return `<div class="wf-page">${G.wireBlock(t, t && (t.id === b.tpl ? G.values(b, p) : G.autoFill(b, t, p)), G.wireImgs(b, t))}</div>`;
  const all = G.autoFill(b, {...t, items: {...t.items, n: G.src(b).items.length}}, p), imgs = G.wireImgs(b, t); let at = 0;
  return plan.map((k, i) => { const tt = sibling(t, k), v = {...all, top: i ? {} : all.top, head: i ? undefined : all.head, items: all.items.slice(at, at + k)};
    const im = {}; for (let j = 0; j < k; j++) if (imgs['i' + (at + j)]) im['i' + j] = imgs['i' + (at + j)]; if (!i && imgs.main) im.main = imgs.main; at += k;
    return `<div class="wf-page${i ? ' wf-row-next' : ''}">${G.wireBlock(tt, v, im)}</div>`; }).join('');
};

/* 2в. Страница: тот же текст в шаблонах */
/* замечания по блокам: точка на блоке, сами тексты — на экране выгрузки */
const issuesOf = p => { const m = {}; (G.checks(p) || []).forEach(c => { if (c.block && !(p.dismissed || []).includes(c.text)) (m[c.block.id] = m[c.block.id] || []).push(c); }); return m; };
const canvas = () => {
  const p = A.page, main = $app.querySelector('#eMain');
  const iss = issuesOf(p);
  main.innerHTML = `<div class="cv">${p.blocks.map(b => { const t = G.tpl(b.tpl);
    return `<div class="cb ${A.sel === b.id ? 'sel' : ''} ${iss[b.id] ? 'warn' : ''}" data-id="${e(b.id)}" style="view-transition-name:b-${e(b.id)}">${blockHTML(b, p, t)}</div>`; }).join('')}</div>`;
  main.querySelectorAll('.cb').forEach(x => x.onclick = () => { A.sel = x.dataset.id; editor(); blockSheet(); });
};

/* шторка блока: промты, подходящие шаблоны, текст, картинка */
const tplLabel = t => { const c = t.ctor; if (!c) return t.name; const q = c.p || {}, o = [];
  if (q.n) o.push(q.n + (c.type === 'Карточки' ? ' в ряд' : ''));
  if (q.pos) o.push({Lt: 'слева', Rt: 'справа', Ct: 'по центру', Bg: 'на фоне'}[q.pos] || q.pos);
  if (q.media && q.media !== 'нет') o.push({I: 'иконки', A: 'фото', L: 'большая картинка', M: 'картинка', S: 'малая картинка'}[q.media] || q.media);
  if (+q.btn) o.push(q.btn === '1' ? 'кнопка' : q.btn + ' кнопки'); if (q.ibtn === 'да') o.push('кнопки у карточек');
  return {name: c.type, sub: o.join(' · ')}; };
const blockSheet = () => {
  const p = A.page, b = p.blocks.find(x => x.id === A.sel); if (!b) return;
  const fit = G.prompt('fit'), ps = [fit, ...G.lib.all('prompts').filter(x => x.stage === 'adapt' && !x.system && x.id !== 'fit')].filter(Boolean);
  const ranked = G.rank(b, p).slice(0, 8), i = p.blocks.indexOf(b);
  const card = r => { const l = tplLabel(r.t), bad = (r.tier || 0) >= 2 || !G.isLive(r.t);
    return `<button class="tc ${r.t.id === b.tpl ? 'on' : ''}" data-t="${e(r.t.id)}"><div class="tc-pv">${blockHTML(b, p, r.t)}</div>
      <span class="tc-n">${e(l.name || l)}${r.t.id === b.tpl ? `<i>${I.check}</i>` : ''}</span><span class="tc-s">${e(l.sub || '')}</span>
      ${bad ? `<span class="tc-w">${e(!G.isLive(r.t) ? 'нужен дизайн' : G.TIERS[r.tier].toLowerCase())}</span>` : ''}</button>`; };
  const s = sheet(`<div class="bs-h"><button class="bs-a" id="bsText" aria-label="Текст">${I.pen}<span>Текст</span></button>
      <button class="bs-a" id="bsU" ${i ? '' : 'disabled'} aria-label="Выше">${I.up}<span>Выше</span></button>
      <button class="bs-a" id="bsD" ${i < p.blocks.length - 1 ? '' : 'disabled'} aria-label="Ниже">${I.down}<span>Ниже</span></button>
      <button class="bs-a" id="bsRole" aria-label="Блок">${I.dots}<span>Блок</span></button></div>
    <div class="sh-b"><p class="lbl">Шаблон · подходят по тексту</p>
      <div class="tgrid">${ranked.map(card).join('') || '<p class="hint">Подходящих шаблонов нет — поправьте разметку блока.</p>'}</div>
      <p class="lbl">Переписать текст</p>
      <div class="chips">${ps.map(x => `<button class="chip" data-p="${e(x.id)}">${e(x.id === 'fit' ? 'Уложить в шаблон' : x.name)}</button>`).join('')}</div>
    </div>`, {onClose: () => { A.sel = null; editor(); }, cls: 'block'});
  requestAnimationFrame(() => s.$$('.tc-pv').forEach(x => x.style.setProperty('--k', x.clientWidth / 560)));
  s.$('#bsText').onclick = () => { s.close(true); textSheet(b); };
  s.$('#bsRole').onclick = () => { s.close(true); blockMenu(b.id); };
  const mvb = d => { const k = p.blocks.indexOf(b), j = k + d; if (j < 0 || j >= p.blocks.length) return; p.blocks.splice(k, 1); p.blocks.splice(j, 0, b); save(); s.close(true); A.jump = b.id; editor(); blockSheet(); };
  s.$('#bsU').onclick = () => mvb(-1); s.$('#bsD').onclick = () => mvb(1);
  s.$$('[data-p]').forEach(c => c.onclick = async () => {
    const pr = G.prompt(c.dataset.p); let vals = {};
    if (pr.ask && pr.ask.length) { vals = await askVals(pr); if (!vals) return; }
    if (!G.adaptable(b, pr, p)) return toast('Этот блок не переписывается: у его шаблона текст как есть.');
    try { const n = await G.runAdapt(p, pr.id, [b.id], vals); if (n) { repick(b); save(); toast(`«${pr.name}»: текст блока обновлён — и в заметке тоже`); s.close(true); editor(); blockSheet(); } }
    catch (err) { if (err.message !== 'cancel') toast(err.message); }
  });
  /* выбор шаблона: шторка остаётся открытой, страница под ней обновляется на месте */
  s.$$('[data-t]').forEach(c => c.onclick = () => { b.tpl = c.dataset.t; b.tplLock = true; b.values = null; save();
    s.$$('[data-t]').forEach(x => { x.classList.toggle('on', x === c); const n = x.querySelector('.tc-n i'); if (n) n.remove(); });
    c.querySelector('.tc-n').insertAdjacentHTML('beforeend', `<i>${I.check}</i>`);
    const el = $app.querySelector(`.cb[data-id="${b.id}"]`); if (el) el.innerHTML = blockHTML(b, p);
    const v = verdict(b), sm = $app.querySelector('#eTtl small'); if (sm) { sm.textContent = v.txt; sm.classList.toggle('bad', v.bad); } });
};

/* правка текста блока со страницы: тот же редактор строк — правка разметки */
const textSheet = b => {
  const s = sheet(`<div class="sh-h ts-h"><div class="ts-field"><h2>${e(roleName(b))}</h2></div><button class="ib round ok" data-close aria-label="Готово">${I.check}</button></div>
    <div class="sh-b"><div class="ed solo" contenteditable="true" spellcheck="true" data-id="${e(b.id)}">${(lines(b.text).length ? lines(b.text) : [{k: 'p', t: ''}]).map(l => lineHTML(l.k, l.t)).join('')}</div></div>`,
    {onClose: () => { if (!b.text.trim()) A.page.blocks = A.page.blocks.filter(x => x.id !== b.id); else repick(b); save(); A.sel = b.text.trim() ? b.id : null; if (fmtEl) fmtEl.hidden = true; editor(); if (A.sel) blockSheet(); }, cls: 'full'});
  const ed = s.$('.ed'); bindEd(ed); fmtBar(s.$('.ts-field'));
  setTimeout(() => caretTo(ed.lastElementChild, ed.lastElementChild.textContent.length), 120);
};

/* 3. Выгрузка: замечания плашками, «Поправить всё», передача */
const exportView = () => {
  const p = A.page; G.autoPick(p); p.dismissed = p.dismissed || [];
  const order = {error: 0, warn: 1, info: 2}, miss = G.missing(p);
  const all = G.checks(p).filter(c => !p.dismissed.includes(c.text)).sort((a, b) => order[a.level] - order[b.level]);
  const el = document.createElement('div'); el.className = 'pv ex';
  const draw = () => { const list = G.checks(p).filter(c => !p.dismissed.includes(c.text)).sort((a, b) => order[a.level] - order[b.level]);
    el.innerHTML = `<header class="hd"><button class="ib round" id="xX" aria-label="Закрыть">${I.x}</button><div class="ttl"><b>Выгрузка</b><small>${e(sc().name)} · ${(G.len(p.blocks.map(x => x.text).join('')) / 1000).toFixed(1).replace('.0', '')}k знаков</small></div></header>
      <main class="ex-b">
        ${list.length ? `<p class="lbl">Замечания · ${list.length}</p><div class="checks">${list.map((c, k) => `<div class="ck ck-${c.level}"><button class="ck-t" data-i="${k}">${e(c.text)}</button><button class="ck-x" data-x="${k}" aria-label="Скрыть">${I.x}</button></div>`).join('')}</div>` : `<p class="ok-note">${I.check}Замечаний нет</p>`}
        ${miss.length ? `<p class="lbl">Нужен дизайн · ${miss.length}</p><div class="checks">${miss.map(m => `<div class="ck ck-design"><span class="ck-t"><b>${e(m.role.split(':')[0])}</b> <span class="mono">${e(m.need || '')}</span></span></div>`).join('')}</div>` : ''}
        <p class="lbl">Передать</p>
        <div class="list"><button class="row" id="xShare"><b>Текстом в чат</b><small>Вставка этого текста в Гриди собирает ту же страницу</small></button>
          <button class="row" id="xZip"><b>Архив для вёрстки</b><small>Текст по полям, схема, ТЗ на картинки с именами слотов</small></button></div>
      </main>
      ${list.some(c => c.fix && c.fix.adapt || /длиннее|адаптир/.test(c.text)) ? '<div class="dock"><button class="pill grad wide" id="xFix">Поправить всё</button></div>' : ''}`;
    el.querySelector('#xX').onclick = close;
    el.querySelectorAll('[data-x]').forEach(x => x.onclick = () => { p.dismissed.push(list[+x.dataset.x].text); save(); draw(); });
    el.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { const c = list[+x.dataset.i]; if (!c.block) return; close(); A.mode = 'page'; A.sel = c.block.id; A.jump = c.block.id; editor(); blockSheet(); });
    el.querySelector('#xShare').onclick = async () => { const t = shareText(p); if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) { try { await navigator.share({title: p.name, text: t}); return; } catch (err) { if (err.name === 'AbortError') return; } } await G.copy(t); toast('Текст страницы скопирован — вставьте в чат'); };
    el.querySelector('#xZip').onclick = async () => { try { await G.doExport(p); } catch (err) { toast(err.message); } };
    const fx = el.querySelector('#xFix'); if (fx) fx.onclick = async () => { try { const n = await G.runAdapt(p, 'fit', null, {}); if (n) { G.autoPick(p); save(); toast(`Поправлено блоков: ${n}`); draw(); } } catch (err) { if (err.message !== 'cancel') toast(err.message); } };
  };
  const close = () => morph(() => { el.remove(); document.body.classList.remove('noscroll'); editor(); }, 'pop');
  morph(() => { draw(); document.body.appendChild(el); document.body.classList.add('noscroll'); }, 'push');
};
const exportSheet = exportView;

/* ---------- старт ---------- */
const st = document.createElement('style'); st.textContent = G.WIRE_CSS; document.head.appendChild(st);
const route = () => { const m = location.hash.match(/^#\/p\/(.+)$/); if (m && (!A.page || A.page.id !== m[1])) go('edit', m[1]); else if (!m && A.view !== 'home') go('home'); };
addEventListener('hashchange', route);
const m0 = location.hash.match(/^#\/p\/(.+)$/); if (m0) go('edit', m0[1]); else render();
G.m = {A, shareText, fromShare, build, lines, parseLine};
})();
