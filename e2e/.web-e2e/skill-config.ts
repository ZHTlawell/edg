/**
 * Edg1 E2E 技能配置 (由 web-e2e-automation skill 生成，可手动调整)
 */
export const SKILL_CONFIG = {
  projectName: 'Edg1',
  roles: ['admin', 'campus_admin', 'teacher', 'student'] as const,
  defaultRole: 'admin',

  // 登录 API
  loginEndpoint: 'POST /auth/login',
  loginRequestShape: { username: 'string', password: 'string' },
  loginResponseShape: { token: 'string', user: { role: 'string' } },
  tokenStorageKey: 'edg_token', // TODO: 根据 store.ts 实际 key 调整

  // 导航策略：Edg1 使用 App.tsx 内 useState(activeView) 驱动视图
  // 推荐方式：点击 Sidebar 中的中文 label（稳定且无侵入）
  // 备选：在 App.tsx 测试模式下挂 window.__setActiveView = setActiveView
  navigationStrategy: 'sidebar-click-by-label',

  // 演示数据隔离
  tenantHeader: 'x-campus-id',

  // 测试数据策略
  testDataStrategy: 'seed + per-test isolation via campus/tenant',
} as const;
