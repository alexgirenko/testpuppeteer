const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const tar = require('tar');

const pkgName = '@sparticuz/chromium';
const defaultVersion = '138.0.2';
const outDir = path.resolve(__dirname, '..', 'chromium-bin');

function safeRun(cmd) {
  try {
    return execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error('Command failed:', cmd);
    throw err;
  }
}

async function main() {
  const version = process.env.CHROMIUM_FULL_VERSION || defaultVersion;
  const pkgRef = `${pkgName}@${version}`;

  console.log('download-chromium-bin: fetching', pkgRef);

  // Run npm pack to download the tarball
  safeRun(`npm pack ${pkgRef}`);

  // npm pack outputs a file like 'sparticuz-chromium-<version>.tgz'
  const tgzFiles = fs
    .readdirSync(process.cwd())
    .filter((f) => f.endsWith('.tgz') && f.includes('chromium'))
    .map((f) => ({ name: f, mtime: fs.statSync(path.resolve(process.cwd(), f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (tgzFiles.length === 0) {
    console.error('download-chromium-bin: no .tgz files found after npm pack');
    process.exit(1);
  }

  const tarballName = tgzFiles[0].name;
  const tarballPath = path.resolve(process.cwd(), tarballName);

  // Extract tarball using the Node tar package
  console.log('download-chromium-bin: extracting', tarballPath);
  await tar.x({ file: tarballPath, cwd: process.cwd() });

  const extractedPackagePath = path.resolve(process.cwd(), 'package');
  const srcBin = path.join(extractedPackagePath, 'bin');
  if (!fs.existsSync(srcBin)) {
    console.error('download-chromium-bin: extracted package has no bin folder at', srcBin);
    // Clean up and exit
    try { fs.rmSync(tarballPath); } catch {}
    try { fs.rmSync(extractedPackagePath, { recursive: true, force: true }); } catch {}
    process.exit(0);
  }

  // Copy bin -> chromium-bin
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  function copyRecursive(s, d) {
    for (const entry of fs.readdirSync(s)) {
      const sp = path.join(s, entry);
      const dp = path.join(d, entry);
      const stat = fs.statSync(sp);
      if (stat.isDirectory()) {
        fs.mkdirSync(dp, { recursive: true });
        copyRecursive(sp, dp);
      } else {
        fs.copyFileSync(sp, dp);
      }
    }
  }

  copyRecursive(srcBin, outDir);
  console.log('download-chromium-bin: copied bin to', outDir);

  // Cleanup
  try { fs.rmSync(tarballPath); } catch {}
  try { fs.rmSync(extractedPackagePath, { recursive: true, force: true }); } catch {}
}

main().catch(err => {
  console.error('download-chromium-bin failed:', err);
  process.exit(1);
});
