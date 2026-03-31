
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CourseManagement } from './components/CourseManagement';
import { StudentManagement } from './components/StudentManagement';
import { StudentDetailView } from './components/StudentDetailView';
import { ClassManagement } from './components/ClassManagement';
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
import { StudentHomework } from './components/StudentHomework';
import { TeacherApproval } from './components/TeacherApproval';
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

const App: React.FC = () => {
  const { currentUser, logout, fetchAnnouncementsActive, announcements } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [popupAnnouncements, setPopupAnnouncements] = useState<Announcement[]>([]);

  // Derive role from store
  const userRole = currentUser?.role || 'admin';

  const handleLogin = async (role: string) => {
    setIsAuthenticated(true);
    if (role === 'student') setActiveView('student-dashboard');
    else if (role === 'teacher') setActiveView('teaching');
    else if (role === 'campus_admin') setActiveView('teaching');
    else setActiveView('dashboard');

    // Show announcement popup for campus_admin on first login
    if (role === 'campus_admin') {
      try {
        await fetchAnnouncementsActive();
        // We'll pick up from the store state after fetch, via useEffect
        setShowAnnouncementPopup(true);
      } catch (err) {
        console.warn('Failed to load announcements for popup', err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setActiveView('dashboard');
  };

  const handleShowDetail = (student: Student) => {
    setSelectedStudent(student);
    setActiveView('student-detail');
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    setActiveView('students');
  };

  const handleEnterAttendance = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveView('attendance-registration');
  };

  const handleEnterConsumption = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveView('lesson-consumption');
  };

  useEffect(() => {
    // If we have a currentUser in store (from persistence), set authenticated
    if (currentUser) {
      setIsAuthenticated(true);
      if (currentUser.role === 'student' && activeView === 'dashboard') {
        setActiveView('student-dashboard');
      } else if (currentUser.role === 'campus_admin' && activeView === 'dashboard') {
        setActiveView('teaching');
      }
    }
  }, [currentUser]);

  // Sync popup announcements once fetched
  useEffect(() => {
    if (showAnnouncementPopup && announcements.length > 0) {
      setPopupAnnouncements(announcements);
    }
  }, [showAnnouncementPopup, announcements]);

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
          onClose={() => setShowAnnouncementPopup(false)}
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
                      onMaterials={() => setActiveView('student-learning')}
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
              {activeView === 'classes' && <ClassManagement />}
              {activeView === 'teaching' && (userRole === 'admin' || userRole === 'campus_admin') && (
                <ScheduleManagement onEnterAttendance={handleEnterAttendance} onEnterConsumption={handleEnterConsumption} />
              )}
              {activeView === 'schedule' && userRole === 'teacher' && (
                <ScheduleManagement onEnterAttendance={handleEnterAttendance} />
              )}
              {activeView === 'stats' && <StatisticsOverview />}
              {activeView === 'report-details' && <ReportDetails />}
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
              {activeView === 'student-homework' && userRole === 'student' && <StudentHomework />}
              {activeView === 'teacher-registration' && userRole === 'campus_admin' && (
                <TeacherRegistration onNavigate={(id) => setActiveView(id)} />
              )}
              {activeView === 'teacher-approval' && userRole === 'campus_admin' && (
                <TeacherApproval onBack={() => setActiveView('teaching')} />
              )}
              {activeView === 'refund-management' && <RefundManagement />}
              {activeView === 'finance-report' && <FinanceReport onNavigate={setActiveView} onViewOrder={(id) => { setSelectedOrderId(id); setActiveView('order-detail'); }} />}
              {activeView === 'announcemnt-mgmt' && userRole === 'admin' && <AnnouncementMgmt />}
              {activeView === 'announcement-view' && (userRole === 'admin' || userRole === 'campus_admin') && <AnnouncementView />}
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
              {activeView === 'payments' && (userRole === 'admin' || userRole === 'campus_admin') && <Payments />}
              {activeView === 'order-detail' && <OrderDetailView orderId={selectedOrderId || 'ORD-001'} onBack={() => setActiveView('payments')} />}
              {activeView === 'students' && <StudentManagement onShowDetail={handleShowDetail} />}
              {activeView === 'student-detail' && selectedStudent && <StudentDetailView student={selectedStudent} onBack={handleBackToList} />}

              {/* Fallback */}
              {!['dashboard', 'courses', 'students', 'student-detail', 'attendance-module', 'classes', 'payments', 'order-detail', 'teaching', 'attendance-registration', 'lesson-consumption', 'stats', 'report-details', 'student-learning', 'student-dashboard', 'course-study', 'online-quiz', 'campus-list', 'roles', 'logs', 'help-center', 'schedule', 'resources', 'my-stats', 'student-schedule', 'student-orders', 'student-notifications', 'student-market', 'teacher-homework', 'student-homework', 'teacher-registration', 'teacher-approval', 'refund-management', 'finance-report', 'announcemnt-mgmt', 'announcement-view', 'course-standard', 'course-resource'].includes(activeView) && (
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
