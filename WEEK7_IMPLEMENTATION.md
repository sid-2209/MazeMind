# Week 7 Implementation: Dialogue System & Agent Communication

## Overview & Research Paper Alignment

### Connection to Paper (Park et al., 2023)
**Section 4.3.2: Dialogue Generation and Section 3.4.1: Information Diffusion**

The dialogue system is a **core mechanism** for emergent social behaviors in the paper. Natural language conversations enable:

> "Agents generate dialogue with each other that is grounded in their memories and current context... Information diffuses through the agent community as agents pass information to each other through **conversation**."

**Key Examples from Paper**:
- **Party Planning**: Isabella Rodriguez decides to host a Valentine's Day party at Hobbs Cafe
- **Information Spread**: The news spreads through conversations → 5 agents independently decide to attend
- **Relationship Formation**: Conversations deepen relationships (Sam and Latoya discuss book edits)
- **Emergent Coordination**: Multiple agents coordinate attendance without central planning

**Current Implementation Gap**:
- ❌ No dialogue generation capability
- ❌ No conversation memory or tracking
- ❌ No information diffusion mechanism
- ❌ Agents observe each other (Week 6) but can't communicate
- ❌ No coordinated activities through communication

**Paper Alignment**: Currently 0% dialogue → Target 80% after Week 7

### Week 7 Objectives

1. ✅ Implement context-aware dialogue generation
2. ✅ Create conversation memory and history tracking
3. ✅ Add natural language utterance generation (LLM-based)
4. ✅ Enable information sharing between agents
5. ✅ Track conversation topics and sentiment
6. ✅ Visualize active conversations in UI
7. ✅ Foundation for coordinated group activities

### Expected Outcomes

After Week 7:
- Agents engage in natural language conversations
- Information spreads through agent network
- Conversations stored in memory and influence future behavior
- Relationship evolution through dialogue
- Conversation UI shows active discussions
- Foundation for emergent social coordination

---

## Architecture & Design

### Dialogue System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    DIALOGUE SYSTEM                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Conversation Manager                          │  │
│  │  - Track active conversations                         │  │
│  │  - Manage conversation state                          │  │
│  │  - Detect conversation triggers                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │  Agent A    │  │Conversation │  │  Agent B    │        │
│  │             │◄─┤   Context   │─►│             │        │
│  │ Memory      │  │   Builder   │  │ Memory      │        │
│  │ Social      │  └─────────────┘  │ Social      │        │
│  │ Planning    │                   │ Planning    │        │
│  └──────┬──────┘                   └──────┬──────┘        │
│         │                                  │               │
│         │      ┌──────────────────┐        │               │
│         └─────►│ Utterance        │◄───────┘               │
│                │ Generator (LLM)  │                        │
│                │                  │                        │
│                │ Input: Context   │                        │
│                │ Output: Utterance│                        │
│                └──────────────────┘                        │
│                         │                                  │
│                         ▼                                  │
│                ┌─────────────────┐                         │
│                │ Conversation    │                         │
│                │ Memory Storage  │                         │
│                └─────────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

### Conversation Flow

```
1. INITIATION
   Agent A is near Agent B (detection from Week 6)
   → Trigger: First meeting, shared interest, or information to share
   → Agent A initiates conversation

2. CONTEXT BUILDING
   Gather context for both agents:
   - Recent memories (what they know)
   - Relationship status (from social memory)
   - Current goals/plans
   - Shared observations (same location, events)

3. UTTERANCE GENERATION
   Agent A → LLM:
     "Given context, what would Agent A say to Agent B?"
   → Natural language utterance generated

4. RESPONSE GENERATION
   Agent B receives utterance
   Agent B → LLM:
     "Given what Agent A said, how should Agent B respond?"
   → Response generated

5. MEMORY STORAGE
   Both agents store conversation in memory:
   - New observation: "I talked with [agent] about [topic]"
   - Update relationship (familiarity, affinity)
   - Store shared information

6. CONTINUATION OR END
   Check if conversation continues:
   - Topic exhausted?
   - Agents need to move on?
   - Natural ending point reached?
```

### Information Diffusion Example

```
Time T0: Isabella plans party
         └─> Stores in memory: "Planning Valentine's party"

Time T1: Isabella + Maria conversation
         Isabella: "I'm planning a Valentine's party at Hobbs Cafe!"
         Maria: "That sounds wonderful! When is it?"
         └─> Maria learns: "Isabella hosting party at Hobbs Cafe"

Time T2: Maria + Sam conversation
         Maria: "Have you heard? Isabella is hosting a party!"
         Sam: "Really? I should attend."
         └─> Sam learns: "Isabella hosting party"

Time T3: Sam independently decides to attend
         └─> Information diffused through 3 agents via 2 conversations
```

