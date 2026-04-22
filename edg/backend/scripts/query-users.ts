/**
 * query-users.ts — 打印全部系统账号（只读）
 * 运行: npx ts-node scripts/query-users.ts
 *
 * 作用：以 JSON 形式输出所有 SysUser 的用户名 / 角色 / 状态 / 校区名，
 *   用于快速排查"能不能登录 / 账号是什么状态"之类的问题。
 * 产出：stdout JSON；不修改任何数据。
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
// 顶层 IIFE：一次性 findMany 后 JSON 输出
(async () => {
    const users = await p.sysUser.findMany({ select: { username: true, role: true, status: true, campusName: true } });
    console.log(JSON.stringify(users, null, 2));
    await p.$disconnect();
})();
