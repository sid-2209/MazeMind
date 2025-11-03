# MAZE MIND - Complete Project Documentation

## Project Overview

**Maze Mind** is an AI research simulation testing artificial agent resilience, decision-making under extreme pressure, and emergent human-like behaviors in a survival scenario.

### Research Objectives
1. Test AI resilience in resource-constrained environments
2. Simulate human-like consciousness and psychological states
3. Study decision-making quality degradation under stress
4. Observe emergent survival strategies
5. Validate LLM-based cognitive architectures

---

## Technical Specifications

### Architecture
- **Approach**: Pure LLM-based (Stanford Generative Agents methodology)
- **LLM**: Anthropic Claude 3.5 Sonnet
- **Frontend**: React 18 + TypeScript 5.2
- **Rendering**: PixiJS 7.3.2
- **Build Tool**: Vite 4.5
- **Animation**: GSAP 3.12

### System Requirements
- Node.js 18+
- npm 9+
- 16GB RAM (recommended)
- macOS, Linux, or Windows

---

## Project Structure

```
maze-mind/
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md            # System architecture
│   ├── WEEK_1_PLAN.md            # Week 1 implementation
│   ├── WEEK_2_PLAN.md            # Week 2 implementation
│   ├── WEEK_3_PLAN.md            # Week 3 implementation
│   ├── WEEK_4_PLAN.md            # Week 4 implementation
│   └── API_REFERENCE.md          # API documentation
│
├── public/assets/                # Static assets
│   ├── sprites/arth/             # Character animations
│   ├── tiles/                    # Maze tiles
│   ├── effects/                  # Visual effects
│   └── ui/                       # UI elements
│
├── src/
│   ├── config/                   # Configuration files
│   │   ├── game.config.ts        # Game settings
│   │   ├── arth.profile.ts       # Agent backstory
│   │   ├── maze.config.ts        # Maze generation
│   │   └── visual.config.ts      # Rendering settings
│   │
│   ├── types/                    # TypeScript types
│   │   ├── index.ts
│   │   ├── maze.types.ts
│   │   ├── agent.types.ts
│   │   └── game.types.ts
│   │
│   ├── core/                     # Core game systems
│   │   ├── Game.ts               # Main controller
│   │   ├── TimeManager.ts        # Day/night cycle
│   │   └── InputManager.ts       # Input handling
│   │
│   ├── maze/                     # Maze generation & management
│   │   ├── MazeGenerator.ts      # Procedural generation
│   │   ├── MazeGraph.ts          # Graph representation
│   │   ├── Tile.ts               # Tile class
│   │   └── PathFinder.ts         # A* pathfinding
│   │
│   ├── agent/                    # Agent (Arth) systems
│   │   ├── Agent.ts              # Main agent class
│   │   ├── AgentState.ts         # State management
│   │   ├── AgentRenderer.ts      # Sprite rendering
│   │   ├── AgentController.ts    # Movement control
│   │   ├── Memory.ts             # Memory stream (Week 2)
│   │   ├── Reflection.ts         # Reflection system (Week 2)
│   │   └── Planning.ts           # Planning system (Week 3)
│   │
│   ├── rendering/                # PixiJS rendering
│   │   ├── Renderer.ts           # Main renderer
│   │   ├── MazeRenderer.ts       # Maze rendering
│   │   ├── LightingSystem.ts     # Lighting effects
│   │   ├── FogOfWar.ts           # Visibility system
│   │   ├── Camera.ts             # Camera controller
│   │   └── ParticleEffects.ts    # Visual effects
│   │
│   ├── ui/                       # User interface
│   │   ├── UIManager.ts          # UI controller
│   │   ├── StatusPanel.ts        # Stats display
│   │   ├── MiniMap.ts            # Mini-map
│   │   ├── DebugPanel.ts         # Debug tools
│   │   └── ViewModeToggle.ts     # View mode switching
│   │
│   ├── utils/                    # Utilities
│   │   ├── Logger.ts             # Logging system
│   │   ├── AssetLoader.ts        # Asset management
│   │   ├── MathUtils.ts          # Math helpers
│   │   └── ColorUtils.ts         # Color utilities
│   │
│   └── main.ts                   # Entry point
│
├── tests/                        # Test files
├── scripts/                      # Build scripts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## Development Timeline

### Week 1: Foundation & Visuals (Current)
**Focus**: Beautiful rendering with manual controls
- Day 1-2: Project setup, maze generation
- Day 3-4: PixiJS rendering, basic visuals
- Day 5: Character sprite & animation
- Day 6: Keyboard controls & smooth movement
- Day 7: Lighting system & day/night cycle
- Day 8: Fog of war & view modes
- Day 9: UI polish & status display

**Deliverables**:
✅ Procedurally generated maze
✅ Beautiful pixel art rendering
✅ Playable character (Arth)
✅ Smooth animations
✅ Day/night cycle
✅ Fog of war
✅ All view modes (Agent POV, God Mode, Mixed, Debug)
✅ Complete UI (status panel, mini-map)

### Week 2: Memory & Basic AI
**Focus**: LLM integration and memory system
- Memory stream implementation
- Vector embeddings for retrieval
- LLM decision-making integration
- Basic autonomous movement
- Memory-based navigation

**Deliverables**:
✅ Memory system (observations, retrieval)
✅ Claude API integration
✅ Autonomous agent decisions
✅ Memory-based pathfinding

### Week 3: Survival Mechanics
**Focus**: Resource management and psychological realism
- Hunger/thirst/energy systems
- Resource consumption
- Stress calculation
- Reflection generation
- Planning system
- Decision quality degradation

**Deliverables**:
✅ Full survival mechanics
✅ Stress affects decisions
✅ Reflection system
✅ Hierarchical planning
✅ Psychological state modeling

### Week 4: Polish & Analysis
**Focus**: Data collection and experiment framework
- Multiple run orchestration
- Data logging and analysis
- Replay viewer
- Comparative dashboards
- Research metrics collection
- Documentation

**Deliverables**:
✅ 50+ simulation runs
✅ Statistical analysis
✅ Replay system
✅ Research paper data
✅ Complete documentation

---

## Configuration Files

### Maze Configuration
```typescript
MAZE_CONFIG = {
  size: { width: 20, height: 20 },
  complexity: 0.7,        // 0-1 scale
  deadEnds: 5,            // Number of dead ends
  seed: "random",         // Or specific seed for reproduction
}
```

### Agent Configuration
```typescript
AGENT_CONFIG = {
  visionRange: 2,         // Tiles visible
  visionRangeNight: 1,    // Reduced at night
  movementSpeed: 1.0,     // Tiles per second
  canMarkPaths: true,     // Mental markers
  maxCarryWeight: 5.0,    // kg
}
```

### Time Configuration
```typescript
TIME_CONFIG = {
  timeScale: 10,          // 1 real second = 10 game seconds
  dayLength: 720,         // 12 game hours
  nightLength: 720,       // 12 game hours
}
```

### Survival Configuration
```typescript
SURVIVAL_CONFIG = {
  startingHunger: 100,
  startingThirst: 100,
  startingEnergy: 100,
  hungerDepletion: 1.5,   // % per hour
  thirstDepletion: 2.0,   // % per hour
  energyDepletion: 1.0,   // % per hour
}
```

---

## Research Metrics

### Primary Outcomes
- Survival rate (% that find exit)
- Time to completion (game hours)
- Cause of failure distribution

### Behavioral Metrics
- Exploration efficiency
- Decision quality over time
- Resource management effectiveness
- Spatial strategy type

### Cognitive Metrics
- Memory retrieval accuracy
- Reflection quality
- Planning sophistication
- Reasoning coherence

### Psychological Metrics
- Stress dynamics
- Emotional state trajectory
- Cognitive degradation patterns
- Hope/despair cycles

### Technical Metrics
- LLM API costs per run
- Token usage
- Response latency
- System performance

---

## View Modes

### Agent POV
- See only what Arth sees
- Fog of war enabled
- Realistic gameplay experience

### God Mode
- See entire maze
- All resources visible
- No fog of war
- For analysis and debugging

### Mixed Mode
- See everything but dimmed
- Arth's vision highlighted
- Balanced view

### Debug Mode
- Show pathfinding
- Display memory retrievals
- Show decision reasoning
- Performance metrics

### Replay Mode (Week 4)
- Watch recorded simulations
- Variable speed playback
- Analyze past runs

---

## Installation

```bash
# Clone repository
git clone <repository-url>
cd maze-mind

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

