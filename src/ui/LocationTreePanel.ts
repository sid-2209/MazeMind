// src/ui/LocationTreePanel.ts
/**
 * LocationTreePanel - Visualize hierarchical world structure (Week 9)
 *
 * Displays the location tree with:
 * - Collapsible hierarchy (World → Areas → Rooms → Objects)
 * - Agent's current location highlighted
 * - Available actions at current location
 * - Object states and capabilities
 * - Click to see location details
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { WorldHierarchy } from '../systems/WorldHierarchy';
import type { Agent } from '../agent/Agent';
import {
  WorldNode,
  GameObject,
  LocationType,
  ObjectCapability
} from '../types/environment';

interface TreeNodeUI {
  node: WorldNode | GameObject;
  depth: number;
  yPosition: number;
  collapsed: boolean;
  container: Container;
}

export class LocationTreePanel {
  private container: Container;
  private worldHierarchy: WorldHierarchy | null = null;
  private agent: Agent | null = null;

  // Panel dimensions
  private readonly width = 400;
  private readonly height = 600;

  // Visual elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private contentContainer!: Container;
  private scrollContainer!: Container;

  // Scroll state
  private scrollY: number = 0;
  private maxScrollY: number = 0;

  // Refresh rate
  private updateTimer: number = 0;
  private readonly updateInterval: number = 2; // Update every 2 seconds

  // Collapsed state tracking
  private collapsedNodes: Set<string> = new Set();

  constructor(container: Container) {
    this.container = new Container();
    container.addChild(this.container);
    this.createPanel();
    this.updateDisplay();
  }

  /**
   * Create panel UI elements
   */
  private createPanel(): void {
    // Background
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x0a0a0a, 0.95);
    this.panelBg.drawRoundedRect(0, 0, this.width, this.height, 8);
    this.panelBg.endFill();
    this.panelBg.lineStyle(2, 0x00ff00, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.width, this.height, 8);
    this.container.addChild(this.panelBg);

    // Title
    this.titleText = new Text('LOCATION TREE (Week 9)', {
      fontFamily: 'Courier New, monospace',
      fontSize: 14,
      fill: 0x00ff00,
      fontWeight: 'bold',
    });
    this.titleText.x = 10;
    this.titleText.y = 10;
    this.container.addChild(this.titleText);

    // Scroll container for content
    this.scrollContainer = new Container();
    this.scrollContainer.x = 10;
    this.scrollContainer.y = 40;
    this.container.addChild(this.scrollContainer);

    // Content container (scrollable)
    this.contentContainer = new Container();
    this.scrollContainer.addChild(this.contentContainer);

    // Create mask for scrolling
    const mask = new Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(0, 40, this.width - 20, this.height - 50);
    mask.endFill();
    this.scrollContainer.mask = mask;
    this.container.addChild(mask);

    // Initial position (offset from left to avoid control panel sidebar)
    this.container.x = 360; // Positioned to the right of the control sidebar (320px + 40px gap)
    this.container.y = 20;

    // Start hidden
    this.container.visible = false;
  }

  /**
   * Set world hierarchy reference
   */
  setWorldHierarchy(hierarchy: WorldHierarchy | null): void {
    this.worldHierarchy = hierarchy;
    this.updateDisplay();
  }

  /**
   * Set agent reference
   */
  setAgent(agent: Agent | null): void {
    this.agent = agent;
    this.updateDisplay();
  }

  /**
   * Update display (called periodically)
   */
  update(deltaTime: number): void {
    this.updateTimer += deltaTime;

    if (this.updateTimer >= this.updateInterval) {
      this.updateTimer = 0;
      this.updateDisplay();
    }
  }

  /**
   * Update all visual elements
   */
  private updateDisplay(): void {
    // Clear previous content
    this.contentContainer.removeChildren();

    if (!this.worldHierarchy) {
      this.showNoDataMessage();
      return;
    }

    const stats = this.worldHierarchy.getStatistics();
    const tree = this.worldHierarchy.getWorldTree();
    const agentPos = this.agent?.getTilePosition();

    let yOffset = 0;

    // Show statistics header
    yOffset = this.renderStatsHeader(stats, yOffset);
    yOffset += 15;

    // Render world tree
    const worldNode = tree.find(n => n.type === LocationType.WORLD);
    if (worldNode) {
      yOffset = this.renderTreeNode(worldNode, 0, yOffset, agentPos);
    }

    this.maxScrollY = Math.max(0, yOffset - (this.height - 50));
  }

  /**
   * Render statistics header
   */
  private renderStatsHeader(stats: any, yOffset: number): number {
    const headerText = new Text(
      `${stats.totalAreas} Areas | ${stats.totalRooms} Rooms | ${stats.totalObjects} Objects`,
      {
        fontFamily: 'Courier New, monospace',
        fontSize: 10,
        fill: 0x888888,
      }
    );
    headerText.y = yOffset;
    this.contentContainer.addChild(headerText);

    return yOffset + 15;
  }

  /**
   * Render a tree node (recursive)
   */
  private renderTreeNode(
    node: WorldNode,
    depth: number,
    yOffset: number,
    agentPos?: { x: number; y: number }
  ): number {
    const indentWidth = 20;
    const xOffset = depth * indentWidth;

    // Check if this is the agent's current location
    const isCurrentLocation = agentPos && node.position &&
      node.position.x === agentPos.x && node.position.y === agentPos.y;

    // Determine if node is collapsed
    const isCollapsed = this.collapsedNodes.has(node.id);

    // Draw node line
    const nodeContainer = new Container();
    nodeContainer.x = xOffset;
    nodeContainer.y = yOffset;

    // Collapse/expand indicator (if has children)
    if (node.children.length > 0) {
      const indicator = new Text(isCollapsed ? '▶' : '▼', {
        fontFamily: 'Courier New, monospace',
        fontSize: 10,
        fill: 0x00ff00,
      });
      indicator.x = 0;
      indicator.y = 0;
      nodeContainer.addChild(indicator);

      // Make clickable
      indicator.eventMode = 'static' as any;
      indicator.cursor = 'pointer';
      indicator.on('pointerdown', () => {
        this.toggleNodeCollapse(node.id);
      });
    }

    // Node icon
    const icon = this.getNodeIcon(node.type);
    const iconText = new Text(icon, {
      fontFamily: 'Courier New, monospace',
      fontSize: 10,
      fill: this.getNodeColor(node.type),
    });
    iconText.x = node.children.length > 0 ? 15 : 0;
    iconText.y = 0;
    nodeContainer.addChild(iconText);

    // Node name
    const nameText = new Text(node.name, {
      fontFamily: 'Courier New, monospace',
      fontSize: 10,
      fill: isCurrentLocation ? 0xffff00 : 0xcccccc,
      fontWeight: isCurrentLocation ? 'bold' : 'normal',
    });
    nameText.x = (node.children.length > 0 ? 15 : 0) + 20;
    nameText.y = 0;
    nodeContainer.addChild(nameText);

    // Current location indicator
    if (isCurrentLocation) {
      const locationMarker = new Text('← YOU ARE HERE', {
        fontFamily: 'Courier New, monospace',
        fontSize: 9,
        fill: 0xffff00,
        fontStyle: 'italic',
      });
      locationMarker.x = nameText.x + nameText.width + 10;
      locationMarker.y = 0;
      nodeContainer.addChild(locationMarker);
    }

    this.contentContainer.addChild(nodeContainer);
    yOffset += 18;

    // Render children if not collapsed
    if (!isCollapsed && node.children.length > 0) {
      for (const childId of node.children) {
        const childNode = this.worldHierarchy!.getNode(childId);
        if (childNode) {
          yOffset = this.renderTreeNode(childNode, depth + 1, yOffset, agentPos);
        } else {
          // It's an object, not a node
          const childObj = this.worldHierarchy!.getObject(childId);
          if (childObj) {
            yOffset = this.renderObjectNode(childObj, depth + 1, yOffset);
          }
        }
      }
    }

    return yOffset;
  }

  /**
   * Render an object node
   */
  private renderObjectNode(obj: GameObject, depth: number, yOffset: number): number {
    const indentWidth = 20;
    const xOffset = depth * indentWidth;

    const objContainer = new Container();
    objContainer.x = xOffset;
    objContainer.y = yOffset;

    // Object icon (from visualIcon or default)
    const icon = obj.visualIcon || '📦';
    const iconText = new Text(icon, {
      fontFamily: 'Courier New, monospace',
      fontSize: 10,
      fill: 0xaaaaaa,
    });
    iconText.x = 0;
    iconText.y = 0;
    objContainer.addChild(iconText);

    // Object name
    const nameText = new Text(obj.name, {
      fontFamily: 'Courier New, monospace',
      fontSize: 9,
      fill: 0xaaaaaa,
    });
    nameText.x = 20;
    nameText.y = 1;
    objContainer.addChild(nameText);

    // Show capabilities
    if (obj.capabilities.length > 0) {
      const capText = new Text(`[${obj.capabilities.slice(0, 2).join(', ')}]`, {
        fontFamily: 'Courier New, monospace',
        fontSize: 8,
        fill: 0x666666,
        fontStyle: 'italic',
      });
      capText.x = nameText.x + nameText.width + 5;
      capText.y = 2;
      objContainer.addChild(capText);
    }

    this.contentContainer.addChild(objContainer);
    return yOffset + 16;
  }

  /**
   * Get icon for node type
   */
  private getNodeIcon(type: LocationType): string {
    switch (type) {
      case LocationType.WORLD:
        return '🌍';
      case LocationType.AREA:
        return '📍';
      case LocationType.ROOM:
        return '🚪';
      case LocationType.CORRIDOR:
        return '↔️';
      default:
        return '•';
    }
  }

  /**
   * Get color for node type
   */
  private getNodeColor(type: LocationType): number {
    switch (type) {
      case LocationType.WORLD:
        return 0x00ff00;
      case LocationType.AREA:
        return 0x00aaff;
      case LocationType.ROOM:
        return 0xffaa00;
      case LocationType.CORRIDOR:
        return 0xaaaaaa;
      default:
        return 0xcccccc;
    }
  }

  /**
   * Toggle node collapse state
   */
  private toggleNodeCollapse(nodeId: string): void {
    if (this.collapsedNodes.has(nodeId)) {
      this.collapsedNodes.delete(nodeId);
    } else {
      this.collapsedNodes.add(nodeId);
    }
    this.updateDisplay();
  }

  /**
   * Show "no data" message
   */
  private showNoDataMessage(): void {
    const message = new Text('World hierarchy not initialized...', {
      fontFamily: 'Courier New, monospace',
      fontSize: 10,
      fill: 0x666666,
    });
    message.x = 0;
    message.y = 0;
    this.contentContainer.addChild(message);
  }

  /**
   * Handle scroll
   */
  scroll(delta: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + delta));
    this.contentContainer.y = -this.scrollY;
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.container.visible = !this.container.visible;
    console.log(`🗺️ LocationTreePanel toggled: ${this.container.visible ? 'VISIBLE' : 'HIDDEN'}`);
  }

  /**
   * Check if visible
   */
  isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Get panel dimensions
   */
  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
