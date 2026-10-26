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
  shuffle: '<svg viewBox="0 0 24 24"><path d="M4 7h3c4 0 6 10 10 10h3M4 17h3c1.6 0 2.8-1.6 3.8-3.5M13.2 9.5C14.2 8.1 15.4 7 17 7h3M18 4l3 3-3 3M18 14l3 3-3 3"/></svg>',
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

/* иконки из библиотеки (SDDS): ИИ — Ai, выбор иконок — StarCircle, смена шаблона — CardstackHoriz */
const sd = (name, fb) => { try { const ic = G.icons().find(x => x.name === name); return ic ? ic.svg.replace('<svg', '<svg class="sd"') : fb; } catch (err) { return fb; } };

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
/* грамматика строк — одна на всю Гриди: G.lineKind (core.js) */
const parseLine = l => G.lineKind(l);
const md = (k, t) => { if (!t) return ''; return /^h[1-4]$/.test(k) ? `[${k}] ${t}` : k === 'meta' ? '@ ' + t : k === 'btn' ? '[кнопка] ' + t : k === 'img' ? '[картинка] ' + t : k === 'li' ? '- ' + t : t; };
const tidy = arr => arr.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
const lines = text => { const t = tidy(String(text || '').split('\n').map(x => x.trim())); return t ? t.split('\n').map(l => l ? parseLine(l) : {k: 'p', t: ''}) : []; };
const noLink = (k, t) => k === 'btn' && t && !/\s\|\s+\S/.test(t) ? ' data-nolink' : '';
const lineHTML = (k, t) => `<div class="ln" data-k="${k}" data-g="${e((KIND[k] || KIND.p).g)}"${noLink(k, t)}>${t ? e(t) : '<br>'}</div>`;
const mkLine = (k, t) => { const d = document.createElement('div'); d.className = 'ln'; d.dataset.k = k; d.dataset.g = (KIND[k] || KIND.p).g; if (t) d.textContent = t; else d.innerHTML = '<br>'; return d; };
const setKind = (d, k) => { d.dataset.k = k; d.dataset.g = (KIND[k] || KIND.p).g; };

/* ---------- замечания: одна причина — одна строка ----------
   stop — блок не выгрузится; fit — поправить под шаблон (всё по блоку одной строкой); page — про страницу целиком; hint — подсказки */
const HINT = /^Обычно на странице есть|^Страница пока пустая|^Полотно текста|^Мало врезов|^Все врезы одного вида|^Порядок блоков|встречается .* раза|без подзаголовков/;
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
/* градация выгрузки: красное — ошибки, правила Нави, лимиты, структура; оранжевое — не хватает данных (ссылки, картинки, иконки,
   факты от автора) и дизайна; рекомендации — отдельно. Зелёный статус — когда закрыто всё, и рекомендации тоже */
const CODEFIX = /H1 — только|Первых экранов|Целевых действий|всегда первый блок|в отдельный блок/;
const LIM = /длиннее/, DES = /^нужен (шаблон в админке|дизайн шаблона)$/, DATA = /без ссылки|нет (картинки|фото|иконки)|нужно от автора|пуст/;
const gradeOf = (p, R) => {
  const pageFix = c => c && c.fix && c.fix.addRole ? 'add' : c && CODEFIX.test(c.text) ? 'code' : '';
  const parts = x => x.text.split(' · '), pick = (x, re) => ({...x, text: parts(x).filter(l => re(l)).join(' · ')});
  const lim = R.fit.filter(x => parts(x).some(l => LIM.test(l))), des = R.fit.filter(x => parts(x).some(l => DES.test(l)));
  const struct = R.fit.map(x => pick(x, l => !LIM.test(l) && !DES.test(l) && !DATA.test(l))).filter(x => x.text);
  const data = R.fit.map(x => pick(x, l => DATA.test(l))).filter(x => x.text);
  const red = [...R.stop.map(x => ({...x, kind: 'stop'})), ...R.rule.map(x => ({...x, kind: 'rule'})), ...R.page.filter(x => x.c.level === 'error' || pageFix(x.c)).map(x => ({...x, kind: 'page'}))];
  const recs = [...R.page.filter(x => !(x.c.level === 'error' || pageFix(x.c))), ...R.hint];
  /* счётчик — по замечаниям, не по блокам: убрали одно — число уменьшилось */
  const n = list => list.reduce((a, x) => a + parts(x).length, 0);
  const nRed = red.length + lim.length + n(struct), nOr = n(data) + des.length;
  /* рекомендации — плашками на самой странице; в выгрузку и готовность не входят */
  return {red, lim, struct, data, des, recs, pageFix, level: nRed ? 'red' : nOr ? 'orange' : 'green', total: nRed + nOr};
};
/* ---------- страница ---------- */
/* замечания считаются один раз на состояние страницы: бейдж, точки и экран выгрузки берут одно и то же */
const report = p => {
  const key = p.scenario + '|' + p.blocks.map(b => b.id + ':' + b.tpl + ':' + b.role + ':' + b.text.length + ':' + G.len(b.text.slice(0, 40)) + ':' + Object.entries(b.images || {}).map(([k, v]) => k + (v && v.data ? 'd' : '') + (v && v.icon || '')).join(',')).join('|') + '|' + (p.dismissed || []).length;
  if (p._rep && p._rep.key === key) return p._rep;
  const dis = p.dismissed || [], checks = G.checks(p).filter(c => !dis.includes(c.text) && !/^Нави /.test(c.text));
  p.blocks.forEach(b => { const s0 = G.src(b); s0.cta.forEach((c, k) => { if (!(s0.urls || [])[k]) { const t = `Нет ссылки у кнопки «${c}» — допишите адрес через « | »`; if (!dis.includes(t)) checks.push({level: 'info', text: t, block: b}); } });
    s0.items.forEach(it => { if (it.cta && !it.url) { const t = `Нет ссылки у кнопки «${it.cta}» — допишите адрес через « | »`; if (!dis.includes(t)) checks.push({level: 'info', text: t, block: b}); } }); });
  p.blocks.forEach(b => (b.tips || []).forEach(t => { if (!dis.includes(t)) checks.push({level: 'info', text: t, block: b, tip: true}); }));
  /* «Не разобрано» — служебное сбоку от страницы: на страницу не идёт, поэтому не ошибка, а напоминание */
  p.blocks.filter(b => b.role === 'unparsed').forEach(b => checks.unshift({level: 'warn', text: 'Блок «Не разобрано» на страницу не попадёт: перенесите нужное в блоки (Роль) или удалите его', block: b}));
  const order = {error: 0, warn: 1, info: 2}; checks.sort((a, b) => order[a.level] - order[b.level]);
  const missing = G.missing(p), byBlock = {};
  checks.forEach(c => { c.kind = kindOf(c); if (c.label === undefined) c.label = labelOf(c); });
  /* у блока точка — только то, что мешает выгрузке или требует правки под шаблон; подсказки — отдельно */
  checks.forEach(c => { if (c.block && (c.kind === 'stop' || c.kind === 'fit') && c.label) (byBlock[c.block.id] = byBlock[c.block.id] || []).push(c); });
  missing.forEach(m => { (byBlock[m.b.id] = byBlock[m.b.id] || []).push({level: 'design', kind: 'fit', label: 'нужен шаблон в админке', text: 'Нужен шаблон в админке'}); });
  const rows = rowsOf(p, checks, byBlock);
  const grade = gradeOf(p, rows);
  Object.defineProperty(p, '_rep', {value: {key, checks, missing, byBlock, rows, grade, count: grade.total}, configurable: true, writable: true, enumerable: false});
  return p._rep;
};
const sc = () => G.scenario(A.page.scenario);
const roleName = b => { const n = G.roleOf(sc(), b.role).name || b.role; return n.split(':')[0]; };
/* замечание блока — в его названии рядом с номером и ролью; видно, когда блок выделен */
const blockNote = (b, p, T = A.mode === 'note') => { const R = report(p).rows, pick = l => (l.find(x => x.b === b) || {}).text || '';
  return T ? pick(R.stop) || pick(R.rule) : pick(R.stop) || pick(R.rule) || pick(R.fit); };
/* подсказки модели и рекомендации по блоку — плашкой прямо под блоком, в обоих режимах: видно без выбора блока */
const tipPlate = (b, p) => { const H = report(p).rows.hint.filter(x => x.b === b); if (!H.length) return '';
  /* рекомендация по структуре: раздела сценария нет совсем — кнопка «Добавить раздел» ставит пустой блок-маску */
  const addOf = x => { const c = (report(p).checks || []).find(c => c.text === x.text); return c && c.fix && c.fix.addRole; };
  return `<div class="tips" data-tips="${e(b ? b.id : 'page')}">${H.map(x => `<div class="tip"><span class="tip-i">${I.ai}</span><span class="tip-t">${e(x.text)}</span>${addOf(x) ? `<button class="pill sm" data-tipadd="${e(addOf(x))}">Добавить раздел</button>` : ''}<button class="tip-x" data-tipx="${e(x.text)}" aria-label="Скрыть подсказку" title="Скрыть">${I.x}</button></div>`).join('')}</div>`; };
const bindTips = main => { main.querySelectorAll('[data-tipadd]').forEach(x => x.onclick = ev => { ev.stopPropagation(); addRoleBlock(x.dataset.tipadd); });
  main.querySelectorAll('[data-tipx]').forEach(x => x.onclick = ev => { ev.stopPropagation(); const p = A.page; p.dismissed = p.dismissed || []; p.dismissed.push(x.dataset.tipx); save();
  const box = x.closest('.tips'), tip = x.closest('.tip'); tip.remove(); if (box && !box.children.length) box.remove(); toast('Подсказка скрыта'); }); };
/* раздел сценария — пустым блоком на своё место по порядку сценария */
const addRoleBlock = role => { const p = A.page, order = (sc().roles || []).map(r => r.id), at = order.indexOf(role), nb = G.newBlock(role, '');
  const i = at < 0 ? p.blocks.length : p.blocks.findIndex(b => order.indexOf(b.role) > at); p.blocks.splice(i < 0 ? p.blocks.length : i, 0, nb); save();
  A.mode = 'note'; A.jump = nb.id; editor(); const ed = $app.querySelector(`.ed[data-id="${nb.id}"]`); if (ed) caretTo(ed.firstChild, 0); };
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
/* в строке блока — роль, выбранный шаблон и иконки: «--- Роль · шаблон: id · иконки: i0=id, i1=id». Картинки в чат не идут — только в архив */
const shareMeta = b => { const t = b.tpl ? ' · шаблон: ' + b.tpl : '', ic = Object.entries(b.images || {}).filter(([, v]) => v && v.icon).map(([k, v]) => k + '=' + v.icon).join(', ');
  return t + (ic ? ' · иконки: ' + ic : ''); };
