// src/agent/AutonomousController.ts
/**
 * AutonomousController - AI-driven agent control (Week 2, Days 3-4)
 *
 * Replaces manual AgentController with autonomous decision-making:
 * - Periodic decision loop
 * - Action execution based on DecisionMaker output
 * - Emergency handling (stuck states, critical stats)
 * - Smooth integration with existing Agent movement
 *
 * Based on Stanford Generative Agents methodology
 */

import { Agent } from './Agent';
import { DecisionMaker, Decision } from './DecisionMaker';
import { Position } from '../types';

export interface AutonomousConfig {
  decisionInterval: number;  // Seconds between decisions
  enableEmergencyOverride: boolean;  // Override decisions in critical situations
  enableLogging: boolean;  // Log decisions and actions
}

export class AutonomousController {
  private agent: Agent;
  private decisionMaker: DecisionMaker;
  private isEnabled: boolean = true;
  private config: AutonomousConfig;

  // Decision tracking
  private timeSinceLastDecision: number = 0;
  private currentDecision: Decision | null = null;
  private isExecutingAction: boolean = false;

  // Emergency handling
  private stuckCounter: number = 0;
  private lastPosition: Position | null = null;
  private stuckThreshold: number = 5; // Number of failed moves before emergency

  // Statistics
  private totalDecisions: number = 0;
  private successfulActions: number = 0;
  private failedActions: number = 0;

  constructor(
    agent: Agent,
    decisionMaker: DecisionMaker,
    config: Partial<AutonomousConfig> = {}
  ) {
    this.agent = agent;
    this.decisionMaker = decisionMaker;

    // Default configuration
    this.config = {
      decisionInterval: 3.0,
      enableEmergencyOverride: true,
      enableLogging: true,
      ...config,
    };

    console.log('🤖 AutonomousController initialized');
    console.log(`   Decision interval: ${this.config.decisionInterval}s`);
  }

  /**
   * Update autonomous control loop
   */
  update(deltaTime: number): void {
    if (!this.isEnabled) return;

    // Check for emergency conditions
    if (this.config.enableEmergencyOverride) {
      const emergency = this.checkEmergencyConditions();
      if (emergency) {
        this.handleEmergency(emergency);
        return;
      }
    }

    // Update decision timer
    this.timeSinceLastDecision += deltaTime;

    // If currently executing an action, wait for completion
    if (this.isExecutingAction) {
      if (!this.agent.isMoving()) {
        this.isExecutingAction = false;

        // Check if we're stuck at the same position
        const currentPos = this.agent.getTilePosition();
        if (this.lastPosition &&
            currentPos.x === this.lastPosition.x &&
            currentPos.y === this.lastPosition.y) {
          this.stuckCounter++;

          if (this.config.enableLogging) {
            console.log(`⚠️  Agent stuck (count: ${this.stuckCounter})`);
          }
        } else {
          this.stuckCounter = 0; // Reset stuck counter on successful move
          this.successfulActions++;
        }

        this.lastPosition = { ...currentPos };
      }
      return;
    }

    // Check if it's time for a new decision
    if (this.timeSinceLastDecision >= this.config.decisionInterval) {
      this.makeAndExecuteDecision();
      this.timeSinceLastDecision = 0;
    }
  }

  /**
   * Make a decision and execute it
   */
  private async makeAndExecuteDecision(): Promise<void> {
    try {
      // Get decision from DecisionMaker
      const decision = await this.decisionMaker.makeDecision();
      this.currentDecision = decision;
      this.totalDecisions++;

      if (this.config.enableLogging) {
        console.log(`🤖 Decision #${this.totalDecisions}: ${decision.action} ${decision.direction || ''}`);
        console.log(`   Reasoning: ${decision.reasoning}`);
        console.log(`   Confidence: ${(decision.confidence * 100).toFixed(0)}%`);
      }

      // Execute the decision
      const success = this.executeDecision(decision);

      if (!success) {
        this.failedActions++;
        if (this.config.enableLogging) {
          console.log(`❌ Failed to execute decision`);
        }
      }
    } catch (error) {
      console.error('❌ Error making decision:', error);
      this.failedActions++;
    }
  }

  /**
   * Execute a decision
   */
  private executeDecision(decision: Decision): boolean {
    switch (decision.action) {
      case 'move':
        return this.executeMove(decision);

      case 'wait':
        return this.executeWait(decision);

      case 'reflect':
        return this.executeReflect(decision);

      default:
        console.warn(`⚠️  Unknown action: ${decision.action}`);
        return false;
    }
  }

  /**
   * Execute a move action
   */
  private executeMove(decision: Decision): boolean {
    if (!decision.direction) {
      console.warn('⚠️  Move action without direction');
      return false;
    }

    const currentPos = this.agent.getTilePosition();
    const targetPos = this.getTargetPosition(currentPos, decision.direction);

    // Validate target position
    if (!targetPos) {
      return false;
    }

    // Attempt to move
    const success = this.agent.moveTo(targetPos);

    if (success) {
      this.isExecutingAction = true;
    }

    return success;
  }

  /**
   * Execute a wait action
   */
  private executeWait(_decision: Decision): boolean {
    // Just wait for the next decision cycle
    // This could be used for reflection or observation
    return true;
  }

