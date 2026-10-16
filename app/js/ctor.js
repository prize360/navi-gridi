/* Гриди — конструктор шаблона: тип → параметры, которые меняют вид → превью и паспорт */
'use strict';
(() => {
const G = window.Gridi, e = G.esc;

/* параметры каждого типа: только то, что видно в превью и влияет на подбор */
const P = {
  pos: (o) => ({k: 'pos', label: 'Расположение', opts: o}),
  media: (o) => ({k: 'media', label: 'Медиа', opts: o}),
  count: (a, z) => ({k: 'n', label: 'Сколько', opts: Array.from({length: z - a + 1}, (_, i) => String(a + i))}),
  bool: (k, label) => ({k, label, opts: ['нет', 'да']}),
  btn: (z) => ({k: 'btn', label: 'Кнопки', opts: Array.from({length: z + 1}, (_, i) => String(i))}),
};
const MEDIA = {'нет': null, 'L': {kind: 'img', size: 'L'}, 'M': {kind: 'img', size: 'M'}, 'S': {kind: 'img', size: 'S'}, 'I': {kind: 'icon'}, 'A': {kind: 'photo'}};
const RATIO = {k: 'ratio', label: 'Соотношение картинки', opts: ['16:9', '21:9', '3:2', '4:3', '1:1', '3:4', '9:16'], when: p => ['L', 'M', 'S'].includes(p.media)};
const med = (p, per) => { const m = MEDIA[p.media]; if (!m) return null; const o = {...m}; if (o.kind === 'img') o.ratio = p.ratio; if (per) o.per = true; return o; };
const F = (k, label, max, role) => ({k, label, max, role});
const TYPES = {
  'Первый экран': {params: [P.pos(['Lt', 'Rt', 'Ct', 'Bg']), P.media(['L', 'I', 'нет']), RATIO, P.bool('badge', 'Бейдж'), P.bool('sub', 'Подзаголовок'), P.btn(2)],
    def: {pos: 'Lt', media: 'L', ratio: '16:9', badge: 'нет', sub: 'да', btn: '1'},
    build: p => ({layout: p.pos === 'Bg' ? 'bg' : p.pos === 'Ct' ? 'center' : 'split', reverse: p.pos === 'Rt', media: med(p.pos === 'Bg' && p.media === 'нет' ? {...p, media: 'L'} : p),
      fields: [p.badge === 'да' && F('badge', 'Бейдж', 20, 'badge'), F('h1', 'H1', 60, 'title'), p.sub === 'да' && F('sub', 'Подзаголовок', 140, 'lead'), ...btns(p)]})},
  'Заголовок': {params: [P.pos(['Lt', 'Ct']), {k: 'lvl', label: 'Уровень', opts: ['H2', 'H3']}, P.bool('sub', 'Подзаголовок'), P.btn(2)],
    def: {pos: 'Lt', lvl: 'H2', sub: 'нет', btn: '0'},
    build: p => ({heading: true, layout: p.pos === 'Ct' ? 'center' : 'stack', fields: [F(p.lvl.toLowerCase(), p.lvl, 60, 'title'), p.sub === 'да' && F('sub', 'Подзаголовок', 140, 'lead'), ...btns(p)]})},
  'Текст': {params: [P.pos(['Lt', 'Ct']), {k: 'size', label: 'Размер текста', opts: ['обычный', 'крупный']}, P.btn(2)],
    def: {pos: 'Lt', size: 'обычный', btn: '0'},
    build: p => ({layout: p.size === 'крупный' ? 'promo' : p.pos === 'Ct' ? (+p.btn ? 'bannerct' : 'center') : 'stack', fields: [F('t', 'Текст', p.size === 'крупный' ? 100 : 300, p.size === 'крупный' ? 'title' : 'text'), ...btns(p)]})},
  'Шахматка': {params: [P.pos(['Lt', 'Rt']), P.media(['L', 'M', 'S']), RATIO, P.count(0, 6), P.bool('sub', 'Текст'), P.btn(2)],
    def: {pos: 'Lt', media: 'L', ratio: '16:9', n: '0', sub: 'да', btn: '0'},
    build: p => ({layout: p.pos === 'Bg' ? 'bg' : +p.n ? 'listsplit' : 'split', reverse: p.pos === 'Rt', media: med(p),
      fields: [p.sub === 'да' && F('t', 'Текст', 300, 'text'), ...btns(p)], items: +p.n ? {n: +p.n, fields: [F('h', 'H3', 30, 'title'), F('t', 'Текст', 60, 'text')]} : null})},
  'Карточки': {params: [P.count(2, 8), P.media(['нет', 'I', 'S', 'M', 'L']), RATIO, P.bool('text', 'Текст'), P.bool('ibtn', 'Кнопка у каждой')],
    def: {n: '3', media: 'M', ratio: '3:2', text: 'да', ibtn: 'нет'},
    build: p => ({layout: 'grid', cols: Math.min(+p.n, 4), media: med(p, true),
      items: {n: +p.n, fields: [F('h', 'H3', 30, 'title'), p.text === 'да' && F('t', 'Текст', 100, 'text'), p.ibtn === 'да' && F('b', 'Кнопка', 20, 'btn')].filter(Boolean)}})},
  'Список': {params: [P.count(2, 8)], def: {n: '5'},
    build: p => ({layout: 'olist', items: {n: +p.n, fields: [F('t', 'Пункт', 160, 'itemFull')]}})},
  'Цифры': {params: [P.count(2, 6)], def: {n: '3'},
    build: p => ({layout: 'stats', cols: Math.min(+p.n, 4), items: {n: +p.n, fields: [F('n', 'Число', 10, 'num2'), F('t', 'Подпись', 60, 'text')]}})},
  'Цитата': {params: [P.bool('photo', 'Фото')], def: {photo: 'нет'},
    build: p => ({layout: p.photo === 'да' ? 'quote' : 'pull', media: p.photo === 'да' ? MEDIA.A : null, fields: [F('q', 'Цитата', 300, 'lead'), F('name', 'Имя', 30, 'qname'), F('cap', 'Должность', 60, 'qcap')]})},
  'Галерея': {params: [P.count(1, 6), P.media(['M', 'L']), RATIO, P.bool('cap', 'Подписи')],
    def: {n: '3', media: 'M', ratio: '4:3', cap: 'нет'},
    build: p => +p.n === 1 ? {layout: 'figure', media: med(p), fields: p.cap === 'да' ? [F('cap', 'Подпись', 140, 'cap')] : []}
      : {layout: 'gal', cols: Math.min(+p.n, 3), media: med(p, true), items: {n: +p.n, fields: p.cap === 'да' ? [F('cap', 'Подпись', 60, 'itemFull')] : []}}},
  'Шаги': {params: [P.count(2, 8), {k: 'mark', label: 'Метка шага', opts: ['номер', 'время', 'дата']}, P.media(['нет', 'I', 'S']), RATIO, P.bool('title', 'Заголовок шага'), P.bool('text', 'Текст')],
    def: {n: '4', mark: 'номер', media: 'нет', ratio: '1:1', title: 'да', text: 'да'},
    build: p => ({layout: p.mark === 'время' ? 'program' : p.mark === 'дата' ? 'timeline' : 'grid', cols: Math.min(+p.n, 4), media: med(p, true),
      items: {n: +p.n, style: 'steps', fields: [p.mark === 'номер' ? F('num', 'Номер', 0, 'num') : F('m', p.mark === 'время' ? 'Время' : 'Дата', 12, p.mark === 'время' ? 'title' : 'meta'),
        p.title === 'да' && F('h', p.mark === 'время' ? 'Тема' : 'Заголовок', p.mark === 'время' ? 140 : 40, p.mark === 'время' ? 'text' : 'title'),
        p.text === 'да' && F('t', p.mark === 'время' ? 'Описание' : 'Текст', 140, p.mark === 'время' ? 'meta' : 'text')].filter(Boolean)}})},
  'Люди': {params: [P.count(2, 8), P.bool('role', 'Должность'), P.bool('text', 'Описание')], def: {n: '3', role: 'да', text: 'да'},
    build: p => ({layout: 'people', cols: Math.min(+p.n, 4), media: {kind: 'photo', per: true},
      items: {n: +p.n, fields: [F('name', 'Имя', 25, 'title'), p.role === 'да' && F('h', 'Должность', 40, 'meta'), p.text === 'да' && F('t', 'Описание', 80, 'text')].filter(Boolean)}})},
  'Врезка': {params: [P.bool('icon', 'Иконка'), P.btn(1)], def: {icon: 'да', btn: '0'},
    build: p => ({layout: +p.btn ? 'ctatext' : 'callout', media: p.icon === 'да' ? MEDIA.I : null, fields: [F('t', 'Текст', 300, 'text'), ...btns(p)]})},
};
function btns(p) { return Array.from({length: +p.btn || 0}, (_, i) => F('b' + (i + 1), 'Кнопка ' + (i + 1), 20, 'btn')); }
G.CTOR_TYPES = Object.keys(TYPES); G.CTOR_DEF = TYPES;

/* название по параметрам */
const nameOf = (type, p, t) => {
  const part = [type];
  if (p.lvl) part.push(p.lvl);
  if (p.pos) part.push(p.pos);
  if (p.size === 'крупный') part.push('Крупный');
  if (p.n && (+p.n > 1 || type === 'Шахматка' && +p.n > 0)) part.push('X' + p.n);
  if (p.media && p.media !== 'нет') part.push(p.media + (['L', 'M', 'S'].includes(p.media) && p.ratio ? p.ratio.replace(':', 'x') : ''));
  if (p.photo === 'да') part.push('A');
  if (p.icon === 'да') part.push('I');
  if (p.mark && p.mark !== 'номер') part.push(p.mark === 'время' ? 'Время' : 'Дата');
  const txt = [...(t.fields || []), ...((t.items && t.items.fields) || [])].filter(f => ['text', 'lead', 'itemFull'].includes(f.role)).reduce((a, f) => Math.max(a, f.max), 0);
  if (txt > 400) part.push('TextM'); else if (txt > 150 && type !== 'Цитата' && type !== 'Текст' && type !== 'Врезка') part.push('TextS');
  if (+p.btn || p.ibtn === 'да') part.push('Кн');
  return part.join('-');
};
G.buildTpl = (type, p, limits = {}) => {
  const t = TYPES[type].build({...TYPES[type].def, ...p});
  t.fields = (t.fields || []).filter(Boolean);
  if (!t.media) delete t.media;
  if (!t.items) delete t.items;
  if (!t.reverse) delete t.reverse;
  const apply = f => { if (limits[f.k] != null) f.max = +limits[f.k]; };
  t.fields.forEach(apply); if (t.items) t.items.fields.forEach(f => { if (limits['i.' + f.k] != null) f.max = +limits['i.' + f.k]; });
  t.name = nameOf(type, {...TYPES[type].def, ...p}, t); t.type = type;
  return t;
};
const dummyText = (max, label) => { const s = (label + ' — пример текста, чтобы увидеть, как поле заполнится по лимиту. ').repeat(20); return s.slice(0, Math.max(3, Math.round(Math.min(max, 400) * 0.9))).trim(); };
const dummy = t => {
  const top = {}; (t.fields || []).forEach(f => top[f.k] = f.role === 'btn' ? 'Действие' : f.role === 'table' ? 'Тариф | Срок | Цена\nБазовый | 1 месяц | 0 ₽\nСтандарт | 6 месяцев | 990 ₽\nПро | 12 месяцев | 1 990 ₽' : f.role === 'body' ? dummyText(600, 'Текст статьи') + '\n' + dummyText(400, 'Второй абзац') : dummyText(f.max, f.label));
  const items = []; if (t.items) for (let i = 0; i < Math.min(t.items.n, t.items.any ? 4 : 12); i++) { const o = {}; t.items.fields.forEach(f => o[f.k] = f.role === 'num' ? String(i + 1) : f.role === 'num2' ? (i + 2) * 10 + '%' : f.role === 'btn' ? 'Действие' : dummyText(f.max, f.label)); items.push(o); }
  return {top, items};
};

/* компонент сайта: только превью — он меняется в коде сайта, не в Гриди */
/* паспорт шаблона одной строкой: поля, лимиты, медиа */
G.passportLine = t => '#поля: ' + [...(t.fields || []).filter(f => f.role !== 'num').map(f => `${f.label} ${f.max}`), ...(t.items ? [`×${t.items.any ? 'N' : t.items.n}: ` + t.items.fields.filter(f => f.role !== 'num').map(f => `${f.label} ${f.max}`).join(', ')] : [])].join('; ') + (t.media ? ` · ${t.media.kind === 'img' ? 'картинка' : t.media.kind === 'icon' ? 'иконка' : t.media.kind === 'photo' ? 'фото' : 'логотип'}${t.media.ratio && t.media.kind === 'img' ? ' ' + t.media.ratio : ''}${t.media.per ? ' у каждого' : ''}` : '');
G.componentView = (box, o) => {
  const e = G.esc, fl = [...(o.fields || []).map(f => f.label + (f.max && f.max < 5000 ? ' — до ' + f.max + ' зн.' : '')), ...(o.items ? [(o.items.any ? 'Элементы, сколько угодно: ' : `Элементы ×${o.items.n}: `) + o.items.fields.filter(f => f.role !== 'num').map(f => f.label).join(', ')] : [])];
  box.innerHTML = `<div class="edit"><div class="head"><p class="eye">Компонент сайта</p><h1 class="h1">${e(o.name)}</h1>
    <p class="lead">Системный компонент: его вид и поведение задаются в коде сайта, в Гриди он не меняется. Гриди только подбирает его и кладёт в него текст.</p></div>
    <div class="preview"><div class="wf-page">${G.wireBlock(o, dummy(o), {})}</div></div>
    <div class="card"><h3>Что принимает</h3><ul class="howto">${fl.map(x => `<li>${e(x)}</li>`).join('')}</ul>${o.roles ? `<p class="hint" style="margin:10px 0 0">Ставится в блок: ${e(o.roles.join(', ') === 'cta' ? 'целевое действие' : o.roles.join(', '))}</p>` : ''}</div></div>`;
};
G.ctorEditor = (box, o, onSave) => {
  const isNew = !o;
  let st = o && o.ctor ? G.clone(o.ctor) : {type: 'Карточки', p: {}, limits: {}};
  let meta = {prod: o ? !!(o.status && o.status.prod) : false, admin: o && o.status && o.status.rename ? o.name : '', krea: {...((o && o.krea) || {})}, suffix: (o && o.suffix) || ''};
  let legacy = !!(o && !o.ctor); const origId = o && o.id;
  const draw = () => {
    const T = TYPES[st.type], p = {...T.def, ...st.p}, t = legacy ? o : G.buildTpl(st.type, p, st.limits);
    const baseName = () => String(legacy ? o.name : t.name).replace(/@.*$/, '');
    const lim = legacy ? [] : [...(t.fields || []).map(f => ({k: f.k, label: f.label, max: f.max})), ...((t.items && t.items.fields) || []).filter(f => f.role !== 'num').map(f => ({k: 'i.' + f.k, label: f.label + ' (у элемента)', max: f.max}))].filter(x => x.max);
    box.innerHTML = `<div class="edit" style="max-width:1280px">
      <div class="edit-h"><div class="grow"><h1 class="h1">${legacy ? e(o.name) : isNew ? 'Новый шаблон' : e(o.name)}</h1></div>
        <div class="row" style="gap:6px">${!isNew ? '<button class="btn ghost danger" data-ed="del">Удалить</button>' : ''}<button class="btn pri" data-ed="save">Сохранить</button></div></div>
      <div class="tpledit"><div>
      
      <div class="card"><h3>Название</h3>
        <div class="row" style="gap:0;align-items:stretch"><code class="in" style="flex:none;display:flex;align-items:center;background:var(--soft);border-radius:12px 0 0 12px">${e(baseName())}@</code><input class="in grow" id="cSuf" style="border-radius:0 12px 12px 0" value="${e(meta.suffix)}" placeholder="суффикс, например письма" aria-label="Суффикс названия"></div>
        <span class="hint">Название собирается по схеме из параметров. Суффикс — для шаблонов кампании или проекта: <b>${e(baseName())}${meta.suffix ? '@' + e(meta.suffix) : '@…'}</b>. Пусто — без суффикса.</span></div>
      <div class="card"><h3>Тип</h3><div class="seg" id="cType">${G.CTOR_TYPES.map(k => `<button data-v="${e(k)}" aria-pressed="${!legacy && k === st.type}">${e(k)}</button>`).join('')}</div></div>
      ${legacy ? '' : `<div class="card"><h3>Параметры</h3>${T.params.filter(q => !q.when || q.when(p)).map(q => `<div class="fld"><span class="lbl">${e(q.label)}</span><div class="seg" data-p="${q.k}">${q.opts.map(v => `<button data-v="${e(v)}" aria-pressed="${String(p[q.k]) === v}">${e(v)}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="card"><h3>Лимиты знаков</h3>${lim.map(x => `<div class="row" style="margin-bottom:6px"><span class="grow">${e(x.label)}</span><input class="in" type="number" data-lim="${x.k}" value="${x.max}" style="width:100px"></div>`).join('')}</div>`}
      ${(legacy ? o.media : t.media) && (legacy ? o.media : t.media).kind !== 'icon' ? `<div class="card"><h3>Картинки — Krea</h3><p class="hint" style="margin:-4px 0 12px">Для картинок этого шаблона. Пусто — берётся Krea app из настроек по размеру.</p>
        <div class="fld"><label class="lbl" for="kUrl">Krea app</label><input class="in" id="kUrl" value="${e(meta.krea.url || '')}" placeholder="https://www.krea.ai/…"></div>
        <div class="fld" style="margin:0"><label class="lbl" for="kPr">Стиль и указания для генерации</label><textarea class="ta" id="kPr" rows="3" placeholder="Например: плоская иллюстрация, фон #F4F4F1, без текста на картинке">${e(meta.krea.prompt || '')}</textarea><span class="hint">Встанет перед текстом блока в «Текст для Krea».</span></div></div>` : ''}
      <div class="card"><h3>Статус</h3>
        <div class="seg" id="cProdSeg"><button data-v="1" aria-pressed="${meta.prod}">В админке</button><button data-v="0" aria-pressed="${!meta.prod}">Нужен дизайн</button></div>
</div>
      </div>
      <div class="preview"><div style="padding:12px 14px;border-bottom:1px solid var(--line)" class="row"><b class="grow">${e(t.name)}</b><span class="hint">текст на 90% лимита</span></div>
        <div class="wf-page" id="cPrev">${G.wireBlock(t, legacy ? dummy(t) : dummy(t), {})}</div>
        <div style="padding:12px 14px;border-top:1px solid var(--line)"><span class="lbl">Описание для админки</span><div class="row" style="gap:6px"><code class="grow" style="font:12px ui-monospace,Menlo,monospace;background:var(--soft);padding:6px 8px;border-radius:7px;overflow-wrap:anywhere" id="cPass">${e(G.passportLine(t))}</code><button class="ib sm" id="cCopy" aria-label="Скопировать">${G.icon.copy}</button></div></div></div>
      </div></div>`;
    box.querySelector('#cType').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; legacy = false; st = {type: b.dataset.v, p: {}, limits: {}}; draw(); };
    box.querySelectorAll('[data-p]').forEach(sg => sg.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; st.p[sg.dataset.p] = b.dataset.v; st.limits = {}; draw(); });
    box.querySelectorAll('[data-lim]').forEach(i => i.onchange = () => { st.limits[i.dataset.lim] = +i.value; draw(); });
    box.querySelector('#cSuf').onchange = ev => { meta.suffix = ev.target.value.trim().replace(/^@+/, '').replace(/\s+/g, '-'); draw(); };
    const ku = box.querySelector('#kUrl'), kp = box.querySelector('#kPr');
    if (ku) ku.oninput = () => { meta.krea.url = ku.value.trim(); }; if (kp) kp.oninput = () => { meta.krea.prompt = kp.value; };
    box.querySelector('#cProdSeg').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; meta.prod = b.dataset.v === '1'; draw(); };
    box.querySelector('#cCopy').onclick = async () => { await G.copy(box.querySelector('#cPass').textContent); G.ui.toast('Скопировано'); };
    box.querySelector('.edit-h').onclick = ev => {
      const b = ev.target.closest('[data-ed]'); if (!b) return;
      if (b.dataset.ed === 'del') { G.lib.remove('templates', G.ui.lib.id); G.ui.dirty = false; G.ui.go('#/lib/templates'); return; }
      let res;
      const kr = {}; if (meta.krea.url) kr.url = meta.krea.url; if ((meta.krea.prompt || '').trim()) kr.prompt = meta.krea.prompt.trim();
      if (legacy) { res = {...o, status: {...o.status, prod: meta.prod}}; }
      else {
        const built = G.buildTpl(st.type, {...TYPES[st.type].def, ...st.p}, st.limits);
        const name = built.name;
        res = {...built, id: origId || ('c-' + Date.now().toString(36)), name, status: {prod: meta.prod}, ctor: st};
      }
      if (Object.keys(kr).length) res.krea = kr; else delete res.krea;
      delete res.custom; delete res.set;
      res.name = String(res.name).replace(/@.*$/, '') + (meta.suffix ? '@' + meta.suffix : ''); if (meta.suffix) res.suffix = meta.suffix; else delete res.suffix;
      const clash = G.tpls().find(x => x.id !== res.id && (x.name === res.name || (x.status && x.status.rename === res.name)));
      if (clash) { G.ui.toast(`«${res.name}» уже есть в библиотеке.`); return; }
      const st_ = G.tplSelfTest(res); G.lib.save('templates', res); G.ui.toast(st_.length ? `Сохранено, но текст не встаёт в поля: ${st_.join(', ')}. Напишите, какой шаблон — это ошибка Гриди.` : 'Сохранено'); G.ui.dirty = false; G.ui.go('#/lib/templates');
    };
  };
  draw();
};
})();
