import { PerformanceGroup } from './DataGenerationModel';

/**
 * Types of player actions that can be tracked
 */
export type ActionType = 
  | 'hypothesis_selection' 
  | 'sector_selection' 
  | 'metric_selection' 
  | 'test_execution'
  | 'stock_purchase';

/**
 * Interface for a single player action
 */
export interface PlayerAction {
  timestamp: number;
  scenarioId: number;
  type: ActionType;
  details: {
    hypothesis?: string;
    sectors?: string[];
    metrics?: string[];
    testType?: 'T-Test' | 'Chi-Square';
    dataType?: 'numerical' | 'categorical' | 'mixed';
    purchasedSector?: string;
    quantity?: number;
    isCorrect: boolean;
    errorMessage?: string;
  };
}

/**
 * Interface for scenario performance data
 */
export interface ScenarioPerformance {
  scenarioIndex: number;
  scenarioDescription: string;
  startingValue: number;
  endingValue: number;
  profit: number;
  profitPercentage: number;
  actions: PlayerAction[];
  correctDecisions: number;
  incorrectDecisions: number;
  sectorPerformance: {
    sector: string;
    previousGroup: PerformanceGroup;
    currentGroup: PerformanceGroup;
    change: 'improved' | 'worsened' | 'stable';
  }[];
}

/**
 * Static class for tracking player actions
 */
export class ActionTracker {
  private static actions: PlayerAction[] = [];
  private static currentScenarioId: number = 0;
  
  /**
   * Set the current scenario ID
   */
  public static setCurrentScenario(scenarioId: number): void {
    this.currentScenarioId = scenarioId;
    console.log(`Set current scenario ID to ${scenarioId}`);
  }
  
  /**
   * Get the current scenario ID
   */
  public static getCurrentScenario(): number {
    return this.currentScenarioId;
  }
  
  /**
   * Checks if an action is a duplicate of an existing one
   */
  private static isDuplicateAction(type: ActionType, details: Partial<PlayerAction['details']>): boolean {
    // Only check against actions in the current scenario
    const currentScenarioActions = this.actions.filter(a => a.scenarioId === this.currentScenarioId);
    
    // For hypothesis, only allow one per scenario
    if (type === 'hypothesis_selection') {
      return currentScenarioActions.some(a => a.type === 'hypothesis_selection');
    }
    
    // For sector selection, check if the same sectors are already selected
    if (type === 'sector_selection' && details.sectors && details.sectors.length > 0) {
      // First sort to ensure consistent comparison
      const sortedDetailSectors = [...details.sectors].sort();
      
      return currentScenarioActions.some(a => {
        if (a.type !== 'sector_selection' || !a.details.sectors) return false;
        
        // Strict equality check for arrays with same length and sorted contents
        const sortedActionSectors = [...a.details.sectors].sort();
        return sortedActionSectors.length === sortedDetailSectors.length &&
               sortedActionSectors.every((sector, index) => sector === sortedDetailSectors[index]);
      });
    }
    
    // For metric selection with the same metric and data type
    if (type === 'metric_selection' && details.metrics && details.metrics.length > 0 && details.dataType) {
      // First sort to ensure consistent comparison
      const sortedDetailMetrics = [...details.metrics].sort();
      
      return currentScenarioActions.some(a => {
        if (a.type !== 'metric_selection' || !a.details.metrics || !a.details.dataType) return false;
        
        // Strict equality check for arrays with same length and sorted contents
        const sortedActionMetrics = [...a.details.metrics].sort();
        return a.details.dataType === details.dataType &&
               sortedActionMetrics.length === sortedDetailMetrics.length &&
               sortedActionMetrics.every((metric, index) => metric === sortedDetailMetrics[index]);
      });
    }
    
    // For test execution with the same test type
    if (type === 'test_execution' && details.testType) {
      return currentScenarioActions.some(a => 
        a.type === 'test_execution' && 
        a.details.testType === details.testType
      );
    }
    
    // For stock purchase, allow recording multiple purchases
    return false;
  }
  
