#!/usr/bin/env node
/**
 * Edg1 DOM Dump（web-e2e-automation skill 在 Edg1 上的适配版）
 *
 * 差异点：
 *   - 鉴权 storage 在 tests/e2e/.auth/<role>.json
 *   - 导航通过点击 Sidebar 中文 label（state-driven），需要 sessionStorage.edg_active_role
 *   - routes.config.mjs 字段：{id, label, group, roles, priority}
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dumpRoot = path.join(root, '.web-e2e/dump');
const authDir = path.join(root, 'tests/e2e/.auth');

const { ROUTES } = await import(path.join(root, '.web-e2e/routes.config.mjs'));

const only = process.argv[2];
const targets = only ? ROUTES.filter(r => r.id === only) : ROUTES;

for (const sub of ['html', 'screenshots', 'elements']) {
  fs.mkdirSync(path.join(dumpRoot, sub), { recursive: true });
}

function pickLocator(e) {
  if (e.testId) return `page.getByTestId('${e.testId}')`;
  const role = /^(button|link|tab|textbox|checkbox|menuitem|heading)$/.test(e.ariaRole) ? e.ariaRole : null;
  if (role && e.text && e.text.length < 30 && e.text.length > 0) {
    return `page.getByRole('${role}', { name: '${esc(e.text)}' })`;
  }
  if (e.associatedLabel) return `page.getByLabel('${esc(e.associatedLabel)}')`;
  if (e.placeholder) return `page.getByPlaceholder('${esc(e.placeholder)}')`;
  if (e.ariaLabel) return `page.getByLabel('${esc(e.ariaLabel)}')`;
  if (e.text && e.text.length < 30 && e.text.length > 0) return `page.getByText('${esc(e.text)}', { exact: true })`;
  if (e.name) return `page.locator('[name="${e.name}"]')`;
  return '/* no stable locator */';
}
const esc = s => String(s).replace(/'/g, "\\'");

async function dumpOne(browser, route, role) {
  const storage = path.join(authDir, `${role}.json`);
  if (!fs.existsSync(storage)) return { id: route.id, role, status: 'skip', reason: `missing ${storage}` };

  const ctx = await browser.newContext({ storageState: storage });
  await ctx.addInitScript(r => { try { sessionStorage.setItem('edg_active_role', r); } catch {} }, role);
  const page = await ctx.newPage();

  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    // 等待进入已登录状态
    await page.waitForSelector('aside', { timeout: 10_000 });

    // 展开分组
    if (route.group) {
      await page.getByRole('button', { name: route.group }).first().click().catch(() => {});
      await page.waitForTimeout(150);
    }
    // 点击视图 label
    await page.getByRole('button', { name: route.label }).first().click({ timeout: 5000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(300);

    const base = `${role}-${route.id}`;
    fs.writeFileSync(path.join(dumpRoot, 'html', `${base}.html`), await page.content());
    await page.screenshot({ path: path.join(dumpRoot, 'screenshots', `${base}.png`), fullPage: true });

    const elements = await page.evaluate(() => {
      const out = [];
      const sel = 'button, a, input, textarea, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [data-testid]';
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden') continue;
        let assoc = null;
        if (el.id) { const lb = document.querySelector(`label[for="${el.id}"]`); if (lb) assoc = lb.textContent?.trim(); }
        out.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 80),
          testId: el.getAttribute('data-testid'),
          id: el.id || null,
          name: el.getAttribute('name'),
          type: el.getAttribute('type'),
          placeholder: el.getAttribute('placeholder'),
          ariaRole: el.getAttribute('role') || el.tagName.toLowerCase(),
          ariaLabel: el.getAttribute('aria-label'),
          associatedLabel: assoc,
          href: el.getAttribute('href'),
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        });
      }
      return out;
    });
    const withLoc = elements.map(e => ({ ...e, recommendedLocator: pickLocator(e) }));
    fs.writeFileSync(path.join(dumpRoot, 'elements', `${base}.json`), JSON.stringify(withLoc, null, 2));

    return { id: route.id, role, status: 'ok', elements: withLoc.length, testIds: withLoc.filter(e => e.testId).length };
  } catch (err) {
    return { id: route.id, role, status: 'fail', error: String(err.message || err).slice(0, 200) };
  } finally {
    await ctx.close();
  }
}

console.log(`📦 Edg1 DOM Dump - ${targets.length} 个视图`);
const browser = await chromium.launch();
const results = [];
for (const route of targets) {
  for (const role of route.roles) {
    process.stdout.write(`  ${role}/${route.id} ... `);
    const r = await dumpOne(browser, route, role);
    results.push(r);
    console.log(r.status === 'ok' ? `✅ ${r.elements} 元素 (${r.testIds} testid)` :
                r.status === 'skip' ? `⚠️ ${r.reason}` : `❌ ${r.error}`);
  }
}
await browser.close();

const ok = results.filter(r => r.status === 'ok');
const withTid = ok.filter(r => r.testIds > 0).length;
const lines = [
  '# Edg1 DOM Dump Report',
  `生成时间: ${new Date().toISOString()}`,
  `总计: ${results.length} 视图 | 成功 ${ok.length} | 失败 ${results.filter(r => r.status === 'fail').length} | 跳过 ${results.filter(r => r.status === 'skip').length}`,
  `testid 覆盖: ${withTid}/${ok.length} 视图有至少一个 testid`,
  '',
  '| role | id | status | elements | testIds | error |',
  '| --- | --- | --- | --- | --- | --- |',
  ...results.map(r => `| ${r.role} | ${r.id} | ${r.status} | ${r.elements ?? '-'} | ${r.testIds ?? '-'} | ${r.error || r.reason || ''} |`),
];
fs.writeFileSync(path.join(dumpRoot, 'report.md'), lines.join('\n'));
console.log(`\n📄 报告: .web-e2e/dump/report.md`);
