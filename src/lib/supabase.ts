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
    console.error('LinkedIn sign in error:', error.message);
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
    console.error('Sign out error:', error.message);
    throw error;
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Get session error:', error.message);
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
    console.error('Get profile error:', error.message);
    throw error;
  }

  return data;
}

/**
 * Get user's connections with profile data
 */
export async function getConnections(userId: string) {
  // Get connections where user is either user_a or user_b
  const { data: connections, error } = await supabase
    .from('connections')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  if (error) {
    console.error('Get connections error:', error.message);
    throw error;
  }

  if (!connections || connections.length === 0) {
    return [];
  }

  // Get the IDs of the other users in each connection
  const otherUserIds = connections.map(conn =>
    conn.user_a === userId ? conn.user_b : conn.user_a
  );

  // Fetch profiles for all connected users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', otherUserIds);

  if (profilesError) {
    console.error('Get connection profiles error:', profilesError.message);
    // Return connections without profile data if fetch fails
    return connections;
  }

  // Create a map of profiles by ID
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Attach profile data to each connection
  return connections.map(conn => {
    const otherUserId = conn.user_a === userId ? conn.user_b : conn.user_a;
    const profile = profileMap.get(otherUserId);
    return {
      ...conn,
      other_user_profile: profile || null,
    };
  });
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
    console.error('Create connection error:', error.message);
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
    console.error('Delete connection error:', error.message);
    throw error;
  }
}

/**
 * Get connection requests for a user (by user ID or phone number)
 */
export async function getConnectionRequests(userId: string, userPhone?: string | null) {
  let query = supabase
    .from('connection_requests')
    .select('*, from_profile:profiles!connection_requests_from_user_id_fkey(id, name, headline, avatar_url)')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  const { data, error } = await query;

  if (error) {
    console.error('Get connection requests error:', error.message);
    throw error;
  }

  return data || [];
}

/**
 * Get incoming requests by phone number (for users who haven't been matched yet)
 * Note: RLS policy filters to only requests where to_phone matches current user's phone
 */
export async function getIncomingRequestsByPhone(phone: string) {
  if (!phone) return [];

  // Normalize phone to just digits for query
  const normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length < 10) return [];

  // Query with server-side filtering - RLS policy handles security
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*, from_profile:profiles!connection_requests_from_user_id_fkey(id, name, headline, avatar_url)')
    .eq('status', 'pending')
    .is('to_user_id', null);

  if (error) {
    console.error('Get incoming requests by phone error:', error.message);
    throw error;
  }

  // RLS policy should filter, but double-check phone match for safety
  return (data || []).filter(req => {
    const reqPhone = (req.to_phone || '').replace(/\D/g, '');
    return reqPhone === normalizedPhone;
  });
}

/**
 * Create a connection request
 */
export async function createConnectionRequest(request: {
  from_user_id: string;
  to_phone: string;
  to_name?: string;
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
    console.error('Create connection request error:', error.message);
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
    console.error('Update connection request error:', error.message);
    throw error;
  }

  return data;
}

/**
 * Accept a connection request and create the connection
 */
export async function acceptConnectionRequest(requestId: string, currentUserId: string) {
  // Get the request details
  const { data: request, error: fetchError } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) {
    console.error('Fetch request error:', fetchError.message);
    throw fetchError;
  }

  // Create the connection
  const { error: connectionError } = await supabase
    .from('connections')
    .insert({
      user_a: request.from_user_id,
      user_b: currentUserId,
      connected_at: new Date().toISOString(),
    });

  if (connectionError) {
    console.error('Accept connection error:', connectionError.message);
    throw connectionError;
  }

  // Update the request status
  const { data, error: updateError } = await supabase
    .from('connection_requests')
    .update({
      status: 'accepted',
      to_user_id: currentUserId,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single();

  if (updateError) {
    console.error('Update request error:', updateError.message);
    throw updateError;
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
    console.error('Delete connection request error:', error.message);
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
  website?: string | null;
  industry?: string | null;
  stage?: string | null;
  raising?: boolean;
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
    website: profile.website ?? null,
    industry: profile.industry ?? null,
    stage: profile.stage ?? null,
    raising: profile.raising ?? false,
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
      console.error('Insert profile error:', insertError.message);
      throw insertError;
    }
    return insertData;
  }

  if (updateError) {
    console.error('Update profile error:', updateError.message);
    throw updateError;
  }

  return updateData;
}
