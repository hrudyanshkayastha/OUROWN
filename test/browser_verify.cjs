const playwright = require('C:/Users/ADMIN/.gemini/antigravity/scratch/OpenDots/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const outDir = 'C:/Users/ADMIN/.gemini/antigravity/scratch/ethiack/test/screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('Launching Chrome with playwright-core...');
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

  console.log('\n--- 1. Testing Homepage at all Viewports ---');
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleLogs = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(msg.text());
    });
    page.on('requestfailed', req => {
      // Ignore third-party beacons if blocked or external trackers
      const url = req.url();
      if (!url.includes('google') && !url.includes('plausible') && !url.includes('hsforms')) {
        failedRequests.push(`${req.failure()?.errorText || 'failed'}: ${url}`);
      }
    });

    console.log(`Testing viewport ${vp.name} (${vp.width}x${vp.height})...`);
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Allow hydration & animations to settle

    const shotPath = path.join(outDir, `home_${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Captured screenshot: ${shotPath}`);

    if (consoleLogs.length > 0) {
      console.warn(`  Console errors on ${vp.name}:`, consoleLogs);
    } else {
      console.log(`  No console errors on ${vp.name}`);
    }

    if (failedRequests.length > 0) {
      console.warn(`  First-party failed requests on ${vp.name}:`, failedRequests);
    } else {
      console.log(`  No failed first-party requests on ${vp.name}`);
    }

    await page.close();
  }

  console.log('\n--- 2. Testing Key Routes ---');
  const routes = ['hackian', 'platform', 'use-cases', 'info-hub', 'sitemap'];
  for (const r of routes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(msg.text());
    });

    console.log(`Testing route /${r}...`);
    const resp = await page.goto(`http://127.0.0.1:4173/${r}`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  Status: ${resp.status()}`);
    await page.waitForTimeout(1500);

    const shotPath = path.join(outDir, `route_${r}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`  Captured screenshot: ${shotPath}`);

    if (consoleLogs.length > 0) {
      console.warn(`  Console errors on /${r}:`, consoleLogs);
    } else {
      console.log(`  No console errors on /${r}`);
    }
    await page.close();
  }

  console.log('\n--- 3. Testing Interactions & Navigation ---');
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check header elements
  const headerExists = await page.locator('header, nav, [data-component*="header"], [data-component*="nav"]').first().isVisible();
  console.log(`Header visible: ${headerExists}`);

  // Check CTA button
  const buttons = await page.locator('button, a.btn, [data-component*="button"]').all();
  console.log(`Interactive buttons/links detected: ${buttons.length}`);

  // Hover over first button/link
  if (buttons.length > 0) {
    try {
      await buttons[0].hover();
      console.log('Hover state tested successfully.');
    } catch (e) {
      console.log('Hover check note:', e.message);
    }
  }

  await page.close();
  await browser.close();
  console.log('\nBrowser verification complete!');
}

run().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
