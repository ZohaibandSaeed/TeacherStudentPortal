import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpenCheck, Sparkles, User, LogOut, Shield, FileText, BarChart3 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, switchRole, logout } = useAuth();

  const isTeacher = user?.role === 'TEACHER';

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-zinc-900 text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Editorial Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 bg-zinc-900 text-white font-black text-2xl flex items-center justify-center shadow-editorial group-hover:bg-orange-600 transition-colors">
            Q
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black tracking-tighter text-xl sm:text-2xl italic font-serif-display text-zinc-900">
                QUIZGENIUS.AI
              </span>
            </div>
            <p className="text-[10px] font-mono-code uppercase tracking-wider text-zinc-500 hidden sm:block">
              {isTeacher ? 'Teacher Hub v2.4 • Exam Architecture' : 'Student Portal v2.4 • Timed Assessment'}
            </p>
          </div>
        </div>

        {/* Navigation Links - Editorial Mono Style */}
        <nav className="hidden md:flex items-center space-x-6 text-[11px] font-mono-code font-bold uppercase tracking-[0.15em]">
          {isTeacher ? (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-1 transition-all flex items-center space-x-1.5 ${activeTab === 'dashboard'
                  ? 'text-zinc-900 border-b-2 border-orange-600 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <BookOpenCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className={`py-1 transition-all flex items-center space-x-1.5 ${activeTab === 'upload'
                  ? 'text-zinc-900 border-b-2 border-orange-600 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>OCR Pipeline</span>
              </button>

              <button
                onClick={() => setActiveTab('quizzes')}
                className={`py-1 transition-all flex items-center space-x-1.5 ${activeTab === 'quizzes'
                  ? 'text-zinc-900 border-b-2 border-orange-600 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <FileText className="w-3.5 h-3.5 text-orange-600" />
                <span>Quiz Catalog</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-1 transition-all flex items-center space-x-1.5 ${activeTab === 'analytics'
                  ? 'text-zinc-900 border-b-2 border-orange-600 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-orange-600" />
                <span>Analytics</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-1 transition-all flex items-center space-x-1.5 ${activeTab === 'dashboard'
                  ? 'text-zinc-900 border-b-2 border-orange-600 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <BookOpenCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Assigned Exams</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`py-1 transition-all flex items-center space-x-1.5 ${activeTab === 'history'
                  ? 'text-zinc-900 border-b-2 border-orange-600 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <FileText className="w-3.5 h-3.5 text-orange-600" />
                <span>Scorecard Log</span>
              </button>
            </>
          )}
        </nav>

        {/* Role Switcher & Profile */}
        <div className="flex items-center space-x-4">

          {/* Role Switcher Badge */}
          <div className="flex items-center border-2 border-zinc-900 p-0.5 bg-zinc-100 shadow-editorial text-[10px] font-mono-code font-bold uppercase">
            <button
              onClick={() => {
                switchRole('TEACHER');
                setActiveTab('dashboard');
              }}
              className={`px-2.5 py-1 transition-all flex items-center space-x-1 ${isTeacher
                ? 'bg-zinc-900 text-white font-extrabold shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
                }`}
              title="Switch to Teacher View"
            >
              <Shield className="w-3 h-3 text-orange-400" />
              <span>Teacher</span>
            </button>
            <button
              onClick={() => {
                switchRole('STUDENT');
                setActiveTab('dashboard');
              }}
              className={`px-2.5 py-1 transition-all flex items-center space-x-1 ${!isTeacher
                ? 'bg-zinc-900 text-white font-extrabold shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
                }`}
              title="Switch to Student View"
            >
              <User className="w-3 h-3 text-orange-400" />
              <span>Student</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="hidden lg:flex items-center space-x-3 pl-3 border-l-2 border-zinc-200">
            <div className="text-right leading-tight font-mono-code">
              <div className="text-xs font-extrabold text-zinc-900">{user?.fullName || 'Dr. Jenkins'}</div>
              <div className="text-[9px] text-green-700 font-bold uppercase">PROD_ENV • ONLINE</div>
            </div>
            <div className="w-9 h-9 border-2 border-zinc-900 p-0.5 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-xs text-zinc-900 font-mono-code">
              {(user?.fullName || 'DJ').split(' ').map(n => n[0]).join('')}
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-zinc-100 transition-all border border-transparent hover:border-zinc-300"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center justify-around bg-zinc-50 border-t border-zinc-900 px-2 py-2 text-[10px] font-mono-code font-bold uppercase tracking-wider">
        {isTeacher ? (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 py-1 border ${activeTab === 'dashboard' ? 'bg-zinc-900 text-white border-zinc-900' : 'text-zinc-600 border-zinc-300 bg-white'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-2.5 py-1 border ${activeTab === 'upload' ? 'bg-zinc-900 text-white border-zinc-900' : 'text-zinc-600 border-zinc-300 bg-white'}`}
            >
              OCR Pipeline
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-2.5 py-1 border ${activeTab === 'quizzes' ? 'bg-zinc-900 text-white border-zinc-900' : 'text-zinc-600 border-zinc-300 bg-white'}`}
            >
              Catalog
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-2.5 py-1 border ${activeTab === 'analytics' ? 'bg-zinc-900 text-white border-zinc-900' : 'text-zinc-600 border-zinc-300 bg-white'}`}
            >
              Analytics
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 py-1 border ${activeTab === 'dashboard' ? 'bg-zinc-900 text-white border-zinc-900' : 'text-zinc-600 border-zinc-300 bg-white'}`}
            >
              Exams
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 border ${activeTab === 'history' ? 'bg-zinc-900 text-white border-zinc-900' : 'text-zinc-600 border-zinc-300 bg-white'}`}
            >
              Results
            </button>
          </>
        )}
      </div>
    </header>
  );
};
