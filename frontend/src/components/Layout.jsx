import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-container">
      <Navbar />

      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 68px)' }}>
        {isAuthenticated && <Sidebar />}

        <main style={{ flex: 1, width: '100%', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
