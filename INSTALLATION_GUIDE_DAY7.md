// Installation Guide - Day 7: Lighting System & Day/Night Cycle

# Day 7 Installation & Integration Guide

## 📦 Files Provided

You have received the following complete, production-ready files:

### Core System Files (NEW)
1. **TimeManager.ts** - Game time and day/night cycle (~370 lines)
2. **LightingSystem.ts** - Dynamic lighting and atmosphere (~310 lines)

### Updated Files
3. **Game-Day7.ts** - Updated game controller with time manager (~380 lines)
4. **Renderer-Day7.ts** - Updated renderer with lighting (~270 lines)
5. **main-day7.ts** - Updated entry point with time display (~230 lines)

### Configuration Files
6. **types-additions-day7.ts** - New type definitions (~60 lines)
7. **game-config-additions-day7.ts** - Time configuration (~80 lines)

---

## 🚀 Installation Steps

### Step 1: Verify Prerequisites

Ensure Day 5-6 is working:
- ✅ Agent moves with WASD/Arrows
- ✅ Camera follows agent
- ✅ Collision detection works
- ✅ 60 FPS maintained

### Step 2: Add Type Definitions

Open `src/types/index.ts` and add these types:

```typescript
export enum TimePeriod {
  DAY = 'day',
  DUSK = 'dusk',
  NIGHT = 'night',
  DAWN = 'dawn',
}

export interface TimeOfDay {
  period: TimePeriod;
  brightness: number;
  hour: number;
}

export interface TimeConfig {
  realTime: boolean;
  timeAcceleration: number;
  pauseable: boolean;
  adjustableSpeed: number[];
  dayLength: number;
  nightLength: number;
  fullCycle: number;
  dawnDuskTransition: number;
  dayVisibility: number;
  duskVisibility: number;
  nightVisibility: number;
  dawnVisibility: number;
  requiresSleep: boolean;
  sleepDeprivationThreshold: number;
  sleepDuration: [number, number];
  canSleepAnywhere: boolean;
  nightmaresPossible: boolean;
}

// Update GameConfig interface to include time
export interface GameConfig {
  maze: MazeConfig;
  agent: AgentConfig;
  time: TimeConfig;     // ADD THIS
  survival: SurvivalConfig;
  visual: VisualConfig;
}
```

### Step 3: Add Time Configuration

Open `src/config/game.config.ts` and add:

```typescript
export const TIME_CONFIG: TimeConfig = {
  realTime: true,
  timeAcceleration: 10,
  pauseable: true,
  adjustableSpeed: [0.5, 1, 2, 5, 10, 20, 50],
  dayLength: 720,
  nightLength: 720,
  fullCycle: 1440,
  dawnDuskTransition: 120,
  dayVisibility: 1.0,
  duskVisibility: 0.7,
  nightVisibility: 0.3,
  dawnVisibility: 0.7,
  requiresSleep: true,
  sleepDeprivationThreshold: 36,
  sleepDuration: [6, 8],
  canSleepAnywhere: true,
  nightmaresPossible: true,
};

// Update GAME_CONFIG
export const GAME_CONFIG: GameConfig = {
  maze: MAZE_CONFIG,
  agent: AGENT_CONFIG,
  time: TIME_CONFIG,        // ADD THIS
  survival: SURVIVAL_CONFIG,
  visual: VISUAL_CONFIG,
};
```

### Step 4: Copy Core System Files

```bash
# Copy TimeManager to core directory
cp TimeManager.ts src/core/

# Copy LightingSystem to rendering directory
cp LightingSystem.ts src/rendering/
```

### Step 5: Update Core Files

#### Option A: Replace Entire Files (Recommended)

```bash
# Backup originals
cp src/core/Game.ts src/core/Game.ts.day6
cp src/rendering/Renderer.ts src/rendering/Renderer.ts.day6
cp src/main.ts src/main.ts.day6

# Replace with Day 7 versions
cp Game-Day7.ts src/core/Game.ts
cp Renderer-Day7.ts src/rendering/Renderer.ts
cp main-day7.ts src/main.ts
```

#### Option B: Manual Integration

See "Manual Integration Guide" section below.

### Step 6: Test Installation

```bash
# Run development server
npm run dev
```

### Step 7: Verify Features

