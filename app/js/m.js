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
  merge: '<svg viewBox="0 0 24 24"><path d="M7 4v5a3 3 0 003 3h4a3 3 0 013 3v5M7 20v-4"/><path d="M4 7l3-3 3 3"/></svg>',
  star: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="M4 20l3.5-6 3.5 6zM14 14h6v6h-6z"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path d="M4 12V5a1 1 0 011-1h7l8 8-8 8-8-8z"/><circle cx="8.5" cy="8.5" r="1.3"/></svg>',
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
  img: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20 16l-5-5-8 8"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg>',
  ai: '<svg viewBox="0 0 24 24"><path d="M10 3.5l1.6 4.4a3 3 0 001.8 1.8L17.8 11.3l-4.4 1.6a3 3 0 00-1.8 1.8L10 19.1l-1.6-4.4a3 3 0 00-1.8-1.8L2.2 11.3l4.4-1.6a3 3 0 001.8-1.8z"/><path d="M18.5 2.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z"/></svg>',
  icons: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="M4 20l3.5-6 3.5 6zM14 14h6v6h-6z"/></svg>',
  addUp: '<svg viewBox="0 0 24 24"><rect x="4" y="12" width="16" height="8" rx="2"/><path d="M12 3v6M9 6h6"/></svg>',
  addDown: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="8" rx="2"/><path d="M12 15v6M9 18h6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>',
};

/* ---------- строки разметки ---------- */
const KINDS = [
  {k: 'p', label: 'Текст', g: ''},
  {k: 'h1', label: '', g: 'H1'},
  {k: 'h2', label: '', g: 'H2'},
  {k: 'h3', label: '', g: 'H3'},
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
const noLink = (k, t) => k === 'btn' && t && !/\s\|\s+\S/.test(t) ? ' data-nolink' : '';
const lineHTML = (k, t) => `<div class="ln" data-k="${k}" data-g="${e((KIND[k] || KIND.p).g)}"${noLink(k, t)}>${t ? e(t) : '<br>'}</div>`;
const mkLine = (k, t) => { const d = document.createElement('div'); d.className = 'ln'; d.dataset.k = k; d.dataset.g = (KIND[k] || KIND.p).g; if (t) d.textContent = t; else d.innerHTML = '<br>'; return d; };
const setKind = (d, k) => { d.dataset.k = k; d.dataset.g = (KIND[k] || KIND.p).g; };

/* ---------- замечания: одна причина — одна строка ----------
   stop — блок не выгрузится; fit — поправить под шаблон (всё по блоку одной строкой); page — про страницу целиком; hint — подсказки */
const HINT = /^Полотно текста|^Мало врезов|^Все врезы одного вида|^Порядок блоков|встречается .* раза|без подзаголовков/;
const kindOf = c => c.cat === 'navi' ? (c.level === 'info' ? 'hint' : 'rule') : c.tip || HINT.test(c.text) ? 'hint' : c.level === 'error' || /нет шаблона\.|^Пустой блок|«Не разобрано»/.test(c.text) ? 'stop' : c.block ? 'fit' : 'page';
const labelOf = c => { const t = c.text;
  if (/правили после адаптации/.test(t)) return '';
  if (/^Пустой блок/.test(t)) return 'пустой блок';
  if (/^Блок «Не разобрано»/.test(t)) return 'не разобрано — разнесите по блокам';
  let m;
  if ((m = t.match(/^«[^»]*»: (.+?) — адаптируйте текст/))) return m[1].replace(/ лимита$/, '');
  if (/» в шаблоне «/.test(t)) return 'tier';
  if ((m = t.match(/^Нет ссылки у кнопки «(.+?)»/))) return `кнопка «${m[1].slice(0, 24)}» без ссылки`;
  if ((m = t.match(/^Кнопка «(.+?)» не говорит/))) return `кнопка «${m[1].slice(0, 24)}» без глагола`;
  if (/в админке нет подходящего шаблона/.test(t)) return 'нужен шаблон в админке';
  if ((m = t.match(/нужен дизайн шаблона «(.+?)»/))) return 'нужен дизайн шаблона';
  if ((m = t.match(/^«[^»]*»: (.+?)\.?$/))) return m[1];
  return t.replace(/\.$/, ''); };
const rowsOf = (p, checks, byBlock) => {
  const out = {stop: [], fit: [], page: [], hint: [], rule: []};
  checks.filter(c => c.kind === 'rule').forEach(c => out.rule.push({b: c.block || null, c, text: c.text}));
  for (const b of p.blocks) { const own = checks.filter(c => c.block === b);
    const stop = own.filter(c => c.kind === 'stop'); if (stop.length) out.stop.push({b, text: [...new Set(stop.map(c => c.label || c.text))].join(' · ')});
    let fit = own.filter(c => c.kind === 'fit' && c.label).map(c => c.label); const extra = (byBlock[b.id] || []).filter(c => c.level === 'design').map(c => c.label);
    fit = [...fit, ...extra]; const hasLen = fit.some(l => /длиннее/.test(l));
    fit = fit.map(l => l === 'tier' ? (hasLen ? '' : 'текст не ложится в поля шаблона') : l).filter(Boolean);
    if (fit.some(l => l === 'нужен шаблон в админке')) fit = fit.filter(l => l !== 'нужен дизайн шаблона');
    fit = [...new Set(fit)]; if (fit.length) out.fit.push({b, text: fit.join(' · ')});
    own.filter(c => c.kind === 'hint').forEach(c => out.hint.push({b, text: c.text})); }
  checks.filter(c => !c.block && c.kind === 'page').forEach(c => out.page.push({c, text: c.text}));
  checks.filter(c => !c.block && c.kind === 'hint').forEach(c => out.hint.push({b: null, text: c.text}));
  return out; };
/* ---------- страница ---------- */
/* замечания считаются один раз на состояние страницы: бейдж, точки и экран выгрузки берут одно и то же */
const report = p => {
  const key = p.scenario + '|' + p.blocks.map(b => b.id + ':' + b.tpl + ':' + b.role + ':' + b.text.length + ':' + G.len(b.text.slice(0, 40))).join('|') + '|' + (p.dismissed || []).length;
  if (p._rep && p._rep.key === key) return p._rep;
  const dis = p.dismissed || [], checks = G.checks(p).filter(c => !dis.includes(c.text) && !/^Нави /.test(c.text));
  p.blocks.forEach(b => { const s0 = G.src(b); s0.cta.forEach((c, k) => { if (!(s0.urls || [])[k]) { const t = `Нет ссылки у кнопки «${c}» — допишите адрес через « | »`; if (!dis.includes(t)) checks.push({level: 'info', text: t, block: b}); } });
    s0.items.forEach(it => { if (it.cta && !it.url) { const t = `Нет ссылки у кнопки «${it.cta}» — допишите адрес через « | »`; if (!dis.includes(t)) checks.push({level: 'info', text: t, block: b}); } }); });
  p.blocks.forEach(b => (b.tips || []).forEach(t => { if (!dis.includes(t)) checks.push({level: 'info', text: t, block: b, tip: true}); }));
  p.blocks.filter(b => b.role === 'unparsed').forEach(b => checks.unshift({level: 'error', text: 'Блок «Не разобрано»: разнесите абзацы по блокам (Роль) или удалите блок', block: b}));
  const order = {error: 0, warn: 1, info: 2}; checks.sort((a, b) => order[a.level] - order[b.level]);
  const missing = G.missing(p), byBlock = {};
  checks.forEach(c => { c.kind = kindOf(c); if (c.label === undefined) c.label = labelOf(c); });
  /* у блока точка — только то, что мешает выгрузке или требует правки под шаблон; подсказки — отдельно */
  checks.forEach(c => { if (c.block && (c.kind === 'stop' || c.kind === 'fit') && c.label) (byBlock[c.block.id] = byBlock[c.block.id] || []).push(c); });
  missing.forEach(m => { (byBlock[m.b.id] = byBlock[m.b.id] || []).push({level: 'design', kind: 'fit', label: 'нужен шаблон в админке', text: 'Нужен шаблон в админке'}); });
  const rows = rowsOf(p, checks, byBlock);
  Object.defineProperty(p, '_rep', {value: {key, checks, missing, byBlock, rows, count: rows.stop.length + rows.fit.length + rows.page.length + rows.rule.length}, configurable: true, writable: true, enumerable: false});
  return p._rep;
};
const sc = () => G.scenario(A.page.scenario);
const roleName = b => { const n = G.roleOf(sc(), b.role).name || b.role; return n.split(':')[0]; };
/* замечание блока — в его названии рядом с номером и ролью; видно, когда блок выделен */
const blockNote = (b, p, T = A.mode === 'note') => { const R = report(p).rows, pick = l => (l.find(x => x.b === b) || {}).text || '';
  return T ? pick(R.stop) || pick(R.rule) || pick(R.hint) : pick(R.stop) || pick(R.rule) || pick(R.fit); };
const bn = (b, i) => { const n = blockNote(b, A.page); return `<b class="bn"><span>${i + 1}</span><em><i>${e(roleName(b))}</i>${n ? `<i class="bn-n">${e(n)}</i>` : ''}</em></b>`; };
const defRole = () => { const s = sc(); return s.kind === 'article' ? 'content' : ((s.roles || []).find(r => r.id !== 'hero' && r.id !== 'cta') || {id: 'about'}).id; };
const repick = b => { if (b.tplLock) return; const r = G.rank(b, A.page)[0]; b.tpl = r ? r.t.id : null; };
const verdict = b => {
  const t = G.tpl(b.tpl); if (!t) return {txt: 'Шаблон не подобран', bad: true};
  const r = G.score(b, t, A.page), tier = r.tier || 0;
  return {txt: (G.TIERS[tier] || 'Подходит') + (!G.isLive(t) ? ', нужен дизайн' : ''), bad: tier >= 2 || !G.isLive(t)};
};
let saveT = null;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => A.page && A.page.blocks.length && G.store.put(A.page), 300); };

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
const sheet = (html, {onClose, cls = '', free = false, onFull} = {}) => {
  const root = document.createElement('div'); root.className = 'sh-wrap' + (free ? ' free' : '');
  root.innerHTML = `<div class="sh-dim"></div><div class="sh ${cls}" role="dialog" aria-modal="${free ? 'false' : 'true'}"><div class="sh-grab"></div><div class="sh-in">${html}</div></div>`;
  document.body.appendChild(root); requestAnimationFrame(() => root.classList.add('on'));
  const sh = root.querySelector('.sh');
  const h = {root, sh, $: s => root.querySelector(s), $$: s => [...root.querySelectorAll(s)], closed: false,
    set: html2 => { root.querySelector('.sh-in').innerHTML = html2; },
    full: on => { sh.classList.toggle('full', on); if (onFull) onFull(on); },
    close: (silent) => { if (h.closed) return; h.closed = true; root.classList.remove('on'); setTimeout(() => root.remove(), 200); if (!silent && onClose) onClose(); }};
  root.querySelector('.sh-dim').onclick = () => free && sh.classList.contains('full') ? h.full(false) : h.close();
  const esc = ev => { if (ev.key !== 'Escape' || h.closed || document.querySelector('.sh-wrap:last-of-type') !== root) return; free && sh.classList.contains('full') ? h.full(false) : h.close(); };
  addEventListener('keydown', esc);
  root.addEventListener('click', ev => { if (ev.target.closest('[data-close]')) h.close(); });
  /* тянется за ручку и шапку: вверх — на весь экран, вниз — свернуть или закрыть */
  let y0 = null, dy = 0, moved = false;
  const down = ev => { if (!ev.target.closest('.sh-grab,.sh-h') || ev.target.closest('button,input,textarea,a,label,.fmt')) return; y0 = ev.clientY; dy = 0; moved = false; sh.classList.add('drag'); sh.setPointerCapture(ev.pointerId); };
  const move = ev => { if (y0 == null) return; dy = ev.clientY - y0; if (Math.abs(dy) > 4) moved = true; sh.style.transform = `translateY(${Math.max(dy, -24) * (dy < 0 ? .4 : 1)}px)`; };
  const up = () => { if (y0 == null) return; sh.classList.remove('drag'); sh.style.transform = ''; y0 = null;
    const isFull = sh.classList.contains('full');
    if (!moved) { if (!isFull) h.full(true); return; }
    if (dy < -40 && !isFull) h.full(true);
    else if (dy > 70) { if (isFull) h.full(false); else h.close(); } };
  sh.addEventListener('pointerdown', down); sh.addEventListener('pointermove', move); sh.addEventListener('pointerup', up); sh.addEventListener('pointercancel', up);
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
Object.assign(G.ui = G.ui || {}, {toast, busy, manualAsk});

/* подтверждение на месте: первая нажатая кнопка меняет подпись, вторая — выполняет */
const sure = (btn, label, run) => { if (btn.dataset.sure) return run(); btn.dataset.sure = 1; btn.textContent = label + ' — нажмите ещё раз'; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.sure; } }, 4000); };
/* вопросы промта (например, тон или тема интеграции) — шторкой */
const askVals = pr => new Promise(res => {
  const s = sheet(`<div class="sh-h"><h2>${e(pr.name)}</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b">${pr.ask.map(a => `<label class="lbl" for="ask-${e(a.k)}">${e(a.label)}</label><textarea class="ta" rows="3" id="ask-${e(a.k)}" placeholder="${e(a.placeholder || '')}"></textarea>`).join('')}</div>
    <div class="sh-f"><button class="pill pri wide" id="askOk">Запустить</button></div>`, {onClose: () => res(null)});
  s.$('#askOk').onclick = () => { const o = {}; pr.ask.forEach(a => o[a.k] = s.$('#ask-' + CSS.escape(a.k)).value.trim()); s.close(true); res(o); };
});

