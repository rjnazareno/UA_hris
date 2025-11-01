import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('home');

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>🌙 Luna HRIS</h1>
            <span className="subtitle">Human Resource Information System</span>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="welcome-text">{user?.name || user?.username}</span>
              <span className="user-role">{user?.role || 'Employee'}</span>
            </div>
            <button onClick={handleLogout} className="logout-button">Sign Out</button>
          </div>
        </div>
      </header>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button className={`nav-item ${activeMenu === 'home' ? 'active' : ''}`} onClick={() => setActiveMenu('home')}>
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Home</span>
            </button>
            <button className={`nav-item ${activeMenu === 'news' ? 'active' : ''}`} onClick={() => setActiveMenu('news')}>
              <span className="nav-icon">📰</span>
              <span className="nav-text">News Feed</span>
            </button>
            <button className={`nav-item ${activeMenu === 'schedule' ? 'active' : ''}`} onClick={() => setActiveMenu('schedule')}>
              <span className="nav-icon">📅</span>
              <span className="nav-text">Request Change Schedule</span>
            </button>
            <button className={`nav-item ${activeMenu === 'overtime' ? 'active' : ''}`} onClick={() => setActiveMenu('overtime')}>
              <span className="nav-icon">⏰</span>
              <span className="nav-text">Overtime</span>
            </button>
            <button className={`nav-item ${activeMenu === 'leave' ? 'active' : ''}`} onClick={() => setActiveMenu('leave')}>
              <span className="nav-icon">🌴</span>
              <span className="nav-text">Leave</span>
            </button>
          </nav>
        </aside>
        <main className="dashboard-main">
          <div className="dashboard-content">
            <div className="welcome-banner">
              <div className="welcome-content">
                <h2>Welcome back, {user?.name || user?.username} 👋</h2>
                <p>Ready to stay connected with your team</p>
              </div>
              <div className="notifications-badge">
                <span className="notification-icon">💬</span>
                <span className="notification-text">You have 15 unread messages</span>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card stat-leave">
                <div className="stat-icon-wrapper"><span className="stat-icon">🌴</span></div>
                <div className="stat-info">
                  <h3>Available Leave</h3>
                  <p className="stat-number">0.00 days</p>
                  <span className="stat-label">0.00 of total leave credits remaining</span>
                </div>
              </div>
              <div className="stat-card stat-payday">
                <div className="stat-icon-wrapper"><span className="stat-icon">💰</span></div>
                <div className="stat-info">
                  <h3>Upcoming Payday</h3>
                  <p className="stat-number">November 5, 2025</p>
                  <div className="progress-bar"><div className="progress-fill" style={{width: '80%'}}></div></div>
                  <span className="stat-label">4 days remaining</span>
                </div>
              </div>
              <div className="stat-card stat-requests">
                <div className="stat-icon-wrapper"><span className="stat-icon">📋</span></div>
                <div className="stat-info">
                  <h3>All Requests Summary</h3>
                  <p className="stat-number">0</p>
                  <span className="stat-label">No pending requests</span>
                </div>
              </div>
              <div className="stat-card stat-schedule">
                <div className="stat-icon-wrapper"><span className="stat-icon">📅</span></div>
                <div className="stat-info">
                  <h3>Schedule Today</h3>
                  <p className="stat-number">07:00 AM - 12:00 PM</p>
                  <span className="stat-label stat-link">Official Schedule</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
