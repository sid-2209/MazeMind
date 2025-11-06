// src/systems/RoleEmergenceSystem.ts
/**
 * Role Emergence & Specialization System
 *
 * Observes agent behavior and naturally assigns roles based on performance.
 * Agents specialize over time into scouts, gatherers, healers, etc.
 *
 * Based on Park et al. (2023) - Agents with occupations and personalities
 */

import { Agent } from '../agent/Agent';
import {
  EmergentRole,
  RoleProfile,
  RoleMetrics,
  RoleChange,
  RoleEmergenceEvent,
  RoleRecognition,
  TeamRoleComposition,
  RoleConfidence,
  ROLE_THRESHOLDS,
  CONFIDENCE_WEIGHTS
} from '../types/role-emergence';
import { v4 as uuidv4 } from 'uuid';

export class RoleEmergenceSystem {
  // Agent role profiles
  private roleProfiles: Map<string, RoleProfile> = new Map();

  // Role emergence events
  private emergenceEvents: RoleEmergenceEvent[] = [];

  // Role recognitions
  private recognitions: RoleRecognition[] = [];

  // Team composition
  private teamComposition: TeamRoleComposition | null = null;

  // Configuration
  private readonly EVALUATION_INTERVAL = 30000; // 30 seconds - re-evaluate roles
  private readonly MIN_TIME_IN_ROLE = 60000;    // 1 minute - minimum before role change
  private readonly CONFIDENCE_THRESHOLD = 0.6;  // When role becomes "established"

  // Tracking
  private lastEvaluationTime: Map<string, number> = new Map();

  constructor(teamMembers: string[]) {
    // Initialize role profiles for all agents
    for (const agentId of teamMembers) {
      this.initializeRoleProfile(agentId, 'Unknown'); // Name will be set later
    }

    // Initialize team composition
    this.teamComposition = {
      teamId: uuidv4(),
      members: teamMembers,
      roleDistribution: new Map(),
      hasLeader: false,
      complementaryRoles: false,
      roleBalance: 0,
      averageRoleConfidence: 0,
      totalRoleChanges: 0,
      mostCommonRole: null
    };

    this.updateRoleDistribution();

    console.log(`🎭 Role Emergence System initialized for team of ${teamMembers.length}`);
  }

  /**
   * Initialize role profile for an agent
   */
  private initializeRoleProfile(agentId: string, agentName: string): void {
    const profile: RoleProfile = {
      agentId,
      agentName,
      currentRole: 'GENERALIST',
      confidence: 0,
      confidenceLevel: 'EMERGING',
      roleHistory: [],
      timeInRole: 0,
      metrics: this.createEmptyMetrics(),
      recognizedByTeam: false,
      recognitionCount: 0
    };

    this.roleProfiles.set(agentId, profile);
    this.lastEvaluationTime.set(agentId, Date.now());
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): RoleMetrics {
    return {
      tilesExplored: 0,
      explorationSpeed: 0,
      firstDiscoveries: 0,
      resourcesFound: 0,
      resourceCollectionRate: 0,
      resourceTypes: new Set(),
      pathfindingAccuracy: 0,
      averagePathLength: 0,
      timesLost: 0,
      resourcesShared: 0,
      teammatesHelped: 0,
      healthRestored: 0,
      plansProposed: 0,
      planSuccessRate: 0,
      planQuality: 0,
      rescuesPerformed: 0,
      risksForOthers: 0,
      teamSurvivalContribution: 0,
      survivalTime: 0,
      deathCount: 0,
      successRate: 0
    };
  }

  /**
   * Update agent metrics based on their actions
   */
  updateMetrics(
    agentId: string,
    metricType: keyof RoleMetrics,
    value: number | Set<string>,
    increment: boolean = true
  ): void {
    const profile = this.roleProfiles.get(agentId);
    if (!profile) return;

    if (typeof value === 'number') {
      if (increment) {
        (profile.metrics[metricType] as number) += value;
      } else {
        (profile.metrics[metricType] as number) = value;
      }
    } else if (value instanceof Set) {
      profile.metrics[metricType] = value;
    }
  }

