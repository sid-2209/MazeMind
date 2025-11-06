// src/systems/MapSharingSystem.ts
/**
 * Map Sharing System
 *
 * Implements spatial knowledge sharing between agents.
 * Agents share discovered map sections to create collective maze knowledge.
 *
 * Based on Park et al. (2023) Section 7.1.1 - Information Diffusion
 */

import { Agent } from '../agent/Agent';
import { Maze, Position } from '../types';
import {
  ExploredTile,
  SharedMapKnowledge,
  MapShareEvent,
  CollectiveMapKnowledge
} from '../types/map-sharing';
import { v4 as uuidv4 } from 'uuid';

export class MapSharingSystem {
  // Per-agent map knowledge
  private agentMaps: Map<string, SharedMapKnowledge> = new Map();

  // Collective team knowledge
  private collectiveMap: CollectiveMapKnowledge;

  // Share event history
  private shareEvents: MapShareEvent[] = [];

  // Configuration
  private readonly SHARE_RANGE = 5;  // Tiles - how close agents must be to auto-share
  private readonly SHARE_COOLDOWN = 10000;  // ms - prevent spam

  // Reference to maze for validation
  private maze: Maze;

  constructor(maze: Maze) {
    this.maze = maze;

    this.collectiveMap = {
      allExploredTiles: new Map(),
      explorationByAgent: new Map(),
      sharedExits: [],
      sharedSafeRooms: [],
      sharedResources: new Map(),
      totalUniqueTiles: 0,
      explorationCoverage: 0,
      redundantExploration: 0
    };

    console.log('🗺️  Map Sharing System initialized');
  }

  /**
   * Initialize map knowledge for an agent
   */
  initializeAgentMap(agentId: string): void {
    if (!this.agentMaps.has(agentId)) {
      const mapKnowledge: SharedMapKnowledge = {
        exploredTiles: new Map(),
        sharedFromOthers: new Map(),
        exitLocations: [],
        safeRooms: [],
        resourceLocations: new Map(),
        totalTilesExplored: 0,
        totalTilesShared: 0,
        lastShareTime: 0
      };

      this.agentMaps.set(agentId, mapKnowledge);
      this.collectiveMap.explorationByAgent.set(agentId, 0);
    }
  }

  /**
   * Record that an agent has explored a tile
   */
  recordExploration(
    agent: Agent,
    position: Position,
    tileType: 'floor' | 'wall' | 'entrance' | 'exit',
    hasWalls: { north: boolean; south: boolean; east: boolean; west: boolean }
  ): void {
    const agentId = agent.getId();
    const mapKnowledge = this.agentMaps.get(agentId);
    if (!mapKnowledge) return;

    const key = `${position.x},${position.y}`;

    // Check if already explored by this agent
    if (mapKnowledge.exploredTiles.has(key)) return;

    const exploredTile: ExploredTile = {
      position,
      exploredBy: agentId,
      exploredByName: agent.getName(),
      timestamp: Date.now(),
      tileType,
      hasWalls
    };

    // Add to agent's map
    mapKnowledge.exploredTiles.set(key, exploredTile);
    mapKnowledge.totalTilesExplored++;

    // Add to collective map
    if (!this.collectiveMap.allExploredTiles.has(key)) {
      this.collectiveMap.allExploredTiles.set(key, exploredTile);
      this.collectiveMap.totalUniqueTiles++;
    } else {
      // Tile was already explored by another agent - redundant exploration
      this.collectiveMap.redundantExploration++;
    }

    // Update agent contribution
    const currentCount = this.collectiveMap.explorationByAgent.get(agentId) || 0;
    this.collectiveMap.explorationByAgent.set(agentId, currentCount + 1);

    // Update exploration coverage
    const totalTiles = this.maze.width * this.maze.height;
    this.collectiveMap.explorationCoverage = this.collectiveMap.totalUniqueTiles / totalTiles;

    // Record important discoveries
    if (tileType === 'exit') {
      mapKnowledge.exitLocations.push(position);
    }
  }

