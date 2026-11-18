import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

const baseUrl = process.env.VIEWPORT_BASE_URL ?? 'http://127.0.0.1:5181';
const outputDir = process.env.VIEWPORT_OUTPUT_DIR ?? 'artifacts/p2-b3-fix3/viewports';
const chromeJsonUrl = 'http://127.0.0.1:9222/json/list';
const viewports = [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1440, 900],
];

await fs.mkdir(outputDir, { recursive: true });

async function waitForTarget() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const targets = await (await fetch(chromeJsonUrl)).json();
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Chrome DevTools target was not available on port 9222');
}

const socket = new WebSocket(await waitForTarget());
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await command('Page.enable');
await command('Runtime.enable');

async function navigate(url) {
  await command('Page.navigate', { url });
  await new Promise((resolve) => setTimeout(resolve, 2500));
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.result?.value;
}

for (const [width, height] of viewports) {
  await command('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (const [kind, path] of [['admin', '/admin'], ['public', '/e/e2e-event']]) {
    await navigate(`${baseUrl}${path}`);
    const metrics = await evaluate(`(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight },
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      elements: {
        heading: Boolean(document.querySelector('h1, h2')),
        gallery: Boolean(document.querySelector('[data-testid="gallery"], h2')),
        buttons: document.querySelectorAll('button').length,
        images: document.querySelectorAll('img').length,
        iframe: document.querySelectorAll('iframe').length,
        mapLinks: [...document.querySelectorAll('a')].filter((a) => /naver|kakao|네이버|카카오|지도|길찾기/i.test(a.textContent || a.href)).length
      }
    }))()`);
    const screenshot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const name = `${kind}-${width}x${height}`;
    await fs.writeFile(`${outputDir}/${name}.png`, Buffer.from(screenshot.data, 'base64'));
    await fs.writeFile(`${outputDir}/${name}.json`, JSON.stringify({ kind, requestedViewport: { width, height }, ...metrics }, null, 2));
  }
}

await command('Emulation.clearDeviceMetricsOverride');
socket.close();
console.log(`Captured ${viewports.length * 2} screenshots in ${outputDir}`);
