// src/types/role-emergence.ts
/**
 * Role Emergence & Specialization Types
 *
 * Enables agents to naturally specialize into roles based on their behavior
 * and performance. Implements emergent role assignment from Park et al. (2023).
 */

export type EmergentRole =
  | 'SCOUT'       // Fast explorer, discovers new areas quickly
  | 'GATHERER'    // Efficient at finding and collecting resources
  | 'NAVIGATOR'   // Excellent pathfinding, rarely gets lost
  | 'HEALER'      // Manages team health, shares resources
  | 'STRATEGIST'  // Good at planning, proposes effective strategies
  | 'PROTECTOR'   // Takes risks to help others, rescues teammates
  | 'GENERALIST'; // No clear specialization yet

export type RoleConfidence =
  | 'EMERGING'    // 0.0 - 0.3: Role just starting to show
  | 'DEVELOPING'  // 0.3 - 0.6: Role becoming clearer
  | 'ESTABLISHED' // 0.6 - 0.8: Role well-defined
  | 'EXPERT';     // 0.8 - 1.0: Clear expert in role

export interface RoleProfile {
  agentId: string;
  agentName: string;
  currentRole: EmergentRole;
  confidence: number;         // 0-1, how strong the role is
  confidenceLevel: RoleConfidence;

  // Role history
  roleHistory: RoleChange[];
  timeInRole: number;         // ms in current role

  // Performance metrics that drive role emergence
  metrics: RoleMetrics;

  // Recognition by team
  recognizedByTeam: boolean;
  recognitionCount: number;
}

export interface RoleChange {
  fromRole: EmergentRole;
  toRole: EmergentRole;
  timestamp: number;
  reason: string;
  triggeringMetric: string;
}

export interface RoleMetrics {
  // Scout metrics
  tilesExplored: number;
  explorationSpeed: number;      // tiles/minute
  firstDiscoveries: number;       // tiles discovered before others

  // Gatherer metrics
  resourcesFound: number;
  resourceCollectionRate: number; // resources/minute
  resourceTypes: Set<string>;     // diversity of resources found

  // Navigator metrics
  pathfindingAccuracy: number;    // 0-1, successful paths
  averagePathLength: number;      // efficiency
  timesLost: number;              // got stuck/backtracked

  // Healer metrics
  resourcesShared: number;
  teammatesHelped: number;
  healthRestored: number;         // total HP given to others

  // Strategist metrics
  plansProposed: number;
  planSuccessRate: number;        // 0-1
  planQuality: number;            // 0-10, average importance

  // Protector metrics
  rescuesPerformed: number;
  risksForOthers: number;         // dangerous actions to help teammates
  teamSurvivalContribution: number; // 0-1

  // General metrics
  survivalTime: number;           // ms alive
  deathCount: number;
  successRate: number;            // 0-1, simulations succeeded
}

export interface TeamRoleComposition {
  teamId: string;
  members: string[];

  // Role distribution
  roleDistribution: Map<EmergentRole, number>; // role -> count

  // Team dynamics
  hasLeader: boolean;
  leaderId?: string;
  complementaryRoles: boolean;    // Do roles complement each other?
  roleBalance: number;            // 0-1, how well-balanced roles are

  // Statistics
  averageRoleConfidence: number;
  totalRoleChanges: number;
  mostCommonRole: EmergentRole | null;
}

export interface RoleEmergenceEvent {
  id: string;
  agentId: string;
  agentName: string;
  previousRole: EmergentRole;
  newRole: EmergentRole;
  confidence: number;
  reason: string;
  timestamp: number;

  // What triggered the emergence
  triggeringAction?: string;
  triggeringMetric?: string;
  metricValue?: number;
}

export interface RoleRecognition {
  recognizerId: string;  // Agent who recognized the role
  recognizedId: string;   // Agent whose role was recognized
  role: EmergentRole;
  timestamp: number;
  context: string;        // Why the recognition happened
}

// Thresholds for role emergence
export const ROLE_THRESHOLDS = {
  SCOUT: {
    explorationSpeed: 5,      // tiles/min
    firstDiscoveries: 20,     // unique first discoveries
    tilesExplored: 50
  },
  GATHERER: {
    resourcesFound: 15,
    resourceCollectionRate: 2, // per minute
    resourceTypes: 3          // different types
  },
  NAVIGATOR: {
    pathfindingAccuracy: 0.8,  // 80% success
    averagePathLength: 15,     // efficient paths
    timesLost: 2              // rarely lost (max)
  },
  HEALER: {
    resourcesShared: 10,
    teammatesHelped: 3,
    healthRestored: 50
  },
  STRATEGIST: {
    plansProposed: 3,
    planSuccessRate: 0.7,     // 70% success
    planQuality: 7            // high quality plans
  },
  PROTECTOR: {
    rescuesPerformed: 2,
    risksForOthers: 3,
    teamSurvivalContribution: 0.3
  }
};

// Confidence calculation weights
export const CONFIDENCE_WEIGHTS = {
  performanceScore: 0.4,      // How well metrics meet thresholds
  consistency: 0.3,           // How consistently agent performs role
  timeInRole: 0.2,            // How long in role (up to 5 minutes)
  teamRecognition: 0.1        // Recognition by teammates
};
