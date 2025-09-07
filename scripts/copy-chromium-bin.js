const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'node_modules', '@sparticuz', 'chromium', 'bin');
const dest = path.resolve(__dirname, '..', 'chromium-bin');

console.log('copy-chromium-bin: src=', src);

if (!fs.existsSync(src)) {
  console.log('copy-chromium-bin: source not found, skipping copy.');
  process.exit(0);
}

function copyRecursive(s, d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  for (const entry of fs.readdirSync(s)) {
    const sp = path.join(s, entry);
    const dp = path.join(d, entry);
    const stat = fs.statSync(sp);
    if (stat.isDirectory()) {
      copyRecursive(sp, dp);
    } else if (stat.isFile()) {
      fs.copyFileSync(sp, dp);
    }
  }
}

try {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyRecursive(src, dest);
  console.log('copy-chromium-bin: copied to', dest);
} catch (err) {
  console.error('copy-chromium-bin: failed', err);
  process.exit(1);
}
