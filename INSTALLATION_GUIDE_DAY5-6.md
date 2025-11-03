# Day 5-6 Installation & Integration Guide

## 📦 Files Provided

You have received the following complete, production-ready files:

### Core Agent Files (NEW)
1. **Agent.ts** - Core agent class (~330 lines)
2. **AgentRenderer.ts** - Visual representation (~280 lines)
3. **AgentController.ts** - Input handling (~180 lines)

### Updated Files
4. **Game-Day5-6.ts** - Updated game controller (~350 lines)
5. **Camera-Day5-6.ts** - Updated camera with following (~330 lines)
6. **main-day5-6.ts** - Updated entry point (~180 lines)

### Reference Files
7. **types-additions-day5-6.ts** - Type definitions needed

---

## 🚀 Installation Steps

### Step 1: Create Agent Directory
```bash
# From your project root
mkdir -p src/agent
```

### Step 2: Copy Agent Files
Copy these 3 files to `src/agent/`:
- `Agent.ts` → `src/agent/Agent.ts`
- `AgentRenderer.ts` → `src/agent/AgentRenderer.ts`
- `AgentController.ts` → `src/agent/AgentController.ts`

### Step 3: Update Core Files

#### Option A: Replace Entire Files (Easier)
If you haven't made custom changes to Game.ts or Camera.ts:

```bash
# Backup originals
cp src/core/Game.ts src/core/Game.ts.backup
cp src/rendering/Camera.ts src/rendering/Camera.ts.backup

# Replace with Day 5-6 versions
cp Game-Day5-6.ts src/core/Game.ts
cp Camera-Day5-6.ts src/rendering/Camera.ts
cp main-day5-6.ts src/main.ts
```

#### Option B: Manual Integration (If you have custom changes)
Follow the integration guide below to add only the new code.

### Step 4: Verify Type Definitions
Check your `src/types/index.ts` file has these types:
- `Direction` enum
- `AnimationState` enum
- `AgentState` interface
- `VisualConfig` interface

If missing, add them from `types-additions-day5-6.ts`

### Step 5: Verify Configuration
Check your `src/config/game.config.ts` has:
```typescript
export const CONSTANTS = {
  TILE_SIZE: 32,
  COLORS: {
    agent: 0x00aaff,  // Blue for Arth
    // ... other colors
  }
};
```

If missing the `agent` color, add it.

### Step 6: Install and Run
```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev
```

### Step 7: Test
Open http://localhost:5173 (or your configured port) and test:
- ✓ Agent appears at entrance (blue circle)
- ✓ WASD keys move agent
- ✓ Arrow keys move agent
- ✓ Agent cannot walk through walls
- ✓ Camera follows agent smoothly
- ✓ Idle animation plays when stopped
- ✓ Walk animation plays when moving

---

## 🔧 Manual Integration Guide

If you need to manually integrate changes into existing files:

### Game.ts Changes

#### 1. Add Imports (top of file)
```typescript
import { Agent } from '../agent/Agent';
import { AgentRenderer } from '../agent/AgentRenderer';
import { AgentController } from '../agent/AgentController';
```

#### 2. Add Properties (in Game class)
```typescript
// Agent systems (NEW in Day 5-6)
private agent: Agent | null = null;
private agentRenderer: AgentRenderer | null = null;
private agentController: AgentController | null = null;
```

#### 3. Add Method (after initInput)
```typescript
/**
 * Initialize agent system (NEW in Day 5-6)
 */
private async initAgent(): Promise<void> {
  if (!this.maze || !this.renderer || !this.inputManager) {
    throw new Error('Cannot initialize agent: prerequisites not ready');
  }
  
  console.log('👤 Initializing agent...');
  
  // Create agent at maze entrance
  this.agent = new Agent(this.maze, this.maze.entrance);
  
  // Create agent renderer
  const agentLayer = this.renderer.getAgentLayer();
  this.agentRenderer = new AgentRenderer(
    agentLayer,
    this.agent,
    this.config.visual
  );
  await this.agentRenderer.init();
  
  // Create agent controller
  this.agentController = new AgentController(
    this.agent,
    this.inputManager,
    this.renderer.camera
  );
  
  console.log('✅ Agent initialized');
}
```

