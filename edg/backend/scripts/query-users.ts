import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
    const users = await p.sysUser.findMany({ select: { username: true, role: true, status: true, campusName: true } });
    console.log(JSON.stringify(users, null, 2));
    await p.$disconnect();
})();
