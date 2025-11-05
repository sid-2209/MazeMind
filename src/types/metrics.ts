/**
 * Metrics Types - Data collection and analysis types (Week 4)
 *
 * Defines structures for:
 * - Simulation metrics
 * - Event logs
 * - Statistical analysis
 * - Experiment configuration
 */

import { Position } from './index';

// ============================================
// Simulation Outcome
// ============================================

export enum SimulationOutcome {
  SUCCESS = 'success',           // Found exit
  DEATH_STARVATION = 'death_starvation',
  DEATH_DEHYDRATION = 'death_dehydration',
  DEATH_EXHAUSTION = 'death_exhaustion',
  MENTAL_BREAKDOWN = 'mental_breakdown',
  TIMEOUT = 'timeout',           // Max time exceeded
  IN_PROGRESS = 'in_progress'
}

// ============================================
// Event Tracking
// ============================================

export interface SimulationEvent {
  timestamp: number;              // Game time (seconds)
  type: EventType;
  description: string;
  importance: number;             // 1-10
  position?: Position;
  data?: any;                     // Event-specific data
}

export enum EventType {
  // Movement
  MOVEMENT = 'movement',
  EXPLORATION = 'exploration',

  // Survival
  ITEM_CONSUMED = 'item_consumed',
  RESOURCE_CRITICAL = 'resource_critical',
  STRESS_HIGH = 'stress_high',

  // Outcomes
  DEATH = 'death',
  BREAKDOWN = 'breakdown',
  EXIT_FOUND = 'exit_found',

  // Memory
  OBSERVATION = 'observation',
  REFLECTION = 'reflection',

  // Decision
  DECISION = 'decision',
  SURVIVAL_PRIORITY = 'survival_priority'
}

// ============================================
// Metrics Snapshots
// ============================================

export interface MetricsSnapshot {
  timestamp: number;

  // Agent state
  position: Position;
  hunger: number;
  thirst: number;
  energy: number;
  stress: number;
  health: number;

  // Memory
  memoryCount: number;
  reflectionCount: number;

  // Exploration
  tilesExplored: number;
  explorationProgress: number;  // 0-1

  // Items
  itemsConsumed: number;
  foodConsumed: number;
  waterConsumed: number;
  energyConsumed: number;
}

// ============================================
// Simulation Metrics
// ============================================

export interface SimulationMetrics {
  // Identification
  runId: string;
  timestamp: number;              // Real-world timestamp
  seed: string;

  // Outcome
  outcome: SimulationOutcome;
  survived: boolean;
  foundExit: boolean;

  // Time metrics
  survivalTime: number;           // Seconds survived
  explorationTime: number;        // Total time
  timeToExit?: number;            // If exit found

  // Resource metrics
  finalHunger: number;
  finalThirst: number;
  finalEnergy: number;
  finalStress: number;

  averageHunger: number;
  averageThirst: number;
  averageEnergy: number;
  averageStress: number;

  minHunger: number;
  minThirst: number;
  minEnergy: number;
  maxStress: number;

  // Consumption metrics
  totalItemsConsumed: number;
  foodConsumed: number;
  waterConsumed: number;
  energyDrinksConsumed: number;

  // Exploration metrics
  tilesExplored: number;
  explorationProgress: number;    // 0-1 (% of maze explored)
  efficiency: number;             // Distance traveled / optimal path

  // Memory metrics
  totalMemories: number;
  observationCount: number;
  reflectionCount: number;
  planCount: number;

  // Decision metrics
  totalDecisions: number;
  survivalPriorityCount: number;  // Times survival overrode normal behavior
  autonomousSteps: number;

  // Events
  events: SimulationEvent[];
  snapshots: MetricsSnapshot[];

  // Path data (for replay)
  pathTaken: Position[];
}

// ============================================
// Experiment Configuration
// ============================================

export interface ExperimentConfig {
  name: string;
  description: string;

  // Run configuration
  numberOfRuns: number;
  randomSeeds: boolean;           // If false, use same seed for all runs
  baseSeed?: string;

  // Maze config
  mazeWidth: number;
  mazeHeight: number;
  mazeComplexity: number;

  // Resource config
  hungerDepletionRate: number;
  thirstDepletionRate: number;
  energyDepletionRate: number;

  // Item config
  foodCount: number;
  waterCount: number;
  energyCount: number;

  // Stress config
  stressWeights: {
    hunger: number;
    thirst: number;
    energy: number;
    exploration: number;
  };

  // Time config
  timeScale: number;
  maxSimulationTime: number;      // Seconds (game time)

  // AI config
  llmProvider: 'anthropic' | 'ollama' | 'heuristic';
  embeddingProvider: 'openai' | 'voyage' | 'ollama';
  decisionInterval: number;
}

// ============================================
// Experiment Results
// ============================================

export interface ExperimentResults {
  config: ExperimentConfig;
  runs: SimulationMetrics[];
  startTime: number;
  endTime: number;
  totalDuration: number;          // Real-world seconds

  // Aggregate statistics
  stats: AggregateStats;
}

export interface AggregateStats {
  // Outcomes
  totalRuns: number;
  successCount: number;
  successRate: number;

  deathByStarvation: number;
  deathByDehydration: number;
  deathByExhaustion: number;
  mentalBreakdowns: number;
  timeouts: number;

  // Survival time statistics
  avgSurvivalTime: number;
  minSurvivalTime: number;
  maxSurvivalTime: number;
  stdDevSurvivalTime: number;

  // Resource statistics
  avgFinalStress: number;
  avgItemsConsumed: number;
  avgExplorationProgress: number;

  // Success metrics (for successful runs)
  avgTimeToExit?: number;
  avgEfficiency?: number;
}

// ============================================
// Export Format
// ============================================

export interface ExportData {
  metadata: {
    exportedAt: number;
    version: string;
    projectName: string;
  };

  experiment: ExperimentResults;

  // Additional analysis
  notes?: string;
}
