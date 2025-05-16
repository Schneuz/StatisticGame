import { PerformanceGroup } from './DataGenerationModel';
import { log } from '../utils/logging';

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
    log(`Set current scenario ID to ${scenarioId}`);
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
    
    switch (type) {
      case 'hypothesis_selection':
        return this.isDuplicateHypothesis(currentScenarioActions);
      case 'sector_selection':
        return this.isDuplicateSectorSelection(currentScenarioActions, details);
      case 'metric_selection':
        return this.isDuplicateMetricSelection(currentScenarioActions, details);
      case 'test_execution':
        return this.isDuplicateTestExecution(currentScenarioActions, details);
      case 'stock_purchase':
        // Für Käufe erlauben wir mehrere Aktionen
        return false;
      default:
        return false;
    }
  }
  
  /**
   * Prüft, ob bereits eine Hypothese für das aktuelle Szenario existiert
   */
  private static isDuplicateHypothesis(actions: PlayerAction[]): boolean {
    return actions.some(a => a.type === 'hypothesis_selection');
  }
  
  /**
   * Prüft, ob die gleiche Sektorauswahl bereits existiert
   */
  private static isDuplicateSectorSelection(
    actions: PlayerAction[],
    details: Partial<PlayerAction['details']>
  ): boolean {
    if (!details.sectors || details.sectors.length === 0) return false;
    
    // First sort to ensure consistent comparison
    const sortedDetailSectors = [...details.sectors].sort();
    
    return actions.some(a => {
      if (a.type !== 'sector_selection' || !a.details.sectors) return false;
      
      // Strict equality check for arrays with same length and sorted contents
      const sortedActionSectors = [...a.details.sectors].sort();
      return sortedActionSectors.length === sortedDetailSectors.length &&
              sortedActionSectors.every((sector, index) => sector === sortedDetailSectors[index]);
    });
  }
  
  /**
   * Prüft, ob die gleiche Metrikauswahl bereits existiert
   */
  private static isDuplicateMetricSelection(
    actions: PlayerAction[],
    details: Partial<PlayerAction['details']>
  ): boolean {
    if (!details.metrics || details.metrics.length === 0 || !details.dataType) return false;
    
    // First sort to ensure consistent comparison
    const sortedDetailMetrics = [...details.metrics].sort();
    
    return actions.some(a => {
      if (a.type !== 'metric_selection' || !a.details.metrics || !a.details.dataType) return false;
      
      // Strict equality check for arrays with same length and sorted contents
      const sortedActionMetrics = [...a.details.metrics].sort();
      return a.details.dataType === details.dataType &&
              sortedActionMetrics.length === sortedDetailMetrics.length &&
              sortedActionMetrics.every((metric, index) => metric === sortedDetailMetrics[index]);
    });
  }
  
  /**
   * Prüft, ob der gleiche Test bereits ausgeführt wurde
   */
  private static isDuplicateTestExecution(
    actions: PlayerAction[],
    details: Partial<PlayerAction['details']>
  ): boolean {
    if (!details.testType) return false;
    
    return actions.some(a => 
      a.type === 'test_execution' && 
      a.details.testType === details.testType
    );
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
      log('Duplicate action skipped:', type, details);
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
    log(`Action tracked for scenario ${this.currentScenarioId}:`, action);
    
    // Minimales Logging für jede Aktion
    switch(type) {
      case 'hypothesis_selection':
        log('Hypothesis selected:', details.hypothesis);
        break;
      case 'sector_selection':
        log('Sector(s) selected:', details.sectors);
        break;
      case 'metric_selection':
        log('Metric(s) selected:', details.metrics, 'Data type:', details.dataType);
        break;
      case 'test_execution':
        log('Test executed:', details.testType, 'Data type:', details.dataType);
        break;
      case 'stock_purchase':
        log('Stock purchased:', details.purchasedSector, 'Quantity:', details.quantity);
        break;
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
    log(`Cleared actions for scenario ${scenarioId}`);
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