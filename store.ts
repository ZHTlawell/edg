
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Course, Class as ClassInfo, StudentStatus, CourseStatus, ClassStatus, AttendanceRecord, AssetAccount, AssetLedger, AttendStatus, Order } from './types';

// 基础数据字典类型
export type Campus = { id: string; name: string };

// Re-exporting unified types
export type { Student, Course, ClassInfo, Order };
// Deprecating the old Attendance type in favor of AttendanceRecord from types.ts
export type User = {
    id: string;
    username: string;
    role: 'admin' | 'campus_admin' | 'teacher' | 'student';
    campus?: string; // 存储校区名称，如 "总校区"
    bindStudentId?: string
};

// 模拟数据库结构
interface AppState {
    campuses: Campus[];
    students: Student[];
    courses: Course[];
    classes: ClassInfo[];
    orders: Order[];
    attendanceRecords: AttendanceRecord[];
    assetAccounts: AssetAccount[];
    assetLedgers: AssetLedger[];
    currentUser: User | null;

    // Actions
    login: (username: string, role: User['role']) => void;
    logout: () => void;

    setStudents: (students: Student[]) => void;
    setCourses: (courses: Course[]) => void;
    setClasses: (classes: ClassInfo[]) => void;

    addStudent: (student: Omit<Student, 'id' | 'balanceAmount' | 'balanceLessons' | 'createdAt' | 'lastStudyTime'>) => void;
    updateStudent: (student: Student) => void;
    deleteStudent: (id: string) => void;

    // Attendance Actions
    submitAttendance: (lessonId: string, courseId: string, classId: string, campusId: string, records: { studentId: string, status: AttendStatus, deductHours: number }[]) => void;
    confirmConsumption: (lessonId: string) => void;

    // Order & Asset Actions
    createOrder: (orderData: Omit<Order, 'id' | 'status' | 'createdAt'>) => string;
    requestRefund: (refundData: { studentId: string; courseId: string; lessons: number; amount?: number; orderId?: string; notes?: string }) => void;

    // Warning Helpers
    getLowBalanceAssetAccounts: (threshold?: number) => (AssetAccount & { studentName: string; courseName: string })[];

    // Transfer Actions
    transferClass: (studentId: string, newClassId: string) => void;

    // Export Helpers
    getExportData: (type: 'orders' | 'attendance' | 'assets', filters?: { campus?: string; keyword?: string }) => any[];
}

