/**
 * SelfProfilePanel - LinkedIn-style self profile view with editing
 */

import { useState, FormEvent } from 'react';
import { User } from '../../types';
import './Profile.css';

interface SelfProfilePanelProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => void;
}

export function SelfProfilePanel({ user, onClose, onUpdate }: SelfProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [headline, setHeadline] = useState(user.headline || '');
  const [location, setLocation] = useState(user.location || '');
  const [about, setAbout] = useState(user.about || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedin_url || '');

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onUpdate({
      name,
      email,
      phone: phone || null,
      headline,
      location,
      about,
      linkedin_url: linkedinUrl || null
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setHeadline(user.headline || '');
    setLocation(user.location || '');
    setAbout(user.about || '');
    setLinkedinUrl(user.linkedin_url || '');
    setIsEditing(false);
  };

  return (
    <div className="self-profile-panel">
      {/* Banner */}
      <div className="profile-banner">
        {user.banner_url ? (
          <img src={user.banner_url} alt="Banner" className="banner-image" />
        ) : (
          <div className="banner-gradient" />
        )}
        <label className="edit-banner-btn" title="Edit banner">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUrl = event.target?.result as string;
                  onUpdate({ banner_url: dataUrl });
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ display: 'none' }}
          />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </label>
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
        {isEditing ? (
          <form onSubmit={handleSave} className="edit-form">
            <div className="form-group">
              <label htmlFor="edit-name">Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-headline">Headline</label>
              <input
                id="edit-headline"
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="e.g., Software Engineer at Company"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-location">Location</label>
              <input
                id="edit-location"
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-phone">Phone</label>
              <input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-linkedin">LinkedIn URL</label>
              <input
                id="edit-linkedin"
                type="url"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-about">About</label>
              <textarea
                id="edit-about"
                value={about}
                onChange={e => setAbout(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={4}
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
          <>
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
                <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="contact-link linkedin">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn Profile
                </a>
              )}
            </div>

            {/* About Section */}
            {user.about && (
              <div className="profile-section">
                <h2 className="section-title">About</h2>
                <p className="about-text">{user.about}</p>
              </div>
            )}

            {/* Edit Button */}
            <button className="save-btn" onClick={() => setIsEditing(true)} style={{ marginTop: '16px' }}>
              Edit Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
}