/* пустое состояние: что здесь будет и одно-два действия */
const empty = (title, text, acts = []) => `<div class="es"><b>${e(title)}</b>${text ? `<p>${e(text)}</p>` : ''}${acts.length ? `<div class="es-a">${acts.map(([id, label, pri]) => `<button class="pill sm ${pri ? 'pri' : ''}" data-es="${e(id)}">${e(label)}</button>`).join('')}</div>` : ''}</div>`;
/* ---------- экраны ---------- */
/* смена экрана — короткое проявление, без снимков страницы (они тормозили на длинных страницах) */
const morph = fn => fn();
const appear = () => { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) $app.animate([{opacity: .4}, {opacity: 1}], {duration: 140, easing: 'ease-out'}); };
const render = () => { A.view === 'home' ? home() : A.view === 'lib' ? libView() : editor(); };
const go = async (view, id) => {
  A.view = view; A.sel = null; A.line = null;
  if (view === 'edit') { A.page = await G.store.get(id); if (!A.page) { A.view = 'home'; } else A.mode = A.page.blocks.length ? 'page' : 'note'; }
  location.hash = view === 'edit' && A.page ? '#/p/' + A.page.id : '#/';
  document.body.classList.toggle('shell', A.view === 'edit'); render(); appear(); scrollTo(0, 0);
};

/* 1. Главная: вкладки сценариев, страницы — сеткой обложек */
const TABS = [['article', 'Статьи'], ['course', 'Курсы'], ['event', 'События'], ['sale', 'Продукты'], ['promo', 'Промо']];
const cover = p => { const b = p.blocks.find(x => x.role === 'hero') || p.blocks[0];
  if (!b) return `<div class="tl-empty">${e((p.text || p.name).slice(0, 60))}</div>`;
  return `<div class="tl-pv">${blockHTML(b, p)}</div>`; };
