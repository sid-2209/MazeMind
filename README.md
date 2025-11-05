# 🧩 Maze Mind

> AI resilience testing through simulated survival scenarios

An AI research simulation that tests artificial agent resilience, decision-making under pressure, and emergent human-like behaviors. Watch as Arth, an AI agent, navigates a procedurally-generated survival maze while managing resources, stress, and psychological states.

## 🎯 Quick Start

### Prerequisites

- Node.js 18+ and npm
- 16GB RAM recommended
- macOS, Linux, or Windows

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd maze-mind

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the simulation!

## 🎮 Controls (Week 1)

- **WASD** or **Arrow Keys**: Move Arth
- **Tab** or **1-5**: Cycle through view modes
  - **1**: Agent POV (realistic view)
  - **2**: God Mode (see everything)
  - **3**: Mixed Mode (balanced)
  - **5**: Debug Mode (development tools)
- **Esc**: Pause/Menu
- **Mouse Wheel**: Zoom in/out

## 📊 Project Status

| Week | Status | Focus | Deliverables |
|------|--------|-------|--------------|
| Week 1 | ✅ Complete | Beautiful Visuals | Maze rendering, manual controls, day/night cycle, fog of war |
| Week 2 | ✅ Complete | Memory & AI | Memory stream, embeddings, LLM integration, autonomous AI |
| Week 3 | 📅 Ready to Implement | Survival Mechanics | Resources, stress, psychological states, cognitive degradation |
| Week 4 | 📅 Planned | Analysis & Polish | Data collection, experiments, metrics |

## 🧠 The Agent: Arth

**Name**: Arth (24 years old)  
**Background**: Former underground courier  
**Sentence**: The Maze (100% expected mortality)  
**Motivation**: Survive to reunite with his girlfriend, Elena

**Traits**: Focused, committed, willful, resourceful, analytical

## 🏗️ Architecture

Built using Stanford's Generative Agents methodology:

```
┌─────────────────────────────────┐
│   PixiJS Visualization Layer    │
│  (Beautiful 2D rendering)       │
└─────────────────────────────────┘
           ↕
┌─────────────────────────────────┐
│   Game Engine Layer             │
│  (Time, physics, interactions)  │
└─────────────────────────────────┘
           ↕
┌─────────────────────────────────┐
│   AI Agent Layer                │
│  • Memory Stream                │
│  • Retrieval (recency +         │
│    importance + relevance)      │
│  • Reflection System            │
│  • Planning & Reaction          │
└─────────────────────────────────┘
           ↕
┌─────────────────────────────────┐
│   Claude API (LLM)              │
└─────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── config/         # Configuration files
├── core/           # Game engine (time, input)
├── maze/           # Maze generation & pathfinding
├── agent/          # Arth's systems (state, memory, AI)
├── rendering/      # PixiJS rendering & effects
├── ui/             # User interface components
├── utils/          # Utility functions
└── main.ts         # Application entry point
```

## 🎨 Features

### Week 1 (Current)
- ✅ Procedurally generated 20×20 maze
- ✅ Beautiful pixel art rendering with PixiJS
- ✅ Smooth character animations (4 directions)
- ✅ Day/night cycle with dynamic lighting
- ✅ Fog of war (visibility system)
- ✅ Multiple view modes
- ✅ Status panel & mini-map

### Week 2 (Upcoming)
- 🔜 Memory stream (observations, reflections)
- 🔜 Vector embeddings for memory retrieval
- 🔜 Claude API integration
- 🔜 Autonomous decision-making

### Week 3 (Upcoming)
- 🔜 Resource management (hunger, thirst, energy)
- 🔜 Stress system
- 🔜 Psychological state modeling
- 🔜 Reflection generation
- 🔜 Hierarchical planning

### Week 4 (Upcoming)
- 🔜 Multiple simulation runs
- 🔜 Data collection & analysis
- 🔜 Replay viewer
- 🔜 Research metrics dashboard

## 🔬 Research Objectives

1. **AI Resilience**: How do agents perform under extreme resource constraints?
2. **Decision Quality**: How does stress affect decision-making over time?
3. **Emergent Behavior**: What strategies emerge from basic primitives?
4. **Memory Architecture**: Can LLM-based memory enable long-term navigation?
5. **Psychological Realism**: Can we simulate believable human-like responses?

## 📊 Metrics Tracked

- **Survival rate** and time to completion
- **Exploration efficiency** and path optimization
- **Resource management** quality
- **Decision-making** patterns under stress
- **Memory retrieval** accuracy
- **Reflection** quality and insights
- **Stress dynamics** and emotional states
- **Cognitive degradation** over time

## 💰 Cost Estimates

- **Per simulation**: $8-16 USD (1-2M tokens)
- **MVP testing** (20 runs): $160-320
- **Full experiment** (50 runs): $400-800

Uses Anthropic Claude API for LLM-based decisions.

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Lint code
npm run format       # Format code
```

### Adding Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Implement changes in appropriate `src/` directory
3. Add tests in `tests/` directory
4. Update documentation
5. Submit pull request

## 📚 Documentation

- **[PROJECT.md](docs/PROJECT.md)**: Complete project documentation
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System architecture details
- **[WEEK_1_PLAN.md](docs/WEEK_1_PLAN.md)**: Week 1 implementation plan
- **[API_REFERENCE.md](docs/API_REFERENCE.md)**: API documentation

## 🤝 Contributing

This is an active research project. Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Based on research from:
- **Stanford HAI**: Generative Agents (Park et al., 2023)
- **DeepMind**: SIMA and Genie world models
- **a16z**: AI Town architecture
- **MineLand**: Multi-agent survival simulation

## 📧 Contact

For research inquiries or collaboration opportunities, please open an issue or contact the research team.

---

**Version**: 0.1.0  
**Status**: Week 1 - Foundation & Visuals  
**Last Updated**: November 2, 2025
