import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { submitLeaveRequest, addActivity } from '../firebase/dbService';
import './LeaveRequest.css';

const LeaveRequest = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    leaveType: 'Vacation Leave (VL)',
    fromDate: '',
    toDate: '',
    reason: '',
    attachment: null
  });
  const [loading, setLoading] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const leaveTypes = [
    'Vacation Leave (VL)',
    'Sick Leave (SL)',
    'Leave Without Pay (LWOP)',
    'Maternity Leave',
    'Paternity Leave'
  ];

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, attachment: file });
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fromDate || !formData.toDate) {
      alert('Please select both from and to dates');
      return;
    }

    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      alert('End date cannot be before start date');
      return;
    }

    setLoading(true);

    const days = calculateDays(formData.fromDate, formData.toDate);
    
    const leaveData = {
      type: formData.leaveType,
      from: formData.fromDate,
      to: formData.toDate,
      days: days,
      reason: formData.reason,
      hasAttachment: formData.attachment ? true : false,
      attachmentName: formData.attachment ? formData.attachment.name : null,
      attachmentType: formData.attachment ? formData.attachment.type : null
    };

    console.log('Submitting leave request:', leaveData);
    const result = await submitLeaveRequest(user.uid, user, leaveData);
    
    if (result.success) {
      // Add activity log for the leave request
      await addActivity(user.uid, {
        type: 'leave_request',
        description: `Submitted ${formData.leaveType} for ${days} day(s)`,
      });
      
      alert('Leave request submitted successfully! Your request is now pending approval.');
      // Reset form
      setFormData({
        leaveType: 'Vacation Leave (VL)',
        fromDate: '',
        toDate: '',
        reason: '',
        attachment: null
      });
      setAttachmentPreview(null);
      // Reset file input
      document.getElementById('attachment').value = '';
    } else {
      alert('Failed to submit leave request: ' + result.error);
    }
    
    setLoading(false);
  };

  const days = calculateDays(formData.fromDate, formData.toDate);

  return (
    <div className="leave-request-container">
      <div className="leave-request-card">
        <h2 className="leave-title">📋 Leave Request</h2>
        <p className="leave-subtitle">Fill out the form below to request leave</p>

        <form onSubmit={handleSubmit} className="leave-form">
          {/* Leave Type */}
          <div className="form-group">
            <label htmlFor="leaveType">Leave Type *</label>
            <select
              id="leaveType"
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              required
            >
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fromDate">From Date *</label>
              <input
                type="date"
                id="fromDate"
                name="fromDate"
                value={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="toDate">To Date *</label>
              <input
                type="date"
                id="toDate"
                name="toDate"
                value={formData.toDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Days Calculation */}
          {days > 0 && (
            <div className="days-display">
              <span className="days-label">Total Days:</span>
              <span className="days-count">{days} {days === 1 ? 'day' : 'days'}</span>
            </div>
          )}

          {/* Reason */}
          <div className="form-group">
            <label htmlFor="reason">Reason *</label>
            <textarea
              id="reason"
              rows="4"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a detailed reason for your leave request..."
              required
            />
          </div>

          {/* Attachment */}
          <div className="form-group">
            <label htmlFor="attachment">Attachment (Optional)</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="attachment"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
              />
              <p className="file-hint">Supported: Images, PDF, Word documents (Max 5MB)</p>
            </div>
            
            {attachmentPreview && (
              <div className="attachment-preview">
                <img src={attachmentPreview} alt="Preview" />
              </div>
            )}
            
            {formData.attachment && !attachmentPreview && (
              <div className="attachment-info">
                📎 {formData.attachment.name}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setFormData({
                  leaveType: 'Vacation Leave (VL)',
                  fromDate: '',
                  toDate: '',
                  reason: '',
                  attachment: null
                });
                setAttachmentPreview(null);
              }}
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequest;