  /**
   * Execute a reflect action (future enhancement)
   */
  private executeReflect(_decision: Decision): boolean {
    // Placeholder for reflection system
    // Will generate high-level insights from recent memories
    if (this.config.enableLogging) {
      console.log('💭 Reflecting on recent experiences...');
    }
    return true;
  }

  /**
   * Get target position based on direction
   */
  private getTargetPosition(current: Position, direction: string): Position | null {
    switch (direction.toLowerCase()) {
      case 'north':
        return { x: current.x, y: current.y - 1 };
      case 'south':
        return { x: current.x, y: current.y + 1 };
      case 'east':
        return { x: current.x + 1, y: current.y };
      case 'west':
        return { x: current.x - 1, y: current.y };
      default:
        console.warn(`⚠️  Unknown direction: ${direction}`);
        return null;
    }
  }

  /**
   * Check for emergency conditions that require immediate action
   */
  private checkEmergencyConditions(): string | null {
    const state = this.agent.getState();

    // Critical health
    if (state.health <= 10) {
      return 'critical_health';
    }

    // Critical thirst
    if (state.thirst <= 10) {
      return 'critical_thirst';
    }

    // Critical hunger
    if (state.hunger <= 10) {
      return 'critical_hunger';
    }

    // Agent is stuck
    if (this.stuckCounter >= this.stuckThreshold) {
      return 'stuck';
    }

    return null;
  }

  /**
   * Handle emergency conditions
   */
  private handleEmergency(emergency: string): void {
    if (this.config.enableLogging) {
      console.log(`🚨 EMERGENCY: ${emergency}`);
    }

    switch (emergency) {
      case 'critical_health':
      case 'critical_thirst':
      case 'critical_hunger':
        // In future, search for resources
        // For now, just log and continue
        break;

      case 'stuck':
        // Try random movement to get unstuck
        this.tryRandomMove();
        this.stuckCounter = 0; // Reset counter after intervention
        break;
    }
  }

  /**
   * Try a random valid move (for getting unstuck)
   */
  private tryRandomMove(): void {
    const currentPos = this.agent.getTilePosition();
    const directions = ['north', 'south', 'east', 'west'];

    // Shuffle directions
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    // Try each direction until one works
    for (const direction of directions) {
      const targetPos = this.getTargetPosition(currentPos, direction);
      if (targetPos && this.agent.canMoveTo(targetPos)) {
        this.agent.moveTo(targetPos);
        this.isExecutingAction = true;

        if (this.config.enableLogging) {
          console.log(`🔄 Random move ${direction} to get unstuck`);
        }
        break;
      }
    }
  }

  /**
   * Enable/disable autonomous control
   */
  setEnabled(enabled: boolean): void {
    if (this.isEnabled === enabled) return;

    this.isEnabled = enabled;

    if (this.config.enableLogging) {
      console.log(enabled ? '▶️  Autonomous control enabled' : '⏸️  Autonomous control disabled');
    }

    // Reset state when disabled
    if (!enabled) {
      this.isExecutingAction = false;
      this.currentDecision = null;
    }
  }

  /**
   * Check if autonomous control is enabled
   */
  isControlEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set decision interval
   */
  setDecisionInterval(seconds: number): void {
    this.config.decisionInterval = Math.max(0.5, seconds);
    this.decisionMaker.setDecisionInterval(this.config.decisionInterval * 1000);

    if (this.config.enableLogging) {
      console.log(`⏱️  Decision interval set to ${this.config.decisionInterval}s`);
    }
  }

  /**
   * Get current decision
   */
  getCurrentDecision(): Decision | null {
    return this.currentDecision;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalDecisions: this.totalDecisions,
      successfulActions: this.successfulActions,
      failedActions: this.failedActions,
      successRate: this.totalDecisions > 0
        ? (this.successfulActions / this.totalDecisions * 100).toFixed(1) + '%'
        : '0%',
      isStuck: this.stuckCounter >= this.stuckThreshold,
      stuckCounter: this.stuckCounter,
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStatistics();
    const decision = this.currentDecision;

    return `Autonomous Controller:
Enabled: ${this.isEnabled}
Executing: ${this.isExecutingAction}
Decision Interval: ${this.config.decisionInterval}s
Time Since Last: ${this.timeSinceLastDecision.toFixed(1)}s

Statistics:
Total Decisions: ${stats.totalDecisions}
Successful: ${stats.successfulActions}
Failed: ${stats.failedActions}
Success Rate: ${stats.successRate}
Stuck Counter: ${stats.stuckCounter}

Current Decision:
${decision ? `Action: ${decision.action} ${decision.direction || ''}
Reasoning: ${decision.reasoning}
Confidence: ${(decision.confidence * 100).toFixed(0)}%` : 'None'}`;
  }

  /**
   * Force an immediate decision (for testing)
   */
  async forceDecision(): Promise<void> {
    if (this.config.enableLogging) {
      console.log('🔧 Forcing immediate decision...');
    }

    this.timeSinceLastDecision = this.config.decisionInterval;
    await this.makeAndExecuteDecision();
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.totalDecisions = 0;
    this.successfulActions = 0;
    this.failedActions = 0;
    this.stuckCounter = 0;

    if (this.config.enableLogging) {
      console.log('📊 Statistics reset');
    }
  }
}
