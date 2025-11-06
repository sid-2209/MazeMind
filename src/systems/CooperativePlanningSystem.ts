// src/systems/CooperativePlanningSystem.ts
/**
 * Cooperative Planning & Coordination System
 *
 * Implements team planning and coordination for maze escape.
 * Agents propose plans, teammates accept/reject, and team executes together.
 *
 * Based on Park et al. (2023) Section 3.4.3 - Multi-Agent Coordination
 */

import { Agent } from '../agent/Agent';
import { Position } from '../types';
import {
  CooperativePlan,
  PlanProposal,
  PlanAcceptance,
  PlanExecution,
  TeamCoordination,
  PlanType,
  PlanStatus,
  AgentRole,
  RolePerformance
} from '../types/cooperative-planning';
import { v4 as uuidv4 } from 'uuid';

export class CooperativePlanningSystem {
  // Active plans
  private activePlans: Map<string, CooperativePlan> = new Map();

  // Completed plans history
  private completedPlans: CooperativePlan[] = [];

  // Team coordination tracking
  private teamCoordination: TeamCoordination | null = null;

  // Agent roles and performance
  private agentRoles: Map<string, AgentRole> = new Map();
  private rolePerformance: Map<string, RolePerformance> = new Map();

  // Plan execution tracking
  private planExecutions: Map<string, PlanExecution[]> = new Map();

  // Configuration
  private readonly PLAN_TIMEOUT = 300000; // 5 minutes
  private readonly MIN_PARTICIPANTS = 2;
  private readonly PROXIMITY_RANGE = 8; // Tiles - for triggering coordination

  constructor(teamMembers: string[]) {
    // Initialize team coordination
    this.teamCoordination = {
      teamId: uuidv4(),
      members: teamMembers,
      activePlans: [],
      completedPlans: [],
      totalPlansProposed: 0,
      totalPlansCompleted: 0,
      successRate: 0,
      coordinationScore: 0
    };

    // Initialize all agents as generalists
    for (const agentId of teamMembers) {
      this.agentRoles.set(agentId, 'GENERALIST');
      this.rolePerformance.set(agentId, {
        agentId,
        role: 'GENERALIST',
        tasksCompleted: 0,
        successRate: 0,
        efficiency: 0,
        helpfulness: 0,
        reliability: 0,
        roleSpecificStats: new Map()
      });
    }

    console.log(`🤝 Cooperative Planning System initialized for team of ${teamMembers.length}`);
  }

  /**
   * Agent proposes a cooperative plan
   */
  proposePlan(
    initiator: Agent,
    planType: PlanType,
    objective: string,
    targetLocation?: Position,
    targetTime?: number,
    requiredParticipants?: string[]
  ): PlanProposal {
    const plan: CooperativePlan = {
      id: uuidv4(),
      planType,
      initiator: initiator.getId(),
      initiatorName: initiator.getName(),
      participants: requiredParticipants || [],
      objective,
      targetLocation,
      targetTime,
      duration: this.estimatePlanDuration(planType),
      roleAssignments: new Map(),
      requirements: this.generateRequirements(planType),
      status: 'PROPOSED',
      createdAt: Date.now(),
      acceptedBy: new Set([initiator.getId()]), // Initiator auto-accepts
      rejectedBy: new Set(),
      completedBy: new Set(),
      success: false
    };

    // Store plan
    this.activePlans.set(plan.id, plan);

    // Update team stats
    if (this.teamCoordination) {
      this.teamCoordination.totalPlansProposed++;
      this.teamCoordination.activePlans.push(plan);
    }

    // Create proposal message
    const proposalMessage = this.formatProposal(plan);

    // Calculate importance
    const importance = this.calculatePlanImportance(planType, initiator);

    // Add to initiator's memory
    initiator.addObservation(
      `I proposed a ${planType} plan: ${objective}`,
      importance,
      ['planning', 'cooperation', 'coordination', planType.toLowerCase()]
    );

    console.log(`🤝 ${initiator.getName()} proposed ${planType} plan: "${objective}"`);

    return {
      plan,
      proposalMessage,
      importance
    };
  }

  /**
   * Agent responds to a plan proposal
   */
  respondToPlan(
    agent: Agent,
    planId: string,
    accepted: boolean,
    reason: string
  ): PlanAcceptance {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Record response
    if (accepted) {
      plan.acceptedBy.add(agent.getId());
      plan.participants.push(agent.getId());
    } else {
      plan.rejectedBy.add(agent.getId());
    }

    // Create acceptance record
    const acceptance: PlanAcceptance = {
      agentId: agent.getId(),
      agentName: agent.getName(),
      planId,
      accepted,
      reason,
      timestamp: Date.now()
    };

    // Add to agent's memory
    const memoryDesc = accepted
      ? `I agreed to join the ${plan.planType} plan: ${plan.objective}. ${reason}`
      : `I declined the ${plan.planType} plan. ${reason}`;

    agent.addObservation(
      memoryDesc,
      this.calculatePlanImportance(plan.planType, agent),
      ['planning', 'cooperation', accepted ? 'accepted' : 'rejected', plan.initiator]
    );

    // Check if plan can proceed
    if (plan.acceptedBy.size >= this.MIN_PARTICIPANTS) {
      plan.status = 'ACCEPTED';
      console.log(`✅ Plan "${plan.objective}" accepted by ${plan.acceptedBy.size} agents`);
    }

    console.log(`${accepted ? '✅' : '❌'} ${agent.getName()} ${accepted ? 'accepted' : 'rejected'} plan: ${plan.objective}`);

    return acceptance;
  }

