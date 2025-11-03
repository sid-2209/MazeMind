// src/ui/DebugPanel.ts
/**
 * DebugPanel - Development debug information display (Day 9)
 *
 * Displays:
 * - Performance metrics (FPS, frame time, render time)
 * - Agent state (position, tile coords, movement state)
 * - Time system info (game time, period, cycle)
 * - Fog of war statistics (exploration %)
 * - Camera data (position, zoom level)
 * - Toggle visibility with 'I' key
 */

import { Graphics, Text, Container, TextStyle } from 'pixi.js';
import { Agent } from '../agent/Agent';
import { TimeManager } from '../core/TimeManager';
import { Camera } from '../rendering/Camera';
import { MiniMap } from './MiniMap';

interface DebugInfo {
  fps: number;
  deltaTime: number;
  agentPosition: { x: number; y: number };
  agentTile: { x: number; y: number };
  agentMoving: boolean;
  gameTime: string;
  timePeriod: string;
  cameraPosition: { x: number; y: number };
  cameraZoom: number;
  explorationPercent: number;
}

export class DebugPanel {
  private container: Container;
  private agent: Agent;
  private timeManager: TimeManager;
  private camera: Camera;
  private miniMap: MiniMap | null;

  // Graphics elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private debugText!: Text;

  // Configuration
  private padding = 12;
  private panelWidth = 300;
  private panelHeight = 280;

  // Visible state
  private visible = false;

  // Performance tracking
  private frameCount = 0;
  private fpsUpdateInterval = 0.5; // Update FPS every 0.5 seconds
  private fpsUpdateTimer = 0;
  private currentFPS = 60;

  constructor(
    container: Container,
    agent: Agent,
    timeManager: TimeManager,
    camera: Camera,
    miniMap: MiniMap | null = null
  ) {
    this.container = new Container();
    this.agent = agent;
    this.timeManager = timeManager;
    this.camera = camera;
    this.miniMap = miniMap;

    container.addChild(this.container);

    // Start hidden
    this.container.visible = false;
  }

  /**
   * Initialize debug panel
   */
  async init(): Promise<void> {
    console.log('🐛 Initializing debug panel...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Create debug text
    this.createDebugText();

    // Initial update
    this.update(0);

    console.log('✅ Debug panel initialized (hidden by default)');
  }

  /**
   * Create panel background
   */
  private createPanelBackground(): void {
    this.panelBg = new Graphics();

    // Semi-transparent dark background
    this.panelBg.beginFill(0x000000, 0.85);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panelBg.endFill();

    // Border with debug color (cyan)
    this.panelBg.lineStyle(2, 0x00ffff, 0.6);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title text
   */
  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0x00ffff,
      align: 'left',
    });

    this.titleText = new Text('DEBUG INFO [I to toggle]', titleStyle);
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;

    this.container.addChild(this.titleText);
  }

  /**
   * Create debug text
   */
  private createDebugText(): void {
    const textStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0xcccccc,
      align: 'left',
      lineHeight: 16,
    });

    this.debugText = new Text('', textStyle);
    this.debugText.x = this.padding;
    this.debugText.y = this.padding + 30;

    this.container.addChild(this.debugText);
  }

  /**
   * Update debug panel
   */
  update(deltaTime: number): void {
    if (!this.visible) return;

    // Update FPS counter
    this.frameCount++;
    this.fpsUpdateTimer += deltaTime;

    if (this.fpsUpdateTimer >= this.fpsUpdateInterval) {
      this.currentFPS = Math.round(this.frameCount / this.fpsUpdateTimer);
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;
    }

    // Gather debug info
    const debugInfo = this.gatherDebugInfo(deltaTime);

    // Update text
    this.updateDebugText(debugInfo);
  }

  /**
   * Gather all debug information
   */
  private gatherDebugInfo(deltaTime: number): DebugInfo {
    // Agent info
    const agentPos = this.agent.getPosition();
    const agentTile = this.agent.getTilePosition();
    const agentMoving = this.agent.isMoving();

    // Time info
    const timeOfDay = this.timeManager.getTimeOfDay();
    const minutes = (timeOfDay.hour % 1) * 60; // Calculate minutes from fractional hours
    const gameTime = this.formatGameTime(timeOfDay.hour, minutes);
    const timePeriod = timeOfDay.period;

    // Camera info
    const cameraPos = this.camera.getPosition();
    const cameraZoom = this.camera.getZoom();

    // Exploration info
    const explorationPercent = this.miniMap
      ? this.miniMap.getExplorationPercentage()
      : 0;

    return {
      fps: this.currentFPS,
      deltaTime: deltaTime * 1000, // Convert to ms
      agentPosition: { x: agentPos.x, y: agentPos.y },
      agentTile: { x: agentTile.x, y: agentTile.y },
      agentMoving,
      gameTime,
      timePeriod,
      cameraPosition: { x: cameraPos.x, y: cameraPos.y },
      cameraZoom,
      explorationPercent,
    };
  }

  /**
   * Update debug text display
   */
  private updateDebugText(info: DebugInfo): void {
    const lines: string[] = [];

    // Performance section
    lines.push('PERFORMANCE:');
    lines.push(`  FPS: ${info.fps}`);
    lines.push(`  Frame Time: ${info.deltaTime.toFixed(2)}ms`);
    lines.push('');

    // Agent section
    lines.push('AGENT:');
    lines.push(`  Position: (${info.agentPosition.x.toFixed(1)}, ${info.agentPosition.y.toFixed(1)})`);
    lines.push(`  Tile: (${info.agentTile.x}, ${info.agentTile.y})`);
    lines.push(`  Moving: ${info.agentMoving ? 'Yes' : 'No'}`);
    lines.push('');

    // Time section
    lines.push('TIME:');
    lines.push(`  Game Time: ${info.gameTime}`);
    lines.push(`  Period: ${info.timePeriod}`);
    lines.push(`  Scale: ${this.timeManager.getTimeScale().toFixed(1)}x`);
    lines.push('');

    // Camera section
    lines.push('CAMERA:');
    lines.push(`  Position: (${info.cameraPosition.x.toFixed(0)}, ${info.cameraPosition.y.toFixed(0)})`);
    lines.push(`  Zoom: ${(info.cameraZoom * 100).toFixed(0)}%`);
    lines.push('');

    // Exploration section
    lines.push('EXPLORATION:');
    lines.push(`  Explored: ${info.explorationPercent.toFixed(1)}%`);

    this.debugText.text = lines.join('\n');
  }

  /**
   * Format game time for display
   */
  private formatGameTime(hours: number, minutes: number): string {
    const h = Math.floor(hours).toString().padStart(2, '0');
    const m = Math.floor(minutes).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`🐛 Debug panel: ${this.visible ? 'Visible' : 'Hidden'}`);
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
    this.visible = visible;
    this.container.visible = visible;
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
   * Check if panel is visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
