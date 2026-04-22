/**
 * 登录一次、保存 storageState，后续测试复用
 */
import { test as setup, request as pwRequest, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TEST_ACCOUNTS, type RoleKey } from './fixtures/test-accounts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '.auth');
const API = process.env.API_BASE || 'http://localhost:3001/api';

async function loginAndSave(role: RoleKey) {
  const { username, password } = TEST_ACCOUNTS[role];
  const api = await pwRequest.newContext();
  const res = await api.post(`${API}/auth/login`, { data: { username, password } });
  expect(res.ok(), `login failed for ${role}: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  const token = body.access_token || body.token;
  const user = body.user;
  expect(token, `no token for ${role}`).toBeTruthy();

  // 构造 zustand persist 预置状态（store.ts 的 key 为 'eduadmin-storage-v2'）
  const currentUser = user && {
    id: user.sub,
    username: user.username,
    name: user.name,
    role: String(user.role).toLowerCase(),
    campus: user.campusName || '总校区',
    campus_id: user.campusId,
    teacherId: user.teacherId,
    studentId: user.studentId,
    bindStudentId: user.role === 'STUDENT' ? user.studentId : undefined,
  };
  const zustandPersist = JSON.stringify({ state: { currentUser }, version: 0 });

  const storageFile = path.join(AUTH_DIR, `${role}.json`);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(storageFile, JSON.stringify({
    cookies: [],
    origins: [{
      origin: process.env.BASE_URL || 'http://localhost:3000',
      localStorage: [
        { name: `edg_token_${role}`, value: token },
        { name: `edg_store_${role}`, value: zustandPersist },
      ],
    }],
  }, null, 2));
  await api.dispose();
}

for (const role of Object.keys(TEST_ACCOUNTS) as RoleKey[]) {
  setup(`authenticate as ${role}`, async () => {
    await loginAndSave(role);
  });
}