const RENEWAL_WARNING_THRESHOLD = 3;

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
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
                { id: 'C-001', name: 'UI设计精英1班', campus: '总校区', courseId: '1', courseName: '高级UI/UX设计实战', teacherName: '李建国', capacity: 30, enrolled: 28, schedule: '每周一、三 14:00-16:00', status: 'ongoing', createdAt: '2024-03-12' },
                { id: 'C-002', name: '前端开发周末班', campus: '浦东校区', courseId: '2', courseName: '全栈开发：React', teacherName: '张教授', capacity: 25, enrolled: 12, schedule: '每周六 09:00-12:00', status: 'pending', createdAt: '2024-05-10' },
                { id: 'C-003', name: '数据分析研修班', campus: '静安校区', courseId: '3', courseName: '商业数据分析', teacherName: '陈首席', capacity: 20, enrolled: 20, schedule: '每周二、四 18:30-20:30', status: 'ongoing', createdAt: '2024-02-15' },
                { id: 'C-004', name: 'Python基础 spring 班', campus: '总校区', courseId: '4', courseName: 'Python自动化办公', teacherName: '刘老师', capacity: 30, enrolled: 30, schedule: '每周五 19:00-21:00', status: 'closed', createdAt: '2023-12-01' },
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
                const user: User = {
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
                        } as Student,
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
                    const newRecords: AttendanceRecord[] = records.map(r => ({
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
                    if (records.length === 0) return state;

                    const newAccounts = [...state.assetAccounts];
                    const newLedgers = [...state.assetLedgers];
                    const newAttendanceRecords = [...state.attendanceRecords];

                    records.forEach(record => {
                        const account = newAccounts.find(acc => acc.studentId === record.studentId && acc.courseId === record.courseId);
                        if (account && account.remainingQty >= record.deductHours && record.deductHours > 0) {
                            account.remainingQty -= record.deductHours;
                            account.updatedAt = new Date().toISOString();

                            const ledger: AssetLedger = {
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
                        } else if (record.deductHours === 0) {
                            // No deduction needed (e.g. leave)
                            const recordIdx = newAttendanceRecords.findIndex(r => r.id === record.id);
                            if (recordIdx !== -1) {
                                newAttendanceRecords[recordIdx] = { ...newAttendanceRecords[recordIdx], deductStatus: 'completed' };
                            }
                        } else {
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
                const newOrder: Order = {
                    ...orderData,
                    id: orderId,
                    status: 'paid', // 模拟支付完成
                    createdAt: new Date().toISOString()
                };

                set((state) => {
                    const newAccounts = [...state.assetAccounts];
                    const newLedgers = [...state.assetLedgers];
                    const newStudents = [...state.students];
                    const newClasses = [...state.classes];

                    // 1. 资产账户处理
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

                    account.totalQty += orderData.lessons;
                    account.remainingQty += orderData.lessons;
                    account.updatedAt = new Date().toISOString();

                    // 2. 审计流水记录
                    const ledger: AssetLedger = {
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

                    // 3. 自动入班逻辑 (Auto-Enrollment)
                    // 寻找该课程下首个正在研读且有余位的班级
                    const targetClassIdx = newClasses.findIndex(c =>
                        c.courseId === orderData.courseId &&
                        c.status === 'ongoing' &&
                        c.enrolled < c.capacity
                    );

                    let assignedClassName = '';
                    if (targetClassIdx !== -1) {
                        newClasses[targetClassIdx] = {
                            ...newClasses[targetClassIdx],
                            enrolled: newClasses[targetClassIdx].enrolled + 1
                        };
                        assignedClassName = newClasses[targetClassIdx].name;
                    }

                    // 4. 同步更新学生状态与班级
                    const studentIdx = newStudents.findIndex(s => s.id === orderData.studentId);
                    if (studentIdx !== -1) {
                        newStudents[studentIdx] = {
                            ...newStudents[studentIdx],
                            balanceLessons: (newStudents[studentIdx].balanceLessons || 0) + orderData.lessons,
                            status: 'active',
                            // 如果自动匹配到了班级，则更新学生的 className
                            className: assignedClassName || newStudents[studentIdx].className
                        };
                    }

                    return {
                        orders: [newOrder, ...state.orders],
                        assetAccounts: newAccounts,
                        assetLedgers: newLedgers,
                        students: newStudents,
                        classes: newClasses
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
                    const ledger: AssetLedger = {
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
            },

            transferClass: (studentId, newClassId) => {
                set((state) => {
                    const newStudents = [...state.students];
                    const studentIdx = newStudents.findIndex(s => s.id === studentId);

                    if (studentIdx === -1) return state;

                    const student = newStudents[studentIdx];
                    const targetClass = state.classes.find(c => c.id === newClassId);

                    if (!targetClass) {
                        console.error('转班失败：目标班级不存在');
                        return state;
                    }

                    // 1. 更新学生所在班级名称
                    newStudents[studentIdx] = {
                        ...student,
                        className: targetClass.name
                    };

                    // 2. 检查是否涉及课程变更（跨课转报预留逻辑）
                    const newLedgers = [...state.assetLedgers];
                    const transferLedger: AssetLedger = {
                        id: 'LED' + Date.now() + 'TRANS',
                        accountId: 'GLOBAL', // 跨班异动通常标记为全局
                        studentId: studentId,
                        businessType: 'BUY', // 暂借用 BUY 记录资产流入/流转
                        changeQty: 0,
                        balanceSnapshot: student.balanceLessons || 0,
                        refId: `TRANS-TO-${newClassId}`,
                        occurTime: new Date().toISOString()
                    };
                    newLedgers.unshift(transferLedger);

                    return {
                        students: newStudents,
                        assetLedgers: newLedgers
                    };
                });
            },

            getExportData: (type, filters) => {
                const state = get();
                const { campus, keyword } = filters || {};

                if (type === 'orders') {
                    return state.orders
                        .filter(o => {
                            if (campus && o.campusId !== campus) return false;
                            if (keyword) {
                                const student = state.students.find(s => s.id === o.studentId);
                                const course = state.courses.find(c => c.id === o.courseId);
                                return student?.name.includes(keyword) || o.id.includes(keyword) || course?.name.includes(keyword);
                            }
                            return true;
                        })
                        .map(o => ({
                            ...o,
                            studentName: state.students.find(s => s.id === o.studentId)?.name || '未知',
                            courseName: state.courses.find(c => c.id === o.courseId)?.name || '未知',
                            campusName: o.campusId // 假设 campusId 存储的就是校区名称或可映射
                        }));
                }

                if (type === 'attendance') {
                    return state.attendanceRecords.map(r => ({
                        ...r,
                        studentName: state.students.find(s => s.id === r.studentId)?.name || '未知',
                        courseName: state.courses.find(c => c.id === r.courseId)?.name || '未知'
                    }));
                }

                return [];
            },

            getLowBalanceAssetAccounts: (threshold = RENEWAL_WARNING_THRESHOLD) => {
                const state = get();
                return state.assetAccounts
                    .filter(acc => acc.remainingQty <= threshold && acc.status === 'active')
                    .map(acc => ({
                        ...acc,
                        studentName: state.students.find(s => s.id === acc.studentId)?.name || '未知学员',
                        courseName: state.courses.find(c => c.id === acc.courseId)?.name || '未知课程'
                    }));
            }
        }),
        {
            name: 'eduadmin-storage',
        }
    )
);
