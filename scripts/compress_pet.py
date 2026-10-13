"""Encode a validated full-size atlas as WebP; never resize frames in place."""
import argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT/'科哞哞桌宠'/'final'/'spritesheet-extended.png')
    args = parser.parse_args()
    target = ROOT/'assets'/'pet'/'spritesheet.webp'
    if args.source.resolve() == target.resolve():
        raise SystemExit('Source must differ from output.')
    with Image.open(args.source) as source:
        if source.size != (1536, 2288) or 'A' not in source.getbands():
            raise SystemExit('Expected a transparent 1536x2288 v2 atlas; refusing to resize or overwrite it.')
        target.parent.mkdir(parents=True, exist_ok=True)
        source.save(target, 'WEBP', quality=90, method=6)
    print(f'Encoded {target.name}: {target.stat().st_size:,} bytes, dimensions preserved.')

if __name__ == '__main__':
    main()
