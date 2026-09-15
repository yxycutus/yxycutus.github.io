// Refresh cache keys together so existing browsers load matching theme JS/CSS.
// Run after changing these assets; --check verifies the committed HTML references.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const names = ['theme-init.js', 'experience.js', 'style.css', 'experience.css', 'home.css'];
const versions = Object.fromEntries(names.map(name => [name,
  createHash('sha256').update(fs.readFileSync(path.join(root, 'assets', name), 'utf8').replaceAll('\r\n', '\n')).digest('hex').slice(0, 12)]));
function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.name.startsWith('.') ? [] : entry.isDirectory() ? pages(path.join(dir, entry.name)) : entry.name.endsWith('.html') ? [path.join(dir, entry.name)] : []);
}
let count = 0;
for (const file of pages(root)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(/((?:src|href)="(?:\/|(?:\.\.\/)*)assets\/)(theme-init\.js|experience\.js|style\.css|experience\.css|home\.css)(?:\?[^"\s]*)?"/g,
    (_, prefix, name) => `${prefix}${name}?v=${versions[name]}"`);
  if (after === before) continue;
  if (process.argv.includes('--check')) throw new Error(`Stale theme asset versions: ${path.relative(root, file)}`);
  fs.writeFileSync(file, after);
  count++;
}
console.log(`PASS: theme asset versions (${count} pages updated), navigation revision ${versions['theme-init.js']}.`);
