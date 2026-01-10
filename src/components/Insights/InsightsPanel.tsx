/**
 * Insights panel showing network analytics
 */

import { NetworkInsights, NetworkDepth } from '../../types';
import './Insights.css';

interface InsightsPanelProps {
  insights: NetworkInsights;
  networkDepth: NetworkDepth;
}

export function InsightsPanel({ insights, networkDepth }: InsightsPanelProps) {
  const isLocked = networkDepth < 2;

  if (isLocked) {
    return (
      <div className="insights-panel locked">
        <h3>Network Insights</h3>
        <p className="locked-message">
          Add 2+ verified connections to unlock insights
        </p>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      <h3>Network Insights</h3>

      <div className="insight-item">
        <span className="insight-label">Total Connections</span>
        <span className="insight-value">{insights.totalConnections}</span>
      </div>

      {insights.fadingRelationships.length > 0 && (
        <div className="insight-item warning">
          <span className="insight-label">Fading Connections</span>
          <span className="insight-value">{insights.fadingRelationships.length}</span>
          <p className="insight-hint">
            Haven't interacted in 3+ months
          </p>
        </div>
      )}

      {networkDepth >= 3 && (
        <>
          <div className="insight-item">
            <span className="insight-label">Network Clusters</span>
            <span className="insight-value">{insights.clusterCount}</span>
          </div>

          {insights.bridges.length > 0 && (
            <div className="insight-item highlight">
              <span className="insight-label">Bridge Connectors</span>
              <span className="insight-value">{insights.bridges.length}</span>
              <p className="insight-hint">
                People connecting different groups
              </p>
            </div>
          )}
        </>
      )}

      {networkDepth < 3 && (
        <div className="insight-locked">
          <p>Add {5 - insights.totalConnections} more connections to unlock full insights</p>
        </div>
      )}
    </div>
  );
}
