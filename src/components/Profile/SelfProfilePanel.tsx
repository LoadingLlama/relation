/**
 * SelfProfilePanel - LinkedIn-style self profile view with editing
 */

import { useState, useCallback, FormEvent } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { User } from '../../types';
import './Profile.css';

interface SelfProfilePanelProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => void;
}

/**
 * Creates a cropped image from the original image and crop area.
 */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Creates an HTMLImageElement from a source URL.
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
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

  // Banner crop state
  const [bannerToCrop, setBannerToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Image too large. Maximum size is 5MB.');
        e.target.value = '';
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setBannerToCrop(dataUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropSave = async () => {
    if (bannerToCrop && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(bannerToCrop, croppedAreaPixels);
      onUpdate({ banner_url: croppedImage });
      setBannerToCrop(null);
    }
  };

  const handleCropCancel = () => {
    setBannerToCrop(null);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    // Normalize LinkedIn URL - ensure it has https://
    let normalizedLinkedinUrl = linkedinUrl?.trim() || null;
    if (normalizedLinkedinUrl && !normalizedLinkedinUrl.startsWith('http')) {
      normalizedLinkedinUrl = 'https://' + normalizedLinkedinUrl;
    }

    onUpdate({
      name,
      email,
      phone: phone || null,
      headline,
      location,
      about,
      linkedin_url: normalizedLinkedinUrl
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
            onChange={handleBannerSelect}
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
        {/* Name and headline */}
        <div className="profile-identity">
          <h1 className="profile-name">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="inline-edit inline-edit-name"
                placeholder="Your name"
              />
            ) : (
              user.name
            )}
            <svg className="verified-badge" width="20" height="20" viewBox="0 0 24 24" fill="#007AFF">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </h1>
          {isEditing ? (
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              className="inline-edit inline-edit-headline"
              placeholder="e.g., Software Engineer at Company"
            />
          ) : (
            user.headline && <p className="profile-headline">{user.headline}</p>
          )}
          {isEditing ? (
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="inline-edit inline-edit-location"
              placeholder="e.g., San Francisco, CA"
            />
          ) : (
            user.location && <p className="profile-location">{user.location}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="profile-contact-info">
          {(isEditing || user.phone) && (
            <div className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              {isEditing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="inline-edit inline-edit-contact"
                  placeholder="(555) 123-4567"
                />
              ) : (
                <a href={`tel:${user.phone}`}>{user.phone}</a>
              )}
            </div>
          )}
          {(isEditing || user.email) && (
            <div className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="inline-edit inline-edit-contact"
                  placeholder="your@email.com"
                />
              ) : (
                <a href={`mailto:${user.email}`}>{user.email}</a>
              )}
            </div>
          )}
          {(isEditing || user.linkedin_url) && (
            <div className="contact-link linkedin">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              {isEditing ? (
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  className="inline-edit inline-edit-contact"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              ) : (
                <a
                  href={user.linkedin_url?.startsWith('http') ? user.linkedin_url : `https://${user.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn Profile
                </a>
              )}
            </div>
          )}
          {user.website && !isEditing && (
            <div className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Website
              </a>
            </div>
          )}
        </div>

        {/* Industry, Stage & Raising Info */}
        {!isEditing && (user.industry || user.stage || user.raising) && (
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
        {(isEditing || user.about) && (
          <div className="profile-section">
            <h2 className="section-title">
              About {user.headline?.replace('Founder at ', '') || 'Company'}
            </h2>
            {isEditing ? (
              <textarea
                value={about}
                onChange={e => setAbout(e.target.value)}
                className="inline-edit inline-edit-about"
                placeholder="Tell others about yourself..."
                rows={4}
              />
            ) : (
              <p className="about-text">{user.about}</p>
            )}
          </div>
        )}

        {/* Edit/Save Button */}
        {isEditing ? (
          <div className="edit-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="cancel-edit-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="save-btn" onClick={(e) => handleSave(e as unknown as FormEvent)}>
              Save
            </button>
          </div>
        ) : (
          <button className="save-btn" onClick={() => setIsEditing(true)} style={{ marginTop: '16px' }}>
            Edit Profile
          </button>
        )}
      </div>

      {/* Banner Crop Modal */}
      {bannerToCrop && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <div className="crop-modal-header">
              <h3>Crop Banner Image</h3>
            </div>
            <div className="crop-container">
              <Cropper
                image={bannerToCrop}
                crop={crop}
                zoom={zoom}
                aspect={16 / 5}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="crop-controls">
              <label className="zoom-label">
                Zoom
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="zoom-slider"
                />
              </label>
            </div>
            <div className="crop-actions">
              <button className="cancel-edit-btn" onClick={handleCropCancel}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleCropSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