const seed = async () => {
  if (G.ls.get('seeded', false)) return; G.ls.set('seeded', true);
  for (const x of G.examples) { const p = G.fromExample(x); p.name = p.name.replace(/\s*\([^)]*\)\s*$/, ''); if (!p.blocks.length && p.text) G.assemble(p); G.autoPick(p, true); await G.store.put(p); }
};
const home = async () => {
  await seed();
  const raw = await G.store.list();
  for (const x of raw) if (!x.blocks.length && !String(x.text || '').trim()) await G.store.del(x.id); /* пустые страницы без текста — их создали и бросили */
  const all = raw.filter(x => x.blocks.length).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const tabs = TABS.filter(([id]) => G.lib.get('scenarios', id));
  A.tab = A.tab || G.ls.get('tab', 'article'); if (!tabs.some(([id]) => id === A.tab)) A.tab = (tabs[0] || ['article'])[0];
  const list = all.filter(p => p.scenario === A.tab), other = all.filter(p => !tabs.some(([id]) => id === p.scenario) && A.tab === tabs[0][0]);
  const pages = [...list, ...other], slots = Math.max(0, 9 - pages.length);
  const cnt = id => all.filter(p => p.scenario === id).length;
  $app.innerHTML = `<header class="hd"><div class="logo"><img class="lg-mark" src="${G.LOGO || ''}" alt="">Гриди</div><button class="ib round" id="hMenu" aria-label="Меню">${I.menu}</button></header>
    <nav class="tabs" role="tablist">${tabs.map(([id, n]) => `<button role="tab" class="${id === A.tab ? 'on' : ''}" data-tab="${id}">${n}${cnt(id) ? `<i>${cnt(id)}</i>` : ''}</button>`).join('')}</nav>
    <main class="home">${pages.length ? '' : '<!--'}<div class="grid">${pages.map(p => `<button class="tl" data-id="${e(p.id)}">${cover(p)}<span class="tl-n">${e(p.name)}</span></button>`).join('')}${'<span class="tl-slot"></span>'.repeat(slots)}</div>${pages.length ? '' : '-->'}
      ${!pages.length ? empty(`Здесь пока нет ${({article: 'статей', course: 'курсов', event: 'событий', sale: 'продуктов', promo: 'промо-страниц'})[A.tab] || 'страниц'}`, 'Вставьте текст — Гриди разложит его по блокам и подберёт шаблоны.', [['new', 'Создать', true]]) : ''}</main>
    <div class="dock"><button class="pill grad wide" id="hNew">Новая страница</button></div>`;
  $app.querySelectorAll('[data-tab]').forEach(c => c.onclick = () => { A.tab = c.dataset.tab; G.ls.set('tab', A.tab); home().then(appear); });
  $app.querySelectorAll('.tl').forEach(c => { let t = null;
    c.onclick = () => { if (c.dataset.held) { delete c.dataset.held; return; } go('edit', c.dataset.id); };
    c.addEventListener('pointerdown', () => { t = setTimeout(() => { c.dataset.held = 1; pageMenu(all.find(x => x.id === c.dataset.id)); }, 480); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => c.addEventListener(ev, () => clearTimeout(t)));
    c.addEventListener('contextmenu', ev => { ev.preventDefault(); c.dataset.held = 1; pageMenu(all.find(x => x.id === c.dataset.id)); }); });
  const es = $app.querySelector('[data-es=new]'); if (es) es.onclick = () => $app.querySelector('#hNew').click();
  /* новая страница живёт только на экране, пока её не собрали: пустые в список не попадают */
  $app.querySelector('#hNew').onclick = () => { A.page = G.newPage('Без названия', A.tab, ''); A.view = 'edit'; A.mode = 'note'; A.sel = null;
    location.hash = '#/p/' + A.page.id; document.body.classList.add('shell'); render(); appear(); };
  $app.querySelector('#hMenu').onclick = settings;
  requestAnimationFrame(() => $app.querySelectorAll('.tl-pv').forEach(x => x.style.setProperty('--k', x.clientWidth / 560)));
};
/* долгое нажатие на обложку: переименовать, дублировать, удалить */
const pageMenu = p => {
  const s = sheet(`<div class="sh-h"><h2>${e(p.name)}</h2></div><div class="sh-b"><div class="list"><button class="row" id="rDup">Дублировать</button><button class="row danger" id="rDel">Удалить</button></div></div>`);
  s.$('#rDup').onclick = async () => { const n = {...G.clone(p), id: G.uid('p'), name: p.name + ' (копия)'}; await G.store.put(n); s.close(); home(); };
  s.$('#rDel').onclick = () => sure(s.$('#rDel'), 'Удалить навсегда', async () => { await G.store.del(p.id); s.close(); home(); });
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
      <a class="pill ghost wide" href="#/lib/templates">Шаблоны, сценарии и промты</a>
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
  if (cat) { const h = cat; cat = null; h.close(true); } document.body.classList.remove('picking');
  const sc0 = document.getElementById('eMain'), y0 = sc0 ? sc0.scrollTop : 0, p = A.page, b = A.sel && p.blocks.find(x => x.id === A.sel), v = b && verdict(b);
  const miss = p.blocks.length ? report(p).count : 0;
  const title = `<b>${e(p.name)}</b><small>${e(sc().name)}${p.blocks.length ? ' · ' + (G.len(p.blocks.map(x => x.text).join('')) / 1000).toFixed(1).replace('.0', '') + 'k знаков' : ''}</small>`;
  $app.innerHTML = `<header class="hd" id="eHd"><div class="hd-edit"><div class="hfield" id="eField"></div><button class="ib round ok" id="eOk" aria-label="Готово">${I.check}</button></div>
    <button class="ib round" id="eBack" aria-label="Назад">${I.back}</button><button class="ttl" id="eTtl">${title}</button>
      ${p.blocks.length ? `<button class="ib round" id="ePrev" aria-label="Превью">${I.eye}</button>
      <button class="ib round dark" id="eOut" aria-label="Выгрузка">${I.out}${miss ? `<span class="badge">${miss}</span>` : ''}</button>` : `<button class="ib round" id="eTune" aria-label="Настройки страницы">${I.tune}</button>`}</header>
    <main id="eMain"></main><div class="dock" id="eDock"><div id="eDockMain"><div class="bar"><div id="eAct"></div><i class="bar-div" aria-hidden="true"></i><div id="eSw"></div></div></div></div>`;
  $app.querySelector('#eBack').onclick = () => { if (A.sel) { unselect(); return; } save(); go('home'); };
  $app.querySelector('#eTtl').onclick = () => { if (!A.sel) pageSettings(); };
  $app.querySelector('#eOk').onclick = () => { const a = document.activeElement; if (a && a.blur) a.blur(); getSelection().removeAllRanges(); fmtSync(); };
  const tn = $app.querySelector('#eTune'); if (tn) tn.onclick = pageSettings;
  const pv = $app.querySelector('#ePrev'); if (pv) pv.onclick = preview;
  const out = $app.querySelector('#eOut'); if (out) out.onclick = exportView;
  if (!p.blocks.length) return draft();
  A.mode === 'note' ? notes() : canvas();
  island();
  if (A.sel) { select(A.sel); if (A.openCat && A.mode === 'page') catalog(); } A.openCat = false;
  /* перерисовка не сбрасывает положение; прокрутка к блоку — только когда к нему переходят */
  const M = document.getElementById('eMain');
  if (A.jump) { const el = $app.querySelector(`[data-id="${A.jump}"]`); if (el && M) M.scrollTop += el.getBoundingClientRect().top - M.getBoundingClientRect().top - (A.jumpTop ? 8 : M.clientHeight / 3); A.jump = null; A.jumpTop = false; } else if (M) M.scrollTop = y0;
};
/* нижний островок: только Текст ↔ Шаблоны; на экране остаётся тот же блок */
/* нижняя панель как в Фигме: слева — действия выделенного блока, справа — всегда переключатель «Текст | Шаблоны».
   Выделение при переключении сохраняется. */
const island = () => {
  const p = A.page, dock = $app.querySelector('#eDockMain'); if (!dock) return;
  if (!dock.querySelector('#eSw')) dock.innerHTML = '<div class="bar"><div id="eAct"></div><i class="bar-div" aria-hidden="true"></i><div id="eSw"></div></div>';
  const sw = dock.querySelector('#eSw');
  sw.innerHTML = `<div class="sw"><div class="seg slide ${A.mode === 'page' ? 'r' : ''}" role="tablist"><button data-m="note" aria-label="Текст" title="Текст: смысл и структура">${I.note}</button><button data-m="page" aria-label="Шаблоны" title="Шаблоны: дизайн">${I.page}</button></div></div>`;
  sw.querySelectorAll('[data-m]').forEach(x => x.onclick = ev => { ev.stopPropagation(); if (A.mode === x.dataset.m) return;
    sw.querySelector('.seg').classList.toggle('r', x.dataset.m === 'page');
    const keep = A.sel, top = [...$app.querySelectorAll('#eMain [data-id]')].find(el => el.getBoundingClientRect().bottom > 120);
    A.mode = x.dataset.m; if (A.mode === 'page') G.autoPick(p); save();
    if (keep) { A.sel = keep; A.jump = keep; } else { A.jump = top && top.dataset.id; A.jumpTop = true; }
    editor(); appear(); });
  if (!A.sel) dock.querySelector('#eAct').innerHTML = '';
  document.body.classList.toggle('has-sel', !!A.sel);
};
/* к тексту блока: режим Текст, курсор в конце этого блока */
const toText = b => { unselect(); A.mode = 'note'; A.jump = b.id; save(); editor();
  const ed = $app.querySelector(`.ed[data-id="${b.id}"]`); if (ed) { const last = ed.lastElementChild; caretTo(last, last ? last.textContent.length : 0); } };
/* новый блок — чипсами ролей в конце страницы */
const addChips = () => { const s0 = sc(), roles = (s0.roles || []).filter(r => r.id !== 'hero' || !A.page.blocks.some(b => b.role === 'hero'));
  return `<div class="add"><p class="lbl">Добавить блок</p><div class="chips">${roles.map(r => `<button class="chip" data-add="${e(r.id)}">${I.plus}${e(r.name.split(':')[0])}</button>`).join('')}</div></div>`; };
const bindAdd = main => main.querySelectorAll('[data-add]').forEach(c => c.onclick = () => {
  const nb = G.newBlock(c.dataset.add, ''); A.page.blocks.push(nb); save();
  if (A.mode === 'note') { notes(); const ed = $app.querySelector(`.ed[data-id="${nb.id}"]`); if (ed) { ed.scrollIntoView({block: 'center'}); caretTo(ed.firstChild, 0); } }
  else toText(nb); });
/* превью: страница в прототипе Нави, три ширины экрана */
const GOAL = {event: 'event', article: 'info', course: 'course', sale: 'sale', product: 'sale'};
const naviPayload = p => { const s0 = G.scenario(p.scenario), goal = GOAL[s0.id] || (s0.kind === 'article' ? 'info' : 'event');
  const hero = p.blocks.find(b => b.role === 'hero'), hs = hero ? G.src(hero) : {};
  const blocks = p.blocks.map(b => { const t = G.tpl(b.tpl), s = G.src(b); return {kind: b.role === 'hero' ? 'hero' : G.isCta(b) ? 'cta' : 'grid', navi: false, title: s.level === 'h3' || s.level === 'h1' ? '' : s.title || '', html: `<section class="blk">${blockHTML(b, p)}</section>`}; });
  const cta = p.blocks.find(b => G.isCta(b)), cs = cta ? G.src(cta) : {};
  return {type: 'gridi:page', cat: {id: 'g-' + p.id, name: hs.title || p.name, goal, lead: hs.lead || '', meta: (hs.meta || [])[0] || ''},
    fill: {overlay: true, name: hs.title || p.name, goal, blocks, program: [], programTitle: '',
      hero: {title: hs.title || '', lead: hs.lead || '', badge: (hs.meta || [])[0] || '', btn: (hs.cta || [])[0] || ''},
      cta: {title: cs.title || '', text: cs.lead || '', btn: (cs.cta || [])[0] || ''}},
    css: G.WIRE_CSS + '.wf-miss,.wf-item-miss{display:none!important}'}; };
const DEV = [['mob', 375, 'Телефон', '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2"/></svg>'], ['desk', 1440, 'Компьютер', '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M9 20h6"/></svg>']];
const preview = () => {
  const p = A.page; G.autoPick(p);
  let dev = G.ls.get('dev', innerWidth >= 900 ? 'desk' : 'mob'); if (!DEV.some(x => x[0] === dev)) dev = 'mob';
  const el = document.createElement('div'); el.className = 'pv pvn';
  el.innerHTML = `<header class="hd"><button class="ib round" id="pvX" aria-label="Закрыть">${I.x}</button><div class="ttl"><b>Превью</b><small>${e(p.name)}</small></div>
    <div class="seg" role="tablist">${DEV.map(([k, , n, ic]) => `<button data-d="${k}" aria-label="${n}" title="${n}">${ic}</button>`).join('')}</div></header>
    <div class="pvn-stage"><div class="pvn-dev"><iframe title="Прототип Нави" src="navi.html?embed"></iframe></div></div>`;
  document.body.appendChild(el); document.body.classList.add('noscroll'); el.animate([{opacity: 0}, {opacity: 1}], {duration: 140});
  const fr = el.querySelector('iframe'), box = el.querySelector('.pvn-dev'), stage = el.querySelector('.pvn-stage');
  /* iframe — ровно нужной ширины (сайт Нави переключает вёрстку по ширине окна), уменьшаем рамку целиком.
     На телефоне «компьютер» — 1024 и высота с ограничением: огромная картинка 1440 роняла вкладку */
  const CHROME = 'html.embed .stage{padding:0!important;background:none!important;background-image:none!important;overflow:hidden!important}html.embed .device-wrap{width:100%!important;height:100%!important;transform:none!important;margin:0!important;box-shadow:none!important;border:0!important;border-radius:0!important}html.embed .device{border-radius:0!important;box-shadow:none!important}html.embed .resize-h,html.embed .shell__bar,html.embed .pop,html.embed .pop-bg{display:none!important}html.embed .hstage,html.embed #naviRoot,html.embed .nvr,html.embed .shell,html.embed .shell__body,html.embed body{background:none!important;background-image:none!important;padding:0!important}';
  const widthOf = () => { const w = DEV.find(x => x[0] === dev)[1]; return innerWidth < 600 && w > 1024 ? 1024 : w; };
  const strip = () => { try { const d = fr.contentDocument; if (d && d.head && !d.getElementById('gridi-chrome')) { const st = d.createElement('style'); st.id = 'gridi-chrome'; st.textContent = CHROME; d.head.appendChild(st); }
    if (fr.contentWindow.NV && !strip.done) { strip.done = true; fr.contentWindow.NV.size('fit'); } } catch (err) {} };
  const fit = () => { const w = widthOf(), k = Math.min(1, (stage.clientWidth - 16) / w), h = Math.min((stage.clientHeight - 16) / k, innerWidth < 600 ? 2000 : 4000);
    box.style.width = w + 'px'; box.style.height = h + 'px'; box.style.transform = k < 1 ? `scale(${k})` : '';
    el.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('on', x.dataset.d === dev)); };
  const send = () => { strip(); try { fr.contentWindow.postMessage(naviPayload(p), '*'); } catch (err) {} setTimeout(strip, 400); };
  const onMsg = ev => { if (ev.source === fr.contentWindow && ev.data && ev.data.type === 'navi:ready') send(); };
  addEventListener('message', onMsg); fr.addEventListener('load', () => setTimeout(send, 200));
  let rt = null; const onRes = () => { clearTimeout(rt); rt = setTimeout(fit, 150); };
  addEventListener('resize', onRes); fit();
  el.querySelectorAll('[data-d]').forEach(x => x.onclick = () => { dev = x.dataset.d; G.ls.set('dev', dev); fit(); setTimeout(() => { try { fr.contentWindow.NV && fr.contentWindow.NV.size('fit'); } catch (err) {} }, 60); });
  el.querySelector('#pvX').onclick = () => { removeEventListener('message', onMsg); removeEventListener('resize', onRes); el.remove(); document.body.classList.remove('noscroll'); };
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
  main.innerHTML = `<p class="draft-hint">Разметка не обязательна — Гриди разложит текст сам. Можно вставить и текст страницы от коллеги. Или <button class="link" id="dBlank">начните с чистого листа</button> — блоки сценария без текста.</p>
    <textarea class="draft" id="dTxt" placeholder="Вставьте или напишите текст.">${e(p.text || '')}</textarea>`;
  const ta = main.querySelector('#dTxt'); setTimeout(() => ta.focus(), 50);
  /* с чистого листа: блоки по сценарию без текста — текст можно написать или «Придумать» */
  main.querySelector('#dBlank').onclick = async () => { const s0 = sc(), roles = (s0.roles || []).filter(r => r.req || r.id === 'hero').map(r => r.id);
    if (!roles.includes('hero')) roles.unshift('hero'); if (roles.length < 2) roles.push(defRole());
    p.blocks = roles.map(r => G.newBlock(r, '')); p.text = ''; A.mode = 'note'; await G.store.put(p); editor();
    toast('Блоки сценария готовы — пишите текст или «Придумать текст» в меню ИИ'); };
  ta.oninput = () => { p.text = ta.value; save(); };
  ta.addEventListener('paste', ev => { const html = ev.clipboardData && ev.clipboardData.getData('text/html');
    if (!html || !/<(h[1-6]|li|table|img|a\s)/i.test(html)) return; const md = G.htmlToMarkup(html); if (!md.trim()) return;
    ev.preventDefault(); const a = ta.selectionStart, z = ta.selectionEnd; ta.value = ta.value.slice(0, a) + md + ta.value.slice(z); ta.selectionStart = ta.selectionEnd = a + md.length;
    p.text = ta.value; save(); ta.dispatchEvent(new Event('input')); toast('Заголовки, списки и ссылки размечены автоматически'); });
  /* одна кнопка: разбор целиком — разметка, модель, шаблоны — одним этапом */
  const dock = $app.querySelector('#eDock');
  dock.innerHTML = `<button class="pill grad wide" id="dGo">Разобрать</button>`;
  dock.querySelector('#dGo').onclick = () => build(ta.value);
};
/* 2а'. Разбор — экран загрузки. Модель не подключена — промт и ответ здесь же, вторым шагом.
   Страница сохраняется только после разбора; отмена — назад к тексту, текст на месте. */
