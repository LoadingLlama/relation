/**
 * Minimal graph controls for filtering the network
 */

import { GraphFilters } from '../../types';
import './Graph.css';

interface GraphControlsProps {
  filters: GraphFilters;
  onFilterChange: (filters: Partial<GraphFilters>) => void;
  onReset: () => void;
  totalConnections: number;
  filteredCount: number;
}

export function GraphControls({
  filters,
  onFilterChange,
  onReset,
  totalConnections,
}: GraphControlsProps) {
  const hasActiveFilters = filters.searchQuery !== '' || filters.showHidden;

  // Don't show controls if no connections yet
  if (totalConnections === 0) {
    return null;
  }

  return (
    <div className="graph-controls">
      <div className="controls-header">
        <h3>Search</h3>
        {hasActiveFilters && (
          <button className="reset-btn" onClick={onReset}>
            Clear
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Find someone..."
        value={filters.searchQuery}
        onChange={e => onFilterChange({ searchQuery: e.target.value })}
        className="search-input"
      />

      <label className="checkbox-label-small">
        <input
          type="checkbox"
          checked={filters.showHidden}
          onChange={e => onFilterChange({ showHidden: e.target.checked })}
        />
        <span>Show hidden</span>
      </label>
    </div>
  );
}
