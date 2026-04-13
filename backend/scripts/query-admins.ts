import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
    const users = await p.sysUser.findMany({
        where: { role: 'CAMPUS_ADMIN' },
        select: { username: true, campusName: true, campus_id: true, status: true }
    });
    console.log(JSON.stringify(users, null, 2));
    await p.$disconnect();
})();
