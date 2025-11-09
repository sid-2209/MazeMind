// src/config/multi-agent.config.ts
/**
 * Multi-Agent Configuration (Week 6)
 *
 * Default agent configurations for the multi-agent simulation
 */

import { AgentConfig, PREDEFINED_AGENTS } from '../types/multi-agent';

/**
 * Get agent configurations based on selected agent count
 * Returns the first N predefined agents
 */
export function getSelectedAgentConfigs(count: number): AgentConfig[] {
  if (count < 1 || count > PREDEFINED_AGENTS.length) {
    console.warn(`Invalid agent count: ${count}, using 1`);
    count = 1;
  }

  return PREDEFINED_AGENTS.slice(0, count);
}

/**
 * Default: Three agents (Arth, Vani, Kael) for full multi-agent autonomy
 * Enables cooperative planning, danger communication, and role emergence
 */
export const DEFAULT_AGENT_COUNT = 3;

/**
 * Export predefined agents for external use
 */
export { PREDEFINED_AGENTS };