Test the following:
- [ ] Game starts without errors
- [ ] Time display shows in UI
- [ ] Time progresses automatically
- [ ] Lighting changes from dawn → day → dusk → night
- [ ] Screen tint changes with time of day
- [ ] Press T to skip time periods
- [ ] Press [ or ] to change time speed
- [ ] Agent still moves correctly
- [ ] Camera still follows agent
- [ ] FPS stays at 60

---

## 🔧 Manual Integration Guide

If you need to manually integrate changes:

### Game.ts Changes

#### 1. Add Import
```typescript
import { TimeManager } from './TimeManager';
```

#### 2. Add Property
```typescript
private timeManager: TimeManager | null = null;
```

#### 3. Add Init Method (after initPixiJS)
```typescript
private initTimeManager(): void {
  console.log('⏰ Initializing time manager...');
  this.timeManager = new TimeManager(this.config.time);
  console.log('✅ Time manager initialized');
}
```

#### 4. Update init() Method
Add after `initPixiJS()`:
```typescript
// Step 3: Initialize time manager
this.initTimeManager();
```

#### 5. Update initRenderer()
Change constructor call:
```typescript
// Pass time manager to renderer
this.renderer = new Renderer(
  this.app, 
  this.maze, 
  this.config, 
  this.timeManager  // ADD THIS
);
```

#### 6. Update update() Method
Add at the beginning:
```typescript
// Update time manager
if (this.timeManager) {
  this.timeManager.update(deltaTime);
}
```

#### 7. Update togglePause()
Add:
```typescript
if (this.timeManager) {
  this.timeManager.togglePause();
}
```

#### 8. Update setupControls()
Add new keyboard shortcuts:
```typescript
case 't':
case 'T':
  this.timeManager?.skipToNextPeriod();
  break;
case '[':
  const currentScale = this.timeManager?.getTimeScale() || 1;
  this.timeManager?.setTimeScale(Math.max(0.5, currentScale / 2));
  break;
case ']':
  const scale = this.timeManager?.getTimeScale() || 1;
  this.timeManager?.setTimeScale(Math.min(100, scale * 2));
  break;
```

#### 9. Add Getter
```typescript
getTimeManager(): TimeManager | null {
  return this.timeManager;
}
```

#### 10. Update destroy()
Add:
```typescript
this.timeManager = null;
```

---

### Renderer.ts Changes

#### 1. Add Import
```typescript
import { LightingSystem } from './LightingSystem';
import { TimeManager } from '../core/TimeManager';
```

#### 2. Add Properties
```typescript
private lightingLayer: Container;
private lightingSystem: LightingSystem | null = null;
private timeManager: TimeManager | null = null;
```

#### 3. Update Constructor
```typescript
constructor(
  app: Application, 
  maze: Maze, 
  config: GameConfig, 
  timeManager?: TimeManager  // ADD THIS
) {
  this.app = app;
  this.maze = maze;
  this.config = config;
  this.timeManager = timeManager || null;  // ADD THIS
  
  // ... existing code ...
  this.lightingLayer = new Container();  // ADD THIS
}
```

#### 4. Update setupLayers()
Add after agentLayer:
```typescript
this.worldContainer.addChild(this.lightingLayer);
```

Update console.log:
```typescript
console.log('   Layers: Background → Maze → Agent → Lighting → UI');
```

#### 5. Add initLightingSystem() Method
```typescript
private async initLightingSystem(): Promise<void> {
  if (!this.timeManager) {
    console.log('⚠️  No time manager - skipping lighting system');
    return;
  }
  
  console.log('💡 Initializing lighting system...');
  
  this.lightingSystem = new LightingSystem(this.lightingLayer, this.timeManager);
  await this.lightingSystem.init();
  
  this.lightingSystem.updateOverlaySize(
    this.app.screen.width * 2,
    this.app.screen.height * 2
  );
  
  this.lightingLayer.x = -this.app.screen.width / 2;
  this.lightingLayer.y = -this.app.screen.height / 2;
  
  console.log('✅ Lighting system initialized');
}
```

#### 6. Update init() Method
Add after maze renderer:
```typescript
// Initialize lighting system
if (this.timeManager) {
  await this.initLightingSystem();
}
```

