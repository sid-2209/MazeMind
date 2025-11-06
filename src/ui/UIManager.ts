// src/ui/UIManager.ts
/**
 * UIManager - Central coordinator for all UI components (Day 9 + Week 6)
 *
 * Manages:
 * - SurvivalPanel (multi-agent survival metrics with expand/collapse)
 * - MiniMap (maze overview and exploration)
 * - DebugPanel (performance and debug info)
 * - ControlsOverlay (keyboard shortcuts help)
 * - Coordinates initialization and updates
 * - Handles window resize events
 * - Manages UI visibility states
 */

import { Container } from 'pixi.js';
import { MiniMap } from './MiniMap';
import { DebugPanel } from './DebugPanel';
import { ControlsOverlay } from './ControlsOverlay';
import { EmbeddingMetricsPanel } from './EmbeddingMetricsPanel';
import { EmbeddingVisualizationPanel } from './EmbeddingVisualizationPanel';
import { SurvivalPanel } from './SurvivalPanel'; // Week 3
import { CurrentRunPanel } from './CurrentRunPanel'; // Week 4
import { PlanningPanel } from './PlanningPanel'; // Week 5
import { MultiAgentPanel } from './MultiAgentPanel'; // Week 6
import { ConversationPanel } from './ConversationPanel'; // Week 7
import { ReflectionTreePanel } from './ReflectionTreePanel'; // Week 8
import { LocationTreePanel } from './LocationTreePanel'; // Week 9
import { Agent } from '../agent/Agent';
import { TimeManager } from '../core/TimeManager';
import type { WorldHierarchy } from '../systems/WorldHierarchy'; // Week 9
import { Camera } from '../rendering/Camera';
import { FogOfWar } from '../rendering/FogOfWar';
import { Maze } from '../types';
import { DataCollector } from '../systems/DataCollector'; // Week 4
import { AgentManager } from '../systems/AgentManager'; // Week 6
import { ConversationManager } from '../systems/ConversationManager'; // Week 7
// import { PanelDragManager } from '../utils/PanelDragManager'; // UI Improvements - DISABLED

export class UIManager {
  private uiContainer: Container;
  private maze: Maze;
  private agent: Agent;
  private timeManager: TimeManager;
  private camera: Camera;
  private fogOfWar: FogOfWar | null;

  // UI Components
  private miniMap!: MiniMap;
  private debugPanel!: DebugPanel;
  private controlsOverlay!: ControlsOverlay;
  private embeddingMetricsPanel!: EmbeddingMetricsPanel;
  private embeddingVisualizationPanel!: EmbeddingVisualizationPanel;
  private survivalPanel!: SurvivalPanel; // Week 3
  private currentRunPanel!: CurrentRunPanel; // Week 4
  private planningPanel!: PlanningPanel; // Week 5
  private multiAgentPanel!: MultiAgentPanel; // Week 6
  private conversationPanel!: ConversationPanel; // Week 7
  private reflectionTreePanel!: ReflectionTreePanel; // Week 8
  private locationTreePanel!: LocationTreePanel; // Week 9

  // Screen dimensions
  private screenWidth: number;
  private screenHeight: number;

  // Drag manager for panels - DISABLED
  // private panelDragManager: PanelDragManager;

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

    // Initialize drag manager - DISABLED
    // this.panelDragManager = new PanelDragManager();

