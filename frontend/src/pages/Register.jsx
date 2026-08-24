import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { UserPlus, User, Mail, Phone, Lock, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const { name, email, phone, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/customer/dashboard', { replace: true });
    } else {
      setFormError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="main-content flex items-center justify-between" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ maxWidth: '520px', width: '100%', margin: '0 auto' }}>
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
              <UserPlus size={26} />
            </div>
            <h2>Create Customer Account</h2>
            <p style={{ marginTop: '0.4rem' }}>Start shipping and tracking your packages instantly</p>
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
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="+1 555-0199 or 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="Min 6 chars"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm-password">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
              disabled={isSubmitting}
              id="register-submit-btn"
            >
              {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          {/* Social Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Or Register With
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Google Sign-In Button */}
          <GoogleAuthButton text="Sign up with Google" />

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Already registered? </span>
            <Link to="/login" style={{ fontWeight: 600 }}>Log In Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