#### 7. Update update() Method
Add:
```typescript
// Update lighting system
if (this.lightingSystem) {
  this.lightingSystem.update(deltaTime);
}
```

#### 8. Update handleResize()
Add:
```typescript
// Update lighting overlay size
if (this.lightingSystem) {
  this.lightingSystem.updateOverlaySize(width * 2, height * 2);
  this.lightingLayer.x = -width / 2;
  this.lightingLayer.y = -height / 2;
}
```

#### 9. Add Getter
```typescript
getLightingSystem(): LightingSystem | null {
  return this.lightingSystem;
}
```

#### 10. Update destroy()
Add:
```typescript
if (this.lightingSystem) {
  this.lightingSystem.destroy();
}
```

---

## 📝 File Structure After Installation

```
src/
├── core/
│   ├── Game.ts               ← Updated with TimeManager
│   ├── TimeManager.ts        ← NEW!
│   └── InputManager.ts       ← No changes
│
├── rendering/
│   ├── Renderer.ts           ← Updated with LightingSystem
│   ├── LightingSystem.ts     ← NEW!
│   ├── Camera.ts             ← No changes
│   └── MazeRenderer.ts       ← No changes
│
├── agent/
│   ├── Agent.ts              ← No changes
│   ├── AgentRenderer.ts      ← No changes
│   └── AgentController.ts    ← No changes
│
├── config/
│   └── game.config.ts        ← Updated with TIME_CONFIG
│
├── types/
│   └── index.ts              ← Updated with time types
│
└── main.ts                    ← Updated with time display
```

---

## ✅ Verification Checklist

### Code Compilation
- [ ] No TypeScript errors
- [ ] All imports resolve
- [ ] `npm run dev` starts successfully

### Runtime - Basic Functionality
- [ ] Game loads without errors
- [ ] Maze renders correctly
- [ ] Agent moves with WASD/Arrows
- [ ] Camera follows agent
- [ ] No console errors

### Runtime - Time System
- [ ] Time display shows in UI (top-left)
- [ ] Time progresses automatically
- [ ] Time format is correct (12:XX AM/PM)
- [ ] Day counter increments
- [ ] Time speed display updates

### Runtime - Lighting System
- [ ] Lighting transitions smoothly
- [ ] Dawn period shows warm orange tint
- [ ] Day period is bright and clear
- [ ] Dusk period shows sunset colors
- [ ] Night period is dark with blue tint
- [ ] Transitions are smooth (no flickering)

### Runtime - Controls
- [ ] T key skips to next time period
- [ ] [ key slows down time
- [ ] ] key speeds up time
- [ ] Space still pauses everything
- [ ] I key shows debug info with time data

### Performance
- [ ] FPS stays at 60
- [ ] No lag during time transitions
- [ ] Smooth lighting changes

---

## 🐛 Troubleshooting

### Issue: "Cannot find module TimeManager"
**Solution**: 
- Verify TimeManager.ts is in `src/core/` directory
- Check import path in Game.ts

### Issue: "Cannot find module LightingSystem"
**Solution**:
- Verify LightingSystem.ts is in `src/rendering/` directory
- Check import path in Renderer.ts

### Issue: TypeScript errors about TimeConfig
**Solution**:
- Add all time types to `src/types/index.ts`
- Make sure TIME_CONFIG is in game.config.ts
- Verify GameConfig interface includes `time` property

### Issue: Lighting not working
**Solution**:
- Check console for lighting system initialization
- Verify TimeManager is passed to Renderer
- Check that lightingLayer is added to worldContainer

### Issue: Time not progressing
**Solution**:
- Check that TimeManager.update() is called in Game.update()
- Verify game is not paused
- Check time scale (should be > 0)

### Issue: Screen too dark or too bright
**Solution**:
- Adjust TIME_CONFIG visibility values in game.config.ts
- Check current time period with T key
- Verify brightness calculation in LightingSystem

### Issue: Jerky lighting transitions
**Solution**:
- Adjust LightingSystem.transitionSpeed (default 0.5)
- Check FPS (should be 60)
- Verify smooth camera movement setting

---

## 🎮 Testing Guide

### Test Sequence 1: Basic Time Cycle
1. Start game
2. Watch time progress for 2 minutes
3. Observe lighting changes
4. Verify smooth transitions
5. Check FPS stays at 60

