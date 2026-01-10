/**
 * ProfilePanel component - displays connection details on the right side
 */

import { useState } from 'react';
import { Relationship } from '../../types';
import './Profile.css';

interface ProfilePanelProps {
  relationship: Relationship;
  onClose: () => void;
  onRemove: () => void;
  isLocalNetwork?: boolean;
}

export function ProfilePanel({ relationship, onClose, onRemove, isLocalNetwork = true }: ProfilePanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const otherUser = relationship.user_b_data;

  if (!otherUser) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Generate a display phone from hash (for demo purposes)
  const formatPhone = (hash: string | null) => {
    if (!hash) return null;
    // Create a consistent fake phone from hash for demo
    const digits = hash.replace(/\D/g, '').padEnd(10, '0').slice(0, 10);
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const displayPhone = formatPhone(otherUser.phone_hash);

  return (
    <div className="profile-panel">
      <div className="profile-header">
        <h2>
          {otherUser.name}
          <svg className="verified-check" width="16" height="16" viewBox="0 0 24 24" fill="#007AFF">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        </h2>
        <button className="profile-close" onClick={onClose}>&times;</button>
      </div>

      <div className="profile-content">
        <div className="profile-avatar">
          {otherUser.avatar_url ? (
            <img src={otherUser.avatar_url} alt={otherUser.name} />
          ) : (
            <div className="avatar-placeholder">
              {otherUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-details">
          <div className="profile-field">
            <span className="field-label">Relationship</span>
            <span className="field-value">{relationship.relationship_type}</span>
          </div>

          {isLocalNetwork && displayPhone && (
            <div className="profile-field">
              <span className="field-label">Phone</span>
              <span className="field-value">{displayPhone}</span>
            </div>
          )}

          <div className="profile-field">
            <span className="field-label">Connected since</span>
            <span className="field-value">{formatDate(relationship.verified_at)}</span>
          </div>
        </div>
      </div>

      <div className="profile-footer">
        {showConfirm ? (
          <div className="confirm-remove">
            <span>Remove connection?</span>
            <button className="confirm-yes" onClick={onRemove}>Yes</button>
            <button className="confirm-no" onClick={() => setShowConfirm(false)}>No</button>
          </div>
        ) : (
          <button className="remove-btn" onClick={() => setShowConfirm(true)}>
            Remove Connection
          </button>
        )}
      </div>
    </div>
  );
}
