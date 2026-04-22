/**
 * 统计服务
 * 职责：聚合多张表数据，为管理端 Dashboard 输出核心 KPI、出勤、消耗、退费、订单导出
 * 所属模块：数据分析
 * 被 StatisticsController 依赖注入
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 统计业务服务
 * 对外提供总部工作台概览、出勤、课时消耗、退费、订单导出等数据接口
 */
@Injectable()
export class StatisticsService {
    constructor(private prisma: PrismaService) { }

    /**
     * 总部工作台概览
     * 包含：今日新增、本月营收、学员/教师总数、按月营收趋势、各校区数据等
     * 使用过去 12 个月的时间窗口绘制趋势图
     */
    async getWorkbenchOverview() {
        const now = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const currentYearStart = new Date(now.getFullYear(), 0, 1);

        // 1. KPI Stats
        const [
            totalStudents,
            annualRevenueRes,
            classes,
            newEnrollments,
            orders,
            refunds,
            pendingCampusAdmins
        ] = await Promise.all([
            this.prisma.eduStudent.count(),
            this.prisma.finOrder.aggregate({
                where: {
                    status: 'PAID',
                    createdAt: { gte: currentYearStart }
                },
                _sum: { amount: true }
            }),
            this.prisma.edClass.findMany({
                select: { capacity: true, enrolled: true }
            }),
            this.prisma.finOrder.count({
                where: {
                    status: 'PAID',
                    createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
                }
            }),
            this.prisma.finOrder.findMany({
                where: {
                    createdAt: { gte: twelveMonthsAgo },
                    status: 'PAID'
                },
                include: {
                    student: { select: { name: true, user: { select: { campusName: true, campus_id: true } } } },
                    course: { select: { name: true } }
                }
            }),
            this.prisma.finRefundRecord.count({
                where: { status: 'PENDING_APPROVAL' }
            }),
            this.prisma.sysUser.count({
                where: { role: 'CAMPUS_ADMIN', status: 'PENDING_APPROVAL' }
            })
        ]);

        const annualRevenue = annualRevenueRes._sum.amount || 0;
        
        // Average Fill Rate
        const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);
        const totalEnrolled = classes.reduce((sum, c) => sum + (c.enrolled || 0), 0);
        const avgFillRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

        // 2. Revenue Trend (Last 12 Months)
        const revenueMap = new Map<string, number>();
        for (let i = 0; i < 12; i++) {
            const d = new Date(twelveMonthsAgo);
            d.setMonth(twelveMonthsAgo.getMonth() + i);
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            revenueMap.set(key, 0);
        }

        orders.forEach(o => {
            const d = new Date(o.createdAt);
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            if (revenueMap.has(key)) {
                revenueMap.set(key, (revenueMap.get(key) || 0) + o.amount);
            }
        });

        const revenueTrend = Array.from(revenueMap.entries()).map(([month, amount]) => ({
            month,
            amount: amount / 10000 // Convert to "Ten Thousand Yuan" (万元) for the chart
        }));

        // 3. Campus Ranking
        const campusRevenueMap = new Map<string, number>();
        orders.forEach(o => {
            const campusName = o.student?.user?.campusName || '未知校区';
            campusRevenueMap.set(campusName, (campusRevenueMap.get(campusName) || 0) + o.amount);
        });

        const campusRanking = Array.from(campusRevenueMap.entries())
            .map(([name, revenue]) => ({ name, revenue: revenue / 1000000 })) // Convert to Millions (百万) for the chart
            .sort((a, b) => b.revenue - a.revenue);

        // 4. Latest Orders
        const latestOrders = orders
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5)
            .map(o => ({
                student: o.student?.name,
                course: o.course?.name,
                amount: o.amount,
                campus: o.student?.user?.campusName || '未知'
            }));

        return {
            kpis: {
                annualRevenue,
                totalStudents,
                avgFillRate: parseFloat(avgFillRate.toFixed(1)),
                newEnrollments,
                pendingRefunds: refunds,
                pendingCampusAdmins
            },
            revenueTrend,
            campusRanking,
            latestOrders
        };
    }

    // ─── 到课率统计 ──────────────────────────────────────────────
    /**
     * 出勤统计
     * 按日期区间、校区筛选，返回到课率 / 请假率 / 缺勤率等维度
     * @param filters.campusId 校区过滤
     * @param filters.startDate 起始日期
     * @param filters.endDate 截止日期
     */
    async getAttendanceStats(filters?: { campusId?: string; startDate?: string; endDate?: string }) {
        const where: any = {};
        if (filters?.startDate || filters?.endDate) {
            where.lesson = {
                start_time: {
                    ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                    ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
                },
            };
        }

        const allRecords = await this.prisma.teachAttendance.findMany({
            where,
            select: { status: true },
        });

        const total = allRecords.length;
        const present = allRecords.filter(r => r.status === 'present' || r.status === 'PRESENT').length;
        const leave = allRecords.filter(r => r.status === 'leave' || r.status === 'LEAVE').length;
        const absent = allRecords.filter(r => r.status === 'absent' || r.status === 'ABSENT').length;
        const attendanceRate = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

        return {
            total,
            present,
            leave,
            absent,
            attendanceRate,
        };
    }

    // ─── 课消率统计 ──────────────────────────────────────────────
    /**
     * 课时消耗统计（按时间范围）
     * 返回期间每日已消耗课时数，用于绘制消耗趋势图
     */
    async getConsumptionStats(filters?: { startDate?: string; endDate?: string }) {
        const where: any = {};
        if (filters?.startDate || filters?.endDate) {
            where.start_time = {
                ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            };
        }

        const allLessons = await this.prisma.edLessonSchedule.findMany({
            where: { ...where, status: { in: ['PUBLISHED', 'COMPLETED'] } },
            select: { is_consumed: true, status: true },
        });

        const total = allLessons.length;
        const completed = allLessons.filter(l => l.status === 'COMPLETED').length;
        const consumed = allLessons.filter(l => l.is_consumed).length;
        const completionRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;
        const consumptionRate = completed > 0 ? parseFloat(((consumed / completed) * 100).toFixed(1)) : 0;

        return {
            totalLessons: total,
            completedLessons: completed,
            consumedLessons: consumed,
            completionRate,
            consumptionRate,
        };
    }

    // ─── 退费统计 ──────────────────────────────────────────────
    /**
     * 退费统计
     * 聚合退费次数、金额、按校区/原因拆分
     */
    async getRefundStats() {
        const refunds = await this.prisma.finRefundRecord.findMany({
            select: { amount: true, status: true, createdAt: true },
        });

        const approved = refunds.filter(r => r.status === 'APPROVED');
        const pending = refunds.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'PENDING_HQ_APPROVAL');

        return {
            totalRefundAmount: approved.reduce((sum, r) => sum + r.amount, 0),
            pendingCount: pending.length,
            approvedCount: approved.length,
            totalCount: refunds.length,
        };
    }

    // ─── 导出统计数据为 CSV ──────────────────────────────────────
    /**
     * 导出所有订单为 CSV 文本
     * 返回字符串由 controller 加 BOM 后下载
     */
    async exportOrdersCsv() {
        const orders = await this.prisma.finOrder.findMany({
            include: {
                student: true,
                course: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const header = '订单ID,学员姓名,课程名称,金额,状态,创建时间\n';
        const rows = orders.map(o =>
            `${o.id},${o.student?.name || ''},${o.course?.name || ''},${o.amount},${o.status},${o.createdAt.toISOString()}`
        ).join('\n');

        return header + rows;
    }
}