  /**
   * Share map knowledge between two agents
   */
  shareMapKnowledge(sharer: Agent, recipient: Agent): MapShareEvent | null {
    const sharerId = sharer.getId();
    const recipientId = recipient.getId();

    const sharerMap = this.agentMaps.get(sharerId);
    const recipientMap = this.agentMaps.get(recipientId);

    if (!sharerMap || !recipientMap) {
      console.warn('⚠️  Cannot share maps - agent maps not initialized');
      return null;
    }

    // Check cooldown
    const now = Date.now();
    if (now - recipientMap.lastShareTime < this.SHARE_COOLDOWN) {
      return null;  // Too soon since last share
    }

    // Find tiles that sharer knows but recipient doesn't
    const newTiles: ExploredTile[] = [];
    let exitShared = false;
    let safeRoomsShared = 0;
    let resourcesShared = 0;

    for (const [key, tile] of sharerMap.exploredTiles) {
      if (!recipientMap.exploredTiles.has(key)) {
        newTiles.push(tile);

        // Add to recipient's knowledge
        recipientMap.exploredTiles.set(key, tile);

        // Track important discoveries
        if (tile.tileType === 'exit') {
          recipientMap.exitLocations.push(tile.position);
          exitShared = true;
        }
      }
    }

    // Share safe room and resource knowledge
    for (const safeRoom of sharerMap.safeRooms) {
      const key = `${safeRoom.x},${safeRoom.y}`;
      if (!recipientMap.safeRooms.some(r => `${r.x},${r.y}` === key)) {
        recipientMap.safeRooms.push(safeRoom);
        safeRoomsShared++;
      }
    }

    for (const [itemType, locations] of sharerMap.resourceLocations) {
      const recipientResources = recipientMap.resourceLocations.get(itemType) || [];
      for (const loc of locations) {
        const key = `${loc.x},${loc.y}`;
        if (!recipientResources.some(r => `${r.x},${r.y}` === key)) {
          recipientResources.push(loc);
          resourcesShared++;
        }
      }
      recipientMap.resourceLocations.set(itemType, recipientResources);
    }

    if (newTiles.length === 0 && safeRoomsShared === 0 && resourcesShared === 0) {
      return null;  // No new knowledge to share
    }

    // Track shared tiles
    const existingShared = recipientMap.sharedFromOthers.get(sharerId) || [];
    recipientMap.sharedFromOthers.set(sharerId, [...existingShared, ...newTiles]);
    recipientMap.totalTilesShared += newTiles.length;
    recipientMap.lastShareTime = now;

    // Add memory to recipient
    this.addMapShareMemory(recipient, sharer, newTiles.length, exitShared, safeRoomsShared, resourcesShared);

    // Create share event
    const shareEvent: MapShareEvent = {
      id: uuidv4(),
      sharer: sharerId,
      sharerName: sharer.getName(),
      recipient: recipientId,
      recipientName: recipient.getName(),
      tilesShared: newTiles.length,
      exitShared,
      safeRoomsShared,
      resourcesShared,
      timestamp: now,
      method: 'CONVERSATION'
    };

    this.shareEvents.push(shareEvent);

    console.log(`🗺️  ${sharer.getName()} shared ${newTiles.length} tiles with ${recipient.getName()}` +
                (exitShared ? ' (including EXIT!)' : ''));

    return shareEvent;
  }

  /**
   * Automatically share knowledge when agents are nearby
   */
  autoShareOnProximity(agent1: Agent, agent2: Agent): void {
    const distance = this.calculateDistance(
      agent1.getTilePosition(),
      agent2.getTilePosition()
    );

    if (distance <= this.SHARE_RANGE) {
      // Share bidirectionally
      this.shareMapKnowledge(agent1, agent2);
      this.shareMapKnowledge(agent2, agent1);
    }
  }

  /**
   * Add memory about map sharing
   */
  private addMapShareMemory(
    recipient: Agent,
    sharer: Agent,
    tilesShared: number,
    exitShared: boolean,
    safeRoomsShared: number,
    resourcesShared: number
  ): void {
    let description = `${sharer.getName()} shared map knowledge with me: `;
    description += `${tilesShared} new tiles explored`;

    if (exitShared) {
      description += ', EXIT LOCATION! ';
    }
    if (safeRoomsShared > 0) {
      description += `, ${safeRoomsShared} safe room(s)`;
    }
    if (resourcesShared > 0) {
      description += `, ${resourcesShared} resource location(s)`;
    }

    description += '. This helps me navigate the maze more efficiently.';

    const importance = exitShared ? 10 : (tilesShared > 20 ? 8 : tilesShared > 10 ? 7 : 6);

    recipient.addObservation(
      description,
      importance,
      ['map-sharing', 'cooperation', 'knowledge-transfer', sharer.getId()]
    );
  }

  /**
   * Calculate Manhattan distance
   */
  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  /**
   * Get agent's map knowledge
   */
  getAgentMap(agentId: string): SharedMapKnowledge | null {
    return this.agentMaps.get(agentId) || null;
  }

  /**
   * Get collective map knowledge
   */
  getCollectiveMap(): CollectiveMapKnowledge {
    return this.collectiveMap;
  }

  /**
   * Get exploration statistics
   */
  getExplorationStats(): {
    totalUniqueTiles: number;
    coverage: number;
    redundancy: number;
    topExplorer: { agentId: string; tiles: number } | null;
    shareEvents: number;
  } {
    let topExplorer: { agentId: string; tiles: number } | null = null;
    let maxTiles = 0;

    for (const [agentId, tiles] of this.collectiveMap.explorationByAgent) {
      if (tiles > maxTiles) {
        maxTiles = tiles;
        topExplorer = { agentId, tiles };
      }
    }

    return {
      totalUniqueTiles: this.collectiveMap.totalUniqueTiles,
      coverage: this.collectiveMap.explorationCoverage,
      redundancy: this.collectiveMap.redundantExploration,
      topExplorer,
      shareEvents: this.shareEvents.length
    };
  }

  /**
   * Get all tiles explored by an agent (including shared knowledge)
   */
  getAllKnownTiles(agentId: string): Position[] {
    const mapKnowledge = this.agentMaps.get(agentId);
    if (!mapKnowledge) return [];

    return Array.from(mapKnowledge.exploredTiles.values()).map(tile => tile.position);
  }

  /**
   * Check if agent knows about a specific location
   */
  hasKnowledgeOf(agentId: string, position: Position): boolean {
    const mapKnowledge = this.agentMaps.get(agentId);
    if (!mapKnowledge) return false;

    const key = `${position.x},${position.y}`;
    return mapKnowledge.exploredTiles.has(key);
  }

  /**
   * Clear all map data (for simulation reset)
   */
  clearMaps(): void {
    this.agentMaps.clear();
    this.collectiveMap = {
      allExploredTiles: new Map(),
      explorationByAgent: new Map(),
      sharedExits: [],
      sharedSafeRooms: [],
      sharedResources: new Map(),
      totalUniqueTiles: 0,
      explorationCoverage: 0,
      redundantExploration: 0
    };
    this.shareEvents = [];
    console.log('🧹 Map knowledge cleared for new simulation');
  }
}
