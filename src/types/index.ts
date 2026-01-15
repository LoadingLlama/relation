/**
 * TypeScript interfaces for Relation MVP
 */

/**
 * Simple connection info for displaying a user's contacts
 */
export interface ConnectionInfo {
  id: string;
  name: string;
  relationship_type: string;
}

/**
 * User profile
 */
export interface User {
  id: string;
  email: string;
  name: string;
  phone_hash: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  contribution_score: number;
  connections?: ConnectionInfo[];
  created_at: string;
  updated_at: string;
}

/**
 * Relationship request (pending connection)
 */
export interface RelationshipRequest {
  id: string;
  from_user_id: string;
  to_phone_hash: string;
  to_user_id: string | null;
  to_name: string;
  from_name?: string; // Name of person who sent request (for incoming)
  relationship_type: string;
  hide_reason: boolean;
  status: 'pending' | 'accepted' | 'declined';
  direction: 'outgoing' | 'incoming'; // outgoing = you sent, incoming = sent to you
  created_at: string;
  updated_at: string;
  // Joined data
  from_user?: User;
}

/**
 * Verified relationship (edge in graph)
 */
export interface Relationship {
  id: string;
  user_a: string;
  user_b: string;
  relationship_type: string;
  hide_reason: boolean;
  strength: number;
  last_interaction: string | null;
  verified_at: string;
  created_at: string;
  // Joined data
  user_a_data?: User;
  user_b_data?: User;
}

/**
 * Form data for creating a relationship request
 */
export interface RelationshipRequestForm {
  to_name: string;
  to_phone: string;
  relationship_type: string;
  hide_reason: boolean;
}

/**
 * Network depth levels
 */
export type NetworkDepth = 1 | 2 | 3;

export const NETWORK_DEPTH_LABELS: Record<NetworkDepth, string> = {
  1: 'Local Network',
  2: 'Extended Network',
  3: 'Global Network',
};

/**
 * Graph node for visualization
 */
export interface GraphNode {
  id: string;
  label: string;
  title?: string;
  color?: string | { background: string; border: string };
  size?: number;
  font?: { size: number; color: string; background?: string; vadjust?: number };
  opacity?: number;
  isCurrentUser?: boolean;
  x?: number;
  y?: number;
  fixed?: boolean | { x: boolean; y: boolean };
  physics?: boolean;
}

/**
 * Graph edge for visualization
 */
export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  width?: number;
  color?: string | { color: string; highlight?: string };
  dashes?: boolean | number[];
  smooth?: boolean | { enabled: boolean; type?: string; roundness?: number };
}

/**
 * Insights data
 */
export interface NetworkInsights {
  bridges: string[]; // User IDs who bridge clusters
  centralNodes: string[]; // Most connected users
  fadingRelationships: Relationship[]; // Last interaction > 3 months
  clusterCount: number;
  totalConnections: number;
}

/**
 * Graph filter state
 */
export interface GraphFilters {
  searchQuery: string;
  showHidden: boolean;
  minStrength: number;
  maxStrength: number;
}

/**
 * Category colors for relationship types
 */
export const RELATIONSHIP_COLORS: Record<string, string> = {
  family: '#e74c3c',
  friend: '#3498db',
  coworker: '#2ecc71',
  classmate: '#9b59b6',
  mentor: '#f39c12',
  neighbor: '#1abc9c',
  default: '#666666',
};

/**
 * Get color for relationship type
 */
export function getRelationshipColor(type: string): string {
  const normalized = type.toLowerCase();
  for (const [key, color] of Object.entries(RELATIONSHIP_COLORS)) {
    if (normalized.includes(key)) {
      return color;
    }
  }
  return RELATIONSHIP_COLORS.default;
}
