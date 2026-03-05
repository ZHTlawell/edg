
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
import { StaffAllocation } from './components/StaffAllocation';
import { RolePermission } from './components/RolePermission';
import { AuditLogs } from './components/AuditLogs';
import { HelpCenter } from './components/HelpCenter';
import { ResourceLibrary } from './components/ResourceLibrary';
import { TeacherStats } from './components/TeacherStats';
import { StudentOrders } from './components/StudentOrders';
import { StudentNotifications } from './components/StudentNotifications';
import { CourseMarketplace } from './components/CourseMarketplace';
import { Student } from './types';
import { ClipboardList } from 'lucide-react';
import { useStore } from './store';

const App: React.FC = () => {
  const { currentUser, logout } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Derive role from store
  const userRole = currentUser?.role || 'admin';

  const handleLogin = (role: string) => {
    setIsAuthenticated(true);
    if (role === 'student') setActiveView('student-dashboard');
    else if (role === 'teacher') setActiveView('teaching');
    else setActiveView('dashboard');
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
      }
    }
  }, [currentUser]);

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
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
        <Header onLogout={handleLogout} onNavigate={(id) => setActiveView(id)} userRole={userRole} />

        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 bg-[#F8FAFC]">
          <div className="max-w-[1440px] mx-auto h-full">
            {/* Core Dashboards by Role */}
            {activeView === 'dashboard' && (userRole === 'admin' || userRole === 'campus_admin') && <Dashboard />}
            {activeView === 'teaching' && userRole === 'teacher' && (
              <TeacherDashboard
                onEnterAttendance={handleEnterAttendance}
                onViewSchedule={() => setActiveView('schedule')}
              />
            )}
            {activeView === 'student-dashboard' && userRole === 'student' && (
              <StudentDashboard
                onRenew={() => setActiveView('student-orders')}
                onLeave={() => setActiveView('student-notifications')}
                onHomework={() => setActiveView('student-learning')}
                onMaterials={() => setActiveView('student-learning')}
                onContact={() => window.alert('客服热线: 400-123-4567')}
                onEnterLearning={() => setActiveView('student-learning')}
              />
            )}

            {/* Student Learning Flow */}
            {activeView === 'student-learning' && (
              <StudentLearningHome onSelectCourse={(id) => {
                setSelectedCourseId(id);
                setActiveView('course-study');
              }} />
            )}
            {activeView === 'course-study' && (
              <CourseStudyView
                onBack={() => setActiveView('student-learning')}
                onStartQuiz={() => setActiveView('online-quiz')}
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
            {activeView === 'admin-list' && <StaffAllocation />}
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
            {activeView === 'attendance-module' && <AttendanceDashboard onRegister={handleEnterAttendance} />}
            {activeView === 'resources' && <ResourceLibrary />}
            {activeView === 'my-stats' && <TeacherStats />}
            {activeView === 'student-schedule' && userRole === 'student' && <ScheduleManagement />}
            {activeView === 'student-orders' && userRole === 'student' && <StudentOrders />}
            {activeView === 'student-notifications' && userRole === 'student' && <StudentNotifications />}
            {activeView === 'student-market' && userRole === 'student' && <CourseMarketplace />}

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
            {activeView === 'payments' && (
              <OrderCreation
                onBack={() => setActiveView('dashboard')}
                onSuccess={(orderId) => { setSelectedOrderId(orderId); setActiveView('order-detail'); }}
              />
            )}
            {activeView === 'order-detail' && <OrderDetailView orderId={selectedOrderId || 'ORD-001'} onBack={() => setActiveView('payments')} />}
            {activeView === 'students' && <StudentManagement onShowDetail={handleShowDetail} />}
            {activeView === 'student-detail' && selectedStudent && <StudentDetailView student={selectedStudent} onBack={handleBackToList} />}

            {/* Fallback */}
            {!['dashboard', 'courses', 'students', 'student-detail', 'attendance-module', 'classes', 'payments', 'order-detail', 'teaching', 'attendance-registration', 'lesson-consumption', 'stats', 'report-details', 'student-learning', 'student-dashboard', 'course-study', 'online-quiz', 'campus-list', 'admin-list', 'roles', 'logs', 'help-center', 'schedule', 'resources', 'my-stats', 'student-schedule', 'student-orders', 'student-notifications', 'student-market'].includes(activeView) && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-2xl border border-slate-100">
                <ClipboardList size={48} className="opacity-10 mb-4" />
                <p className="text-xl font-bold text-slate-600">模块开发中</p>
                <button onClick={() => setActiveView((userRole === 'admin' || userRole === 'campus_admin') ? 'dashboard' : 'student-dashboard')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">返回首页</button>
              </div>
            )}
          </div>
        </main>
      </div>

    </div>
  );
};

export default App;
