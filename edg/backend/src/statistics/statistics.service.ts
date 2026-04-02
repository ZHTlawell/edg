import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
    constructor(private prisma: PrismaService) { }

    async getWorkbenchOverview(campusId?: string) {
        const now = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const currentYearStart = new Date(now.getFullYear(), 0, 1);

        // Campus filter for scoped queries
        const campusOrderFilter: any = campusId ? { course: { campus_id: campusId } } : {};
        const campusClassFilter: any = campusId ? { campus_id: campusId } : {};
        const campusStudentFilter: any = campusId ? { classes: { some: { class: { campus_id: campusId } } } } : {};
        const campusRefundFilter: any = campusId ? { account: { campus_id: campusId } } : {};

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
            this.prisma.eduStudent.count({ where: campusStudentFilter }),
            this.prisma.finOrder.aggregate({
                where: {
                    status: 'PAID',
                    createdAt: { gte: currentYearStart },
                    ...campusOrderFilter
                },
                _sum: { amount: true }
            }),
            this.prisma.edClass.findMany({
                where: campusClassFilter,
                select: { capacity: true, enrolled: true }
            }),
            this.prisma.finOrder.count({
                where: {
                    status: 'PAID',
                    createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
                    ...campusOrderFilter
                }
            }),
            this.prisma.finOrder.findMany({
                where: {
                    createdAt: { gte: twelveMonthsAgo },
                    status: 'PAID',
                    ...campusOrderFilter
                },
                include: {
                    student: { select: { name: true, user: { select: { campusName: true, campus_id: true } } } },
                    course: { select: { name: true } }
                }
            }),
            this.prisma.finRefundRecord.count({
                where: { status: 'PENDING', ...campusRefundFilter }
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
}
