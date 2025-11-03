// src/ui/ViewModeManager.ts
/**
 * ViewModeManager - Manages view mode switching
 * 
 * Manages:
 * - View mode state (Agent POV, God Mode, Mixed, Debug)
 * - Mode switching logic
 * - Visual indicators for current mode
 * - Mode-specific rendering adjustments
 * 
 * Week 1, Day 8: Basic view modes
 * Week 2+: Advanced debug visualizations
 */

import { Container } from 'pixi.js';
import { ViewMode } from '../types';
import { FogOfWar } from '../rendering/FogOfWar';

export class ViewModeManager {
  private fogOfWar: FogOfWar | null = null;

  // Current mode
  private currentMode: ViewMode = ViewMode.AGENT_POV;

  // Callbacks
  private onModeChangeCallbacks: ((mode: ViewMode) => void)[] = [];

  // Mode descriptions
  private readonly MODE_INFO = {
    [ViewMode.AGENT_POV]: {
      name: 'Agent POV',
      icon: '👁️',
      description: 'See only what Arth can see',
      color: 0x00aaff,
    },
    [ViewMode.GOD_MODE]: {
      name: 'God Mode',
      icon: '🔮',
      description: 'See the entire maze',
      color: 0xffaa00,
    },
    [ViewMode.MIXED_MODE]: {
      name: 'Mixed Mode',
      icon: '🌓',
      description: 'See explored areas',
      color: 0xaa00ff,
    },
    [ViewMode.DEBUG_MODE]: {
      name: 'Debug Mode',
      icon: '🔧',
      description: 'Developer view with data',
      color: 0x00ff00,
    },
    [ViewMode.REPLAY_MODE]: {
      name: 'Replay Mode',
      icon: '🎬',
      description: 'Watch recorded gameplay',
      color: 0xff0000,
    },
  };

  constructor(_uiContainer: Container) {
    console.log('🎭 ViewModeManager created');
  }
  
  /**
   * Initialize view mode manager
   */
  async init(): Promise<void> {
    console.log('🎭 Initializing view mode manager...');

    // Set initial mode
    this.setMode(ViewMode.AGENT_POV, true);

    console.log('✅ View mode manager initialized');
  }

  /**
   * Set fog of war system reference
   */
  setFogOfWar(fogOfWar: FogOfWar): void {
    this.fogOfWar = fogOfWar;
  }
  
  /**
   * Set view mode
   */
  setMode(mode: ViewMode, silent: boolean = false): void {
    const previousMode = this.currentMode;
    this.currentMode = mode;

    // Update fog of war
    if (this.fogOfWar) {
      this.fogOfWar.setViewMode(mode);
    }

    // Log change
    if (!silent) {
      const info = this.MODE_INFO[mode];
      console.log(`🎭 View mode: ${info.icon} ${info.name}`);
    }

    // Notify listeners
    if (previousMode !== mode) {
      this.notifyModeChange(mode);
    }
  }
  
  /**
   * Cycle to next view mode
   */
  nextMode(): void {
    const modes = [
      ViewMode.AGENT_POV,
      ViewMode.GOD_MODE,
      ViewMode.MIXED_MODE,
      ViewMode.DEBUG_MODE,
    ];
    
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    this.setMode(modes[nextIndex]);
  }
  
  /**
   * Cycle to previous view mode
   */
  previousMode(): void {
    const modes = [
      ViewMode.AGENT_POV,
      ViewMode.GOD_MODE,
      ViewMode.MIXED_MODE,
      ViewMode.DEBUG_MODE,
    ];
    
    const currentIndex = modes.indexOf(this.currentMode);
    const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
    
    this.setMode(modes[prevIndex]);
  }
  
  /**
   * Get current mode
   */
  getMode(): ViewMode {
    return this.currentMode;
  }
  
  /**
   * Get mode name
   */
  getModeName(): string {
    return this.MODE_INFO[this.currentMode].name;
  }
  
  /**
   * Check if in god mode
   */
  isGodMode(): boolean {
    return this.currentMode === ViewMode.GOD_MODE;
  }
  
  /**
   * Check if in debug mode
   */
  isDebugMode(): boolean {
    return this.currentMode === ViewMode.DEBUG_MODE;
  }
  
  /**
   * Register callback for mode changes
   */
  onModeChange(callback: (mode: ViewMode) => void): void {
    this.onModeChangeCallbacks.push(callback);
  }
  
  /**
   * Notify mode change listeners
   */
  private notifyModeChange(mode: ViewMode): void {
    this.onModeChangeCallbacks.forEach(callback => callback(mode));
  }
  
  /**
   * Update (called every frame)
   */
  update(_deltaTime: number): void {
    // Future: animations, transitions, etc.
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    console.log('🎭 Destroying view mode manager...');

    this.onModeChangeCallbacks = [];
  }
  
  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const info = this.MODE_INFO[this.currentMode];
    return `View Mode: ${info.icon} ${info.name}
Description: ${info.description}`;
  }
}