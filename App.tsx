
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CourseManagement } from './components/CourseManagement';
import { StudentManagement } from './components/StudentManagement';
import { StudentDetailView } from './components/StudentDetailView';
import { Login } from './components/Login';
import { Student } from './types';
import { ClipboardList, CalendarCheck } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleShowDetail = (student: Student) => {
    setSelectedStudent(student);
    setActiveView('student-detail');
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    setActiveView('students');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        activeId={activeView}
        onNavigate={(id) => {
          setActiveView(id);
          setSelectedStudent(null);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 bg-[#F8FAFC]">
          <div className="max-w-[1440px] mx-auto">
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'courses' && <CourseManagement />}
            
            {/* Student Management Context */}
            {activeView === 'students' && (
              <StudentManagement onShowDetail={handleShowDetail} />
            )}
            
            {/* Detailed view - Accessed via Student List action */}
            {activeView === 'student-detail' && selectedStudent && (
              <StudentDetailView 
                student={selectedStudent} 
                onBack={handleBackToList} 
              />
            )}

            {activeView === 'attendance-module' && (
              <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 space-y-4 bg-white rounded-3xl border border-slate-200 border-dashed">
                <CalendarCheck size={64} className="opacity-10" />
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-600">全校考勤中心</h3>
                  <p className="text-sm">支持人脸识别考勤、RFID刷卡考勤同步。功能开发中，敬请期待。</p>
                </div>
              </div>
            )}
            
            {!['dashboard', 'courses', 'students', 'student-detail', 'attendance-module'].includes(activeView) && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-100">
                <ClipboardList size={48} className="opacity-10 mb-4" />
                <p className="text-xl font-bold text-slate-600">模块开发中</p>
                <p className="text-sm">该功能目前处于 Internal Beta 测试阶段</p>
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  返回主控台
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