const build = async text => {
  const p = A.page; text = String(text || '').trim(); if (!text) return toast('Сначала вставьте текст.');
  p.text = text;
  if (isShare(text)) { fromShare(p, text); return done(p); }
  const main = $app.querySelector('#eMain'), dock = $app.querySelector('#eDock'); dock.innerHTML = '';
  main.innerHTML = `<div class="ld"><h2>Разбираем текст</h2><ol class="ld-st">
      <li data-s="1" class="on">Собираем по разметке</li><li data-s="2">Модель проверяет блоки и роли <small id="ldT"></small></li><li data-s="3">Подбираем шаблоны</li></ol>
    <div id="ldX"></div><button class="pill ghost" id="ldCancel">Отменить</button></div>`;
  const st = (n, cls) => { const li = main.querySelector(`[data-s="${n}"]`); if (li) li.className = cls; };
  let ctl = new AbortController(), manualRej = null, cancelled = false;
  main.querySelector('#ldCancel').onclick = () => { cancelled = true; ctl.abort(); if (manualRej) manualRej(new Error('cancel')); };
  st(1, 'done'); st(2, 'on');
  const ui = G.ui, keep = {busy: ui.busy, manualAsk: ui.manualAsk};
  ui.busy = () => { const t0 = Date.now(), tm = setInterval(() => { const el = main.querySelector('#ldT'); if (el) el.textContent = Math.round((Date.now() - t0) / 1000) + ' с'; }, 1000);
    const h = {signal: ctl.signal, timedOut: false, done: () => clearInterval(tm)}; setTimeout(() => { if (!h.signal.aborted) { h.timedOut = true; ctl.abort(); } }, 240000); return h; };
  ui.manualAsk = (label, prompt) => new Promise((res, rej) => { manualRej = rej; const x = main.querySelector('#ldX');
    x.innerHTML = `<div class="ld-man"><p>Модель не подключена: скопируйте промт, отправьте в свою модель и вставьте ответ.</p>
      <button class="pill pri" id="mCopy">Скопировать промт</button> <span class="hint">${prompt.length.toLocaleString('ru-RU')} зн.</span>
      <textarea class="ta" id="mAns" rows="5" placeholder="Ответ модели целиком"></textarea><p class="hint err" id="mErr"></p>
      <button class="pill pri wide" id="mOk">Продолжить</button></div>`;
    x.querySelector('#mCopy').onclick = async () => { await G.copy(prompt); toast('Промт скопирован'); };
    x.querySelector('#mOk').onclick = () => { const v = x.querySelector('#mAns').value; if (!G.parseJSON(v)) { x.querySelector('#mErr').textContent = 'В ответе нет JSON. Попросите модель: «верни только JSON».'; return; } x.innerHTML = ''; res(v); }; });
  let j = null, note = '';
  try { j = await G.ask('Разбор: ' + sc().name, G.parsePrompt(p)); }
  catch (err) { if (cancelled || err.message === 'cancel') { Object.assign(ui, keep); p.blocks = []; return draft(); } note = 'Модель не ответила — страница собрана по разметке.'; }
  finally { Object.assign(ui, keep); }
  if (cancelled) { p.blocks = []; return draft(); }
  st(2, 'done'); st(3, 'on');
  const r = G.applyParse(p, j);
  if (j && !r.byModel) note = 'Модель разобрала плохо — страница собрана по разметке. Можно разобрать заново другой моделью.';
  else if (r.lost) note = `Модель не разложила ${G.num(r.lost, 'строку', 'строки', 'строк')} — они в конце, в блоке «Не разобрано».`;
  done(p, note);
};
const done = async (p, note) => {
  if (p.name === 'Без названия') { const h = p.blocks.find(b => b.role === 'hero'); const t = h && G.src(h).title; if (t) p.name = t.slice(0, 80); }
  A.mode = 'page'; await G.store.put(p); editor();
  const R = report(p).rows, fixN = R.stop.length + R.fit.length; toast(note || `Готово: ${G.num(p.blocks.length, 'блок', 'блока', 'блоков')}${fixN ? ' · ' + G.num(fixN, 'блок', 'блока', 'блоков') + ' поправить' : ''}${R.hint.length ? ' · ' + G.num(R.hint.length, 'подсказка', 'подсказки', 'подсказок') : ''}`);
};

/* 2б. Заметки: блоки — линии с ролью, строки — разметка */
const notes = () => {
  const p = A.page, main = $app.querySelector('#eMain'), iss = report(p).byBlock;
  if (!p.blocks.length) { main.innerHTML = `<div class="note">${empty('На странице нет блоков', 'Добавьте первый блок ниже или вставьте текст заново.')}${addChips()}</div>`; bindAdd(main); return; }
  main.innerHTML = `<div class="note">${p.blocks.map((b, i) => `<section class="nb" data-id="${e(b.id)}">
      <button class="nb-line ${iss[b.id] ? 'warn' : ''}" data-role="${e(b.id)}"><b class="bn">${i + 1}</b><span>${e(roleName(b))}</span>${mediaHint(b)}${blockNote(b, p, true) ? `<em class="nb-note">${e(blockNote(b, p, true))}</em>` : ''}</button>
      <div class="ed" contenteditable="true" spellcheck="true" data-id="${e(b.id)}">${(lines(b.text).length ? lines(b.text) : [{k: 'p', t: ''}]).map(l => lineHTML(l.k, l.t)).join('')}</div></section>`).join('')}
    ${addChips()}</div>`;
  main.querySelectorAll('.ed').forEach(bindEd); bindAdd(main);
  main.querySelectorAll('[data-role]').forEach(x => x.onclick = ev => { ev.stopPropagation(); if (A.sel === x.dataset.role) { unselect(); return; } const a = document.activeElement; if (a && a.blur) a.blur(); select(x.dataset.role); });
  main.addEventListener('focusin', ev => { if (A.sel && ev.target.closest('.ed')) unselect(); });
  main.onclick = ev => { if (A.sel && !ev.target.closest('.nb-line,.add,.sel-float')) unselect(); };
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
  [...ed.children].forEach(d => d.toggleAttribute('data-nolink', !!noLink(d.dataset.k, d.textContent.trim())));
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
    ev.preventDefault(); const cd = ev.clipboardData || window.clipboardData, html = cd.getData('text/html'); const txt = (html && /<(h[1-6]|li|table|a\s)/i.test(html) && G.htmlToMarkup(html)) || cd.getData('text/plain') || '';
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
  fmtEl.innerHTML = `<div class="fmt-in"><div class="fmt-row">${KINDS.map(x => `<button data-k="${x.k}" aria-label="${e(x.label || x.g)}"><i>${e(x.g || 'Аа')}</i>${x.label && x.k !== 'p' ? `<span>${e(x.label)}</span>` : ''}</button>`).join('')}<button data-split><i>${I.cut}</i><span>Разделить</span></button></div><button class="ib round ok" data-done aria-label="Готово">${I.check}</button></div>`;
  const host = into || document.querySelector('#eMain .note'); (host || document.body).appendChild(fmtEl); fmtEl.classList.add('float-fmt');
  fmtEl.addEventListener('pointerdown', ev => ev.preventDefault());
  fmtEl.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { const ln = A.line; if (!ln || !ln.isConnected) return; setKind(ln, ln.dataset.k === x.dataset.k && x.dataset.k !== 'p' ? 'p' : x.dataset.k); sync(ln.closest('.ed')); fmtSync(); });
  fmtEl.querySelector('[data-split]').onclick = splitBlock;
  fmtEl.querySelector('[data-done]').onclick = () => { const a = document.activeElement; if (a && a.blur) a.blur(); getSelection().removeAllRanges(); fmtSync(); };
  if (!fmtBar.bound) { fmtBar.bound = true; document.addEventListener('focusout', () => setTimeout(fmtSync, 50)); }
};
const touch = matchMedia('(pointer: coarse)').matches;
/* клавиатура на телефоне: оболочка редактора занимает ровно видимую область, окно держим в нуле —
   iOS не на что сдвигать страницу, шапка остаётся на месте, прокручивается только текст */
