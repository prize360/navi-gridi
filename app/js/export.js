/* Гриди — выгрузка */
'use strict';
(() => {
const G = window.Gridi;

const TRL = {а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'};
/* имена файлов латиницей: кириллица в архивах ломается на части систем */
const slug = s => String(s || 'page').toLowerCase().split('').map(c => TRL[c] ?? c).join('').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 50) || 'page';
const ext = data => (String(data).match(/^data:image\/(\w+)/) || [, 'png'])[1].replace('jpeg', 'jpg');
const dataBlob = d => { const [h, b] = d.split(','); const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], {type: h.slice(5).split(';')[0]}); };

/* слоты картинок блока: ключ, соотношение, размер, текст для Krea, alt */
G.imageSlots = (b, page) => {
  const t = G.tpl(b.tpl); if (!t || !t.media || ['icon'].includes(t.media.kind)) return [];
  const v = G.values(b, page) || {top: {}, items: []}, s = G.src(b), out = [];
  const textOf = o => Object.entries(o || {}).filter(([k, x]) => { const f = [...(t.fields || []), ...((t.items && t.items.fields) || [])].find(f => f.k === k); return f && !['btn', 'num', 'badge'].includes(f.role) && String(x || '').trim(); }).map(([, x]) => x).join('. ');
  const titleOf = o => { const f = [...(t.fields || []), ...((t.items && t.items.fields) || [])].find(f => ['title', 'qname', 'cap', 'itemFull', 'num2'].includes(f.role) && o && o[f.k]); return f ? o[f.k] : ''; };
  const size = t.media.size || '';
  if (t.media.per && t.items) (v.items || []).forEach((it, i) => out.push({key: 'i' + i, n: i + 1, ratio: t.media.ratio || '1:1', kind: t.media.kind, size, text: textOf(it) || s.images[i] || '', alt: titleOf(it) || s.images[i] || titleOf(v.top) || ''}));
  else out.push({key: 'main', n: 0, ratio: t.media.ratio || '1:1', kind: t.media.kind, size, text: textOf(v.top) || s.lead.slice(0, 300), alt: s.images[0] || titleOf(v.top) || s.title || ''});
  out.forEach(o => { const im = b.images[o.key] || {}; o.data = im.data || ''; o.alt = im.alt || o.alt; o.krea = t.krea && t.krea.url ? {name: 'Krea app шаблона', size: o.size, url: t.krea.url} : (G.lib.settings().krea || []).find(k => k.size === o.size) || null; if (t.krea && t.krea.prompt) o.text = t.krea.prompt + (o.text ? '\n\n' + o.text : ''); });
  return out;
};

const blockRows = (page) => page.blocks.map((b, i) => {
  const t = G.tpl(b.tpl), v = G.values(b, page) || {top: {}, items: []}, sc = G.scenario(page.scenario);
  return {i: i + 1, b, t, v, role: G.roleOf(sc, b.role).name, imgs: G.imageSlots(b, page)};
});

