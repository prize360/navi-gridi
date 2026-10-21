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
/* эталоны: как статью разложил человек руками (fixtures/<статья>.manual.json) — сборка по разметке должна совпасть почти везде */
for (const f of fs.readdirSync(path.join(__dirname, 'fixtures')).filter(f => f.endsWith('.manual.json'))) {
  const name = f.replace('.manual.json', ''), want = JSON.parse(fs.readFileSync(fx(f), 'utf8')), lines = JSON.parse(fs.readFileSync(fx(name + '.lines.json'), 'utf8'));
  const pg = G.newPage('t', sc.id, lines.join('\n')); G.assemble(pg);
  const key = t => t.split('\n')[0].replace(/^\[[^\]]+\]\s*|^[-@]\s*/, '').slice(0, 14), got = pg.blocks.map(b => b.role + '|' + key(b.text)), have = new Set(got);
  const hit = want.filter(([r, k]) => have.has(r + '|' + k.slice(0, 14))).length;
  console.log(name + ' — эталон редактора'); ok(hit >= want.length - 3, `совпало блоков: ${hit} из ${want.length} (по разметке ${pg.blocks.length})`);
}
/* лендинг: эталонная страница мероприятия (fixtures/event-hand.md — ручная разметка) и тот же текст без разметки (event-plain.md).
   Ответы трёх моделей (event-*.{deepseek,gpt,gigachat}.json) — как они разобрали эти тексты 21.10.
   Проверка: текст целиком, ничего не «не встало в шаблон» после «Поправить», кнопки и таблица на месте */
{
  const ev = G.lib.get('scenarios', 'event'), rd = f => fs.readFileSync(fx(f), 'utf8'), cnt = pg => pg.blocks.reduce((n, b) => n + (b.text.match(/^\[кнопка\].*\|/gm) || []).length, 0);
  const lostErr = pg => G.checks(pg).filter(c => c.level === 'error' && /не встало/.test(c.text));
  const run = (src, ans) => { const pm = G.premark(rd(src)), pg = G.newPage('t', ev.id, pm.text); G.applyParse(pg, ans); G.fixByCode(pg); G.autoPick(pg); return {pg, R: G.parseLines(pg)}; };
  for (const src of ['event-hand.md', 'event-plain.md']) {
    console.log(src);
    for (const who of [null, 'deepseek', 'gpt', 'gigachat']) {
      const ans = who ? JSON.parse(rd(src.replace('.md', '.' + who + '.json'))) : null, {pg, R} = run(src, ans), tag = who || 'без модели';
      ok(words(pg.blocks) === norm(R.join('\n')), `${tag}: текст целиком`);
      ok(cnt(pg) === 3, `${tag}: кнопки со ссылками ${cnt(pg)} из 3`);
      ok(pg.blocks.some(b => b.tpl === 'table' && /Тариф \| Что входит/.test(b.text)), `${tag}: таблица — в таблице`);
      if (src === 'event-hand.md' || who) ok(!lostErr(pg).length, `${tag}: всё встало в шаблоны${lostErr(pg).length ? ' — ' + lostErr(pg).map(c => c.text).join(' | ') : ''}`);
      ok(pg.blocks[0].role === 'hero', `${tag}: первый экран первым`);
    }
  }
  /* правила разметки — на коротких примерах */
  console.log('правила разметки');
  const P = t => G.parse(t);
  ok(P('- Приходите заранее — регистрация с 9:00\n- Возьмите паспорт').items.every(i => !i.title), 'Р2: тире не во всех пунктах — пункты не делятся');
  ok(P('- Доклады — 12 спикеров — о продажах\n- Разборы — вживую').items[0].text === '12 спикеров — о продажах', 'Р2: делит по первому тире, остальное — текст');
  ok(P('- Важно: возьмите паспорт').items[0].title === '', 'Р2: двоеточие в одном пункте — не заголовок');
  ok(P('- 10:00 Регистрация\n- 11:00 — Открытие').items.map(i => i.title).join() === '10:00,11:00', 'Р2: время в начале — заголовок пункта');
  ok(P('[h2] Как добраться\nАбзац.\n[h3] На метро\nСтанция.\n[h3] На машине\nПарковка.').items.length === 2 && P('[h3] На метро\nСтанция.\n[h3] На машине\nПарковка.').items.length === 2, 'Р3/Р4: два [h3] — две карточки, не заголовок блока');
  ok(P('- А — 1\n- Б — 2\n[кнопка] Скачать | https://x.ru').cta.length === 1, 'Р5: кнопка не у каждого пункта — кнопка блока');
  ok(P('- А — 1\n[кнопка] Раз\n- Б — 2\n[кнопка] Два').items.every(i => i.cta), 'Р5: кнопка у каждого пункта — кнопки карточек');
  ok(!P('Москва | Онлайн\nА | Б | В').table && P('А | Б\nВ | Г').table, 'Р6: таблица — одинаковое число колонок');
  ok(G.premark('Зарегистрироваться | https://x.ru').text === '[кнопка] Зарегистрироваться | https://x.ru', 'В3: строка со ссылкой — кнопка');
}
console.log(fail ? `\n${fail} провалов` : '\nвсе тесты прошли');
process.exit(fail ? 1 : 0);