const fitShell = () => { const vv = window.visualViewport; if (!vv) return;
  const r = document.documentElement.style; r.setProperty('--vh', vv.height + 'px'); r.setProperty('--vt', Math.max(0, vv.offsetTop) + 'px');
  if (document.body.classList.contains('shell') && window.scrollY) window.scrollTo(0, 0); };
/* пока клавиатура выезжает, iOS пытается сдвинуть страницу — возвращаем её на место и сами прокручиваем текст к каретке */
const caretIntoView = () => { const M = document.getElementById('eMain'), s0 = getSelection(); if (!M || !s0.rangeCount) return;
  let r = s0.getRangeAt(0).getBoundingClientRect(); if (!r.height) { const ln = curLine(); if (!ln) return; r = ln.getBoundingClientRect(); }
  const box = M.getBoundingClientRect(), bottom = box.top + M.clientHeight - 24;
  if (r.bottom > bottom) M.scrollTop += r.bottom - bottom + 40; else if (r.top < box.top + 8) M.scrollTop -= box.top + 8 - r.top + 40; };
document.addEventListener('focusin', ev => { if (!document.body.classList.contains('shell') || !ev.target.closest || !ev.target.closest('.ed')) return;
  const t0 = performance.now(); const tick = () => { fitShell(); if (performance.now() - t0 < 900) requestAnimationFrame(tick); else caretIntoView(); }; requestAnimationFrame(tick); });
const pin = fitShell;
if (window.visualViewport) { visualViewport.addEventListener('resize', () => { fitShell(); caretIntoView(); }); visualViewport.addEventListener('scroll', fitShell); fitShell(); }
const keyboardOpen = () => { if (!touch) return true; const vv = window.visualViewport; return !!vv && innerHeight - vv.height > 120; };
const fmtSync = () => {
  if (!fmtEl || !fmtEl.isConnected) return;
  const ln = curLine(), ed = document.activeElement && document.activeElement.closest && document.activeElement.closest('.ed');
  /* панель — только пока редактируешь: курсор в тексте и, на телефоне, открыта клавиатура */
  const on = !!(ln && ed && ed.contains(ln) && A.view === 'edit');
  if (on) A.line = ln;
  fmtEl.hidden = !on; document.body.classList.toggle('typing', on);
  const dock = document.getElementById('eDock'); if (dock) dock.classList.toggle('typing', on); pin();
  const cur = (A.line && A.line.isConnected) ? A.line.dataset.k : '';
  fmtEl.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x.dataset.k === cur));
  const sp = fmtEl.querySelector('[data-split]'); sp.hidden = !!document.querySelector('.sh-wrap');
  placeFmt();
};
/* панель ролей — над строкой с курсором (под ней, если строка у самого верха); она часть текста и едет вместе с ним */
const placeFmt = () => { if (!fmtEl || fmtEl.hidden || !A.line || !A.line.isConnected) return;
  const host = fmtEl.parentElement, M = document.getElementById('eMain'); if (!host || !M) return;
  const hr = host.getBoundingClientRect(), lr = A.line.getBoundingClientRect(), top = M.getBoundingClientRect().top + (parseFloat(getComputedStyle(M).paddingTop) || 0), h = fmtEl.offsetHeight || 52;
  fmtEl.style.top = Math.round(lr.top - top < h + 12 ? lr.bottom - hr.top + 8 : lr.top - hr.top - h - 8) + 'px'; };
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

/* «Ещё»: добавить сверху, снизу, удалить — везде; объединить — в тексте, подобрать заново — в шаблонах */
const blockMenu = id => {
  const p = A.page, b = p.blocks.find(x => x.id === id), i = p.blocks.indexOf(b), T = A.mode === 'note';
  const s = sheet(`<div class="sh-h"><h2>${i + 1}. ${e(roleName(b))}</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="list"><button class="row ic" id="bmNewU">${I.addUp}<b>Добавить блок сверху</b></button><button class="row ic" id="bmNewD">${I.addDown}<b>Добавить блок снизу</b></button>
      ${T ? (i ? `<button class="row ic" id="bmMerge">${I.merge}<b>Объединить с блоком выше</b></button>` : '') : `<button class="row ic" id="bmAuto">${I.grid}<span><b>Подобрать шаблон заново</b><small>Гриди выберет лучший под текст блока</small></span></button>`}
      <button class="row ic danger" id="bmDel">${I.trash}<b>Удалить блок</b></button></div></div>`);
  const ins = d => { const nb = G.newBlock(b.role === 'hero' ? defRole() : b.role, ''); p.blocks.splice(i + d, 0, nb); save(); s.close(true);
    if (T) { unselect(); render(); const ed = $app.querySelector(`.ed[data-id="${nb.id}"]`); if (ed) { ed.scrollIntoView({block: 'center'}); caretTo(ed.firstChild, 0); } }
    else { A.sel = nb.id; A.jump = nb.id; render(); } };
  s.$('#bmNewU').onclick = () => ins(0); s.$('#bmNewD').onclick = () => ins(1);
  s.$('#bmDel').onclick = () => sure(s.$('#bmDel'), 'Удалить вместе с текстом', () => { p.blocks.splice(i, 1); save(); s.close(); A.sel = null; render(); });
  const mg = s.$('#bmMerge'); if (mg) mg.onclick = () => { const pr0 = p.blocks[i - 1]; pr0.text = [pr0.text, b.text].filter(Boolean).join('\n'); pr0.tips = [...(pr0.tips || []), ...(b.tips || [])]; pr0.tplLock = false; pr0.values = null; p.blocks.splice(i, 1); repick(pr0); save(); s.close(true); A.sel = pr0.id; render(); toast('Блоки объединены'); };
  const au = s.$('#bmAuto'); if (au) au.onclick = () => { b.tplLock = false; b.tpl = null; b.values = null; repick(b); save(); s.close(); redrawBlock(b); toast('Шаблон подобран заново'); };
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
  if (!b.text.trim()) return `<div class="wf-page">${empty('Пустой блок', 'Добавьте текст — шаблон подберётся сам.')}</div>`;
  if (!t) return `<div class="wf-page">${empty('Шаблон не подобран', 'Под такой текст шаблона нет. Измените текст или выберите шаблон вручную.')}</div>`;
  const plan = rowsPlan(b, t);
  if (!plan) return `<div class="wf-page">${G.wireBlock(t, t && (t.id === b.tpl ? G.values(b, p) : G.autoFill(b, t, p)), G.wireImgs(b, t))}</div>`;
  const all = G.autoFill(b, {...t, items: {...t.items, n: G.src(b).items.length}}, p), imgs = G.wireImgs(b, t); let at = 0;
  return plan.map((k, i) => { const tt = sibling(t, k), v = {...all, top: i ? {} : all.top, head: i ? undefined : all.head, items: all.items.slice(at, at + k)};
    const im = {}; for (let j = 0; j < k; j++) if (imgs['i' + (at + j)]) im['i' + j] = imgs['i' + (at + j)]; if (!i && imgs.main) im.main = imgs.main; at += k;
    return `<div class="wf-page${i ? ' wf-row-next' : ''}">${G.wireBlock(tt, v, im)}</div>`; }).join('');
};

/* 2в. Страница: тот же текст в шаблонах */
const canvas = () => {
  const p = A.page, main = $app.querySelector('#eMain'), iss = report(p).byBlock;
  main.innerHTML = `<div class="cv">${p.blocks.map((b, i) => `<div class="cb ${A.sel === b.id ? 'sel' : ''} ${iss[b.id] ? 'warn' : ''}" data-id="${e(b.id)}">${bn(b, i)}${blockHTML(b, p)}</div>`).join('')}${addChips()}</div>`;
  main.querySelectorAll('.cb').forEach(x => x.onclick = ev => { ev.stopPropagation(); if (A.sel) { unselect(); return; } select(x.dataset.id); });
  /* клик мимо блока снимает выбор */
  main.onclick = ev => { if (A.sel && !ev.target.closest('.cb,.add,.sel-float')) unselect(); };
  bindAdd(main);
};
let cat = null;
const BK = () => A.mode === 'note' ? '.nb' : '.cb';
const select = id => { A.sel = id; document.body.classList.add('picking');
  $app.querySelectorAll(BK()).forEach(x => x.classList.toggle('sel', x.dataset.id === id));
  selBar();
  requestAnimationFrame(() => { const el = $app.querySelector(`${BK()}[data-id="${id}"]`), M = document.getElementById('eMain'); if (!el || !M) return;
    const r = el.getBoundingClientRect(), v = visArea(M);
    if (r.top < v.top || r.top > v.bottom - 160) { M.scrollBy({top: r.top - v.top - 12, behavior: 'smooth'}); } }); };
/* видимая часть полотна: под шапкой и над нижней панелью */
const visArea = M => { const b = M.getBoundingClientRect(), hd = document.getElementById('eHd'), dk = document.getElementById('eDockMain');
  const top = Math.max(b.top, hd ? hd.getBoundingClientRect().bottom : b.top) + 4, dt = dk && dk.offsetHeight ? dk.getBoundingClientRect().top : b.bottom;
  return {top, bottom: Math.min(b.bottom, dt) - 8}; };
/* панель блока — у самого блока: под ним, если помещается, иначе над ним; длинный блок — панель у края экрана внутри блока */
let selEl = null;
const placeSel = () => { if (!selEl || !selEl.isConnected || !A.sel) return; const M = document.getElementById('eMain'), el = $app.querySelector(`${BK()}[data-id="${A.sel}"]`); if (!M || !el) return;
  const host = selEl.parentElement.getBoundingClientRect(), r = el.getBoundingClientRect(), v = visArea(M), h = selEl.offsetHeight, g = 10;
  let y = r.bottom + g + h <= v.bottom ? r.bottom + g : r.top - g - h >= v.top ? r.top - g - h : Math.min(Math.max(v.bottom - h, r.top + g), r.bottom - h - g);
  y = Math.max(v.top, Math.min(y, v.bottom - h));
  selEl.style.top = Math.round(y - host.top) + 'px'; };