const shareText = p => [`=== ${p.name} · ${G.scenario(p.scenario).name}`, ...p.blocks.map(b => `--- ${G.roleOf(G.scenario(p.scenario), b.role).name}${shareMeta(b)}\n${b.text}`)].join('\n');
const isShare = t => /^---\s+\S/m.test(t);
/* названия ролей до общего набора (2026-10-26) — чтобы старый текст из «Поделиться» собирался так же */
const OLD_NAMES = {'что это': 'about', 'кому подходит': 'audience', 'спикеры': 'speakers', 'автор курса': 'speakers', 'чему научитесь': 'benefits', 'что получите': 'benefits', 'почему это нужно': 'why', 'как это работает': 'how', 'как подключить': 'how', 'как попасть': 'how', 'кто уже пользуется': 'proof', 'стоимость': 'pricing'};
const fromShare = (p, text) => {
  const head = text.match(/^===\s*(.*?)\s*·\s*(.+)$/m);
  if (head) { const s = G.lib.all('scenarios').find(x => x.name === head[2].trim()); if (s) p.scenario = s.id; if (head[1] && p.name === 'Без названия') p.name = head[1]; }
  const s = G.scenario(p.scenario), find = n => { n = n.trim().toLowerCase(); const r = G.allRoles(s).find(r => r.name.toLowerCase() === n || r.id === n || r.name.toLowerCase().split(':')[0] === n.split(':')[0]) || G.allRoles(s).find(r => r.id === OLD_NAMES[n]); return r ? r.id : n.startsWith('первый') ? 'hero' : n.startsWith('целев') ? 'cta' : defRole(); };
  const blocks = []; let cur = null;
  for (const raw of text.split('\n')) {
    const m = raw.match(/^---\s+(.+)$/);
    if (m) { const [role, ...meta] = m[1].split(' · '); cur = G.newBlock(find(role), ''); blocks.push(cur);
      meta.forEach(x => { const t = x.match(/^шаблон:\s*(.+)$/), ic = x.match(/^иконки:\s*(.+)$/);
        if (t && G.tpl(t[1].trim())) { cur.tpl = t[1].trim(); cur.tplLock = true; }
        if (ic) ic[1].split(/,\s*/).forEach(kv => { const [k, v] = kv.split('='); if (k && v) { cur.images[k.trim()] = {icon: v.trim()}; } }); });
      continue; }
    if (/^===/.test(raw)) continue;
    if (!cur) { cur = G.newBlock(blocks.length ? defRole() : 'hero', ''); blocks.push(cur); }
    cur.text += (cur.text ? '\n' : '') + raw;
  }
  blocks.forEach(b => { b.text = b.text.trim(); });
  p.blocks = blocks.filter(b => b.text); p.text = p.blocks.map(b => b.text).join('\n\n');
  G.autoPick(p);
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
  root._sheet = h; /* смена экрана закрывает шторку как крестик: ожидание ответа модели отменяется, а не висит */
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
  document.body.appendChild(el); G._askEl = el;
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
  G._askEl = s.root;
  s.$('#mCopy').onclick = async () => { await G.copy(prompt); toast('Промт скопирован'); };
  s.$('#mOk').onclick = () => { const v = s.$('#mAns').value; if (!G.parseJSON(v)) { s.$('#mErr').textContent = 'В ответе нет JSON. Попросите модель: «верни только JSON».'; return; } s.close(true); res(v); };
});
Object.assign(G.ui = G.ui || {}, {toast, busy, manualAsk});