### Test Sequence 2: Time Controls
1. Press T to skip through periods
2. Dawn → Day → Dusk → Night → Dawn
3. Verify each period looks correct
4. Check lighting colors match period

### Test Sequence 3: Time Speed
1. Press ] to speed up time (20x, 50x)
2. Watch rapid day/night cycle
3. Press [ to slow down (2x, 1x, 0.5x)
4. Verify smooth at all speeds

### Test Sequence 4: Pause/Resume
1. Press Space to pause
2. Verify time stops
3. Verify agent can't move
4. Press Space to resume
5. Verify time continues

### Test Sequence 5: Agent Integration
1. Move agent during day (bright)
2. Move agent during night (dark)
3. Verify agent visible in all periods
4. Check camera still follows correctly

---

## 📊 Expected Results

### Time Progression
- **Dawn** (5:00 AM - 7:00 AM): Warm orange tint, gradually brightening
- **Day** (7:00 AM - 5:00 PM): Bright, clear, full visibility
- **Dusk** (5:00 PM - 7:00 PM): Orange-red sunset tint, gradually darkening
- **Night** (7:00 PM - 5:00 AM): Dark blue tint, limited visibility

### Visual Changes
- **Dawn**: Soft orange glow (#ffaa88), 70% brightness
- **Day**: Pure white (#ffffff), 100% brightness
- **Dusk**: Warm sunset (#ff8844), 70% brightness
- **Night**: Cool moonlight (#4466aa), 30% brightness

### Performance
- **FPS**: Steady 60 FPS
- **Memory**: No memory leaks
- **Transitions**: Smooth interpolation (~0.5 seconds)

---

## 🔮 What You've Added

### New Systems
- ✅ TimeManager - Tracks game time and day/night cycle
- ✅ LightingSystem - Dynamic lighting with smooth transitions
- ✅ Time-based atmosphere - Screen tinting and darkness overlay

### New Features
- ✅ Day/night cycle (24 hours compressed to ~2.4 real minutes at 10x speed)
- ✅ 4 distinct time periods (dawn, day, dusk, night)
- ✅ Smooth lighting transitions
- ✅ Time controls (T to skip, [ ] to adjust speed)
- ✅ Real-time UI display

### New Keyboard Controls
- **T** - Skip to next time period
- **[** - Slow down time (divide by 2)
- **]** - Speed up time (multiply by 2)

---

## 🎯 Next Steps (Day 8)

After Day 7 is complete, you'll add:

### Day 8: Fog of War & View Modes
- Visibility system (tiles visible/hidden)
- Agent's vision cone
- Exploration tracking
- Multiple view modes:
  - Agent POV (see only what agent sees)
  - God Mode (see everything)
  - Mixed Mode (blend of both)
  - Debug Mode (show all data)

### Day 9: UI Polish
- Status panel with stats
- Mini-map showing exploration
- Inventory display
- Debug panel

---

## 📚 Console Commands (for testing)

```javascript
// Access systems
game.getTimeManager()

// Time controls
game.getTimeManager().setTime(12, 0)  // Set to noon
game.getTimeManager().setTime(0, 0)   // Set to midnight
game.getTimeManager().skipToNextPeriod()
game.getTimeManager().setTimeScale(50) // Very fast time

// Lighting controls
const lighting = game.renderer.getLightingSystem()
lighting.setBrightness(0.5, true)     // 50% brightness
lighting.setTint(0xff0000, true)      // Red tint
lighting.flash(0.3, 2.0)              // Lightning flash

// Debug
game.getTimeManager().getDebugInfo()
lighting.getDebugInfo()
```

---

## ✨ Success Criteria

Day 7 is complete when:

- [x] Time progresses smoothly
- [x] Day/night cycle works
- [x] Lighting changes with time
- [x] 4 time periods are distinct
- [x] Transitions are smooth
- [x] Time controls work (T, [, ])
- [x] UI displays time info
- [x] Agent still works correctly
- [x] Camera still follows
- [x] 60 FPS maintained
- [x] No console errors

---

**Installation Guide Version**: 1.0  
**Last Updated**: November 3, 2025  
**Compatibility**: Week 1, Day 7  
**Estimated Install Time**: 30-45 minutes
