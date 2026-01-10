/**
 * Relation MVP - Verified Social Network Mapping
 *
 * Features:
 * - Add relationships with phone verification
 * - Mutual verification flow
 * - Progressive network unlock
 * - Network insights
 */

import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Layout';
import { NetworkGraph } from './components/Graph/NetworkGraph';
import { GraphControls } from './components/Graph/GraphControls';
import { InsightsPanel } from './components/Insights/InsightsPanel';
import { AddRelationshipModal } from './components/Relationships/AddRelationshipModal';
import { PendingRequests } from './components/Relationships/PendingRequests';
import { AcceptRequestModal } from './components/Relationships/AcceptRequestModal';
import { NetworkStatus } from './components/Network/NetworkStatus';
import { ProfilePanel } from './components/Profile/ProfilePanel';
import { SelfProfilePanel } from './components/Profile/SelfProfilePanel';
import {
  Relationship,
  RelationshipRequest,
  RelationshipRequestForm,
  User,
  GraphNode,
  GraphEdge,
  NetworkInsights,
  GraphFilters,
  getRelationshipColor,
  NetworkDepth
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
  contribution_score: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Generate deterministic mock connections for a friend based on their ID
function generateFriendConnections(friendId: string, friendName: string) {
  const names = [
    'Emma Wilson', 'Liam Johnson', 'Olivia Brown', 'Noah Davis', 'Ava Martinez',
    'Ethan Garcia', 'Sophia Anderson', 'Mason Thomas', 'Isabella Jackson', 'Lucas White'
  ];
  const types = ['Friend', 'Coworker', 'Family', 'College friend', 'Neighbor', 'Roommate'];

  // Use friend ID to generate consistent random connections
  let seed = 0;
  for (let i = 0; i < friendId.length; i++) {
    seed += friendId.charCodeAt(i);
  }

  const count = (seed % 4) + 2; // 2-5 connections
  const connections = [];

  for (let i = 0; i < count; i++) {
    const nameIndex = (seed + i * 7) % names.length;
    const typeIndex = (seed + i * 3) % types.length;
    connections.push({
      id: `${friendId}-conn-${i}`,
      name: names[nameIndex],
      relationship_type: types[typeIndex],
    });
  }

  return connections;
}

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
  const [filters, setFilters] = useState<GraphFilters>({
    searchQuery: '',
    showHidden: false,
    minStrength: 1,
    maxStrength: 10,
  });
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);
  const [isTransitioningBack, setIsTransitioningBack] = useState(false);
  const [visibleConnectionCount, setVisibleConnectionCount] = useState(100); // Start high so all show on load

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

  // Stagger connections appearing when transitioning back
  useEffect(() => {
    if (isTransitioningBack) {
      setVisibleConnectionCount(0);
      return;
    }

    if (!expandedFriendId && visibleConnectionCount === 0) {
      const totalConnections = relationships.length + requests.filter(r => r.status === 'pending' && r.direction === 'outgoing').length;
      let count = 0;
      let intervalId: NodeJS.Timeout;

      // Wait before starting to add nodes
      const startDelay = setTimeout(() => {
        intervalId = setInterval(() => {
          count++;
          setVisibleConnectionCount(count);
          if (count >= totalConnections) {
            clearInterval(intervalId);
          }
        }, 200); // 200ms between each node
      }, 500); // 500ms initial wait

      return () => {
        clearTimeout(startDelay);
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [isTransitioningBack, expandedFriendId, visibleConnectionCount, relationships.length, requests]);

  // Calculate network depth based on verified relationships
  const networkDepth: NetworkDepth = relationships.length >= 5 ? 3 : relationships.length >= 2 ? 2 : 1;

  // Pending INCOMING requests count (only show badge for requests sent TO you)
  const pendingCount = requests.filter(r => r.status === 'pending' && r.direction === 'incoming').length;

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
      direction: 'outgoing', // You sent this request
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRequests(prev => [...prev, newRequest]);

    // Request stays pending until the other person verifies
    // No auto-verify - this is a real pending state
  }, [currentUser]);

  // Simulate someone else sending us a connection request
  const simulateIncomingRequest = useCallback(() => {
    if (!currentUser) return;

    const names = ['Alex Chen', 'Jordan Smith', 'Taylor Kim', 'Morgan Lee', 'Casey Davis', 'Riley Johnson'];
    const types = ['Friend', 'Coworker', 'College friend', 'Neighbor', 'Family'];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const otherUserId = crypto.randomUUID();

    // Create an INCOMING request that you need to accept
    const newRequest: RelationshipRequest = {
      id: crypto.randomUUID(),
      from_user_id: otherUserId,
      to_phone_hash: currentUser.phone_hash || '',
      to_user_id: currentUser.id,
      to_name: currentUser.name,
      from_name: randomName, // The person who sent the request
      relationship_type: randomType,
      hide_reason: false,
      status: 'pending',
      direction: 'incoming', // Someone sent this to you
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRequests(prev => [...prev, newRequest]);
  }, [currentUser]);

  // Handle node click - show profile panel for connections or self
  const handleNodeClick = useCallback((nodeId: string) => {
    if (!currentUser) return;

    // Clicking on self - show self profile and revert view with smooth transition
    if (nodeId === currentUser.id) {
      setSelectedConnection(null);
      setShowSelfProfile(true);
      if (expandedFriendId) {
        setIsTransitioningBack(true);
        setExpandedFriendId(null);
        setTimeout(() => {
          setIsTransitioningBack(false);
        }, 300);
      }
      return;
    }

    // Skip pending nodes and friend-of-friend nodes
    if (nodeId.startsWith('pending-') || nodeId.startsWith('fof-')) {
      return;
    }

    // Find the relationship for this node
    const rel = relationships.find(r =>
      r.user_a === nodeId || r.user_b === nodeId
    );

    if (rel) {
      const friendId = rel.user_a === currentUser.id ? rel.user_b : rel.user_a;

      // If clicking the same expanded friend, collapse everything with smooth transition
      if (expandedFriendId === friendId) {
        setSelectedConnection(null);
        setIsTransitioningBack(true);
        setExpandedFriendId(null);
        setTimeout(() => {
          setIsTransitioningBack(false);
        }, 300);
      } else {
        // Expand this friend's network
        setShowSelfProfile(false);
        setSelectedConnection(rel);
        setExpandedFriendId(friendId);
      }
    }
  }, [currentUser, relationships, expandedFriendId]);

  // Update current user profile
  const handleUpdateUser = useCallback((updates: Partial<User>) => {
    setCurrentUser(u => u ? { ...u, ...updates, updated_at: new Date().toISOString() } : u);
  }, []);

  // Accept an incoming request with your own relationship type
  const acceptIncomingRequest = useCallback((requestId: string, relationshipType: string) => {
    if (!currentUser) return;

    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending' || request.direction !== 'incoming') return;

    // Create verified relationship
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
        contribution_score: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    setRelationships(r => [...r, newRelationship]);
    setCurrentUser(u => u ? { ...u, contribution_score: u.contribution_score + 1 } : u);
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const, relationship_type: relationshipType, updated_at: new Date().toISOString() } : r
    ));
  }, [currentUser, requests]);

  // Decline an incoming request
  const declineRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'declined' as const, updated_at: new Date().toISOString() } : r
    ));
  }, []);

  // Withdraw an outgoing request
  const withdrawRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  // Remove a connected relationship
  const removeRelationship = useCallback((relationshipId: string) => {
    setRelationships(prev => prev.filter(r => r.id !== relationshipId));
    setSelectedConnection(null);
  }, []);

  // Simulate the other person accepting your outgoing request
  const simulateAcceptOutgoing = useCallback((requestId: string) => {
    if (!currentUser) return;

    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending' || request.direction !== 'outgoing') return;

    // Create verified relationship
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
        contribution_score: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    setRelationships(r => [...r, newRelationship]);
    setCurrentUser(u => u ? { ...u, contribution_score: u.contribution_score + 1 } : u);
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const, updated_at: new Date().toISOString() } : r
    ));
  }, [currentUser, requests]);


  // Build graph data
  const buildGraphData = useCallback((): { nodes: GraphNode[]; edges: GraphEdge[] } => {
    if (!currentUser) return { nodes: [], edges: [] };

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const addedUsers = new Set<string>();

    const isViewingFriend = expandedFriendId !== null;

    // If viewing a friend's network, show THEIR network instead of yours
    if (isViewingFriend) {
      // Find the expanded friend's data
      const expandedRel = relationships.find(r =>
        r.user_b === expandedFriendId || r.user_a === expandedFriendId
      );
      const expandedFriendData = expandedRel?.user_b_data;

      if (expandedFriendData) {
        // Add the friend as center node (big)
        nodes.push({
          id: expandedFriendId,
          label: expandedFriendData.name,
          color: { background: '#007AFF', border: '#007AFF' },
          size: 55,
          font: { size: 16, color: '#1a1a1a' },
        });
        addedUsers.add(expandedFriendId);

        // Add "You" as one of their connections
        nodes.push({
          id: currentUser.id,
          label: currentUser.name,
          color: { background: '#000000', border: '#333333' },
          size: 32,
          font: { size: 12, color: '#1a1a1a' },
          isCurrentUser: true,
        });
        addedUsers.add(currentUser.id);

        // Edge from friend to you
        edges.push({
          id: `edge-you-${expandedFriendId}`,
          from: expandedFriendId,
          to: currentUser.id,
          width: 2,
          color: { color: '#000000' },
          dashes: false,
          smooth: false,
        });

        // Add friend's other connections
        // Check which of friend's connections are also YOUR connections (mutual)
        const yourConnectionNames = new Set(
          relationships.map(r => r.user_b_data?.name?.toLowerCase()).filter(Boolean)
        );

        const friendConnections = generateFriendConnections(expandedFriendId, expandedFriendData.name);
        friendConnections.forEach((conn, index) => {
          const fofId = `fof-${expandedFriendId}-${index}`;
          const isMutual = yourConnectionNames.has(conn.name.toLowerCase());
          const nodeColor = isMutual ? '#007AFF' : '#999999'; // Blue if mutual, gray otherwise

          nodes.push({
            id: fofId,
            label: conn.name,
            title: conn.relationship_type,
            color: { background: nodeColor, border: nodeColor },
            size: 32,
          });
          addedUsers.add(fofId);

          edges.push({
            id: `edge-fof-${expandedFriendId}-${index}`,
            from: expandedFriendId,
            to: fofId,
            width: 2,
            color: { color: nodeColor },
            dashes: false,
            smooth: false,
          });
        });
      }

      return { nodes, edges };
    }

    // Default view: Your network
    nodes.push({
      id: currentUser.id,
      label: currentUser.name,
      color: { background: '#000000', border: '#333333' },
      size: 55,
      font: { size: 16, color: '#1a1a1a' },
      isCurrentUser: true,
    });
    addedUsers.add(currentUser.id);

    // If transitioning back, only show "You" first
    if (isTransitioningBack) {
      return { nodes, edges };
    }

    // Track how many connections we've added for staggered reveal
    let addedCount = 0;

    // Filter verified relationships
    const filtered = relationships.filter(rel => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const otherUser = rel.user_b_data;
        if (otherUser && !otherUser.name.toLowerCase().includes(query)) return false;
      }
      return true;
    });

    // Add verified relationship nodes and edges (staggered)
    filtered.forEach(rel => {
      if (addedCount >= visibleConnectionCount) return;

      const otherId = rel.user_a === currentUser.id ? rel.user_b : rel.user_a;
      const otherUser = rel.user_b_data;

      if (!addedUsers.has(otherId) && otherUser) {
        nodes.push({
          id: otherId,
          label: otherUser.name,
          title: rel.relationship_type,
          color: { background: '#007AFF', border: '#007AFF' },
          size: 38,
        });
        addedUsers.add(otherId);
        addedCount++;
      }

      edges.push({
        id: rel.id,
        from: currentUser.id,
        to: otherId,
        width: 3,
        color: { color: '#007AFF', highlight: '#0066DD' },
        dashes: false,
        smooth: false,
      });
    });

    // Add pending requests as faded gray nodes (staggered, after relationships)
    const pendingRequests = requests.filter(r => r.status === 'pending' && r.direction === 'outgoing');
    pendingRequests.forEach(req => {
      if (addedCount >= visibleConnectionCount) return;

      const nodeId = `pending-${req.id}`;
      const displayName = req.to_name;

      if (!addedUsers.has(nodeId) && displayName) {
        nodes.push({
          id: nodeId,
          label: displayName,
          title: `Pending: ${req.relationship_type}`,
          color: { background: '#cccccc', border: '#cccccc' },
          size: 32,
        });
        addedUsers.add(nodeId);
        addedCount++;

        edges.push({
          id: `edge-${req.id}`,
          from: currentUser.id,
          to: nodeId,
          width: 2,
          color: { color: '#cccccc' },
          dashes: [5, 5],
          smooth: false,
        });
      }
    });

    return { nodes, edges };
  }, [currentUser, relationships, requests, filters, expandedFriendId, isTransitioningBack, visibleConnectionCount]);

  // Calculate insights
  const calculateInsights = useCallback((): NetworkInsights => {
    const connectionCounts: Record<string, number> = {};
    relationships.forEach(rel => {
      connectionCounts[rel.user_a] = (connectionCounts[rel.user_a] || 0) + 1;
      connectionCounts[rel.user_b] = (connectionCounts[rel.user_b] || 0) + 1;
    });

    const centralNodes = Object.entries(connectionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const fadingRelationships = relationships.filter(rel => {
      if (!rel.last_interaction) return true;
      return new Date(rel.last_interaction) < threeMonthsAgo;
    });

    return {
      bridges: [], // Would need full graph analysis
      centralNodes,
      fadingRelationships,
      clusterCount: 1,
      totalConnections: relationships.length,
    };
  }, [relationships]);

  const graphData = buildGraphData();
  const insights = calculateInsights();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your network...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header
        onAddContact={() => setIsAddModalOpen(true)}
        onShowRequests={() => setShowRequests(true)}
        onShowSent={() => setShowRequests(true)}
        pendingCount={pendingCount}
        sentCount={requests.filter(r => r.status === 'pending' && r.direction === 'outgoing').length}
      />

      <main className={`dashboard-main ${relationships.length === 0 ? 'empty' : ''}`}>
        {relationships.length > 0 && (
          <aside className="dashboard-sidebar">
            <GraphControls
              filters={filters}
              onFilterChange={(f) => setFilters(prev => ({ ...prev, ...f }))}
              onReset={() => setFilters({ searchQuery: '', showHidden: false, minStrength: 1, maxStrength: 10 })}
              totalConnections={relationships.length}
              filteredCount={graphData.nodes.length - 1}
            />

            <InsightsPanel
              insights={insights}
              networkDepth={networkDepth}
            />
          </aside>
        )}

        <section className="dashboard-graph">
          <NetworkGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeClick={handleNodeClick}
            onAddConnection={() => setIsAddModalOpen(true)}
            isAddModalOpen={isAddModalOpen}
            networkDepth={networkDepth}
            currentUserId={currentUser?.id}
            expandedFriendId={expandedFriendId}
            isStaggering={!expandedFriendId && visibleConnectionCount < relationships.length}
          />
        </section>
      </main>

      {selectedConnection && (
        <ProfilePanel
          relationship={selectedConnection}
          onClose={() => {
            setSelectedConnection(null);
            // Start smooth transition back
            setIsTransitioningBack(true);
            setExpandedFriendId(null);
            // After centering, show connections
            setTimeout(() => {
              setIsTransitioningBack(false);
            }, 300);
          }}
          onRemove={() => removeRelationship(selectedConnection.id)}
          isLocalNetwork={true}
        />
      )}

      {showSelfProfile && currentUser && (
        <SelfProfilePanel
          user={currentUser}
          onClose={() => setShowSelfProfile(false)}
          onUpdate={handleUpdateUser}
          totalConnections={relationships.length}
        />
      )}

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
        className="simulate-connection-btn"
        onClick={simulateIncomingRequest}
        title="Add a random test connection"
      >
        + Simulate
      </button>
    </div>
  );
}

export default App;