/* подтверждение на месте: первая нажатая кнопка меняет подпись, вторая — выполняет */
const sure = (btn, label, run) => { if (btn.dataset.sure) return run(); btn.dataset.sure = 1; btn.textContent = label + ' — нажмите ещё раз'; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.sure; } }, 4000); };
/* вопросы промта (например, тон или тема интеграции) — шторкой */
const askVals = pr => new Promise(res => {
  const s = sheet(`<div class="sh-h"><h2>${e(pr.name)}</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b">${pr.ask.map(a => `<label class="lbl" for="ask-${e(a.k)}">${e(a.label)}</label><textarea class="ta" rows="3" id="ask-${e(a.k)}" placeholder="${e(a.placeholder || '')}"></textarea>${a.chips ? `<div class="chips rw-q">${a.chips.map(c => `<button class="chip sm" data-ac="${e(a.k)}">${e(c)}</button>`).join('')}</div>` : ''}`).join('')}</div>
    <div class="sh-f"><button class="pill pri wide" id="askOk">Запустить</button></div>`, {onClose: () => res(null)});
  s.$$('[data-ac]').forEach(x => x.onclick = () => { const q = s.$('#ask-' + CSS.escape(x.dataset.ac)); q.value = [q.value.trim(), x.textContent.toLowerCase()].filter(Boolean).join(', '); q.focus(); });
  setTimeout(() => { const q = s.$('textarea'); if (q) q.focus(); }, 60);
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
  if (view === 'edit') { A.page = await G.store.get(id); if (!A.page) { A.view = 'home'; } else { A.page.blocks.forEach(b => { b.role = G.roleId(b.role); if (/^\s*@/m.test(b.text)) b.text = G.dropMeta(b.text); }); A.mode = A.page.blocks.length ? 'page' : 'note'; } }
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
  for (const x of G.examples) { const p = G.fromExample(x); p.name = p.name.replace(/\s*\([^)]*\)\s*$/, ''); if (!p.blocks.length && p.text) G.assemble(p);
    /* первый экран: подзаголовок и кнопка — шаблоны первого экрана в админке с кнопкой */
    const h = p.blocks.find(b => b.role === 'hero'); if (h) h.text = '[h1] Как работает Гриди\nСобрать страницу из текста: вставить, разобрать, проверить и передать.\n[кнопка] Создать страницу | https://prize360.github.io/navi-gridi/\n[кнопка] Открыть Нави | https://prize360.github.io/navi-gridi/navi.html';
    G.autoPick(p, true); await G.store.put(p); }
};
const home = async () => {
  await seed();
  const raw = await G.store.list();
  for (const x of raw) if (x.guide) await G.store.del(x.id); /* старая инструкция-страница: теперь она открывается превью */
  for (const x of raw) if (!x.blocks.length && !String(x.text || '').trim()) await G.store.del(x.id); /* пустые страницы без текста — их создали и бросили */
  const all = raw.filter(x => x.blocks.length && !x.guide).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  /* табы — сценарии: сначала основные, потом созданные в библиотеке */
  const tabs = [...TABS.filter(([id]) => G.lib.get('scenarios', id)), ...G.lib.all('scenarios').filter(x => !TABS.some(([id]) => id === x.id)).map(x => [x.id, x.name])];
  A.tab = A.tab || G.ls.get('tab', 'article'); if (!tabs.some(([id]) => id === A.tab)) A.tab = (tabs[0] || ['article'])[0];
  const list = all.filter(p => p.scenario === A.tab), other = all.filter(p => !tabs.some(([id]) => id === p.scenario) && A.tab === tabs[0][0]);
  const pages = [...list, ...other], slots = Math.max(0, 9 - pages.length);
  const cnt = id => all.filter(p => p.scenario === id).length;
  $app.innerHTML = `<header class="hd"><div class="logo"><img class="lg-mark" src="${G.LOGO || ''}" alt="">Гриди</div><button class="ib round" id="hMenu" aria-label="Меню">${I.menu}</button></header>
    <nav class="tabs" role="tablist">${tabs.map(([id, n]) => `<button role="tab" class="${id === A.tab ? 'on' : ''}" data-tab="${id}">${n}${cnt(id) ? `<i>${cnt(id)}</i>` : ''}</button>`).join('')}</nav>
    <main class="home">${G.ls.get('guideSeen', 0) ? '' : `<div class="hello"><button class="hello-b" id="hGuide"><b>Впервые в Гриди?</b><small>Посмотрите, как он работает — пара минут</small></button><button class="ib round" id="hGuideX" aria-label="Закрыть">${I.x}</button></div>`}${pages.length ? '' : '<!--'}<div class="grid">${pages.map(p => `<div class="tlw"><button class="tl" data-id="${e(p.id)}">${cover(p)}<span class="tl-n">${e(p.name)}</span></button><button class="ib round tl-del" data-del="${e(p.id)}" aria-label="Удалить страницу" title="Удалить">${I.x}</button></div>`).join('')}${'<span class="tl-slot"></span>'.repeat(slots)}</div>${pages.length ? '' : '-->'}
      ${!pages.length ? empty(`Здесь пока нет ${({article: 'статей', course: 'курсов', event: 'событий', sale: 'продуктов', promo: 'промо-страниц'})[A.tab] || 'страниц «' + ((tabs.find(([id]) => id === A.tab) || [, ''])[1]) + '»'}`, 'Вставьте текст — Гриди разложит его по блокам и подберёт шаблоны.', [['new', 'Создать', true]]) : ''}</main>
    <div class="dock"><button class="pill grad wide" id="hNew">Новая страница</button></div>`;
  $app.querySelectorAll('[data-tab]').forEach(c => c.onclick = () => { A.tab = c.dataset.tab; G.ls.set('tab', A.tab); home().then(appear); });
  $app.querySelectorAll('.tl').forEach(c => { let t = null;
    c.onclick = () => { if (c.dataset.held) { delete c.dataset.held; return; } go('edit', c.dataset.id); };
    c.addEventListener('pointerdown', () => { t = setTimeout(() => { c.dataset.held = 1; pageMenu(all.find(x => x.id === c.dataset.id)); }, 480); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => c.addEventListener(ev, () => clearTimeout(t)));
    c.addEventListener('contextmenu', ev => { ev.preventDefault(); c.dataset.held = 1; pageMenu(all.find(x => x.id === c.dataset.id)); }); });
  $app.querySelectorAll('[data-del]').forEach(x => x.onclick = ev => { ev.stopPropagation(); delAsk(all.find(p => p.id === x.dataset.del)); });
  const es = $app.querySelector('[data-es=new]'); if (es) es.onclick = () => $app.querySelector('#hNew').click();
  /* новая страница живёт только на экране, пока её не собрали: пустые в список не попадают */
  /* новая страница — сразу редактор: блоки сценария пустыми, с примером, что писать; вставка документа делит текст по заголовкам */
  $app.querySelector('#hNew').onclick = () => { A.page = G.newPage('Без названия', A.tab, ''); A.page.blocks = (G.scenario(A.tab).roles || []).map(r => G.newBlock(r.id, '')); G.autoPick(A.page); A.view = 'edit'; A.mode = 'note'; A.sel = null;
    location.hash = '#/p/' + A.page.id; document.body.classList.add('shell'); render(); appear(); };
  $app.querySelector('#hMenu').onclick = settings;
  const hg = $app.querySelector('#hGuide'); if (hg) { hg.onclick = openGuide; $app.querySelector('#hGuideX').onclick = () => { G.ls.set('guideSeen', 1); $app.querySelector('.hello').remove(); }; }
  requestAnimationFrame(() => $app.querySelectorAll('.tl-pv').forEach(x => x.style.setProperty('--k', x.clientWidth / 560)));
};
/* удаление страницы — с предупреждением: страница живёт только в этом браузере, восстановить нельзя */
const delAsk = p => { if (!p) return;
  const s = sheet(`<div class="sh-h"><h2>Удалить страницу?</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><p class="hint">«${e(p.name)}» удалится из этого браузера. Восстановить её не получится — если она ещё нужна, сначала скачайте архив или скопируйте ссылку.</p></div>
    <div class="sh-f"><button class="pill ghost" data-close>Отмена</button><button class="pill danger" id="dYes">Удалить</button></div>`);
  s.$('#dYes').onclick = async () => { await G.store.del(p.id); s.close(); home(); toast('Страница удалена'); };
};
/* долгое нажатие на обложку: дублировать, удалить */
const pageMenu = p => {
  const s = sheet(`<div class="sh-h"><h2>${e(p.name)}</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div><div class="sh-b"><div class="list"><button class="row ic" id="rDup">${I.page}<b>Дублировать</b></button><button class="row ic danger" id="rDel">${I.trash}<b>Удалить</b></button></div></div>`);
  s.$('#rDup').onclick = async () => { const n = {...G.clone(p), id: G.uid('p'), name: p.name + ' (копия)'}; await G.store.put(n); s.close(); home(); };
  s.$('#rDel').onclick = () => { s.close(true); delAsk(p); };
};

/* памятка для редакции: как писать текст, чтобы он собрался как задумано. Рекомендации, а не обязаловка */
const MEMO = [
  ['[h1] Заголовок', 'Заголовок страницы — один, в начале'],
  ['[h2] Заголовок', 'Новый блок страницы'],
  ['- Заголовок — текст', 'Пункт: из пунктов Гриди делает карточки, шаги, людей или список. Время, должность, место — в том же пункте через « — »'],
  ['[кнопка] Текст | ссылка', 'Кнопка'],
  ['[картинка] Подпись', 'Место для картинки'],
  ['Тариф | Срок | Цена', 'Таблица — от двух строк с одинаковым числом колонок'],
];
const memo = () => sheet(`<div class="sh-h"><div><h2>Как писать текст</h2><p class="sub">Размечать не обязательно: модель разберёт текст сама и поправит неверную разметку. Таблицы и кнопки со ссылкой она не меняет.</p></div><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
  <div class="sh-b"><div class="memo">${MEMO.map(([a, b]) => `<code>${e(a)}</code><span>${e(b)}</span>`).join('')}</div>
  <p class="hint">Пустые строки ни на что не влияют. Если текст не поместился в шаблон, Гриди покажет это в проверке — и предложит, как поправить.</p></div>`, {cls: 'tall'});
/* инструкция — обычная страница Гриди (статья), собранная по разметке. Только общие сведения: её можно показывать по публичной ссылке */
/* инструкция — страница Гриди (статья) с шаблонами. Только общие сведения: её же можно отдать ссылкой (до 4 тыс. знаков) */
const GUIDE = [
  ["hero", "[h1] Как работает Гриди\nНапишите страницу по блокам или вставьте документ — Гриди сразу покажет её в шаблонах", "n-30", 0],
  ["content", "[h2] От текста — к странице\nНовая страница сразу открывается блоками сценария: в каждом серым — что в него писать. Пишете по блокам или вставляете документ — Гриди делит его на блоки по заголовкам и подбирает каждому шаблон сетки. Текст остаётся единым: в режиме «Текст» вы правите содержание и структуру, в режиме «Шаблоны» смотрите результат.", "article-text", 0],
  ["vrez", "- Пишите или вставляйте — Заголовок — новый блок, пункт «- Заголовок — текст» — карточка, шаг или человек. Кнопки, таблицы и списки Гриди узнаёт сам.\n- ИИ — Пересобрать страницу: модель разделит текст на блоки и уложит в поля шаблонов. Здесь же — свой запрос и готовые улучшения.", "a-12", {"i1": {"icon": "sdds-Ai"}}],
  ["content", "[h2] Два режима одного текста\nПереключатель внизу справа: «Текст» — содержание и структура, «Шаблоны» — оформление. Изменения сразу видны в обоих режимах: шаблон лишь отображает текст блока.", "article-text", 0],
  ["vrez", "- Текст — Меняйте текст, порядок блоков и роль (она есть и в выборе шаблона), объединяйте и разделяйте их, меняйте разметку строк.\n- Шаблоны и ИИ — Выбирайте шаблоны, изображения и иконки. С помощью ИИ исправляйте ошибки, адаптируйте текст под шаблон, придумывайте содержание или запускайте свой промт.", "a-12", {"i0": {"icon": "sdds-SortBigSmall"}, "i1": {"icon": "sdds-Apps"}}],
  ["content", "[h2] Как выбирается шаблон\nГриди учитывает содержимое блока: число пунктов, кнопки, заголовок, цитату или таблицу. Картинки не влияют на выбор — их добавляют позже. Если пунктов больше четырёх, похожие шаблоны собираются по рядам.", "article-text", 0],
  ["vrez", "- Подходит — Всё помещается и выглядит правильно.\n- Почти — Текст нужно немного изменить, например сократить.\n- Не подходит — Часть текста не помещается в шаблон.", "n-46", {"i0": {"icon": "sdds-DoneCircle"}, "i1": {"icon": "sdds-AttentionCircle"}, "i2": {"icon": "sdds-CloseCircle"}}],
  ["content", "[h2] Правила страницы\nЕсли в библиотеке нет подходящего шаблона, Гриди попробует подобрать новый и отметит блок «нужен дизайн»", "article-text", 0],
  ["vrez", "- Первый экран — Всегда один и на первом месте. H1 — только на нём.\n- Целевое действие — Не больше одного на странице: с кнопкой или формой.\n- Кнопка — Глагол и результат, не более 24 знаков.\n- Заголовок раздела — Основа якорной навигации.", "a-11", {"i0": {"icon": "sdds-Header1"}, "i1": {"icon": "sdds-LocationPoint"}, "i2": {"icon": "sdds-HandPointer"}, "i3": {"icon": "sdds-Header2"}}],
  ["content", "[h2] Проверка и выгрузка\nЗначок выгрузки показывает, сколько исправлений осталось, а цвет — статус: красный — ошибки, превышение лимитов или проблемы со структурой; оранжевый — не хватает ссылок, картинок или иконок; зелёный — всё готово, включая рекомендации. Нажмите на строку, чтобы перейти к нужному блоку.", "article-text", 0],
  ["vrez", "- Ссылка для коротких страниц — Можно быстро поделиться, переносятся текст, шаблоны, иконки и сценарий\n- Архив для вёрстки — В архиве — текст по полям, схема страницы и сжатые изображения в формате WebP.", "a-12", {"i0": {"icon": "sdds-Link"}, "i1": {"icon": "sdds-FolderPlus"}}],
  ["content", "[h2] Модель\nГриди работает и вручную: подготовит промт, который вы отправите в свою модель, а затем вставите ответ. С ключом модель вызывается автоматически, а ключ хранится только в этом браузере. При разборе модель возвращает номера строк, а не сам текст, поэтому исходный текст не искажается.", "article-text", 0],
  ["vrez", "- Разбор — Модель отвечает номерами строк, а не текстом: исходный текст не искажается.\n- Улучшения — Модель видит роль блока и поля шаблона, поэтому текст ложится в лимиты", "a-12", {"i0": {"icon": "sdds-ListView"}, "i1": {"icon": "sdds-MagicWand"}}],
  ["content", "[h2] Библиотека\nШаблоны, сценарии, промты и иконки доступны в настройках, в разделе «Библиотека». Ваши изменения сохраняются только в этом браузере.", "article-text", 0],
  ["vrez", "- Сценарий — Памятка: какие блоки обычно есть на такой странице. Роли блоков общие для всех страниц. Свой сценарий появится вкладкой на главной.\n- Промт — Свои промты позволяют менять поведение, появляются в доступных ИИ командах.\n- Иконки — Подбираются по словам в пункте, но любую иконку можно заменить для автоподбора.", "n-46", {"i0": {"icon": "sdds-SortAlphabetAsc"}, "i1": {"icon": "sdds-Edit"}, "i2": {"icon": "sdds-StarCircle"}}]];
G.guidePage = () => G.unpack({page: {name: 'Как работает Гриди', scenario: 'article', blocks: GUIDE.map(([role, text, tpl, images]) => ({role, text, tpl: tpl || undefined, lock: 1, images: images || undefined}))}, templates: [], scenario: null}).page;
/* открывается превью — читать, а не править */
const openGuide = () => { G.ls.set('guideSeen', 1); document.querySelector('.hello')?.remove(); preview(G.guidePage()); };

/* настройки: модель и импорт */
/* что Гриди понял из строки Krea app */
const kreaNote = raw => { const a = G.parseKrea(raw); if (!a) return 'Не задан — у картинок будет только «Текст для Krea»';
  return [a.api ? `API: app ${a.id.slice(0, 8)}…, поле «${a.input}»` : a.id ? 'Нет имени поля текста — вставьте пример запроса целиком' : '', a.url ? 'ссылка для ручного режима' : ''].filter(Boolean).join(' · ') || 'Не похоже на ссылку Krea'; };
/* настройки — пунктами: модель текста, картинки Krea, библиотека, сброс. Модель и Krea открываются своими шторками */
const settings = () => {
  const st = G.llmSettings(), ks = G.kreaSettings(), kn = (G.lib.settings().krea || []).filter(k => G.parseKrea(k.url)).length;
  const s = sheet(`<div class="sh-h"><h2>Настройки</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="list">
        <button class="row ic" id="sModelR">${I.ai}<span><b>Модель текста</b><small>${st.mode === 'api' && st.key ? 'Свой ключ · ' + e(st.model || 'модель не указана') : 'Вручную — промт копируется в свою модель'}</small></span></button>
        <button class="row ic" id="sKreaR">${I.img}<span><b>Картинки — Krea</b><small>${ks.mode === 'api' && ks.key ? 'Свой ключ' : 'Вручную'} · ${kn ? G.num(kn, 'app задан', 'app задано', 'app задано') : 'app не заданы'}</small></span></button>
        <a class="row ic" href="#/lib/templates">${I.grid}<span><b>Библиотека</b><small>Шаблоны, сценарии, промты и иконки</small></span></a>
        <label class="row ic file">${I.plus}<span><b>Страница от коллеги</b><small>Архив или page.json. Текст из чата — просто вставьте в новую страницу</small></span><input type="file" id="sImp" accept=".zip,.json,application/zip,application/json"></label>
        <button class="row ic" id="sPilot">${I.out}<span><b>Итоги пилота</b><small>Архив для меня: правки библиотеки, недостающие шаблоны, запуски модели — без текстов страниц</small></span></button>
        <button class="row ic" id="sGuide">${I.note}<span><b>Как работает Гриди</b><small>Коротко обо всём</small></span></button>
        <button class="row ic" id="sMemo">${I.note}<span><b>Как писать текст</b><small>Заголовки, пункты, кнопки — минута</small></span></button>
        <a class="row ic" href="navi.html" target="_blank" rel="noopener">${I.eye}<span><b>Нави ↗</b><small>Гайд и прототип навигации — в новой вкладке</small></span></a>
        <button class="row ic danger" id="sReset">${I.trash}<span><b>Сбросить данные в этом браузере</b><small>Страницы, ключи, правки библиотеки — всё, что Гриди хранит здесь</small></span></button>
      </div></div>`, {cls: 'tall'});
  s.$('#sModelR').onclick = () => { s.close(true); modelSheet(); };
  s.$('#sKreaR').onclick = () => { s.close(true); kreaSheet(); };
  s.$('#sPilot').onclick = async () => { try { await G.pilotExport(false); toast('Архив итогов скачан'); } catch (err) { toast(err.message); } };
  s.$('#sGuide').onclick = () => { s.close(true); openGuide(); };
  s.$('#sMemo').onclick = () => { s.close(true); memo(); };
  s.$('#sReset').onclick = () => { s.close(true); resetSheet(); };
  s.$('#sImp').onchange = async ev => { try { await G.importProject(ev.target.files[0]); s.close(); toast('Страница добавлена'); home(); } catch (err) { toast(err.message); } };
};
const back2set = s => { s.close(true); settings(); };
const modelSheet = () => { const st = G.llmSettings(); let mode = st.mode === 'api' ? 'api' : 'manual';
  const s = sheet(`<div class="sh-h"><div><h2>Модель текста</h2><p class="sub">Разбор, укладка и свои запросы</p></div><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="seg wide" id="sMode"><button data-v="manual" class="${mode !== 'api' ? 'on' : ''}">Вручную</button><button data-v="api" class="${mode === 'api' ? 'on' : ''}">Свой ключ</button></div>
      <p class="hint">Вручную — Гриди даст промт, вы отправите его в свою модель и вставите ответ.</p>
      <div id="sApi" ${mode === 'api' ? '' : 'hidden'}>
        <label class="lbl" for="sBase">Адрес API (формат OpenAI)</label><input class="in" id="sBase" value="${e(st.base)}">
        <label class="lbl" for="sModel">Модель</label><input class="in" id="sModel" value="${e(st.model)}">
        <label class="lbl" for="sKey">Ключ — хранится только в этом браузере</label><input class="in" id="sKey" type="password" value="${e(st.key)}" autocomplete="off"></div></div>
    <div class="sh-f"><button class="pill pri wide" id="sOk">Сохранить</button></div>`, {cls: 'tall'});
  s.$$('#sMode button').forEach(b => b.onclick = () => { mode = b.dataset.v; s.$$('#sMode button').forEach(x => x.classList.toggle('on', x === b)); s.$('#sApi').hidden = mode !== 'api'; });
  s.$('#sOk').onclick = () => { G.ls.set('llm', {mode, base: s.$('#sBase').value.trim(), model: s.$('#sModel').value.trim(), key: s.$('#sKey').value.trim()}); G._modelOkAt = 0; toast('Сохранено'); back2set(s); }; };
const kreaSheet = () => { const ks = G.kreaSettings(); let kmode = ks.mode;
  const s = sheet(`<div class="sh-h"><div><h2>Картинки — Krea</h2><p class="sub">Вручную — Гриди скопирует текст для картинки и откроет app. Свой ключ — сам запустит app и положит картинку в блок</p></div><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="seg wide" id="sKMode"><button data-v="manual" class="${kmode !== 'api' ? 'on' : ''}">Вручную</button><button data-v="api" class="${kmode === 'api' ? 'on' : ''}">Свой ключ</button></div>
      <div id="sKApi" ${kmode === 'api' ? '' : 'hidden'}><label class="lbl" for="sKKey">Ключ API Krea — хранится только в этом браузере</label><input class="in" id="sKKey" type="password" value="${e(ks.key)}" autocomplete="off"></div>
      ${(G.lib.settings().krea || []).map(k => `<label class="lbl" for="sK${e(k.size)}">${e(k.name)} · ${e(k.size)}</label><textarea class="ta krea-in" id="sK${e(k.size)}" data-kr="${e(k.size)}" rows="2" placeholder="Ссылка на app или пример запроса со страницы API app">${e(k.url || '')}</textarea><p class="hint krea-st" data-krs="${e(k.size)}"></p>`).join('')}</div>
    <div class="sh-f"><button class="pill pri wide" id="sOk">Сохранить</button></div>`, {cls: 'tall'});
  s.$$('#sKMode button').forEach(b => b.onclick = () => { kmode = b.dataset.v; s.$$('#sKMode button').forEach(x => x.classList.toggle('on', x === b)); s.$('#sKApi').hidden = kmode !== 'api'; });
  s.$$('[data-kr]').forEach(x => { const st0 = s.$(`[data-krs="${x.dataset.kr}"]`), upd = () => { st0.textContent = kreaNote(x.value); }; upd(); x.oninput = upd; });
  s.$('#sOk').onclick = () => { G.ls.set('krea', {mode: kmode, key: s.$('#sKKey').value.trim()});
    const urls = {}; s.$$('[data-kr]').forEach(x => { if (x.value.trim()) urls[x.dataset.kr] = x.value.trim(); }); G.ls.set('settings', {...G.ls.get('settings', {}), kreaUrls: urls});
    toast('Сохранено'); back2set(s); }; };
/* сброс: всё, что Гриди хранит в этом браузере. Перед сбросом можно скачать итоги пилота */
const resetSheet = () => { const s = sheet(`<div class="sh-h"><div><h2>Сбросить данные?</h2><p class="sub">Удалятся страницы, ключи модели и Krea, свои шаблоны, сценарии и промты в этом браузере. Встроенная библиотека останется. Отменить нельзя</p></div><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="list"><button class="row ic" id="rPilot">${I.out}<span><b>Сначала скачать итоги пилота</b><small>Архив без текстов страниц</small></span></button></div></div>
    <div class="sh-f"><button class="pill wide danger" id="rGo">Сбросить всё</button></div>`);
  s.$('#rPilot').onclick = async () => { try { await G.pilotExport(false); toast('Архив итогов скачан'); } catch (err) { toast(err.message); } };
  s.$('#rGo').onclick = async () => { try { Object.keys(localStorage).filter(k => k.startsWith(G.NS + '.')).forEach(k => localStorage.removeItem(k)); } catch (err) {}
    try { await new Promise(res => { const r = indexedDB.deleteDatabase(G.NS); r.onsuccess = r.onerror = r.onblocked = () => res(); }); } catch (err) {}
    location.hash = ''; location.reload(); }; };

/* 2. Редактор */
const editor = () => {
  if (cat) { const h = cat; cat = null; h.close(true); } document.body.classList.remove('picking');
  const sc0 = document.getElementById('eMain'), y0 = sc0 ? sc0.scrollTop : 0, p = A.page, b = A.sel && p.blocks.find(x => x.id === A.sel), v = b && verdict(b);
  const miss = p.blocks.length ? report(p).count : 0;
  const title = `<b>${e(p.name)}</b><small>${e(sc().name)}${(n => n ? ' · ' + (n < 1000 ? n + ' знаков' : (n / 1000).toFixed(1).replace('.0', '') + 'k знаков') : '')(G.len(p.blocks.map(x => x.text).join('')))}</small>`;
  $app.innerHTML = `<header class="hd" id="eHd"><div class="hd-edit"><div class="hfield" id="eField"></div><button class="ib round ok" id="eOk" aria-label="Готово">${I.check}</button></div>
    <button class="ib round" id="eBack" aria-label="Назад">${I.back}</button><button class="ttl" id="eTtl">${title}</button>
      <button class="ib round" id="eMemo" aria-label="Как писать текст" title="Как писать текст">${I.note}</button>${p.blocks.length && A.mode === 'page' && G.designChoices(p) ? `<button class="ib round" id="eAlt" aria-label="Другой дизайн" title="Другой дизайн: другие шаблоны того же смысла">${I.shuffle}</button>` : ''}${p.blocks.length ? `<button class="ib round" id="ePrev" aria-label="Превью">${I.eye}</button>
      <button class="ib round dark" id="eOut" aria-label="Выгрузка">${I.out}${miss ? `<span class="badge ${report(p).grade.level}">${miss}</span>` : ''}</button>` : `<button class="ib round" id="eTune" aria-label="Настройки страницы">${I.tune}</button>`}</header>
    <main id="eMain"></main><div class="dock" id="eDock"><div id="eDockMain"><div class="bar"><div id="eAct"></div><i class="bar-div" aria-hidden="true"></i><div id="eSw"></div></div></div></div>`;
  $app.querySelector('#eBack').onclick = () => { if (A.sel) { unselect(); return; } save(); go('home'); };
  $app.querySelector('#eTtl').onclick = () => { if (!A.sel) pageSettings(); };
  $app.querySelector('#eOk').onclick = () => { const a = document.activeElement; if (a && a.blur) a.blur(); getSelection().removeAllRanges(); fmtSync(); };
  const tn = $app.querySelector('#eTune'); if (tn) tn.onclick = pageSettings;
  const pv = $app.querySelector('#ePrev'); if (pv) pv.onclick = () => preview();
  /* «Другой дизайн»: следующий вариант шаблонов внутри семейства, без модели; закреплённые вручную не трогаем */
  const alt = $app.querySelector('#eAlt'); if (alt) alt.onclick = () => { p.seed = (p.seed || 0) + 1; G.autoPick(p); save(); editor(); toast('Другие шаблоны того же смысла. Текст не влезает — «Поправить» в выгрузке.'); };
  $app.querySelector('#eMemo').onclick = () => memo();
  const out = $app.querySelector('#eOut'); if (out) out.onclick = exportView;
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
  sw.innerHTML = `<div class="sw"><button class="ib sw-ai" id="eAI" aria-label="ИИ" title="ИИ: пересобрать страницу, свой запрос">${I.ai}</button><div class="seg slide ${A.mode === 'page' ? 'r' : ''}" role="tablist"><button data-m="note" aria-label="Текст" title="Текст: смысл и структура">${I.note}</button><button data-m="page" aria-label="Шаблоны" title="Шаблоны: дизайн">${I.page}</button></div></div>`;
  sw.querySelector('#eAI').onclick = ev => { ev.stopPropagation(); aiSheet(); };
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
  const blocks = p.blocks.filter(b => b.role !== 'unparsed' && !G.isEmpty(b)).map(b => { const t = G.tpl(b.tpl), s = G.src(b); return {kind: b.role === 'hero' ? 'hero' : G.isCta(b) ? 'cta' : 'grid', navi: false, title: s.level === 'h3' || s.level === 'h1' ? '' : s.title || '', html: `<section class="blk">${blockHTML(b, p)}</section>`}; });
  const cta = p.blocks.find(b => G.isCta(b)), cs = cta ? G.src(cta) : {};
  return {type: 'gridi:page', cat: {id: 'g-' + p.id, name: hs.title || p.name, goal, lead: hs.lead || '', meta: (hs.meta || [])[0] || ''},
    fill: {overlay: true, name: hs.title || p.name, goal, blocks, program: [], programTitle: '',
      hero: {title: hs.title || '', lead: hs.lead || '', badge: (hs.meta || [])[0] || '', btn: (hs.cta || [])[0] || ''},
      cta: {title: cs.title || '', text: cs.lead || '', btn: (cs.cta || [])[0] || ''}},
    css: G.WIRE_CSS + '.wf-miss,.wf-item-miss{display:none!important}'}; };
const DEV = [['mob', 375, 'Телефон', '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2"/></svg>'], ['desk', 1440, 'Компьютер', '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M9 20h6"/></svg>']];
const preview = (p = A.page, shared = null) => {
  G.autoPick(p);
  let dev = G.ls.get('dev', innerWidth >= 900 ? 'desk' : 'mob'); if (!DEV.some(x => x[0] === dev)) dev = 'mob';
  const el = document.createElement('div'); el.className = 'pv pvn';
  el.innerHTML = `<header class="hd">${shared ? '<button class="pill sm pri" id="pvOpen" title="Сохранить страницу себе и открыть в редакторе">Открыть в Гриди</button><span class="grow"></span>' : `<button class="ib round" id="pvX" aria-label="Закрыть">${I.x}</button><div class="ttl"><b>Превью</b><small>${e(p.name)}</small></div>`}
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
  const shut = () => { removeEventListener('message', onMsg); removeEventListener('resize', onRes); el.remove(); document.body.classList.remove('noscroll'); };
  const px = el.querySelector('#pvX'); if (px) px.onclick = shut;
  const po = el.querySelector('#pvOpen'); if (po) po.onclick = async () => { const r = shared(); shut(); await G.store.put(r.page); history.replaceState(null, '', '#/p/' + r.page.id); await go('edit', r.page.id);
    toast(['Страница сохранена у вас — можно править', r.scAdded ? 'сценарий автора добавлен в библиотеку' : '', r.tpls ? G.num(r.tpls, 'шаблон', 'шаблона', 'шаблонов') + ' автора — только для этой страницы' : ''].filter(Boolean).join(' · ')); };
};

/* настройки страницы: название и сценарий */
const pageSettings = () => {
  const p = A.page, all = G.lib.all('scenarios');
  const s = sheet(`<div class="sh-h"><h2>Страница</h2><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><label class="lbl" for="psName">Название</label><input class="in" id="psName" value="${e(p.name)}">
    <p class="lbl">Сценарий</p><div class="chips" id="psSc">${all.map(x => `<button class="chip ${x.id === p.scenario ? 'on' : ''}" data-id="${e(x.id)}">${e(x.name)}</button>`).join('')}</div>
    ${p.blocks.length ? '<p class="hint">Сценарий — какие блоки обычно есть на такой странице. Роли общие: при смене сценария блоки и текст остаются.</p>' : ''}</div>
    <div class="sh-f"><button class="pill pri wide" id="psOk">Готово</button></div>`);
  let scId = p.scenario;
  s.$$('#psSc .chip').forEach(c => c.onclick = () => { scId = c.dataset.id; s.$$('#psSc .chip').forEach(x => x.classList.toggle('on', x === c)); });
  s.$('#psOk').onclick = () => { p.name = s.$('#psName').value.trim() || p.name; if (scId !== p.scenario && p.blocks.every(G.isEmpty)) { p.scenario = scId; p.blocks = (G.scenario(scId).roles || []).map(r => G.newBlock(r.id, '')); G.autoPick(p); }
    else if (scId !== p.scenario) { p.scenario = scId; const roles = G.allRoles(G.scenario(scId)).map(r => r.id); p.blocks.forEach(b => { if (!roles.includes(b.role) && b.role !== 'hero' && b.role !== 'cta') b.role = defRole(); b.tplLock = false; repick(b); }); } save(); s.close(); editor(); };
};

/* 2а. Пустая страница: вставить текст и собрать */
/* новая страница открывается сразу редактором строк, как «Текст»: вставка из документа размечается сама,
   вид строки правится той же панелью. Памятка по разметке не нужна — неверную разметку поправит модель при сборке */
/* 2а'. Разбор — экран загрузки. Модель не подключена — промт и ответ здесь же, вторым шагом.
   Страница сохраняется только после разбора; отмена — назад к тексту, текст на месте. */
const build = async text => {
  const p = A.page; text = String(text || '').trim(); if (!text) return toast('Сначала напишите или вставьте текст.');
  /* пересборка: отмена возвращает страницу как была */
  const prev = G.clone(p.blocks), back = () => { p.blocks = prev; editor(); };
  p.text = text;
  if (isShare(text)) { fromShare(p, text); return done(p); }
  /* В-правила: разметка по форме строк при вставке — один раз, видна в «Тексте» */
  const pm = G.premark(text); p.text = text = pm.text;
  /* сборка — три шага: разбор (модель), шаблоны (код, по семейству роли), укладка (модель; не нужна, если текст сохраняется как есть) */
  const main = $app.querySelector('#eMain'), dock = $app.querySelector('#eDock'); dock.innerHTML = '';
  /* «Сохранить текст как есть» больше нет: пересборка всегда укладывает текст в шаблоны */
  delete p.verbatim; const asks = 2; let askN = 0;
  main.innerHTML = `<div class="ld"><h2>Собираем страницу</h2><ol class="ld-st">
      <li data-s="1" class="on">Разбираем текст на блоки <small class="ldT"></small></li><li data-s="2">Подбираем шаблоны</li><li data-s="3">Укладываем текст в шаблоны <small class="ldT"></small></li></ol>
    <div id="ldX"></div><button class="pill ghost" id="ldCancel">Отменить</button></div>`;
  const st = (n, cls) => { const li = main.querySelector(`[data-s="${n}"]`); if (li) li.className = cls; };
  let ctl = new AbortController(), manualRej = null, cancelled = false;
  main.querySelector('#ldCancel').onclick = () => { cancelled = true; ctl.abort(); if (manualRej) manualRej(new Error('cancel')); };
  const ui = G.ui, keep = {busy: ui.busy, manualAsk: ui.manualAsk};
  ui.busy = () => { G._askEl = main.querySelector('.ld'); const el = main.querySelector('.ld-st .on .ldT'), t0 = Date.now(), tm = setInterval(() => { if (el) el.textContent = Math.round((Date.now() - t0) / 1000) + ' с'; }, 1000);
    ctl = new AbortController(); const h = {signal: ctl.signal, timedOut: false, done: () => clearInterval(tm)}; setTimeout(() => { if (!h.signal.aborted) { h.timedOut = true; ctl.abort(); } }, 240000); return h; };
  ui.manualAsk = (label, prompt) => new Promise((res, rej) => { manualRej = rej; askN++; const x = main.querySelector('#ldX'); G._askEl = main.querySelector('.ld');
    x.innerHTML = `<div class="ld-man"><p><b>Шаг ${askN} из ${asks}.</b> Модель не подключена: скопируйте промт, отправьте в свою модель и вставьте ответ.</p>
      <button class="pill pri" id="mCopy">Скопировать промт</button> <span class="hint">${prompt.length.toLocaleString('ru-RU')} зн.</span>
      <textarea class="ta" id="mAns" rows="5" placeholder="Ответ модели целиком"></textarea><p class="hint err" id="mErr"></p>
      <button class="pill pri wide" id="mOk">Продолжить</button></div>`;
    x.querySelector('#mCopy').onclick = async () => { await G.copy(prompt); toast('Промт скопирован'); };
    x.querySelector('#mOk').onclick = () => { const v = x.querySelector('#mAns').value; if (!G.parseJSON(v)) { x.querySelector('#mErr').textContent = 'В ответе нет JSON. Попросите модель: «верни только JSON».'; return; } x.innerHTML = ''; res(v); }; });
  const mine = {busy: ui.busy, manualAsk: ui.manualAsk};
  let j = null, note = '', parseErr = false;
  try { j = await G.ask('Разбор: ' + sc().name, G.parsePrompt(p)); }
  catch (err) { if (cancelled || err.message === 'cancel') { Object.assign(ui, keep); return back(); } parseErr = true; note = `Модель не разобрала текст: ${err.message} Страница собрана по разметке — можно собрать заново.`; }
  if (cancelled) { Object.assign(ui, keep); return back(); }
  st(1, 'done'); st(2, 'on');
  const r = G.applyParse(p, j);
  /* что чинится без модели — сразу: только порядок блоков и разметка, слова не меняются (Ф1–Ф5); шаблоны — по семейству роли (П9) */
  const fixed = G.fixByCode(p); G.autoPick(p);
  st(2, 'done'); st(3, 'on');
  /* укладка — один запрос на страницу; отмена или ошибка не теряют разбор: текст можно уложить позже из меню ИИ */
  let fitNote = '';
  if (!parseErr) { Object.assign(ui, mine); cancelled = false;
    try { await G.runAdapt(p, 'fit'); }
    catch (err) { fitNote = cancelled || err.message === 'cancel' ? 'Текст не уложен в шаблоны — уложить можно в меню ИИ.' : `Текст не уложен: ${err.message} Уложить можно в меню ИИ.`; } }
  Object.assign(ui, keep);
  if (j && !r.byModel) note = 'Модель разобрала плохо — страница собрана по разметке. Можно собрать заново другой моделью.';
  if (!r.byModel && !/^\s*\[h[12]\]/im.test(text)) note = (note ? note + ' ' : '') + 'Разметки разделов в тексте нет, поэтому без модели страница собрана почти одним блоком. Соберите заново или отметьте заголовки разделов.';
  else if (pm.used.length && !note) note = 'Гриди разметил при вставке: ' + pm.used.map(k => ({'В2': 'списки без маркеров', 'В3': 'кнопки со ссылкой'})[k]).join(', ') + ' — проверьте в «Тексте».';
  if (r.markFixes) note = (note ? note + ' ' : '') + `Модель поправила разметку в ${G.num(r.markFixes, 'строке', 'строках', 'строках')} — замечание сверху.`;
  if (fixed) note = (note ? note + ' ' : '') + `Гриди сам поправил ${G.num(fixed, 'место', 'места', 'мест')}: порядок блоков и то, что не встало в шаблон, — без изменения текста.`;
  if (r.lost) note = (note ? note + ' ' : '') + `Модель пропустила ${G.num(r.lost, 'строку', 'строки', 'строк')} — Гриди вернул их на место, к соседним строкам.`;
  if (fitNote) note = (note ? note + ' ' : '') + fitNote;
  done(p, note);
};
const done = async (p, note) => {
  if (p.name === 'Без названия') { const h = p.blocks.find(b => b.role === 'hero'); const t = h && G.src(h).title; if (t) p.name = t.slice(0, 80); }
  A.mode = 'page'; await G.store.put(p); editor();
  const R = report(p).rows, fixN = R.stop.length + R.fit.length; toast(note || `Готово: ${G.num(p.blocks.length, 'блок', 'блока', 'блоков')}${fixN ? ' · ' + G.num(fixN, 'блок', 'блока', 'блоков') + ' поправить' : ''}${R.hint.length ? ' · ' + G.num(R.hint.length, 'подсказка', 'подсказки', 'подсказок') : ''}`);
};

/* 2б. Заметки: блоки — линии с ролью, строки — разметка */
/* серый пример в пустом блоке — что сюда писать по роли; в «Шаблонах» тот же пример виден в шаблоне */
const ghostPh = b => G.ghostText(G.roleOf(sc(), b.role), sc()).split('\n').map(l => { const x = G.lineKind(l); return x.k === 'li' ? '• ' + x.t : x.k === 'btn' ? '▸ ' + x.t : x.k === 'img' ? '▣ ' + x.t : x.t; }).join('\n');
/* пустой блок начинается с той строки, что в примере: первый экран — с H1, раздел — с H2 */
const firstKind = b => { const k = G.lineKind(G.ghostText(G.roleOf(sc(), b.role), sc()).split('\n')[0]).k; return /^h[123]$/.test(k) ? k : 'p'; };
const notes = () => {
  const p = A.page, main = $app.querySelector('#eMain'), iss = report(p).byBlock;
  if (!p.blocks.length) { main.innerHTML = `<div class="note">${empty('На странице нет блоков', 'Добавьте первый блок ниже или вставьте текст заново.')}${addChips()}</div>`; bindAdd(main); return; }
  main.innerHTML = `<div class="note">${p.blocks.map((b, i) => `<section class="nb" data-id="${e(b.id)}">
      <button class="nb-line ${iss[b.id] ? 'warn' : ''}" data-role="${e(b.id)}"><b class="bn">${i + 1}</b><span>${e(roleName(b))}</span>${mediaHint(b)}${blockNote(b, p, true) ? `<em class="nb-note">${e(blockNote(b, p, true))}</em>` : ''}</button>
      <div class="ed ${G.isEmpty(b) ? 'is-empty' : ''}" contenteditable="true" spellcheck="true" data-id="${e(b.id)}" data-ph="${e(ghostPh(b))}">${(lines(b.text).length ? lines(b.text) : [{k: firstKind(b), t: ''}]).map(l => lineHTML(l.k, l.t)).join('')}</div>${tipPlate(b, p)}</section>`).join('')}
    ${tipPlate(null, p)}${addChips()}</div>`;
  main.querySelectorAll('.ed').forEach(bindEd); bindAdd(main); bindTips(main);
  main.querySelectorAll('[data-role]').forEach(x => x.onclick = ev => { ev.stopPropagation(); if (A.sel === x.dataset.role) { unselect(); return; } const a = document.activeElement; if (a && a.blur) a.blur(); select(x.dataset.role); });
  main.addEventListener('focusin', ev => { if (A.sel && ev.target.closest('.ed')) unselect(); });
  main.onclick = ev => { if (A.sel && !ev.target.closest('.nb-line,.add,.sel-float')) unselect(); };
  fmtBar();
};

/* картинка из шаблона: в тексте её нет, слот даёт шаблон — подпись на линии блока, чтобы не было сюрприза на странице */
const mediaHint = b => { const t = G.tpl(b.tpl); if (G.isEmpty(b)) return '<em class="nb-m">пусто — на страницу не попадёт</em>'; if (!t || !t.media || lines(b.text).some(l => l.k === 'img')) return '';
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
  ed.classList.toggle('is-empty', G.isEmpty(b));
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
    /* вставка размечается как при сборке: списки без маркеров, кнопки со ссылкой, подписи — в пункты */
    const ls = G.premark(txt).text.split(/\r?\n/).map(x => x.trim()).filter(Boolean); if (!ls.length) return;
    /* первая строка в пустую строку — с её разметкой: «[h1] Заголовок» становится заголовком, а не текстом со скобками */
    const c0 = curLine(), x0 = parseLine(ls[0]);
    if (c0 && !c0.textContent.trim() && x0.k !== 'p') { setKind(c0, x0.k); document.execCommand('insertText', false, x0.t); } else document.execCommand('insertText', false, ls[0]);
    let at = curLine(); ls.slice(1).forEach(l => { const x = parseLine(l), nl = mkLine(x.k, x.t); at.after(nl); at = nl; });
    if (ls.length > 1) caretTo(at, at.textContent.length);
    sync(ed);
    /* вставили документ с разделами — сразу блоки по заголовкам, без модели; пустые блоки маски уходят */
    if (ls.filter(l => /^h[12]$/.test(G.lineKind(l).k)).length >= 2) splitPasted(ed);
  });
};

const splitPasted = ed => { const p = A.page, b = blockOf(ed); if (!b) return;
  const tmp = G.newPage('', p.scenario, b.text); G.assemble(tmp); if (tmp.blocks.length < 2) return;
  const i = p.blocks.indexOf(b); p.blocks.splice(i, 1, ...tmp.blocks);
  if (tmp.blocks.length >= 3) p.blocks = p.blocks.filter(x => !G.isEmpty(x));
  if (!p.text) p.text = tmp.text; if (p.name === 'Без названия') { const h = p.blocks.find(x => x.role === 'hero'), t = h && G.src(h).title; if (t) p.name = t.slice(0, 80); }
  G.autoPick(p); save(); A.sel = null; editor();
  toast(`Текст разделён на ${G.num(tmp.blocks.length, 'блок', 'блока', 'блоков')} по заголовкам. Точнее — «ИИ → Пересобрать страницу»`); };
/* панель разметки над клавиатурой: вид строки и разделить блок */
let fmtEl = null;
const fmtBar = (into) => {
  if (fmtEl) fmtEl.remove();
  fmtEl = document.createElement('div'); fmtEl.className = 'fmt'; fmtEl.hidden = true;
  /* роли строки — в шапке на месте названия, рядом ✓: клавиатура их не закрывает */
  fmtEl.innerHTML = `<div class="fmt-in"><div class="fmt-row">${KINDS.filter(x => x.k !== 'meta').map(x => `<button data-k="${x.k}" aria-label="${e(x.label || x.g)}"><i>${e(x.g || 'Аа')}</i>${x.label && x.k !== 'p' ? `<span>${e(x.label)}</span>` : ''}</button>`).join('')}<button data-split><i>${I.cut}</i><span>Разделить</span></button></div><button class="ib round ok" data-done aria-label="Готово">${I.check}</button></div>`;
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
  const sp = fmtEl.querySelector('[data-split]'); sp.hidden = !!document.querySelector('.sh-wrap') || !A.page || !A.page.blocks.length;
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
const blockHTML = (b, p, t = G.tpl(b.tpl), bare) => { try { return blockHTML0(b, p, t, bare); } catch (err) { console.error('Блок не отрисовался', b, err); return `<div class="wf-page"><section class="wf wf-none"><div class="wf-empty">Блок не отрисовался: ${e(err.message)}</div></section></div>`; } };
const blockHTML0 = (b, p, t, bare) => {
  /* пустой блок — маска: пример роли в шаблоне, серым */
  if (!b.text.trim()) { const gb = G.ghostBlock(b, p), gt = t || (G.rank(gb, p)[0] || {}).t; return gt ? `<div class="wf-page wf-ghost">${G.wireBlock(gt, G.autoFill(gb, gt, p), {})}</div>` : `<div class="wf-page">${empty('Пустой блок', 'Добавьте текст — шаблон подберётся сам.')}</div>`; }
  if (!t) return `<div class="wf-page">${empty('Шаблон не подобран', 'Под такой текст шаблона нет. Измените текст или выберите шаблон вручную.')}</div>`;
  const plan = rowsPlan(b, t);
  /* что не встало в поля шаблона — не пропадает: серой полосой под блоком, с «Вынести в отдельный блок» */
  const lostHTML = v => { const L = G.leftovers(b, t, v || {}); return L.length ? `<div class="wf-lost"><b>Не встало в шаблон</b>${L.map(x => `<p>${e(x)}</p>`).join('')}<button class="pill sm" data-lost="${e(b.id)}">Вынести в отдельный блок</button></div>` : ''; };
  if (!plan) { const v = t && (t.id === b.tpl ? G.values(b, p) : G.autoFill(b, t, p)); return `<div class="wf-page">${G.wireBlock(t, v, G.wireImgs(b, t))}</div>${!bare && t.id === b.tpl ? lostHTML(v) : ''}`; }
  const all = G.autoFill(b, {...t, items: {...t.items, n: G.src(b).items.length}}, p), imgs = G.wireImgs(b, t); let at = 0;
  return plan.map((k, i) => { const tt = sibling(t, k), v = {...all, top: i ? {} : all.top, head: i ? undefined : all.head, items: all.items.slice(at, at + k)};
    const im = {}; for (let j = 0; j < k; j++) if (imgs['i' + (at + j)]) im['i' + j] = imgs['i' + (at + j)]; if (!i && imgs.main) im.main = imgs.main; at += k;
    return `<div class="wf-page${i ? ' wf-row-next' : ''}">${G.wireBlock(tt, v, im)}</div>`; }).join('');
};

/* 2в. Страница: тот же текст в шаблонах */
const canvas = () => {
  const p = A.page, main = $app.querySelector('#eMain'), iss = report(p).byBlock;
  main.innerHTML = `<div class="cv">${p.blocks.map((b, i) => `<div class="cb ${A.sel === b.id ? 'sel' : ''} ${iss[b.id] ? 'warn' : ''}" data-id="${e(b.id)}">${bn(b, i)}${blockHTML(b, p)}</div>${tipPlate(b, p)}`).join('')}${tipPlate(null, p)}${addChips()}</div>`;
  main.querySelectorAll('.cb').forEach(x => x.onclick = ev => { ev.stopPropagation(); if (A.sel) { unselect(); return; } select(x.dataset.id); });
  /* клик мимо блока снимает выбор */
  main.onclick = ev => { if (A.sel && !ev.target.closest('.cb,.add,.sel-float')) unselect(); };
  bindAdd(main); bindTips(main); bindLost(main);
};
const bindLost = root => root.querySelectorAll('[data-lost]').forEach(x => x.onclick = ev => { ev.stopPropagation(); const n0 = A.page.blocks.length; G.fixByCode(A.page); G.autoPick(A.page); save(); editor(); toast(A.page.blocks.length > n0 ? 'Текст вынесен в отдельный блок' : 'Не получилось вынести — поправьте текст или выберите другой шаблон'); });
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
const redrawBlock = b => { if (A.mode === 'note') { const id = A.sel; notes(); if (id) select(id); const bd = $app.querySelector('#eOut .badge'), r = report(A.page); if (bd) { bd.textContent = r.count; bd.hidden = !r.count; bd.className = 'badge ' + r.grade.level; } return; } const el = $app.querySelector(`.cb[data-id="${b.id}"]`); if (!el) return; const r = report(A.page);
  el.innerHTML = bn(b, A.page.blocks.indexOf(b)) + blockHTML(b, A.page); el.classList.toggle('warn', !!r.byBlock[b.id]);
  const nx = el.nextElementSibling; if (nx && nx.classList.contains('tips')) nx.remove(); el.insertAdjacentHTML('afterend', tipPlate(b, A.page)); bindTips(el.parentElement); bindLost(el);
  const bd = $app.querySelector('#eOut .badge'); if (bd) { bd.textContent = r.count; bd.hidden = !r.count; bd.className = 'badge ' + r.grade.level; }
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
    else toast(`«${P.name}»: модель не вернула изменений для этого блока — попробуйте ещё раз или другую модель`);
  } catch (err) { if (err.message !== 'cancel') toast(err.message); }
  finally { G.adaptable = adp; if (G._tplIndex) delete G._tplIndex.__free; if (b.tpl === '__free') { b.tpl = keep.tpl; b.tplLock = keep.lock; } } };
/* панель выделенного блока. Текст — смысл и структура, Шаблоны — дизайн; каждое действие в одном месте, «Ещё» — что не влезло */

/* панель выделенного блока — иконки в общей плашке с переключателем.
   Везде: ИИ, выше, ниже, «Ещё» (добавить сверху, снизу, удалить). Текст — роль; Шаблоны — каталог и картинки, если они есть в шаблоне. */
const selBar = () => {
  const p = A.page, b = p.blocks.find(x => x.id === A.sel), dock = $app.querySelector('#eAct'); if (!b || !dock) return;
  document.body.classList.add('has-sel');
  const i = p.blocks.indexOf(b), slots = G.imageSlots(b, p), icons = iconSlots(b), T = A.mode === 'note', hot = G.fixNotes(b, p).length;
  const acts = [...(T ? [['role', I.tag, 'Роль']] : [['cat', sd('CardstackHoriz', I.grid), 'Шаблон'], ...(slots.length ? [['img', I.img, 'Картинки']] : icons.length ? [['img', sd('StarCircle', I.icons), 'Иконки']] : [])]),
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
/* ИИ — одно окно из переключателя. Мало действий: пересобрать страницу, свой запрос, уложить в шаблоны, свои промты.
   Если блок выделен — сверху выбор: вся страница или этот блок. Данные для запроса спрашиваются при запуске */
const aiSheet = () => {
  const p = A.page, selB = (A.sel && p.blocks.find(x => x.id === A.sel)) || null; let b = selB;
  const own = G.lib.all('prompts').filter(y => y.stage === 'adapt' && !y.system).map(y => [y.id, y.name, y.description || '']);
  const list = () => b ? [['rewrite', 'Свой запрос', 'Напишите, что сделать с текстом блока: короче, проще, другой тон…'],
      ...(!G.isEmpty(b) && G.adaptable(b, G.prompt('fit'), p) ? [['fit', 'Уложить в шаблон', 'Сократит и разложит текст по полям шаблона']] : []),
      ['write', 'Придумать текст', G.isEmpty(b) ? 'Напишет текст блока по смыслу остальной страницы' : 'Напишет текст блока заново по смыслу страницы'], ...own]
    : [['rebuild', 'Пересобрать страницу', 'Модель заново разделит весь текст на блоки, подберёт шаблоны и уложит текст — порядок и шаблоны могут поменяться', 'hot'],
      ['rewrite', 'Свой запрос', 'Напишите, что сделать с текстом страницы: короче, проще, другой тон…'],
      ['fit', 'Уложить в шаблоны', 'Сократит и разложит текст блоков, которые не влезают'], ...own];
  const s = sheet('', {cls: 'tall'});
  const draw = () => { s.set(`<div class="sh-h"><div><h2>ИИ</h2><p class="sub">${b ? `${p.blocks.indexOf(b) + 1}. ${e(roleName(b))}` : 'Вся страница'}</p></div><button class="ib" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b">${selB ? `<div class="seg wide" id="aiSc"><button data-v="page" class="${b ? '' : 'on'}">Вся страница</button><button data-v="block" class="${b ? 'on' : ''}">${p.blocks.indexOf(selB) + 1}. ${e(roleName(selB))}</button></div>` : ''}
      <div class="list">${list().map(([id, n, d, cls]) => `<button class="row ${cls || ''}" data-p="${e(id)}"><b>${e(n)}</b>${d ? `<small>${e(d)}</small>` : ''}</button>`).join('')}</div>
      <p class="hint">Свои промты — в библиотеке, раздел «Промты».</p></div>`);
    s.$$('#aiSc button').forEach(x => x.onclick = () => { b = x.dataset.v === 'block' ? selB : null; draw(); });
    s.$$('[data-p]').forEach(x => x.onclick = () => { const id = x.dataset.p; s.close(true);
      aiRun(b, id).catch(err => { console.error(err); if (err.message !== 'cancel') toast('Не получилось: ' + err.message); }); }); };
  draw(); };
/* запуск одного действия ИИ: свой запрос и промты по разметке — для любого блока; поля шаблона — только fit и write */
const aiRun = async (b, id) => { const p = A.page, P = G.prompt(id);
  if (id === 'rebuild') return build(p.blocks.map(x => x.text).filter(t => t.trim()).join('\n'));
  if (b && (id === 'fit' || id === 'write' || P.input === 'fields')) return runPrompt(b, id);
  let vals = {}; if (P && P.ask && P.ask.length) { vals = await askVals(P); if (!vals) return; }
  if (id === 'rewrite' || P.input === 'markup') {
    const r = await G.runMarkup(p, id, b ? [b.id] : null, vals);
    p.blocks.forEach(x => { if (x.valuesBy === 'rewrite') { repick(x); x.valuesBy = null; } }); save(); editor();
    return toast(r.n ? `«${P.name}»: изменено ${G.num(r.n, 'блок', 'блока', 'блоков')}${r.kept ? ` · ${G.num(r.kept, 'кнопку или строку таблицы', 'кнопки или строки таблицы', 'кнопок или строк таблицы')} Гриди вернул как было` : ''}` : `«${P.name}»: модель ничего не изменила`); }
  const n = await G.runAdapt(p, id, null, vals); G.autoPick(p); save(); editor();
  toast(n ? `«${P.name}»: обновлено ${G.num(n, 'блок', 'блока', 'блоков')}` : `«${P.name}»: модель ничего не изменила`); };
/* роль блока в режиме текста: что это за часть страницы — от неё зависят подходящие шаблоны */
/* роли для выбора: сначала роли сценария, потом общие роли того же вида страницы */
const roleList = () => G.allRoles ? G.allRoles(sc()) : (sc().roles || []);
const setRole = (b, r) => { if (b.role === r) return false; b.role = r; b.tpl = null; b.tplLock = false; b.values = null; repick(b); save(); return true; };
/* роль — что это за часть страницы. Сначала роли сценария, остальные общие — свёрнуты в «Другие» */
const roleSheet = b => { const p = A.page, roles = roleList(), own = (sc().roles || []).length;
  const row = r => `<button class="row rr ${r.id === b.role ? 'on' : ''}" data-r="${e(r.id)}"><span><b>${e(r.name.split(':')[0])}</b>${r.meaning ? `<small>${e(r.meaning)}</small>` : ''}</span>${r.id === b.role ? I.check : ''}</button>`;
  const more = roles.slice(own), moreOn = more.some(r => r.id === b.role);
  const s = sheet(`<div class="sh-h"><div><h2>Роль блока</h2><p class="sub">Что это за часть страницы. От роли зависят шаблоны и проверка «чего не хватает»</p></div><button class="ib round ok" data-close aria-label="Готово">${I.check}</button></div>
    <div class="sh-b"><p class="lbl">Обычно на странице «${e(sc().name)}»</p><div class="list">${roles.slice(0, own).map(row).join('')}</div>
    ${more.length ? `<details class="more-roles" ${moreOn ? 'open' : ''}><summary class="lbl">Другие · ${more.length}</summary><div class="list">${more.map(row).join('')}</div></details>` : ''}</div>`, {cls: 'tall'});
  s.$$('[data-r]').forEach(x => x.onclick = () => { setRole(b, x.dataset.r); s.close(); A.mode === 'note' ? notes() : canvas(); select(b.id); }); };
/* каталог шаблонов: категории по типу, сначала подходящие, у каждого — почему не подходит */
const catalog = () => {
  const p = A.page, b = p.blocks.find(x => x.id === A.sel); if (!b) return;
  const i = p.blocks.indexOf(b); let ranked = [], types = [];
  const rerank = () => { ranked = G.rank(b, p); types = []; ranked.forEach(r => { const t = tplLabel(r.t).type; if (!types.includes(t)) types.push(t); }); };
  rerank();
  /* подходящих нет — открыть категорию текущего шаблона, а не пустой экран */
  const tab0 = () => ranked.some(r => (r.tier || 0) <= 1) || !b.tpl || !G.tpl(b.tpl) ? 'fit' : tplLabel(G.tpl(b.tpl)).type;
  let tab = tab0();
  /* карточка: превью, название и одна метка; параметры шаблона и что поменять — во всплывающей подсказке */
  const card = r => { const l = tplLabel(r.t), w = why(r), tier = r.tier || 0, bad = tier >= 2, live = G.isLive(r.t);
    const tag = !live ? 'Нужен дизайн' : G.TIERS[tier], tip = [l.name, l.sub, tier ? G.TIERS[tier] + (w ? ': ' + w : '') : '', !live ? 'шаблона нет в админке' : ''].filter(Boolean).join(' · ');
    return `<button class="tc ${r.t.id === b.tpl ? 'on' : ''} ${bad ? 'dim' : ''}" data-t="${e(r.t.id)}" title="${e(tip)}"><div class="tc-pv">${blockHTML(b, p, r.t, true)}${r.t.id === b.tpl ? `<i class="tc-ok">${I.check}</i>` : ''}</div>
      <span class="tc-n">${e(l.name)}</span><span class="tc-v ${bad || !live ? 'bad' : ''} ${!tier && live ? 'ok' : ''}">${e(tag)}</span></button>`; };
  const list = () => tab === 'fit' ? ranked.filter(r => (r.tier || 0) <= 1) : ranked.filter(r => tplLabel(r.t).type === tab);
  const draw = () => { const L = list();
    cat.set(`<div class="sh-h"><div><h2>Шаблон · ${i + 1}. ${e(roleName(b))}</h2><p class="sub">${ranked.length} шаблонов</p></div><button class="ib round ok" data-close aria-label="Готово">${I.check}</button></div>
      <div class="cat-tabs">${[['fit', 'Подходящие', ranked.filter(r => (r.tier || 0) <= 1).length], ...types.map(t => [t, t, ranked.filter(r => tplLabel(r.t).type === t).length])].map(([k, n, c]) => `<button class="chip ${k === tab ? 'on' : ''}" data-tab="${e(k)}">${e(n)} <i>${c}</i></button>`).join('')}</div>
      <div class="sh-b">${L.length ? `<div class="tgrid">${L.map(card).join('')}</div>` : !ranked.length ? empty('Шаблонов для этой роли нет', 'Попробуйте другую роль блока или добавьте шаблон в библиотеке.', [['role', 'Сменить роль', true]]) : empty('Подходящих шаблонов нет', 'Поменяйте текст блока или попробуйте другую роль. В категориях выше — все шаблоны и что в них придётся поменять.', [['text', 'Изменить текст', true], ['role', 'Сменить роль']])}</div>`);
    requestAnimationFrame(() => { if (!cat) return; cat.$$('.tc-pv').forEach(x => x.style.setProperty('--k', x.clientWidth / 560)); }); };
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
  const p = A.page, slots = G.imageSlots(b, p), kApi = G.kreaSettings().mode === 'api', ka = o => G.parseKrea(o.krea && o.krea.url);
  if (!slots.length && iconSlots(b).length) return iconSheet(b);
  if (!slots.length) { const s0 = sheet(`<div class="sh-h"><h2>Картинки</h2><button class="ib round" data-close aria-label="Закрыть">${I.x}</button></div><div class="sh-b">${empty('В этом шаблоне нет картинок', 'Выберите шаблон с картинкой — она появится здесь.', [['tpl', 'Шаблоны', true]])}</div>`); s0.$('[data-es]').onclick = () => { s0.close(true); catalog(); }; return; }
  const s = sheet(`<div class="sh-h"><h2>Картинки</h2><button class="ib round" data-close aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b"><div class="imgs">${slots.map(o => `<div class="im"><div class="im-pv" style="aspect-ratio:${o.ratio.replace(':', '/')}">${o.data ? `<img src="${o.data}" alt="">` : `<span class="mono">${e(o.ratio)}${o.size ? ' · ' + e(o.size) : ''}</span>`}</div>
      <div class="im-b"><b>${o.n ? 'Элемент ' + o.n : 'Основная'}</b><small>${e(o.alt || '')}</small>
      <div class="chips"><label class="chip">Загрузить<input type="file" accept="image/*" data-up="${e(o.key)}" hidden></label>${kApi && ka(o) && ka(o).api ? `<button class="chip pri" data-gen="${e(o.key)}">${I.ai} Сгенерировать</button>` : ''}<button class="chip" data-krea="${e(o.key)}">Текст для Krea</button>${ka(o) && ka(o).url ? `<a class="chip" href="${e(ka(o).url)}" target="_blank" rel="noopener">Krea</a>` : ''}${o.data ? `<button class="chip" data-rm="${e(o.key)}">Убрать</button>` : ''}</div></div></div>`).join('')}</div></div>`);
  s.$$('[data-up]').forEach(x => x.onchange = async () => { const f = x.files[0]; if (!f) return; if (f.size > 25e6) return toast('Картинка больше 25 МБ — выберите поменьше.');
    const o = slots.find(y => y.key === x.dataset.up);
    try { const r = await webImage(f, o.ratio, o.size, o.kind); b.images = b.images || {}; b.images[x.dataset.up] = {...(b.images[x.dataset.up] || {}), data: r.data};
      save(); redrawBlock(b); s.close(true); imageSheet(b); toast(`Картинка ${r.w}×${r.h}, ${r.type}, ${Math.round(r.bytes / 1024)} КБ${r.cropped ? ' — обрезана под ' + o.ratio : ''}`); }
    catch (err) { toast('Не удалось открыть картинку: ' + err.message); } });
  /* свой ключ Krea: app запускается из Гриди, картинка обрезается под слот и встаёт в блок */
  s.$$('[data-gen]').forEach(x => x.onclick = async () => { const o = slots.find(y => y.key === x.dataset.gen); if (x.disabled) return; x.disabled = true;
    const lab = x.innerHTML, st = (t) => { x.innerHTML = `${I.ai} ${t}`; };
    try { st('Запускаю…');
      const url = await G.kreaRun(ka(o), o.text || o.alt || '', {onStatus: (status, pos, sec) => st(status === 'completed' ? 'Готово' : pos ? `В очереди: ${pos}` : `Генерирую · ${sec} с`)});
      st('Забираю…'); const f = await G.kreaFile(url), r = await webImage(f, o.ratio, o.size, o.kind);
      b.images = b.images || {}; b.images[o.key] = {...(b.images[o.key] || {}), data: r.data, krea: url}; save(); redrawBlock(b); s.close(true); imageSheet(b); toast(`Картинка из Krea: ${r.w}×${r.h}${r.cropped ? ', обрезана под ' + o.ratio : ''}`);
    } catch (err) { x.disabled = false; x.innerHTML = lab; toast(err.message); if (err.url) window.open(err.url, '_blank', 'noopener'); } });
  s.$$('[data-krea]').forEach(x => x.onclick = async () => { const o = slots.find(y => y.key === x.dataset.krea); await G.copy(o.text || o.alt || ''); toast('Текст для Krea скопирован'); });
  s.$$('[data-rm]').forEach(x => x.onclick = () => { delete (b.images || {})[x.dataset.rm]; save(); redrawBlock(b); s.close(true); imageSheet(b); });
};

