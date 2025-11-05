// src/systems/AgentManager.ts
/**
 * AgentManager - Multi-Agent Coordination System (Week 6, Day 2)
 *
 * Responsibilities:
 * - Create and manage multiple agents
 * - Detect agents within perception radius (5 tiles)
 * - Track spatial positions for efficient detection
 * - Coordinate agent updates
 * - Generate social observations
 */

import { Agent } from '../agent/Agent';
import { Maze, Position } from '../types';
import {
  AgentConfig,
  AgentDetectionResult,
  MultiAgentConfig,
  DEFAULT_MULTI_AGENT_CONFIG,
  MultiAgentMetrics,
  InteractionType,
} from '../types/multi-agent';
import { v4 as uuidv4 } from 'uuid';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private maze: Maze;
  private config: MultiAgentConfig;

  // Spatial indexing for efficient agent detection
  // Key: "x,y" -> Set of agent IDs at that position
  private spatialGrid: Map<string, Set<string>> = new Map();

  // Last detection timestamp per agent
  private lastDetectionTime: Map<string, number> = new Map();

  constructor(maze: Maze, config: Partial<MultiAgentConfig> = {}) {
    this.maze = maze;
    this.config = { ...DEFAULT_MULTI_AGENT_CONFIG, ...config };
  }

  /**
   * Create a new agent with given configuration
   */
  async createAgent(agentConfig: AgentConfig): Promise<Agent> {
    // Check max agents limit
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum number of agents (${this.config.maxAgents}) reached`);
    }

    // Determine start position
    const startPosition = agentConfig.startPosition || this.maze.entrance;

    // Create agent
    const agent = new Agent(this.maze, startPosition);

    // Set agent properties (will be added in Day 3)
    agent.setName(agentConfig.name);
    agent.setColor(agentConfig.color);

    // Initialize agent systems
    await agent.initializeRetrieval();

    // Register agent
    this.agents.set(agentConfig.id, agent);

    // Initialize last detection time
    this.lastDetectionTime.set(agentConfig.id, 0);

    // Update spatial index
    this.updateSpatialIndex(agentConfig.id, startPosition);

    console.log(`👥 Agent created: ${agentConfig.name} (${agentConfig.id}) at (${startPosition.x}, ${startPosition.y})`);

    return agent;
  }

  /**
   * Remove an agent from the system
   */
  removeAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    // Remove from spatial index
    const position = agent.getTilePosition();
    this.removFromSpatialIndex(agentId, position);

    // Remove from agents map
    this.agents.delete(agentId);
    this.lastDetectionTime.delete(agentId);

    console.log(`👥 Agent removed: ${agentId}`);
    return true;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all agent IDs
   */
  getAllAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get number of active agents
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Update all agents
   */
  update(deltaTime: number, timeScale: number, gameTime: number): void {
    // Update each agent
    for (const [agentId, agent] of this.agents) {
      // Update agent position in spatial index
      const position = agent.getTilePosition();
      this.updateSpatialIndex(agentId, position);

      // Update agent systems
      agent.update(deltaTime, timeScale);
    }

    // Detect and process interactions
    this.detectAndProcessInteractions(gameTime);
  }

  /**
   * Detect agents near a given agent
   */
  detectNearbyAgents(agentId: string): AgentDetectionResult[] {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return [];
    }

    const agentPosition = agent.getTilePosition();
    const results: AgentDetectionResult[] = [];

    // Check all other agents
    for (const [otherId, otherAgent] of this.agents) {
      if (otherId === agentId) continue;

      const otherPosition = otherAgent.getTilePosition();
      const distance = this.getManhattanDistance(agentPosition, otherPosition);

      // Check if within detection radius
      if (distance <= this.config.detectionRadius) {
        const hasLineOfSight = this.checkLineOfSight(agentPosition, otherPosition);
        const relativeDirection = this.getRelativeDirection(agentPosition, otherPosition);

        results.push({
          agentId: otherId,
          agentName: otherAgent.getName(),
          agentColor: otherAgent.getColor(),
          position: otherPosition,
          distance,
          hasLineOfSight,
          relativeDirection,
        });
      }
    }

    return results;
  }

  /**
   * Detect and process interactions for all agents
   */
  private detectAndProcessInteractions(gameTime: number): void {
    for (const [agentId, agent] of this.agents) {
      // Check if enough time has passed since last detection
      const lastTime = this.lastDetectionTime.get(agentId) || 0;
      if (gameTime - lastTime < this.config.detectionInterval) {
        continue;
      }

      // Update last detection time
      this.lastDetectionTime.set(agentId, gameTime);

      // Detect nearby agents
      const nearbyAgents = this.detectNearbyAgents(agentId);

      // Process each detected agent
      for (const detection of nearbyAgents) {
        this.processAgentDetection(agent, detection, gameTime);
      }
    }
  }

  /**
   * Process a single agent detection
   */
  private processAgentDetection(
    observer: Agent,
    detection: AgentDetectionResult,
    gameTime: number
  ): void {
    const socialMemory = observer.getSocialMemory();

    // Check if first meeting
    const isFirstMeeting = !socialMemory.hasMetAgent(detection.agentId);

    // Determine interaction type
    let interactionType: InteractionType;
    if (isFirstMeeting) {
      interactionType = InteractionType.FIRST_MEETING;
    } else if (detection.distance <= 2) {
      interactionType = InteractionType.PROXIMITY;
    } else {
      interactionType = InteractionType.OBSERVATION;
    }

    // Generate description
    const description = this.generateInteractionDescription(
      observer,
      detection,
      interactionType
    );

    // Record interaction in social memory
    socialMemory.recordInteraction(
      detection.agentId,
      detection.agentName,
      {
        id: uuidv4(),
        timestamp: gameTime,
        type: interactionType,
        otherAgentId: detection.agentId,
        otherAgentName: detection.agentName,
        location: observer.getTilePosition(),
        description,
        valence: isFirstMeeting ? 0.2 : 0, // Slightly positive for first meeting
      }
    );

    // Also store as observation memory
    observer.getMemoryStream().addObservation(
      description,
      isFirstMeeting ? 7 : 4, // First meetings are more important
      ['social', 'agent', detection.agentName, interactionType],
      observer.getTilePosition()
    );

    console.log(`👥 ${observer.getName()} ${interactionType}: ${detection.agentName} at distance ${detection.distance}`);
  }

  /**
   * Generate natural language description of interaction
   */
  private generateInteractionDescription(
    _observer: Agent,
    detection: AgentDetectionResult,
    interactionType: InteractionType
  ): string {
    const directionStr = detection.relativeDirection
      ? `to the ${detection.relativeDirection}`
      : 'nearby';

    switch (interactionType) {
      case InteractionType.FIRST_MEETING:
        return `Met ${detection.agentName} for the first time ${directionStr} (${detection.distance} tiles away)`;

      case InteractionType.PROXIMITY:
        return `${detection.agentName} is very close ${directionStr} (${detection.distance} tiles away)`;

      case InteractionType.OBSERVATION:
        if (detection.hasLineOfSight) {
          return `Saw ${detection.agentName} ${directionStr} (${detection.distance} tiles away)`;
        } else {
          return `Sensed ${detection.agentName}'s presence ${directionStr} (${detection.distance} tiles away, behind walls)`;
        }

      default:
        return `Observed ${detection.agentName} ${directionStr}`;
    }
  }

  /**
   * Calculate multi-agent metrics
   */
  getMetrics(): MultiAgentMetrics {
    const agentIds = this.getAllAgentIds();
    const agentCount = agentIds.length;

    if (agentCount === 0) {
      return {
        activeAgentCount: 0,
        totalInteractions: 0,
        averageFamiliarity: 0,
        averageAffinity: 0,
        networkDensity: 0,
        clusters: [],
        mostSocialAgentId: null,
        mostIsolatedAgentId: null,
      };
    }

    let totalInteractions = 0;
    let totalFamiliarity = 0;
    let totalAffinity = 0;
    let relationshipCount = 0;
    let interactionCounts: Map<string, number> = new Map();

    // Collect metrics from each agent
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId)!;
      const socialMemory = agent.getSocialMemory();
      const knownAgents = socialMemory.getKnownAgents();

      let agentInteractionCount = 0;

      for (const memory of knownAgents) {
        totalFamiliarity += memory.relationship.familiarity;
        totalAffinity += memory.relationship.affinity;
        totalInteractions += memory.relationship.interactionCount;
        relationshipCount++;
        agentInteractionCount += memory.relationship.interactionCount;
      }

      interactionCounts.set(agentId, agentInteractionCount);
    }

    // Calculate averages
    const averageFamiliarity = relationshipCount > 0 ? totalFamiliarity / relationshipCount : 0;
    const averageAffinity = relationshipCount > 0 ? totalAffinity / relationshipCount : 0;

    // Network density: actual relationships / possible relationships
    const possibleRelationships = agentCount * (agentCount - 1);
    const networkDensity = possibleRelationships > 0 ? relationshipCount / possibleRelationships : 0;

    // Find most social and most isolated agents
    let mostSocialAgentId: string | null = null;
    let mostIsolatedAgentId: string | null = null;
    let maxInteractions = -1;
    let minInteractions = Infinity;

    for (const [agentId, count] of interactionCounts) {
      if (count > maxInteractions) {
        maxInteractions = count;
        mostSocialAgentId = agentId;
      }
      if (count < minInteractions) {
        minInteractions = count;
        mostIsolatedAgentId = agentId;
      }
    }

    return {
      activeAgentCount: agentCount,
      totalInteractions,
      averageFamiliarity,
      averageAffinity,
      networkDensity,
      clusters: [], // TODO: Implement clustering algorithm
      mostSocialAgentId,
      mostIsolatedAgentId,
    };
  }

  /**
   * Update spatial index with agent's current position
   */
  private updateSpatialIndex(agentId: string, position: Position): void {
    const key = this.positionToKey(position);

    // Add to new cell
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, new Set());
    }
    this.spatialGrid.get(key)!.add(agentId);
  }

  /**
   * Remove agent from spatial index at given position
   */
  private removFromSpatialIndex(agentId: string, position: Position): void {
    const key = this.positionToKey(position);
    const cell = this.spatialGrid.get(key);
    if (cell) {
      cell.delete(agentId);
      if (cell.size === 0) {
        this.spatialGrid.delete(key);
      }
    }
  }

  /**
   * Convert position to spatial grid key
   */
  private positionToKey(position: Position): string {
    return `${position.x},${position.y}`;
  }

  /**
   * Calculate Manhattan distance between two positions
   */
  private getManhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Check if there's line of sight between two positions (no walls)
   * Uses Bresenham's line algorithm
   */
  private checkLineOfSight(from: Position, to: Position): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;
    let err = dx - dy;

    let x = from.x;
    let y = from.y;

    while (x !== to.x || y !== to.y) {
      // Check if current tile is within bounds
      if (x < 0 || x >= this.maze.width || y < 0 || y >= this.maze.height) {
        return false;
      }

      const tile = this.maze.tiles[y][x];

      // Check walls in direction of movement
      const e2 = 2 * err;
      if (e2 > -dy) {
        // Moving horizontally
        if (sx > 0 && tile.walls.east) return false;
        if (sx < 0 && tile.walls.west) return false;
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        // Moving vertically
        if (sy > 0 && tile.walls.south) return false;
        if (sy < 0 && tile.walls.north) return false;
        err += dx;
        y += sy;
      }
    }

    return true;
  }

  /**
   * Get relative direction from one position to another
   */
  private getRelativeDirection(
    from: Position,
    to: Position
  ): 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest' {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Determine primary and secondary directions
    const isNorth = dy < 0;
    const isSouth = dy > 0;
    const isEast = dx > 0;
    const isWest = dx < 0;

    // Diagonal directions
    if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
      if (isNorth && isEast) return 'northeast';
      if (isNorth && isWest) return 'northwest';
      if (isSouth && isEast) return 'southeast';
      if (isSouth && isWest) return 'southwest';
    }

    // Cardinal directions
    if (Math.abs(dx) > Math.abs(dy)) {
      return isEast ? 'east' : 'west';
    } else {
      return isNorth ? 'north' : 'south';
    }
  }

  /**
   * Clean up and destroy manager
   */
  destroy(): void {
    this.agents.clear();
    this.spatialGrid.clear();
    this.lastDetectionTime.clear();
    console.log('👥 AgentManager destroyed');
  }
}
