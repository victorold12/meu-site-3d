"""Extrai conteúdo e valores da evidência e fonte; não transcreve copy manualmente."""
from pathlib import Path
from collections import Counter
import json, re, hashlib
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'reference'
OUT = ROOT / 'src/generated'
OUT.mkdir(parents=True, exist_ok=True)
html = (REF / 'index.html').read_text(encoding='utf-8')
soup = BeautifulSoup(html, 'html.parser')
data = {
    'title': soup.title.get_text(),
    'navigation': [dict(name=e.get('data-name'), text=e.get_text(' ', strip=True))
                   for e in soup.select('.js-navigation-item')],
    'sections': [dict(classes=e.get('class'), html=str(e), text=e.get_text(' ', strip=True))
                 for e in soup.select('.js-content')],
    'inlineSvg': [str(e) for e in soup.select('svg')],
}
(OUT / 'home.ts').write_text('/* Gerado por scripts/extract-study.py; não editar. */\n'
                            'export const referenceContent = ' + json.dumps(data, ensure_ascii=False, indent=2)
                            + ' as const;\n', encoding='utf-8')
css = (REF / 'original.css').read_text(encoding='utf-8')
tokens = {
    'colors': dict(Counter(re.findall(r'#[0-9a-fA-F]{3,8}\b', css)).most_common()),
    'mediaQueries': sorted(set(re.findall(r'@media[^{}]+', css))),
    'transitions': sorted(set(re.findall(r'transition(?:-[\w]+)?:([^;}]+)', css))),
    'cssSha256': hashlib.sha256(css.encode()).hexdigest(),
}
(REF / 'css-inventory.json').write_text(json.dumps(tokens, indent=2), encoding='utf-8')
bundle = (REF / 'bundle/index-ORr3L4no.js').read_text(encoding='utf-8')
needles = ['power4.in', 'back.out(1.7)', 'power1.inOut', 'power2.inOut',
           'back.in(1.3)', 'back.in(1.5)', 'input-filter-intro', 'globalTimeline.timeScale']
excerpts = {}
for needle in needles:
    positions = [m.start() for m in re.finditer(re.escape(needle), bundle)]
    excerpts[needle] = [dict(offset=i, context=bundle[max(0,i-180):i+220]) for i in positions[:12]]
(REF / 'bundle-motion-excerpts.json').write_text(json.dumps(excerpts, indent=2), encoding='utf-8')
lock = json.loads((ROOT / 'upstream/package-lock.json').read_text())
versions = {name: lock.get('packages', {}).get('node_modules/' + name, {}).get('version')
            for name in ['three', 'gsap', '@dimforge/rapier3d', 'howler', 'camera-controls', 'vite', 'stylus']}
(REF / 'runtime-versions.json').write_text(json.dumps(versions, indent=2), encoding='utf-8')
print(json.dumps({'sections': len(data['sections']), 'svg': len(data['inlineSvg']),
                  'colors': len(tokens['colors']), 'versions': versions}))
