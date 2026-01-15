/**
 * Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign in with LinkedIn OAuth
 */
export async function signInWithLinkedIn() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    console.error('LinkedIn sign in error:', error);
    throw error;
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Get session error:', error);
    throw error;
  }
  return session;
}

/**
 * Get or create user profile
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Get profile error:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's connections
 */
export async function getConnections(userId: string) {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  if (error) {
    console.error('Get connections error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new connection
 */
export async function createConnection(userA: string, userB: string) {
  const { data, error } = await supabase
    .from('connections')
    .insert({
      user_a: userA,
      user_b: userB,
      connected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Create connection error:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a connection
 */
export async function deleteConnection(connectionId: string) {
  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    console.error('Delete connection error:', error);
    throw error;
  }
}

/**
 * Get connection requests for a user
 */
export async function getConnectionRequests(userId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  if (error) {
    console.error('Get connection requests error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a connection request
 */
export async function createConnectionRequest(request: {
  from_user_id: string;
  to_phone: string;
  to_name: string;
}) {
  const { data, error } = await supabase
    .from('connection_requests')
    .insert({
      ...request,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Create connection request error:', error);
    throw error;
  }

  return data;
}

/**
 * Update connection request status
 */
export async function updateConnectionRequest(requestId: string, status: 'accepted' | 'declined') {
  const { data, error } = await supabase
    .from('connection_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    console.error('Update connection request error:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a connection request
 */
export async function deleteConnectionRequest(requestId: string) {
  const { error } = await supabase
    .from('connection_requests')
    .delete()
    .eq('id', requestId);

  if (error) {
    console.error('Delete connection request error:', error);
    throw error;
  }
}

/**
 * Create or update user profile
 */
export async function upsertProfile(profile: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  headline?: string | null;
  location?: string | null;
  about?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  onboarding_completed?: boolean;
}) {
  const profileData = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? null,
    headline: profile.headline ?? null,
    location: profile.location ?? null,
    about: profile.about ?? null,
    avatar_url: profile.avatar_url ?? null,
    linkedin_url: profile.linkedin_url ?? null,
    onboarding_completed: profile.onboarding_completed ?? false,
    updated_at: new Date().toISOString(),
  };

  // Try update first
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', profile.id)
    .select()
    .single();

  if (updateData) {
    console.log('Profile updated:', updateData);
    return updateData;
  }

  // If update failed (no rows), try insert
  if (updateError?.code === 'PGRST116') {
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        ...profileData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert profile error:', insertError);
      throw insertError;
    }
    console.log('Profile inserted:', insertData);
    return insertData;
  }

  if (updateError) {
    console.error('Update profile error:', updateError);
    throw updateError;
  }

  return updateData;
}
