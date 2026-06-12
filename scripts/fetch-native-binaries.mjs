import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'resources', 'bin');
const ytDlpOutputFile = path.join(
  outputDir,
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
);
const ytDlpUrl =
  process.platform === 'win32'
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const denoZipUrl =
  'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip';
const denoOutputFile = path.join(outputDir, 'deno.exe');

fs.mkdirSync(outputDir, { recursive: true });

const download = (sourceUrl, destination, redirectCount = 0) =>
  new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Too many redirects while downloading yt-dlp.'));
      return;
    }

    https
      .get(sourceUrl, (response) => {
        if (
          [301, 302, 303, 307, 308].includes(response.statusCode || 0) &&
          response.headers.location
        ) {
          response.resume();
          download(
            new URL(response.headers.location, sourceUrl).toString(),
            destination,
            redirectCount + 1,
          )
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Download failed with HTTP ${response.statusCode}`));
          return;
        }

        const file = fs.createWriteStream(destination);
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve());
        });
        file.on('error', reject);
      })
      .on('error', reject);
  });

const hasUsableBinary = (filePath, minimumBytes) =>
  fs.existsSync(filePath) && fs.statSync(filePath).size > minimumBytes;

if (hasUsableBinary(ytDlpOutputFile, 1024 * 1024)) {
  console.log(`yt-dlp binary already exists: ${ytDlpOutputFile}`);
} else {
  console.log(`Downloading yt-dlp from ${ytDlpUrl}`);
  await download(ytDlpUrl, ytDlpOutputFile);
  console.log(`Saved yt-dlp binary to ${ytDlpOutputFile}`);
}

if (process.platform !== 'win32') {
  fs.chmodSync(ytDlpOutputFile, 0o755);
}

if (process.platform === 'win32') {
  if (hasUsableBinary(denoOutputFile, 1024 * 1024)) {
    console.log(`Deno runtime already exists: ${denoOutputFile}`);
  } else {
    const denoZipPath = path.join(outputDir, 'deno.zip');
    const denoExtractDir = path.join(outputDir, 'deno-extract');

    fs.rmSync(denoZipPath, { force: true });
    fs.rmSync(denoExtractDir, { recursive: true, force: true });
    fs.mkdirSync(denoExtractDir, { recursive: true });

    console.log(`Downloading Deno runtime from ${denoZipUrl}`);
    await download(denoZipUrl, denoZipPath);

    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        'Expand-Archive',
        '-LiteralPath',
        denoZipPath,
        '-DestinationPath',
        denoExtractDir,
        '-Force',
      ],
      { stdio: 'inherit' },
    );

    fs.copyFileSync(path.join(denoExtractDir, 'deno.exe'), denoOutputFile);
    fs.rmSync(denoZipPath, { force: true });
    fs.rmSync(denoExtractDir, { recursive: true, force: true });
    console.log(`Saved Deno runtime to ${denoOutputFile}`);
  }
}
