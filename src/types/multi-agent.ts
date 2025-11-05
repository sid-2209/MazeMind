// src/types/multi-agent.ts
/**
 * Multi-Agent Type Definitions (Week 6, Day 1)
 *
 * Defines types for:
 * - Agent configurations
 * - Social memory and relationships
 * - Interactions between agents
 * - Multi-agent metrics
 */

import { Position } from './index';

/**
 * Agent Configuration
 * Used to define and create individual agents
 */
export interface AgentConfig {
  /** Unique identifier for the agent */
  id: string;

  /** Display name */
  name: string;

  /** Visual color (hex number, e.g., 0x2196F3) */
  color: number;

  /** Starting position in maze (assigned dynamically if not provided) */
  startPosition?: Position;

  /** Personality traits (for future use in Week 7+) */
  personality?: {
    openness?: number;      // 0-1
    conscientiousness?: number; // 0-1
    extraversion?: number;  // 0-1
    agreeableness?: number; // 0-1
    neuroticism?: number;   // 0-1
  };

  /** Optional custom traits for behavior */
  traits?: string[];
}

/**
 * Types of interactions between agents
 */
export enum InteractionType {
  /** Visual observation (agent sees another agent) */
  OBSERVATION = 'observation',

  /** Close proximity (within 2 tiles) */
  PROXIMITY = 'proximity',

  /** Both agents targeting same item */
  ITEM_COMPETITION = 'item_competition',

  /** One agent takes item other agent wanted */
  ITEM_TAKEN = 'item_taken',

  /** Verbal dialogue (Week 7+) */
  DIALOGUE = 'dialogue',

  /** Coordinated action (Week 7+) */
  COORDINATION = 'coordination',

  /** Helping behavior (sharing info, items) */
  HELPING = 'helping',

  /** Meeting for first time */
  FIRST_MEETING = 'first_meeting'
}

/**
 * Record of a single interaction between agents
 */
export interface Interaction {
  /** Unique ID for this interaction */
  id: string;

  /** Timestamp (game time in seconds) */
  timestamp: number;

  /** Type of interaction */
  type: InteractionType;

  /** ID of the other agent involved */
  otherAgentId: string;

  /** Name of the other agent */
  otherAgentName: string;

  /** Where the interaction occurred */
  location: Position;

  /** Natural language description */
  description: string;

  /** Emotional valence (-1 to 1: negative, neutral, positive) */
  valence: number;

  /** Optional dialogue content (Week 7+) */
  dialogue?: {
    speaker: string;
    message: string;
  };

  /** Optional additional context */
  context?: Record<string, any>;
}

/**
 * Relationship metrics between two agents
 */
export interface Relationship {
  /** How well agents know each other (0-1) */
  familiarity: number;

  /** How much they like each other (-1 to 1) */
  affinity: number;

  /** How much they trust each other (0-1) */
  trust: number;

  /** Last interaction timestamp */
  lastInteraction: number;

  /** Total number of interactions */
  interactionCount: number;

  /** Recent interaction types (last 5) */
  recentInteractions: InteractionType[];
}

/**
 * Social memory about another agent
 */
export interface SocialMemory {
  /** ID of the other agent */
  agentId: string;

  /** Name of the other agent */
  agentName: string;

  /** Color of the other agent */
  agentColor: number;

  /** When first met (game time) */
  firstMet: number;

  /** Relationship metrics */
  relationship: Relationship;

  /** All recorded interactions */
  interactions: Interaction[];

  /** Known facts about the agent */
  knownFacts: string[];

  /** Inferred traits/personality */
  perceivedTraits: string[];
}

/**
 * Result of agent detection query
 */
export interface AgentDetectionResult {
  /** The detected agent */
  agentId: string;

  /** Agent's name */
  agentName: string;

  /** Agent's color */
  agentColor: number;

  /** Agent's current position */
  position: Position;

  /** Distance in tiles (Manhattan distance) */
  distance: number;

  /** Whether there's line of sight (no walls between) */
  hasLineOfSight: boolean;

  /** Direction relative to observer (for descriptions) */
  relativeDirection?: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
}

/**
 * Multi-agent system metrics
 */
export interface MultiAgentMetrics {
  /** Total number of active agents */
  activeAgentCount: number;

  /** Total interactions across all agents */
  totalInteractions: number;

  /** Average familiarity across all relationships */
  averageFamiliarity: number;

  /** Average affinity across all relationships */
  averageAffinity: number;

  /** Network density (actual connections / possible connections) */
  networkDensity: number;

  /** Agents grouped by closeness */
  clusters: string[][];

  /** Most social agent (most interactions) */
  mostSocialAgentId: string | null;

  /** Most isolated agent (fewest interactions) */
  mostIsolatedAgentId: string | null;
}

/**
 * Configuration for multi-agent system
 */
export interface MultiAgentConfig {
  /** Maximum number of agents allowed */
  maxAgents: number;

  /** Detection radius in tiles */
  detectionRadius: number;

  /** Update interval for social detection (seconds) */
  detectionInterval: number;

  /** Familiarity increase per interaction */
  familiarityGainRate: number;

  /** Familiarity decay per game hour without interaction */
  familiarityDecayRate: number;

  /** Trust decay per game hour without interaction */
  trustDecayRate: number;

  /** Default affinity for new relationships */
  defaultAffinity: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_MULTI_AGENT_CONFIG: MultiAgentConfig = {
  maxAgents: 3,
  detectionRadius: 5,
  detectionInterval: 2, // Check every 2 seconds
  familiarityGainRate: 0.05, // +5% per interaction
  familiarityDecayRate: 0.01, // -1% per hour
  trustDecayRate: 0.02, // -2% per hour
  defaultAffinity: 0.0, // Neutral starting affinity
};

/**
 * Predefined agent configurations
 */
export const PREDEFINED_AGENTS: AgentConfig[] = [
  {
    id: 'arth',
    name: 'Arth',
    color: 0x2196F3, // Blue
    personality: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.6,
      agreeableness: 0.7,
      neuroticism: 0.4,
    },
    traits: ['curious', 'analytical', 'cautious'],
  },
  {
    id: 'vani',
    name: 'Vani',
    color: 0xFFC0CB, // Pink
    personality: {
      openness: 0.9,
      conscientiousness: 0.5,
      extraversion: 0.8,
      agreeableness: 0.9,
      neuroticism: 0.3,
    },
    traits: ['friendly', 'optimistic', 'adventurous'],
  },
  {
    id: 'soko',
    name: 'Soko',
    color: 0xFF9800, // Orange
    personality: {
      openness: 0.6,
      conscientiousness: 0.9,
      extraversion: 0.4,
      agreeableness: 0.6,
      neuroticism: 0.5,
    },
    traits: ['methodical', 'strategic', 'reserved'],
  },
];
