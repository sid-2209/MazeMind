import { Container, Graphics, Text } from 'pixi.js';
import { Agent } from '../agent/Agent';
import { DailyPlan, HourlyPlan, PlanStatus } from '../types/planning';

/**
 * PlanningPanel - UI visualization for the hierarchical planning system
 *
 * Displays:
 * - Current daily goal
 * - Current hourly objective
 * - Upcoming 5-minute actions
 * - Progress bar
 * - Status indicator
 */
export class PlanningPanel {
  private container: Container;
  private agent: Agent;
  private visible: boolean = false;

  // UI elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private dailyGoalText!: Text;
  private hourlyObjectiveText!: Text;
  private actionTexts: Text[] = [];
  private progressBar!: Graphics;
  private progressFill!: Graphics;
  private statusText!: Text;
  private statusIndicator!: Graphics;

  // Configuration
  private panelWidth = 320;
  private panelHeight = 280;
  private padding = 16;

  constructor(container: Container, agent: Agent) {
    this.container = new Container();
    this.agent = agent;
    container.addChild(this.container);
    this.container.visible = false;
  }

  async init(): Promise<void> {
    console.log('📋 Initializing Planning Panel...');
    this.createBackground();
    this.createTitle();
    this.createPlanDisplay();
    this.createProgressBar();
    this.createStatusIndicator();
    console.log('✅ Planning Panel initialized');
  }

  private createBackground(): void {
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x000000, 0.85);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panelBg.endFill();
    this.panelBg.lineStyle(2, 0x4CAF50, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.container.addChild(this.panelBg);
  }

  private createTitle(): void {
    this.titleText = new Text('PLANNING SYSTEM', {
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x4CAF50,
    });
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;
    this.container.addChild(this.titleText);
  }

  private createPlanDisplay(): void {
    // Daily goal label
    const dailyLabel = new Text('Daily Goal:', {
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0x888888,
    });
    dailyLabel.x = this.padding;
    dailyLabel.y = 40;
    this.container.addChild(dailyLabel);

    // Daily goal text
    this.dailyGoalText = new Text('--', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xffffff,
    });
    this.dailyGoalText.x = this.padding;
    this.dailyGoalText.y = 52;
    this.container.addChild(this.dailyGoalText);

    // Hourly objective label
    const hourlyLabel = new Text('Current Hour:', {
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0x888888,
    });
    hourlyLabel.x = this.padding;
    hourlyLabel.y = 80;
    this.container.addChild(hourlyLabel);

