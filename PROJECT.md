# Maze Mind - Technical Documentation v0.1.0

> **Comprehensive technical documentation for Maze Mind: A generative agent simulation implementing Park et al. (2023) cognitive architecture**

[![Paper Alignment](https://img.shields.io/badge/paper%20alignment-87%25-brightgreen)](PAPER_ALIGNMENT_REPORT.md)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)]()
[![PixiJS](https://img.shields.io/badge/PixiJS-7.3-red)]()

**Quick Links**: [README](README.md) | [Contributing](CONTRIBUTING.md) | [Paper Alignment](PAPER_ALIGNMENT_REPORT.md) | [Changelog](CHANGELOG.md)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Structure](#2-architecture--structure)
3. [Agent Cognitive Architecture](#3-agent-cognitive-architecture)
4. [Multi-Agent Systems](#4-multi-agent-systems)
5. [Environment & World](#5-environment--world)
6. [Survival Mechanics](#6-survival-mechanics)
7. [Rendering & Visualization](#7-rendering--visualization)
8. [UI System](#8-ui-system)
9. [LLM Integration](#9-llm-integration)
10. [Evaluation Framework](#10-evaluation-framework)
11. [Configuration](#11-configuration)
12. [Key Algorithms](#12-key-algorithms)
13. [Technical Specifications](#13-technical-specifications)
14. [Implementation Status](#14-implementation-status)
15. [Research Foundation](#15-research-foundation)

---

## 1. Project Overview

### 1.1 What is Maze Mind?

**Maze Mind** is a research simulation implementing generative agent architecture based on Stanford's [Park et al. (2023)](https://arxiv.org/abs/2304.03442) paper *"Generative Agents: Interactive Simulacra of Human Behavior"*. It features autonomous AI agents with human-like memory, reflection, planning, and social interactions navigating a procedurally-generated survival maze.

### 1.2 Core Features

- 🧠 **Memory Stream**: Tri-factor retrieval (importance + recency + relevance)
- 🔄 **Recursive Reflection**: Multi-level abstraction with importance-sum triggering
- 📋 **Hierarchical Planning**: Daily → hourly → 5-minute action decomposition
- 💬 **Multi-Agent Dialogue**: Context-aware conversations with information diffusion
- 🌍 **Rich Environment**: Hierarchical world (areas → rooms → objects) with 14 action types
- 🎯 **Survival Mechanics**: Hunger, energy, stress affecting agent behavior
- 🗺️ **Fog of War**: Agent-perspective and god-mode views
- 📊 **Real-time Visualization**: 11 interactive panels for monitoring agent cognition

### 1.3 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Language | TypeScript | 5.2+ |
| Rendering | PixiJS | 7.3.2 |
| Build Tool | Vite | 4.5.0 |
| Animation | GSAP | 3.12 |
| LLM Providers | Anthropic Claude, Ollama | - |
| Embeddings | OpenAI, Voyage AI, Ollama | - |

### 1.4 Research Alignment

**Overall: 87%** alignment with Park et al. (2023)

| Component | Score | Status |
|-----------|-------|--------|
| Memory Stream | 100% | ✅ Complete |
| Reflection System | 95% | ✅ Complete |
| Planning & Decomposition | 85% | ✅ Complete |
| Environment & Actions | 85% | ✅ Complete |
| Dialogue System | 80% | ✅ Complete |
| Multi-Agent System | 75% | 🟡 Functional |
| Evaluation Framework | 75% | 🟡 Functional |

---

## 2. Architecture & Structure

### 2.1 Project Structure

```
maze-mind/
├── src/
│   ├── agent/              # Agent cognitive systems (13 files)
│   │   ├── Agent.ts                    # Main agent class
│   │   ├── MemoryStream.ts            # Memory storage & management
│   │   ├── MemoryRetrieval.ts         # Tri-factor retrieval
│   │   ├── ReflectionSystem.ts        # Recursive reflection (Week 8)
│   │   ├── SocialMemory.ts            # Inter-agent relationships
│   │   ├── DecisionMaker.ts           # Action selection
│   │   └── ActionExecutor.ts          # Action execution
│   │
│   ├── core/               # Game engine (3 files)
│   │   ├── Game.ts                    # Main game loop & initialization
│   │   ├── TimeManager.ts             # Day/night cycles, time acceleration
│   │   └── InputManager.ts            # Keyboard/mouse input
│   │
│   ├── systems/            # Game systems (20 files)
│   │   ├── AgentManager.ts            # Multi-agent coordination
│   │   ├── ConversationManager.ts     # Dialogue system (Week 7)
│   │   ├── PlanningSystem.ts          # Hierarchical planning (Week 5)
│   │   ├── WorldHierarchy.ts          # Environment structure (Week 9)
│   │   ├── CooperativePlanningSystem.ts
│   │   ├── RoleEmergenceSystem.ts
│   │   ├── StressManager.ts
│   │   ├── SurvivalSystem.ts
│   │   └── DataCollector.ts           # Metrics & evaluation
│   │
│   ├── maze/               # Maze generation (5 files)
│   │   ├── MazeGenerator.ts           # Prim's algorithm
│   │   ├── MazeGraph.ts               # Graph representation
│   │   ├── PathFinder.ts              # A* pathfinding
│   │   └── Tile.ts                    # Tile entity
│   │
│   ├── rendering/          # PixiJS rendering (9 files)
│   │   ├── Renderer.ts                # Main rendering pipeline
│   │   ├── MazeRenderer.ts            # Maze visualization
│   │   ├── AgentRenderer.ts           # Agent sprites
│   │   ├── Camera.ts                  # Camera system
│   │   ├── FogOfWar.ts               # Visibility system (Week 8)
│   │   ├── LightingSystem.ts         # Day/night lighting
│   │   └── ViewModeManager.ts        # View mode switching
│   │
│   ├── ui/                 # User interface (17 files)
│   │   ├── UIManager.ts               # UI coordinator
│   │   ├── SurvivalPanel.ts           # Survival metrics
│   │   ├── PlanningPanel.ts           # Planning display
│   │   ├── ConversationPanel.ts       # Dialogue viewer
│   │   ├── ReflectionTreePanel.ts     # Reflection hierarchy
│   │   ├── LocationTreePanel.ts       # World structure
│   │   ├── MultiAgentPanel.ts         # Agent overview
│   │   ├── MiniMap.ts                 # Maze minimap
│   │   └── DebugPanel.ts              # Debug tools
│   │
│   ├── services/           # External services (8 files)
│   │   ├── LLMService.ts              # Multi-provider LLM
│   │   ├── EmbeddingService.ts        # Multi-provider embeddings
│   │   ├── AnthropicService.ts        # Claude integration
│   │   └── OllamaService.ts           # Local LLM support
│   │
│   ├── evaluation/         # Evaluation framework (6 files)
│   │   ├── BelievabilityEvaluator.ts  # Believability metrics
│   │   ├── AlignmentReport.ts         # Paper alignment scoring
│   │   └── EvaluationRunner.ts        # Automated evaluation
│   │
│   ├── config/             # Configuration (10 files)
│   │   ├── game.config.ts             # Game settings
│   │   ├── arth.profile.ts            # Agent profiles
│   │   ├── planning.prompts.ts        # LLM prompts
│   │   └── environment.config.ts      # World settings
│   │
│   ├── types/              # TypeScript definitions (15 files)
│   │   ├── index.ts                   # Core types
│   │   ├── agent.ts                   # Agent types
│   │   ├── memory.ts                  # Memory types
│   │   ├── planning.ts                # Planning types
│   │   ├── reflection.ts              # Reflection types
│   │   ├── conversation.ts            # Dialogue types
│   │   ├── environment.ts             # World types
│   │   └── evaluation.ts              # Evaluation types
│   │
│   ├── utils/              # Utilities (4 files)
│   │   ├── PanelDragManager.ts        # UI drag functionality
│   │   ├── MathUtils.ts               # Math helpers
│   │   └── ColorUtils.ts              # Color utilities
│   │
│   └── main.ts            # Application entry point
│
├── public/                # Static assets
│   └── assets/
│       ├── sprites/       # Character animations
│       ├── tiles/         # Maze tiles
│       └── ui/            # UI elements
│
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite build config
├── README.md              # User documentation
├── CONTRIBUTING.md        # Contribution guidelines
├── CHANGELOG.md           # Version history
├── LICENSE                # MIT License
└── PROJECT.md             # This file
```

### 2.2 Core Game Loop

```
Game.init()
    ↓
Generate Maze (Prim's algorithm, 20x20)
    ↓
Initialize PixiJS Renderer
    ↓
Setup Time Management (day/night cycles)
    ↓
Initialize World Hierarchy (areas → rooms → objects)
    ↓
Initialize Survival Systems (items, resources)
    ↓
Create Agents (memory, planning, social systems)
    ↓
Setup Fog of War & View Modes
    ↓
Initialize UI Panels (11 interactive panels)
    ↓
START GAME LOOP (60 FPS)
    ↓
┌─────────────────────────────────────┐
│ Update Time System                  │
│ Update Agents (movement, survival)  │
│ Update Social Interactions          │
│ Update Conversations                │
│ Update Map Sharing                  │
│ Update Cooperative Planning         │
│ Evaluate Role Emergence             │
│ Update View Modes & Fog of War      │
│ Render Frame                        │
└─────────────────────────────────────┘
    ↑                                   │
    └───────────────────────────────────┘
```

### 2.3 Data Flow

```
Environment Perception
    ↓
Observation Generation (natural language)
    ↓
Memory Storage (with embedding)
    ↓
Importance-Sum Accumulation
    ↓
Reflection Trigger (≥150 threshold)
    ↓
Question Generation (LLM)
    ↓
Memory Retrieval (tri-factor scoring)
    ↓
Answer Synthesis (LLM)
    ↓
Reflection Storage (as new memory)
    ↓
Planning Context Update
    ↓
Plan Generation (daily → hourly → 5-min)
    ↓
Action Selection (from plan)
    ↓
Action Execution
    ↓
Environment Update
    ↓
[Loop back to Environment Perception]
```

---

## 3. Agent Cognitive Architecture

### 3.1 Memory Stream (`src/agent/MemoryStream.ts`)

**Implementation**: Park et al. (2023) Section 3 & 4

#### Memory Structure

```typescript
interface Memory {
  id: string;                    // UUID
  description: string;           // Natural language
  timestamp: number;             // Game time
  lastAccessTime: number;        // For recency calculation
  memoryType: MemoryType;       // OBSERVATION | REFLECTION | PLAN
  importance: number;            // 1-10 scale
  tags: string[];               // Categorization
  location?: Position;          // Spatial context
  embedding?: number[];         // For relevance scoring
}
```

#### Memory Types

1. **Observations**: Direct perceptions
   - Environmental: "I see a water bottle in the northern corridor"
   - Internal: "My hunger level is dropping to 45%"
   - Social: "I encountered Vani near the junction"
   - Importance: 4-7 (routine to important)

2. **Reflections**: High-level insights
   - First-order: "I tend to find more resources in the eastern areas"
   - Meta-reflection: "My exploration strategy has become more systematic"
   - Importance: 7-9 (always high)

3. **Plans**: Future-oriented
   - Daily: "Today's goal: Find sustainable water source"
   - Hourly: "Next hour: Explore unvisited western corridor"
   - Action: "Next 5 minutes: Move to position (12, 8)"
   - Importance: 6-8 (based on urgency)

#### Memory Management

**Capacity**: 10,000 memories (configurable)

**Pruning Strategy** (when over capacity):
```typescript
retentionScore = (recency × 0.4) + (importance × 0.6)
// Remove lowest 10% retention scores
```

**Access Pattern**:
- Memories updated with `lastAccessTime` on retrieval
- Frequently accessed memories naturally ranked higher via recency

### 3.2 Memory Retrieval (`src/agent/MemoryRetrieval.ts`)

**Implementation**: Park et al. (2023) Section 4.1

#### Tri-Factor Scoring

```typescript
function retrieveMemories(query: string, k: number = 10): Memory[] {
  const queryEmbedding = await embeddingService.embed(query);

  const scored = memories.map(memory => {
    // 1. Recency Score (exponential decay)
    const hoursAgo = (currentTime - memory.lastAccessTime) / 3600;
    const recency = Math.exp(-hoursAgo / 24);  // Half-life: 24 hours

    // 2. Importance Score (normalized)
    const importance = memory.importance / 10;

    // 3. Relevance Score (cosine similarity)
    const relevance = cosineSimilarity(queryEmbedding, memory.embedding);

    // Combined score (equal weighting)
    const finalScore = (recency × 1.0) + (importance × 1.0) + (relevance × 1.0);

    return { memory, score: finalScore };
  });

  // Return top-k
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(item => item.memory);
}
```

#### Embedding Providers

**1. OpenAI** (`text-embedding-3-small`):
- Dimensions: 1536
- Quality: High
- Speed: ~100ms per embedding
- Cost: $0.00002/1K tokens

**2. Voyage AI** (`voyage-2`):
- Dimensions: 1024
- Quality: High
- Speed: ~150ms per embedding
- Cost: $0.00012/1K tokens

**3. Ollama** (`nomic-embed-text`):
- Dimensions: 768
- Quality: Good
- Speed: ~50ms per embedding (local)
- Cost: Free (self-hosted)

**Fallback Chain**: OpenAI → Voyage → Ollama → Fake (random vectors)

**Caching**: 10,000 most recent embeddings cached in memory

### 3.3 Reflection System (`src/agent/ReflectionSystem.ts`)

**Implementation**: Enhanced Week 8, based on Park et al. Section 4.2

#### Reflection Triggers

**1. Importance-Sum Trigger** (PRIMARY):
```typescript
onMemoryCreated(memory: Memory): void {
  this.importanceSum += memory.importance;

  if (this.importanceSum >= 150) {  // Paper threshold
    console.log('🎯 Importance threshold reached!');
    this.performEnhancedReflection();
    this.importanceSum = 0;
  }
}
```

**2. Time-Based Trigger** (FALLBACK):
- Every 120 seconds (2 game hours)
- Ensures reflection even during low-activity periods

**3. Manual Trigger**:
- For testing or significant events

#### Enhanced Reflection Process

**Phase 1: Question Generation**
```typescript
const questions = await llm.generate(`
Given recent experiences:
${recentMemories.map(m => m.description).join('\n')}

Generate 3 high-level questions that explore patterns, learnings, or insights.

Examples:
- What patterns have I noticed in resource distribution?
- How has my exploration strategy evolved?
- What have I learned about managing stress in the maze?
`);
```

**Heuristic Fallback** (if LLM unavailable):
- "What patterns have I noticed recently?"
- "What have I learned from my recent experiences?"
- "How should I adjust my strategy based on recent observations?"

**Phase 2: Evidence Retrieval**
```typescript
for (const question of questions) {
  // Retrieve 10-20 relevant memories
  const evidence = await memoryRetrieval.retrieve(question, 15);

  // Generate answer grounded in evidence
  const answer = await llm.generate(`
Question: ${question}

Evidence from my memories:
${evidence.map(m => `- ${m.description}`).join('\n')}

Synthesize a concise answer (2-3 sentences) based on this evidence.
  `);

  reflections.push({
    question,
    answer,
    evidenceIds: evidence.map(m => m.id)
  });
}
```

**Phase 3: Reflection Storage**
```typescript
interface ReflectionNode {
  id: string;
  content: string;              // The reflection text
  question?: string;            // Generating question
  level: number;                // 1 (first-order), 2 (meta), 3+ (higher)
  timestamp: number;
  importance: number;           // 7-9 (always high)
  confidence: number;           // 0-1 (model confidence)
  category: ReflectionCategory; // strategy, pattern, emotional, learning
  parentIds: string[];          // Source memories/reflections
  childIds: string[];          // Derived reflections
  evidenceIds: string[];       // Supporting evidence
}
```

**Phase 4: Meta-Reflection** (Recursive)
```typescript
// Triggered when ≥5 first-order reflections accumulated
if (firstOrderReflections.length >= 5) {
  const metaReflection = await llm.generate(`
Given these insights I've gained:
${firstOrderReflections.map(r => r.content).join('\n')}

What higher-order patterns or principles emerge?
Synthesize a meta-insight (2-3 sentences).
  `);

  // Store as 2nd-order reflection
  storeReflection(metaReflection, level: 2, parentIds: [reflection ids]);
}

// Can recurse to level 3+ for very deep abstractions
```

#### Reflection Tree Structure

```
Level 0: Observations (raw perceptions)
    ├─ "Found water bottle at (15, 8)"
    ├─ "Found food in eastern corridor"
    └─ "Hunger dropped to 45%"
         ↓
Level 1: First-Order Reflections (insights)
    ├─ "Eastern areas tend to have more resources"
    ├─ "Resource density increases near junctions"
    └─ "My survival deteriorates fastest while exploring"
         ↓
Level 2: Meta-Reflections (patterns across reflections)
    ├─ "My exploration strategy has become more systematic"
    └─ "I've learned to balance exploration with survival needs"
         ↓
Level 3+: Higher-Order Reflections (deep abstractions)
    └─ "Success in the maze requires adaptive risk management"
```

#### Reflection Categories

- **strategy**: Planning and decision-making insights
- **pattern**: Observed regularities in environment or behavior
- **emotional**: Psychological states and stress management
- **learning**: Skill acquisition and knowledge gains
- **social**: Inter-agent dynamics and relationships
- **meta**: Reflections about the reflection process itself

#### Statistics Tracked

```typescript
interface ReflectionStatistics {
  totalReflections: number;
  firstOrderCount: number;
  secondOrderCount: number;
  higherOrderCount: number;

  byCategory: Record<ReflectionCategory, number>;

  averageConfidence: number;
  questionsGenerated: number;
  questionsAnswered: number;

  importanceSumTriggers: number;
  timeTriggers: number;

  currentImportanceSum: number;
  nextTriggerAt: number;  // 150 threshold
}
```

### 3.4 Planning System (`src/systems/PlanningSystem.ts`)

**Implementation**: Park et al. Section 4.3

#### Three-Level Planning Hierarchy

```typescript
interface DailyPlan {
  id: string;
  goal: string;              // "Find sustainable water source"
  reasoning: string;         // Why this goal matters
  priority: Priority;        // CRITICAL | HIGH | MEDIUM | LOW
  startTime: number;
  endTime: number;           // +24 game hours
  hourlyPlans: HourlyPlan[]; // 3 hourly plans
  status: PlanStatus;
}

interface HourlyPlan {
  id: string;
  objective: string;         // "Explore western corridor thoroughly"
  dailyPlanId: string;
  startTime: number;
  endTime: number;           // +60 game minutes
  actions: ActionPlan[];     // 12 five-minute actions
  status: PlanStatus;
}

interface ActionPlan {
  id: string;
  action: string;            // "Move to position (12, 8)"
  actionType: ActionType;    // MOVE | EXPLORE | CONSUME_ITEM | REST
  hourlyPlanId: string;
  startTime: number;
  endTime: number;           // +5 game minutes
  targetPosition?: Position;
  targetItem?: string;
  status: PlanStatus;        // PENDING | IN_PROGRESS | COMPLETED | ABANDONED
}
```

#### Action Types

- **MOVE**: Navigate to specific position
- **EXPLORE**: Systematic area exploration
- **CONSUME_ITEM**: Eat, drink, use medical supplies
- **SEEK_ITEM**: Search for specific item type
- **REST**: Recover energy
- **REFLECT**: Deliberate reflection session
- **WAIT**: Pause for observation
- **INTERACT_OBJECT**: Use environmental objects (Week 9)
- **SOCIALIZE**: Initiate conversation (Week 7)

#### Plan Generation Context (Week 9 Enhanced)

```typescript
interface PlanningContext {
  // Survival State
  hunger: number;
  thirst: number;
  energy: number;
  stress: number;

  // Location Context (Week 9)
  currentPosition: Position;
  currentArea: string;
  currentRoom: string;
  roomDescription: string;
  nearbyObjects: GameObject[];  // With capabilities

  // Exploration
  tilesExplored: number;
  totalTiles: number;
  explorationProgress: number;

  // Known Resources
  knownItems: ItemLocation[];

  // Cognitive State
  recentMemories: Memory[];      // Last 5
  recentReflections: Memory[];   // Top 5 by importance
  currentPlans: Plan[];

  // Social (Multi-agent)
  knownAgents: AgentInfo[];
  recentConversations: Conversation[];
}
```

#### Plan Generation Process

```typescript
async function generatePlan(context: PlanningContext): Promise<DailyPlan> {
  // 1. Generate daily goal
  const dailyGoal = await llm.generate(dailyPlanPrompt(context));

  // 2. Decompose into 3 hourly objectives
  const hourlyPlans: HourlyPlan[] = [];
  for (let hour = 0; hour < 3; hour++) {
    const hourlyObjective = await llm.generate(
      hourlyPlanPrompt(dailyGoal, hour, context)
    );

    // 3. Decompose each hour into 12 five-minute actions
    const actions: ActionPlan[] = [];
    for (let minute = 0; minute < 60; minute += 5) {
      const action = await llm.generate(
        actionPlanPrompt(hourlyObjective, minute, context)
      );
      actions.push(action);
    }

    hourlyPlans.push({
      objective: hourlyObjective,
      actions,
      ...timestamps
    });
  }

  return {
    goal: dailyGoal,
    hourlyPlans,
    ...metadata
  };
}
```

#### Re-planning Triggers

**1. Critical Survival Needs**:
```typescript
if (hunger < 20 || thirst < 20 || energy < 20) {
  console.log('🚨 Critical survival state - replanning');
  replan(CRISIS_SURVIVAL);
}
```

**2. Significant Discovery**:
```typescript
if (itemsFoundInLastHour >= 3) {
  console.log('🎉 Multiple items found - adjusting plan');
  replan(RESOURCE_ABUNDANCE);
}
```

**3. Plan Completion**:
```typescript
if (currentPlan.allActionsCompleted) {
  console.log('✅ Plan completed - generating next plan');
  replan(NORMAL);
}
```

**4. Major Divergence**:
```typescript
if (actualProgress < expectedProgress * 0.5) {
  console.log('⚠️ Significant deviation - replanning');
  replan(COURSE_CORRECTION);
}
```

**5. Exit Proximity**:
```typescript
if (distanceToExit < 5) {
  console.log('🎯 Exit detected nearby - priority shift');
  replan(EXIT_APPROACH);
}
```

### 3.5 Decision Making & Action Execution

#### DecisionMaker (`src/agent/DecisionMaker.ts`)

```typescript
async function makeDecision(): Promise<Action> {
  // 1. Get current action from plan
  const currentAction = this.getCurrentAction();

  // 2. Check if plan is still valid
  if (!currentAction || this.isPlanOutdated()) {
    await this.triggerReplanning();
    return { type: 'WAIT', reason: 'Replanning' };
  }

  // 3. Query relevant memories for context
  const context = await this.memoryRetrieval.retrieve(
    `How should I execute: ${currentAction.description}?`,
    k: 5
  );

  // 4. Execute action
  return this.actionExecutor.execute(currentAction, context);
}
```

#### ActionExecutor (`src/agent/ActionExecutor.ts`)

**Responsibilities**:
- Translate high-level actions to low-level movement
- Interact with environment objects
- Update agent state (hunger, energy, stress)
- Record observations in memory

```typescript
async function execute(action: ActionPlan, context: Memory[]): Promise<void> {
  switch (action.actionType) {
    case 'MOVE':
      await this.moveToPosition(action.targetPosition);
      break;

    case 'CONSUME_ITEM':
      const item = this.findNearbyItem(action.targetItem);
      if (item) {
        this.consumeItem(item);
        this.recordObservation(`Consumed ${item.name}, restored resources`);
      }
      break;

    case 'INTERACT_OBJECT':  // Week 9
      const obj = this.worldHierarchy.getObject(action.targetObjectId);
      if (obj && obj.capabilities.includes(action.capability)) {
        this.performObjectAction(obj, action.capability);
        this.recordObservation(
          `Used ${obj.name} to ${action.capability}, ${action.effect}`
        );
      }
      break;

    case 'REST':
      this.agent.rest(duration: 300);  // 5 minutes
      this.recordObservation('Rested for 5 minutes, recovered energy');
      break;

    // ... other action types
  }

  // Mark action completed
  action.status = 'COMPLETED';
}
```

---

## 4. Multi-Agent Systems

### 4.1 Agent Manager (`src/systems/AgentManager.ts`)

**Responsibilities**:
- Create and manage multiple agents
- Track social interactions
- Detect proximity for conversation triggers
- Coordinate agent updates

#### Predefined Agents (Week 6)

**1. Arth** (Green, 0x4CAF50)
- **Personality**: Analytical, strategic, methodical
- **Background**: Engineer, 28 years old
- **Traits**: Calm under pressure, problem-solver
- **Skills**: Pattern recognition, systematic exploration
- **Starting Position**: South entrance

**2. Vani** (Blue, 0x2196F3)
- **Personality**: Intuitive, creative, adaptive
- **Background**: Artist, 26 years old
- **Traits**: Observant, empathetic
- **Skills**: Environmental awareness, social connection
- **Starting Position**: Southeast entrance

**3. Kael** (Purple, 0x9C27B0)
- **Personality**: Cautious, methodical, risk-averse
- **Background**: Researcher, 30 years old
- **Traits**: Thorough, detail-oriented
- **Skills**: Resource management, careful planning
- **Starting Position**: Southwest entrance

#### Social Interaction Tracking

```typescript
interface SocialInteraction {
  id: string;
  participants: string[];        // Agent IDs
  type: InteractionType;
  location: Position;
  timestamp: number;
  duration: number;
  outcome: InteractionOutcome;
  metadata: Record<string, any>;
}

enum InteractionType {
  ENCOUNTER = 'ENCOUNTER',       // First meeting
  DIALOGUE = 'DIALOGUE',         // Conversation
  COOPERATION = 'COOPERATION',   // Working together
  CONFLICT = 'CONFLICT',         // Disagreement
  OBSERVATION = 'OBSERVATION'    // Watching from distance
}
```

### 4.2 Social Memory (`src/agent/SocialMemory.ts`)

#### Per-Agent Social State

```typescript
interface SocialMemory {
  knownAgents: Map<string, KnownAgentInfo>;
  relationships: Map<string, Relationship>;
  conversationHistory: Conversation[];
  knownFacts: KnownFact[];       // Information learned from others
}

interface KnownAgentInfo {
  agentId: string;
  name: string;
  firstMetAt: number;
  lastSeenAt: number;
  encounterCount: number;
  appearance: string;            // "green agent" or "agent in blue"
}

interface Relationship {
  targetAgentId: string;

  // Relationship Dimensions (Park et al. Section 5.3)
  familiarity: number;           // 0-1: How well they know each other
  affinity: number;              // -1 to 1: Like/dislike
  trust: number;                 // 0-1: Reliability perception

  // Interaction History
  interactionCount: number;
  lastInteractionTime: number;
  recentInteractions: SocialInteraction[];  // Last 10

  // Shared Context
  sharedExperiences: string[];
  commonGoals: string[];
}
```

#### Relationship Updates

```typescript
function updateRelationship(
  agentId: string,
  interaction: SocialInteraction
): void {
  const relationship = this.getRelationship(agentId);

  // Increase familiarity with each interaction
  relationship.familiarity = Math.min(
    1.0,
    relationship.familiarity + 0.05
  );

  // Adjust affinity based on interaction outcome
  if (interaction.outcome === 'POSITIVE') {
    relationship.affinity += 0.1;
  } else if (interaction.outcome === 'NEGATIVE') {
    relationship.affinity -= 0.15;
  }

  // Trust evolves slowly based on consistency
  if (interaction.type === 'COOPERATION') {
    relationship.trust += 0.02;
  }

  // Clamp values
  relationship.affinity = Math.max(-1, Math.min(1, relationship.affinity));
  relationship.trust = Math.max(0, Math.min(1, relationship.trust));

  relationship.interactionCount++;
  relationship.lastInteractionTime = currentTime;
}
```

#### Known Facts System

```typescript
interface KnownFact {
  id: string;
  fact: string;                  // "Eastern corridor has water"
  source: string;                // Agent ID who shared
  learnedAt: number;
  confidence: number;            // 0-1
  verified: boolean;             // If agent confirmed personally
}
```

### 4.3 Conversation System (`src/systems/ConversationManager.ts`)

**Implementation**: Park et al. Section 4.4

#### Conversation Triggers (Priority Order)

**1. First Meeting** (Highest Priority):
```typescript
if (!agent1.socialMemory.knows(agent2.id)) {
  initiateConversation(agent1, agent2, 'FIRST_MEETING');
}
```

**2. Important News**:
```typescript
if (agent.hasHighImportanceMemory(importance >= 8, age < 600)) {
  initiateConversation(agent, nearbyAgent, 'INFORMATION_SHARING');
}
```

**3. Shared Goal**:
```typescript
if (similarGoals(agent1.currentPlan, agent2.currentPlan)) {
  initiateConversation(agent1, agent2, 'COORDINATION');
}
```

**4. Proximity** (Random):
```typescript
if (distance(agent1, agent2) <= 3 && Math.random() < 0.1) {
  initiateConversation(agent1, agent2, 'CASUAL');
}
```

#### Conversation Flow

```typescript
async function generateUtterance(
  speaker: Agent,
  listener: Agent,
  context: ConversationContext
): Promise<Utterance> {
  // 1. Build context
  const relationship = speaker.socialMemory.getRelationship(listener.id);
  const recentMemories = speaker.memoryStream.getRecent(5);
  const currentGoal = speaker.planningSystem.getCurrentGoal();
  const previousConversations = speaker.socialMemory.getConversationHistory(
    listener.id,
    limit: 3
  );

  // 2. Generate utterance via LLM
  const prompt = `
You are ${speaker.name}. You're talking to ${listener.name}.

Relationship: Familiarity ${relationship.familiarity.toFixed(2)},
             Affinity ${relationship.affinity.toFixed(2)}

Your recent experiences:
${recentMemories.map(m => m.description).join('\n')}

Your current goal: ${currentGoal}

Previous conversations:
${previousConversations.map(c =>
  `${c.speaker}: ${c.utterance}`
).join('\n')}

Generate a natural utterance (1-2 sentences) appropriate for this context.
  `;

  const utterance = await llm.generate(prompt);

  // 3. Parse intent and information
  const parsed = await llm.generate(`
Analyze this utterance: "${utterance}"

Extract:
- Intent: GREETING | INFORMATION_SHARING | QUESTION | SUGGESTION | etc.
- Topic: What is the main subject?
- Sentiment: POSITIVE | NEUTRAL | NEGATIVE
- Information: Any facts or knowledge being shared
  `);

  return {
    speaker: speaker.id,
    listener: listener.id,
    utterance,
    intent: parsed.intent,
    topic: parsed.topic,
    sentiment: parsed.sentiment,
    information: parsed.information,
    timestamp: currentTime
  };
}
```

#### Information Diffusion

```typescript
function processInformationSharing(utterance: Utterance): void {
  if (utterance.information) {
    // Listener learns the information
    listener.socialMemory.addKnownFact({
      fact: utterance.information,
      source: utterance.speaker,
      learnedAt: currentTime,
      confidence: 0.7,  // Not personally verified
      verified: false
    });

    // Track diffusion path
    this.informationDiffusion.record({
      information: utterance.information,
      origin: utterance.speaker,
      recipient: utterance.listener,
      timestamp: currentTime
    });
  }
}
```

#### Conversation Storage

```typescript
interface Conversation {
  id: string;
  participants: string[];
  turns: Utterance[];
  startTime: number;
  endTime: number;
  location: Position;

  // Outcomes
  informationShared: string[];
  relationshipChange: Record<string, number>;  // Affinity delta per participant
  emergentGoals: string[];                     // New plans formed
}
```

### 4.4 Cooperative Planning (`src/systems/CooperativePlanningSystem.ts`)

#### Group Goal Detection

```typescript
interface GroupGoal {
  id: string;
  goal: string;                  // "Explore western wing together"
  participants: string[];
  confidence: number;            // How aligned the goals are
  createdAt: number;
}

function detectGroupGoals(): GroupGoal[] {
  const agents = this.agentManager.getAllAgents();
  const groupGoals: GroupGoal[] = [];

  // Analyze all pairs of agents
  for (const [agent1, agent2] of combinations(agents, 2)) {
    const plan1 = agent1.planningSystem.getCurrentPlan();
    const plan2 = agent2.planningSystem.getCurrentPlan();

    // Check goal similarity (via embedding similarity)
    const similarity = cosineSimilarity(
      await embed(plan1.goal),
      await embed(plan2.goal)
    );

    if (similarity > 0.7) {
      groupGoals.push({
        goal: synthesizeCommonGoal(plan1.goal, plan2.goal),
        participants: [agent1.id, agent2.id],
        confidence: similarity,
        createdAt: currentTime
      });
    }
  }

  return groupGoals;
}
```

#### Plan Coordination

```typescript
interface CoordinatedPlan {
  groupGoalId: string;
  participants: string[];
  roles: Record<string, Role>;   // agentId → role
  schedule: CoordinatedAction[];
  status: PlanStatus;
}

enum Role {
  EXPLORER = 'EXPLORER',         // Scout ahead
  GATHERER = 'GATHERER',         // Collect resources
  GUARD = 'GUARD',               // Protect group
  COORDINATOR = 'COORDINATOR'    // Direct group actions
}
```

### 4.5 Role Emergence (`src/systems/RoleEmergenceSystem.ts`)

#### Emergent Role Detection

```typescript
interface EmergentRole {
  agentId: string;
  role: Role;
  confidence: number;            // 0-1
  evidence: RoleEvidence[];
  detectedAt: number;
}

interface RoleEvidence {
  metric: string;                // "explorationFrequency"
  value: number;
  normalizedValue: number;       // Z-score vs other agents
  timestamp: number;
}

function detectRoles(): EmergentRole[] {
  const agents = this.agentManager.getAllAgents();
  const roles: EmergentRole[] = [];

  for (const agent of agents) {
    const metrics = this.calculateRoleMetrics(agent);

    // EXPLORER: High exploration, low resource focus
    if (metrics.explorationFrequency > 0.7 &&
        metrics.timeExploring > 0.6) {
      roles.push({
        agentId: agent.id,
        role: 'EXPLORER',
        confidence: (metrics.explorationFrequency + metrics.timeExploring) / 2,
        evidence: [...metrics],
        detectedAt: currentTime
      });
    }

    // GATHERER: High resource collection, systematic
    if (metrics.resourceGatheringRate > 0.7 &&
        metrics.inventoryUtilization > 0.6) {
      roles.push({
        agentId: agent.id,
        role: 'GATHERER',
        confidence: (metrics.resourceGatheringRate + metrics.inventoryUtilization) / 2,
        evidence: [...metrics],
        detectedAt: currentTime
      });
    }

    // COMMUNICATOR: High social interaction
    if (metrics.conversationFrequency > 0.7 &&
        metrics.informationSharingRate > 0.6) {
      roles.push({
        agentId: agent.id,
        role: 'COMMUNICATOR',
        confidence: (metrics.conversationFrequency + metrics.informationSharingRate) / 2,
        evidence: [...metrics],
        detectedAt: currentTime
      });
    }

    // Additional roles: PLANNER, SURVIVOR, etc.
  }

  return roles;
}
```

---

## 5. Environment & World

### 5.1 Maze Generation (`src/maze/MazeGenerator.ts`)

**Algorithm**: Randomized Prim's Algorithm

#### Configuration

```typescript
interface MazeConfig {
  width: number;                 // Default: 20 tiles
  height: number;                // Default: 20 tiles
  complexity: number;            // 0-1, default: 0.7 (branching factor)
  deadEnds: number;              // Default: 5 (intentional dead ends)
  seed?: string;                 // Optional for reproducibility
}
```

#### Generation Process

```typescript
function generateMaze(config: MazeConfig): Maze {
  // 1. Initialize grid (all walls)
  const grid = new Array(height).fill(null).map(() =>
    new Array(width).fill(TileType.WALL)
  );

  // 2. Start from random position
  const start = { x: 1, y: 1 };
  grid[start.y][start.x] = TileType.FLOOR;

  // 3. Add walls to frontier
  const frontier = getAdjacentWalls(start);

  // 4. Prim's algorithm
  while (frontier.length > 0) {
    const wall = randomChoice(frontier, seed);
    const neighbors = getFloorNeighbors(wall);

    if (neighbors.length === 1) {
      // Create passage
      grid[wall.y][wall.x] = TileType.FLOOR;

      // Add new frontier walls
      frontier.push(...getAdjacentWalls(wall));
    }

    frontier.remove(wall);
  }

  // 5. Add complexity (extra passages)
  for (let i = 0; i < config.complexity * 100; i++) {
    const wall = randomWall(grid);
    if (canMakePassage(wall)) {
      grid[wall.y][wall.x] = TileType.FLOOR;
    }
  }

  // 6. Add entrance (south side)
  const entrance = { x: Math.floor(width / 2), y: height - 1 };
  grid[entrance.y][entrance.x] = TileType.ENTRANCE;

  // 7. Add exit (north side)
  const exit = { x: Math.floor(width / 2), y: 0 };
  grid[exit.y][exit.x] = TileType.EXIT;

  return {
    width,
    height,
    tiles: grid,
    entrance,
    exit,
    seed: config.seed
  };
}
```

#### Multi-Agent Entrances (Week 6)

```typescript
function addMultipleEntrances(maze: Maze, count: number): Position[] {
  const entrances: Position[] = [maze.entrance]; // Keep original

  // Add additional entrances on south side
  for (let i = 1; i < count; i++) {
    const x = Math.floor(maze.width * (i / count));
    const entrance = { x, y: maze.height - 1 };
    maze.tiles[entrance.y][entrance.x] = TileType.ENTRANCE;
    entrances.push(entrance);
  }

  return entrances;
}
```

### 5.2 World Hierarchy (`src/systems/WorldHierarchy.ts`)

**Implementation**: Week 9, based on Park et al. Section 5

#### Hierarchy Structure

```
World (Root)
    ├─ Area: North Wing
    │   ├─ Room: Kitchen
    │   │   ├─ Object: Stove [cook_at]
    │   │   ├─ Object: Counter [examine]
    │   │   ├─ Object: Sink [wash_at, drink_from]
    │   │   └─ Object: Table [sit_at]
    │   ├─ Room: Bedroom
    │   │   ├─ Object: Bed [sit_on, sleep_on]
    │   │   ├─ Object: Dresser [search, examine]
    │   │   └─ Object: Nightstand [search, examine]
    │   └─ ...
    ├─ Area: East Wing
    ├─ Area: South Wing
    └─ Area: West Wing
```

#### Node Types

```typescript
interface WorldNode {
  id: string;
  name: string;
  type: LocationType;            // WORLD | AREA | ROOM | CORRIDOR
  description: string;
  position?: Position;           // Tile coordinates
  parent: string | null;         // Parent node ID
  children: string[];            // Child node/object IDs
  metadata: Record<string, any>;
}

enum LocationType {
  WORLD = 'WORLD',
  AREA = 'AREA',
  ROOM = 'ROOM',
  CORRIDOR = 'CORRIDOR'
}
```

#### Room Templates (8 Types)

**1. Kitchen**
```typescript
{
  type: 'KITCHEN',
  objects: [
    { name: 'Stove', capabilities: ['cook_at'], icon: '🔥' },
    { name: 'Counter', capabilities: ['examine'], icon: '🪵' },
    { name: 'Sink', capabilities: ['wash_at', 'drink_from'], icon: '🚰' },
    { name: 'Table', capabilities: ['sit_at'], icon: '🪑' },
    { name: 'Chair', capabilities: ['sit_on'], icon: '🪑' },
    { name: 'Pantry', capabilities: ['search', 'open', 'close'], icon: '🚪' }
  ]
}
```

**2. Bedroom**
```typescript
{
  type: 'BEDROOM',
  objects: [
    { name: 'Bed', capabilities: ['sit_on', 'sleep_on'], icon: '🛏️' },
    { name: 'Dresser', capabilities: ['search', 'examine', 'open'], icon: '🗄️' },
    { name: 'Nightstand', capabilities: ['search', 'examine'], icon: '🪑' },
    { name: 'Wardrobe', capabilities: ['open', 'close', 'search'], icon: '👔' },
    { name: 'Mirror', capabilities: ['examine'], icon: '🪞' }
  ]
}
```

**3. Study**
```typescript
{
  type: 'STUDY',
  objects: [
    { name: 'Desk', capabilities: ['sit_at', 'write_at'], icon: '🪑' },
    { name: 'Bookshelf', capabilities: ['read_from', 'examine'], icon: '📚' },
    { name: 'Chair', capabilities: ['sit_on'], icon: '🪑' },
    { name: 'Lamp', capabilities: ['light', 'extinguish'], icon: '💡' },
    { name: 'Filing Cabinet', capabilities: ['search', 'open'], icon: '🗄️' }
  ]
}
```

**4. Storage**
```typescript
{
  type: 'STORAGE',
  objects: [
    { name: 'Shelves', capabilities: ['search', 'examine'], icon: '🪜' },
    { name: 'Crates', capabilities: ['search', 'open'], icon: '📦' },
    { name: 'Toolbox', capabilities: ['search', 'examine'], icon: '🧰' }
  ]
}
```

**5-8. Hallway, Junction, Restroom, Common Area** (similar structure)

#### Object System

```typescript
interface GameObject {
  id: string;
  name: string;
  description: string;
  visualIcon: string;            // Emoji for display
  position: Position;
  parentRoomId: string;

  // Affordances (Park et al. Section 5.2)
  capabilities: ObjectCapability[];

  // State
  state: ObjectState;            // OPEN | CLOSED | LOCKED | BROKEN
  isInteractive: boolean;
  metadata: Record<string, any>;
}

type ObjectCapability =
  | 'sit_on'      // Chairs, beds
  | 'sleep_on'    // Beds
  | 'sit_at'      // Desks, tables
  | 'cook_at'     // Stoves
  | 'read_from'   // Bookshelves
  | 'write_at'    // Desks
  | 'drink_from'  // Sinks, fountains
  | 'wash_at'     // Sinks
  | 'search'      // Drawers, crates
  | 'examine'     // All objects
  | 'open'        // Doors, containers
  | 'close'       // Doors, containers
  | 'light'       // Lamps
  | 'extinguish'; // Lamps
```

#### Action Effects

```typescript
interface ActionEffect {
  capability: ObjectCapability;
  effects: {
    hunger?: number;
    thirst?: number;
    energy?: number;
    stress?: number;
    duration?: number;           // Seconds
  };
}

const ACTION_EFFECTS: Record<ObjectCapability, ActionEffect> = {
  sleep_on: { energy: +50, stress: -20, duration: 3600 },  // 1 hour
  sit_on: { energy: +10, stress: -5, duration: 300 },      // 5 minutes
  cook_at: { hunger: +40, duration: 600 },                 // 10 minutes
  drink_from: { thirst: +30, duration: 60 },               // 1 minute
  read_from: { stress: -10, duration: 1200 },              // 20 minutes
  wash_at: { stress: -5, duration: 300 },                  // 5 minutes
  // ...
};
```

#### Natural Language Descriptions

```typescript
function generateRoomDescription(room: WorldNode): string {
  const objects = this.getObjectsInRoom(room.id);

  const intro = `You are in a ${room.name.toLowerCase()}.`;

  const objectDescriptions = objects.map(obj => {
    const caps = obj.capabilities.join(', ');
    return `There is a ${obj.name} with ${caps} capability`;
  }).join('. ');

  return `${intro} ${objectDescriptions}.`;
}

// Example output:
// "You are in a small kitchen. There is a stove with cook_at capability.
//  There is a counter with examine capability. There is a sink with
//  wash_at, drink_from capabilities."
```

#### Spatial Queries

```typescript
// Get agent's current location in hierarchy
function getAgentLocation(agentPosition: Position): LocationInfo {
  const room = this.getRoomAtPosition(agentPosition);
  const area = room ? this.getParent(room.id) : null;

  return {
    world: this.root.name,
    area: area?.name,
    room: room?.name,
    position: agentPosition,
    description: room ? this.generateRoomDescription(room) : null
  };
}

// Find nearest object with capability
function findNearestObjectWithCapability(
  position: Position,
  capability: ObjectCapability
): GameObject | null {
  const allObjects = this.getAllObjects();

  return allObjects
    .filter(obj => obj.capabilities.includes(capability))
    .sort((a, b) =>
      distance(position, a.position) - distance(position, b.position)
    )[0] || null;
}
```

### 5.3 Pathfinding (`src/maze/PathFinder.ts`)

**Algorithm**: A* with Manhattan distance heuristic

```typescript
function findPath(start: Position, goal: Position, maze: Maze): Position[] {
  const openSet = new PriorityQueue<Node>();
  const closedSet = new Set<string>();

  openSet.enqueue({
    position: start,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal),
    parent: null
  });

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();

    if (equals(current.position, goal)) {
      return reconstructPath(current);
    }

    closedSet.add(positionKey(current.position));

    for (const neighbor of getNeighbors(current.position, maze)) {
      if (closedSet.has(positionKey(neighbor))) continue;

      const g = current.g + 1;
      const h = manhattanDistance(neighbor, goal);
      const f = g + h;

      const existing = openSet.find(neighbor);
      if (!existing || g < existing.g) {
        openSet.enqueue({
          position: neighbor,
          g, h, f,
          parent: current
        });
      }
    }
  }

  return []; // No path found
}
```

---

## 6. Survival Mechanics

### 6.1 Resource System

#### Resource Types (0-100%)

```typescript
interface SurvivalState {
  hunger: number;                // 100 = full, 0 = starving
  thirst: number;                // 100 = hydrated, 0 = dehydrated
  energy: number;                // 100 = rested, 0 = exhausted
  health: number;                // 100 = healthy, 0 = dead
  stress: number;                // 0 = calm, 100 = breakdown
}
```

#### Depletion Rates

```typescript
const DEPLETION_RATES = {
  hunger: {
    idle: -1.5,                  // % per game hour
    moving: -2.5,
    running: -3.5
  },
  thirst: {
    idle: -2.0,
    moving: -3.5,
    running: -5.0
  },
  energy: {
    idle: -1.0,
    moving: -2.0,
    running: -5.0,
    sleeping: +10.0              // Recovery
  }
};
```

#### Resource Thresholds

| Status | Range | Effects |
|--------|-------|---------|
| **Well** | 70-100% | Optimal performance, no impairment |
| **Low** | 40-70% | Slight performance degradation, increased stress |
| **Critical** | 15-40% | Severe impairment, planning affected, high stress |
| **Death** | 0-15% | Imminent death (hunger/thirst) or collapse (energy) |

### 6.2 Stress System (`src/systems/StressManager.ts`)

#### Stress Factors

```typescript
interface StressFactors {
  // Resource Stress
  hungerStress: number;          // +0.1/hour per critical resource
  thirstStress: number;
  energyStress: number;

  // Environmental Stress
  darknessStress: number;        // +0.05/hour at night
  lostStress: number;            // +0.08/hour if no progress

  // Physical Stress
  injuryStress: number;          // +0.15/hour if injured
  painStress: number;

  // Psychological Stress
  isolationStress: number;       // +0.03/hour if alone (multi-agent)
  uncertaintyStress: number;     // +0.02/hour baseline
  nearDeathStress: number;       // +0.3/hour if any resource < 15%
}

function calculateStressIncrease(deltaTime: number): number {
  let stressIncrease = 0;

  // Resource stress
  if (this.hunger < 40) stressIncrease += 0.1 * deltaTime;
  if (this.thirst < 40) stressIncrease += 0.1 * deltaTime;
  if (this.energy < 40) stressIncrease += 0.1 * deltaTime;

  // Environmental
  if (this.isNightTime) stressIncrease += 0.05 * deltaTime;
  if (this.noProgressInLast(3600)) stressIncrease += 0.08 * deltaTime;

  // Critical state
  if (this.isNearDeath()) stressIncrease += 0.3 * deltaTime;

  // Baseline uncertainty
  stressIncrease += 0.02 * deltaTime;

  return stressIncrease;
}
```

#### Stress Effects

| Stress Level | Range | Effects |
|--------------|-------|---------|
| **Calm** | 0-30% | No impairment, optimal decision-making |
| **Mild** | 30-50% | Slightly reduced focus, minor anxiety |
| **Moderate** | 50-70% | Degraded planning quality, increased impulsivity |
| **High** | 70-85% | Significant cognitive impairment, poor decisions |
| **Severe** | 85-95% | Panic behavior, memory impairment, hallucinations possible |
| **Breakdown** | 95-100% | Mental collapse, functional death |

#### Stress Management

```typescript
function applyStressEffects(stress: number): void {
  if (stress > 70) {
    // Degrade decision quality
    this.decisionQuality = Math.max(0.2, 1 - (stress - 70) / 30);

    // Increase impulsivity (shorter planning horizon)
    this.planningHorizon = Math.max(300, 3600 * (1 - stress / 100));

    // Memory impairment
    this.memoryRetrievalAccuracy = Math.max(0.5, 1 - stress / 100);
  }

  if (stress > 85) {
    // Panic behavior
    this.behaviorMode = 'PANIC';

    // Possible hallucinations (false observations)
    if (Math.random() < (stress - 85) / 15) {
      this.generateHallucination();
    }
  }

  if (stress >= 100) {
    // Mental breakdown
    this.status = 'MENTAL_BREAKDOWN';
    this.canAct = false;
  }
}
```

### 6.3 Items & Resources

#### Item Types

```typescript
interface Item {
  id: string;
  type: ItemType;
  name: string;
  position: Position;
  quantity: number;
  effects: ResourceEffects;
  icon: string;
}

enum ItemType {
  FOOD = 'FOOD',
  WATER = 'WATER',
  ENERGY = 'ENERGY',
  MEDICAL = 'MEDICAL'
}

interface ResourceEffects {
  hunger?: number;               // Restoration amount
  thirst?: number;
  energy?: number;
  health?: number;
  stress?: number;
}
```

#### Specific Items

**Food Items**:
```typescript
{
  type: 'FOOD',
  items: [
    { name: 'Dried Fruit', hunger: +20, energy: +5 },
    { name: 'Protein Bar', hunger: +25, energy: +10 },
    { name: 'Nuts', hunger: +15, energy: +5 },
    { name: 'Energy Bar', hunger: +15, energy: +20 }
  ]
}
```

**Water Items**:
```typescript
{
  type: 'WATER',
  items: [
    { name: 'Water Bottle', thirst: +25 },
    { name: 'Canteen', thirst: +30 },
    { name: 'Sports Drink', thirst: +20, energy: +10 }
  ]
}
```

**Medical Items**:
```typescript
{
  type: 'MEDICAL',
  items: [
    { name: 'Bandage', health: +15, stress: -5 },
    { name: 'Pain Reliever', health: +10, stress: -15 },
    { name: 'First Aid Kit', health: +30, stress: -10 }
  ]
}
```

#### Item Spawning

```typescript
function spawnItems(maze: Maze): Item[] {
  const items: Item[] = [];

  // Food: 4 locations, 1-3 units each
  for (let i = 0; i < 4; i++) {
    const position = findEmptyTile(maze);
    items.push({
      type: 'FOOD',
      name: randomChoice(['Dried Fruit', 'Protein Bar', 'Nuts']),
      position,
      quantity: randomInt(1, 3),
      effects: { hunger: +20 }
    });
  }

  // Water: 3 locations, 2-4 units each
  for (let i = 0; i < 3; i++) {
    const position = findEmptyTile(maze);
    items.push({
      type: 'WATER',
      name: 'Water Bottle',
      position,
      quantity: randomInt(2, 4),
      effects: { thirst: +25 }
    });
  }

  // Medical: 1 location, 1-2 units (rare)
  const position = findEmptyTile(maze);
  items.push({
    type: 'MEDICAL',
    name: 'First Aid Kit',
    position,
    quantity: randomInt(1, 2),
    effects: { health: +30, stress: -10 }
  });

  return items;
}
```

---

## 7. Rendering & Visualization

### 7.1 PixiJS Rendering Pipeline (`src/rendering/Renderer.ts`)

#### Layer Architecture

```typescript
const RENDER_LAYERS = {
  BASE: 0,           // Maze floor tiles
  WALLS: 1,          // Wall tiles
  ITEMS: 2,          // Food, water, medical items
  AGENTS: 3,         // Agent sprites
  FOG: 4,            // Fog of war overlay
  UI: 5              // UI panels and overlays
};
```

#### Rendering Order

```
1. Maze Base Layer (floor tiles with texture)
2. Wall Layer (walls with day/night coloring)
3. Item Layer (resource pickups with icons)
4. Agent Layer (agent sprites with animations)
5. Fog of War Layer (visibility overlay)
6. UI Layer (panels, minimap, debug info)
```

### 7.2 Camera System (`src/rendering/Camera.ts`)

#### Features

```typescript
interface Camera {
  position: Point;               // Camera center
  zoom: number;                  // 0.5x - 2.0x
  target: Agent | null;          // Follow target
  bounds: Rectangle;             // World bounds
  smoothing: number;             // Lerp factor (0.1)
}
```

#### Camera Modes

**Follow Mode** (Default):
```typescript
function updateFollowMode(target: Agent, deltaTime: number): void {
  // Smooth follow with lerp
  const targetX = target.x - this.viewport.width / 2;
  const targetY = target.y - this.viewport.height / 2;

  this.position.x += (targetX - this.position.x) * this.smoothing;
  this.position.y += (targetY - this.position.y) * this.smoothing;

  // Clamp to bounds
  this.position.x = Math.max(0, Math.min(this.bounds.width - this.viewport.width, this.position.x));
  this.position.y = Math.max(0, Math.min(this.bounds.height - this.viewport.height, this.position.y));
}
```

**Free Camera**:
- Manual control with arrow keys or WASD
- No automatic following

#### Zoom Levels

| Level | Zoom | Use Case |
|-------|------|----------|
| 1 | 0.5x | Full maze overview |
| 2 | 0.75x | Wide area view |
| 3 | 1.0x | Normal (default) |
| 4 | 1.5x | Close-up |
| 5 | 2.0x | Detail inspection |

### 7.3 Lighting System (`src/rendering/LightingSystem.ts`)

#### Day/Night Cycle

```typescript
enum TimePeriod {
  DAWN = 'DAWN',       // 6:00 - 8:00
  DAY = 'DAY',         // 8:00 - 18:00
  DUSK = 'DUSK',       // 18:00 - 20:00
  NIGHT = 'NIGHT'      // 20:00 - 6:00
}

const PERIOD_COLORS = {
  DAWN: 0xffaa88,      // Warm orange
  DAY: 0xffffff,       // Bright white
  DUSK: 0xff8844,      // Orange-red
  NIGHT: 0x4466aa      // Blue-tinted
};

function updateLighting(period: TimePeriod): void {
  const targetColor = PERIOD_COLORS[period];
  const currentColor = this.ambientLight.tint;

  // Smooth transition (30 second blend)
  this.ambientLight.tint = lerpColor(currentColor, targetColor, 0.01);

  // Adjust brightness
  this.ambientLight.alpha = period === 'NIGHT' ? 0.4 : 1.0;
}
```

### 7.4 Fog of War (`src/rendering/FogOfWar.ts`)

**Implementation**: Week 8 (Day 8)

#### Fog States

```typescript
enum FogState {
  UNEXPLORED = 'UNEXPLORED',   // Never seen (completely black)
  EXPLORED = 'EXPLORED',       // Previously seen (dimmed gray)
  VISIBLE = 'VISIBLE'          // Currently visible (full color)
}
```

#### Vision System

```typescript
interface VisionConfig {
  dayVisionRange: number;       // 2 tiles (5x5 grid)
  nightVisionRange: number;     // 1 tile (3x3 grid)
  canSeeThroughWalls: boolean;  // false
  visionAngle: number;          // 360° (omnidirectional)
}

function updateVisibility(agent: Agent): void {
  const range = this.isNight ?
    this.nightVisionRange :
    this.dayVisionRange;

  // Update fog states
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const tileX = agent.tileX + dx;
      const tileY = agent.tileY + dy;

      if (this.isInBounds(tileX, tileY)) {
        // Check line of sight
        if (this.hasLineOfSight(agent, { x: tileX, y: tileY })) {
          this.fogState[tileY][tileX] = FogState.VISIBLE;
          this.explored[tileY][tileX] = true;
        } else if (this.explored[tileY][tileX]) {
          this.fogState[tileY][tileX] = FogState.EXPLORED;
        }
      }
    }
  }
}
```

#### Line of Sight (Bresenham's Algorithm)

```typescript
function hasLineOfSight(from: Position, to: Position): boolean {
  const points = bresenham(from, to);

  for (const point of points) {
    if (this.maze.hasWall(point)) {
      return false;  // Wall blocks vision
    }
  }

  return true;
}

function bresenham(p0: Position, p1: Position): Position[] {
  const points: Position[] = [];

  let x0 = p0.x, y0 = p0.y;
  const x1 = p1.x, y1 = p1.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }

  return points;
}
```

#### Fog Rendering

```typescript
function renderFog(): void {
  for (let y = 0; y < this.height; y++) {
    for (let x = 0; x < this.width; x++) {
      const fog = this.fogSprites[y][x];

      switch (this.fogState[y][x]) {
        case FogState.UNEXPLORED:
          fog.alpha = 1.0;         // Completely black
          fog.tint = 0x000000;
          break;

        case FogState.EXPLORED:
          fog.alpha = 0.5;         // Semi-transparent
          fog.tint = 0x333333;     // Dark gray
          break;

        case FogState.VISIBLE:
          fog.alpha = 0.0;         // Fully transparent
          break;
      }
    }
  }
}
```

### 7.5 View Modes (`src/rendering/ViewModeManager.ts`)

#### Available Modes

```typescript
enum ViewMode {
  AGENT_POV = 'AGENT_POV',       // Agent perspective (fog of war active)
  GOD_MODE = 'GOD_MODE',         // See everything (no fog)
  MIXED_MODE = 'MIXED_MODE',     // See explored areas + current vision
  DEBUG_MODE = 'DEBUG_MODE',     // God mode + debug overlays
  REPLAY_MODE = 'REPLAY_MODE'    // For analyzing recorded sessions
}
```

#### Mode Configurations

**Agent POV** (Realistic):
- Fog of war: Active
- Vision range: 2 tiles (day), 1 tile (night)
- Show only currently visible tiles
- Most challenging

**God Mode** (Testing):
- Fog of war: Disabled
- Vision range: Infinite
- See entire maze
- All agents visible
- For development/testing

**Mixed Mode** (Default Game):
- Fog of war: Partial
- Show all explored areas (dimmed)
- Show current vision (bright)
- Balanced gameplay experience

**Debug Mode** (Development):
- God mode enabled
- Grid overlay visible
- Tile coordinates shown
- Vision cone visualized
- Pathfinding debug lines
- FPS counter always visible

---

## 8. UI System

### 8.1 UI Manager (`src/ui/UIManager.ts`)

**Responsibilities**:
- Initialize all UI panels
- Position panels on screen
- Handle keyboard shortcuts
- Coordinate panel updates
- Manage panel visibility

### 8.2 Interactive Panels (11 Total)

#### 1. Survival Panel (`src/ui/SurvivalPanel.ts`)

**Features**:
- Multi-agent survival metrics
- Expandable per-agent details
- Color-coded health indicators
- Resource bars (hunger, thirst, energy, stress)

**Display**:
```
┌─ SURVIVAL (3 agents) ─────────┐
│ Arth                          │
│   Hunger: ████████░░ 80%      │
│   Thirst: ██████░░░░ 60%      │
│   Energy: ████████░░ 75%      │
│   Stress: ████░░░░░░ 35%      │
│                               │
│ Vani                          │
│   [Collapsed view]            │
│                               │
│ Kael                          │
│   [Collapsed view]            │
└───────────────────────────────┘
```

#### 2. Planning Panel (`src/ui/PlanningPanel.ts`)

**Features**:
- Current daily goal display
- Active hourly objective
- Next 5-minute action
- Plan status indicators
- Time remaining

**Display**:
```
┌─ PLANNING ────────────────────┐
│ Daily Goal (12:35 remaining)  │
│ "Find sustainable water"      │
│                               │
│ Current Objective             │
│ "Explore western corridor"    │
│                               │
│ Next Action (2:15)            │
│ [→] Move to (12, 8)          │
│                               │
│ Status: ● IN_PROGRESS         │
└───────────────────────────────┘
```

#### 3. Conversation Panel (`src/ui/ConversationPanel.ts`)

**Features**:
- Active conversations display
- Conversation history (last 10 turns)
- Speaker identification
- Sentiment indicators
- Information diffusion tracking

**Display**:
```
┌─ CONVERSATIONS ───────────────┐
│ Arth → Vani (3 turns)         │
│                               │
│ Arth: "I found water in the  │
│        eastern corridor."     │
│   [INFORMATION_SHARING] 😊    │
│                               │
│ Vani: "That's helpful! I'll  │
│        check there next."     │
│   [ACKNOWLEDGMENT] 😊         │
│                               │
│ [Show older messages...]      │
└───────────────────────────────┘
```

#### 4. Reflection Tree Panel (`src/ui/ReflectionTreePanel.ts`)

**Features**:
- Hierarchical reflection display
- 1st/2nd/higher order reflections shown
- Importance and confidence scores
- Category color-coding
- Evidence tracking

**Display**:
```
┌─ REFLECTION TREE ─────────────┐
│ Importance: 87/150            │
│ ▓▓▓▓▓▓▓▓░░░░░░                │
│                               │
│ Recent Reflections            │
│                               │
│ ● [L2] META                   │
│   "My exploration has become  │
│    more systematic"           │
│   Importance: 8 | Conf: 85%   │
│                               │
│ ● [L1] STRATEGY               │
│   "Eastern areas have more    │
│    resources"                 │
│   Importance: 7 | Conf: 90%   │
│                               │
│ [5 more reflections...]       │
└───────────────────────────────┘
```

#### 5. Location Tree Panel (`src/ui/LocationTreePanel.ts`)

**Features**:
- World hierarchy visualization
- Area → Room → Object breakdown
- Object capabilities listed
- Current location highlighted
- Collapsible tree structure

**Display**:
```
┌─ LOCATION TREE ───────────────┐
│ 4 Areas | 12 Rooms | 45 Obj   │
│                               │
│ ▼ 🌍 Maze                     │
│   ▼ 📍 North Wing             │
│     ▶ 🚪 Kitchen              │
│     ▼ 🚪 Bedroom ← YOU        │
│       🛏️ Bed [sit_on, sleep]│
│       🗄️ Dresser [search]    │
│       🪑 Chair [sit_on]       │
│   ▶ 📍 East Wing              │
│   ▶ 📍 South Wing             │
│   ▶ 📍 West Wing              │
└───────────────────────────────┘
```

#### 6. Multi-Agent Panel (`src/ui/MultiAgentPanel.ts`)

**Features**:
- All agents overview
- Quick stats per agent
- Agent selection/switching
- Distance calculations
- Status at a glance

**Display**:
```
┌─ AGENTS (3 active) ───────────┐
│ ● Arth (Green)                │
│   Pos: (12, 8) | Exploring    │
│   H:80% T:60% E:75% S:35%     │
│                               │
│ ● Vani (Blue)                 │
│   Pos: (8, 15) | Planning     │
│   H:90% T:85% E:50% S:40%     │
│   Distance from Arth: 9 tiles │
│                               │
│ ● Kael (Purple)               │
│   Pos: (15, 12) | Resting     │
│   H:70% T:70% E:40% S:55%     │
│   Distance from Arth: 5 tiles │
└───────────────────────────────┘
```

#### 7-11. Additional Panels

**7. MiniMap** (`src/ui/MiniMap.ts`):
- Maze overview (150x150px)
- Explored tiles shown
- Agent positions marked
- Real-time updates

**8. Debug Panel** (`src/ui/DebugPanel.ts`):
- FPS counter
- Agent position
- Memory count
- Tile info
- Camera info

**9. Embedding Metrics** (`src/ui/EmbeddingMetricsPanel.ts`):
- Embedding provider status
- Cache statistics
- Performance metrics

**10. Embedding Visualization** (`src/ui/EmbeddingVisualizationPanel.ts`):
- Memory embedding visualization
- Clustering display

**11. Current Run** (`src/ui/CurrentRunPanel.ts`):
- Run ID and timestamp
- Survival time
- Items consumed
- Tiles explored
- Outcome status

### 8.3 Keyboard Controls

| Key | Action | Category |
|-----|--------|----------|
| **Arrow Keys** | Move agent (manual mode) | Movement |
| **Space** | Pause/Resume | Control |
| **Home** | Reset camera | View |
| **Mouse Wheel** | Zoom in/out | View |
| **A** | Toggle autonomous/manual | Mode |
| **L** | Cycle LLM provider | Configuration |
| **Z** | Multi-agent panel | Panel |
| **S** | Survival panel | Panel |
| **M** | Memory visualization | Panel |
| **P** | Planning panel | Panel |
| **D** | Dialogue panel | Panel |
| **F** | Reflection tree | Panel |
| **G** | Location tree | Panel |
| **E** | Embedding metrics | Panel |
| **I** | Debug panel | Panel |
| **C** | Current run panel | Panel |
| **H** | Help/Controls overlay | Help |
| **V / B** | Cycle view modes | View |
| **T** | Skip time period | Time |
| **[ / ]** | Decrease/increase speed | Time |
| **R** | Regenerate maze | Game |
| **X** | Export run data | Data |

---

## 9. LLM Integration

### 9.1 LLM Service (`src/services/LLMService.ts`)

**Multi-Provider Architecture**:

```typescript
enum LLMProvider {
  HEURISTIC = 'heuristic',       // No LLM required
  OLLAMA = 'ollama',             // Local LLMs
  ANTHROPIC = 'anthropic'        // Claude API
}

interface LLMService {
  currentProvider: LLMProvider;
  availableProviders: LLMProvider[];

  generate(prompt: string): Promise<string>;
  switchProvider(provider: LLMProvider): void;
  checkHealth(): Promise<ProviderHealth>;
}
```

### 9.2 Provider Details

#### 1. Heuristic Mode (Default)

**No LLM Required**:
- Pathfinding-based decisions
- Template-based reflections
- Rule-based planning
- Always available
- Zero cost
- Fast execution

**Limitations**:
- Less natural language
- No creative insights
- Deterministic behavior

#### 2. Ollama (Local LLMs)

**Configuration**:
```typescript
{
  provider: 'ollama',
  baseURL: 'http://localhost:11434',
  model: 'llama3.2:3b-instruct-q4_K_M',  // Recommended
  temperature: 0.7,
  maxTokens: 512
}
```

**Supported Models**:
- `llama3.2:3b-instruct-q4_K_M` (Recommended, 2GB RAM)
- `llama3.2:1b-instruct-q4_K_M` (Lightweight, 1GB RAM)
- `mistral:7b-instruct` (Higher quality, 4GB RAM)
- `mixtral:8x7b-instruct` (Best quality, 24GB RAM)
- Any Ollama-compatible model

**Advantages**:
- Private (runs locally)
- No API costs
- No rate limits
- Fast response (local network)

**Requirements**:
- Ollama installed and running
- Sufficient RAM for model
- Model downloaded: `ollama pull llama3.2:3b-instruct-q4_K_M`

#### 3. Anthropic Claude

**Configuration**:
```typescript
{
  provider: 'anthropic',
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
  model: 'claude-3-haiku-20240307',      // Fast, cheap
  // model: 'claude-3-5-sonnet-20241022', // High quality
  temperature: 0.7,
  maxTokens: 1024
}
```

**Available Models**:
- `claude-3-haiku-20240307` (Recommended for simulation)
  - Speed: ~500ms per request
  - Cost: $0.25 / 1M input tokens, $1.25 / 1M output tokens
  - Quality: Good

- `claude-3-5-sonnet-20241022` (Best quality)
  - Speed: ~2000ms per request
  - Cost: $3 / 1M input tokens, $15 / 1M output tokens
  - Quality: Excellent

**Advantages**:
- Highest quality responses
- Strong reasoning capability
- Long context (200K tokens)
- Reliable API

**Requirements**:
- Anthropic API key
- Internet connection
- API costs apply

### 9.3 Provider Switching

**Runtime Switching**:
```typescript
// Press 'L' key to cycle through providers
function cycleLLMProvider(): void {
  const providers = ['heuristic', 'ollama', 'anthropic'];
  const currentIndex = providers.indexOf(this.currentProvider);
  const nextIndex = (currentIndex + 1) % providers.length;

  this.switchProvider(providers[nextIndex]);
}

// Automatic fallback on error
async function generate(prompt: string): Promise<string> {
  try {
    return await this.currentProviderService.generate(prompt);
  } catch (error) {
    console.warn(`Provider ${this.currentProvider} failed, falling back`);

    // Try next provider
    if (this.currentProvider === 'anthropic') {
      this.switchProvider('ollama');
    } else if (this.currentProvider === 'ollama') {
      this.switchProvider('heuristic');
    }

    return await this.generate(prompt); // Retry with new provider
  }
}
```

### 9.4 Embedding Service (`src/services/EmbeddingService.ts`)

**Multi-Provider Embeddings**:

#### 1. OpenAI

```typescript
{
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: 1536,
  apiKey: process.env.VITE_OPENAI_API_KEY
}
```

**Specs**:
- Quality: High
- Speed: ~100ms per embedding
- Cost: $0.02 / 1M tokens
- Max batch: 2048 inputs

#### 2. Voyage AI

```typescript
{
  provider: 'voyage',
  model: 'voyage-2',
  dimensions: 1024,
  apiKey: process.env.VITE_VOYAGE_API_KEY
}
```

**Specs**:
- Quality: High
- Speed: ~150ms per embedding
- Cost: $0.12 / 1M tokens
- Optimized for retrieval

#### 3. Ollama (Local)

```typescript
{
  provider: 'ollama',
  model: 'nomic-embed-text',
  dimensions: 768,
  baseURL: 'http://localhost:11434'
}
```

**Specs**:
- Quality: Good
- Speed: ~50ms per embedding (local)
- Cost: Free
- Requires: `ollama pull nomic-embed-text`

#### Fallback Chain

```
OpenAI → Voyage → Ollama → Fake (random vectors)
```

**Caching**:
- 10,000 most recent embeddings cached
- LRU eviction policy
- Cache hit rate: ~85% in typical gameplay

---

## 10. Evaluation Framework

### 10.1 Paper Alignment (`src/evaluation/AlignmentReport.ts`)

**Overall Alignment**: **87%** with Park et al. (2023)

#### Component Breakdown

| Component | Score | Implementation | Gaps |
|-----------|-------|----------------|------|
| **Memory Stream** | 100% | Complete tri-factor retrieval | None |
| **Reflection System** | 95% | Enhanced with meta-reflection | More question templates |
| **Planning** | 85% | Three-level hierarchy | Group coordination |
| **Environment** | 85% | 8 room types, 14 actions | More templates |
| **Dialogue** | 80% | Context-aware conversations | Multi-party (3+) |
| **Multi-Agent** | 75% | 3 agents, social memory | Large-scale (25+) |
| **Evaluation** | 75% | Believability framework | Human studies |

### 10.2 Believability Evaluator (`src/evaluation/BelievabilityEvaluator.ts`)

**Implementation**: Park et al. Section 6.1

#### Evaluation Dimensions

**1. Behavioral Believability**:
```typescript
interface BehavioralMetrics {
  actionAppropriate​ness: number;    // 0-1: Actions match context
  goalDirectedness: number;         // 0-1: Pursuing coherent goals
  responseToStimuli: number;        // 0-1: Appropriate reactions
  adaptability: number;             // 0-1: Strategy changes
}
```

**2. Memory Believability**:
```typescript
interface MemoryMetrics {
  memoryConsistency: number;        // 0-1: No contradictions
  recallAccuracy: number;           // 0-1: Correct retrieval
  forgettingPattern: number;        // 0-1: Natural decay
  importanceAlignment: number;      // 0-1: Important things remembered
}
```

**3. Social Believability**:
```typescript
interface SocialMetrics {
  relationshipCoherence: number;    // 0-1: Consistent relationships
  communicationNaturalness: number; // 0-1: Natural dialogue
  groupDynamics: number;            // 0-1: Realistic interactions
  emotionalConsistency: number;     // 0-1: Stable emotional states
}
```

**4. Temporal Believability**:
```typescript
interface TemporalMetrics {
  timeAppropriateActions: number;   // 0-1: Right actions at right time
  rhythmAndPacing: number;          // 0-1: Natural activity rhythm
  sleepWakeCycles: number;          // 0-1: Appropriate rest patterns
  planningHorizon: number;          // 0-1: Reasonable planning depth
}
```

#### Evaluation Process

```typescript
async function evaluateAgent(agent: Agent): Promise<BelievabilityScore> {
  // 1. Collect agent data
  const memories = agent.memoryStream.getAll();
  const plans = agent.planningSystem.getAllPlans();
  const actions = agent.getActionHistory();
  const conversations = agent.socialMemory.getConversationHistory();

  // 2. Evaluate each dimension
  const behavioral = this.evaluateBehavioral(actions, plans);
  const memory = this.evaluateMemory(memories);
  const social = this.evaluateSocial(conversations);
  const temporal = this.evaluateTemporal(actions);

  // 3. Aggregate scores
  const overall = (behavioral + memory + social + temporal) / 4;

  return {
    overall,
    dimensions: { behavioral, memory, social, temporal },
    timestamp: Date.now()
  };
}
```

### 10.3 Data Collection (`src/systems/DataCollector.ts`)

#### Metrics Tracked

```typescript
interface RunMetrics {
  // Identity
  runId: string;
  startTime: number;
  endTime: number;
  duration: number;

  // Survival
  survivalTime: number;              // Seconds survived
  finalHunger: number;
  finalThirst: number;
  finalEnergy: number;
  finalStress: number;
  causeOfDeath?: DeathCause;

  // Exploration
  tilesExplored: number;
  explorationPercentage: number;
  distanceTraveled: number;

  // Resources
  itemsConsumed: ItemConsumption[];
  totalFoodConsumed: number;
  totalWaterConsumed: number;
  totalMedicalUsed: number;

  // Cognitive
  memoriesCreated: number;
  reflectionsGenerated: number;
  plansCreated: number;
  plansCompleted: number;
  plansAbandoned: number;

  // Social (Multi-agent)
  conversationsHeld: number;
  totalUtterances: number;
  informationShared: number;
  relationshipChanges: number;

  // Performance
  averageFPS: number;
  llmCallsMade: number;
  embeddingCallsMade: number;
  cacheHitRate: number;
}
```

#### Export Format

```json
{
  "runId": "run_2024-11-06_1234",
  "startTime": 1699276800000,
  "duration": 7200,
  "survivalTime": 7200,
  "outcome": "SUCCESS",
  "agent": {
    "name": "Arth",
    "finalState": {
      "hunger": 65,
      "thirst": 70,
      "energy": 55,
      "stress": 45
    }
  },
  "exploration": {
    "tilesExplored": 320,
    "percentage": 80.0,
    "distanceTraveled": 450
  },
  "cognitive": {
    "memories": 247,
    "reflections": 12,
    "plans": 8
  },
  "timeline": [
    {
      "time": 0,
      "event": "GAME_START",
      "details": {...}
    },
    {
      "time": 150,
      "event": "ITEM_CONSUMED",
      "details": { "item": "Water Bottle", "hunger": 60, "thirst": 85 }
    },
    ...
  ]
}
```

---

## 11. Configuration

### 11.1 Game Configuration (`src/config/game.config.ts`)

```typescript
export const GAME_CONFIG = {
  // Maze
  maze: {
    width: 20,
    height: 20,
    complexity: 0.7,
    deadEnds: 5,
    seed: null                     // Random if null
  },

  // Agent
  agent: {
    visionRange: {
      day: 2,                      // Tiles
      night: 1
    },
    speed: 1.0,                    // Tiles per second
    canSeeThroughWalls: false,
    memoryDecay: true
  },

  // Time
  time: {
    acceleration: 10,              // 10x real-time
    dayLength: 720,                // Game minutes
    nightLength: 720,
    requiresSleep: true,
    sleepDeprivationThreshold: 2160 // 36 hours
  },

  // Survival
  survival: {
    startingHunger: 100,
    startingThirst: 100,
    startingEnergy: 100,
    startingStress: 0,

    depletionRates: {
      hunger: { idle: -1.5, moving: -2.5, running: -3.5 },
      thirst: { idle: -2.0, moving: -3.5, running: -5.0 },
      energy: { idle: -1.0, moving: -2.0, running: -5.0 }
    },

    criticalThreshold: 20,         // Below this = critical
    deathThreshold: 0              // Death at 0%
  },

  // Visual
  visual: {
    tileSize: 32,                  // Pixels
    view: 'top_down',
    style: 'pixel_art',
    enableShadows: true,
    enableLighting: true
  },

  // Memory
  memory: {
    maxCapacity: 10000,
    retrievalTopK: 10,
    importanceWeight: 1.0,
    recencyWeight: 1.0,
    relevanceWeight: 1.0,
    reflectionInterval: 7200       // 2 game hours
  },

  // Planning
  planning: {
    horizon: {
      daily: 24,                   // Hours
      hourly: 60,                  // Minutes
      action: 5                    // Minutes
    },
    replanThreshold: 0.5           // 50% progress divergence
  }
};
```

### 11.2 Agent Profiles

#### Arth Profile (`src/config/arth.profile.ts`)

```typescript
export const ARTH_PROFILE = {
  identity: {
    name: 'Arth',
    age: 28,
    background: 'Engineer',
    appearance: 'Green agent sprite'
  },

  personality: {
    traits: [
      'Analytical',
      'Strategic',
      'Methodical',
      'Calm under pressure'
    ],
    values: [
      'Efficiency',
      'Problem-solving',
      'Systematic approach'
    ]
  },

  skills: {
    primary: 'Pattern recognition',
    secondary: 'Resource management',
    tertiary: 'Spatial reasoning'
  },

  cognitiveStyle: {
    decisionMaking: 'Logical, data-driven',
    exploration: 'Systematic grid search',
    socialBehavior: 'Reserved but cooperative',
    stressResponse: 'Focuses on problem-solving'
  },

  initialState: {
    hunger: 100,
    thirst: 100,
    energy: 100,
    stress: 0,
    position: 'south_entrance'
  },

  backstory: `
Arth is a 28-year-old engineer who approaches challenges methodically.
He believes in systematic exploration and data-driven decision-making.
In the maze, he applies his analytical mindset to optimize survival
and resource management strategies.
  `
};
```

---

## 12. Key Algorithms

### 12.1 Memory Retrieval Algorithm

```typescript
/**
 * Tri-factor memory retrieval (Park et al. Section 4.1)
 *
 * Combines:
 * - Recency (exponential decay)
 * - Importance (pre-assigned 1-10)
 * - Relevance (cosine similarity)
 */
function retrieveMemories(
  query: string,
  k: number = 10
): Promise<Memory[]> {
  // 1. Generate query embedding
  const queryEmbedding = await embeddingService.embed(query);

  // 2. Score all memories
  const scored = memories.map(memory => {
    // Recency: Exponential decay (half-life = 24 hours)
    const hoursAgo = (currentTime - memory.lastAccessTime) / 3600;
    const recency = Math.exp(-hoursAgo / 24);

    // Importance: Normalized to 0-1
    const importance = memory.importance / 10;

    // Relevance: Cosine similarity of embeddings
    const relevance = cosineSimilarity(
      queryEmbedding,
      memory.embedding
    );

    // Combined score (equal weights per paper)
    const finalScore =
      (recency × 1.0) +
      (importance × 1.0) +
      (relevance × 1.0);

    return { memory, score: finalScore };
  });

  // 3. Sort by score and return top-k
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(item => {
      // Update last access time for recency
      item.memory.lastAccessTime = currentTime;
      return item.memory;
    });
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
```

### 12.2 Importance-Sum Reflection Trigger

```typescript
/**
 * Importance-sum reflection trigger (Park et al. Section 4.2)
 *
 * Accumulates importance scores of new memories.
 * When sum ≥ 150, triggers reflection process.
 */
class ReflectionSystem {
  private importanceSum: number = 0;
  private readonly THRESHOLD = 150;  // From paper

  /**
   * Called whenever a new memory is added
   */
  onMemoryCreated(memory: Memory): void {
    // Accumulate importance
    this.importanceSum += memory.importance;

    console.log(
      `Importance sum: ${this.importanceSum}/${this.THRESHOLD}`
    );

    // Check if threshold reached
    if (this.importanceSum >= this.THRESHOLD) {
      console.log('🎯 Importance threshold reached! Triggering reflection...');

      // Perform enhanced reflection
      this.performEnhancedReflection();

      // Reset sum
      this.importanceSum = 0;

      // Track trigger
      this.statistics.importanceSumTriggers++;
    }
  }

  /**
   * Enhanced reflection process (Week 8)
   */
  private async performEnhancedReflection(): Promise<void> {
    // 1. Get recent high-importance memories (last 100)
    const recentMemories = this.memoryStream
      .getRecent(100)
      .filter(m => m.importance >= 5);

    // 2. Generate reflection questions
    const questions = await this.generateReflectionQuestions(
      recentMemories
    );

    // 3. For each question, retrieve evidence and synthesize answer
    for (const question of questions) {
      // Retrieve relevant memories (10-20)
      const evidence = await this.memoryRetrieval.retrieve(
        question,
        15
      );

      // Generate answer grounded in evidence
      const answer = await this.synthesizeAnswer(
        question,
        evidence
      );

      // Store as reflection
      this.storeReflection({
        question,
        answer,
        evidenceIds: evidence.map(m => m.id),
        level: 1,  // First-order reflection
        importance: 7 + Math.floor(Math.random() * 3),  // 7-9
        category: this.categorizeReflection(answer)
      });
    }

    // 4. Check for meta-reflection opportunity
    if (this.firstOrderReflections.length >= 5) {
      await this.generateMetaReflection();
    }
  }
}
```

### 12.3 Hierarchical Plan Decomposition

```typescript
/**
 * Plan decomposition (Park et al. Section 4.3)
 *
 * Decomposes goals into three levels:
 * - Daily plans (24 hours)
 * - Hourly plans (60 minutes)
 * - Action plans (5 minutes)
 */
async function generateHierarchicalPlan(
  context: PlanningContext
): Promise<DailyPlan> {
  // 1. Generate daily goal
  const dailyGoal = await llm.generate(`
Given the agent's current state:
- Hunger: ${context.hunger}%
- Thirst: ${context.thirst}%
- Energy: ${context.energy}%
- Stress: ${context.stress}%

Recent experiences:
${context.recentMemories.map(m => `- ${m.description}`).join('\n')}

Recent insights:
${context.recentReflections.map(r => `- ${r.content}`).join('\n')}

Current location: ${context.roomDescription}

What should be the agent's goal for the next 24 hours?
Respond with a single sentence goal and reasoning.
  `);

  const dailyPlan: DailyPlan = {
    id: generateId(),
    goal: dailyGoal.goal,
    reasoning: dailyGoal.reasoning,
    priority: determinePriority(context),
    startTime: currentTime,
    endTime: currentTime + (24 * 3600),
    hourlyPlans: [],
    status: 'PENDING'
  };

  // 2. Decompose into 3 hourly objectives
  for (let hour = 0; hour < 3; hour++) {
    const hourlyObjective = await llm.generate(`
Daily goal: ${dailyPlan.goal}

For hour ${hour + 1}/3, what specific objective should the agent pursue?
Consider:
- Progress toward daily goal
- Resource needs
- Current energy levels
- Time remaining

Respond with a specific, achievable objective for this hour.
    `);

    const hourlyPlan: HourlyPlan = {
      id: generateId(),
      objective: hourlyObjective,
      dailyPlanId: dailyPlan.id,
      startTime: dailyPlan.startTime + (hour * 3600),
      endTime: dailyPlan.startTime + ((hour + 1) * 3600),
      actions: [],
      status: 'PENDING'
    };

    // 3. Decompose into 12 five-minute actions
    for (let action = 0; action < 12; action++) {
      const actionPlan = await llm.generate(`
Hourly objective: ${hourlyPlan.objective}

For the next 5 minutes (action ${action + 1}/12), what specific action?

Available action types:
- MOVE: Navigate to position
- EXPLORE: Systematic exploration
- CONSUME_ITEM: Eat, drink, use item
- SEEK_ITEM: Search for specific item
- REST: Recover energy
- INTERACT_OBJECT: Use environmental object
- SOCIALIZE: Talk to another agent
- WAIT: Pause and observe

Respond with action type, description, and target (if applicable).
      `);

      hourlyPlan.actions.push({
        id: generateId(),
        action: actionPlan.description,
        actionType: actionPlan.type,
        hourlyPlanId: hourlyPlan.id,
        startTime: hourlyPlan.startTime + (action * 300),
        endTime: hourlyPlan.startTime + ((action + 1) * 300),
        targetPosition: actionPlan.targetPosition,
        targetItem: actionPlan.targetItem,
        status: 'PENDING'
      });
    }

    dailyPlan.hourlyPlans.push(hourlyPlan);
  }

  return dailyPlan;
}
```

### 12.4 Fog of War Visibility

```typescript
/**
 * Fog of War visibility calculation
 *
 * Determines which tiles are visible to the agent
 * based on vision range and line-of-sight.
 */
function updateVisibility(agent: Agent): void {
  const agentTile = {
    x: Math.floor(agent.x / TILE_SIZE),
    y: Math.floor(agent.y / TILE_SIZE)
  };

  // Get vision range based on time of day
  const range = this.timeManager.isNight() ?
    NIGHT_VISION_RANGE :
    DAY_VISION_RANGE;

  // Check all tiles in vision range
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const tileX = agentTile.x + dx;
      const tileY = agentTile.y + dy;

      // Skip if out of bounds
      if (!this.isInBounds(tileX, tileY)) continue;

      // Check Manhattan distance
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance > range) continue;

      // Check line of sight
      if (this.hasLineOfSight(agentTile, { x: tileX, y: tileY })) {
        // Mark as visible
        this.fogState[tileY][tileX] = FogState.VISIBLE;
        this.explored[tileY][tileX] = true;
      } else if (this.explored[tileY][tileX]) {
        // Previously explored but not visible
        this.fogState[tileY][tileX] = FogState.EXPLORED;
      }
    }
  }

  // Reset non-visible explored tiles
  for (let y = 0; y < this.height; y++) {
    for (let x = 0; x < this.width; x++) {
      if (this.fogState[y][x] === FogState.VISIBLE) {
        // Check if still in range
        const distance =
          Math.abs(x - agentTile.x) +
          Math.abs(y - agentTile.y);

        if (distance > range ||
            !this.hasLineOfSight(agentTile, { x, y })) {
          this.fogState[y][x] = FogState.EXPLORED;
        }
      }
    }
  }
}

/**
 * Line-of-sight check using Bresenham's algorithm
 */
function hasLineOfSight(from: Position, to: Position): boolean {
  const line = bresenham(from, to);

  // Check each point on the line
  for (const point of line) {
    // Skip the starting point
    if (point.x === from.x && point.y === from.y) continue;

    // Check if point is a wall
    if (this.maze.tiles[point.y][point.x].type === TileType.WALL) {
      return false;  // Wall blocks vision
    }
  }

  return true;  // Clear line of sight
}

/**
 * Bresenham's line algorithm
 */
function bresenham(p0: Position, p1: Position): Position[] {
  const points: Position[] = [];

  let x0 = p0.x, y0 = p0.y;
  const x1 = p1.x, y1 = p1.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return points;
}
```

---

## 13. Technical Specifications

### 13.1 Dependencies

**Core Dependencies**:
```json
{
  "dependencies": {
    "pixi.js": "^7.3.2",           // Rendering engine
    "gsap": "^3.12.2",             // Animation library
    "@anthropic-ai/sdk": "^0.27.3" // Claude API client
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "vite": "^4.5.0",
    "@types/node": "^20.8.0"
  }
}
```

### 13.2 Build Configuration

**Vite Config** (`vite.config.ts`):
```typescript
export default defineConfig({
  server: {
    port: 3001,
    open: true
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['pixi.js', 'gsap']
  }
});
```

**TypeScript Config** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 13.3 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| FPS | 60 | 55-60 |
| Frame Time | <16.67ms | 16-18ms |
| Memory Usage | <500MB | 350-450MB |
| LLM Response | <2000ms | 500-2000ms |
| Embedding Time | <200ms | 50-150ms |
| Startup Time | <5s | 3-4s |

---

## 14. Implementation Status

### 14.1 Completed Features (v0.1.0)

✅ **Memory Stream** (100% complete)
- Tri-factor retrieval (importance + recency + relevance)
- Memory pruning (10,000 capacity)
- Multi-provider embeddings
- Memory type categorization

✅ **Reflection System** (95% complete)
- Importance-sum triggering (≥150)
- Enhanced question generation
- Evidence-based answer synthesis
- Recursive meta-reflection
- Reflection tree structure
- Category classification

✅ **Planning System** (85% complete)
- Three-level hierarchy (daily → hourly → 5-min)
- Context-aware generation
- Re-planning triggers
- Location-based planning (Week 9)
- Action type categorization

✅ **Multi-Agent Systems** (75% complete)
- 3 predefined agents (Arth, Vani, Kael)
- Social memory & relationships
- Conversation system with triggers
- Information diffusion
- Cooperative planning
- Role emergence detection

✅ **Environment & World** (85% complete)
- Procedural maze generation (Prim's)
- World hierarchy (4 levels)
- 8 room templates
- 14 object capabilities
- Natural language descriptions
- Spatial queries

✅ **Survival Mechanics** (90% complete)
- Resource depletion (hunger/thirst/energy)
- Stress system
- Item system (food, water, medical)
- Critical thresholds
- Death conditions

✅ **Rendering & Visualization** (90% complete)
- PixiJS 7 pipeline
- 6-layer rendering
- Camera system (follow, zoom)
- Day/night lighting
- Fog of War (Week 8)
- 5 view modes

✅ **UI System** (95% complete)
- 11 interactive panels
- Keyboard controls
- Real-time updates
- Panel positioning
- Debug tools

✅ **LLM Integration** (90% complete)
- Multi-provider (Heuristic/Ollama/Anthropic)
- Runtime switching
- Automatic fallback
- Multi-provider embeddings
- Caching

✅ **Evaluation Framework** (75% complete)
- Paper alignment report (87%)
- Believability evaluator
- Data collection
- Metrics tracking
- JSON export

### 14.2 Known Limitations

**Multi-Agent**:
- Large-scale scenarios (25+ agents) not tested
- Performance degradation above 10 agents
- Group coordination plans incomplete

**Dialogue**:
- Multi-party conversations (3+ agents) basic
- No interruption handling
- Limited non-verbal communication

**Environment**:
- Only 8 room templates
- Static object states (no dynamic changes)
- No weather or time-of-day environment effects

**Evaluation**:
- Ablation studies not integrated
- No human evaluation studies
- Emergent behavior detection basic

**Performance**:
- LLM calls not batched
- Embedding caching could be improved
- No multi-threading for agent updates

### 14.3 Technical Debt

1. **Code Organization**:
   - Some files exceed 500 lines
   - Prompt strings could be externalized
   - Type definitions scattered across files

2. **Performance**:
   - Fog of War recalculation every frame (could be optimized)
   - Memory retrieval not indexed (linear search)
   - No worker threads for LLM calls

3. **Testing**:
   - No automated unit tests
   - No integration tests
   - Manual testing only

4. **Documentation**:
   - Code comments inconsistent
   - Some complex algorithms lack explanation
   - No API documentation generator

### 14.4 Future Enhancements

**Near-term** (1-2 months):
- [ ] Implement ablation study runner
- [ ] Add more room templates (20+ types)
- [ ] Optimize performance for 25+ agents
- [ ] Add unit tests for core systems
- [ ] Improve emergent behavior detection

**Mid-term** (3-6 months):
- [ ] Human evaluation study framework
- [ ] Dynamic environment changes (weather, time effects)
- [ ] Advanced group coordination
- [ ] Multi-party conversation support
- [ ] Performance optimizations (indexing, batching)

**Long-term** (6+ months):
- [ ] Web deployment
- [ ] Multiplayer (human + AI agents)
- [ ] Procedural room generation
- [ ] Advanced emotional models
- [ ] Cross-simulation learning

---

## 15. Research Foundation

### 15.1 Source Paper

**Generative Agents: Interactive Simulacra of Human Behavior**
- Authors: Joon Sung Park, Joseph C. O'Brien, Carrie J. Cai, Meredith Ringel Morris, Percy Liang, Michael S. Bernstein
- Institution: Stanford University
- Conference: UIST 2023
- arXiv: [2304.03442](https://arxiv.org/abs/2304.03442)

### 15.2 Key Concepts Implemented

**Memory Stream Architecture** (Section 3):
- ✅ Observations, reflections, plans as memory types
- ✅ Importance scoring (1-10)
- ✅ Recency weighting (exponential decay)
- ✅ Relevance via embeddings

**Retrieval Function** (Section 4.1):
- ✅ Tri-factor scoring: f(recency, importance, relevance)
- ✅ Cosine similarity for relevance
- ✅ Normalized weighting (1:1:1)

**Reflection** (Section 4.2):
- ✅ Importance-sum triggering (150 threshold)
- ✅ Question generation
- ✅ Memory-grounded synthesis
- ⚠️ Higher-level abstractions (partial)

**Planning & Reacting** (Section 4.3):
- ✅ Hierarchical plan decomposition
- ✅ Plan → Sub-plans → Actions
- ⚠️ Reaction to observations (basic)

**Dialogue** (Section 4.4):
- ✅ Context-aware generation
- ✅ Memory-grounded responses
- ⚠️ Complex multi-party (limited)

**Sandbox Environment** (Section 5):
- ✅ Tree-structured world
- ✅ Object affordances
- ✅ Natural language descriptions
- ⚠️ Dynamic state changes (limited)

### 15.3 Deviations & Enhancements

**Enhancements Beyond Paper**:
1. **Recursive Meta-Reflection** (Week 8)
   - Multi-level reflection tree (1st, 2nd, 3rd+ order)
   - Reflection categories (strategy, pattern, learning)
   - Confidence scoring

2. **Survival Mechanics**
   - Resource management (hunger, thirst, energy)
   - Stress system with cognitive effects
   - Death and mental breakdown conditions

3. **Fog of War**
   - Agent-perspective visibility
   - Exploration tracking
   - Multiple view modes

4. **Multi-Agent Social Memory**
   - Relationship dimensions (familiarity, affinity, trust)
   - Known facts system
   - Information diffusion tracking

5. **Role Emergence Detection**
   - Automatic role classification
   - Evidence-based confidence
   - Multiple role types (explorer, gatherer, communicator)

**Simplifications**:
1. **Environment Scope**
   - Maze instead of full town (Smallville)
   - 8 room types vs. 100+ locations
   - 14 actions vs. full natural language

2. **Agent Count**
   - 3 agents vs. 25 agents
   - Smaller interaction network

3. **Evaluation**
   - No large-scale human studies
   - Automated believability metrics only
   - Limited ablation studies

### 15.4 Research Contributions

**Novel Aspects**:
1. **Recursive Reflection System** with multi-level abstraction
2. **Survival-Oriented Cognitive Architecture** with stress modeling
3. **Fog of War Integration** with cognitive agent systems
4. **Real-time Visualization** of agent cognition (11 panels)
5. **Multi-Provider LLM Support** with heuristic fallback

**Potential Research Applications**:
- Studying human-like decision-making under stress
- Evaluating LLM reasoning capabilities
- Testing multi-agent coordination strategies
- Exploring emergent social behaviors
- Analyzing cognitive load effects on planning

---

## Appendix A: File Count Summary

| Directory | Files | Lines of Code (est.) |
|-----------|-------|---------------------|
| `src/agent/` | 13 | ~3,500 |
| `src/systems/` | 20 | ~5,000 |
| `src/core/` | 3 | ~1,200 |
| `src/ui/` | 17 | ~4,500 |
| `src/rendering/` | 9 | ~2,800 |
| `src/maze/` | 5 | ~1,500 |
| `src/services/` | 8 | ~2,000 |
| `src/evaluation/` | 6 | ~1,800 |
| `src/config/` | 10 | ~2,500 |
| `src/types/` | 15 | ~1,500 |
| `src/utils/` | 4 | ~800 |
| **Total** | **110** | **~27,100** |

---

## Appendix B: Quick Reference

**Common Commands**:
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
```

**Essential Files**:
- `src/main.ts` - Entry point
- `src/core/Game.ts` - Game loop
- `src/agent/Agent.ts` - Agent class
- `src/config/game.config.ts` - Configuration

**Key Keyboard Shortcuts**:
- `L` - Cycle LLM providers
- `A` - Toggle autonomous mode
- `Space` - Pause/Resume
- `I` - Debug panel
- `H` - Help overlay

---

**Version**: 0.1.0
**Last Updated**: November 7, 2025
**Maintainer**: Maze Mind Development Team
**License**: MIT

---

*This document provides comprehensive technical documentation for Maze Mind v0.1.0. For user-facing documentation, see [README.md](README.md). For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).*
