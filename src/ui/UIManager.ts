// src/ui/UIManager.ts
/**
 * UIManager - Central coordinator for all UI components (Day 9)
 *
 * Manages:
 * - StatusPanel (health, hunger, thirst, energy bars)
 * - MiniMap (maze overview and exploration)
 * - DebugPanel (performance and debug info)
 * - ControlsOverlay (keyboard shortcuts help)
 * - Coordinates initialization and updates
 * - Handles window resize events
 * - Manages UI visibility states
 */

import { Container } from 'pixi.js';
import { StatusPanel } from './StatusPanel';
import { MiniMap } from './MiniMap';
import { DebugPanel } from './DebugPanel';
import { ControlsOverlay } from './ControlsOverlay';
import { EmbeddingMetricsPanel } from './EmbeddingMetricsPanel';
import { EmbeddingVisualizationPanel } from './EmbeddingVisualizationPanel';
import { Agent } from '../agent/Agent';
import { TimeManager } from '../core/TimeManager';
import { Camera } from '../rendering/Camera';
import { FogOfWar } from '../rendering/FogOfWar';
import { Maze } from '../types';

export class UIManager {
  private uiContainer: Container;
  private maze: Maze;
  private agent: Agent;
  private timeManager: TimeManager;
  private camera: Camera;
  private fogOfWar: FogOfWar | null;

  // UI Components
  private statusPanel!: StatusPanel;
  private miniMap!: MiniMap;
  private debugPanel!: DebugPanel;
  private controlsOverlay!: ControlsOverlay;
  private embeddingMetricsPanel!: EmbeddingMetricsPanel;
  private embeddingVisualizationPanel!: EmbeddingVisualizationPanel;

  // Screen dimensions
  private screenWidth: number;
  private screenHeight: number;

