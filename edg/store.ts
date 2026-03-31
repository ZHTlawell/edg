import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Course, Class as ClassInfo, Teacher, StudentStatus, CourseStatus, ClassStatus, AttendanceRecord, AssetAccount, AssetLedger, AttendStatus, Order, PaymentRecord, RefundRecord, Homework, HomeworkSubmission, Announcement } from './types';
import api from './utils/api';

// 基础数据字典类型
export type Campus = { id: string; name: string };

// Re-exporting unified types
export type { Student, Course, ClassInfo, Order, PaymentRecord, RefundRecord };
// Deprecating the old Attendance type in favor of AttendanceRecord from types.ts
export type User = {
    id: string;
    username: string;
    name?: string;
    role: 'admin' | 'campus_admin' | 'teacher' | 'student';
    campus?: string; // 存储校区名称，如 "总校区"
    campus_id?: string; // 存储校区 ID
    teacherId?: string;
    studentId?: string;
    bindStudentId?: string
};

export type ToastType = 'success' | 'info' | 'warning' | 'error';
export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

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
    homeworks: Homework[];
    homeworkSubmissions: HomeworkSubmission[];
    currentUser: User | null;
    teachers: Teacher[];
    classrooms: any[];
    announcements: Announcement[];
    toasts: ToastMessage[];
    workbenchOverview: any | null;
    classTeacherFilter: string | null; // Filter classes by teacher name/id

    // Actions
    login: (username: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    registerCampusAdmin: (data: any) => Promise<void>;
    registerTeacher: (data: any) => Promise<void>;
    fetchPendingUsers: (role: 'campus-admins' | 'teachers', campusId?: string) => Promise<any[]>;
    approveUser: (userId: string) => Promise<void>;
    rejectUser: (userId: string) => Promise<void>;
    logout: () => void;

    // remote sync actions
    initData: () => Promise<void>;
    fetchCourses: (campusId?: string) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;
    fetchClasses: (campusId?: string) => Promise<void>;
    fetchMyAssets: () => Promise<void>;
    fetchOrders: (campusId?: string) => Promise<void>;
    voidOrder: (orderId: string) => Promise<void>;
    fetchAttendanceRecords: (campusId?: string) => Promise<void>;
    fetchStudents: () => Promise<void>;
    fetchTeachers: (campusId?: string) => Promise<void>;
    fetchClassrooms: (campusId?: string) => Promise<void>;
    fetchCampuses: () => Promise<void>;

    setStudents: (students: Student[]) => void;
    setCourses: (courses: Course[]) => void;
    setClasses: (classes: ClassInfo[]) => void;
    fetchWorkbenchOverview: () => Promise<void>;

    addStudent: (student: Omit<Student, 'id' | 'balanceAmount' | 'balanceLessons' | 'createdAt' | 'lastStudyTime'>) => void;
    updateStudent: (student: Student) => void;
    deleteStudent: (id: string) => void;

    // Attendance Actions
    submitAttendance: (lesson_id: string, course_id: string, class_id: string, campus_id: string, records: { student_id: string, status: AttendStatus, deductHours: number }[]) => Promise<void>;
    confirmConsumption: (lesson_id: string) => Promise<void>;

    // Scheduling Actions
    generateDraft: (classId: string, startDate: string, lessonsCount: number, durationMinutes: number) => Promise<void>;
    publishSchedules: (lessonIds: string[]) => Promise<void>;

    // Order & Asset Actions
    createOrder: (orderData: { studentId?: string; student_id?: string; courseId: string; course_id?: string; amount: number; totalQty?: number; total_qty?: number; classId?: string; notes?: string;[key: string]: any }) => Promise<string>;
    processPayment: (paymentData: { orderId: string; amount: number; channel: string; campusId: string }) => Promise<void>;
    applyRefund: (refundData: { orderId: string; reason: string }) => Promise<void>;
    manualRefund: (data: { accountId: string; refundQty: number; reason: string }) => Promise<void>;
    approveRefund: (refundId: string, isApproved: boolean) => Promise<void>;
    getPendingRefunds: () => Promise<any[]>;
    getAllRefunds: () => Promise<any[]>;

    // Warning Helpers
    getLowBalanceAssetAccounts: (threshold?: number) => (AssetAccount & { student_name: string; studentName?: string; course_name: string; courseName?: string })[];

    // Transfer Actions
    transferClass: (student_id: string, account_id: string, new_class_id: string) => void;

    // Export Helpers
    getExportData: (type: 'orders' | 'attendance' | 'assets', filters?: { campus_id?: string; keyword?: string }) => any[];

    // Homework Actions
    publishHomework: (homeworkData: { title: string; content: string; class_id: string; deadline: string; teacher_id: string; attachmentName?: string; attachmentUrl?: string }) => Promise<string>;
    submitHomework: (submissionData: { homework_id: string; student_id: string; content: string }) => Promise<string>;
    gradeHomework: (submission_id: string, score: number, feedback: string, teacher_id: string) => Promise<void>;

    // Announcement Actions
    fetchAnnouncementsAdmin: () => Promise<void>;
    fetchAnnouncementsActive: () => Promise<void>;
    createAnnouncement: (data: { title: string; content: string; scope: string; campusIds?: string[] }) => Promise<string>;
    updateAnnouncement: (id: string, data: { title?: string; content?: string; scope?: string; campusIds?: string[] }) => Promise<void>;
    publishAnnouncement: (id: string) => Promise<void>;
    withdrawAnnouncement: (id: string) => Promise<void>;

    setClassTeacherFilter: (teacherName: string | null) => void;

    // Toast Actions
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
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
                { id: 'C-001', name: 'UI设计精英1班', campus_id: '总校区', course_id: '1', teacher_id: 'T001', capacity: 30, enrolled: 28, status: 'ongoing' },
                { id: 'C-002', name: '前端开发周末班', campus_id: '浦东校区', course_id: '2', teacher_id: 'T002', capacity: 25, enrolled: 12, status: 'pending' },
                { id: 'C-003', name: '数据分析研修班', campus_id: '静安校区', course_id: '3', teacher_id: 'T003', capacity: 20, enrolled: 20, status: 'ongoing' },
                { id: 'C-004', name: 'Python基础 spring 班', campus_id: '总校区', course_id: '4', teacher_id: 'T004', capacity: 30, enrolled: 30, status: 'closed' },
            ],
            orders: [],
            attendanceRecords: [],
            assetLedgers: [],
            assetAccounts: [
                { id: 'ACC001', student_id: 'S10001', course_id: '1', campus_id: 'C001', total_qty: 32, remaining_qty: 20, locked_qty: 0, refunded_qty: 0, refunded_amount: 0, status: 'ACTIVE', updatedAt: '2024-05-21' },
                { id: 'ACC002', student_id: 'S10002', course_id: '2', campus_id: 'C001', total_qty: 48, remaining_qty: 12, locked_qty: 0, refunded_qty: 0, refunded_amount: 0, status: 'ACTIVE', updatedAt: '2024-05-21' }
            ],
            homeworks: [
                { id: 'HW1001', title: '第一阶段核心组件实战', content: '请完成一个带有状态流转的订单卡片组件，要求使用 TailwindCSS 实现响应式。', course_id: '1', class_id: 'C-001', teacher_id: 'T001', deadline: '2024-05-25 23:59', status: 'active', createdAt: '2024-05-21 15:00' }
            ],
            homeworkSubmissions: [],
            teachers: [],
            classrooms: [],
            announcements: [],
            toasts: [],
            workbenchOverview: null,
            classTeacherFilter: null,
            currentUser: null,

            login: async (username, password) => {
                try {
                    const res = await api.post('/api/auth/login', { username, password });
                    const { access_token, user } = res.data;

                    localStorage.setItem('token', access_token);

                    const currentUser: User = {
                        id: user.sub,
                        username: user.username,
                        name: user.name,
                        role: user.role.toLowerCase(),
                        campus: user.campusName || '总校区',
                        campus_id: user.campusId,
                        teacherId: user.teacherId,
                        studentId: user.studentId,
                        bindStudentId: user.role === 'STUDENT' ? user.studentId : undefined
                    };

                    set({ currentUser });
                    get().addToast('登录成功', 'success');

                    // 登录后自动初始化数据
                    await get().initData();
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                    throw error;
                }
            },

            register: async (data) => {
                try {
                    await api.post('/api/auth/register/student', data);
                    get().addToast('注册成功，请登录', 'success');
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                    throw error;
                }
            },

            registerCampusAdmin: async (data) => {
                try {
                    await api.post('/api/auth/register/campus', data);
                } catch (error: any) {
                    get().addToast(error.message || '注册失败', 'error');
                    throw error;
                }
            },

            registerTeacher: async (data) => {
                try {
                    await api.post('/api/auth/register/teacher', data);
                } catch (error: any) {
                    get().addToast(error.message || '注册失败', 'error');
                    throw error;
                }
            },

            fetchPendingUsers: async (role, campusId) => {
                try {
                    const url = role === 'campus-admins'
                        ? '/api/users/pending/campus-admins'
                        : `/api/users/pending/teachers${campusId ? `?campusId=${campusId}` : ''}`;
                    const res = await api.get(url);
                    return res.data;
                } catch (error: any) {
                    get().addToast(error.message || '获取审核列表失败', 'error');
                    return [];
                }
            },

            approveUser: async (userId) => {
                try {
                    await api.post(`/api/users/${userId}/approve`);
                    get().addToast('审核已通过', 'success');
                } catch (error: any) {
                    get().addToast(error.message || '操作失败', 'error');
                    throw error;
                }
            },

            rejectUser: async (userId) => {
                try {
                    await api.post(`/api/users/${userId}/reject`);
                    get().addToast('已拒绝申请', 'info');
                } catch (error: any) {
                    get().addToast(error.message || '操作失败', 'error');
                    throw error;
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                set({ currentUser: null });
                get().addToast('已安全退出', 'info');
            },

            initData: async () => {
                const user = get().currentUser;
                if (!user) return;

                await Promise.all([
                    get().fetchCourses(user.role === 'campus_admin' ? user.campus_id : undefined),
                    get().fetchClasses(user.role === 'campus_admin' ? user.campus_id : undefined)
                ]);

                if (user.role === 'student') {
                    await get().fetchMyAssets();
                }

                if (['admin', 'campus_admin'].includes(user.role)) {
                    await Promise.all([
                        get().fetchStudents(),
                        get().fetchTeachers(),
                        get().fetchClassrooms(user.role === 'campus_admin' ? user.campus_id : undefined)
                    ]);
                }

                if (user.role === 'admin') {
                    await get().fetchWorkbenchOverview();
                }
            },

            fetchWorkbenchOverview: async () => {
                try {
                    const res = await api.get('/api/statistics/workbench-overview');
                    set({ workbenchOverview: res.data });
                } catch (error: any) {
                    console.error('Fetch workbench overview failed', error);
                }
            },

            fetchCourses: async (campusId) => {
                try {
                    const res = await api.get('/api/academic/courses', { params: { campusId, pageSize: 200 } });
                    const courses = res.data?.data || res.data;
                    set({ courses: Array.isArray(courses) ? courses : [] });
                } catch (error: any) {
                    console.error('Fetch courses failed', error);
                }
            },
            deleteCourse: async (id) => {
                try {
                    await api.post(`/api/academic/courses/${id}/delete`);
                    get().addToast('课程删除成功', 'success');
                    const user = get().currentUser;
                    await get().fetchCourses(user?.role === 'campus_admin' ? user?.campus_id : undefined);
                } catch (error: any) {
                    get().addToast(error.message || '删除失败', 'error');
                }
            },

            fetchClasses: async (campusId) => {
                try {
                    const res = await api.get('/api/academic/classes', { params: { campusId, pageSize: 200 } });
                    const classes = res.data?.data || res.data;
                    set({ classes: Array.isArray(classes) ? classes : [] });
                } catch (error: any) {
                    console.error('Fetch classes failed', error);
                }
            },

            fetchStudents: async () => {
                try {
                    const res = await api.get('/api/users/students', { params: { pageSize: 200 } });
                    const rawData = res.data?.data || res.data;
                    const students = Array.isArray(rawData) ? rawData : [];
                    // Map backendEduStudent to frontend Student type
                    const mappedStudents: Student[] = students.map((bs: any) => ({
                        id: bs.id,
                        name: bs.name,
                        phone: bs.phone || '',
                        gender: bs.gender === 'FEMALE' ? 'female' : 'male',
                        balance: bs.balance,
                        className: bs.classes?.[0]?.class?.name || '未分班',
                        balanceAmount: bs.balance || 0,
                        balanceLessons: bs.accounts?.reduce((sum: number, acc: any) => sum + acc.remaining_qty, 0) || 0,
                        createdAt: bs.createdAt.split('T')[0],
                        lastStudyTime: '最近学习',
                        status: bs.status === 'ACTIVE' ? 'active' : 'paused'
                    }));
                    set({ students: mappedStudents });
                } catch (error: any) {
                    console.error('Fetch students failed', error);
                }
            },
            fetchTeachers: async (campusId) => {
                try {
                    const res = await api.get(`/api/academic/teachers${campusId ? `?campusId=${campusId}` : ''}`);
                    set({ teachers: res.data });
                } catch (error: any) {
                    get().addToast('获取教师列表失败', 'error');
                }
            },
            fetchClassrooms: async (campusId) => {
                try {
                    const res = await api.get('/api/academic/classrooms', { params: { campusId } });
                    set({ classrooms: res.data });
                } catch (error: any) {
                    console.error('Fetch classrooms failed', error);
                }
            },

            fetchCampuses: async () => {
                try {
                    const res = await api.get('/api/users/campuses');
                    set({ campuses: res.data });
                } catch (error: any) {
                    // silently fail or toast
                }
            },

            fetchMyAssets: async () => {
                try {
                    const res = await api.get('/api/finance/my-assets');
                    const { balance, accounts } = res.data;
                    set({ assetAccounts: accounts });

                    // 如果是学员，根据名下资产反推 EduStudent.id 并存入 currentUser
                    if (Array.isArray(accounts) && accounts.length > 0) {
                        const firstAsset = accounts[0];
                        const state = get();
                        if (state.currentUser && state.currentUser.role === 'student') {
                            set({
                                currentUser: {
                                    ...state.currentUser,
                                    bindStudentId: firstAsset.student_id
                                }
                            });
                            console.log('Updated bindStudentId from assets:', firstAsset.student_id);
                        }
                    }
                } catch (error: any) {
                    console.error('Fetch assets failed', error);
                }
            },

            fetchOrders: async (campusId?: string) => {
                try {
                    const state = get();
                    const isStudent = state.currentUser?.role === 'student';
                    if (isStudent) {
                        const res = await api.get('/api/finance/my-orders');
                        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                        set({ orders: data });
                    } else {
                        const params: any = {};
                        if (campusId) params.campusId = campusId;
                        const res = await api.get('/api/finance/orders', { params });
                        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                        set({ orders: data });
                    }
                } catch (error: any) {
                    console.error('Fetch orders failed', error);
                }
            },

            voidOrder: async (orderId: string) => {
                try {
                    await api.post(`/api/finance/order/${orderId}/void`, {});
                    set(state => ({
                        orders: state.orders.map((o: any) =>
                            o.id === orderId ? { ...o, status: 'VOID' } : o
                        )
                    }));
                    get().addToast('订单已作废', 'success');
                } catch (error: any) {
                    get().addToast(error.message || '作废失败', 'error');
                    throw error;
                }
            },

            fetchAttendanceRecords: async (campusId?: string) => {
                try {
                    const params: any = {};
                    if (campusId) params.campusId = campusId;
                    const res = await api.get('/api/teaching/attendance', { params });
                    const records = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    set({ attendanceRecords: records });
                } catch (error: any) {
                    console.error('Fetch attendance records failed', error);
                }
            },

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

            submitAttendance: async (lesson_id, course_id, class_id, campus_id, records) => {
                try {
                    const data = {
                        lesson_id,
                        attendances: records.map(r => ({
                            student_id: r.student_id,
                            status: r.status.toUpperCase(),
                            deductAmount: r.deductHours
                        }))
                    };
                    await api.post('/api/teaching/attendance', data);
                    get().addToast('考勤登记已同步至后端', 'success');
                    // 重新拉取数据以刷新状态
                    await get().fetchMyAssets();
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                }
            },

            confirmConsumption: async (lessonId) => {
                try {
                    await api.post('/api/teaching/confirm-consumption', { lessonId });
                    get().addToast('课消确认成功，资产已核算', 'success');
                    await get().fetchClasses();
                } catch (error: any) {
                    get().addToast(error.message || '确认失败', 'error');
                    throw error;
                }
            },

            generateDraft: async (classId, startDate, lessonsCount, durationMinutes) => {
                try {
                    // Backend expects 'assignmentId' (classId param here actually holds the assignmentId value)
                    await api.post('/api/academic/classes/schedule-draft', { assignmentId: classId, startDate, lessonsCount, durationMinutes });
                    get().addToast('排课草稿生成成功', 'success');
                    await get().fetchClasses();
                } catch (error: any) {
                    get().addToast(error.message || '生成失败', 'error');
                }
            },

            publishSchedules: async (lessonIds) => {
                try {
                    await api.post('/api/academic/classes/schedule-publish', { lessonIds });
                    get().addToast('排课发布成功，全端同步生效', 'success');
                    await get().fetchClasses();
                } catch (error: any) {
                    get().addToast(error.message || '发布失败', 'error');
                    throw error;
                }
            },

            createOrder: async (orderData) => {
                try {
                    const res = await api.post('/api/finance/order', orderData);
                    return res.data.id;
                } catch (error: any) {
                    get().addToast(error.message || '下单失败', 'error');
                    throw error;
                }
            },

            processPayment: async (paymentData) => {
                try {
                    await api.post('/api/finance/pay', paymentData);
                    get().addToast('支付成功', 'success');
                    await get().fetchMyAssets();
                } catch (error: any) {
                    get().addToast(error.message || '支付失败', 'error');
                    throw error;
                }
            },

            applyRefund: async (refundData) => {
                try {
                    await api.post('/api/finance/refund/apply', refundData);
                    get().addToast('退费申请已提交', 'success');
                    await get().fetchMyAssets();
                } catch (error: any) {
                    get().addToast(error.message || '申请退费失败', 'error');
                    throw error;
                }
            },

            manualRefund: async (data) => {
                try {
                    await api.post('/api/finance/refund/manual', data);
                    get().addToast('退费申请已生成，等待审批', 'success');
                } catch (error: any) {
                    get().addToast(error.message || '手动退费失败', 'error');
                    throw error;
                }
            },

            approveRefund: async (refundId, isApproved) => {
                try {
                    await api.post('/api/finance/refund/approve', { refundId, isApproved });
                    get().addToast(`退费已${isApproved ? '通过' : '驳回'}并处理`, 'success');
                    await get().fetchStudents();
                } catch (error: any) {
                    get().addToast(error.message || '审批退费失败', 'error');
                    throw error;
                }
            },

            getPendingRefunds: async () => {
                try {
                    const res = await api.get('/api/finance/refund/pending');
                    return res.data;
                } catch (error: any) {
                    get().addToast(error.message || '获取退费列表失败', 'error');
                    throw error;
                }
            },

            getAllRefunds: async () => {
                try {
                    const res = await api.get('/api/finance/refund/all');
                    return res.data;
                } catch (error: any) {
                    get().addToast(error.message || '获取退费记录失败', 'error');
                    throw error;
                }
            },

            transferClass: (student_id, account_id, new_class_id) => {
                set((state) => {
                    const newStudents = [...state.students];
                    const studentIdx = newStudents.findIndex(s => s.id === student_id);

                    if (studentIdx === -1) return state;

                    const student = newStudents[studentIdx];
                    const targetClass = state.classes.find(c => c.id === new_class_id);

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
                        account_id: account_id,
                        student_id: student_id,
                        businessType: 'BUY', // 暂借用 BUY 记录资产流入/流转
                        changeQty: 0,
                        balanceSnapshot: student.balanceLessons || 0,
                        refId: `TRANS-TO-${new_class_id}`,
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
                const { campus_id, keyword } = filters || {};

                if (type === 'orders') {
                    return state.orders
                        .filter(o => {
                            if (campus_id && (o as any).campus_id !== campus_id) return false;
                            if (keyword) {
                                const student = state.students.find(s => s.id === o.student_id);
                                const course = state.courses.find(c => c.id === o.course_id);
                                return student?.name.includes(keyword) || o.id.includes(keyword) || course?.name.includes(keyword);
                            }
                            return true;
                        })
                        .map(o => ({
                            ...o,
                            studentName: state.students.find(s => s.id === o.student_id)?.name || '未知',
                            courseName: state.courses.find(c => c.id === o.course_id)?.name || '未知',
                            campusName: (o as any).campus_id // 假设 campus_id 存储的就是校区名称或可映射
                        }));
                }

                if (type === 'attendance') {
                    return state.attendanceRecords.map(r => ({
                        ...r,
                        studentName: state.students.find(s => s.id === r.student_id)?.name || '未知',
                        courseName: state.courses.find(c => c.id === r.course_id)?.name || '未知'
                    }));
                }

                return [];
            },

            getLowBalanceAssetAccounts: (threshold = RENEWAL_WARNING_THRESHOLD) => {
                const { assetAccounts, students, courses } = get();
                return assetAccounts
                    .filter(acc => acc.remaining_qty <= threshold && acc.status === 'ACTIVE')
                    .map(acc => {
                        const student = students.find(s => s.id === acc.student_id);
                        const course = courses.find(c => c.id === acc.course_id);
                        return {
                            ...acc,
                            student_name: student?.name || '未知学员',
                            course_name: course?.name || '未知课程'
                        };
                    });
            },

            publishHomework: async (homeworkData) => {
                try {
                    const res = await api.post('/api/teaching/homeworks', homeworkData);
                    get().addToast('作业发布成功', 'success');
                    return res.data.id;
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                    throw error;
                }
            },

            submitHomework: async (submissionData) => {
                try {
                    const res = await api.post('/api/teaching/homeworks/submit', {
                        homeworkId: submissionData.homework_id,
                        studentId: submissionData.student_id,
                        content: submissionData.content,
                    });
                    get().addToast('作业已提交', 'success');
                    return res.data.id;
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                    throw error;
                }
            },

            gradeHomework: async (submissionId, score, feedback, teacherId) => {
                try {
                    await api.post('/api/teaching/homeworks/grade', { submissionId, score, feedback, teacherId });
                    get().addToast('评分完成', 'success');
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                }
            },

            fetchAnnouncementsAdmin: async () => {
                try {
                    const res = await api.get('/api/announcements/admin/list');
                    set({ announcements: res.data });
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                }
            },

            fetchAnnouncementsActive: async () => {
                try {
                    const res = await api.get('/api/announcements/active');
                    set({ announcements: res.data });
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                }
            },

            createAnnouncement: async (data) => {
                try {
                    const res = await api.post('/api/announcements', data);
                    get().addToast('公告创建成功', 'success');
                    await get().fetchAnnouncementsAdmin();
                    return res.data.id;
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                    throw error;
                }
            },

            updateAnnouncement: async (id, data) => {
                try {
                    await api.put(`/api/announcements/${id}`, data);
                    get().addToast('公告已更新', 'success');
                    await get().fetchAnnouncementsAdmin();
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                    throw error;
                }
            },

            publishAnnouncement: async (id) => {
                try {
                    await api.post(`/api/announcements/${id}/publish`);
                    get().addToast('公告发布成功', 'success');
                    await get().fetchAnnouncementsAdmin();
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                    throw error;
                }
            },

            withdrawAnnouncement: async (id) => {
                try {
                    await api.delete(`/api/users/announcements/${id}`);
                    get().addToast('公告已撤回', 'success');
                    await get().fetchAnnouncementsAdmin();
                } catch (error: any) {
                    get().addToast(error.message, 'error');
                    throw error;
                }
            },

            setClassTeacherFilter: (teacherName) => set({ classTeacherFilter: teacherName }),

            addToast: (message, type) => {
                const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 5);
                set((state) => ({
                    toasts: [...(state.toasts || []), { id, message, type }]
                }));
                // Auto remove after 3s
                setTimeout(() => {
                    set((state) => ({
                        toasts: (state.toasts || []).filter(t => t.id !== id)
                    }));
                }, 3000);
            },

            removeToast: (id) => {
                set((state) => ({
                    toasts: (state.toasts || []).filter(t => t.id !== id)
                }));
            }
        }),
        {
            name: 'eduadmin-storage-v2', // Bumped version to clear corrupted cache and ensure new properties exist
        }
    )
);
