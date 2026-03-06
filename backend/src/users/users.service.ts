import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOneByUsername(username: string) {
        return this.prisma.sysUser.findUnique({
            where: { username },
            include: {
                studentProfile: true,
                teacherProfile: true
            }
        });
    }

    async findOneById(id: string) {
        return this.prisma.sysUser.findUnique({ where: { id } });
    }

    // C 端学员注册专用接口 — 直接激活
    async createStudentUser(data: { username: string; password_hash: string; name: string; phone?: string }) {
        const existing = await this.findOneByUsername(data.username);
        if (existing) {
            throw new ConflictException('用户名已存在');
        }

        return this.prisma.$transaction(async (prisma) => {
            const user = await prisma.sysUser.create({
                data: {
                    username: data.username,
                    password_hash: data.password_hash,
                    role: 'STUDENT',
                    status: 'ACTIVE',
                },
            });

            const student = await prisma.eduStudent.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    user_id: user.id,
                },
            });

            return { user, student };
        });
    }

    // 自主注册（校区端 / 教师端）— 创建 PENDING_APPROVAL 账号
    async createPendingUser(data: {
        username: string;
        password_hash: string;
        role: string;
        name: string;
        phone?: string;
        campusName?: string;
        address?: string;
        campus_id?: string;
    }) {
        const existing = await this.findOneByUsername(data.username);
        if (existing) {
            throw new ConflictException('用户名已存在');
        }

        return this.prisma.$transaction(async (prisma) => {
            const user = await prisma.sysUser.create({
                data: {
                    username: data.username,
                    password_hash: data.password_hash,
                    role: data.role,
                    status: 'PENDING_APPROVAL',
                    campus_id: data.campus_id,
                    campusName: data.campusName ?? null,
                    address: data.address ?? null,
                },
            });

            // 教师注册时预建教师档案
            if (data.role === 'TEACHER') {
                await prisma.eduTeacher.create({
                    data: {
                        name: data.name,
                        user_id: user.id,
                    },
                });
            }

            return { id: user.id, username: user.username, role: user.role, status: user.status };
        });
    }

    // B 端管理员直接创建内部账号 — 直接激活
    async createInternalUser(data: { username: string; password_hash: string; role: string; name: string; campus_id?: string }) {
        const existing = await this.findOneByUsername(data.username);
        if (existing) {
            throw new ConflictException('用户名已存在');
        }

        return this.prisma.$transaction(async (prisma) => {
            const user = await prisma.sysUser.create({
                data: {
                    username: data.username,
                    password_hash: data.password_hash,
                    role: data.role,
                    campus_id: data.campus_id,
                    status: 'ACTIVE',
                },
            });

            if (data.role === 'TEACHER') {
                await prisma.eduTeacher.create({
                    data: {
                        name: data.name,
                        user_id: user.id,
                    },
                });
            }

            return user;
        });
    }

    // 查询待审核的校区管理员（总管理员审核）
    async findPendingCampusAdmins() {
        return this.prisma.sysUser.findMany({
            where: { role: 'CAMPUS_ADMIN', status: 'PENDING_APPROVAL' },
            orderBy: { createdAt: 'desc' },
        });
    }

    // 查询待审核的教师（可按 campus_id 过滤）
    async findPendingTeachers(campusId?: string) {
        return this.prisma.sysUser.findMany({
            where: {
                role: 'TEACHER',
                status: 'PENDING_APPROVAL',
                ...(campusId ? { campus_id: campusId } : {}),
            },
            include: {
                teacherProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // 查询所有已激活的教师
    async findAllTeachers(campusId?: string) {
        return this.prisma.eduTeacher.findMany({
            where: {
                user: {
                    status: 'ACTIVE',
                    ...(campusId ? { campus_id: campusId } : {}),
                }
            },
            include: {
                user: true
            }
        });
    }

    // 审核通过
    async approveUser(id: string) {
        const user = await this.findOneById(id);
        if (!user) throw new NotFoundException('用户不存在');
        return this.prisma.sysUser.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
    }

    // 审核拒绝
    async rejectUser(id: string) {
        const user = await this.findOneById(id);
        if (!user) throw new NotFoundException('用户不存在');
        return this.prisma.sysUser.update({
            where: { id },
            data: { status: 'DISABLED' },
        });
    }

    async findAllStudents() {
        return this.prisma.eduStudent.findMany({
            include: {
                classes: {
                    include: {
                        class: true
                    }
                },
                accounts: true,
                user: {
                    select: {
                        username: true,
                        role: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });
    }
}
