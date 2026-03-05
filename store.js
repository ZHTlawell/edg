import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useStore = create()(persist((set, get) => ({
    campuses: [
        { id: 'C001', name: '总校区' },
        { id: 'C002', name: '浦东校区' },
        { id: 'C003', name: '静安校区' }
    ],
    students: [
        { id: 'S10001', name: '张美玲', gender: 'female', phone: '13812345678', campus: '总校区', status: 'active', className: '高级UI/UX设计', lastStudyTime: '2024-05-21 14:30', createdAt: '2024-01-10', birthday: '1998-11-15', balanceAmount: 5000, balanceLessons: 20 },
        { id: 'S10002', name: '王大卫', gender: 'male', phone: '13988887777', campus: '总校区', status: 'active', className: '全栈开发：React', lastStudyTime: '2024-05-20 09:15', createdAt: '2024-01-12', birthday: '1996-05-20', balanceAmount: 3000, balanceLessons: 12 },
        { id: 'S10003', name: '李思思', gender: 'female', phone: '15544443333', campus: '浦东校区', status: 'graduated', className: '商业数据分析', lastStudyTime: '2024-04-15 11:00', createdAt: '2023-11-20', birthday: '1999-03-12', balanceAmount: 0, balanceLessons: 0 },
        { id: 'S10004', name: '赵小龙', gender: 'male', phone: '18600001111', campus: '总校区', status: 'inactive', className: 'Python基础', lastStudyTime: '2024-03-01 16:45', createdAt: '2024-02-05', birthday: '2000-08-05', balanceAmount: 0, balanceLessons: 0 },
        { id: 'S10005', name: '陈晓燕', gender: 'female', phone: '13722223333', campus: '静安校区', status: 'active', className: '数字媒体艺术', lastStudyTime: '2024-05-21 10:20', createdAt: '2024-03-10', birthday: '1997-12-01', balanceAmount: 2000, balanceLessons: 8 },
    ],
    courses: [
        { id: '1', code: 'C2024001', name: '高级UI/UX设计实战', category: '设计', level: '高级', price: '¥4,800.00', totalLessons: 32, status: 'enabled', campus: '总校区', instructor: '李老师', updateTime: '2024-05-20 14:30' },
        { id: '2', code: 'C2024002', name: '全栈开发：从入门到架构', category: '编程', level: '中级', price: '¥6,200.00', totalLessons: 48, status: 'enabled', campus: '浦东校区', instructor: '张教授', updateTime: '2024-05-18 09:15' },
        { id: '3', code: 'C2024003', name: '商业数据分析大师班', category: '数据', level: '初级', price: '¥3,500.00', totalLessons: 24, status: 'disabled', campus: '静安校区', instructor: '陈首席', updateTime: '2024-04-10 11:00' },
        { id: '4', code: 'C2024004', name: 'Python 自动化办公', category: '编程', level: '初级', price: '¥1,200.00', totalLessons: 12, status: 'enabled', campus: '总校区', instructor: '刘老师', updateTime: '2024-05-22 10:00' }
    ],
    classes: [
        { id: 'C-001', name: 'UI设计精英1班', campus: '总校区', courseName: '高级UI/UX设计实战', teacherName: '李建国', capacity: 30, enrolled: 28, schedule: '每周一、三 14:00-16:00', status: 'ongoing', createdAt: '2024-03-12' },
        { id: 'C-002', name: '前端开发周末班', campus: '浦东校区', courseName: '全栈开发：React', teacherName: '张教授', capacity: 25, enrolled: 12, schedule: '每周六 09:00-12:00', status: 'pending', createdAt: '2024-05-10' },
        { id: 'C-003', name: '数据分析研修班', campus: '静安校区', courseName: '商业数据分析', teacherName: '陈首席', capacity: 20, enrolled: 20, schedule: '每周二、四 18:30-20:30', status: 'ongoing', createdAt: '2024-02-15' },
        { id: 'C-004', name: 'Python基础 spring 班', campus: '总校区', courseName: 'Python自动化办公', teacherName: '刘老师', capacity: 30, enrolled: 30, schedule: '每周五 19:00-21:00', status: 'closed', createdAt: '2023-12-01' },
    ],
    orders: [],
    attendanceRecords: [],
    assetLedgers: [],
    assetAccounts: [
        { id: 'ACC001', studentId: 'S10001', courseId: '1', campusId: 'C001', totalQty: 32, remainingQty: 20, lockedQty: 0, status: 'active', updatedAt: '2024-05-21' },
        { id: 'ACC002', studentId: 'S10002', courseId: '2', campusId: 'C001', totalQty: 48, remainingQty: 12, lockedQty: 0, status: 'active', updatedAt: '2024-05-21' }
    ],
    currentUser: null,
    login: (username, role) => {
        const user = {
            id: 'U_' + Date.now(),
            username,
            role,
            campus: role === 'campus_admin' ? '总校区' : undefined,
            bindStudentId: role === 'student' ? 'S10001' : undefined
        };
        set({ currentUser: user });
    },
    logout: () => set({ currentUser: null }),
    setStudents: (students) => set({ students }),
    setCourses: (courses) => set({ courses }),
    setClasses: (classes) => set({ classes }),
    addStudent: (studentData) => {
        set((state) => ({
            students: [
                {
                    ...studentData,
                    id: 'S' + Math.floor(10000 + Math.random() * 90000),
                    balanceAmount: 0,
                    balanceLessons: 0,
                    createdAt: new Date().toISOString().split('T')[0],
                    lastStudyTime: '刚刚'
                },
                ...state.students
            ]
        }));
    },
    updateStudent: (student) => {
        set((state) => ({
            students: state.students.map(s => s.id === student.id ? student : s)
        }));
    },
    deleteStudent: (id) => {
        set((state) => ({
            students: state.students.filter(s => s.id !== id)
        }));
    },
    submitAttendance: (lessonId, courseId, classId, campusId, records) => {
        set((state) => {
            const newRecords = records.map(r => ({
                id: 'ATT' + Date.now() + Math.random().toString(36).substr(2, 5),
                lessonId,
                studentId: r.studentId,
                courseId,
                classId,
                campusId,
                status: r.status,
                deductHours: r.deductHours,
                deductStatus: 'pending',
                createdAt: new Date().toISOString()
            }));
            return {
                attendanceRecords: [...state.attendanceRecords, ...newRecords]
            };
        });
    },
    confirmConsumption: (lessonId) => {
        set((state) => {
            const records = state.attendanceRecords.filter(r => r.lessonId === lessonId && r.deductStatus === 'pending');
            if (records.length === 0)
                return state;
            const newAccounts = [...state.assetAccounts];
            const newLedgers = [...state.assetLedgers];
            const newAttendanceRecords = [...state.attendanceRecords];
            records.forEach(record => {
                const account = newAccounts.find(acc => acc.studentId === record.studentId && acc.courseId === record.courseId);
                if (account && account.remainingQty >= record.deductHours && record.deductHours > 0) {
                    account.remainingQty -= record.deductHours;
                    account.updatedAt = new Date().toISOString();
                    const ledger = {
                        id: 'LED' + Date.now() + Math.random().toString(36).substr(2, 5),
                        accountId: account.id,
                        studentId: record.studentId,
                        businessType: 'CONSUME',
                        changeQty: -record.deductHours,
                        balanceSnapshot: account.remainingQty,
                        refId: record.id,
                        occurTime: new Date().toISOString()
                    };
                    newLedgers.push(ledger);
                    // Update record status
                    const recordIdx = newAttendanceRecords.findIndex(r => r.id === record.id);
                    if (recordIdx !== -1) {
                        newAttendanceRecords[recordIdx] = { ...newAttendanceRecords[recordIdx], deductStatus: 'completed' };
                    }
                }
                else if (record.deductHours === 0) {
                    // No deduction needed (e.g. leave)
                    const recordIdx = newAttendanceRecords.findIndex(r => r.id === record.id);
                    if (recordIdx !== -1) {
                        newAttendanceRecords[recordIdx] = { ...newAttendanceRecords[recordIdx], deductStatus: 'completed' };
                    }
                }
                else {
                    // Failed deduction (insufficient balance)
                    const recordIdx = newAttendanceRecords.findIndex(r => r.id === record.id);
                    if (recordIdx !== -1) {
                        newAttendanceRecords[recordIdx] = { ...newAttendanceRecords[recordIdx], deductStatus: 'failed' };
                    }
                }
            });
            return {
                assetAccounts: newAccounts,
                assetLedgers: newLedgers,
                attendanceRecords: newAttendanceRecords
            };
        });
    },
    createOrder: (orderData) => {
        const orderId = 'ORD' + Date.now();
        const newOrder = {
            ...orderData,
            id: orderId,
            status: 'paid', // 模拟支付完成
            createdAt: new Date().toISOString()
        };
        set((state) => {
            const newAccounts = [...state.assetAccounts];
            const newLedgers = [...state.assetLedgers];
            const newStudents = [...state.students];
            // 寻找或初始化资产账户
            let account = newAccounts.find(acc => acc.studentId === orderData.studentId && acc.courseId === orderData.courseId);
            if (!account) {
                account = {
                    id: 'ACC' + Date.now(),
                    studentId: orderData.studentId,
                    courseId: orderData.courseId,
                    campusId: orderData.campusId,
                    totalQty: 0,
                    remainingQty: 0,
                    lockedQty: 0,
                    status: 'active',
                    updatedAt: new Date().toISOString()
                };
                newAccounts.push(account);
            }
            // 增加课时权益
            account.totalQty += orderData.lessons;
            account.remainingQty += orderData.lessons;
            account.updatedAt = new Date().toISOString();
            // 生成 BUY 类型流水记录点
            const ledger = {
                id: 'LED' + Date.now(),
                accountId: account.id,
                studentId: orderData.studentId,
                businessType: 'BUY',
                changeQty: orderData.lessons,
                balanceSnapshot: account.remainingQty,
                refId: orderId,
                occurTime: new Date().toISOString()
            };
            newLedgers.push(ledger);
            // 同步更新 Student 对象的展示余额（冗余展示用）
            const studentIdx = newStudents.findIndex(s => s.id === orderData.studentId);
            if (studentIdx !== -1) {
                newStudents[studentIdx] = {
                    ...newStudents[studentIdx],
                    balanceLessons: (newStudents[studentIdx].balanceLessons || 0) + orderData.lessons,
                    status: 'active' // 购课后自动转为在读
                };
            }
            return {
                orders: [newOrder, ...state.orders],
                assetAccounts: newAccounts,
                assetLedgers: newLedgers,
                students: newStudents
            };
        });
        return orderId;
    },
    requestRefund: (refundData) => {
        const { studentId, courseId, lessons, orderId } = refundData;
        set((state) => {
            const newAccounts = [...state.assetAccounts];
            const newLedgers = [...state.assetLedgers];
            const newStudents = [...state.students];
            const newOrders = [...state.orders];
            // 1. 查找资产账户
            const accountIdx = newAccounts.findIndex(acc => acc.studentId === studentId && acc.courseId === courseId);
            if (accountIdx === -1) {
                console.error('退费失败：找不到资产账户');
                return state;
            }
            const account = newAccounts[accountIdx];
            if (account.remainingQty < lessons) {
                console.error('退费失败：剩余课时不足');
                return state;
            }
            // 2. 核减资产
            account.remainingQty -= lessons;
            account.updatedAt = new Date().toISOString();
            // 3. 记录审计流水
            const ledger = {
                id: 'LED' + Date.now() + 'REF',
                accountId: account.id,
                studentId: studentId,
                businessType: 'REFUND',
                changeQty: -lessons,
                balanceSnapshot: account.remainingQty,
                refId: orderId || 'MANUAL',
                occurTime: new Date().toISOString()
            };
            newLedgers.unshift(ledger);
            // 4. 同步更新学生余额
            const studentIdx = newStudents.findIndex(s => s.id === studentId);
            if (studentIdx !== -1) {
                newStudents[studentIdx] = {
                    ...newStudents[studentIdx],
                    balanceLessons: (newStudents[studentIdx].balanceLessons || 0) - lessons
                };
            }
            // 5. 如果有订单 ID，更新订单状态
            if (orderId) {
                const orderIdx = newOrders.findIndex(o => o.id === orderId);
                if (orderIdx !== -1) {
                    newOrders[orderIdx] = { ...newOrders[orderIdx], status: 'refunded' };
                }
            }
            return {
                assetAccounts: newAccounts,
                assetLedgers: newLedgers,
                students: newStudents,
                orders: newOrders
            };
        });
    }
}), {
    name: 'eduadmin-storage',
}));
