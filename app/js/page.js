/* Гриди — экраны страницы: Текст, Сборка, Проверка, Выгрузка */
'use strict';
(() => {
const G = window.Gridi, S = G.ui, e = G.esc;
const scoreCls = n => n >= 75 ? 'hi' : n >= G.MISS ? 'mid' : 'lo';
const autosize = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
let hdrT = 0;
const changed = () => { S.checks = null; S.save(); clearTimeout(hdrT); hdrT = setTimeout(() => { if (!document.activeElement || document.activeElement.id !== 'pname') S.header(); }, 500); };

/* подсказки экрана: только своя группа, полный список — во вкладке «Проверка» */
const hints = cat => {
  const p = S.page; if (!p.blocks.length) return '';
  const all = G.checks(p).filter(c => c.cat === cat && c.level !== 'info'), info = G.checks(p).filter(c => c.cat === cat && c.level === 'info');
  const list = [...all, ...info]; if (!list.length) return '';
  const top = list.slice(0, 3);
  return `<div class="hints ${all.length ? '' : 'soft'}"><b>${all.length ? G.num(all.length, 'замечание', 'замечания', 'замечаний') : 'Заметки'}</b>${top.map((c, i) => `<button class="hint-it ${c.level}" data-hint="${i}">${e(c.text)}</button>`).join('')}${list.length > 3 ? `<a href="#/p/${p.id}/check">ещё ${list.length - 3} — в проверке</a>` : ''}</div>`;
};
const bindHints = (v, cat) => { const p = S.page, list = (() => { const c = G.checks(p).filter(x => x.cat === cat); return [...c.filter(x => x.level !== 'info'), ...c.filter(x => x.level === 'info')]; })();
  v.querySelectorAll('[data-hint]').forEach(b => b.onclick = () => { const c = list[+b.dataset.hint]; if (c && c.block) { S.sel = c.block.id; S.scrollTo = true; S.render(); } else S.go(`#/p/${p.id}/check`); }); };

/* ============ ТЕКСТ ============ */
const tplChip = (b, p) => { const t = G.tpl(b.tpl); if (!t) return `<button class="tplchip" data-act="tpl"><span class="chip warn">нет шаблона</span></button>`; const sc0 = G.score(b, t, p).score; return `<button class="tplchip" data-act="tpl" title="Шаблон — открыть в сборке"><span>${e(t.name)}</span><b class="score ${scoreCls(sc0)}">${sc0}</b></button>`; };
const PH = {
  hero: '[h1] Заголовок страницы\n@ дата, место или автор\nПодзаголовок\n[кнопка] Текст кнопки',
  content: '[h2] Заголовок раздела — по желанию\nТекст как у автора',
  vrez: 'Врез: цифра, цитата, карточки или картинка\n- Пункт — пояснение\n[картинка] Подпись',
  _: '[h2] Заголовок блока\nТекст\n- Пункт — пояснение',
};
G.views.text = v => {
  const p = S.page, sc = G.scenario(p.scenario), art = sc.kind === 'article';
  if (!p.blocks.length || S.showSource) return sourceView(v);
  const state = b => { if (!G.tpl(b.tpl)) return ''; if (G.stale(b)) return `<div class="state"><span class="chip">текст правили после адаптации — шаблон заполнен из него</span></div>`; if (b.values && b.valuesBy && b.valuesBy !== 'hand') return `<div class="state"><span class="chip ok">адаптирован: ${e((G.prompt(b.valuesBy) || {name: b.valuesBy}).name)}</span></div>`; return ''; };
  const blk = (b, i) => `<article class="blk ${S.sel === b.id ? 'sel' : ''}" data-id="${b.id}" id="blk-${b.id}">
      <div class="seam"><span class="num">${String(i + 1).padStart(2, '0')}</span><button class="dd ${b.role === 'vrez' ? 'vrez' : ''}" data-act="role" aria-label="Роль блока"><span>${e(G.roleOf(sc, b.role).name)}</span></button><span class="summ" data-summ>${e(G.blockSummary(b))}</span>${tplChip(b, p)}
        <button class="ib sm gr-ghost" data-act="adapt" title="Адаптировать блок" aria-label="Адаптировать блок">${G.icon.spark}</button>
        <button class="ib sm" data-act="more" title="Действия с блоком" aria-label="Действия с блоком">${G.icon.more}</button></div>
      <textarea class="blk-text" data-act="text" rows="2" spellcheck="true" placeholder="${e(PH[b.role] || PH._)}" aria-label="${e(G.roleOf(sc, b.role).name)}">${e(b.text)}</textarea>
      ${(b.tips || []).length ? `<div class="tips">${b.tips.map(t => `<div class="tip">• ${e(t)}</div>`).join('')}</div>` : ''}
      ${state(b)}
    </article>`;
  const roleN = r => p.blocks.filter(b => b.role === r.id).length;
  const textLen = p.blocks.filter(b => b.role === 'content').reduce((a, b) => a + G.len(G.src(b).lead), 0), vrez = p.blocks.filter(b => b.role === 'vrez').length;
  v.innerHTML = `<div class="col">
    <div class="head"><p class="eye">Текст · ${e(sc.name)}</p><h1 class="h1">${e(p.name)}</h1>
      <p class="lead">Проверьте роли, порядок и смыслы. Текст блока правится в одном поле. Разделить блок — курсор в нужное место и Alt+Enter.</p></div>
    ${hints('text')}
    <div class="card sccard">
      <div class="row"><button class="dd" id="scConv" title="Пересобрать текст под другой сценарий"><span>Сценарий: ${e(sc.name)}</span></button><span class="hint grow">Цель — ${e((sc.action || '').toLowerCase())}</span><button class="btn sm ghost" id="legend">Разметка</button><button class="btn sm ghost" id="toSource">${G.icon.file}Исходный текст</button></div>
      ${art ? '' : `<div class="roles">${sc.roles.map(r => { const n = roleN(r); return `<button class="role ${n ? 'has' : 'miss'} ${r.req ? 'req' : ''}" data-role="${r.id}" title="${n ? 'Показать блок' : 'Добавить блок'}"><span class="dot"></span>${e(r.name.split(':')[0])}${n > 1 ? `<em>×${n}</em>` : n ? '' : ' +'}</button>`; }).join('')}</div>`}
      ${art ? `<div class="stats"><span>Текст <b>${textLen.toLocaleString('ru-RU')} зн.</b></span><span>Врезы <b>${vrez}</b></span><span>Текста на врез <b>${vrez ? Math.round(textLen / vrez).toLocaleString('ru-RU') + ' зн.' : '—'}</b> · хорошо до ${((sc.rhythm && sc.rhythm.maxRun) || 1000).toLocaleString('ru-RU')}</span></div>` : ''}
      ${(p.story || []).length ? `<ul class="story">${p.story.map(t => `<li>${e(t)}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="blocks">${p.blocks.map(blk).join('')}</div>
  </div>`;
  v.querySelectorAll('.blk-text').forEach(ta => { autosize(ta); });
  bindText(v.querySelector('.col')); bindHints(v, 'text');
  S.cta({label: art ? 'Добавить врез или текст' : 'Добавить блок', icon: G.icon.plus, run: btn => insertMenu(btn, p.blocks.length)});
  if (S.sel) { const el = document.getElementById('blk-' + S.sel); if (el && S.scrollTo) { el.scrollIntoView({block: 'center'}); S.scrollTo = false; } }
};
const blockOf = el => { const a = el.closest('[data-id]'); return a && S.page.blocks.find(b => b.id === a.dataset.id); };
const insertMenu = (anchor, at) => {
  const p = S.page, sc = G.scenario(p.scenario);
  const add = role => { const b = G.newBlock(role); p.blocks.splice(at, 0, b); S.sel = b.id; changed(); S.render().then(() => { const t = document.querySelector(`#blk-${b.id} textarea`); t && t.focus(); }); };
  /* целевое действие можно добавить в любой сценарий, даже если в его блоках его нет */
  const roles = [...(sc.kind === 'article' ? sc.roles.filter(r => ['content', 'vrez'].includes(r.id)) : sc.roles), ...(sc.roles.some(r => r.id === 'cta') || p.blocks.some(b => b.role === 'cta') ? [] : [G.roleOf(sc, 'cta')])];
  S.menu(anchor, roles.map(r => ({label: r.name, note: r.meaning, run: () => add(r.id)})));
};
const bindText = v => {
  const p = S.page;
  const cv = v.querySelector('#scConv'); if (cv) cv.onclick = () => S.menu(cv, [{head: 'Пересобрать в другой сценарий'}, ...G.lib.all('scenarios').filter(x => x.id !== p.scenario).map(x => ({label: x.name, note: 'Новая страница-копия: модель перескажет текст под блоки сценария', run: () => convertTo(x)}))]);
  v.querySelector('#toSource').onclick = () => { S.showSource = true; S.render(); };
  v.querySelector('#legend').onclick = () => legend();
  v.querySelectorAll('.role').forEach(btn => btn.onclick = () => {
    const id = btn.dataset.role, b = p.blocks.find(x => x.role === id);
    if (b) { S.sel = b.id; S.scrollTo = true; return S.render(); }
    const sc = G.scenario(p.scenario), order = sc.roles.map(r => r.id), my = order.indexOf(id);
    let at = p.blocks.findIndex(x => order.indexOf(x.role) > my); if (at < 0) at = p.blocks.length;
    const nb = G.newBlock(id); p.blocks.splice(at, 0, nb); S.sel = nb.id; S.scrollTo = true; changed(); S.render().then(() => { const t = document.querySelector(`#blk-${nb.id} textarea`); t && t.focus(); });
  });
  v.addEventListener('input', ev => {
    const ta = ev.target; if (!ta.matches('.blk-text')) return;
    const b = blockOf(ta); b.text = ta.value; autosize(ta);
    const s = ta.closest('.blk').querySelector('[data-summ]'); if (s) s.textContent = G.blockSummary(b);
    changed();
  });
  v.addEventListener('focusin', ev => { const b = ev.target.closest && ev.target.closest('.blk') && blockOf(ev.target); if (b && S.sel !== b.id) { v.querySelectorAll('.blk.sel').forEach(x => x.classList.remove('sel')); S.sel = b.id; ev.target.closest('.blk').classList.add('sel'); } });
  v.addEventListener('focusout', ev => {
    if (!(ev.target.matches && ev.target.matches('.blk-text'))) return;
    const b = blockOf(ev.target); if (!b) return;
    if (/\n\s*-{3,}\s*(\n|$)/.test(b.text)) { const parts = b.text.split(/\n\s*-{3,}\s*(?:\n|$)/).map(x => x.trim()).filter(Boolean), i = p.blocks.indexOf(b);
      b.text = parts[0] || ''; b.values = null; p.blocks.splice(i + 1, 0, ...parts.slice(1).map(t => G.newBlock(G.scenario(p.scenario).kind === 'article' ? 'content' : b.role, t))); G.autoPick(p); changed(); setTimeout(() => S.render(), 0); return; }
    if (!b.tplLock) { const r = G.rank(b, p)[0]; const nt = r ? r.t.id : null; if (nt !== b.tpl) { b.tpl = nt; b.values = null; S.save(); } }
    const chip = ev.target.closest('.blk').querySelector('.tplchip'); if (chip) chip.outerHTML = tplChip(b, p);
  });
  v.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.altKey && ev.target.matches('.blk-text')) { ev.preventDefault(); splitAt(blockOf(ev.target), ev.target); } });
  v.addEventListener('click', ev => {
    const a = ev.target.closest('[data-act]'); if (!a || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') return;
    const act = a.dataset.act;
    if (act === 'ins') return insertMenu(a, +a.dataset.at);
    const b = blockOf(a); if (!b) return;
    if (act === 'role') { const sc = G.scenario(p.scenario); S.menu(a, [...sc.roles, ...(sc.roles.some(r => r.id === 'cta') ? [] : [G.roleOf(sc, 'cta')])].map(r => ({label: r.name, checked: r.id === b.role, run: () => { b.role = r.id; if (!b.tplLock) b.tpl = null; G.autoPick(p); changed(); S.render(); }}))); }
    if (act === 'tpl') { S.sel = b.id; S.scrollTo = true; S.go(`#/p/${p.id}/tpl`); }
    if (act === 'adapt') S.adaptMenu(a, b.id);
    if (act === 'more') blockMenu(a, b);
  });
};
const convertTo = sc => {
  const p = S.page;
  const m = S.modal(`<div class="modal-h"><h2 class="h2">Пересобрать в «${e(sc.name)}»</h2><button class="ib" data-close aria-label="Закрыть">${G.icon.x}</button></div>
    <p style="margin:0 0 8px">Модель перескажет текст под блоки сценария «${e(sc.name)}»: возьмёт только факты из материала, а там, где фактов нет, оставит пометку «нужно от автора».</p>
    <p class="hint" style="margin:0">Получится новая страница. Эта останется как есть.</p>
    <div class="modal-f"><button class="btn ghost" data-close>Отменить</button><button class="btn pri" id="cvOk">${G.icon.spark}Пересобрать</button></div>`);
  m.$('#cvOk').onclick = async () => { m.root.remove();
    try { const np = await G.convertPage(p, sc.id); await G.store.put(np); S.toast(`Готово: ${G.num(np.blocks.length, 'блок', 'блока', 'блоков')} в сценарии «${sc.name}»`); S.go(`#/p/${np.id}/text`); }
    catch (err) { if (err.message !== 'cancel') S.toast(err.message); } };
};
const splitAt = (b, ta) => {
  const p = S.page, i = p.blocks.indexOf(b), a = ta ? ta.selectionStart : 0, z = ta ? ta.selectionEnd : 0, art = G.scenario(p.scenario).kind === 'article';
  if (z > a) { /* выделение уходит в отдельный блок (у статьи — во врез) */
    const sel = ta.value.slice(a, z).trim(), before = ta.value.slice(0, a).trim(), after = ta.value.slice(z).trim();
    b.text = before; const nb = G.newBlock(art ? 'vrez' : b.role, sel); const rest = after ? G.newBlock(b.role, after) : null;
    p.blocks.splice(i + 1, 0, nb, ...(rest ? [rest] : [])); if (!before) p.blocks.splice(i, 1); S.sel = nb.id;
  } else {
    const before = ta.value.slice(0, a).trim(), after = ta.value.slice(a).trim();
    if (!before || !after) { S.toast('Поставьте курсор между абзацами, где делить блок.'); return; }
    b.text = before; const nb = G.newBlock(b.role === 'hero' ? 'about' : b.role, after); p.blocks.splice(i + 1, 0, nb);
    if (art && b.role === 'content') { const vz = G.newBlock('vrez'); p.blocks.splice(i + 1, 0, vz); S.sel = vz.id; } else S.sel = nb.id;
  }
  b.values = null; G.autoPick(p); changed(); S.render().then(() => { const t = document.querySelector(`#blk-${S.sel} textarea`); t && t.focus(); });
};
const blockMenu = (a, b) => {
  const p = S.page, i = p.blocks.indexOf(b), art = G.scenario(p.scenario).kind === 'article', ta = document.querySelector(`#blk-${b.id} textarea`);
  const move = d => { p.blocks.splice(i, 1); p.blocks.splice(i + d, 0, b); changed(); S.render(); };
  S.menu(a, [
    {label: art ? 'Разделить врезом' : 'Разделить по курсору', note: 'Alt+Enter. Выделенный текст уйдёт в отдельный блок', run: () => splitAt(b, ta)},
    ...(i < p.blocks.length - 1 ? [{label: 'Объединить со следующим', run: () => { const n = p.blocks[i + 1]; b.text = [b.text, n.text].filter(x => x.trim()).join('\n'); p.blocks.splice(i + 1, 1); b.values = null; G.autoPick(p); changed(); S.render(); }}] : []),
    ...(i > 0 ? [{label: 'Выше', run: () => move(-1)}] : []),
    ...(i < p.blocks.length - 1 ? [{label: 'Ниже', run: () => move(1)}] : []),
    ...(b.orig && b.orig !== b.text ? [{label: 'Вернуть текст автора', note: 'Как было до адаптации', run: () => { b.text = b.orig; delete b.orig; b.values = null; changed(); S.render(); }}] : []),
    {label: 'Выбрать шаблон', run: () => { S.sel = b.id; S.scrollTo = true; S.go(`#/p/${p.id}/tpl`); }},
    '-',
    {label: 'Удалить блок', danger: true, run: () => { p.blocks.splice(i, 1); changed(); S.render(); }},
  ]);
};
const legend = () => S.modal(`<div class="modal-h"><h2 class="h2">Разметка текста</h2><button class="ib" data-close aria-label="Закрыть">${G.icon.x}</button></div>
  <p class="hint" style="margin-top:-6px">Необязательна: модель разбирает и неразмеченный текст. Размеченное она не трогает.</p>
  <div class="marklegend"><code>[h1] Текст</code><span>Заголовок страницы — только в первом экране</span><code>[h2] Текст</code><span>Начинает новый блок с заголовком</span><code>---</code><span>Новый блок без заголовка. Так делят длинный раздел на несколько смысловых блоков — у каждого будет свой шаблон</span><code>[h3] Текст</code><span>Подзаголовок внутри блока — станет пунктом с заголовком</span><code>- Пункт — пояснение</code><span>Пункт списка: до тире заголовок пункта, после — текст</span><code>@ Текст</code><span>Дата, место, автор, должность. После пункта — относится к пункту</span><code>[кнопка] Текст</code><span>Кнопка блока. После пункта — кнопка пункта</span><code>[картинка] Подпись</code><span>Картинка. Несколько подряд — галерея</span><code>Ячейка | Ячейка</code><span>Строка таблицы, первая строка — заголовки. Блок из таких строк получает компонент «Таблица»</span></div>
  <p class="hint" style="margin:12px 0 0">Работает в исходном тексте («Собрать по разметке») и прямо в блоке: напишите <code>---</code> на отдельной строке — блок разделится, когда уйдёте из поля.</p>
  <div class="modal-f"><button class="btn pri" data-close>Понятно</button></div>`);

/* исходный текст и разбор */
const sourceView = v => {
  const p = S.page, sc = G.scenario(p.scenario), has = p.blocks.length > 0;
  v.innerHTML = `<div class="col">
    <div class="head"><p class="eye">Текст автора</p><h1 class="h1">${e(p.name)}</h1>
      <p class="lead">Вставьте материал целиком. Гриди разделит его на блоки по сценарию — текст при этом не меняется.</p></div>
    <div class="toolrow"><span class="chip">Сценарий: ${e(sc.name)}</span><span class="hint grow" id="srcLen"></span><button class="btn sm ghost" id="legend2">Разметка</button>${has ? `<button class="btn sm" id="back">К блокам</button>` : ''}</div>
    <textarea class="ta srcta" id="src" placeholder="Текст статьи или лендинга. Из Google Docs и Word заголовки и списки разметятся сами.">${e(p.text)}</textarea>
    <div class="toolrow"><button class="btn sm" id="asm">Собрать по разметке, без модели</button><span class="hint" id="asmHint"></span></div>
    ${has ? '<p class="hint" style="margin:0">Новый разбор заменит текущие блоки и правки в них.</p>' : ''}
  </div>`;
  const ta = v.querySelector('#src'); S.bindPaste(ta);
  const upd = () => { const n = G.len(ta.value), mx = G.scenario(p.scenario).maxText; v.querySelector('#srcLen').textContent = n ? `${n.toLocaleString('ru-RU')} зн.${mx && n > mx ? ` — в разбор уйдёт ${mx.toLocaleString('ru-RU')}` : ''}` : ''; const full = G.fullyMarked(ta.value); v.querySelector('#asmHint').textContent = full ? 'Текст размечен — модель не нужна' : 'Без модели нужны хотя бы [h1] и [h2]'; };
  upd(); ta.oninput = () => { p.text = ta.value; upd(); S.save(); };
  v.querySelector('#legend2').onclick = () => legend();
  const back = v.querySelector('#back'); if (back) back.onclick = () => { S.showSource = false; S.render(); };
  const sure = () => !has || confirm('Заменить текущие блоки новым разбором?');
  v.querySelector('#asm').onclick = () => { if (!ta.value.trim()) return S.toast('Сначала вставьте текст.'); if (!sure()) return; G.assemble(p); S.showSource = false; changed(); S.render(); S.toast(`Собрано ${G.num(p.blocks.length, 'блок', 'блока', 'блоков')} по разметке`); };
  S.cta({label: 'Разобрать текст', icon: G.icon.spark, run: async () => {
    if (!ta.value.trim()) return S.toast('Сначала вставьте текст.'); if (!sure()) return;
    try { const j = await G.ask('Разбор: ' + G.scenario(p.scenario).name, G.segPrompt(p)); const rs = G.applySeg(p, j); S.showSource = false; changed(); S.render(); S.toast(rs.lost ? `Готово, но модель пропустила ${G.num(rs.lost, 'абзац', 'абзаца', 'абзацев')} из ${rs.total} — они в последнем блоке. Слабая модель: попробуйте другую или «Собрать по разметке».` : `Готово: ${G.num(p.blocks.length, 'блок', 'блока', 'блоков')}`); }
    catch (err) { if (err.message !== 'cancel') S.toast(err.message); }
  }});
};

/* ============ ШАБЛОНЫ: схема блоков + выбор шаблона дропдауном ============ */
/* выбор шаблона: группы по тому, сколько придётся менять в тексте; выбрать можно любой */
const tierNote = r => { const w = [...r.bad, ...(r.why || []).filter(x => !/^(всё на месте|компонент|рекомендован|текстовый)/.test(x))]; return w.slice(0, 2).join(', '); };
const tplMenu = (anchor, b, all) => {
  const p = S.page, t = G.tpl(b.tpl), ranked = G.rank(b, p);
  const item = r => ({label: r.t.name, search: r.t.name + ' ' + (r.t.type || ''), note: [G.isLive(r.t) ? '' : G.TIERS[r.tier || 0].toLowerCase(), tierNote(r)].filter(Boolean).join(' · '), bad: r.tier >= 4, checked: t && t.id === r.t.id, run: () => { b.tpl = r.t.id; b.tplLock = true; changed(); S.scrollTo = false; if (canvasBox && document.body.contains(canvasBox)) drawCanvas(); else S.render(); }});
  /* сначала шаблоны из админки по тому, сколько менять в тексте; «нужен дизайн» — отдельно в конце: это самый дорогой путь */
  const groups = [...G.TIERS.map((name, k) => ({name, list: ranked.filter(r => G.isLive(r.t) && (r.tier || 0) === k)})), {name: 'Нужен дизайн — шаблона нет в админке', list: ranked.filter(r => !G.isLive(r.t))}].filter(g => g.list.length);
  const items = [];
  groups.forEach(g => { items.push({head: g.name}); g.list.forEach((r, k) => items.push({...item(r), extra: !all && k >= 3})); if (!all && g.list.length > 3) items.push({label: `ещё ${g.list.length - 3}`, more: true, run: () => tplMenu(anchor, b, true)}); });
  if (!groups.length || groups[0].name !== G.TIERS[0]) items.push('-', {label: 'Создать шаблон', note: 'Точного шаблона нет — сделать в конструкторе', run: () => S.go('#/lib/templates/new')});
  S.menu(anchor, items);
};
/* определение поля по пути top.k / items.i.k / head */
const fdefOf = (t, path) => { const [a, i, k] = path.split('.'); return a === 'head' ? G.HEAD : a === 'top' ? (t.fields || []).find(f => f.k === i) : t.items && t.items.fields.find(f => f.k === k); };
const valOf = (v, path) => { const [a, i, k] = path.split('.'); return (a === 'head' ? v.head : a === 'top' ? v.top[i] : (v.items[+i] || {})[k]) || ''; };
const setVal = (b, p, path, val) => {
  const cur = G.clone(G.values(b, p)), [a, i, k] = path.split('.');
  if (a === 'head') cur.head = val; else if (a === 'top') cur.top[i] = val; else { while (cur.items.length <= +i) cur.items.push({}); cur.items[+i][k] = val; }
  G.setValues(b, cur, b.valuesBy && b.valuesBy !== 'hand' ? b.valuesBy : 'hand');
};
/* картинки блока — окно */
const imagesModal = (b, p) => {
  const slots = G.imageSlots(b, p);
  const m = S.modal(`<div class="modal-h"><h2 class="h2">Картинки блока</h2><button class="ib" data-close aria-label="Закрыть">${G.icon.x}</button></div>
    ${slots.map(s => `<div class="slot"><div class="thumb">${s.data ? `<img src="${s.data}" alt="">` : e(s.ratio)}</div><div>
      <div class="row" style="gap:6px"><b style="font-size:13px">${s.n ? 'Элемент ' + s.n : 'Основная'}</b><span class="chip">${e(s.ratio)}${s.size ? ' · ' + s.size : ''}</span>${s.krea && s.krea.url ? `<a class="chip ok" href="${e(s.krea.url)}" target="_blank" rel="noopener">Krea app</a>` : ''}</div>
      <div class="row" style="gap:6px;margin:6px 0"><button class="btn sm" data-kcopy="${s.key}">${G.icon.copy}Текст для Krea</button><label class="btn sm" for="up-${s.key}">${G.icon.up}Загрузить</label><input type="file" accept="image/*" class="sr" id="up-${s.key}" data-up="${s.key}">${s.data ? `<button class="btn sm ghost" data-rm="${s.key}">Убрать</button>` : ''}</div>
      <input class="in" data-alt="${s.key}" value="${e(s.alt)}" aria-label="alt картинки" placeholder="alt — текст из шаблона"></div></div>`).join('')}
    <div class="modal-f"><button class="btn pri" data-close>Готово</button></div>`, {onClose: () => S.render()});
  m.root.addEventListener('click', async ev => {
    const k = ev.target.closest('[data-kcopy]'); if (k) { await G.copy(slots.find(x => x.key === k.dataset.kcopy).text); S.toast('Текст для Krea скопирован'); }
    const rm = ev.target.closest('[data-rm]'); if (rm) { delete b.images[rm.dataset.rm].data; changed(); m.close(); imagesModal(b, p); }
  });
  m.root.addEventListener('input', ev => { const el = ev.target; if (el.dataset.alt) { b.images[el.dataset.alt] = {...(b.images[el.dataset.alt] || {}), alt: el.value}; changed(); } });
  m.root.addEventListener('change', ev => {
    const el = ev.target; if (!el.dataset.up || !el.files[0]) return; const f = el.files[0]; if (f.size > 4e6) return S.toast('Картинка больше 4 МБ — уменьшите её.');
    const r = new FileReader(); r.onload = () => { const key = el.dataset.up, slot = slots.find(s => s.key === key); b.images[key] = {...(b.images[key] || {}), data: r.result, name: f.name, alt: (b.images[key] || {}).alt || slot.alt}; changed(); m.root.remove(); imagesModal(b, p); }; r.readAsDataURL(f);
  });
};
/* картинка кликом по макету: загрузить, текст для Krea, убрать */
const iconPop = (el, b, p) => {
  document.querySelectorAll('.epop').forEach(x => x.remove());
  const key = el.dataset.img, all = G.icons(), sug = G.iconMatch(G.iconText(b, key), 12), cur = ((b.images || {})[key] || {}).icon;
  const pop = document.createElement('div'); pop.className = 'epop epop--ic';
  const grid = list => list.map(ic => `<button class="icb ${ic.id === cur ? 'on' : ''}" data-ic="${e(ic.id)}" title="${e(ic.name)}">${ic.svg}<small>${e(ic.name)}</small></button>`).join('');
  pop.innerHTML = all.length ? `<div class="epop-h"><span>Иконка</span><b>${all.length} в каталоге</b></div><input class="in" id="icq" placeholder="Найти иконку"><div class="icgrid" id="icg">${sug.length ? `<p class="hint" style="grid-column:1/-1;margin:0">Подходят по смыслу</p>${grid(sug)}<p class="hint" style="grid-column:1/-1;margin:0">Все</p>` : ''}${grid(all.slice(0, 60))}</div>${cur ? '<button class="btn sm ghost" data-clear>Подбирать автоматически</button>' : ''}`
    : `<div class="epop-h"><span>Иконка</span></div><p class="hint" style="margin:0">Каталог иконок пуст — проверьте файл library/icons.js в репозитории. После этого здесь будет выбор и автоподбор по смыслу.</p><button class="btn sm" data-lib>Открыть иконки</button>`;
  document.body.appendChild(pop);
  const r = el.getBoundingClientRect(), w = Math.min(440, innerWidth - 16); pop.style.width = w + 'px';
  pop.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
  const h = pop.offsetHeight; pop.style.top = (r.bottom + 8 + h > innerHeight ? Math.max(8, r.top - h - 8) : r.bottom + 8) + 'px';
  const close = () => { pop.remove(); document.removeEventListener('mousedown', out, true); };
  const out = ev => { if (!pop.contains(ev.target)) close(); };
  setTimeout(() => document.addEventListener('mousedown', out, true), 0);
  pop.onclick = ev => { const x = ev.target.closest('[data-ic]'); if (x) { b.images[key] = {...(b.images[key] || {}), icon: x.dataset.ic}; changed(); close(); drawCanvas(); }
    if (ev.target.closest('[data-clear]')) { delete (b.images[key] || {}).icon; changed(); close(); drawCanvas(); }
    if (ev.target.closest('[data-lib]')) { close(); S.go('#/lib/icons'); } };
  const q = pop.querySelector('#icq'); if (q) { q.focus(); q.oninput = () => { const v = q.value.trim().toLowerCase(); pop.querySelector('#icg').innerHTML = grid((v ? all.filter(ic => (ic.name + ' ' + (ic.tags || '')).toLowerCase().includes(v)) : all).slice(0, 80)); }; }
};
const imgPop = (el, b, p) => {
  document.querySelectorAll('.epop').forEach(x => x.remove());
  { const t0 = G.tpl(b.tpl); if (t0 && t0.media && t0.media.kind === 'icon') return iconPop(el, b, p); }
  const key = el.dataset.img, s0 = G.imageSlots(b, p).find(x => x.key === key); if (!s0) return;
  const pop = document.createElement('div'); pop.className = 'epop';
  pop.innerHTML = `<div class="epop-h"><span>${s0.n ? 'Картинка элемента ' + s0.n : 'Картинка'}</span><b>${e(s0.ratio)}${s0.size ? ' · ' + s0.size : ''}</b></div>
    <div class="row" style="gap:6px"><label class="btn sm pri" for="ip-up">${G.icon.up}Загрузить</label><input type="file" accept="image/*" class="sr" id="ip-up"><button class="btn sm" data-k>${G.icon.copy}Текст для Krea</button>${s0.krea && s0.krea.url ? `<a class="btn sm" href="${e(s0.krea.url)}" target="_blank" rel="noopener">Krea app</a>` : ''}${s0.data ? '<button class="btn sm ghost danger" data-rm>Убрать</button>' : ''}</div>
    <input class="in" data-alt value="${e(s0.alt)}" placeholder="alt — описание картинки" aria-label="alt картинки">`;
  document.body.appendChild(pop);
  const r = el.getBoundingClientRect(), w = Math.min(420, innerWidth - 16); pop.style.width = w + 'px';
  pop.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
  const h = pop.offsetHeight; pop.style.top = Math.max(8, Math.min(r.top + r.height / 2 - h / 2, innerHeight - h - 8)) + 'px';
  const close = () => { pop.remove(); document.removeEventListener('mousedown', out, true); };
  const out = ev => { if (!pop.contains(ev.target)) close(); };
  setTimeout(() => document.addEventListener('mousedown', out, true), 0);
  pop.querySelector('[data-k]').onclick = async () => { await G.copy(s0.text); S.toast('Текст для Krea скопирован'); };
  const rm = pop.querySelector('[data-rm]'); if (rm) rm.onclick = () => { delete b.images[key].data; changed(); close(); drawCanvas(); };
  pop.querySelector('[data-alt]').oninput = ev => { b.images[key] = {...(b.images[key] || {}), alt: ev.target.value}; changed(); };
  pop.querySelector('#ip-up').onchange = ev => { const f = ev.target.files[0]; if (!f) return; if (f.size > 4e6) return S.toast('Картинка больше 4 МБ — уменьшите её.');
    const rd = new FileReader(); rd.onload = () => { b.images[key] = {...(b.images[key] || {}), data: rd.result, name: f.name, alt: (b.images[key] || {}).alt || s0.alt}; changed(); close(); drawCanvas(); }; rd.readAsDataURL(f); };
};
/* правка текста кликом по макету — маленькое окно у поля */
const editPop = (el, b, p) => {
  document.querySelectorAll('.epop').forEach(x => x.remove());
  const t = G.tpl(b.tpl), path = el.dataset.path, f = fdefOf(t, path); if (!f) return;
  const v = G.values(b, p), val = valOf(v, path);
  const pop = document.createElement('div'); pop.className = 'epop'; pop.setAttribute('role', 'dialog');
  pop.innerHTML = `<div class="epop-h"><span>${e(f.label)}</span><b class="cnt"></b></div><textarea class="ta" rows="${Math.min(8, Math.max(2, Math.ceil(val.length / 44)))}">${e(val)}</textarea><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn sm" data-x>Отмена</button><button class="btn sm pri" data-ok>Готово</button></div>`;
  document.body.appendChild(pop);
  const r = el.getBoundingClientRect(), w = Math.min(420, innerWidth - 16);
  pop.style.width = w + 'px'; pop.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
  const h = pop.offsetHeight; pop.style.top = (r.bottom + 8 + h > innerHeight ? Math.max(8, r.top - h - 8) : r.bottom + 8) + 'px';
  const ta = pop.querySelector('textarea'), cnt = pop.querySelector('.cnt');
  const upd = () => { const l = G.len(ta.value); cnt.textContent = l + (f.max ? ' / ' + f.max : ''); cnt.classList.toggle('over', !!f.max && l > f.max && !t.verbatim); };
  upd(); ta.oninput = upd; ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length;
  const close = () => { pop.remove(); document.removeEventListener('mousedown', out, true); };
  const out = ev => { if (!pop.contains(ev.target)) close(); };
  setTimeout(() => document.addEventListener('mousedown', out, true), 0);
  pop.querySelector('[data-x]').onclick = close;
  const ok = () => { setVal(b, p, path, ta.value); changed(); close(); S.scrollTo = false; drawCanvas(); };
  pop.querySelector('[data-ok]').onclick = ok;
  ta.onkeydown = ev => { if (ev.key === 'Escape') close(); if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) ok(); };
};
let canvasBox = null;
const drawCanvas = () => {
  const p = S.page, sc = G.scenario(p.scenario), box = canvasBox; if (!box) return; const y = window.scrollY;
  box.innerHTML = p.blocks.map((b, i) => {
    const t = G.tpl(b.tpl), r = t ? G.score(b, t, p) : null, missB = !t || (r.tier || 0) >= 2 || !G.isLive(t), sel = S.sel === b.id;
    const why = r ? tierNote(r) : 'шаблон не подобран';
    const bar = sel ? `<div class="tbar" role="toolbar" aria-label="Блок ${i + 1}"><span class="tb-role">${e(G.roleOf(sc, b.role).name.split(':')[0])}</span><button class="tb-dd" data-act="pick"><span>${t ? e(t.name) : 'Выбрать шаблон'}</span>${r ? `<b class="tier t${r.tier || 0}">${G.TIERS[r.tier || 0].toLowerCase()}</b>` : ''}</button><button data-act="adapt">${G.icon.spark}Адаптировать</button><button data-act="totext" title="К тексту блока" aria-label="К тексту блока">${G.icon.file}</button></div>${why ? `<div class="tb-why ${r && r.bad.length ? 'bad' : ''}">${e(why)}</div>` : ''}` : '';
    return `<div class="cb ${sel ? 'sel' : ''} ${missB ? 'miss' : ''}" data-id="${b.id}" id="tc-${b.id}" tabindex="0">${bar}<span class="cb-tag">${t ? e(t.name) : 'нет шаблона'}${t && !t.status.prod && !t.component ? ' · нужен дизайн' : ''}</span>${G.wireBlock(t, G.values(b, p), G.wireImgs(b, t))}</div>`;
  }).join('');
  window.scrollTo(0, y);
};
G.views.tpl = v => {
  const p = S.page, miss = G.missing(p).length;
  v.innerHTML = `<div class="col wide">
    <p class="hint" style="text-align:center;margin:0">Нажмите на блок — над ним появится панель: шаблон, адаптация, картинки. Нажмите на текст в выбранном блоке, чтобы поправить его. Пустые поля — красные.</p>
    ${hints('tpl')}
    ${miss ? `<button class="banner" id="missB">Для ${G.num(miss, 'блока', 'блоков', 'блоков')} в админке нет близкого шаблона — придётся сильно менять текст или заказать шаблон. Скачать ТЗ дизайнерам</button>` : ''}
    <div class="canvas wf-page" id="canvas"></div>
    <div class="toolrow" style="justify-content:center"><button class="btn sm" id="repick" title="Шаблоны, выбранные вручную, останутся">Подобрать шаблоны заново</button></div>
  </div>`;
  canvasBox = v.querySelector('#canvas'); drawCanvas(); bindHints(v, 'tpl');
  S.cta({label: 'Адаптировать текст', icon: G.icon.spark, run: btn => S.adaptMenu(btn, null)});
  v.querySelector('#repick').onclick = () => { G.autoPick(p); changed(); S.render(); S.toast('Шаблоны подобраны заново'); };
  const mb = v.querySelector('#missB'); if (mb) mb.onclick = () => { const P = G.exportParts(p); G.download(`${P.name}-missing-templates.md`, P.missing(), 'text/markdown;charset=utf-8'); };
  const sel = S.sel && document.getElementById('tc-' + S.sel); if (sel && S.scrollTo) { sel.scrollIntoView({block: 'center'}); S.scrollTo = false; }
  if (!window.__gridiDesel) { window.__gridiDesel = true; document.addEventListener('mousedown', ev => {
    if (!canvasBox || !document.body.contains(canvasBox) || !S.sel) return;
    if (ev.target.closest('.cb, .menu, .epop, .scrim, .bar, .cta-wrap')) return;
    S.sel = null; drawCanvas(); }); }
  canvasBox.addEventListener('click', ev => {
    const cb = ev.target.closest('.cb'); if (!cb) return; const b = p.blocks.find(x => x.id === cb.dataset.id);
    const a = ev.target.closest('[data-act]');
    if (a) { ev.preventDefault();
      if (a.dataset.act === 'pick') tplMenu(a, b, false);
      if (a.dataset.act === 'adapt') S.adaptMenu(a, b.id);
      if (a.dataset.act === 'imgs') imagesModal(b, p);
      if (a.dataset.act === 'totext') { S.scrollTo = true; S.go(`#/p/${p.id}/text`); }
      return; }
    if (S.sel !== b.id) { S.sel = b.id; drawCanvas(); const n = document.getElementById('tc-' + b.id), top = n.getBoundingClientRect().top; const hb = document.getElementById('top').offsetHeight + 40; if (top < hb) window.scrollBy({top: top - hb}); return; }
    const im = ev.target.closest('[data-img]'); if (im) return imgPop(im, b, p);
    const f = ev.target.closest('[data-path]'); if (f) editPop(f, b, p);
  });
  canvasBox.addEventListener('keydown', ev => { const cb = ev.target.closest('.cb'); if (cb && ev.target === cb && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); S.sel = cb.dataset.id; drawCanvas(); canvasBox.querySelector(`#tc-${cb.dataset.id}`).focus(); } });
};