  /**
   * Add a new action to the tracker
   */
  public static addAction(
    type: ActionType, 
    details: Omit<PlayerAction['details'], 'isCorrect'> & { isCorrect: boolean }
  ): void {
    // Skip if this is a duplicate action
    if (this.isDuplicateAction(type, details)) {
      console.log('Duplicate action skipped:', type, details);
      return;
    }
    
    const action: PlayerAction = {
      timestamp: Date.now(),
      scenarioId: this.currentScenarioId,  // Associate with current scenario
      type,
      details: {
        ...details,
        isCorrect: details.isCorrect
      }
    };
    
    this.actions.push(action);
    console.log(`Action tracked for scenario ${this.currentScenarioId}:`, action);
    // Zusätzliche Logs für jede Aktion
    switch(type) {
      case 'hypothesis_selection':
        console.log('Hypothesis selected:', details.hypothesis);
        break;
      case 'sector_selection':
        console.log('Sector(s) selected:', details.sectors);
        break;
      case 'metric_selection':
        console.log('Metric(s) selected:', details.metrics, 'Data type:', details.dataType);
        break;
      case 'test_execution':
        console.log('Test executed:', details.testType, 'Data type:', details.dataType);
        break;
      case 'stock_purchase':
        console.log('Stock purchased:', details.purchasedSector, 'Quantity:', details.quantity);
        break;
      default:
        console.log('Other action:', type, details);
    }
  }
  
  /**
   * Get all tracked actions
   */
  public static getActions(): PlayerAction[] {
    return [...this.actions];
  }
  
  /**
   * Get actions for the current scenario
   */
  public static getCurrentScenarioActions(): PlayerAction[] {
    return this.actions.filter(a => a.scenarioId === this.currentScenarioId);
  }
  
  /**
   * Clear all tracked actions
   */
  public static clearActions(): void {
    this.actions = [];
  }
  
  /**
   * Clear actions for a specific scenario
   */
  public static clearScenarioActions(scenarioId: number): void {
    this.actions = this.actions.filter(a => a.scenarioId !== scenarioId);
    console.log(`Cleared actions for scenario ${scenarioId}`);
  }
  
  /**
   * Get a summary of actions for the current scenario
   */
  public static getActionSummary(): { correct: number; incorrect: number } {
    const currentScenarioActions = this.actions.filter(a => a.scenarioId === this.currentScenarioId);
    const correct = currentScenarioActions.filter(a => a.details.isCorrect).length;
    const incorrect = currentScenarioActions.length - correct;
    
    return { correct, incorrect };
  }
  
  /**
   * Evaluate if a test type is appropriate for the given data type
   */
  public static isTestAppropriate(testType: 'T-Test' | 'Chi-Square', dataType: 'numerical' | 'categorical' | 'mixed'): boolean {
    if (dataType === 'mixed') return false; // Mixed data types are never appropriate for standard tests
    if (testType === 'T-Test' && dataType === 'numerical') return true;
    if (testType === 'Chi-Square' && dataType === 'categorical') return true;
    return false;
  }
  
  /**
   * Generate error message for inappropriate test
   */
  public static getTestErrorMessage(testType: 'T-Test' | 'Chi-Square', dataType: 'numerical' | 'categorical' | 'mixed'): string {
    if (dataType === 'mixed') {
      return 'You are comparing a numerical and a categorical variable. This is like comparing apples and oranges.';
    }
    if (testType === 'T-Test' && dataType === 'categorical') {
      return 'T-Test is inappropriate for categorical data. Use Chi-Square instead.';
    }
    if (testType === 'Chi-Square' && dataType === 'numerical') {
      return 'Chi-Square is inappropriate for numerical data. Use T-Test instead.';
    }
    return 'Test selection is inappropriate for this data type.';
  }
} 