/**
 * Survival Panel - Visual display for survival metrics (Week 3)
 *
 * Displays:
 * - Resource bars (hunger, thirst, energy) with color coding
 * - Stress bar with gradient visualization
 * - Survival time tracker
 * - Status flags (critical, stable, breakdown, deceased)
 */

import { Graphics, Text, Container } from 'pixi.js';
import { Agent } from '../agent/Agent';

interface StatusBar {
  background: Graphics;
  fill: Graphics;
  label: Text;
  value: Text;
}

export class SurvivalPanel {
  private container: Container;
  private agent: Agent;
  private visible: boolean = true;

  // Status bars
  private hungerBar!: StatusBar;
  private thirstBar!: StatusBar;
  private energyBar!: StatusBar;
  private stressBar!: StatusBar;

  // Status text
  private statusText!: Text;
  private survivalTimeText!: Text;

  // Configuration
  private panelWidth = 280;
  private panelHeight = 320;
  private barWidth = 240;
  private barHeight = 20;
  private padding = 20;
  private barSpacing = 35;

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
    console.log('🧬 Initializing survival panel...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Create resource bars
    this.createResourceBars();

    // Create status text
    this.createStatusText();

    // Initial update
    this.update(0);

    console.log('✅ Survival panel initialized');
  }

  /**
   * Create panel background
   */
  private createPanelBackground(): void {
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x000000, 0.7);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x444444, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);

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
   * Create resource bars
   */
  private createResourceBars(): void {
    const startY = 50;

    // Hunger bar
    this.hungerBar = this.createBar(
      this.padding,
      startY,
      'HUNGER',
      0xff6b6b
    );

    // Thirst bar
    this.thirstBar = this.createBar(
      this.padding,
      startY + this.barSpacing,
      'THIRST',
      0x4dabf7
    );

    // Energy bar
    this.energyBar = this.createBar(
      this.padding,
      startY + this.barSpacing * 2,
      'ENERGY',
      0xffd43b
    );

    // Stress bar
    this.stressBar = this.createBar(
      this.padding,
      startY + this.barSpacing * 3,
      'STRESS',
      0x00ff00
    );
  }

  /**
   * Create a single resource bar
   */
  private createBar(x: number, y: number, label: string, _color: number): StatusBar {
    // Label text
    const labelText = new Text(label, {
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0xcccccc,
    });
    labelText.x = x;
    labelText.y = y - 16;
    this.container.addChild(labelText);

    // Background
    const background = new Graphics();
    background.beginFill(0x333333, 0.8);
    background.drawRect(x, y, this.barWidth, this.barHeight);
    background.endFill();
    this.container.addChild(background);

    // Fill bar
    const fill = new Graphics();
    this.container.addChild(fill);

    // Value text
    const valueText = new Text('100%', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xffffff,
    });
    valueText.x = x + this.barWidth - 40;
    valueText.y = y + 4;
    this.container.addChild(valueText);

    return { background, fill, label: labelText, value: valueText };
  }

  /**
   * Create status text
   */
  private createStatusText(): void {
    const startY = 190;

    // Status flag text
    this.statusText = new Text('✓ STABLE', {
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x00ff00,
    });
    this.statusText.x = this.padding;
    this.statusText.y = startY;
    this.container.addChild(this.statusText);

    // Survival time text
    this.survivalTimeText = new Text('Survival Time: 00:00', {
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0xcccccc,
    });
    this.survivalTimeText.x = this.padding;
    this.survivalTimeText.y = startY + 30;
    this.container.addChild(this.survivalTimeText);
  }

  /**
   * Update panel (called every frame)
   */
  update(_deltaTime: number): void {
    if (!this.visible) return;

    const survivalState = this.agent.getSurvivalState();
    const stressState = this.agent.getStressManager().getState();

    // Update hunger bar
    this.updateBar(
      this.hungerBar,
      survivalState.hunger,
      0xff6b6b,
      this.padding,
      50
    );

    // Update thirst bar
    this.updateBar(
      this.thirstBar,
      survivalState.thirst,
      0x4dabf7,
      this.padding,
      50 + this.barSpacing
    );

    // Update energy bar
    this.updateBar(
      this.energyBar,
      survivalState.energy,
      0xffd43b,
      this.padding,
      50 + this.barSpacing * 2
    );

    // Update stress bar (inverted - lower is better)
    this.updateBar(
      this.stressBar,
      100 - stressState.stressLevel,
      this.agent.getStressManager().getStressColor(),
      this.padding,
      50 + this.barSpacing * 3
    );

    // Update status text
    this.updateStatusText(survivalState, stressState);

    // Update survival time
    this.updateSurvivalTime(survivalState.survivalTime);
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

    bar.fill.beginFill(fillColor, 0.9);
    bar.fill.drawRect(x, y, fillWidth, this.barHeight);
    bar.fill.endFill();

    // Update value text
    bar.value.text = `${Math.round(value)}%`;
  }

  /**
   * Update status text
   */
  private updateStatusText(survivalState: any, stressState: any): void {
    let status = '';
    let color = 0x00ff00; // Green by default

    if (survivalState.isDead) {
      status = '💀 DECEASED';
      color = 0xff0000; // Red
    } else if (stressState.isMentalBreakdown) {
      status = '🧠 MENTAL BREAKDOWN';
      color = 0xff0000; // Red
    } else if (stressState.isCriticalStress) {
      status = '⚠️  CRITICAL STRESS';
      color = 0xff8800; // Orange
    } else if (survivalState.isStarving || survivalState.isDehydrated || survivalState.isExhausted) {
      status = '⚠️  CRITICAL CONDITION';
      color = 0xff8800; // Orange
    } else if (this.agent.getResourceManager().isCritical()) {
      status = '⚠️  LOW RESOURCES';
      color = 0xffdd00; // Yellow
    } else {
      status = '✓ STABLE';
      color = 0x00ff00; // Green
    }

    this.statusText.text = status;
    this.statusText.style.fill = color;
  }

  /**
   * Update survival time display
   */
  private updateSurvivalTime(survivalTime: number): void {
    const minutes = Math.floor(survivalTime / 60);
    const seconds = Math.floor(survivalTime % 60);
    this.survivalTimeText.text = `Survival Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
