// src/rendering/MultiAgentRenderer.ts
/**
 * MultiAgentRenderer - Manages rendering for multiple agents (Week 6, Day 8)
 *
 * Responsibilities:
 * - Create and manage AgentRenderer instances for each agent
 * - Update all agent renderers
 * - Handle z-index for overlapping agents
 * - Pass custom colors to individual renderers
 */

import { Container } from 'pixi.js';
import { Agent } from '../agent/Agent';
import { AgentRenderer } from '../agent/AgentRenderer';
import { VisualConfig } from '../types';

export class MultiAgentRenderer {
  private container: Container;
  private config: VisualConfig;

  // Map of agent ID -> AgentRenderer
  private agentRenderers: Map<string, AgentRenderer> = new Map();

  constructor(container: Container, config: VisualConfig) {
    this.container = container;
    this.config = config;
  }

  /**
   * Add an agent to be rendered
   */
  async addAgent(agent: Agent): Promise<void> {
    const agentId = agent.getId();

    // Check if already exists
    if (this.agentRenderers.has(agentId)) {
      console.warn(`⚠️  Agent ${agentId} already has a renderer`);
      return;
    }

    // Create renderer with custom color
    const renderer = new AgentRenderer(
      this.container,
      agent,
      this.config,
      agent.getColor() // Pass custom color
    );

    await renderer.init();

    // Store renderer
    this.agentRenderers.set(agentId, renderer);

    console.log(`🎨 Renderer created for agent: ${agent.getName()} (${agentId})`);
  }

  /**
   * Remove an agent's renderer
   */
  removeAgent(agentId: string): void {
    const renderer = this.agentRenderers.get(agentId);
    if (renderer) {
      renderer.destroy();
      this.agentRenderers.delete(agentId);
      console.log(`🗑️  Renderer removed for agent: ${agentId}`);
    }
  }

  /**
   * Get renderer for specific agent
   */
  getRenderer(agentId: string): AgentRenderer | undefined {
    return this.agentRenderers.get(agentId);
  }

  /**
   * Get all agent renderers
   */
  getAllRenderers(): AgentRenderer[] {
    return Array.from(this.agentRenderers.values());
  }

  /**
   * Update all agent renderers
   */
  update(deltaTime: number): void {
    for (const renderer of this.agentRenderers.values()) {
      renderer.update(deltaTime);
    }

    // Manage z-index for overlapping agents
    this.updateZIndex();
  }

  /**
   * Update z-index based on Y position (agents lower on screen appear in front)
   */
  private updateZIndex(): void {
    // Get all renderers with their Y positions
    const renderersWithY: { renderer: AgentRenderer; y: number }[] = [];

    for (const renderer of this.agentRenderers.values()) {
      const sprite = renderer.getSprite();
      if (sprite) {
        renderersWithY.push({ renderer, y: sprite.y });
      }
    }

    // Sort by Y position (lower Y = further back)
    renderersWithY.sort((a, b) => a.y - b.y);

    // Assign z-index
    renderersWithY.forEach(({ renderer }, index) => {
      const sprite = renderer.getSprite();
      if (sprite) {
        sprite.zIndex = 100 + index; // Base z-index of 100, then +0, +1, +2...
      }
    });
  }

  /**
   * Get number of active renderers
   */
  getRendererCount(): number {
    return this.agentRenderers.size;
  }

  /**
   * Destroy all renderers
   */
  destroy(): void {
    for (const renderer of this.agentRenderers.values()) {
      renderer.destroy();
    }
    this.agentRenderers.clear();
    console.log('🗑️  MultiAgentRenderer destroyed');
  }
}
