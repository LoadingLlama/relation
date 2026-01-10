/**
 * Modal for adding a new relationship request
 */

import { useState, FormEvent } from 'react';
import { RelationshipRequestForm } from '../../types';
import './Relationships.css';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: RelationshipRequestForm) => Promise<void>;
}

export function AddRelationshipModal({ isOpen, onClose, onAdd }: AddRelationshipModalProps) {
  const [formData, setFormData] = useState<RelationshipRequestForm>({
    to_name: '',
    to_phone: '',
    relationship_type: '',
    hide_reason: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.to_name.trim()) {
      setError('Name is required');
      return;
    }

    if (!validatePhone(formData.to_phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!formData.relationship_type.trim()) {
      setError('Relationship type is required');
      return;
    }

    const words = formData.relationship_type.trim().split(/\s+/);
    if (words.length > 2) {
      setError('Relationship type should be 1-2 words');
      return;
    }

    setLoading(true);
    try {
      await onAdd(formData);
      setFormData({ to_name: '', to_phone: '', relationship_type: '', hide_reason: false });
      onClose();
    } catch (err) {
      setError('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Connection</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="relationship-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Their Name *</label>
            <input
              id="name"
              type="text"
              value={formData.to_name}
              onChange={e => setFormData(prev => ({ ...prev, to_name: e.target.value }))}
              placeholder="Enter their name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Their Phone Number *</label>
            <input
              id="phone"
              type="tel"
              value={formData.to_phone}
              onChange={e => setFormData(prev => ({ ...prev, to_phone: e.target.value }))}
              placeholder="(555) 123-4567"
              required
            />
            <span className="form-hint">
              They'll need to verify with the same number
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="type">How do you know them? *</label>
            <input
              id="type"
              type="text"
              value={formData.relationship_type}
              onChange={e => setFormData(prev => ({ ...prev, relationship_type: e.target.value }))}
              placeholder="e.g., College friend, Coworker"
              maxLength={30}
              required
            />
            <span className="form-hint">1-2 words describing the relationship</span>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.hide_reason}
                onChange={e => setFormData(prev => ({ ...prev, hide_reason: e.target.checked }))}
              />
              <span>Hide relationship type from others</span>
            </label>
            <span className="form-hint">
              Only you and they will see how you know each other
            </span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-connect" disabled={loading}>
              {loading ? (
                'Connecting...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    <path d="M6 10V7H4v3H1v2h3v3h2v-3h3v-2H6z"/>
                  </svg>
                  Connect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
