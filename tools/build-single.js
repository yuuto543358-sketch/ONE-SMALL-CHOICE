/* index.html の CSS と JavaScript を埋め込んで、1枚の HTML にまとめる
   使い方: node tools/build-single.js            → dist/one-small-choice.html
           node tools/build-single.js --fragment → <html>/<head>/<body> を省いた版（埋め込み用） */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const fragment = process.argv.includes('--fragment');

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, p) =>
  '<style>\n' + fs.readFileSync(path.join(root, p), 'utf8') + '\n</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, p) =>
  '<script>\n' + fs.readFileSync(path.join(root, p), 'utf8').replace(/<\/script/gi, '<\\/script') + '\n</script>');

if (fragment) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/<meta charset[^>]*>\s*/, '')
    .replace(/<meta name="viewport"[^>]*>\s*/, '')
    .replace('<title>ONE SMALL CHOICE</title>', '<title>ONE SMALL CHOICE</title>\n<meta name="claude:viewport-fit-sides" content="cover">');
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  html = head.trim() + '\n' + body.trim() + '\n';
}

const out = path.join(root, 'dist', fragment ? 'one-small-choice.fragment.html' : 'one-small-choice.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('書き出しました: ' + path.relative(root, out) + ' (' + Math.round(html.length / 1024) + ' KB)');
