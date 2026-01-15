/**
 * Relation - Contacts App (macOS Contacts style)
 */

import { useState, useCallback, useEffect } from 'react';
import { ContactsList } from './components/Contacts';
import { AddRelationshipModal } from './components/Relationships/AddRelationshipModal';
import { PendingRequests } from './components/Relationships/PendingRequests';
import { AcceptRequestModal } from './components/Relationships/AcceptRequestModal';
import { ProfilePanel } from './components/Profile/ProfilePanel';
import { SelfProfilePanel } from './components/Profile/SelfProfilePanel';
import {
  Relationship,
  RelationshipRequest,
  RelationshipRequestForm,
  User,
} from './types';
import './App.css';

const STORAGE_KEYS = {
  USER: 'relation-user',
  RELATIONSHIPS: 'relation-relationships',
  REQUESTS: 'relation-requests',
};

// Demo user
const createDemoUser = (): User => ({
  id: crypto.randomUUID(),
  email: 'you@example.com',
  name: 'You',
  phone_hash: hashPhone('5551234567'),
  avatar_url: null,
  linkedin_url: null,
  contribution_score: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Generate random mock connections for a contact
const generateMockConnections = () => {
  const names = [
    'Emma Wilson', 'James Brown', 'Sophia Garcia', 'Liam Martinez',
    'Olivia Anderson', 'Noah Thomas', 'Ava Jackson', 'William White',
    'Isabella Harris', 'Benjamin Clark', 'Mia Lewis', 'Lucas Robinson'
  ];
  const types = ['Friend', 'Coworker', 'College friend', 'Family', 'Neighbor', 'Gym buddy'];
  const count = Math.floor(Math.random() * 5) + 2;

  const shuffled = [...names].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(name => ({
    id: crypto.randomUUID(),
    name,
    relationship_type: types[Math.floor(Math.random() * types.length)]
  }));
};

// Generate a random LinkedIn URL
const generateLinkedIn = (name: string) => {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  return `https://linkedin.com/in/${slug}-${Math.floor(Math.random() * 1000)}`;
};

// Simple hash function for demo
function hashPhone(phone: string): string {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) {
    const char = phone.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [requests, setRequests] = useState<RelationshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Relationship | null>(null);
  const [showSelfProfile, setShowSelfProfile] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState<RelationshipRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from localStorage
  useEffect(() => {
    let user = localStorage.getItem(STORAGE_KEYS.USER);
    if (!user) {
      const newUser = createDemoUser();
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      setCurrentUser(newUser);
    } else {
      setCurrentUser(JSON.parse(user));
    }

    const storedRels = localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS);
    if (storedRels) {
      setRelationships(JSON.parse(storedRels));
    }

    const storedReqs = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (storedReqs) {
      setRequests(JSON.parse(storedReqs));
    }

    setLoading(false);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loading && currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify(relationships));
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    }
  }, [relationships, requests, currentUser, loading]);

  // Pending counts
  const pendingCount = requests.filter(r => r.status === 'pending' && r.direction === 'incoming').length;
  const sentCount = requests.filter(r => r.status === 'pending' && r.direction === 'outgoing').length;

  // Create relationship request
  const handleAddRelationship = useCallback(async (data: RelationshipRequestForm) => {
    if (!currentUser) return;

    const newRequest: RelationshipRequest = {
      id: crypto.randomUUID(),
      from_user_id: currentUser.id,
      to_phone_hash: hashPhone(data.to_phone.replace(/\D/g, '')),
      to_user_id: null,
      to_name: data.to_name,
      relationship_type: data.relationship_type,
      hide_reason: data.hide_reason,
      status: 'pending',
      direction: 'outgoing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRequests(prev => [...prev, newRequest]);
  }, [currentUser]);

  // Simulate incoming request
  const simulateIncomingRequest = useCallback(() => {
    if (!currentUser) return;

    const names = ['Alex Chen', 'Jordan Smith', 'Taylor Kim', 'Morgan Lee', 'Casey Davis', 'Riley Johnson'];
    const types = ['Friend', 'Coworker', 'College friend', 'Neighbor', 'Family'];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const otherUserId = crypto.randomUUID();

    const newRequest: RelationshipRequest = {
      id: crypto.randomUUID(),
      from_user_id: otherUserId,
      to_phone_hash: currentUser.phone_hash || '',
      to_user_id: currentUser.id,
      to_name: currentUser.name,
      from_name: randomName,
      relationship_type: randomType,
      hide_reason: false,
      status: 'pending',
      direction: 'incoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRequests(prev => [...prev, newRequest]);
  }, [currentUser]);

  // Handle contact click
  const handleContactClick = useCallback((relationship: Relationship) => {
    setShowSelfProfile(false);
    setSelectedConnection(relationship);
  }, []);

  // Update current user profile
  const handleUpdateUser = useCallback((updates: Partial<User>) => {
    setCurrentUser(u => u ? { ...u, ...updates, updated_at: new Date().toISOString() } : u);
  }, []);

  // Accept an incoming request
  const acceptIncomingRequest = useCallback((requestId: string, relationshipType: string) => {
    if (!currentUser) return;

    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending' || request.direction !== 'incoming') return;

    const newRelationship: Relationship = {
      id: crypto.randomUUID(),
      user_a: currentUser.id,
      user_b: request.from_user_id,
      relationship_type: relationshipType,
      hide_reason: request.hide_reason,
      strength: 5,
      last_interaction: new Date().toISOString().split('T')[0],
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user_b_data: {
        id: request.from_user_id,
        email: '',
        name: request.from_name || 'Unknown',
        phone_hash: '',
        avatar_url: null,
        linkedin_url: generateLinkedIn(request.from_name || 'Unknown'),
        contribution_score: 1,
        connections: generateMockConnections(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    setRelationships(r => [...r, newRelationship]);
    setSelectedConnection(newRelationship);
    setCurrentUser(u => u ? { ...u, contribution_score: u.contribution_score + 1 } : u);
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const, relationship_type: relationshipType, updated_at: new Date().toISOString() } : r
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

  // Remove relationship
  const removeRelationship = useCallback((relationshipId: string) => {
    setRelationships(prev => prev.filter(r => r.id !== relationshipId));
    setSelectedConnection(null);
  }, []);

  // Simulate accept outgoing
  const simulateAcceptOutgoing = useCallback((requestId: string) => {
    if (!currentUser) return;

    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending' || request.direction !== 'outgoing') return;

    const otherUserId = crypto.randomUUID();
    const newRelationship: Relationship = {
      id: crypto.randomUUID(),
      user_a: currentUser.id,
      user_b: otherUserId,
      relationship_type: request.relationship_type,
      hide_reason: request.hide_reason,
      strength: 5,
      last_interaction: new Date().toISOString().split('T')[0],
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user_b_data: {
        id: otherUserId,
        email: '',
        name: request.to_name,
        phone_hash: request.to_phone_hash,
        avatar_url: null,
        linkedin_url: generateLinkedIn(request.to_name),
        contribution_score: 1,
        connections: generateMockConnections(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    setRelationships(r => [...r, newRelationship]);
    setSelectedConnection(newRelationship);
    setCurrentUser(u => u ? { ...u, contribution_score: u.contribution_score + 1 } : u);
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const, updated_at: new Date().toISOString() } : r
    ));
  }, [currentUser, requests]);

  // Filter relationships by search
  const filteredRelationships = relationships.filter(rel => {
    if (!searchQuery) return true;
    const name = rel.user_b_data?.name?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

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
            <div className="contacts-section">My Card</div>
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
          relationships={filteredRelationships}
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
          <div className="panel-footer-right">
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
        </div>
      </div>

      {/* Right Panel - Detail View */}
      <div className="detail-panel">
        {selectedConnection ? (
          <ProfilePanel
            relationship={selectedConnection}
            onClose={() => setSelectedConnection(null)}
            onRemove={() => removeRelationship(selectedConnection.id)}
            isLocalNetwork={true}
          />
        ) : showSelfProfile && currentUser ? (
          <SelfProfilePanel
            user={currentUser}
            onClose={() => setShowSelfProfile(false)}
            onUpdate={handleUpdateUser}
            totalConnections={relationships.length}
          />
        ) : (
          <div className="empty-detail">
            <span>No contact selected</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddRelationshipModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRelationship}
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

      {/* Simulate button for testing */}
      <button
        className="simulate-btn"
        onClick={simulateIncomingRequest}
        title="Simulate incoming request"
      >
        + Simulate
      </button>
    </div>
  );
}

export default App;
