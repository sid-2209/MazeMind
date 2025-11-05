// src/ui/ConversationPanel.ts
/**
 * ConversationPanel - Visualizes active conversations (Week 7)
 *
 * Displays:
 * - Active conversations between agents
 * - Conversation turns (utterances)
 * - Conversation topics and sentiment
 * - Information diffusion metrics
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Conversation, ConversationMetrics } from '../types/dialogue';
import { ConversationManager } from '../systems/ConversationManager';

export class ConversationPanel {
  private container: Container;
  private conversationManager: ConversationManager | null = null;

  // Panel elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private contentContainer!: Container;
  private metricsText!: Text;

  // Configuration
  private readonly PANEL_WIDTH = 350;
  private readonly PANEL_HEIGHT = 400;
  private readonly padding = 12;

  // Visibility
  private visible: boolean = false;

  constructor(container: Container) {
    this.container = new Container();
    this.container.visible = false;

    container.addChild(this.container);
  }

  /**
   * Initialize panel
   */
  async init(): Promise<void> {
    console.log('💬 Initializing Conversation Panel...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Create content container
    this.contentContainer = new Container();
    this.contentContainer.x = this.padding;
    this.contentContainer.y = 45;
    this.container.addChild(this.contentContainer);

    // Create metrics display
    this.createMetricsDisplay();

    console.log('✅ Conversation Panel initialized');
  }

  /**
   * Create panel background
   */
  private createPanelBackground(): void {
    this.panelBg = new Graphics();

    // Semi-transparent dark background
    this.panelBg.beginFill(0x1a1a2e, 0.95);
    this.panelBg.drawRoundedRect(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, 12);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x00d4ff, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, 12);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title
   */
  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x00d4ff,
      align: 'left',
    });

    this.titleText = new Text('💬 ACTIVE CONVERSATIONS', titleStyle);
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;

    this.container.addChild(this.titleText);
  }

  /**
   * Create metrics display
   */
  private createMetricsDisplay(): void {
    const metricsStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0xaaaaaa,
      align: 'left',
    });

    this.metricsText = new Text('', metricsStyle);
    this.metricsText.x = this.padding;
    this.metricsText.y = this.PANEL_HEIGHT - 60;

    this.container.addChild(this.metricsText);
  }

  /**
   * Update panel
   */
  update(_deltaTime: number, _gameTime?: number): void {
    if (!this.visible || !this.conversationManager) return;

    // Get active conversations
    const activeConversations = this.conversationManager.getActiveConversations();
    const metrics = this.conversationManager.getMetrics();

    // Update content
    this.updateContent(activeConversations);

    // Update metrics
    this.updateMetrics(metrics);
  }

  /**
   * Update conversation content
   */
  private updateContent(conversations: Conversation[]): void {
    // Clear existing content
    this.contentContainer.removeChildren();

    let yOffset = 0;

    if (conversations.length === 0) {
      // No active conversations
      const emptyStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fill: 0x888888,
        align: 'center',
        fontStyle: 'italic',
      });

      const emptyText = new Text('No active conversations', emptyStyle);
      emptyText.x = (this.PANEL_WIDTH - this.padding * 2) / 2;
      emptyText.y = 50;
      emptyText.anchor.set(0.5, 0);

      this.contentContainer.addChild(emptyText);
      return;
    }

    // Display each conversation
    for (const conversation of conversations.slice(0, 3)) { // Show max 3
      const convElement = this.createConversationElement(conversation);
      convElement.y = yOffset;
      this.contentContainer.addChild(convElement);

      yOffset += convElement.height + 10;
    }
  }

  /**
   * Create conversation element
   */
  private createConversationElement(conversation: Conversation): Container {
    const element = new Container();

    // Background
    const bg = new Graphics();
    bg.beginFill(0x2a2a3e, 0.8);
    bg.drawRoundedRect(0, 0, this.PANEL_WIDTH - this.padding * 2 - 4, 100, 6);
    bg.endFill();
    element.addChild(bg);

    // Participants
    const participantsStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x00ff88,
      align: 'left',
    });

    const participantsText = new Text(
      `${conversation.participantNames.join(' ↔ ')}`,
      participantsStyle
    );
    participantsText.x = 8;
    participantsText.y = 6;
    element.addChild(participantsText);

    // Topic
    const topicStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xaaaaaa,
      align: 'left',
    });

    const topicText = new Text(`Topic: ${conversation.topic}`, topicStyle);
    topicText.x = 8;
    topicText.y = 26;
    element.addChild(topicText);

    // Latest turn (last utterance)
    if (conversation.turns.length > 0) {
      const lastTurn = conversation.turns[conversation.turns.length - 1];

      const utteranceStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 10,
        fill: 0xffffff,
        align: 'left',
        wordWrap: true,
        wordWrapWidth: this.PANEL_WIDTH - this.padding * 2 - 20,
      });

      const utteranceText = new Text(
        `"${lastTurn.utterance}"`,
        utteranceStyle
      );
      utteranceText.x = 8;
      utteranceText.y = 44;
      element.addChild(utteranceText);

      // Speaker name
      const speakerStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 9,
        fill: 0x888888,
        align: 'right',
        fontStyle: 'italic',
      });

      const speakerText = new Text(`- ${lastTurn.speakerName}`, speakerStyle);
      speakerText.x = this.PANEL_WIDTH - this.padding * 2 - 16;
      speakerText.y = 80;
      speakerText.anchor.set(1, 0);
      element.addChild(speakerText);
    }

    return element;
  }

  /**
   * Update metrics display
   */
  private updateMetrics(metrics: ConversationMetrics): void {
    const metricsLines = [
      `Total: ${metrics.totalConversations}`,
      `Active: ${metrics.activeConversations}`,
      `Completed: ${metrics.completedConversations}`,
      `Info Diffused: ${metrics.informationDiffusionCount}`,
    ];

    this.metricsText.text = metricsLines.join('  |  ');
  }

  /**
   * Set conversation manager
   */
  setConversationManager(manager: ConversationManager | null): void {
    this.conversationManager = manager;
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`💬 Conversation Panel: ${this.visible ? 'Visible' : 'Hidden'}`);
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    this.container.visible = visible;
  }

  /**
   * Check if panel is visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Set panel position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Get panel width
   */
  getWidth(): number {
    return this.PANEL_WIDTH;
  }

  /**
   * Get panel height
   */
  getHeight(): number {
    return this.PANEL_HEIGHT;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
