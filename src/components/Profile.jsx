import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || '',
    employeeId: user?.employeeId || '',
    dateJoined: user?.dateJoined || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement save to Firebase
    console.log('Saving profile:', formData);
    alert('Profile update functionality will be implemented');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      position: user?.position || '',
      employeeId: user?.employeeId || '',
      dateJoined: user?.dateJoined || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="profile-header-info">
          <h2>{user?.name || user?.email?.split('@')[0] || 'User'}</h2>
          <p className="profile-role">{user?.position || user?.role || 'Employee'}</p>
        </div>
        {!isEditing && (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              ) : (
                <p>{user?.name || 'Not provided'}</p>
              )}
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <p>{user?.email || 'Not provided'}</p>
            </div>

            <div className="profile-field">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              ) : (
                <p>{user?.phone || 'Not provided'}</p>
              )}
            </div>

            <div className="profile-field">
              <label>Employee ID</label>
              <p>{user?.employeeId || 'Not assigned'}</p>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Work Information</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Department</label>
              {isEditing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department"
                />
              ) : (
                <p>{user?.department || 'Not assigned'}</p>
              )}
            </div>

            <div className="profile-field">
              <label>Position</label>
              {isEditing ? (
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Enter position"
                />
              ) : (
                <p>{user?.position || 'Not assigned'}</p>
              )}
            </div>

            <div className="profile-field">
              <label>Role</label>
              <p className="role-badge">{user?.role || 'employee'}</p>
            </div>

            <div className="profile-field">
              <label>Date Joined</label>
              <p>{user?.dateJoined || user?.createdAt || 'Not available'}</p>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="profile-actions">
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
