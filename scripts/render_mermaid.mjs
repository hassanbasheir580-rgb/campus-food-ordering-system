import { chromium } from 'playwright';
import { readdir, mkdir, readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

const diagramsDir = resolve('docs/diagrams');
const mermaidScript = resolve('node_modules/mermaid/dist/mermaid.min.js');

await mkdir(diagramsDir, { recursive: true });
const files = (await readdir(diagramsDir)).filter((file) => file.endsWith('.mmd'));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
await page.addScriptTag({ path: mermaidScript });

for (const file of files) {
  const code = await readFile(resolve(diagramsDir, file), 'utf8');
  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 32px;
            background: #ffffff;
            font-family: Arial, sans-serif;
          }
          #diagram {
            display: inline-block;
            min-width: 960px;
            background: #ffffff;
          }
          svg {
            max-width: none !important;
            height: auto !important;
          }
        </style>
      </head>
      <body>
        <div id="diagram"></div>
      </body>
    </html>
  `);
  await page.addScriptTag({ path: mermaidScript });
  await page.evaluate(async ({ code, file }) => {
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'base',
      themeVariables: {
        primaryColor: '#e6f4ef',
        primaryBorderColor: '#0f766e',
        primaryTextColor: '#172026',
        lineColor: '#64706d',
        secondaryColor: '#dbeafe',
        tertiaryColor: '#fff7ed',
        fontFamily: 'Arial'
      }
    });
    const id = `diagram_${file.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const { svg } = await window.mermaid.render(id, code);
    document.getElementById('diagram').innerHTML = svg;
  }, { code, file });
  await page.locator('#diagram').screenshot({ path: resolve(diagramsDir, `${basename(file, '.mmd')}.png`) });
}

await browser.close();
console.log(`Rendered ${files.length} Mermaid diagrams`);
