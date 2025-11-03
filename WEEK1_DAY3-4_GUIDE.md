# Week 1, Day 3-4: PixiJS Rendering - Testing Guide

## 🎯 What We Built Today

You've created a beautiful, interactive maze visualization system with PixiJS!

### Files Created (6 files, ~800 lines)

1. **`src/core/Game.ts`** (250 lines)
   - Main game controller
   - Coordinates all systems
   - Game loop management
   - Initialization & cleanup

2. **`src/core/InputManager.ts`** (180 lines)
   - Keyboard and mouse handling
   - Clean input API
   - Event listener management

3. **`src/rendering/Camera.ts`** (250 lines)
   - Viewport management
   - Pan and zoom functionality
   - Smooth interpolation
   - Bounds checking

4. **`src/rendering/MazeRenderer.ts`** (180 lines)
   - Tile rendering with PixiJS
   - Wall visualization
   - Color-coded tiles
   - Entrance/exit highlighting

5. **`src/rendering/Renderer.ts`** (150 lines)
   - Rendering coordinator
   - Layer management
   - System integration

6. **`src/main-day3-4.ts`** (150 lines)
   - Application entry point
   - UI setup
   - Keyboard shortcuts

---

## 🚀 How to Test

### Step 1: Copy Files to Your Project

```bash
cd ~/maze-mind

# Copy core files
cp /path/to/src/core/*.ts src/core/

# Copy rendering files
cp /path/to/src/rendering/*.ts src/rendering/

# Update main.ts
cp /path/to/src/main-day3-4.ts src/main.ts
```

### Step 2: Run Development Server

```bash
npm run dev
```

The browser should automatically open to `http://localhost:3000`

---

## ✅ Expected Output

### In Browser

You should see:

1. **Beautiful rendered maze**
   - Green entrance tile (left side)
   - Red exit tile (right side)
   - Gray floor tiles
   - Dark walls between tiles

2. **Controls panel (top-left)**
   - Title: "🧩 Maze Mind"
   - Week/Day indicator
   - Control instructions
   - FPS counter

3. **Smooth 60 FPS rendering**

### In Console

```
🧩 Maze Mind - Week 1, Day 3-4: PixiJS Rendering

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Starting Maze Mind...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎮 Game instance created
🧩 Generating maze...
✅ Maze generated: 0,10 → 19,10
🎨 Initializing PixiJS...
   Canvas: 1880×1000px
🖼️  Initializing renderer...
📷 Camera created
   Canvas: 1880×1000
   World: 640×640
🎨 MazeRenderer created
🎨 Rendering maze tiles...
   Rendered 400 tiles
✅ Renderer initialized
🎮 Initializing input...
   Event listeners attached
   Camera controls:
     - Mouse wheel: Zoom in/out
     - Arrow keys: Pan camera
     - Home: Reset camera
     - Space: Pause/Resume
   Input ready
▶️  Starting game loop...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Game Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎮 Controls:
   Mouse Wheel: Zoom in/out
   Arrow Keys: Pan camera
   Home: Reset camera
   Space: Pause/Resume
   R: Regenerate maze
```

---

## 🎮 Interactive Testing

### Test 1: Zoom (Mouse Wheel)

1. **Scroll up** (away from you) → Maze should zoom OUT (see more)
2. **Scroll down** (toward you) → Maze should zoom IN (see less)
3. **Check**: Zoom should be smooth, not jumpy
4. **Check**: Can't zoom infinitely (limits at 0.25× and 3.0×)

**Expected**: ✅ Smooth zoom with limits

---

### Test 2: Pan (Arrow Keys)

1. **Press ➡️ Right Arrow** → View pans right (maze moves left)
2. **Press ⬆️ Up Arrow** → View pans up (maze moves down)
3. **Press ⬅️ Left Arrow** → View pans left (maze moves right)
4. **Press ⬇️ Down Arrow** → View pans down (maze moves up)

**Expected**: ✅ Smooth panning in all directions

---

### Test 3: Reset Camera (Home Key)

1. **Zoom in** very close
2. **Pan** to a corner
3. **Press Home** key
4. Camera should smoothly return to center, reset zoom to 1.0×

**Expected**: ✅ Camera resets to default view

---

### Test 4: Pause (Spacebar)

1. **Press Space** → Game pauses
2. **Check console**: Should see "⏸️  Paused"
3. **Press Space again** → Game resumes
4. **Check console**: Should see "▶️  Resumed"

**Expected**: ✅ Can pause and resume

---

### Test 5: Regenerate Maze (R Key)

1. **Note** the current maze layout
2. **Press R** key
3. **Check**: New maze appears (different layout)
4. **Check console**: Should see "🔄 Regenerating maze..."

**Expected**: ✅ New maze generated

---

### Test 6: FPS Counter

1. **Look** at top-left controls panel
2. **Find** "FPS: [number]"
3. **Check**: Should be around 60 FPS
4. **Zoom/Pan**: FPS should stay stable

**Expected**: ✅ Consistent 60 FPS

---

### Test 7: Window Resize

1. **Resize browser window**
2. **Check**: Maze should resize to fit
3. **Check**: No distortion or errors

**Expected**: ✅ Responsive to window size

---

## 🎨 Visual Quality Checklist

Check that you can see:

- ✅ **Green entrance tile** (left side, middle)
- ✅ **Red exit tile** (right side, middle)
- ✅ **Gray floor tiles** (walkable paths)
- ✅ **Dark walls** (black/dark gray lines between tiles)
- ✅ **Smooth rendering** (no flickering)
- ✅ **Clear tile boundaries** (subtle borders)
- ✅ **Centered view** (maze in middle of screen)

---

## 🔍 Debugging Common Issues

### Issue: Black screen, nothing renders

