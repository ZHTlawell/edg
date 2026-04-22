/**
 * 端到端业务联动 Vitest 测试
 * 作用：校验校区发布课程 → 学员购课 → 管理员/教师/学员多端数据联动一致性
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

// 端到端联动测试套件：覆盖订单生成 + 资产账户 + 教师课程可见性
describe('End-to-End Business Synergy', () => {
    beforeEach(() => {
        // Reset store or specific states if needed, but persist might keep data. 
        // For testing, we just act on the current state.
    });

    it('should synchronize data across all roles after course publication and purchase', () => {
        const store = useStore.getState();
        const admin = { username: '赵校长', role: 'campus_admin' as const };
        const student = { id: 'S10001', name: '张美玲' };
        const teacherName = '李建国老师';

        // 1. Campus Admin publishes a course
        const newCourse = {
            id: 'E2E-TEST-001',
            code: 'TEST001',
            name: 'E2E 联动测试课程',
            category: '编程',
            level: '高级',
            totalLessons: 20,
            price: '¥2000.00',
            campus: '总校区',
            status: 'enabled' as const,
            instructor: teacherName,
            updateTime: new Date().toISOString()
        };
        store.setCourses([...store.courses, newCourse]);

        // 2. Student buys the course
        const orderId = store.createOrder({
            studentId: student.id,
            courseId: newCourse.id,
            classId: 'C-001',
            campusId: 'C001',
            lessons: 20,
            amount: 2000,
            paymentMethod: '余额'
        });

        // RE-FETCH STATE
        const updatedStore = useStore.getState();

        // 3. Verify Admin Visibility (Order exists)
        const order = updatedStore.orders.find(o => o.id === orderId);
        expect(order).toBeDefined();
        expect(order?.courseId).toBe(newCourse.id);

        // 4. Verify Student Visibility (Asset Account exists and is active)
        const asset = updatedStore.assetAccounts.find(acc => acc.studentId === student.id && acc.courseId === newCourse.id);
        expect(asset).toBeDefined();
        expect(asset?.remainingQty).toBe(20);

        // 5. Verify Teacher Visibility (Logic Check)
        // Teacher matches courses by instructor name
        const teacherCourses = updatedStore.courses.filter(c => c.instructor === teacherName);
        expect(teacherCourses.some(c => c.id === newCourse.id)).toBe(true);

        // Teacher's student count logic (derived from asset accounts)
        const myCourseIds = teacherCourses.map(c => c.id);
        const studentIds = new Set(updatedStore.assetAccounts.filter(acc => myCourseIds.includes(acc.courseId)).map(acc => acc.studentId));
        expect(studentIds.has(student.id)).toBe(true);
    });
});