  /**
   * Evaluate and potentially update agent's role
   */
  evaluateRole(agent: Agent): void {
    const agentId = agent.getId();
    const profile = this.roleProfiles.get(agentId);
    if (!profile) {
      // Initialize profile if not exists
      this.initializeRoleProfile(agentId, agent.getName());
      return;
    }

    // Update agent name if needed
    if (profile.agentName === 'Unknown') {
      profile.agentName = agent.getName();
    }

    // Check if enough time has passed since last evaluation
    const lastEval = this.lastEvaluationTime.get(agentId) || 0;
    const now = Date.now();
    if (now - lastEval < this.EVALUATION_INTERVAL) {
      return; // Too soon
    }

    // Check if enough time in current role
    if (profile.timeInRole < this.MIN_TIME_IN_ROLE && profile.currentRole !== 'GENERALIST') {
      profile.timeInRole += (now - lastEval);
      this.lastEvaluationTime.set(agentId, now);
      return;
    }

    // Evaluate potential roles
    const roleScores = this.calculateRoleScores(profile.metrics);

    // Find best role
    let bestRole: EmergentRole = 'GENERALIST';
    let bestScore = 0;

    for (const [role, score] of Object.entries(roleScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestRole = role as EmergentRole;
      }
    }

    // Check if role should change
    if (bestRole !== profile.currentRole && bestScore > 0.3) {
      this.changeRole(agent, bestRole, bestScore, 'Performance-based emergence');
    } else if (bestRole === profile.currentRole) {
      // Role is stable, increase confidence
      profile.confidence = Math.min(1.0, profile.confidence + 0.05);
      profile.timeInRole += (now - lastEval);
      this.updateConfidenceLevel(profile);
    }

    this.lastEvaluationTime.set(agentId, now);
  }

  /**
   * Calculate role scores based on metrics
   */
  private calculateRoleScores(metrics: RoleMetrics): Record<EmergentRole, number> {
    const scores: Record<EmergentRole, number> = {
      SCOUT: 0,
      GATHERER: 0,
      NAVIGATOR: 0,
      HEALER: 0,
      STRATEGIST: 0,
      PROTECTOR: 0,
      GENERALIST: 0
    };

    // SCOUT score
    const scoutThreshold = ROLE_THRESHOLDS.SCOUT;
    scores.SCOUT = (
      (metrics.explorationSpeed / scoutThreshold.explorationSpeed) * 0.4 +
      (metrics.firstDiscoveries / scoutThreshold.firstDiscoveries) * 0.3 +
      (metrics.tilesExplored / scoutThreshold.tilesExplored) * 0.3
    );

    // GATHERER score
    const gathererThreshold = ROLE_THRESHOLDS.GATHERER;
    scores.GATHERER = (
      (metrics.resourcesFound / gathererThreshold.resourcesFound) * 0.4 +
      (metrics.resourceCollectionRate / gathererThreshold.resourceCollectionRate) * 0.3 +
      (metrics.resourceTypes.size / gathererThreshold.resourceTypes) * 0.3
    );

    // NAVIGATOR score
    const navigatorThreshold = ROLE_THRESHOLDS.NAVIGATOR;
    scores.NAVIGATOR = (
      metrics.pathfindingAccuracy * 0.5 +
      (metrics.averagePathLength > 0 ? Math.min(1, navigatorThreshold.averagePathLength / metrics.averagePathLength) : 0) * 0.3 +
      (metrics.timesLost <= navigatorThreshold.timesLost ? 0.2 : 0)
    );

    // HEALER score
    const healerThreshold = ROLE_THRESHOLDS.HEALER;
    scores.HEALER = (
      (metrics.resourcesShared / healerThreshold.resourcesShared) * 0.4 +
      (metrics.teammatesHelped / healerThreshold.teammatesHelped) * 0.3 +
      (metrics.healthRestored / healerThreshold.healthRestored) * 0.3
    );

    // STRATEGIST score
    const strategistThreshold = ROLE_THRESHOLDS.STRATEGIST;
    scores.STRATEGIST = (
      (metrics.plansProposed / strategistThreshold.plansProposed) * 0.3 +
      (metrics.planSuccessRate / strategistThreshold.planSuccessRate) * 0.4 +
      (metrics.planQuality / strategistThreshold.planQuality) * 0.3
    );

    // PROTECTOR score
    const protectorThreshold = ROLE_THRESHOLDS.PROTECTOR;
    scores.PROTECTOR = (
      (metrics.rescuesPerformed / protectorThreshold.rescuesPerformed) * 0.4 +
      (metrics.risksForOthers / protectorThreshold.risksForOthers) * 0.3 +
      (metrics.teamSurvivalContribution / protectorThreshold.teamSurvivalContribution) * 0.3
    );

    // Normalize scores (cap at 1.0)
    for (const role in scores) {
      scores[role as EmergentRole] = Math.min(1.0, scores[role as EmergentRole]);
    }

    return scores;
  }

