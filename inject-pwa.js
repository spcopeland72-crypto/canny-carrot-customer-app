const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

// 1. Inject PWA meta tags into Expo's generated index.html
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Find the <head> tag and inject PWA meta tags right after it
  const pwaMetaTags = `
  <meta name="theme-color" content="#FF6B35" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Canny Carrot" />
  <meta name="mobile-web-app-capable" content="yes" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
  <link rel="apple-touch-icon" href="/icon-192.svg" />`;
  
  html = html.replace('<head>', `<head>${pwaMetaTags}`);
  
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Injected PWA meta tags into index.html');
} else {
  console.warn('⚠️  index.html not found in dist/');
}

// 2. Copy manifest.json and icons
const filesToCopy = ['manifest.json', 'icon-192.svg', 'icon-512.svg'];

filesToCopy.forEach(file => {
  const src = path.join(publicDir, file);
  const dst = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`✅ Copied ${file}`);
  } else {
    console.warn(`⚠️  ${file} not found in public/`);
  }
});

console.log('✅ PWA injection complete');

