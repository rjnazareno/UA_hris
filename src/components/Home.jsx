import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logTimeIn, logTimeOut, getTodayTimeLog, getAllUserActivities, addActivity, getLeaveRequests, getOvertimeRequests, getTimeAdjustments, getSchedules } from '../firebase/dbService';
import LeaveRequest from './LeaveRequest';
import ScheduleCalendar from './ScheduleCalendar';
import Profile from './Profile';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('home');
  const [timeInOut, setTimeInOut] = useState({ timeIn: null, timeOut: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState(null);

  // Load data function (can be called on mount and at midnight)
  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    
    console.log('=== LOADING DATA FOR USER ===');
    console.log('User ID:', user.uid);
    console.log('User object:', user);
    
    // Load today's time log
    const timeLogResult = await getTodayTimeLog(user.uid);
    if (timeLogResult.success && timeLogResult.data) {
      const timeLog = timeLogResult.data;
      setTimeInOut({
        timeIn: timeLog.timeIn ? new Date(timeLog.timeIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        timeOut: timeLog.timeOut ? new Date(timeLog.timeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      });
    } else {
      // No time log for today, reset display
      setTimeInOut({ timeIn: null, timeOut: null });
    }

    // Load user activities
    console.log('Loading activities for user:', user.uid);
    const activitiesResult = await getAllUserActivities(user.uid, 20);
    console.log('Activities result:', activitiesResult);
    if (activitiesResult.success) {
      console.log('Raw activities data:', activitiesResult.data);
      const formattedActivities = activitiesResult.data.map(activity => {
        console.log('Formatting activity:', activity);
        return {
          id: activity.id,
          type: activity.type,
          time: activity.timestamp?.toDate ? new Date(activity.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
          date: activity.timestamp?.toDate ? formatDate(activity.timestamp.toDate()) : 'N/A',
          status: activity.status || 'completed',
        };
      });
      console.log('Formatted activities:', formattedActivities);
      console.log('Setting activities state with', formattedActivities.length, 'items');
      setActivities(formattedActivities);
    } else {
      console.error('Failed to load activities:', activitiesResult.error);
    }

    // Load pending requests count
    let pendingCount = 0;
    const leaveResult = await getLeaveRequests();
    if (leaveResult.success) {
      pendingCount += leaveResult.data.filter(req => req.userId === user.uid && req.status === 'pending').length;
    }
    const overtimeResult = await getOvertimeRequests();
    if (overtimeResult.success) {
      pendingCount += overtimeResult.data.filter(req => req.userId === user.uid && req.status === 'pending').length;
    }
    const adjustmentResult = await getTimeAdjustments();
    if (adjustmentResult.success) {
      pendingCount += adjustmentResult.data.filter(req => req.userId === user.uid && req.status === 'pending').length;
    }
    setPendingRequests(pendingCount);

    // Load today's schedule
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const schedulesResult = await getSchedules(user.uid, year, month);
    if (schedulesResult.success) {
      const todayScheduleData = schedulesResult.data.find(schedule => schedule.date === dateKey);
      setTodaySchedule(todayScheduleData);
    }

    setLoading(false);
  };

  // Check for midnight and reset time logs
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntilMidnight = tomorrow - now;
      
      const timer = setTimeout(() => {
        console.log('Midnight reached - resetting time logs');
        // Reset time log at midnight
        setTimeInOut({ timeIn: null, timeOut: null });
        // Reload data for new day
        if (user) {
          loadData();
        }
        // Set up next midnight check
        checkMidnight();
      }, timeUntilMidnight);
      
      return () => clearTimeout(timer);
    };
    
    if (user) {
      const cleanup = checkMidnight();
      return cleanup;
    }
  }, [user]);

  // Load today's time log and activities on component mount
  useEffect(() => {
    console.log('User data in Home component:', user);
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
    setActiveMenu('profile');
    setDropdownOpen(false);
  };

  const handleTimeIn = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    console.log('Attempting to log time in for user:', user.uid);
    const result = await logTimeIn(user.uid, user);
    console.log('Time in result:', result);
    
    if (result.success) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setTimeInOut(prev => ({ ...prev, timeIn: timeString }));

      console.log('Time in successful, adding activity...');
      // Add activity log
      await addActivity(user.uid, {
        type: 'time_in',
        description: `Logged time in at ${timeString}`,
      });

      // Refresh activities
      const activitiesResult = await getAllUserActivities(user.uid, 20);
      if (activitiesResult.success) {
        const formattedActivities = activitiesResult.data.map(activity => ({
          id: activity.id,
          type: activity.type,
          time: activity.timestamp?.toDate ? new Date(activity.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
          date: activity.timestamp?.toDate ? formatDate(activity.timestamp.toDate()) : 'N/A',
          status: activity.status || 'completed',
        }));
        setActivities(formattedActivities);
      }
      
      alert('Time in logged successfully! Check your Firestore console.');
    } else {
      console.error('Time in failed:', result.error);
      alert('Failed to log time in: ' + result.error);
    }
  };

  const handleTimeOut = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    console.log('Attempting to log time out for user:', user.uid);
    const result = await logTimeOut(user.uid);
    console.log('Time out result:', result);
    
    if (result.success) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setTimeInOut(prev => ({ ...prev, timeOut: timeString }));

      console.log('Time out successful, adding activity...');
      // Add activity log
      await addActivity(user.uid, {
        type: 'time_out',
        description: `Logged time out at ${timeString}`,
      });

      // Refresh activities
      const activitiesResult = await getAllUserActivities(user.uid, 20);
      if (activitiesResult.success) {
        const formattedActivities = activitiesResult.data.map(activity => ({
          id: activity.id,
          type: activity.type,
          time: activity.timestamp?.toDate ? new Date(activity.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
          date: activity.timestamp?.toDate ? formatDate(activity.timestamp.toDate()) : 'N/A',
          status: activity.status || 'completed',
        }));
        setActivities(formattedActivities);
      }
      
      alert('Time out logged successfully! Check your Firestore console.');
    } else {
      console.error('Time out failed:', result.error);
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
                ▼
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
            <button className={`nav-item ${activeMenu === 'schedule' ? 'active' : ''}`} onClick={() => { setActiveMenu('schedule'); closeSidebar(); }}>
              <span className="nav-icon">📅</span>
              <span className="nav-text">Schedule Calendar</span>
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
          <div className="sidebar-footer">
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-details">
                <div className="sidebar-user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</div>
                <div className="sidebar-user-position">
                  {user?.position || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee')}
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className={`dashboard-main ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
          <div className="dashboard-content">
            {activeMenu === 'home' && (
              <>
                <div className="welcome-banner">
                  <div className="welcome-content">
                    <h2>Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'} 👋</h2>
                    <p>Ready to stay connected with your team</p>
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
                  <p className="stat-number">{pendingRequests}</p>
                  <span className="stat-label">{pendingRequests === 0 ? 'No pending requests' : `${pendingRequests} pending request${pendingRequests > 1 ? 's' : ''}`}</span>
                </div>
              </div>
              <div className="stat-card stat-schedule">
                <div className="stat-icon-wrapper"><span className="stat-icon">📅</span></div>
                <div className="stat-info">
                  <h3>Schedule Today</h3>
                  {todaySchedule ? (
                    <>
                      <p className="stat-number">
                        {(() => {
                          const formatTime = (time24) => {
                            const [hours, minutes] = time24.split(':');
                            const hour = parseInt(hours);
                            const period = hour >= 12 ? 'PM' : 'AM';
                            const hour12 = hour % 12 || 12;
                            return `${hour12}:${minutes} ${period}`;
                          };
                          return `${formatTime(todaySchedule.timeIn)} - ${formatTime(todaySchedule.timeOut)}`;
                        })()}
                      </p>
                      <span className="stat-label">Official Schedule</span>
                    </>
                  ) : (
                    <>
                      <p className="stat-number">No schedule</p>
                      <span className="stat-label">Not set for today</span>
                    </>
                  )}
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
                ) : !timeInOut.timeOut ? (
                  <button onClick={handleTimeOut} className="log-time-button">Log Time Out</button>
                ) : (
                  <button className="log-time-button shift-complete" disabled>
                    ✓ Shift Complete
                  </button>
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
                      {loading ? (
                        <tr>
                          <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                            Loading activities...
                          </td>
                        </tr>
                      ) : activities.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                            No activities yet
                          </td>
                        </tr>
                      ) : (
                        activities.map(activity => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
              </>
            )}

            {activeMenu === 'leave' && <LeaveRequest />}

            {activeMenu === 'profile' && <Profile />}

            {activeMenu === 'news' && (
              <div style={{padding: '20px', textAlign: 'center'}}>
                <h2>📰 News Feed</h2>
                <p>Coming soon...</p>
              </div>
            )}

            {activeMenu === 'schedule' && <ScheduleCalendar isAdmin={false} />}

            {activeMenu === 'overtime' && (
              <div style={{padding: '20px', textAlign: 'center'}}>
                <h2>⏰ Overtime Request</h2>
                <p>Coming soon...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
