// DataGenerationModel.ts
// This model centralizes all data generation logic for market analysis

import { log } from '../utils/logging';

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

// Cache for data values by parameter sets
const dataCache: { [key: string]: number[] } = {};

/**
 * Generates a cache key for the parameter set
 */
function getCacheKey(mean: number, stdDev: number, sampleSize: number, sector?: string): string {
  return sector 
    ? `${mean.toFixed(4)}_${stdDev.toFixed(4)}_${sampleSize}_${sector}`
    : `${mean.toFixed(4)}_${stdDev.toFixed(4)}_${sampleSize}`;
}

/**
 * Generates a deterministic but unique seed for a sector
 */
function generateSectorSeed(sector: string): number {
  // Use a more complex hash function for the sector name
  // Weight letters by position in the name for more variance
  let seed = 0;
  for (let i = 0; i < sector.length; i++) {
    const charCode = sector.charCodeAt(i);
    // Consider both letters and their position
    seed += charCode * (i + 1) * 17;
    // Add non-linearity
    seed = (seed * 31) % 1000000;
  }
  return seed;
}

/**
 * Generates values using a normal distribution
 * 
 * @param mean Mean of the distribution
 * @param stdDev Standard deviation
 * @param count Number of samples to generate
 * @param sector Optional sector name for sector-specific variation
 * @returns Array of values following a normal distribution
 */
export function normal(mean: number, stdDev: number, count: number, sector?: string): number[] {
  // Check cache first
  const cacheKey = getCacheKey(mean, stdDev, count, sector);
  if (dataCache[cacheKey]) {
    log(`Using cached data for normal distribution with mean=${mean}, stdDev=${stdDev}, count=${count}, sector=${sector || "none"}`);
    return [...dataCache[cacheKey]];
  }

  // Generate new data
  const result: number[] = [];
  
  // If a sector is specified, use a deterministic seed for random generation
  let sectorSeedValue = 0;
  if (sector) {
    sectorSeedValue = generateSectorSeed(sector);
  }
  
  // Generate a sample of standard normal values using Box-Muller transform
  // Then transform them to match the desired mean and standard deviation
  for (let i = 0; i < count; i += 2) {
    // Create two independent random numbers between 0 and 1
    // Mix the sector seed with actual randomness for both determinism and variation
    const seedOffset = i * 31;
    const u1 = sector 
      ? (Math.sin(sectorSeedValue + seedOffset) * 0.5 + 0.5) * 0.7 + Math.random() * 0.3 
      : Math.random();
    const u2 = sector 
      ? (Math.cos(sectorSeedValue + seedOffset + 1000) * 0.5 + 0.5) * 0.7 + Math.random() * 0.3 
      : Math.random();
    
    // Reject values too close to 0 to improve normality
    if (u1 < 0.001) continue;
    
    // Box-Muller transform - generates two standard normal random values
    const r = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;
    
    // Generate two normal random values
    const z0 = r * Math.cos(theta);
    const z1 = r * Math.sin(theta);
    
    // Transform to desired mean and standard deviation
    const value1 = mean + z0 * stdDev;
    result.push(Number(value1.toFixed(2)));
    
    // Add the second value if we haven't reached count yet
    if (i + 1 < count) {
      const value2 = mean + z1 * stdDev;
      result.push(Number(value2.toFixed(2)));
    }
  }

  // Cache for future use
  dataCache[cacheKey] = [...result];
  return result;
}

/**
 * Generate binomially distributed random data (0s and 1s)
 * @param probability The probability of success (1)
 * @param count The number of data points to generate
 * @param sector Optional sector name for sector-specific variation
 * @returns Array of 0s and 1s
 */
export function binomial(probability: number, count: number, sector?: string): number[] {
  // Check cache first
  const cacheKey = `bin_${probability.toFixed(4)}_${count}_${sector || ""}`;
  if (dataCache[cacheKey]) {
    return [...dataCache[cacheKey]];
  }
  
  const result = [];
  
  // If a sector is specified, use a deterministic seed for random generation
  let sectorSeedValue = 0;
  if (sector) {
    sectorSeedValue = generateSectorSeed(sector);
  }
  
  for (let i = 0; i < count; i++) {
    // Use the sector-specific seed for consistent but different random values
    const randomSeed = (sectorSeedValue + i * 17) % 1000000 / 1000000;
    const rand = sector ? (randomSeed + Math.random()) / 2 : Math.random();
    result.push(rand < probability ? 1 : 0);
  }
  
  // Cache for future use
  dataCache[cacheKey] = [...result];
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
  
  // Generate a sector-specific seed value for random generation
  // Use an improved seed generation method
  const sectorSeed = generateSectorSeed(sector);
  
  // Add small sector-specific variation to the parameters (±15%)
  // Use a more complex formula with the seed for variation
  const variation = Math.sin(sectorSeed * 0.01) * 0.15; // Generates values between -0.15 and 0.15
  
  // Adjusted parameters with sector-specific variation
  let adjustedParams = { ...params };
  if (adjustedParams.mean !== undefined) {
    adjustedParams.mean = adjustedParams.mean * (1 + variation);
  }
  if (adjustedParams.stdDev !== undefined) {
    // Also vary the standard deviation, but with a different factor
    adjustedParams.stdDev = adjustedParams.stdDev * (1 + (Math.cos(sectorSeed * 0.02) * 0.1));
  }
  if (adjustedParams.probability !== undefined) {
    // Limit between 0 and 1, with different variation
    const probVariation = Math.sin((sectorSeed + 500) * 0.01) * 0.15;
    adjustedParams.probability = Math.max(0, Math.min(1, adjustedParams.probability + probVariation));
  }
  
  // Generate data based on the metric type with appropriate parameters
  // Pass the sector name to the generation functions
  if (metric === 'mean_return' || metric === 'median_return' || 
      metric === 'mean_gain' || metric === 'mean_loss') {
    return normal(adjustedParams.mean!, adjustedParams.stdDev!, 200, sector);
  }
  
  if (metric === 'proportion_positive_days' || metric === 'proportion_negative_days') {
    // Volatility metric was removed
    return binomial(adjustedParams.probability!, 200, sector);
  }
  
  // Fallback
  return normal(0.05 * (1 + variation), 0.04 * (1 + variation), 200, sector);
} 