G.exportParts = page => {
  const sc = G.scenario(page.scenario), rows = blockRows(page), name = slug(page.name), ver = G.lib.version();
  const fileOf = (r, im) => im.data ? `graphics/${String(r.i).padStart(2, '0')}-${im.key}.${ext(im.data)}` : '';
  const parts = {};

  /* текст для верстальщика */
  parts.text = () => {
    const o = [`# ${page.name}`, '', `Сценарий: ${sc.name}. Библиотека: ${ver}.`, 'Блоки сверху вниз — в этом порядке собирайте страницу в админке.', ''];
    for (const r of rows) {
      if (!r.t) { o.push(`## ${r.i}. ${r.role} — шаблон не выбран`, '', G.src(r.b).lead, ''); continue; }
      const tags = [!r.t.status.prod && !r.t.component ? 'нужен дизайн' : ''].filter(Boolean);
      if (r.v.head) o.push(`## ${r.i}а. ${G.headTpl(r.b)} — заголовок`, `**${G.src(r.b).level === 'h3' ? 'H3' : 'H2'}:** ${r.v.head}`, '');
      o.push(`## ${r.i}. ${r.t.name}${tags.length ? ` (${tags.join('; ')})` : ''}`, `Роль: ${r.role}`, '');
      for (const f of r.t.fields || []) if (r.v.top[f.k]) o.push(`**${f.label}:** ${String(r.v.top[f.k]).replace(/\n/g, '\n\n')}`, '');
      (r.v.items || []).forEach((it, k) => { const line = r.t.items.fields.filter(f => f.role !== 'num' && it[f.k]).map(f => `${f.label}: ${it[f.k]}`).join(' / '); if (line) o.push(`${k + 1}. ${line}`); });
      if ((r.v.items || []).length) o.push('');
      r.imgs.forEach(im => o.push(`- Картинка ${im.n ? im.n : ''} ${im.ratio}: ${fileOf(r, im) || 'нет файла'}; alt: ${im.alt || '—'}`));
      if (r.imgs.length) o.push('');
    }
    return o.join('\n');
  };
  /* JSON для админки */
  parts.json = () => JSON.stringify({
    page: {name: page.name, scenario: sc.id, scenarioName: sc.name, library: ver, exported: new Date().toISOString()},
    blocks: rows.map(r => ({
      order: r.i, role: r.b.role, template: r.t ? r.t.name : null, templateId: r.t ? r.t.id : null,
      inAdmin: r.t ? !!r.t.status.prod : false,
      sectionHeading: r.v.head ? {template: G.headTpl(r.b), value: r.v.head} : null,
      fields: r.t ? (r.t.fields || []).map(f => ({key: f.k, label: f.label, max: f.max, value: r.v.top[f.k] || ''})) : [],
      items: r.t && r.t.items ? (r.v.items || []).map(it => r.t.items.fields.map(f => ({key: f.k, label: f.label, max: f.max, value: it[f.k] || ''}))) : [],
      images: r.imgs.map(im => ({slot: im.key, ratio: im.ratio, file: fileOf(r, im) || null, alt: im.alt})),
    })),
  }, null, 2);
  /* ТЗ на графику */
  parts.graphics = () => {
    const o = [`# Графика: ${page.name}`, '', 'Картинка — в Krea app своего размера, на вход текст из блока. Готовую загрузите в Гриди на слот или передайте файлом с этим именем.', ''];
    for (const r of rows) for (const im of r.imgs) {
      o.push(`## ${r.i}. ${r.role}${im.n ? ', элемент ' + im.n : ''}`, `- Шаблон: ${r.t.name}`, `- Соотношение: ${im.ratio}${im.size ? ', размер ' + im.size : ''}${im.kind === 'photo' ? ', фото/аватар' : ''}`,
        `- Krea app: ${im.krea && im.krea.url ? im.krea.url : '—'}`, `- Текст для генерации: ${im.text || '—'}`, `- Файл: ${fileOf(r, im) || `images/${String(r.i).padStart(2, '0')}-${im.key}.png`}`, `- alt: ${im.alt || '—'}`, '');
    }
    /* иконки: выбранные или подобранные — названия из SDDS Icons */
    const ic = rows.filter(r => r.t && r.t.media && r.t.media.kind === 'icon');
    if (ic.length) { o.push('## Иконки (SDDS Icons)', ''); ic.forEach(r => { const im = G.wireImgs(r.b, r.t); const names = Object.entries(im).filter(([, x]) => x && x.name).map(([k, x]) => `${k === 'main' ? 'блок' : 'элемент ' + (+k.slice(1) + 1)}: ${x.name}${x.auto ? ' (автоподбор)' : ''}`); o.push(`- ${r.i}. ${r.role} — ${names.length ? names.join('; ') : 'не выбраны'}`); }); o.push(''); }
    if (o.length === 4) o.push('На странице нет картинок.');
    return o.join('\n');
  };
  /* wireframe для согласования */
  parts.wire = () => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${G.esc(page.name)} — wireframe</title>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;600;700&display=swap" rel="stylesheet">
<style>body{margin:0;background:#f1f3f1;font-family:Onest,system-ui,sans-serif}.bar{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 20px;background:#fff;border-bottom:1px solid #dfe3df;font-size:14px;z-index:2}.bar button{font:inherit;padding:8px 14px;border-radius:9px;border:0;background:#1d2421;color:#fff;cursor:pointer}.sheet{max-width:1200px;margin:24px auto;box-shadow:0 1px 0 #dfe3df}.tag{font-size:11px;color:#6b7470;padding:6px 48px 0;background:#fff}@media print{.bar{display:none}.sheet{margin:0;box-shadow:none}body{background:#fff}.wf{break-inside:avoid}}${G.WIRE_CSS}</style></head>
<body><div class="bar"><span><b>${G.esc(page.name)}</b> · ${G.esc(sc.name)} · ${new Date().toLocaleDateString('ru-RU')}</span><button onclick="print()">Сохранить в PDF</button></div>
<div class="sheet wf-page">${rows.map(r => `<div class="tag">${r.i}. ${G.esc(r.role)}${r.t ? ' · ' + G.esc(r.t.name) : ''}</div>${G.wireBlock(r.t, r.v, G.wireImgs(r.b, r.t))}`).join('')}</div></body></html>`;
  /* шаблоны, которых не хватает */
  parts.missing = () => {
    const m = G.missing(page), o = [`# Недостающие шаблоны: ${page.name}`, '', 'Для этих блоков в админке нет подходящего шаблона. Ниже — что нужно собрать: тип, элементы, поля и лимиты по реальному тексту (+10%).', ''];
    if (!m.length) o.push('Всем блокам нашёлся шаблон из админки.');
    for (const x of m) {
      const t = x.t; o.push(`## ${x.role}: ${t.name.replace('Нужен: ', '')}`, `- В тексте: ${x.need || 'пусто'}`);
      if ((t.fields || []).length) o.push(`- Поля: ${t.fields.map(f => f.label + ' ' + f.max).join('; ')}`);
      if (t.items) o.push(`- Элементы ×${t.items.n}: ${t.items.fields.map(f => f.label + ' ' + f.max).join('; ') || 'только картинка'}`);
      if (t.media) o.push(`- Медиа: ${t.media.kind === 'photo' ? 'фото' : 'картинка'}${t.media.per ? ' у каждого элемента' : ''}`);
      if (x.best) o.push(`- ${G.isLive(x.best.t) ? 'Ближайший из админки' : 'Есть в библиотеке Гриди, в админке ещё нет'}: ${x.best.t.name} (по тексту: ${G.TIERS[x.best.tier || 0].toLowerCase()}${x.best.bad.length ? '; ' + x.best.bad.join('; ') : ''})`);
      o.push('');
    }
    return o.join('\n');
  };
  parts.project = () => JSON.stringify(G.pagePack(page, {full: true}), null, 1);
  parts.projectOld = () => JSON.stringify({gridi: 1, library: ver, templates: [...new Set(page.blocks.map(b => b.tpl).filter(Boolean))].map(id => G.tpl(id)).filter(t => t && !t.component).map(t => { const c = {...t}; delete c._local; delete c._base; return c; }), page: {...page, blocks: page.blocks.map(b => { const c = {...b}; delete c._src; delete c._srcFor; return c; })}}, null, 1);
  parts.name = name;
  parts.images = () => rows.flatMap(r => r.imgs.filter(im => im.data).map(im => ({path: fileOf(r, im), blob: dataBlob(im.data)})));
  return parts;
};

