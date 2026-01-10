/**
 * Header component with app title and actions
 */

import './Layout.css';

interface HeaderProps {
  onAddContact: () => void;
  onShowRequests?: () => void;
  onShowSent?: () => void;
  pendingCount?: number;
  sentCount?: number;
}

export function Header({ onAddContact, onShowRequests, onShowSent, pendingCount = 0, sentCount = 0 }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="header-title">Relation</h1>
        <span className="header-tagline">Verified connections that matter</span>
      </div>

      <div className="header-actions">
        {onShowSent && sentCount > 0 && (
          <button className="sent-btn" onClick={onShowSent}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            Sent ({sentCount})
          </button>
        )}
        {onShowRequests && (
          <button className="requests-btn" onClick={onShowRequests}>
            {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
            Requests
          </button>
        )}
        <button className="add-btn" onClick={onAddContact}>
          <span className="add-icon">+</span>
          <span className="add-text">Add Connection</span>
        </button>
      </div>
    </header>
  );
}