  /**
   * Start executing an accepted plan
   */
  startPlan(planId: string): void {
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    if (plan.status === 'ACCEPTED') {
      plan.status = 'IN_PROGRESS';
      console.log(`🚀 Plan started: "${plan.objective}" with ${plan.participants.length} participants`);
    }
  }

  /**
   * Agent completes their part of the plan
   */
  completePlanPart(
    agent: Agent,
    planId: string,
    success: boolean
  ): void {
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    if (success) {
      plan.completedBy.add(agent.getId());

      // Update role performance
      this.updateRolePerformance(agent.getId(), true);

      // Add memory
      agent.addObservation(
        `I completed my part of the ${plan.planType} plan: ${plan.objective}`,
        7,
        ['planning', 'cooperation', 'success', plan.initiator]
      );

      console.log(`✅ ${agent.getName()} completed their part of plan: ${plan.objective}`);

      // Check if all participants completed
      if (plan.completedBy.size === plan.participants.length) {
        this.finalizePlan(planId, true);
      }
    } else {
      // Failure
      this.updateRolePerformance(agent.getId(), false);
      agent.addObservation(
        `I failed to complete my part of the ${plan.planType} plan`,
        5,
        ['planning', 'cooperation', 'failure']
      );
    }
  }

  /**
   * Finalize a plan (success or failure)
   */
  private finalizePlan(planId: string, success: boolean): void {
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    plan.status = success ? 'COMPLETED' : 'ABANDONED';
    plan.success = success;
    plan.completionTime = Date.now();
    plan.outcome = success
      ? `Plan completed successfully with ${plan.completedBy.size} participants`
      : `Plan failed or was abandoned`;

    // Move to completed plans
    this.activePlans.delete(planId);
    this.completedPlans.push(plan);

    // Update team coordination
    if (this.teamCoordination) {
      this.teamCoordination.activePlans = Array.from(this.activePlans.values());
      this.teamCoordination.completedPlans.push(plan);
      if (success) {
        this.teamCoordination.totalPlansCompleted++;
      }
      this.teamCoordination.successRate =
        this.teamCoordination.totalPlansCompleted / this.teamCoordination.totalPlansProposed;
    }

    console.log(`${success ? '🎉' : '❌'} Plan ${success ? 'completed' : 'failed'}: "${plan.objective}"`);
  }

  /**
   * Check for expired plans
   */
  updatePlans(): void {
    const now = Date.now();

    for (const [planId, plan] of this.activePlans) {
      // Check timeout
      if (now - plan.createdAt > this.PLAN_TIMEOUT) {
        plan.status = 'EXPIRED';
        this.finalizePlan(planId, false);
      }
    }
  }

  /**
   * Get agent's current role
   */
  getAgentRole(agentId: string): AgentRole {
    return this.agentRoles.get(agentId) || 'GENERALIST';
  }

  /**
   * Update agent's role based on performance
   */
  updateAgentRole(agentId: string, newRole: AgentRole): void {
    const oldRole = this.agentRoles.get(agentId);
    this.agentRoles.set(agentId, newRole);

    const performance = this.rolePerformance.get(agentId);
    if (performance) {
      performance.role = newRole;
    }

    if (oldRole !== newRole) {
      console.log(`🎭 Agent role updated: ${agentId} changed from ${oldRole} to ${newRole}`);
    }
  }

  /**
   * Update role performance metrics
   */
  private updateRolePerformance(agentId: string, success: boolean): void {
    const performance = this.rolePerformance.get(agentId);
    if (!performance) return;

    performance.tasksCompleted++;
    const successCount = success ? 1 : 0;
    performance.successRate =
      (performance.successRate * (performance.tasksCompleted - 1) + successCount) /
      performance.tasksCompleted;

    if (success) {
      performance.reliability += 0.1;
    }
  }

  /**
   * Get plans involving an agent
   */
  getAgentPlans(agentId: string): CooperativePlan[] {
    const plans: CooperativePlan[] = [];

    for (const plan of this.activePlans.values()) {
      if (
        plan.initiator === agentId ||
        plan.participants.includes(agentId) ||
        plan.acceptedBy.has(agentId)
      ) {
        plans.push(plan);
      }
    }

    return plans;
  }