---

## Implementation Details

### Phase 1: Conversation Core (Days 1-3)

#### File 1: `src/types/dialogue.ts` (NEW - ~300 lines)

```typescript
/**
 * Dialogue Types - Conversations between agents
 */

export interface Conversation {
  id: string;
  participants: string[];        // Agent IDs
  startTime: number;
  endTime?: number;
  location: Position;
  turns: ConversationTurn[];
  topic: string;                 // Main topic of conversation
  sentiment: number;             // -1 to 1: Overall emotional tone
  informationShared: string[];   // Facts shared during conversation
  status: ConversationStatus;
}

export interface ConversationTurn {
  id: string;
  speakerId: string;             // Agent ID
  speakerName: string;
  utterance: string;             // What was said
  timestamp: number;
  topic?: string;                // Topic of this turn
  intent: ConversationIntent;    // Why they're saying this
  informationShared?: string;    // New fact shared
  sentiment?: number;            // -1 to 1: Emotional tone of utterance
  reactionScore?: number;        // How other agent reacted
}

export enum ConversationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  INTERRUPTED = 'interrupted'
}

export enum ConversationIntent {
  GREETING = 'greeting',
  SHARE_INFORMATION = 'share_information',
  ASK_QUESTION = 'ask_question',
  COORDINATE_ACTION = 'coordinate_action',
  EXPRESS_FEELING = 'express_feeling',
  SOCIAL_BONDING = 'social_bonding',
  FAREWELL = 'farewell'
}

export interface ConversationContext {
  // Participants
  initiator: {
    agent: Agent;
    recentMemories: string[];
    currentGoal: string;
    relationship: Relationship;
  };

  respondent: {
    agent: Agent;
    recentMemories: string[];
    currentGoal: string;
    relationship: Relationship;
  };

  // Shared context
  location: string;
  sharedObservations: string[];
  previousConversations: Conversation[];

  // Triggers
  trigger: ConversationTrigger;
  urgency: number;               // 0-1: How urgent is this conversation
}

export enum ConversationTrigger {
  FIRST_MEETING = 'first_meeting',
  PROXIMITY = 'proximity',
  IMPORTANT_NEWS = 'important_news',
  SHARED_GOAL = 'shared_goal',
  QUESTION = 'question',
  COORDINATE_PLAN = 'coordinate_plan'
}

export interface UtteranceRequest {
  context: ConversationContext;
  previousTurns: ConversationTurn[];
  maxLength: number;             // Max words in utterance
  tone?: 'casual' | 'formal' | 'urgent' | 'friendly';
}

export interface UtteranceResponse {
  utterance: string;
  intent: ConversationIntent;
  topic?: string;
  sentiment: number;
  informationShared?: string;
  shouldContinue: boolean;       // Should conversation continue?
}
```

#### File 2: `src/systems/ConversationManager.ts` (NEW - ~700 lines)

