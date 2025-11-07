# 🧩 Maze Mind

> AI agents with memory, reflection, and planning in a survival maze simulation

[![Status](https://img.shields.io/badge/status-under%20development-yellow)](https://github.com/yourusername/maze-mind)
[![Paper Alignment](https://img.shields.io/badge/paper%20alignment-87%25-brightgreen)](PAPER_ALIGNMENT_REPORT.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Maze Mind** is a research simulation implementing generative agent architecture based on [Park et al. (2023)](https://arxiv.org/abs/2304.03442). Autonomous AI agents navigate a procedurally generated maze with human-like memory, reflection, planning, and social interactions.

## ✨ Features

- 🧠 **Memory Stream**: Importance, recency, and relevance-based retrieval
- 🔄 **Recursive Reflection**: Multi-level abstraction with importance-sum triggering
- 📋 **Hierarchical Planning**: Daily → hourly → 5-minute action decomposition
- 💬 **Multi-Agent Dialogue**: Context-aware conversations with information diffusion
- 🌍 **Rich Environment**: Hierarchical world (areas → rooms → objects) with 14 actions
- 🎯 **Survival Mechanics**: Hunger, energy, stress affecting agent behavior
- 🗺️ **Fog of War**: Agent-perspective and god-mode views
- 📊 **Real-time Panels**: Memory visualization, planning, dialogue, reflection trees

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/maze-mind.git
cd maze-mind

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## 🏗️ Architecture

```
src/
├── agent/          # Agent logic (memory, reflection, planning)
├── core/           # Game loop, time management
├── maze/           # Maze generation, pathfinding
├── rendering/      # PixiJS rendering, fog of war, camera
├── systems/        # Multi-agent, conversation, world hierarchy
├── ui/             # Panels, controls, visualization
├── evaluation/     # Believability metrics
└── config/         # Game configuration
```

## 🧪 LLM Integration

Maze Mind supports multiple LLM providers:

- **Ollama**: Local LLMs (Llama 3, Mistral, etc.)
- **Anthropic**: Claude 3.5 Sonnet (requires API key)

Set your API key in `.env`:
```bash
VITE_ANTHROPIC_API_KEY=your_key_here
```

## 📊 Paper Alignment

Implementation aligns **87%** with [Generative Agents (Park et al., 2023)](https://arxiv.org/abs/2304.03442):

| Component | Alignment |
|-----------|-----------|
| Memory Stream | 100% ✅ |
| Reflection System | 95% ✅ |
| Planning & Decomposition | 85% ✅ |
| Environment & Actions | 85% ✅ |
| Dialogue System | 80% ✅ |
| Multi-Agent System | 75% 🟡 |
| Evaluation Framework | 75% 🟡 |

See [PAPER_ALIGNMENT_REPORT.md](PAPER_ALIGNMENT_REPORT.md) for details.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas for contribution:**
- Evaluation framework enhancements
- Large-scale multi-agent scenarios (25+ agents)
- New environment templates
- Emergent behavior detection
- Performance optimizations

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🎯 Roadmap

- [ ] Large-scale agent simulations (25+ agents)
- [ ] Advanced emergent behavior detection
- [ ] Dynamic environment changes (weather, time effects)
- [ ] Human evaluation studies
- [ ] Performance optimizations
- [ ] Web deployment

## 📚 Research

This project implements the architecture from:

**Generative Agents: Interactive Simulacra of Human Behavior**
Joon Sung Park, Joseph C. O'Brien, Carrie J. Cai, Meredith Ringel Morris, Percy Liang, Michael S. Bernstein
*UIST 2023* | [arXiv:2304.03442](https://arxiv.org/abs/2304.03442)

---

**⚠️ Under Active Development** - Features and APIs may change frequently.

**Questions?** Open an issue or start a discussion!
