// src/systems/AgentManagerCompat.ts
/**
 * AgentManagerCompat - Compatibility layer for Game.ts integration
 *
 * Provides backward-compatible interface while using AgentManager internally
 * This allows gradual migration without breaking existing code
 */

import { Agent } from '../agent/Agent';
import { AgentManager } from './AgentManager';
import { Maze } from '../types';
import { AgentConfig } from '../types/multi-agent';

export class AgentManagerCompat {
  private agentManager: AgentManager;
  private primaryAgentId: string = '';

  constructor(maze: Maze) {
    this.agentManager = new AgentManager(maze);
  }

  /**
   * Create an agent (single or multiple)
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    const agent = await this.agentManager.createAgent(config);

    // First agent is primary (for backward compatibility)
    if (!this.primaryAgentId) {
      this.primaryAgentId = config.id;
    }

    return agent;
  }

  /**
   * Get primary agent (backward compatibility)
   */
  getPrimaryAgent(): Agent | undefined {
    return this.agentManager.getAgent(this.primaryAgentId);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agentManager.getAgent(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return this.agentManager.getAllAgents();
  }

  /**
   * Update all agents
   */
  update(deltaTime: number, timeScale: number, gameTime: number): void {
    this.agentManager.update(deltaTime, timeScale, gameTime);
  }

  /**
   * Get underlying AgentManager
   */
  getAgentManager(): AgentManager {
    return this.agentManager;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.agentManager.destroy();
  }
}
