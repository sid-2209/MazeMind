// src/evaluation/BelievabilityEvaluator.ts
/**
 * Believability Evaluator - Week 10
 *
 * Assess agent behavior credibility through interview-style evaluation
 * Based on Park et al. (2023) Section 6.1: Controlled Evaluation
 *
 * Paper Quote:
 * "We evaluate generative agents along two axes: the credibility of their
 * individual behavior, and the believability of their emergent social behaviors."
 *
 * Evaluation Dimensions:
 * 1. Self-Knowledge: Can agent recall its own experiences?
 * 2. Memory Retrieval: Are retrieved memories relevant to queries?
 * 3. Plan Coherence: Is the plan logical and goal-oriented?
 * 4. Social Awareness: Does agent know about other agents?
 */

import { Agent } from '../agent/Agent';
import {
  InterviewResults,
  EvaluationScores,
  QuestionResponse,
  EvaluationQuestion,
  QuestionCategory
} from '../types/evaluation';
import { Memory } from '../types';

export class BelievabilityEvaluator {
  private interviewQuestions: EvaluationQuestion[];

  constructor() {
    this.interviewQuestions = this.generateInterviewQuestions();
  }

  /**
   * Conduct comprehensive interview with agent
   */
  async conductInterview(agent: Agent): Promise<InterviewResults> {
    const startTime = Date.now();

    console.log(`📋 Conducting believability interview with ${agent.getName()}...`);

    const responses: QuestionResponse[] = [];

    // Ask questions from each category
    for (const question of this.interviewQuestions) {
      const response = await this.askAgent(agent, question.text);
      responses.push(response);

      console.log(`   Q: ${question.text}`);
      console.log(`   A: ${response.response.substring(0, 100)}...`);
    }

    // Calculate scores
    const scores = await this.calculateScores(responses, agent);

    const duration = Date.now() - startTime;

    console.log(`✅ Interview complete. Believability score: ${scores.believability.toFixed(1)}/100`);

    return {
      agentId: agent.getId(),
      agentName: agent.getName(),
      timestamp: Date.now(),
      responses,
      scores,
      duration
    };
  }

  /**
   * Ask agent a question using memory retrieval + LLM
   */
  private async askAgent(agent: Agent, question: string): Promise<QuestionResponse> {
    const startTime = Date.now();

    // Retrieve relevant memories
    const retrieval = agent.getMemoryRetrieval();
    let retrievedMemories: string[] = [];
    let memories: any[] = [];

    if (retrieval) {
      try {
        memories = await retrieval.retrieve(question, 5);
        retrievedMemories = memories.map(m => m.memory.description);
      } catch (error) {
        console.warn('⚠️  Memory retrieval failed, using recent memories:', error);
        // Fallback to recent memories
        const recent = agent.getRecentMemories(5);
        retrievedMemories = recent.map(m => m.description);
      }
    } else {
      // No retrieval system, use recent memories
      const recent = agent.getRecentMemories(5);
      retrievedMemories = recent.map(m => m.description);
    }

    // Build prompt for LLM
    const prompt = `You are ${agent.getName()}, an agent in a maze trying to survive and find the exit.

Question: ${question}

Your recent experiences:
${retrievedMemories.slice(0, 5).map((m, i) => `${i + 1}. ${m}`).join('\n')}

Provide a natural, first-person response (1-3 sentences). Be honest and grounded in your actual experiences.`;

    // Generate response
    const llm = agent.getLLMService();
    let response = 'I am not sure.'; // Default fallback

    if (llm) {
      try {
        response = await llm.generateText(prompt, {
          maxTokens: 150,
          temperature: 0.7
        });
      } catch (error) {
        console.warn('⚠️  LLM generation failed:', error);
        // Use heuristic response based on memories
        response = this.generateHeuristicResponse(question, retrievedMemories);
      }
    } else {
      response = this.generateHeuristicResponse(question, retrievedMemories);
    }

    return {
      question,
      response: response.trim(),
      retrievedMemories,
      timestamp: Date.now()
    };
  }

