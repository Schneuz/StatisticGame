// StatisticalTestModel.ts
// This model handles statistical tests for hypothesis testing

import { ActionTracker } from './ActionTracker';
import { validateMetrics, validateMetricsMatchHypothesis, validateTestForMetrics, MetricType } from '../utils/MetricsValidator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log } from '../utils/logging';

/**
 * Result of a statistical test
 */
export interface TestResult {
  pValue: number;
  statistic: number;
  significant: boolean;
  testType: 'T-Test' | 'Chi-Square';
  isInappropriate?: boolean;
}

/**
 * Map to cache test results by scenario ID and test parameters
 */
const testResultsCache = new Map<string, TestResult>();

/**
 * Generate a cache key for test results
 * @param scenarioId The scenario ID
 * @param testType The type of test
 * @param metrics The metrics tested
 * @param sectors The sectors tested
 * @returns Cache key string
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTestCacheKey(
  scenarioId: number,
  testType: string,
  metrics: string[],
  sectors: string[]
): string {
  return `${scenarioId}_${testType}_${metrics.join('_')}_${sectors.join('_')}`;
}

/**
 * Check if the test type is appropriate for the metrics
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAppropriateTest(testType: string, metrics: string[]): boolean {
  // Determine metric type from metrics
  const metricType = metrics.map(metric => {
    if (metric.includes('return') || metric.includes('gain') || metric.includes('loss')) {
      return MetricType.NUMERICAL;
    } else {
      return MetricType.CATEGORICAL;
    }
  })[0];
  
  // Use the validateTestForMetrics function with the determined metricType
  const testResult = validateTestForMetrics(testType, metricType);
  return testResult.isValid;
}

/**
 * Generate a plausible but inconclusive statistical result
 * Use when the player's selections are not aligning with the scenario 
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generatePlausibleInconclusiveResult(
  testType: 'T-Test' | 'Chi-Square',
  isAppropriate: boolean = true
): TestResult {
  // Modest but inconclusive p-value, not quite significant
  const pValue = 0.08 + (Math.random() * 0.12); // Between 0.08 and 0.20
  
  // Calculate a modest test statistic that would yield this p-value
  // Very simplified approximation
  const statistic = testType === 'T-Test' ? 
    1.5 + (Math.random() * 0.5) : // t-statistic around 1.5-2.0
    2.0 + (Math.random() * 1.0);  // chi-square around 2.0-3.0
  
  return {
    pValue,
    statistic,
    significant: false, // Always inconclusive
    testType,
    isInappropriate: !isAppropriate
  };
}

/**
 * Runs a statistical test and logs the result
 * 
 * @param testType - Type of statistical test (T-Test or Chi-Square)
 * @param metrics - The selected metrics for the test
 * @param sectors - The selected sectors for the test
 * @returns boolean - Indicates whether the test was successful
 */
export function runAndLogStatisticalTest(
  testType: 'T-Test' | 'Chi-Square',
  metrics: string[],
  sectors: string[]
): boolean {
  // Validate the metric selection
  const metricValidation = validateMetrics(metrics);
  
  // Check if the metrics match the current hypothesis
  const currentScenario = ActionTracker.getCurrentScenario();
  const metricHypothesisMatch = validateMetricsMatchHypothesis(metrics, currentScenario);
  
  // If the metrics don't match the hypothesis, record an error
  if (!metricHypothesisMatch.isValid) {
    ActionTracker.addAction('metric_selection', {
      metrics,
      dataType: metricValidation.metricType,
      isCorrect: false,
      errorMessage: metricHypothesisMatch.errorMessage
    });
    return false;
  }
  
  // Check if the test is appropriate for the metric type
  const testValidation = validateTestForMetrics(testType, metricValidation.metricType);
  
  // Record the test action
  ActionTracker.addAction('test_execution', {
    testType,
    metrics,
    dataType: metricValidation.metricType,
    isCorrect: testValidation.isValid,
    errorMessage: testValidation.errorMessage
  });
  
  return testValidation.isValid;
}

