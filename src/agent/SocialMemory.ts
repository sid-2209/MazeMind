// src/agent/SocialMemory.ts
/**
 * SocialMemory - Social relationship tracking system (Week 6, Day 4)
 *
 * Manages:
 * - Relationships with other agents (familiarity, affinity, trust)
 * - Interaction history
 * - Known facts about other agents
 * - Perceived traits and personality
 * - Relationship evolution over time
 */

import {
  SocialMemory as ISocialMemory,
  Interaction,
  InteractionType,
  MultiAgentConfig,
  DEFAULT_MULTI_AGENT_CONFIG,
} from '../types/multi-agent';

export class SocialMemory {
  // Map of agent ID -> social memory
  private socialMemories: Map<string, ISocialMemory> = new Map();

  // Configuration
  private config: MultiAgentConfig;

  // Owner agent ID (for context)
  private ownerAgentId: string;

  constructor(ownerAgentId: string, config: Partial<MultiAgentConfig> = {}) {
    this.ownerAgentId = ownerAgentId;
    this.config = { ...DEFAULT_MULTI_AGENT_CONFIG, ...config };
  }

  /**
   * Record an interaction with another agent
   */
  recordInteraction(
    otherAgentId: string,
    otherAgentName: string,
    interaction: Interaction
  ): void {
    // Get or create social memory for this agent
    let memory = this.socialMemories.get(otherAgentId);

    if (!memory) {
      // First meeting - create new social memory
      memory = this.createInitialSocialMemory(
        otherAgentId,
        otherAgentName,
        interaction
      );
      this.socialMemories.set(otherAgentId, memory);
      console.log(`🤝 ${this.ownerAgentId}: Created social memory for ${otherAgentName}`);
    } else {
      // Update existing relationship
      this.updateRelationship(memory, interaction);
    }

    // Add interaction to history
    memory.interactions.push(interaction);

    // Keep only last 50 interactions
    if (memory.interactions.length > 50) {
      memory.interactions = memory.interactions.slice(-50);
    }

    // Update recent interactions list (keep last 5 types)
    memory.relationship.recentInteractions.push(interaction.type);
    if (memory.relationship.recentInteractions.length > 5) {
      memory.relationship.recentInteractions = memory.relationship.recentInteractions.slice(-5);
    }
  }

  /**
   * Create initial social memory for first meeting
   */
  private createInitialSocialMemory(
    agentId: string,
    agentName: string,
    firstInteraction: Interaction
  ): ISocialMemory {
    return {
      agentId,
      agentName,
      agentColor: 0xffffff, // Will be updated later
      firstMet: firstInteraction.timestamp,
      relationship: {
        familiarity: 0.1, // Start with minimal familiarity
        affinity: this.config.defaultAffinity, // Neutral affinity
        trust: 0.5, // Moderate initial trust
        lastInteraction: firstInteraction.timestamp,
        interactionCount: 1,
        recentInteractions: [firstInteraction.type],
      },
      interactions: [firstInteraction],
      knownFacts: [],
      perceivedTraits: [],
    };
  }

  /**
   * Update relationship metrics based on interaction
   */
  private updateRelationship(memory: ISocialMemory, interaction: Interaction): void {
    const rel = memory.relationship;

    // Increase interaction count
    rel.interactionCount++;

    // Update last interaction time
    rel.lastInteraction = interaction.timestamp;

    // Update familiarity (increases with each interaction)
    const familiarityGain = this.config.familiarityGainRate;
    rel.familiarity = Math.min(1.0, rel.familiarity + familiarityGain);

    // Update affinity based on interaction valence
    const affinityChange = interaction.valence * 0.1; // ±10% per interaction
    rel.affinity = Math.max(-1.0, Math.min(1.0, rel.affinity + affinityChange));

    // Update trust based on interaction type and affinity
    let trustChange = 0;
    switch (interaction.type) {
      case InteractionType.HELPING:
        trustChange = 0.1; // Helping increases trust
        break;
      case InteractionType.ITEM_TAKEN:
        trustChange = -0.05; // Competition slightly decreases trust
        break;
      case InteractionType.DIALOGUE:
      case InteractionType.COORDINATION:
        trustChange = 0.05; // Positive social interactions increase trust
        break;
      case InteractionType.PROXIMITY:
      case InteractionType.OBSERVATION:
        trustChange = 0.01; // Passive interactions slightly increase trust
        break;
    }

    // Affinity influences trust change (positive affinity amplifies trust gain)
    trustChange *= (1 + rel.affinity * 0.5);
    rel.trust = Math.max(0, Math.min(1.0, rel.trust + trustChange));

    console.log(`🤝 ${this.ownerAgentId} → ${memory.agentName}: F=${rel.familiarity.toFixed(2)} A=${rel.affinity.toFixed(2)} T=${rel.trust.toFixed(2)}`);
  }

  /**
   * Apply relationship decay over time (called periodically)
   */
  applyRelationshipDecay(currentTime: number, hoursPassed: number): void {
    for (const memory of this.socialMemories.values()) {
      const rel = memory.relationship;
      const timeSinceLastInteraction = currentTime - rel.lastInteraction;

      // Only decay if enough time has passed (e.g., 1 game hour)
      if (timeSinceLastInteraction > 3600) {
        // Decay familiarity
        const familiarityDecay = this.config.familiarityDecayRate * hoursPassed;
        rel.familiarity = Math.max(0, rel.familiarity - familiarityDecay);

        // Decay trust
        const trustDecay = this.config.trustDecayRate * hoursPassed;
        rel.trust = Math.max(0, rel.trust - trustDecay);

        // Affinity doesn't decay (emotional connections persist)
      }
    }
  }

  /**
   * Check if agent has met another agent
   */
  hasMetAgent(agentId: string): boolean {
    return this.socialMemories.has(agentId);
  }

