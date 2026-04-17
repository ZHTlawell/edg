import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

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

    async resetPassword(username: string, newPasswordHash: string) {
        const user = await this.prisma.sysUser.findUnique({ where: { username } });
        if (!user) return null;
        return this.prisma.sysUser.update({
            where: { id: user.id },
            data: { password_hash: newPasswordHash }
        });
    }

    // C 端学员自主注册 — 需校区管理员审核后激活
    async createStudentUser(data: {
        username: string;
        password_hash: string;
        name: string;
        phone?: string;
        gender?: string;
        campusName?: string;
        campus_id?: string;
    }) {
        const existingUser = await this.findOneByUsername(data.username);
        if (existingUser) {
            throw new ConflictException('用户名已存在');
        }

        if (data.phone) {
            const existingStudent = await this.prisma.eduStudent.findUnique({
                where: { phone: data.phone }
            });
            if (existingStudent) {
                throw new ConflictException('手机号已被注册');
            }
        }

        return this.prisma.$transaction(async (prisma) => {
            const user = await prisma.sysUser.create({
                data: {
                    username: data.username,
                    password_hash: data.password_hash,
                    role: 'STUDENT',
                    status: 'PENDING_APPROVAL',   // 自注册需审核
                    campusName: data.campusName,
                    campus_id: data.campus_id
                },
            });

            const student = await prisma.eduStudent.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    gender: data.gender,
                    user_id: user.id,
                },
            });

            return { user, student };
        });
    }

    // 管理员代建学员账号（直接激活，不走审核）
    async createStudentByAdmin(data: {
        name: string;
        phone: string;
        gender?: string;
        campusName?: string;
        campus_id?: string;
    }) {
        const username = data.phone;
        const defaultPassword = data.phone.slice(-6);

        const existing = await this.findOneByUsername(username);
        if (existing) throw new ConflictException('该手机号已注册');
        if (data.phone) {
            const existingStudent = await this.prisma.eduStudent.findUnique({
                where: { phone: data.phone }
            });
            if (existingStudent) throw new ConflictException('手机号已被注册');
        }

        const hash = await bcrypt.hash(defaultPassword, 10);
        const result = await this.prisma.$transaction(async (prisma) => {
            const user = await prisma.sysUser.create({
                data: {
                    username,
                    password_hash: hash,
                    role: 'STUDENT',
                    status: 'ACTIVE',   // 管理员代建直接激活
                    campusName: data.campusName,
                    campus_id: data.campus_id,
                },
            });
            const student = await prisma.eduStudent.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    gender: data.gender,
                    user_id: user.id,
                },
            });
            return { user, student };
        });

        return {
            studentId: result.student.id,
            userId: result.user.id,
            name: result.student.name,
            phone: result.student.phone,
            username,
            defaultPassword,
        };
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

    // 查询待审核的学员（校区管理员审本校区）
    async findPendingStudents(campusId?: string) {
        return this.prisma.sysUser.findMany({
            where: {
                role: 'STUDENT',
                status: 'PENDING_APPROVAL',
                ...(campusId ? { campus_id: campusId } : {}),
            },
            include: {
                studentProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // 学员状态流转（TRIAL/ACTIVE/SUSPENDED/GRADUATED/CHURNED）
    async updateStudentStatus(data: { studentId: string; toStatus: string; reason?: string; operatorId: string }) {
        const student = await this.prisma.eduStudent.findUnique({ where: { id: data.studentId } });
        if (!student) throw new NotFoundException('学员不存在');

        const validTransitions: Record<string, string[]> = {
            'TRIAL': ['ACTIVE', 'CHURNED'],
            'ACTIVE': ['SUSPENDED', 'GRADUATED', 'CHURNED'],
            'SUSPENDED': ['ACTIVE', 'GRADUATED', 'CHURNED'],
            'GRADUATED': [],
            'CHURNED': ['ACTIVE'],
        };
        const allowed = validTransitions[student.status] || [];
        if (!allowed.includes(data.toStatus)) {
            throw new ConflictException(`不允许从 ${student.status} 转换到 ${data.toStatus}`);
        }

        return this.prisma.$transaction(async (prisma) => {
            const updated = await prisma.eduStudent.update({
                where: { id: data.studentId },
                data: { status: data.toStatus },
            });
            await prisma.studentStatusLog.create({
                data: {
                    student_id: data.studentId,
                    from_status: student.status,
                    to_status: data.toStatus,
                    reason: data.reason,
                    operator_id: data.operatorId,
                }
            });
            return updated;
        });
    }

    async getStudentStatusLogs(studentId: string) {
        return this.prisma.studentStatusLog.findMany({
            where: { student_id: studentId },
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

        return this.prisma.$transaction(async (tx: any) => {
            // 如果是校区管理员，且没有绑定 campus_id，则为其生成一个全新的独立校区ID
            // 防止多个新注册的校区管理员共享同一个 campus 上下文，导致看到彼此数据
            let updateData: any = { status: 'ACTIVE' };
            if (user.role === 'CAMPUS_ADMIN' && !user.campus_id) {
                const { randomUUID } = await import('crypto');
                updateData.campus_id = randomUUID();
            }

            const updatedUser = await tx.sysUser.update({
                where: { id },
                data: updateData,
            });

            // 如果是校区管理员被核准，自动初始化20个教室
            if (updatedUser.role === 'CAMPUS_ADMIN' && updatedUser.campus_id) {
                const roomCount = await tx.eduClassroom.count({
                    where: { campus_id: updatedUser.campus_id }
                });

                if (roomCount === 0) {
                    const rooms = [];
                    for (let i = 1; i <= 20; i++) {
                        rooms.push({
                            name: `研讨室 ${100 + i}`,
                            campus_id: updatedUser.campus_id,
                            status: 'AVAILABLE'
                        });
                    }
                    await tx.eduClassroom.createMany({
                        data: rooms
                    });
                }
            }

            return updatedUser;
        });
    }

    // 为已存在的用户补充 campus_id（用于修复存量数据）
    async updateCampusId(userId: string, campusId: string) {
        return this.prisma.sysUser.update({
            where: { id: userId },
            data: { campus_id: campusId },
        });
    }

    // 为指定校区初始化20个教室（如果尚未初始化）
    async initClassroomsForCampus(campusId: string) {
        const roomCount = await (this.prisma as any).eduClassroom.count({
            where: { campus_id: campusId }
        });
        if (roomCount === 0) {
            const rooms: any[] = [];
            for (let i = 1; i <= 20; i++) {
                rooms.push({
                    name: `研讨室 ${100 + i}`,
                    campus_id: campusId,
                    status: 'AVAILABLE'
                });
            }
            await (this.prisma as any).eduClassroom.createMany({ data: rooms });
        }
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

    async findAllStudents(page?: number, pageSize?: number, campusId?: string) {
        const take = pageSize || 50;
        const skip = page && page > 1 ? (page - 1) * take : 0;

        const where: any = {};
        if (campusId) {
            where.classes = { some: { class: { campus_id: campusId } } };
        }

        const [data, total] = await Promise.all([
            this.prisma.eduStudent.findMany({
                where,
                skip,
                take,
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
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.eduStudent.count({ where })
        ]);

        return { data, total, page: page || 1, pageSize: take };
    }

    async getAllCampuses() {
        // Find all unique campus names from active CAMPUS_ADMIN users
        const admins = await this.prisma.sysUser.findMany({
            where: {
                role: 'CAMPUS_ADMIN',
                status: 'ACTIVE'
            },
            select: {
                campusName: true,
                campus_id: true
            }
        });

        // Filter and unique by name/id
        const uniqueCampuses = Array.from(new Set(admins.map(a => a.campusName))).filter(Boolean).map(name => {
            const admin = admins.find(a => a.campusName === name);
            return {
                id: admin?.campus_id || name,
                name: name
            };
        });

        // Add a default HQ if not present or just return the list
        if (!uniqueCampuses.some(c => c.name === '总校区')) {
            uniqueCampuses.unshift({ id: 'HQ', name: '总校区' });
        }

        return uniqueCampuses;
    }
}
