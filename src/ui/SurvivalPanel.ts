/**
 * Survival Panel - Visual display for survival metrics (Week 3 + Week 6 Multi-Agent)
 *
 * Displays:
 * - Multi-agent list view with expand/collapse
 * - Resource bars (hunger, thirst, energy) with color coding
 * - Stress bar with gradient visualization
 * - Survival time tracker
 * - Status flags (critical, stable, breakdown, deceased)
 */

import { Graphics, Text, Container } from 'pixi.js';
import { Agent } from '../agent/Agent';
import { AgentManager } from '../systems/AgentManager';

interface StatusBar {
  background: Graphics;
  fill: Graphics;
  label: Text;
  value: Text;
}

interface AgentCard {
  container: Container;
  headerBg: Graphics;
  colorIndicator: Graphics;
  nameText: Text;
  expandIcon: Text;
  quickStatsText: Text;
  detailContainer: Container;
  hungerBar?: StatusBar;
  thirstBar?: StatusBar;
  energyBar?: StatusBar;
  stressBar?: StatusBar;
  statusText?: Text;
  survivalTimeText?: Text;
  expanded: boolean;
  agent: Agent;
}

export class SurvivalPanel {
  private container: Container;
  private agent: Agent; // Primary agent (backward compatibility)
  private agentManager: AgentManager | null = null;
  private visible: boolean = true;

  // Agent cards (multi-agent)
  private agentCards: Map<string, AgentCard> = new Map();

  // Configuration
  private panelWidth = 300;
  private collapsedCardHeight = 50;
  private expandedCardHeight = 240;
  private padding = 16;
  private cardPadding = 12;
  private barWidth = 250;
  private barHeight = 18;
  private barSpacing = 30;

  // Panel background
  private panelBg!: Graphics;
  private titleText!: Text;

  constructor(container: Container, agent: Agent) {
    this.container = new Container();
    this.agent = agent;

    container.addChild(this.container);
  }