  /**
   * Change agent's role
   */
  private changeRole(
    agent: Agent,
    newRole: EmergentRole,
    confidence: number,
    reason: string
  ): void {
    const profile = this.roleProfiles.get(agent.getId());
    if (!profile) return;

    const previousRole = profile.currentRole;

    // Record role change
    const roleChange: RoleChange = {
      fromRole: previousRole,
      toRole: newRole,
      timestamp: Date.now(),
      reason,
      triggeringMetric: this.identifyTriggeringMetric(newRole, profile.metrics)
    };

    profile.roleHistory.push(roleChange);
    profile.currentRole = newRole;
    profile.confidence = confidence;
    profile.timeInRole = 0;
    this.updateConfidenceLevel(profile);

    // Create emergence event
    const event: RoleEmergenceEvent = {
      id: uuidv4(),
      agentId: agent.getId(),
      agentName: agent.getName(),
      previousRole,
      newRole,
      confidence,
      reason,
      timestamp: Date.now(),
      triggeringMetric: roleChange.triggeringMetric
    };

    this.emergenceEvents.push(event);

    // Add to agent's memory
    agent.addObservation(
      `I've emerged as the team's ${newRole}. ${this.getRoleDescription(newRole)}`,
      8,
      ['role-emergence', 'identity', newRole.toLowerCase()]
    );

    // Update team composition
    if (this.teamComposition) {
      this.teamComposition.totalRoleChanges++;
    }
    this.updateRoleDistribution();

    console.log(`🎭 ${agent.getName()} role emerged: ${previousRole} → ${newRole} (confidence: ${confidence.toFixed(2)})`);
  }

  /**
   * Identify which metric triggered the role
   */
  private identifyTriggeringMetric(role: EmergentRole, metrics: RoleMetrics): string {
    switch (role) {
      case 'SCOUT':
        return `explorationSpeed: ${metrics.explorationSpeed.toFixed(1)}`;
      case 'GATHERER':
        return `resourcesFound: ${metrics.resourcesFound}`;
      case 'NAVIGATOR':
        return `pathfindingAccuracy: ${metrics.pathfindingAccuracy.toFixed(2)}`;
      case 'HEALER':
        return `resourcesShared: ${metrics.resourcesShared}`;
      case 'STRATEGIST':
        return `plansProposed: ${metrics.plansProposed}`;
      case 'PROTECTOR':
        return `rescuesPerformed: ${metrics.rescuesPerformed}`;
      default:
        return 'general performance';
    }
  }

  /**
   * Get role description
   */
  private getRoleDescription(role: EmergentRole): string {
    const descriptions = {
      SCOUT: 'I excel at exploring quickly and finding new areas',
      GATHERER: 'I\'m efficient at finding and collecting resources',
      NAVIGATOR: 'I have excellent pathfinding and rarely get lost',
      HEALER: 'I focus on helping my teammates and managing team health',
      STRATEGIST: 'I\'m good at planning and coordinating team strategies',
      PROTECTOR: 'I prioritize helping others, even at personal risk',
      GENERALIST: 'I\'m still finding my place on the team'
    };
    return descriptions[role];
  }

  /**
   * Update confidence level based on confidence value
   */
  private updateConfidenceLevel(profile: RoleProfile): void {
    if (profile.confidence < 0.3) {
      profile.confidenceLevel = 'EMERGING';
    } else if (profile.confidence < 0.6) {
      profile.confidenceLevel = 'DEVELOPING';
    } else if (profile.confidence < 0.8) {
      profile.confidenceLevel = 'ESTABLISHED';
    } else {
      profile.confidenceLevel = 'EXPERT';
    }
  }

  /**
   * Agent recognizes another agent's role
   */
  recognizeRole(
    recognizer: Agent,
    recognized: Agent,
    context: string
  ): void {
    const profile = this.roleProfiles.get(recognized.getId());
    if (!profile || profile.currentRole === 'GENERALIST') return;

    const recognition: RoleRecognition = {
      recognizerId: recognizer.getId(),
      recognizedId: recognized.getId(),
      role: profile.currentRole,
      timestamp: Date.now(),
      context
    };

    this.recognitions.push(recognition);
    profile.recognitionCount++;

    // Mark as recognized by team if multiple recognitions
    if (profile.recognitionCount >= 2) {
      profile.recognizedByTeam = true;
    }

    // Add memory to recognizer
    recognizer.addObservation(
      `${recognized.getName()} has become our team's ${profile.currentRole}. ${context}`,
      6,
      ['role-recognition', 'team', profile.currentRole.toLowerCase(), recognized.getId()]
    );

    console.log(`👀 ${recognizer.getName()} recognized ${recognized.getName()} as ${profile.currentRole}`);
  }

