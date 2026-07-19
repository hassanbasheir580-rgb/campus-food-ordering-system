import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = 'http://localhost:5173';
const outDir = resolve('docs/screenshots');

const accounts = {
  student: ['student@campus.test', 'Student123!'],
  vendor: ['vendor@campus.test', 'Vendor123!'],
  admin: ['admin@campus.test', 'Admin123!'],
  staff: ['staff@campus.test', 'Staff123!']
};

const login = async (page, role) => {
  const [email, password] = accounts[role];
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /Enter Dashboard/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
};

const screenshot = async (page, name) => {
  await page.mouse.move(12, 12);
  await page.addStyleTag({ content: '[data-sonner-toaster]{display:none!important}' }).catch(() => {});
  await page.screenshot({ path: resolve(outDir, name), fullPage: true });
};

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });

await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
await screenshot(page, '01-login-register.png');

await login(page, 'student');
await page.getByRole('heading', { name: /Browse campus menus/i }).waitFor({ timeout: 15000 });
await screenshot(page, '02-student-menu.png');
await page.getByRole('button', { name: /^Add$/ }).first().click();
await page.getByRole('link', { name: 'Cart', exact: true }).click();
await page.waitForLoadState('networkidle');
await page.getByRole('heading', { name: /Checkout and schedule/i }).waitFor({ timeout: 15000 });
await screenshot(page, '03-cart-checkout.png');
await page.getByRole('link', { name: /Track/i }).click();
await page.waitForLoadState('networkidle');
await page.getByRole('heading', { name: /Track queue status/i }).waitFor({ timeout: 15000 });
await page.locator('.order-list button:has-text("Ready")').first().click().catch(() => {});
await screenshot(page, '04-order-tracking.png');

await page.evaluate(() => localStorage.clear());
await login(page, 'vendor');
await page.getByRole('heading', { name: /Orders, inventory, and sales/i }).waitFor({ timeout: 15000 });
await screenshot(page, '05-vendor-dashboard.png');
await page.locator('.queue-card').first().scrollIntoViewIfNeeded().catch(() => {});
await screenshot(page, '06-vendor-queue.png');

await page.evaluate(() => localStorage.clear());
await login(page, 'admin');
await page.getByRole('heading', { name: /Campus dining control center/i }).waitFor({ timeout: 15000 });
await screenshot(page, '07-admin-dashboard.png');

await page.evaluate(() => localStorage.clear());
await login(page, 'staff');
await page.getByRole('heading', { name: /Call and confirm pickups/i }).waitFor({ timeout: 15000 });
await screenshot(page, '08-staff-queue-panel.png');

await browser.close();
console.log(`Screenshots saved to ${outDir}`);
