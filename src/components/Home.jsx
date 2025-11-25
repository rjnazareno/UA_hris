import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logTimeIn, logTimeOut, getTodayTimeLog, getAllUserActivities, addActivity, getLeaveRequests, getOvertimeRequests, getTimeAdjustments, getSchedules, getUserTimeLogs, submitOvertimeRequest, submitTimeAdjustment, getTimeLogByDate, getActivityDetails } from '../firebase/dbService';
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
  const [pendingLeave, setPendingLeave] = useState(0);
  const [pendingOvertime, setPendingOvertime] = useState(0);
  const [pendingTimeAdjustments, setPendingTimeAdjustments] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceSearchDate, setAttendanceSearchDate] = useState('');
  const [showOTModal, setShowOTModal] = useState(false);
  const [otForm, setOtForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    reason: ''
  });
  const [showTimeAdjustModal, setShowTimeAdjustModal] = useState(false);
  const [showActivityDetailModal, setShowActivityDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [nextPayday, setNextPayday] = useState({ date: '', daysRemaining: 0, progress: 0 });
  const [timeAdjustForm, setTimeAdjustForm] = useState({
    date: new Date().toISOString().split('T')[0],
    originalTimeIn: '',
    originalTimeOut: '',
    requestedTimeIn: '',
    requestedTimeOut: '',
    reason: ''
  });

  // Calculate next payday (15th or 30th/end of month)
  const calculateNextPayday = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let paydayDate;
    
    // Determine next payday: 15th or 30th/end of month
    if (currentDay < 15) {
      // Next payday is the 15th of current month
      paydayDate = new Date(currentYear, currentMonth, 15);
    } else if (currentDay < 30) {
      // Next payday is the 30th of current month (or last day if month has fewer days)
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      paydayDate = new Date(currentYear, currentMonth, Math.min(30, lastDayOfMonth));
    } else {
      // Next payday is the 15th of next month
      paydayDate = new Date(currentYear, currentMonth + 1, 15);
    }
    
    // Calculate days remaining
    const timeDiff = paydayDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Calculate progress (assuming 15-day pay period)
    const daysSinceLastPayday = currentDay <= 15 ? currentDay : currentDay - 15;
    const progress = Math.min(100, (daysSinceLastPayday / 15) * 100);
    
    const formattedDate = paydayDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    setNextPayday({
      date: formattedDate,
      daysRemaining: daysRemaining,
      progress: Math.round(progress)
    });
  };

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
      
      // Validate and format times
      const formatTimeIfValid = (isoString) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return null; // Invalid date
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      };
      
      setTimeInOut({
        timeIn: formatTimeIfValid(timeLog.timeIn),
        timeOut: formatTimeIfValid(timeLog.timeOut),
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
          description: activity.description || '',
          // Preserve the original rawData from getAllUserActivities which contains full details
          rawData: activity.rawData || activity
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
    let leaveCount = 0;
    let overtimeCount = 0;
    let adjustmentCount = 0;
    
    const leaveResult = await getLeaveRequests();
    if (leaveResult.success) {
      leaveCount = leaveResult.data.filter(req => req.userId === user.uid && req.status === 'pending').length;
      pendingCount += leaveCount;
    }
    const overtimeResult = await getOvertimeRequests();
    if (overtimeResult.success) {
      overtimeCount = overtimeResult.data.filter(req => req.userId === user.uid && req.status === 'pending').length;
      pendingCount += overtimeCount;
    }
    const adjustmentResult = await getTimeAdjustments();
    if (adjustmentResult.success) {
      adjustmentCount = adjustmentResult.data.filter(req => req.userId === user.uid && req.status === 'pending').length;
      pendingCount += adjustmentCount;
    }
    
    setPendingRequests(pendingCount);
    setPendingLeave(leaveCount);
    setPendingOvertime(overtimeCount);
    setPendingTimeAdjustments(adjustmentCount);

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

    // Load attendance history (last 10 days)
    console.log('=== LOADING ATTENDANCE HISTORY ===');
    console.log('Fetching time logs for user:', user.uid);
    const attendanceResult = await getUserTimeLogs(user.uid, 10);
    console.log('Attendance result:', attendanceResult);
    
    // Fetch approved time adjustments to overlay on attendance
    // Get all adjustments and filter in JavaScript to avoid Firestore index requirement
    const adjustmentsResult = await getTimeAdjustments();
    console.log('All adjustments result:', adjustmentsResult);
    const approvedAdjustments = adjustmentsResult.success 
      ? adjustmentsResult.data.filter(adj => {
          const isApproved = adj.status === 'approved';
          const isCurrentUser = adj.userId === user.uid;
          console.log('Checking adjustment:', adj.id, 'userId:', adj.userId, 'date:', adj.date, 'status:', adj.status, 'isApproved:', isApproved, 'isCurrentUser:', isCurrentUser);
          return isApproved && isCurrentUser;
        })
      : [];
    console.log('Approved adjustments for current user:', approvedAdjustments);
    
    if (attendanceResult.success) {
      // Generate last 10 days including dates without time logs
      const allDates = [];
      const today = new Date();
      
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Find if there's a time log for this date
        let existingLog = attendanceResult.data.find(log => log.date === dateString);
        
        // Check if there's an approved time adjustment for this date
        const adjustment = approvedAdjustments.find(adj => adj.date === dateString);
        
        console.log(`Date: ${dateString}, Has Log: ${!!existingLog}, Has Adjustment: ${!!adjustment}`);
        if (adjustment) {
          console.log('Adjustment data:', adjustment);
        }
        
        if (adjustment) {
          // If there's an approved adjustment, use the requested times
          const convertTimeToISO = (dateString, timeString) => {
            if (!timeString) return null;
            const [hours, minutes] = timeString.split(':');
            const dateObj = new Date(dateString);
            dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return dateObj.toISOString();
          };
          
          const adjustedLog = {
            id: existingLog?.id || `adjusted_${dateString}`,
            date: dateString,
            userId: user.uid,
            timeIn: convertTimeToISO(dateString, adjustment.requested.timeIn),
            timeOut: convertTimeToISO(dateString, adjustment.requested.timeOut),
            status: 'completed',
            adjusted: true,
            adjustmentId: adjustment.id
          };
          console.log('Created adjusted log:', adjustedLog);
          allDates.push(adjustedLog);
        } else if (existingLog) {
          allDates.push(existingLog);
        } else {
          // Create a placeholder entry for dates without time logs
          allDates.push({
            id: `placeholder_${dateString}`,
            date: dateString,
            userId: user.uid,
            timeIn: null,
            timeOut: null,
            status: 'absent'
          });
        }
      }
      
      console.log('Setting attendance history with', allDates.length, 'records (including missing dates and adjustments)');
      setAttendanceHistory(allDates);
    } else {
      console.error('Failed to load attendance:', attendanceResult.error);
      setAttendanceHistory([]);
    }

    // Calculate next payday
    calculateNextPayday();

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

      // Refresh activities and reload data
      await loadData();
      
      alert('Time in logged successfully!');
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

      // Refresh activities and reload data
      await loadData();
      
      alert('Time out logged successfully!');
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

  const fetchOriginalTimes = async (date) => {
    if (!user || !date) return;
    
    const result = await getTimeLogByDate(user.uid, date);
    if (result.success && result.data) {
      const timeLog = result.data;
      
      // Convert ISO strings to HH:MM format for time inputs
      const formatToTimeInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      setTimeAdjustForm(prev => ({
        ...prev,
        originalTimeIn: formatToTimeInput(timeLog.timeIn),
        originalTimeOut: formatToTimeInput(timeLog.timeOut),
        requestedTimeIn: formatToTimeInput(timeLog.timeIn),
        requestedTimeOut: formatToTimeInput(timeLog.timeOut)
      }));
    } else {
      // No time log found for this date
      setTimeAdjustForm(prev => ({
        ...prev,
        originalTimeIn: '',
        originalTimeOut: '',
        requestedTimeIn: '',
        requestedTimeOut: ''
      }));
    }
  };

  const handleOTSubmit = async (e) => {
    e.preventDefault();
    
    if (!otForm.hours || !otForm.reason) {
      alert('Please fill in all fields');
      return;
    }

    const result = await submitOvertimeRequest(user.uid, user, otForm);
    
    if (result.success) {
      // Add activity log
      await addActivity(user.uid, {
        type: 'overtime_request',
        description: `Requested ${otForm.hours} hours of overtime for ${otForm.date}`,
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

      // Reset form and close modal
      setOtForm({
        date: new Date().toISOString().split('T')[0],
        hours: '',
        reason: ''
      });
      setShowOTModal(false);
      alert('Overtime request submitted successfully!');
    } else {
      alert('Failed to submit overtime request: ' + result.error);
    }
  };

  const handleTimeAdjustmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!timeAdjustForm.reason || (!timeAdjustForm.requestedTimeIn && !timeAdjustForm.requestedTimeOut)) {
      alert('Please provide a reason and at least one requested time change');
      return;
    }

    const adjustmentData = {
      date: timeAdjustForm.date,
      original: {
        timeIn: timeAdjustForm.originalTimeIn,
        timeOut: timeAdjustForm.originalTimeOut
      },
      requested: {
        timeIn: timeAdjustForm.requestedTimeIn || timeAdjustForm.originalTimeIn,
        timeOut: timeAdjustForm.requestedTimeOut || timeAdjustForm.originalTimeOut
      },
      reason: timeAdjustForm.reason
    };

    const result = await submitTimeAdjustment(user.uid, user, adjustmentData);
    
    if (result.success) {
      // Add activity log
      await addActivity(user.uid, {
        type: 'time_adjustment_request',
        description: `Requested time adjustment for ${timeAdjustForm.date}`,
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

      // Reset form and close modal
      setTimeAdjustForm({
        date: new Date().toISOString().split('T')[0],
        originalTimeIn: '',
        originalTimeOut: '',
        requestedTimeIn: '',
        requestedTimeOut: '',
        reason: ''
      });
      setShowTimeAdjustModal(false);
      alert('Time adjustment request submitted successfully!');
    } else {
      alert('Failed to submit time adjustment request: ' + result.error);
    }
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
                  <p className="stat-number">{nextPayday.date || 'Calculating...'}</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${nextPayday.progress}%`}}></div>
                  </div>
                  <span className="stat-label">
                    {nextPayday.daysRemaining === 0 ? 'Today!' : 
                     nextPayday.daysRemaining === 1 ? '1 day remaining' : 
                     `${nextPayday.daysRemaining} days remaining`}
                  </span>
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
                <button className="request-adjustment-link" onClick={() => {
                  setShowTimeAdjustModal(true);
                  fetchOriginalTimes(new Date().toISOString().split('T')[0]);
                }}>Request Time Adjustment</button>
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
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
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
                            <td>{activity.date}</td>
                            <td>
                              <span className={`status-badge ${activity.status}`}>
                                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="view-btn"
                                onClick={() => {
                                  setSelectedActivity(activity);
                                  setShowActivityDetailModal(true);
                                }}
                              >
                                👁️ View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="attendance-history-section">
              <div className="section-header-with-filter">
                <h3>Attendance History</h3>
                <div className="activity-filter">
                  <input
                    type="date"
                    className="date-filter"
                    value={attendanceSearchDate}
                    onChange={(e) => setAttendanceSearchDate(e.target.value)}
                    placeholder="Filter by date"
                  />
                  {attendanceSearchDate && (
                    <button 
                      className="clear-filter-btn"
                      onClick={() => setAttendanceSearchDate('')}
                      title="Clear filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="attendance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Hours Worked</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                          Loading attendance...
                        </td>
                      </tr>
                    ) : attendanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                          No attendance records yet
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        const filtered = attendanceHistory.filter(record => {
                          if (!attendanceSearchDate) return true;
                          return record.date === attendanceSearchDate;
                        });
                        
                        if (filtered.length === 0 && attendanceSearchDate) {
                          return (
                            <tr>
                              <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                                No records found for {attendanceSearchDate}
                              </td>
                            </tr>
                          );
                        }
                        
                        return filtered.map(record => {
                        const timeIn = record.timeIn ? new Date(record.timeIn) : null;
                        const timeOut = record.timeOut ? new Date(record.timeOut) : null;
                        
                        // Check for invalid dates
                        const isValidTimeIn = timeIn && !isNaN(timeIn.getTime());
                        const isValidTimeOut = timeOut && !isNaN(timeOut.getTime());
                        
                        let hoursWorked = '--';
                        
                        if (isValidTimeIn && isValidTimeOut) {
                          const diff = timeOut - timeIn;
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          hoursWorked = `${hours}h ${minutes}m`;
                        }
                        
                        return (
                          <tr key={record.id}>
                            <td>{record.date}</td>
                            <td>
                              {isValidTimeIn ? timeIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                              {record.adjusted && <span className="adjusted-badge" title="Time adjusted by admin">✓</span>}
                            </td>
                            <td>
                              {isValidTimeOut ? timeOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                              {record.adjusted && <span className="adjusted-badge" title="Time adjusted by admin">✓</span>}
                            </td>
                            <td>{hoursWorked}</td>
                            <td>
                              <span className={`status-badge ${record.status}`}>
                                {record.status === 'completed' ? 'Complete' : 
                                 record.status === 'active' ? 'Active' :
                                 record.status === 'absent' ? 'No Record' : 
                                 record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                      })()
                    )}
                  </tbody>
                </table>
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
              <div className="overtime-container">
                <div className="page-header">
                  <h2>⏰ Overtime Requests</h2>
                  <button className="primary-button" onClick={() => setShowOTModal(true)}>
                    + Request Overtime
                  </button>
                </div>
                <div className="overtime-content">
                  <p className="info-text">Your overtime requests will appear here.</p>
                </div>
              </div>
            )}

            {/* OT Request Modal */}
            {showOTModal && (
              <div className="modal-overlay" onClick={() => setShowOTModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Request Overtime</h3>
                    <button className="close-button" onClick={() => setShowOTModal(false)}>×</button>
                  </div>
                  <form onSubmit={handleOTSubmit}>
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={otForm.date}
                        onChange={(e) => setOtForm({ ...otForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Hours</label>
                      <input
                        type="number"
                        min="0.5"
                        max="12"
                        step="0.5"
                        value={otForm.hours}
                        onChange={(e) => setOtForm({ ...otForm, hours: e.target.value })}
                        placeholder="e.g., 2 or 2.5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Reason</label>
                      <textarea
                        value={otForm.reason}
                        onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                        placeholder="Please provide a reason for overtime..."
                        rows="4"
                        required
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="secondary-button" onClick={() => setShowOTModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="primary-button">
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Time Adjustment Request Modal */}
            {showTimeAdjustModal && (
              <div className="modal-overlay" onClick={() => setShowTimeAdjustModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Request Time Adjustment</h3>
                    <button className="close-button" onClick={() => setShowTimeAdjustModal(false)}>×</button>
                  </div>
                  <form onSubmit={handleTimeAdjustmentSubmit}>
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={timeAdjustForm.date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setTimeAdjustForm({ ...timeAdjustForm, date: e.target.value });
                          fetchOriginalTimes(e.target.value);
                        }}
                        required
                      />
                    </div>
                    <div className="form-section">
                      <h4>Original Time (from records)</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Time In</label>
                          <input
                            type="time"
                            value={timeAdjustForm.originalTimeIn}
                            readOnly
                            className="readonly-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Time Out</label>
                          <input
                            type="time"
                            value={timeAdjustForm.originalTimeOut}
                            readOnly
                            className="readonly-input"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-section">
                      <h4>Requested Time (make your changes)</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Time In</label>
                          <input
                            type="time"
                            value={timeAdjustForm.requestedTimeIn}
                            onChange={(e) => setTimeAdjustForm({ ...timeAdjustForm, requestedTimeIn: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Time Out</label>
                          <input
                            type="time"
                            value={timeAdjustForm.requestedTimeOut}
                            onChange={(e) => setTimeAdjustForm({ ...timeAdjustForm, requestedTimeOut: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Reason for Adjustment</label>
                      <textarea
                        value={timeAdjustForm.reason}
                        onChange={(e) => setTimeAdjustForm({ ...timeAdjustForm, reason: e.target.value })}
                        placeholder="Please explain why you need this time adjustment..."
                        rows="4"
                        required
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="secondary-button" onClick={() => setShowTimeAdjustModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="primary-button">
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Activity Detail Modal */}
            {showActivityDetailModal && selectedActivity && (
              <div className="modal-overlay" onClick={() => setShowActivityDetailModal(false)}>
                <div className="modal-content activity-detail-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Activity Details</h3>
                    <button className="close-button" onClick={() => setShowActivityDetailModal(false)}>×</button>
                  </div>
                  <div className="activity-detail-body">
                    <div className="detail-row">
                      <span className="detail-label">Activity Type:</span>
                      <span className="detail-value">{selectedActivity.type}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date Submitted:</span>
                      <span className="detail-value">{selectedActivity.date} at {selectedActivity.time}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className={`status-badge ${selectedActivity.status}`}>
                        {selectedActivity.status.charAt(0).toUpperCase() + selectedActivity.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Time Adjustment specific fields */}
                    {selectedActivity.type === 'Time Adjustment' && selectedActivity.rawData && (
                      <>
                        <div className="detail-section-header">Original Time</div>
                        <div className="detail-row">
                          <span className="detail-label">Time In:</span>
                          <span className="detail-value">
                            {(selectedActivity.rawData.original?.timeIn !== undefined && selectedActivity.rawData.original?.timeIn !== null) 
                              ? (selectedActivity.rawData.original.timeIn || 'Not clocked in')
                              : 'Not clocked in'}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Time Out:</span>
                          <span className="detail-value">
                            {(selectedActivity.rawData.original?.timeOut !== undefined && selectedActivity.rawData.original?.timeOut !== null)
                              ? (selectedActivity.rawData.original.timeOut || 'Not clocked out')
                              : 'Not clocked out'}
                          </span>
                        </div>
                        
                        <div className="detail-section-header">Requested Time</div>
                        <div className="detail-row">
                          <span className="detail-label">Time In:</span>
                          <span className="detail-value">
                            {(selectedActivity.rawData.requested?.timeIn !== undefined && selectedActivity.rawData.requested?.timeIn !== null && selectedActivity.rawData.requested?.timeIn !== '')
                              ? selectedActivity.rawData.requested.timeIn
                              : 'Not specified'}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Time Out:</span>
                          <span className="detail-value">
                            {(selectedActivity.rawData.requested?.timeOut !== undefined && selectedActivity.rawData.requested?.timeOut !== null && selectedActivity.rawData.requested?.timeOut !== '')
                              ? selectedActivity.rawData.requested.timeOut
                              : 'Not specified'}
                          </span>
                        </div>
                        
                        {(selectedActivity.rawData.reason || selectedActivity.rawData.description) && (
                          <div className="detail-row">
                            <span className="detail-label">Reason:</span>
                            <span className="detail-value">{selectedActivity.rawData.reason || selectedActivity.rawData.description}</span>
                          </div>
                        )}
                        
                        {selectedActivity.rawData.date && (
                          <div className="detail-row">
                            <span className="detail-label">Adjustment Date:</span>
                            <span className="detail-value">{selectedActivity.rawData.date}</span>
                          </div>
                        )}
                        
                        {selectedActivity.rawData.adminNote && (
                          <div className="detail-row">
                            <span className="detail-label">Admin Note:</span>
                            <span className="detail-value">{selectedActivity.rawData.adminNote}</span>
                          </div>
                        )}
                        
                        {selectedActivity.rawData.processedAt && (
                          <div className="detail-row">
                            <span className="detail-label">Processed At:</span>
                            <span className="detail-value">
                              {new Date(selectedActivity.rawData.processedAt.toDate()).toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Leave Request specific fields */}
                    {selectedActivity.type === 'Leave Request' && selectedActivity.rawData && (
                      <>
                        {selectedActivity.rawData.type && (
                          <div className="detail-row">
                            <span className="detail-label">Leave Type:</span>
                            <span className="detail-value">{selectedActivity.rawData.type}</span>
                          </div>
                        )}
                        {selectedActivity.rawData.from && (
                          <div className="detail-row">
                            <span className="detail-label">From:</span>
                            <span className="detail-value">{selectedActivity.rawData.from}</span>
                          </div>
                        )}
                        {selectedActivity.rawData.to && (
                          <div className="detail-row">
                            <span className="detail-label">To:</span>
                            <span className="detail-value">{selectedActivity.rawData.to}</span>
                          </div>
                        )}
                        {selectedActivity.rawData.days && (
                          <div className="detail-row">
                            <span className="detail-label">Days:</span>
                            <span className="detail-value">{selectedActivity.rawData.days} day(s)</span>
                          </div>
                        )}
                        {selectedActivity.rawData.reason && (
                          <div className="detail-row">
                            <span className="detail-label">Reason:</span>
                            <span className="detail-value">{selectedActivity.rawData.reason}</span>
                          </div>
                        )}
                        {selectedActivity.rawData.adminNote && (
                          <div className="detail-row">
                            <span className="detail-label">Admin Note:</span>
                            <span className="detail-value">{selectedActivity.rawData.adminNote}</span>
                          </div>
                        )}
                        {selectedActivity.rawData.processedAt && (
                          <div className="detail-row">
                            <span className="detail-label">Processed At:</span>
                            <span className="detail-value">
                              {new Date(selectedActivity.rawData.processedAt.toDate()).toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Overtime Request specific fields */}
                    {selectedActivity.type === 'Overtime Request' && selectedActivity.rawData && (
                      <>
                        {selectedActivity.rawData.date && (
                          <div className="detail-row">
                            <span className="detail-label">Overtime Date:</span>
                            <span className="detail-value">{selectedActivity.rawData.date}</span>
                          </div>
                        )}
                        {selectedActivity.rawData.hours && (
                          <div className="detail-row">
                            <span className="detail-label">Hours:</span>
                            <span className="detail-value">{selectedActivity.rawData.hours} hour(s)</span>
                          </div>
                        )}
                        {selectedActivity.rawData.reason && (
                          <div className="detail-row">
                            <span className="detail-label">Reason:</span>
                            <span className="detail-value">{selectedActivity.rawData.reason}</span>
                          </div>
                        )}
                        {selectedActivity.rawData.adminNote && (
                          <div className="detail-row">
                            <span className="detail-label">Admin Note:</span>
                            <span className="detail-value">{selectedActivity.rawData.adminNote}</span>
                          </div>
                        )}
                        {selectedActivity.rawData.processedAt && (
                          <div className="detail-row">
                            <span className="detail-label">Processed At:</span>
                            <span className="detail-value">
                              {new Date(selectedActivity.rawData.processedAt.toDate()).toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {selectedActivity.description && (
                      <div className="detail-row">
                        <span className="detail-label">Description:</span>
                        <span className="detail-value">{selectedActivity.description}</span>
                      </div>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button className="primary-button" onClick={() => setShowActivityDetailModal(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