/* картинка под веб: обрезка по центру под соотношение слота, ширина по размеру слота (S/M/L, аватар), webp; браузер без webp — jpeg */
const WIDTH = {S: 640, M: 1200, L: 1920, photo: 480};
const webImage = (file, ratio = '16:9', size = '', kind = '') => new Promise((res, rej) => {
  const url = URL.createObjectURL(file), im = new Image();
  im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('формат не поддерживается')); };
  im.onload = () => { URL.revokeObjectURL(url);
    const [rw, rh] = String(ratio).split(':').map(Number), k = rw && rh ? rw / rh : im.width / im.height;
    let sw = im.width, sh = im.height, sx = 0, sy = 0;
    if (sw / sh > k) { sw = Math.round(sh * k); sx = Math.round((im.width - sw) / 2); } else { sh = Math.round(sw / k); sy = Math.round((im.height - sh) / 2); }
    const w = Math.min(sw, WIDTH[size] || (kind === 'photo' ? WIDTH.photo : 1600)), h = Math.round(w / k);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    let data = c.toDataURL('image/webp', 0.82), type = 'webp'; if (!/^data:image\/webp/.test(data)) { data = c.toDataURL('image/jpeg', 0.85); type = 'jpeg'; }
    res({data, w, h, type, bytes: Math.round((data.length - data.indexOf(',') - 1) * 3 / 4), cropped: sw !== im.width || sh !== im.height}); };
  im.src = url; });

