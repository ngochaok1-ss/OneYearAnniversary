import { cp, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(`${root}dist`, { recursive: true });
for (const entry of ['index.html', 'src', 'public']) {
  await cp(`${root}${entry}`, `${root}dist/${entry}`, { recursive: true });
}
const html = await readFile(`${root}dist/index.html`, 'utf8');
if (!html.includes('lang="vi"') || !html.includes('src/main.js')) throw new Error('Incomplete entry point');
console.log('Built static opening scene → dist/');
