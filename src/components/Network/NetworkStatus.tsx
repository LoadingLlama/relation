/**
 * Minimal network status indicator
 */

import { NetworkDepth, NETWORK_DEPTH_LABELS } from '../../types';
import './Network.css';

interface NetworkStatusProps {
  depth: NetworkDepth;
  contributionScore: number;
  totalConnections: number;
}

export function NetworkStatus({ depth, totalConnections }: NetworkStatusProps) {
  // Don't show status bar when empty - keep it clean
  if (totalConnections === 0) {
    return null;
  }

  const getNextMilestone = () => {
    if (totalConnections < 2) return { target: 2, current: totalConnections };
    if (totalConnections < 5) return { target: 5, current: totalConnections };
    return null;
  };

  const milestone = getNextMilestone();

  return (
    <div className="network-status">
      <span className="status-text">
        {NETWORK_DEPTH_LABELS[depth]}
      </span>

      {milestone && (
        <span className="status-progress">
          {milestone.current}/{milestone.target} to unlock next level
        </span>
      )}
    </div>
  );
}