```typescript
/**
 * Conversation Manager - Orchestrates agent-to-agent dialogue
 *
 * Responsibilities:
 * - Detect conversation opportunities
 * - Initiate conversations
 * - Manage conversation flow
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
  ConversationIntent
} from '../types/dialogue';
import { v4 as uuidv4 } from 'uuid';

export class ConversationManager {
  private agentManager: AgentManager;
  private activeConversations: Map<string, Conversation> = new Map();
  private conversationHistory: Conversation[] = [];

  // Configuration
  private readonly MAX_CONVERSATION_LENGTH = 10; // Max turns
  private readonly CONVERSATION_INTERVAL = 5000;  // 5 seconds between turns
  private readonly PROXIMITY_THRESHOLD = 3;       // Tiles

  // Metrics
  private totalConversations: number = 0;
  private informationDiffusionCount: number = 0;

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
    console.log('💬 ConversationManager initialized');
  }

  /**
   * Update - check for conversation opportunities
   */
  update(deltaTime: number, gameTime: number): void {
    // Check for new conversation opportunities
    this.detectConversationOpportunities(gameTime);

    // Update active conversations
    this.updateActiveConversations(deltaTime, gameTime);
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
    if (distance > this.PROXIMITY_THRESHOLD) return null;

    // Check for triggers

    // 1. First meeting
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

    // 4. Random proximity conversation (10% chance)
    if (Math.random() < 0.1) {
      return ConversationTrigger.PROXIMITY;
    }

    return null;
  }

  /**
   * Check if agent has important news to share
   */
  private hasImportantNewsToShare(agentA: Agent, agentB: Agent): boolean {
    // Check if agentA has high-importance memories that agentB doesn't know about
    const recentImportantMemories = agentA.getMemoryStream()
      .getMemories()
      .filter(m => m.importance >= 8)
      .slice(-5); // Last 5 important memories

    // Check if these are about topics agentB would care about
    // (For now, simplified: any high-importance memory is newsworthy)
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

    const keywords = ['exit', 'explore', 'east', 'west', 'north', 'south'];
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
    console.log(`💬 Initiating conversation: ${agentA.getName()} + ${agentB.getName()} (${trigger})`);

    // Create conversation
    const conversation: Conversation = {
      id: uuidv4(),
      participants: [agentA.getId(), agentB.getId()],
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

    console.log(`  ${agentA.getName()}: "${firstTurn.utterance}"`);
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
      trustLevel: 0.5
    };

    // Get recent memories
    const initiatorMemories = initiator.getMemoryStream()
      .getMemories()
      .slice(-5)
      .map(m => m.content);

    const respondentMemories = respondent.getMemoryStream()
      .getMemories()
      .slice(-5)
      .map(m => m.content);

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
    const response = await llmService.generateText(prompt);

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
      sentiment: parsed.sentiment
    };

    // Store in memory
    this.storeConversationInMemory(speaker, listener, turn);

    // Track information diffusion
    if (parsed.informationShared) {
      this.informationDiffusionCount++;
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

YOU ARE TALKING TO:
- ${listener.getName()}
- Relationship: Familiarity ${(relationship.familiarity * 100).toFixed(0)}%, Affinity ${(relationship.affinity > 0 ? '+' : '')}${(relationship.affinity * 100).toFixed(0)}%
- Their goal: ${context.respondent.currentGoal}

`;

    if (isInitiator) {
      prompt += `SITUATION: You just encountered ${listener.getName()} ${this.describeTrigger(context.trigger)}.

Generate a natural opening statement or greeting.`;
    } else {
      const lastTurn = conversation.turns[conversation.turns.length - 1];
      prompt += `${lastTurn.speakerName} just said: "${lastTurn.utterance}"

Generate a natural response.`;
    }

    prompt += `

Respond in this format:
UTTERANCE: [What you say, 1-2 sentences, natural language]
INTENT: [${Object.values(ConversationIntent).join('/')}]
TOPIC: [Brief topic description]
SENTIMENT: [Number from -1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive]
INFO_SHARED: [Optional: Any important fact you're sharing, or "none"]
CONTINUE: [yes/no - should conversation continue?]

Example:
UTTERANCE: Hey! I'm Arth. I've been exploring the eastern corridors. Have you found anything useful?
INTENT: greeting
TOPIC: Introduction and maze exploration
SENTIMENT: 0.6
INFO_SHARED: Eastern corridors have been explored
CONTINUE: yes`;

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
    shouldContinue: boolean;
  } {
    // Extract fields from response
    const utteranceMatch = response.match(/UTTERANCE:\s*(.+)/i);
    const intentMatch = response.match(/INTENT:\s*(\w+)/i);
    const topicMatch = response.match(/TOPIC:\s*(.+)/i);
    const sentimentMatch = response.match(/SENTIMENT:\s*([-\d.]+)/i);
    const infoMatch = response.match(/INFO_SHARED:\s*(.+)/i);
    const continueMatch = response.match(/CONTINUE:\s*(\w+)/i);

    return {
      utterance: utteranceMatch?.[1]?.trim() || 'Hello.',
      intent: (intentMatch?.[1]?.toLowerCase() as ConversationIntent) || ConversationIntent.GREETING,
      topic: topicMatch?.[1]?.trim(),
      sentiment: parseFloat(sentimentMatch?.[1] || '0'),
      informationShared: infoMatch?.[1]?.trim() !== 'none' ? infoMatch?.[1]?.trim() : undefined,
      shouldContinue: continueMatch?.[1]?.toLowerCase() === 'yes'
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
    speaker.addObservation(
      `I said to ${listener.getName()}: "${turn.utterance}"`,
      6 // Moderate importance
    );

    // Listener remembers what they heard
    listener.addObservation(
      `${speaker.getName()} said to me: "${turn.utterance}"`,
      turn.informationShared ? 8 : 6 // Higher importance if info shared
    );

    // If information was shared, store as fact
    if (turn.informationShared) {
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
        timestamp: turn.timestamp,
        type: InteractionType.CONVERSATION,
        location: speaker.getTilePosition(),
        description: `Conversation about ${turn.topic || 'general topics'}`,
        sentiment: turn.sentiment,
        metadata: {
          utterance: turn.utterance,
          intent: turn.intent
        }
      }
    );
  }

  /**
   * Update active conversations
   */
  private updateActiveConversations(deltaTime: number, gameTime: number): void {
    for (const [id, conversation] of this.activeConversations) {
      // Check if conversation should continue
      const lastTurn = conversation.turns[conversation.turns.length - 1];

      // Check if agents are still nearby
      const agentA = this.agentManager.getAgent(conversation.participants[0]);
      const agentB = this.agentManager.getAgent(conversation.participants[1]);

      if (!agentA || !agentB) continue;

      const distance = Math.abs(
        agentA.getTilePosition().x - agentB.getTilePosition().x
      ) + Math.abs(
        agentA.getTilePosition().y - agentB.getTilePosition().y
      );

      // End if too far apart
      if (distance > this.PROXIMITY_THRESHOLD + 2) {
        this.endConversation(id, ConversationStatus.INTERRUPTED);
        continue;
      }

      // End if max length reached
      if (conversation.turns.length >= this.MAX_CONVERSATION_LENGTH) {
        this.endConversation(id, ConversationStatus.COMPLETED);
        continue;
      }

      // Continue conversation (generate response)
      // TODO: Implement turn-based conversation flow
    }
  }

  /**
   * End conversation
   */
  private endConversation(conversationId: string, status: ConversationStatus): void {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) return;

    conversation.status = status;
    conversation.endTime = Date.now();

    // Move to history
    this.conversationHistory.push(conversation);
    this.activeConversations.delete(conversationId);

    console.log(`💬 Conversation ended: ${conversation.id} (${status})`);
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
  getMetrics() {
    return {
      totalConversations: this.totalConversations,
      activeConversations: this.activeConversations.size,
      informationDiffused: this.informationDiffusionCount
    };
  }
}
```

---

## Testing Strategy

### Unit Tests
1. ✅ Conversation context building
2. ✅ Utterance generation prompt creation
3. ✅ Response parsing
4. ✅ Conversation memory storage
5. ✅ Trigger detection

### Integration Tests
1. ✅ Two agents meet and converse
2. ✅ Information shared and stored
3. ✅ Relationship updated through dialogue
4. ✅ Conversation ends naturally

### Success Criteria
✅ Natural language conversations generated
✅ Context-aware utterances
✅ Information diffusion tracked
✅ Conversations stored in memory
✅ Performance: <2s per utterance generation

---

## Timeline

### Days 1-3: Core System
- Dialogue types
- ConversationManager
- Context building

### Days 4-5: Utterance Generation
- LLM prompts
- Response parsing
- Memory integration

### Days 6-7: Conversation Flow
- Turn management
- Continuation logic
- Ending detection

### Days 8-9: UI & Visualization
- Conversation display
- Speech bubbles
- History log

### Days 10-11: Testing & Polish
- Integration testing
- Prompt refinement
- Performance optimization

---

## Deliverables

### New Files (4)
1. ✅ `src/types/dialogue.ts` (~300 lines)
2. ✅ `src/systems/ConversationManager.ts` (~700 lines)
3. ✅ `src/ui/ConversationPanel.ts` (~350 lines)
4. ✅ `src/config/dialogue.prompts.ts` (~250 lines)

### Modified Files (3)
1. ✅ `src/core/Game.ts` (+40 lines)
2. ✅ `src/agent/Agent.ts` (+30 lines)
3. ✅ `src/ui/UIManager.ts` (+25 lines)

### Total Code
- **New**: ~1,600 lines
- **Modified**: ~95 lines
- **Total**: ~1,695 lines

---

## Research Paper Alignment

### Before Week 7: 0% dialogue
### After Week 7: 80% dialogue
### Overall Paper Alignment: 85% → 92%

---

## Conclusion

Week 7 enables **emergent social behaviors** through natural language dialogue. Agents can now share information, coordinate plans, and form relationships through conversation - the core mechanism for the paper's most impressive demonstrations (party planning, information diffusion, relationship formation).

**Paper Quote**:
> "Dialogue is parameterized on the agents' memories about each other... enabling them to form coherent, grounded statements." - Park et al., 2023
