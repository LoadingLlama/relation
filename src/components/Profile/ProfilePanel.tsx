/**
 * ProfilePanel - Contact detail view (macOS Contacts style)
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

export function ProfilePanel({ relationship, onRemove, isLocalNetwork = true }: ProfilePanelProps) {
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

  const formatPhone = (hash: string | null) => {
    if (!hash) return null;
    const digits = hash.replace(/\D/g, '').padEnd(10, '0').slice(0, 10);
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const displayPhone = formatPhone(otherUser.phone_hash);

  return (
    <div className="profile-panel">
      <div className="profile-header">
        <div className="profile-avatar">
          {otherUser.avatar_url ? (
            <img src={otherUser.avatar_url} alt={otherUser.name} />
          ) : (
            <div className="avatar-placeholder">
              {otherUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="profile-name">{otherUser.name}</h1>
      </div>

      <div className="profile-content">
        <div className="profile-fields">
          {isLocalNetwork && displayPhone && (
            <div className="profile-field">
              <span className="field-label">phone</span>
              <span className="field-value">{displayPhone}</span>
            </div>
          )}

          <div className="profile-field">
            <span className="field-label">relationship</span>
            <span className="field-value">{relationship.relationship_type}</span>
          </div>

          <div className="profile-field">
            <span className="field-label">connected</span>
            <span className="field-value">{formatDate(relationship.verified_at)}</span>
          </div>

          {otherUser.linkedin_url && (
            <div className="profile-field">
              <span className="field-label">linkedin</span>
              <span className="field-value">
                <a
                  href={otherUser.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Profile
                </a>
              </span>
            </div>
          )}
        </div>

        {otherUser.connections && otherUser.connections.length > 0 && (
          <div className="connections-section">
            <div className="connections-title">
              Their Connections ({otherUser.connections.length})
            </div>
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
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
