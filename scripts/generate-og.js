const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const puppeteer = require('puppeteer');

const FONT_DIR = 'node_modules/@fontsource/noto-sans-bengali/files';
const OUT_DIR = 'assets/og';
const LOGO_PATH = 'assets/img/logo-og.png';
const DEFAULT_BG = '/assets/img/daily-chalchitra.webp';
const WIDTH = 1200;
const HEIGHT = 675;

// ছবিটি ডানদিকে কতটুকু সরবে (px)। বড় করলে ছবি আরও ডানে যাবে।
const BG_SHIFT = 200;

// একটি ১×১ স্বচ্ছ GIF, ছবি না থাকলে ব্যবহৃত হবে
const BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const b64 = (file) => fs.readFileSync(file).toString('base64');

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'image/webp';
}

function template({ bg, category, title, author, f400, f700, logoB64 }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @font-face {
      font-family: BN;
      font-weight: 400;
      src: url(data:font/woff2;base64,${f400}) format('woff2');
    }
    @font-face {
      font-family: BN;
      font-weight: 700;
      src: url(data:font/woff2;base64,${f700}) format('woff2');
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      position: relative;
      overflow: hidden;
      font-family: BN, sans-serif;
      background: #000;
    }

    /* ছবি ডানদিকে সরানো হয়েছে; ডান পাশ কাটা যাবে, মুখ মাঝখানে থাকবে */
    .bg {
      position: absolute;
      top: 0;
      bottom: 0;
      left: ${BG_SHIFT}px;
      width: ${WIDTH}px;
      background: url('${bg}') center/cover no-repeat;
    }

    /* বাম পাশের সাদা প্যানেল, ডান কিনারা তির্যক */
    .panel {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 640px;
      background: #fdfbf7;
      clip-path: polygon(0 0, 100% 0, 84% 100%, 0 100%);
    }

    /* উপরের লাল ফিতা */
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 700px;
      height: 16px;
      background: #C00000;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0 100%);
    }

    /* নিচের লাল ফিতা */
    .bottom-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 14px;
      background: #C00000;
    }

    .brand {
      position: absolute;
      top: 44px;
      left: 50px;
      line-height: 0;
    }

    .brand img {
      height: 70px;
      width: auto;
      display: block;
    }

    .cat {
      position: absolute;
      top: 170px;
      left: 50px;
      color: #C00000;
      font-size: 30px;
      font-weight: 700;
      border-left: 6px solid #C00000;
      padding-left: 12px;
      line-height: 1.2;
    }

    /* শিরোনাম: উপর-নিচে লম্বাটে (scaleY) ও একটু অক্ষর-ব্যবধান */
    .title {
      position: absolute;
      top: 225px;
      left: 50px;
      width: 530px;
      font-size: 50px;
      font-weight: 700;
      line-height: 1.35;
      letter-spacing: 1px;
      color: #111;
      text-shadow: 2px 2px 0 rgba(192, 0, 0, 0.25);
      transform: scaleY(1.22);
      transform-origin: top left;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* লেখকের নাম: নতুন রং (গাঢ় নীল) */
    .author {
      position: absolute;
      bottom: 62px;
      left: 50px;
      font-size: 28px;
      font-weight: 700;
      color: #0d47a1;
      border-bottom: 3px solid #C00000;
      padding-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="panel"></div>
  <div class="top-bar"></div>
  <div class="bottom-bar"></div>

  <div class="brand">
    <img src="data:image/png;base64,${logoB64}" alt="দৈনিক চালচিত্র">
  </div>

  <div class="cat">${esc(category)}</div>
  <div class="title">${esc(title)}</div>
  ${author ? `<div class="author">লেখক: ${esc(author)}</div>` : ''}
</body>
</html>`;
}

// পটভূমি ছবি (CSS background) লোড ও ডিকোড হওয়া পর্যন্ত অপেক্ষা
async function waitForBackground(page) {
  await page.evaluate(() => new Promise((resolve) => {
    const el = document.querySelector('.bg');
    const match = getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (!match || !match[1]) return resolve();
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = match[1];
  }));
}

// সব <img> (যেমন লোগো) ডিকোড হওয়া পর্যন্ত অপেক্ষা
async function waitForImages(page) {
  await page.evaluate(() => Promise.all(
    [...document.images].map((img) => img.decode().catch(() => {}))
  ));
}

(async () => {
  const f400 = b64(path.join(FONT_DIR, 'noto-sans-bengali-bengali-400-normal.woff2'));
  const f700 = b64(path.join(FONT_DIR, 'noto-sans-bengali-bengali-700-normal.woff2'));

  if (!fs.existsSync(LOGO_PATH)) {
    console.warn(`⚠️ লোগো পাওয়া যায়নি: ${LOGO_PATH}`);
  }
  const logoB64 = fs.existsSync(LOGO_PATH) ? b64(LOGO_PATH) : '';

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const file of fs.readdirSync('_posts')) {
    if (!/\.(md|html)$/.test(file)) continue;

    const { data } = matter(fs.readFileSync(path.join('_posts', file), 'utf8'));
    if (!data.title) continue;

    const outFile = path.join(OUT_DIR, file.replace(/\.(md|html)$/, '') + '-v2.jpg');

    // পোস্টের image ফাইল খুঁজুন; না থাকলে ডিফল্ট ছবি, তাও না থাকলে স্বচ্ছ ছবি
    const imgSrc = data.image || DEFAULT_BG;
    const localImg = path.join('.', imgSrc.replace(/^\//, ''));
    let bg;
    if (fs.existsSync(localImg)) {
      bg = `data:${mimeOf(localImg)};base64,${b64(localImg)}`;
    } else {
      console.warn(`⚠️ "${file}": ছবি পাওয়া যায়নি (${localImg}), ডিফল্ট ব্যবহার হচ্ছে`);
      const defPath = path.join('.', DEFAULT_BG.replace(/^\//, ''));
      bg = fs.existsSync(defPath)
        ? `data:${mimeOf(defPath)};base64,${b64(defPath)}`
        : BLANK_IMG;
    }

    const category =
      (Array.isArray(data.category_bn) ? data.category_bn[0] : data.category_bn) ||
      (Array.isArray(data.categories) ? data.categories[0] : data.categories) ||
      'দৈনিক চালচিত্র';

    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT });
    await page.setContent(
      template({
        bg,
        category,
        title: data.title,
        author: data.author,
        f400,
        f700,
        logoB64,
      }),
      { waitUntil: 'load' }
    );
    await waitForBackground(page);
    await waitForImages(page);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: outFile, type: 'jpeg', quality: 60 });
    await page.close();

    console.log('তৈরি:', outFile);
  }

  await browser.close();
})();