/* выгрузка — один архив; копирование из интерфейса остаётся основным способом */
G.EXPORTS = [
  {file: 'text.md', note: 'верстальщику: по блокам — какой шаблон и что в какое поле'},
  {file: 'page.json', note: 'для админки и чтобы открыть страницу в Гриди у коллеги'},
  {file: 'graphics/', note: 'ТЗ на картинки и загруженные файлы'},
  {file: 'wireframe.html', note: 'схема страницы на согласование, печатается в PDF'},
  {file: 'missing-templates.md', note: 'дизайнерам — если каких-то шаблонов не хватило'},
];
G.doExport = async page => {
  const P = G.exportParts(page), files = [];
  files.push({path: 'text.md', data: P.text()});
  const admin = JSON.parse(P.json()), proj = JSON.parse(P.project());
  files.push({path: 'page.json', data: JSON.stringify({...admin, gridi: proj.gridi, library: proj.library, scenario: proj.scenario, templates: proj.templates, page: proj.page}, null, 2)});
  files.push({path: 'graphics/graphics.md', data: P.graphics()});
  for (const im of P.images()) files.push({path: im.path, data: im.blob});
  files.push({path: 'wireframe.html', data: P.wire()});
  if (G.missing(page).length) files.push({path: 'missing-templates.md', data: P.missing()});
  if (!window.JSZip) { files.filter(f => typeof f.data === 'string').forEach(f => G.download(`${P.name}-${f.path.replace('/', '-')}`, f.data)); G.ui.toast('Архиватор не загрузился — файлы скачаны по одному'); return; }
  const z = new JSZip(), dir = z.folder(P.name);
  files.forEach(f => dir.file(f.path, f.data));
  G.download(`${P.name}.zip`, await z.generateAsync({type: 'blob'}));
};
G.openWire = page => { const w = window.open('', '_blank'); if (!w) { G.download(slug(page.name) + '-wireframe.html', G.exportParts(page).wire(), 'text/html;charset=utf-8'); return; } w.document.write(G.exportParts(page).wire()); w.document.close(); };
/* итоги пилота: что человек сделал в Гриди за время пилота — без ключа и картинок */
G.pilotExport = async withTexts => {
  if (!window.JSZip) { G.ui.toast('Не загрузилась библиотека архивов — проверьте интернет.'); return; }
  const z = new JSZip(), d = new Date().toISOString().slice(0, 10), clean = o => { const c = {...o}; delete c._base; return c; };
  const lib = {};
  for (const k of Object.keys(G.KINDS)) { const loc = G.lib.local(k); lib[k] = {
    changed: Object.values(loc.items).filter(o => G.lib.isBuiltIn(k, o.id)).map(clean),
    created: Object.values(loc.items).filter(o => !G.lib.isBuiltIn(k, o.id)).map(clean),
    removed: loc.removed }; }
  const pages = await G.store.list(), need = {};
  const summary = pages.map(p => { const blocks = p.blocks.map(b => { const t = G.tpl(b.tpl), r = t ? G.score(b, t, p) : null;
      if (!t || !G.isLive(t) || (r && r.tier >= 3)) { const key = t ? t.name : 'шаблон не выбран (' + G.roleOf(G.scenario(p.scenario), b.role).name + ')'; need[key] = (need[key] || 0) + 1; }
      return {role: b.role, template: t ? t.name : null, inAdmin: t ? G.isLive(t) : false, imported: !!(t && t.imported), group: r ? G.TIERS[r.tier || 0] : null}; });
    return {name: p.name, scenario: G.scenario(p.scenario).name, created: new Date(p.created).toISOString(), updated: new Date(p.updated).toISOString(), blocks, remarks: G.checks(p).length}; });
  const st = G.ls.get('stats', {asks: {}}), j = x => JSON.stringify(x, null, 2);
  const readme = [`# Итоги пилота Гриди — ${d}`, '', `Библиотека: версия ${G.lib.version()}`, `Страниц: ${pages.length}, блоков: ${summary.reduce((a, p) => a + p.blocks.length, 0)}`,
    `Шаблоны: изменено ${lib.templates.changed.length}, создано ${lib.templates.created.length}, удалено ${lib.templates.removed.length}`,
    `Сценарии: изменено ${lib.scenarios.changed.length}, создано ${lib.scenarios.created.length} · Промты: изменено ${lib.prompts.changed.length}, создано ${lib.prompts.created.length}`, '',
    '## Чего не хватило (блоков на шаблон)', ...Object.entries(need).sort((a, b) => b[1] - a[1]).map(([k, n]) => `- ${k}: ${n}`), '',
    '## Запуски модели', ...Object.entries(st.asks).map(([k, a]) => `- ${k}: ${a.n} раз, с JSON ${a.ok}, через ключ ${a.api}`), '',
    'Файлы: library/*.json — правки библиотеки, pages.json — состав страниц' + (withTexts ? ', pages/ — тексты' : '') + '.'].join('\n');
  z.file('README.md', readme);
  Object.entries(lib).forEach(([k, v]) => z.file(`library/${k}.json`, j(v)));
  z.file('library/imported-templates.json', j(Object.values(G.imported.all())));
  z.file('pages.json', j(summary)); z.file('model-usage.json', j(st));
  if (withTexts) pages.forEach((p, i) => z.file(`pages/${String(i + 1).padStart(2, '0')}-${slug(p.name)}.md`, `# ${p.name}\n\n` + p.blocks.map(b => `<!-- ${b.role} · ${(G.tpl(b.tpl) || {}).name || '—'} -->\n${b.text}`).join('\n\n')));
  G.download(`gridi-pilot-${d}.zip`, await z.generateAsync({type: 'blob'}));
};
/* ---------- страница целиком, со всем, от чего она зависит: свой сценарий и свои шаблоны ----------
   Для ссылки и архива. Встроенные шаблоны и сценарии не кладутся — они есть у всех. */