---

## Environment Variables

```bash
# Week 1: No API keys needed
# Week 2+: Add Claude API key
ANTHROPIC_API_KEY=your_key_here

# Optional: Logging
LOG_LEVEL=info
LOG_TO_FILE=true
```

---

## Development Workflow

### Vertical Slices Approach
Each week delivers a fully functional increment:
- Week 1: Beautiful visuals (test manually)
- Week 2: Add AI brain (test autonomous movement)
- Week 3: Add survival (test resource management)
- Week 4: Add experiments (collect data)

### Testing Strategy
- Unit tests for core logic
- Integration tests for systems
- Manual testing for gameplay
- End-to-end tests for full simulations

### Error Handling
- Graceful recovery from LLM failures
- Retry logic (3 attempts)
- Fallback to cached decisions
- Comprehensive error logging

---

## API Costs

### Estimated Costs per Simulation
- **Decisions**: 500-1000 × 1500 tokens = 750K-1.5M tokens
- **Reflections**: 10-20 × 3000 tokens = 30K-60K tokens
- **Planning**: 20-50 × 2000 tokens = 40K-100K tokens
- **Total**: ~1-2M tokens per run
- **Cost**: $8-16 USD per simulation

### Budget for MVP
- 10-20 test runs: $80-320
- 50 full experiments: $400-800

---

## Key Innovations

1. **Pure LLM Architecture**: No traditional RL, learning through memory
2. **Psychological Realism**: Stress, emotions, hope/despair modeling
3. **Emergent Behavior**: Strategies emerge from basic primitives
4. **Multi-Modal Observation**: Multiple view modes for research
5. **Comprehensive Metrics**: 100+ tracked variables

---

## Future Enhancements

### Post-MVP Features
- 3D maze environments
- Multiple agents (social dynamics)
- Procedural hazards (injuries, traps)
- Deeper psychological modeling
- Real-time intervention experiments
- Cross-agent learning (between runs)

### Research Extensions
- Personality variations testing
- Ablation studies (remove components)
- Difficulty curve analysis
- Strategy emergence studies
- Human-AI comparison experiments

---

## Contributing

This is a research project. See CONTRIBUTING.md for guidelines.

---

## License

MIT License - See LICENSE file

---

## Contact

For questions about this research project, please refer to the documentation or create an issue in the repository.

---

## Citation

If you use this work in your research, please cite:

```
Maze Mind: Testing AI Resilience Through Simulated Survival Scenarios
[Author Names]
[Institution]
[Year]
```

---

## Acknowledgments

Based on research from:
- Stanford HAI: Generative Agents (Park et al., 2023)
- DeepMind: SIMA and Genie
- a16z: AI Town architecture
- MineLand: Multi-agent survival simulation

---

**Version**: 0.1.0 (Week 1 - Foundation)
**Last Updated**: 2025-11-02
**Status**: Active Development
