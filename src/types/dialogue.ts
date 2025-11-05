// src/types/dialogue.ts
/**
 * Dialogue Types - Conversations between agents (Week 7)
 *
 * Implements natural language dialogue system aligned with:
 * Park et al., 2023 - Section 4.3.2: Dialogue Generation
 * Section 3.4.1: Information Diffusion
 *
 * Enables:
 * - Context-aware conversation generation
 * - Information sharing and diffusion
 * - Relationship evolution through dialogue
 * - Memory-grounded utterances
 */

import { Position } from './index';
import { Agent } from '../agent/Agent';
import { Relationship } from './multi-agent';

/**
 * Conversation - A dialogue between two or more agents
 */
export interface Conversation {
  id: string;
  participants: string[];        // Agent IDs
  participantNames: string[];    // Agent names for display
  startTime: number;             // Game time when started
  endTime?: number;              // Game time when ended
  location: Position;            // Where conversation occurred
  turns: ConversationTurn[];     // All utterances in order
  topic: string;                 // Main topic of conversation
  sentiment: number;             // -1 to 1: Overall emotional tone
  informationShared: string[];   // Facts shared during conversation
  status: ConversationStatus;
}

/**
 * ConversationTurn - Single utterance in a conversation
 */
export interface ConversationTurn {
  id: string;
  speakerId: string;             // Agent ID
  speakerName: string;           // Agent name for display
  utterance: string;             // What was said
  timestamp: number;             // Game time
  topic?: string;                // Topic of this turn
  intent: ConversationIntent;    // Why they're saying this
  informationShared?: string;    // New fact shared
  sentiment?: number;            // -1 to 1: Emotional tone of utterance
  reactionScore?: number;        // How other agent reacted (0-1)
}

/**
 * ConversationStatus - State of a conversation
 */
export enum ConversationStatus {
  ACTIVE = 'active',             // Currently ongoing
  PAUSED = 'paused',             // Temporarily paused
  COMPLETED = 'completed',       // Naturally concluded
  INTERRUPTED = 'interrupted'    // Ended due to external factors
}

/**
 * ConversationIntent - Purpose of an utterance
 */
export enum ConversationIntent {
  GREETING = 'greeting',                     // Hello/introduction
  SHARE_INFORMATION = 'share_information',   // Sharing a fact/news
  ASK_QUESTION = 'ask_question',             // Asking for information
  COORDINATE_ACTION = 'coordinate_action',   // Planning together
  EXPRESS_FEELING = 'express_feeling',       // Emotional expression
  SOCIAL_BONDING = 'social_bonding',         // Building relationship
  FAREWELL = 'farewell'                      // Goodbye/ending
}

/**
 * ConversationContext - Context for generating utterances
 */
export interface ConversationContext {
  // Initiator (speaker)
  initiator: {
    agent: Agent;
    recentMemories: string[];
    currentGoal: string;
    relationship: Relationship;
  };

  // Respondent (listener)
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

/**
 * ConversationTrigger - What caused the conversation to start
 */
export enum ConversationTrigger {
  FIRST_MEETING = 'first_meeting',       // Never met before
  PROXIMITY = 'proximity',               // Just happened to be nearby
  IMPORTANT_NEWS = 'important_news',     // Has important info to share
  SHARED_GOAL = 'shared_goal',           // Working toward same goal
  QUESTION = 'question',                 // Needs to ask something
  COORDINATE_PLAN = 'coordinate_plan'    // Planning coordinated action
}

/**
 * UtteranceRequest - Request for LLM to generate utterance
 */
export interface UtteranceRequest {
  context: ConversationContext;
  previousTurns: ConversationTurn[];
  maxLength: number;             // Max words in utterance
  tone?: 'casual' | 'formal' | 'urgent' | 'friendly';
}

/**
 * UtteranceResponse - Parsed LLM response
 */
export interface UtteranceResponse {
  utterance: string;
  intent: ConversationIntent;
  topic?: string;
  sentiment: number;
  informationShared?: string;
  shouldContinue: boolean;       // Should conversation continue?
}

/**
 * ConversationMetrics - Analytics for conversation system
 */
export interface ConversationMetrics {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  averageConversationLength: number;
  informationDiffusionCount: number;
  conversationsByTrigger: Map<ConversationTrigger, number>;
  conversationsByAgent: Map<string, number>;
}

/**
 * ConversationConfig - Configuration for conversation system
 */
export interface ConversationConfig {
  maxConversationLength: number;     // Max turns per conversation
  conversationInterval: number;      // Time between turns (ms)
  proximityThreshold: number;        // Max distance for conversation (tiles)
  randomConversationChance: number;  // 0-1: Chance of random chat
  enableInformationDiffusion: boolean;
  enableConversationLogging: boolean;
}
