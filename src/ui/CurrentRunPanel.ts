/**
 * Current Run Panel - Display live metrics for current simulation (Week 4)
 *
 * Shows:
 * - Run ID
 * - Time elapsed
 * - Tiles explored
 * - Items consumed
 * - Decision count
 */

import { Graphics, Text, Container } from 'pixi.js';
import { DataCollector } from '../systems/DataCollector';

export class CurrentRunPanel {
  private container: Container;
  private dataCollector: DataCollector | null = null;
  private visible: boolean = false; // Hidden by default

  // UI elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private runIdText!: Text;
  private timeText!: Text;
  private tilesText!: Text;
  private eventsText!: Text;

  // Configuration
  private panelWidth = 240;
  private panelHeight = 160;
  private padding = 16;

  constructor(container: Container) {
    this.container = new Container();
    container.addChild(this.container);

    // Start hidden
    this.container.visible = false;
  }

  /**
   * Initialize panel
   */
  async init(): Promise<void> {
    console.log('📊 Initializing Current Run Panel...');

    this.createBackground();
    this.createTitle();
    this.createMetricsText();

    console.log('✅ Current Run Panel initialized');
  }

  /**
   * Create panel background
   */
  private createBackground(): void {
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x000000, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x4CAF50, 0.8); // Green border
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title
   */
  private createTitle(): void {
    this.titleText = new Text('CURRENT RUN', {
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x4CAF50,
    });
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;
    this.container.addChild(this.titleText);
  }

  /**
   * Create metrics text fields
   */
  private createMetricsText(): void {
    const startY = 45;
    const lineHeight = 20;

    // Run ID
    this.runIdText = this.createText('ID: ---', this.padding, startY);

    // Time
    this.timeText = this.createText('Time: 00:00', this.padding, startY + lineHeight);

    // Tiles explored
    this.tilesText = this.createText('Explored: 0 tiles', this.padding, startY + lineHeight * 2);

    // Events
    this.eventsText = this.createText('Events: 0', this.padding, startY + lineHeight * 3);
  }

  /**
   * Create text field helper
   */
  private createText(content: string, x: number, y: number): Text {
    const text = new Text(content, {
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0xcccccc,
    });
    text.x = x;
    text.y = y;
    this.container.addChild(text);
    return text;
  }

  /**
   * Set data collector
   */
  setDataCollector(collector: DataCollector | null): void {
    this.dataCollector = collector;

    if (collector) {
      // Update run ID
      const runId = collector.getRunId();
      this.runIdText.text = `ID: ${runId.substring(0, 8)}...`;
    }
  }

  /**
   * Update panel (called every frame)
   */
  update(_deltaTime: number, gameTime: number): void {
    if (!this.visible || !this.dataCollector) return;

    // Update time
    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    this.timeText.text = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update tiles explored
    const tilesExplored = this.dataCollector.getTilesExploredCount();
    this.tilesText.text = `Explored: ${tilesExplored} tiles`;

    // Update events
    const eventCount = this.dataCollector.getEventCount();
    this.eventsText.text = `Events: ${eventCount}`;
  }

  /**
   * Set panel position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`📊 Current Run Panel: ${this.visible ? 'visible' : 'hidden'}`);
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
   * Get panel height
   */
  getHeight(): number {
    return this.panelHeight;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
