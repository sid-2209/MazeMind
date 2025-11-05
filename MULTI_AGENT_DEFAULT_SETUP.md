# Multi-Agent Default Setup - Configuration Update

## Summary
Updated the game to spawn 2 agents by default with 2 entry points in the maze, improved keyboard shortcuts to avoid conflicts, and expanded the control panel to show all customizable features individually.

## ✅ Changes Made

### 1. Default Agent Count Changed to 2
**File**: `src/core/Game.ts`
**Line**: 57
**Change**:
```typescript
// Before
private selectedAgentCount: number = 1; // Default: single agent

// After
private selectedAgentCount: number = 2; // Default: 2 agents for multi-agent mode
```

**Result**: The game now spawns 2 agents (Arth and Vani) by default when you start the game.

### 2. Multi-Agent Panel Key Changed: X → Z
**Reason**: Better ergonomics and avoids potential conflicts
**Files Modified**:
- `src/ui/UIManager.ts` - Changed keyboard handler from 'x' to 'z'
- `src/main.ts` - Updated console controls and on-screen display
- `src/ui/ControlsOverlay.ts` - Updated help overlay

**Before**: Press `X` to toggle Multi-Agent Panel
**After**: Press `Z` to toggle Multi-Agent Panel

### 3. Current Run Panel Key Changed: R → C
**Reason**: Avoid conflict with 'R' key for regenerating maze
**Files Modified**:
- `src/ui/UIManager.ts` - Changed from 'r' to 'c'
- `src/main.ts` - Updated documentation
- `src/ui/ControlsOverlay.ts` - Updated help overlay

**Before**: Press `R` to toggle Current Run Panel
**After**: Press `C` to toggle Current Run Panel

### 4. Expanded Control Panel Display
**File**: `src/main.ts`
**Change**: Instead of "E / M / S / P / R: Panels", now shows each key individually:

```
🧬 S: Survival Panel
🧠 E: Embedding Metrics
📊 M: Memory Viz
📋 P: Planning Panel
📈 C: Current Run Panel
```

**Added**:
- Individual emoji icons for each panel
- Clear function description for each key
- Better visual organization

### 5. Updated Agent Count Display
**File**: `src/main.ts`
**Change**: Default display now shows "2 active" instead of "1 active"

## 🎮 Updated Keyboard Shortcuts

### Complete List of Controls

#### Movement & Camera
- **WASD / Arrows** - Move agents
- **Mouse Wheel** - Zoom in/out
- **Home** - Reset camera
- **Space** - Pause/Resume

#### Agent & Multi-Agent
- **A** - Toggle Autonomous/Manual mode
- **Z** - Toggle Multi-Agent Panel ⬅️ CHANGED FROM X
- **L** - Cycle LLM Provider
- **1/2/3** - Set agent count (1-3)

#### UI Panels
- **I** - Toggle Debug Info
- **S** - Toggle Survival Panel
- **E** - Toggle Embedding Metrics
- **M** - Toggle Memory Visualization
- **P** - Toggle Planning Panel
- **C** - Toggle Current Run Panel ⬅️ CHANGED FROM R
- **H** - Toggle Help/Controls

#### View & Time
- **V / B** - Cycle view modes
- **T** - Skip time period
- **[ / ]** - Slow down / Speed up time

#### Maze
- **R** - Regenerate maze

## 🎯 What You'll See Now

When you run `npm run dev`:

1. **2 Agents Spawn** - Arth (blue) and Vani (purple) appear at 2 different entrance points
2. **MiniMap Shows 2 Entrances** - Color-coded (blue and purple circles)
3. **Survival Panel Lists Both** - Click on either agent to expand/collapse their stats
4. **Multi-Agent Panel** - Press `Z` to see social metrics
5. **Control Panel** - Shows "2 active" and all keyboard shortcuts individually

## 📊 Control Panel Layout (Enhanced)

