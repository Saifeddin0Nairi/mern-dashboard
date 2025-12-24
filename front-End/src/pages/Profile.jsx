import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

function Profile() {
  const { user, token, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/api/profile/me');
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startEditing = () => {
    if (!profile) return;
    setEditing(true);
    setEditName(profile.name || '');
    setEditEmail(profile.email || '');
    setEditBio(profile.bio || '');
    setEditAvatar(profile.avatarUrl || '');
  };

  const cancelEditing = () => {
    setEditing(false);
    setError('');
  };

  const handleSave = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      setError('Name and Email are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updatedData = {
        name: editName,
        email: editEmail,
        bio: editBio,
        avatarUrl: editAvatar
      };
      const response = await API.patch('/api/profile/me', updatedData);
      const updatedProfile = response.data;
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) {
      return;
    }
    setError('');
    setLoading(true);
    try {
      await API.delete('/api/profile/me');
      // On success, log out and redirect to login
      logout();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  if (loading && !editing) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <h2>Profile</h2>
      {error && <p className="error">{error}</p>}
      {!editing && profile && (
        <div>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Bio:</strong> {profile.bio}</p>
          {profile.avatarUrl && <p><strong>Avatar URL:</strong> {profile.avatarUrl}</p>}
          {profile.avatarUrl && (
            <img 
              src={profile.avatarUrl} 
              alt="Avatar" 
              style={{ width: '100px', height: '100px', display: 'block', margin: '0.5rem 0' }} 
            />
          )}
          <button type="button" onClick={startEditing}>Edit Profile</button>{' '}
          <button type="button" onClick={handleDeleteAccount} disabled={loading}>Delete Account</button>
        </div>
      )}
      {editing && (
        <div>
          <div className="form-field">
            <label>Name:</label>
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-field">
            <label>Email:</label>
            <input 
              type="email" 
              value={editEmail} 
              onChange={(e) => setEditEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-field">
            <label>Bio:</label>
            <textarea 
              value={editBio} 
              onChange={(e) => setEditBio(e.target.value)} 
            />
          </div>
          <div className="form-field">
            <label>Avatar URL:</label>
            <input 
              type="text" 
              value={editAvatar} 
              onChange={(e) => setEditAvatar(e.target.value)} 
            />
          </div>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>{' '}
          <button 
            type="button"
            onClick={cancelEditing} 
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default Profile;
