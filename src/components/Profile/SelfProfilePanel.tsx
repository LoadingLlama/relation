/**
 * SelfProfilePanel component - displays and edits current user's profile
 */

import { useState, FormEvent } from 'react';
import { User } from '../../types';
import './Profile.css';

interface SelfProfilePanelProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => void;
  totalConnections: number;
}

export function SelfProfilePanel({ user, onClose, onUpdate, totalConnections }: SelfProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onUpdate({ name, email });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setIsEditing(false);
  };

  return (
    <div className="profile-panel self-profile">
      <div className="profile-header">
        <h2>{user.name}</h2>
        <button className="profile-close" onClick={onClose}>&times;</button>
      </div>

      <div className="profile-content">
        <div className="profile-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} />
          ) : (
            <div className="avatar-placeholder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="edit-form">
            <div className="form-group">
              <label htmlFor="edit-name">Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="edit-actions">
              <button type="button" className="cancel-edit-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="profile-field">
              <span className="field-label">Email</span>
              <span className="field-value">{user.email}</span>
            </div>

            <div className="profile-field">
              <span className="field-label">Connections</span>
              <span className="field-value">{totalConnections}</span>
            </div>

            <div className="profile-field">
              <span className="field-label">Contribution score</span>
              <span className="field-value">{user.contribution_score}</span>
            </div>

            <div className="profile-field">
              <span className="field-label">Member since</span>
              <span className="field-value">{formatDate(user.created_at)}</span>
            </div>

            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
