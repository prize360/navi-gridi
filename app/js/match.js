/* Гриди — подбор шаблонов, заполнение полей, проверки */
'use strict';
(() => {
const G = window.Gridi;

const TEXT_ROLES = ['lead', 'text', 'body', 'table'];
const META_ROLES = ['badge', 'meta', 'qname', 'qcap'];
const GALLERY = ['gallery', 'gal', 'mosaic', 'carousel', 'figure', 'ctgal'];
const FORMS = ['naviform', 'naviprog', 'navifcta'];
/* ряды: в сетке больше 4 пунктов — несколько шаблонов подряд, меньший ряд первым (5=2+3, 7=3+4, 8=4+4) */
G.GRID_LAYOUTS = ['grid', 'gridct', 'people', 'stats', 'cols'];
/* группа: больше 4 пунктов в шаблоне-сетке — ряды подряд, но это ОДИН блок.
   Поля, лимиты и адаптация считаются по всем пунктам: шаблон «растягивается» до числа пунктов, лимиты — на каждый пункт. */
G.rowsFor = (b, t = G.tpl(b.tpl)) => { if (!t || !t.items || t.items.any || !G.GRID_LAYOUTS.includes(t.layout)) return null; const n = G.src(b).items.length; return n > 4 ? G.rowsOf(n) : null; };
G.tplFor = (b, t = G.tpl(b.tpl)) => { const plan = G.rowsFor(b, t); return plan ? {...t, items: {...t.items, n: plan.reduce((a, x) => a + x, 0)}, _rows: plan} : t; };
G.rowsOf = n => { if (n <= 4) return [n]; const r = Math.ceil(n / 4), base = Math.floor(n / r), extra = n % r; return Array.from({length: r}, (_, i) => base + (i >= r - extra ? 1 : 0)); };

/* ---------- что в шаблоне ---------- */
G.tplInfo = t => {
  if (!t) return null;
  if (t._info) return t._info;
  const f = t.fields || [], r = (t.items && t.items.fields) || [];
  const info = {
    h1: f.some(x => x.k === 'h1' || /^H1$/i.test(x.label)),
    h2: f.some(x => x.role === 'title' && (x.k === 'h2' || /^H2$/i.test(x.label))),
    title: f.find(x => x.role === 'title') || null,
    text: f.filter(x => TEXT_ROLES.includes(x.role)),
    meta: f.filter(x => META_ROLES.includes(x.role)),
    cap: f.find(x => x.role === 'cap') || null,
    btn: f.filter(x => x.role === 'btn').length,
    n: t.items ? t.items.n : 0, any: !!(t.items && t.items.any),
    iTitle: r.find(x => x.role === 'title' || x.role === 'num2') || null,
    iText: r.find(x => ['text', 'itemFull', 'body'].includes(x.role)) || null,
    iMeta: r.find(x => x.role === 'meta') || null,
    iBtn: r.some(x => x.role === 'btn'),
    iCap: r.find(x => x.role === 'itemFull' && /подпис/i.test(x.label)) || null,
    media: t.media || null,
    gallery: GALLERY.includes(t.layout),
    form: FORMS.includes(t.layout),
  };
  Object.defineProperty(t, '_info', {value: info, enumerable: false, configurable: true});
  return info;
};

/* ---------- что в блоке ---------- */
G.blockInfo = b => {
  const s = G.src(b), it = s.items;
  return {
    title: !!s.title, level: s.level, meta: s.meta.length > 0, lead: G.len(s.lead), n: it.length,
    iTitle: it.some(i => i.title), iText: it.some(i => i.text), iMeta: it.some(i => i.meta),
    iBtn: it.filter(i => i.cta).length, btn: s.cta.length, img: s.images.length,
    iLen: it.length ? Math.round(it.reduce((a, i) => a + G.len(i.text || i.title), 0) / it.length) : 0,
    table: s.table, faq: it.length >= 2 && it.filter(i => /\?\s*$/.test(i.title)).length >= it.length / 2,
  };
};
G.blockSummary = b => {
  const i = G.blockInfo(b), o = [];
  if (i.title) o.push('заголовок');
  if (i.n) o.push(G.num(i.n, 'пункт', 'пункта', 'пунктов'));
  if (i.btn + i.iBtn) o.push(G.num(i.btn + i.iBtn, 'кнопка', 'кнопки', 'кнопок'));
  if (i.img) o.push(G.num(i.img, 'картинка', 'картинки', 'картинок'));
  if (i.meta) o.push('метаданные');
  const chars = G.len(G.src(b).lead) + G.src(b).items.reduce((a, x) => a + G.len(x.title) + G.len(x.text), 0);
  if (chars) o.push(chars + ' зн.');
  return o.join(', ');
};

/* ---------- шаблон по ссылке сценария: id, название (старые сценарии) или {type, …параметры конструктора} ---------- */
G.refTpls = ref => { const out = [];
  for (const r of (Array.isArray(ref) ? ref : ref ? [ref] : [])) {
    if (r && typeof r === 'object') { G.tpls().forEach(t => { if (t.type === r.type && Object.entries(r).every(([k, v]) => k === 'type' || (t.ctor && t.ctor.p && String(t.ctor.p[k]) === String(v)))) out.push(t); }); }
    else { const t = G.tpl(r) || G.tplByName(r); if (t) out.push(t); }
  }
  return [...new Set(out)]; };
G.cut = (x, n) => { x = String(x || '').replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1) + '…' : x; };
/* Р7: куски текста блока, которых нет ни в одном поле шаблона */
G.leftovers = (b, t, v) => {
  if (!t || t.verbatim || t.component) return [];
  const s = G.src(b), all = [v.head || '', ...Object.values(v.top || {}), ...(v.items || []).flatMap(o => Object.values(o))].join('\n');
  const has = x => !x || all.includes(String(x).trim());
  const out = [];
  if (s.title && !has(s.title)) out.push(s.title);
  s.meta.forEach(m => { if (!has(m) && !m.split(/\s*[,—–]\s*/).every(has)) out.push(m); });
  s.paras.forEach(p => { if (!has(p)) out.push(p); });
  s.items.forEach(i => [i.title, i.text, i.meta, i.cta].forEach(x => { if (x && !has(x) && !String(x).split('\n').every(has)) out.push(x); }));
  s.cta.forEach(c => { if (!has(c)) out.push(c); });
  return out;
};

/* ---------- кого вообще можно ставить в блок ---------- */
/* первый экран — по роли, а не по месту: блок не по порядку остаётся собой, Гриди предложит переставить */
const isHeroRole = b => b.role === 'hero';
const isCtaRole = r => r === 'cta' || r === 'subscribe';
G.pool = (b, page) => {
  const sc = G.scenario(page.scenario), role = G.roleOf(sc, b.role), all = G.tpls();
  const allowed = G.refTpls(role.templates || role.tpl);
  if (allowed.length) return allowed;
  const hero = isHeroRole(b), bi = G.blockInfo(b), prefer = G.refTpls(role.prefer);
  return all.filter(t => {
    const ti = G.tplInfo(t);
    if (t.heading) return false;
    if (t.scope === 'article' && sc.kind !== 'article') return false;
    if (t.component && t.roles) return t.roles.includes(b.role) && (!t.scenarios || t.scenarios.includes(sc.id));
    if (t.component) return prefer.includes(t) || (t.id === 'table' && bi.table) || (t.id === 'accordion' && bi.faq);
    if (hero) return ti.h1;
    return !ti.h1 && !ti.h2; /* H2 раздела — всегда отдельный блок гриды */
  });
};

/* ---------- балл 0–100 ---------- */
/* ---------- балл: 100 минус штрафы ----------
   Грида статична: пустое поле шаблона — плохо, текст без поля — нельзя,
   длиннее лимита — обрежется. Медиа не учитывается. */
/* пункт — один формат для карточек, шагов, списков: метка (время, дата, «Шаг 1»), заголовок, текст, подпись, кнопка.
   Метка — короткая строка в начале пункта; если её нет, у шаблона с меткой Гриди ставит «Шаг N» */
G.MARK_RE = /^(?:\d{1,2}[:.]\d{2}(?:\s*[–—-]\s*\d{1,2}[:.]\d{2})?|\d{1,2}(?:\s*[–—-]\s*\d{1,2})?\s+(?:январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр)[а-яё]*|\d{1,2}\.\d{1,2}(?:\.\d{2,4})?|(?:шаг|этап|день|неделя|урок|модуль|часть|неделя)\s*\d+|\d+\s*(?:мин|ч|час)[а-яё.]*)$/i;
G.isMark = x => G.MARK_RE.test(String(x || '').trim());
G.autoMark = i => 'Шаг ' + (i + 1);
G.itemParts = it => { it = it || {};
  if (it.title && G.isMark(it.title)) return {mark: it.title, title: it.text || '', text: it.meta || '', meta: '', cta: it.cta || '', markUsed: true};
  return {mark: '', title: it.title || '', text: it.text || '', meta: it.meta || '', cta: it.cta || ''}; };
const hasMarkF = t => !!(t && t.items && t.items.fields.some(f => f.role === 'mark'));
G.score = (b, t, page) => {
  const bi = G.blockInfo(b), ti = G.tplInfo(t), s = G.src(b), why = [], bad = [];
  const sc = G.scenario(page.scenario), role = G.roleOf(sc, b.role), cta = isCtaRole(b.role);
  if (t.component && t.verbatim) {
    if (t.id === 'article-text') return b.role === 'content' ? {score: 100, why: ['текстовый редактор'], bad: [], over: 0, tier: 0} : {score: 0, why: [], bad: ['только для текста статьи'], over: 0, tier: 4};
    const ok = (t.id === 'table' && bi.table && !bi.n) || (t.id === 'accordion' && bi.n > 0);
    return {score: ok ? 100 : 0, why: [ok ? 'компонент сайта' : ''], bad: ok ? [] : ['структура не совпадает'], over: 0, tier: ok ? 0 : 4};
  }
  let score = 100, over = 0, tier = 0;
  /* что придётся менять: 1 сократить · 2 переписать в поля · 3 число пунктов · 4 текст под дизайн */
  const TIER = {len: 1, fields: 2, count: 3, design: 4};
  const pen = (kind, n, text) => { score -= n; tier = Math.max(tier, TIER[kind]); if (text) why.push(text); };
  const badk = (kind, text) => { tier = Math.max(tier, TIER[kind]); if (kind === 'design') bad.push(text); else { score -= 25; why.push(text); } };
  const fieldsTop = t.fields || [];
  const has = r => fieldsTop.filter(f => r.includes(f.role));
  /* заголовок внутри шаблона (H1 первого экрана, H3/H4 блока) */
  const titleF = has(['title'])[0];
  const blockTitle = s.title && !G.needsHead(b, t) ? s.title : '';
  if (titleF && !blockTitle) pen('fields', 20, 'пустой заголовок');
  if (blockTitle && !titleF) badk('design', 'заголовку нет поля');
  /* текст блока */
  const textF = has(['lead', 'text', 'body', 'table']);
  if (s.lead && !textF.length && !ti.iText) badk('design', 'тексту нет поля');
  if (!s.lead) textF.forEach(f => pen('fields', 20, `пустое поле «${f.label}»`));
  /* метаданные */
  const metaF = has(['badge', 'meta', 'qname', 'qcap']);
  if (s.meta.length && !metaF.length && !ti.iMeta) badk('design', 'метаданным нет поля');
  if (!s.meta.length) metaF.forEach(f => pen('fields', 20, `пустое поле «${f.label}»`));
  /* кнопки блока */
  const btnF = ti.btn, btnB = s.cta.length || (cta && (ti.btn || ti.form) ? 1 : 0);
  if (btnB > btnF && !ti.form) badk('design', btnF ? 'кнопок больше, чем полей' : 'в тексте кнопка, в шаблоне её нет');
  /* кнопки в шаблоне — «до N»: меньше кнопок — нормально; нет ни одной — заполнить поле */
  if (btnF && !btnB) pen('fields', 10, 'пустая кнопка');
  /* элементы */
  if (ti.gallery) {
    const want = ti.n || 1;
    if (!bi.img) badk('design', 'в блоке нет картинок');
    else if (bi.img > want) badk('count', `картинок ${bi.img}, мест ${want}`);
    else if (bi.img < want) pen('count', 20 * (want - bi.img), `пустых картинок: ${want - bi.img}`);
    if (bi.n) badk('design', 'пунктам нет места');
  } else if (bi.n) {
    if (!t.items) badk('design', 'пунктам нет места');
    else if (!ti.any && G.GRID_LAYOUTS.includes(t.layout) && bi.n > 4 && !bi.faq) {
      /* больше 4 пунктов — ряды; шаблон берётся под самый длинный ряд */
      const plan = G.rowsOf(bi.n), k = Math.max(...plan);
      if (ti.n === k) why.push(`ряды ${plan.join(' + ')}`);
      else if (plan.includes(ti.n)) pen('count', 5, `ряды ${plan.join(' + ')}`);
      else badk('count', `пунктов ${bi.n}: ряды ${plan.join(' + ')}, в шаблоне ${ti.n}`);
    }
    else if (!ti.any) {
      if (bi.n > ti.n) badk('count', `пунктов ${bi.n}, мест ${ti.n}`);
      else if (bi.n < ti.n) pen('count', 20 * (ti.n - bi.n), `пустых элементов: ${ti.n - bi.n}`);
    }
    if (t.items) {
      const iT = (t.items.fields.find(f => f.role === 'title') || {}).max || 140;
      const rf = t.items.fields, its = hasMarkF(t) ? s.items.map(G.itemParts).map(i => !i.title && i.text && G.len(i.text) <= iT ? {...i, title: i.text, text: ''} : i) : s.items;
      const need = {title: its.some(i => i.title), text: its.some(i => i.text), meta: its.some(i => i.meta), btn: its.some(i => i.cta)};
      const hasR = rr => rf.some(f => rr.includes(f.role));
      if (need.btn && !hasR(['btn'])) badk('design', 'у пунктов кнопки, в шаблоне нет');
      if (!need.btn && hasR(['btn'])) pen('design', 15, 'пустые кнопки у элементов');
      if (!need.meta && hasR(['meta'])) pen('fields', 15, 'пустые должности');
      /* у шага с меткой текст — по желанию: шаг может быть одной строкой */
      if (!need.text && hasR(['text']) && hasR(['title', 'num2']) && !hasMarkF(t)) pen('fields', 15, 'пустой текст у элементов');
      if (need.title && hasR(['title'])) { const k = its.filter(i => !i.title).length; if (k) pen('fields', 10 * k, `пустых заголовков у элементов: ${k}`); }
      if (need.text && hasR(['text'])) { const k = its.filter(i => !i.text).length; if (k) pen('fields', 10 * k, `пустых текстов у элементов: ${k}`); }
    }
  } else if (t.items && !ti.form) badk('design', `ждёт ${ti.n} элементов`);
  if (bi.img && !ti.media) why.push('картинке нет места');
  /* Р6: таблица — только в таблицу */
  if (bi.table && t.id !== 'table') badk('fields', 'таблица станет текстом');
  /* знаки: длиннее — обрежется */
  const v = G.autoFill(b, t, page);
  const chk = (f, val) => { const l = G.len(val); if (f.max && l > f.max) over += l - f.max; };
  if (v) { fieldsTop.forEach(f => chk(f, v.top[f.k])); (v.items || []).forEach(it => (t.items.fields || []).forEach(f => chk(f, it[f.k]))); if (v.head) chk(G.HEAD, v.head); }
  if (over) pen('len', Math.min(30, Math.ceil(over / 10)), `длиннее на ${over} зн.`);
  /* Р7: что не встало ни в одно поле — шаблон не подходит, текст не теряется молча */
  const lost = v ? G.leftovers(b, t, v) : [];
  if (lost.length) badk('design', 'не встало в шаблон: ' + lost.map(x => `«${G.cut(x, 40)}»`).join(', '));
  /* смысловые проверки */
  /* метки (время, дата) без своего поля остаются заголовками пунктов: текст не теряется, шаблон годится */
  /* шаги с меткой — для шагов: в пунктах есть метки или блок по роли — шаги («Как попасть», «Программа»); иначе преимущества стали бы шагами */
  if (hasMarkF(t) && bi.n && !s.items.some(i => G.isMark(i.title)) && !G.roleFamily(b, page).has('Шаги')) badk('design', 'это не шаги');
  if (t.layout === 'people' && !(bi.iMeta || s.items.every(i => /^[А-ЯЁA-Z][а-яёa-z]+ [А-ЯЁA-Z][а-яёa-z]+/.test(i.title)))) badk('design', 'в пунктах нет людей');
  if (ti.meta.some(f => f.role === 'qname') && !(bi.meta && bi.lead && !bi.n)) badk('design', 'это не цитата');
  if (t.layout === 'promo' && (bi.n || bi.meta)) badk('design', 'крупный текст без пунктов');
  if (ti.iTitle && ti.iTitle.role === 'num2' && bi.n && s.items.filter(i => /\d/.test(i.title)).length < bi.n / 2) badk('design', 'в пунктах нет чисел');
  /* вопросы — в аккордеон; карточками и шагами их не раскладываем */
  if (bi.faq && !t.component && t.items && bi.n > 4) badk('count', 'вопросы — в аккордеон');
  if (t.component && t.roles && t.roles.includes(b.role)) { score += 5; why.unshift('компонент для этой роли'); }
  if (G.refTpls(role.prefer).includes(t)) { score += 5; why.unshift('рекомендован сценарием'); }
  score = Math.max(0, Math.min(100, score));
  if (bad.length) score = Math.min(score, 30);
  if (!why.length) why.push('всё на месте');
  /* пункты, слитые в текст шаблона без пунктов, — структура потеряна: хуже, чем отдельная кнопка или абзац не на месте */
  const flat = bi.n > 0 && !t.items && !t.verbatim ? 1 : 0;
  return {score, why, bad, over, tier, flat, lostN: lost.reduce((a, x) => a + G.len(x), 0)};
};
const tieW = (x, b) => (x.t.component && x.t.roles && x.t.roles.includes(b.role) ? 2 : 0) + (x.why[0] === 'рекомендован сценарием' ? 1 : 0) + (x.t.status.prod ? 1 : 0);
G.rank = (b, page) => G.pool(b, page).map(t => ({t, ...G.score(b, t, page)})).sort((a, c) => (a.tier || 0) - (c.tier || 0) || (a.flat || 0) - (c.flat || 0) || (a.lostN || 0) - (c.lostN || 0) || c.score - a.score || tieW(c, b) - tieW(a, b) || a.over - c.over);
G.TIERS = ['Подходит', 'Сократить текст', 'Переписать в поля', 'Изменить число пунктов', 'Изменить текст под дизайн'];
G.isLive = t => !!(t && (t.status.prod || t.component));

/* назначить лучший шаблон, если не закреплён вручную */
G.autoPick = (page, force) => {
  for (const b of page.blocks) {
    if (b.tplLock && !force && G.tpl(b.tpl)) continue;
    const r = G.rank(b, page)[0];
    const old = b.tpl; b.tpl = r ? r.t.id : null; b.tplScore = r ? r.score : 0;
    if (old !== b.tpl) { b.values = null; }
  }
};

/* ---------- поля шаблона из текста блока, без модели ---------- */
/* пункты в шаблоне без пунктов (текст статьи, лид) не должны пропадать: они идут в текстовое поле.
   Текст статьи (verbatim) — в исходном порядке, как написал автор; остальным — списком в конце текста. */
G.autoFill = (b, t, page) => {
  const v = autoFill0(b, t, page); t = t || G.tpl(b.tpl);
  if (!v || !t || t.items) return v;
  const s = G.src(b); if (!s.items.length) return v;
  const f = (t.fields || []).find(x => ['lead', 'text', 'body'].includes(x.role)); if (!f) return v;
  const li = i => '- ' + [i.title, i.text].filter(Boolean).join(i.title && i.text ? (i.sep || ' — ') : '');
  if (t.verbatim) {
    const skipTitle = !!s.title; let titled = false;
    const out = String(b.text || '').split('\n').map(x => x.trim()).filter(l => {
      if (skipTitle && !titled && /^\[h[1-4]\]/i.test(l)) { titled = true; return false; }
      return !/^\[(кнопка|ссылка|button|btn|link|картинка|фото|image|img)\]/i.test(l) && !/^@/.test(l);
    }).map(l => l.replace(/^\[h[1-4]\]\s*/i, '').replace(/^(?:[-–•*]|\d+[.)])\s+/, '- '));
    v.top[f.k] = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  } else v.top[f.k] = [v.top[f.k], s.items.map(li).join('\n')].filter(Boolean).join('\n');
  return v;
};
const autoFill0 = (b, t, page) => {
  t = t || G.tpl(b.tpl); if (!t) return null;
  const s = G.src(b), sc = G.scenario(page.scenario), top = {}, items = [];
  let lead = s.lead, btn = 0, meta = 0, titleUsed = false;
  const metas = [...s.meta];
  /* кнопки после списка разбор цепляет к последнему пункту; если у пунктов шаблона кнопок нет — это кнопки блока */
  const itemBtns = t.items && !t.items.fields.some(f => f.role === 'btn') ? s.items.map(i => i.cta).filter(Boolean) : [];
  const own = [...itemBtns, ...s.cta], btns = own.length ? own : (isCtaRole(b.role) && sc.button ? [sc.button] : []);
  for (const f of t.fields || []) {
    let v = '';
    if (f.role === 'title' && !titleUsed) { v = G.needsHead(b, t) ? '' : s.title; titleUsed = true; }
    else if (f.role === 'title') v = '';
    else if (TEXT_ROLES.includes(f.role)) { v = lead; lead = ''; }
    else if (f.role === 'btn') v = btns[btn++] || '';
    else if (f.role === 'badge' || f.role === 'meta') { v = metas.splice(0, metas.length).join(' · '); }
    else if (f.role === 'qname' || f.role === 'qcap') {
      if (metas.length === 1 && (t.fields || []).some(x => x.role === 'qcap') && /[,—–]/.test(metas[0])) { const m = metas[0].split(/\s*[,—–]\s*/); metas.splice(0, 1, m[0], m.slice(1).join(', ')); }
      v = metas[meta++] || '';
    }
    else if (f.role === 'cap') { v = s.images[0] || s.title || lead; if (v === lead) lead = ''; }
    top[f.k] = v || '';
  }
  /* подпись блока без своего поля — в текстовое поле блока первой строкой (в пределах блока) */
  if (metas.length && !(t.fields || []).some(f => ['badge', 'meta', 'qname', 'qcap'].includes(f.role))) { const tf = (t.fields || []).find(f => TEXT_ROLES.includes(f.role)); if (tf) top[tf.k] = [metas.join(' · '), top[tf.k]].filter(Boolean).join('\n'); }
  if (t.items) {
    const ti = G.tplInfo(t);
    const n = t.items.any ? Math.max(s.items.length, 1) : t.items.n;
    const src = ti.gallery && s.images.length ? s.images.map(c => ({title: '', text: c})) : s.items;
    const mk = hasMarkF(t);
    for (let i = 0; i < n; i++) {
      /* у шаблона с меткой пункт раскладывается как «метка — заголовок, текст»; метки нет — «Шаг N» */
      const raw = src[i] || {}, it = mk && !ti.gallery ? {...G.itemParts(raw)} : raw, o = {};
      /* пункт одной строкой, без заголовка: в шаге с меткой он и есть заголовок, если влезает */
      if (mk && !it.title && it.text && ti.iTitle && G.len(it.text) <= (ti.iTitle.max || 140)) { it.title = it.text; it.text = ''; }
      for (const f of t.items.fields) {
        if (f.role === 'num') o[f.k] = String(i + 1);
        else if (f.role === 'mark') o[f.k] = it.mark || (src[i] ? G.autoMark(i) : '');
        else if (f.role === 'title' || f.role === 'num2') o[f.k] = it.title || '';
        else if (f.role === 'itemFull') o[f.k] = it.title && it.text ? it.title + ' — ' + it.text : it.title || it.text || '';
        else if (f.role === 'meta') o[f.k] = it.meta || '';
        else if (f.role === 'btn') o[f.k] = it.cta || '';
        else o[f.k] = it.text || (it.title && !ti.iTitle ? it.title : '');
      }
      /* подпись пункта без своего поля — в текст пункта новой строкой (в пределах элемента, не между элементами) */
      if (it.meta && !t.items.fields.some(f => f.role === 'meta')) { const tf = t.items.fields.find(f => ['text', 'itemFull'].includes(f.role)); if (tf) o[tf.k] = [o[tf.k], it.meta].filter(Boolean).join('\n'); }
      /* что из пункта не встало ни в одно поле — в пустые поля по порядку: текст не теряется */
      const used = new Set(Object.values(o).filter(Boolean)), left = [it.title, it.text, it.meta].filter(x => x && ![...used].some(u => u.includes(x)));
      for (const f of t.items.fields) if (!o[f.k] && left.length && !['num', 'btn', 'mark'].includes(f.role)) o[f.k] = left.shift();
      items.push(o);
    }
  }
  const head = G.needsHead(b, t) ? s.title : undefined;
  return head !== undefined ? {top, items, head, headLvl: s.level === 'h3' ? 'h3' : 'h2'} : {top, items};
};
/* заголовок раздела над блоком: в тексте есть, в шаблоне нет поля — ставится шаблоном «Текст-H2» */
G.HEAD = {label: 'Заголовок раздела (H2)', max: 50, tpl: 'Заголовок-H2-Lt'};
G.needsHead = (b, t) => !!t && !!G.src(b).title && !((t.fields || []).some(f => f.role === 'title') && (t.fields || []).every(f => ['title', 'btn', 'badge', 'meta'].includes(f.role))) && G.src(b).level !== 'h1' && b.role !== 'hero' && !t.heading && (G.src(b).level !== 'h3' || !(t.fields || []).some(f => f.role === 'title'));
G.headTpl = b => G.src(b).level === 'h3' ? 'Заголовок-H3-Lt' : 'Заголовок-H2-Lt';
/* текущие поля блока: адаптированные или собранные из текста */
G.values = (b, page) => {
  const t = G.tpl(b.tpl); if (!t) return null;
  /* один источник правды — текст блока: поля всегда собираются из него; группа — все пункты, не первый ряд */
  return G.autoFill(b, G.tplFor(b, t), page);
};
/* текст в шаблоне → разметка блока: вкладка «Текст» показывает то же, что шаблон */
G.valuesToMarkup = (b, t, v) => {
  const out = [], s = G.src(b), lvl = s.level === 'h3' ? 'h3' : 'h2', has = x => x != null && String(x).trim();
  if (has(v.head)) out.push(`[${lvl}] ${v.head}`);
  const top = t.fields || [], get = f => v.top[f.k];
  top.filter(f => f.role === 'title' && has(get(f))).forEach(f => out.push(`[${b.role === 'hero' ? 'h1' : has(v.head) ? 'h3' : lvl}] ${get(f)}`));
  top.filter(f => ['badge', 'meta', 'qname', 'qcap'].includes(f.role) && has(get(f))).forEach(f => out.push('@ ' + get(f)));
  top.filter(f => ['lead', 'text', 'body', 'cap', 'table', 'num2'].includes(f.role) && has(get(f))).forEach(f => out.push(String(get(f))));
  if (b.images && b.images.main && has(b.images.main.alt)) out.push('[картинка] ' + b.images.main.alt);
  if (t.items) (v.items || []).forEach((it, i) => {
    const F = t.items.fields, val = r => { const f = F.find(x => r.includes(x.role) && has(it[x.k])); return f ? String(it[f.k]) : ''; };
    /* метка «Шаг N», поставленная Гриди, в текст не пишется: в тексте только то, что написал автор */
    const mk = val(['mark']), mark = mk && mk !== G.autoMark(i) ? mk : '';
    let ti = val(['title', 'num2']), tx = val(['text', 'itemFull']), me = val(['meta', 'cap']); const bt = val(['btn']);
    if (mark) { me = [tx, me].filter(Boolean).join(' · '); tx = ti; ti = mark; }
    if (ti || tx) out.push('- ' + [ti, tx].filter(Boolean).join(' — '));
    if (me) out.push((ti || tx ? '@ ' : '- ') + me);
    if (bt) out.push('[кнопка] ' + bt);
  });
  top.filter(f => f.role === 'btn' && has(get(f))).forEach((f, i) => { const u = s.urls[i]; out.push(u ? `[кнопка] ${get(f)} | ${u}` : '[кнопка] ' + get(f)); });
  return out.join('\n');
};
/* правка полей = правка текста: поля переводятся в разметку и записываются в текст блока */
G.setValues = (b, vals, by) => {
  const t = G.tpl(b.tpl); b.values = null; b.valuesBy = by;
  if (t && !t.verbatim && !t.component) { const md = G.valuesToMarkup(b, t, vals); if (md.trim() && md !== b.text) { b.orig = b.orig || b.text; b.text = md; } }
};
G.overflow = (b, page) => {
  const t = G.tpl(b.tpl), v = G.values(b, page); if (!t || !v || t.verbatim || G.roleOf(G.scenario(page.scenario), b.role).verbatim) return [];
  const o = [];
  if (v.head && G.len(v.head) > G.HEAD.max) o.push({label: G.HEAD.label, over: G.len(v.head) - G.HEAD.max});
  for (const f of t.fields || []) { const l = G.len(v.top[f.k]); if (f.max && l > f.max) o.push({label: f.label, over: l - f.max}); }
  if (t.items) v.items.forEach((it, i) => { for (const f of t.items.fields) { const l = G.len(it[f.k]); if (f.max && l > f.max) o.push({label: `${f.label} ${i + 1}`, over: l - f.max}); } });
  return o;
};

