// src/agent/AgentRenderer.ts
/**
 * AgentRenderer - Visual representation of the agent
 * 
 * Manages:
 * - Sprite creation and positioning
 * - Animation system (idle, walk)
 * - Direction indicator
 * - Visual effects
 * 
 * Week 1, Day 5-6: Simple sprite with basic animations
 * Week 1, Day 7+: Sprite sheet with detailed art
 */

import { Container, Graphics, Text } from 'pixi.js';
import { Agent } from './Agent';
import { VisualConfig, AnimationState, Direction } from '../types';
import { CONSTANTS } from '../config/game.config';

export class AgentRenderer {
  private container: Container;
  private agent: Agent;

  // Sprite components
  private sprite!: Container;
  private bodyGraphics!: Graphics;
  private directionIndicator!: Graphics;
  private shadowGraphics!: Graphics;
  private nameText!: Text; // Week 6: Name label

  // Animation state
  private animationState: AnimationState = AnimationState.IDLE;
  private animationTime: number = 0;

  // Configuration
  private readonly SPRITE_SIZE: number;
  private readonly SPRITE_COLOR: number; // Week 6: Can be customized per agent
  private readonly ANIMATION_SPEED = {
    idle: 1.0,    // 1 second per cycle
    walk: 2.0,    // 2 cycles per second (faster)
  };

  constructor(container: Container, agent: Agent, config: VisualConfig, color?: number) {
    this.container = container;
    this.agent = agent;

    this.SPRITE_SIZE = config.tileSize * 0.8;
    this.SPRITE_COLOR = color !== undefined ? color : CONSTANTS.COLORS.agent; // Week 6: Use custom color if provided

    console.log(`🎨 AgentRenderer created for ${agent.getName()} with color ${this.SPRITE_COLOR.toString(16)}`);
  }
  
  /**
   * Initialize renderer and create sprite
   */
  async init(): Promise<void> {
    console.log('🎨 Initializing agent renderer...');

    // Create sprite container
    this.sprite = new Container();

    // Create sprite components
    this.createShadow();
    this.createBody();
    this.createDirectionIndicator();
    this.createNameLabel(); // Week 6: Add name label

    // Add sprite to world container
    this.container.addChild(this.sprite);

    // Set initial position
    this.updatePosition();

    console.log('   Agent sprite created');
  }
  
  /**
   * Create shadow under agent
   */
  private createShadow(): void {
    const radius = this.SPRITE_SIZE / 2;

    this.shadowGraphics = new Graphics();

    // Draw ellipse shadow (PixiJS v7 API)
    this.shadowGraphics.beginFill(0x000000, 0.3);
    this.shadowGraphics.drawEllipse(0, radius * 0.3, radius * 0.8, radius * 0.4);
    this.shadowGraphics.endFill();

    this.sprite.addChild(this.shadowGraphics);
  }
  
  /**
   * Create agent body (simple circle for Week 1)
   */
  private createBody(): void {
    const radius = this.SPRITE_SIZE / 2;

    this.bodyGraphics = new Graphics();

    // Draw main body circle (PixiJS v7 API)
    this.bodyGraphics.beginFill(this.SPRITE_COLOR);
    this.bodyGraphics.drawCircle(0, 0, radius);
    this.bodyGraphics.endFill();

    // Draw border/outline
    this.bodyGraphics.lineStyle(2, 0xffffff, 0.6);
    this.bodyGraphics.drawCircle(0, 0, radius);

    // Add highlight (gives 3D effect)
    const highlightRadius = radius * 0.4;
    this.bodyGraphics.beginFill(0xffffff, 0.3);
    this.bodyGraphics.drawCircle(-radius * 0.2, -radius * 0.2, highlightRadius);
    this.bodyGraphics.endFill();

    this.sprite.addChild(this.bodyGraphics);
  }
  
  /**
   * Create direction indicator (shows which way agent is facing)
   */
  private createDirectionIndicator(): void {
    const radius = this.SPRITE_SIZE / 2;

    this.directionIndicator = new Graphics();

    // Draw arrow/line pointing up (will rotate based on direction) - PixiJS v7 API
    const arrowLength = radius * 0.8;
    const arrowWidth = 4;

    // Main line
    this.directionIndicator.lineStyle(arrowWidth, 0xffffff, 0.9);
    this.directionIndicator.moveTo(0, 0);
    this.directionIndicator.lineTo(0, -arrowLength);

    // Arrow head
    const arrowHeadSize = 6;
    this.directionIndicator.moveTo(-arrowHeadSize, -arrowLength + arrowHeadSize);
    this.directionIndicator.lineTo(0, -arrowLength);
    this.directionIndicator.lineTo(arrowHeadSize, -arrowLength + arrowHeadSize);

    this.sprite.addChild(this.directionIndicator);
  }

  /**
   * Create name label above agent (Week 6)
   */
  private createNameLabel(): void {
    const radius = this.SPRITE_SIZE / 2;

    this.nameText = new Text(this.agent.getName(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
      fontWeight: 'bold',
    });

    this.nameText.anchor.set(0.5, 0.5);
    this.nameText.y = -radius - 18; // Position above agent

    this.sprite.addChild(this.nameText);
  }

