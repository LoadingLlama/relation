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
  const [phoneDigits, setPhoneDigits] = useState(['', '', '', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getFormattedPhone = () => {
    const digits = phoneDigits.join('');
    if (digits.length < 10) return '';
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...phoneDigits];
    newDigits[index] = digit;
    setPhoneDigits(newDigits);

    if (digit && index < 9) {
      const nextInput = document.getElementById(`add-phone-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !phoneDigits[index] && index > 0) {
      const prevInput = document.getElementById(`add-phone-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
    const newDigits = [...phoneDigits];
    for (let i = 0; i < pastedData.length && i < 10; i++) {
      newDigits[i] = pastedData[i];
    }
    setPhoneDigits(newDigits);
  };

  const isPhoneComplete = phoneDigits.filter(d => d !== '').length === 10;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPhoneComplete) {
      setError('Please enter all 10 digits');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        to_phone: getFormattedPhone(),
      });
      setPhoneDigits(['', '', '', '', '', '', '', '', '', '']);
      onClose();
    } catch (err) {
      setError('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneDigits(['', '', '', '', '', '', '', '', '', '']);
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Connection</h2>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="relationship-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Phone Number</label>
            <div className="phone-digits-row">
              <div className="digit-group">
                {[0, 1, 2].map(i => (
                  <input
                    key={i}
                    id={`add-phone-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="phone-digit-input"
                    value={phoneDigits[i]}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    onPaste={i === 0 ? handleDigitPaste : undefined}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <span className="digit-sep">-</span>
              <div className="digit-group">
                {[3, 4, 5].map(i => (
                  <input
                    key={i}
                    id={`add-phone-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="phone-digit-input"
                    value={phoneDigits[i]}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                  />
                ))}
              </div>
              <span className="digit-sep">-</span>
              <div className="digit-group">
                {[6, 7, 8, 9].map(i => (
                  <input
                    key={i}
                    id={`add-phone-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="phone-digit-input"
                    value={phoneDigits[i]}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                  />
                ))}
              </div>
            </div>
            <span className="form-hint">
              They'll receive a connection request
            </span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !isPhoneComplete}>
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
