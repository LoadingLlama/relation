/**
 * ProfilePanel component - displays connection details on the right side
 */

import { useState } from 'react';
import { Relationship, ConnectionInfo } from '../../types';
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

          {otherUser.linkedin_url && (
            <div className="profile-field">
              <span className="field-label">LinkedIn</span>
              <a
                href={otherUser.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="linkedin-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077B5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                View Profile
              </a>
            </div>
          )}
        </div>

        {otherUser.connections && otherUser.connections.length > 0 && (
          <div className="friend-connections">
            <h3 className="connections-header">
              Their Connections
              <span className="connections-count">{otherUser.connections.length}</span>
            </h3>
            <div className="connections-list">
              {otherUser.connections.map((conn: ConnectionInfo) => (
                <div key={conn.id} className="connection-item">
                  <div className="connection-avatar">
                    {conn.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="connection-info">
                    <span className="connection-name">{conn.name}</span>
                    <span className="connection-type">{conn.relationship_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