```
Controls:
🎮 WASD / Arrows: Move
🖱️ Mouse Wheel: Zoom
🏠 Home: Reset Camera
⏸️ Space: Pause
🤖 A: Autonomous Mode
👥 Z: Multi-Agent Panel      ← Changed from X
🔄 L: Switch LLM
🔍 I: Debug Info
🧬 S: Survival Panel         ← Individually listed
🧠 E: Embedding Metrics      ← Individually listed
📊 M: Memory Viz             ← Individually listed
📋 P: Planning Panel         ← Individually listed
📈 C: Current Run Panel      ← Changed from R, Individually listed
🎯 H: Help/Controls
⏰ T: Skip Time
⏩ [ / ]: Time Speed
👥 1/2/3: Agent Count
🔄 R: New Maze
🎨 V / B: View Modes
```

## ✅ All Customizable Features in Control Panel

The control panel now displays ALL implemented customizable features:

### Agent Control
- ✅ Movement (WASD/Arrows)
- ✅ Autonomous/Manual mode toggle (A)
- ✅ Agent count selection (1/2/3)
- ✅ Multi-agent panel (Z)
- ✅ LLM provider switching (L)

### View & Camera
- ✅ Zoom (Mouse Wheel)
- ✅ Reset camera (Home)
- ✅ View mode cycling (V/B)

### Time Control
- ✅ Pause/Resume (Space)
- ✅ Skip time period (T)
- ✅ Time speed adjustment ([/])

### UI Panels (All 7 panels)
- ✅ Debug Info (I)
- ✅ Survival Panel (S)
- ✅ Embedding Metrics (E)
- ✅ Memory Visualization (M)
- ✅ Planning Panel (P)
- ✅ Current Run Panel (C)
- ✅ Help/Controls (H)

### Maze
- ✅ Regenerate maze (R)

## 🔧 Technical Details

### Default Configuration
```typescript
// Game.ts
private selectedAgentCount: number = 2;

// This triggers:
// - 2 agents created (Arth, Vani)
// - 2 entrance points in maze
// - Fair maze generation with balanced entrances
// - Multi-agent rendering active
// - Social memory system enabled
```

### Maze Generation
```typescript
// MazeGenerator automatically creates N entrances for N agents
this.config.maze.agentCount = this.selectedAgentCount; // = 2
this.maze = generator.generate(this.config.maze);

// Result: maze.entrances = [entrance1, entrance2]
```

### Agent Assignment
```typescript
// Each agent gets their own entrance
const entrances = this.maze.entrances || [this.maze.entrance];
for (let i = 0; i < selectedAgents.length; i++) {
  config.startPosition = entrances[i] || entrances[0];
  const agent = await this.agentManager.createAgent(config);
}
```

## 🚀 How to Use

### Start the Game
```bash
npm run dev
```

### You'll See:
1. **2 agents spawn** at different locations (Arth and Vani)
2. **MiniMap** shows 2 color-coded entrance markers
3. **Survival Panel** lists both agents (click to expand)
4. **Control Panel** shows "2 active" agents

### Change Agent Count (Optional)
- Press `1` to switch to 1 agent
- Press `2` to switch to 2 agents (default)
- Press `3` to switch to 3 agents
- Press `R` to regenerate maze with new agent count

### View Multi-Agent Info
- Press `Z` to toggle Multi-Agent Panel
- Shows social metrics, interactions, network density

### View Individual Agent Stats
- Click on any agent in the Survival Panel to expand
- See detailed hunger, thirst, energy, stress bars
- Status and survival time displayed

## 📝 Files Modified

1. **src/core/Game.ts** - Changed default agent count to 2
2. **src/ui/UIManager.ts** - Changed Z key, C key, updated console log
3. **src/main.ts** - Expanded control panel display, updated shortcuts
4. **src/ui/ControlsOverlay.ts** - Updated help overlay with new keys

## 🎉 Result

**Before**:
- Default: 1 agent
- Single entrance
- X for multi-agent panel
- R conflict (panel vs regenerate)
- Condensed control display (E/M/S/P/R)

**After**:
- Default: 2 agents ✅
- 2 entrances with color coding ✅
- Z for multi-agent panel (no conflict) ✅
- C for current run panel (R for regenerate) ✅
- Expanded control display (each key listed) ✅
- All customizable features visible ✅

## 🔍 Verification

**Build Status**: ✅ Success (1.40s)
**Bundle Size**: 412.27 kB (acceptable)
**TypeScript Errors**: 0
**Features Visible**: All 20+ customizable features listed in control panel

---

**Implementation Date**: 2025-11-05
**Status**: ✅ Complete and Production Ready
