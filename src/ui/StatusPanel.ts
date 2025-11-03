// src/ui/StatusPanel.ts
/**
 * StatusPanel - Visual display for agent status (Day 9)
 *
 * Displays:
 * - Health/hunger/thirst/energy bars with visual indicators
 * - Color-coded bars (green → yellow → red)
 * - Percentage displays
 * - Real-time updates
 */

import { Graphics, Text, Container, TextStyle } from 'pixi.js';
import { Agent } from '../agent/Agent';

interface StatusBar {
  container: Container;
  background: Graphics;
  fill: Graphics;
  label: Text;
  value: Text;
  icon: Text;
}

export class StatusPanel {
  private container: Container;
  private agent: Agent;

  // Status bars
  private healthBar!: StatusBar;
  private hungerBar!: StatusBar;
  private thirstBar!: StatusBar;
  private energyBar!: StatusBar;

  // Configuration
  private barWidth = 200;
  private barHeight = 24;
  private barSpacing = 8;
  private padding = 16;

  // Panel background
  private panelBg!: Graphics;
  private titleText!: Text;

  constructor(container: Container, agent: Agent) {
    this.container = new Container();
    this.agent = agent;

    container.addChild(this.container);
  }

  /**
   * Initialize status panel
   */
  async init(): Promise<void> {
    console.log('📊 Initializing status panel...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Create status bars
    this.healthBar = this.createStatusBar(0, '❤️', 'Health', 0xff4444);
    this.hungerBar = this.createStatusBar(1, '🍖', 'Hunger', 0xff8844);
    this.thirstBar = this.createStatusBar(2, '💧', 'Thirst', 0x4488ff);
    this.energyBar = this.createStatusBar(3, '⚡', 'Energy', 0xffdd44);

    // Position panel (top-left corner)
    this.container.x = this.padding;
    this.container.y = this.padding;

    // Initial update
    this.update(0);

    console.log('✅ Status panel initialized');
  }

  /**
   * Create panel background
   */
  private createPanelBackground(): void {
    this.panelBg = new Graphics();

    const width = this.barWidth + this.padding * 2;
    const height = (this.barHeight + this.barSpacing) * 4 + this.padding * 2 + 30; // 30 for title

    // Semi-transparent dark background
    this.panelBg.beginFill(0x000000, 0.7);
    this.panelBg.drawRoundedRect(0, 0, width, height, 8);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x444444, 0.8);
    this.panelBg.drawRoundedRect(0, 0, width, height, 8);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title text
   */
  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'left',
    });

    this.titleText = new Text('STATUS', titleStyle);
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;

    this.container.addChild(this.titleText);
  }

  /**
   * Create a status bar
   */
  private createStatusBar(index: number, icon: string, label: string, _color: number): StatusBar {
    const barContainer = new Container();

    const yOffset = this.padding + 30 + index * (this.barHeight + this.barSpacing);
    barContainer.x = this.padding;
    barContainer.y = yOffset;

    // Icon
    const iconStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 18,
      fill: 0xffffff,
    });
    const iconText = new Text(icon, iconStyle);
    iconText.x = 0;
    iconText.y = 0;

    // Label
    const labelStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0xcccccc,
      align: 'left',
    });
    const labelText = new Text(label, labelStyle);
    labelText.x = 28;
    labelText.y = 4;

    // Background (empty bar)
    const background = new Graphics();
    background.beginFill(0x222222, 0.8);
    background.drawRoundedRect(80, 0, this.barWidth - 80, this.barHeight, 4);
    background.endFill();

    // Fill (actual value)
    const fill = new Graphics();
    // Will be drawn in update()

    // Value text (percentage)
    const valueStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center',
    });
    const valueText = new Text('100%', valueStyle);
    valueText.x = this.barWidth / 2 + 40;
    valueText.y = 5;
    valueText.anchor.set(0.5, 0);

    // Add to container
    barContainer.addChild(background);
    barContainer.addChild(fill);
    barContainer.addChild(iconText);
    barContainer.addChild(labelText);
    barContainer.addChild(valueText);

    this.container.addChild(barContainer);

    return {
      container: barContainer,
      background,
      fill,
      label: labelText,
      value: valueText,
      icon: iconText,
    };
  }

  /**
   * Update status bars
   */
  update(_deltaTime: number): void {
    const state = this.agent.getState();

    // Update each bar
    this.updateBar(this.healthBar, state.health);
    this.updateBar(this.hungerBar, state.hunger);
    this.updateBar(this.thirstBar, state.thirst);
    this.updateBar(this.energyBar, state.energy);
  }

  /**
   * Update a single status bar
   */
  private updateBar(bar: StatusBar, value: number): void {
    // Clamp value 0-100
    value = Math.max(0, Math.min(100, value));

    // Calculate fill width
    const fillWidth = ((this.barWidth - 80) * value) / 100;

    // Get color based on value
    const fillColor = this.getStatusColor(value);

    // Redraw fill
    bar.fill.clear();
    if (fillWidth > 0) {
      bar.fill.beginFill(fillColor, 0.9);
      bar.fill.drawRoundedRect(80, 0, fillWidth, this.barHeight, 4);
      bar.fill.endFill();
    }

    // Update text
    bar.value.text = `${Math.round(value)}%`;
    bar.value.style.fill = this.getTextColor(value);

    // Add warning pulse for critical values
    if (value < 20) {
      const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
      bar.icon.alpha = pulse;
    } else {
      bar.icon.alpha = 1;
    }
  }

  /**
   * Get color based on status value
   * Green → Yellow → Red as value decreases
   */
  private getStatusColor(value: number): number {
    if (value > 60) {
      // Green zone (60-100)
      const t = (value - 60) / 40;
      return this.lerpColor(0x88cc44, 0x44cc44, t);
    } else if (value > 30) {
      // Yellow zone (30-60)
      const t = (value - 30) / 30;
      return this.lerpColor(0xeeaa00, 0x88cc44, t);
    } else {
      // Red zone (0-30)
      const t = value / 30;
      return this.lerpColor(0xff3333, 0xeeaa00, t);
    }
  }

  /**
   * Get text color based on status value
   */
  private getTextColor(value: number): number {
    if (value < 20) {
      return 0xff3333; // Red for critical
    } else if (value < 40) {
      return 0xffaa00; // Orange for warning
    } else {
      return 0xffffff; // White for normal
    }
  }

  /**
   * Linear interpolation between two colors
   */
  private lerpColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * Set panel position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Show/hide panel
   */
  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Get panel width
   */
  getWidth(): number {
    return this.barWidth + this.padding * 2;
  }

  /**
   * Get panel height
   */
  getHeight(): number {
    return (this.barHeight + this.barSpacing) * 4 + this.padding * 2 + 30;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
