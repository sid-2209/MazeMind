// src/systems/DangerCommunicationSystem.ts
/**
 * Danger Communication System
 *
 * Implements information diffusion for safety warnings.
 * Agents share danger discoveries with teammates to improve survival.
 *
 * Based on Park et al. (2023) Section 7.1.1 - Information Diffusion
 */

import { Agent } from '../agent/Agent';
import { Position } from '../types';
import { DangerWarning, DangerBroadcast, DangerType, SafetyStatus } from '../types/danger-warning';
import { v4 as uuidv4 } from 'uuid';

export class DangerCommunicationSystem {
  // Active warnings in the current simulation
  private activeWarnings: Map<string, DangerWarning> = new Map();

  // Broadcast history
  private broadcasts: DangerBroadcast[] = [];

  // Agent safety statuses
  private safetyStatuses: Map<string, SafetyStatus> = new Map();

  // Configuration
  private readonly WARNING_RANGE = 10;  // Tiles - how far warnings propagate
  private readonly CRITICAL_SEVERITY = 8;  // Severity threshold for critical warnings
  private readonly WARNING_COOLDOWN = 5000;  // ms - prevent spam

  /**
   * Report a danger discovered by an agent
   */
  reportDanger(
    agent: Agent,
    type: DangerType,
    location: Position,
    severity: number,
    description: string,
    causesDeath: boolean = false,
    healthImpact?: number
  ): DangerWarning {
    const warning: DangerWarning = {
      id: uuidv4(),
      type,
      location,
      severity: Math.min(10, Math.max(1, severity)),
      description,
      witnessedBy: agent.getId(),
      witnessedByName: agent.getName(),
      timestamp: Date.now(),
      discoveryMethod: 'DIRECT_EXPERIENCE',
      causesDeath,
      healthImpact
    };

    // Store warning
    const locationKey = `${location.x},${location.y}`;
    this.activeWarnings.set(locationKey, warning);

    // Add to agent's memory
    this.addWarningToMemory(agent, warning, true);

    // Update safety status
    this.updateSafetyStatus(agent.getId(), warning, 'broadcast');

    console.log(`⚠️  ${agent.getName()} discovered danger: ${type} at (${location.x},${location.y}) - Severity: ${severity}`);

    return warning;
  }

  /**
   * Broadcast warning to nearby teammates
   */
  broadcastWarning(
    broadcaster: Agent,
    warning: DangerWarning,
    allAgents: Agent[]
  ): DangerBroadcast {
    const broadcasterPos = broadcaster.getTilePosition();
    const recipients: string[] = [];

    // Determine urgency
    const urgency = this.calculateUrgency(warning);

    // Find agents within warning range
    for (const agent of allAgents) {
      if (agent.getId() === broadcaster.getId()) continue;

      const agentPos = agent.getTilePosition();
      const distance = this.calculateDistance(broadcasterPos, agentPos);

      // Critical warnings broadcast further
      const range = warning.severity >= this.CRITICAL_SEVERITY
        ? this.WARNING_RANGE * 2
        : this.WARNING_RANGE;

      if (distance <= range) {
        this.deliverWarning(broadcaster, agent, warning);
        recipients.push(agent.getId());
      }
    }

    // Create broadcast record
    const broadcast: DangerBroadcast = {
      warning,
      broadcaster: broadcaster.getId(),
      recipients,
      broadcastTime: Date.now(),
      urgency
    };

    this.broadcasts.push(broadcast);

    if (recipients.length > 0) {
      console.log(`📢 ${broadcaster.getName()} warned ${recipients.length} teammate(s) about ${warning.type}`);
    }

    return broadcast;
  }

  /**
   * Deliver warning from one agent to another
   */
  private deliverWarning(
    warner: Agent,
    recipient: Agent,
    warning: DangerWarning
  ): void {
    // Create warning message
    const warningMessage = this.formatWarningMessage(warner, warning);

    // Add to recipient's memory
    const modifiedWarning: DangerWarning = {
      ...warning,
      discoveryMethod: 'TOLD_BY_TEAMMATE'
    };

    this.addWarningToMemory(recipient, modifiedWarning, false);

    // Update safety status
    this.updateSafetyStatus(recipient.getId(), warning, 'receive');

    // Trigger conversation if agents are close enough (within 3 tiles)
    const distance = this.calculateDistance(
      warner.getTilePosition(),
      recipient.getTilePosition()
    );

    if (distance <= 3) {
      // Could trigger a conversation here if ConversationManager is available
      console.log(`💬 ${warner.getName()} directly warns ${recipient.getName()} about ${warning.type}`);
    }
  }

