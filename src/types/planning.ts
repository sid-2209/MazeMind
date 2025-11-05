import { Position } from './index';

/**
 * Plan status states
 */
export enum PlanStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  FAILED = 'failed'
}

/**
 * Plan priority levels
 */
export enum PlanPriority {
  CRITICAL = 'critical',    // Survival-related
  HIGH = 'high',           // Important goals
  MEDIUM = 'medium',       // Normal activities
  LOW = 'low'              // Optional exploration
}

/**
 * Types of actions the agent can plan
 */
export enum ActionType {
  MOVE = 'move',
  EXPLORE = 'explore',
  CONSUME_ITEM = 'consume_item',
  SEEK_ITEM = 'seek_item',
  REST = 'rest',
  REFLECT = 'reflect',
  WAIT = 'wait'
}

/**
 * 5-minute action plan - lowest level of planning hierarchy
 */
export interface ActionPlan {
  id: string;
  parentId: string;        // ID of HourlyPlan
  startTime: number;       // Game time in seconds
  duration: number;        // Duration in seconds (typically 300 = 5 min)
  action: string;          // Natural language action description
  actionType: ActionType;  // Categorized action type
  targetPosition?: Position; // Where to move (if applicable)
  targetItem?: string;     // Item to seek/consume (if applicable)
  status: PlanStatus;
  completedAt?: number;
  memoryId?: string;       // Reference to memory storage
}

/**
 * Hourly plan - middle level of planning hierarchy
 */
export interface HourlyPlan {
  id: string;
  parentId: string;        // ID of DailyPlan
  startTime: number;       // Game time in seconds
  duration: number;        // 3600 seconds (1 hour)
  objective: string;       // What to accomplish this hour
  actions: ActionPlan[];   // 12 five-minute actions
  status: PlanStatus;
  completedAt?: number;
}

/**
 * Daily plan - top level of planning hierarchy
 */
export interface DailyPlan {
  id: string;
  createdAt: number;       // Timestamp when plan was created
  goal: string;            // High-level daily goal
  reasoning: string;       // Why this goal (from LLM)
  priority: PlanPriority;
  hourlyPlans: HourlyPlan[];
  status: PlanStatus;
  completedAt?: number;
  abandonedReason?: string;
}

/**
 * Context information for plan generation
 */
export interface PlanningContext {
  // Current state
  survivalState: {
    hunger: number;
    thirst: number;
    energy: number;
    stress: number;
  };

  // Environment
  currentPosition: Position;
  explorationProgress: number;
  knownItems: Array<{type: string; position: Position}>;

  // Memory
  recentMemories: string[];
  recentReflections: string[];

  // Time
  gameTime: number;
  timeOfDay: string;
}

/**
 * Configuration for planning system
 */
export interface PlanningConfig {
  // Plan generation
  dailyPlanHorizon: number;     // 24 hours in seconds
  hourlyPlanCount: number;      // Generate 3 hours ahead
  actionDuration: number;       // 5 minutes per action

  // Re-planning triggers
  criticalHungerThreshold: number;
  criticalThirstThreshold: number;
  criticalEnergyThreshold: number;
  divergenceThreshold: number;  // How much worse than expected

  // LLM parameters
  planningTemperature: number;
  planningMaxTokens: number;

  // Performance
  planCacheEnabled: boolean;
  planCacheDuration: number;    // seconds

  // UI
  maxDisplayedActions: number;
  truncateLength: number;
}

/**
 * Default planning configuration
 */
export const DEFAULT_PLANNING_CONFIG: PlanningConfig = {
  // Plan generation
  dailyPlanHorizon: 24 * 3600,     // 24 hours in seconds
  hourlyPlanCount: 3,               // Generate 3 hours ahead
  actionDuration: 5 * 60,           // 5 minutes per action

  // Re-planning triggers
  criticalHungerThreshold: 20,
  criticalThirstThreshold: 15,
  criticalEnergyThreshold: 10,
  divergenceThreshold: 1.5,         // 50% worse than expected

  // LLM parameters
  planningTemperature: 0.7,
  planningMaxTokens: 300,

  // Performance
  planCacheEnabled: true,
  planCacheDuration: 300,           // 5 minutes

  // UI
  maxDisplayedActions: 4,
  truncateLength: 40
};
