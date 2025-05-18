import { marketSituations } from '../contexts/GameContext';

/**
 * Types of metrics
 */
export enum MetricType {
  NUMERICAL = 'numerical',
  CATEGORICAL = 'categorical',
  MIXED = 'mixed'
}

/**
 * Result of metric validation
 */
export interface MetricValidationResult {
  isValid: boolean;
  errorMessage?: string;
  metricType: MetricType;
}

/**
 * List of numerical metrics
 */
export const NUMERICAL_METRICS = [
  'Mean Return', 
  'Median Return', 
  'Mean Gain', 
  'Mean Loss'
];

/**
 * List of categorical metrics
 */
export const CATEGORICAL_METRICS = [
  'Positive Return Days', 
  'Negative Return Days', 
  'High Volatility Days'
];

/**
 * Determines the type of a metric
 */
export function getMetricType(metricName: string): MetricType {
  if (NUMERICAL_METRICS.includes(metricName)) {
    return MetricType.NUMERICAL;
  } else if (CATEGORICAL_METRICS.includes(metricName)) {
    return MetricType.CATEGORICAL;
  }
  return MetricType.MIXED; // Fallback
}

/**
 * Checks if all metrics are of the same type
 */
export function areAllSameType(metrics: string[]): boolean {
  if (metrics.length <= 1) return true;
  
  const firstType = getMetricType(metrics[0]);
  return metrics.every(metric => getMetricType(metric) === firstType);
}

/**
 * Validates the selected metrics
 * @param metrics - List of selected metrics
 * @returns ValidationResult with information about validity
 */
export function validateMetrics(metrics: string[]): MetricValidationResult {
  // If no metrics were selected
  if (!metrics || metrics.length === 0) {
    return {
      isValid: false,
      errorMessage: "No metrics selected.",
      metricType: MetricType.MIXED
    };
  }
  
  // If only one metric was selected
  if (metrics.length === 1) {
    return {
      isValid: true,
      metricType: getMetricType(metrics[0])
    };
  }
  
  // If two identical metrics were selected
  if (metrics.length === 2 && metrics[0] === metrics[1]) {
    return {
      isValid: true,
      metricType: getMetricType(metrics[0])
    };
  }
  
  // If two different metrics were selected
  if (metrics.length === 2) {
    const typeA = getMetricType(metrics[0]);
    const typeB = getMetricType(metrics[1]);
    
    // Both numerical, but different
    if (typeA === MetricType.NUMERICAL && typeB === MetricType.NUMERICAL) {
      return {
        isValid: false,
        errorMessage: "Use the same metrics for comparison.",
        metricType: MetricType.NUMERICAL
      };
    }
    
    // Both categorical, but different
    if (typeA === MetricType.CATEGORICAL && typeB === MetricType.CATEGORICAL) {
      return {
        isValid: false,
        errorMessage: "Use the same metrics for comparison.",
        metricType: MetricType.CATEGORICAL
      };
    }
    
    // Mixed types (numerical + categorical)
    return {
      isValid: false,
      errorMessage: "Use the same metrics, and don't mix up categorical and numerical metrics.",
      metricType: MetricType.MIXED
    };
  }
  
  // More than two metrics (should not occur)
  return {
    isValid: false,
    errorMessage: "Too many metrics selected. Please select only one or two metrics.",
    metricType: MetricType.MIXED
  };
}

/**
 * Validates if the selected test type is appropriate for the metric types
 */
export function validateTestForMetrics(
  testType: string,
  metricType: MetricType
): MetricValidationResult {
  const lowerTestType = testType.toLowerCase();
  
  // Numerical metrics should use t-test
  if (metricType === MetricType.NUMERICAL && lowerTestType !== 't-test') {
    return {
      isValid: false,
      errorMessage: "You chose numerical data, use T-Test.",
      metricType
    };
  }
  
  // Categorical metrics should use chi-square
  if (metricType === MetricType.CATEGORICAL && lowerTestType !== 'chi-square') {
    return {
      isValid: false,
      errorMessage: "You chose categorical data, use Chi-Square test.",
      metricType
    };
  }
  
  // Mixed metrics should not be used with any test
  if (metricType === MetricType.MIXED) {
    return {
      isValid: false,
      errorMessage: "Use the same metrics, and don't mix up categorical and numerical metrics.",
      metricType
    };
  }
  
  // Valid test type for metric type
  return {
    isValid: true,
    metricType
  };
}

/**
 * Validates if the selected metrics match the metric of the current hypothesis
 * @param selectedMetrics - Array of metrics selected by the player
 * @param scenarioIndex - Index of the current scenario
 * @param hypothesisIndex - Index of the current hypothesis (optional)
 * @returns ValidationResult with information about validity
 */
export function validateMetricsMatchHypothesis(
  selectedMetrics: string[],
  scenarioIndex: number,
  hypothesisIndex?: number
): MetricValidationResult {
  // First check the basic validity of the metrics
  const basicValidation = validateMetrics(selectedMetrics);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Get the current scenario
  const scenario = marketSituations[scenarioIndex];
  if (!scenario) {
    return {
      isValid: false,
      errorMessage: "Invalid scenario index.",
      metricType: MetricType.MIXED
    };
  }

  // If no hypothesis was specified, we take the first one
  const hypothesis = hypothesisIndex !== undefined 
    ? scenario.hypotheses[hypothesisIndex] 
    : scenario.hypotheses[0];

  if (!hypothesis) {
    return {
      isValid: false,
      errorMessage: "Invalid hypothesis index.",
      metricType: MetricType.MIXED
    };
  }

  // Standardize the metric name for comparison
  const standardizeMetricName = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
  };

  // Get the expected metric from the hypothesis
  const expectedMetric = hypothesis.metric;
  const expectedMetricType = hypothesis.metricType;
  
  // Standardize the metric names for comparison
  const normalizedExpectedMetric = standardizeMetricName(expectedMetric);
  
  const normalizedSelectedMetrics = selectedMetrics.map(m => {
    // Standardize the selected metrics
    let normalized = standardizeMetricName(m);
    
    // Map some known variations
    if (normalized.includes('mean return')) return 'mean return';
    if (normalized.includes('median return')) return 'median return';
    if (normalized.includes('mean gain')) return 'mean gain';
    if (normalized.includes('mean loss')) return 'mean loss';
    if (normalized.includes('positive')) return 'proportion of days with positive returns';
    if (normalized.includes('negative')) return 'proportion of days with negative returns';
    
    return normalized;
  });
  
  // Check if one of the selected metrics matches the expected one
  const matchesExpectedMetric = normalizedSelectedMetrics.some(m => m === normalizedExpectedMetric);
  
  if (!matchesExpectedMetric) {
    // The metric doesn't match the hypothesis
    return {
      isValid: false,
      errorMessage: `Selected metrics don't match the hypothesis. Expected: ${expectedMetric}`,
      metricType: expectedMetricType === 'numerical' ? MetricType.NUMERICAL : MetricType.CATEGORICAL
    };
  }
  
  // All good, the metrics match
  return {
    isValid: true,
    metricType: expectedMetricType === 'numerical' ? MetricType.NUMERICAL : MetricType.CATEGORICAL
  };
} 