"""Check the static site's internal links, anchors, metadata, and sitemap.
Run with Python 3: python scripts/check_site.py
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
class Page(HTMLParser):
    def __init__(self, file):
        super().__init__(convert_charrefs=True)
        self.file, self.ids, self.refs, self.errors = file, set(), [], []
        self.h1, self.canonical, self.description = 0, 0, False
        self.feed(file.read_text(encoding='utf-8-sig'))
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids: self.errors.append('duplicate ID: '+a['id'])
            self.ids.add(a['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical += 1
        if tag == 'meta' and a.get('name') == 'description': self.description = bool(a.get('content'))
        for key in ('href', 'src', 'poster', 'action'):
            if key in a: self.refs.append(a[key])

pages = {p.resolve(): Page(p) for p in ROOT.rglob('*.html') if not any(part.startswith('.') for part in p.relative_to(ROOT).parts)}
errors, links = [], 0
for file, page in pages.items():
    label = file.relative_to(ROOT).as_posix()
    errors.extend(f'{label}: {message}' for message in page.errors)
    if page.h1 != 1: errors.append(f'{label}: expected one H1, got {page.h1}')
    if not page.description: errors.append(f'{label}: missing description')
    if file.name != '404.html' and page.canonical != 1: errors.append(f'{label}: expected one canonical URL')
    for ref in page.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc: continue
        links += 1
        route = unquote(parsed.path)
        target = ((ROOT / route.lstrip('/')) if route.startswith('/') else file.parent / route).resolve() if route else file
        if target.is_dir(): target /= 'index.html'
        if not target.is_relative_to(ROOT): errors.append(f'{label}: link leaves site: {ref}')
        elif not target.exists(): errors.append(f'{label}: missing target: {ref}')
        elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
            errors.append(f'{label}: missing anchor: {ref}')
xml = ET.parse(ROOT/'sitemap.xml')
for loc in xml.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
    route = urlsplit(loc.text).path.lstrip('/')
    target = ROOT/route
    if target.is_dir(): target /= 'index.html'
    if not target.exists(): errors.append('sitemap: missing '+route)
if errors:
    print('\n'.join(errors)); sys.exit(1)
print(f'PASS: {len(pages)} pages, {links} local references, unique IDs, H1s, metadata, and sitemap.')
