import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getLeaveRequests, 
  getTimeAdjustments, 
  getOvertimeRequests,
  updateLeaveStatus,
  updateTimeAdjustmentStatus,
  updateOvertimeStatus,
  addActivity,
  getUserTimeLogs
} from '../firebase/dbService';
import { getAllEmployees, addEmployee, updateEmployee, deleteEmployee } from '../firebase/employeeService';
import ScheduleCalendar from './ScheduleCalendar';
import './AdminPage.css';

const AdminPage = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [timeAdjustments, setTimeAdjustments] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    password: '',
    name: '',
    employeeId: '',
    department: '',
    position: '',
    role: 'employee'
  });

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Load leave requests
      const leaveResult = await getLeaveRequests();
      if (leaveResult.success) {
        setLeaveRequests(leaveResult.data);
      }

      // Load time adjustments
      const timeResult = await getTimeAdjustments();
      if (timeResult.success) {
        setTimeAdjustments(timeResult.data);
      }

      // Load overtime requests
      const overtimeResult = await getOvertimeRequests();
      if (overtimeResult.success) {
        setOvertimeRequests(overtimeResult.data);
      }

      // Load employees
      const employeesResult = await getAllEmployees();
      if (employeesResult.success) {
        setEmployees(employeesResult.data);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleSwitchToEmployee = () => {
    window.location.href = '/home';
  };

  const handleViewProfile = () => {
    alert('View Profile - Coming soon!');
    setDropdownOpen(false);
  };

  React.useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleGenerateReport = async () => {
    if (!reportDateRange.startDate || !reportDateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      // Fetch time logs for all employees
      const allTimeLogs = [];
      
      for (const employee of employees) {
        const result = await getUserTimeLogs(employee.uid, 1000);
        if (result.success && result.data) {
          const filteredLogs = result.data.filter(log => {
            return log.date >= reportDateRange.startDate && log.date <= reportDateRange.endDate;
          });
          
          filteredLogs.forEach(log => {
            allTimeLogs.push({
              employeeId: employee.employeeId,
              employeeName: employee.name,
              department: employee.department,
              position: employee.position,
              date: log.date,
              timeIn: log.timeIn,
              timeOut: log.timeOut,
              status: log.status
            });
          });
        }
      }

      // Sort by date and then by employee name
      allTimeLogs.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.employeeName.localeCompare(b.employeeName);
      });

      // Convert to CSV matching the screenshot format
      const csvHeader = 'Log Date,Employee Name,Time In,Time Out\n';
      const csvRows = allTimeLogs.map(log => {
        // Format date properly
        const logDate = new Date(log.date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const timeIn = log.timeIn ? new Date(log.timeIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
        const timeOut = log.timeOut ? new Date(log.timeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
        return `${logDate},${log.employeeName},${timeIn},${timeOut}`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `time_logs_report_${reportDateRange.startDate}_to_${reportDateRange.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowReportModal(false);
      setReportDateRange({ startDate: '', endDate: '' });
      alert(`Report generated successfully! ${allTimeLogs.length} records exported.`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + error.message);
    }
  };

  const handleApprove = async (type, requestId) => {
    try {
      let result;
      if (type === 'leave') {
        result = await updateLeaveStatus(requestId, 'approved');
        if (result.success) {
             const request = leaveRequests.find(r => r.id === requestId);
          // Log activity for the employee
          await addActivity(request.userId, {
            type: 'Leave Approved',
            description: `Your ${request.type} request has been approved`,
          });
          setLeaveRequests(prev => 
            prev.map(req => req.id === requestId ? { ...req, status: 'approved' } : req)
          );
        }
      } else if (type === 'time') {
        const request = timeAdjustments.find(r => r.id === requestId);
        result = await updateTimeAdjustmentStatus(requestId, 'approved', '', request);
        if (result.success) {
          // Log activity for the employee
          await addActivity(request.userId, {
            type: 'Time Adjustment Approved',
            description: `Your time adjustment request for ${request.date} has been approved and time log has been updated`,
          });
          setTimeAdjustments(prev => 
            prev.map(req => req.id === requestId ? { ...req, status: 'approved' } : req)
          );
        }
      } else if (type === 'overtime') {
        result = await updateOvertimeStatus(requestId, 'approved');
        if (result.success) {
          const request = overtimeRequests.find(r => r.id === requestId);
          // Log activity for the employee
          await addActivity(request.userId, {
            type: 'Overtime Approved',
            description: `Your overtime request for ${request.hours} hours has been approved`,
          });
          setOvertimeRequests(prev => 
            prev.map(req => req.id === requestId ? { ...req, status: 'approved' } : req)
          );
        }
      }

      if (result?.success) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} request approved successfully!`);
      } else {
        alert('Failed to approve request: ' + result?.error);
      }
    } catch (error) {
      alert('Error approving request: ' + error.message);
    }
  };

  const handleReject = async (type, requestId) => {
    try {
      let result;
      if (type === 'leave') {
        result = await updateLeaveStatus(requestId, 'rejected');
        if (result.success) {
          const request = leaveRequests.find(r => r.id === requestId);
          // Log activity for the employee
          await addActivity(request.userId, {
            type: 'Leave Rejected',
            description: `Your ${request.type} request has been rejected`,
          });
          setLeaveRequests(prev => 
            prev.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req)
          );
        }
      } else if (type === 'time') {
        result = await updateTimeAdjustmentStatus(requestId, 'rejected');
        if (result.success) {
          const request = timeAdjustments.find(r => r.id === requestId);
          // Log activity for the employee
          await addActivity(request.userId, {
            type: 'Time Adjustment Rejected',
            description: `Your time adjustment request for ${request.date} has been rejected`,
          });
          setTimeAdjustments(prev => 
            prev.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req)
          );
        }
      } else if (type === 'overtime') {
        result = await updateOvertimeStatus(requestId, 'rejected');
        if (result.success) {
          const request = overtimeRequests.find(r => r.id === requestId);
          // Log activity for the employee
          await addActivity(request.userId, {
            type: 'Overtime Rejected',
            description: `Your overtime request for ${request.hours} hours has been rejected`,
          });
          setOvertimeRequests(prev => 
            prev.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req)
          );
        }
      }

      if (result?.success) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} request rejected.`);
      } else {
        alert('Failed to reject request: ' + result?.error);
      }
    } catch (error) {
      alert('Error rejecting request: ' + error.message);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Pass admin credentials to maintain session after creating new user
    const result = await addEmployee(newEmployee, user.email, prompt('Please enter your password to confirm:'));
    
    if (result.success) {
      alert('Employee added successfully!');
      setEmployees(prev => [result.data, ...prev]);
      setShowAddEmployeeModal(false);
      setNewEmployee({
        email: '',
        password: '',
        name: '',
        employeeId: '',
        department: '',
        position: '',
        role: 'employee'
      });
    } else {
      alert('Failed to add employee: ' + result.error);
    }
    
    setLoading(false);
  };

  const handleEditEmployee = (employee) => {
    alert('Edit employee feature - Coming soon!');
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Admin Dashboard</h1>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="welcome-text">{user?.name || user?.username}</span>
              <span className="user-role">Administrator</span>
            </div>
            <div className="user-dropdown">
              <button className="dropdown-toggle" onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}>
                ⋮
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleViewProfile}>
                    👤 Profile
                  </button>
                  {user?.role === 'admin' && (
                    <button className="dropdown-item" onClick={handleSwitchToEmployee}>
                      👥 Back to Employee View
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

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-logo">
            <div className="logo-text">
              <h2>Nova<span>HR</span></h2>
            </div>
          </div>
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} 
              onClick={() => setActiveSection('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </button>

            <div className="nav-divider">
              <span className="divider-text">Management</span>
            </div>

            <button 
              className={`nav-item ${activeSection === 'employees' ? 'active' : ''}`} 
              onClick={() => setActiveSection('employees')}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-text">Employee Directory</span>
            </button>
            <button 
              className={`nav-item ${activeSection === 'schedule' ? 'active' : ''}`} 
              onClick={() => setActiveSection('schedule')}
            >
              <span className="nav-icon">📅</span>
              <span className="nav-text">Schedule Calendar</span>
            </button>

            <div className="nav-divider">
              <span className="divider-text">Requests</span>
            </div>

            <button 
              className={`nav-item ${activeSection === 'leave' ? 'active' : ''}`} 
              onClick={() => setActiveSection('leave')}
            >
              <span className="nav-icon">🌴</span>
              <span className="nav-text">Leave Requests</span>
              {leaveRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="nav-badge">{leaveRequests.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
            <button 
              className={`nav-item ${activeSection === 'time' ? 'active' : ''}`} 
              onClick={() => setActiveSection('time')}
            >
              <span className="nav-icon">🕐</span>
              <span className="nav-text">Time Adjustments</span>
              {timeAdjustments.filter(r => r.status === 'pending').length > 0 && (
                <span className="nav-badge">{timeAdjustments.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
            <button 
              className={`nav-item ${activeSection === 'overtime' ? 'active' : ''}`} 
              onClick={() => setActiveSection('overtime')}
            >
              <span className="nav-icon">⏰</span>
              <span className="nav-text">Overtime Requests</span>
              {overtimeRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="nav-badge">{overtimeRequests.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-content">
            {activeSection === 'dashboard' && (
              <>
                <div className="welcome-banner">
                  <div className="welcome-content">
                    <h2>Welcome back, Admin 👋</h2>
                    <p>Manage your team and oversee all HR operations</p>
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-card stat-pending">
                    <div className="stat-icon-wrapper"><span className="stat-icon">⏳</span></div>
                    <div className="stat-info">
                      <h3>Pending Requests</h3>
                      <p className="stat-number">
                        {leaveRequests.filter(r => r.status === 'pending').length + 
                         timeAdjustments.filter(r => r.status === 'pending').length + 
                         overtimeRequests.filter(r => r.status === 'pending').length}
                      </p>
                      <span className="stat-label">Awaiting approval</span>
                    </div>
                  </div>
                  <div className="stat-card stat-approved">
                    <div className="stat-icon-wrapper"><span className="stat-icon">✅</span></div>
                    <div className="stat-info">
                      <h3>Approved Today</h3>
                      <p className="stat-number">
                        {leaveRequests.filter(r => r.status === 'approved').length + 
                         timeAdjustments.filter(r => r.status === 'approved').length + 
                         overtimeRequests.filter(r => r.status === 'approved').length}
                      </p>
                      <span className="stat-label">Processed requests</span>
                    </div>
                  </div>
                  <div className="stat-card stat-employees">
                    <div className="stat-icon-wrapper"><span className="stat-icon">👥</span></div>
                    <div className="stat-info">
                      <h3>Total Requests</h3>
                      <p className="stat-number">
                        {leaveRequests.length + timeAdjustments.length + overtimeRequests.length}
                      </p>
                      <span className="stat-label">All requests</span>
                    </div>
                  </div>
                  <div className="stat-card stat-overtime">
                    <div className="stat-icon-wrapper"><span className="stat-icon">⏰</span></div>
                    <div className="stat-info">
                      <h3>Overtime Hours</h3>
                      <p className="stat-number">
                        {overtimeRequests
                          .filter(r => r.status === 'approved')
                          .reduce((sum, r) => sum + r.hours, 0)}
                      </p>
                      <span className="stat-label">Approved hours</span>
                    </div>
                  </div>
                </div>

                <div className="dashboard-summary">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    {loading ? (
                      <p>Loading activities...</p>
                    ) : (
                      <>
                        {leaveRequests.slice(0, 3).map((request, index) => (
                          <div key={`leave-${request.id}`} className="activity-item">
                            <span className="activity-icon">🌴</span>
                            <div className="activity-details">
                              <p><strong>{request.userName || request.employee}</strong> submitted a leave request</p>
                              <span className="activity-time">{request.type}</span>
                            </div>
                          </div>
                        ))}
                        {timeAdjustments.slice(0, 2).map((request, index) => (
                          <div key={`time-${request.id}`} className="activity-item">
                            <span className="activity-icon">🕐</span>
                            <div className="activity-details">
                              <p><strong>{request.userName || request.employee}</strong> requested time adjustment</p>
                              <span className="activity-time">{request.date}</span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'leave' && (
              <>
                <div className="requests-table">
                  <h2 className="section-title" style={{marginBottom: '20px'}}>Leave Requests</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading...</td></tr>
                      ) : leaveRequests.length === 0 ? (
                        <tr><td colSpan="7" style={{textAlign: 'center'}}>No leave requests found</td></tr>
                      ) : (
                        leaveRequests.map(request => (
                          <tr key={request.id}>
                            <td>{request.userName || request.employee}</td>
                            <td>{request.type}</td>
                            <td>{request.from}</td>
                            <td>{request.to}</td>
                            <td>{request.days}</td>
                            <td>
                              <span className={`status-badge ${request.status}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              {request.status === 'pending' && (
                                <div className="action-buttons">
                                  <button className="approve-btn" onClick={() => handleApprove('leave', request.id)}>
                                    ✓ Approve
                                  </button>
                                  <button className="reject-btn" onClick={() => handleReject('leave', request.id)}>
                                    ✗ Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeSection === 'time' && (
              <>
                <div className="requests-table">
                  <h2 className="section-title" style={{marginBottom: '20px'}}>Time Adjustment Requests</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Original Time</th>
                        <th>Requested Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading...</td></tr>
                      ) : timeAdjustments.length === 0 ? (
                        <tr><td colSpan="7" style={{textAlign: 'center'}}>No time adjustment requests found</td></tr>
                      ) : (
                        timeAdjustments.map(request => (
                          <tr key={request.id}>
                            <td>{request.userName || request.employee}</td>
                            <td>{request.date}</td>
                            <td>
                              {request.original?.timeIn && request.original?.timeOut 
                                ? `${request.original.timeIn} - ${request.original.timeOut}`
                                : request.original?.timeIn || request.original?.timeOut || 'N/A'}
                            </td>
                            <td>
                              {request.requested?.timeIn && request.requested?.timeOut 
                                ? `${request.requested.timeIn} - ${request.requested.timeOut}`
                                : request.requested?.timeIn || request.requested?.timeOut || 'N/A'}
                            </td>
                            <td>{request.reason}</td>
                            <td>
                              <span className={`status-badge ${request.status}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              {request.status === 'pending' && (
                                <div className="action-buttons">
                                  <button className="approve-btn" onClick={() => handleApprove('time', request.id)}>
                                    ✓ Approve
                                  </button>
                                  <button className="reject-btn" onClick={() => handleReject('time', request.id)}>
                                    ✗ Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeSection === 'overtime' && (
              <>
                <div className="requests-table">
                  <h2 className="section-title" style={{marginBottom: '20px'}}>Overtime Requests</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Hours</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" style={{textAlign: 'center'}}>Loading...</td></tr>
                      ) : overtimeRequests.length === 0 ? (
                        <tr><td colSpan="6" style={{textAlign: 'center'}}>No overtime requests found</td></tr>
                      ) : (
                        overtimeRequests.map(request => (
                          <tr key={request.id}>
                            <td>{request.userName || request.employee}</td>
                            <td>{request.date}</td>
                            <td>{request.hours} hours</td>
                            <td>{request.reason}</td>
                            <td>
                              <span className={`status-badge ${request.status}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              {request.status === 'pending' && (
                                <div className="action-buttons">
                                  <button className="approve-btn" onClick={() => handleApprove('overtime', request.id)}>
                                    ✓ Approve
                                  </button>
                                  <button className="reject-btn" onClick={() => handleReject('overtime', request.id)}>
                                    ✗ Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeSection === 'employees' && (
              <>
                <div className="requests-table">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                    <h2 className="section-title" style={{marginBottom: 0}}>Employee Directory</h2>
                    <div style={{display: 'flex', gap: '12px'}}>
                      <button className="generate-report-btn" onClick={() => setShowReportModal(true)}>
                        📊 Generate Report
                      </button>
                      <button className="add-employee-btn" onClick={() => setShowAddEmployeeModal(true)}>
                        ➕ Add Employee
                      </button>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Position</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading...</td></tr>
                      ) : employees.length === 0 ? (
                        <tr><td colSpan="7" style={{textAlign: 'center'}}>No employees found</td></tr>
                      ) : (
                        employees.map(employee => (
                          <tr key={employee.id}>
                            <td>{employee.employeeId}</td>
                            <td>{employee.name}</td>
                            <td>{employee.email}</td>
                            <td>{employee.department}</td>
                            <td>{employee.position}</td>
                            <td>
                              <span className={`status-badge ${employee.role === 'admin' ? 'approved' : 'pending'}`}>
                                {employee.role}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button className="approve-btn" onClick={() => handleEditEmployee(employee)}>
                                  ✏️ Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeSection === 'schedule' && <ScheduleCalendar isAdmin={true} />}
          </div>
        </main>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="modal-overlay" onClick={() => setShowAddEmployeeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Employee</h2>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  type="text"
                  value={newEmployee.employeeId}
                  onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddEmployeeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate Time Logs Report</h3>
              <button className="close-modal" onClick={() => setShowReportModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{marginBottom: '20px', color: '#666'}}>
                Select a date range to export employee time logs as CSV file
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={reportDateRange.startDate}
                    onChange={(e) => setReportDateRange({...reportDateRange, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={reportDateRange.endDate}
                    onChange={(e) => setReportDateRange({...reportDateRange, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowReportModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="submit-btn" 
                onClick={handleGenerateReport}
              >
                📊 Generate & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