/* ============ СТРАНИЦА: шаблоны и превью с Нави — один экран, два режима ============ */
G.views.page = v => {
  if (S.navi) G.views.preview(v); else G.views.tpl(v);
  const bar = document.createElement('div'); bar.className = 'modebar';
  bar.innerHTML = `<div class="seg"><button data-m="0" aria-pressed="${!S.navi}">Шаблоны</button><button data-m="1" aria-pressed="${!!S.navi}">На сайте — с навигацией Нави</button></div>`;
  v.prepend(bar);
  bar.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; S.navi = b.dataset.m === '1'; S.render(); };
};

/* ============ ПРЕВЬЮ: прототип Нави как контейнер ============
   Гриди отдаёт страницу как есть + подсказку, какой блок первый экран и какой целевое действие.
   Навигацию, липкую панель и островок рисует Нави по своим правилам. */
const GOAL = {event: 'event', article: 'info', course: 'course', product: 'sale'};
G.naviPayload = p => {
  const sc = G.scenario(p.scenario), goal = GOAL[sc.id] || (sc.kind === 'article' ? 'info' : 'event');
  const hero = p.blocks.find(b => b.role === 'hero'), hs = hero ? G.src(hero) : {};
  const blocks = p.blocks.map(b => { const t = G.tpl(b.tpl), s = G.src(b);
    return {kind: b.role === 'hero' ? 'hero' : G.isCta(b) ? 'cta' : 'grid', navi: false, title: s.level === 'h3' || s.level === 'h1' ? '' : s.title || '', html: `<section class="blk"><div class="wf-page">${G.wireBlock(t, G.values(b, p), G.wireImgs(b, t))}</div></section>`}; });
  const cta = p.blocks.find(b => G.isCta(b)), cs = cta ? G.src(cta) : {};
  return {type: 'gridi:page',
    cat: {id: 'g-' + p.id, name: hs.title || p.name, goal, lead: hs.lead || '', meta: (hs.meta || [])[0] || ''},
    fill: {overlay: true, name: hs.title || p.name, goal, blocks, program: [], programTitle: '',
      hero: {title: hs.title || '', lead: hs.lead || '', badge: (hs.meta || [])[0] || '', btn: (hs.cta || [])[0] && (hs.cta[0].text || hs.cta[0]) || ''},
      cta: {title: cs.title || '', text: cs.lead || '', btn: (cs.cta || [])[0] && (cs.cta[0].text || cs.cta[0]) || ''}},
    css: G.WIRE_CSS + '.wf-miss,.wf-item-miss{display:none!important}'};
};
/* адрес Нави: из настроек; иначе Нави, вшитая в файл Гриди (сборка одним файлом); иначе navi.html рядом */
let naviBlob = null;
G.naviUrl = () => { if (window.GRIDI_NAVI_HTML) return naviBlob || (naviBlob = URL.createObjectURL(new Blob([window.GRIDI_NAVI_HTML], {type: 'text/html'}))); return 'navi.html'; };
let naviMsg = null;
G.views.preview = v => {
  const p = S.page, url = G.naviUrl();
  v.innerHTML = `<div class="pvwrap"><div class="site pvnavi"><iframe class="navi-frame" id="navi" style="visibility:hidden" title="Прототип Нави" src="${e(url.startsWith('blob:') ? url + '#embed' : url + (url.includes('?') ? '&' : '?') + 'embed')}"></iframe></div>
    <p class="hint pvhint" id="pvhint">Открываю прототип Нави…</p></div>`;
  const fr = v.querySelector('#navi');
  const send = () => { try { fr.contentWindow.postMessage(G.naviPayload(p), '*'); } catch (err) {} };
  if (naviMsg) removeEventListener('message', naviMsg);
  naviMsg = ev => { if (ev.source === fr.contentWindow && ev.data && ev.data.type === 'navi:ready') { send(); const h = document.getElementById('pvhint'); if (h) h.hidden = true; setTimeout(() => { fr.style.visibility = ''; }, 250); } };
  addEventListener('message', naviMsg);
  fr.addEventListener('load', () => setTimeout(() => { send(); setTimeout(() => { fr.style.visibility = ''; }, 300); }, 300));
};

