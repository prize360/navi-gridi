/* Гриди — оболочка: маршруты, шапка, окна, страницы, настройки */
'use strict';
(() => {
const G = window.Gridi, e = G.esc;
const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
G.icon = {
  spark: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  more: I('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  copy: I('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
  down: I('<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>'),
  up: I('<path d="M12 20V8M6 13l6-6 6 6M5 4h14"/>'),
  book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'),
  play: I('<path d="M7 5v14l11-7z"/>'),
  file: I('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  ext: I('<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
};

/* ---------- состояние и маршруты ---------- */
const S = G.ui = {page: null, tab: 'text', sel: null, view: 'pages', lib: {kind: 'templates', id: null}, checks: null};
S.pageObj = () => S.page;
let saveT = 0;
S.save = (now) => { clearTimeout(saveT); const p = S.page; if (!p) return; const run = () => G.store.put(p); if (now) return run(); saveT = setTimeout(run, 400); };
S.TABS = [['text', 'Текст'], ['tpl', 'Шаблоны'], ['preview', 'Превью'], ['check', 'Проверка']];
const LIBTABS = [['templates', 'Шаблоны'], ['scenarios', 'Сценарии'], ['prompts', 'Промты'], ['icons', 'Иконки']];
const route = () => {
  const h = (location.hash || '#/').slice(2).split('/').map(decodeURIComponent);
  if (h[0] === 'p' && h[1]) return {view: 'page', id: h[1], tab: h[2] || 'text'};
  if (h[0] === 'lib') return {view: 'library', kind: G.KINDS[h[1]] ? h[1] : 'templates', id: h[2] || null};
  if (h[0] === 'settings') return {view: 'settings'};
  return {view: 'pages'};
};
S.go = hash => { if (location.hash === hash) S.render(); else location.hash = hash; };
/* плавающая кнопка внизу: одно главное действие экрана */
S.cta = c => {
  const w = document.getElementById('ctaWrap'), b = document.getElementById('cta');
  w.hidden = !c; if (!c) return;
  b.innerHTML = (c.icon || '') + e(c.label); b.onclick = () => c.run(b);
};
S.render = async () => {
  const r = route(); S.view = r.view;
  if (r.view === 'page') {
    if (!S.page || S.page.id !== r.id) { S.page = await G.store.get(r.id); S.sel = null; S.checks = null; S.showSource = false; }
    if (!S.page) { S.go('#/'); return; }
    S.tab = S.TABS.some(t => t[0] === r.tab) ? r.tab : ['page', 'build'].includes(r.tab) ? 'tpl' : 'text';
  } else { if (S.page) S.save(true); S.page = null; }
  if (r.view === 'library') { S.lib.kind = r.kind; S.lib.id = r.id; }
  const key = location.hash, same = key === S._lastKey, y = window.scrollY, toBlock = !!S.scrollTo;
  S._lastKey = key;
  document.querySelectorAll('.epop, .menu').forEach(x => x.remove());
  document.getElementById('top').innerHTML = header();
  S.cta(null);
  const v = document.getElementById('view');
  if (r.view === 'pages') await G.views.pages(v);
  else if (r.view === 'page') G.views[S.tab](v);
  else if (r.view === 'library') G.views.library(v);
  else G.views.settings(v);
  /* тот же экран — остаёмся на месте; новый — наверх */
  if (toBlock) { const el = S.sel && (document.getElementById('blk-' + S.sel) || document.getElementById('tc-' + S.sel)); if (el) { const top = el.getBoundingClientRect().top + window.scrollY - (document.getElementById('top').offsetHeight + 24); window.scrollTo(0, Math.max(0, top)); } S.scrollTo = false; }
  else if (same) window.scrollTo(0, y); else window.scrollTo(0, 0);
  document.title = (S.page ? S.page.name + ' — ' : '') + 'Гриди';
};
/* несохранённые правки в редакторах библиотеки и настройках: предупреждаем перед уходом */
S.dirty = false;
window.addEventListener('hashchange', () => {
  if (S.dirty && !confirm('Есть несохранённые изменения. Уйти без сохранения?')) { history.replaceState(null, '', S._lastKey || '#/'); return; }
  S.dirty = false; S.render();
});
window.addEventListener('beforeunload', ev => { if (S.dirty) { ev.preventDefault(); ev.returnValue = ''; } });
const markDirty = ev => { if (!(S.view === 'library' && S.lib.id) && S.view !== 'settings') return;
  const t = ev.target; if (ev.type === 'click' && !(t.closest && t.closest('.seg button, [data-mv], [data-rm], #addRole, [data-krea]'))) return;
  if (t.closest && t.closest('#libQ, #packIn, [data-close]')) return; S.dirty = true; };
['input', 'change', 'click'].forEach(k => document.getElementById('view').addEventListener(k, markDirty, true));
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') document.querySelectorAll('.epop').forEach(x => x.remove()); });

/* ---------- шапка ---------- */
const BURGER = I('<path d="M4 7h16M4 12h16M4 17h16"/>');
const header = () => {
  const brand = `<a class="mark" href="#/" aria-label="Гриди — мои страницы"><img src="${G.LOGO}" alt=""></a><a class="wm" href="#/" tabindex="-1" aria-hidden="true">Гриди</a>`;
  const burger = `<button class="ib" id="burger" aria-label="Меню" aria-haspopup="menu" aria-expanded="false">${BURGER}</button>`;
  let l = brand, m = '', rr = '';
  if (S.view === 'page') {
    const p = S.page, none = !p.blocks.length, errs = none ? 0 : G.checks(p).filter(c => c.level !== 'info').length;
    l += `<i class="sep" aria-hidden="true">›</i><input class="pname" id="pname" value="${e(p.name)}" aria-label="Название страницы" size="${Math.max(8, Math.min(40, p.name.length))}">`;
    m = `<nav class="pill seg" aria-label="Шаги">${S.TABS.map(([k, n]) => none && k !== 'text' ? `<a aria-disabled="true" title="Сначала разберите текст">${n}</a>` : `<a href="#/p/${p.id}/${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${n}${k === 'check' && errs ? `<span class="cnt">${errs}</span>` : ''}</a>`).join('')}</nav>`;
    rr = `<button class="ib" id="exportBtn" aria-label="Выгрузка" data-tip="Выгрузка" aria-haspopup="menu" ${none ? 'disabled' : ''}>${G.icon.down}</button>`;
  } else if (S.view === 'library') {
    l += `<i class="sep" aria-hidden="true">›</i><span class="ttl">Библиотека</span>`;
    m = `<nav class="pill seg" aria-label="Разделы библиотеки">${LIBTABS.map(([k, n]) => `<a href="#/lib/${k}" ${S.lib.kind === k ? 'aria-current="page"' : ''}>${n}</a>`).join('')}</nav>`;
  } else if (S.view === 'settings') l += `<i class="sep" aria-hidden="true">›</i><span class="ttl">Настройки</span>`;
  return `<div class="bar__l">${l}</div><div class="bar__m">${m}</div><div class="bar__r">${rr}${burger}</div>`;
};
S.header = () => { document.getElementById('top').innerHTML = header(); };
document.addEventListener('input', ev => {
  if (ev.target.id === 'pname' && S.page) { S.page.name = ev.target.value || 'Без названия'; ev.target.size = Math.max(8, Math.min(40, ev.target.value.length)); S.save(); }
});
document.addEventListener('click', ev => {
  const bg = ev.target.closest('#burger');
  if (bg) { bg.setAttribute('aria-expanded', 'true'); S.menu(bg, [
    {label: 'Мои страницы', icon: G.icon.file, run: () => S.go('#/')},
    {label: 'Библиотека', icon: G.icon.book, note: 'Шаблоны, сценарии и промты', run: () => S.go('#/lib/templates')},
    {label: 'Настройки', icon: G.icon.gear, note: 'Модель и Krea по умолчанию', run: () => S.go('#/settings')},
    '-',
    {label: 'Нави', img: G.LOGO_NAVI, note: 'Курс и прототип навигации', run: () => { const u = G.naviUrl() + '#/navi'; /* на сайте — в этой же вкладке; один файл — новой вкладкой: из blob вернуться в файл нельзя */ if (/^https?:$/.test(location.protocol)) location.href = u; else window.open(u, '_blank'); }},
  ], () => bg.setAttribute('aria-expanded', 'false'), 'burger'); }
  const ck = ev.target.closest('#checksBtn');
  if (ck && S.page) { ck.setAttribute('aria-expanded', 'true'); S.checksMenu(ck, () => ck.setAttribute('aria-expanded', 'false')); }
  const ex = ev.target.closest('#exportBtn');
  if (ex && S.page) { ex.setAttribute('aria-expanded', 'true'); S.exportMenu(ex, () => ex.setAttribute('aria-expanded', 'false')); }
});
/* проверка — дропдаун из шапки: замечания по группам, клик ведёт к блоку */
S.checksMenu = (anchor, onClose) => {
  const p = S.page, c = G.checks(p), items = [];
  const go = x => () => {
    if (x.fix && x.fix.addRole) { const sc = G.scenario(p.scenario), order = sc.roles.map(r => r.id), my = order.indexOf(x.fix.addRole); let at = p.blocks.findIndex(b => order.indexOf(b.role) > my); if (at < 0) at = p.blocks.length; const nb = G.newBlock(x.fix.addRole); p.blocks.splice(at, 0, nb); G.autoPick(p); S.sel = nb.id; S.scrollTo = true; S.save(); S.go(`#/p/${p.id}/text`); return; }
    if (x.fix && x.fix.reorder) { const order = G.scenario(p.scenario).roles.map(r => r.id); p.blocks = p.blocks.map((b, i) => ({b, i})).sort((a, z) => { const ra = order.indexOf(a.b.role), rz = order.indexOf(z.b.role); return (ra < 0 ? 99 : ra) - (rz < 0 ? 99 : rz) || a.i - z.i; }).map(y => y.b); S.save(); S.render(); return; }
    if (x.block) { S.sel = x.block.id; S.scrollTo = true; if (S.tab !== 'text' && x.cat === 'text') S.go(`#/p/${p.id}/text`); else if (S.tab === 'page' || x.cat !== 'text') { S.navi = false; S.go(`#/p/${p.id}/page`); S.render(); } else S.render(); }
  };
  G.CHECK_CATS.forEach(([k, n]) => { const L = c.filter(x => x.cat === k); if (!L.length) return; items.push({head: `${n} · ${L.length}`}); L.forEach(x => items.push({label: x.text, note: x.level === 'error' ? 'ошибка' : x.level === 'warn' ? '' : 'заметка', bad: x.level === 'error', run: go(x)})); });
  if (!items.length) items.push({head: 'Замечаний нет'}, {label: 'Страница готова к выгрузке', run: () => {}});
  S.menu(anchor, items, onClose, 'checks');
};
/* выгрузка — дропдаун из шапки */
S.exportMenu = (anchor, onClose) => {
  const p = S.page, c = G.checks(p), errs = c.filter(x => x.level === 'error').length;
  S.menu(anchor, [
    {head: errs ? `Выгрузка · ${G.num(errs, 'ошибка', 'ошибки', 'ошибок')} в проверке` : 'Выгрузка'},
    {label: 'Скопировать текст для верстальщика', icon: G.icon.copy, note: 'По блокам: шаблон и что в какое поле', run: async () => { await G.copy(G.exportParts(p).text()); S.toast('Текст скопирован'); }},
    {label: 'Открыть wireframe', icon: G.icon.ext, note: 'В новой вкладке — на согласование', run: () => G.openWire(p)},
    '-',
    {label: 'Скачать архив страницы', icon: G.icon.down, note: G.EXPORTS.map(x => x.file).join(' · '), run: async () => { await S.save(true); G.doExport(p); }},
  ], onClose);
};

/* ---------- окна ---------- */
S.modal = (html, {wide, onClose} = {}) => {
  const root = document.createElement('div'); root.className = 'scrim';
  root.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(root);
  const prev = document.activeElement;
  const close = () => { root.remove(); document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); onClose && onClose(); };
  const key = ev => { if (ev.key === 'Escape') close(); };
  document.addEventListener('keydown', key);
  root.addEventListener('mousedown', ev => { if (ev.target === root) close(); });
  root.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
  setTimeout(() => { const f = root.querySelector('[autofocus],textarea,input,button.pri'); f && f.focus(); }, 20);
  return {root, close, $: s => root.querySelector(s)};
};
S.toast = text => {
  let box = document.querySelector('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; box.appendChild(t);
  setTimeout(() => t.remove(), 4200);
};
/* дропдаун: {label, note, score, bad, checked, danger, run} | {head} | '-' */
S.menu = (anchor, items, onClose, cls0) => {
  document.querySelectorAll('.menu').forEach(m => m.remove());
  const m = document.createElement('div'); m.className = 'menu' + (cls0 ? ' menu--' + cls0 : ''); m.setAttribute('role', 'menu');
  const cls = n => n >= 75 ? 'hi' : n >= G.MISS ? 'mid' : 'lo';
  m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : it.head ? `<div class="mh">${e(it.head)}</div>` : `<button role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}" ${it.checked ? 'aria-checked="true"' : ''}>${it.score != null ? `<span class="score ${cls(it.score)}">${it.score}</span>` : ''}${it.icon ? `<span class="mi">${it.icon}</span>` : ''}${it.img ? `<img class="mimg" src="${it.img}" alt="">` : ''}<span class="mt">${e(it.label)}${it.note ? `<small class="${it.bad ? 'bad' : ''}">${e(it.note)}</small>` : ''}</span></button>`).join('');
  /* поиск — в длинных меню (выбор шаблона): фильтр по подписи, скрытые «ещё» тоже ищутся */
  if (items.filter(it => it && it.label).length > 10) {
    m.insertAdjacentHTML('afterbegin', '<input class="in menu-q" placeholder="Найти по названию" aria-label="Найти">');
    const q = m.querySelector('.menu-q'), rows = [...m.children].filter(x => x !== q);
    const apply = () => { const v = q.value.trim().toLowerCase();
      rows.forEach(x => { const it = x.dataset.i != null ? items[+x.dataset.i] : null;
        if (x.classList.contains('mh') || x.tagName === 'HR') return;
        x.hidden = v ? !(it && it.label && !it.more && (it.search || it.label).toLowerCase().includes(v)) : !!(it && it.extra); });
      rows.forEach((x, k) => { if (!x.classList.contains('mh') && x.tagName !== 'HR') return; let j = k + 1, any = false; while (j < rows.length && !rows[j].classList.contains('mh') && rows[j].tagName !== 'HR') { if (!rows[j].hidden) any = true; j++; } x.hidden = v ? !any : false; }); };
    q.oninput = apply; apply(); setTimeout(() => q.focus(), 0);
  }
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
  const leftAlign = r.left + w < innerWidth - 8 && r.left < innerWidth / 2;
  m.style.left = Math.max(8, leftAlign ? r.left : Math.min(r.right - w, innerWidth - w - 8)) + 'px';
  m.style.top = (r.bottom + 6 + h > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
  const close = () => { m.remove(); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', key); onClose && onClose(); };
  const out = ev => { if (!m.contains(ev.target)) close(); };
  const key = ev => { if (ev.key === 'Escape') { close(); anchor.focus(); } };
  setTimeout(() => { document.addEventListener('mousedown', out, true); document.addEventListener('keydown', key); }, 0);
  m.addEventListener('click', ev => { const b = ev.target.closest('button[data-i]'); if (!b) return; close(); items[+b.dataset.i].run(); });
  const first = m.querySelector('button'); first && first.focus();
};

/* статус запроса к модели: что делаем, сколько прошло, отменить; по лимиту времени запрос прерывается */
S.busy = (label, {limit = 180, slow = ''} = {}) => {
  document.querySelectorAll('.busy').forEach(x => x.remove());
  const ctl = new AbortController(), t0 = Date.now(), el = document.createElement('div');
  el.className = 'busy'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<span class="spin" aria-hidden="true"></span><span class="bt"><b>${e(label)}</b><small>Модель думает · <span class="sec">0 с</span></small><small class="slow" hidden>${e(slow)}</small></span><button class="btn sm ghost">Отменить</button>`;
  document.body.appendChild(el);
  const h = {signal: ctl.signal, timedOut: false, done: () => { clearInterval(tick); el.remove(); }};
  el.querySelector('button').onclick = () => ctl.abort();
  const tick = setInterval(() => { const sec = Math.round((Date.now() - t0) / 1000); el.querySelector('.sec').textContent = sec < 60 ? sec + ' с' : Math.floor(sec / 60) + ' мин ' + (sec % 60) + ' с'; if (slow && sec >= 20) el.querySelector('.slow').hidden = false; if (sec >= limit) { h.timedOut = true; ctl.abort(); } }, 1000);
  return h;
};
/* модель вручную: скопировать промт → вставить ответ */
S.manualAsk = (label, prompt) => new Promise((res, rej) => {
  const m = S.modal(`<div class="modal-h"><div><h2 class="h2">${e(label)}</h2><p class="sub">Модель не подключена — отправьте промт в свою модель и вставьте ответ.</p></div><button class="ib" data-close aria-label="Закрыть">${G.icon.x}</button></div>
    <ol class="steps">
      <li><div><button class="btn pri" id="mCopy">${G.icon.copy}Скопировать промт</button> <span class="hint">${prompt.length.toLocaleString('ru-RU')} зн.</span>
        <details style="margin-top:8px"><summary class="hint">Посмотреть промт</summary><pre style="white-space:pre-wrap;font-size:12px;max-height:240px;overflow:auto;background:var(--soft);padding:10px;border-radius:8px">${e(prompt)}</pre></details></div></li>
      <li><div>Вставьте в DeepSeek или другую модель без поиска. Неопубликованные материалы — только в разрешённую модель.</div></li>
      <li><div><label class="lbl" for="mAns">Ответ модели целиком</label><textarea class="ta" id="mAns" rows="7" placeholder="Вставьте ответ — Гриди найдёт в нём JSON"></textarea><p class="hint" id="mErr" style="color:var(--err)"></p></div></li>
    </ol>
    <div class="modal-f"><button class="btn ghost" data-close>Отменить</button><button class="btn pri" id="mOk">Продолжить</button></div>`, {onClose: () => rej(new Error('cancel'))});
  m.$('#mCopy').onclick = async () => { await G.copy(prompt); S.toast('Промт скопирован'); m.$('#mAns').focus(); };
  m.$('#mOk').onclick = () => {
    const v = m.$('#mAns').value; if (!G.parseJSON(v)) { m.$('#mErr').textContent = 'В ответе нет JSON. Попросите модель: «верни только JSON».'; return; }
    m.root.remove(); res(v);
  };
});

/* меню адаптации: в шапке — для всех блоков, у блока — для одного */
S.adaptMenu = (anchor, blockId) => {
  const fit = G.prompt('fit'), ps = G.lib.all('prompts').filter(p => p.stage === 'adapt' && !p.system), ids = blockId ? [blockId] : null;
  S.menu(anchor, [{head: blockId ? 'Этот блок' : 'Все блоки'}, {label: 'Уложить в шаблоны', note: 'Текст под поля и лимиты выбранных шаблонов', run: () => S.runAdapt(fit, ids)},
    ...(ps.length ? [{head: 'Свои промты'}, ...ps.map(p => ({label: p.name, note: p.description, run: () => S.runAdapt(p, ids)}))] : []),
    '-', {label: 'Добавить свой промт', note: 'Редполитика, интеграция, тон', run: () => S.go('#/lib/prompts/new')}]);
};
S.runAdapt = async (p, ids) => {
  const page = S.page; if (!page) return;
  let vals = {};
  if (p.ask && p.ask.length) {
    vals = await new Promise(res => {
      const m = S.modal(`<div class="modal-h"><h2 class="h2">${e(p.name)}</h2><button class="ib" data-close aria-label="Закрыть">${G.icon.x}</button></div>
        ${p.ask.map(a => `<div class="fld"><label class="lbl" for="ask-${e(a.k)}">${e(a.label)}</label><textarea class="ta" rows="3" id="ask-${e(a.k)}" placeholder="${e(a.placeholder || '')}"></textarea></div>`).join('')}
        <div class="modal-f"><button class="btn ghost" data-close>Отменить</button><button class="btn pri" id="askOk">Запустить</button></div>`, {onClose: () => res(null)});
      m.$('#askOk').onclick = () => { const o = {}; p.ask.forEach(a => o[a.k] = m.$('#ask-' + CSS.escape(a.k)).value.trim()); m.root.remove(); res(o); };
    });
    if (!vals) return;
  }
  try { const n = await G.runAdapt(page, p.id, ids, vals); if (n) { S.toast(`«${p.name}»: ${G.num(n, 'блок', 'блока', 'блоков')} готово — текст обновлён и во вкладке «Текст»`); S.checks = null; S.save(); S.render(); } else S.toast(`«${p.name}»: модель ничего не вернула для этих блоков. Если правки ждали — проверьте, что в промте есть формат ответа {"blocks": …}.`); }
  catch (err) { if (err.message !== 'cancel') S.toast(err.message); }
};

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
      if (x && a && a.textContent.trim().length >= x.length / 2) out.push('[ссылка] ' + x + ' | ' + a.getAttribute('href'));
      else if (x) out.push(x);
      n.querySelectorAll('img').forEach(walk); return;
    }
    [...n.children].forEach(walk);
  };
  [...d.body.children].forEach(walk);
  return out.join('\n');
};
S.bindPaste = ta => ta.addEventListener('paste', ev => {
  const html = ev.clipboardData && ev.clipboardData.getData('text/html');
  if (!html || !/<(h[1-6]|li|table|img)/i.test(html)) return;
  const md = G.htmlToMarkup(html);
  if (!md.trim()) return;
  ev.preventDefault();
  const a = ta.selectionStart, z = ta.selectionEnd; ta.value = ta.value.slice(0, a) + md + ta.value.slice(z); ta.selectionStart = ta.selectionEnd = a + md.length;
  ta.dispatchEvent(new Event('input', {bubbles: true}));
  S.toast('Заголовки, списки и таблицы размечены автоматически');
});

/* ---------- экран «Страницы» ---------- */
G.views = {};
G.views.pages = async v => {
  const list = (await G.store.list()).sort((a, b) => b.updated - a.updated);
  const scName = id => (G.lib.get('scenarios', id) || {name: id}).name;
  const when = t => new Date(t).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
  const L = G.lib.all('templates'), need = L.filter(t => !t.status.prod && !t.component).length;
  v.innerHTML = `<div class="col">
    <div class="head"><p class="eye">Гриди · сборка страниц из текста</p><h1 class="h1">Мои страницы</h1>
      <p class="lead">Вставьте текст автора — Гриди разложит его по сценарию, подберёт шаблоны из админки и уложит текст под их лимиты. Модель запускается только после вашего подтверждения.</p></div>
    <section class="sec"><p class="eye">Мои страницы · хранятся в этом браузере</p>
      ${list.length ? `<ul class="list">${list.map(p => `<li><a class="lrow has-x" href="#/p/${p.id}/text"><span class="n">${G.icon.file}</span><span><b>${e(p.name)}</b><small>${e(scName(p.scenario))} · ${G.num(p.blocks.length, 'блок', 'блока', 'блоков')} · ${when(p.updated)}</small></span><span></span></a><button class="lx" data-del="${p.id}" aria-label="Удалить ${e(p.name)}">${G.icon.x}</button></li>`).join('')}</ul>`
      : `<div class="list"><p class="lempty">Здесь появятся ваши страницы. Нажмите «Создать страницу» внизу или откройте пример.</p></div>`}
    </section>
    <section class="sec"><p class="eye">Библиотека</p>
      <ul class="list"><li><a class="lrow" href="#/lib/templates"><span class="n">${G.icon.book}</span><span><b>Шаблоны, сценарии и промты</b><small>${G.num(L.filter(t => t.status.prod || t.component).length, 'шаблон', 'шаблона', 'шаблонов')} в админке · ${need} ждут дизайна</small></span><span></span></a></li></ul>
    </section>
    <section class="sec"><p class="eye">Примеры · открываются копией</p>
      <ul class="list">${G.examples.map((x, i) => `<li><button class="lrow" data-ex="${i}"><span class="n">0${i + 1}</span><span><b>${e(x.name)}</b><small>${e(scName(x.scenario))} · ${G.num(x.blocks.length, 'блок', 'блока', 'блоков')}</small></span><span></span></button></li>`).join('')}
        <li><label class="lrow" for="imp" style="cursor:pointer"><span class="n">${G.icon.up}</span><span><b>Открыть страницу коллеги</b><small>архив выгрузки или page.json из него</small></span><span></span></label><input type="file" id="imp" accept=".zip,.json" class="sr"></li></ul>
    </section>
  </div>`;
  S.cta({label: 'Создать страницу', icon: G.icon.plus, run: () => newPageModal()});
  v.querySelectorAll('[data-ex]').forEach(b => b.onclick = async () => { const p = G.fromExample(G.examples[+b.dataset.ex]); await G.store.put(p); S.go(`#/p/${p.id}/text`); });
  v.querySelectorAll('[data-del]').forEach(b => b.onclick = async ev => { ev.preventDefault(); if (!confirm('Удалить страницу? Её нельзя будет восстановить.')) return; await G.store.del(b.dataset.del); S.render(); });
  v.querySelector('#imp').onchange = async ev => { try { const p = await G.importProject(ev.target.files[0]); S.go(`#/p/${p.id}/text`); } catch (err) { S.toast(err.message); } };
};
const newPageModal = () => {
  const scs = G.lib.all('scenarios');
  const m = S.modal(`<div class="modal-h"><h2 class="h2">Новая страница</h2><button class="ib" data-close aria-label="Закрыть">${G.icon.x}</button></div>
    <div class="fld"><label class="lbl" for="npName">Название</label><input class="in" id="npName" placeholder="Например: Бизнес-завтрак 15 октября" autofocus></div>
    <div class="fld"><span class="lbl">Сценарий</span><div class="seg" id="npSc">${scs.map((s, i) => `<button type="button" data-id="${s.id}" aria-pressed="${i === 0}">${e(s.name)}</button>`).join('')}</div></div>
    <div class="fld"><label class="lbl" for="npText">Текст автора — можно потом</label><textarea class="ta" id="npText" rows="8" placeholder="Вставьте текст целиком. Из Google Docs и Word заголовки и списки разметятся сами."></textarea></div>
    <div class="modal-f"><button class="btn ghost" data-close>Отменить</button><button class="btn pri" id="npOk">Создать</button></div>`);
  let sc = scs[0].id;
  m.$('#npSc').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; sc = b.dataset.id; m.$('#npSc').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  S.bindPaste(m.$('#npText'));
  m.$('#npOk').onclick = async () => { const p = G.newPage(m.$('#npName').value.trim(), sc, m.$('#npText').value); await G.store.put(p); m.root.remove(); S.go(`#/p/${p.id}/text`); };
};

/* ---------- настройки ---------- */
G.views.settings = v => {
  const s = G.llmSettings(), loc = G.ls.get('settings', {}), krea = G.lib.settings().krea;
  v.innerHTML = `<div class="col">
    <div class="head"><p class="eye">Хранятся только в этом браузере</p><h1 class="h1">Настройки</h1></div>
    <div class="card"><h3>Модель для разбора и адаптации</h3>
      <div class="seg" id="mode"><button data-m="manual" aria-pressed="${s.mode !== 'api'}">Вручную</button><button data-m="api" aria-pressed="${s.mode === 'api'}">Свой ключ</button></div>
      <p class="hint" id="modeHint" style="margin:10px 0 14px">${s.mode === 'api' ? 'Гриди сама отправит промт. Нужен адрес, совместимый с OpenAI API. Если модель не отвечает из браузера, Гриди откроет ручной режим.' : 'Гриди даёт промт, вы вставляете его в свою модель и возвращаете ответ. Работает с любой моделью.'}</p>
      <div id="apiBox" ${s.mode === 'api' ? '' : 'hidden'}>
        <div class="fld"><span class="lbl">Сервис</span><div class="seg" id="preset"><button data-b="https://api.deepseek.com" data-m="deepseek-chat">DeepSeek</button><button data-b="https://openrouter.ai/api/v1" data-m="deepseek/deepseek-chat-v3-0324:free">OpenRouter</button><button data-b="" data-m="">Свой адрес</button></div><span class="hint" style="display:block;margin-top:6px">Бесплатные модели OpenRouter — с «:free» в названии, точное название смотрите в их каталоге. Работает ли сервис из вашей сети, покажет «Проверить» ниже.</span></div>
        <div class="grid2"><div class="fld"><label class="lbl" for="base">Адрес API</label><input class="in" id="base" value="${e(s.base)}"></div><div class="fld"><label class="lbl" for="model">Модель</label><input class="in" id="model" value="${e(s.model)}"></div></div>
        <div class="fld"><label class="lbl" for="key">Ключ</label><input class="in" id="key" type="password" value="${e(s.key)}" autocomplete="off"><span class="hint">Ключ не уходит никуда, кроме адреса API. Не вводите его на общем компьютере.</span></div>
      </div>
    </div>
    <div class="card" id="testCard" ${s.mode === 'api' ? '' : 'hidden'}><h3>Проверка подключения <button class="btn sm" id="testApi">Проверить</button></h3><p class="hint" id="testRes" style="margin:0">Отправит короткий запрос с этим ключом прямо из браузера. Сначала сохраните.</p></div>
    <div class="card"><h3>Krea app по умолчанию</h3><p class="hint" style="margin:-4px 0 12px">Для шаблонов, у которых своя Krea app не задана. Свою можно указать в конструкторе шаблона — блок «Картинки — Krea».</p>
      ${krea.map(k => `<div class="fld"><label class="lbl" for="krea-${k.size}">${e(k.name)} — ${k.size}</label><input class="in" id="krea-${k.size}" data-krea="${k.size}" value="${e(k.url)}" placeholder="https://www.krea.ai/nodes/app/…"></div>`).join('')}
    </div>
    <div class="card"><h3>Библиотека</h3><p style="margin:0">Версия ${e(G.lib.version())}.</p></div>
    <div class="card"><h3>Итоги пилота</h3><p class="hint" style="margin:-4px 0 12px">Архив для автора Гриди: ваши шаблоны, сценарии и промты, каких шаблонов не хватило, сколько страниц собрано и как часто запускалась модель. Ключ модели и картинки в архив не попадают. Заодно это резервная копия: всё в Гриди хранится только в этом браузере.</p>
      <label class="row" style="gap:8px;margin-bottom:12px"><input type="checkbox" id="pilotTexts"> Приложить тексты страниц (без картинок)</label>
      <button class="btn" id="pilotExp">${G.icon.down}Скачать архив итогов</button></div>
    <p class="hint" id="saved"></p>
  </div>`;
  v.querySelector('#pilotExp').onclick = () => G.pilotExport(v.querySelector('#pilotTexts').checked);
  let mode = s.mode;
  v.querySelector('#mode').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; mode = b.dataset.m; v.querySelectorAll('#mode button').forEach(x => x.setAttribute('aria-pressed', x === b)); v.querySelector('#apiBox').hidden = mode !== 'api'; v.querySelector('#testCard').hidden = mode !== 'api'; };
  v.querySelector('#preset').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.b) { v.querySelector('#base').value = b.dataset.b; v.querySelector('#model').value = b.dataset.m; } else v.querySelector('#base').focus(); };
  v.querySelector('#testApi').onclick = async () => {
    const out = v.querySelector('#testRes'), st = {base: v.querySelector('#base').value.trim(), key: v.querySelector('#key').value.trim(), model: v.querySelector('#model').value.trim()};
    if (!st.key) { out.textContent = 'Введите ключ.'; return; }
    const busy = S.busy('Проверка подключения', {limit: 60, slow: 'Бесплатные модели бывают медленными.'}), t0 = Date.now();
    out.textContent = 'Отправляю короткий запрос…';
    try {
      const a = await G.callModel(st, 'Верни только JSON без пояснений: {"ok": true}', {signal: busy.signal, max_tokens: 400}), sec = Math.round((Date.now() - t0) / 1000);
      if (G.parseJSON(a)) { G._modelOkAt = Date.now(); out.innerHTML = `<b style="color:var(--acc-ink)">Работает.</b> Модель ответила за ${sec} с и вернула JSON — разбор и адаптация пойдут прямо из Гриди. Не забудьте сохранить.`; }
      else out.innerHTML = `<b style="color:var(--err)">Отвечает, но не JSON.</b> Ответ: «${e(a.slice(0, 80) || 'пусто')}». Гриди нужен JSON — выберите другую модель или работайте вручную.`;
    } catch (err) {
      out.innerHTML = busy.timedOut ? '<b style="color:var(--err)">Не ответила за минуту.</b> Модель перегружена или слишком медленная — попробуйте позже или другую.'
        : err.name === 'AbortError' ? 'Проверка отменена.'
        : err.status ? `<b style="color:var(--err)">${e(err.message)}.</b>`
        : '<b style="color:var(--err)">Браузер не смог достучаться.</b> Сервис не принимает запросы прямо со страниц сайтов, недоступен из вашей сети или адрес неверный. Такой сервис без посредника не подключить — работайте вручную.';
    } finally { busy.done(); }
  };;
  const save = () => {
    G.ls.set('llm', {mode, base: v.querySelector('#base').value.trim(), model: v.querySelector('#model').value.trim(), key: v.querySelector('#key').value.trim()});
    const urls = {}; v.querySelectorAll('[data-krea]').forEach(i => urls[i.dataset.krea] = i.value.trim());
    G.ls.set('settings', {...loc, kreaUrls: urls});
    v.querySelector('#saved').textContent = 'Сохранено'; S.toast('Настройки сохранены'); S.dirty = false; S.go('#/');
  };
  S.cta({label: 'Сохранить', run: save});
};

/* ---------- запуск ---------- */
G.boot = () => { document.body.insertAdjacentHTML('afterbegin', ''); S.render(); };
})();