#### 4. Update init() Method
Add this line after `this.initInput()`:
```typescript
// Step 5: Initialize agent (NEW in Day 5-6)
await this.initAgent();
```

#### 5. Update update() Method
Add at the beginning:
```typescript
// Update agent systems (NEW in Day 5-6)
if (this.agent && this.agentController && this.agentRenderer) {
  this.agentController.update(deltaTime);
  this.agent.update(deltaTime);
  this.agentRenderer.update(deltaTime);
}
```

#### 6. Update togglePause() Method
Add after setting isPaused:
```typescript
// Also disable agent controller when paused
if (this.agentController) {
  this.agentController.setEnabled(!this.isPaused);
}
```

#### 7. Add getAgent() Method
```typescript
/**
 * Get agent (for debugging/console access)
 */
getAgent(): Agent | null {
  return this.agent;
}
```

#### 8. Update destroy() Method
Add at the beginning:
```typescript
// Destroy agent systems
if (this.agentRenderer) {
  this.agentRenderer.destroy();
  this.agentRenderer = null;
}
this.agent = null;
this.agentController = null;
```

#### 9. Update regenerateMaze() Method
Add before the final console.log:
```typescript
// Reset agent to new entrance
if (this.agent && this.maze && this.agentRenderer) {
  this.agentRenderer.destroy();
  
  this.agent = new Agent(this.maze, this.maze.entrance);
  
  const agentLayer = this.renderer!.getAgentLayer();
  this.agentRenderer = new AgentRenderer(
    agentLayer,
    this.agent,
    this.config.visual
  );
  await this.agentRenderer.init();
  
  this.agentController = new AgentController(
    this.agent,
    this.inputManager!,
    this.renderer!.camera
  );
}
```

---

### Camera.ts Changes

#### 1. Add Property (in Camera class)
```typescript
private targetPosition: Position;  // Target position for smooth following (NEW)
```

#### 2. Initialize in Constructor
```typescript
this.targetPosition = { ...this.position };
```

#### 3. Add/Update update() Method
```typescript
/**
 * Update camera (called every frame)
 */
update(deltaTime: number): void {
  // Smooth interpolation toward target
  const dx = this.targetPosition.x - this.position.x;
  const dy = this.targetPosition.y - this.position.y;
  
  this.position.x += dx * this.smoothing;
  this.position.y += dy * this.smoothing;
  
  this.clampToBounds();
  this.applyTransform();
}
```

#### 4. Add followTarget() Method
```typescript
/**
 * Set target position for camera to follow (NEW in Day 5-6)
 */
followTarget(target: Position, immediate: boolean = false): void {
  this.targetPosition = { ...target };
  
  if (immediate) {
    this.position = { ...target };
    this.applyTransform();
  }
}
```

#### 5. Update reset() Method
Add after setting position:
```typescript
this.targetPosition = { ...this.position };
```

#### 6. Add getTargetPosition() Method
```typescript
getTargetPosition(): Position {
  return { ...this.targetPosition };
}
```

---

## 📝 File Structure After Installation

```
src/
├── agent/                     ← NEW!
│   ├── Agent.ts              ← Core agent logic
│   ├── AgentRenderer.ts      ← Visual representation
│   └── AgentController.ts    ← Input handling
│
├── core/
│   ├── Game.ts               ← Updated with agent init
│   └── InputManager.ts       ← No changes
│
├── rendering/
│   ├── Camera.ts             ← Updated with followTarget
│   ├── Renderer.ts           ← No changes
│   └── MazeRenderer.ts       ← No changes
│
├── maze/
│   ├── MazeGenerator.ts      ← No changes
│   └── Tile.ts               ← No changes
│
├── config/
│   ├── game.config.ts        ← Verify CONSTANTS.COLORS.agent exists
│   └── arth.profile.ts       ← No changes
│
├── types/
│   └── index.ts              ← Verify types exist
│
└── main.ts                    ← Updated with agent info display
```

---

## ✅ Verification Checklist

After installation, verify:

### Code Compilation
- [ ] No TypeScript errors
- [ ] All imports resolve correctly
- [ ] `npm run dev` starts without errors

