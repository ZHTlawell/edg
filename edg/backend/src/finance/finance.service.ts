/**
 * 财务服务
 * 职责：订单创建、支付、退款、资产账户、余额预警、自动排课与入班
 * 所属模块：财务管理
 * 被 FinanceController 依赖注入；金额与课时数由后端权威计算
 */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 标准课时槽池（weekday: 0=周日…6=周六）
 * 按"分散优先"原则排序：先平铺到不同天，再增加时段
 */
const WEEKLY_SLOTS = [
    { weekday: 1, timeOfDay: '10:00' }, // 周一上午
    { weekday: 3, timeOfDay: '10:00' }, // 周三上午
    { weekday: 5, timeOfDay: '10:00' }, // 周五上午
    { weekday: 2, timeOfDay: '14:00' }, // 周二下午
    { weekday: 4, timeOfDay: '14:00' }, // 周四下午
    { weekday: 6, timeOfDay: '10:00' }, // 周六上午
    { weekday: 0, timeOfDay: '14:00' }, // 周日下午
    { weekday: 1, timeOfDay: '19:00' }, // 周一晚上
    { weekday: 3, timeOfDay: '19:00' }, // 周三晚上
    { weekday: 2, timeOfDay: '10:00' }, // 周二上午
    { weekday: 4, timeOfDay: '10:00' }, // 周四上午
    { weekday: 5, timeOfDay: '14:00' }, // 周五下午
    { weekday: 6, timeOfDay: '14:00' }, // 周六下午
    { weekday: 0, timeOfDay: '10:00' }, // 周日上午
    { weekday: 2, timeOfDay: '19:00' }, // 周二晚上
    { weekday: 4, timeOfDay: '19:00' }, // 周四晚上
];

/**
 * 构建某周次、时间的排课日期序列（每周一次）
 */
function buildWeeklySchedule(opts: {
    weekday: number;   // 0=周日 … 6=周六
    timeOfDay: string; // "HH:mm"
    startFrom: Date;   // 不早于此日期的第一次课
    count: number;
    durationMinutes: number;
}): { start: Date; end: Date }[] {
    const { weekday, timeOfDay, startFrom, count, durationMinutes } = opts;
    const [hh, mm] = timeOfDay.split(':').map(Number);
    const results: { start: Date; end: Date }[] = [];
    const cursor = new Date(startFrom);
    cursor.setHours(0, 0, 0, 0);
    while (results.length < count) {
        if (cursor.getDay() === weekday) {
            const start = new Date(cursor);
            start.setHours(hh, mm, 0, 0);
            if (start >= startFrom) {
                results.push({ start, end: new Date(start.getTime() + durationMinutes * 60_000) });
            }
        }
        cursor.setDate(cursor.getDate() + 1);
        if (cursor.getTime() - startFrom.getTime() > 2 * 365 * 24 * 3600_000) break;
    }
    return results;
}

/**
 * 财务业务服务
 * 覆盖报名 → 支付 → 资产 → 退款 → 余额预警完整闭环
 */
