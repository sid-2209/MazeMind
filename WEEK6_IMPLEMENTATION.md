# Week 6 Implementation: Multi-Agent Foundation

## Overview & Research Paper Alignment

### Connection to Paper (Park et al., 2023)
**Section 3: Generative Agent Behavior and Interaction**

The core thesis of the Generative Agents paper is **emergent social behavior** from autonomous agents with memory and planning. The paper demonstrates this with **25 agents** interacting in a simulated town over 2 days:

> "We instantiate **generative agents** to populate an interactive sandbox environment inspired by The Sims... We observe emergent social behaviors: for example, the agents spread information about others, form new relationships, and coordinate group activities."

**Key Multi-Agent Features from Paper**:
1. **Agent-to-Agent Perception**: Agents detect nearby agents
2. **Social Memory**: Agents remember interactions with other agents
3. **Information Diffusion**: News spreads through agent network
4. **Relationship Formation**: Agents form friendships, romantic interests
5. **Coordinated Activities**: Agents plan group events (Valentine's Day party)

**Current Implementation Gap**:
- ❌ Only single agent (Arth) exists
- ❌ No agent-to-agent interaction capability
- ❌ No social memory or relationships
- ❌ No information sharing mechanisms
- ❌ No coordinated multi-agent behaviors

**Paper Alignment**: Currently 0% → Target 60% after Week 6

### Week 6 Objectives

1. ✅ Create AgentManager for coordinating multiple agents
2. ✅ Implement agent detection and awareness
3. ✅ Add social memory structures
4. ✅ Support 2-3 agents in the maze simultaneously
5. ✅ Render multiple agents with visual distinction
6. ✅ Track agent-to-agent observations
7. ✅ Foundation for Week 7's dialogue system

### Expected Outcomes

After Week 6:
- Support 2-3 agents exploring the maze simultaneously
- Agents can detect and observe each other
- Social memories stored (who they've met, where, when)
- Visual distinction between agents (colors, names)
- Foundation for information sharing and dialogue
- Multi-agent metrics and data collection

---

## Architecture & Design

### Multi-Agent System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      AGENT MANAGER                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Manages all agents, coordinates interactions          │  │
│  │  - Agent registry (by ID)                              │  │
│  │  - Spatial indexing (who's nearby whom)                │  │
│  │  - Update orchestration                                │  │
│  │  - Social event detection                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ Agent 1  │    │ Agent 2  │    │ Agent 3  │             │
│  │ "Arth"   │    │ "Vani"   │    │ "Soko"   │             │
│  │          │    │          │    │          │             │
│  │ Memory   │    │ Memory   │    │ Memory   │             │
│  │ Planning │    │ Planning │    │ Planning │             │
│  │ Social   │    │ Social   │    │ Social   │             │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘             │
│       │               │               │                    │
│       └───────────────┴───────────────┘                    │
│                       │                                    │
│              Spatial Awareness                             │
│              (who can see whom)                            │
└──────────────────────────────────────────────────────────────┘
```

### Agent Detection System

```
Agent A's Perception Radius (5 tiles)
         ┌─────────────┐
         │             │
         │      A      │  ← Agent A
         │             │
         │      B      │  ← Agent B detected (within 5 tiles)
         │             │
         └─────────────┘

Agent A observes: "I see Vani standing 3 tiles south of me"
→ Stored in Memory: "observation about Vani"
→ Triggers social memory update
```

### Social Memory Structure

```typescript
SocialMemory {
  agentId: "Vani-uuid",
  agentName: "Vani",
  relationship: {
    familiarity: 0.2,      // 0-1, increases with interactions
    affinity: 0.0,         // -1 to 1, positive/negative
    trustLevel: 0.5        // 0-1, trust/distrust
  },
  interactions: [
    {
      timestamp: 1234567890,
      type: "first_encounter",
      location: {x: 10, y: 15},
      observation: "Met Vani near the eastern corridor"
    },
    {
      timestamp: 1234567900,
      type: "proximity",
      location: {x: 12, y: 15},
      observation: "Vani is exploring the same area"
    }
  ],
  knownFacts: [
    "Vani seems to prefer exploring eastern sections",
    "Vani consumed water at position (12, 15)"
  ],
  lastSeenAt: 1234567900,
  lastSeenLocation: {x: 12, y: 15}
}
```

---

## Implementation Details

### Phase 1: Agent Manager Core (Days 1-3)

#### File 1: `src/types/multi-agent.ts` (NEW - ~250 lines)

```typescript
/**
 * Multi-Agent Types - Social interactions and relationships
 */

export interface AgentConfig {
  id: string;
  name: string;
  personality?: string;        // Brief personality description
  startPosition: Position;
  color: number;               // Visual color code (0xRRGGBB)
  autonomousMode: boolean;     // Start in auto or manual
}

export interface SocialMemory {
  agentId: string;
  agentName: string;
  relationship: Relationship;
  interactions: Interaction[];
  knownFacts: string[];        // Facts learned about this agent
  lastSeenAt: number;          // Timestamp
  lastSeenLocation: Position;
  totalInteractions: number;
}

export interface Relationship {
  familiarity: number;         // 0-1: How well they know each other
  affinity: number;            // -1 to 1: Like/dislike
  trustLevel: number;          // 0-1: Trust/distrust
}

export interface Interaction {
  timestamp: number;
  type: InteractionType;
  location: Position;
  description: string;         // Natural language description
  sentiment?: number;          // -1 to 1: Positive/negative
  metadata?: Record<string, any>;
}

export enum InteractionType {
  FIRST_ENCOUNTER = 'first_encounter',
  PROXIMITY = 'proximity',           // Just being nearby
  OBSERVATION = 'observation',       // Actively observing other agent
  CONVERSATION = 'conversation',     // Week 7: Dialogue
  SHARED_RESOURCE = 'shared_resource', // Both near same item
  COORDINATION = 'coordination'      // Working together
}

export interface AgentDetectionResult {
  agent: Agent;
  distance: number;            // Tiles away
  direction: Direction;        // North, south, east, west
  canSee: boolean;            // Line of sight check
  sharedContext: string[];    // Shared observations (both see same thing)
}

export interface MultiAgentMetrics {
  totalAgents: number;
  activeAgents: number;
  totalInteractions: number;
  averageProximityTime: number;     // Time agents spend near each other
  informationDiffusionRate: number; // How fast info spreads
  socialNetworkDensity: number;     // How connected agents are
  coordinatedActions: number;       // Actions done in coordination
}
```

#### File 2: `src/systems/AgentManager.ts` (NEW - ~600 lines)

```typescript
/**
 * Agent Manager - Coordinates multiple agents in the simulation
 *
 * Responsibilities:
 * - Manage agent lifecycle (create, update, destroy)
 * - Spatial indexing (who's near whom)
 * - Agent detection and perception
 * - Social event detection
 * - Update orchestration
 */

import { Agent } from '../agent/Agent';
import { Maze } from '../types';
import { AgentConfig, AgentDetectionResult, MultiAgentMetrics } from '../types/multi-agent';
import { Position, Direction } from '../types';

export class AgentManager {
  private maze: Maze;
  private agents: Map<string, Agent> = new Map();
  private spatialGrid: Map<string, Set<string>> = new Map(); // Position hash → Agent IDs

  // Configuration
  private detectionRadius: number = 5; // Tiles
  private updateInterval: number = 1000; // Check for nearby agents every second
  private lastUpdateTime: number = 0;

  // Metrics
  private totalInteractions: number = 0;
  private proximityEvents: number = 0;

  constructor(maze: Maze) {
    this.maze = maze;
    console.log('👥 AgentManager initialized');
  }

  /**
   * Create and register a new agent
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    console.log(`👤 Creating agent: ${config.name} at (${config.startPosition.x}, ${config.startPosition.y})`);

    // Create agent instance
    const agent = new Agent(this.maze, config.startPosition);
    agent.setName(config.name);
    agent.setColor(config.color);

    // Initialize agent systems
    await agent.initialize();

    // Register with manager
    this.agents.set(config.id, agent);
    this.updateSpatialIndex(config.id, config.startPosition);

    console.log(`✅ Agent ${config.name} created (ID: ${config.id})`);
    return agent;
  }

  /**
   * Update all agents and detect interactions
   */
  update(deltaTime: number, timeScale: number, gameTime: number): void {
    // Update each agent
    for (const [id, agent] of this.agents) {
      if (!agent.getState().isAlive) continue;

      // Regular agent update
      agent.update(deltaTime, timeScale);

      // Update spatial index
      this.updateSpatialIndex(id, agent.getTilePosition());
    }

    // Check for social interactions (throttled)
    this.lastUpdateTime += deltaTime * 1000;
    if (this.lastUpdateTime >= this.updateInterval) {
      this.detectAndProcessInteractions(gameTime);
      this.lastUpdateTime = 0;
    }
  }

  /**
   * Detect nearby agents and process social interactions
   */
  private detectAndProcessInteractions(gameTime: number): void {
    for (const [id, agent] of this.agents) {
      if (!agent.getState().isAlive) continue;

      // Find nearby agents
      const nearbyAgents = this.detectNearbyAgents(id);

      if (nearbyAgents.length > 0) {
        this.processProximityInteractions(agent, nearbyAgents, gameTime);
      }
    }
  }

  /**
   * Detect all agents within perception radius
   */
  detectNearbyAgents(agentId: string): AgentDetectionResult[] {
    const agent = this.agents.get(agentId);
    if (!agent) return [];

    const position = agent.getTilePosition();
    const results: AgentDetectionResult[] = [];

    // Check all other agents
    for (const [otherId, otherAgent] of this.agents) {
      if (otherId === agentId) continue;
      if (!otherAgent.getState().isAlive) continue;

      const otherPosition = otherAgent.getTilePosition();
      const distance = this.calculateDistance(position, otherPosition);

      // Within detection radius?
      if (distance <= this.detectionRadius) {
        const direction = this.getDirection(position, otherPosition);
        const canSee = this.checkLineOfSight(position, otherPosition);
        const sharedContext = this.getSharedContext(agent, otherAgent);

        results.push({
          agent: otherAgent,
          distance,
          direction,
          canSee,
          sharedContext
        });
      }
    }

    return results;
  }

  /**
   * Process proximity-based social interactions
   */
  private processProximityInteractions(
    agent: Agent,
    nearbyAgents: AgentDetectionResult[],
    gameTime: number
  ): void {
    for (const detection of nearbyAgents) {
      const otherAgent = detection.agent;

      // Generate observation about other agent
      const observation = this.generateAgentObservation(agent, detection);

      // Store as observation in memory
      agent.addObservation(observation, 7); // Importance: 7 (social observations are important)

      // Update social memory
      agent.getSocialMemory().recordInteraction(
        otherAgent.getId(),
        otherAgent.getName(),
        {
          timestamp: gameTime,
          type: detection.canSee ? InteractionType.OBSERVATION : InteractionType.PROXIMITY,
          location: agent.getTilePosition(),
          description: observation,
          metadata: {
            distance: detection.distance,
            direction: detection.direction,
            sharedContext: detection.sharedContext
          }
        }
      );

      this.proximityEvents++;
    }
  }

  /**
   * Generate natural language observation about another agent
   */
  private generateAgentObservation(
    observer: Agent,
    detection: AgentDetectionResult
  ): string {
    const otherAgent = detection.agent;
    const name = otherAgent.getName();
    const distance = detection.distance;
    const direction = detection.direction;

    // Get what the other agent is doing
    const otherState = otherAgent.getState();
    const activity = this.describeActivity(otherAgent);

    // Check if this is first encounter
    const socialMemory = observer.getSocialMemory();
    const isFirstMeeting = !socialMemory.hasMetAgent(otherAgent.getId());

    if (isFirstMeeting) {
      return `I encountered another person named ${name} about ${distance} tiles to the ${direction}. ${activity}`;
    } else {
      return `I see ${name} ${distance} tiles to the ${direction}. ${activity}`;
    }
  }

  /**
   * Describe what an agent is currently doing
   */
  private describeActivity(agent: Agent): string {
    const state = agent.getState();
    const survivalState = agent.getSurvivalState();

    // Check current action
    const plan = agent.getCurrentPlan();
    if (plan) {
      return `They seem to be following a plan.`;
    }

    // Check survival status
    if (survivalState.hunger < 30) {
      return `They look hungry.`;
    }
    if (survivalState.thirst < 30) {
      return `They appear thirsty.`;
    }
    if (state.stress > 70) {
      return `They seem stressed or anxious.`;
    }

    // Default
    return `They are exploring the maze.`;
  }

  /**
   * Get shared context between two agents
   */
  private getSharedContext(agent1: Agent, agent2: Agent): string[] {
    const context: string[] = [];

    // Same general area
    const pos1 = agent1.getTilePosition();
    const pos2 = agent2.getTilePosition();

    if (Math.abs(pos1.x - pos2.x) < 3 && Math.abs(pos1.y - pos2.y) < 3) {
      context.push('in_same_area');
    }

    // Both near items (Week 3 item system)
    // Can check if both agents see the same items

    // Both stressed
    if (agent1.getStressLevel() > 60 && agent2.getStressLevel() > 60) {
      context.push('both_stressed');
    }

    return context;
  }

  /**
   * Update spatial index for efficient proximity queries
   */
  private updateSpatialIndex(agentId: string, position: Position): void {
    const hash = this.positionHash(position);

    // Add to new cell
    if (!this.spatialGrid.has(hash)) {
      this.spatialGrid.set(hash, new Set());
    }
    this.spatialGrid.get(hash)!.add(agentId);

    // TODO: Remove from old cells (track previous position)
  }

  /**
   * Check line of sight between two positions
   */
  private checkLineOfSight(from: Position, to: Position): boolean {
    // Simple implementation: check if path is clear
    // Use Bresenham's line algorithm to check tiles between

    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;

    let err = dx - dy;
    let x = from.x;
    let y = from.y;

    while (x !== to.x || y !== to.y) {
      // Check if current tile blocks line of sight
      const tile = this.maze.tiles[y][x];
      if (tile.type === 'wall') {
        return false;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return true;
  }

  /**
   * Calculate Manhattan distance
   */
  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  /**
   * Get cardinal direction from pos1 to pos2
   */
  private getDirection(from: Position, to: Position): Direction {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'east' : 'west';
    } else {
      return dy > 0 ? 'south' : 'north';
    }
  }

  /**
   * Hash position for spatial grid
   */
  private positionHash(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get active agent count
   */
  getActiveAgentCount(): number {
    return Array.from(this.agents.values()).filter(a => a.getState().isAlive).length;
  }

  /**
   * Get multi-agent metrics
   */
  getMetrics(): MultiAgentMetrics {
    const totalAgents = this.agents.size;
    const activeAgents = this.getActiveAgentCount();

    // Calculate social network density
    const possibleConnections = (activeAgents * (activeAgents - 1)) / 2;
    let actualConnections = 0;

    for (const agent of this.agents.values()) {
      const socialMemory = agent.getSocialMemory();
      actualConnections += socialMemory.getKnownAgentCount();
    }

    const socialNetworkDensity = possibleConnections > 0
      ? actualConnections / possibleConnections
      : 0;

    return {
      totalAgents,
      activeAgents,
      totalInteractions: this.totalInteractions,
      averageProximityTime: 0, // TODO: Track
      informationDiffusionRate: 0, // TODO: Week 7 (dialogue)
      socialNetworkDensity,
      coordinatedActions: 0 // TODO: Future
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    for (const agent of this.agents.values()) {
      agent.destroy();
    }
    this.agents.clear();
    this.spatialGrid.clear();
  }
}
```

### Phase 2: Social Memory System (Days 4-5)

#### File 3: `src/agent/SocialMemory.ts` (NEW - ~400 lines)

```typescript
/**
 * Social Memory - Track relationships and interactions with other agents
 *
 * Each agent has a SocialMemory that stores:
 * - Who they've met
 * - Interactions history
 * - Relationship metrics (familiarity, affinity, trust)
 * - Known facts about other agents
 */

import { SocialMemory as ISocialMemory, Interaction, Relationship, InteractionType } from '../types/multi-agent';
import { Position } from '../types';

export class SocialMemory {
  private memories: Map<string, ISocialMemory> = new Map();
  private totalInteractions: number = 0;

  // Relationship evolution parameters
  private readonly FAMILIARITY_INCREMENT = 0.05;  // Per interaction
  private readonly AFFINITY_POSITIVE_EVENT = 0.1;
  private readonly AFFINITY_NEGATIVE_EVENT = -0.1;
  private readonly TRUST_INCREMENT = 0.02;
  private readonly FAMILIARITY_DECAY_RATE = 0.99; // Daily decay if no interaction

  /**
   * Record an interaction with another agent
   */
  recordInteraction(
    agentId: string,
    agentName: string,
    interaction: Interaction
  ): void {
    let memory = this.memories.get(agentId);

    if (!memory) {
      // First encounter - create new social memory
      memory = this.createNewSocialMemory(agentId, agentName, interaction);
      this.memories.set(agentId, memory);
      console.log(`🤝 First encounter with ${agentName}`);
    } else {
      // Update existing memory
      memory.interactions.push(interaction);
      memory.lastSeenAt = interaction.timestamp;
      memory.lastSeenLocation = interaction.location;
      memory.totalInteractions++;

      // Update relationship metrics
      this.updateRelationship(memory, interaction);
    }

    this.totalInteractions++;
  }

  /**
   * Create new social memory for first encounter
   */
  private createNewSocialMemory(
    agentId: string,
    agentName: string,
    firstInteraction: Interaction
  ): ISocialMemory {
    return {
      agentId,
      agentName,
      relationship: {
        familiarity: 0.1,  // Start with low familiarity
        affinity: 0.0,     // Neutral
        trustLevel: 0.5    // Neutral trust
      },
      interactions: [firstInteraction],
      knownFacts: [],
      lastSeenAt: firstInteraction.timestamp,
      lastSeenLocation: firstInteraction.location,
      totalInteractions: 1
    };
  }

  /**
   * Update relationship metrics based on interaction
   */
  private updateRelationship(memory: ISocialMemory, interaction: Interaction): void {
    const rel = memory.relationship;

    // Familiarity always increases with interaction
    rel.familiarity = Math.min(1.0, rel.familiarity + this.FAMILIARITY_INCREMENT);

    // Affinity changes based on interaction sentiment
    if (interaction.sentiment !== undefined) {
      const affinityChange = interaction.sentiment > 0
        ? this.AFFINITY_POSITIVE_EVENT
        : this.AFFINITY_NEGATIVE_EVENT;
      rel.affinity = Math.max(-1, Math.min(1, rel.affinity + affinityChange));
    }

    // Trust builds slowly over time with positive interactions
    if (interaction.type === InteractionType.COORDINATION ||
        interaction.type === InteractionType.SHARED_RESOURCE) {
      rel.trustLevel = Math.min(1.0, rel.trustLevel + this.TRUST_INCREMENT);
    }
  }

  /**
   * Add a known fact about another agent
   */
  addKnownFact(agentId: string, fact: string): void {
    const memory = this.memories.get(agentId);
    if (memory) {
      memory.knownFacts.push(fact);
      console.log(`📝 Learned about ${memory.agentName}: ${fact}`);
    }
  }

  /**
   * Get social memory for specific agent
   */
  getSocialMemory(agentId: string): ISocialMemory | undefined {
    return this.memories.get(agentId);
  }

  /**
   * Check if agent has met another agent
   */
  hasMetAgent(agentId: string): boolean {
    return this.memories.has(agentId);
  }

  /**
   * Get all known agents
   */
  getKnownAgents(): ISocialMemory[] {
    return Array.from(this.memories.values());
  }

  /**
   * Get known agent count
   */
  getKnownAgentCount(): number {
    return this.memories.size;
  }

  /**
   * Get closest friend (highest affinity)
   */
  getClosestFriend(): ISocialMemory | undefined {
    let closest: ISocialMemory | undefined;
    let highestAffinity = -Infinity;

    for (const memory of this.memories.values()) {
      if (memory.relationship.affinity > highestAffinity) {
        highestAffinity = memory.relationship.affinity;
        closest = memory;
      }
    }

    return closest;
  }

  /**
   * Get most familiar agent (spent most time with)
   */
  getMostFamiliarAgent(): ISocialMemory | undefined {
    let mostFamiliar: ISocialMemory | undefined;
    let highestFamiliarity = 0;

    for (const memory of this.memories.values()) {
      if (memory.relationship.familiarity > highestFamiliarity) {
        highestFamiliarity = memory.relationship.familiarity;
        mostFamiliar = memory;
      }
    }

    return mostFamiliar;
  }

  /**
   * Apply daily decay to relationships (people forget over time)
   */
  applyDailyDecay(): void {
    for (const memory of this.memories.values()) {
      // Familiarity decays if no recent interaction
      memory.relationship.familiarity *= this.FAMILIARITY_DECAY_RATE;

      // Affinity drifts toward neutral
      memory.relationship.affinity *= 0.98;
    }
  }

  /**
   * Get interaction history with specific agent
   */
  getInteractionHistory(agentId: string): Interaction[] {
    const memory = this.memories.get(agentId);
    return memory ? memory.interactions : [];
  }

  /**
   * Get recent interactions (last N)
   */
  getRecentInteractions(count: number = 5): Interaction[] {
    const allInteractions: Interaction[] = [];

    for (const memory of this.memories.values()) {
      allInteractions.push(...memory.interactions);
    }

    // Sort by timestamp descending
    allInteractions.sort((a, b) => b.timestamp - a.timestamp);

    return allInteractions.slice(0, count);
  }

  /**
   * Get summary for LLM prompts
   */
  getSocialSummary(): string {
    if (this.memories.size === 0) {
      return 'I have not encountered any other people in the maze yet.';
    }

    const summaries: string[] = [];

    for (const memory of this.memories.values()) {
      const { agentName, relationship, totalInteractions, lastSeenAt } = memory;
      const rel = relationship;

      let relationshipDesc = 'acquaintance';
      if (rel.familiarity > 0.7) relationshipDesc = 'well-known';
      if (rel.affinity > 0.5) relationshipDesc = 'friend';
      if (rel.affinity < -0.5) relationshipDesc = 'someone I distrust';

      summaries.push(
        `${agentName} (${relationshipDesc}, met ${totalInteractions} times, ` +
        `familiarity: ${(rel.familiarity * 100).toFixed(0)}%, ` +
        `affinity: ${rel.affinity > 0 ? '+' : ''}${(rel.affinity * 100).toFixed(0)}%)`
      );
    }

    return `People I've encountered:\n` + summaries.join('\n');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.memories.clear();
  }
}
```

#### Modify: `src/agent/Agent.ts`

```typescript
import { SocialMemory } from './SocialMemory'; // Week 6

export class Agent {
  // ... existing properties ...
  private socialMemory!: SocialMemory; // Week 6
  private agentName: string = 'Arth';  // Week 6
  private agentColor: number = 0x4CAF50; // Week 6

  constructor(maze: Maze, startPosition: Position) {
    // ... existing initialization ...

    // Initialize social memory (Week 6)
    this.socialMemory = new SocialMemory();
  }

  /**
   * Set agent name (Week 6)
   */
  setName(name: string): void {
    this.agentName = name;
  }

  /**
   * Get agent name (Week 6)
   */
  getName(): string {
    return this.agentName;
  }

  /**
   * Set agent color (Week 6)
   */
  setColor(color: number): void {
    this.agentColor = color;
  }

  /**
   * Get agent color (Week 6)
   */
  getColor(): number {
    return this.agentColor;
  }

  /**
   * Get social memory system (Week 6)
   */
  getSocialMemory(): SocialMemory {
    return this.socialMemory;
  }

  /**
   * Get unique agent ID (Week 6)
   */
  getId(): string {
    return this.id; // Assuming id is generated in constructor
  }
}
```

### Phase 3: Multi-Agent Rendering (Days 6-7)

#### Modify: `src/rendering/AgentRenderer.ts`

```typescript
/**
 * Render multiple agents with visual distinction
 */
export class AgentRenderer {
  // ... existing properties ...
  private agentColor: number;
  private nameText!: Text;

  constructor(container: Container, agent: Agent, config: VisualConfig, color?: number) {
    this.container = container;
    this.agent = agent;
    this.config = config;
    this.agentColor = color || agent.getColor();
  }

  async init(): Promise<void> {
    // Create agent sprite with custom color
    this.agentSprite = new Graphics();
    this.agentSprite.beginFill(this.agentColor, 1.0);
    this.agentSprite.drawCircle(0, 0, this.config.tileSize / 3);
    this.agentSprite.endFill();

    // Add white border
    this.agentSprite.lineStyle(2, 0xffffff, 0.8);
    this.agentSprite.drawCircle(0, 0, this.config.tileSize / 3);

    // Add name label above agent
    this.nameText = new Text(this.agent.getName(), {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3
    });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -this.config.tileSize / 2 - 10;

    this.agentSprite.addChild(this.nameText);
    this.container.addChild(this.agentSprite);
  }

  // ... rest of existing methods ...
}
```

#### File 4: `src/rendering/MultiAgentRenderer.ts` (NEW - ~200 lines)

```typescript
/**
 * Multi-Agent Renderer - Manages rendering for all agents
 */

import { Container } from 'pixi.js';
import { AgentRenderer } from './AgentRenderer';
import { Agent } from '../agent/Agent';
import { VisualConfig } from '../types';

export class MultiAgentRenderer {
  private container: Container;
  private config: VisualConfig;
  private agentRenderers: Map<string, AgentRenderer> = new Map();

  constructor(container: Container, config: VisualConfig) {
    this.container = container;
    this.config = config;
  }

  /**
   * Add agent to rendering
   */
  async addAgent(agent: Agent): Promise<void> {
    const renderer = new AgentRenderer(
      this.container,
      agent,
      this.config,
      agent.getColor()
    );

    await renderer.init();
    this.agentRenderers.set(agent.getId(), renderer);

    console.log(`🎨 Added renderer for ${agent.getName()}`);
  }

  /**
   * Remove agent from rendering
   */
  removeAgent(agentId: string): void {
    const renderer = this.agentRenderers.get(agentId);
    if (renderer) {
      renderer.destroy();
      this.agentRenderers.delete(agentId);
    }
  }

  /**
   * Update all agent renderers
   */
  update(deltaTime: number): void {
    for (const renderer of this.agentRenderers.values()) {
      renderer.update(deltaTime);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    for (const renderer of this.agentRenderers.values()) {
      renderer.destroy();
    }
    this.agentRenderers.clear();
  }
}
```

### Phase 4: Game Integration (Days 8-9)

#### Modify: `src/core/Game.ts`

```typescript
import { AgentManager } from '../systems/AgentManager'; // Week 6
import { MultiAgentRenderer } from '../rendering/MultiAgentRenderer'; // Week 6
import { AgentConfig } from '../types/multi-agent'; // Week 6

export class Game {
  // Replace single agent with manager
  private agentManager: AgentManager | null = null;
  private multiAgentRenderer: MultiAgentRenderer | null = null;

  // Agent configurations
  private agentConfigs: AgentConfig[] = [
    {
      id: 'arth',
      name: 'Arth',
      personality: 'Cautious and methodical explorer',
      startPosition: { x: 1, y: 1 },
      color: 0x2196F3, // Blue
      autonomousMode: true
    },
    {
      id: 'vani',
      name: 'Vani',
      personality: 'Bold and adventurous risk-taker',
      startPosition: { x: 5, y: 5 },
      color: 0xFFC0CB, // Pink
      autonomousMode: true
    },
    {
      id: 'soko',
      name: 'Soko',
      personality: 'Analytical and strategic thinker',
      startPosition: { x: 10, y: 1 },
      color: 0xFF9800, // Orange
      autonomousMode: true
    }
  ];

  /**
   * Initialize multi-agent system
   */
  private async initAgents(): Promise<void> {
    if (!this.maze || !this.renderer) {
      throw new Error('Cannot initialize agents: prerequisites not ready');
    }

    console.log('👥 Initializing multi-agent system...');

    // Create agent manager
    this.agentManager = new AgentManager(this.maze);

    // Create multi-agent renderer
    const agentLayer = this.renderer.getAgentLayer();
    this.multiAgentRenderer = new MultiAgentRenderer(agentLayer, this.config.visual);

    // Create agents (start with 2-3 agents)
    const agentsToCreate = this.agentConfigs.slice(0, 2); // Start with Arth and Vani

    for (const config of agentsToCreate) {
      const agent = await this.agentManager.createAgent(config);

      // Initialize agent systems
      await this.initializeAgentSystems(agent);

      // Add to renderer
      await this.multiAgentRenderer.addAgent(agent);
    }

    console.log(`✅ ${agentsToCreate.length} agents initialized`);
  }

  /**
   * Initialize systems for a single agent
   */
  private async initializeAgentSystems(agent: Agent): Promise<void> {
    // LLM configuration
    const apiKey = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY;
    const llmProvider = (import.meta as any).env?.VITE_LLM_PROVIDER || 'heuristic';
    // ... (existing initialization code)

    agent.initializeRetrieval(/* params */);

    // Set item generator
    if (this.itemGenerator) {
      agent.setItemGenerator(this.itemGenerator);
    }

    // Initialize plan
    await agent.initializePlan(this.gameTime);
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // ... existing updates ...

    // Update multi-agent system (Week 6)
    if (this.agentManager && this.timeManager) {
      const timeScale = this.timeManager.getTimeScale();
      this.agentManager.update(deltaTime, timeScale, this.gameTime);
    }

    // Update multi-agent renderer (Week 6)
    if (this.multiAgentRenderer) {
      this.multiAgentRenderer.update(deltaTime);
    }
  }

  /**
   * Get agent manager
   */
  getAgentManager(): AgentManager | null {
    return this.agentManager;
  }
}
```

### Phase 5: UI & Metrics (Days 10-11)

#### File 5: `src/ui/MultiAgentPanel.ts` (NEW - ~300 lines)

```typescript
/**
 * Multi-Agent Panel - Display social interactions and metrics
 *
 * Shows:
 * - List of active agents
 * - Social network visualization
 * - Recent interactions
 * - Relationship metrics
 */

import { Graphics, Text, Container } from 'pixi.js';
import { AgentManager } from '../systems/AgentManager';

export class MultiAgentPanel {
  private container: Container;
  private agentManager: AgentManager;
  private visible: boolean = false;

  // UI elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private agentListTexts: Text[] = [];
  private metricsText!: Text;

  // Configuration
  private panelWidth = 280;
  private panelHeight = 320;
  private padding = 16;

  constructor(container: Container, agentManager: AgentManager) {
    this.container = new Container();
    this.agentManager = agentManager;
    container.addChild(this.container);

    // Start hidden
    this.container.visible = false;
  }

  async init(): Promise<void> {
    console.log('👥 Initializing Multi-Agent Panel...');

    this.createBackground();
    this.createTitle();
    this.createAgentList();
    this.createMetrics();

    console.log('✅ Multi-Agent Panel initialized');
  }

  /**
   * Create background
   */
  private createBackground(): void {
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x000000, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x2196F3, 0.8); // Blue border
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title
   */
  private createTitle(): void {
    this.titleText = new Text('AGENTS & SOCIAL', {
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x2196F3,
    });
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;
    this.container.addChild(this.titleText);
  }

  /**
   * Update panel
   */
  update(_deltaTime: number): void {
    if (!this.visible) return;

    this.updateAgentList();
    this.updateMetrics();
  }

  /**
   * Update agent list
   */
  private updateAgentList(): void {
    // Clear old texts
    this.agentListTexts.forEach(t => t.destroy());
    this.agentListTexts = [];

    const agents = this.agentManager.getAllAgents();
    const startY = 50;
    const lineHeight = 20;

    agents.forEach((agent, i) => {
      const state = agent.getState();
      const status = state.isAlive ? '✓' : '✗';
      const color = state.isAlive ? 0x00ff00 : 0xff0000;

      const text = new Text(
        `${status} ${agent.getName()} (${agent.getSocialMemory().getKnownAgentCount()} known)`,
        {
          fontFamily: 'monospace',
          fontSize: 10,
          fill: color
        }
      );
      text.x = this.padding;
      text.y = startY + i * lineHeight;
      this.container.addChild(text);
      this.agentListTexts.push(text);
    });
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const metrics = this.agentManager.getMetrics();

    if (this.metricsText) {
      this.metricsText.destroy();
    }

    const metricsStr = `
Metrics:
  Active: ${metrics.activeAgents}/${metrics.totalAgents}
  Interactions: ${metrics.totalInteractions}
  Network Density: ${(metrics.socialNetworkDensity * 100).toFixed(0)}%
    `.trim();

    this.metricsText = new Text(metricsStr, {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xcccccc
    });
    this.metricsText.x = this.padding;
    this.metricsText.y = this.panelHeight - 100;
    this.container.addChild(this.metricsText);
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`👥 Multi-Agent Panel: ${this.visible ? 'visible' : 'hidden'}`);
  }

  // ... other methods ...
}
```

---

## Testing Strategy

### Unit Tests

1. **AgentManager**
   - ✅ Create multiple agents
   - ✅ Detect nearby agents correctly
   - ✅ Line of sight calculation
   - ✅ Spatial indexing works
   - ✅ Metrics calculation

2. **SocialMemory**
   - ✅ Record first encounter
   - ✅ Update relationships
   - ✅ Familiarity increases
   - ✅ Decay over time
   - ✅ Get closest friend

3. **Multi-Agent Rendering**
   - ✅ Render multiple agents
   - ✅ Visual distinction (colors, names)
   - ✅ Name labels display correctly

### Integration Tests

1. **Two Agents Meet**
   - Agents spawn in maze
   - Move toward each other
   - Detect when in range
   - Generate observations
   - Store social memories
   - Verify both agents have memory of each other

2. **Social Memory Evolution**
   - Track relationship over multiple interactions
   - Verify familiarity increases
   - Test decay when no interaction

3. **UI Display**
   - Multi-agent panel shows all agents
   - Metrics update correctly
   - Toggle works

### Success Criteria

✅ Support 2-3 agents simultaneously
✅ Agents detect each other within 5 tiles
✅ Social observations generated
✅ Relationships tracked correctly
✅ Visual distinction between agents
✅ Multi-agent panel displays correctly
✅ Performance: <5ms per agent update
✅ No interference between agent memories

---

## Timeline

### Days 1-3: Core Systems
- Create multi-agent types
- Implement AgentManager
- Agent detection and perception
- Spatial indexing

### Days 4-5: Social Memory
- Implement SocialMemory class
- Relationship tracking
- Integration with Agent class

### Days 6-7: Rendering
- Multi-agent rendering
- Visual distinction
- Name labels

### Days 8-9: Integration
- Modify Game.ts for multiple agents
- Initialize 2-3 agents
- Update loop modifications

### Days 10-11: UI & Polish
- Multi-Agent Panel
- Metrics display
- Testing and refinement

---

## Configuration

```typescript
// src/config/multi-agent.config.ts
export const MULTI_AGENT_CONFIG = {
  // Detection
  perceptionRadius: 5,          // Tiles
  updateInterval: 1000,         // ms between social checks

  // Relationships
  familiarityIncrement: 0.05,   // Per interaction
  familiarityDecayRate: 0.99,   // Daily
  affinityChangeRate: 0.1,      // Per sentiment
  trustBuildRate: 0.02,         // Per positive event

  // Starting agents
  defaultAgentCount: 2,         // Start with 2 agents
  maxAgents: 5,                 // Maximum supported

  // Visual
  agentNameOffset: -10,         // Pixels above agent
  agentColors: [
    0x4CAF50,  // Blue (Arth)
    0x2196F3,  // Pink (Vani)
    0xFF9800,  // Orange (Soko)
    0xE91E63,  // Green
    0x9C27B0   // Purple
  ]
};
```

---

## Deliverables

### New Files (5)
1. ✅ `src/types/multi-agent.ts` (~250 lines)
2. ✅ `src/systems/AgentManager.ts` (~600 lines)
3. ✅ `src/agent/SocialMemory.ts` (~400 lines)
4. ✅ `src/rendering/MultiAgentRenderer.ts` (~200 lines)
5. ✅ `src/ui/MultiAgentPanel.ts` (~300 lines)

### Modified Files (3)
1. ✅ `src/agent/Agent.ts` (+60 lines)
2. ✅ `src/core/Game.ts` (+150 lines)
3. ✅ `src/rendering/AgentRenderer.ts` (+40 lines)

### Total Code
- **New**: ~1,750 lines
- **Modified**: ~250 lines
- **Total**: ~2,000 lines

---

## Research Paper Alignment

### Sections Addressed
- ✅ **Section 3.3**: Agent Perception (detecting other agents)
- ✅ **Section 3.4**: Social Interactions
- ✅ **Section 5.2**: Multi-agent simulation foundation

### Alignment Improvement
**Before Week 6**: 0% multi-agent
**After Week 6**: 60% multi-agent

**Overall Paper Alignment**: 78% → 85%

### Remaining Gaps
- ❌ Dialogue (Week 7)
- ❌ Coordinated group activities
- ❌ Information diffusion (requires dialogue)

---

## Future Considerations

### What Week 6 Enables
1. **Week 7 Dialogue**: Foundation for conversations
2. **Emergent Social Dynamics**: Relationships evolve
3. **Information Spread**: Via dialogue in Week 7
4. **Research on Social AI**: Multi-agent interactions

### Research Questions
1. How do relationships form in survival scenarios?
2. Do agents cooperate or compete for resources?
3. What social structures emerge?
4. How does stress affect social behavior?

---

## Conclusion

Week 6 transforms Maze Mind from a **single-agent** to a **multi-agent simulation**, laying the groundwork for emergent social behaviors described in the paper. While agents can't yet communicate via dialogue (Week 7), they can now detect, observe, and remember each other, forming the foundation for rich social dynamics.

**Paper Quote**:
> "Generative agents wake up, cook breakfast, and head to work; artists paint, while authors write; they form opinions, notice each other, and initiate conversations" - Park et al., 2023
