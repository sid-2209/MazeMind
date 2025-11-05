/**
 * Stress Manager
 *
 * Calculates stress level from multiple factors:
 * - Resource depletion (hunger, thirst, energy)
 * - Exploration time (increases over time)
 *
 * Stress affects cognitive performance, reducing memory retrieval
 * quality and planning effectiveness.
 */

import { SurvivalState } from './SurvivalState';

export interface StressState {
  // Overall stress level (0-100)
  stressLevel: number;

  // Contributing factors (0-1 scale)
  hungerStress: number;
  thirstStress: number;
  energyStress: number;
  explorationStress: number;

  // Status flags
  isCriticalStress: boolean;  // stress > 80
  isMentalBreakdown: boolean; // stress >= 100

  // Weights for stress calculation
  weights: {
    hunger: number;      // Default: 0.3
    thirst: number;      // Default: 0.4 (most urgent)
    energy: number;      // Default: 0.2
    exploration: number; // Default: 0.1
  };
}

export class StressManager {
  private state: StressState = {
    stressLevel: 0,
    hungerStress: 0,
    thirstStress: 0,
    energyStress: 0,
    explorationStress: 0,
    isCriticalStress: false,
    isMentalBreakdown: false,
    weights: {
      hunger: 0.3,
      thirst: 0.4,
      energy: 0.2,
      exploration: 0.1
    }
  };

  /**
   * Calculate stress from survival state and exploration time
   * @param survivalState - Current survival resources
   * @param explorationTime - Time spent exploring (seconds)
   * @returns Current stress level (0-100)
   */
  calculateStress(survivalState: SurvivalState, explorationTime: number): number {
    // Calculate individual stress factors (inverse of resource levels)
    // 100 resources = 0 stress, 0 resources = 1.0 stress
    this.state.hungerStress = 1 - (survivalState.hunger / 100);
    this.state.thirstStress = 1 - (survivalState.thirst / 100);
    this.state.energyStress = 1 - (survivalState.energy / 100);

    // Exploration stress increases over time using sigmoid curve
    // Starts low, ramps up after 30 minutes of exploration
    // Formula: 1 / (1 + e^(-0.1 * (minutes - 30)))
    const explorationMinutes = explorationTime / 60;
    this.state.explorationStress = 1 / (1 + Math.exp(-0.1 * (explorationMinutes - 30)));

    // Weighted sum of all stress factors
    this.state.stressLevel = (
      this.state.hungerStress * this.state.weights.hunger +
      this.state.thirstStress * this.state.weights.thirst +
      this.state.energyStress * this.state.weights.energy +
      this.state.explorationStress * this.state.weights.exploration
    ) * 100;

    // Clamp to 0-100 range
    this.state.stressLevel = Math.max(0, Math.min(100, this.state.stressLevel));

    // Update status flags
    this.state.isCriticalStress = this.state.stressLevel > 80;
    this.state.isMentalBreakdown = this.state.stressLevel >= 100;

    return this.state.stressLevel;
  }

  /**
   * Get stress modifier for cognitive functions
   * High stress reduces cognitive performance
   * @returns Modifier between 0.5 (max stress) and 1.0 (no stress)
   */
  getStressModifier(): number {
    // Linear decay from 1.0 (no stress) to 0.5 (max stress)
    // This means at 100% stress, cognitive performance is at 50%
    return 1.0 - (this.state.stressLevel / 100) * 0.5;
  }

  /**
   * Get current stress state (read-only)
   */
  getState(): Readonly<StressState> {
    return this.state;
  }

  /**
   * Get stress level (0-100)
   */
  getStressLevel(): number {
    return this.state.stressLevel;
  }

  /**
   * Get stress level category for UI display
   */
  getStressCategory(): 'none' | 'low' | 'moderate' | 'high' | 'critical' {
    if (this.state.stressLevel < 20) return 'none';
    if (this.state.stressLevel < 40) return 'low';
    if (this.state.stressLevel < 60) return 'moderate';
    if (this.state.stressLevel < 80) return 'high';
    return 'critical';
  }

  /**
   * Check if agent is in critical stress
   */
  isCritical(): boolean {
    return this.state.isCriticalStress;
  }

  /**
   * Check if agent has mental breakdown
   */
  hasMentalBreakdown(): boolean {
    return this.state.isMentalBreakdown;
  }

  /**
   * Get dominant stress factor (highest contributor)
   */
  getDominantStressFactor(): 'hunger' | 'thirst' | 'energy' | 'exploration' {
    const factors = [
      { type: 'hunger' as const, value: this.state.hungerStress * this.state.weights.hunger },
      { type: 'thirst' as const, value: this.state.thirstStress * this.state.weights.thirst },
      { type: 'energy' as const, value: this.state.energyStress * this.state.weights.energy },
      { type: 'exploration' as const, value: this.state.explorationStress * this.state.weights.exploration }
    ];

    factors.sort((a, b) => b.value - a.value);
    return factors[0].type;
  }

  /**
   * Set custom stress weights (for difficulty adjustment)
   */
  setWeights(weights: Partial<StressState['weights']>): void {
    this.state.weights = { ...this.state.weights, ...weights };
  }

  /**
   * Reset stress to initial state
   */
  reset(): void {
    this.state.stressLevel = 0;
    this.state.hungerStress = 0;
    this.state.thirstStress = 0;
    this.state.energyStress = 0;
    this.state.explorationStress = 0;
    this.state.isCriticalStress = false;
    this.state.isMentalBreakdown = false;
  }

  /**
   * Get stress color for UI (interpolated from green to red)
   */
  getStressColor(): number {
    // Green (low stress) to Yellow (moderate) to Red (high stress)
    if (this.state.stressLevel < 40) {
      // Green to Yellow
      const t = this.state.stressLevel / 40;
      return this.interpolateColor(0x00ff00, 0xffff00, t);
    } else {
      // Yellow to Red
      const t = (this.state.stressLevel - 40) / 60;
      return this.interpolateColor(0xffff00, 0xff0000, t);
    }
  }

  /**
   * Interpolate between two colors
   */
  private interpolateColor(color1: number, color2: number, t: number): number {
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
}
