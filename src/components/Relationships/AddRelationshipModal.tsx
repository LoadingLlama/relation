/**
 * Modal for adding a new connection request
 */

import { useState, FormEvent } from 'react';
import { ConnectionRequestForm } from '../../types';
import './Relationships.css';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: ConnectionRequestForm) => Promise<void>;
}

export function AddRelationshipModal({ isOpen, onClose, onAdd }: AddRelationshipModalProps) {
  const [formData, setFormData] = useState<ConnectionRequestForm>({
    to_name: '',
    to_phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
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

    setLoading(true);
    try {
      await onAdd(formData);
      setFormData({ to_name: '', to_phone: '' });
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
            <label htmlFor="name">Name</label>
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
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={formData.to_phone}
              onChange={e => setFormData(prev => ({ ...prev, to_phone: formatPhone(e.target.value) }))}
              placeholder="(555) 123-4567"
              required
            />
            <span className="form-hint">
              They'll receive a connection request
            </span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
