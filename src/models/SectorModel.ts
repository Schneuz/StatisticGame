// SectorModel.ts
// This model handles sector performance grouping and integration with market situations

import { marketSituations } from '../contexts/GameContext';
import { PerformanceGroup, getCurrentMarketSituationIndex } from './DataGenerationModel';

/**
 * Performance groups cache to avoid recalculating for the same situation
 */
const performanceGroupCache: {
  [situationIndex: number]: {
    [sector: string]: PerformanceGroup
  }
} = {};

/**
 * Determine a sector's performance group in the current market scenario
 * @param sector The sector name to check
 * @param situationIndex The current market situation index
 * @returns The performance group ('positive', 'neutral', or 'negative')
 */
export function getSectorPerformanceGroup(sector: string, situationIndex: number): PerformanceGroup {
  const index = getCurrentMarketSituationIndex(situationIndex);
  
  // Check cache first
  if (performanceGroupCache[index]?.hasOwnProperty(sector)) {
    return performanceGroupCache[index][sector];
  }
  
  // Initialize cache entry if needed
  if (!performanceGroupCache[index]) {
    performanceGroupCache[index] = {};
  }
  
  const situation = marketSituations[index];
  let result: PerformanceGroup;
  
  if (situation.performanceGroups.positive.includes(sector)) {
    result = 'positive';
  } else if (situation.performanceGroups.negative.includes(sector)) {
    result = 'negative';
  } else {
    result = 'neutral';
  }
  
  // Save to cache
  performanceGroupCache[index][sector] = result;
  
  return result;
}

/**
 * Get all sectors from a specific performance group in the current market scenario
 * @param group The performance group to get sectors for
 * @param situationIndex The current market situation index
 * @returns Array of sector names
 */
export function getSectorsByPerformanceGroup(group: PerformanceGroup, situationIndex: number): string[] {
  const index = getCurrentMarketSituationIndex(situationIndex);
  const situation = marketSituations[index];
  
  return situation.performanceGroups[group];
}

/**
 * Invalidate the performance group cache when market situations change
 * Call this function whenever the market situation changes
 */
export function invalidatePerformanceGroupCache(): void {
  Object.keys(performanceGroupCache).forEach(key => {
    delete performanceGroupCache[parseInt(key)];
  });
}

/**
 * Clear performance group cache for a specific market situation
 * @param situationIndex The market situation index to clear cache for
 */
export function clearPerformanceGroupCacheForSituation(situationIndex: number): void {
  if (performanceGroupCache[situationIndex]) {
    delete performanceGroupCache[situationIndex];
  }
}

/**
 * Checks if a sector is in a specific performance group
 * @param sector The sector name to check
 * @param group The performance group to check against
 * @param situationIndex The current market situation index
 * @returns True if the sector is in the specified group
 */
export function isSectorInPerformanceGroup(sector: string, group: PerformanceGroup, situationIndex: number): boolean {
  const index = getCurrentMarketSituationIndex(situationIndex);
  const situation = marketSituations[index];
  
  return situation.performanceGroups[group].includes(sector);
} 