/* ---------- проверки ---------- */
const BAD_CTA = /^(подробнее|узнать больше|нажмите|кликните|перейти|далее|здесь|отправить|читать далее|ок|ok)$/i;
const URGENT = /(только сегодня|успейте|успеть|последний шанс|осталось\s+\d+\s+мест|места ограничены|торопитесь|спешите)/i;
G.checks = page => {
  const sc = G.scenario(page.scenario), out = [], add = (level, text, block, fix) => out.push({level, text, block, fix});
  const art = sc.kind === 'article';
  if (!page.blocks.length) { add('error', 'На странице нет блоков. Соберите страницу из текста.'); return out; }
  /* М1: модель поправила разметку автора — показываем, что именно, чтобы автор мог вернуть своё в «Тексте» */
  const mf = page.markFixes || []; if (mf.length) add('warn', `Модель поправила разметку в ${G.num(mf.length, 'строке', 'строках', 'строках')}: ${mf.slice(0, 3).map(x => `«${G.cut(x.from, 40)}» → «${G.cut(x.to, 40)}»`).join('; ')}${mf.length > 3 ? '…' : ''}. Проверьте в «Тексте».`);
  /* ошибки — только то, что ломает гриду */
  const heroes = page.blocks.filter(b => b.role === 'hero'), ctas = page.blocks.filter(b => G.isCta(b));
  if (heroes.length > 1) add('error', `Первых экранов ${heroes.length} — на странице он один.`, heroes[1]);
  if (ctas.length > 1) add('error', `Целевых действий ${ctas.length} — на странице оно одно.`, ctas[1]);
  /* подсказки по сценарию: редактор может оставить как есть */
  for (const r of sc.roles) if (r.req && !page.blocks.some(b => b.role === r.id)) add('warn', `Нет блока «${r.name}».`, null, {addRole: r.id});
  if (!art) {
    const order = sc.roles.map(r => r.id); let last = -1, broken = false;
    for (const b of page.blocks) { const i = order.indexOf(b.role); if (i >= 0) { if (i < last) broken = true; last = Math.max(last, i); } }
    if (broken) add('info', 'Порядок блоков отличается от сценария — так задумано?', null, {reorder: true});
    const dup = {}; page.blocks.forEach(b => { if (!['hero', 'cta', 'subscribe'].includes(b.role)) dup[b.role] = (dup[b.role] || 0) + 1; });
    for (const k in dup) if (dup[k] > 1) add('info', `Роль «${G.roleOf(sc, k).name}» встречается ${dup[k]} раза — так задумано?`);
  }
  let h1 = 0;
  page.blocks.forEach((b, i) => {
    const s = G.src(b), t = G.tpl(b.tpl), name = G.roleOf(sc, b.role).name;
    if (s.level === 'h1') { h1++; if (b.role !== 'hero' && i > 0) add('error', 'H1 — только в первом экране.', b); }
    if (!b.text.trim()) add('warn', `Пустой блок «${name}».`, b);
    if (!t) add('warn', `У блока «${name}» нет шаблона.`, b);
    else {
      if (!t.status.prod && !t.component) add('info', `«${name}»: нужен дизайн шаблона «${t.name}».`, b);
      const best = G.score(b, t, page);
      /* Р7: текст, которому нет места в шаблоне, — ошибка, а не тишина */
      const lostX = G.leftovers(b, G.tplFor(b, t), G.values(b, page) || {top: {}, items: []});
      if (lostX.length) { const s0 = G.src(b), split = (s0.paras.length && s0.items.length && !G.tplInfo(t).text.length) || (s0.cta.length && !G.tplInfo(t).btn && lostX.some(x => s0.cta.includes(x)));
        add('error', `«${name}»: не встало в шаблон «${t.name}» — ${lostX.slice(0, 2).map(x => `«${G.cut(x, 40)}»`).join(', ')}${lostX.length > 2 ? ` и ещё ${lostX.length - 2}` : ''}.${split ? ' «Поправить» вынесет это в отдельный блок.' : ' Выберите другой шаблон или перенесите текст.'}`, b, split ? {splitLead: true} : null); }
      if (best.tier >= 2) { const what = [...best.bad, ...best.why.filter(w => !/^(всё на месте|компонент|рекомендован)/.test(w))].slice(0, 2).join(', ');
        add(best.tier >= 3 ? 'warn' : 'info', `«${name}» в шаблоне «${t.name}»: ${G.TIERS[best.tier].toLowerCase()}${what ? ' — ' + what : ''}.`, b); }
      const ov = G.overflow(b, page);
      if (ov.length) add('warn', `«${name}»: ${ov.length > 1 ? ov.length + ' поля длиннее лимита' : ov[0].label + ' длиннее на ' + ov[0].over + ' зн.'} — адаптируйте текст.`, b, {adapt: true});
      if (G.stale(b)) add('info', `Текст блока «${name}» правили после адаптации — при желании адаптируйте ещё раз.`, b, {adapt: true});
      const v = G.values(b, page);
      if (v) (t.fields || []).filter(f => f.role === 'btn').map(f => v.top[f.k]).filter(Boolean).forEach(x => { if (BAD_CTA.test(x.trim())) add('warn', `Кнопка «${x}» не говорит, что будет. Нужен глагол и результат.`, b); });
      if (t.media && !t.media.per && !(b.images.main && b.images.main.data) && !(t.media.kind === 'icon' && G.iconFor(b, 'main'))) add('info', `«${name}»: ${t.media.kind === 'icon' ? 'нет иконки' : t.media.kind === 'photo' ? 'нет фото' : 'нет картинки' + (t.media.ratio ? ' ' + t.media.ratio : '')}.`, b);
    }
    if (/\[нужно от автора/i.test(b.text)) add('warn', `«${name}»: есть пометка «нужно от автора» — не хватает фактов.`, b);
    if (URGENT.test(b.text)) add('warn', `«${name}»: ложная срочность в тексте.`, b);
  });
  if (!h1 && page.blocks[0]) add('warn', 'Нет H1 в первом экране — поставьте [h1] перед заголовком.', page.blocks[0]);
  if (art) {
    const max = (sc.rhythm && sc.rhythm.maxRun) || 1000; let run = 0, runB = null, textAll = 0, vrez = 0, h2 = 0;
    const kinds = new Set();
    for (const b of page.blocks) {
      if (b.role === 'content') { const l = G.len(G.src(b).lead); run += l; textAll += l; if (G.src(b).title) h2++; if (!runB) runB = b; if (run > max * 1.6) { add('warn', `Полотно текста: ${run} зн. без вреза.`, runB, {split: true}); run = 0; runB = null; } }
      else if (b.role === 'vrez') { run = 0; runB = null; vrez++; const t = G.tpl(b.tpl); if (t) kinds.add(t.layout); }
    }
    if (vrez && textAll / vrez > 1100) add('warn', `Мало врезов: ${G.num(vrez, 'врез', 'вреза', 'врезов')} на ${textAll} зн. Нужен примерно один на 2–3 абзаца.`);
    if (vrez >= 3 && kinds.size === 1) add('info', 'Все врезы одного вида — чередуйте цифры, цитаты, карточки, картинки.');
    if (textAll > 3000 && !h2) add('warn', 'В статье больше 3000 знаков без подзаголовков. Добавьте [h2] каждые 3–5 абзацев.');
  }
  /* группа: текст и структура / шаблоны */
  out.forEach(c => { c.cat = /шаблон|длиннее|адаптир|Кнопка «|картинк|иконк|нет фото|баллов|изменился после/i.test(c.text) ? 'tpl' : 'text'; });
  /* навигация по правилам Нави: первый экран, целевое действие, главная кнопка */
  const nav = (level, text, block, rule) => out.push({level, text, block, cat: 'navi', rule});
  const hero = heroes[0], cta = ctas[0], btnOf = b => { if (!b) return ''; const t = G.tpl(b.tpl), v = t && G.values(b, page); const f = t && (t.fields || []).find(x => x.role === 'btn' && v && v.top[x.k]); const c0 = (G.src(b).cta || [])[0]; return f ? String(v.top[f.k]).trim() : c0 ? String(c0.text || c0).trim() : ''; };
  const hb = btnOf(hero), cb = btnOf(cta);
  if (hero && page.blocks[0] !== hero) nav('warn', 'Первый экран — всегда первый блок: от него Нави показывает липкую панель и островок.', hero, 'IA-2');
  if (!hero) nav('warn', 'Нет первого экрана — Нави не покажет липкую панель.', null, 'IA-2');
  if (hb && !cta) nav('warn', `На первом экране кнопка «${hb}», а целевого действия нет — кнопке некуда вести.`, hero, 'CLR-1');
  if (cta && hb && cb && hb.toLowerCase() !== cb.toLowerCase()) nav('warn', `Подписи главной кнопки разные: «${hb}» и «${cb}». По гайду подпись одна во всех местах.`, cta, 'CLR-2');
  [hb, cb].filter(Boolean).forEach(x => { if (x.length > 24) nav('warn', `Подпись «${x}» длиннее 24 знаков — в островке не поместится в строку.`, cta || hero); });
  if (cta && page.blocks[page.blocks.length - 1] !== cta && !art) nav('info', 'Целевое действие не в конце страницы — островок исчезнет раньше, чем человек дочитает. Так задумано?', cta, 'CLR-1');
  if (art && cta) nav('info', 'У статьи по гайду нет целевого действия. Блок есть — Нави покажет кнопку в островке. Так задумано?', cta, 'CLR-1');
  if (cta && !hb && !art) nav('info', 'На первом экране нет кнопки-якоря к целевому действию.', hero, 'CLR-1');
  const anc = page.blocks.filter(b => b.role !== 'hero' && b.role !== 'cta' && G.src(b).title && G.src(b).level !== 'h3').length;
  if (anc >= 3) nav('info', `Нави соберёт оглавление из ${anc} заголовков блоков.`);
  const W = {error: 0, warn: 1, info: 2}, seen = new Set();
  /* одинаковые подсказки схлопываются только в пределах блока: «нет фото» у двух блоков — два замечания */
  return out.filter(c => { if (c.level !== 'info') return true; const k = (c.block ? c.block.id : '') + '|' + c.text; return !seen.has(k) && seen.add(k); }).sort((a, b) => W[a.level] - W[b.level]);
};
/* правила гайда — из library/rules.js (собран из rules.yaml), общие с Нави */
G.rule = id => ((window.GUIDE_RULES || {}).rules || []).find(r => r.id === id) || null;
G.CHECK_CATS = [['text', 'Текст и структура'], ['tpl', 'Шаблоны'], ['navi', 'Навигация — правила Нави']];

})();

