// src/types/evaluation.ts
/**
 * Evaluation Types - Week 10
 *
 * Type definitions for the evaluation framework based on Park et al. (2023) Section 6
 *
 * Evaluation Methods:
 * 1. Believability Evaluation (Section 6.1) - Interview agents, test credibility
 * 2. Ablation Studies (Section 6.3) - Remove components, measure impact
 * 3. End-to-End Evaluation (Section 6.2) - Full simulation with emergent behaviors
 */

import { Agent } from '../agent/Agent';
import { Position } from './index';

// ============================================
// Believability Evaluation (Section 6.1)
// ============================================

/**
 * Question asked during agent interview
 */
export interface EvaluationQuestion {
  category: QuestionCategory;
  text: string;
  expectedKnowledge?: string[]; // What agent should know to answer well
}

export enum QuestionCategory {
  SELF_KNOWLEDGE = 'self_knowledge',    // "What have you been doing?"
  MEMORY_RECALL = 'memory_recall',       // "When did you last eat?"
  PLAN_AWARENESS = 'plan_awareness',     // "What are your goals?"
  SOCIAL_AWARENESS = 'social_awareness', // "Who have you met?"
  EMOTIONAL_STATE = 'emotional_state'    // "How are you feeling?"
}

/**
 * Agent's response to an interview question
 */
export interface QuestionResponse {
  question: string;
  response: string;
  retrievedMemories?: string[]; // Memories used to generate response
  timestamp: number;
}

/**
 * Complete interview results for one agent
 */
export interface InterviewResults {
  agentId: string;
  agentName: string;
  timestamp: number;
  responses: QuestionResponse[];
  scores: EvaluationScores;
  duration: number; // Interview duration in ms
}

/**
 * Evaluation scores (0-100 scale)
 * Based on paper's believability metrics
 */
export interface EvaluationScores {
  selfKnowledge: number;      // Can agent recall its own experiences?
  memoryRetrieval: number;    // Are retrieved memories relevant?
  planCoherence: number;      // Is plan logical and goal-oriented?
  socialAwareness: number;    // Does agent know about others?
  believability: number;      // Overall believability (average of above)
}

// ============================================
// Ablation Studies (Section 6.3)
// ============================================

/**
 * Ablation condition - which components to disable
 */
export interface AblationCondition {
  name: string;
  description: string;
  disable: ComponentType[]; // Which components to turn off
}

export enum ComponentType {
  MEMORY = 'memory',           // No memory stream
  REFLECTION = 'reflection',   // No reflection system
  PLANNING = 'planning',       // No planning, reactive only
  RETRIEVAL = 'retrieval',     // No memory retrieval (recency only)
  OBSERVATION = 'observation', // No environment observation
  DIALOGUE = 'dialogue'        // No agent-agent communication
}

/**
 * Configuration for an ablation experiment
 */
export interface ExperimentConfig {
  name: string;
  durationMinutes: number;
  agentCount: number;
  mazeSize: number;

  // Ablation flags
  disableMemory?: boolean;
  disableReflection?: boolean;
  disablePlanning?: boolean;
  disableRetrieval?: boolean;
  disableObservation?: boolean;
  disableDialogue?: boolean;

  // Metrics to collect
  collectBeliefability?: boolean;
  collectSurvival?: boolean;
  collectExploration?: boolean;
  collectSocial?: boolean;
}

/**
 * Results from a single experiment run
 */
export interface ExperimentResults {
  config: ExperimentConfig;
  startTime: number;
  endTime: number;
  duration: number;

  // Agent outcomes
  agentResults: AgentExperimentResult[];

  // Aggregate statistics
  stats: ExperimentStatistics;
}

/**
 * Results for individual agent in experiment
 */
export interface AgentExperimentResult {
  agentId: string;
  agentName: string;
  survived: boolean;
  survivalTime: number;
  explorationProgress: number;
  decisionsCount: number;
  socialInteractions: number;
  finalState: {
    hunger: number;
    thirst: number;
    energy: number;
    stress: number;
  };
}

/**
 * Aggregate statistics across all agents
 */
export interface ExperimentStatistics {
  successRate: number;          // % agents that survived
  avgSurvivalTime: number;      // Average time alive
  avgExplorationProgress: number; // % maze explored
  avgDecisionQuality: number;   // Quality of decisions (0-100)
  avgSocialInteractions: number; // Social interactions per agent
  totalMemories: number;        // Total memories created
  totalReflections: number;     // Total reflections generated
}

/**
 * Results from running one ablation condition
 */
export interface ConditionResult {
  name: string;
  disabled: ComponentType[];
  results: ExperimentResults;
}

/**
 * Complete ablation study results
 */
export interface AblationResults {
  timestamp: number;
  conditions: ConditionResult[];
  comparison: AblationComparison;
  mostCriticalComponent: {
    name: string;
    impact: number; // How much worse without it (0-1)
  };
}

/**
 * Comparison of ablation conditions
 */
export interface AblationComparison {
  survivalRateDelta: Record<string, number>;      // Change vs baseline
  explorationDelta: Record<string, number>;       // Change vs baseline
  decisionQualityDelta: Record<string, number>;   // Change vs baseline
  socialInteractionDelta: Record<string, number>; // Change vs baseline
}

// ============================================
// End-to-End Evaluation (Section 6.2)
// ============================================

