# Week 8 Implementation: Enhanced Reflection & Question Generation

## Overview & Research Paper Alignment

### Connection to Paper (Park et al., 2023)
**Section 4.2: Reflection - Synthesizing Memories into Higher-Level Inferences**

The paper's reflection system has specific mechanisms we haven't fully implemented:

> "Reflection is periodically triggered by a **sum of importance scores** exceeding a threshold... The agent generates **high-level questions** about recent observations, then retrieves relevant memories to answer those questions, producing abstract insights."

**Key Features from Paper**:
1. **Importance-Sum Triggering**: Reflection occurs when importance accumulates (not time-based)
2. **LLM Question Generation**: System generates 3 questions from recent memories
3. **Recursive Reflection Trees**: Reflections can themselves be reflected upon
4. **Higher-Order Abstractions**: Move from specific (ate food) to general (I prioritize survival)

**Current Implementation Gap**:
- ⚠️ Reflection triggers on time intervals (not importance sum)
- ⚠️ Questions are heuristic-based (not LLM-generated)
- ⚠️ Single-level reflections (no meta-reflections)
- ⚠️ Limited integration with planning system

**Paper Alignment**: Currently 70% → Target 95% after Week 8

---

## Implementation Details

### Phase 1: Importance-Sum Triggering (Days 1-2)

#### Modify: `src/agent/ReflectionSystem.ts`

```typescript
export class ReflectionSystem {
  private importanceSum: number = 0;
  private readonly REFLECTION_THRESHOLD = 150; // From paper
  private lastReflectionTime: number = 0;

  /**
   * Track importance as memories are created
   */
  onMemoryCreated(memory: Memory): void {
    this.importanceSum += memory.importance;

    // Check if threshold exceeded
    if (this.importanceSum >= this.REFLECTION_THRESHOLD) {
      console.log(`🎯 Reflection threshold reached (${this.importanceSum})`);
      this.triggerReflection();
      this.importanceSum = 0; // Reset
    }
  }

  /**
   * Generate high-level questions using LLM
   */
  async generateReflectionQuestions(): Promise<string[]> {
    const recentMemories = this.agent.getMemoryStream()
      .getMemories()
      .slice(-100); // Last 100 memories

    const prompt = `Given these recent experiences:

${recentMemories.slice(0, 20).map((m, i) => `${i + 1}. ${m.content}`).join('\n')}

Generate 3 high-level questions that would help synthesize these experiences into insights.
Questions should ask about patterns, themes, or deeper meanings.

Example questions:
- What does this say about my priorities?
- What patterns am I noticing in my behavior?
- What have I learned about this environment?

Respond with:
QUESTION_1: [question]
QUESTION_2: [question]
QUESTION_3: [question]`;

    const response = await this.llmService.generateText(prompt);
    return this.parseQuestions(response);
  }

  /**
   * Generate reflection by answering questions
   */
  async generateReflectionFromQuestion(question: string): Promise<string> {
    // Retrieve relevant memories
    const relevant = await this.agent.getMemoryRetrieval()
      .retrieve(question, 100);

    const prompt = `Question: ${question}

Relevant experiences:
${relevant.slice(0, 10).map(r => `- ${r.memory.content}`).join('\n')}

Provide a thoughtful, abstract insight that answers this question.
Write 1-2 sentences as a high-level observation or conclusion.

Example: "I've learned that water scarcity is my biggest survival challenge, and I should prioritize finding water sources over exploration."`;

    const response = await this.llmService.generateText(prompt);
    return this.parseReflection(response);
  }
}
```

### Phase 2: Reflection Trees & Meta-Reflections (Days 3-5)

#### New File: `src/types/reflection.ts`

```typescript
export interface ReflectionNode {
  id: string;
  content: string;
  level: number;              // 0 = observation, 1 = reflection, 2 = meta-reflection
  parentIds: string[];        // Memories/reflections this is based on
  childIds: string[];         // Reflections derived from this
  importance: number;
  timestamp: number;
}

export interface ReflectionTree {
  rootObservations: string[]; // Base observations
  firstOrderReflections: ReflectionNode[]; // Level 1
  secondOrderReflections: ReflectionNode[]; // Level 2
  insights: string[];         // Key takeaways
}
```

#### Implement Recursive Reflection

```typescript
/**
 * Generate meta-reflection (reflection about reflections)
 */
async generateMetaReflection(): Promise<void> {
  const recentReflections = this.agent.getMemoryStream()
    .getMemoriesByType('reflection')
    .slice(-10);

  if (recentReflections.length < 5) return; // Need enough to reflect on

  const question = `What broader patterns emerge from my recent reflections?`;
  const metaReflection = await this.generateReflectionFromQuestion(question);

  // Store as level-2 reflection
  this.agent.addReflection(metaReflection, 9, recentReflections.map(r => r.id));
}
```

### Phase 3: Planning Integration (Days 6-7)

```typescript
/**
 * Use reflections to inform planning
 */
async enhancePlanWithReflections(context: PlanningContext): Promise<void> {
  const recentReflections = this.agent.getMemoryStream()
    .getMemoriesByType('reflection')
    .slice(-5)
    .map(r => r.content);

  // Add to planning context
  context.recentReflections = recentReflections;

  // Reflections influence plan priority and goals
  // e.g., "I've learned water is critical" → prioritize water in plan
}
```

### Phase 4: Visualization (Days 8-9)

#### New File: `src/ui/ReflectionTreePanel.ts`

```typescript
/**
 * Visualize reflection tree hierarchy
 * Shows how observations → reflections → meta-reflections
 */
export class ReflectionTreePanel {
  // Display tree structure with connections
  // Color-code by level
  // Show importance scores
  // Highlight recent reflections
}
```

---

## Deliverables

### Modified Files
1. `src/agent/ReflectionSystem.ts` (+200 lines)
2. `src/agent/MemoryStream.ts` (+50 lines)
3. `src/systems/PlanningSystem.ts` (+30 lines)

### New Files
1. `src/types/reflection.ts` (~150 lines)
2. `src/ui/ReflectionTreePanel.ts` (~300 lines)
3. `src/config/reflection.prompts.ts` (~200 lines)

### Total: ~930 lines

---

## Research Paper Alignment

**Before Week 8**: 70% reflection
**After Week 8**: 95% reflection
**Overall Paper Alignment**: 92% → 95%

---

## Key Improvements

1. ✅ Importance-sum triggering (matches paper exactly)
2. ✅ LLM-generated questions (not heuristic)
3. ✅ Recursive reflection trees (meta-reflections)
4. ✅ Better planning integration
5. ✅ Visualization of reflection hierarchy

**Paper Quote**:
> "Reflections are prompted when the sum of importance scores for the latest events exceeds a threshold." - Park et al., 2023