const unselect = () => { A.sel = null; if (selEl) { selEl.remove(); selEl = null; } document.body.classList.remove('picking'); const ea = $app.querySelector('#eAct'); if (ea) ea.innerHTML = ''; $app.querySelectorAll('.cb.sel,.nb.sel').forEach(x => x.classList.remove('sel')); if (cat) { const h = cat; cat = null; h.close(true); } if (A.view === 'edit' && A.page && A.page.blocks.length) island(); };
const redrawBlock = b => { if (A.mode === 'note') { const id = A.sel; notes(); if (id) select(id); const bd = $app.querySelector('#eOut .badge'), r = report(A.page); if (bd) { bd.textContent = r.count; bd.hidden = !r.count; } return; } const el = $app.querySelector(`.cb[data-id="${b.id}"]`); if (!el) return; const r = report(A.page);
  el.innerHTML = bn(b, A.page.blocks.indexOf(b)) + blockHTML(b, A.page); el.classList.toggle('warn', !!r.byBlock[b.id]);
  const bd = $app.querySelector('#eOut .badge'); if (bd) { bd.textContent = r.count; bd.hidden = !r.count; }
  if (A.sel === b.id) selBar(); };

/* панель выбранного блока: промты одной строкой + быстрые действия */
const tplLabel = t => { const c = t.ctor; if (!c) return {name: t.name, sub: '', type: t.component ? 'Компоненты' : t.name.split('-')[0]}; const q = c.p || {}, o = [];
  if (q.n) o.push(q.n + (c.type === 'Карточки' ? ' в ряд' : ''));
  if (q.pos) o.push({Lt: 'слева', Rt: 'справа', Ct: 'по центру', Bg: 'на фоне'}[q.pos] || q.pos);
  if (q.media && q.media !== 'нет') o.push({I: 'иконки', A: 'фото', L: 'большая картинка', M: 'картинка', S: 'малая картинка'}[q.media] || q.media);
  if (+q.btn) o.push(q.btn === '1' ? 'кнопка' : q.btn + ' кнопки'); if (q.ibtn === 'да') o.push('кнопки у карточек');
  return {name: c.type, sub: o.join(' · '), type: c.type}; };
const why = r => [...(r.bad || []), ...(r.why || []).filter(x => !/^(всё на месте|компонент|рекомендован|текстовый|ряды)/.test(x))].slice(0, 3).join(' · ');
const runPrompt = async (b, id) => { const p = A.page, P = G.prompt(id); let vals = {};
  if (P.ask && P.ask.length) { vals = await askVals(P); if (!vals) return; }
  if (P.id === 'write' && !b.tpl) repick(b);
  /* компонент (форма, таблица) хранит текст как есть: придумать — значит написать текст блока целиком */
  const free = !G.adaptable(b, P, p) || (P.id === 'write' && !!(G.tpl(b.tpl) || {}).component);
  if (free && (P.id === 'fit' || (!b.text.trim() && P.id !== 'write'))) return toast('Этот блок не укладывается в поля: у его шаблона текст как есть.');
  /* текст статьи и другие блоки «как есть»: промт получает блок как «заголовок + текст» и возвращает текст целиком */
  const VT = {id: '__free', name: 'Текст блока', status: {prod: true}, layout: 'stack',
    fields: [{k: 't', label: P.id === 'write' ? 'Текст блока в разметке: [h2] заголовок, абзацы, «- » пункты, «[кнопка] Текст» — кнопка' : 'Текст: абзацы, пункты списка с «- »', max: Math.max(2000, Math.round(G.len(b.text) * 1.6)), role: 'text'}]};
  const keep = {tpl: b.tpl, lock: b.tplLock}, adp = G.adaptable;
  try {
    if (free) { G.tpl('__x'); G._tplIndex.__free = VT; b.tpl = '__free'; G.adaptable = () => true; }
    const n = await G.runAdapt(p, P.id, [b.id], vals);
    if (free) { G.adaptable = adp; delete G._tplIndex.__free; b.tpl = keep.tpl; b.tplLock = keep.lock; }
    if (n) { repick(b); save(); A.mode === 'note' ? (notes(), select(b.id)) : redrawBlock(b); toast(`«${P.name}»: текст блока обновлён — и в заметке тоже`); }
  } catch (err) { if (err.message !== 'cancel') toast(err.message); }
  finally { G.adaptable = adp; if (G._tplIndex) delete G._tplIndex.__free; if (b.tpl === '__free') { b.tpl = keep.tpl; b.tplLock = keep.lock; } } };
/* панель выделенного блока. Текст — смысл и структура, Шаблоны — дизайн; каждое действие в одном месте, «Ещё» — что не влезло */

/* панель выделенного блока — иконки в общей плашке с переключателем.
   Везде: ИИ, выше, ниже, «Ещё» (добавить сверху, снизу, удалить). Текст — роль; Шаблоны — каталог и картинки, если они есть в шаблоне. */
const selBar = () => {
  const p = A.page, b = p.blocks.find(x => x.id === A.sel), dock = $app.querySelector('#eAct'); if (!b || !dock) return;
  document.body.classList.add('has-sel');
  const i = p.blocks.indexOf(b), slots = G.imageSlots(b, p), icons = iconSlots(b), T = A.mode === 'note', hot = G.fixNotes(b, p).length;
  const acts = [['ai', I.ai, 'Улучшить с ИИ', false, hot ? 'hot' : ''],
    ...(T ? [['role', I.tag, 'Роль']] : [['cat', I.grid, 'Шаблон'], ...(slots.length ? [['img', I.img, 'Картинки']] : icons.length ? [['img', I.icons, 'Иконки']] : [])]),
    ['up', I.up, 'Выше', !i], ['down', I.down, 'Ниже', i >= p.blocks.length - 1], ['more', I.dots, 'Ещё']];
  dock.innerHTML = `<div class="bacts" role="toolbar" aria-label="Блок ${i + 1}">${acts.map(([k, ic, n, dis, cls]) => `<button data-a="${k}" aria-label="${n}" title="${n}" class="${cls || ''}" ${dis ? 'disabled' : ''}>${ic}</button>`).join('')}</div>`;
  dock.onclick = ev => { const a = ev.target.closest('[data-a]'); if (!a) return; ev.stopPropagation();
    const k = a.dataset.a;
    if (k === 'ai') aiSheet(b);
    if (k === 'img') imageSheet(b);
    if (k === 'role') roleSheet(b);
    if (k === 'cat') catalog();
    if (k === 'more') blockMenu(b.id);
    if (k === 'up' || k === 'down') { const M = document.getElementById('eMain'), el0 = $app.querySelector(`${BK()}[data-id="${b.id}"]`), y0 = el0 ? el0.getBoundingClientRect().top : 0;
      const j = i + (k === 'up' ? -1 : 1); p.blocks.splice(i, 1); p.blocks.splice(j, 0, b); save(); A.mode === 'note' ? notes() : canvas();
      const el1 = $app.querySelector(`${BK()}[data-id="${b.id}"]`); if (M && el1) M.scrollTop += el1.getBoundingClientRect().top - y0;
      A.sel = b.id; document.body.classList.add('picking'); $app.querySelectorAll(BK()).forEach(x => x.classList.toggle('sel', x.dataset.id === b.id)); selBar(); }
  };
};
/* ИИ: список улучшений блока — системные и свои промты; у каждого — что он сделает */
const aiSheet = b => {
  const p = A.page, fixN = G.fixNotes(b, p).length, emptyB = !b.text.trim();
  const list = [
    ...(fixN ? [['fix', `Поправить ошибки · ${fixN}`, 'Замечания проверки по этому блоку: лимиты, кнопки, пустые поля', 'hot']] : []),
    ...(!emptyB && G.adaptable(b, G.prompt('fit'), p) ? [['fit', 'Уложить в шаблон', 'Сократит и разложит текст по полям выбранного шаблона']] : []),
    ['write', 'Придумать текст', emptyB ? 'Заполнит блок по шаблону из смысла остальной страницы' : 'Напишет текст блока заново по шаблону и смыслу страницы'],
    ...G.lib.all('prompts').filter(x => x.stage === 'adapt' && !x.system).map(x => [x.id, x.name, x.description || '']),
  ];
  const s = sheet(`<div class="sh-h"><div><h2>Улучшить с ИИ</h2><p class="sub">${p.blocks.indexOf(b) + 1}. ${e(roleName(b))}</p></div><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="list">${list.map(([id, n, d, cls]) => `<button class="row ${cls || ''}" data-p="${e(id)}"><b>${e(n)}</b>${d ? `<small>${e(d)}</small>` : ''}</button>`).join('')}</div>
    <p class="hint">Свои промты — в библиотеке, раздел «Промты».</p></div>`);
  s.$$('[data-p]').forEach(x => x.onclick = () => { s.close(true); runPrompt(b, x.dataset.p); });
};
/* роль блока в режиме текста: что это за часть страницы — от неё зависят подходящие шаблоны */
const roleSheet = b => { const p = A.page, roles = (sc().roles || []);
  const s = sheet(`<div class="sh-h"><div><h2>Роль блока</h2><p class="sub">От роли зависят подходящие шаблоны</p></div><button class="ib round ok" data-close aria-label="Готово">${I.check}</button></div>
    <div class="list">${roles.map(r => `<button class="row ${r.id === b.role ? 'on' : ''}" data-r="${e(r.id)}">${e(r.name.split(':')[0])}${r.id === b.role ? ` ${I.check}` : ''}</button>`).join('')}</div>`);
  s.$$('[data-r]').forEach(x => x.onclick = () => { if (b.role !== x.dataset.r) { b.role = x.dataset.r; b.tpl = null; b.tplLock = false; b.values = null; save(); } s.close(); notes(); select(b.id); }); };
