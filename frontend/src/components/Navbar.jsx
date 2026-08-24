import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Truck, ShieldCheck, User as UserIcon, LogOut, Search, PlusCircle, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="flex items-center gap-6">
        <Link to="/" className="nav-brand">
          <div className="nav-brand-icon">
            <Package size={20} />
          </div>
          <span>Last-Mile Delivery</span>
        </Link>

        <nav className="nav-links" style={{ marginLeft: '1rem' }}>
          <Link to="/track" className={`nav-link flex items-center gap-2 ${isActive('/track') ? 'active' : ''}`}>
            <Search size={16} /> Track Order
          </Link>

          {isAuthenticated && user?.role === 'customer' && (
            <>
              <Link to="/customer" className={`nav-link flex items-center gap-2 ${isActive('/customer') ? 'active' : ''}`}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/customer/new-order" className={`nav-link flex items-center gap-2 ${isActive('/customer/new-order') ? 'active' : ''}`}>
                <PlusCircle size={16} /> Create Order
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'agent' && (
            <Link to="/agent" className={`nav-link flex items-center gap-2 ${isActive('/agent') ? 'active' : ''}`}>
              <Truck size={16} /> Agent Portal
            </Link>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <>
              <Link to="/admin" className={`nav-link flex items-center gap-2 ${isActive('/admin') ? 'active' : ''}`}>
                <LayoutDashboard size={16} /> Overview
              </Link>
              <Link to="/admin/orders" className={`nav-link flex items-center gap-2 ${isActive('/admin/orders') ? 'active' : ''}`}>
                <Package size={16} /> Orders
              </Link>
              <Link to="/admin/config" className={`nav-link flex items-center gap-2 ${isActive('/admin/config') ? 'active' : ''}`}>
                <ShieldCheck size={16} /> Config & Rates
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.name}
              </div>
              <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
                <span className="badge" style={{
                  background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : user.role === 'agent' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: user.role === 'admin' ? 'var(--danger)' : user.role === 'agent' ? 'var(--primary)' : 'var(--success)',
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem'
                }}>
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm flex items-center gap-2"
              title="Log Out"
              id="logout-btn"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-secondary btn-sm">
              Log In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
