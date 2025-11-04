// src/main.ts
/**
 * Maze Mind - Entry Point (Week 1, Day 8)
 *
 * Fog of War & View Modes
 */

import './styles/main.css';
import { Game } from './core/Game';
import { GAME_CONFIG } from './config/game.config';

console.log('🧩 Maze Mind - Week 1, Day 8: Fog of War & View Modes\n');

// Create game instance
const game = new Game(GAME_CONFIG);

// Initialize and start
async function start() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Starting Maze Mind...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await game.init();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Game Running!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    displayControls();
    setupUI();

  } catch (error) {
    console.error('❌ Failed to start game:', error);
    displayError(error);
  }
}

/**
 * Display keyboard controls
 */
function displayControls(): void {
  console.log('🎮 Controls:');
  console.log('   WASD / Arrow Keys: Move Arth (Manual mode)');
  console.log('   Mouse Wheel: Zoom in/out');
  console.log('   Home: Reset camera');
  console.log('   Space: Pause/Resume');
  console.log('   A: Toggle Autonomous/Manual mode');
  console.log('   L: Cycle LLM Provider (Heuristic/Ollama/Anthropic)');
  console.log('   I: Show debug info');
  console.log('   V / B: Cycle view modes');
  console.log('   T: Skip to next time period');
  console.log('   [ / ]: Slow down / Speed up time');
  console.log('   R: Regenerate maze');
  console.log('\n');
}

/**
 * Setup on-screen UI
 */
