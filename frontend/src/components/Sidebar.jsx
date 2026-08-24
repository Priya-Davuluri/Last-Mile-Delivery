import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Truck,
  MapPin,
  DollarSign,
  Users,
  ShieldCheck,
  Search,
  ChevronRight,
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const role = user.role;

  return (
    <aside
      className="sidebar"
      style={{
        width: '240px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1rem',
        minHeight: 'calc(100vh - 68px)',
      }}
    >
      <div>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
          {role} Menu
        </div>

        <nav className="flex flex-col gap-1">
          {/* Customer Navigation */}
          {role === 'customer' && (
            <>
              <NavLink
                to="/customer/dashboard"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={17} />
                  <span>Overview</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>

              <NavLink
                to="/customer/orders"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <Package size={17} />
                  <span>My Orders</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>

              <NavLink
                to="/customer/create-order"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <PlusCircle size={17} />
                  <span>Create Order</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>
            </>
          )}

          {/* Agent Navigation */}
          {role === 'agent' && (
            <>
              <NavLink
                to="/agent/dashboard"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <Truck size={17} />
                  <span>Field Deliveries</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>
            </>
          )}

          {/* Admin Navigation */}
          {role === 'admin' && (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={17} />
                  <span>Overview</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>

              <NavLink
                to="/admin/orders"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <Package size={17} />
                  <span>All Orders</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>

              <NavLink
                to="/admin/zones"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={17} />
                  <span>Zones & Mapping</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>

              <NavLink
                to="/admin/rate-cards"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <DollarSign size={17} />
                  <span>Rate Cards & COD</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>

              <NavLink
                to="/admin/agents"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <Users size={17} />
                  <span>Delivery Agents</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>

              <NavLink
                to="/admin/create-order"
                className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="flex items-center gap-2">
                  <PlusCircle size={17} />
                  <span>Create on Behalf</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>
            </>
          )}

          {/* Public Track Order Link */}
          <div style={{ margin: '1rem 0 0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            <NavLink
              to="/track"
              className={({ isActive }) => `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`}
              style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
            >
              <div className="flex items-center gap-2">
                <Search size={17} />
                <span>Track Any Order</span>
              </div>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </NavLink>
          </div>
        </nav>
      </div>

      {/* User Info Bar at Bottom of Sidebar */}
      <div
        style={{
          background: 'var(--bg-input)',
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</div>
      </div>
    </aside>
  );
};

export default Sidebar;
