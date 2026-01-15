/**
 * Relation - Professional Network App
 * With LinkedIn OAuth and onboarding flow
 */

import { useState, useCallback, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  supabase,
  getProfile,
  upsertProfile,
  signOut,
  getConnections,
  createConnectionRequest,
  deleteConnectionRequest,
} from './lib/supabase';
import { WelcomePage, OnboardingFlow } from './components/Onboarding';
import { ContactsList } from './components/Contacts';
import { AddRelationshipModal } from './components/Relationships/AddRelationshipModal';
import { PendingRequests } from './components/Relationships/PendingRequests';
import { AcceptRequestModal } from './components/Relationships/AcceptRequestModal';
import { ProfilePanel } from './components/Profile/ProfilePanel';
import { SelfProfilePanel } from './components/Profile/SelfProfilePanel';
import {
  Connection,
  ConnectionRequest,
  ConnectionRequestForm,
  User,
} from './types';
import './App.css';

// Sample headlines (format: Role at Company)
const HEADLINES = [
  'Software Engineer at Google',
  'Product Manager at Meta',
  'Student at UC Berkeley',
  'Founder & CEO at StartupX',
  'Marketing Lead at Apple',
  'Data Scientist at Netflix',
  'Designer at Airbnb',
  'Consultant at McKinsey',
  'Graduate Student at Stanford',
  'Full Stack Developer at Stripe',
  'Research Scientist at OpenAI',
  'Account Executive at Salesforce',
];

// Sample locations
const LOCATIONS = [
  'San Francisco Bay Area',
  'New York, NY',
  'Los Angeles, CA',
  'Seattle, WA',
  'Austin, TX',
  'Boston, MA',
  'Chicago, IL',
  'Denver, CO',
];

// Sample about texts
const ABOUT_TEXTS = [
  'Passionate about building products that make a difference. Always looking to connect with like-minded professionals.',
  'Experienced professional with a background in technology and innovation. Open to new opportunities and collaborations.',
  'Currently exploring the intersection of AI and user experience. Love meeting new people and sharing ideas.',
  'Dedicated to continuous learning and growth. Interested in startups, technology, and entrepreneurship.',
];

// Generate a random LinkedIn URL
const generateLinkedIn = (name: string) => {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  return `https://linkedin.com/in/${slug}-${Math.floor(Math.random() * 1000)}`;
};

// Generate random email
const generateEmail = (name: string) => {
  const slug = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.com'];
  return `${slug}@${domains[Math.floor(Math.random() * domains.length)]}`;
};

