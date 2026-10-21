/* Гриди — библиотека: сценарии, шаблоны, промты */
'use strict';
(() => {
const G = window.Gridi, S = G.ui, e = G.esc;
const TR = {а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', ь: '', ъ: '', э: 'e', ю: 'yu', я: 'ya'};
const slug = s => String(s || '').toLowerCase().split('').map(c => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';
const uniqId = (kind, base) => { let id = slug(base), n = 2; while (G.lib.get(kind, id)) id = slug(base) + '-' + n++; return id; };


const INTRO = {
  templates: 'Шаблоны собираются в конструкторе: тип, параметры, лимиты. «В админке» — уже есть на сайте, «Нужен дизайн» — ждут дизайнера. Гриди подбирает только по этим шаблонам.',
  scenarios: 'Сценарий — тип страницы: какие блоки и в каком порядке. По нему модель делит текст автора на блоки.',
  icons: 'Иконки SDDS Icons для шаблонов с иконкой. Гриди подбирает иконку по словам пункта, редактор может выбрать другую кликом по иконке. Каталог общий и не меняется.',
  prompts: 'Свои промты редакции: редполитика, интеграция, тон. Запускаются из меню со звёздочкой — для всей страницы или одного блока. Разбор текста и укладку в шаблоны делает сама Гриди.',
};
const NEWLBL = {templates: 'Новый шаблон', scenarios: 'Новый сценарий', prompts: 'Новый промт', icons: 'Загрузить SVG'};
const visible = (kind, o) => !(kind === 'prompts' && o.system);
G.views.library = v => {
  const kind = S.lib.kind;
  if (S.lib.id) {
    v.innerHTML = `<div class="col ${kind === 'scenarios' ? '' : 'wide'}"><a class="btn sm ghost" href="#/lib/${kind}" style="align-self:flex-start">← ${G.KINDS[kind]}</a><div id="libMain"></div></div>`;
    const main = v.querySelector('#libMain');
    if (S.lib.id === 'new') return EDIT[kind](main, null);
    const o = G.lib.get(kind, S.lib.id);
    if (o && visible(kind, o)) return EDIT[kind](main, G.clone(o));
    main.innerHTML = '<p class="lead">Не нашлось.</p>'; return;
  }
  const q = (S.libQ || '').toLowerCase();
  const items = G.lib.all(kind).filter(o => visible(kind, o));
  const shown = items.filter(o => !q || (o.name + ' ' + (o.description || '') + ' ' + (o.type || '') + ' ' + (o.tags || '')).toLowerCase().includes(q));
  const groups = {};
  shown.forEach(o => { const g = kind === 'icons' ? 'Иконки' : kind === 'templates' ? (o.component ? 'Компоненты сайта' : o.status.prod ? 'В админке' : 'Нужен дизайн') : kind === 'prompts' ? 'Свои промты' : (o.kind === 'article' ? 'Статьи' : 'Лендинги'); (groups[g] = groups[g] || []).push(o); });
  const order = ['В админке', 'Компоненты сайта', 'Нужен дизайн', 'Лендинги', 'Статьи', 'Свои промты', 'Иконки'];
  const loc = o => o._local ? (o._local === 'new' ? ' · создан здесь' : ' · изменён здесь') : '';
  const sub = o => kind === 'icons' ? (o.tags || '') : kind === 'templates' ? (o.type || (o.component ? 'компонент' : '')) + loc(o) : kind === 'scenarios' ? G.num((o.roles || []).length, 'блок', 'блока', 'блоков') + ' · ' + (o.action || '') + loc(o) : (o.description || '') + loc(o);
  const ch = G.lib.changes(kind);
  v.innerHTML = `<div class="col">
    <div class="head"><p class="eye">Библиотека · ${G.num(items.length, 'запись', 'записи', 'записей')}</p><h1 class="h1">${G.KINDS[kind]}</h1><p class="lead">${INTRO[kind]}</p></div>
    <div class="toolrow"><input class="in grow search" id="libQ" placeholder="Найти" value="${e(S.libQ || '')}" aria-label="Найти">${ch ? `<button class="btn sm ghost danger" id="libReset">Сбросить мои правки</button>` : ''}</div>
    ${ch ? `<p class="hint" style="margin:0">${G.num(ch, 'правка', 'правки', 'правок')} библиотеки — сохранены в этом браузере.</p>` : ''}
    ${order.filter(g => groups[g]).map(g => `<section class="sec"><p class="eye">${e(g)} · ${groups[g].length}</p><ul class="list">${groups[g].map(o => `<li><a class="lrow" href="#/lib/${kind}/${encodeURIComponent(o.id)}"><span class="n">${kind === 'icons' ? `<span class="icn">${o.svg}</span>` : kind === 'templates' && o.status && o.status.prod ? '●' : kind === 'templates' && !o.component ? '○' : ''}</span><span><b>${e(o.name)}</b><small>${e(sub(o))}</small></span><span></span></a></li>`).join('')}</ul></section>`).join('') || '<p class="lead">Ничего не нашлось.</p>'}
  </div>`;
  if (kind === 'icons') S.cta(null);
  else S.cta({label: NEWLBL[kind], icon: G.icon.plus, run: () => S.go(`#/lib/${kind}/new`)});
  const qi = v.querySelector('#libQ'); qi.oninput = () => { S.libQ = qi.value; const pos = qi.selectionStart; G.views.library(v); const n = v.querySelector('#libQ'); n.focus(); n.selectionStart = n.selectionEnd = pos; };
  const rs = v.querySelector('#libReset'); if (rs) rs.onclick = () => { if (confirm('Сбросить все свои правки в разделе «' + G.KINDS[kind] + '»?')) { G.lib.resetAll(kind); S.render(); } };
};

/* общая шапка редактора */
const editHead = (kind, o, isNew, title) => `<div class="edit-h"><div class="head grow"><p class="eye">${e(G.KINDS[kind])}${!isNew && o._local ? ' · ' + (o._local === 'new' ? 'создан в этом браузере' : 'изменён в этом браузере') : ''}</p><h1 class="h1">${e(title)}</h1></div>
  <div class="row" style="gap:6px">${!isNew && kind !== 'icons' ? `<button class="btn sm ghost" data-ed="dup">Дублировать</button>` : ''}${!isNew && o._local === 'changed' ? `<button class="btn sm ghost" data-ed="revert">${kind === 'icons' ? 'Вернуть исходные слова' : 'Вернуть исходный'}</button>` : ''}${!isNew && kind !== 'icons' ? `<button class="btn sm ghost danger" data-ed="del">Удалить</button>` : ''}</div></div>`;
const bindHead = (box, kind, getObj, isNew) => {
  const save = () => { const o = getObj(); if (!o) return; G.lib.save(kind, o); S.dirty = false; S.toast(`«${o.name}» сохранён в этом браузере`); S.go(`#/lib/${kind}`); };
  S.cta({label: 'Сохранить', run: save});
  box.querySelector('.edit-h').onclick = ev => {
    const b = ev.target.closest('[data-ed]'); if (!b) return; const a = b.dataset.ed;
    if (a === 'dup') { const o = getObj(); if (!o) return; o.id = uniqId(kind, o.id + '-copy'); o.name += ' (копия)'; G.lib.save(kind, o); S.go(`#/lib/${kind}/${encodeURIComponent(o.id)}`); }
    if (a === 'revert') { G.lib.revert(kind, S.lib.id); S.render(); }
    if (a === 'del') { if (!confirm('Удалить? Страницы, которые его используют, потеряют ссылку.')) return; G.lib.remove(kind, S.lib.id); S.go('#/lib/' + kind); }
  };
};

/* поделиться сценарием: файл со сценарием и шаблонами, которые выбраны в его блоках (свои шаблоны дизайнера придут вместе с ним) */
const strip = x => { const c = {...x}; delete c._local; delete c._base; return c; };
const exportPack = sc => {
  const tpls = [...new Map(sc.roles.flatMap(roleTpls).filter(t => !t.component).map(t => [t.id, strip(t)])).values()];
  G.download(`scenariy-${slug(sc.name)}.json`, JSON.stringify({gridiScenario: 1, library: G.lib.version(), scenario: strip(sc), templates: tpls}, null, 1), 'application/json');
  S.toast(tpls.length ? `Сценарий и ${G.num(tpls.length, 'шаблон', 'шаблона', 'шаблонов')} его блоков — в файле. Коллега: «Новый сценарий → Загрузить сценарий».` : 'Сценарий в файле. Коллега: «Новый сценарий → Загрузить сценарий».');
};
const importPack = async file => {
  let j; try { j = JSON.parse(await file.text()); } catch (err) { throw new Error('Это не файл сценария Гриди.'); }
  const sc0 = j.scenario || (j.scenarios || [])[0]; if (!sc0 || !sc0.roles) throw new Error('Это не файл сценария Гриди — нужен файл из «Поделиться».');
  const same = (a, b) => JSON.stringify({...strip(a), id: 0}) === JSON.stringify({...strip(b), id: 0});
  const map = {}, add = [];
  for (const t of j.templates || []) {
    if (G.lib.isBuiltIn('templates', t.id) && same(G.lib.get('templates', t.id) || {}, t)) continue; /* стандартный шаблон — уже есть у всех */
    const cur = G.tpls().find(x => x.name === t.name);
    if (cur && same(cur, t)) { map[t.id] = cur.id; continue; }
    let id = t.id; if (G.lib.get('templates', id)) { let n = 2; while (G.lib.get('templates', `${t.id}-${n}`)) n++; id = `${t.id}-${n}`; }
    let name = t.name; if (cur) { let n = 2; while (G.tpls().some(x => x.name === `${t.name}-${n}`)) n++; name = `${t.name}-${n}`; }
    G.lib.save('templates', {...t, id, name}); map[t.id] = id; add.push(name);
  }
  const o = {...sc0, roles: sc0.roles.map(r => r.templates ? {...r, templates: r.templates.map(id => map[id] || id)} : r)};
  const cur = G.lib.get('scenarios', o.id);
  if (cur && !same(cur, o)) { let n = 2; while (G.lib.get('scenarios', `${o.id}-${n}`)) n++; o.id = `${o.id}-${n}`; if (G.lib.all('scenarios').some(x => x.name === o.name)) o.name += ` (${n})`; }
  if (!cur || !same(cur, o)) G.lib.save('scenarios', o);
  return {id: o.id, msg: `Сценарий «${o.name}» загружен` + (add.length ? `, шаблоны: ${add.join(', ')}.` : '.')};
};

/* шаблоны блока сценария: пусто — Гриди подбирает из всей библиотеки; выбраны — только из них */
const roleTpls = r => G.refTpls(r.templates || r.tpl);
const tplsLabel = r => { const n = roleTpls(r).length; return n ? `Шаблоны: ${n}` : 'Шаблоны: все'; };
const pickTpls = (r, done) => {
  const all = G.tpls().filter(t => !t.heading), sel = new Set(roleTpls(r).map(t => t.id));
  const row = t => `<label class="lrow tplpick"><input type="checkbox" value="${e(t.id)}" ${sel.has(t.id) ? 'checked' : ''}><span><b>${e(t.name)}</b><small>${e([t.type || (t.component ? 'компонент' : ''), t.status && t.status.prod ? 'в админке' : t.component ? '' : 'нужен дизайн'].filter(Boolean).join(' · '))}</small></span></label>`;
  const m = S.modal(`<div class="modal-h"><div><h2 class="h2">Шаблоны блока</h2><p class="sub">${e(r.name.split(':')[0])}. Ничего не выбрано — Гриди подбирает из всей библиотеки.</p></div><button class="ib" data-close aria-label="Закрыть">${G.icon.x}</button></div>
    <input class="in" id="tpQ" placeholder="Найти по названию, например @письма" autofocus><p class="hint" id="tpN" style="margin:8px 0"></p>
    <div class="list" id="tpL" style="max-height:50vh;overflow:auto">${all.map(row).join('')}</div>
    <div class="modal-f"><button class="btn ghost" id="tpClr">Снять все</button><button class="btn pri" id="tpOk">Готово</button></div>`, {wide: true});
  const cnt = () => { m.$('#tpN').textContent = sel.size ? `Выбрано: ${sel.size}` : 'Выбрано: ничего — все шаблоны'; };
  m.$('#tpL').onchange = ev => { const c = ev.target; if (c.checked) sel.add(c.value); else sel.delete(c.value); cnt(); };
  m.$('#tpQ').oninput = ev => { const q = ev.target.value.trim().toLowerCase(); m.$('#tpL').querySelectorAll('.tplpick').forEach(l => { l.hidden = q && !l.textContent.toLowerCase().includes(q); }); };
  m.$('#tpClr').onclick = () => { sel.clear(); m.$('#tpL').querySelectorAll('input').forEach(c => c.checked = false); cnt(); };
  m.$('#tpOk').onclick = () => { S.dirty = true; delete r.tpl; if (sel.size) r.templates = all.filter(t => sel.has(t.id)).map(t => t.id); else delete r.templates; m.close(); done(); };
  cnt();
};

/* ---------- сценарий: только то, что влияет на разбор ---------- */
const EDIT = {};
/* системные блоки: первый экран и целевое действие ведут поведение страницы в Нави (липкая панель, островок, якоря),
   у статьи весь состав блоков зашит в разбор — их нельзя удалить, сдвинуть и переименовать */
const LOCK = '<svg class="lk" viewBox="0 0 24 24" width="16" height="16" aria-label="Системный блок"><path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"/></svg>';
/* первый экран: всегда первый, не двигается и не удаляется; целевое действие: двигается, но не удаляется; у обоих название не меняется.
   у статьи состав блоков зашит в разбор — его не меняют; врез — служебный блок разбора, в списке не показывается */
const SYS_IDS = ['hero', 'cta'];
const lockedName = (o, r) => o.kind === 'article' || SYS_IDS.includes(r.id);
const canMove = (o, r) => o.kind !== 'article' && r.id !== 'hero';
const canRemove = (o, r) => o.kind !== 'article' && !SYS_IDS.includes(r.id);
const shownRole = (o, r) => !(o.kind === 'article' && r.id === 'vrez');
const kindRoles = kind => kind === 'article' ? G.clone((G.lib.get('scenarios', 'article') || {roles: []}).roles) : [{id: 'hero', name: 'Первый экран: главное сообщение и действие', req: 1}, {id: 'cta', name: 'Целевое действие: кнопка или форма', req: 1}];
EDIT.scenarios = (box, o) => {
  const isNew = !o; o = o || {id: '', name: 'Новый сценарий', kind: 'landing', action: '', button: '', maxText: 14000, rules: [], roles: [{id: 'hero', name: 'Первый экран: главное сообщение и действие', req: 1}, {id: 'cta', name: 'Целевое действие: кнопка или форма', req: 1}]};
  const draw = () => {
    box.innerHTML = `<div class="edit">${editHead('scenarios', o, isNew, isNew ? 'Новый сценарий' : o.name)}
      ${o._update ? '<p class="hint" style="margin:0 0 12px">Системный сценарий обновился: новые поля дописаны в вашу копию, ваши правки на месте. Сохраните, чтобы убрать эту пометку.</p>' : ''}
      <div class="card"><div class="grid2"><div class="fld"><label class="lbl" for="sName">Название</label><input class="in" id="sName" value="${e(o.name)}"></div>
        <div class="fld"><label class="lbl" for="sAct">Целевое действие</label><input class="in" id="sAct" value="${e(o.action)}" placeholder="Регистрация на мероприятие"></div></div>
        <div class="fld" style="margin:0"><span class="lbl">Тип страницы</span><div class="seg" id="sKind"><button data-v="landing" aria-pressed="${o.kind !== 'article'}">Лендинг — важен порядок блоков</button><button data-v="article" aria-pressed="${o.kind === 'article'}">Статья — важен ритм врезов</button></div></div></div>
      <div class="card"><h3>Блоки по порядку ${o.kind === 'article' ? '' : `<button class="btn sm" id="addRole">${G.icon.plus}Блок</button>`}</h3>
        <p class="hint" style="margin:-4px 0 8px">${o.kind === 'article' ? 'Состав блоков статьи постоянный — можно выбрать шаблоны и дописать правила разбора.' : 'Название уходит в промт разбора — пишите смысл через двоеточие: «Спикеры: кто выступает и чем полезен». «Пунктов» — сколько максимум, пусто — без ограничения.'}</p>
        ${o.roles.map((r, i) => { if (!shownRole(o, r)) return ''; const lk = lockedName(o, r); return `<div class="rolecard ${lk ? 'locked' : ''}" data-i="${i}"><span class="n">${String(i + 1).padStart(2, '0')}</span>
            <span class="grow nm">${lk ? LOCK : ''}<input class="in" data-f="name" value="${e(r.name)}" aria-label="Название блока" ${lk ? 'readonly' : ''}></span>
            <input class="in items" data-f="items" type="number" min="0" value="${r.items || ''}" placeholder="макс." title="Пунктов максимум" aria-label="Пунктов максимум">
            <label class="check"><input type="checkbox" data-f="req" ${r.req ? 'checked' : ''}>нужен</label>
            <button class="btn sm ghost" data-tpls title="Какие шаблоны можно ставить в этот блок">${tplsLabel(r)}</button>
            <details class="rolex"><summary class="hint">Смысл, пример и слова для узнавания</summary>
              <label class="lbl">Что в блоке — уходит в промт</label><input class="in" data-f="meaning" value="${e(r.meaning || '')}" placeholder="кто выступает: имя, должность, о чём">
              <label class="lbl">Пример блока в разметке — из него Гриди собирает пример для модели</label><textarea class="ta" data-f="example" rows="3" placeholder="[h2] Спикеры&#10;- Имя Фамилия — должность&#10;@ тема выступления">${e(r.example || '')}</textarea>
              <label class="lbl">Слова в заголовке, по которым блок узнаётся без модели — через запятую</label><input class="in" data-f="keys" value="${e((r.keys || []).join(', '))}" placeholder="спикер, эксперт"></details>
            ${canMove(o, r) ? `<button class="ib sm" data-mv="-1" aria-label="Выше" ${i > 1 ? '' : 'disabled'}>${G.icon.up}</button><button class="ib sm" data-mv="1" aria-label="Ниже" ${i < o.roles.length - 1 ? '' : 'disabled'}>${G.icon.down}</button>` : ''}${canRemove(o, r) ? `<button class="ib sm" data-rm aria-label="Удалить блок">${G.icon.x}</button>` : ''}</div>`; }).join('')}</div>
      <details class="card"><summary class="lbl" style="cursor:pointer;margin:0">Особые правила разбора — если нужны</summary><textarea class="ta" id="sRules" rows="3" style="margin-top:10px" placeholder="По одному в строке. Например: программа — только пункты со временем">${e((o.rules || []).join('\n'))}</textarea><p class="hint" id="sRulesHint" style="margin-top:6px">${e(G.rulesLint(o.kind, o.rules || []))}</p></details>
    </div>`;
    bindHead(box, 'scenarios', collect, isNew);
    { const h = box.querySelector('.edit-h .row');
      if (!isNew) { h.insertAdjacentHTML('afterbegin', '<button class="btn sm ghost" data-pack>Поделиться</button>'); h.querySelector('[data-pack]').onclick = ev => { ev.stopPropagation(); exportPack(collect()); }; }
      else { h.insertAdjacentHTML('afterbegin', `<label class="btn sm ghost" style="cursor:pointer">${G.icon.up}Загрузить сценарий<input type="file" id="packIn" accept=".json" class="sr"></label>`);
        h.querySelector('#packIn').onchange = async ev => { try { const r = await importPack(ev.target.files[0]); S.dirty = false; S.toast(r.msg); S.go(`#/lib/scenarios/${encodeURIComponent(r.id)}`); } catch (err) { S.toast(err.message); } }; } }
    { const ta = box.querySelector('#sRules'), hn = box.querySelector('#sRulesHint'); if (ta && hn) ta.oninput = () => { hn.textContent = G.rulesLint(o.kind, ta.value.split('\n')); }; }
    box.querySelector('#sKind').onclick = ev => { const b = ev.target.closest('button'); if (!b || b.dataset.v === o.kind) return; collect(); o.kind = b.dataset.v; o.roles = kindRoles(o.kind); draw(); };
    const ar = box.querySelector('#addRole'); if (ar) ar.onclick = () => { collect(); o.roles.splice(Math.max(0, o.roles.length - 1), 0, {id: '', name: 'Новый блок: что в нём', req: 0}); draw(); };
    box.querySelectorAll('.rolecard').forEach(rc => {
      const i = +rc.dataset.i;
      rc.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { collect(); const d = +b.dataset.mv, r = o.roles.splice(i, 1)[0]; o.roles.splice(i + d, 0, r); draw(); });
      const rm = rc.querySelector('[data-rm]'); if (rm) rm.onclick = () => { collect(); o.roles.splice(i, 1); draw(); };
      rc.querySelector('[data-tpls]').onclick = () => { collect(); pickTpls(o.roles[i], draw); };
    });
  };
  const collect = () => {
    const $ = s => box.querySelector(s);
    o.name = $('#sName').value.trim() || 'Без названия'; o.action = $('#sAct').value.trim();
    o.rules = $('#sRules').value.split('\n').map(x => x.trim()).filter(Boolean);
    if (o.kind === 'article' && !o.rhythm) o.rhythm = {maxRun: 1000}; if (o.kind !== 'article') delete o.rhythm;
    box.querySelectorAll('.rolecard').forEach(rc => {
      const r = o.roles[+rc.dataset.i], f = k => rc.querySelector(`[data-f="${k}"]`);
      if (!lockedName(o, r)) r.name = f('name').value.trim() || 'Блок'; r.req = f('req').checked || r.id === 'hero' ? 1 : 0;
      const n = +f('items').value; if (n > 0) r.items = n; else delete r.items;
      const tx = (k, v) => { if (v) r[k] = v; else delete r[k]; };
      tx('meaning', f('meaning').value.trim()); tx('example', f('example').value.trim());
      const ks = f('keys').value.split(',').map(x => x.trim().toLowerCase()).filter(Boolean); if (ks.length) r.keys = ks; else delete r.keys;
    });
    /* первый экран — всегда первый, целевое действие — всегда последний; если их нет — возвращаем */
    if (o.kind !== 'article') { const sys = kindRoles('landing'), hero = o.roles.find(r => r.id === 'hero') || sys[0];
      o.roles = [hero, ...o.roles.filter(r => r.id !== 'hero')]; if (!o.roles.some(r => r.id === 'cta')) o.roles.push(sys[1]); }
    const used = new Set(); o.roles.forEach(r => { if (!r.id) r.id = slug(r.name.split(':')[0]); let id = r.id, n = 2; while (used.has(id)) id = r.id + '-' + n++; r.id = id; used.add(id); });
    if (!o.id) o.id = uniqId('scenarios', o.name);
    return o;
  };
  draw();
};

/* ---------- шаблон ---------- */
EDIT.templates = (box, o) => o && o.component ? G.componentView(box, o) : G.ctorEditor(box, o);

/* ---------- иконка: название и теги для автоподбора ---------- */
EDIT.icons = (box, o) => {
  if (!o) { box.innerHTML = '<p class="lead">Иконки берутся только из каталога SDDS Icons.</p>'; return; }
  const base = G.icons().find(x => x.id === o.id) || o;
  box.innerHTML = `<div class="edit">${editHead('icons', o, false, o.name)}
    <div class="card" style="display:flex;gap:20px;align-items:flex-start"><div class="icbig">${base.svg}</div><div class="grow">
      <div class="fld" style="margin:0"><label class="lbl" for="iTags">Слова для поиска и автоподбора</label><input class="in" id="iTags" value="${e(o.tags || '')}" placeholder="например: доставка курьер срок"><span class="hint">Допишите свои слова — по ним иконка найдётся в поиске и подберётся к пункту. Саму иконку изменить нельзя.</span></div></div></div></div>`;
  bindHead(box, 'icons', () => ({id: o.id, name: o.name, tags: box.querySelector('#iTags').value.trim(), svg: base.svg}), false);
};

/* ---------- свой промт ---------- */
EDIT.prompts = (box, o) => {
  const isNew = !o;
  o = o || {id: '', name: 'Новый промт', stage: 'adapt', input: 'fields', description: '', ask: [], text: 'Ты — редактор. Задача: …\nПравила:\n- Смысл, факты, цифры, имена и даты не меняй.\n- Лимит знаков каждого поля не превышай.\nТип страницы: {{тип}}.\nВерни ТОЛЬКО JSON одним блоком кода ```json: {"blocks":[{"id":"","top":{"<ключ>":""},"items":[{"<ключ>":""}]}]}\nВерни только блоки, которые изменил.\n\n{{блоки}}'};
  o.ask = o.ask || []; o.input = 'fields'; o.stage = 'adapt';
  const draw = () => {
    const vars = ['тип', 'действие', 'блоки', ...o.ask.map(a => a.k)];
    box.innerHTML = `<div class="edit">${editHead('prompts', o, isNew, isNew ? 'Новый промт' : o.name)}
      <div class="card"><h3>Как сделать</h3><ol class="howto"><li>Напишите задачу и что нельзя трогать.</li><li>Оставьте <code>{{блоки}}</code> — туда встанет текст из шаблонов.</li><li>Не меняйте строку с форматом ответа <code>{"blocks": …}</code>.</li></ol></div>
      <div class="tpledit"><div class="edit">
      <div class="card"><div class="fld"><label class="lbl" for="pName">Название в меню</label><input class="in" id="pName" value="${e(o.name)}"></div>
        <div class="fld" style="margin:0"><label class="lbl" for="pDesc">Что делает — одной строкой</label><input class="in" id="pDesc" value="${e(o.description || '')}"></div></div>
      <div class="card"><h3>Вопрос перед запуском <button class="btn sm" id="addAsk">${G.icon.plus}Вопрос</button></h3>${o.ask.length ? o.ask.map((a, i) => `<div class="row" data-ask="${i}" style="margin-bottom:6px"><input class="in" data-af="k" value="${e(a.k)}" style="width:110px" aria-label="Ключ вставки"><input class="in grow" data-af="label" value="${e(a.label)}" aria-label="Вопрос"><button class="ib sm" data-askrm aria-label="Удалить вопрос">${G.icon.x}</button></div>`).join('') : '<p class="hint" style="margin:0">Например, «Что встроить в текст». Ответ встанет во вставку с ключом.</p>'}</div>
      </div>
      <div class="card"><h3>Промт</h3><div class="vars" style="margin-bottom:8px">${vars.map(x => `<button type="button" data-var="${e(x)}">{{${e(x)}}}</button>`).join('')}</div>
        <textarea class="ta promptta" id="pText" spellcheck="false">${e(o.text)}</textarea>
        <p class="hint" id="pWarn" style="color:var(--err);margin:8px 0 0"></p>
        <details style="margin-top:10px"><summary class="hint" style="cursor:pointer">Так уйдёт в модель — на примере</summary><pre id="pPrev" style="white-space:pre-wrap;font:12px/1.5 ui-monospace,Menlo,monospace;background:var(--soft);padding:12px;border-radius:12px;max-height:380px;overflow:auto;margin:8px 0 0"></pre></details></div>
      </div></div>`;
    bindHead(box, 'prompts', collect, isNew);
    const ta = box.querySelector('#pText'), warn = () => { const t = ta.value, w = []; if (!/\{\{\s*блоки\s*\}\}/.test(t)) w.push('Нет {{блоки}} — модель не увидит текст.'); if (!/"blocks"/.test(t)) w.push('Нет формата ответа {"blocks": …}.'); box.querySelector('#pWarn').textContent = w.join(' '); };
    warn(); ta.oninput = warn;
    box.querySelectorAll('[data-var]').forEach(b => b.onclick = () => { const a = ta.selectionStart, ins = `{{${b.dataset.var}}}`; ta.value = ta.value.slice(0, a) + ins + ta.value.slice(ta.selectionEnd); ta.focus(); ta.selectionStart = ta.selectionEnd = a + ins.length; warn(); });
    const pv = box.querySelector('#pPrev');
    const pg = G.examples[0] ? G.fromExample(G.examples[0]) : G.newPage('Пример', (G.lib.all('scenarios')[0] || {}).id, '');
    const upd = () => { const c = collect(); const vals = {}; (c.ask || []).forEach(a => vals[a.k] = '…'); pv.textContent = G.adaptPrompt(pg, c, pg.blocks.filter(b => G.adaptable(b, c, pg)).slice(0, 2), vals); };
    upd(); box.addEventListener('input', upd);
    box.querySelector('#addAsk').onclick = () => { collect(); o.ask.push({k: 'ввод' + (o.ask.length + 1), label: 'Что спросить'}); draw(); };
    box.querySelectorAll('[data-askrm]').forEach(b => b.onclick = () => { collect(); o.ask.splice(+b.closest('[data-ask]').dataset.ask, 1); draw(); });
  };
  const collect = () => {
    const $ = s => box.querySelector(s);
    o.name = $('#pName').value.trim() || 'Промт'; o.description = $('#pDesc').value.trim(); o.text = $('#pText').value;
    box.querySelectorAll('[data-ask]').forEach(r => { const a = o.ask[+r.dataset.ask]; ['k', 'label'].forEach(k => a[k] = r.querySelector(`[data-af="${k}"]`).value.trim()); });
    if (!o.id) o.id = uniqId('prompts', o.name);
    const r = JSON.parse(JSON.stringify(o)); if (!r.ask.length) delete r.ask;
    return r;
  };
  draw();
};

})();
