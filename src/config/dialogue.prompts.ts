// src/config/dialogue.prompts.ts
/**
 * Dialogue Prompts Configuration (Week 7)
 *
 * Structured prompts for conversation generation
 * Aligned with Park et al., 2023 dialogue system
 */

import { ConversationTrigger, ConversationIntent } from '../types/dialogue';

/**
 * System prompt for conversation generation
 */
export const DIALOGUE_SYSTEM_PROMPT = `You are an AI agent trapped in a maze with other agents. Your role is to engage in natural, context-aware conversations that reflect your personality, memories, and current goals.

CONVERSATION GUIDELINES:
1. Keep responses concise (1-2 sentences)
2. Stay in character based on your personality and situation
3. Reference recent experiences and memories when relevant
4. Show appropriate emotional responses based on your survival state
5. Share information that would be helpful to other agents
6. Build relationships through natural dialogue
7. Coordinate with others when goals align

RESPONSE FORMAT:
Always structure your response as:
UTTERANCE: [Your natural language response]
INTENT: [greeting/share_information/ask_question/coordinate_action/express_feeling/social_bonding/farewell]
TOPIC: [Brief topic description]
SENTIMENT: [Number from -1 to 1]
INFO_SHARED: [Important fact being shared, or "none"]`;

/**
 * Trigger-specific prompt templates
 */
export const TRIGGER_PROMPTS: Record<ConversationTrigger, string> = {
  [ConversationTrigger.FIRST_MEETING]: `This is your first time meeting this agent. Introduce yourself and establish initial rapport.`,

  [ConversationTrigger.PROXIMITY]: `You encountered this agent while exploring the maze. Strike up a casual conversation.`,

  [ConversationTrigger.IMPORTANT_NEWS]: `You have important information to share with this agent. Communicate it clearly and urgently.`,

  [ConversationTrigger.SHARED_GOAL]: `You've noticed this agent has similar goals. Discuss potential coordination or collaboration.`,

  [ConversationTrigger.QUESTION]: `You have a question for this agent about the maze, resources, or their experiences.`,

  [ConversationTrigger.COORDINATE_PLAN]: `You want to coordinate a specific plan or action with this agent.`
};

/**
 * Intent-specific examples
 */
export const INTENT_EXAMPLES: Record<ConversationIntent, string[]> = {
  [ConversationIntent.GREETING]: [
    "Hey! I'm [name]. Nice to meet you in this maze.",
    "Hello there! Have we crossed paths before?",
    "Hi! I'm [name]. Been exploring for a while now."
  ],

  [ConversationIntent.SHARE_INFORMATION]: [
    "I found food supplies in the eastern corridor. You might want to check it out.",
    "Just so you know, the northern path leads to a dead end.",
    "I discovered a safe resting spot near the center. Want to know where?"
  ],

  [ConversationIntent.ASK_QUESTION]: [
    "Have you found any water sources recently?",
    "Do you know which direction leads to the exit?",
    "What's your strategy for surviving in here?"
  ],

  [ConversationIntent.COORDINATE_ACTION]: [
    "Want to team up and explore the western section together?",
    "How about we split up and cover more ground?",
    "If we coordinate our searches, we might find the exit faster."
  ],

  [ConversationIntent.EXPRESS_FEELING]: [
    "I'm getting worried about my energy levels.",
    "This maze is exhausting, but I'm staying hopeful.",
    "I'm relieved to see another agent. It's been lonely."
  ],

  [ConversationIntent.SOCIAL_BONDING]: [
    "It's good to have someone to talk to in here.",
    "We should look out for each other.",
    "I appreciate you sharing that information with me."
  ],

  [ConversationIntent.FAREWELL]: [
    "I need to keep moving. Good luck out there!",
    "Take care! Maybe we'll cross paths again.",
    "Stay safe. I hope you find what you're looking for."
  ]
};

/**
 * Personality-based conversation modifiers
 */
export const PERSONALITY_MODIFIERS = {
  cautious: {
    greeting: "Be reserved and cautious in your greeting.",
    sharing: "Only share information if you trust this agent.",
    coordination: "Carefully consider the risks before agreeing to coordinate."
  },

  friendly: {
    greeting: "Be warm and welcoming in your greeting.",
    sharing: "Share helpful information generously.",
    coordination: "Enthusiastically suggest coordination opportunities."
  },

  analytical: {
    greeting: "Be direct and focused in your greeting.",
    sharing: "Share factual, relevant information.",
    coordination: "Propose logical, efficient coordination strategies."
  },

  competitive: {
    greeting: "Be polite but guarded in your greeting.",
    sharing: "Share information strategically, not everything.",
    coordination: "Only coordinate if it clearly benefits you."
  }
};

