# Day 8: Installation Guide
## Fog of War & View Modes

## 📦 Complete File List

You have received **6 complete TypeScript files**:

### Implementation Files
1. **FogOfWar.ts** (425 lines) → `src/rendering/FogOfWar.ts`
2. **ViewModeManager.ts** (355 lines) → `src/ui/ViewModeManager.ts`
3. **Game-Day8.ts** (490 lines) → `src/core/Game.ts` (replace existing)
4. **Renderer-Day8.ts** (320 lines) → `src/rendering/Renderer.ts` (replace existing)

### Configuration Files
5. **types-additions-day8.ts** (40 lines) → Add to `src/types/index.ts`
6. **game-config-additions-day8.ts** (30 lines) → Add to `src/config/game.config.ts`

---

## 🚀 Installation Steps

### Step 1: Backup Your Files (30 seconds)

```bash
# From your project root
cp src/core/Game.ts src/core/Game.ts.backup
cp src/rendering/Renderer.ts src/rendering/Renderer.ts.backup
```

### Step 2: Add Type Definitions (1 minute)

Open **`src/types/index.ts`** and add:

```typescript
// Add ViewMode enum
export enum ViewMode {
  AGENT_POV = 'agent_pov',
  GOD_MODE = 'god_mode',
  MIXED_MODE = 'mixed_mode',
  DEBUG_MODE = 'debug_mode',
  REPLAY_MODE = 'replay_mode',
}

// Update AgentConfig interface to include:
export interface AgentConfig {
  // ... existing properties ...
  
  // Vision settings (NEW in Day 8)
  visionRange: number;
  visionRangeNight: number;
  
  // ... rest of properties ...
}
```

### Step 3: Update Configuration (1 minute)

Open **`src/config/game.config.ts`** and update AGENT_CONFIG:

```typescript
export const AGENT_CONFIG: AgentConfig = {
  // ... existing properties ...
  
  // Vision settings (NEW in Day 8)
  visionRange: 2,              // Day vision: 2 tiles
  visionRangeNight: 1,         // Night vision: 1 tile
  
  // ... rest of properties ...
};
```

### Step 4: Create UI Directory (if needed)

```bash
mkdir -p src/ui
```

### Step 5: Copy Implementation Files (1 minute)

```bash
# Copy NEW files
cp FogOfWar.ts src/rendering/
cp ViewModeManager.ts src/ui/

# Replace existing files
cp Game-Day8.ts src/core/Game.ts
cp Renderer-Day8.ts src/rendering/Renderer.ts
```

### Step 6: Run the Game (30 seconds)

```bash
npm run dev
```

---

## ✅ Verification Checklist

After installation, verify these features work:

### Fog of War Tests
- [ ] Start game - most tiles hidden in black fog
- [ ] Move agent - tiles reveal as you explore
- [ ] Return to visited area - light gray fog (explored but not visible)
- [ ] Walls block line of sight correctly

### View Mode Tests
- [ ] Press **V** - mode indicator appears
- [ ] Agent POV (👁️) - see only what agent sees
- [ ] God Mode (🔮) - see entire maze
- [ ] Mixed Mode (🌓) - see all explored areas
- [ ] Debug Mode (🔧) - see everything with data

### Day/Night Vision Tests
- [ ] During day - can see 2 tiles away
- [ ] Press **T** to skip to night
- [ ] During night - can see only 1 tile away
- [ ] Vision automatically adjusts with time

### Performance Tests
- [ ] 60 FPS maintained
- [ ] Smooth fog updates
- [ ] No lag when exploring
- [ ] Camera follows agent smoothly

---

## 🎮 New Controls

| Key | Action |
|-----|--------|
| **V** | Cycle to next view mode |
| **B** | Cycle to previous view mode |

All existing Day 7 controls still work:
- **WASD / Arrows** - Move agent
- **T** - Skip to next time period
- **[** - Slow down time
- **]** - Speed up time
- **Space** - Pause/Resume
- **Mouse Wheel** - Zoom
- **Home** - Reset camera

---

## 🐛 Troubleshooting

### Problem: TypeScript errors about ViewMode
**Solution**: Make sure you added the ViewMode enum to `src/types/index.ts`

```typescript
export enum ViewMode {
  AGENT_POV = 'agent_pov',
  GOD_MODE = 'god_mode',
  MIXED_MODE = 'mixed_mode',
  DEBUG_MODE = 'debug_mode',
  REPLAY_MODE = 'replay_mode',
}
```

### Problem: TypeScript errors about visionRange
**Solution**: Update your AgentConfig interface:

```typescript
export interface AgentConfig {
  // ... existing ...
  visionRange: number;
  visionRangeNight: number;
}
```

And add to AGENT_CONFIG:
```typescript
visionRange: 2,
visionRangeNight: 1,
```

