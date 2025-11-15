import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logTimeIn, logTimeOut, getTodayTimeLog, getUserActivities, addActivity } from '../firebase/dbService';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('home');
  const [timeInOut, setTimeInOut] = useState({ timeIn: null, timeOut: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load today's time log and activities on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      
      // Load today's time log
      const timeLogResult = await getTodayTimeLog(user.uid);
      if (timeLogResult.success && timeLogResult.data) {
        const timeLog = timeLogResult.data;
        setTimeInOut({
          timeIn: timeLog.timeIn ? new Date(timeLog.timeIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
          timeOut: timeLog.timeOut ? new Date(timeLog.timeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        });
      }

      // Load user activities
      const activitiesResult = await getUserActivities(user.uid, 10);
      if (activitiesResult.success) {
        const formattedActivities = activitiesResult.data.map(activity => ({
          id: activity.id,
          type: activity.type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          time: new Date(activity.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          date: formatDate(activity.timestamp.toDate()),
          status: 'completed',
        }));
        setActivities(formattedActivities);
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleSwitchToAdmin = () => {
    window.location.href = '/admin';
  };

  const handleViewProfile = () => {
    // TODO: Implement profile view
    alert('View Profile - Coming soon!');
    setDropdownOpen(false);
  };

  const handleTimeIn = async () => {
    if (!user) return;

    const result = await logTimeIn(user.uid, user);
    if (result.success) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setTimeInOut(prev => ({ ...prev, timeIn: timeString }));

      // Add activity log
      await addActivity(user.uid, {
        type: 'time_in',
        description: `Logged time in at ${timeString}`,
      });

      // Refresh activities
      const activitiesResult = await getUserActivities(user.uid, 10);
      if (activitiesResult.success) {
        const formattedActivities = activitiesResult.data.map(activity => ({
          id: activity.id,
          type: activity.type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          time: new Date(activity.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          date: formatDate(activity.timestamp.toDate()),
          status: 'completed',
        }));
        setActivities(formattedActivities);
      }
    } else {
      alert('Failed to log time in: ' + result.error);
    }
  };

  const handleTimeOut = async () => {
    if (!user) return;

    const result = await logTimeOut(user.uid);
    if (result.success) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setTimeInOut(prev => ({ ...prev, timeOut: timeString }));

      // Add activity log
      await addActivity(user.uid, {
        type: 'time_out',
        description: `Logged time out at ${timeString}`,
      });

      // Refresh activities
      const activitiesResult = await getUserActivities(user.uid, 10);
      if (activitiesResult.success) {
        const formattedActivities = activitiesResult.data.map(activity => ({
          id: activity.id,
          type: activity.type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          time: new Date(activity.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          date: formatDate(activity.timestamp.toDate()),
          status: 'completed',
        }));
        setActivities(formattedActivities);
      }
    } else {
      alert('Failed to log time out: ' + result.error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.user-dropdown');
      if (dropdown && !dropdown.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <button className="hamburger-button" onClick={toggleSidebar}>☰</button>
          <div className="logo-section">
            <h1>Employee Dashboard</h1>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="welcome-text">{user?.name || user?.username}</span>
              <span className="user-role">{user?.role || 'Employee'}</span>
            </div>
            <div className="user-dropdown">
              <button 
                className="dropdown-toggle" 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Dropdown clicked, current state:', dropdownOpen);
                  setDropdownOpen(!dropdownOpen);
                }}
              >
                ⋮
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleViewProfile}>
                    👤 Profile
                  </button>
                  {user?.role === 'admin' && (
                    <button className="dropdown-item" onClick={handleSwitchToAdmin}>
                      👥 Switch to Admin
                    </button>
                  )}
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'show-mobile' : 'hidden'}`}>
          <div className="sidebar-logo">
            <svg viewBox="0 0 200 200" className="logo-svg">
              <g transform="translate(100, 60)">
                <path d="M -25 0 L -15 -40 L 15 -40 L 25 0 Z" fill="#FF6B35"/>
                <path d="M -15 -40 L -5 -50 L 5 -50 L 15 -40 Z" fill="#FF6B35"/>
                <polygon points="0,-10 -15,10 15,10" fill="#1a1a1a"/>
              </g>
            </svg>
            <div className="logo-text">
              <h2>Nova<span>HR</span></h2>
            </div>
          </div>
          <nav className="sidebar-nav">
            <button className={`nav-item ${activeMenu === 'home' ? 'active' : ''}`} onClick={() => { setActiveMenu('home'); closeSidebar(); }}>
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Home</span>
            </button>
            <button className={`nav-item ${activeMenu === 'news' ? 'active' : ''}`} onClick={() => { setActiveMenu('news'); closeSidebar(); }}>
              <span className="nav-icon">📰</span>
              <span className="nav-text">News Feed</span>
            </button>
            <button className={`nav-item ${activeMenu === 'schedule' ? 'active' : ''}`} onClick={() => { setActiveMenu('schedule'); closeSidebar(); }}>
              <span className="nav-icon">📅</span>
              <span className="nav-text">Request Change Schedule</span>
            </button>
            <button className={`nav-item ${activeMenu === 'overtime' ? 'active' : ''}`} onClick={() => { setActiveMenu('overtime'); closeSidebar(); }}>
              <span className="nav-icon">⏰</span>
              <span className="nav-text">Overtime</span>
            </button>
            <button className={`nav-item ${activeMenu === 'leave' ? 'active' : ''}`} onClick={() => { setActiveMenu('leave'); closeSidebar(); }}>
              <span className="nav-icon">🌴</span>
              <span className="nav-text">Leave</span>
            </button>
          </nav>
        </aside>
        <main className={`dashboard-main ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
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
            <div className="time-activity-container">
              <div className="time-log-section">
                <div className="section-header">
                  <h3>Time Log</h3>
                  <span className="current-time">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <div className="time-log-cards">
                  <div className="time-card time-in">
                    <span className="time-label">Time In</span>
                    <span className="time-value">{timeInOut.timeIn || '-- : --'}</span>
                  </div>
                  <div className="time-card time-out">
                    <span className="time-label">Time Out</span>
                    <span className="time-value">{timeInOut.timeOut || '-- : --'}</span>
                  </div>
                </div>
                {!timeInOut.timeIn ? (
                  <button onClick={handleTimeIn} className="log-time-button">Log Time In</button>
                ) : (
                  <button onClick={handleTimeOut} className="log-time-button">Log Time Out</button>
                )}
                <button className="request-adjustment-link">Request Time Adjustment</button>
              </div>
              <div className="recent-activity-section">
                <div className="section-header-with-filter">
                  <h3>Recent Activities</h3>
                </div>
                <div className="activity-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Activity</th>
                        <th>Time</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map(activity => (
                        <tr key={activity.id}>
                          <td>{activity.type}</td>
                          <td>{activity.time}</td>
                          <td>{activity.date}</td>
                          <td>
                            <span className={`status-badge ${activity.status}`}>
                              {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
