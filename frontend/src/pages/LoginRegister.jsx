import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleValidation = () => {
    if (!email.toLowerCase().endsWith('@iqra.edu.pk')) {
      setFormError('Access is strictly restricted to @iqra.edu.pk email addresses.');
      return false;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return false;
    }
    if (!isLogin && !name) {
      setFormError('Please enter your name.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    if (isLogin) {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setFormError(result.message);
      }
    } else {
      const result = await register(name, email, password);
      if (result.success) {
        navigate('/');
      } else {
        setFormError(result.message);
      }
    }
  };

  return (
    <div className="bg-glow-container" style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '50%', display: 'inline-flex', justifyContent: 'center', color: '#6366f1' }}>
            <GraduationCap size={40} />
          </div>
          <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginTop: '12px' }}>IQRA University</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Hybrid Blockchain Degree Issuance & Verification</p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)' }}>
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setFormError(''); }}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'none', 
              border: 'none', 
              color: isLogin ? 'var(--text-primary)' : 'var(--text-muted)', 
              fontWeight: 600, 
              borderBottom: isLogin ? '2px solid var(--color-primary)' : 'none',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setFormError(''); }}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'none', 
              border: 'none', 
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-muted)', 
              fontWeight: 600, 
              borderBottom: !isLogin ? '2px solid var(--color-primary)' : 'none',
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
        </div>

        {formError && (
          <div className="alert-danger">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '44px', width: '100%' }}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">University Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                className="form-input" 
                placeholder="username@iqra.edu.pk" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px', width: '100%' }}
                required
              />
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Email registration is restricted strictly to @iqra.edu.pk domains.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px', width: '100%' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#9ca3af' }}>
          {isLogin ? (
            <p>Don't have an @iqra.edu.pk account? <span onClick={() => { setIsLogin(false); setFormError(''); }} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 500 }}>Sign Up</span></p>
          ) : (
            <p>Already have an account? <span onClick={() => { setIsLogin(true); setFormError(''); }} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 500 }}>Sign In</span></p>
          )}
        </div>

      </div>
    </div>
  );
};