### Problem: No fog appears
**Solution**: 
1. Check that FogOfWar.ts is in `src/rendering/`
2. Clear browser cache (Ctrl+Shift+R)
3. Check browser console for errors

### Problem: View modes don't switch
**Solution**:
1. Verify ViewModeManager.ts is in `src/ui/`
2. Check that Game.ts has `initViewModes()` method
3. Look for errors in browser console

### Problem: "Cannot find module" errors
**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Problem: Can't see anything at night
**Solution**: This is correct behavior! Night vision is only 1 tile.
- Press **T** to skip to day time
- Or press **V** to cycle to God Mode for testing

### Problem: Performance drops
**Solution**: 
- Fog system creates one Graphics per tile
- For 30×30 maze = 900 graphics (normal)
- Should still maintain 50+ FPS
- Try reducing maze size in config if needed

---

## 📊 What Changed

### New Files (2)
- `src/rendering/FogOfWar.ts` - Visibility system (425 lines)
- `src/ui/ViewModeManager.ts` - View mode manager (355 lines)

### Updated Files (2)
- `src/core/Game.ts` - Added view mode integration (+30 lines)
- `src/rendering/Renderer.ts` - Added fog layer (+25 lines)

### Configuration Changes
- Added ViewMode enum to types
- Added visionRange and visionRangeNight to AgentConfig

### Total Code Added
- **Implementation**: ~835 lines
- **Configuration**: ~70 lines
- **Total**: ~905 lines

---

## 🎯 Success Criteria

Day 8 is complete when you can:

1. ✅ See black fog hiding unexplored tiles
2. ✅ Watch fog reveal as you move
3. ✅ See light gray fog on explored-but-not-visible tiles
4. ✅ Press V to cycle through all 4 view modes
5. ✅ See mode indicator appear and fade
6. ✅ Notice reduced vision at night (1 tile)
7. ✅ Notice normal vision during day (2 tiles)
8. ✅ See walls blocking line of sight
9. ✅ Maintain 60 FPS performance
10. ✅ Have no console errors

---

## 🔍 Console Testing Commands

After installation, you can test in the browser console:

```javascript
// Access fog of war system
const fog = game.getFogOfWar();

// Check exploration stats
fog.getExplorationPercentage();  // Returns %
fog.getExploredCount();          // Returns number
fog.getTotalTiles();             // Returns total

// Access view mode manager
const viewModes = game.getViewModeManager();

// Check current mode
viewModes.getMode();             // Returns ViewMode enum
viewModes.getModeName();         // Returns string

// Switch modes programmatically
viewModes.nextMode();            // Cycle forward
viewModes.previousMode();        // Cycle backward

// Debug info
fog.getDebugInfo();              // Returns formatted string
viewModes.getDebugInfo();        // Returns formatted string
```

---

## 📈 Performance Expectations

### Memory Usage
- FogOfWar: ~500 KB (for 30×30 maze)
- ViewModeManager: ~50 KB
- Total additional: ~550 KB

### CPU Usage
- Fog calculations: ~0.3-0.5ms per frame
- Line-of-sight checks: ~13 tiles per frame
- Total overhead: <1ms per frame

### Frame Rate
- **Target**: 60 FPS
- **Expected**: 58-60 FPS
- **Minimum acceptable**: 50 FPS

---

## 🔜 What's Next

After Day 8 is complete and working, Day 9 will add:

### UI Polish & Status Display
- Health/hunger/thirst status bars
- Mini-map showing exploration
- Debug panel with real-time stats
- Inventory display (for Week 2+)
- Resource indicators
- FPS counter overlay
- Controls help panel

**Coming Soon!** 🎨📊

---

## 📚 Additional Resources

### Code Examples
All files have comprehensive JSDoc comments explaining:
- What each method does
- What parameters mean
- What the method returns
- Usage examples

### Architecture
- **FogOfWar**: Manages tile visibility and exploration
- **ViewModeManager**: Handles UI and mode switching
- **Game**: Coordinates all systems
- **Renderer**: Adds fog layer to rendering pipeline

### Algorithms Used
- **Bresenham's Line Algorithm**: For line-of-sight calculations
- **Circular Range**: For vision distance
- **Set Operations**: For fast tile lookup

---

## ✨ Congratulations!

After completing Day 8, your game now has:
- ✅ Dynamic fog of war system
- ✅ 4 distinct view modes
- ✅ Exploration tracking
- ✅ Day/night vision changes
- ✅ Professional UI feedback
- ✅ Line-of-sight vision

**Your maze is now mysterious and explorable!** 🗺️🔦

---

**Installation Guide Version**: 1.0  
**Last Updated**: November 3, 2025  
**Maze Mind**: Week 1, Day 8  
**Difficulty**: Easy-Medium  
**Time Required**: 3-5 minutes

🚀 **Happy Coding!** Explore the fog!
