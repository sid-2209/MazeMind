// src/core/TimeManager.ts
/**
 * TimeManager - Game time and day/night cycle management
 * 
 * Manages:
 * - Game time progression (accelerated from real time)
 * - Day/night cycle transitions
 * - Time of day calculations
 * - Brightness levels based on time
 * - Time-based events
 * 
 * Week 1, Day 7: Basic time cycle and lighting
 * Week 2+: Sleep mechanics, time-based survival effects
 */

import { TimeOfDay, TimePeriod, TimeConfig } from '../types';
import { GAME_CONFIG } from '../config/game.config';

export class TimeManager {
  // Configuration
  private config: TimeConfig;
  
  // Time state
  private gameTimeElapsed: number = 0;      // Total game seconds elapsed
  private realTimeElapsed: number = 0;      // Total real seconds elapsed
  private currentTimeOfDay: TimeOfDay;
  private timeScale: number;                // Current time acceleration
  
  // Cycle tracking
  private dayCount: number = 0;
  private currentCycle: number = 0;         // 0-1440 (minutes in 24 hours)
  
  // Pause state
  private isPaused: boolean = false;
  
  // Callbacks for time events
  private onTimeChangeCallbacks: ((timeOfDay: TimeOfDay) => void)[] = [];
  private onPeriodChangeCallbacks: ((period: TimePeriod) => void)[] = [];
  
  constructor(config: TimeConfig = GAME_CONFIG.time) {
    this.config = config;
    this.timeScale = config.timeAcceleration;
    
    // Start at dawn (6:00 AM game time)
    this.currentCycle = 360; // 6 hours * 60 minutes
    this.currentTimeOfDay = this.calculateTimeOfDay();
    
    console.log('⏰ TimeManager created');
    console.log(`   Time scale: ${this.timeScale}x (1 real sec = ${this.timeScale} game sec)`);
    console.log(`   Starting time: ${this.getFormattedTime()}`);
  }
  
  /**
   * Update time (called every frame)
   * @param deltaTime - Real time since last frame (seconds)
   */
  update(deltaTime: number): void {
    if (this.isPaused) return;
    
    // Track real time
    this.realTimeElapsed += deltaTime;
    
    // Calculate game time delta
    const gameTimeDelta = deltaTime * this.timeScale;
    this.gameTimeElapsed += gameTimeDelta;
    
    // Update cycle (in minutes)
    const previousPeriod = this.currentTimeOfDay.period;
    
    this.currentCycle += gameTimeDelta / 60; // Convert seconds to minutes
    
    // Handle day rollover
    if (this.currentCycle >= this.config.fullCycle) {
      this.currentCycle -= this.config.fullCycle;
      this.dayCount++;
      console.log(`🌅 Day ${this.dayCount + 1} begins`);
    }
    
    // Recalculate time of day
    this.currentTimeOfDay = this.calculateTimeOfDay();
    
    // Check for period change
    if (this.currentTimeOfDay.period !== previousPeriod) {
      this.handlePeriodChange(this.currentTimeOfDay.period);
    }
    
    // Notify time change listeners
    this.notifyTimeChange();
  }
  
  /**
   * Calculate time of day based on current cycle
   */
  private calculateTimeOfDay(): TimeOfDay {
    const cycleMinutes = this.currentCycle;
    const hour = cycleMinutes / 60; // 0-24
    
    // Define periods
    // Dawn:  5:00 - 7:00   (300-420 minutes)
    // Day:   7:00 - 17:00  (420-1020 minutes)
    // Dusk:  17:00 - 19:00 (1020-1140 minutes)
    // Night: 19:00 - 5:00  (1140-300 minutes, wraps around)
    
    let period: TimePeriod;
    let brightness: number;
    
    if (cycleMinutes >= 300 && cycleMinutes < 420) {
      // Dawn (5 AM - 7 AM)
      period = TimePeriod.DAWN;
      // Gradual brightening
      const dawnProgress = (cycleMinutes - 300) / 120; // 0-1
      brightness = 0.3 + (0.4 * dawnProgress); // 0.3 → 0.7
    } else if (cycleMinutes >= 420 && cycleMinutes < 1020) {
      // Day (7 AM - 5 PM)
      period = TimePeriod.DAY;
      // Full brightness, slight variation for realism
      const dayProgress = (cycleMinutes - 420) / 600;
      brightness = 0.95 + (Math.sin(dayProgress * Math.PI) * 0.05); // 0.9-1.0
    } else if (cycleMinutes >= 1020 && cycleMinutes < 1140) {
      // Dusk (5 PM - 7 PM)
      period = TimePeriod.DUSK;
      // Gradual darkening
      const duskProgress = (cycleMinutes - 1020) / 120; // 0-1
      brightness = 0.7 - (0.4 * duskProgress); // 0.7 → 0.3
    } else {
      // Night (7 PM - 5 AM)
      period = TimePeriod.NIGHT;
      brightness = 0.3; // Dark
    }
    
    return {
      period,
      brightness,
      hour
    };
  }
  
