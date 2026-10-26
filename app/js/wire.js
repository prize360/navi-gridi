/* Гриди — схема страницы (wireframe) из шаблонов и текста */
'use strict';
(() => {
const G = window.Gridi, e = G.esc;

const FAM = {
  split: 'split', listsplit: 'split', quote: 'split', wide: 'wide', center: 'center', ctgal: 'center', bannerct: 'center', promo: 'center', pull: 'pull',
  bg: 'bg', stack: 'stack', text: 'stack', lead: 'stack', body: 'stack', twocol: 'twocol', callout: 'callout', ctatext: 'callout', figure: 'figure',
  grid: 'grid', gridct: 'grid', people: 'grid', stats: 'grid', logos: 'grid', cols: 'grid',
  program: 'rows', timeline: 'rows', olist: 'rows', table: 'table', tablec: 'table', faq: 'faq', faqsplit: 'faq',
  gallery: 'gal', gal: 'gal', mosaic: 'gal', carousel: 'gal',
  navihero: 'navihero', naviform: 'form', naviprog: 'prog', navifcta: 'center',
};
const hTag = f => (/^h1$/i.test(f.k) || f.label === 'H1') ? 'h1' : (/h2/i.test(f.k) || f.label === 'H2') ? 'h2' : 'h3';
const paras = s => String(s || '').split(/\n+/).filter(Boolean).map(p => `<p>${e(p)}</p>`).join('');
const empty = f => `<span class="wf-empty wf-miss" title="Пустое поле: заполните или выберите шаблон без него">${e(f.label)} — пусто</span>`;

const media = (t, img, opts = {}) => {
  const m = t.media; if (!m) return '';
  const ratio = (m.ratio || '1:1').split(':'), ar = `${ratio[0]} / ${ratio[1] || 1}`;
  const cls = `wf-media wf-m-${m.kind}${opts.small ? ' wf-m-sm' : ''}`;
  if (m.kind === 'icon') return `<div class="${cls}${img && img.svg ? ' wf-has-ic' + (img.auto ? ' wf-ic-auto' : '') : ''}" data-img="${opts.key || 'main'}" title="${img && img.name ? e(img.name) + (img.auto ? ' — подобрана автоматически' : '') : 'Иконка'}">${img && img.svg ? img.svg : ''}</div>`;
  if (img && img.data) return `<div class="${cls}" style="aspect-ratio:${m.kind === 'photo' ? '1/1' : ar}" data-img="${opts.key || 'main'}"><img src="${img.data}" alt="${e(img.alt || '')}"></div>`;
  const label = m.kind === 'photo' ? 'фото' : m.kind === 'logo' ? 'логотип' : (m.ratio || '');
  return `<div class="${cls}" style="aspect-ratio:${m.kind === 'photo' ? '1/1' : ar}" data-img="${opts.key || 'main'}"><span>${e(label)}${m.size && m.kind === 'img' ? ' · ' + m.size : ''}</span></div>`;
};
const field = (f, v, opts = {}) => { const out = field0(f, v, opts); return opts.path && out ? out.replace(/^<(\w+)/, `<$1 data-path="${opts.path}"`) : out; };
const field0 = (f, v, opts = {}) => {
  let x = v == null ? '' : String(v);
  /* грида статична: длиннее лимита — обрезается */
  if (f.max && f.role !== 'table' && f.role !== 'body' && x.length > f.max) x = x.slice(0, Math.max(1, f.max - 1)).trimEnd() + '…';
  if (f.role === 'num') return `<span class="wf-num">${e(x)}</span>`;
  /* кнопки шаблона — «до N»: пустая вторая кнопка не ошибка и не показывается */
  if (!x.trim() && f.role === 'btn' && /^b[2-9]$/.test(f.k)) return '';
  if (!x.trim()) return opts.skipEmpty ? '' : empty(f);
  switch (f.role) {
    case 'title': return `<${hTag(f)} class="wf-${hTag(f)}">${e(x)}</${hTag(f)}>`;
    case 'lead': return `<div class="wf-lead">${paras(x)}</div>`;
    case 'text': case 'body': return `<div class="wf-text">${paras(x)}</div>`;
    case 'btn': return `<span class="wf-btn pv-btn">${e(x)}</span>`;
    case 'badge': return `<span class="wf-badge">${e(x)}</span>`;
    case 'mark': return `<b class="wf-mark">${e(x)}</b>`;
    case 'meta': return `<span class="wf-meta">${e(x)}</span>`;
    case 'qname': return `<b class="wf-qname">${e(x)}</b>`;
    case 'qcap': case 'cap': return `<span class="wf-meta">${e(x)}</span>`;
    case 'num2': return `<b class="wf-big">${e(x)}</b>`;
    case 'itemFull': return `<div class="wf-text"><p>${e(x)}</p></div>`;
    case 'table': return table(x);
    default: return `<div class="wf-text">${paras(x)}</div>`;
  }
};
const table = x => {
  const rows = String(x).split('\n').filter(l => l.includes('|')).map(l => l.split('|').map(c => c.trim()));
  if (!rows.length) return `<div class="wf-text">${paras(x)}</div>`;
  return `<div class="wf-tablewrap"><table class="wf-table"><thead><tr>${rows[0].map(c => `<th>${e(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
};
const topHTML = (t, v, roles) => {
  const fs = (t.fields || []).filter(f => !roles || roles.includes(f.role));
  const btn = fs.filter(f => f.role === 'btn'), rest = fs.filter(f => f.role !== 'btn');
  const badges = rest.filter(f => f.role === 'badge').map(f => field(f, v.top[f.k], {path: 'top.' + f.k})).join('');
  const body = rest.filter(f => f.role !== 'badge').map(f => f.role === 'title' && v.head && !v.top[f.k] ? '' : field(f, v.top[f.k], {path: 'top.' + f.k})).join('');
  const bt = btn.map(f => field(f, v.top[f.k], {path: 'top.' + f.k})).join('');
  return (badges ? `<div class="wf-badges">${badges}</div>` : '') + body + (bt ? `<div class="wf-actions">${bt}</div>` : '');
};
const itemHTML = (t, it, i, imgs) => {
  const per = t.media && t.media.per;
  /* шаг с меткой: текст по желанию — пустой не показывается, если у шага есть заголовок */
  const opt = f => f.role === 'text' && t.items.fields.some(x => x.role === 'mark') && t.items.fields.some(x => x.role === 'title' && String(it[x.k] || '').trim());
  return `<div class="wf-item">${per ? media(t, imgs['i' + i], {key: 'i' + i, small: t.media.size === 'S'}) : ''}<div class="wf-item-body">${t.items.fields.map(f => field(f, it[f.k], {path: `items.${i}.${f.k}`, skipEmpty: opt(f)})).join('')}</div></div>`;
};
const itemsHTML = (t, v, imgs, cls = '') => t.items ? `<div class="wf-items ${cls}" style="--cols:${t.cols || Math.min(3, (v.items || []).length || 1)}">${(() => { const its = [...(v.items || [])], n = t.items.any ? 0 : (t.items.n || 0); const extra = Math.max(0, n - its.length); return its.map((it, i) => itemHTML(t, it, i, imgs)).join('') + Array.from({length: extra}, (_, j) => `<div class="wf-item wf-item-miss"><div class="wf-item-body">${t.items.fields.filter(f => f.role !== 'num').map(f => empty(f).replace('<span', `<span data-path="items.${its.length + j}.${f.k}"`)).join('')}</div></div>`).join(''); })()}</div>` : '';

/* картинки блока для схемы; у иконок — выбранная или подобранная по словам */
G.wireImgs = (b, t) => {
  if (!t || !t.media || t.media.kind !== 'icon') return b.images || {};
  const out = {...(b.images || {})}, keys = t.media.per && t.items ? Array.from({length: Math.max(t.items.n || 0, G.src(b).items.length)}, (_, i) => 'i' + i) : ['main'];
  keys.forEach(k => { const r = G.iconFor(b, k); if (r) out[k] = {...(out[k] || {}), svg: r.ic.svg, name: r.ic.name, auto: r.auto}; });
  return out;
};
G.wireBlock = (t, v, imgs = {}) => {
  if (!t) return `<section class="wf wf-none"><div class="wf-empty">Шаблон не выбран</div></section>`;
  v = v || {top: {}, items: []};
  const fam = FAM[t.layout] || 'generic', m = media(t, imgs.main, {key: 'main'}), rev = t.reverse ? ' wf-rev' : '';
  let inner;
  switch (fam) {
    case 'split': inner = `<div class="wf-split${rev}"><div class="wf-col">${topHTML(t, v)}${itemsHTML(t, v, imgs, 'wf-list')}</div>${t.media && !t.media.per ? `<div class="wf-col wf-col-m">${m}</div>` : ''}</div>`; break;
    case 'wide': inner = `<div class="wf-stack">${topHTML(t, v)}</div>${m}`; break;
    case 'center': inner = `<div class="wf-center">${topHTML(t, v)}</div>${t.media && !t.media.per ? m : ''}${itemsHTML(t, v, imgs, 'wf-grid')}`; break;
    case 'pull': inner = `<div class="wf-pull">${t.media && !t.media.per ? m : ''}<div>${topHTML(t, v)}</div></div>`; break;
    case 'bg': inner = `<div class="wf-bg">${m}<div class="wf-bg-text">${topHTML(t, v)}</div></div>`; break;
    case 'twocol': inner = `<div class="wf-twocol"><div>${topHTML(t, v, ['title'])}</div><div>${topHTML(t, v, ['lead', 'text', 'body', 'btn'])}</div></div>`; break;
    case 'callout': inner = `<div class="wf-callout">${m}<div>${topHTML(t, v)}</div></div>`; break;
    case 'figure': inner = `<figure class="wf-figure">${m}<figcaption>${topHTML(t, v)}</figcaption></figure>`; break;
    case 'grid': inner = `${(t.fields || []).length ? `<div class="wf-stack">${topHTML(t, v)}</div>` : ''}${t.media && !t.media.per ? m : ''}${itemsHTML(t, v, imgs, 'wf-grid wf-' + t.layout)}`; break;
    case 'rows': inner = `${topHTML(t, v)}${itemsHTML(t, v, imgs, 'wf-rows wf-' + t.layout)}`; break;
    case 'table': inner = topHTML(t, v); break;
    case 'faq': inner = `${topHTML(t, v)}<div class="wf-faq">${(v.items || []).map(it => { const [q, a] = t.items.fields; return `<details><summary>${e(it[q.k] || q.label)}</summary>${field(a, it[a.k])}</details>`; }).join('')}</div>`; break;
    case 'gal': inner = `${topHTML(t, v)}${t.items ? itemsHTML(t, v, imgs, 'wf-grid wf-gal wf-' + t.layout) : m}`; break;
    case 'navihero': inner = `<div class="wf-navihero">${topHTML(t, v, ['title'])}<div class="wf-badges">${field((t.fields || []).find(f => f.role === 'badge') || {role: 'badge', label: 'Бейджи'}, v.top.badge || '', {skipEmpty: true})}<span class="wf-chip">Поделиться</span></div>${topHTML(t, v, ['btn'])}</div>`; break;
    case 'form': inner = `<div class="wf-formbox"><div>${topHTML(t, v, ['title', 'text', 'lead'])}</div><div class="wf-form"><span class="wf-input">Имя</span><span class="wf-input">Телефон или почта</span>${topHTML(t, v, ['btn'])}</div></div>`; break;
    case 'prog': inner = `${topHTML(t, v, ['title'])}${itemsHTML(t, v, imgs, 'wf-rows wf-program')}${topHTML(t, v, ['btn'])}`; break;
    default: inner = `${topHTML(t, v)}${t.media && !t.media.per ? m : ''}${itemsHTML(t, v, imgs, 'wf-grid')}`;
  }
  const hl = v.headLvl === 'h3' ? 'h3' : 'h2', head = v.head ? `<${hl} class="wf-${hl}" data-path="head">${e(v.head)}</${hl}>` : '';
  return `<section class="wf wf-f-${fam}">${head}${inner}</section>`;
};

/* стили схемы: в приложении и в выгрузке wireframe.html */
G.WIRE_CSS = `
.wf-page{container-type:inline-size;--wf-ink:#1d2421;--wf-mute:#6b7470;--wf-line:#d9ded9;--wf-fill:#eef1ee;--wf-acc:#1d2421;font:15px/1.5 "Onest",system-ui,sans-serif;color:var(--wf-ink);background:#fff}
.wf-page *{box-sizing:border-box}
.wf{padding:40px 48px;display:flex;flex-direction:column;gap:20px;border-bottom:1px dashed var(--wf-line)}
.wf p{margin:0 0 .6em}.wf p:last-child{margin:0}
.wf h1,.wf h2,.wf h3{margin:0;letter-spacing:-.01em;line-height:1.15;text-wrap:balance}
.wf-h1{font-size:40px;font-weight:700}.wf-h2{font-size:28px;font-weight:700}.wf-h3{font-size:19px;font-weight:600}
.wf-lead{font-size:18px;color:var(--wf-ink);max-width:62ch}.wf-text{max-width:68ch}.wf-text p{white-space:pre-line}
.wf-meta{color:var(--wf-mute);font-size:13px;display:block}.wf-qname{display:block;font-weight:600}
.wf-badges{display:flex;gap:6px;flex-wrap:wrap}.wf-badge,.wf-chip{font-size:12px;padding:3px 10px;border-radius:99px;background:var(--wf-fill);color:var(--wf-ink)}
.wf-actions{display:flex;gap:10px;flex-wrap:wrap}.wf-btn{display:inline-block;padding:10px 18px;border-radius:10px;background:var(--wf-acc);color:#fff;font-size:14px;font-weight:600}.wf-btn+.wf-btn{background:transparent;color:var(--wf-ink);box-shadow:inset 0 0 0 1.5px var(--wf-ink)}
.wf-cut{color:inherit}
.wf-miss{color:#c62828!important;border-color:#e57373!important;background:#fff1f1}.wf-item-miss{outline:1.5px dashed #e57373;outline-offset:4px;border-radius:8px}.wf-m-icon svg{width:100%;height:100%;display:block}.wf-m-icon.wf-has-ic{background:none!important}.wf-ic-auto{opacity:.75}.wf-empty{display:inline-block;color:#b0b7b2;border:1px dashed #c9cfca;border-radius:6px;padding:2px 8px;font-size:12px}
.wf-media{width:100%;background:repeating-linear-gradient(135deg,#e7ebe7 0 10px,#eff2ef 10px 20px);border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--wf-mute);font-size:12px}
.wf-media img{width:100%;height:100%;object-fit:cover;display:block}
.wf-m-icon{width:40px;height:40px;border-radius:10px;background:var(--wf-fill);flex:none}
.wf-m-photo{width:72px;border-radius:50%;flex:none}.wf-m-logo{border-radius:8px}
.wf-m-sm{max-width:120px}
.wf-split{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}.wf-rev .wf-col-m{order:-1}
.wf-col{display:flex;flex-direction:column;gap:16px}
.wf-stack,.wf-center{display:flex;flex-direction:column;gap:14px}.wf-center{align-items:center;text-align:center}.wf-center .wf-lead{margin:0 auto}
.wf-twocol{display:grid;grid-template-columns:1fr 2fr;gap:40px}
.wf-pull{display:flex;gap:24px;align-items:flex-start;border-left:4px solid var(--wf-ink);padding-left:24px}.wf-pull .wf-lead{font-size:21px;font-style:italic}
.wf-bg{position:relative;border-radius:16px;overflow:hidden}.wf-bg .wf-media{border-radius:0;min-height:260px}.wf-bg-text{position:absolute;inset:auto 0 0 0;padding:28px;background:linear-gradient(transparent,rgba(255,255,255,.95) 30%);display:flex;flex-direction:column;gap:12px}
.wf-callout{display:flex;gap:16px;background:var(--wf-fill);border-radius:14px;padding:20px}.wf-callout>div{display:flex;flex-direction:column;gap:10px}
.wf-figure{margin:0;display:flex;flex-direction:column;gap:8px}
.wf-items{display:grid;gap:16px}
.wf-grid{grid-template-columns:repeat(var(--cols,3),minmax(0,1fr))}
.wf-item{display:flex;flex-direction:column;gap:10px;min-width:0}.wf-item-body{display:flex;flex-direction:column;gap:6px}
.wf-grid>.wf-item{background:var(--wf-fill);border-radius:14px;padding:16px}
.wf-people>.wf-item{background:none;padding:0}.wf-stats>.wf-item{background:none;border-top:2px solid var(--wf-ink);border-radius:0;padding:12px 0 0}
.wf-big{font-size:34px;font-weight:700;line-height:1}
.wf-gal>.wf-item{background:none;padding:0}.wf-gal>.wf-item .wf-media{border-radius:10px}
.wf-mosaic{grid-template-columns:2fr 1fr 1fr}.wf-mosaic>.wf-item:first-child{grid-row:span 2}
.wf-carousel{grid-auto-flow:column;grid-template-columns:none;grid-auto-columns:calc(33% - 10px);overflow:hidden}
.wf-list{grid-template-columns:1fr}.wf-list>.wf-item{border-top:1px solid var(--wf-line);padding-top:12px}
.wf-rows{grid-template-columns:1fr;gap:0}.wf-rows>.wf-item{flex-direction:row;border-top:1px solid var(--wf-line);padding:14px 0}.wf-rows .wf-item-body{display:grid;grid-template-columns:120px 1fr;gap:4px 16px;width:100%}.wf-rows .wf-item-body>:nth-child(n+3){grid-column:2}
.wf-olist .wf-item-body{grid-template-columns:1fr}.wf-num{font-weight:700;font-size:20px;color:var(--wf-mute)}.wf-mark{display:block;font-weight:700;font-size:18px;line-height:1.25}
.wf-faq details{border-top:1px solid var(--wf-line);padding:14px 0}.wf-faq summary{font-weight:600;cursor:pointer}.wf-faq details .wf-text{padding-top:8px}
.wf-tablewrap{overflow:auto}.wf-table{border-collapse:collapse;width:100%;font-size:14px}.wf-table th,.wf-table td{border-bottom:1px solid var(--wf-line);padding:8px 10px;text-align:left;vertical-align:top}.wf-table th{font-weight:600;background:var(--wf-fill)}
.wf-navihero{display:flex;flex-direction:column;gap:14px;padding:12px 0}
.wf-formbox{display:grid;grid-template-columns:1fr 1fr;gap:32px;background:var(--wf-fill);border-radius:18px;padding:28px}.wf-formbox>div{display:flex;flex-direction:column;gap:12px}
.wf-form{display:flex;flex-direction:column;gap:10px}.wf-input{display:block;background:#fff;border-radius:10px;padding:11px 14px;color:var(--wf-mute);font-size:14px}
@container (max-width:400px){
 .wf{padding:28px 16px}.wf-h1{font-size:28px}.wf-h2{font-size:22px}
 .wf-split,.wf-twocol,.wf-formbox{grid-template-columns:1fr}.wf-rev .wf-col-m{order:0}
 .wf-grid{grid-template-columns:1fr}.wf-gal,.wf-stats,.wf-logos{grid-template-columns:repeat(2,minmax(0,1fr))}
 .wf-mosaic{grid-template-columns:1fr 1fr}.wf-carousel{grid-auto-columns:75%}
 .wf-rows .wf-item-body{grid-template-columns:1fr}.wf-rows .wf-item-body>:nth-child(n+3){grid-column:1}
}`;
})();
