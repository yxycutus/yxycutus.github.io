"""Import the approved original poses without erasing white clothing or clipping feet.

python scripts/prepare_pet_assets.py --source <科哞哞目录>
The source directory is read-only. Only web-sized copies are written.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
NAMES = ['welcome', 'mentor', 'project', 'resource', 'achievement', 'notice', 'lecture', 'recruit', 'thinking']

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    args = parser.parse_args()
    submission = args.source.resolve() / '投稿文件'
    files = [submission/'01_科哞哞_主形象_RGB.png', *sorted((submission/'动作延展').glob('*.png'))]
    if len(files) != 9 or not all(file.is_file() for file in files):
        raise SystemExit('Expected the approved main portrait and eight action images.')
    destination = ROOT/'assets'/'pet'/'scenes'
    destination.mkdir(parents=True, exist_ok=True)
    records = []
    for name, source in zip(NAMES, files):
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert('RGB')
            image.thumbnail((512, 512), Image.Resampling.LANCZOS)
            target = destination/f'{name}.webp'
            image.save(target, 'WEBP', quality=88, method=6)
        records.append({'id':name, 'source':source.name, 'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'file':f'scenes/{name}.webp', 'width':image.width, 'height':image.height, 'bytes':target.stat().st_size})
    (destination.parent/'scenes.json').write_text(json.dumps({'note':'Original illustrated poses; complete composition and pale background retained.', 'scenes':records}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'Prepared {len(records)} scene images ({sum(r["bytes"] for r in records):,} bytes); original files unchanged.')

if __name__ == '__main__':
    main()
