# Changelog

All notable changes to Maze Mind will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🎯 Planned
- Large-scale agent simulations
- Advanced emergent behavior detection
- Dynamic environment changes (weather, time effects)
- Human evaluation studies
- Performance optimizations
- Web deployment

## [0.1.0] - 2025-11-06

### ✨ Added
- **Memory Stream**: Importance, recency, and relevance-based retrieval system
- **Recursive Reflection**: Multi-level abstraction with importance-sum triggering (≥150 threshold)
- **Hierarchical Planning**: Daily → hourly → 5-minute action decomposition
- **Multi-Agent Dialogue**: Context-aware conversations with information diffusion
- **Rich Environment**: Hierarchical world structure (World → Areas → Rooms → Objects)
- **14 Interactive Actions**: Open, close, sit, sleep, eat, drink, examine, etc.
- **Survival Mechanics**: Hunger, energy, stress affecting agent behavior
- **Fog of War**: Agent-perspective and god-mode view systems
- **Real-time Visualization Panels**:
  - Memory visualization panel
  - Planning panel
  - Dialogue/conversation panel
  - Reflection tree panel
  - Location tree panel
  - Multi-agent panel
  - Survival metrics panel
- **LLM Integration**: Support for Anthropic Claude, Ollama, and heuristic modes
- **Procedural Maze Generation**: Randomized maze layouts with multiple entry points
- **Day/Night Cycle**: Time-of-day system with period-based behaviors
- **Evaluation Framework**: Believability metrics and scoring system

### 🏗️ Technical
- Built with TypeScript, PixiJS v7, and Vite
- 87% alignment with Park et al. (2023) generative agents paper
- Modular architecture with clean separation of concerns
- Comprehensive type definitions
- Real-time rendering with 60 FPS target

### 📚 Documentation
- Developer-friendly README
- Contributing guidelines
- Paper alignment report
- MIT License
- Code of conduct

---

## Version History Summary

- **0.1.0** (2025-11-06): Initial release with core generative agent architecture
