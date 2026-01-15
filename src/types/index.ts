/**
 * TypeScript interfaces for Relation
 */

/**
 * Simple connection info for displaying a user's contacts
 */
export interface ConnectionInfo {
  id: string;
  name: string;
  headline: string;
}

/**
 * User profile - LinkedIn-style
 */
export interface User {
  id: string;
  email: string;
  name: string;
  headline: string;
  location: string;
  about: string;
  phone: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  linkedin_url: string | null;
  website: string | null;
  industry: string | null;
  stage: string | null;
  raising: boolean;
  connection_count: number;
  connections?: ConnectionInfo[];
  created_at: string;
  updated_at: string;
}

/**
 * Connection request (pending connection)
 */
export interface ConnectionRequest {
  id: string;
  from_user_id: string;
  to_phone: string;
  to_user_id: string | null;
  to_name?: string; // Optional - phone-only requests don't require name
  from_name?: string;
  from_headline?: string;
  status: 'pending' | 'accepted' | 'declined';
  direction: 'outgoing' | 'incoming';
  created_at: string;
  updated_at: string;
  from_user?: User;
}

/**
 * Verified connection between two users
 */
export interface Connection {
  id: string;
  user_a: string;
  user_b: string;
  connected_at: string;
  created_at: string;
  // Joined data - the other user's profile
  user_b_data?: User;
}

/**
 * Form data for creating a connection request
 */
export interface ConnectionRequestForm {
  to_phone: string;
  to_name?: string;
}

// Legacy type aliases for compatibility
export type RelationshipRequest = ConnectionRequest;
export type Relationship = Connection;
export type RelationshipRequestForm = ConnectionRequestForm;
