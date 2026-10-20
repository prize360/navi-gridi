/* Тесты разбора: node tests/run.cjs
   Берут разметку статей (fixtures/*.lines.json) и прогоняют разбор: сборка по разметке + ответ модели
   (группировка строк по номерам). Проверяют: ни одна строка не потеряна и не изменена, кнопки со ссылками
   на месте, плохой ответ модели не ломает страницу. Без браузера и без сети. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..'), fx = f => path.join(__dirname, 'fixtures', f);
const store = {}, ctx = {console, localStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem() {}}, navigator: {}, location: {hash: ''}, document: {createElement: () => ({style: {}}), head: {appendChild() {}}, querySelector: () => null}, setTimeout, clearTimeout, CSS: {escape: x => x}};
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['app/js/core.js', 'library/rules.js', 'library/settings.js', 'library/scenarios.js', 'library/templates.js', 'library/prompts.js', 'library/icons.js', 'library/examples.js', 'app/js/match.js', 'app/js/llm.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, {filename: f});
const G = ctx.Gridi, sc = G.lib.all('scenarios').find(x => x.kind === 'article');
let fail = 0; const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fail++; };
const norm = t => String(t || '').replace(/^\s*(\[[^\]]+\]|@|[-•]\s)\s*/gm, '').replace(/\s+/g, ' ').trim();
const words = blocks => norm(blocks.map(b => b.text).join('\n'));
for (const f of fs.readdirSync(path.join(__dirname, 'fixtures')).filter(f => f.endsWith('.lines.json'))) {
  const lines = JSON.parse(fs.readFileSync(fx(f), 'utf8')), name = f.replace('.lines.json', '');
  const mk = () => G.newPage('t', sc.id, lines.join('\n')), btns = lines.filter(l => /^\[кнопка\].*\|/.test(l)).length;
  const cnt = pg => pg.blocks.reduce((n, b) => n + (b.text.match(/^\[кнопка\].*\|/gm) || []).length, 0);
  console.log(name);
  /* промт: строки с номерами и блоки сборки */
  const pr = G.parsePrompt(mk()); ok(/\[1\] /.test(pr) && /== блок 1: /.test(pr), 'промт: строки с номерами и блоки по разметке');
  /* 1. модель не ответила — сборка по разметке */
  const a = mk(), ra = G.applyParse(a, null), R = G.parseLines(a);
  ok(!ra.byModel && a.blocks.length > 3, `без ответа — по разметке: ${a.blocks.length} блоков`);
  ok(words(a.blocks) === norm(R.join('\n')), 'по разметке: текст целиком, без изменений');
  ok(cnt(a) === btns, `кнопки со ссылками на месте: ${cnt(a)} из ${btns}`);
  /* 2. хороший ответ: блоки как у разметки, роли из сценария, заголовок без разметки отмечен */
  const base = mk(); G.assemble(base);
  let k = 0; const groups = base.blocks.map(b => { const n = b.text.split('\n').filter(x => x.trim()).length; const g = {role: b.role, lines: (k + 1) + '-' + (k + n)}; k += n; return g; });
  const b2 = mk(), r2 = G.applyParse(b2, {blocks: groups.map((g, i) => i === 3 ? {...g, tip: 'Длинный кусок — просится врез'} : g)});
  ok(r2.byModel && r2.lost === 0, `хороший ответ: модель, потеряно ${r2.lost}`);
  ok(words(b2.blocks) === norm(R.join('\n')), 'хороший ответ: текст целиком, без изменений');
  ok(cnt(b2) === btns, `хороший ответ: кнопки на месте ${cnt(b2)} из ${btns}`);
  ok((b2.blocks[3].tips || [])[0] === 'Длинный кусок — просится врез', 'подсказка модели — у блока');
  /* 3. модель делает пунктами длинные абзацы — Гриди не даёт */
  const long = R.map((l, i) => i + 1).filter(i => R[i - 1].length > 300 && !/^\s*(\[|@|- )/.test(R[i - 1]));
  if (long.length) { const b3 = mk(); G.applyParse(b3, {blocks: [{role: 'content', lines: '1-' + R.length, items: long.join(',')}]}); const t3 = b3.blocks.map(b => b.text).join('\n').split('\n'); ok(long.every(i => !t3.includes('- ' + R[i - 1])), `длинные абзацы не стали пунктами (${long.length})`); }
  /* 4. модель потеряла строки — они в «Не разобрано» в конце; потеряла много — сборка по разметке */
  const b4 = mk(), half = Math.floor(R.length * 0.9), r4 = G.applyParse(b4, {blocks: [{role: 'content', lines: '1-' + half}]});
  ok(r4.lost === R.length - half && b4.blocks.at(-1).role === 'unparsed', `потеряно ${r4.lost} — в «Не разобрано»`);
  ok(words(b4.blocks) === norm(R.join('\n')), 'с потерями: текст целиком');
  const b5 = mk(), r5 = G.applyParse(b5, {blocks: [{role: 'content', lines: '1-3'}]});
  ok(!r5.byModel && b5.blocks.length === a.blocks.length, 'потеряна большая часть — страница по разметке');
  /* 5. мусор в ответе: чужие роли, номера за пределами, повторы */
  const b6 = mk(), r6 = G.applyParse(b6, {blocks: [{role: 'нет такой', lines: '1-2,2,9999'}, {role: 'vrez', lines: '3-' + R.length + ',1'}]});
  ok(r6.byModel && words(b6.blocks) === norm(R.join('\n')) && b6.blocks.every(b => G.roleOf(sc, b.role).id === b.role), 'мусор в ответе: текст целиком, роли из сценария');
}
console.log(fail ? `\n${fail} провалов` : '\nвсе тесты прошли');
process.exit(fail ? 1 : 0);