### Runtime Functionality
- [ ] Game loads without errors
- [ ] Maze renders correctly
- [ ] Blue circle (Arth) appears at entrance
- [ ] WASD keys move agent
- [ ] Arrow keys move agent
- [ ] Agent moves smoothly (no teleporting)
- [ ] Agent stops at tile centers
- [ ] Agent cannot walk through walls
- [ ] Agent cannot leave maze bounds
- [ ] Camera follows agent smoothly
- [ ] FPS stays at 60

### Visual Effects
- [ ] Direction indicator (white line) rotates correctly
- [ ] Idle animation (gentle pulse) plays when stopped
- [ ] Walk animation (bob) plays when moving
- [ ] Shadow under agent
- [ ] Smooth animation transitions

### Controls
- [ ] Mouse wheel zooms in/out
- [ ] Home key resets camera
- [ ] Space bar pauses game
- [ ] R key regenerates maze (agent resets to new entrance)
- [ ] I key shows debug info in console

### UI Display
- [ ] FPS counter updates
- [ ] Agent position displays
- [ ] Agent tile coordinates display
- [ ] Agent status (Idle/Moving) displays

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '../agent/Agent'"
**Solution**: Make sure the agent files are in `src/agent/` directory

### Issue: TypeScript errors about missing types
**Solution**: Add missing types from `types-additions-day5-6.ts` to your `src/types/index.ts`

### Issue: "CONSTANTS.COLORS.agent is undefined"
**Solution**: Add `agent: 0x00aaff` to CONSTANTS.COLORS in your game.config.ts

### Issue: Agent doesn't appear
**Solution**: 
- Check browser console for errors
- Verify `initAgent()` is called in `Game.init()`
- Verify agent layer exists in Renderer

### Issue: Agent appears but doesn't move
**Solution**:
- Check that InputManager is initialized
- Check that AgentController.update() is being called
- Press 'I' key and check console for debug info

### Issue: Movement is jerky or stutters
**Solution**:
- Verify FPS is 60
- Check Camera smoothing value (0.1 is good)
- Verify deltaTime is correct (~0.016)

### Issue: Agent walks through walls
**Solution**:
- Verify collision detection in Agent.canMoveTo()
- Check that maze walls are set correctly
- Add console.log to collision checks

### Issue: Camera doesn't follow agent
**Solution**:
- Verify Camera.followTarget() is being called
- Check that Camera.update() is being called
- Verify camera smoothing > 0

---

## 🎯 Next Steps After Installation

Once Day 5-6 is working:

### Immediate Next Steps
1. Test all features thoroughly
2. Play with the game, explore the maze
3. Verify everything works smoothly

### Day 7-9 (Rest of Week 1)
- Day 7: Lighting system & day/night cycle
- Day 8: Fog of war & view modes  
- Day 9: UI polish & status display

### Week 2
- Replace AgentController with AI
- Implement memory system
- Integrate Claude API
- Autonomous decision-making

---

## 📚 Quick Reference

### Console Commands
```javascript
// Access game
game

// Access agent
game.getAgent()

// Get agent debug info
game.getAgent().getDebugInfo()

// Get agent position
game.getAgent().getPosition()

// Get agent tile
game.getAgent().getTilePosition()

// Check if moving
game.getAgent().isMoving()
```

### Keyboard Shortcuts
- **WASD / Arrows**: Move agent
- **Mouse Wheel**: Zoom camera
- **Home**: Reset camera
- **Space**: Pause/resume
- **R**: Regenerate maze
- **I**: Debug info

---

## 📊 File Statistics

```
Total Files Added:       3 (Agent, AgentRenderer, AgentController)
Total Files Modified:    3 (Game, Camera, main)
Total New Lines:         ~790 lines
Estimated Install Time:  15-30 minutes
Estimated Test Time:     15-30 minutes
Total Time:              30-60 minutes
```

---

## ✨ Success!

When installation is complete, you should have:

✅ A playable character (Arth) at the maze entrance  
✅ Smooth keyboard-controlled movement  
✅ Collision detection working  
✅ Camera following the agent  
✅ Animations (idle & walk)  
✅ Real-time agent info display  
✅ Solid foundation for Week 2

**Congratulations on completing Day 5-6!** 🎉

---

**Installation Guide Version**: 1.0  
**Last Updated**: November 3, 2025  
**Compatibility**: Week 1, Day 5-6
