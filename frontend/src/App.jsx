import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginRegister } from './pages/LoginRegister';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { VerifyDegree } from './pages/VerifyDegree';
import { GraduationCap, LogOut, User, ShieldCheck, Sun, Moon } from 'lucide-react';

// Protected Route Component for Auth checking
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Navbar Component with Light/Dark Mode Controller
const NavigationBar = () => {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <GraduationCap size={32} color="var(--color-primary)" />
        <span className="gradient-text" style={{ fontWeight: 800 }}>IQRA TrustLedger</span>
      </Link>
      
      <div className="nav-links">
        {user && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(99, 102, 241, 0.05)', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            border: '1px solid var(--border-glass)' 
          }}>
            <User size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{user.name}</span>
            <span className="badge" style={{ 
              fontSize: '0.65rem', 
              padding: '2px 6px',
              backgroundColor: user.role === 'admin' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
              color: user.role === 'admin' ? 'var(--color-secondary)' : 'var(--color-primary)',
              border: user.role === 'admin' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(99,102,241,0.2)'
            }}>
              {user.role}
            </span>
          </div>
        )}

        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary" 
          style={{ 
            padding: '0', 
            borderRadius: '50%', 
            width: '38px', 
            height: '38px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid var(--border-glass)'
          }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        {user && (
          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px', border: '1px solid var(--border-glass)' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        )}
      </div>
    </nav>
  );
};

// Core Router Layout
const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="app-container bg-glow-container">
      <NavigationBar />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <LoginRegister /> : <Navigate to="/" replace />} />
        <Route path="/verify/:hash" element={<VerifyDegree />} />
        
        {/* Role-Based Hub Redirect */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />}
            </ProtectedRoute>
          } 
        />

        {/* Student Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