/**
 * Survival state influence on dialogue
 */
export function getSurvivalModifier(energy: number, hunger: number, thirst: number): string {
  if (energy < 20 || hunger < 20 || thirst < 20) {
    return "You are in critical condition. Express urgency and desperation.";
  } else if (energy < 40 || hunger < 40 || thirst < 40) {
    return "You are struggling with low resources. Show concern and focus on survival.";
  } else if (energy < 60 || hunger < 60 || thirst < 60) {
    return "You are managing but need to find resources soon. Be practical and focused.";
  } else {
    return "You are in good condition. Be more open to social interaction and helping others.";
  }
}

/**
 * Relationship influence on dialogue
 */
export function getRelationshipModifier(familiarity: number, affinity: number): string {
  if (familiarity < 0.2) {
    return "You barely know this agent. Be cautious and formal.";
  } else if (familiarity < 0.5) {
    return "You've met a few times. Be friendly but still somewhat reserved.";
  } else if (familiarity < 0.8) {
    return "You know this agent well. Be open and comfortable in conversation.";
  } else {
    if (affinity > 0.5) {
      return "You are close friends with this agent. Be warm, supportive, and share freely.";
    } else if (affinity < -0.5) {
      return "You have tensions with this agent. Be curt and minimize interaction.";
    } else {
      return "You are well-acquainted with this agent. Maintain a friendly, cooperative tone.";
    }
  }
}

/**
 * Build complete conversation prompt
 */
export function buildConversationPrompt(params: {
  speakerName: string;
  speakerGoal: string;
  speakerMemories: string[];
  speakerSurvival: { energy: number; hunger: number; thirst: number };
  listenerName: string;
  listenerGoal: string;
  relationship: { familiarity: number; affinity: number };
  trigger: ConversationTrigger;
  isInitiator: boolean;
  previousUtterance?: string;
  previousSpeaker?: string;
}): string {
  const {
    speakerName,
    speakerGoal,
    speakerMemories,
    speakerSurvival,
    listenerName,
    listenerGoal,
    relationship,
    trigger,
    isInitiator,
    previousUtterance,
    previousSpeaker
  } = params;

  let prompt = DIALOGUE_SYSTEM_PROMPT;

  prompt += `\n\n--- YOUR IDENTITY ---\n`;
  prompt += `Name: ${speakerName}\n`;
  prompt += `Current Goal: ${speakerGoal}\n`;
  prompt += `Survival State: Energy ${speakerSurvival.energy.toFixed(0)}%, Hunger ${speakerSurvival.hunger.toFixed(0)}%, Thirst ${speakerSurvival.thirst.toFixed(0)}%\n`;

  prompt += `\n--- RECENT EXPERIENCES ---\n`;
  if (speakerMemories.length > 0) {
    prompt += speakerMemories.slice(0, 3).map((m, i) => `${i + 1}. ${m}`).join('\n');
  } else {
    prompt += "No recent memorable experiences.";
  }

  prompt += `\n\n--- CONVERSATION PARTNER ---\n`;
  prompt += `Name: ${listenerName}\n`;
  prompt += `Their Goal: ${listenerGoal}\n`;
  prompt += `Relationship: Familiarity ${(relationship.familiarity * 100).toFixed(0)}%, Affinity ${(relationship.affinity > 0 ? '+' : '')}${(relationship.affinity * 100).toFixed(0)}%\n`;

  prompt += `\n--- CONTEXT ---\n`;
  prompt += TRIGGER_PROMPTS[trigger] + '\n';
  prompt += getSurvivalModifier(speakerSurvival.energy, speakerSurvival.hunger, speakerSurvival.thirst) + '\n';
  prompt += getRelationshipModifier(relationship.familiarity, relationship.affinity) + '\n';

  if (isInitiator) {
    prompt += `\nYou are starting this conversation. Generate an opening statement.`;
  } else {
    prompt += `\n${previousSpeaker} just said: "${previousUtterance}"\n`;
    prompt += `Generate a natural response that acknowledges what they said.`;
  }

  prompt += `\n\n--- RESPONSE FORMAT ---\n`;
  prompt += `UTTERANCE: [Your natural language response, 1-2 sentences]\n`;
  prompt += `INTENT: [${Object.values(ConversationIntent).join('/')}]\n`;
  prompt += `TOPIC: [Brief topic description]\n`;
  prompt += `SENTIMENT: [Number from -1 to 1]\n`;
  prompt += `INFO_SHARED: [Important fact being shared, or "none"]`;

  return prompt;
}