/* ---------- выбор шаблона для блока ---------- */
(() => {
const G = window.Gridi;
/* выбор: лучший из админки, если подходит; иначе лучший «нужен дизайн» */
/* тип шаблона — его семейство; у компонентов сайта — своё название */
const COMP = {'article-text': 'Текст статьи', accordion: 'Аккордеон', table: 'Таблица', 'tf-reg': 'Форма'};
G.typeOf = t => (t ? t.type || COMP[t.id] || '' : '');
/* П9: семейство блока — из роли сценария (prefer/templates) и из формы текста. Форма сильнее роли:
   время в начале всех пунктов → Шаги, имена с подписями → Люди, числа → Цифры, 2+ картинки → Галерея, цитата → Цитата */
G.formFamily = b => { const s = G.src(b), it = s.items, bi = G.blockInfo(b), o = [];
  if (s.table || bi.table) o.push('Таблица');
  if (it.length && it.filter(x => /\?/.test(x.title || x.text)).length * 2 >= it.length) o.push('Аккордеон', 'Список');
  if (it.length >= 2 && it.every(x => /^\d{1,2}[:.]\d{2}/.test(x.title || x.text))) o.push('Шаги');
  if (it.length >= 2 && it.every(x => /\d/.test(x.title || ''))) o.push('Цифры');
  if (s.images.length >= 2 && !it.length) o.push('Галерея');
  if (!it.length && /^[«"„“]/.test(s.lead || '') && s.meta.length) o.push('Цитата');
  return o; };
G.roleFamily = (b, page) => { const role = G.roleOf(G.scenario(page.scenario), b.role), out = new Set();
  for (const t of G.refTpls([].concat(role.prefer || [], role.templates || role.tpl || []))) if (G.typeOf(t)) out.add(G.typeOf(t));
  return out; };
G.familyOf = (b, page) => { const f = G.formFamily(b); return f.length ? new Set(f) : G.roleFamily(b, page); };
/* кандидаты блока: шаблоны семейства по форме, затем по роли — если с ними достаточно поправить текст (уровни 0–2);
   «изменить число пунктов» в семействе не берём: модель выдумывает недостающие пункты (третьего спикера, даты). Иначе все по рангу */
const lv = x => (x ? x.tier || 0 : 9);
G.candidates = (b, page) => { const r = G.rank(b, page);
  for (const F of [new Set(G.formFamily(b)), G.roleFamily(b, page)]) { if (!F.size) continue;
    const fam = r.filter(x => F.has(G.typeOf(x.t)) && lv(x) <= 2); if (fam.length) return fam; }
  return r; };
/* П8 внутри кандидатов: шаблон из админки, пока с ним достаточно поправить текст (уровни 0–2);
   если в админке только «изменить число пунктов» или «изменить текст под дизайн», а без админки есть подходящий лучше, — он, с пометкой «нужен дизайн» */
const bestOf = c => { const live = c.find(x => G.isLive(x.t)), need = c.find(x => !G.isLive(x.t));
  return live && lv(live) <= 2 ? live : need && lv(need) < lv(live) ? need : live || need || null; };
/* равные лучшему: тот же уровень и тот же статус «в админке» — между ними перебирает «Другой дизайн» (page.seed) */
const peers = (c, best) => c.filter(x => lv(x) <= Math.max(1, lv(best)) && G.isLive(x.t) === G.isLive(best.t));
/* сколько вариантов у страницы для «Другого дизайна»: блоки, где есть из чего выбрать */
G.designChoices = page => page.blocks.filter(b => b.role !== 'unparsed' && b.role !== 'content' && !b.tplLock).reduce((n, b) => { const c = G.candidates(b, page), best = bestOf(c); return n + (best && !G.tpl(best.t.id).component && peers(c, best).length > 1 ? 1 : 0); }, 0);
G.autoPick = (page, force) => {
  const seed = page.seed || 0, uses = {}; let prev = null;
  for (const [bi, b] of page.blocks.entries()) {
    if (b.role === 'unparsed') continue;
    if (b.tplLock && !force && G.tpl(b.tpl)) { uses[b.tpl] = (uses[b.tpl] || 0) + 1; prev = b.tpl; continue; }
    const c = G.candidates(b, page), best = bestOf(c);
    let pick = best;
    if (best) {
      const eq = peers(c, best), free = b.role !== 'content' && !G.tpl(best.t.id).component;
      if (seed && free && eq.length > 1) pick = eq[(eq.indexOf(best) + seed + bi) % eq.length];
      /* разнообразие: соседний блок в том же шаблоне или шаблон уже дважды на странице — следующий из равных, затем из кандидатов до «переписать в поля» */
      const bad = x => x.t.id === prev || (uses[x.t.id] || 0) >= 2;
      if (free && bad(pick)) { const alt = eq.find(x => !bad(x)) || c.find(x => !bad(x) && lv(x) <= Math.max(2, lv(best)) && G.isLive(x.t) === G.isLive(best.t)); if (alt) pick = alt; }
    }
    const nt = pick ? pick.t.id : null;
    if (nt !== b.tpl) { b.tpl = nt; b.values = null; }
    if (nt) uses[nt] = (uses[nt] || 0) + 1; prev = nt;
  }
};
/* шаблоны, которых не хватает: ТЗ дизайнерам (служебное «Не разобрано» не считается) */
G.missing = page => page.blocks.filter(b => b.role !== 'unparsed').filter(b => { const t = G.tpl(b.tpl); if (!t) return true; if (!G.isLive(t)) return true; return (G.score(b, t, page).tier || 0) >= 3; }).map(b => ({b, t: G.tpl(b.tpl), role: G.roleOf(G.scenario(page.scenario), b.role).name, need: G.blockSummary(b), best: G.rank(b, page)[0]}));
})();

/* самопроверка шаблона: пробный текст → разметка → обратно в поля; что не вернулось на место — список полей */
G.tplSelfTest = t => {
  if (!t || t.component || t.verbatim) return [];
  const page = G.newPage('test'); page.scenario = (G.lib.all('scenarios')[0] || {}).id;
  const b = G.newBlock(/^Первый экран/.test(t.name + ' ' + (t.type || '')) ? 'hero' : ((t.roles || [])[0] || 'vrez')); b.tpl = t.id; page.blocks = [b];
  let c = 0; const val = f => f.role === 'num' ? '' : (f.role === 'btn' ? 'Кнопка' : f.label.replace(/\s+/g, '')) + (++c) + ' проба';
  const v = {top: {}, items: []}; (t.fields || []).forEach(f => v.top[f.k] = val(f));
  if (t.items) for (let i = 0; i < (t.items.any ? 3 : t.items.n); i++) { const o = {}; t.items.fields.forEach(f => o[f.k] = val(f)); v.items.push(o); }
  b.text = G.valuesToMarkup(b, t, v); const r = G.autoFill(b, t, page), bad = [];
  (t.fields || []).forEach(f => { if (f.role !== 'num' && r.top[f.k] !== v.top[f.k]) bad.push(f.label); });
  v.items.forEach((o, i) => t.items.fields.forEach(f => { if (f.role !== 'num' && (r.items[i] || {})[f.k] !== o[f.k] && !bad.includes(f.label + ' у элемента')) bad.push(f.label + ' у элемента'); }));
  return bad;
};
