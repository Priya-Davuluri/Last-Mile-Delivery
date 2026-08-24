import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { LogIn, Lock, Mail, AlertCircle, Shield, Truck, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = location.state?.from?.pathname || null;

  // Handle Google OAuth callback redirect parameters
  useEffect(() => {
    const googleToken = searchParams.get('google_token') || searchParams.get('token');
    const role = searchParams.get('role');
    const name = searchParams.get('name');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setFormError(decodeURIComponent(oauthError));
    } else if (googleToken) {
      setAuthSession(googleToken, { role: role || 'customer', name: name || 'Google User' });
      const roleDashboardMap = {
        admin: '/admin/dashboard',
        agent: '/agent/dashboard',
        customer: '/customer/dashboard',
      };
      navigate(roleDashboardMap[role] || '/customer/dashboard', { replace: true });
    }
  }, [searchParams, setAuthSession, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // Redirect to appropriate dashboard based on role
        if (result.user.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else if (result.user.role === 'agent') navigate('/agent/dashboard', { replace: true });
        else navigate('/customer/dashboard', { replace: true });
      }
    } else {
      setFormError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFormError('');
  };

  return (
    <div className="main-content flex items-center justify-between" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '1rem',
                boxShadow: '0 4px 20px var(--primary-glow)',
              }}
            >
              <LogIn size={26} />
            </div>
            <h2>Welcome Back</h2>
            <p style={{ marginTop: '0.4rem' }}>Log in to access your delivery portal</p>
          </div>

          {formError && (
            <div
              className="flex items-center gap-2"
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  id="email-input"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password-input">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  id="password-input"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
              disabled={isSubmitting}
              id="login-submit-btn"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Social Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Or Continue With
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Google Sign-In Button */}
          <GoogleAuthButton text="Sign in with Google" />

          {/* Quick Credential Helper / Demo Badges */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.75rem', textAlign: 'center' }}>
              Quick Fill Demo Accounts (After Running Seed):
            </div>
            <div className="flex gap-2 justify-between">
              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1"
                style={{ flex: 1, fontSize: '0.75rem' }}
                onClick={() => handleDemoFill('admin@lastmile.com', 'admin123')}
              >
                <Shield size={14} style={{ color: 'var(--danger)' }} /> Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1"
                style={{ flex: 1, fontSize: '0.75rem' }}
                onClick={() => handleDemoFill('agent.rahul@lastmile.com', 'agent123')}
              >
                <Truck size={14} style={{ color: 'var(--primary)' }} /> Agent
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1"
                style={{ flex: 1, fontSize: '0.75rem' }}
                onClick={() => handleDemoFill('customer@acme.com', 'customer123')}
              >
                <User size={14} style={{ color: 'var(--success)' }} /> Customer
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
            <Link to="/register" style={{ fontWeight: 600 }}>Create Customer Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