/**
 * Clear the test result cache
 */
export function clearTestCache(): void {
  testResultsCache.clear();
}

/**
 * Helper function to get counts for categorical data
 * Converts 0, 1, 2 values to counts for categories
 * @param data Array of category indices
 * @returns Array of counts for each category
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getCategoricalCounts(data: number[]): number[] {
  const counts = [0, 0, 0]; // 3 categories for loss, neutral, gain
  data.forEach(v => {
    if (v === 0) counts[0]++;
    else if (v === 1) counts[1]++;
    else if (v === 2) counts[2]++;
  });
  return counts;
}

/**
 * Perform a T-Test between two groups
 * Implementation of Student's t-test for independent samples
 * @param group1 First group data
 * @param group2 Second group data
 * @returns p-value and test statistic
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function performTTest(group1: number[], group2: number[]): { pValue: number, statistic: number } {
  if (group1.length < 2 || group2.length < 2) return { pValue: 1, statistic: 0 };

  const mean1 = calculateMean(group1);
  const mean2 = calculateMean(group2);
  const sd1 = calculateStandardDeviation(group1, mean1);
  const sd2 = calculateStandardDeviation(group2, mean2);
  
  if (sd1 === 0 && sd2 === 0) return { pValue: 1, statistic: 0 };
  
  const n1 = group1.length;
  const n2 = group2.length;
  
  const pooledStandardError = Math.sqrt((sd1 * sd1 / n1) + (sd2 * sd2 / n2));
  if (pooledStandardError === 0) return { pValue: 1, statistic: 0 };
  
  const tStatistic = Math.abs(mean1 - mean2) / pooledStandardError;
  // Simple p-value approximation using logistic function
  const pValue = 1 / (1 + Math.exp(0.717 * tStatistic));
  
  return { pValue, statistic: tStatistic };
}

/**
 * Perform a Chi-Square Test between two groups
 * Tests if the distribution of categories differs between groups
 * @param observed1 Category counts for first group
 * @param observed2 Category counts for second group
 * @returns p-value and test statistic
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function performChiSquareTest(observed1: number[], observed2: number[]): { pValue: number, statistic: number } {
  // Create observed and expected arrays
  const rows = 2; // two groups
  const cols = observed1.length;
  
  const observed = [observed1, observed2];
  const rowSums = observed.map(row => row.reduce((sum, val) => sum + val, 0));
  const colSums = Array(cols).fill(0);
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      colSums[j] += observed[i][j];
    }
  }
  
  const total = rowSums.reduce((sum, val) => sum + val, 0);
  
  // Calculate expected values
  const expected = Array(rows).fill(0).map(() => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      expected[i][j] = (rowSums[i] * colSums[j]) / total;
    }
  }
  
  // Calculate chi-square statistic
  let chiSquare = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (expected[i][j] !== 0) {
        const diff = observed[i][j] - expected[i][j];
        chiSquare += (diff * diff) / expected[i][j];
      }
    }
  }
  
  // Simple p-value approximation using logistic function
  const pValue = 1 / (1 + Math.exp(0.717 * chiSquare));
  
  return { pValue, statistic: chiSquare };
}

/**
 * Calculate the mean of an array of numbers
 */
function calculateMean(numbers: number[]): number {
  let sum = 0;
  const len = numbers.length;
  for (let i = 0; i < len; i++) {
    sum += numbers[i];
  }
  return sum / len;
}

/**
 * Calculate the standard deviation of an array of numbers
 */
function calculateStandardDeviation(numbers: number[], mean: number): number {
  let sumSquareDiff = 0;
  const len = numbers.length;
  for (let i = 0; i < len; i++) {
    sumSquareDiff += (numbers[i] - mean) ** 2;
  }
  return Math.sqrt(sumSquareDiff / len);
} 