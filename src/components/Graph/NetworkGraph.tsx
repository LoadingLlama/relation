/**
 * NetworkGraph component using Vis.js
 * Center node is locked with flexible physics
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { GraphNode, GraphEdge, NetworkDepth, NETWORK_DEPTH_LABELS } from '../../types';
import './Graph.css';

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (nodeId: string) => void;
  onAddConnection?: () => void;
  isAddModalOpen?: boolean;
  networkDepth: NetworkDepth;
  currentUserId?: string;
  expandedFriendId?: string | null;
  isStaggering?: boolean;
}

export function NetworkGraph({ nodes, edges, onNodeClick, onAddConnection, isAddModalOpen, networkDepth, currentUserId, expandedFriendId, isStaggering }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDataSetRef = useRef<DataSet<GraphNode>>(new DataSet());
  const edgesDataSetRef = useRef<DataSet<GraphEdge>>(new DataSet());
  const [isStabilized, setIsStabilized] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const handleNodeClick = useCallback((nodeId: string) => {
    onNodeClick(nodeId);
  }, [onNodeClick]);

  // Recenter view on the current user
  const handleRecenter = useCallback(() => {
    if (!networkRef.current || !currentUserId) return;

    networkRef.current.focus(currentUserId, {
      scale: 1,
      animation: {
        duration: 400,
        easingFunction: 'easeInOutQuad',
      },
    });
  }, [currentUserId]);

  // Zoom in
  const handleZoomIn = useCallback(() => {
    if (!networkRef.current) return;
    const scale = networkRef.current.getScale();
    networkRef.current.moveTo({
      scale: Math.min(scale * 1.3, 3),
      animation: { duration: 200, easingFunction: 'easeInOutQuad' },
    });
  }, []);

  // Zoom out
  const handleZoomOut = useCallback(() => {
    if (!networkRef.current) return;
    const scale = networkRef.current.getScale();
    networkRef.current.moveTo({
      scale: Math.max(scale / 1.3, 0.3),
      animation: { duration: 200, easingFunction: 'easeInOutQuad' },
    });
  }, []);

  // Show/hide preview node based on modal state
  useEffect(() => {
    const previewNodeId = 'preview-node';
    const previewEdgeId = 'preview-edge';

    if (isAddModalOpen && currentUserId && networkRef.current) {
      const network = networkRef.current;

      // Add preview node first
      const existingNode = nodesDataSetRef.current.get(previewNodeId);
      if (!existingNode) {
        nodesDataSetRef.current.add({
          id: previewNodeId,
          label: '?',
          color: { background: '#007AFF', border: '#007AFF' },
          size: 55,
          font: { color: '#fff', size: 18 },
          fixed: true,
          physics: false,
        } as GraphNode);

        edgesDataSetRef.current.add({
          id: previewEdgeId,
          from: currentUserId,
          to: previewNodeId,
          color: { color: '#007AFF' },
          width: 2,
          dashes: [8, 8],
          smooth: false,
        });

        // Move nodes to positions (much farther apart)
        network.moveNode(currentUserId, -350, 0);
        network.moveNode(previewNodeId, 350, 0);

        // Shift view much more left (higher x = content shifts left)
        setTimeout(() => {
          network.moveTo({
            position: { x: 300, y: 0 },
            scale: 1.0,
            animation: { duration: 300, easingFunction: 'easeInOutQuad' },
          });
        }, 50);

        // Animation: only fade the dashed line
        let opacity = 1;
        let fadeDirection = -1;

        animationRef.current = setInterval(() => {
          opacity += fadeDirection * 0.04;
          if (opacity <= 0.3) fadeDirection = 1;
          if (opacity >= 1) fadeDirection = -1;

          const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
          const edgeColor = `#007AFF${alpha}`;

          try {
            edgesDataSetRef.current.update({
              id: previewEdgeId,
              color: { color: edgeColor },
            });
          } catch {
            // Ignore if doesn't exist
          }
        }, 50);
      }
    } else {
      // Stop animation
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      // Remove preview
      const existingNode = nodesDataSetRef.current.get(previewNodeId);
      if (existingNode) {
        nodesDataSetRef.current.remove(previewNodeId);
        edgesDataSetRef.current.remove(previewEdgeId);
      }
      // Move "You" node back to center
      if (currentUserId && networkRef.current) {
        networkRef.current.moveNode(currentUserId, 0, 0);
        setTimeout(() => {
          networkRef.current?.moveTo({
            position: { x: 0, y: 0 },
            scale: 1,
            animation: { duration: 300, easingFunction: 'easeInOutQuad' },
          });
        }, 50);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isAddModalOpen, currentUserId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const options: Options = {
      nodes: {
        shape: 'dot',
        font: {
          size: 12,
          face: 'EB Garamond, Georgia, serif',
          color: '#1a1a1a',
          strokeWidth: 8,
          strokeColor: 'rgba(250, 250, 250, 0.95)',
          vadjust: 0,
        },
        borderWidth: 0,
        shadow: false,
        chosen: {
          node: (values: { opacity?: number }) => {
            values.opacity = 0.7;
          },
          label: false,
        },
      },
      edges: {
        smooth: false,
        font: {
          size: 11,
          face: 'EB Garamond, Georgia, serif',
          color: '#000',
          strokeWidth: 0,
          align: 'middle',
        },
        color: { inherit: false },
        shadow: false,
        chosen: {
          edge: (values: { opacity?: number }) => {
            values.opacity = 0.7;
          },
          label: false,
        },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 150,
          springConstant: 0.08,
          damping: 0.95,
          avoidOverlap: 0.5,
        },
        stabilization: {
          enabled: true,
          iterations: 50,
          updateInterval: 25,
          fit: false,
        },
        maxVelocity: 50,
        minVelocity: 0.5,
        timestep: 0.4,
      },
      interaction: {
        hover: true,
        tooltipDelay: 300,
        zoomView: nodes.length > 1,
        zoomSpeed: 0.3,
        dragView: nodes.length > 1,
        dragNodes: nodes.length > 1,
        multiselect: false,
        navigationButtons: false,
        keyboard: false,
      },
      layout: {
        randomSeed: 42,
        improvedLayout: true,
      },
    };

    // Process nodes - lock center node at fixed position
    const processedNodes = nodes.map(node => {
      if (node.isCurrentUser) {
        return {
          ...node,
          fixed: { x: true, y: true },
          x: 0,
          y: 0,
          physics: false,
        };
      }
      return {
        ...node,
        fixed: false,
        physics: true,
      };
    });

    nodesDataSetRef.current = new DataSet(processedNodes);
    edgesDataSetRef.current = new DataSet(edges);

    const network = new Network(
      containerRef.current,
      { nodes: nodesDataSetRef.current, edges: edgesDataSetRef.current },
      options
    );

    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const clickedId = params.nodes[0] as string;
        handleNodeClick(clickedId);

        // Deselect after brief highlight for all nodes
        setTimeout(() => {
          network.unselectAll();
        }, 300);
      }
    });

    network.on('hoverNode', () => {
      if (containerRef.current) containerRef.current.style.cursor = 'pointer';
    });

    network.on('blurNode', () => {
      if (containerRef.current) containerRef.current.style.cursor = 'default';
    });

    network.once('stabilizationIterationsDone', () => {
      setIsStabilized(true);
      network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    });

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, []);

  // Disable/enable physics based on staggering state
  useEffect(() => {
    if (!networkRef.current) return;

    if (isStaggering) {
      networkRef.current.setOptions({ physics: { enabled: false } });
    } else {
      networkRef.current.setOptions({ physics: { enabled: true } });
    }
  }, [isStaggering]);

  // Center on expanded friend or back to current user
  useEffect(() => {
    if (!networkRef.current) return;

    const targetId = expandedFriendId || currentUserId;
    if (!targetId) return;

    // Quick focus without extra stabilization
    networkRef.current.focus(targetId, {
      scale: 1,
      animation: {
        duration: 250,
        easingFunction: 'easeOutQuad',
      },
    });
  }, [expandedFriendId, currentUserId]);

  useEffect(() => {
    if (!networkRef.current) return;

    const nodesDataSet = nodesDataSetRef.current;
    const edgesDataSet = edgesDataSetRef.current;

    const currentNodeIds = new Set(nodesDataSet.getIds());
    const currentEdgeIds = new Set(edgesDataSet.getIds());

    // Process nodes - lock center node at fixed position
    const processedNodes = nodes.map(node => {
      // If viewing a friend's network, the friend is center
      if (expandedFriendId && node.id === expandedFriendId) {
        return {
          ...node,
          fixed: { x: true, y: true },
          x: 0,
          y: 0,
          physics: false,
        };
      }
      // Default view: current user is center
      if (!expandedFriendId && node.isCurrentUser) {
        return {
          ...node,
          fixed: { x: true, y: true },
          x: 0,
          y: 0,
          physics: false,
        };
      }
      // All other nodes float with physics
      return {
        ...node,
        fixed: false,
        physics: true,
      };
    });

    const newNodeIds = new Set(processedNodes.map(n => n.id));
    const newEdgeIds = new Set(edges.map(e => e.id));

    // Remove all nodes/edges that aren't in the new data
    currentNodeIds.forEach(id => {
      const idStr = id as string;
      if (idStr === 'preview-node') return;
      if (!newNodeIds.has(idStr)) {
        try {
          nodesDataSet.remove(id);
        } catch {
          // Ignore removal errors
        }
      }
    });

    currentEdgeIds.forEach(id => {
      const idStr = id as string;
      if (idStr === 'preview-edge') return;
      if (!newEdgeIds.has(idStr)) {
        try {
          edgesDataSet.remove(id);
        } catch {
          // Ignore removal errors
        }
      }
    });

    // Add or update nodes
    processedNodes.forEach(node => {
      if (nodesDataSet.get(node.id)) {
        nodesDataSet.update(node);
      } else {
        nodesDataSet.add(node);
      }
    });

    // Add or update edges
    edges.forEach(edge => {
      if (edgesDataSet.get(edge.id)) {
        edgesDataSet.update(edge);
      } else {
        edgesDataSet.add(edge);
      }
    });
  }, [nodes, edges, expandedFriendId]);

  const isEmpty = nodes.length <= 1;

  return (
    <div className="network-graph-container">
      {isStabilized && !isEmpty && (
        <div className="graph-controls-stack">
          <button className="zoom-btn" onClick={handleZoomIn} title="Zoom in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button className="zoom-btn" onClick={handleZoomOut} title="Zoom out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button className="recenter-btn" onClick={handleRecenter} title="Back to you">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>
        </div>
      )}

      <div ref={containerRef} className="network-graph" />

      {isEmpty && onAddConnection && !isAddModalOpen && (
        <button className="graph-hint" onClick={onAddConnection}>
          <em>Add a connection to start</em>
        </button>
      )}
    </div>
  );
}
