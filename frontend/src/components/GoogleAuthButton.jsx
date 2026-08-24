import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const DEFAULT_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '106173000000-dummygoogleclientid.apps.googleusercontent.com';

const GoogleAuthButton = ({ text = 'Continue with Google', onSuccessRedirect }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleCredentialResponse = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await googleLogin(credentialResponse.credential, clientId);
      if (res.success && res.user) {
        if (onSuccessRedirect) {
          onSuccessRedirect(res.user);
        } else {
          const rolePathMap = {
            admin: '/admin/dashboard',
            agent: '/agent/dashboard',
            customer: '/customer/dashboard',
          };
          navigate(rolePathMap[res.user.role] || '/customer/dashboard', { replace: true });
        }
      } else {
        setError(res.message || 'Google authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleClick = () => {
    if (!clientId) {
      // Demo Google payload for local development preview
      const demoSub = Math.random().toString().slice(2, 12);
      const demoEmail = prompt('Enter Google Account Email for Demo Sign-In:', 'google.user@example.com');
      if (!demoEmail) return;

      const demoName = demoEmail.split('@')[0].replace('.', ' ').toUpperCase();
      const mockPayload = {
        sub: demoSub,
        email: demoEmail,
        name: demoName,
        picture: 'https://lh3.googleusercontent.com/a/default-user',
        email_verified: true,
      };

      const mockCredential = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify(mockPayload)) + '.mock_signature';
      handleCredentialResponse({ credential: mockCredential });
    }
  };

  return (
    <div style={{ width: '100%', margin: '1rem 0' }}>
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {clientId ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleOAuthProvider clientId={clientId}>
            <GoogleLogin
              onSuccess={handleCredentialResponse}
              onError={() => setError('Google Sign-In was cancelled or failed.')}
              useOneTap
              theme="filled_black"
              shape="pill"
              text={text.includes('Sign') ? 'signin_with' : 'continue_with'}
              width="100%"
            />
          </GoogleOAuthProvider>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCustomGoogleClick}
          className="btn"
          disabled={loading}
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          {/* Official Google 'G' Multi-Color Logo */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{loading ? 'Connecting with Google...' : text}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleAuthButton;
