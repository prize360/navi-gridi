/* Гриди — экран библиотеки в новом интерфейсе: старые редакторы (lib.js, ctor.js) работают через этот мост */
'use strict';
(() => {
const G = window.Gridi;
const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
G.icon = {
  spark: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  more: I('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  copy: I('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
  down: I('<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>'),
  up: I('<path d="M12 20V8M6 13l6-6 6 6M5 4h14"/>'),
  book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'),
  play: I('<path d="M7 5v14l11-7z"/>'),
  file: I('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  grid: I('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  aa: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><text x="1" y="18" font-family="Onest,Inter,system-ui,sans-serif" font-size="15" font-weight="700" fill="currentColor">Aa</text></svg>',
  chevU: I('<path d="M6 15l6-6 6 6"/>'),
  chevD: I('<path d="M6 9l6 6 6-6"/>'),
  sliders: I('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
  ext: I('<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
};

G.views = G.views || {};
const S = G.ui = G.ui || {};
S.lib = {kind: 'templates', id: null}; S.dirty = false; S.libQ = '';
/* главное действие экрана — кнопкой в нижней панели */
S.cta = c => { const d = document.getElementById('lDock'); if (!d) return; d.innerHTML = c ? `<button class="pill pri wide" id="lCta">${c.label}</button>` : ''; if (c) d.querySelector('#lCta').onclick = ev => c.run(ev.currentTarget); };
S.go = hash => { if (location.hash === hash) S.render(); else location.hash = hash; };
S.render = () => { if (G.libView) G.libView(); };
S.modal = (html, {wide, onClose} = {}) => {
  const wrap = document.createElement('div'); wrap.className = 'libv libv-layer';
  wrap.innerHTML = `<div class="scrim"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.appendChild(wrap); const root = wrap.firstElementChild, prev = document.activeElement;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); onClose && onClose(); };
  const key = ev => { if (ev.key === 'Escape') close(); };
  document.addEventListener('keydown', key);
  root.addEventListener('mousedown', ev => { if (ev.target === root) close(); });
  root.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
  setTimeout(() => { const f = root.querySelector('[autofocus],textarea,input,button.pri'); f && f.focus(); }, 20);
  return {root, close, $: s => root.querySelector(s)};
};
/* несохранённые правки в редакторе записи: предупреждаем перед уходом */
S.markDirty = v => { const md = ev => { if (!S.lib.id) return;
    const t = ev.target; if (ev.type === 'click' && !(t.closest && t.closest('.seg button, [data-mv], [data-rm], #addRole, [data-krea]'))) return;
    if (t.closest && t.closest('#libQ, #packIn, [data-close]')) return; S.dirty = true; };
  ['input', 'change', 'click'].forEach(k => v.addEventListener(k, md, true)); };
addEventListener('beforeunload', ev => { if (S.dirty) { ev.preventDefault(); ev.returnValue = ''; } });
})();
