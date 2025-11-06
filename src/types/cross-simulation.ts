// src/types/cross-simulation.ts
/**
 * Cross-Simulation Memory Types
 *
 * Enables agents to remember and learn from previous maze simulation runs.
 * Agents persist key memories (discovered paths, dangers, strategies) across
 * simulations, creating a learning curve where they improve over time.
 */

import { Position } from './index';

export interface CrossSimulationMemory {
  agentId: string;
  agentName: string;
  simulationHistory: SimulationRun[];

  // Maze knowledge (accumulated across runs)
  mazeKnowledge: MazeKnowledge;

  // Strategy knowledge
  strategies: StrategyKnowledge;

  // Performance metrics
  performance: PerformanceMetrics;

  // Social learning
  socialKnowledge: SocialKnowledge;

  // Metadata
  lastSimulationDate: number;
  totalExperienceHours: number;
  version: string;
}

export interface MazeKnowledge {
  discoveredPaths: PathInfo[];
  deadEnds: Position[];
  dangerZones: DangerInfo[];
  resourceLocations: ResourceLocationMap;
  exitLocations: ExitInfo[];
  safeRooms: Position[];
}

export interface ResourceLocationMap {
  [itemType: string]: Position[];
}

export interface SimulationRun {
  runId: string;
  startTime: number;
  endTime: number;
  outcome: 'SUCCESS' | 'DEATH' | 'TIMEOUT';
  finalPosition: Position;
  survivalTime: number;
  resourcesCollected: number;
  teammatesHelped: number;
  keyLearnings: string[];
}

export interface PathInfo {
  id: string;
  from: Position;
  to: Position;
  path: Position[];
  timesUsed: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgTime: number;
  lastUsed: number;
}

export interface DangerInfo {
  location: Position;
  type: 'TRAP' | 'DEAD_END' | 'ENEMY' | 'ENVIRONMENTAL' | 'STARVATION' | 'EXHAUSTION';
  severity: number;  // 1-10
  description: string;
  witnessedCount: number;
  deathsAtLocation: number;
  firstSeen: number;
  lastSeen: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  actions: string[];
  successRate: number;
  timesAttempted: number;
  avgOutcome: number;
  avgSurvivalTime: number;
  firstAttempted: number;
  lastAttempted: number;
}

export interface StrategyKnowledge {
  successful: Strategy[];
  failed: Strategy[];
  bestPractices: string[];
}

export interface ExitInfo {
  location: Position;
  discoveredInRun: string;
  discoveryTime: number;
  requiresKey: boolean;
  requiresMultipleAgents: boolean;
  activationMethod: string;
  timesReached: number;
  timesExited: number;
}

export interface PerformanceMetrics {
  totalRuns: number;
  successfulExits: number;
  averageSurvivalTime: number;
  totalDeaths: number;
  deathLocations: Map<string, number>;  // "x,y" -> count
  bestSurvivalTime: number;
  worstSurvivalTime: number;
  totalResourcesCollected: number;
  totalTeammatesHelped: number;
}

export interface SocialKnowledge {
  learnedFromOthers: Map<string, SharedKnowledge>;  // agentId -> knowledge
  trustLevels: Map<string, number>;  // agentId -> trust (0-1)
  cooperationHistory: CooperationEvent[];
}

export interface SharedKnowledge {
  sourceAgentId: string;
  sourceAgentName: string;
  knowledgeType: 'PATH' | 'DANGER' | 'RESOURCE' | 'STRATEGY' | 'EXIT';
  description: string;
  wasUseful: boolean;
  usefulness: number;  // 0-1
  sharedAt: number;
}

export interface CooperationEvent {
  partnerId: string;
  partnerName: string;
  eventType: 'RESOURCE_SHARE' | 'DANGER_WARNING' | 'MAP_SHARE' | 'RESCUE' | 'COORDINATION';
  description: string;
  outcome: 'SUCCESS' | 'FAILURE';
  timestamp: number;
}

// Helper type for serialization
export interface SerializableCrossSimMemory extends Omit<CrossSimulationMemory, 'performance' | 'socialKnowledge'> {
  performance: Omit<PerformanceMetrics, 'deathLocations'> & {
    deathLocations: [string, number][];
  };
  socialKnowledge: {
    learnedFromOthers: [string, SharedKnowledge][];
    trustLevels: [string, number][];
    cooperationHistory: CooperationEvent[];
  };
}