    // Hourly objective text
    this.hourlyObjectiveText = new Text('--', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xcccccc,
    });
    this.hourlyObjectiveText.x = this.padding;
    this.hourlyObjectiveText.y = 92;
    this.container.addChild(this.hourlyObjectiveText);

    // Actions label
    const actionsLabel = new Text('Upcoming Actions:', {
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0x888888,
    });
    actionsLabel.x = this.padding;
    actionsLabel.y = 120;
    this.container.addChild(actionsLabel);
  }

  private createProgressBar(): void {
    const y = this.panelHeight - 50;

    // Background
    this.progressBar = new Graphics();
    this.progressBar.beginFill(0x333333, 0.8);
    this.progressBar.drawRect(this.padding, y, this.panelWidth - this.padding * 2, 18);
    this.progressBar.endFill();
    this.container.addChild(this.progressBar);

    // Fill
    this.progressFill = new Graphics();
    this.container.addChild(this.progressFill);
  }

  private createStatusIndicator(): void {
    // Status text
    this.statusText = new Text('Status: Inactive', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0x888888,
    });
    this.statusText.x = this.padding;
    this.statusText.y = this.panelHeight - 25;
    this.container.addChild(this.statusText);

    // Status indicator dot
    this.statusIndicator = new Graphics();
    this.container.addChild(this.statusIndicator);
  }

  update(_deltaTime: number, gameTime: number): void {
    if (!this.visible) return;

    const plan = this.agent.getCurrentPlan();
    if (!plan) {
      this.showNoPlanMessage();
      return;
    }

    // Update displays
    this.dailyGoalText.text = this.wrapText(plan.goal, 35);

    const currentHourly = this.getCurrentHourlyPlan(plan, gameTime);
    if (currentHourly) {
      this.hourlyObjectiveText.text = this.wrapText(currentHourly.objective, 35);
      this.updateActionList(currentHourly, gameTime);
    }

    this.updateProgressBar(plan, gameTime);
    this.updateStatus(plan);
  }

  private updateActionList(hourlyPlan: HourlyPlan, gameTime: number): void {
    // Clear existing action texts
    this.actionTexts.forEach(t => t.destroy());
    this.actionTexts = [];

    const startY = 135;
    const lineHeight = 16;

    // Get current and upcoming actions
    const upcomingActions = hourlyPlan.actions
      .filter(a => a.startTime >= gameTime - 300) // Include current action (5 min back)
      .slice(0, 5);

    upcomingActions.forEach((action, i) => {
      const isCurrent = gameTime >= action.startTime && gameTime < action.startTime + action.duration;
      const prefix = isCurrent ? '▶' : '  ';
      const statusSymbol = action.status === PlanStatus.COMPLETED ? '✓' :
                          action.status === PlanStatus.IN_PROGRESS ? '•' : '○';

      const text = new Text(`${prefix} ${statusSymbol} ${this.truncate(action.action, 28)}`, {
        fontFamily: 'monospace',
        fontSize: 9,
        fill: isCurrent ? 0x4CAF50 :
              action.status === PlanStatus.COMPLETED ? 0x888888 :
              0xcccccc
      });
      text.x = this.padding;
      text.y = startY + i * lineHeight;
      this.container.addChild(text);
      this.actionTexts.push(text);
    });

    // If no upcoming actions, show message
    if (upcomingActions.length === 0) {
      const noActionsText = new Text('  No upcoming actions', {
        fontFamily: 'monospace',
        fontSize: 9,
        fill: 0x888888
      });
      noActionsText.x = this.padding;
      noActionsText.y = startY;
      this.container.addChild(noActionsText);
      this.actionTexts.push(noActionsText);
    }
  }

  private updateProgressBar(plan: DailyPlan, _gameTime: number): void {
    const totalActions = plan.hourlyPlans.reduce((sum, hp) => sum + hp.actions.length, 0);
    const completedActions = plan.hourlyPlans.reduce(
      (sum, hp) => sum + hp.actions.filter(a => a.status === PlanStatus.COMPLETED).length,
      0
    );

    const progress = totalActions > 0 ? completedActions / totalActions : 0;
    const y = this.panelHeight - 50;

    this.progressFill.clear();
    this.progressFill.beginFill(0x4CAF50, 0.8);
    this.progressFill.drawRect(
      this.padding + 2,
      y + 2,
      (this.panelWidth - this.padding * 2 - 4) * progress,
      14
    );
    this.progressFill.endFill();
  }

  private updateStatus(plan: DailyPlan): void {
    const statusMap: Record<PlanStatus, { text: string; color: number }> = {
      [PlanStatus.PENDING]: { text: 'Pending', color: 0xffa500 },
      [PlanStatus.IN_PROGRESS]: { text: 'Active', color: 0x4CAF50 },
      [PlanStatus.COMPLETED]: { text: 'Completed', color: 0x00ff00 },
      [PlanStatus.ABANDONED]: { text: 'Abandoned', color: 0xff6666 },
      [PlanStatus.FAILED]: { text: 'Failed', color: 0xff0000 }
    };

    const status = statusMap[plan.status] || statusMap[PlanStatus.PENDING];
    this.statusText.text = `Status: ${status.text}`;
    this.statusText.style.fill = status.color;

    // Update status indicator dot
    this.statusIndicator.clear();
    this.statusIndicator.beginFill(status.color, 0.9);
    this.statusIndicator.drawCircle(this.padding - 8, this.panelHeight - 19, 4);
    this.statusIndicator.endFill();
  }

  private showNoPlanMessage(): void {
    this.dailyGoalText.text = 'No active plan';
    this.hourlyObjectiveText.text = '--';

    // Clear action texts
    this.actionTexts.forEach(t => t.destroy());
    this.actionTexts = [];

    this.statusText.text = 'Status: Inactive';
    this.statusText.style.fill = 0x888888;

    this.statusIndicator.clear();
    this.statusIndicator.beginFill(0x888888, 0.5);
    this.statusIndicator.drawCircle(this.padding - 8, this.panelHeight - 19, 4);
    this.statusIndicator.endFill();

    // Clear progress bar
    this.progressFill.clear();
  }

  private getCurrentHourlyPlan(plan: DailyPlan, gameTime: number): HourlyPlan | null {
    for (const hp of plan.hourlyPlans) {
      if (gameTime >= hp.startTime && gameTime < hp.startTime + hp.duration) {
        return hp;
      }
    }
    return null;
  }

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private wrapText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxLength) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);

    // Return first 2 lines only
    return lines.slice(0, 2).join('\n');
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`📋 Planning Panel: ${this.visible ? 'visible' : 'hidden'}`);
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getHeight(): number {
    return this.panelHeight;
  }

  getWidth(): number {
    return this.panelWidth;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
