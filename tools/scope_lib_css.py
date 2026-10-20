"""Старые стили библиотеки → app/css/lib.css, только внутри .libv (новый интерфейс их не видит)."""
import re, sys, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
src = (R / 'tools/app-old.css').read_text()
src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
TOK = {'--bg': '#f2f2f2', '--soft': '#ececec', '--hover': '#e6e6e6', '--line': '#e2e2e2', '--line2': '#cfcfcf'}
def sel(s):
    out = []
    for p in split(s):
        p = p.strip()
        if not p: continue
        if p in (':root', 'html', 'body', 'html,body'): out.append('.libv'); continue
        p = re.sub(r'^(html|body|:root)\b', '.libv', p)
        out.append(p if p.startswith('.libv') else '.libv ' + p)
    return ','.join(dict.fromkeys(out))
def split(s):
    d = 0; cur = ''; res = []
    for c in s:
        if c in '([': d += 1
        if c in ')]': d -= 1
        if c == ',' and d == 0: res.append(cur); cur = ''
        else: cur += c
    res.append(cur); return res
def walk(s):
    o = []; i = 0
    while i < len(s):
        j = s.find('{', i)
        if j < 0: break
        head = s[i:j].strip(); d = 1; k = j + 1
        while d: d += {'{': 1, '}': -1}.get(s[k], 0); k += 1
        body = s[j + 1:k - 1]
        if head.startswith('@media') or head.startswith('@supports'): o.append(head + '{' + walk(body) + '}')
        elif head.startswith('@'): o.append(head + '{' + body + '}')
        else: o.append(sel(head) + '{' + body + '}')
        i = k
    return '\n'.join(o)
out = walk(src)
for k, v in TOK.items(): out = re.sub(r'(\.libv\{[^}]*?)' + re.escape(k) + r':[^;]+;', lambda m: m.group(1) + k + ':' + v + ';', out, count=1)
CLASH = ['bad', 'chip', 'col', 'danger', 'ghost', 'h1', 'head', 'hint', 'ib', 'in', 'lbl', 'list', 'ok', 'on', 'pill', 'pri', 'row', 'seg', 'sm', 'soft', 'steps', 'sub', 'ta', 'ttl', 'warn', 'wide']
# у нового интерфейса такие же имена классов — внутри библиотеки возвращаем им исходный вид, дальше действуют старые правила
out = '.libv :is(' + ','.join('.' + c for c in CLASH) + '){all:revert}\n' + out
out = '/* Сгенерировано tools/scope_lib_css.py из старых стилей: экран библиотеки внутри нового интерфейса */\n' + out + '\n.libv{min-height:auto;background:transparent}\n'
(R / 'app/css/lib.css').write_text(out); print(len(out))
# на телефоне: шапка редактора столбиком, поля не шире экрана
(R / 'app/css/lib.css').write_text((R / 'app/css/lib.css').read_text() + '.libv .edit-h{flex-direction:column;align-items:stretch}.libv .edit-h .row{flex-wrap:wrap}.libv input,.libv textarea,.libv select{max-width:100%;box-sizing:border-box}\n')
