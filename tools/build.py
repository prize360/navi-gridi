"""Сборка Гриди. Запуск из корня репозитория: python3 tools/build.py
1) library/rules.yaml (+ короткие формулировки library/rules-short.json) → library/rules.js — правила для Гриди и Нави;
2) dist/gridi.html — всё в одном файле: открывается двойным кликом, без сайта."""
import json, re, os, sys
try:
    import yaml
except ImportError:
    sys.exit('Нужен PyYAML: pip install pyyaml')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# 1. правила
y = yaml.safe_load(open('library/rules.yaml', encoding='utf-8'))
short = json.load(open('library/rules-short.json', encoding='utf-8'))
rules = [{'id': r['id'], 'level': r['level'], 'group': r.get('group', ''), 'section': r.get('section', ''),
          'text': r['text'], 'short': short.get(r['id'], ''), 'why': r.get('why', '')} for r in y['rules']]
miss = [r['id'] for r in rules if not r['short']]
if miss: print('Нет короткой формулировки (будет полный текст):', ', '.join(miss))
data = {'guide': y.get('guide'), 'version': y.get('version'), 'date': y.get('guide_date'), 'rules': rules}
open('library/rules.js', 'w', encoding='utf-8').write(
    '/* Правила гайда — собрано tools/build.py из library/rules.yaml. Руками не править. */\n'
    'window.GUIDE_RULES = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(f'library/rules.js: {len(rules)} правил, версия гайда {data["version"]}')

# 2. один файл
inline_js = lambda path: '<script>' + open(path, encoding='utf-8').read().replace('</script', '<\\/script') + '</script>'
navi = open('navi.html', encoding='utf-8').read().replace('<script src="library/rules.js"></script>', inline_js('library/rules.js'))
h = open('index.html', encoding='utf-8').read()
h = re.sub(r'<link[^>]*href="(app/[^"]+\.css)"[^>]*>', lambda m: '<style>' + open(m.group(1), encoding='utf-8').read() + '</style>', h)
h = re.sub(r'<script src="((?:app|library)/[^"]+)"[^>]*></script>', lambda m: inline_js(m.group(1)), h)
i = h.index('<script>')
h = h[:i] + '<script>window.GRIDI_NAVI_HTML=' + json.dumps(navi, ensure_ascii=False).replace('</', '<\\/') + ';</script>' + h[i:]
os.makedirs('dist', exist_ok=True)
open('dist/gridi.html', 'w', encoding='utf-8').write(h)
print(f'dist/gridi.html: {len(h) // 1024} КБ')
