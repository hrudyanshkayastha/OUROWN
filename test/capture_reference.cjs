const playwright = require('C:/Users/ADMIN/.gemini/antigravity/scratch/OpenDots/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const outDir = 'C:/Users/ADMIN/.gemini/antigravity/scratch/ethiack/test/screenshots';

async function captureReference() {
  console.log('Capturing reference screenshots from https://ethiack.com ...');
  const browser = await playwright.chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    try {
      console.log(`Capturing reference ${vp.name} (${vp.width}x${vp.height})...`);
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto('https://ethiack.com/', { waitUntil: 'networkidle', timeout: 35000 });
      await page.waitForTimeout(2000);
      const shotPath = path.join(outDir, `ref_home_${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`Saved reference screenshot: ${shotPath}`);
      await page.close();
    } catch(e) {
      console.warn(`Failed reference capture for ${vp.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('Reference capture complete!');
}

captureReference().catch(console.error);
