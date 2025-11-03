// src/rendering/LightingSystem.ts
/**
 * LightingSystem - Dynamic lighting and atmosphere
 * 
 * Manages:
 * - Ambient lighting based on time of day
 * - Color temperature transitions
 * - Darkness overlay
 * - Lighting effects on tiles
 * - Smooth transitions between periods
 * 
 * Week 1, Day 7: Basic lighting and ambience
 * Week 1, Day 8+: Advanced effects (shadows, fog, particles)
 */

import { Container, Graphics } from 'pixi.js';
import { TimeOfDay, TimePeriod } from '../types';
import { TimeManager } from '../core/TimeManager';

export class LightingSystem {
  private container: Container;
  private timeManager: TimeManager;

  // Lighting layers
  private ambientOverlay: Graphics = new Graphics();
  
  // Current lighting state
  private currentBrightness: number = 1.0;
  private currentTint: number = 0xffffff;
  private targetBrightness: number = 1.0;
  private targetTint: number = 0xffffff;
  
  // Transition smoothing
  private transitionSpeed: number = 0.5; // Lower = slower, smoother
  
  // Lighting presets for each period
  private readonly LIGHTING_PRESETS = {
    [TimePeriod.DAWN]: {
      tint: 0xffaa88,      // Warm orange-pink
      brightness: 0.7,
      ambientAlpha: 0.3,
    },
    [TimePeriod.DAY]: {
      tint: 0xffffff,      // Pure white (no tint)
      brightness: 1.0,
      ambientAlpha: 0.0,   // No overlay
    },
    [TimePeriod.DUSK]: {
      tint: 0xff8844,      // Orange-red sunset
      brightness: 0.7,
      ambientAlpha: 0.3,
    },
    [TimePeriod.NIGHT]: {
      tint: 0x4466aa,      // Cool blue moonlight
      brightness: 0.3,
      ambientAlpha: 0.7,   // Heavy darkness
    },
  };
  
  constructor(container: Container, timeManager: TimeManager) {
    this.container = container;
    this.timeManager = timeManager;
    
    console.log('💡 LightingSystem created');
  }
  
  /**
   * Initialize lighting system
   */
  async init(): Promise<void> {
    console.log('💡 Initializing lighting system...');
    
    // Create ambient overlay (darkness layer)
    this.createAmbientOverlay();
    
    // Set initial lighting based on current time
    const initialTime = this.timeManager.getTimeOfDay();
    this.setLightingForPeriod(initialTime.period, true);
    
    // Register for time changes
    this.timeManager.onTimeChange((timeOfDay) => {
      this.updateLighting(timeOfDay);
    });
    
    console.log('✅ Lighting system initialized');
  }
  
  /**
   * Create ambient lighting overlay
   */
  private createAmbientOverlay(): void {
    this.ambientOverlay = new Graphics();
    
    // Full screen black rectangle
    // Will be updated each frame with appropriate alpha
    this.container.addChild(this.ambientOverlay);
  }
  
  /**
   * Update lighting overlay dimensions
   */
  updateOverlaySize(width: number, height: number): void {
    // Redraw overlay to new size
    this.ambientOverlay.clear();
    this.ambientOverlay.beginFill(0x000000);
    this.ambientOverlay.drawRect(0, 0, width, height);
    this.ambientOverlay.endFill();
  }
  
  /**
   * Update lighting (called every frame)
   */
  update(_deltaTime: number): void {
    // Smooth transition to target brightness
    const brightnessChange = (this.targetBrightness - this.currentBrightness) * this.transitionSpeed;
    this.currentBrightness += brightnessChange;

    // Smooth transition to target tint
    this.currentTint = this.lerpColor(this.currentTint, this.targetTint, this.transitionSpeed);

    // Apply lighting
    this.applyLighting();
  }
  
  /**
   * Update lighting based on time of day
   */
  private updateLighting(timeOfDay: TimeOfDay): void {
    this.setLightingForPeriod(timeOfDay.period, false);
  }
  