  /**
   * Get all active plans
   */
  getActivePlans(): CooperativePlan[] {
    return Array.from(this.activePlans.values());
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): CooperativePlan | null {
    return this.activePlans.get(planId) || null;
  }

  /**
   * Get team coordination statistics
   */
  getTeamCoordination(): TeamCoordination | null {
    return this.teamCoordination;
  }

  /**
   * Get role performance for agent
   */
  getRolePerformance(agentId: string): RolePerformance | null {
    return this.rolePerformance.get(agentId) || null;
  }

  /**
   * Format plan proposal for conversation
   */
  private formatProposal(plan: CooperativePlan): string {
    let message = `I propose we coordinate a ${plan.planType} plan: ${plan.objective}. `;

    if (plan.targetLocation) {
      message += `Let's meet at [${plan.targetLocation.x}, ${plan.targetLocation.y}]. `;
    }

    if (plan.targetTime) {
      message += `Target time: ${plan.targetTime}. `;
    }

    if (plan.requirements.length > 0) {
      message += `Requirements: ${plan.requirements.join(', ')}. `;
    }

    message += 'Are you in?';

    return message;
  }

  /**
   * Generate requirements for plan type
   */
  private generateRequirements(planType: PlanType): string[] {
    const requirements: string[] = [];

    switch (planType) {
      case 'RENDEZVOUS':
        requirements.push('Participants can reach location safely');
        break;
      case 'RESOURCE_SHARE':
        requirements.push('At least one participant has resources to share');
        break;
      case 'SYNCHRONIZED_EXPLORATION':
        requirements.push('Participants are nearby');
        requirements.push('Area is relatively safe');
        break;
      case 'GROUP_EXIT':
        requirements.push('All participants are alive');
        requirements.push('Exit location is known');
        break;
      case 'RESCUE_MISSION':
        requirements.push('Rescuer has resources to help');
        requirements.push('Victim is in reachable location');
        break;
      case 'AREA_SWEEP':
        requirements.push('Area is unexplored');
        requirements.push('Team has sufficient resources');
        break;
      case 'SUPPLY_RUN':
        requirements.push('Resource location is known');
        break;
    }

    return requirements;
  }

  /**
   * Estimate plan duration based on type
   */
  private estimatePlanDuration(planType: PlanType): number {
    switch (planType) {
      case 'RENDEZVOUS':
        return 120000; // 2 minutes
      case 'RESOURCE_SHARE':
        return 60000; // 1 minute
      case 'SYNCHRONIZED_EXPLORATION':
        return 300000; // 5 minutes
      case 'GROUP_EXIT':
        return 180000; // 3 minutes
      case 'RESCUE_MISSION':
        return 120000; // 2 minutes
      case 'AREA_SWEEP':
        return 600000; // 10 minutes
      case 'SUPPLY_RUN':
        return 240000; // 4 minutes
      default:
        return 180000; // Default 3 minutes
    }
  }

  /**
   * Calculate plan importance
   */
  private calculatePlanImportance(planType: PlanType, agent: Agent): number {
    // Base importance by type
    let importance = 7;

    switch (planType) {
      case 'GROUP_EXIT':
        importance = 10; // Highest priority
        break;
      case 'RESCUE_MISSION':
        importance = 9;
        break;
      case 'RESOURCE_SHARE':
        importance = 8;
        break;
      case 'RENDEZVOUS':
        importance = 7;
        break;
      case 'SYNCHRONIZED_EXPLORATION':
        importance = 6;
        break;
      default:
        importance = 6;
    }

    // Adjust based on agent state
    const state = agent.getState();
    if (state.hunger < 30 || state.thirst < 30) {
      importance = Math.min(10, importance + 1); // More urgent if low resources
    }

    return importance;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalProposed: number;
    totalCompleted: number;
    totalActive: number;
    successRate: number;
    mostCommonPlanType: PlanType | null;
  } {
    // Count plan types
    const typeCounts = new Map<PlanType, number>();
    for (const plan of this.completedPlans) {
      typeCounts.set(plan.planType, (typeCounts.get(plan.planType) || 0) + 1);
    }

    let mostCommonType: PlanType | null = null;
    let maxCount = 0;
    for (const [type, count] of typeCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    }

    return {
      totalProposed: this.teamCoordination?.totalPlansProposed || 0,
      totalCompleted: this.teamCoordination?.totalPlansCompleted || 0,
      totalActive: this.activePlans.size,
      successRate: this.teamCoordination?.successRate || 0,
      mostCommonPlanType: mostCommonType
    };
  }

  /**
   * Clear all plans (for simulation reset)
   */
  clearPlans(): void {
    this.activePlans.clear();
    this.completedPlans = [];
    this.planExecutions.clear();

    if (this.teamCoordination) {
      this.teamCoordination.activePlans = [];
      this.teamCoordination.completedPlans = [];
    }

    console.log('🧹 Cooperative plans cleared for new simulation');
  }
}
