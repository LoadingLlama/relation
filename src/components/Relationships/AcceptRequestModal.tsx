/**
 * Modal for accepting an incoming connection request
 * Allows user to verify and optionally modify how they know the person
 */

import { useState, FormEvent } from 'react';
import { RelationshipRequest } from '../../types';
import './Relationships.css';

interface AcceptRequestModalProps {
  isOpen: boolean;
  request: RelationshipRequest | null;
  onClose: () => void;
  onAccept: (requestId: string, relationshipType: string) => void;
  onDecline: (requestId: string) => void;
}

export function AcceptRequestModal({ isOpen, request, onClose, onAccept, onDecline }: AcceptRequestModalProps) {
  const [relationshipType, setRelationshipType] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when request changes
  if (request && relationshipType === '' && request.relationship_type) {
    setRelationshipType(request.relationship_type);
  }

  if (!isOpen || !request) return null;

  const handleAccept = async (e: FormEvent) => {
    e.preventDefault();
    if (!relationshipType.trim()) return;

    setLoading(true);
    try {
      await onAccept(request.id, relationshipType);
      setRelationshipType('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    onDecline(request.id);
    setRelationshipType('');
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
              <span className="requester-says">
                says you're their <em>{request.relationship_type}</em>
              </span>
            </div>
          </div>

          <form onSubmit={handleAccept} className="accept-form">
            <div className="form-group">
              <label htmlFor="accept-type">How do you know them?</label>
              <input
                id="accept-type"
                type="text"
                value={relationshipType}
                onChange={e => setRelationshipType(e.target.value)}
                placeholder="e.g., Friend, Coworker, Classmate"
                maxLength={30}
                required
              />
              <span className="form-hint">Confirm or update how you know each other</span>
            </div>

            <div className="modal-actions accept-actions">
              <button type="button" className="btn-decline" onClick={handleDecline}>
                Decline
              </button>
              <button type="submit" className="btn-accept" disabled={loading || !relationshipType.trim()}>
                {loading ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
