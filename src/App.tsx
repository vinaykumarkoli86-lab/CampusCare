import { useCallback, useEffect, useState } from 'react';
import type { OverviewStats, UserPublic } from './types';
import { api, getStoredToken } from './lib/api';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AuthModal } from './components/AuthModal';
import { Homepage } from './components/Homepage';
import { StudentDashboard } from './components/StudentDashboard';

type AppView = 'home' | 'admin-login' | 'admin-dashboard' | 'student-dashboard';

function pathToView(pathname: string): AppView {
  if (pathname === '/admin/login') return 'admin-login';
  if (pathname === '/admin/dashboard' || pathname === '/admin') return 'admin-dashboard';
  if (pathname === '/student/dashboard' || pathname === '/dashboard') return 'student-dashboard';
  return 'home';
}

function viewToPath(view: AppView): string {
  switch (view) {
    case 'admin-login':
      return '/admin/login';
    case 'admin-dashboard':
      return '/admin/dashboard';
    case 'student-dashboard':
      return '/student/dashboard';
    default:
      return '/';
  }
}

export default function App() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<AppView>(() => pathToView(window.location.pathname));

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const navigate = useCallback((nextView: AppView) => {
    setView(nextView);
    const targetPath = viewToPath(nextView);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setView(pathToView(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await api.getPublicOverview();
      setOverview(data);
    } catch {
      // Keep graceful state
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    api
      .me()
      .then((res) => {
        setUser(res.user);
        const requestedView = pathToView(window.location.pathname);
        if (res.user.role === 'admin') {
          if (requestedView !== 'home') {
            navigate('admin-dashboard');
          }
        } else {
          // Student session: never allow admin views
          if (requestedView === 'admin-dashboard' || requestedView === 'admin-login') {
            navigate('student-dashboard');
          }
        }
      })
      .catch(() => {
        api.logout();
        setUser(null);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, [navigate]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleQuickStudentDemo = async () => {
    try {
      const res = await api.login('aarav.sharma@campus.edu', 'student123');
      setUser(res.user);
      navigate('student-dashboard');
    } catch {
      handleOpenAuth('login');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('home');
    loadOverview();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#050914] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-display text-lg font-bold text-white tracking-tight">CAMPUSCARE</p>
          <p className="text-xs text-slate-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Dedicated Secure Admin Login Page
  if (view === 'admin-login') {
    if (user?.role === 'admin') {
      return (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          onGoHome={() => {
            navigate('home');
            loadOverview();
          }}
        />
      );
    }

    return (
      <AdminLoginPage
        currentUser={user}
        onSuccess={(adminUser) => {
          setUser(adminUser);
          navigate('admin-dashboard');
        }}
        onBackHome={() => navigate('home')}
        onGoToStudentDashboard={() => navigate('student-dashboard')}
      />
    );
  }

  // Protected Admin Dashboard Route
  if (view === 'admin-dashboard') {
    if (user?.role === 'admin') {
      return (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          onGoHome={() => {
            navigate('home');
            loadOverview();
          }}
        />
      );
    }
    // Block unauthenticated or student access to Admin Dashboard
    return (
      <AdminLoginPage
        currentUser={user}
        onSuccess={(adminUser) => {
          setUser(adminUser);
          navigate('admin-dashboard');
        }}
        onBackHome={() => navigate('home')}
        onGoToStudentDashboard={() => navigate('student-dashboard')}
      />
    );
  }

  // Student Dashboard Route
  if (view === 'student-dashboard' && user) {
    if (user.role === 'admin') {
      return (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          onGoHome={() => {
            navigate('home');
            loadOverview();
          }}
        />
      );
    }
    return (
      <StudentDashboard
        user={user}
        onLogout={handleLogout}
        onGoHome={() => {
          navigate('home');
          loadOverview();
        }}
      />
    );
  }

  return (
    <>
      <Homepage
        user={user}
        overview={overview}
        loadingOverview={loadingOverview}
        onGetStarted={() => handleOpenAuth('register')}
        onOpenAuth={handleOpenAuth}
        onOpenAdminLogin={() => navigate('admin-login')}
        onEnterDashboard={() =>
          navigate(user?.role === 'admin' ? 'admin-dashboard' : 'student-dashboard')
        }
        onQuickStudentDemo={handleQuickStudentDemo}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          navigate(loggedInUser.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
        }}
      />
    </>
  );
}
