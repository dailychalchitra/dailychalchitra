const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const puppeteer = require('puppeteer');

const FONT_DIR = 'node_modules/@fontsource/noto-sans-bengali/files';
const OUT_DIR = 'assets/og';
const WIDTH = 1200;
const HEIGHT = 675;

const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const b64 = (file) => fs.readFileSync(file).toString('base64');

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'image/webp';
}

function template({ bg, category, title, author, f400, f700 }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:BN;font-weight:400;src:url(data:font/woff2;base64,${f400}) format('woff2');}
    @font-face{font-family:BN;font-weight:700;src:url(data:font/woff2;base64,${f700}) format('woff2');}
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${WIDTH}px;height:${HEIGHT}px;position:relative;overflow:hidden;font-family:BN,sans-serif;background:#000}
    .bg{position:absolute;inset:0;background:url('${bg}') center/cover no-repeat}
    .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 20%,rgba(0,0,0,.88) 100%)}
    .brand{position:absolute;top:36px;left:60px;background:rgba(255,255,255,.95);color:#C00000;
           font-weight:700;font-size:28px;padding:10px 18px;border-radius:8px}
    .box{position:absolute;left:60px;right:60px;bottom:56px;color:#fff}
    .cat{display:inline-block;background:#C00000;color:#fff;font-weight:700;font-size:26px;
         padding:6px 18px;border-radius:6px;margin-bottom:18px}
    .title{font-size:58px;font-weight:700;line-height:1.3;margin-bottom:16px;
           display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .author{font-size:30px;color:#f1c40f}
  </style></head><body>
    <div class="bg"></div><div class="shade"></div>
    <div class="brand">দৈনিক চালচিত্র</div>
    <div class="box">
      <span class="cat">${esc(category)}</span>
      <div class="title">${esc(title)}</div>
      ${author ? `<div class="author">লেখক: ${esc(author)}</div>` : ''}
    </div>
  </body></html>`;
}

(async () => {
  const f400 = b64(path.join(FONT_DIR, 'noto-sans-bengali-bengali-400-normal.woff2'));
  const f700 = b64(path.join(FONT_DIR, 'noto-sans-bengali-bengali-700-normal.woff2'));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (const file of fs.readdirSync('_posts')) {
    if (!/\.(md|html)$/.test(file)) continue;
    const { data } = matter(fs.readFileSync(path.join('_posts', file), 'utf8'));
    if (!data.title) continue;

    const outFile = path.join(OUT_DIR, file.replace(/\.(md|html)$/, '') + '.jpg');

    const imgSrc = data.image || '/assets/img/daily-chalchitra.webp';
    const localImg = path.join('.', imgSrc.replace(/^\//, ''));
    const bg = fs.existsSync(localImg)
      ? `data:${mimeOf(localImg)};base64,${b64(localImg)}`
      : imgSrc;

    const category = (Array.isArray(data.category_bn) ? data.category_bn[0] : data.category_bn)
      || (Array.isArray(data.categories) ? data.categories[0] : data.categories)
      || 'দৈনিক চালচিত্র';

    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT });
    await page.setContent(
      template({ bg, category, title: data.title, author: data.author, f400, f700 }),
      { waitUntil: 'load' }
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: outFile, type: 'jpeg', quality: 88 });
    await page.close();
    console.log('তৈরি:', outFile);
  }

  await browser.close();
})();