  // Keyboard listeners
  private keyboardListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    uiContainer: Container,
    maze: Maze,
    agent: Agent,
    timeManager: TimeManager,
    camera: Camera,
    fogOfWar: FogOfWar | null,
    screenWidth: number,
    screenHeight: number
  ) {
    this.uiContainer = uiContainer;
    this.maze = maze;
    this.agent = agent;
    this.timeManager = timeManager;
    this.camera = camera;
    this.fogOfWar = fogOfWar;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /**
   * Initialize all UI components
   */
  async init(): Promise<void> {
    console.log('🎨 Initializing UI Manager...');

    // Create status panel (top-left)
    this.statusPanel = new StatusPanel(this.uiContainer, this.agent);
    await this.statusPanel.init();

    // Create minimap (bottom-right)
    this.miniMap = new MiniMap(this.uiContainer, this.maze, this.agent, this.fogOfWar);
    await this.miniMap.init();

    // Create debug panel (top-right, initially hidden)
    this.debugPanel = new DebugPanel(
      this.uiContainer,
      this.agent,
      this.timeManager,
      this.camera,
      this.miniMap
    );
    await this.debugPanel.init();

    // Create controls overlay (centered, initially hidden)
    this.controlsOverlay = new ControlsOverlay(this.uiContainer);
    await this.controlsOverlay.init();

    // Create embedding metrics panel (left-center, initially hidden)
    this.embeddingMetricsPanel = new EmbeddingMetricsPanel(this.uiContainer, this.agent);
    await this.embeddingMetricsPanel.init();

    // Create embedding visualization panel (right-center, initially hidden)
    this.embeddingVisualizationPanel = new EmbeddingVisualizationPanel(this.uiContainer, this.agent);
    await this.embeddingVisualizationPanel.init();

    // Position all UI elements
    this.positionUIElements();

    // Setup keyboard controls
    this.setupKeyboardControls();

    console.log('✅ UI Manager initialized');
  }

  /**
   * Position all UI elements based on screen size
   */
  private positionUIElements(): void {
    const padding = 16;

    // Status Panel - Top Left
    this.statusPanel.setPosition(padding, padding);

    // MiniMap - Bottom Right
    const miniMapX = this.screenWidth - this.miniMap.getWidth() - padding;
    const miniMapY = this.screenHeight - this.miniMap.getHeight() - padding;
    this.miniMap.setPosition(miniMapX, miniMapY);

    // Debug Panel - Top Right
    const debugX = this.screenWidth - this.debugPanel.getWidth() - padding;
    const debugY = padding;
    this.debugPanel.setPosition(debugX, debugY);

    // Embedding Metrics Panel - Left Center
    const embeddingX = padding;
    const embeddingY = (this.screenHeight - this.embeddingMetricsPanel.getHeight()) / 2;
    this.embeddingMetricsPanel.setPosition(embeddingX, embeddingY);

    // Embedding Visualization Panel - Right Center
    const vizX = this.screenWidth - this.embeddingVisualizationPanel.getWidth() - padding;
    const vizY = (this.screenHeight - this.embeddingVisualizationPanel.getHeight()) / 2;
    this.embeddingVisualizationPanel.setPosition(vizX, vizY);

    // Controls Overlay - Centered
    this.controlsOverlay.setPosition(this.screenWidth, this.screenHeight);

    console.log('   UI elements positioned');
  }

  /**
   * Setup keyboard controls for UI
   */
  private setupKeyboardControls(): void {
    this.keyboardListener = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'i':
          // Toggle debug panel
          this.debugPanel.toggle();
          break;

        case 'h':
          // Toggle controls overlay
          this.controlsOverlay.toggle();
          break;

        case 'e':
          // Toggle embedding metrics panel
          this.embeddingMetricsPanel.toggle();
          break;

        case 'm':
          // Toggle embedding visualization panel
          this.embeddingVisualizationPanel.toggle();
          break;
      }
    };

    window.addEventListener('keydown', this.keyboardListener);

    console.log('   UI keyboard controls registered (I: debug, H: help, E: embeddings, M: memory viz)');
  }

  /**
   * Update all UI components
   */
  update(deltaTime: number): void {
    // Update status panel
    this.statusPanel.update(deltaTime);

    // Update minimap
    this.miniMap.update(deltaTime);

    // Update debug panel (only if visible for performance)
    if (this.debugPanel.isVisible()) {
      this.debugPanel.update(deltaTime);
    }

    // Update embedding metrics panel (only if visible for performance)
    if (this.embeddingMetricsPanel.isVisible()) {
      this.embeddingMetricsPanel.update(deltaTime);
    }

    // Update embedding visualization panel (only if visible for performance)
    if (this.embeddingVisualizationPanel.isVisible()) {
      this.embeddingVisualizationPanel.update(deltaTime);
    }

    // Update controls overlay (for fade animations)
    this.controlsOverlay.update(deltaTime);
  }

  /**
   * Handle window resize
   */
  handleResize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // Reposition all UI elements
    this.positionUIElements();

    console.log(`🎨 UI resized to ${width}×${height}`);
  }

  /**
   * Show all UI components
   */
  showAll(): void {
    this.statusPanel.setVisible(true);
    this.miniMap.setVisible(true);
    // Debug and controls remain toggle-able
  }

  /**
   * Hide all UI components
   */
  hideAll(): void {
    this.statusPanel.setVisible(false);
    this.miniMap.setVisible(false);
    this.debugPanel.setVisible(false);
    this.controlsOverlay.hide();
  }

  /**
   * Toggle status panel visibility
   */
  toggleStatusPanel(): void {
    const currentlyVisible = this.statusPanel.getWidth() > 0; // Hacky check, ideally add isVisible method
    this.statusPanel.setVisible(!currentlyVisible);
  }

  /**
   * Toggle minimap visibility
   */
  toggleMiniMap(): void {
    const currentlyVisible = this.miniMap.getWidth() > 0; // Hacky check
    this.miniMap.setVisible(!currentlyVisible);
  }

  /**
   * Get status panel
   */
  getStatusPanel(): StatusPanel {
    return this.statusPanel;
  }

  /**
   * Get minimap
   */
  getMiniMap(): MiniMap {
    return this.miniMap;
  }

  /**
   * Get debug panel
   */
  getDebugPanel(): DebugPanel {
    return this.debugPanel;
  }

  /**
   * Get controls overlay
   */
  getControlsOverlay(): ControlsOverlay {
    return this.controlsOverlay;
  }

  /**
   * Cleanup and destroy all UI components
   */
  destroy(): void {
    console.log('🗑️  Destroying UI Manager...');

    // Remove keyboard listener
    if (this.keyboardListener) {
      window.removeEventListener('keydown', this.keyboardListener);
      this.keyboardListener = null;
    }

    // Destroy all UI components
    if (this.statusPanel) {
      this.statusPanel.destroy();
    }

    if (this.miniMap) {
      this.miniMap.destroy();
    }

    if (this.debugPanel) {
      this.debugPanel.destroy();
    }

    if (this.controlsOverlay) {
      this.controlsOverlay.destroy();
    }

    console.log('✅ UI Manager destroyed');
  }
}
