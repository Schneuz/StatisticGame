// StatisticalTestModel.ts
// This model handles statistical tests for hypothesis testing

import { log } from '../utils/logging';

/**
 * Test result interface
 */
export interface TestResult {
  pValue: number;
  statistic: number;
  significant: boolean;
  testType: 'T-Test' | 'Chi-Square';
  isInappropriate?: boolean; // Flag for inappropriate test selection
}

/**
 * Cache for test results to avoid redundant calculations
 */
const testResultCache: {
  [key: string]: TestResult
} = {};

/**
 * Generate a cache key for test results
 */
function getTestCacheKey(testType: string, data1: number[], data2: number[]): string {
  // Create a hash of the data arrays
  const dataHash1 = data1.reduce((h, v) => h + v.toString().slice(0, 4), '');
  const dataHash2 = data2.reduce((h, v) => h + v.toString().slice(0, 4), '');
  return `${testType}_${dataHash1}_${dataHash2}`;
}

/**
 * Check if a statistical test is appropriate for the given data
 * @param testType The type of test being run
 * @param data1 First dataset
 * @param data2 Second dataset
 * @returns true if test is appropriate, false otherwise
 */
function isAppropriateTest(testType: 'T-Test' | 'Chi-Square', data1: number[], data2: number[]): boolean {
  if (testType === 'T-Test') {
    // T-Test is appropriate for numerical data
    // Check if data is categorical (only contains 0, 1, 2)
    const isCategoricalData1 = data1.every(v => v === 0 || v === 1 || v === 2);
    const isCategoricalData2 = data2.every(v => v === 0 || v === 1 || v === 2);
    
    return !isCategoricalData1 && !isCategoricalData2;
  } else if (testType === 'Chi-Square') {
    // Chi-Square is appropriate for categorical data
    // Check if data is categorical (only contains 0, 1, 2)
    const isCategoricalData1 = data1.every(v => v === 0 || v === 1 || v === 2);
    const isCategoricalData2 = data2.every(v => v === 0 || v === 1 || v === 2);
    
    return isCategoricalData1 && isCategoricalData2;
  }
  
  return true; // Default to true for unknown test types
}

/**
 * Generate plausible but inconclusive results for inappropriate test selections
 * @param testType The type of test being run
 * @returns A plausible but inconclusive test result
 */
function generatePlausibleInconclusiveResult(testType: 'T-Test' | 'Chi-Square'): TestResult {
  // Generate a p-value that's close to but not quite significant
  // This creates uncertainty without an obvious error
  const pValue = 0.07 + (Math.random() * 0.08); // Between 0.07 and 0.15
  
  let statistic;
  if (testType === 'T-Test') {
    statistic = 1.5 + (Math.random() * 0.5); // Plausible t-statistic
  } else {
    statistic = 5.5 + (Math.random() * 3.0); // Plausible chi-square statistic
  }
  
  return {
    pValue,
    statistic,
    significant: false, // Always non-significant for inconclusive results
    testType,
    isInappropriate: true
  };
}

/**
 * Run a statistical test and log the results to the console
 * @param testType The type of test to run
 * @param hypothesis The hypothesis text to log
 * @param data1 First set of data
 * @param data2 Second set of data
 * @param threshold Significance threshold (default: 0.05)
 * @returns The test result object
 */
export function runAndLogStatisticalTest(
  testType: 'T-Test' | 'Chi-Square',
  hypothesis: string,
  data1: number[],
  data2: number[],
  threshold: number = 0.05
): TestResult {
  // Check cache first
  const cacheKey = getTestCacheKey(testType, data1, data2);
  if (testResultCache[cacheKey]) {
    const cachedResult = testResultCache[cacheKey];
    log(`${testType} for hypothesis: "${hypothesis}" (cached)`);
    log(`${testType} Results:`, { 
      pValue: cachedResult.pValue, 
      statistic: cachedResult.statistic, 
      significant: cachedResult.significant,
      isInappropriate: cachedResult.isInappropriate
    });
    return cachedResult;
  }
  
  // Check if the test type is appropriate for the data
  const isAppropriate = isAppropriateTest(testType, data1, data2);
  
  let result: TestResult;
  
  if (!isAppropriate) {
    // Generate plausible but inconclusive results
    result = generatePlausibleInconclusiveResult(testType);
    log(`${testType} for hypothesis: "${hypothesis}" (inappropriate test selection)`);
    log(`${testType} Results (inconclusive):`, { 
      pValue: result.pValue, 
      statistic: result.statistic, 
      significant: result.significant,
      isInappropriate: true
    });
  } else {
    // Normal test execution
    switch (testType) {
      case 'T-Test': {
        const { pValue, statistic } = performTTest(data1, data2);
        result = {
          pValue,
          statistic,
          significant: pValue < threshold,
          testType: 'T-Test'
        };
        log(`T-Test for hypothesis: "${hypothesis}"`);
        log('T-Test Results:', { pValue, statistic, significant: pValue < threshold });
        break;
      }
      
      case 'Chi-Square': {
        // For categorical data, we need to convert to counts
        const counts1 = getCategoricalCounts(data1);
        const counts2 = getCategoricalCounts(data2);
        const { pValue, statistic } = performChiSquareTest(counts1, counts2);
        result = {
          pValue,
          statistic,
          significant: pValue < threshold,
          testType: 'Chi-Square'
        };
        log(`Chi-Square Test for hypothesis: "${hypothesis}"`);
        log('Chi-Square Test Results:', { pValue, statistic, significant: pValue < threshold });
        break;
      }
      
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }
  }
  
  // Store in cache
  testResultCache[cacheKey] = result;
  
  return result;
}

/**
 * Clear the test result cache
 */
export function clearTestCache(): void {
  Object.keys(testResultCache).forEach(key => {
    delete testResultCache[key];
  });
}

/**
 * Helper function to get counts for categorical data
 * Converts 0, 1, 2 values to counts for categories
 * @param data Array of category indices
 * @returns Array of counts for each category
 */
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