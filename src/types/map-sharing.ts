// src/types/map-sharing.ts
/**
 * Spatial Knowledge Sharing & Map Co-construction Types
 *
 * Enables agents to share discovered map sections and build collective knowledge.
 * Implements information diffusion from Park et al. (2023) for spatial exploration.
 */

import { Position } from './index';

export interface ExploredTile {
  position: Position;
  exploredBy: string;  // Agent ID
  exploredByName: string;  // Agent name
  timestamp: number;
  tileType: 'floor' | 'wall' | 'entrance' | 'exit';
  hasWalls: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
}

export interface SharedMapKnowledge {
  // Individual agent's exploration
  exploredTiles: Map<string, ExploredTile>;  // key: "x,y"

  // Knowledge shared from other agents
  sharedFromOthers: Map<string, ExploredTile[]>;  // agentId -> tiles shared by them

  // Important discoveries
  exitLocations: Position[];
  safeRooms: Position[];
  resourceLocations: Map<string, Position[]>;  // itemType -> positions

  // Statistics
  totalTilesExplored: number;
  totalTilesShared: number;
  lastShareTime: number;
}

export interface MapShareEvent {
  id: string;
  sharer: string;  // Agent sharing knowledge
  sharerName: string;
  recipient: string;  // Agent receiving knowledge
  recipientName: string;
  tilesShared: number;
  exitShared: boolean;
  safeRoomsShared: number;
  resourcesShared: number;
  timestamp: number;
  method: 'CONVERSATION' | 'PROXIMITY' | 'DELIBERATE';
}

export interface CollectiveMapKnowledge {
  // Team's combined exploration
  allExploredTiles: Map<string, ExploredTile>;

  // Contribution tracking
  explorationByAgent: Map<string, number>;  // agentId -> tiles explored

  // Important shared locations
  sharedExits: Position[];
  sharedSafeRooms: Position[];
  sharedResources: Map<string, Position[]>;

  // Coverage statistics
  totalUniqueTiles: number;
  explorationCoverage: number;  // 0-1 (percentage of maze explored)
  redundantExploration: number;  // tiles visited by multiple agents
}