/* правка текста блока со страницы: тот же редактор строк — правка разметки */
const textSheet = b => {
  const s = sheet(`<div class="sh-h ts-h"><div class="ts-field"><h2>${e(roleName(b))}</h2></div><button class="ib round ok" data-close aria-label="Готово">${I.check}</button></div>
    <div class="sh-b"><div class="ed solo" contenteditable="true" spellcheck="true" data-id="${e(b.id)}">${(lines(b.text).length ? lines(b.text) : [{k: 'p', t: ''}]).map(l => lineHTML(l.k, l.t)).join('')}</div></div>`,
    {onClose: () => { if (!b.text.trim()) A.page.blocks = A.page.blocks.filter(x => x.id !== b.id); else repick(b); save(); if (fmtEl) fmtEl.hidden = true; document.body.classList.remove('typing'); canvas(); if (b.text.trim()) select(b.id); else unselect(); }, cls: 'full text'});
  const ed = s.$('.ed'); bindEd(ed); fmtBar(s.$('.ts-field'));
  setTimeout(() => caretTo(ed.lastElementChild, ed.lastElementChild.textContent.length), 120);
};

/* 3. Выгрузка — по важности, цветом готовности: красное (ошибки, Нави, лимиты, структура) → оранжевое (данные, дизайн) → рекомендации.
   Нажатие на строку — открыть этот блок на странице. */