**Check**:
1. Console for errors
2. PixiJS installed: `npm list pixi.js`
3. All files copied correctly
4. No TypeScript errors: `npx tsc --noEmit`

**Solution**:
```bash
npm install
npm run dev
```

---

### Issue: "Cannot find module" errors

**Problem**: TypeScript path mappings not working

**Solution**:
1. Check `tsconfig.json` has correct paths
2. Restart VS Code
3. Restart dev server: `Ctrl+C`, then `npm run dev`

---

### Issue: Maze renders but controls don't work

**Check**:
1. Console for JavaScript errors
2. InputManager initialized correctly
3. Event listeners attached

**Test**:
```javascript
// In browser console
game.inputManager
// Should show InputManager object
```

---

### Issue: FPS is very low (< 30)

**Causes**:
1. Large maze (20×20 should be fine)
2. Multiple browser tabs
3. Hardware limitations

**Solution**:
1. Close other tabs
2. Try smaller maze (10×10)
3. Check if GPU acceleration enabled in browser

---

### Issue: Zoom/pan feels laggy

**Check**: Camera smoothing setting

**Adjust**:
```javascript
// In browser console
game.renderer.camera.setSmoothing(0.2)
// Lower = snappier, Higher = smoother
```

---

### Issue: Can't see entrance or exit

**Check**:
1. Maze generated correctly
2. Colors defined in config
3. Zoom level (zoom out to see more)

**Debug**:
```javascript
// In browser console
const maze = game.getMaze();
console.log('Entrance:', maze.entrance);
console.log('Exit:', maze.exit);
```

---

## 📊 Performance Benchmarks

Expected performance on Mac Mini M4 (16GB RAM):

| Maze Size | Tiles | FPS | Init Time |
|-----------|-------|-----|-----------|
| 10×10 | 100 | 60 | <50ms |
| 20×20 | 400 | 60 | ~100ms |
| 30×30 | 900 | 60 | ~200ms |
| 50×50 | 2,500 | 55-60 | ~500ms |

If your FPS is significantly lower, check:
- Other applications using GPU
- Browser hardware acceleration
- Development mode overhead (production builds are faster)

---

## 🎓 What You Learned

### 1. PixiJS Fundamentals
- Application initialization
- Container hierarchy
- Graphics rendering
- Coordinate systems

### 2. Game Architecture
- Game loop (update/render cycle)
- System coordination
- Layer management
- Event handling

### 3. Camera Systems
- Viewport transformation
- Pan and zoom
- Smooth interpolation
- Bounds clamping

### 4. Performance Optimization
- Efficient rendering
- Graphics reuse
- Layer separation
- 60 FPS targeting

---

## 💡 Pro Tips

### Tip 1: Console Access
The game instance is available in console:
```javascript
game.getMaze()           // Get current maze
game.regenerateMaze()    // New maze
game.getFPS()            // Current FPS
game.renderer.camera     // Access camera
```

### Tip 2: Custom Maze
Generate specific maze from console:
```javascript
game.regenerateMaze('my-seed-123')
```

### Tip 3: Camera Shortcuts
```javascript
// Zoom to specific level
game.renderer.camera.setZoom(2.0, true)

// Jump to position
game.renderer.camera.setPosition(320, 320, true)

// Focus on entrance
const entrance = game.getMaze().entrance;
game.renderer.camera.focusOn(
  entrance.x * 32, 
  entrance.y * 32, 
  2.0
)
```

### Tip 4: Performance Monitoring
Watch FPS in real-time:
```javascript
setInterval(() => {
  console.log('FPS:', game.getFPS());
}, 1000);
```

---

## 🧪 Advanced Experiments

### Experiment 1: Extreme Zoom
```javascript
// Max zoom in
game.renderer.camera.setZoom(3.0)

// Max zoom out
game.renderer.camera.setZoom(0.25)
```

### Experiment 2: Rapid Regeneration
```javascript
// Generate 10 mazes rapidly
for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    game.regenerateMaze(`test-${i}`);
  }, i * 1000);
}
```

### Experiment 3: Camera Animation
```javascript
// Slowly zoom in
let zoom = 1.0;
const interval = setInterval(() => {
  zoom += 0.01;
  game.renderer.camera.setZoom(zoom);
  if (zoom >= 2.0) clearInterval(interval);
}, 16);
```

---

## ✅ Completion Checklist

Before moving to Day 5-6, verify:

- [ ] All 6 files created and copied
- [ ] `npm run dev` works without errors
- [ ] Maze renders in browser
- [ ] Can zoom with mouse wheel
- [ ] Can pan with arrow keys
- [ ] Home key resets camera
- [ ] R key regenerates maze
- [ ] Spacebar pauses/resumes
- [ ] FPS counter shows ~60
- [ ] Entrance is green, exit is red
- [ ] Walls are visible
- [ ] No console errors
- [ ] Understand camera system
- [ ] Understand rendering layers
- [ ] Ready for lighting & effects

**Status**: Day 3-4 Complete ✅

---

## 🚀 Next Steps: Day 5-6

**Goal**: Add character sprite (Arth) with smooth movement

**What we'll build**:
- Agent class
- Sprite animation system
- Keyboard-controlled movement
- Collision detection
- Camera following agent

**Files to create**:
- `src/agent/Agent.ts`
- `src/agent/AgentRenderer.ts`
- `src/agent/AgentController.ts`

**Estimated time**: 4-5 hours

---

## 🎉 Congratulations!

You've built a fully functional, interactive maze visualization system!

**Lines of Code**: ~800
**Systems Built**: 6
**FPS**: 60
**Interactivity**: Full keyboard/mouse control

The foundation is looking beautiful! Ready to add Arth? 🎮

---

**Tip**: Take a screenshot of your rendered maze - you've earned it! 📸
