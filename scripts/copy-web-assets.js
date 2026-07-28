const fs = require('fs');
const path = require('path');

const webDir = path.resolve(__dirname, '..', 'web');
const distDir = path.resolve(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

const pwaHead = `
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Scrutin">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/assets/icon-192x192.png">
`;

const swScript = `
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' }).catch(function(){});
  });
}
</script>
`;

function copyPwaFiles() {
  for (const file of ['manifest.json', 'service-worker.js']) {
    const src = path.join(webDir, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file} -> dist/`);
    }
  }
  const assetsSrc = path.join(webDir, 'assets');
  const assetsDest = path.join(distDir, 'assets');
  if (fs.existsSync(assetsSrc)) {
    if (!fs.existsSync(assetsDest)) fs.mkdirSync(assetsDest, { recursive: true });
    for (const f of fs.readdirSync(assetsSrc)) {
      fs.copyFileSync(path.join(assetsSrc, f), path.join(assetsDest, f));
      console.log(`Copied assets/${f} -> dist/assets/`);
    }
  }
}

function injectIntoIndex() {
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('dist/index.html not found, skipping injection');
    return;
  }
  let html = fs.readFileSync(indexHtmlPath, 'utf-8');

  html = html.replace('</head>', `${pwaHead}</head>`);

  html = html.replace('</body>', `${swScript}</body>`);

  fs.writeFileSync(indexHtmlPath, html, 'utf-8');
  console.log('Injected PWA tags into dist/index.html');
}

copyPwaFiles();
injectIntoIndex();
console.log('Web build complete');
