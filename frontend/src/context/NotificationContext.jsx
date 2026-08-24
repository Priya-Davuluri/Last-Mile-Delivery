import React, { createContext, useContext, useState, useCallback } from 'react';
import { Mail, CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, { type = 'info', title = '', duration = 4500 } = {}) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, message, type, title };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showEmailNotification = useCallback((recipientEmail, milestone) => {
    showToast(
      recipientEmail
        ? `Notification email sent to ${recipientEmail} for status: ${milestone}`
        : `Email notification successfully dispatched to customer!`,
      {
        type: 'email',
        title: '✉️ Customer Email Dispatched',
        duration: 5000,
      }
    );
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{ showToast, showEmailNotification, removeToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 9999,
          maxWidth: '380px',
          width: '90%',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bg = 'var(--bg-surface-elevated)';
          let borderColor = 'var(--border-subtle)';
          let iconColor = 'var(--primary)';
          let IconComponent = Info;

          if (toast.type === 'email') {
            bg = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.98) 100%)';
            borderColor = 'rgba(16, 185, 129, 0.4)';
            iconColor = 'var(--success)';
            IconComponent = Mail;
          } else if (toast.type === 'success') {
            bg = 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.98) 100%)';
            borderColor = 'rgba(16, 185, 129, 0.3)';
            iconColor = 'var(--success)';
            IconComponent = CheckCircle;
          } else if (toast.type === 'danger' || toast.type === 'error') {
            bg = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.98) 100%)';
            borderColor = 'rgba(239, 68, 68, 0.4)';
            iconColor = 'var(--danger)';
            IconComponent = AlertCircle;
          } else if (toast.type === 'warning') {
            bg = 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.98) 100%)';
            borderColor = 'rgba(245, 158, 11, 0.4)';
            iconColor = 'var(--warning)';
            IconComponent = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className="fade-in"
              style={{
                background: bg,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                pointerEvents: 'auto',
              }}
            >
              <div style={{ color: iconColor, marginTop: '2px', flexShrink: 0 }}>
                <IconComponent size={20} />
              </div>

              <div style={{ flex: 1 }}>
                {toast.title && (
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                    {toast.title}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