const exportView = () => {
  const p = A.page; G.autoPick(p); p.dismissed = p.dismissed || [];
  const el = document.createElement('div'); el.className = 'pv ex';
  const draw = () => { const r = report(p), R = r.rows, g = r.grade, num = b => b ? (p.blocks.indexOf(b) + 1) + '. ' + roleName(b) : 'Страница';
    const nums = list => list.map(x => p.blocks.indexOf(x.b) + 1).join(', ');
    const row = (x, extra = '') => `<div class="xr ${x.b ? 'go' : ''}" ${x.b ? `data-go="${e(x.b.id)}" role="button" tabindex="0"` : ''}><div class="xr-t"><span class="mono">${e(num(x.b))}</span>${e(x.text)}</div>${extra ? `<span class="xr-a">${extra}</span>` : ''}</div>`;
    const sum = (title, sub, go, btn) => `<div class="xr sum go" data-go="${e(go)}" role="button" tabindex="0"><div class="xr-t"><b>${e(title)}</b><small>${e(sub)}</small></div>${btn ? `<span class="xr-a">${btn}</span>` : ''}</div>`;
    const plan = G.fixPlan(p), canAll = plan.code || plan.model.length || R.page.some(x => g.pageFix(x.c) === 'add');
    const st = {red: ['Есть ошибки', 'Лимиты, структура или правила — поправьте, чтобы страница собралась как задумано'],
      orange: ['Не хватает данных', 'Ссылки, картинки, иконки или шаблоны — добавьте, и страница готова'],
      recs: ['Остались рекомендации', 'Примените или скройте — тогда страница готова'],
      green: ['Готово к выгрузке', 'Всё закрыто']}[g.level];
    const redN = g.red.length + g.lim.length + g.struct.length, orN = g.data.length + g.des.length;
    el.innerHTML = `<header class="hd"><button class="ib round" id="xX" aria-label="Закрыть">${I.x}</button><div class="ttl"><b>Выгрузка</b><small>${e(sc().name)}</small></div></header>
      <main class="ex-b">
        <div class="xs ${g.level}"><b>${st[0]}</b><small>${st[1]}</small></div>
        ${redN ? `<p class="lbl err">Ошибки · ${redN}</p><div class="xrs red">
          ${g.red.map(x => row(x, x.kind === 'page' && g.pageFix(x.c) ? `<button class="pill sm pri" data-pf="${R.page.indexOf(R.page.find(y => y.c === x.c))}">${g.pageFix(x.c) === 'add' ? 'Добавить' : 'Поправить'}</button>` : '')).join('')}
          ${g.lim.length ? sum('Текст длиннее лимита', `${G.num(g.lim.length, 'блок', 'блока', 'блоков')}: ${nums(g.lim)}`, g.lim[0].b.id, '<button class="pill sm pri" data-lim>Поправить</button>') : ''}
          ${g.struct.map(x => row(x)).join('')}</div>` : ''}
        ${orN ? `<p class="lbl warn">Не хватает данных · ${orN}</p><div class="xrs orange">${g.data.map(x => row(x)).join('')}
          ${g.des.length ? sum('Нужен дизайн блоков', `${G.num(g.des.length, 'блок', 'блока', 'блоков')}: ${nums(g.des)} — шаблона нет в админке, ТЗ в архиве`, g.des[0].b.id) : ''}</div>` : ''}
        <p class="lbl">Передать</p>
        <div class="list"><button class="row" id="xLink"><b>Ссылка на превью</b><small>Откроется страница как у читателя и кнопка «Открыть в Гриди». Со сценарием, шаблонами и иконками; картинки — только в архиве</small></button>
          <button class="row" id="xShare"><b>Текстом в чат</b><small>Чтобы править текст в чате. Вставка в Гриди собирает ту же страницу; свой сценарий и шаблоны — только по ссылке</small></button>
          <button class="row" id="xPdf"><b>PDF на согласование</b><small>Схема страницы в новой вкладке — сохраните её в PDF через печать</small></button>
          <button class="row" id="xZip"><b>Архив для вёрстки</b><small>Текст по полям, схема, картинки, ТЗ на картинки с именами слотов</small></button></div>
      </main>
      ${canAll ? `<div class="dock"><div class="fixall"><button class="pill grad wide" id="xFix">Поправить всё</button></div></div>` : ''}`;
    el.querySelector('#xX').onclick = close;
    el.querySelectorAll('[data-hide]').forEach(x => x.onclick = ev => { ev.stopPropagation(); p.dismissed.push(g.recs[+x.dataset.hide].text); save(); draw(); });
    el.querySelectorAll('[data-go]').forEach(x => { x.onclick = ev => { if (ev.target.closest('button')) return; goTo(x.dataset.go); }; x.onkeydown = ev => { if (ev.key === 'Enter') goTo(x.dataset.go); }; });
    const lb = el.querySelector('[data-lim]'); if (lb) lb.onclick = async ev => { ev.stopPropagation();
      try { const ids = g.lim.map(x => x.b.id).filter(id => G.adaptable(p.blocks.find(b => b.id === id), G.prompt('fix'), p)); const n = await G.runAdapt(p, 'fix', ids); if (n) g.lim.forEach(x => repick(x.b)); save(); draw(); } catch (err) { if (err.message !== 'cancel') toast(err.message); } };
    el.querySelectorAll('[data-pf]').forEach(x => x.onclick = ev => { ev.stopPropagation(); const c = R.page[+x.dataset.pf].c;
      if (g.pageFix(c) === 'add') { p.blocks.push(G.newBlock(c.fix.addRole, '')); toast('Блок добавлен в конец — заполните его текстом'); } else G.fixByCode(p); save(); draw(); });
    el.querySelector('#xLink').onclick = async () => { try { const u = await G.pageLink(p);
        if (u.length <= G.LINK_MAX) { await G.copy(u); toast(`Ссылка скопирована · ${(u.length / 1000).toFixed(1)} тыс. знаков`); }
        else toast(`Страница длинная: ссылка ${(u.length / 1000).toFixed(1)} тыс. знаков, в сообщение влезает до 4. Передайте архив`); } catch (err) { toast(err.message); } };
    el.querySelector('#xShare').onclick = async () => { const t = shareText(p); if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) { try { await navigator.share({title: p.name, text: t}); return; } catch (err) { if (err.name === 'AbortError') return; } } await G.copy(t); toast('Текст страницы скопирован — вставьте в чат'); };
    el.querySelector('#xPdf').onclick = () => { G.openWire(p, true); };
    el.querySelector('#xZip').onclick = async () => { try { await G.doExport(p); } catch (err) { toast(err.message); } };
    const fx = el.querySelector('#xFix'); if (fx) fx.onclick = async () => {
      try { const adds = R.page.filter(x => g.pageFix(x.c) === 'add'); adds.forEach(x => p.blocks.push(G.newBlock(x.c.fix.addRole, '')));
        const res = await G.runFix(p); G.autoPick(p); save(); draw();
        toast(`Поправлено: ${res.byCode + res.byModel + adds.length}${(res.notes || []).length ? ' · модель: ' + res.notes[0] : ''}`);
      } catch (err) { if (err.message !== 'cancel') toast(err.message); } };
  };
  /* закрыть выгрузку — одна перерисовка; переход — сразу к блоку в «Шаблонах», блок выделен и вверху экрана */
  const shut = () => { el.remove(); document.body.classList.remove('noscroll'); };
  const close = () => { shut(); editor(); };
  const goTo = id => { if (!p.blocks.some(b => b.id === id)) return; shut(); A.mode = 'page'; A.sel = id; A.jump = id; A.jumpTop = true; editor(); };
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
  /* смена экрана закрывает открытые шторки (настройки → библиотека) */
  document.querySelectorAll('.sh-wrap').forEach(x => x._sheet ? x._sheet.close() : x.remove()); document.body.classList.remove('noscroll');
  if (/^#[szj]=/.test(location.hash)) return;
  const m = location.hash.match(/^#\/p\/(.+)$/), l = libRoute();
  if (l) { if (A.view === 'edit') save(); A.view = 'lib'; A.page = null; document.body.classList.remove('shell', 'picking'); libView(); return; }
  if (m && (!A.page || A.page.id !== m[1])) go('edit', m[1]); else if (!m && A.view !== 'home') go('home'); };
/* ссылка со страницей: сразу превью, «Открыть в Гриди» — сохранить себе. Пока не сохранили — у получателя ничего не появляется */
const openLink = async () => {
  try { const j = await G.readLink(location.hash); if (!j) return false;
    const prev = G.unpack({...j, templates: [], scenario: null}).page; /* для показа — без записи чужих шаблонов и сценария */
    j.templates.forEach(t => { if (!G.tpl(t.id)) G._tplIndex = {...(G._tplIndex || {}), [t.id]: t}; });
    prev.blocks.forEach((b, i) => { const x = j.page.blocks[i]; if (x && x.tpl && G.tpl(x.tpl)) { b.tpl = x.tpl; b.tplLock = true; } });
    document.body.classList.remove('shell'); A.view = 'home'; await home();
    preview(prev, () => { G._tplIndex = null; return G.unpack(j); }); return true;
  } catch (err) { toast('Ссылка повреждена или обрезана: ' + err.message); history.replaceState(null, '', '#/'); return false; } };
addEventListener('hashchange', () => { if (/^#[szj]=/.test(location.hash)) openLink(); });
addEventListener('hashchange', route);
const m0 = location.hash.match(/^#\/p\/(.+)$/); if (/^#[szj]=/.test(location.hash)) openLink(); else if (m0) go('edit', m0[1]); else if (libRoute()) route(); else render();
G.m = {A, shareText, fromShare, build, lines, parseLine};
})();