  /**
   * Handle period change (dawn/day/dusk/night transition)
   */
  private handlePeriodChange(newPeriod: TimePeriod): void {
    const periodNames = {
      [TimePeriod.DAWN]: '🌅 Dawn',
      [TimePeriod.DAY]: '☀️ Day',
      [TimePeriod.DUSK]: '🌆 Dusk',
      [TimePeriod.NIGHT]: '🌙 Night'
    };

    console.log(`${periodNames[newPeriod]} begins at ${this.getFormattedTime()}`);

    // Notify listeners
    this.onPeriodChangeCallbacks.forEach(callback => callback(newPeriod));
  }
  
  /**
   * Notify time change listeners
   */
  private notifyTimeChange(): void {
    this.onTimeChangeCallbacks.forEach(callback => callback(this.currentTimeOfDay));
  }
  
  /**
   * Get formatted time string (HH:MM AM/PM)
   */
  getFormattedTime(): string {
    const totalMinutes = this.currentCycle;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    
    // Convert to 12-hour format
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours < 12 ? 'AM' : 'PM';
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  
  /**
   * Get current time of day
   */
  getTimeOfDay(): TimeOfDay {
    return { ...this.currentTimeOfDay };
  }
  
  /**
   * Get current brightness (0-1)
   */
  getBrightness(): number {
    return this.currentTimeOfDay.brightness;
  }
  
  /**
   * Get current period
   */
  getPeriod(): TimePeriod {
    return this.currentTimeOfDay.period;
  }
  
  /**
   * Get current hour (0-24)
   */
  getHour(): number {
    return this.currentTimeOfDay.hour;
  }
  
  /**
   * Get game time elapsed (seconds)
   */
  getGameTime(): number {
    return this.gameTimeElapsed;
  }
  
  /**
   * Get real time elapsed (seconds)
   */
  getRealTime(): number {
    return this.realTimeElapsed;
  }
  
  /**
   * Get current day count (0-indexed)
   */
  getDayCount(): number {
    return this.dayCount;
  }
  
  /**
   * Check if it's daytime
   */
  isDaytime(): boolean {
    return this.currentTimeOfDay.period === TimePeriod.DAY ||
           this.currentTimeOfDay.period === TimePeriod.DAWN;
  }
  
  /**
   * Check if it's nighttime
   */
  isNighttime(): boolean {
    return this.currentTimeOfDay.period === TimePeriod.NIGHT ||
           this.currentTimeOfDay.period === TimePeriod.DUSK;
  }
  
  /**
   * Set time scale (speed multiplier)
   */
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(100, scale));
    console.log(`⏰ Time scale set to ${this.timeScale}x`);
  }
  
  /**
   * Get current time scale
   */
  getTimeScale(): number {
    return this.timeScale;
  }
  
  /**
   * Pause time
   */
  pause(): void {
    this.isPaused = true;
    console.log('⏸️  Time paused');
  }
  
  /**
   * Resume time
   */
  resume(): void {
    this.isPaused = false;
    console.log('▶️  Time resumed');
  }
  
  /**
   * Toggle pause
   */
  togglePause(): void {
    this.isPaused = !this.isPaused;
    console.log(this.isPaused ? '⏸️  Time paused' : '▶️  Time resumed');
  }
  
  /**
   * Check if paused
   */
  isPausedState(): boolean {
    return this.isPaused;
  }
  
  /**
   * Set specific time (for debugging/testing)
   * @param hour - Hour (0-23)
   * @param minute - Minute (0-59)
   */
  setTime(hour: number, minute: number = 0): void {
    this.currentCycle = (hour * 60) + minute;
    if (this.currentCycle >= this.config.fullCycle) {
      this.currentCycle = this.currentCycle % this.config.fullCycle;
    }
    this.currentTimeOfDay = this.calculateTimeOfDay();
    console.log(`⏰ Time set to ${this.getFormattedTime()}`);
  }
  
  /**
   * Skip to next period (for testing)
   */
  skipToNextPeriod(): void {
    const currentPeriod = this.currentTimeOfDay.period;
    
    switch (currentPeriod) {
      case TimePeriod.DAWN:
        this.setTime(7, 0); // Skip to day
        break;
      case TimePeriod.DAY:
        this.setTime(17, 0); // Skip to dusk
        break;
      case TimePeriod.DUSK:
        this.setTime(19, 0); // Skip to night
        break;
      case TimePeriod.NIGHT:
        this.setTime(5, 0); // Skip to dawn
        break;
    }
  }
  
  /**
   * Register callback for time changes
   */
  onTimeChange(callback: (timeOfDay: TimeOfDay) => void): void {
    this.onTimeChangeCallbacks.push(callback);
  }
  
  /**
   * Register callback for period changes
   */
  onPeriodChange(callback: (period: TimePeriod) => void): void {
    this.onPeriodChangeCallbacks.push(callback);
  }
  
  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `Time: ${this.getFormattedTime()}
Period: ${this.currentTimeOfDay.period}
Brightness: ${(this.currentTimeOfDay.brightness * 100).toFixed(0)}%
Day: ${this.dayCount + 1}
Game Time: ${(this.gameTimeElapsed / 60).toFixed(1)} min
Real Time: ${this.realTimeElapsed.toFixed(1)} sec
Time Scale: ${this.timeScale}x
Paused: ${this.isPaused}`;
  }
}