const clean = o => { const c = {...o}; delete c._local; delete c._base; delete c._src; delete c._srcFor; return c; };
G.pagePack = (page, {full = false} = {}) => {
  const sc = G.lib.get('scenarios', page.scenario), ids = [...new Set(page.blocks.map(b => b.tpl).filter(Boolean))];
  const tpls = ids.map(id => G.tpl(id)).filter(t => t && !t.component && (full || t._local || t.imported)).map(clean);
  const blocks = page.blocks.map(b => { const o = {role: b.role, text: b.text}; if (b.tpl) o.tpl = b.tpl; if (b.tplLock) o.lock = 1;
    const ic = {}; Object.entries(b.images || {}).forEach(([k, v]) => { if (v && v.icon) ic[k] = {icon: v.icon}; if (full && v && v.data) ic[k] = {...(ic[k] || {}), data: v.data, alt: v.alt}; }); if (Object.keys(ic).length) o.images = ic; return o; });
  return {gridi: 2, library: G.lib.version(), scenario: sc && (full || sc._local) ? clean(sc) : null, templates: tpls, page: {name: page.name, scenario: page.scenario, blocks}};
};
/* пакет → страница у получателя. Шаблон автора, которого нет или он другой, — «импортированный», только для этой страницы;
   сценарий автора, которого нет, — добавляется в библиотеку с пометкой «от коллеги». Свои правки получателя не трогаются */