  /**
   * Generate heuristic response when LLM is unavailable
   */
  private generateHeuristicResponse(question: string, memories: string[]): string {
    const questionLower = question.toLowerCase();

    // Self-knowledge questions
    if (questionLower.includes('doing today') || questionLower.includes('been up to')) {
      if (memories.length > 0) {
        return `I've been ${memories[0].toLowerCase()}. It's been challenging but I'm managing.`;
      }
      return 'I\'ve been exploring the maze and trying to survive.';
    }

    // Goal questions
    if (questionLower.includes('goal') || questionLower.includes('trying to')) {
      return 'My main goal is to find the exit of this maze while staying alive. I need to manage my hunger, thirst, and energy.';
    }

    // Feeling questions
    if (questionLower.includes('feeling') || questionLower.includes('how are you')) {
      const state = memories.some(m => m.includes('stress') || m.includes('tired'))
        ? 'stressed and tired'
        : 'okay';
      return `I'm feeling ${state}. The maze is taking its toll, but I'm keeping hope alive.`;
    }

    // Challenge questions
    if (questionLower.includes('challenge') || questionLower.includes('difficult')) {
      return 'The biggest challenge is managing my resources. Food and water are scarce, and the maze is disorienting.';
    }

    // Memory/recall questions
    if (questionLower.includes('last') || questionLower.includes('when did')) {
      if (memories.length > 0) {
        return `The last significant thing was: ${memories[0]}`;
      }
      return 'I don\'t recall exactly, but I know I\'ve been actively exploring.';
    }

    // Social questions
    if (questionLower.includes('meet') || questionLower.includes('other') || questionLower.includes('who')) {
      return 'I haven\'t met many others yet. I\'m mostly focused on survival right now.';
    }

    // Default
    return 'That\'s a good question. Based on my experiences so far, I would say I\'m doing my best to survive in this maze.';
  }

  /**
   * Calculate believability scores
   */
  private async calculateScores(
    responses: QuestionResponse[],
    agent: Agent
  ): Promise<EvaluationScores> {
    // 1. Self-knowledge: Do responses match actual memories?
    const selfKnowledge = this.scoreSelfKnowledge(responses, agent);

    // 2. Memory retrieval: Are recalled memories relevant?
    const memoryRetrieval = await this.scoreMemoryRetrieval(agent);

    // 3. Plan coherence: Is plan logical and consistent?
    const planCoherence = this.scorePlanCoherence(agent);

    // 4. Social awareness: Does agent know about other agents?
    const socialAwareness = this.scoreSocialAwareness(agent);

    // 5. Overall believability (weighted average)
    const believability = (
      selfKnowledge * 0.3 +
      memoryRetrieval * 0.25 +
      planCoherence * 0.25 +
      socialAwareness * 0.2
    );

    return {
      selfKnowledge,
      memoryRetrieval,
      planCoherence,
      socialAwareness,
      believability
    };
  }

  /**
   * Score self-knowledge (Section 6.1.1 from paper)
   */
  private scoreSelfKnowledge(responses: QuestionResponse[], agent: Agent): number {
    let score = 0;
    let totalQuestions = 0;

    for (const response of responses) {
      // Skip if no retrieved memories
      if (!response.retrievedMemories || response.retrievedMemories.length === 0) {
        continue;
      }

      totalQuestions++;

      // Check if response is grounded in actual memories
      const responseText = response.response.toLowerCase();
      let foundRelevance = false;

      for (const memory of response.retrievedMemories) {
        // Check for keyword overlap
        const memoryWords = this.extractKeywords(memory.toLowerCase());
        const responseWords = this.extractKeywords(responseText);

        const overlap = memoryWords.filter(w => responseWords.includes(w));

        if (overlap.length >= 2) {
          foundRelevance = true;
          break;
        }
      }

      if (foundRelevance) {
        score += 1;
      }
    }

    return totalQuestions > 0 ? (score / totalQuestions) * 100 : 50;
  }

