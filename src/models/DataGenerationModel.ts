// DataGenerationModel.ts
// This model centralizes all data generation logic for market analysis

/**
 * Performance groups for sectors in market situations
 */
export type PerformanceGroup = 'positive' | 'neutral' | 'negative';

/**
 * Parameters for different types of data distributions
 */
export interface MetricParameters {
  mean?: number;
  stdDev?: number;
  probability?: number;
  categoricalDistribution?: number[];
}

/**
 * Get the current market situation index
 * @param index The market situation index to use
 * @returns The provided index
 */
export function getCurrentMarketSituationIndex(index: number): number {
  return index;
}

/**
 * Set the current market situation index
 * @param index The market situation index to set
 * @returns The provided index
 */
export function setCurrentMarketSituationIndex(index: number): number {
  return index;
}

/**
 * Generate normally distributed random data
 * @param mean The mean of the distribution
 * @param stdDev The standard deviation
 * @param count The number of data points to generate
 * @returns Array of normally distributed values
 */
export function normal(mean: number, stdDev: number, count: number): number[] {
  const result = [];
  for (let i = 0; i < count; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    result.push(z0 * stdDev + mean);
  }
  return result;
}

/**
 * Generate binomially distributed random data (0s and 1s)
 * @param probability The probability of success (1)
 * @param count The number of data points to generate
 * @returns Array of 0s and 1s
 */
export function binomial(probability: number, count: number): number[] {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(Math.random() < probability ? 1 : 0);
  }
  return result;
}

/**
 * Generate categorical data with specified distribution
 * @param distribution Array of probabilities for each category [cat0, cat1, cat2]
 * @param count The number of data points to generate
 * @returns Array of category indices (0, 1, 2)
 */
export function generateCategoricalData(distribution: number[], count: number): number[] {
  const result = [];
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let cumProb = 0;
    let category = 0;
    for (let j = 0; j < distribution.length; j++) {
      cumProb += distribution[j];
      if (rand < cumProb) {
        category = j;
        break;
      }
    }
    result.push(category);
  }
  return result;
}

/**
 * Get parameters for a specific metric and performance group
 * This is the central parameter configuration for data generation
 * @param metric The metric ID
 * @param performanceGroup The sector's performance group
 * @returns Parameters for data generation
 */
export function getMetricParameters(metric: string, performanceGroup: PerformanceGroup): MetricParameters {
  // Default parameters
  const defaults: Record<string, MetricParameters> = {
    mean_return: { mean: 0.05, stdDev: 0.04 },
    median_return: { mean: 0.05, stdDev: 0.035 },
    proportion_positive_days: { probability: 0.6 },
    proportion_negative_days: { probability: 0.3 },
    proportion_high_volatility_days: { probability: 0.25 },
    mean_gain: { mean: 0.07, stdDev: 0.03 },
    mean_loss: { mean: -0.05, stdDev: 0.025 }
  };

  // Performance-based adjustments
  switch (performanceGroup) {
    case 'positive':
      return adjustPositiveParameters(metric, defaults[metric] || {});
    case 'negative':
      return adjustNegativeParameters(metric, defaults[metric] || {});
    default:
      return defaults[metric] || {};
  }
}

/**
 * Adjust parameters for positive performing sectors
 */
function adjustPositiveParameters(metric: string, baseParams: MetricParameters): MetricParameters {
  const params = { ...baseParams };
  
  switch (metric) {
    case 'mean_return':
    case 'median_return':
      params.mean = (params.mean || 0) + 0.05;
      break;
    case 'proportion_positive_days':
      params.probability = Math.min(0.85, (params.probability || 0) + 0.25);
      break;
    case 'proportion_negative_days':
      params.probability = Math.max(0.05, (params.probability || 0) - 0.15);
      break;
    case 'mean_gain':
      params.mean = (params.mean || 0) + 0.03;
      break;
    case 'mean_loss':
      params.mean = (params.mean || 0) + 0.02;
      break;
  }
  
  return params;
}

/**
 * Adjust parameters for negative performing sectors
 */
function adjustNegativeParameters(metric: string, baseParams: MetricParameters): MetricParameters {
  const params = { ...baseParams };
  
  switch (metric) {
    case 'mean_return':
    case 'median_return':
      params.mean = (params.mean || 0) - 0.07;
      break;
    case 'proportion_positive_days':
      params.probability = Math.max(0.25, (params.probability || 0) - 0.25);
      break;
    case 'proportion_negative_days':
      params.probability = Math.min(0.85, (params.probability || 0) + 0.25);
      break;
    case 'mean_gain':
      params.mean = (params.mean || 0) - 0.03;
      break;
    case 'mean_loss':
      params.mean = (params.mean || 0) - 0.04;
      break;
  }
  
  return params;
}

/**
 * Generate hypothesis data for a given metric and sector
 */
export function generateHypothesisData(metric: string, sector: string, 
  getPerformanceGroup: (sector: string) => PerformanceGroup): number[] {
  
  // Get sector's performance group
  const performanceGroup = getPerformanceGroup(sector);
  
  // Get appropriate parameters based on metric and performance group
  const params = getMetricParameters(metric, performanceGroup);
  
  // Generate data based on the metric type with appropriate parameters
  if (metric === 'mean_return' || metric === 'median_return' || 
      metric === 'mean_gain' || metric === 'mean_loss') {
    return normal(params.mean!, params.stdDev!, 200);
  }
  
  if (metric === 'proportion_positive_days' || metric === 'proportion_negative_days' || 
      metric === 'proportion_high_volatility_days') {
    return binomial(params.probability!, 200);
  }
  
  // Fallback
  return normal(0.05, 0.04, 200);
} 