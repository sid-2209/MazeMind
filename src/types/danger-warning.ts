// src/types/danger-warning.ts
/**
 * Danger Warning & Safety Communication Types
 *
 * Enables agents to warn each other about dangers discovered during exploration.
 * Implements information diffusion from Park et al. (2023) adapted for maze safety.
 */

import { Position } from './index';

export type DangerType =
  | 'TRAP'               // Physical trap (pressure plate, spikes, etc.)
  | 'DEAD_END'           // Path that leads nowhere
  | 'RESOURCE_DEPLETED'  // Empty resource location
  | 'HEALTH_CRITICAL'    // Area that causes health loss
  | 'STARVATION_ZONE'    // Area where agent starved
  | 'EXHAUSTION_ZONE'    // Area where agent collapsed
  | 'ENVIRONMENTAL';     // Other environmental hazards

export interface DangerWarning {
  id: string;
  type: DangerType;
  location: Position;
  severity: number;  // 1-10
  description: string;
  witnessedBy: string;  // Agent ID
  witnessedByName: string;  // Agent name for display
  timestamp: number;

  // How the danger was discovered
  discoveryMethod: 'DIRECT_EXPERIENCE' | 'OBSERVATION' | 'TOLD_BY_TEAMMATE';

  // If agent died or was seriously hurt
  causesDeath: boolean;
  healthImpact?: number;  // HP lost (if applicable)
}

export interface DangerBroadcast {
  warning: DangerWarning;
  broadcaster: string;  // Agent broadcasting the warning
  recipients: string[];  // Agent IDs who received it
  broadcastTime: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SafetyStatus {
  agentId: string;
  isInDanger: boolean;
  currentThreats: DangerWarning[];
  nearbyThreats: DangerWarning[];  // Within warning distance
  totalWarningsReceived: number;
  totalWarningsBroadcast: number;
  lastWarningTime: number;
}
