"""Comparação estrita e com tolerância, apenas regiões DOM opacas com mesma viewport."""
from pathlib import Path
from PIL import Image, ImageChops
import json

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / 'reference/verification'
rows = []
for device in ['desktop', 'mobile']:
    for section in ['home', 'controls', 'options', 'behindTheScene']:
        ap = P / f'reference-{device}-{section}-content.png'
        bp = P / f'local-{device}-{section}-content.png'
        settled = device == 'mobile' and section == 'controls' and (P / 'reference-mobile-controls-stable-content.png').exists()
        if settled:
            ap = P / 'reference-mobile-controls-stable-content.png'
            bp = P / 'local-mobile-controls-stable-content.png'
        if not ap.exists() or not bp.exists():
            rows.append(dict(device=device, section=section, status='NOT_CAPTURED'))
            continue
        a, b = Image.open(ap).convert('RGB'), Image.open(bp).convert('RGB')
        if a.size != b.size:
            rows.append(dict(device=device, section=section, status='SIZE_MISMATCH', reference=a.size, local=b.size))
            continue
        # .content mede calc(100% + 20px), mas o ancestral .contents recorta esses
        # 20px. Exclui-se apenas essa faixa externa que captura o mundo animado.
        box = (0, 0, a.width - 20, a.height)
        a, b = a.crop(box), b.crop(box)
        d = ImageChops.difference(a, b)
        hist = d.convert('L').histogram()
        n = a.width * a.height
        pixels = list(d.get_flattened_data())
        exact = sum(max(p) != 0 for p in pixels)
        over = sum(max(p) > 24 for p in pixels)
        row = dict(device=device, section=section, status='MEASURED', width=a.width, height=a.height,
                   referenceImage=ap.name, localImage=bp.name, settledOpacityCapture=settled,
                   pixels=n, differentPixels=exact, exactDifferencePercent=exact/n*100,
                   over24Percent=over/n*100, meanLumaDelta=sum(i*c for i,c in enumerate(hist))/n,
                   diffBBox=d.getbbox(), dynamicServiceRow=section=='options')
        rows.append(row)
        d.save(P / f'diff-{device}-{section}.png')
        print(f'{device:7} {section:16} {a.width}x{a.height} different={exact}/{n} ({exact/n*100:.6f}%) >24={over/n*100:.6f}%')
(P / 'pixel-diff.json').write_text(json.dumps(rows, indent=2), encoding='utf-8')