  /**
   * Get social memory for specific agent
   */
  getSocialMemory(agentId: string): ISocialMemory | null {
    return this.socialMemories.get(agentId) || null;
  }

  /**
   * Get all known agents
   */
  getKnownAgents(): ISocialMemory[] {
    return Array.from(this.socialMemories.values());
  }

  /**
   * Get count of known agents
   */
  getKnownAgentCount(): number {
    return this.socialMemories.size;
  }

  /**
   * Get agents sorted by familiarity (most familiar first)
   */
  getAgentsByFamiliarity(): ISocialMemory[] {
    return this.getKnownAgents().sort(
      (a, b) => b.relationship.familiarity - a.relationship.familiarity
    );
  }

  /**
   * Get agents sorted by affinity (most liked first)
   */
  getAgentsByAffinity(): ISocialMemory[] {
    return this.getKnownAgents().sort(
      (a, b) => b.relationship.affinity - a.relationship.affinity
    );
  }

  /**
   * Get agents sorted by trust (most trusted first)
   */
  getAgentsByTrust(): ISocialMemory[] {
    return this.getKnownAgents().sort(
      (a, b) => b.relationship.trust - a.relationship.trust
    );
  }

  /**
   * Get closest friend (highest combination of familiarity + affinity + trust)
   */
  getClosestFriend(): ISocialMemory | null {
    if (this.socialMemories.size === 0) return null;

    let bestScore = -Infinity;
    let bestFriend: ISocialMemory | null = null;

    for (const memory of this.socialMemories.values()) {
      const rel = memory.relationship;
      // Weighted score: familiarity (40%), affinity (40%), trust (20%)
      const score = rel.familiarity * 0.4 + (rel.affinity + 1) * 0.2 + rel.trust * 0.4;

      if (score > bestScore) {
        bestScore = score;
        bestFriend = memory;
      }
    }

    return bestFriend;
  }

  /**
   * Get most distant agent (lowest affinity)
   */
  getMostDistant(): ISocialMemory | null {
    if (this.socialMemories.size === 0) return null;

    return this.getAgentsByAffinity()[this.socialMemories.size - 1];
  }

  /**
   * Add a known fact about another agent
   */
  addKnownFact(agentId: string, fact: string): void {
    const memory = this.socialMemories.get(agentId);
    if (memory) {
      memory.knownFacts.push(fact);
      console.log(`📝 ${this.ownerAgentId} learned: ${fact} (about ${memory.agentName})`);
    }
  }

  /**
   * Add a perceived trait about another agent
   */
  addPerceivedTrait(agentId: string, trait: string): void {
    const memory = this.socialMemories.get(agentId);
    if (memory && !memory.perceivedTraits.includes(trait)) {
      memory.perceivedTraits.push(trait);
      console.log(`🔍 ${this.ownerAgentId} perceived: ${memory.agentName} is ${trait}`);
    }
  }

  /**
   * Get recent interactions with specific agent
   */
  getRecentInteractions(agentId: string, count: number = 10): Interaction[] {
    const memory = this.socialMemories.get(agentId);
    if (!memory) return [];

    return memory.interactions.slice(-count);
  }

  /**
   * Get interaction summary for specific agent
   */
  getInteractionSummary(agentId: string): string {
    const memory = this.socialMemories.get(agentId);
    if (!memory) return 'No interactions';

    const rel = memory.relationship;
    const timeSinceFirst = rel.lastInteraction - memory.firstMet;
    const hoursKnown = timeSinceFirst / 3600;

    let summary = `Known ${memory.agentName} for ${hoursKnown.toFixed(1)} hours. `;
    summary += `${rel.interactionCount} interactions. `;

    // Describe relationship
    if (rel.familiarity > 0.7) {
      summary += 'Very familiar. ';
    } else if (rel.familiarity > 0.4) {
      summary += 'Somewhat familiar. ';
    } else {
      summary += 'Not well known. ';
    }

    if (rel.affinity > 0.5) {
      summary += 'Friendly relationship. ';
    } else if (rel.affinity < -0.3) {
      summary += 'Difficult relationship. ';
    } else {
      summary += 'Neutral relationship. ';
    }

    if (rel.trust > 0.7) {
      summary += 'Highly trusted.';
    } else if (rel.trust < 0.3) {
      summary += 'Not very trusted.';
    }

    return summary;
  }

  /**
   * Export social memory data (for saving/logging)
   */
  exportData(): any {
    const data: any = {};
    for (const [agentId, memory] of this.socialMemories) {
      data[agentId] = {
        agentName: memory.agentName,
        firstMet: memory.firstMet,
        relationship: { ...memory.relationship },
        interactionCount: memory.interactions.length,
        knownFacts: [...memory.knownFacts],
        perceivedTraits: [...memory.perceivedTraits],
      };
    }
    return data;
  }

  /**
   * Import social memory data (for loading)
   */
  importData(_data: any): void {
    // TODO: Implement full data import if needed
    console.log('📥 SocialMemory import not yet implemented');
  }

  /**
   * Clear all social memories
   */
  clear(): void {
    this.socialMemories.clear();
    console.log(`🗑️  ${this.ownerAgentId}: Social memories cleared`);
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const knownCount = this.socialMemories.size;
    if (knownCount === 0) {
      return 'No known agents';
    }

    let info = `Known agents: ${knownCount}\n`;
    for (const memory of this.socialMemories.values()) {
      const rel = memory.relationship;
      info += `- ${memory.agentName}: F=${rel.familiarity.toFixed(2)} A=${rel.affinity.toFixed(2)} T=${rel.trust.toFixed(2)} (${rel.interactionCount} interactions)\n`;
    }
    return info;
  }
}