  /**
   * Set lighting for specific period
   * @param period - Time period
   * @param immediate - If true, skip smooth transition
   */
  private setLightingForPeriod(period: TimePeriod, immediate: boolean = false): void {
    const preset = this.LIGHTING_PRESETS[period];
    
    this.targetBrightness = preset.brightness;
    this.targetTint = preset.tint;
    
    if (immediate) {
      this.currentBrightness = this.targetBrightness;
      this.currentTint = this.targetTint;
      this.applyLighting();
    }
  }
  
  /**
   * Apply current lighting to the scene
   */
  private applyLighting(): void {
    // Note: Tinting would require applying to individual children in PixiJS v7
    // For now, we use the overlay alpha for darkness effect

    // Calculate ambient overlay alpha based on brightness
    // Lower brightness = more darkness overlay
    const overlayAlpha = 1 - this.currentBrightness;
    this.ambientOverlay.alpha = overlayAlpha;
  }
  
  /**
   * Interpolate between two colors
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
   * Get current brightness (0-1)
   */
  getBrightness(): number {
    return this.currentBrightness;
  }
  
  /**
   * Get current tint color
   */
  getTint(): number {
    return this.currentTint;
  }
  
  /**
   * Set transition speed
   * @param speed - 0-1, lower = slower/smoother
   */
  setTransitionSpeed(speed: number): void {
    this.transitionSpeed = Math.max(0.01, Math.min(1, speed));
  }
  
  /**
   * Manually set brightness (for special effects)
   */
  setBrightness(brightness: number, immediate: boolean = false): void {
    this.targetBrightness = Math.max(0, Math.min(1, brightness));
    
    if (immediate) {
      this.currentBrightness = this.targetBrightness;
      this.applyLighting();
    }
  }
  
  /**
   * Manually set tint (for special effects)
   */
  setTint(tint: number, immediate: boolean = false): void {
    this.targetTint = tint;
    
    if (immediate) {
      this.currentTint = this.targetTint;
      this.applyLighting();
    }
  }
  
  /**
   * Flash effect (for lightning, explosions, etc.)
   */
  flash(duration: number = 0.2, brightness: number = 1.5): void {
    const originalBrightness = this.targetBrightness;
    
    // Bright flash
    this.setBrightness(brightness, true);
    
    // Return to normal after duration
    setTimeout(() => {
      this.setBrightness(originalBrightness, false);
    }, duration * 1000);
  }
  
  /**
   * Fade to black (for transitions, death, etc.)
   */
  fadeToBlack(duration: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      const startBrightness = this.currentBrightness;
      const startTime = Date.now();
      
      const fadeInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        
        this.setBrightness(startBrightness * (1 - progress), true);
        
        if (progress >= 1) {
          clearInterval(fadeInterval);
          resolve();
        }
      }, 16); // ~60 FPS
    });
  }
  
  /**
   * Fade from black
   */
  fadeFromBlack(duration: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      this.setBrightness(0, true);
      
      const targetBrightness = this.timeManager.getBrightness();
      const startTime = Date.now();
      
      const fadeInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        
        this.setBrightness(targetBrightness * progress, true);
        
        if (progress >= 1) {
          clearInterval(fadeInterval);
          resolve();
        }
      }, 16);
    });
  }
  
  /**
   * Reset lighting to current time of day
   */
  reset(): void {
    const currentTime = this.timeManager.getTimeOfDay();
    this.setLightingForPeriod(currentTime.period, true);
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    console.log('💡 Destroying lighting system...');
    
    if (this.ambientOverlay) {
      this.ambientOverlay.destroy();
    }
  }
  
  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `Brightness: ${(this.currentBrightness * 100).toFixed(0)}%
Tint: #${this.currentTint.toString(16).padStart(6, '0')}
Target Brightness: ${(this.targetBrightness * 100).toFixed(0)}%
Overlay Alpha: ${this.ambientOverlay.alpha.toFixed(2)}`;
  }
}
