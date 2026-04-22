/**
 * 应用根组件 App
 * 作用：
 *   1. 按登录状态切换 Login 页 / 主应用布局
 *   2. 基于 activeView + userRole 做总路由分发，渲染对应业务模块
 *   3. 管理选中学员、订单、课次、课程等跨模块状态
 *   4. 登录后恢复会话、拉取未读公告弹窗
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CourseManagement } from './components/CourseManagement';
import { StudentManagement } from './components/StudentManagement';
import { StudentDetailView } from './components/StudentDetailView';
import { ClassManagement } from './components/ClassManagement';
import { TeacherClassView } from './components/TeacherClassView';
import { OrderCreation } from './components/OrderCreation';
import { OrderDetailView } from './components/OrderDetailView';
import { ScheduleManagement } from './components/ScheduleManagement';
import { AttendanceRegistration } from './components/AttendanceRegistration';
import { AttendanceDashboard } from './components/AttendanceDashboard';
import { LessonConsumption } from './components/LessonConsumption';
import { StatisticsOverview } from './components/StatisticsOverview';
import { ReportDetails } from './components/ReportDetails';
import { StudentLearningHome } from './components/StudentLearningHome';
import { CourseStudyView } from './components/CourseStudyView';
import { QuizView } from './components/QuizView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { Login } from './components/Login';
import { CampusManagement } from './components/CampusManagement';
import { RolePermission } from './components/RolePermission';
import { AuditLogs } from './components/AuditLogs';
import { HelpCenter } from './components/HelpCenter';
import { ResourceLibrary } from './components/ResourceLibrary';
import { TeacherStats } from './components/TeacherStats';
import { StudentOrders } from './components/StudentOrders';
import { StudentNotifications } from './components/StudentNotifications';
import { CourseMarketplace } from './components/CourseMarketplace';
import { CoursePreviewPage } from './components/CoursePreviewPage';
import { TeacherHomeworkMgmt } from './components/TeacherHomeworkMgmt';
import { LeaveApproval } from './components/LeaveApproval';
import { StudentHomework } from './components/StudentHomework';
import { StudentClassMaterials } from './components/StudentClassMaterials';
import { TeacherApproval } from './components/TeacherApproval';
import { StudentApproval } from './components/StudentApproval';
import { TeacherRegistration } from './components/TeacherRegistration';
import { RefundManagement } from './components/RefundManagement';
import { FinanceReport } from './components/FinanceReport';
import { Payments } from './components/Payments';
import { AnnouncementMgmt } from './components/AnnouncementMgmt';
import { AnnouncementView } from './components/AnnouncementView';
import { AnnouncementPopup } from './components/AnnouncementPopup';
import { CourseStandardMgmt } from './components/CourseStandardMgmt';
import { CourseResourceMgmt } from './components/CourseResourceMgmt';
import { ToastContainer } from './components/ToastContainer';
import { Student, Announcement } from './types';
import { ClipboardList } from 'lucide-react';
import { useStore } from './store';
import { setActiveRole, getActiveRole, getTokenForRole } from './utils/session';

// 根组件：整合全局状态、路由分发、公告弹窗等顶层逻辑
const App: React.FC = () => {
  const { currentUser, logout, fetchAnnouncementsActive, fetchUnreadAnnouncements, markAnnouncementRead, announcements, initData } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetailReturnView, setOrderDetailReturnView] = useState('payments-orders');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [popupAnnouncements, setPopupAnnouncements] = useState<Announcement[]>([]);

  // Derive role from store
  const userRole = currentUser?.role || 'admin';

  // 登录成功回调：根据角色跳转初始视图，并拉取未读公告弹窗（学员除外）
  const handleLogin = async (role: string) => {
    setIsAuthenticated(true);
    if (role === 'student') setActiveView('student-dashboard');
    else if (role === 'teacher') setActiveView('teaching');
    else if (role === 'campus_admin') setActiveView('teaching');
    else setActiveView('dashboard');

    // Show unread announcement popup on login (all roles except student)
    if (role !== 'student') {
      try {
        const unread = await fetchUnreadAnnouncements();
        if (unread.length > 0) {
          setPopupAnnouncements(unread);
          setShowAnnouncementPopup(true);
        }
      } catch (err) {
        console.warn('Failed to load announcements for popup', err);
      }
    }
  };

  // 退出登录：清空 store 会话、重置视图至 dashboard
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setActiveView('dashboard');
  };

  // 打开学员详情页
  const handleShowDetail = (student: Student) => {
    setSelectedStudent(student);
    setActiveView('student-detail');
  };

  // 从学员详情返回学员列表
  const handleBackToList = () => {
    setSelectedStudent(null);
    setActiveView('students');
  };

  // 进入考勤登记页（教师端从课程卡点击进入）
  const handleEnterAttendance = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveView('attendance-registration');
  };

  // 进入课消确认页（管理员确认课时扣减）
  const handleEnterConsumption = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveView('lesson-consumption');
  };

  // 页面刷新后的会话恢复：根据持久化的 currentUser + token 自动登录并重新拉取数据
  useEffect(() => {
    // If we have a currentUser in store (from persistence / page refresh), restore full session
    if (currentUser && !isAuthenticated) {
      // 确保 active role 与当前恢复的用户一致
      setActiveRole(currentUser.role);
      // 验证该角色的 token 仍然存在
      if (!getTokenForRole(currentUser.role)) return; // token 已过期/清除，不恢复

      setIsAuthenticated(true);
      if (currentUser.role === 'student' && activeView === 'dashboard') {
        setActiveView('student-dashboard');
      } else if ((currentUser.role === 'campus_admin' || currentUser.role === 'teacher') && activeView === 'dashboard') {
        setActiveView('teaching');
      }
      // Re-fetch all data that was loaded during login (store data is lost on refresh)
      initData();
    }
  }, [currentUser]);

  // (popup announcements set directly from fetchUnreadAnnouncements in handleLogin)

  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <ToastContainer />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      {/* Announcement popup for campus_admin on first login */}
      {showAnnouncementPopup && popupAnnouncements.length > 0 && (
        <AnnouncementPopup
          announcements={popupAnnouncements}
          onClose={() => {
            // 标记所有弹出的公告为已读
            popupAnnouncements.forEach(a => markAnnouncementRead(a.id));
            setShowAnnouncementPopup(false);
          }}
        />
      )}
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          toggle={() => setIsSidebarOpen(!isSidebarOpen)}
          activeId={activeView}
          userRole={userRole}
          onNavigate={(id) => {
            setActiveView(id);
            setSelectedStudent(null);
            setSelectedOrderId(null);
            setSelectedLessonId(null);
            setSelectedCourseId(null);
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            onLogout={handleLogout}
            onNavigate={setActiveView}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            userRole={userRole}
          />
          <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 bg-[#F8FAFC]">
            <div className="max-w-[1440px] mx-auto h-full">
              {/* Core Dashboards by Role */}
              {activeView === 'dashboard' && userRole === 'admin' && <Dashboard onNavigate={setActiveView} />}
              {activeView === 'teaching' && userRole === 'teacher' && (
                <TeacherDashboard
                  onEnterAttendance={handleEnterAttendance}
                  onViewSchedule={() => setActiveView('schedule')}
                />
              )}
              {activeView === 'student-dashboard' && userRole === 'student' && (
                <div className="p-4 border border-red-100/10">
                  {console.log('App.tsx: Rendering StudentDashboard, userRole:', userRole, 'activeView:', activeView)}
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <StudentDashboard
                      onRenew={() => setActiveView('student-orders')}
                      onLeave={() => setActiveView('student-notifications')}
                      onHomework={() => setActiveView('student-homework')}
                      onMaterials={() => setActiveView('student-materials')}
                      onContact={() => window.alert('客服热线: 400-123-4567')}
                      onEnterLearning={() => setActiveView('student-learning')}
                    />
                  </React.Suspense>
                </div>
              )}

              {/* Student Learning Flow */}
              {activeView === 'student-learning' && (
                <StudentLearningHome onSelectCourse={(id) => {
                  setSelectedCourseId(id);
                  setActiveView('course-study');
                }} />
              )}
              {activeView === 'course-study' && selectedCourseId && (
                <CourseStudyView
                  courseId={selectedCourseId}
                  onBack={() => setActiveView('student-learning')}
                />
              )}
              {activeView === 'online-quiz' && (
                <QuizView
                  chapterTitle="原子化设计规范与 Figma 核心工具"
                  onBack={() => setActiveView('course-study')}
                  onSubmit={() => {
                    alert('测验已成功提交！得分：92/100，击败了 95% 的学员。');
                    setActiveView('course-study');
                  }}
                />
              )}

              {/* Admin Modules */}
              {activeView === 'campus-list' && <CampusManagement />}
              {activeView === 'roles' && <RolePermission />}
              {activeView === 'logs' && <AuditLogs />}
              {activeView === 'help-center' && <HelpCenter />}
              {activeView === 'courses' && <CourseManagement />}
              {activeView === 'classes' && userRole === 'teacher' && <TeacherClassView />}
              {activeView === 'classes' && userRole !== 'teacher' && <ClassManagement />}
              {activeView === 'teaching' && (userRole === 'admin' || userRole === 'campus_admin') && (
                <ScheduleManagement onEnterAttendance={handleEnterAttendance} onEnterConsumption={handleEnterConsumption} />
              )}
              {activeView === 'schedule' && userRole === 'teacher' && (
                <ScheduleManagement onEnterAttendance={handleEnterAttendance} />
              )}
              {activeView === 'stats' && <StatisticsOverview />}
              {activeView === 'report-details' && <ReportDetails onViewOrder={(id) => { setSelectedOrderId(id); setActiveView('order-detail'); }} />}
              {activeView === 'attendance-module' && <AttendanceDashboard onRegister={handleEnterAttendance} onNavigate={setActiveView} />}
              {activeView === 'resources' && <ResourceLibrary />}
              {activeView === 'my-stats' && <TeacherStats />}
              {activeView === 'student-schedule' && userRole === 'student' && <ScheduleManagement />}
              {activeView === 'student-orders' && userRole === 'student' && <StudentOrders onNavigate={setActiveView} />}
              {activeView === 'student-notifications' && userRole === 'student' && <StudentNotifications />}
              {activeView === 'student-market' && userRole === 'student' && <CourseMarketplace onViewCourse={(id) => { setSelectedCourseId(id); setActiveView('course-preview'); }} />}
              {activeView === 'course-preview' && selectedCourseId && (
                <CoursePreviewPage
                  courseId={selectedCourseId}
                  onBack={() => setActiveView('student-market')}
                  onStartStudy={(id) => { setSelectedCourseId(id); setActiveView('course-study'); }}
                />
              )}
              {activeView === 'teacher-homework' && userRole === 'teacher' && <TeacherHomeworkMgmt />}
              {activeView === 'leave-approval' && (userRole === 'teacher' || userRole === 'campus_admin') && <LeaveApproval />}
              {activeView === 'student-homework' && userRole === 'student' && <StudentHomework />}
              {activeView === 'student-materials' && userRole === 'student' && <StudentClassMaterials />}
              {activeView === 'teacher-registration' && userRole === 'campus_admin' && (
                <TeacherRegistration onNavigate={(id) => setActiveView(id)} />
              )}
              {activeView === 'teacher-approval' && (userRole === 'campus_admin' || userRole === 'admin') && (
                <TeacherApproval onBack={() => setActiveView('teaching')} />
              )}
              {activeView === 'student-approval' && (userRole === 'campus_admin' || userRole === 'admin') && (
                <StudentApproval onBack={() => setActiveView('students')} />
              )}
              {activeView === 'refund-management' && <RefundManagement />}
              {activeView === 'finance-report' && <FinanceReport onNavigate={setActiveView} onViewOrder={(id) => { setSelectedOrderId(id); setOrderDetailReturnView('finance-report'); setActiveView('order-detail'); }} />}
              {activeView === 'announcemnt-mgmt' && (userRole === 'admin' || userRole === 'campus_admin') && <AnnouncementMgmt />}
              {activeView === 'announcement-view' && (userRole === 'admin' || userRole === 'campus_admin' || userRole === 'teacher') && <AnnouncementView />}
              {activeView === 'course-standard' && userRole === 'admin' && <CourseStandardMgmt />}
              {activeView === 'course-resource' && (userRole === 'admin' || userRole === 'campus_admin') && <CourseResourceMgmt />}

              {/* Sub Views */}
              {activeView === 'attendance-registration' && (
                <AttendanceRegistration
                  lessonId={selectedLessonId || 'L101'}
                  onBack={() => setActiveView(userRole === 'teacher' ? 'teaching' : 'attendance-module')}
                />
              )}
              {activeView === 'lesson-consumption' && (
                <LessonConsumption lessonId={selectedLessonId || 'L101'} onBack={() => setActiveView('teaching')} />
              )}
              {activeView === 'payments' && (userRole === 'admin' || userRole === 'campus_admin') && <Payments onViewOrder={(id) => { setSelectedOrderId(id); setOrderDetailReturnView('payments'); setActiveView('order-detail'); }} />}
              {activeView === 'payments-orders' && (userRole === 'admin' || userRole === 'campus_admin') && <Payments initialTab="orders" onViewOrder={(id) => { setSelectedOrderId(id); setOrderDetailReturnView('payments-orders'); setActiveView('order-detail'); }} />}
              {activeView === 'order-detail' && <OrderDetailView orderId={selectedOrderId || 'ORD-001'} onBack={() => setActiveView(orderDetailReturnView)} onViewStudent={(s) => { setSelectedStudent(s); setActiveView('student-detail'); }} />}
              {activeView === 'students' && <StudentManagement onShowDetail={handleShowDetail} />}
              {activeView === 'student-detail' && selectedStudent && <StudentDetailView student={selectedStudent} onBack={handleBackToList} />}

              {/* Fallback */}
              {!['dashboard', 'courses', 'students', 'student-detail', 'attendance-module', 'classes', 'payments', 'order-detail', 'teaching', 'attendance-registration', 'lesson-consumption', 'stats', 'report-details', 'student-learning', 'student-dashboard', 'course-study', 'online-quiz', 'campus-list', 'roles', 'logs', 'help-center', 'schedule', 'resources', 'my-stats', 'student-schedule', 'student-orders', 'student-notifications', 'student-market', 'teacher-homework', 'student-homework', 'teacher-registration', 'teacher-approval', 'refund-management', 'finance-report', 'announcemnt-mgmt', 'announcement-view', 'course-standard', 'course-resource', 'course-preview', 'payments-orders', 'student-approval', 'leave-approval', 'student-materials'].includes(activeView) && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-2xl border border-slate-100">
                  <ClipboardList size={48} className="opacity-10 mb-4" />
                  <p className="text-xl font-bold text-slate-600">模块开发中</p>
                  <button onClick={() => {
                    if (userRole === 'admin') setActiveView('dashboard');
                    else if (userRole === 'student') setActiveView('student-dashboard');
                    else setActiveView('teaching');
                  }} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">返回首页</button>
                </div>
              )}
            </div>
          </main>
        </div>

      </div>
    </>
  );
};

export default App;
