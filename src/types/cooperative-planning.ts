// src/types/cooperative-planning.ts
/**
 * Cooperative Planning & Coordination Types
 *
 * Enables agents to form team strategies for maze escape.
 * Implements coordinated action from Park et al. (2023) for survival context.
 */

import { Position } from './index';

export type PlanType =
  | 'RENDEZVOUS'               // Meet at location
  | 'RESOURCE_SHARE'           // Coordinate resource distribution
  | 'SYNCHRONIZED_EXPLORATION' // Explore together
  | 'GROUP_EXIT'               // Exit maze as team
  | 'RESCUE_MISSION'           // Help agent in danger
  | 'AREA_SWEEP'               // Systematic area coverage
  | 'SUPPLY_RUN';              // Gather specific resources

export type AgentRole =
  | 'SCOUT'       // Fast explorer, finds resources
  | 'GATHERER'    // Collects resources efficiently
  | 'NAVIGATOR'   // Best pathfinding, leads the way
  | 'COORDINATOR' // Plans and directs team
  | 'PROTECTOR'   // Helps others, shares resources
  | 'GENERALIST'; // No specialization yet

export type PlanStatus =
  | 'PROPOSED'    // Plan created, waiting for acceptance
  | 'ACCEPTED'    // Participants agreed
  | 'IN_PROGRESS' // Plan being executed
  | 'COMPLETED'   // Successfully finished
  | 'ABANDONED'   // Cancelled or failed
  | 'EXPIRED';    // Time limit passed

export interface CooperativePlan {
  id: string;
  planType: PlanType;
  initiator: string;      // Agent ID who proposed
  initiatorName: string;
  participants: string[]; // Agent IDs

  // Plan details
  objective: string;       // "Meet at safe room to share resources"
  targetLocation?: Position;
  targetTime?: number;     // Game time to execute
  duration?: number;       // How long plan should take (ms)

  // Coordination
  roleAssignments: Map<string, AgentRole>; // AgentId -> Role
  requirements: string[];  // ["All participants have >20 HP", "Location is safe"]

  // Tracking
  status: PlanStatus;
  createdAt: number;
  acceptedBy: Set<string>; // Agent IDs who accepted
  rejectedBy: Set<string>; // Agent IDs who rejected
  completedBy: Set<string>; // Agent IDs who finished their part

  // Results
  success: boolean;
  completionTime?: number;
  outcome?: string;
}

export interface PlanProposal {
  plan: CooperativePlan;
  proposalMessage: string; // What initiator says to team
  importance: number;      // 1-10 urgency
}

export interface PlanAcceptance {
  agentId: string;
  agentName: string;
  planId: string;
  accepted: boolean;
  reason: string;
  timestamp: number;
}

export interface PlanExecution {
  planId: string;
  agentId: string;
  action: string;        // What agent is doing for the plan
  startTime: number;
  progress: number;      // 0-1
  completed: boolean;
}

export interface TeamCoordination {
  teamId: string;
  members: string[];     // Agent IDs
  activePlans: CooperativePlan[];
  completedPlans: CooperativePlan[];

  // Statistics
  totalPlansProposed: number;
  totalPlansCompleted: number;
  successRate: number;   // Completed / Proposed
  coordinationScore: number; // How well team works together
}

export interface RolePerformance {
  agentId: string;
  role: AgentRole;

  // Performance metrics
  tasksCompleted: number;
  successRate: number;
  efficiency: number;     // Speed of task completion
  helpfulness: number;    // Times helped others
  reliability: number;    // Times followed through on plans

  // Role-specific stats
  roleSpecificStats: Map<string, number>;
}
