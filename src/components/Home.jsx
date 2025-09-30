import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="home-container">
      {/* Navigation Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>HRIS System</h1>
            <span className="subtitle">Human Resource Information System</span>
          </div>
          
          <div className="user-section">
            <div className="user-info">
              <span className="welcome-text">Welcome, {user?.name || user?.username}</span>
              <span className="user-role">{user?.role || 'Employee'}</span>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h2>Dashboard</h2>
            <p>Your HRIS management center</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Employees</h3>
                <p className="stat-number">--</p>
                <span className="stat-label">Total Active</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>Attendance</h3>
                <p className="stat-number">--</p>
                <span className="stat-label">Today's Present</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Leave Requests</h3>
                <p className="stat-number">--</p>
                <span className="stat-label">Pending Approval</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💼</div>
              <div className="stat-info">
                <h3>Departments</h3>
                <p className="stat-number">--</p>
                <span className="stat-label">Active Departments</span>
              </div>
            </div>
          </div>

          {/* Navigation Cards for HRIS Modules */}
          <div className="modules-section">
            <h3>HRIS Modules</h3>
            <div className="modules-grid">
              <div className="module-card">
                <div className="module-icon">👥</div>
                <h4>Employee Management</h4>
                <p>Manage employee profiles, personal information, and organizational structure</p>
                <span className="coming-soon">Coming Soon</span>
              </div>

              <div className="module-card">
                <div className="module-icon">⏰</div>
                <h4>Time & Attendance</h4>
                <p>Track working hours, attendance, and time-off management</p>
                <span className="coming-soon">Coming Soon</span>
              </div>

              <div className="module-card">
                <div className="module-icon">💰</div>
                <h4>Payroll Management</h4>
                <p>Process payroll, manage salaries, and generate pay slips</p>
                <span className="coming-soon">Coming Soon</span>
              </div>

              <div className="module-card">
                <div className="module-icon">📈</div>
                <h4>Performance Management</h4>
                <p>Employee evaluations, goal setting, and performance tracking</p>
                <span className="coming-soon">Coming Soon</span>
              </div>

              <div className="module-card">
                <div className="module-icon">🎯</div>
                <h4>Recruitment</h4>
                <p>Job postings, candidate management, and hiring workflow</p>
                <span className="coming-soon">Coming Soon</span>
              </div>

              <div className="module-card">
                <div className="module-icon">📚</div>
                <h4>Training & Development</h4>
                <p>Employee training programs and skill development tracking</p>
                <span className="coming-soon">Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Recent Activities Section */}
          <div className="activities-section">
            <h3>Recent Activities</h3>
            <div className="activities-list">
              <div className="activity-item">
                <div className="activity-icon">🔐</div>
                <div className="activity-content">
                  <p><strong>System Login</strong></p>
                  <span className="activity-time">Just now</span>
                </div>
              </div>
              
              <div className="empty-state">
                <p>No recent activities to display</p>
                <span>Activities will appear here as you use the system</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;