/* каталог шаблонов: категории по типу, сначала подходящие, у каждого — почему не подходит */
const catalog = () => {
  const p = A.page, b = p.blocks.find(x => x.id === A.sel); if (!b) return;
  const i = p.blocks.indexOf(b), ranked = G.rank(b, p);
  const types = []; ranked.forEach(r => { const t = tplLabel(r.t).type; if (!types.includes(t)) types.push(t); });
  let tab = 'fit';
  const card = r => { const l = tplLabel(r.t), w = why(r), bad = (r.tier || 0) >= 2;
    return `<button class="tc ${r.t.id === b.tpl ? 'on' : ''} ${bad ? 'dim' : ''}" data-t="${e(r.t.id)}"><div class="tc-pv">${blockHTML(b, p, r.t)}${r.t.id === b.tpl ? `<i class="tc-ok">${I.check}</i>` : ''}</div>
      <span class="tc-n">${e(l.name)}</span>${l.sub ? `<span class="tc-s">${e(l.sub)}</span>` : ''}
      <span class="tc-v ${bad ? 'bad' : ''}">${e(G.TIERS[r.tier || 0])}${!G.isLive(r.t) ? ' · нужен дизайн' : ''}</span>${w && (r.tier || 0) ? `<span class="tc-why">${e(w)}</span>` : ''}</button>`; };
  const list = () => tab === 'fit' ? ranked.filter(r => (r.tier || 0) <= 1) : ranked.filter(r => tplLabel(r.t).type === tab);
  const draw = () => { const L = list();
    cat.set(`<div class="sh-h"><div><h2>Шаблон · ${i + 1}. ${e(roleName(b))}</h2><p class="sub">${ranked.length} шаблонов</p></div><button class="ib round ok" data-close aria-label="Готово">${I.check}</button></div>
      <div class="cat-tabs">${[['fit', 'Подходящие', ranked.filter(r => (r.tier || 0) <= 1).length], ...types.map(t => [t, t, ranked.filter(r => tplLabel(r.t).type === t).length])].map(([k, n, c]) => `<button class="chip ${k === tab ? 'on' : ''}" data-tab="${e(k)}">${e(n)} <i>${c}</i></button>`).join('')}</div>
      <div class="sh-b">${L.length ? `<div class="tgrid">${L.map(card).join('')}</div>` : !ranked.length ? empty('Шаблонов для этой роли нет', 'Попробуйте другую роль блока или добавьте шаблон в библиотеке.', [['role', 'Сменить роль', true]]) : empty('Подходящих шаблонов нет', 'Поменяйте текст блока или попробуйте другую роль. В категориях выше — все шаблоны и что в них придётся поменять.', [['text', 'Изменить текст', true], ['role', 'Сменить роль']])}</div>`);
    requestAnimationFrame(() => cat && cat.$$('.tc-pv').forEach(x => x.style.setProperty('--k', x.clientWidth / 560))); };
  if (cat) cat.close(true);
  cat = sheet('', {cls: 'full cat', onClose: () => { cat = null; }});
  draw();
  cat.root.addEventListener('click', ev => {
    const tb = ev.target.closest('[data-tab]'), tp = ev.target.closest('[data-t]'), es = ev.target.closest('[data-es]');
    if (es) { const k = es.dataset.es; cat.close(); if (k === 'text') toText(b); if (k === 'role') roleSheet(b); return; }
    if (tb) { tab = tb.dataset.tab; draw(); cat.$('.sh-b').scrollTop = 0; }
    if (tp) { b.tpl = tp.dataset.t; b.tplLock = true; b.values = null; save(); redrawBlock(b);
      cat.$$('.tc').forEach(x => { x.classList.toggle('on', x === tp); const o = x.querySelector('.tc-ok'); if (o) o.remove(); });
      tp.querySelector('.tc-pv').insertAdjacentHTML('beforeend', `<i class="tc-ok">${I.check}</i>`); }
  });
};
const blockSheet = selBar;
/* картинки блока: своя или ТЗ для Krea */
/* иконки шаблона: у каждого пункта (или у блока) — своя, Гриди подбирает по словам, редактор может сменить */
const iconSlots = b => { const t = G.tpl(b.tpl); if (!t || !t.media || t.media.kind !== 'icon') return [];
  const s0 = G.src(b); return t.media.per && t.items ? s0.items.map((it, k) => ({key: 'i' + k, n: k + 1, title: it.title || it.text || ''})) : [{key: 'main', n: 0, title: s0.title || ''}]; };
const iconSheet = b => {
  const slots = iconSlots(b);
  const row = o => { const f = G.iconFor(b, o.key); return `<button class="row ic-row" data-ic="${e(o.key)}"><span class="ic-pv">${f ? f.ic.svg : ''}</span><span><b>${o.n ? 'Пункт ' + o.n : 'Иконка блока'}</b><small>${e(o.title.slice(0, 60))}${f && f.auto ? ' · подобрана' : f ? ' · выбрана' : ' · нет'}</small></span></button>`; };
  const s = sheet(`<div class="sh-h"><h2>Иконки</h2><button class="ib round ok" data-close aria-label="Готово">${I.check}</button></div><div class="sh-b"><div class="list">${slots.map(row).join('')}</div></div>`);
  s.$$('[data-ic]').forEach(x => x.onclick = () => pickIcon(b, x.dataset.ic, () => { s.close(true); iconSheet(b); }));
};
const pickIcon = (b, key, done) => {
  const all = G.icons(), sug = G.iconMatch(G.iconText(b, key), 12);
  const grid = list => list.map(ic => `<button class="ic-cell" data-pick="${e(ic.id)}" title="${e(ic.name)}">${ic.svg}</button>`).join('');
  const s = sheet(`<div class="sh-h"><h2>Иконка</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><input class="in" id="icQ" placeholder="Найти иконку" autocomplete="off">${sug.length ? `<p class="lbl">Подходят по словам</p><div class="ic-grid">${grid(sug)}</div>` : ''}<p class="lbl" id="icL">Все · ${all.length}</p><div class="ic-grid" id="icAll">${grid(all.slice(0, 120))}</div></div>`, {cls: 'tall'});
  const bind = () => s.$$('[data-pick]').forEach(x => x.onclick = () => { b.images = b.images || {}; b.images[key] = {...(b.images[key] || {}), icon: x.dataset.pick}; save(); redrawBlock(b); s.close(true); done && done(); });
  s.$('#icQ').oninput = () => { const q = s.$('#icQ').value.trim().toLowerCase(); const f = q ? all.filter(ic => (ic.name + ' ' + (ic.tags || '')).toLowerCase().includes(q)) : all; s.$('#icL').textContent = `${q ? 'Найдено' : 'Все'} · ${f.length}`; s.$('#icAll').innerHTML = grid(f.slice(0, 120)); bind(); };
  bind();
};
const imageSheet = b => {
  const p = A.page, slots = G.imageSlots(b, p);
  if (!slots.length && iconSlots(b).length) return iconSheet(b);
  if (!slots.length) { const s0 = sheet(`<div class="sh-h"><h2>Картинки</h2><button class="ib round" data-close aria-label="Закрыть">${I.x}</button></div><div class="sh-b">${empty('В этом шаблоне нет картинок', 'Выберите шаблон с картинкой — она появится здесь.', [['tpl', 'Шаблоны', true]])}</div>`); s0.$('[data-es]').onclick = () => { s0.close(true); catalog(); }; return; }
  const s = sheet(`<div class="sh-h"><h2>Картинки</h2><button class="ib round" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="imgs">${slots.map(o => `<div class="im"><div class="im-pv" style="aspect-ratio:${o.ratio.replace(':', '/')}">${o.data ? `<img src="${o.data}" alt="">` : `<span class="mono">${e(o.ratio)}${o.size ? ' · ' + e(o.size) : ''}</span>`}</div>
      <div class="im-b"><b>${o.n ? 'Элемент ' + o.n : 'Основная'}</b><small>${e(o.alt || '')}</small>
      <div class="chips"><label class="chip">Загрузить<input type="file" accept="image/*" data-up="${e(o.key)}" hidden></label><button class="chip" data-krea="${e(o.key)}">Текст для Krea</button>${o.krea && o.krea.url ? `<a class="chip" href="${e(o.krea.url)}" target="_blank" rel="noopener">Krea</a>` : ''}${o.data ? `<button class="chip" data-rm="${e(o.key)}">Убрать</button>` : ''}</div></div></div>`).join('')}</div></div>`);
  s.$$('[data-up]').forEach(x => x.onchange = () => { const f = x.files[0]; if (!f) return; if (f.size > 4e6) return toast('Картинка больше 4 МБ — уменьшите её.');
    const r = new FileReader(); r.onload = () => { b.images = b.images || {}; b.images[x.dataset.up] = {...(b.images[x.dataset.up] || {}), data: r.result}; save(); redrawBlock(b); s.close(true); imageSheet(b); }; r.readAsDataURL(f); });
  s.$$('[data-krea]').forEach(x => x.onclick = async () => { const o = slots.find(y => y.key === x.dataset.krea); await G.copy(o.text || o.alt || ''); toast('Текст для Krea скопирован'); });
  s.$$('[data-rm]').forEach(x => x.onclick = () => { delete (b.images || {})[x.dataset.rm]; save(); redrawBlock(b); s.close(true); imageSheet(b); });
};

/* правка текста блока со страницы: тот же редактор строк — правка разметки */
const textSheet = b => {
  const s = sheet(`<div class="sh-h ts-h"><div class="ts-field"><h2>${e(roleName(b))}</h2></div><button class="ib round ok" data-close aria-label="Готово">${I.check}</button></div>
    <div class="sh-b"><div class="ed solo" contenteditable="true" spellcheck="true" data-id="${e(b.id)}">${(lines(b.text).length ? lines(b.text) : [{k: 'p', t: ''}]).map(l => lineHTML(l.k, l.t)).join('')}</div></div>`,
    {onClose: () => { if (!b.text.trim()) A.page.blocks = A.page.blocks.filter(x => x.id !== b.id); else repick(b); save(); if (fmtEl) fmtEl.hidden = true; document.body.classList.remove('typing'); canvas(); if (b.text.trim()) select(b.id); else unselect(); }, cls: 'full text'});
  const ed = s.$('.ed'); bindEd(ed); fmtBar(s.$('.ts-field'));
  setTimeout(() => caretTo(ed.lastElementChild, ed.lastElementChild.textContent.length), 120);
};

/* 3. Выгрузка — по важности: ошибки и правила Нави (красным) → лимиты одной строкой → поправить под шаблон →
   нужен дизайн одной плашкой → рекомендации (можно скрыть). Строка с блоком — переход к нему. */