/* ============ ПРОВЕРКА: тест запускается сразу ============ */
G.views.check = v => {
  const p = S.page;
  v.innerHTML = `<div class="col"><div class="head"><p class="eye">Проверка</p><h1 class="h1">${e(p.name)}</h1><p class="lead">Сценарий, правила гриды, лимиты знаков, кнопки, картинки${G.scenario(p.scenario).kind === 'article' ? ', ритм врезов' : ''}.</p></div><div id="out" class="sec"><div class="running"><span class="spin"></span>Проверяю страницу…</div></div></div>`;
  const run = () => {
    v.querySelector('#out').innerHTML = `<div class="running"><span class="spin"></span>Проверяю страницу…</div>`;
    setTimeout(() => { S.checks = G.checks(p); drawChecks(v.querySelector('#out')); S.header(); }, 250);
  };
  run();
  S.cta({label: 'Проверить заново', icon: G.icon.play, run});
};
const drawChecks = box => {
  const p = S.page, c = S.checks, cnt = l => c.filter(x => x.level === l).length;
  const ic = {error: '!', warn: '!', info: 'i'};
  if (!c.filter(x => x.level !== 'info').length) box.innerHTML = `<div class="okbox"><h2 class="h2">Страница готова к выгрузке</h2><p style="margin:6px 0 0">Ошибок и предупреждений нет${cnt('info') ? ', есть заметки ниже' : ''}. Выгрузка — иконка со стрелкой в шапке.</p></div>`;
  else box.innerHTML = `<div class="sumrow">${cnt('error') ? `<span class="chip err">${G.num(cnt('error'), 'ошибка', 'ошибки', 'ошибок')}</span>` : ''}${cnt('warn') ? `<span class="chip warn">${G.num(cnt('warn'), 'предупреждение', 'предупреждения', 'предупреждений')}</span>` : ''}${cnt('info') ? `<span class="chip info">${G.num(cnt('info'), 'заметка', 'заметки', 'заметок')}</span>` : ''}</div>`;
  const item = (x, i) => `<div class="ri ${x.level}"><span class="ic" aria-hidden="true">${ic[x.level]}</span><span>${e(x.text)}${x.rule && G.rule(x.rule) ? `<small class="rule" title="${e(G.rule(x.rule).text)}">${e(x.rule)} · ${e(G.rule(x.rule).short || G.rule(x.rule).text)}</small>` : ''}</span><span class="row" style="gap:6px">${x.fix && x.fix.adapt && x.block ? `<button class="btn sm gr" data-fix="${i}">Адаптировать</button>` : ''}${x.fix && x.fix.addRole ? `<button class="btn sm" data-fix="${i}">Добавить блок</button>` : ''}${x.fix && x.fix.reorder ? `<button class="btn sm" data-fix="${i}">Выстроить по сценарию</button>` : ''}${x.block ? `<button class="btn sm ghost" data-go="${i}">Показать</button>` : ''}</span></div>`;
  box.innerHTML += G.CHECK_CATS.map(([k, n]) => { const L = c.map((x, i) => [x, i]).filter(([x]) => x.cat === k); return L.length ? `<section class="sec"><p class="eye">${e(n)} · ${L.length}</p><div class="res">${L.map(([x, i]) => item(x, i)).join('')}</div></section>` : ''; }).join('');
  box.onclick = ev => {
    const g = ev.target.closest('[data-go]'), f = ev.target.closest('[data-fix]');
    if (g) { const x = c[+g.dataset.go]; S.sel = x.block.id; S.scrollTo = true; S.go(`#/p/${p.id}/${(x.fix && x.fix.split) || x.cat === 'text' ? 'text' : x.cat === 'navi' ? 'preview' : 'tpl'}`); }
    if (f) { const x = c[+f.dataset.fix];
      if (x.fix.adapt) S.adaptMenu(f, x.block.id);
      if (x.fix.addRole) { const sc = G.scenario(p.scenario), order = sc.roles.map(r => r.id), my = order.indexOf(x.fix.addRole); let at = p.blocks.findIndex(b => order.indexOf(b.role) > my); if (at < 0) at = p.blocks.length; const nb = G.newBlock(x.fix.addRole); p.blocks.splice(at, 0, nb); G.autoPick(p); S.sel = nb.id; S.scrollTo = true; changed(); S.go(`#/p/${p.id}/text`); }
      if (x.fix.reorder) { const order = G.scenario(p.scenario).roles.map(r => r.id); p.blocks = p.blocks.map((b, i) => ({b, i})).sort((a, z) => { const ra = order.indexOf(a.b.role), rz = order.indexOf(z.b.role); return (ra < 0 ? 99 : ra) - (rz < 0 ? 99 : rz) || a.i - z.i; }).map(x => x.b); changed(); G.views.check(document.getElementById('view')); }
    }
  };
};

})();
