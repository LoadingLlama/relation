/**
 * ProfilePanel - LinkedIn-style contact profile view
 */

import { useState } from 'react';
import { Connection } from '../../types';
import './Profile.css';

interface ProfilePanelProps {
  connection: Connection;
  allConnections: Connection[];
  onClose: () => void;
  onRemove: () => void;
  onConnectionClick?: (connection: Connection) => void;
}

export function ProfilePanel({ connection, allConnections, onRemove, onConnectionClick }: ProfilePanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const user = connection.user_b_data;

  if (!user) return null;

  // Get other connections (excluding the current one being viewed)
  const otherConnections = allConnections.filter(c => c.id !== connection.id);

  return (
    <div className="profile-panel">
      {/* Banner */}
      <div className="profile-banner">
        {user.banner_url ? (
          <img src={user.banner_url} alt="Banner" className="banner-image" />
        ) : (
          <div className="banner-gradient" />
        )}
      </div>

      {/* Avatar */}
      <div className="profile-avatar-container">
        <div className="profile-avatar-large">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} />
          ) : (
            <div className="avatar-placeholder-large">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Name and headline */}
        <div className="profile-identity">
          <h1 className="profile-name">
            {user.name}
            <svg className="verified-badge" width="20" height="20" viewBox="0 0 24 24" fill="#007AFF">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </h1>
          {user.headline && (
            <p className="profile-headline">{user.headline}</p>
          )}
          {user.location && (
            <p className="profile-location">{user.location}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="profile-contact-info">
          {user.phone && (
            <a href={`tel:${user.phone}`} className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              {user.phone}
            </a>
          )}
          {user.email && (
            <a href={`mailto:${user.email}`} className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              {user.email}
            </a>
          )}
          {user.linkedin_url && (
            <a
              href={user.linkedin_url.startsWith('http') ? user.linkedin_url : `https://${user.linkedin_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link linkedin"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn Profile
            </a>
          )}
          {user.website && (
            <a
              href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              Website
            </a>
          )}
        </div>

        {/* Industry, Stage & Raising Info */}
        {(user.industry || user.stage || user.raising) && (
          <div className="profile-badges">
            {user.industry && (
              <span className="profile-badge industry">{user.industry}</span>
            )}
            {user.stage && (
              <span className="profile-badge stage">{user.stage}</span>
            )}
            {user.raising && (
              <span className="profile-badge raising">Currently Raising</span>
            )}
          </div>
        )}

        {/* About Section */}
        {user.about && (
          <div className="profile-section">
            <h2 className="section-title">
              About {user.headline?.replace('Founder at ', '') || 'Company'}
            </h2>
            <p className="about-text">{user.about}</p>
          </div>
        )}

        {/* Mutual Connections */}
        {otherConnections.length > 0 && (
          <div className="profile-section">
            <h2 className="section-title">
              Connections
              <span className="section-count">{otherConnections.length}</span>
            </h2>
            <div className="connections-grid">
              {otherConnections.slice(0, 6).map((conn) => (
                <div
                  key={conn.id}
                  className="connection-card clickable"
                  onClick={() => onConnectionClick?.(conn)}
                >
                  <div className="connection-card-avatar">
                    {conn.user_b_data?.avatar_url ? (
                      <img src={conn.user_b_data.avatar_url} alt={conn.user_b_data.name} />
                    ) : (
                      conn.user_b_data?.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="connection-card-info">
                    <span className="connection-card-name">{conn.user_b_data?.name}</span>
                    <span className="connection-card-headline">{conn.user_b_data?.headline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="profile-footer">
        {showConfirm ? (
          <div className="confirm-remove">
            <span>Remove connection?</span>
            <button className="confirm-yes" onClick={onRemove}>Remove</button>
            <button className="confirm-no" onClick={() => setShowConfirm(false)}>Cancel</button>
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
