/* Тесты разбора: node tests/run.cjs
   Берут разметку статей (fixtures/*.lines.json) и настоящие ответы моделей (fixtures/<статья>.<модель>.json),
   прогоняют через G.applySeg и проверяют: ни одна строка не потеряна, число блоков как в эталоне,
   на месте H2. Плюс «слабый» ответ: сильный ответ, испорченный типичными ошибками GigaChat,
   должен собраться без потерь. Без браузера и без сети. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..'), fx = f => path.join(__dirname, 'fixtures', f);
const store = {}, ctx = {console, localStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem() {}}, navigator: {}, location: {hash: ''}, document: {createElement: () => ({style: {}}), head: {appendChild() {}}, querySelector: () => null}, setTimeout, clearTimeout, CSS: {escape: x => x}};
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['app/js/core.js', 'library/rules.js', 'library/settings.js', 'library/scenarios.js', 'library/templates.js', 'library/prompts.js', 'library/icons.js', 'library/examples.js', 'app/js/match.js', 'app/js/llm.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, {filename: f});
const G = ctx.Gridi, sc = G.lib.all('scenarios').find(x => x.kind === 'article');
let fail = 0; const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fail++; };
const run = (lines, answer) => { const page = G.newPage('t', sc.id, lines.join('\n')); const r = G.applySeg(page, answer); return {r, page}; };
const h2 = lines => lines.filter(l => /^\[h2\]/.test(l) && !/^\[h2\]\s*(Содержание|Что в статье)/.test(l)).length;

/* 1. настоящие ответы моделей */
const expect = {'tehnotrendy.gigachat-1': 26, 'tehnotrendy.gigachat-2': 26, 'tehnotrendy-bez-vremeni.deepseek': 26, 'kreditnaya-karta.gigachat-1': 14, 'kreditnaya-karta.gigachat-2': 12};
for (const [name, blocks] of Object.entries(expect)) {
  const lines = JSON.parse(fs.readFileSync(fx(name.split('.')[0] + '.lines.json'), 'utf8')), {r, page} = run(lines, JSON.parse(fs.readFileSync(fx(name + '.json'), 'utf8')));
  console.log(name);
  ok(r.lost === 0, `все ${r.total} строк на месте (потеряно ${r.lost})`);
  ok(page.blocks.length === blocks, `блоков ${page.blocks.length}, ждём ${blocks}`);
  const got = page.blocks.filter(b => /^\[h2\]/.test(b.text)).length - (page.blocks[0] && /^\[h2\]/.test(page.blocks[0].text) ? 1 : 0);
  ok(got >= h2(lines) - 1, `H2 на месте: ${got} из ${h2(lines)}`);
}

/* 2. слабый ответ: типичные ошибки GigaChat поверх ответа без ошибок */
const P = l => l.replace(/^\s*(\[(h[1-4]|кнопка|картинка)\]|@|[-•]\s)\s*/i, '').trim();
for (const f of fs.readdirSync(path.join(__dirname, 'fixtures')).filter(f => f.endsWith('.lines.json'))) {
  const lines = JSON.parse(fs.readFileSync(fx(f), 'utf8')), n = lines.length;
  /* «сильный» ответ — блок на каждую группу строк по разметке */
  const B = [{type: 'head', paras: '1-2'}]; let cur = null;
  const kind = l => /^\[h[23]\]/.test(l) ? 'h' : /^- /.test(l) ? 'li' : / \| /.test(l) && !/^\[ссылка\]/.test(l) ? 'tr' : 'p';
  for (let i = 3; i <= n; i++) { const k = kind(lines[i - 1]);
    if (k === 'h') { cur = null; B.push({type: 'text', h: String(i)}); continue; }
    const t = k === 'li' ? 'list' : k === 'tr' ? 'table' : 'text';
    if (cur && cur.type === t) { const key = t === 'list' ? 'items' : 'paras'; cur[key] += ',' + i; } else { cur = t === 'list' ? {type: t, items: String(i)} : {type: t, paras: String(i)}; B.push(cur); } }
  /* порча: чужие типы, заголовок текстом, items строкой с JSON, склейки, перестановка, повтор строки */
  const W = B.map((b, k) => { const o = {...b, type: {text: 'content', list: 'vrez', head: 'lead', table: 'vrez'}[b.type] || b.type};
    if (o.h) { o.title = P(lines[+o.h - 1]); delete o.h; }
    if (o.items && k % 2) o.items = JSON.stringify(o.items.split(',').map(p => ({title: '', p}))); return o; });
  for (let k = W.length - 2; k > 2; k -= 4) if (W[k].paras && W[k + 1].paras) { W[k].paras += ',' + W[k + 1].paras; W.splice(k + 1, 1); }
  if (W.length > 7) [W[5], W[6]] = [W[6], W[5]];
  if (W[8] && W[8].paras) W[8].paras += ',3';
  const s = run(lines, {blocks: B}), w = run(lines, {blocks: W});
  console.log(f.replace('.lines.json', '') + ' — слабый ответ');
  ok(s.r.lost === 0 && w.r.lost === 0, `строки на месте: сильный ${s.r.lost}, слабый ${w.r.lost} потеряно из ${n}`);
  ok(Math.abs(s.page.blocks.length - w.page.blocks.length) <= 3, `блоков: сильный ${s.page.blocks.length}, слабый ${w.page.blocks.length}`);
}
console.log(fail ? `\n${fail} провалов` : '\nвсе тесты прошли');
process.exit(fail ? 1 : 0);
