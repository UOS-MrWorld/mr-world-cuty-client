from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import pdfplumber
import json

root = Path(__file__).resolve().parent
pages = sorted(root.glob('page-*.png'))
for n in range(0, len(pages), 6):
    sheet = Image.new('RGB', (1080, 2385), '#dce7f1')
    for k, path in enumerate(pages[n:n+6]):
        image = Image.open(path).convert('RGB')
        image.thumbnail((520, 735))
        x = 10 + k % 2 * 540
        y = 25 + k // 2 * 795
        sheet.paste(image, (x, y))
        ImageDraw.Draw(sheet).text((x+8,y+746), path.stem, fill='#263d57')
    sheet.save(root / f'contact-{n//6+1}.png')

pdf = root.parents[1] / 'output/pdf/CUTY_StarUML_처음부터_따라하기.pdf'
with pdfplumber.open(pdf) as doc:
    checks = []
    for i,p in enumerate(doc.pages,1):
        outside = [ch['text'] for ch in p.chars if ch['x0'] < 12 or ch['x1'] > p.width - 12 or ch['top'] < 10 or ch['bottom'] > p.height-10]
        checks.append({'page':i, 'chars':len(p.chars), 'outside':outside})
    print(json.dumps(checks,ensure_ascii=False))