@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    // ==========================================
    // 报名下单流程 (Enrollment & Payment)
    // ==========================================

    /**
     * 创建报名订单
     * 金额 = 课程单价 × 课时数（由服务端权威计算）
     * @param data.studentId 学员 ID
     * @param data.courseId 课程 ID
     * @param data.orderSource 订单来源（student/admin）
     * @param data.operatorId 管理员代操作时的操作人 ID
     */
    async createOrder(data: { studentId: string; courseId: string; orderSource: string; operatorId?: string }) {
        const course = await this.prisma.edCourse.findUnique({ where: { id: data.courseId } });
        if (!course) throw new NotFoundException('找不到该课程');
        if (course.status !== 'ENABLED') throw new BadRequestException('课程已下架，无法下单');

        // 防重复下单：PENDING_PAYMENT 或 PAID 的订单存在时拒绝
        const existingOrder = await this.prisma.finOrder.findFirst({
            where: {
                student_id: data.studentId,
                course_id: data.courseId,
                status: { in: ['PENDING_PAYMENT', 'PAID'] },
            },
        });
        if (existingOrder) {
            throw new BadRequestException('该课程已有有效订单，无需重复下单');
        }

        // 防重复购买：活跃资产账户仍有课时
        const activeAccount = await this.prisma.finAssetAccount.findFirst({
            where: {
                student_id: data.studentId,
                course_id: data.courseId,
                status: 'ACTIVE',
                remaining_qty: { gt: 0 }
            }
        });
        if (activeAccount) {
            throw new BadRequestException('该学员已购买此课程且仍有剩余课时，如需续费请走续费入口');
        }

        const order = await this.prisma.finOrder.create({
            data: {
                student_id: data.studentId,
                course_id: data.courseId,
                amount: course.price,             // 后端权威
                total_qty: course.total_lessons,  // 后端权威
                order_source: data.orderSource,
                operator_id: data.operatorId,
                status: 'PENDING_PAYMENT',
            },
        });
        return order;
    }

    /**
     * 续费下单：累加到原资产账户（不新建账户），支付完成后由 processPayment 累加
     */
    /**
     * 创建续费订单
     * 用于已购课程的二次报名（续课包）
     */
    async createRenewalOrder(data: { studentId: string; courseId: string; operatorId?: string }) {
        const course = await this.prisma.edCourse.findUnique({ where: { id: data.courseId } });
        if (!course) throw new NotFoundException('找不到该课程');
        if (course.status !== 'ENABLED') throw new BadRequestException('课程已下架，无法续费');

        const existingAccount = await this.prisma.finAssetAccount.findFirst({
            where: { student_id: data.studentId, course_id: data.courseId },
            orderBy: { updatedAt: 'desc' }
        });
        if (!existingAccount) {
            throw new BadRequestException('未找到原资产账户，续费失败（请先首次购课）');
        }

        const order = await this.prisma.finOrder.create({
            data: {
                student_id: data.studentId,
                course_id: data.courseId,
                amount: course.price,
                total_qty: course.total_lessons,
                order_source: 'renewal',
                operator_id: data.operatorId,
                status: 'PENDING_PAYMENT',
            },
        });
        return order;
    }

    /**
     * 支付状态查询（供前端模拟支付轮询使用）
     */
    /** 查询订单支付状态（供前端轮询） */
    async getPaymentStatus(orderId: string) {
        const order = await this.prisma.finOrder.findUnique({
            where: { id: orderId },
            include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        if (!order) throw new NotFoundException('订单不存在');
        return {
            orderId: order.id,
            status: order.status,
            amount: order.amount,
            latestPayment: order.payments[0] || null,
        };
    }

    /**
     * 订单支付
     * 事务内：校验金额 → 写支付流水 → 开通资产账户 → 自动入班/排课
     * 金额必须与订单金额一致，否则抛错
     */
    async processPayment(data: { orderId: string; amount: number; channel: string; campusId: string; operatorId?: string; classId?: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({ where: { id: data.orderId } });
            if (!order) throw new NotFoundException('找不到该订单');
            if (order.status !== 'PENDING_PAYMENT') throw new BadRequestException(`该订单状态为 ${order.status}，无法重复支付`);

            // 后端金额校验：防篡改
            if (Math.abs(data.amount - order.amount) > 0.01) {
                throw new BadRequestException('支付金额与订单金额不一致');
            }

            const payment = await prisma.finPaymentRecord.create({
                data: {
                    order_id: data.orderId,
                    amount: order.amount,   // 以订单金额为准
                    channel: data.channel,
                    status: 'SUCCESS',
                    operator_id: data.operatorId
                }
            });

            await prisma.finOrder.update({
                where: { id: order.id },
                data: { status: 'PAID' }
            });

            // 续费：累加到原账户；首购：新建
            let account: any;
            if (order.order_source === 'renewal') {
                const existing = await prisma.finAssetAccount.findFirst({
                    where: { student_id: order.student_id, course_id: order.course_id },
                    orderBy: { updatedAt: 'desc' }
                });
                if (!existing) throw new BadRequestException('续费失败：未找到原资产账户');
                account = await prisma.finAssetAccount.update({
                    where: { id: existing.id },
                    data: {
                        total_qty: { increment: order.total_qty },
                        remaining_qty: { increment: order.total_qty },
                        status: 'ACTIVE'
                    }
                });
            } else {
                const existingAccount = await prisma.finAssetAccount.findFirst({
                    where: { student_id: order.student_id, course_id: order.course_id, status: 'ACTIVE', remaining_qty: { gt: 0 } }
                });
                if (existingAccount) {
                    throw new BadRequestException('您已购买此课程且仍有剩余课时，无法重复购买');
                }
                account = await prisma.finAssetAccount.create({
                    data: {
                        student_id: order.student_id,
                        course_id: order.course_id,
                        campus_id: data.campusId,
                        total_qty: order.total_qty,
                        remaining_qty: order.total_qty,
                        status: 'ACTIVE',
                    },
                });
            }

            await prisma.finAssetLedger.create({
                data: {
                    account_id: account.id,
                    type: order.order_source === 'renewal' ? 'RENEWAL' : 'BUY',
                    change_qty: order.total_qty,
                    balance_snapshot: account.remaining_qty,
                    ref_id: payment.id,
                },
            });

            // 续费订单不重复自动分班
            if (order.order_source === 'renewal') {
                return {
                    message: `续费成功，课时已追加至原账户`,
                    paymentId: payment.id,
                    accountId: account.id,
                    lessons: order.total_qty,
                    className: null,
                };
            }

            // ── 自动分班：购课成功后将学员加入班级 ──
            const course = await prisma.edCourse.findUnique({
                where: { id: order.course_id },
                include: { instructor: true }
            });

            let assignedClassName = '';
            if (course) {
                // 查找该课程在**同校区**的所有未满班级（ONGOING 或 PENDING），按 enrolled 降序优先填满现有班
                const candidateClasses = await prisma.edClass.findMany({
                    where: {
                        assignments: { some: { course_id: order.course_id } },
                        campus_id: data.campusId,
                        status: { in: ['ONGOING', 'PENDING'] },
                    },
                    orderBy: { enrolled: 'desc' }, // 优先填满已有班，避免碎片化
                });
                // 选第一个有空位的班
                const existingClass = candidateClasses.find((c: any) => c.enrolled < c.capacity) || null;

                if (existingClass) {
                    const alreadyEnrolled = await prisma.eduStudentInClass.findUnique({
                        where: { student_id_class_id: { student_id: order.student_id, class_id: existingClass.id } }
                    });
                    if (!alreadyEnrolled) {
                        await prisma.eduStudentInClass.create({
                            data: { student_id: order.student_id, class_id: existingClass.id }
                        });
                        // 通过 count 同步 enrolled，避免手动 increment 误差
                        const count = await prisma.eduStudentInClass.count({ where: { class_id: existingClass.id } });
                        const updatedEnrolled = count;
                        // 若满足开班人数则自动升级 PENDING → ONGOING
                        const nextStatus = existingClass.status === 'PENDING' && updatedEnrolled >= (existingClass as any).min_students
                            ? 'ONGOING'
                            : existingClass.status;
                        await prisma.edClass.update({
                            where: { id: existingClass.id },
                            data: { enrolled: updatedEnrolled, status: nextStatus }
                        });
                    }
                    assignedClassName = existingClass.name;
                } else {
                    // 无可用班级 → 新建招生中班级（PENDING），凑齐 min_students 人后方可开班
                    const MIN_STUDENTS = 5; // 默认最少开班人数
                    const monthStr = new Date().toISOString().slice(0, 7);
                    const newClass = await prisma.edClass.create({
                        data: {
                            name: `${course.name}-${monthStr}班`,
                            capacity: 30,
                            min_students: MIN_STUDENTS,
                            enrolled: 1,
                            campus_id: data.campusId,
                            // 仅 1 人时进入招生等待状态，凑满 min_students 后管理员/系统升级为 ONGOING
                            status: 'PENDING',
                        }
                    });

                    // 创建班级-课程-教师分配（课程必须有授课教师才能排课）
                    const teacherId = course.instructor_id;
                    if (teacherId) {
                        const assignment = await prisma.edClassAssignment.create({
                            data: {
                                class_id: newClass.id,
                                course_id: order.course_id,
                                teacher_id: teacherId,
                            }
                        });

                        // ── 智能槽位分配：查找该校区尚未被占用的时间槽 ──
                        const existingFirstLessons = await prisma.edLessonSchedule.findMany({
                            where: {
                                assignment: {
                                    class: {
                                        campus_id: data.campusId,
                                        status: { in: ['ONGOING', 'PENDING'] },
                                    }
                                },
                                status: { in: ['PUBLISHED', 'DRAFT'] },
                            },
                            select: { start_time: true },
                            distinct: ['assignment_id'],
                            orderBy: { start_time: 'asc' },
                        });

                        // 收集已占用的 "weekday-HH:mm" 指纹
                        const occupied = new Set<string>();
                        for (const l of existingFirstLessons) {
                            const d = new Date(l.start_time);
                            const wd = d.getDay();
                            const hhmm = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                            occupied.add(`${wd}-${hhmm}`);
                        }

                        // 选第一个空闲槽；若全满则轮转
                        const slot = WEEKLY_SLOTS.find(s => !occupied.has(`${s.weekday}-${s.timeOfDay}`))
                            ?? WEEKLY_SLOTS[existingFirstLessons.length % WEEKLY_SLOTS.length];

                        console.log(`[Finance] 课程「${course.name}」分配到槽位：周${['日','一','二','三','四','五','六'][slot.weekday]} ${slot.timeOfDay}`);

                        // 从下一个满足该星期几的日期开始排课
                        const startFrom = new Date();
                        startFrom.setDate(startFrom.getDate() + 1); // 至少从明天开始
                        startFrom.setHours(0, 0, 0, 0);

                        const lessonDuration = (course as any).duration || 90;
                        const dates = buildWeeklySchedule({
                            weekday: slot.weekday,
                            timeOfDay: slot.timeOfDay,
                            startFrom,
                            count: Math.min(order.total_qty, 48),
                            durationMinutes: lessonDuration,
                        });

                        if (dates.length > 0) {
                            // 查该校区可用教室（按容量贴近班级人数）
                            const availableRooms = await prisma.eduClassroom.findMany({
                                where: { campus_id: data.campusId, status: 'AVAILABLE' },
                                orderBy: { capacity: 'asc' },
                            });

                            // 为每节课分配一个该时段无冲突的教室
                            const scheduleData = await Promise.all(dates.map(async (dt, i) => {
                                let roomId: string | null = null;
                                let roomName = '待分配';
                                for (const room of availableRooms) {
                                    const conflict = await prisma.edLessonSchedule.findFirst({
                                        where: {
                                            classroom_id: room.id,
                                            status: { in: ['PUBLISHED', 'DRAFT'] },
                                            start_time: { lt: dt.end },
                                            end_time:   { gt: dt.start },
                                        },
                                    });
                                    if (!conflict) { roomId = room.id; roomName = room.name; break; }
                                }
                                return {
                                    assignment_id: assignment.id,
                                    course_id: order.course_id,
                                    lesson_no: i + 1,
                                    start_time: dt.start,
                                    end_time: dt.end,
                                    classroom: roomName,
                                    classroom_id: roomId,
                                    status: 'PUBLISHED', // 购课即发布，学员可立即在课表中看到
                                };
                            }));

                            await prisma.edLessonSchedule.createMany({ data: scheduleData });
                        }
                    } else {
                        console.warn(`[Finance] 课程 ${course.name} 无授课教师，跳过自动排课`);
                    }

                    await prisma.eduStudentInClass.create({
                        data: { student_id: order.student_id, class_id: newClass.id }
                    });
                    assignedClassName = newClass.name;
                }
            }

            return {
                message: assignedClassName
                    ? `支付成功！已分配至「${assignedClassName}」`
                    : '支付成功，已生成课时资产',
                paymentId: payment.id,
                accountId: account.id,
                lessons: order.total_qty,
                className: assignedClassName || null,
            };
        });
    }

    // ==========================================
    // 退费流程 — 仅校区审批，无总部审批
    // ==========================================

    /**
     * 学员申请退费：锁定课时，等待校区审批
     */
    /**
     * 发起退款申请
     * @param data.refundQty 退课时数，未传则全退
     * 状态初始 PENDING_APPROVAL，等待管理员审批
     */
    async applyRefund(data: { orderId: string; refundQty?: number; reason: string; applicantId: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({
                where: { id: data.orderId },
                include: { course: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });
            if (!order) throw new NotFoundException('订单不存在');
            if (order.status !== 'PAID' && order.status !== 'PARTIAL_REFUNDED') {
                throw new BadRequestException('只有已支付的订单才能申请退费');
            }

            // Find active asset account
            const account = await prisma.finAssetAccount.findFirst({
                where: { student_id: order.student_id, course_id: order.course_id, status: 'ACTIVE' },
                orderBy: { updatedAt: 'desc' }
            });
            if (!account) throw new NotFoundException('找不到相关资产账户');

            // Check no pending refund for this account
            const existingPending = await prisma.finRefundRecord.findFirst({
                where: { account_id: account.id, status: 'PENDING' }
            });
            if (existingPending) {
                throw new BadRequestException('该课程已有待审批的退费申请');
            }

            // Available = remaining - locked
            const availableQty = account.remaining_qty - account.locked_qty;
            if (availableQty <= 0) {
                throw new BadRequestException('当前无可退课时');
            }

            // 支持部分退费：前端可指定 refundQty，默认退全部可退课时
            const requestedQty = (data.refundQty && data.refundQty > 0) ? data.refundQty : availableQty;
            if (requestedQty > availableQty) {
                throw new BadRequestException(`退费课时数超出可退课时，可退 ${availableQty}`);
            }
            const unitPrice = order.total_qty > 0 ? order.amount / order.total_qty : 0;
            const estimatedAmount = Math.max(0, Number((unitPrice * requestedQty).toFixed(2)));

            if (estimatedAmount <= 0) {
                throw new BadRequestException('可退金额为0，无法发起退费');
            }

            // 记录原支付渠道
            const refundChannel = order.payments[0]?.channel || '未知';

            // Lock the requested qty
            await prisma.finAssetAccount.update({
                where: { id: account.id },
                data: { locked_qty: { increment: requestedQty } }
            });

            const refundRecord = await prisma.finRefundRecord.create({
                data: {
                    order_id: order.id,
                    account_id: account.id,
                    student_id: order.student_id,
                    requested_qty: requestedQty,
                    estimated_amount: estimatedAmount,
                    amount: 0, // Final amount set on approval
                    refund_channel: refundChannel,
                    reason: data.reason,
                    status: 'PENDING',
                    applicant_id: data.applicantId
                }
            });

            return refundRecord;
        });
    }

    /**
     * 获取校区退费审批阈值（可配置）
     */
    private async getRefundThreshold(campusId: string): Promise<number> {
        const config = await this.prisma.campusConfig.findUnique({ where: { campus_id: campusId } });
        return config?.refund_approval_threshold ?? 1000;
    }

    /**
     * 校区管理员审批退费（无需总部审批）
     */
    /**
     * 审批退款申请
     * 通过：扣减资产课时、回滚订单、写退款流水；拒绝：置为 REJECTED
     * 权限：CAMPUS_ADMIN 仅限本校区；ADMIN 全量
     */
    async approveRefund(data: { refundId: string; approverId: string; approverRole?: string; campusId?: string; isApproved: boolean; reviewNote?: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const refund = await prisma.finRefundRecord.findUnique({
                where: { id: data.refundId },
                include: { order: true }
            });
            if (!refund) throw new NotFoundException('退费申请不存在');
            if (refund.status !== 'PENDING') {
                throw new BadRequestException('该申请已处理');
            }

            const account = refund.account_id
                ? await prisma.finAssetAccount.findUnique({ where: { id: refund.account_id } })
                : await prisma.finAssetAccount.findFirst({
                    where: { student_id: refund.student_id, course_id: refund.order.course_id },
                    orderBy: { updatedAt: 'desc' }
                });

            if (!account) throw new NotFoundException('找不到相关资产账户');

            if (!data.isApproved) {
                // Reject: unlock qty
                await prisma.finAssetAccount.update({
                    where: { id: account.id },
                    data: { locked_qty: { decrement: refund.requested_qty } }
                });

                return prisma.finRefundRecord.update({
                    where: { id: refund.id },
                    data: {
                        status: 'REJECTED',
                        approver_id: data.approverId,
                        review_note: data.reviewNote || null,
                        reviewedAt: new Date()
                    }
                });
            }

            // Approve: recalculate amount at approval time
            const order = refund.order;
            const unitPrice = order.total_qty > 0 ? order.amount / order.total_qty : 0;
            const approvedQty = Math.min(refund.requested_qty, account.remaining_qty);
            const isFullRefund = approvedQty >= account.remaining_qty;

            // For full refund, use exact remaining balance to avoid penny-loss from rounding
            const rawAmount = isFullRefund
                ? Math.max(0, order.amount - account.refunded_amount)
                : Math.max(0, unitPrice * approvedQty);
            const approvedAmount = Number(rawAmount.toFixed(2));

            // Cap cumulative refund at order total
            const totalRefunded = account.refunded_amount + approvedAmount;
            const finalAmount = Math.max(0, totalRefunded > order.amount
                ? Number((order.amount - account.refunded_amount).toFixed(2))
                : approvedAmount);

            // Update refund record
            await prisma.finRefundRecord.update({
                where: { id: refund.id },
                data: {
                    status: 'APPROVED',
                    approved_qty: approvedQty,
                    amount: finalAmount,
                    approver_id: data.approverId,
                    review_note: data.reviewNote || null,
                    reviewedAt: new Date()
                }
            });

            // Update asset account
            const updatedAccount = await prisma.finAssetAccount.update({
                where: { id: account.id },
                data: {
                    remaining_qty: { decrement: approvedQty },
                    locked_qty: { decrement: refund.requested_qty },
                    refunded_qty: { increment: approvedQty },
                    refunded_amount: { increment: finalAmount },
                    status: isFullRefund ? 'REFUNDED' : 'ACTIVE'
                }
            });

            // Ledger entry
            await prisma.finAssetLedger.create({
                data: {
                    account_id: account.id,
                    type: 'REFUND',
                    change_qty: -approvedQty,
                    balance_snapshot: updatedAccount.remaining_qty,
                    ref_id: refund.id,
                }
            });

            // 订单状态智能判定：按已退累计金额判断 REFUNDED vs PARTIAL_REFUNDED
            const allApprovedRefunds = await prisma.finRefundRecord.findMany({
                where: { order_id: order.id, status: { in: ['APPROVED', 'PROCESSED'] } }
            });
            const cumulativeRefunded = allApprovedRefunds.reduce((sum, r) => sum + r.amount, 0) + finalAmount;
            const newOrderStatus = cumulativeRefunded >= order.amount - 0.01 ? 'REFUNDED' : 'PARTIAL_REFUNDED';
            await prisma.finOrder.update({
                where: { id: order.id },
                data: { status: newOrderStatus }
            });

            // 模拟退回原支付渠道：记录负额支付流水（替代原先充入钱包 balance）
            await prisma.finPaymentRecord.create({
                data: {
                    order_id: order.id,
                    amount: -finalAmount,
                    channel: refund.refund_channel || '未知',
                    status: 'SUCCESS',
                    operator_id: data.approverId,
                }
            });

            // 退费记录最终状态 → PROCESSED（已退回原渠道）
            await prisma.finRefundRecord.update({
                where: { id: refund.id },
                data: { status: 'PROCESSED' }
            });

            return {
                success: true,
                message: `退费已通过并按原支付方式（${refund.refund_channel}）退回 ¥${finalAmount.toFixed(2)}`,
                approvedQty,
                amount: finalAmount,
                accountStatus: isFullRefund ? 'REFUNDED' : 'ACTIVE'
            };
        });
    }

    /**
     * 欠费与低余额预警
     */
    /** 查询指定学员的余额不足预警列表 */
    async getLowBalanceAlert(studentId: string) {
        const accounts = await this.prisma.finAssetAccount.findMany({
            where: { student_id: studentId, status: 'ACTIVE' },
            include: { course: true }
        });
        const alerts = accounts
            .filter(a => a.remaining_qty <= 5)
            .map(a => ({
                accountId: a.id,
                courseId: a.course_id,
                courseName: a.course.name,
                remainingQty: a.remaining_qty,
                level: a.remaining_qty <= 0 ? 'CRITICAL' : 'WARNING',
            }));
        return { alerts, hasWarning: alerts.length > 0 };
    }

    /**
     * 管理员查询校区内欠费学员
     */
    /** 查询某校区内余额不足的学员列表（管理员视角） */
    async getLowBalanceStudentsByCampus(campusId: string) {
        return this.prisma.finAssetAccount.findMany({
            where: {
                campus_id: campusId,
                status: 'ACTIVE',
                remaining_qty: { lte: 5 }
            },
            include: { student: true, course: true },
            orderBy: { remaining_qty: 'asc' }
        });
    }

    /**
     * 管理员手动发起退费
     */
    /**
     * 管理员手动退款（直接对资产账户扣减）
     * 事务内：扣减账户课时、写退款记录（APPROVED）
     */
    async manualRefund(data: { accountId: string; refundQty: number; reason: string; applicantId: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const account = await prisma.finAssetAccount.findUnique({ where: { id: data.accountId } });
            if (!account) throw new NotFoundException('资产账户不存在');

            const availableQty = account.remaining_qty - account.locked_qty;
            if (availableQty < data.refundQty) {
                throw new BadRequestException(`可退课时(${availableQty})不足`);
            }

            // Check no pending refund for this account
            const existingPending = await prisma.finRefundRecord.findFirst({
                where: { account_id: account.id, status: 'PENDING' }
            });
            if (existingPending) {
                throw new BadRequestException('该课程已有待审批的退费申请');
            }

            const order = await prisma.finOrder.findFirst({
                where: { student_id: account.student_id, course_id: account.course_id, status: { in: ['PAID', 'PARTIAL_REFUNDED'] } },
                orderBy: { createdAt: 'desc' }
            });
            if (!order) throw new NotFoundException('找不到对应的已付款订单');

            const unitPrice = order.total_qty > 0 ? order.amount / order.total_qty : 0;
            const estimatedAmount = Math.max(0, Number((unitPrice * data.refundQty).toFixed(2)));

            // Lock qty
            await prisma.finAssetAccount.update({
                where: { id: account.id },
                data: { locked_qty: { increment: data.refundQty } }
            });

            return prisma.finRefundRecord.create({
                data: {
                    order_id: order.id,
                    account_id: account.id,
                    student_id: account.student_id,
                    requested_qty: data.refundQty,
                    estimated_amount: estimatedAmount,
                    amount: 0,
                    reason: data.reason || '管理员手动发起退费',
                    status: 'PENDING',
                    applicant_id: data.applicantId,
                }
            });
        });
    }

    // ==========================================
    // 查询接口
    // ==========================================

    /** 查询某学员的所有资产账户（课时余额等） */
    async getAssetsByStudent(studentId: string) {
        const student = await this.prisma.eduStudent.findUnique({
            where: { id: studentId },
            select: { balance: true }
        });

        const accounts = await this.prisma.finAssetAccount.findMany({
            where: { student_id: studentId },
            include: {
                course: true,
                ledgers: { orderBy: { occurTime: 'desc' }, take: 10 }
            }
        });

        return { balance: student?.balance || 0, accounts };
    }

    /** 查询全部学员资产（可按校区过滤） */
    async getAllAssets(campusId?: string) {
        const where: any = {};
        if (campusId) {
            where.campus_id = campusId;
        }
        return this.prisma.finAssetAccount.findMany({
            where,
            include: {
                course: true,
                student: true,
                ledgers: { orderBy: { occurTime: 'desc' }, take: 5 }
            }
        });
    }

    /** 查询全部订单（可按校区过滤） */
    async getAllOrders(campusId?: string) {
        const where: any = {};
        if (campusId) {
            where.course = { campus_id: campusId };
        }
        const orders = await this.prisma.finOrder.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: { course: true, student: true, payments: true }
        });
        return orders.map((o: any) => ({
            id: o.id,
            student_id: o.student_id,
            student_name: o.student?.name || '未知学员',
            course_id: o.course_id,
            course_name: o.course?.name || '未知课程',
            amount: o.amount,
            total_qty: o.total_qty,
            status: o.status,
            channel: o.payments?.[0]?.channel || '-',
            operator_id: o.operator_id,
            campus_id: o.course?.campus_id,
            createdAt: o.createdAt
        }));
    }

    /** 作废订单（仅限未支付/异常订单） */
    async voidOrder(orderId: string, operatorId: string) {
        const order = await this.prisma.finOrder.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException('订单不存在');
        if (order.status === 'PAID') throw new BadRequestException('已支付订单不可直接作废，请走退费流程');
        if (order.status === 'VOID') throw new BadRequestException('订单已是作废状态');
        return this.prisma.finOrder.update({
            where: { id: orderId },
            data: { status: 'VOID' }
        });
    }

    /** 查询学员的订单历史 */
    async getOrdersByStudent(studentId: string) {
        return this.prisma.finOrder.findMany({
            where: { student_id: studentId },
            orderBy: { createdAt: 'desc' },
            include: { course: true }
        });
    }

    /**
     * 通过学员+课程查找已支付订单（用于管理员手动发起退费）
     */
    /** 查询学员在某课程下的已支付订单 */
    async findPaidOrder(studentId: string, courseId: string) {
        const order = await this.prisma.finOrder.findFirst({
            where: { student_id: studentId, course_id: courseId, status: { in: ['PAID', 'PARTIAL_REFUNDED'] } },
            orderBy: { createdAt: 'desc' },
        });
        if (!order) throw new NotFoundException('未找到该学员的已支付订单');
        return order;
    }

    /** 查询学员本人的退款申请列表 */
    async getMyRefunds(studentId: string) {
        return this.prisma.finRefundRecord.findMany({
            where: { student_id: studentId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, order_id: true, requested_qty: true, approved_qty: true,
                estimated_amount: true, amount: true, reason: true, status: true,
                review_note: true, createdAt: true, reviewedAt: true,
            }
        });
    }

    /** 待审批退款申请（按校区过滤） */
    async getPendingRefunds(campusId?: string) {
        const where: any = { status: 'PENDING' };
        if (campusId) {
            where.account = { campus_id: campusId };
        }
        return this.prisma.finRefundRecord.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                student: true,
                order: { include: { course: true } },
                account: true
            }
        });
    }

    /** 查询所有退款申请（含已完结） */
    async getRefundApplications(campusId?: string) {
        const where: any = {};
        if (campusId) {
            where.account = { campus_id: campusId };
        }
        return this.prisma.finRefundRecord.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                student: true,
                order: { include: { course: true } },
                account: true
            }
        });
    }
}