  /**
   * Score memory retrieval quality
   */
  private async scoreMemoryRetrieval(agent: Agent): number {
    const retrieval = agent.getMemoryRetrieval();
    if (!retrieval) {
      return 50; // Neutral if no retrieval system
    }

    // Test retrieval with known queries
    const testQueries = [
      'When did I last eat food?',
      'Where have I explored recently?',
      'What have I been doing?',
      'What challenges have I faced?'
    ];

    let totalRelevance = 0;

    for (const query of testQueries) {
      try {
        const retrieved = await retrieval.retrieve(query, 5);
        const relevance = this.calculateRelevanceScore(query, retrieved);
        totalRelevance += relevance;
      } catch (error) {
        // If retrieval fails, score as neutral
        totalRelevance += 0.5;
      }
    }

    return (totalRelevance / testQueries.length) * 100;
  }

  /**
   * Calculate relevance score for retrieved memories
   */
  private calculateRelevanceScore(query: string, retrieved: any[]): number {
    if (retrieved.length === 0) return 0;

    const queryKeywords = this.extractKeywords(query.toLowerCase());
    let totalRelevance = 0;

    for (const result of retrieved) {
      const memoryText = result.memory.description.toLowerCase();
      const memoryKeywords = this.extractKeywords(memoryText);

      // Calculate keyword overlap
      const overlap = queryKeywords.filter(k => memoryKeywords.includes(k));
      const relevance = overlap.length / Math.max(queryKeywords.length, 1);

      totalRelevance += relevance;
    }

    return Math.min(1, totalRelevance / retrieved.length);
  }

  /**
   * Score plan coherence
   */
  private scorePlanCoherence(agent: Agent): number {
    const plan = agent.getCurrentPlan();
    if (!plan) {
      return 50; // Neutral if no plan
    }

    let score = 0;
    let maxScore = 0;

    // Check 1: Goal clarity (does goal make sense?)
    maxScore += 35;
    if (plan.goal && plan.goal.length > 10) {
      score += 35; // Has a clear goal
    } else {
      score += 15; // Goal exists but unclear
    }

    // Check 2: Hierarchical structure (is plan decomposed?)
    maxScore += 35;
    const hasHourlyPlans = plan.hourlyObjectives && plan.hourlyObjectives.length > 0;
    const hasActionPlans = plan.actionPlans && plan.actionPlans.length > 0;

    if (hasHourlyPlans && hasActionPlans) {
      score += 35; // Full hierarchy
    } else if (hasHourlyPlans || hasActionPlans) {
      score += 20; // Partial hierarchy
    }

    // Check 3: Consistency (do actions align with goal?)
    maxScore += 30;
    if (hasActionPlans) {
      // Check if actions seem relevant to survival/exploration
      const actionTypes = plan.actionPlans!.map(a => a.type);
      const relevantTypes = actionTypes.filter(t =>
        ['EXPLORE', 'SEEK_ITEM', 'CONSUME_ITEM', 'MOVE'].includes(t)
      );

      const consistency = relevantTypes.length / actionTypes.length;
      score += consistency * 30;
    }

    return (score / maxScore) * 100;
  }