  /**
   * Initialize survival panel
   */
  async init(): Promise<void> {
    console.log('🧬 Initializing survival panel (multi-agent)...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Initial update
    this.update(0);

    console.log('✅ Survival panel initialized');
  }

  /**
   * Create panel background
   */
  private createPanelBackground(): void {
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x000000, 0.75);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, 400, 8);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x444444, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, 400, 8);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title
   */
  private createTitle(): void {
    this.titleText = new Text('SURVIVAL STATUS', {
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;
    this.container.addChild(this.titleText);
  }

  /**
   * Set agent manager for multi-agent support
   */
  setAgentManager(manager: AgentManager | null): void {
    this.agentManager = manager;
  }

  /**
   * Create an agent card (collapsed by default)
   */
  private createAgentCard(agent: Agent, agentId: string, yPosition: number): AgentCard {
    const cardContainer = new Container();
    cardContainer.y = yPosition;

    // Header background (clickable area)
    const headerBg = new Graphics();
    headerBg.beginFill(0x1a1a1a, 0.8);
    headerBg.drawRoundedRect(0, 0, this.panelWidth - this.padding * 2, this.collapsedCardHeight, 6);
    headerBg.endFill();
    headerBg.lineStyle(1, 0x333333, 0.6);
    headerBg.drawRoundedRect(0, 0, this.panelWidth - this.padding * 2, this.collapsedCardHeight, 6);
    headerBg.interactive = true;
    headerBg.cursor = 'pointer'; // PixiJS v7+ replacement for buttonMode
    cardContainer.addChild(headerBg);

    // Color indicator (agent color)
    const colorIndicator = new Graphics();
    colorIndicator.beginFill(agent.getColor(), 1.0);
    colorIndicator.drawCircle(this.cardPadding + 8, this.collapsedCardHeight / 2, 8);
    colorIndicator.endFill();
    cardContainer.addChild(colorIndicator);

    // Agent name
    const nameText = new Text(agent.getName(), {
      fontFamily: 'monospace',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    nameText.x = this.cardPadding + 24;
    nameText.y = this.collapsedCardHeight / 2 - 8;
    cardContainer.addChild(nameText);

    // Expand/collapse icon
    const expandIcon = new Text('▶', {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x888888,
    });
    expandIcon.x = this.panelWidth - this.padding * 2 - 20;
    expandIcon.y = this.collapsedCardHeight / 2 - 8;
    cardContainer.addChild(expandIcon);

    // Quick stats (collapsed view)
    const quickStatsText = new Text('E:-- H:-- T:--', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xcccccc,
    });
    quickStatsText.x = this.cardPadding + 24;
    quickStatsText.y = this.collapsedCardHeight / 2 + 6;
    cardContainer.addChild(quickStatsText);

    // Detail container (expanded view)
    const detailContainer = new Container();
    detailContainer.y = this.collapsedCardHeight + 5;
    detailContainer.visible = false;
    cardContainer.addChild(detailContainer);

    this.container.addChild(cardContainer);

    const card: AgentCard = {
      container: cardContainer,
      headerBg,
      colorIndicator,
      nameText,
      expandIcon,
      quickStatsText,
      detailContainer,
      expanded: false,
      agent,
    };

    // Click handler for expand/collapse
    headerBg.on('pointerdown', () => {
      this.toggleAgentCard(agentId);
    });

    return card;
  }

  /**
   * Create expanded details for an agent card
   */
  private createExpandedDetails(card: AgentCard): void {
    const detailContainer = card.detailContainer;
    const startY = 10;

    // Create resource bars
    card.hungerBar = this.createBar(detailContainer, 10, startY, 'HUNGER', 0xff6b6b);
    card.thirstBar = this.createBar(detailContainer, 10, startY + this.barSpacing, 'THIRST', 0x4dabf7);
    card.energyBar = this.createBar(detailContainer, 10, startY + this.barSpacing * 2, 'ENERGY', 0xffd43b);
    card.stressBar = this.createBar(detailContainer, 10, startY + this.barSpacing * 3, 'STRESS', 0x00ff00);

    // Status text
    card.statusText = new Text('✓ STABLE', {
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0x00ff00,
    });
    card.statusText.x = 10;
    card.statusText.y = startY + this.barSpacing * 4;
    detailContainer.addChild(card.statusText);

    // Survival time
    card.survivalTimeText = new Text('Time: 00:00', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xcccccc,
    });
    card.survivalTimeText.x = 10;
    card.survivalTimeText.y = startY + this.barSpacing * 4 + 22;
    detailContainer.addChild(card.survivalTimeText);
  }

  /**
   * Create a single resource bar
   */
  private createBar(container: Container, x: number, y: number, label: string, _color: number): StatusBar {
    // Label text
    const labelText = new Text(label, {
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0xaaaaaa,
    });
    labelText.x = x;
    labelText.y = y - 14;
    container.addChild(labelText);

    // Background
    const background = new Graphics();
    background.beginFill(0x222222, 0.8);
    background.drawRect(x, y, this.barWidth, this.barHeight);
    background.endFill();
    container.addChild(background);

    // Fill bar
    const fill = new Graphics();
    container.addChild(fill);

    // Value text
    const valueText = new Text('100%', {
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0xffffff,
    });
    valueText.x = x + this.barWidth - 35;
    valueText.y = y + 3;
    container.addChild(valueText);

    return { background, fill, label: labelText, value: valueText };
  }

  /**
   * Toggle agent card expanded/collapsed
   */
  private toggleAgentCard(agentId: string): void {
    const card = this.agentCards.get(agentId);
    if (!card) return;

    card.expanded = !card.expanded;
    card.detailContainer.visible = card.expanded;
    card.expandIcon.text = card.expanded ? '▼' : '▶';

    // Create expanded details if first time expanding
    if (card.expanded && !card.hungerBar) {
      this.createExpandedDetails(card);
    }

    // Reposition cards below this one
    this.repositionAgentCards();

    console.log(`👤 ${card.agent.getName()}: ${card.expanded ? 'expanded' : 'collapsed'}`);
  }

  /**
   * Reposition all agent cards based on expanded/collapsed states
   */
  private repositionAgentCards(): void {
    let currentY = 45; // Start below title

    for (const card of this.agentCards.values()) {
      card.container.y = currentY;
      const cardHeight = card.expanded ? this.collapsedCardHeight + this.expandedCardHeight : this.collapsedCardHeight;
      currentY += cardHeight + 8; // 8px spacing between cards
    }

    // Update panel background height
    const totalHeight = currentY + this.padding;
    this.panelBg.clear();
    this.panelBg.beginFill(0x000000, 0.75);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, Math.max(totalHeight, 100), 8);
    this.panelBg.endFill();
    this.panelBg.lineStyle(2, 0x444444, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, Math.max(totalHeight, 100), 8);
  }

  /**
   * Update panel (called every frame)
   */
  update(_deltaTime: number): void {
    if (!this.visible) return;

    // Get list of agents
    const agents = this.agentManager ? this.agentManager.getAllAgents() : [this.agent];

    // Create/update cards for all agents
    agents.forEach((agent, index) => {
      const agentId = `agent-${index}`;

      // Create card if doesn't exist
      if (!this.agentCards.has(agentId)) {
        const yPosition = 45 + index * (this.collapsedCardHeight + 8);
        const card = this.createAgentCard(agent, agentId, yPosition);
        this.agentCards.set(agentId, card);

        // Auto-expand single agent or first agent
        if (agents.length === 1 || index === 0) {
          this.toggleAgentCard(agentId);
        }
      }

      // Update card data
      const card = this.agentCards.get(agentId)!;
      this.updateAgentCard(card);
    });

    // Remove cards for agents that no longer exist
    const currentAgentIds = new Set(agents.map((_, i) => `agent-${i}`));
    for (const [id, card] of this.agentCards) {
      if (!currentAgentIds.has(id)) {
        card.container.destroy({ children: true });
        this.agentCards.delete(id);
      }
    }

    // Reposition cards
    this.repositionAgentCards();
  }

  /**
   * Update a single agent card
   */
  private updateAgentCard(card: AgentCard): void {
    const agent = card.agent;
    const survivalState = agent.getSurvivalState();
    const stressState = agent.getStressManager().getState();

    // Update quick stats (collapsed view)
    const energyShort = Math.round(survivalState.energy);
    const hungerShort = Math.round(survivalState.hunger);
    const thirstShort = Math.round(survivalState.thirst);
    card.quickStatsText.text = `E:${energyShort}% H:${hungerShort}% T:${thirstShort}%`;

    // Update color based on status
    let quickStatsColor = 0xcccccc;
    if (survivalState.isDead) {
      quickStatsColor = 0xff0000;
    } else if (survivalState.isStarving || survivalState.isDehydrated || survivalState.isExhausted) {
      quickStatsColor = 0xff8800;
    } else if (stressState.isCriticalStress) {
      quickStatsColor = 0xffdd00;
    }
    card.quickStatsText.style.fill = quickStatsColor;

    // Update expanded details if visible
    if (card.expanded && card.hungerBar) {
      // Update bars
      this.updateBar(card.hungerBar, survivalState.hunger, 0xff6b6b, 10, 10);
      this.updateBar(card.thirstBar!, survivalState.thirst, 0x4dabf7, 10, 10 + this.barSpacing);
      this.updateBar(card.energyBar!, survivalState.energy, 0xffd43b, 10, 10 + this.barSpacing * 2);
      this.updateBar(card.stressBar!, 100 - stressState.stressLevel, agent.getStressManager().getStressColor(), 10, 10 + this.barSpacing * 3);

      // Update status text
      this.updateStatusText(card, survivalState, stressState);

      // Update survival time
      const minutes = Math.floor(survivalState.survivalTime / 60);
      const seconds = Math.floor(survivalState.survivalTime % 60);
      card.survivalTimeText!.text = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Update a single bar
   */
  private updateBar(
    bar: StatusBar,
    value: number,
    baseColor: number,
    x: number,
    y: number
  ): void {
    bar.fill.clear();

    const fillWidth = (value / 100) * this.barWidth;

    // Color changes based on value
    let fillColor = baseColor;
    if (value < 20) {
      fillColor = 0xff0000; // Red when critical
    } else if (value < 40) {
      fillColor = 0xff8800; // Orange when low
    }

    bar.fill.beginFill(fillColor, 0.85);
    bar.fill.drawRect(x, y, fillWidth, this.barHeight);
    bar.fill.endFill();

    // Update value text
    bar.value.text = `${Math.round(value)}%`;
  }

  /**
   * Update status text for an agent card
   */
  private updateStatusText(card: AgentCard, survivalState: any, stressState: any): void {
    let status = '';
    let color = 0x00ff00; // Green by default

    if (survivalState.isDead) {
      status = '💀 DECEASED';
      color = 0xff0000; // Red
    } else if (stressState.isMentalBreakdown) {
      status = '🧠 BREAKDOWN';
      color = 0xff0000; // Red
    } else if (stressState.isCriticalStress) {
      status = '⚠️ CRITICAL';
      color = 0xff8800; // Orange
    } else if (survivalState.isStarving || survivalState.isDehydrated || survivalState.isExhausted) {
      status = '⚠️ DANGER';
      color = 0xff8800; // Orange
    } else if (card.agent.getResourceManager().isCritical()) {
      status = '⚠️ LOW';
      color = 0xffdd00; // Yellow
    } else {
      status = '✓ STABLE';
      color = 0x00ff00; // Green
    }

    card.statusText!.text = status;
    card.statusText!.style.fill = color;
  }

  /**
   * Set panel position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    this.container.visible = visible;
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`🧬 Survival panel: ${this.visible ? 'visible' : 'hidden'}`);
  }

  /**
   * Show panel
   */
  show(): void {
    this.visible = true;
    this.container.visible = true;
  }

  /**
   * Hide panel
   */
  hide(): void {
    this.visible = false;
    this.container.visible = false;
  }

  /**
   * Check if visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Get panel width
   */
  getWidth(): number {
    return this.panelWidth;
  }

  /**
   * Get panel height (dynamic based on cards)
   */
  getHeight(): number {
    let totalHeight = 45; // Title area
    for (const card of this.agentCards.values()) {
      totalHeight += card.expanded ? this.collapsedCardHeight + this.expandedCardHeight : this.collapsedCardHeight;
      totalHeight += 8; // Spacing
    }
    return Math.max(totalHeight + this.padding, 100);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    for (const card of this.agentCards.values()) {
      card.container.destroy({ children: true });
    }
    this.agentCards.clear();
    this.container.destroy({ children: true });
  }
}
