import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSchedules, updateSchedule, addSchedule } from '../firebase/dbService';
import { getAllEmployees } from '../firebase/employeeService';
import './ScheduleCalendar.css';

const ScheduleCalendar = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    timeIn: '07:00',
    timeOut: '16:00',
    shiftType: '7-4'
  });

  const shiftPresets = [
    { value: '7-4', label: '7:00 AM - 4:00 PM', timeIn: '07:00', timeOut: '16:00' },
    { value: '8-5', label: '8:00 AM - 5:00 PM', timeIn: '08:00', timeOut: '17:00' },
    { value: 'off', label: 'Rest Day / Day Off', timeIn: '', timeOut: '' }
  ];

  useEffect(() => {
    if (isAdmin) {
      loadEmployees();
    } else {
      // For non-admin employees, just use their own user object
      setSelectedEmployee(user);
    }
  }, [user, isAdmin]);

  const loadEmployees = async () => {
    console.log('=== LOADING EMPLOYEES ===');
    console.log('Current user:', user);
    const result = await getAllEmployees();
    console.log('Employees result:', result);
    
    if (result.success) {
      console.log('Employees loaded:', result.data);
      setEmployees(result.data);
      
      // Set the current admin user as the default selected employee
      if (user) {
        console.log('Looking for user with UID:', user.uid);
        const currentUserInList = result.data.find(emp => emp.uid === user.uid);
        console.log('Found current user in list:', currentUserInList);
        
        if (currentUserInList) {
          setSelectedEmployee(currentUserInList);
        } else {
          console.log('User not in list, using user object directly');
          setSelectedEmployee(user);
        }
      } else if (result.data.length > 0) {
        console.log('No user, selecting first employee');
        setSelectedEmployee(result.data[0]);
      }
    } else {
      console.error('Failed to load employees:', result.error);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      loadSchedules();
    }
  }, [selectedEmployee, currentDate]);

  const loadSchedules = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    console.log('=== LOADING SCHEDULES ===');
    console.log('Selected Employee:', selectedEmployee);
    console.log('User ID:', selectedEmployee.uid);
    console.log('Year:', year, 'Month:', month);
    
    const result = await getSchedules(selectedEmployee.uid, year, month);
    console.log('Schedules result:', result);
    
    if (result.success) {
      const scheduleMap = {};
      result.data.forEach(schedule => {
        console.log('Schedule found:', schedule.date, schedule);
        scheduleMap[schedule.date] = schedule;
      });
      console.log('Schedule map:', scheduleMap);
      setSchedules(scheduleMap);
    }
    setLoading(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDateKey = (date) => {
    if (!date) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    if (!date || !isAdmin) return;
    
    const dateKey = formatDateKey(date);
    setSelectedDate(date);
    
    if (schedules[dateKey]) {
      setScheduleForm({
        timeIn: schedules[dateKey].timeIn,
        timeOut: schedules[dateKey].timeOut,
        shiftType: schedules[dateKey].shiftType || 'custom'
      });
    } else {
      setScheduleForm({
        timeIn: '07:00',
        timeOut: '16:00',
        shiftType: '7-4'
      });
    }
    setEditMode(true);
  };

  const handleShiftChange = (shiftType) => {
    const preset = shiftPresets.find(s => s.value === shiftType);
    if (preset) {
      setScheduleForm({
        timeIn: preset.timeIn,
        timeOut: preset.timeOut,
        shiftType: shiftType
      });
    } else {
      setScheduleForm({ ...scheduleForm, shiftType: 'custom' });
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedDate || !selectedEmployee) return;

    const dateKey = formatDateKey(selectedDate);
    const scheduleData = {
      userId: selectedEmployee.uid,
      userName: selectedEmployee.name || selectedEmployee.email,
      employeeId: selectedEmployee.employeeId || 'N/A',
      date: dateKey,
      timeIn: scheduleForm.timeIn,
      timeOut: scheduleForm.timeOut,
      shiftType: scheduleForm.shiftType,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    };

    console.log('=== SAVING SCHEDULE ===');
    console.log('Schedule Data:', scheduleData);
    console.log('Is Update:', !!schedules[dateKey]);

    const result = schedules[dateKey] 
      ? await updateSchedule(schedules[dateKey].id, scheduleData)
      : await addSchedule(scheduleData);

    console.log('Save result:', result);

    if (result.success) {
      await loadSchedules();
      setEditMode(false);
      setSelectedDate(null);
    } else {
      alert('Failed to save schedule: ' + result.error);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setSelectedDate(null);
  };

  const isToday = (date) => {
    const today = new Date();
    return date && 
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getScheduleDisplay = (date) => {
    if (!date) return null;
    const dateKey = formatDateKey(date);
    const schedule = schedules[dateKey];
    
    if (schedule) {
      if (schedule.shiftType === 'off') {
        return 'Day Off';
      }
      const timeIn = schedule.timeIn.substring(0, 5);
      const timeOut = schedule.timeOut.substring(0, 5);
      return `${timeIn} - ${timeOut}`;
    }
    return null;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const days = getDaysInMonth(currentDate);

  return (
    <div className="schedule-calendar-container">
      <div className="schedule-main-container">
      {isAdmin && (
        <div className="employee-selector">
          <div className="calendar-header">
            <h2 className="calendar-title">Schedule Management</h2>
            <p className="calendar-subtitle">Manage employee schedules</p>
          </div>
          <label htmlFor="employee-select">Select Employee:</label>
          <select
            id="employee-select"
            value={selectedEmployee?.uid || ''}
            onChange={(e) => {
              const employee = employees.find(emp => emp.uid === e.target.value);
              setSelectedEmployee(employee);
            }}
          >
            {employees.map((emp) => (
              <option key={emp.uid} value={emp.uid}>
                {emp.name || emp.email} - {emp.employeeId || 'N/A'}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isAdmin && (
        <div className="calendar-header">
          <h2 className="calendar-title">My Schedule Calendar</h2>
          <p className="calendar-subtitle">View your work schedule</p>
        </div>
      )}

      <div className="calendar-controls">
        <button className="nav-button" onClick={handlePrevMonth}>
          ← Previous
        </button>
        <h3 className="current-month">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button className="nav-button" onClick={handleNextMonth}>
          Next →
        </button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-header-row">
          <div className="day-header">Sun</div>
          <div className="day-header">Mon</div>
          <div className="day-header">Tue</div>
          <div className="day-header">Wed</div>
          <div className="day-header">Thu</div>
          <div className="day-header">Fri</div>
          <div className="day-header">Sat</div>
        </div>

        <div className="calendar-days">
          {days.map((date, index) => {
            const dateKey = formatDateKey(date);
            const hasSchedule = date && schedules[dateKey];
            const scheduleDisplay = getScheduleDisplay(date);
            const shiftType = hasSchedule ? schedules[dateKey].shiftType : null;

            return (
              <div
                key={index}
                className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${hasSchedule ? 'has-schedule' : ''} ${isAdmin ? 'clickable' : ''}`}
                data-shift-type={shiftType}
                onClick={() => handleDateClick(date)}
              >
                {date && (
                  <>
                    <div className="day-number">{date.getDate()}</div>
                    {scheduleDisplay && (
                      <div className="schedule-time">{scheduleDisplay}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editMode && isAdmin && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Schedule</h3>
            <p className="modal-subtitle">
              {selectedEmployee?.name || selectedEmployee?.email} - {selectedDate?.toLocaleDateString()}
            </p>
            
            <div className="form-group">
              <label>Shift Preset</label>
              <select 
                value={scheduleForm.shiftType} 
                onChange={(e) => handleShiftChange(e.target.value)}
              >
                {shiftPresets.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </div>

            {scheduleForm.shiftType !== 'off' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Time In</label>
                  <input
                    type="time"
                    value={scheduleForm.timeIn}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, timeIn: e.target.value, shiftType: 'custom' })}
                  />
                </div>
                <div className="form-group">
                  <label>Time Out</label>
                  <input
                    type="time"
                    value={scheduleForm.timeOut}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, timeOut: e.target.value, shiftType: 'custom' })}
                  />
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
              <button className="submit-btn" onClick={handleSaveSchedule}>Save Schedule</button>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="schedule-legend">
          <h4>Default Shifts</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color shift-7-4"></span>
              <span>7:00 AM - 4:00 PM</span>
            </div>
            <div className="legend-item">
              <span className="legend-color shift-8-5"></span>
              <span>8:00 AM - 5:00 PM</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