    // Enable sortable children for z-index management
    this.uiContainer.sortableChildren = true;
  }

  /**
   * Initialize all UI components
   */
  async init(): Promise<void> {
    console.log('🎨 Initializing UI Manager...');

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

    // Create survival panel (left-bottom, visible by default) - Week 3
    this.survivalPanel = new SurvivalPanel(this.uiContainer, this.agent);
    await this.survivalPanel.init();

    // Create current run panel (top-right, initially hidden) - Week 4
    this.currentRunPanel = new CurrentRunPanel(this.uiContainer);
    await this.currentRunPanel.init();

    // Create planning panel (left-bottom, initially hidden) - Week 5
    this.planningPanel = new PlanningPanel(this.uiContainer, this.agent);
    await this.planningPanel.init();

    // Create multi-agent panel (top-center, initially hidden) - Week 6
    this.multiAgentPanel = new MultiAgentPanel(this.uiContainer);
    await this.multiAgentPanel.init();

    // Create conversation panel (bottom-center, initially hidden) - Week 7
    this.conversationPanel = new ConversationPanel(this.uiContainer);
    await this.conversationPanel.init();

    // Create reflection tree panel (right side, initially hidden) - Week 8
    this.reflectionTreePanel = new ReflectionTreePanel(this.uiContainer);
    this.reflectionTreePanel.toggle(); // Start hidden

    // Create location tree panel (left side, initially hidden) - Week 9
    this.locationTreePanel = new LocationTreePanel(this.uiContainer);
    this.locationTreePanel.toggle(); // Start hidden

    // Position all UI elements
    this.positionUIElements();

    // Make panels draggable (UI Improvements) - DISABLED
    // this.setupDraggablePanels();

    // Setup keyboard controls
    this.setupKeyboardControls();

    // Set default visibility (Week 6: Minimize clutter)
    this.setDefaultVisibility();

    console.log('✅ UI Manager initialized');
  }

  /**
   * Set default visibility for minimal clutter (Week 6)
   */
  private setDefaultVisibility(): void {
    // Visible by default: Survival Panel and MiniMap only
    this.survivalPanel.setVisible(true);
    this.miniMap.setVisible(true);

    // Hidden by default: All advanced/debug panels
    this.debugPanel.setVisible(false);
    this.multiAgentPanel.setVisible(false);

    // These panels use hide() instead of setVisible()
    if (!this.embeddingMetricsPanel.isVisible()) {
      // Already hidden
    }
    if (!this.embeddingVisualizationPanel.isVisible()) {
      // Already hidden
    }
    if (!this.currentRunPanel.isVisible()) {
      // Already hidden
    }
    if (!this.planningPanel.isVisible()) {
      // Already hidden
    }
    // ControlsOverlay is already hidden by default

    console.log('   UI visibility set (minimized clutter)');
  }

  /**
   * Position all UI elements based on screen size
   */
  private positionUIElements(): void {
    const padding = 16; // Increased from default to prevent clipping

    // Survival Panel - Top Left corner (with padding to prevent clipping)
    this.survivalPanel.setPosition(padding, padding);

    // MiniMap - Bottom Right (with extra padding for border)
    const miniMapX = this.screenWidth - this.miniMap.getWidth() - padding - 4; // Extra 4px for border + safety
    const miniMapY = this.screenHeight - this.miniMap.getHeight() - padding - 4; // Extra 4px for border + safety
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

    // Planning Panel - Left Bottom (Week 5)
    const planningX = padding;
    const planningY = this.screenHeight - this.planningPanel.getHeight() - padding;
    this.planningPanel.setPosition(planningX, planningY);

    // Current Run Panel - Top Right (Week 4)
    const runPanelX = this.screenWidth - this.currentRunPanel.getWidth() - padding;
    const runPanelY = padding + this.debugPanel.getHeight() + padding; // Below debug panel
    this.currentRunPanel.setPosition(runPanelX, runPanelY);

    // Multi-Agent Panel - Top Center (Week 6)
    const multiAgentX = (this.screenWidth - this.multiAgentPanel.getWidth()) / 2;
    const multiAgentY = padding;
    this.multiAgentPanel.setPosition(multiAgentX, multiAgentY);

    // Conversation Panel - Bottom Center (Week 7)
    const conversationX = (this.screenWidth - this.conversationPanel.getWidth()) / 2;
    const conversationY = this.screenHeight - this.conversationPanel.getHeight() - padding;
    this.conversationPanel.setPosition(conversationX, conversationY);

    // Reflection Tree Panel - Right Side (Week 8)
    const reflectionX = this.screenWidth - this.reflectionTreePanel.getWidth() - padding - 4; // Extra padding for border
    const reflectionY = padding;
    this.reflectionTreePanel.setPosition(reflectionX, reflectionY);

    // Location Tree Panel - Left Side, offset from control sidebar (Week 9)
    const locationX = 360; // Offset from control sidebar (320px + 40px gap)
    const locationY = padding;
    this.locationTreePanel.setPosition(locationX, locationY);

    // Controls Overlay - Centered
    this.controlsOverlay.setPosition(this.screenWidth, this.screenHeight);

    console.log('   UI elements positioned');
  }

  /**
   * Setup draggable functionality for all panels (UI Improvements) - DISABLED
   */
  // private setupDraggablePanels(): void {
  //   console.log('🖱️  Setting up draggable panels...');

  //   // Get panel containers (each panel has a container property)
  //   const panels = [
  //     { name: 'Debug Panel', container: (this.debugPanel as any).container, width: this.debugPanel.getWidth(), height: this.debugPanel.getHeight(), id: 'debug' },
  //     { name: 'Survival Panel', container: (this.survivalPanel as any).container, width: 400, height: 300, id: 'survival' },
  //     { name: 'MiniMap', container: (this.miniMap as any).container, width: this.miniMap.getWidth(), height: this.miniMap.getHeight(), id: 'minimap' },
  //     { name: 'Embedding Metrics', container: (this.embeddingMetricsPanel as any).container, width: this.embeddingMetricsPanel.getWidth(), height: this.embeddingMetricsPanel.getHeight(), id: 'embedding-metrics' },
  //     { name: 'Embedding Visualization', container: (this.embeddingVisualizationPanel as any).container, width: this.embeddingVisualizationPanel.getWidth(), height: this.embeddingVisualizationPanel.getHeight(), id: 'embedding-viz' },
  //     { name: 'Planning Panel', container: (this.planningPanel as any).container, width: this.planningPanel.getWidth(), height: this.planningPanel.getHeight(), id: 'planning' },
  //     { name: 'Current Run Panel', container: (this.currentRunPanel as any).container, width: this.currentRunPanel.getWidth(), height: this.currentRunPanel.getHeight(), id: 'current-run' },
  //     { name: 'Multi-Agent Panel', container: (this.multiAgentPanel as any).container, width: this.multiAgentPanel.getWidth(), height: this.multiAgentPanel.getHeight(), id: 'multi-agent' },
  //     { name: 'Conversation Panel', container: (this.conversationPanel as any).container, width: this.conversationPanel.getWidth(), height: this.conversationPanel.getHeight(), id: 'conversation' },
  //     { name: 'Reflection Tree Panel', container: (this.reflectionTreePanel as any).container, width: this.reflectionTreePanel.getWidth(), height: this.reflectionTreePanel.getHeight(), id: 'reflection-tree' },
  //     { name: 'Location Tree Panel', container: (this.locationTreePanel as any).container, width: this.locationTreePanel.getWidth(), height: this.locationTreePanel.getHeight(), id: 'location-tree' }
  //   ];

  //   // Make each panel draggable
  //   for (const panel of panels) {
  //     try {
  //       if (panel.container) {
  //         this.panelDragManager.makeDraggable(panel.container, {
  //           id: panel.id,
  //           width: panel.width,
  //           height: panel.height,
  //           snapThreshold: 20,
  //           persistPosition: true,
  //           showDragHandle: true
  //         });
  //         console.log(`   ✅ ${panel.name} is now draggable`);
  //       }
  //     } catch (error) {
  //       console.warn(`   ⚠️ Could not make ${panel.name} draggable:`, error);
  //     }
  //   }

  //   console.log('✅ All panels are now draggable!');
  // }

  /**
   * Setup keyboard controls for UI
   */
  private setupKeyboardControls(): void {
    this.keyboardListener = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      console.log(`⌨️ UIManager received key: '${key}'`);

      switch (key) {
        case 'i':
          // Toggle debug panel
          console.log('  → Toggling debug panel');
          this.debugPanel.toggle();
          break;

        case 'h':
          // Toggle controls overlay
          console.log('  → Toggling controls overlay');
          this.controlsOverlay.toggle();
          break;

        case 'e':
          // Toggle embedding metrics panel
          console.log('  → Toggling embedding metrics panel');
          this.embeddingMetricsPanel.toggle();
          break;

        case 'm':
          // Toggle embedding visualization panel
          console.log('  → Toggling embedding visualization panel');
          this.embeddingVisualizationPanel.toggle();
          break;

        case 's':
          // Toggle survival panel (Week 3)
          console.log('  → Toggling survival panel');
          this.survivalPanel.toggle();
          break;

        case 'c':
          // Toggle current run panel (Week 4) - Changed to 'C' to avoid conflict with regenerate maze
          console.log('  → Toggling current run panel');
          this.currentRunPanel.toggle();
          break;

        case 'p':
          // Toggle planning panel (Week 5)
          console.log('  → Toggling planning panel');
          this.planningPanel.toggle();
          break;

        case 'z':
          // Toggle multi-agent panel (Week 6) - Changed to 'Z' for easy access
          console.log('  → Toggling multi-agent panel');
          this.multiAgentPanel.toggle();
          break;

        case 'd':
          // Toggle conversation panel (Week 7) - 'D' for Dialogue
          console.log('  → Toggling conversation panel');
          this.conversationPanel.toggle();
          break;

        case 'f':
          // Toggle reflection tree panel (Week 8) - 'F' for reFLection tree
          console.log('  → Toggling reflection tree panel');
          this.reflectionTreePanel.toggle();
          break;

        case 'g':
          // Toggle location tree panel (Week 9) - 'G' for Geography/location tree
          console.log('  → Toggling location tree panel');
          this.locationTreePanel.toggle();
          break;
      }
    };

    window.addEventListener('keydown', this.keyboardListener);

    console.log('   UI keyboard controls registered (I: debug, H: help, E: embeddings, M: memory viz, S: survival, C: current run, P: planning, Z: multi-agent, D: dialogue, F: reflection tree, G: location tree)');
  }

  /**
   * Update all UI components
   */
  update(deltaTime: number, gameTime: number = 0): void {
    // Update survival panel (Week 3 + Week 6 multi-agent)
    this.survivalPanel.update(deltaTime);

    // Update minimap
    this.miniMap.update(deltaTime);

    // Update current run panel (Week 4)
    this.currentRunPanel.update(deltaTime, gameTime);

    // Update planning panel (Week 5, only if visible for performance)
    if (this.planningPanel.isVisible()) {
      this.planningPanel.update(deltaTime, gameTime);
    }

    // Update multi-agent panel (Week 6, only if visible for performance)
    if (this.multiAgentPanel.isVisible()) {
      this.multiAgentPanel.update(deltaTime, gameTime);
    }

    // Update conversation panel (Week 7, only if visible for performance)
    if (this.conversationPanel.isVisible()) {
      this.conversationPanel.update(deltaTime, gameTime);
    }

    // Update reflection tree panel (Week 8, only if visible for performance)
    if (this.reflectionTreePanel.isVisible()) {
      this.reflectionTreePanel.update(deltaTime);
    }

    // Update location tree panel (Week 9, only if visible for performance)
    if (this.locationTreePanel.isVisible()) {
      this.locationTreePanel.update(deltaTime);
    }

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

    // Update drag manager screen dimensions - DISABLED
    // this.panelDragManager.updateScreenDimensions(width, height);

    // Reposition all UI elements
    this.positionUIElements();

    console.log(`🎨 UI resized to ${width}×${height}`);
  }

  /**
   * Set data collector for current run panel (Week 4)
   */
  setDataCollector(collector: DataCollector | null): void {
    this.currentRunPanel.setDataCollector(collector);
  }

  /**
   * Set agent manager for multi-agent support (Week 6)
   */
  setAgentManager(manager: AgentManager | null): void {
    this.multiAgentPanel.setAgentManager(manager);
    this.survivalPanel.setAgentManager(manager);
    this.miniMap.setAgentManager(manager); // Week 6: Wire to minimap for entrance visualization
  }

  /**
   * Set conversation manager for dialogue support (Week 7)
   */
  setConversationManager(manager: ConversationManager | null): void {
    this.conversationPanel.setConversationManager(manager);
  }

  /**
   * Set reflection system for reflection tree support (Week 8)
   */
  setReflectionSystem(reflectionSystem: any): void {
    this.reflectionTreePanel.setReflectionSystem(reflectionSystem);
  }

  /**
   * Set world hierarchy for location tree support (Week 9)
   */
  setWorldHierarchy(worldHierarchy: WorldHierarchy | null, agent: Agent | null): void {
    this.locationTreePanel.setWorldHierarchy(worldHierarchy);
    this.locationTreePanel.setAgent(agent);
  }

  /**
   * Show all UI components
   */
  showAll(): void {
    this.survivalPanel.setVisible(true);
    this.miniMap.setVisible(true);
    // Debug and controls remain toggle-able
  }

  /**
   * Hide all UI components
   */
  hideAll(): void {
    this.survivalPanel.setVisible(false);
    this.miniMap.setVisible(false);
    this.debugPanel.setVisible(false);
    this.controlsOverlay.hide();
  }

  /**
   * Toggle minimap visibility
   */
  toggleMiniMap(): void {
    const currentlyVisible = this.miniMap.getWidth() > 0; // Hacky check
    this.miniMap.setVisible(!currentlyVisible);
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
