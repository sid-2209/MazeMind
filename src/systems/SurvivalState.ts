/**
 * Survival State Interface
 *
 * Defines the survival mechanics state for the agent, including resources,
 * depletion rates, status flags, and timers.
 */

export interface SurvivalState {
  // Core resources (0-100 scale)
  hunger: number;      // 100 = full, 0 = starving
  thirst: number;      // 100 = hydrated, 0 = dehydrated
  energy: number;      // 100 = rested, 0 = exhausted

  // Depletion rates (per minute of game time)
  hungerRate: number;  // Base: 0.1/min
  thirstRate: number;  // Base: 0.15/min (fastest depletion)
  energyRate: number;  // Base: 0.08/min

  // Status flags
  isStarving: boolean;   // hunger < 10
  isDehydrated: boolean; // thirst < 10
  isExhausted: boolean;  // energy < 10
  isDead: boolean;       // Any resource = 0

  // Timers
  lastUpdate: number;    // Timestamp of last update
  survivalTime: number;  // Total survival time in seconds
}

/**
 * Default initial survival state
 * Agent starts fully resourced with standard depletion rates
 */
export const DEFAULT_SURVIVAL_STATE: SurvivalState = {
  hunger: 100,
  thirst: 100,
  energy: 100,
  hungerRate: 0.1,
  thirstRate: 0.15,
  energyRate: 0.08,
  isStarving: false,
  isDehydrated: false,
  isExhausted: false,
  isDead: false,
  lastUpdate: 0,
  survivalTime: 0
};

/**
 * Expected survival times (no items consumed):
 * - Hunger: 100 / 0.1 = 1000 minutes = 16.7 hours
 * - Thirst: 100 / 0.15 = 666 minutes = 11.1 hours (bottleneck)
 * - Energy: 100 / 0.08 = 1250 minutes = 20.8 hours
 *
 * At 10x time scale:
 * - Real survival time: 11.1 hours / 10 = 66.6 minutes = ~1 hour
 */