G.unpack = j => {
  const p = G.newPage(j.page.name, j.page.scenario, ''); p.blocks = (j.page.blocks || []).map(x => { const b = G.newBlock(x.role, x.text || ''); if (x.tpl) b.tpl = x.tpl; b.tplLock = !!x.lock || !!x.tpl; b.images = x.images || {}; return b; });
  p.text = p.blocks.map(b => b.text).join('\n\n');
  const norm = t => { const c = {...t}; ['id', 'name', '_base', '_local', 'imported'].forEach(k => delete c[k]); return JSON.stringify(c); };
  const hash = x => { let h = 0; for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  let n = 0;
  for (const t of j.templates || []) { if (!t || !t.id) continue; const cur = G.tpl(t.id);
    if (cur && norm(cur) === norm(t)) continue;
    const id = t.imported ? t.id : 'imp-' + hash(norm(t)); if (!G.tpl(id)) { G.imported.add({...t, id, imported: true}); n++; }
    p.blocks.forEach(b => { if (b.tpl === t.id) b.tpl = id; }); }
  let scAdded = false;
  if (j.scenario && !G.lib.get('scenarios', j.scenario.id)) { G.lib.save('scenarios', {...j.scenario, name: j.scenario.name + ' (от коллеги)', imported: true}); scAdded = true; }
  if (!G.lib.get('scenarios', p.scenario)) p.scenario = (G.lib.all('scenarios')[0] || {}).id;
  p.blocks.forEach(b => { if (b.tpl && !G.tpl(b.tpl)) { b.tpl = null; b.tplLock = false; } });
  G.autoPick(p);
  return {page: p, tpls: n, scAdded};
};
/* ссылка: пакет сжимается в браузере (deflate) и кладётся в адрес после #s= — эта часть адреса не уходит на сайт */
const b64u = buf => { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; };
const pipe = async (data, stream) => new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(stream)).arrayBuffer());
G.pageLink = async page => {
  const json = JSON.stringify(G.pagePack(page)), base = location.href.replace(/#.*$/, '');
  if (!window.CompressionStream) return base + '#j=' + b64u(new TextEncoder().encode(json));
  return base + '#s=' + b64u(await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw')));
};
G.readLink = async hash => {
  const m = String(hash).match(/^#([sj])=(.+)$/); if (!m) return null;
  const raw = unb64u(m[2]), bytes = m[1] === 's' ? await pipe(raw, new DecompressionStream('deflate-raw')) : raw;
  const j = JSON.parse(new TextDecoder().decode(bytes)); if (!j.page || !j.page.blocks) throw new Error('В ссылке нет страницы Гриди.'); return j;
};

G.importProject = async file => {
  let raw;
  /* архив целиком — как его пришлют: page.json достаётся изнутри */
  if (/\.zip$/i.test(file.name) || file.type.includes('zip')) { if (!window.JSZip) throw new Error('Не загрузилась библиотека архивов — распакуйте архив и откройте page.json.'); const z = await JSZip.loadAsync(file), f = Object.values(z.files).find(x => /(^|\/)page\.json$/.test(x.name)); if (!f) throw new Error('В архиве нет page.json — это не выгрузка Гриди.'); raw = await f.async('string'); }
  else raw = await file.text();
  let j; try { j = JSON.parse(raw); } catch (err) { throw new Error('Это не файл Гриди — нужен архив выгрузки или page.json из него.'); }
  if (!j.page || !j.page.blocks) throw new Error('Это не файл Гриди — нужен архив выгрузки или page.json из него.');
  if (j.gridi === 2) { const r = G.unpack(j), p0 = r.page; p0.name += ' (от коллеги)'; await G.store.put(p0); return p0; }
  const p = j.page; p.id = G.uid('p'); { const names = (await G.store.list()).map(x => x.name); let n = p.name + ' (от коллеги)', k = 2; while (names.includes(n)) n = `${p.name} (от коллеги ${k++})`; p.name = n; }
  /* шаблоны, сценарии и промты автора, которых нет у получателя, — переносятся; свои правки получателя не трогаются */
  /* макет открывается как у автора: шаблон, которого у получателя нет или он другой, сохраняется как «импортированный» только для показа */
  const norm = t => { const c = {...t}; ['id', 'name', '_base', '_local', 'imported'].forEach(k => delete c[k]); return JSON.stringify(c); };
  const hash = x => { let h = 0; for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  let n = 0;
  for (const t of j.templates || []) { if (!t || !t.id) continue; const cur = G.tpl(t.id);
    if (cur && norm(cur) === norm(t)) continue;
    const id = t.imported ? t.id : 'imp-' + hash(norm(t)); if (!G.tpl(id)) { G.imported.add({...t, id, imported: true}); n++; }
    p.blocks.forEach(b => { if (b.tpl === t.id) b.tpl = id; }); }
  if (!G.scenario(p.scenario) || !G.lib.get('scenarios', p.scenario)) p.scenario = (G.lib.all('scenarios')[0] || {}).id;
  await G.store.put(p); if (n) G.ui.toast(`Макет открыт как у автора. ${n === 1 ? 'Один шаблон автора отличается от вашего — он сохранён только для этого макета и в библиотеку не добавлен' : G.num(n, 'шаблон', 'шаблона', 'шаблонов') + ' автора отличаются от ваших — они сохранены только для этого макета и в библиотеку не добавлены'}.`); return p;
};
})();
