/**
 * Edg1 E2E 测试账号（来自 edg/backend seed）
 * 后端实际运行于 edg/backend/，数据库 edg/backend/prisma/dev.db
 */
export const TEST_ACCOUNTS = {
  admin:        { username: 'admin',          password: '123456' },
  campus_admin: { username: 'admin_pd',       password: '123456' },
  teacher:      { username: 'teacher_zhang',  password: '123456' },
  student:      { username: 'stu_wuxiao',     password: '123456' },
} as const;

export type RoleKey = keyof typeof TEST_ACCOUNTS;
