import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'resources', 'bin');
const outputFile = path.join(outputDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const url =
  process.platform === 'win32'
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

fs.mkdirSync(outputDir, { recursive: true });

if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 1024 * 1024) {
  console.log(`yt-dlp binary already exists: ${outputFile}`);
  process.exit(0);
}

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

console.log(`Downloading yt-dlp from ${url}`);
await download(url, outputFile);

if (process.platform !== 'win32') {
  fs.chmodSync(outputFile, 0o755);
}

console.log(`Saved yt-dlp binary to ${outputFile}`);