/**
 * Configuration for full simulation
 */
export interface SimulationConfig {
  name: string;
  agentCount: number;
  durationHours: number; // Simulation duration
  mazeSize: number;
  enableSocialInteractions: boolean;
  collectDetailedMetrics: boolean;
}

/**
 * Complete simulation report
 */
export interface SimulationReport {
  config: SimulationConfig;
  startTime: number;
  endTime?: number;
  duration: number;

  // Agent summaries
  agents: AgentSummary[];

  // Events that occurred
  events: SimulationEvent[];

  // Social network formed
  socialNetwork: SocialNetworkGraph;

  // Emergent behaviors detected
  emergentBehaviors: EmergentBehavior[];

  // Performance metrics
  metrics: SimulationMetrics;
}

/**
 * Summary of an agent's simulation performance
 */
export interface AgentSummary {
  id: string;
  name: string;
  finalState: 'alive' | 'dead' | 'breakdown';
  survivalTime: number;
  totalMemories: number;
  totalReflections: number;
  totalConversations: number;
  explorationProgress: number;
  finalPosition: Position;
}

/**
 * Event that occurred during simulation
 */
export interface SimulationEvent {
  timestamp: number;
  type: EventType;
  agentIds: string[]; // Agents involved
  description: string;
  location?: Position;
  metadata?: Record<string, any>;
}

export enum EventType {
  AGENT_SPAWN = 'agent_spawn',
  AGENT_DEATH = 'agent_death',
  AGENT_BREAKDOWN = 'agent_breakdown',
  CONVERSATION = 'conversation',
  ITEM_CONSUMED = 'item_consumed',
  REFLECTION_GENERATED = 'reflection_generated',
  PLAN_CREATED = 'plan_created',
  PLAN_REVISED = 'plan_revised',
  LOCATION_DISCOVERED = 'location_discovered',
  SOCIAL_BOND_FORMED = 'social_bond_formed'
}

/**
 * Social network graph
 */
export interface SocialNetworkGraph {
  nodes: SocialNode[];
  edges: SocialEdge[];
}

export interface SocialNode {
  agentId: string;
  agentName: string;
  connectionCount: number;
}

export interface SocialEdge {
  fromAgent: string;
  toAgent: string;
  interactionCount: number;
  strength: number; // 0-1, based on interaction frequency
}

/**
 * Emergent behavior detected in simulation
 */
export interface EmergentBehavior {
  type: EmergentBehaviorType;
  description: string;
  confidence: number; // 0-1, how confident we are this behavior emerged
  evidence: any[]; // Supporting evidence
  timestamp: number;
}

export enum EmergentBehaviorType {
  INFORMATION_DIFFUSION = 'information_diffusion',  // Information spreads through network
  GROUP_FORMATION = 'group_formation',              // Agents form clusters
  COORDINATED_ACTIVITY = 'coordinated_activity',    // Multiple agents coordinate
  RESOURCE_SHARING = 'resource_sharing',            // Agents share information about resources
  LEADERSHIP_EMERGENCE = 'leadership_emergence',    // One agent becomes influential
  COLLECTIVE_MEMORY = 'collective_memory'           // Shared knowledge emerges
}

/**
 * Simulation-wide metrics
 */
export interface SimulationMetrics {
  totalAgents: number;
  survivingAgents: number;
  totalConversations: number;
  totalMemoriesCreated: number;
  totalReflectionsGenerated: number;
  avgExplorationProgress: number;
  socialCohesion: number; // 0-1, how connected the network is
  informationDiffusionRate: number; // How fast info spreads
}

// ============================================
// Paper Alignment Report
// ============================================

/**
 * Component alignment with paper
 */
export interface ComponentAlignment {
  score: number; // 0-100
  features: string[]; // Implemented features
  gaps: string[]; // Missing features
  paperSection: string; // Which paper section
}

/**
 * Overall paper alignment report
 */
export interface PaperAlignmentReport {
  overallAlignment: number; // 0-100
  timestamp: number;

  // Component-level alignment
  componentAlignment: {
    memory: ComponentAlignment;
    reflection: ComponentAlignment;
    planning: ComponentAlignment;
    dialogue: ComponentAlignment;
    environment: ComponentAlignment;
    evaluation: ComponentAlignment;
    multiAgent: ComponentAlignment;
  };

  // Key achievements
  keyAchievements: string[];

  // Remaining gaps
  remainingGaps: string[];

  // Recommended extensions
  recommendedExtensions: string[];
}

// ============================================
// Evaluation Session
// ============================================

/**
 * Complete evaluation session
 */
export interface EvaluationSession {
  id: string;
  name: string;
  timestamp: number;

  // What was evaluated
  believabilityResults?: InterviewResults[];
  ablationResults?: AblationResults;
  simulationReport?: SimulationReport;
  alignmentReport?: PaperAlignmentReport;

  // Summary
  summary: string;
  recommendations: string[];
}

// ============================================
// Helper Types
// ============================================

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

/**
 * Comparison data for charts
 */
export interface ComparisonData {
  label: string;
  value: number;
  baseline?: number;
  delta?: number;
}

/**
 * Score distribution (for histograms)
 */
export interface ScoreDistribution {
  min: number;
  max: number;
  mean: number;
  median: number;
  stddev: number;
  buckets: HistogramBucket[];
}

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
}