function setupUI(): void {
  const controlsDiv = document.createElement('div');
  controlsDiv.id = 'controls';
  controlsDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: #00ff00;
      padding: 15px;
      border: 2px solid #00ff00;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 1000;
      max-width: 320px;
    ">
      <h3 style="margin: 0 0 10px 0; color: #00ff00;">🧩 Maze Mind</h3>
      <div style="margin-bottom: 10px;">
        <strong>Week 1, Day 8</strong><br>
        Fog of War & View Modes
      </div>
      <div style="border-top: 1px solid #00ff00; padding-top: 10px; margin-top: 10px;">
        <strong>Controls:</strong><br>
        🎮 WASD / Arrows: Move<br>
        🖱️ Mouse Wheel: Zoom<br>
        🏠 Home: Reset Camera<br>
        ⏸️ Space: Pause<br>
        🤖 A: Autonomous Mode<br>
        🔄 L: Switch LLM<br>
        🔍 I: Debug Info<br>
        🧠 E: Embedding Metrics<br>
        📊 M: Memory Viz<br>
        🎯 H: Help/Controls<br>
        ⏰ T: Skip Time<br>
        ⏩ [ / ]: Time Speed<br>
        🔄 R: New Maze
      </div>
      <div id="mode-info" style="border-top: 1px solid #00ff00; padding-top: 10px; margin-top: 10px;">
        <strong>Mode:</strong><br>
        <span id="mode-display">🎮 Manual</span>
      </div>
      <div id="llm-info" style="border-top: 1px solid #00ff00; padding-top: 10px; margin-top: 10px;">
        <strong>LLM Provider:</strong><br>
        <span id="llm-provider-display">🧮 Heuristic</span><br>
        <small id="llm-model-display" style="color: #888888;">Pathfinding</small>
      </div>
      <div id="time-info" style="border-top: 1px solid #00ff00; padding-top: 10px; margin-top: 10px;">
        <strong>Time:</strong><br>
        <span id="time-display">6:00 AM</span><br>
        <span id="period-display">🌅 Dawn</span><br>
        Day: <span id="day-display">1</span><br>
        Speed: <span id="speed-display">10x</span>
      </div>
      <div id="agent-info" style="border-top: 1px solid #00ff00; padding-top: 10px; margin-top: 10px; font-size: 12px;">
        <strong>Agent:</strong><br>
        Position: <span id="agent-position">(0, 0)</span><br>
        Tile: <span id="agent-tile">(0, 0)</span><br>
        Status: <span id="agent-status">Idle</span>
      </div>
      <div id="view-mode-section" style="border-top: 1px solid #00ff00; padding-top: 10px; margin-top: 10px;">
        <strong>View:</strong><br>
        <span id="view-mode-display">👁️ Agent POV</span><br>
        <small style="color: #888888;">V/B to switch</small>
      </div>
      <div id="fps-counter" style="border-top: 1px solid #00ff00; padding-top: 10px; margin-top: 10px;">
        FPS: <span id="fps">60</span>
      </div>
    </div>
  `;

  document.body.appendChild(controlsDiv);

  // Update UI at 10 FPS (sufficient for time display)
  setInterval(() => {
    updateUI();
  }, 100);
}

/**
 * Update UI elements
 */
function updateUI(): void {
  // Update FPS
  const fpsElement = document.getElementById('fps');
  if (fpsElement) {
    fpsElement.textContent = game.getFPS().toString();
  }

  // Update time info (NEW in Day 7)
  const timeManager = game.getTimeManager();
  if (timeManager) {
    const timeDisplay = document.getElementById('time-display');
    const periodDisplay = document.getElementById('period-display');
    const dayDisplay = document.getElementById('day-display');
    const speedDisplay = document.getElementById('speed-display');

    if (timeDisplay) {
      timeDisplay.textContent = timeManager.getFormattedTime();
    }

    if (periodDisplay) {
      const period = timeManager.getPeriod();
      const periodEmojis = {
        dawn: '🌅 Dawn',
        day: '☀️ Day',
        dusk: '🌆 Dusk',
        night: '🌙 Night'
      };
      periodDisplay.textContent = periodEmojis[period] || period;

      // Color code based on time of day
      const periodColors = {
        dawn: '#ffaa88',
        day: '#ffffff',
        dusk: '#ff8844',
        night: '#4466aa'
      };
      periodDisplay.style.color = periodColors[period] || '#00ff00';
    }

    if (dayDisplay) {
      dayDisplay.textContent = (timeManager.getDayCount() + 1).toString();
    }

    if (speedDisplay) {
      const speed = timeManager.getTimeScale();
      speedDisplay.textContent = `${speed}x`;
    }
  }

  // Update agent info
  const agent = game.getAgent();
  if (agent) {
    const position = agent.getPosition();
    const tile = agent.getTilePosition();
    const status = agent.isMoving() ? 'Moving' : 'Idle';

    const posElement = document.getElementById('agent-position');
    if (posElement) {
      posElement.textContent = `(${position.x.toFixed(0)}, ${position.y.toFixed(0)})`;
    }

    const tileElement = document.getElementById('agent-tile');
    if (tileElement) {
      tileElement.textContent = `(${tile.x}, ${tile.y})`;
    }

    const statusElement = document.getElementById('agent-status');
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.color = status === 'Moving' ? '#00ff00' : '#888888';
    }
  }

  // Update view mode info (NEW in Day 8)
  const viewModeManager = game.getViewModeManager();
  if (viewModeManager) {
    const viewModeDisplay = document.getElementById('view-mode-display');
    if (viewModeDisplay) {
      const modeName = viewModeManager.getModeName();
      const mode = viewModeManager.getMode();

      // Map mode enums to icons
      const modeIcons: { [key: string]: string } = {
        'agent_pov': '👁️',
        'god_mode': '🔮',
        'mixed_mode': '🌓',
        'debug_mode': '🔧',
        'replay_mode': '🎬'
      };

      const icon = modeIcons[mode] || '👁️';
      viewModeDisplay.textContent = `${icon} ${modeName}`;

      // Color code based on mode
      const modeColors: { [key: string]: string } = {
        'agent_pov': '#00aaff',
        'god_mode': '#ffaa00',
        'mixed_mode': '#aa00ff',
        'debug_mode': '#00ff00',
        'replay_mode': '#ff0000'
      };

      viewModeDisplay.style.color = modeColors[mode] || '#00ff00';
    }
  }

  // Update autonomous mode info (NEW in Week 2)
  const modeDisplay = document.getElementById('mode-display');
  if (modeDisplay) {
    const isAutonomous = game.isAutonomous();
    if (isAutonomous) {
      modeDisplay.textContent = '🤖 Autonomous';
      modeDisplay.style.color = '#00ff00';
    } else {
      modeDisplay.textContent = '🎮 Manual';
      modeDisplay.style.color = '#888888';
    }
  }

  // Update LLM provider info (NEW in Week 2)
  const agentForLLM = game.getAgent();
  if (agentForLLM) {
    const llmService = agentForLLM.getLLMService();
    if (llmService) {
      const providerDisplay = document.getElementById('llm-provider-display');
      const modelDisplay = document.getElementById('llm-model-display');

      if (providerDisplay) {
        const provider = llmService.getCurrentProvider();
        const providerIcons: { [key: string]: string } = {
          'heuristic': '🧮',
          'ollama': '🦙',
          'anthropic': '🤖'
        };

        const providerNames: { [key: string]: string } = {
          'heuristic': 'Heuristic',
          'ollama': 'Ollama',
          'anthropic': 'Anthropic'
        };

        const icon = providerIcons[provider] || '🧮';
        const name = providerNames[provider] || provider;
        providerDisplay.textContent = `${icon} ${name}`;

        // Color code based on provider
        const providerColors: { [key: string]: string } = {
          'heuristic': '#888888',
          'ollama': '#00aaff',
          'anthropic': '#ff00ff'
        };

        providerDisplay.style.color = providerColors[provider] || '#00ff00';
      }

      if (modelDisplay) {
        const model = llmService.getCurrentModel();
        modelDisplay.textContent = model;
        modelDisplay.style.color = '#888888';
      }
    }
  }
}

/**
 * Display error message
 */
function displayError(error: any): void {
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: #ff0000;
      padding: 30px;
      border: 2px solid #ff0000;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      text-align: center;
      z-index: 2000;
    ">
      <h2>❌ Error</h2>
      <p>${error.message || 'Unknown error occurred'}</p>
      <p style="margin-top: 20px; font-size: 12px;">
        Check the console for more details.
      </p>
    </div>
  `;

  document.body.appendChild(errorDiv);
}

/**
 * Setup keyboard shortcuts
 */
window.addEventListener('keydown', (e: KeyboardEvent) => {
  // Regenerate maze with R key
  if (e.key === 'r' || e.key === 'R') {
    console.log('🔄 Regenerating maze...');
    game.regenerateMaze();
  }

  // Debug info with I key
  if (e.key === 'i' || e.key === 'I') {
    console.log('\n=== DEBUG INFO ===');

    const agent = game.getAgent();
    if (agent) {
      console.log('\nAgent:');
      console.log(agent.getDebugInfo());
    }

    const timeManager = game.getTimeManager();
    if (timeManager) {
      console.log('\nTime:');
      console.log(timeManager.getDebugInfo());
    }

    console.log('\n==================');
  }
});

/**
 * Handle window resize
 */
window.addEventListener('resize', () => {
  game.handleResize();
});

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  game.destroy();
});

// Start the game!
start();

// Export for console access
(window as any).game = game;
console.log('💡 Tip: Access game via console with: game');
console.log('💡 Tip: Access time manager: game.getTimeManager()');
console.log('💡 Tip: Press I for debug info');
console.log('💡 Tip: Press T to skip time periods');
