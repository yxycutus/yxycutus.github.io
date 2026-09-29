"""Prepare responsive photographs for reading pages; preserve the originals."""
from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = {
    'library-window': ('高新区图书馆落地窗.jpg', '高新区图书馆 · 窗边'),
    'library-night': ('高新区图书馆.jpg', '高新区图书馆 · 入夜'),
    'winter-library': ('东图雪景.jpg', '东图 · 雪后'),
    'east-lake': ('武汉东湖公园.jpg', '武汉 · 东湖公园'),
    'nanjing': ('南京.jpg', '南京 · 行走之间'),
    'qingdao': ('青岛.jpg', '青岛 · 街头'),
    'aloha-arm': ('aloha从臂.jpg', 'Aloha Mini · 从臂'),
    'robotics-institute': ('人形机器人研究院.jpg', '人形机器人研究院 · 一瞥'),
}

def main():
    target = ROOT / 'assets' / 'editorial'
    target.mkdir(exist_ok=True)
    manifest = {}
    for name, (filename, caption) in PHOTOS.items():
        with Image.open(ROOT / 'picture' / filename) as source:
            photo = ImageOps.exif_transpose(source).convert('RGB')
            for width in (640, 1440):
                rendition = photo.copy()
                rendition.thumbnail((width, width * 2), Image.Resampling.LANCZOS)
                rendition.save(target / f'{name}-{width}.webp', quality=82, method=6)
            manifest[name] = {'source': f'picture/{filename}', 'caption': caption,
                              'width': photo.width, 'height': photo.height}
    (target / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared {len(manifest)} photographs in two sizes.')

if __name__ == '__main__':
    main()
