/**
 * Resource Manager
 *
 * Manages the agent's survival resources (hunger, thirst, energy).
 * Handles depletion over time, restoration from items, and critical state detection.
 */

import { SurvivalState, DEFAULT_SURVIVAL_STATE } from './SurvivalState';

export class ResourceManager {
  private state: SurvivalState;

  constructor(initialState: SurvivalState = DEFAULT_SURVIVAL_STATE) {
    this.state = { ...initialState };
    this.state.lastUpdate = Date.now();
  }

  /**
   * Update resource levels based on elapsed time
   * @param deltaTime - Time elapsed since last update (seconds)
   * @param timeScale - Time scale multiplier (e.g., 10x = 10)
   */
  update(deltaTime: number, timeScale: number = 1): void {
    // Convert to minutes with time scale applied
    const minutes = (deltaTime * timeScale) / 60;

    // Deplete resources (can't go below 0)
    this.state.hunger = Math.max(0, this.state.hunger - this.state.hungerRate * minutes);
    this.state.thirst = Math.max(0, this.state.thirst - this.state.thirstRate * minutes);
    this.state.energy = Math.max(0, this.state.energy - this.state.energyRate * minutes);

    // Update status flags
    this.state.isStarving = this.state.hunger < 10;
    this.state.isDehydrated = this.state.thirst < 10;
    this.state.isExhausted = this.state.energy < 10;
    this.state.isDead = this.state.hunger === 0 || this.state.thirst === 0 || this.state.energy === 0;

    // Update timers
    this.state.survivalTime += deltaTime;
    this.state.lastUpdate = Date.now();
  }

  /**
   * Restore resources (from consuming items)
   * @param amounts - Resource amounts to restore
   */
  restore(amounts: { hunger?: number; thirst?: number; energy?: number }): void {
    if (amounts.hunger !== undefined) {
      this.state.hunger = Math.min(100, this.state.hunger + amounts.hunger);
    }

    if (amounts.thirst !== undefined) {
      this.state.thirst = Math.min(100, this.state.thirst + amounts.thirst);
    }

    if (amounts.energy !== undefined) {
      this.state.energy = Math.min(100, this.state.energy + amounts.energy);
    }

    // Update status flags after restoration
    this.state.isStarving = this.state.hunger < 10;
    this.state.isDehydrated = this.state.thirst < 10;
    this.state.isExhausted = this.state.energy < 10;

    // Can't un-die, but update flag for safety
    if (this.state.hunger > 0 && this.state.thirst > 0 && this.state.energy > 0) {
      this.state.isDead = false;
    }
  }

  /**
   * Get current resource levels (read-only)
   */
  getState(): Readonly<SurvivalState> {
    return this.state;
  }

  /**
   * Check if agent is in critical condition
   * Critical = any resource below 20
   */
  isCritical(): boolean {
    return this.state.hunger < 20 || this.state.thirst < 20 || this.state.energy < 20;
  }

  /**
   * Get most urgent need based on lowest resource
   * Returns null if all resources are above 30%
   */
  getMostUrgentNeed(): 'hunger' | 'thirst' | 'energy' | null {
    if (this.state.isDead) return null;

    const needs = [
      { type: 'thirst' as const, value: this.state.thirst },
      { type: 'hunger' as const, value: this.state.hunger },
      { type: 'energy' as const, value: this.state.energy }
    ];

    // Sort by lowest value (most urgent)
    needs.sort((a, b) => a.value - b.value);

    // Only return if critically low (< 30%)
    return needs[0].value < 30 ? needs[0].type : null;
  }

  /**
   * Get resource level for specific need
   */
  getResourceLevel(need: 'hunger' | 'thirst' | 'energy'): number {
    switch (need) {
      case 'hunger':
        return this.state.hunger;
      case 'thirst':
        return this.state.thirst;
      case 'energy':
        return this.state.energy;
    }
  }

  /**
   * Check if agent is dead
   */
  isDead(): boolean {
    return this.state.isDead;
  }

  /**
   * Get survival time in seconds
   */
  getSurvivalTime(): number {
    return this.state.survivalTime;
  }

  /**
   * Get survival time formatted as MM:SS
   */
  getSurvivalTimeFormatted(): string {
    const minutes = Math.floor(this.state.survivalTime / 60);
    const seconds = Math.floor(this.state.survivalTime % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Reset survival state to initial values
   */
  reset(): void {
    this.state = { ...DEFAULT_SURVIVAL_STATE };
    this.state.lastUpdate = Date.now();
  }

  /**
   * Set custom depletion rates (for difficulty adjustment)
   */
  setDepletionRates(rates: { hunger?: number; thirst?: number; energy?: number }): void {
    if (rates.hunger !== undefined) {
      this.state.hungerRate = rates.hunger;
    }
    if (rates.thirst !== undefined) {
      this.state.thirstRate = rates.thirst;
    }
    if (rates.energy !== undefined) {
      this.state.energyRate = rates.energy;
    }
  }
}