  /**
   * Update every frame
   */
  update(deltaTime: number): void {
    // Update position from agent
    this.updatePosition();
    
    // Update direction indicator rotation
    this.updateDirection();
    
    // Update animation
    this.updateAnimation(deltaTime);
  }
  
  /**
   * Update sprite position from agent
   */
  private updatePosition(): void {
    const pos = this.agent.getPosition();
    this.sprite.x = pos.x;
    this.sprite.y = pos.y;
  }
  
  /**
   * Update direction indicator rotation based on agent facing
   */
  private updateDirection(): void {
    const facing = this.agent.getFacing();
    
    // Rotate direction indicator to match facing direction
    switch (facing) {
      case Direction.UP:
        this.directionIndicator.rotation = 0;
        break;
      case Direction.RIGHT:
        this.directionIndicator.rotation = Math.PI / 2;
        break;
      case Direction.DOWN:
        this.directionIndicator.rotation = Math.PI;
        break;
      case Direction.LEFT:
        this.directionIndicator.rotation = -Math.PI / 2;
        break;
    }
  }
  
  /**
   * Update animation based on agent state
   */
  private updateAnimation(deltaTime: number): void {
    // Update animation timer
    this.animationTime += deltaTime;
    
    // Determine current animation state
    const newState = this.agent.isMoving() 
      ? AnimationState.WALK 
      : AnimationState.IDLE;
    
    // Reset timer if state changed
    if (newState !== this.animationState) {
      this.animationState = newState;
      this.animationTime = 0;
    }
    
    // Play appropriate animation
    switch (this.animationState) {
      case AnimationState.IDLE:
        this.animateIdle();
        break;
      case AnimationState.WALK:
        this.animateWalk();
        break;
      default:
        break;
    }
  }
  
  /**
   * Idle animation - gentle breathing/pulsing effect
   */
  private animateIdle(): void {
    const frequency = this.ANIMATION_SPEED.idle;
    const time = this.animationTime * Math.PI * 2 * frequency;
    
    // Gentle pulse (scale between 0.98 and 1.02)
    const pulse = Math.sin(time) * 0.02;
    const scale = 1 + pulse;
    
    // Apply to body only (not direction indicator)
    this.bodyGraphics.scale.set(scale);
    
    // Very subtle rotation sway
    const sway = Math.sin(time * 0.5) * 0.02; // ±1 degree
    this.bodyGraphics.rotation = sway;
  }
  
  /**
   * Walk animation - bob up and down
   */
  private animateWalk(): void {
    const frequency = this.ANIMATION_SPEED.walk;
    const time = this.animationTime * Math.PI * 2 * frequency;
    
    // Bob up and down (vertical oscillation)
    const bobAmplitude = 3; // pixels
    const bob = Math.sin(time) * bobAmplitude;
    
    // Reset body scale and rotation
    this.bodyGraphics.scale.set(1);
    this.bodyGraphics.rotation = 0;
    
    // Apply bob to entire sprite (not just body)
    this.sprite.pivot.y = bob;
    
    // Slight squash and stretch effect
    const squash = 1 + Math.cos(time) * 0.05;
    const stretch = 1 - Math.cos(time) * 0.05;
    this.bodyGraphics.scale.set(squash, stretch);
    
    // Shadow pulsing (compress when foot hits ground)
    const shadowScale = 1 + Math.abs(Math.sin(time)) * 0.2;
    this.shadowGraphics.scale.set(shadowScale, 1);
  }
  
  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.sprite.visible = visible;
  }
  
  /**
   * Get sprite container (for debugging)
   */
  getSprite(): Container {
    return this.sprite;
  }
  
  /**
   * Play specific animation (future: for triggered animations)
   */
  playAnimation(state: AnimationState): void {
    if (state !== this.animationState) {
      this.animationState = state;
      this.animationTime = 0;
    }
  }
  
  /**
   * Cleanup and destroy
   */
  destroy(): void {
    console.log('🎨 Destroying agent renderer...');
    
    // Destroy graphics
    this.shadowGraphics?.destroy();
    this.bodyGraphics?.destroy();
    this.directionIndicator?.destroy();
    
    // Destroy container
    this.sprite?.destroy({ children: true });
  }
  
  // ============================================
  // Future: Sprite Sheet Support (Week 1, Day 7+)
  // ============================================
  
  /**
   * Load sprite sheet (Week 1, Day 7+)
   * Will replace simple graphics with detailed sprite art
   */
  async loadSpriteSheet(spriteSheetPath: string): Promise<void> {
    console.log('📦 Loading sprite sheet:', spriteSheetPath);
    // TODO: Implement sprite sheet loading
    // Will use PixiJS AnimatedSprite
  }
  
  /**
   * Set sprite direction for sprite sheet (Week 1, Day 7+)
   */
  setSpriteDirection(_direction: Direction): void {
    // TODO: Switch sprite sheet frames based on direction
    // Will show character facing the correct way
  }
}