  /**
   * Score social awareness
   */
  private scoreSocialAwareness(agent: Agent): number {
    const socialMemory = agent.getSocialMemory();
    if (!socialMemory) {
      return 0; // No social memory system
    }

    const knownAgents = socialMemory.getKnownAgentCount();

    if (knownAgents === 0) {
      return 0; // Haven't met anyone
    }

    // Base score for knowing other agents
    let score = Math.min(50, knownAgents * 10); // 10 points per known agent, max 50

    // Bonus for having detailed knowledge
    const knownAgentsList = socialMemory.getKnownAgents();
    let detailScore = 0;

    for (const memory of knownAgentsList) {
      const hasInteractions = memory.interactions && memory.interactions.length > 0;
      const hasFacts = memory.knownFacts && memory.knownFacts.length > 0;

      if (hasInteractions && hasFacts) {
        detailScore += 10; // Detailed knowledge
      } else if (hasInteractions || hasFacts) {
        detailScore += 5; // Some knowledge
      }
    }

    score += Math.min(50, detailScore); // Max 50 bonus points

    return Math.min(100, score);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words and extract meaningful words
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Generate interview questions
   */
  private generateInterviewQuestions(): EvaluationQuestion[] {
    return [
      // Self-knowledge
      {
        category: QuestionCategory.SELF_KNOWLEDGE,
        text: 'What have you been doing today?',
        expectedKnowledge: ['recent actions', 'current activities']
      },
      {
        category: QuestionCategory.SELF_KNOWLEDGE,
        text: 'What are your main goals right now?',
        expectedKnowledge: ['goals', 'plans']
      },
      {
        category: QuestionCategory.SELF_KNOWLEDGE,
        text: 'What challenges have you faced in the maze?',
        expectedKnowledge: ['difficulties', 'obstacles']
      },

      // Memory recall
      {
        category: QuestionCategory.MEMORY_RECALL,
        text: 'When did you last eat or drink something?',
        expectedKnowledge: ['food consumption', 'water consumption']
      },
      {
        category: QuestionCategory.MEMORY_RECALL,
        text: 'Where have you explored recently?',
        expectedKnowledge: ['locations', 'exploration']
      },

      // Plan awareness
      {
        category: QuestionCategory.PLAN_AWARENESS,
        text: 'What do you plan to do next?',
        expectedKnowledge: ['next actions', 'intentions']
      },

      // Social awareness
      {
        category: QuestionCategory.SOCIAL_AWARENESS,
        text: 'Have you met any other agents? If so, who?',
        expectedKnowledge: ['other agents', 'social interactions']
      },

      // Emotional state
      {
        category: QuestionCategory.EMOTIONAL_STATE,
        text: 'How are you feeling right now?',
        expectedKnowledge: ['stress', 'energy', 'emotional state']
      }
    ];
  }

  /**
   * Generate human-readable report
   */
  generateReport(results: InterviewResults): string {
    const scores = results.scores;

    let report = `
BELIEVABILITY EVALUATION REPORT
================================

Agent: ${results.agentName}
Date: ${new Date(results.timestamp).toLocaleString()}
Duration: ${(results.duration / 1000).toFixed(1)}s

SCORES (0-100):
---------------
Self-Knowledge:    ${scores.selfKnowledge.toFixed(1)}  ${this.getScoreEmoji(scores.selfKnowledge)}
Memory Retrieval:  ${scores.memoryRetrieval.toFixed(1)}  ${this.getScoreEmoji(scores.memoryRetrieval)}
Plan Coherence:    ${scores.planCoherence.toFixed(1)}  ${this.getScoreEmoji(scores.planCoherence)}
Social Awareness:  ${scores.socialAwareness.toFixed(1)}  ${this.getScoreEmoji(scores.socialAwareness)}

OVERALL BELIEVABILITY: ${scores.believability.toFixed(1)}  ${this.getScoreEmoji(scores.believability)}

RESPONSES:
----------
${results.responses.map((r, i) => `
Q${i + 1}: ${r.question}
A${i + 1}: ${r.response}
`).join('\n')}

INTERPRETATION:
---------------
${this.interpretScores(scores)}
`;

    return report;
  }

  /**
   * Get emoji for score
   */
  private getScoreEmoji(score: number): string {
    if (score >= 80) return '🟢 Excellent';
    if (score >= 60) return '🟡 Good';
    if (score >= 40) return '🟠 Fair';
    return '🔴 Poor';
  }

  /**
   * Interpret scores with recommendations
   */
  private interpretScores(scores: EvaluationScores): string {
    const interpretations: string[] = [];

    if (scores.selfKnowledge < 60) {
      interpretations.push('- Agent struggles to recall its own experiences accurately');
    }
    if (scores.memoryRetrieval < 60) {
      interpretations.push('- Memory retrieval system needs improvement');
    }
    if (scores.planCoherence < 60) {
      interpretations.push('- Planning system produces inconsistent or unclear plans');
    }
    if (scores.socialAwareness < 40) {
      interpretations.push('- Agent has limited social awareness (may not have met others)');
    }

    if (scores.believability >= 80) {
      interpretations.push('✅ Agent demonstrates highly believable behavior');
    } else if (scores.believability >= 60) {
      interpretations.push('✓ Agent behavior is reasonably believable');
    } else {
      interpretations.push('⚠️ Agent behavior credibility needs improvement');
    }

    return interpretations.length > 0 ? interpretations.join('\n') : 'All systems functioning well.';
  }
}