  /**
   * Update role distribution in team
   */
  private updateRoleDistribution(): void {
    if (!this.teamComposition) return;

    const distribution = new Map<EmergentRole, number>();
    let totalConfidence = 0;
    let roleCount = 0;

    for (const profile of this.roleProfiles.values()) {
      const count = distribution.get(profile.currentRole) || 0;
      distribution.set(profile.currentRole, count + 1);

      if (profile.currentRole !== 'GENERALIST') {
        totalConfidence += profile.confidence;
        roleCount++;
      }
    }

    this.teamComposition.roleDistribution = distribution;
    this.teamComposition.averageRoleConfidence = roleCount > 0 ? totalConfidence / roleCount : 0;

    // Find most common role (excluding GENERALIST)
    let mostCommon: EmergentRole | null = null;
    let maxCount = 0;
    for (const [role, count] of distribution) {
      if (role !== 'GENERALIST' && count > maxCount) {
        maxCount = count;
        mostCommon = role;
      }
    }
    this.teamComposition.mostCommonRole = mostCommon;

    // Check role balance (ideal: all different roles)
    const uniqueRoles = Array.from(distribution.keys()).filter(r => r !== 'GENERALIST').length;
    const totalMembers = this.teamComposition.members.length;
    this.teamComposition.roleBalance = totalMembers > 0 ? uniqueRoles / totalMembers : 0;

    // Check complementary roles
    this.teamComposition.complementaryRoles = this.checkComplementaryRoles(distribution);
  }

  /**
   * Check if team has complementary roles
   */
  private checkComplementaryRoles(distribution: Map<EmergentRole, number>): boolean {
    const roles = Array.from(distribution.keys()).filter(r => r !== 'GENERALIST');

    // Ideal complementary combinations
    const hasExplorer = roles.includes('SCOUT');
    const hasSupport = roles.includes('HEALER') || roles.includes('PROTECTOR');
    const hasCoordinator = roles.includes('STRATEGIST') || roles.includes('NAVIGATOR');
    const hasGatherer = roles.includes('GATHERER');

    // Team is complementary if it has at least 3 different role types
    return (hasExplorer ? 1 : 0) + (hasSupport ? 1 : 0) + (hasCoordinator ? 1 : 0) + (hasGatherer ? 1 : 0) >= 3;
  }

  /**
   * Get agent's role profile
   */
  getRoleProfile(agentId: string): RoleProfile | null {
    return this.roleProfiles.get(agentId) || null;
  }

  /**
   * Get agent's current role
   */
  getAgentRole(agentId: string): EmergentRole {
    const profile = this.roleProfiles.get(agentId);
    return profile?.currentRole || 'GENERALIST';
  }

  /**
   * Get team composition
   */
  getTeamComposition(): TeamRoleComposition | null {
    return this.teamComposition;
  }

  /**
   * Get all emergence events
   */
  getEmergenceEvents(): RoleEmergenceEvent[] {
    return this.emergenceEvents;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRoleChanges: number;
    averageConfidence: number;
    roleBalance: number;
    complementaryRoles: boolean;
    roleDistribution: Record<EmergentRole, number>;
  } {
    const distribution: Record<EmergentRole, number> = {
      SCOUT: 0,
      GATHERER: 0,
      NAVIGATOR: 0,
      HEALER: 0,
      STRATEGIST: 0,
      PROTECTOR: 0,
      GENERALIST: 0
    };

    if (this.teamComposition) {
      for (const [role, count] of this.teamComposition.roleDistribution) {
        distribution[role] = count;
      }
    }

    return {
      totalRoleChanges: this.teamComposition?.totalRoleChanges || 0,
      averageConfidence: this.teamComposition?.averageRoleConfidence || 0,
      roleBalance: this.teamComposition?.roleBalance || 0,
      complementaryRoles: this.teamComposition?.complementaryRoles || false,
      roleDistribution: distribution
    };
  }

  /**
   * Clear all data (for simulation reset)
   */
  clearRoles(): void {
    // Reset all profiles to GENERALIST
    for (const profile of this.roleProfiles.values()) {
      profile.currentRole = 'GENERALIST';
      profile.confidence = 0;
      profile.confidenceLevel = 'EMERGING';
      profile.timeInRole = 0;
      profile.metrics = this.createEmptyMetrics();
      profile.recognizedByTeam = false;
      profile.recognitionCount = 0;
    }

    this.emergenceEvents = [];
    this.recognitions = [];
    this.updateRoleDistribution();

    console.log('🧹 Role profiles reset for new simulation');
  }
}
