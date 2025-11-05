// src/ui/MultiAgentPanel.ts
/**
 * MultiAgentPanel - Display multi-agent status and social metrics (Week 6)
 *
 * Shows:
 * - List of active agents with colors
 * - Individual agent status (health, hunger, thirst)
 * - Social metrics (interactions, relationships)
 * - Recent social events
 */

import { Container, Graphics, Text } from 'pixi.js';
import { AgentManager } from '../systems/AgentManager';

export class MultiAgentPanel {
  private container: Container;
  private agentManager: AgentManager | null = null;
  private visible: boolean = false;

  // UI Elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private agentTexts: Text[] = [];
  private metricsText!: Text;
  private eventsText!: Text;

  // Configuration
  private panelWidth = 360;
  private panelHeight = 320;
  private padding = 16;

  // Recent events (last 5)
  private recentEvents: string[] = [];

  constructor(container: Container) {
    this.container = new Container();
    container.addChild(this.container);
    this.container.visible = false;
  }

  async init(): Promise<void> {
    console.log('👥 Initializing Multi-Agent Panel...');
    this.createBackground();
    this.createTitle();
    this.createContent();
    console.log('✅ Multi-Agent Panel initialized');
  }

  private createBackground(): void {
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x000000, 0.85);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panelBg.endFill();
    this.panelBg.lineStyle(2, 0x4CAF50, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.container.addChild(this.panelBg);
  }

  private createTitle(): void {
    this.titleText = new Text('MULTI-AGENT STATUS', {
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x4CAF50,
    });
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;
    this.container.addChild(this.titleText);
  }

  private createContent(): void {
    // Metrics label
    const metricsLabel = new Text('Social Metrics:', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0x888888,
    });
    metricsLabel.x = this.padding;
    metricsLabel.y = 180;
    this.container.addChild(metricsLabel);

    // Metrics text
    this.metricsText = new Text('--', {
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0xcccccc,
    });
    this.metricsText.x = this.padding;
    this.metricsText.y = 195;
    this.container.addChild(this.metricsText);

    // Events label
    const eventsLabel = new Text('Recent Events:', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0x888888,
    });
    eventsLabel.x = this.padding;
    eventsLabel.y = 240;
    this.container.addChild(eventsLabel);

    // Events text
    this.eventsText = new Text('--', {
      fontFamily: 'monospace',
      fontSize: 8,
      fill: 0xaaaaaa,
    });
    this.eventsText.x = this.padding;
    this.eventsText.y = 255;
    this.container.addChild(this.eventsText);
  }

  update(_deltaTime: number, _gameTime: number): void {
    if (!this.visible || !this.agentManager) return;

    this.updateAgentList();
    this.updateMetrics();
  }

  private updateAgentList(): void {
    if (!this.agentManager) return;

    // Clear existing agent texts
    this.agentTexts.forEach(t => t.destroy());
    this.agentTexts = [];

    const agents = this.agentManager.getAllAgents();
    const startY = 40;
    const lineHeight = 28;

    agents.forEach((agent, i) => {
      // Agent name with color indicator
      const colorIndicator = '●';
      const nameText = new Text(`${colorIndicator} ${agent.getName()}`, {
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: agent.getColor(),
      });
      nameText.x = this.padding;
      nameText.y = startY + i * lineHeight;
      this.container.addChild(nameText);
      this.agentTexts.push(nameText);

      // Agent stats
      const survival = agent.getSurvivalState();
      const statsText = new Text(
        `  E:${survival.energy.toFixed(0)}% F:${survival.hunger.toFixed(0)}% W:${survival.thirst.toFixed(0)}%`,
        {
          fontFamily: 'monospace',
          fontSize: 9,
          fill: 0xcccccc,
        }
      );
      statsText.x = this.padding;
      statsText.y = startY + i * lineHeight + 14;
      this.container.addChild(statsText);
      this.agentTexts.push(statsText);
    });
  }

  private updateMetrics(): void {
    if (!this.agentManager) {
      this.metricsText.text = 'No agents active';
      return;
    }

    const metrics = this.agentManager.getMetrics();

    let text = '';
    text += `Agents: ${metrics.activeAgentCount}\n`;
    text += `Interactions: ${metrics.totalInteractions}\n`;
    text += `Network Density: ${(metrics.networkDensity * 100).toFixed(0)}%`;

    this.metricsText.text = text;

    // Update events (placeholder for now)
    if (this.recentEvents.length > 0) {
      this.eventsText.text = this.recentEvents.slice(-3).join('\n');
    } else {
      this.eventsText.text = 'No recent events';
    }
  }

  /**
   * Set agent manager
   */
  setAgentManager(manager: AgentManager | null): void {
    this.agentManager = manager;
  }

  /**
   * Add social event to log
   */
  addEvent(event: string): void {
    this.recentEvents.push(event);
    if (this.recentEvents.length > 10) {
      this.recentEvents = this.recentEvents.slice(-10);
    }
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`👥 Multi-Agent Panel: ${this.visible ? 'visible' : 'hidden'}`);
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    this.container.visible = visible;
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Check if visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Get dimensions
   */
  getWidth(): number {
    return this.panelWidth;
  }

  getHeight(): number {
    return this.panelHeight;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.agentTexts.forEach(t => t.destroy());
    this.container.destroy({ children: true });
  }
}
