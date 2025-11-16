import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getLeaveRequests, 
  getTimeAdjustments, 
  getOvertimeRequests,
  updateLeaveStatus,
  updateTimeAdjustmentStatus,
  updateOvertimeStatus,
  addActivity
} from '../firebase/dbService';
import { getAllEmployees, addEmployee, updateEmployee, deleteEmployee } from '../firebase/employeeService';
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
        result = await updateTimeAdjustmentStatus(requestId, 'approved');
        if (result.success) {
          const request = timeAdjustments.find(r => r.id === requestId);
          // Log activity for the employee
          await addActivity(request.userId, {
            type: 'Time Adjustment Approved',
            description: `Your time adjustment request for ${request.date} has been approved`,
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
            <button 
              className={`nav-item ${activeSection === 'leave' ? 'active' : ''}`} 
              onClick={() => setActiveSection('leave')}
            >
              <span className="nav-icon">🌴</span>
              <span className="nav-text">Leave Requests</span>
            </button>
            <button 
              className={`nav-item ${activeSection === 'time' ? 'active' : ''}`} 
              onClick={() => setActiveSection('time')}
            >
              <span className="nav-icon">🕐</span>
              <span className="nav-text">Time Adjustments</span>
            </button>
            <button 
              className={`nav-item ${activeSection === 'overtime' ? 'active' : ''}`} 
              onClick={() => setActiveSection('overtime')}
            >
              <span className="nav-icon">⏰</span>
              <span className="nav-text">Overtime Requests</span>
            </button>
            <button 
              className={`nav-item ${activeSection === 'employees' ? 'active' : ''}`} 
              onClick={() => setActiveSection('employees')}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-text">Employee Directory</span>
            </button>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-content">
            {activeSection === 'dashboard' && (
              <>
                <h2 className="section-title">Dashboard Overview</h2>
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
                <h2 className="section-title">Leave Requests</h2>
                <div className="requests-table">
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
                <h2 className="section-title">Time Adjustment Requests</h2>
                <div className="requests-table">
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
                            <td>{request.original}</td>
                            <td>{request.requested}</td>
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
                <h2 className="section-title">Overtime Requests</h2>
                <div className="requests-table">
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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                  <h2 className="section-title" style={{marginBottom: 0}}>Employee Directory</h2>
                  <button className="add-employee-btn" onClick={() => setShowAddEmployeeModal(true)}>
                    ➕ Add Employee
                  </button>
                </div>
                <div className="requests-table">
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
    </div>
  );
};

export default AdminPage;