  /**
   * Add warning to agent's memory
   */
  private addWarningToMemory(
    agent: Agent,
    warning: DangerWarning,
    isOriginalWitness: boolean
  ): void {
    const prefix = isOriginalWitness
      ? `⚠️ DANGER DISCOVERED: `
      : `⚠️ WARNING from ${warning.witnessedByName}: `;

    const locationStr = `(${warning.location.x},${warning.location.y})`;

    let description = `${prefix}${warning.description} at ${locationStr}. `;

    if (warning.causesDeath) {
      description += 'THIS IS FATAL! ';
    } else if (warning.healthImpact) {
      description += `Causes ${warning.healthImpact} damage. `;
    }

    description += `Type: ${warning.type}. Severity: ${warning.severity}/10.`;

    // Add as observation with high importance
    agent.addObservation(
      description,
      warning.severity,
      ['danger', 'warning', warning.type.toLowerCase(), isOriginalWitness ? 'witnessed' : 'heard'],
      warning.location
    );
  }

  /**
   * Format warning message for conversation
   */
  private formatWarningMessage(warner: Agent, warning: DangerWarning): string {
    const locationStr = `[${warning.location.x}, ${warning.location.y}]`;

    const urgencyPhrase = warning.causesDeath
      ? 'BE VERY CAREFUL! '
      : warning.severity >= this.CRITICAL_SEVERITY
      ? 'Watch out! '
      : '';

    return `${urgencyPhrase}${warning.description} at ${locationStr}. ${
      warning.healthImpact ? `It cost me ${warning.healthImpact} health.` : ''
    }`;
  }

  /**
   * Calculate urgency level based on warning severity and type
   */
  private calculateUrgency(warning: DangerWarning): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (warning.causesDeath) return 'CRITICAL';
    if (warning.severity >= 9) return 'CRITICAL';
    if (warning.severity >= 7) return 'HIGH';
    if (warning.severity >= 5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate Manhattan distance between two positions
   */
  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  /**
   * Update safety status for an agent
   */
  private updateSafetyStatus(
    agentId: string,
    warning: DangerWarning,
    action: 'broadcast' | 'receive'
  ): void {
    let status = this.safetyStatuses.get(agentId);

    if (!status) {
      status = {
        agentId,
        isInDanger: false,
        currentThreats: [],
        nearbyThreats: [],
        totalWarningsReceived: 0,
        totalWarningsBroadcast: 0,
        lastWarningTime: 0
      };
      this.safetyStatuses.set(agentId, status);
    }

    if (action === 'broadcast') {
      status.totalWarningsBroadcast++;
    } else {
      status.totalWarningsReceived++;
    }

    status.lastWarningTime = Date.now();
  }

  /**
   * Check if agent is near a known danger
   */
  isNearDanger(agentPosition: Position, warningRange: number = 5): {
    isNear: boolean;
    warnings: DangerWarning[];
  } {
    const nearbyWarnings: DangerWarning[] = [];

    for (const warning of this.activeWarnings.values()) {
      const distance = this.calculateDistance(agentPosition, warning.location);
      if (distance <= warningRange) {
        nearbyWarnings.push(warning);
      }
    }

    return {
      isNear: nearbyWarnings.length > 0,
      warnings: nearbyWarnings
    };
  }

  /**
   * Get warning at specific location
   */
  getWarningAtLocation(location: Position): DangerWarning | null {
    const key = `${location.x},${location.y}`;
    return this.activeWarnings.get(key) || null;
  }

  /**
   * Get all active warnings
   */
  getAllWarnings(): DangerWarning[] {
    return Array.from(this.activeWarnings.values());
  }

  /**
   * Get safety status for an agent
   */
  getSafetyStatus(agentId: string): SafetyStatus | null {
    return this.safetyStatuses.get(agentId) || null;
  }

  /**
   * Clear all warnings (called on simulation reset)
   */
  clearWarnings(): void {
    this.activeWarnings.clear();
    this.broadcasts = [];
    this.safetyStatuses.clear();
    console.log('🧹 Danger warnings cleared for new simulation');
  }

  /**
   * Get broadcast statistics
   */
  getStatistics(): {
    totalWarnings: number;
    totalBroadcasts: number;
    criticalWarnings: number;
    mostCommonDangerType: DangerType | null;
    mostDangerousLocation: Position | null;
  } {
    const warnings = Array.from(this.activeWarnings.values());

    // Count danger types
    const typeCounts = new Map<DangerType, number>();
    let maxCount = 0;
    let mostCommonType: DangerType | null = null;

    for (const warning of warnings) {
      const count = (typeCounts.get(warning.type) || 0) + 1;
      typeCounts.set(warning.type, count);

      if (count > maxCount) {
        maxCount = count;
        mostCommonType = warning.type;
      }
    }

    // Find most dangerous location (highest severity)
    let mostDangerous: DangerWarning | null = null;
    for (const warning of warnings) {
      if (!mostDangerous || warning.severity > mostDangerous.severity) {
        mostDangerous = warning;
      }
    }

    return {
      totalWarnings: warnings.length,
      totalBroadcasts: this.broadcasts.length,
      criticalWarnings: warnings.filter(w => w.severity >= this.CRITICAL_SEVERITY).length,
      mostCommonDangerType: mostCommonType,
      mostDangerousLocation: mostDangerous?.location || null
    };
  }
}
