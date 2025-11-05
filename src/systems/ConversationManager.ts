// src/systems/ConversationManager.ts
/**
 * Conversation Manager - Orchestrates agent-to-agent dialogue (Week 7)
 *
 * Aligned with Park et al., 2023:
 * - Section 4.3.2: Dialogue Generation
 * - Section 3.4.1: Information Diffusion
 *
 * Responsibilities:
 * - Detect conversation opportunities
 * - Initiate conversations
 * - Manage conversation flow
 * - Generate context-aware utterances
 * - Store conversation memories
 * - Track information diffusion
 */

import { Agent } from '../agent/Agent';
import { AgentManager } from './AgentManager';
import {
  Conversation,
  ConversationTurn,
  ConversationContext,
  ConversationStatus,
  ConversationTrigger,
  ConversationIntent,
  ConversationConfig,
  ConversationMetrics
} from '../types/dialogue';
import { InteractionType } from '../types/multi-agent';
import { Position } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ConversationManager {
  private agentManager: AgentManager;
  private activeConversations: Map<string, Conversation> = new Map();
  private conversationHistory: Conversation[] = [];

  // Configuration
  private config: ConversationConfig = {
    maxConversationLength: 10,       // Max turns per conversation
    conversationInterval: 5000,      // 5 seconds between turns
    proximityThreshold: 3,           // Tiles
    randomConversationChance: 0.1,   // 10% chance when nearby
    enableInformationDiffusion: true,
    enableConversationLogging: true
  };

  // Metrics
  private totalConversations: number = 0;
  private informationDiffusionCount: number = 0;
  private conversationsByTrigger: Map<ConversationTrigger, number> = new Map();

  // Timing
  private lastUpdateTime: number = 0;
  private conversationCooldowns: Map<string, number> = new Map(); // Agent ID -> cooldown time

  constructor(agentManager: AgentManager, config?: Partial<ConversationConfig>) {
    this.agentManager = agentManager;
    if (config) {
      this.config = { ...this.config, ...config };
    }
    console.log('💬 ConversationManager initialized');
  }

  /**
   * Update - check for conversation opportunities
   */
  update(deltaTime: number, gameTime: number): void {
    this.lastUpdateTime = gameTime;

    // Check for new conversation opportunities (less frequently for performance)
    if (Math.random() < 0.1) { // 10% chance per update
      this.detectConversationOpportunities(gameTime);
    }

    // Update active conversations
    this.updateActiveConversations(deltaTime, gameTime);

    // Decay cooldowns
    for (const [agentId, cooldown] of this.conversationCooldowns) {
      if (gameTime > cooldown) {
        this.conversationCooldowns.delete(agentId);
      }
    }
  }

  /**
   * Detect opportunities for conversations
   */
  private detectConversationOpportunities(gameTime: number): void {
    const agents = this.agentManager.getAllAgents();

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agentA = agents[i];
        const agentB = agents[j];

        // Skip if either is dead or already in conversation
        if (!agentA.getState().isAlive || !agentB.getState().isAlive) continue;
        if (this.isInConversation(agentA.getId()) || this.isInConversation(agentB.getId())) continue;

        // Skip if on cooldown
        if (this.conversationCooldowns.has(agentA.getId()) || this.conversationCooldowns.has(agentB.getId())) continue;

        // Check if they should start talking
        const trigger = this.shouldStartConversation(agentA, agentB);
        if (trigger) {
          this.initiateConversation(agentA, agentB, trigger, gameTime);
        }
      }
    }
  }

  /**
   * Determine if two agents should start a conversation
   */
  private shouldStartConversation(
    agentA: Agent,
    agentB: Agent
  ): ConversationTrigger | null {
    const posA = agentA.getTilePosition();
    const posB = agentB.getTilePosition();
    const distance = Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y);

    // Not close enough
    if (distance > this.config.proximityThreshold) return null;

    // Check for triggers (in order of priority)

    // 1. First meeting (highest priority)
    const socialMemoryA = agentA.getSocialMemory();
    if (!socialMemoryA.hasMetAgent(agentB.getId())) {
      return ConversationTrigger.FIRST_MEETING;
    }

    // 2. Important news to share
    const hasImportantNews = this.hasImportantNewsToShare(agentA, agentB);
    if (hasImportantNews) {
      return ConversationTrigger.IMPORTANT_NEWS;
    }

    // 3. Shared goal (both planning similar things)
    const hasSharedGoal = this.hasSharedGoal(agentA, agentB);
    if (hasSharedGoal) {
      return ConversationTrigger.SHARED_GOAL;
    }

    // 4. Random proximity conversation (configurable chance)
    if (Math.random() < this.config.randomConversationChance) {
      return ConversationTrigger.PROXIMITY;
    }

    return null;
  }

  /**
   * Check if agent has important news to share
   */
  private hasImportantNewsToShare(agentA: Agent, _agentB: Agent): boolean {
    // Check if agentA has high-importance memories that agentB doesn't know about
    const recentImportantMemories = agentA.getMemoryStream()
      .getAllMemories()
      .filter((m: any) => m.importance >= 8)
      .slice(-5); // Last 5 important memories

    // For now, simplified: any high-importance memory is newsworthy
    return recentImportantMemories.length > 0;
  }

  /**
   * Check if agents have shared goals
   */
  private hasSharedGoal(agentA: Agent, agentB: Agent): boolean {
    const planA = agentA.getCurrentPlan();
    const planB = agentB.getCurrentPlan();

    if (!planA || !planB) return false;

    // Check for similar goals (simplified: check if goals mention similar keywords)
    const goalA = planA.goal.toLowerCase();
    const goalB = planB.goal.toLowerCase();

    const keywords = ['exit', 'explore', 'east', 'west', 'north', 'south', 'food', 'water'];
    for (const keyword of keywords) {
      if (goalA.includes(keyword) && goalB.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Initiate a new conversation
   */
  private async initiateConversation(
    agentA: Agent,
    agentB: Agent,
    trigger: ConversationTrigger,
    gameTime: number
  ): Promise<void> {
    if (this.config.enableConversationLogging) {
      console.log(`💬 Initiating conversation: ${agentA.getName()} + ${agentB.getName()} (${trigger})`);
    }

    // Create conversation
    const conversation: Conversation = {
      id: uuidv4(),
      participants: [agentA.getId(), agentB.getId()],
      participantNames: [agentA.getName(), agentB.getName()],
      startTime: gameTime,
      location: agentA.getTilePosition(),
      turns: [],
      topic: this.inferTopic(trigger),
      sentiment: 0,
      informationShared: [],
      status: ConversationStatus.ACTIVE
    };

    // Build context
    const context = this.buildConversationContext(agentA, agentB, trigger);

    try {
      // Generate first utterance
      const firstTurn = await this.generateUtterance(
        conversation,
        agentA,
        agentB,
        context,
        gameTime
      );

      conversation.turns.push(firstTurn);

      // Store conversation
      this.activeConversations.set(conversation.id, conversation);
      this.totalConversations++;

      // Track trigger
      const currentCount = this.conversationsByTrigger.get(trigger) || 0;
      this.conversationsByTrigger.set(trigger, currentCount + 1);

      // Set cooldowns (prevent spam)
      this.conversationCooldowns.set(agentA.getId(), gameTime + 30); // 30 seconds
      this.conversationCooldowns.set(agentB.getId(), gameTime + 30);

      if (this.config.enableConversationLogging) {
        console.log(`  ${agentA.getName()}: "${firstTurn.utterance}"`);
      }

      // Generate response after a short delay
      setTimeout(async () => {
        await this.generateResponse(conversation, agentB, agentA, context, gameTime);
      }, 2000); // 2 second delay for natural feel

    } catch (error) {
      console.error(`❌ Failed to initiate conversation:`, error);
    }
  }

  /**
   * Generate a response turn
   */
  private async generateResponse(
    conversation: Conversation,
    responder: Agent,
    initiator: Agent,
    context: ConversationContext,
    gameTime: number
  ): Promise<void> {
    try {
      const responseTurn = await this.generateUtterance(
        conversation,
        responder,
        initiator,
        context,
        gameTime
      );

      conversation.turns.push(responseTurn);

      if (this.config.enableConversationLogging) {
        console.log(`  ${responder.getName()}: "${responseTurn.utterance}"`);
      }

      // Check if should continue
      if (responseTurn.reactionScore && responseTurn.reactionScore < 0.3) {
        // Low reaction - end conversation
        this.endConversation(conversation.id, ConversationStatus.COMPLETED);
      } else if (conversation.turns.length >= this.config.maxConversationLength) {
        this.endConversation(conversation.id, ConversationStatus.COMPLETED);
      }

    } catch (error) {
      console.error(`❌ Failed to generate response:`, error);
      this.endConversation(conversation.id, ConversationStatus.INTERRUPTED);
    }
  }

  /**
   * Build conversation context
   */
  private buildConversationContext(
    initiator: Agent,
    respondent: Agent,
    trigger: ConversationTrigger
  ): ConversationContext {
    // Get relationship
    const socialMemory = initiator.getSocialMemory();
    const relationship = socialMemory.getSocialMemory(respondent.getId())?.relationship || {
      familiarity: 0,
      affinity: 0,
      trust: 0.5,
      lastInteraction: 0,
      interactionCount: 0,
      recentInteractions: []
    };

    // Get recent memories
    const initiatorMemories = initiator.getMemoryStream()
      .getAllMemories()
      .slice(-5)
      .map((m: any) => m.content);

    const respondentMemories = respondent.getMemoryStream()
      .getAllMemories()
      .slice(-5)
      .map((m: any) => m.content);

    // Get current goals
    const initiatorGoal = initiator.getCurrentPlan()?.goal || 'Survive and find exit';
    const respondentGoal = respondent.getCurrentPlan()?.goal || 'Survive and find exit';

    // Find previous conversations
    const previousConversations = this.conversationHistory.filter(c =>
      c.participants.includes(initiator.getId()) &&
      c.participants.includes(respondent.getId())
    );

    return {
      initiator: {
        agent: initiator,
        recentMemories: initiatorMemories,
        currentGoal: initiatorGoal,
        relationship
      },
      respondent: {
        agent: respondent,
        recentMemories: respondentMemories,
        currentGoal: respondentGoal,
        relationship
      },
      location: this.describeLocation(initiator.getTilePosition()),
      sharedObservations: [], // TODO: Get from AgentManager
      previousConversations,
      trigger,
      urgency: this.calculateUrgency(trigger)
    };
  }

  /**
   * Generate utterance using LLM
   */
  private async generateUtterance(
    conversation: Conversation,
    speaker: Agent,
    listener: Agent,
    context: ConversationContext,
    gameTime: number
  ): Promise<ConversationTurn> {
    // Build prompt
    const prompt = this.buildUtterancePrompt(conversation, speaker, listener, context);

    // Get LLM response
    const llmService = speaker.getLLMService();
    if (!llmService) {
      throw new Error('LLM service not available');
    }
    const response = await llmService.generate(prompt, { max_tokens: 150 });

    // Parse response
    const parsed = this.parseUtteranceResponse(response);

    // Create turn
    const turn: ConversationTurn = {
      id: uuidv4(),
      speakerId: speaker.getId(),
      speakerName: speaker.getName(),
      utterance: parsed.utterance,
      timestamp: gameTime,
      topic: parsed.topic,
      intent: parsed.intent,
      informationShared: parsed.informationShared,
      sentiment: parsed.sentiment,
      reactionScore: 0.7 // Default positive reaction
    };

    // Store in memory
    this.storeConversationInMemory(speaker, listener, turn);

    // Track information diffusion
    if (parsed.informationShared) {
      this.informationDiffusionCount++;
      conversation.informationShared.push(parsed.informationShared);
    }

    return turn;
  }

  /**
   * Build utterance generation prompt
   */
  private buildUtterancePrompt(
    conversation: Conversation,
    speaker: Agent,
    listener: Agent,
    context: ConversationContext
  ): string {
    const isInitiator = conversation.turns.length === 0;
    const relationship = context.initiator.relationship;

    let prompt = `You are ${speaker.getName()}, an agent trapped in a maze.

YOUR SITUATION:
- Current goal: ${context.initiator.currentGoal}
- Recent experiences: ${context.initiator.recentMemories.slice(0, 3).join('; ')}
- Survival state: Energy ${speaker.getSurvivalState().energy.toFixed(0)}%, Hunger ${speaker.getSurvivalState().hunger.toFixed(0)}%, Thirst ${speaker.getSurvivalState().thirst.toFixed(0)}%

YOU ARE TALKING TO:
- ${listener.getName()}
- Relationship: Familiarity ${(relationship.familiarity * 100).toFixed(0)}%, Affinity ${(relationship.affinity > 0 ? '+' : '')}${(relationship.affinity * 100).toFixed(0)}%
- Their goal: ${context.respondent.currentGoal}

`;

    if (isInitiator) {
      prompt += `SITUATION: You just encountered ${listener.getName()} ${this.describeTrigger(context.trigger)}.

Generate a natural opening statement or greeting (1-2 sentences).`;
    } else {
      const lastTurn = conversation.turns[conversation.turns.length - 1];
      prompt += `${lastTurn.speakerName} just said: "${lastTurn.utterance}"

Generate a natural response (1-2 sentences).`;
    }

    prompt += `

Respond in this format:
UTTERANCE: [What you say, 1-2 sentences, natural language]
INTENT: [${Object.values(ConversationIntent).join('/')}]
TOPIC: [Brief topic description]
SENTIMENT: [Number from -1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive]
INFO_SHARED: [Optional: Any important fact you're sharing, or "none"]

Example:
UTTERANCE: Hey! I'm Arth. I've been exploring the eastern corridors. Have you found anything useful?
INTENT: greeting
TOPIC: Introduction and maze exploration
SENTIMENT: 0.6
INFO_SHARED: Eastern corridors have been explored`;

    return prompt;
  }

  /**
   * Parse LLM utterance response
   */
  private parseUtteranceResponse(response: string): {
    utterance: string;
    intent: ConversationIntent;
    topic?: string;
    sentiment: number;
    informationShared?: string;
  } {
    // Extract fields from response
    const utteranceMatch = response.match(/UTTERANCE:\s*(.+?)(?=\n|INTENT:|$)/is);
    const intentMatch = response.match(/INTENT:\s*(\w+)/i);
    const topicMatch = response.match(/TOPIC:\s*(.+?)(?=\n|SENTIMENT:|$)/is);
    const sentimentMatch = response.match(/SENTIMENT:\s*([-\d.]+)/i);
    const infoMatch = response.match(/INFO_SHARED:\s*(.+?)(?=\n|$)/is);

    return {
      utterance: utteranceMatch?.[1]?.trim() || 'Hello.',
      intent: (intentMatch?.[1]?.toLowerCase() as ConversationIntent) || ConversationIntent.GREETING,
      topic: topicMatch?.[1]?.trim(),
      sentiment: parseFloat(sentimentMatch?.[1] || '0'),
      informationShared: (infoMatch?.[1]?.trim() !== 'none' && infoMatch?.[1]?.trim()) ? infoMatch?.[1]?.trim() : undefined
    };
  }

  /**
   * Store conversation in agent memory
   */
  private storeConversationInMemory(
    speaker: Agent,
    listener: Agent,
    turn: ConversationTurn
  ): void {
    // Speaker remembers what they said
    speaker.getMemoryStream().addObservation(
      `I said to ${listener.getName()}: "${turn.utterance}"`,
      6, // Moderate importance
      ['conversation', 'dialogue'],
      speaker.getTilePosition()
    );

    // Listener remembers what they heard
    listener.getMemoryStream().addObservation(
      `${speaker.getName()} said to me: "${turn.utterance}"`,
      turn.informationShared ? 8 : 6, // Higher importance if info shared
      ['conversation', 'dialogue', 'information'],
      listener.getTilePosition()
    );

    // If information was shared, store as fact
    if (turn.informationShared && this.config.enableInformationDiffusion) {
      listener.getSocialMemory().addKnownFact(
        speaker.getId(),
        turn.informationShared
      );
    }

    // Update social memory interaction
    listener.getSocialMemory().recordInteraction(
      speaker.getId(),
      speaker.getName(),
      {
        id: turn.id,
        timestamp: turn.timestamp,
        type: InteractionType.DIALOGUE,
        otherAgentId: speaker.getId(),
        otherAgentName: speaker.getName(),
        location: speaker.getTilePosition(),
        description: `Conversation about ${turn.topic || 'general topics'}`,
        valence: turn.sentiment || 0,
        dialogue: {
          speaker: speaker.getName(),
          message: turn.utterance
        },
        context: {
          intent: turn.intent,
          topic: turn.topic
        }
      }
    );
  }

  /**
   * Update active conversations
   */
  private updateActiveConversations(_deltaTime: number, _gameTime: number): void {
    for (const [id, conversation] of this.activeConversations) {
      // Check if conversation should continue
      const agentA = this.agentManager.getAgent(conversation.participants[0]);
      const agentB = this.agentManager.getAgent(conversation.participants[1]);

      if (!agentA || !agentB) {
        this.endConversation(id, ConversationStatus.INTERRUPTED);
        continue;
      }

      const distance = Math.abs(
        agentA.getTilePosition().x - agentB.getTilePosition().x
      ) + Math.abs(
        agentA.getTilePosition().y - agentB.getTilePosition().y
      );

      // End if too far apart
      if (distance > this.config.proximityThreshold + 2) {
        this.endConversation(id, ConversationStatus.INTERRUPTED);
        continue;
      }

      // End if max length reached
      if (conversation.turns.length >= this.config.maxConversationLength) {
        this.endConversation(id, ConversationStatus.COMPLETED);
        continue;
      }
    }
  }

  /**
   * End conversation
   */
  private endConversation(conversationId: string, status: ConversationStatus): void {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) return;

    conversation.status = status;
    conversation.endTime = this.lastUpdateTime;

    // Move to history
    this.conversationHistory.push(conversation);
    this.activeConversations.delete(conversationId);

    if (this.config.enableConversationLogging) {
      console.log(`💬 Conversation ended: ${conversation.participantNames.join(' + ')} (${status}, ${conversation.turns.length} turns)`);
    }
  }

  /**
   * Check if agent is in active conversation
   */
  private isInConversation(agentId: string): boolean {
    for (const conversation of this.activeConversations.values()) {
      if (conversation.participants.includes(agentId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper methods
   */
  private inferTopic(trigger: ConversationTrigger): string {
    switch (trigger) {
      case ConversationTrigger.FIRST_MEETING: return 'Introduction';
      case ConversationTrigger.IMPORTANT_NEWS: return 'News sharing';
      case ConversationTrigger.SHARED_GOAL: return 'Goal coordination';
      case ConversationTrigger.PROXIMITY: return 'General conversation';
      default: return 'General conversation';
    }
  }

  private describeTrigger(trigger: ConversationTrigger): string {
    switch (trigger) {
      case ConversationTrigger.FIRST_MEETING: return 'for the first time';
      case ConversationTrigger.PROXIMITY: return 'nearby';
      case ConversationTrigger.IMPORTANT_NEWS: return 'and you have news';
      case ConversationTrigger.SHARED_GOAL: return 'while pursuing similar goals';
      default: return '';
    }
  }

  private describeLocation(pos: Position): string {
    return `at position (${pos.x}, ${pos.y})`;
  }

  private calculateUrgency(trigger: ConversationTrigger): number {
    switch (trigger) {
      case ConversationTrigger.IMPORTANT_NEWS: return 0.9;
      case ConversationTrigger.COORDINATE_PLAN: return 0.8;
      case ConversationTrigger.SHARED_GOAL: return 0.7;
      case ConversationTrigger.FIRST_MEETING: return 0.6;
      default: return 0.3;
    }
  }

  /**
   * Get active conversations
   */
  getActiveConversations(): Conversation[] {
    return Array.from(this.activeConversations.values());
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Conversation[] {
    return this.conversationHistory;
  }

  /**
   * Get metrics
   */
  getMetrics(): ConversationMetrics {
    const conversationsByAgent = new Map<string, number>();
    for (const conv of [...this.conversationHistory, ...this.activeConversations.values()]) {
      for (const participantId of conv.participants) {
        conversationsByAgent.set(participantId, (conversationsByAgent.get(participantId) || 0) + 1);
      }
    }

    const completed = this.conversationHistory.filter(c => c.status === ConversationStatus.COMPLETED);
    const avgLength = completed.length > 0
      ? completed.reduce((sum, c) => sum + c.turns.length, 0) / completed.length
      : 0;

    return {
      totalConversations: this.totalConversations,
      activeConversations: this.activeConversations.size,
      completedConversations: completed.length,
      averageConversationLength: avgLength,
      informationDiffusionCount: this.informationDiffusionCount,
      conversationsByTrigger: this.conversationsByTrigger,
      conversationsByAgent
    };
  }

  /**
   * Get configuration
   */
  getConfig(): ConversationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConversationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