// Generate random phone number
const generatePhone = () => {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${prefix}-${line}`;
};

// Generate mock connections for a user
const generateMockConnections = () => {
  const names = [
    'Emma Wilson', 'James Brown', 'Sophia Garcia', 'Liam Martinez',
    'Olivia Anderson', 'Noah Thomas', 'Ava Jackson', 'William White',
    'Isabella Harris', 'Benjamin Clark', 'Mia Lewis', 'Lucas Robinson'
  ];
  const count = Math.floor(Math.random() * 5) + 2;

  const shuffled = [...names].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(name => ({
    id: crypto.randomUUID(),
    name,
    headline: HEADLINES[Math.floor(Math.random() * HEADLINES.length)]
  }));
};

// Generate a random user profile
const generateMockUser = (name: string): User => ({
  id: crypto.randomUUID(),
  email: generateEmail(name),
  name,
  headline: HEADLINES[Math.floor(Math.random() * HEADLINES.length)],
  location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
  about: ABOUT_TEXTS[Math.floor(Math.random() * ABOUT_TEXTS.length)],
  phone: generatePhone(),
  avatar_url: null,
  banner_url: null,
  linkedin_url: generateLinkedIn(name),
  connection_count: Math.floor(Math.random() * 400) + 50,
  connections: generateMockConnections(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Database profile type
interface DbProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  headline: string | null;
  location: string | null;
  about: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  linkedin_url: string | null;
  onboarding_completed: boolean;
}

// Convert DB profile to User type
const dbProfileToUser = (profile: DbProfile): User => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  headline: profile.headline || '',
  location: profile.location || '',
  about: profile.about || '',
  phone: profile.phone,
  avatar_url: profile.avatar_url,
  banner_url: profile.banner_url,
  linkedin_url: profile.linkedin_url,
  connection_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

function App() {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showSelfProfile, setShowSelfProfile] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState<ConnectionRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Listen for auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile and connections from database
  const loadProfile = async (userId: string) => {
    try {
      const data = await getProfile(userId);
      if (data) {
        setProfile(data as DbProfile);
        if (data.onboarding_completed) {
          setCurrentUser(dbProfileToUser(data as DbProfile));
          // Load connections from database
          try {
            const dbConnections = await getConnections(userId);
            // Convert to Connection type with mock user data for now
            const loadedConnections = dbConnections.map((conn: { id: string; user_a: string; user_b: string; connected_at: string; created_at?: string; connection_name?: string }) => ({
              id: conn.id,
              user_a: conn.user_a,
              user_b: conn.user_b,
              connected_at: conn.connected_at,
              created_at: conn.created_at || conn.connected_at,
              user_b_data: generateMockUser(conn.connection_name || 'Connection'),
            }));
            setConnections(loadedConnections);
          } catch (connErr) {
            console.error('Error loading connections:', connErr);
          }
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: { phone: string; location: string; headline: string; about: string }) => {
    if (!session?.user) {
      throw new Error('No active session');
    }

    // Get user metadata from LinkedIn
    const userData = session.user.user_metadata || {};
    const name = profile?.name || userData.full_name || userData.name || 'User';
    const email = profile?.email || session.user.email || '';
    const avatar_url = profile?.avatar_url || userData.avatar_url || userData.picture || null;

    // Get LinkedIn URL from provider data
    const linkedinUrl = userData.provider_id
      ? `https://linkedin.com/in/${userData.provider_id}`
      : userData.sub
        ? `https://linkedin.com/in/${userData.sub}`
        : null;

    // Auto-format headline with "Founder at" prefix
    const headline = data.headline ? `Founder at ${data.headline}` : null;

    const updatedProfile = await upsertProfile({
      id: session.user.id,
      name,
      email,
      phone: data.phone || null,
      location: data.location || null,
      about: data.about || null,
      headline,
      avatar_url,
      linkedin_url: linkedinUrl,
      onboarding_completed: true,
    });

    setProfile(updatedProfile as DbProfile);
    setCurrentUser(dbProfileToUser(updatedProfile as DbProfile));
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    setSession(null);
    setProfile(null);
    setCurrentUser(null);
  };

  // Pending counts
  const pendingCount = requests.filter(r => r.status === 'pending' && r.direction === 'incoming').length;
  const sentCount = requests.filter(r => r.status === 'pending' && r.direction === 'outgoing').length;

  // Create connection request
  const handleAddConnection = useCallback(async (data: ConnectionRequestForm) => {
    if (!currentUser) return;

    try {
      // Save to database
      const dbRequest = await createConnectionRequest({
        from_user_id: currentUser.id,
        to_phone: data.to_phone,
        to_name: data.to_name,
      });

      const newRequest: ConnectionRequest = {
        id: dbRequest.id,
        from_user_id: currentUser.id,
        to_phone: data.to_phone,
        to_user_id: null,
        to_name: data.to_name,
        status: 'pending',
        direction: 'outgoing',
        created_at: dbRequest.created_at,
        updated_at: dbRequest.updated_at || dbRequest.created_at,
      };

      setRequests(prev => [...prev, newRequest]);
    } catch (err) {
      console.error('Error creating connection request:', err);
      // Still add locally for demo purposes
      const newRequest: ConnectionRequest = {
        id: crypto.randomUUID(),
        from_user_id: currentUser.id,
        to_phone: data.to_phone,
        to_user_id: null,
        to_name: data.to_name,
        status: 'pending',
        direction: 'outgoing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRequests(prev => [...prev, newRequest]);
    }
  }, [currentUser]);

  // Simulate incoming request
  const simulateIncomingRequest = useCallback(() => {
    if (!currentUser) return;

    const names = ['Alex Chen', 'Jordan Smith', 'Taylor Kim', 'Morgan Lee', 'Casey Davis', 'Riley Johnson'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const otherUserId = crypto.randomUUID();

    const newRequest: ConnectionRequest = {
      id: crypto.randomUUID(),
      from_user_id: otherUserId,
      to_phone: currentUser.phone || '',
      to_user_id: currentUser.id,
      to_name: currentUser.name,
      from_name: randomName,
      from_headline: HEADLINES[Math.floor(Math.random() * HEADLINES.length)],
      status: 'pending',
      direction: 'incoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRequests(prev => [...prev, newRequest]);
  }, [currentUser]);

  // Handle contact click
  const handleContactClick = useCallback((connection: Connection) => {
    setShowSelfProfile(false);
    setSelectedConnection(connection);
  }, []);

  // Update current user profile
  const handleUpdateUser = useCallback(async (updates: Partial<User>) => {
    if (!session?.user) return;

    setCurrentUser(u => u ? { ...u, ...updates, updated_at: new Date().toISOString() } : u);

    // Also update in database
    try {
      await upsertProfile({
        id: session.user.id,
        name: updates.name || currentUser?.name || '',
        email: updates.email || currentUser?.email || '',
        phone: updates.phone,
        headline: updates.headline,
        location: updates.location,
        about: updates.about,
        avatar_url: updates.avatar_url,
        linkedin_url: updates.linkedin_url,
        onboarding_completed: true,
      });
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  }, [session, currentUser]);

  // Accept an incoming request
  const acceptIncomingRequest = useCallback((requestId: string) => {
    if (!currentUser) return;

    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending' || request.direction !== 'incoming') return;

    const newConnection: Connection = {
      id: crypto.randomUUID(),
      user_a: currentUser.id,
      user_b: request.from_user_id,
      connected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user_b_data: generateMockUser(request.from_name || 'Unknown'),
    };

    setConnections(c => [...c, newConnection]);
    setSelectedConnection(newConnection);
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const, updated_at: new Date().toISOString() } : r
    ));
  }, [currentUser, requests]);

  // Decline request
  const declineRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'declined' as const, updated_at: new Date().toISOString() } : r
    ));
  }, []);

  // Withdraw request
  const withdrawRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  // Remove connection
  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    setSelectedConnection(null);
  }, []);

  // Simulate accept outgoing
  const simulateAcceptOutgoing = useCallback((requestId: string) => {
    if (!currentUser) return;

    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending' || request.direction !== 'outgoing') return;

    const newConnection: Connection = {
      id: crypto.randomUUID(),
      user_a: currentUser.id,
      user_b: crypto.randomUUID(),
      connected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user_b_data: generateMockUser(request.to_name),
    };

    setConnections(c => [...c, newConnection]);
    setSelectedConnection(newConnection);
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const, updated_at: new Date().toISOString() } : r
    ));
  }, [currentUser, requests]);

  // Filter connections by search
  const filteredConnections = connections.filter(conn => {
    if (!searchQuery) return true;
    const name = conn.user_b_data?.name?.toLowerCase() || '';
    const headline = conn.user_b_data?.headline?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || headline.includes(query);
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in - show welcome page
  if (!session) {
    return <WelcomePage />;
  }

  // Logged in but no profile or onboarding not completed
  if (!profile || !profile.onboarding_completed) {
    // Get user data from session for onboarding
    const userData = session.user.user_metadata || {};
    return (
      <OnboardingFlow
        initialData={{
          name: profile?.name || userData.full_name || userData.name || 'User',
          email: profile?.email || session.user.email || '',
          avatar_url: profile?.avatar_url || userData.avatar_url || userData.picture,
          headline: profile?.headline || null,
        }}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Main app
  return (
    <div className={`app ${selectedConnection ? 'showing-detail' : ''}`}>
      {/* Left Panel - Contacts List */}
      <div className="contacts-panel">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* My Card section */}
        {currentUser && (
          <div className="my-card-section">
            <div className="contacts-section">My Profile</div>
            <div
              className={`my-card-item ${showSelfProfile ? 'selected' : ''}`}
              onClick={() => {
                setSelectedConnection(null);
                setShowSelfProfile(true);
              }}
            >
              <span>{currentUser.name}</span>
              <span className="my-card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </span>
            </div>
          </div>
        )}

        <ContactsList
          relationships={filteredConnections}
          onContactClick={handleContactClick}
          selectedId={selectedConnection?.id}
          currentUserId={currentUser?.id || ''}
        />

        {/* Footer with add button and requests */}
        <div className="panel-footer">
          <div className="panel-footer-left">
            <button
              className="icon-btn"
              onClick={() => setIsAddModalOpen(true)}
              title="Add connection"
            >
              +
            </button>
          </div>
          <div className="panel-footer-center">
            {(pendingCount > 0 || sentCount > 0) && (
              <button
                className="requests-badge"
                onClick={() => setShowRequests(true)}
              >
                Requests
                {pendingCount > 0 && <span className="count">{pendingCount}</span>}
              </button>
            )}
          </div>
          <div className="panel-footer-right">
            <button
              className="sign-out-btn"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Detail View */}
      <div className="detail-panel">
        {selectedConnection ? (
          <ProfilePanel
            connection={selectedConnection}
            onClose={() => setSelectedConnection(null)}
            onRemove={() => removeConnection(selectedConnection.id)}
          />
        ) : showSelfProfile && currentUser ? (
          <SelfProfilePanel
            user={currentUser}
            onClose={() => setShowSelfProfile(false)}
            onUpdate={handleUpdateUser}
          />
        ) : (
          <div className="empty-detail">
            <span>Select a connection to view their profile</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddRelationshipModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddConnection}
      />

      <PendingRequests
        isOpen={showRequests}
        onClose={() => setShowRequests(false)}
        requests={requests}
        onAcceptClick={(request) => setAcceptingRequest(request)}
        onSimulateAccept={simulateAcceptOutgoing}
        onWithdraw={withdrawRequest}
      />

      <AcceptRequestModal
        isOpen={acceptingRequest !== null}
        request={acceptingRequest}
        onClose={() => setAcceptingRequest(null)}
        onAccept={acceptIncomingRequest}
        onDecline={declineRequest}
      />
    </div>
  );
}

export default App;
