/**
 * Modal for accepting an incoming connection request
 * Simple accept/decline flow
 */

import { useState } from 'react';
import { ConnectionRequest } from '../../types';
import './Relationships.css';

interface AcceptRequestModalProps {
  isOpen: boolean;
  request: ConnectionRequest | null;
  onClose: () => void;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export function AcceptRequestModal({ isOpen, request, onClose, onAccept, onDecline }: AcceptRequestModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(request.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    onDecline(request.id);
    onClose();
  };

  return (
    <div className="modal-overlay accept-modal-overlay" onClick={onClose}>
      <div className="modal-content accept-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connection Request</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="accept-request-content">
          <div className="requester-info">
            <div className="requester-avatar">
              {request.from_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="requester-details">
              <span className="requester-name">{request.from_name}</span>
              {request.from_headline && (
                <span className="requester-headline">{request.from_headline}</span>
              )}
              <span className="requester-message">
                wants to connect with you
              </span>
            </div>
          </div>

          <div className="modal-actions accept-actions">
            <button type="button" className="btn-decline" onClick={handleDecline}>
              Decline
            </button>
            <button type="button" className="btn-accept" onClick={handleAccept} disabled={loading}>
              {loading ? 'Accepting...' : 'Accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