const CODEFIX = /H1 — только|Первых экранов|Целевых действий/;
const exportView = () => {
  const p = A.page; G.autoPick(p); p.dismissed = p.dismissed || [];
  const el = document.createElement('div'); el.className = 'pv ex';
  const draw = () => { const r = report(p), R = r.rows, num = b => b ? (p.blocks.indexOf(b) + 1) + '. ' + roleName(b) : 'Страница';
    const pageFix = c => c && c.fix && c.fix.addRole ? 'add' : c && CODEFIX.test(c.text) ? 'code' : '';
    /* замечания под шаблон: лимиты и дизайн — сводные строки, остальное — по блоку */
    const LIM = /длиннее/, DES = /^нужен (шаблон в админке|дизайн шаблона)$/;
    const parts = x => x.text.split(' · ');
    const lim = R.fit.filter(x => parts(x).some(l => LIM.test(l))), des = R.fit.filter(x => parts(x).some(l => DES.test(l)));
    const other = R.fit.map(x => ({...x, text: parts(x).filter(l => !LIM.test(l) && !DES.test(l)).join(' · ')})).filter(x => x.text);
    const red = [...R.stop.map(x => ({...x, kind: 'stop'})), ...R.rule.map(x => ({...x, kind: 'rule'})), ...R.page.filter(x => x.c.level === 'error' || pageFix(x.c)).map(x => ({...x, kind: 'page'}))];
    const recs = [...R.page.filter(x => !(x.c.level === 'error' || pageFix(x.c))), ...R.hint];
    const nums = list => list.map(x => p.blocks.indexOf(x.b) + 1).join(', ');
    const row = (x, id, extra = '') => `<div class="xr ${x.b ? 'go' : ''}" ${x.b ? `data-go="${e(x.b.id)}" role="button" tabindex="0"` : ''}><div class="xr-t"><span class="mono">${e(num(x.b))}</span>${e(x.text)}</div>${extra ? `<span class="xr-a">${extra}</span>` : ''}</div>`;
    const sum = (cls, title, sub, go, btn) => `<div class="xr sum ${cls} ${go ? 'go' : ''}" ${go ? `data-go="${e(go)}" role="button" tabindex="0"` : ''}><div class="xr-t"><b>${e(title)}</b><small>${e(sub)}</small></div>${btn ? `<span class="xr-a">${btn}</span>` : ''}</div>`;
    const plan = G.fixPlan(p), canAll = plan.code || plan.model.length || R.page.some(x => pageFix(x.c) === 'add');
    const ok = !R.stop.length;
    el.innerHTML = `<header class="hd"><button class="ib round" id="xX" aria-label="Закрыть">${I.x}</button><div class="ttl"><b>Выгрузка</b><small>${e(sc().name)}</small></div></header>
      <main class="ex-b">
        <div class="xs ${ok ? 'ok' : 'bad'}"><b>${ok ? (red.length || lim.length || other.length ? 'Можно выгружать' : 'Готово к выгрузке') : G.num(R.stop.length, 'блок не выгрузится', 'блока не выгрузятся', 'блоков не выгрузятся')}</b>
          <small>${ok ? (red.length ? 'Есть нарушения правил — лучше поправить' : lim.length || other.length ? 'Есть что поправить под шаблоны' : 'Замечаний нет') : 'Сначала поправьте их — ниже, нажмите на строку, чтобы перейти к блоку'}</small></div>
        ${red.length ? `<p class="lbl err">Ошибки и правила Нави · ${red.length}</p><div class="xrs red">${red.map((x, k) => row(x, k, x.kind === 'page' && pageFix(x.c) ? `<button class="pill sm pri" data-pf="${R.page.indexOf(R.page.find(y => y.c === x.c))}">${pageFix(x.c) === 'add' ? 'Добавить' : 'Поправить'}</button>` : '')).join('')}</div>` : ''}
        ${lim.length ? `<p class="lbl">Лимиты</p><div class="xrs">${sum('lim', 'Текст длиннее лимита', `${G.num(lim.length, 'блок', 'блока', 'блоков')}: ${nums(lim)}`, lim[0].b.id, '<button class="pill sm pri" data-lim>Поправить</button>')}</div>` : ''}
        ${other.length ? `<p class="lbl">Поправить под шаблон · ${other.length}</p><div class="xrs">${other.map(x => row(x)).join('')}</div>` : ''}
        ${des.length ? `<p class="lbl">Нужен дизайн</p><div class="xrs">${sum('des', 'Нужен дизайн блоков', `${G.num(des.length, 'блок', 'блока', 'блоков')}: ${nums(des)} — шаблона нет в админке, ТЗ в архиве`, des[0].b.id)}</div>` : ''}
        ${recs.length ? `<p class="lbl">Рекомендации · ${recs.length}</p><div class="xrs">${recs.map((x, k) => row({b: x.b || null, text: x.text}, k, `<button class="ib sm" data-hide="${k}" aria-label="Скрыть">${I.x}</button>`)).join('')}</div>` : ''}
        <p class="lbl">Передать</p>
        <div class="list"><button class="row" id="xShare"><b>Текстом в чат</b><small>Вставка этого текста в Гриди собирает ту же страницу</small></button>
          <button class="row" id="xZip"><b>Архив для вёрстки</b><small>Текст по полям, схема, ТЗ на картинки с именами слотов</small></button></div>
      </main>
      ${canAll ? `<div class="dock"><div class="fixall"><p class="hint">${e([plan.model.length ? 'Модель поправит: ' + plan.model.join(', ') : '', plan.code ? 'Гриди сам поправит: ' + G.num(plan.code, 'ошибку', 'ошибки', 'ошибок') + ' разметки' : '', (() => { const no = [...plan.no.filter(x => x !== 'остальное — вручную'), ...(R.fit.some(x => /без ссылки/.test(x.text)) ? ['ссылки у кнопок'] : []), ...(R.fit.some(x => /нужно от автора/.test(x.text)) ? ['пометки «нужно от автора»'] : []), ...(des.length ? ['дизайн шаблонов'] : [])]; return no.length ? 'Вручную останутся: ' + [...new Set(no)].join(', ') : ''; })()].filter(Boolean).join('. '))}</p><button class="pill grad wide" id="xFix">Поправить всё</button></div></div>` : ''}`;
    el.querySelector('#xX').onclick = close;
    el.querySelectorAll('[data-hide]').forEach(x => x.onclick = ev => { ev.stopPropagation(); p.dismissed.push(recs[+x.dataset.hide].text); save(); draw(); });
    const goTo = id => { close(); A.mode = 'page'; A.sel = id; A.jump = id; editor(); };
    el.querySelectorAll('[data-go]').forEach(x => { x.onclick = ev => { if (ev.target.closest('button')) return; goTo(x.dataset.go); }; x.onkeydown = ev => { if (ev.key === 'Enter') goTo(x.dataset.go); }; });
    const lb = el.querySelector('[data-lim]'); if (lb) lb.onclick = async ev => { ev.stopPropagation();
      try { const ids = lim.map(x => x.b.id).filter(id => G.adaptable(p.blocks.find(b => b.id === id), G.prompt('fix'), p)); const n = await G.runAdapt(p, 'fix', ids); if (n) lim.forEach(x => repick(x.b)); save(); draw(); } catch (err) { if (err.message !== 'cancel') toast(err.message); } };
    el.querySelectorAll('[data-pf]').forEach(x => x.onclick = ev => { ev.stopPropagation(); const c = R.page[+x.dataset.pf].c;
      if (pageFix(c) === 'add') { p.blocks.push(G.newBlock(c.fix.addRole, '')); toast('Блок добавлен в конец — заполните его текстом'); } else G.fixByCode(p); save(); draw(); });
    el.querySelector('#xShare').onclick = async () => { const t = shareText(p); if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) { try { await navigator.share({title: p.name, text: t}); return; } catch (err) { if (err.name === 'AbortError') return; } } await G.copy(t); toast('Текст страницы скопирован — вставьте в чат'); };
    el.querySelector('#xZip').onclick = async () => { try { await G.doExport(p); } catch (err) { toast(err.message); } };
    const fx = el.querySelector('#xFix'); if (fx) fx.onclick = async () => {
      try { const adds = R.page.filter(x => pageFix(x.c) === 'add'); adds.forEach(x => p.blocks.push(G.newBlock(x.c.fix.addRole, '')));
        const res = await G.runFix(p); G.autoPick(p); save(); draw();
        toast(`Поправлено: ${res.byCode + res.byModel + adds.length}${(res.notes || []).length ? ' · модель: ' + res.notes[0] : ''}`);
      } catch (err) { if (err.message !== 'cancel') toast(err.message); } };
  };
  const close = () => { el.remove(); document.body.classList.remove('noscroll'); editor(); };
  draw(); document.body.appendChild(el); document.body.classList.add('noscroll'); el.animate([{opacity: 0}, {opacity: 1}], {duration: 140});
};

/* 4. Библиотека: шаблоны, сценарии, промты, иконки — прежние редакторы в новой навигации */
const LIBK = [['templates', 'Шаблоны'], ['scenarios', 'Сценарии'], ['prompts', 'Промты'], ['icons', 'Иконки']];
const libRoute = () => { const h = location.hash.match(/^#\/lib(?:\/([^/]+))?(?:\/(.+))?$/); if (!h) return null; return {kind: G.KINDS[h[1]] ? h[1] : 'templates', id: h[2] ? decodeURIComponent(h[2]) : null}; };
const libView = () => { const r = libRoute() || {kind: 'templates', id: null}, S = G.ui; S.lib.kind = r.kind; S.lib.id = r.id; A.view = 'lib';
  const back = r.id ? `#/lib/${r.kind}` : '#/';
  $app.innerHTML = `<header class="hd" id="lHd"><a class="ib round" href="${back}" aria-label="Назад">${I.back}</a><div class="ttl"><b>${r.id ? e(G.KINDS[r.kind]) : 'Библиотека'}</b><small>${r.id ? 'Библиотека' : 'Шаблоны, сценарии и промты'}</small></div></header>
    ${r.id ? '' : `<nav class="tabs" role="tablist">${LIBK.map(([k, n]) => `<a role="tab" class="${k === r.kind ? 'on' : ''}" href="#/lib/${k}">${n}<i>${G.lib.all(k).filter(o => !(k === 'prompts' && o.system)).length}</i></a>`).join('')}</nav>`}
    <main class="lmain"><div class="libv" id="view"></div></main><div class="dock" id="lDock"></div>`;
  const v = $app.querySelector('#view'); S.markDirty(v); S.cta(null);
  G.views.library(v); scrollTo(0, 0); };
/* ---------- старт ---------- */
const st = document.createElement('style'); st.textContent = G.WIRE_CSS; document.head.appendChild(st);
let lastHash = location.hash;
const route = () => {
  const S = G.ui;
  if (S.dirty && location.hash !== lastHash && !confirm('Есть несохранённые изменения. Уйти без сохранения?')) { history.replaceState(null, '', lastHash); return; }
  S.dirty = false; lastHash = location.hash;
  const m = location.hash.match(/^#\/p\/(.+)$/), l = libRoute();
  if (l) { if (A.view === 'edit') save(); A.view = 'lib'; A.page = null; document.body.classList.remove('shell', 'picking'); libView(); return; }
  if (m && (!A.page || A.page.id !== m[1])) go('edit', m[1]); else if (!m && A.view !== 'home') go('home'); };
addEventListener('hashchange', route);
const m0 = location.hash.match(/^#\/p\/(.+)$/); if (m0) go('edit', m0[1]); else if (libRoute()) route(); else render();
G.m = {A, shareText, fromShare, build, lines, parseLine};
})();
