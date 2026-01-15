/**
 * Panel showing connection requests and their status
 * Incoming requests shown first (requests sent TO you)
 * Outgoing requests shown below (requests you sent)
 */

import { ConnectionRequest } from '../../types';
import './Relationships.css';

interface PendingRequestsProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ConnectionRequest[];
  onAcceptClick: (request: ConnectionRequest) => void;
  onSimulateAccept: (requestId: string) => void;
  onWithdraw: (requestId: string) => void;
}

export function PendingRequests({ isOpen, onClose, requests, onAcceptClick, onSimulateAccept, onWithdraw }: PendingRequestsProps) {
  if (!isOpen) return null;

  // Incoming requests (sent TO you) - show first
  const incomingPending = requests.filter(r => r.status === 'pending' && r.direction === 'incoming');

  // Outgoing requests (you sent) - show below
  const outgoingPending = requests.filter(r => r.status === 'pending' && r.direction === 'outgoing');

  // Accepted/connected requests
  const acceptedRequests = requests.filter(r => r.status === 'accepted');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connection Requests</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="requests-list">
          {requests.length === 0 ? (
            <p className="empty-message">No requests yet</p>
          ) : (
            <>
              {/* Incoming requests - shown first */}
              {incomingPending.length > 0 && (
                <>
                  <div className="requests-section-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Requests for You
                  </div>
                  {incomingPending.map(request => (
                    <div key={request.id} className="request-item">
                      <div className="request-avatar">
                        {request.from_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="request-info">
                        <span className="request-name">{request.from_name}</span>
                        {request.from_headline && (
                          <span className="request-headline">{request.from_headline}</span>
                        )}
                      </div>
                      <div className="request-actions">
                        <button
                          className="accept-btn"
                          onClick={() => onAcceptClick(request)}
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Outgoing requests */}
              {outgoingPending.length > 0 && (
                <>
                  <div className="requests-section-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Sent
                  </div>
                  {outgoingPending.map(request => (
                    <div key={request.id} className="request-item">
                      <div className="request-avatar outgoing">
                        {request.to_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="request-info">
                        <span className="request-name">{request.to_name}</span>
                        <span className="request-headline">{request.to_phone}</span>
                      </div>
                      <div className="request-actions">
                        <span className="status-badge pending">Waiting</span>
                        <button
                          className="withdraw-btn"
                          onClick={() => onWithdraw(request.id)}
                          title="Withdraw this request"
                        >
                          Withdraw
                        </button>
                        <button
                          className="simulate-btn"
                          onClick={() => onSimulateAccept(request.id)}
                          title="Simulate the other person accepting"
                        >
                          Simulate Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Connected */}
              {acceptedRequests.length > 0 && (
                <>
                  <div className="requests-section-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Connected
                  </div>
                  {acceptedRequests.map(request => {
                    const name = request.direction === 'incoming' ? request.from_name : request.to_name;
                    const headline = request.direction === 'incoming' ? request.from_headline : request.to_phone;
                    return (
                      <div key={request.id} className="request-item">
                        <div className="request-avatar connected">
                          {name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="request-info">
                          <span className="request-name">{name}</span>
                          {headline && <span className="request-headline">{headline}</span>}
                        </div>
                        <span className="status-badge accepted">Connected</span>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
