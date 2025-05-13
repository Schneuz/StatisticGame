import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { Sector, sectors } from '../data/sectors';
import { setCurrentMarketSituationIndex, PerformanceGroup } from '../models/DataGenerationModel';
import { getSectorPerformanceGroup } from '../models/SectorModel';
import { ActionTracker } from '../models/ActionTracker';

export interface PortfolioItem {
  sector: Sector;
  quantity: number;
  purchasePrice: number;
}

interface GameState {
  capital: number;
  portfolio: PortfolioItem[];
  currentPrices: Record<string, number>;
  investmentCount: number;
  timeAdvanceCount: number;
  stepsInCurrentSituation: number;
  currentSituationIndex: number;
  mistakes: number;
  lastConsultation: number;
  availableTools: string[];
  shownTools: string[];
  currentMarketSituation: string | null;
  marketSituation: {
    description: string;
    recommendedTool: string | null;
    toolDescription: string | null;
    expectedOutcome: string | null;
  };
  priceHistory: {
    [sectorName: string]: {
      prices: number[];
      timestamp: number;
    };
  };
  historyLimit: number;
  isAutoProgressPaused: boolean;
  lastAutoUpdate: number;
  showScenarioCompletionPopup: boolean;
  previousCapital: number;
}

interface MarketSituation {
  description: string;
  recommendedTool: string | null;
  toolDescription: string | null;
  performanceGroups: {
    positive: string[];  // Sector names that should perform well
    neutral: string[];   // Sector names that should perform average
    negative: string[];  // Sector names that should perform poorly
  };
  expectedOutcomes: string[];
  testCriteria: {
    type: 'T-Test' | 'Chi-Square';
    threshold: number;
    comparisonPeriod: number;
  };
  hypotheses: string[];
}

type GameAction =
  | { type: 'PURCHASE_SECTOR'; sector: Sector; quantity: number }
  | { type: 'SELL_SECTOR'; sectorName: string; quantity: number }
  | { type: 'UPDATE_PRICES' }
  | { type: 'ADVANCE_TIME' }
  | { type: 'ADVANCE_TO_NEXT_SCENARIO' }
  | { type: 'TOGGLE_AUTO_PROGRESS' }
  | { type: 'ADD_MISTAKE' }
  | { type: 'COMPLETE_MEETING' }
  | { type: 'MARK_TOOL_SHOWN'; tool: string }
  | { type: 'PAY_FOR_HINT'; cost: number }
  | { type: 'RESET_GAME' }
  | { type: 'CLOSE_SCENARIO_COMPLETION_POPUP' }
  | { type: 'SHOW_SCENARIO_COMPLETION_POPUP' };

export const marketSituations: MarketSituation[] = [
  {
    description: "Elrond's valley shimmers under a canopy of stars. Taverns overflow with mead, bakers serve warm honeyed lembas, and artisans craft tirelessly. Caravans roll out daily with festival goods. Bandits lurk in moonless gorges; armed escorts become scarce.",
    recommendedTool: "T-Test",
    toolDescription: "Food & Beverages outperform Precious Metals. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Food & Beverages', 'Craftsmanship & Technology', 'Transport & Logistics', 'Medicine & Healing', 'Music & Entertainment', 'Textiles & Clothing'],
      neutral: ['Precious Metals', 'Agriculture & Livestock', 'Fishing & Seafood', 'Glassware & Mirrors', 'Horse & Riding Services'],
      negative: ['Armor & Weapons', 'Construction Materials & Resources', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Food & Beverages show a significantly higher mean return than Precious Metals.",
      "Craftsmanship & Technology's daily return distribution differs significantly from the overall market.",
      "Transport & Logistics have a higher proportion of high-volatility days than Exploration & Cartography.",
      "Medicine & Healing have a higher proportion of positive return days than Agriculture & Livestock.",
      "Armor & Weapons have a mean return significantly greater than zero."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Food & Beverages is higher than the mean return of Precious Metals.",
      "The distribution of daily return categories (Gain, Loss, Flat) for Craftsmanship & Technology is different from the distribution of daily return categories for Glassware & Mirrors.",
      "The proportion of days exceeding a predefined volatility threshold for Transport & Logistics is higher than for Exploration & Cartography.",
      "The proportion of days with positive returns for Medicine & Healing is higher than for Agriculture & Livestock.",
      "The mean return of Armor & Weapons is greater than zero."
    ]
  },
  {
    description: "War drums thunder across the Pelennor Fields. Behind white walls, forges hammer, healers stack herbs, and citizens hoard grain. Traders avoid the main roads, and luxury goods gather dust.",
    recommendedTool: "T-Test",
    toolDescription: "Armor & Weapons outperform Food & Beverages. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Armor & Weapons', 'Medicine & Healing', 'Construction Materials & Resources', 'Horse & Riding Services'],
      neutral: ['Precious Metals', 'Craftsmanship & Technology', 'Agriculture & Livestock', 'Fishing & Seafood', 'Textiles & Clothing', 'Glassware & Mirrors'],
      negative: ['Transport & Logistics', 'Food & Beverages', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Armor & Weapons show a significantly higher mean return than Food & Beverages.",
      "Medicine & Healing have a lower proportion of negative return days than Transport & Logistics.",
      "Exploration & Cartography have a higher proportion of high-volatility days than Precious Metals.",
      "No significant difference in mean gain between Agriculture & Livestock and Construction Materials & Resources.",
      "Textiles & Clothing have a significantly lower median return than Precious Metals."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Armor & Weapons is higher than the mean return of Food & Beverages.",
      "The proportion of days with negative returns for Medicine & Healing is lower than for Transport & Logistics.",
      "The proportion of days exceeding a predefined volatility threshold for Exploration & Cartography is higher than for Precious Metals.",
      "The mean gain of Agriculture & Livestock is not significantly different from Construction Materials & Resources.",
      "The median return of Textiles & Clothing is lower than the median return of Precious Metals."
    ]
  },
  {
    description: "An unrelenting sun scorches Rohan's Eastfold. Wells dry up, fields turn to dust, herds thin out. Stonemasons and well-diggers roam the lands, and healers prepare fever remedies.",
    recommendedTool: "T-Test",
    toolDescription: "Construction Materials & Resources outperform Agriculture & Livestock. Use T-Test to verify.",
    performanceGroups: {
      positive: ['Construction Materials & Resources', 'Medicine & Healing'],
      neutral: ['Precious Metals', 'Craftsmanship & Technology', 'Transport & Logistics', 'Fishing & Seafood', 'Textiles & Clothing', 'Horse & Riding Services', 'Glassware & Mirrors'],
      negative: ['Food & Beverages', 'Agriculture & Livestock', 'Armor & Weapons', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Construction Materials & Resources have a significantly higher median return than Agriculture & Livestock.",
      "Medicine & Healing have a higher proportion of positive return days than Food & Beverages.",
      "Precious Metals have a lower proportion of high-volatility days than Transport & Logistics.",
      "No significant difference in mean gain between Craftsmanship & Technology and Exploration & Cartography.",
      "Armor & Weapons have a higher proportion of loss days than Jewelry & Gems."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The median return of Construction Materials & Resources is higher than the median return of Agriculture & Livestock.",
      "The proportion of days with positive returns for Medicine & Healing is higher than for Food & Beverages.",
      "The proportion of days exceeding a predefined volatility threshold for Precious Metals is lower than for Transport & Logistics.",
      "The mean gain of Craftsmanship & Technology is not significantly different from Exploration & Cartography.",
      "The proportion of days with losses for Armor & Weapons is higher than for Jewelry & Gems."
    ]
  },
  {
    description: "Deep in Moria's shadows, new Mithril veins gleam. Messengers race over mountain passes; investor camps spring up outside the East Gate. Precious metal prices skyrocket.",
    recommendedTool: "T-Test",
    toolDescription: "Precious Metals outperform Jewelry & Gems. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Precious Metals', 'Craftsmanship & Technology', 'Transport & Logistics', 'Glassware & Mirrors'],
      neutral: ['Construction Materials & Resources', 'Food & Beverages', 'Medicine & Healing', 'Agriculture & Livestock', 'Fishing & Seafood', 'Textiles & Clothing', 'Horse & Riding Services'],
      negative: ['Armor & Weapons', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Precious Metals show a significantly higher mean return than Jewelry & Gems.",
      "Jewelry & Gems have a higher proportion of high-volatility days than Craftsmanship & Technology.",
      "Transport & Logistics have a higher proportion of positive return days than Agriculture & Livestock.",
      "Glassware & Mirrors have a significantly higher mean return than Food & Beverages.",
      "Medicine & Healing have a higher proportion of negative return days than Construction Materials & Resources."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Precious Metals is higher than the mean return of Jewelry & Gems.",
      "The proportion of days exceeding a predefined volatility threshold for Jewelry & Gems is higher than for Craftsmanship & Technology.",
      "The proportion of days with positive returns for Transport & Logistics is higher than for Agriculture & Livestock.",
      "The mean return of Glassware & Mirrors is higher than the mean return of Food & Beverages.",
      "The proportion of days with negative returns for Medicine & Healing is higher than for Construction Materials & Resources."
    ]
  },
  {
    description: "Black longships loom at the mouth of the Anduin. Merchants are raided, wine barrels stolen, iron sunk. Overland routes become congested; wagon drivers demand hazard pay.",
    recommendedTool: "T-Test",
    toolDescription: "Armor & Weapons outperform Transport & Logistics. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Armor & Weapons', 'Craftsmanship & Technology', 'Medicine & Healing', 'Construction Materials & Resources'],
      neutral: ['Precious Metals', 'Agriculture & Livestock', 'Fishing & Seafood', 'Textiles & Clothing', 'Horse & Riding Services', 'Glassware & Mirrors'],
      negative: ['Transport & Logistics', 'Food & Beverages', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Armor & Weapons show a significantly higher mean return than Transport & Logistics.",
      "Exploration & Cartography have a higher proportion of high-volatility days than Precious Metals.",
      "Craftsmanship & Technology have a higher proportion of positive return days than Food & Beverages.",
      "No significant difference in mean return between Medicine & Healing and Construction Materials & Resources.",
      "Agriculture & Livestock have a higher proportion of negative return days than Jewelry & Gems."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Armor & Weapons is higher than the mean return of Transport & Logistics.",
      "The proportion of days exceeding a predefined volatility threshold for Exploration & Cartography is higher than for Precious Metals.",
      "The proportion of days with positive returns for Craftsmanship & Technology is higher than for Food & Beverages.",
      "The mean return of Medicine & Healing is not significantly different from the mean return of Construction Materials & Resources.",
      "The proportion of days with negative returns for Agriculture & Livestock is higher than for Jewelry & Gems."
    ]
  },
  {
    description: "A new sapling of the White Tree blossoms in Minas Tirith's courtyard. Pilgrims flood the streets, inns overflow, silver tree amulets sell briskly.",
    recommendedTool: "T-Test",
    toolDescription: "Food & Beverages outperform Armor & Weapons. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Food & Beverages', 'Craftsmanship & Technology', 'Medicine & Healing', 'Agriculture & Livestock', 'Music & Entertainment', 'Textiles & Clothing'],
      neutral: ['Precious Metals', 'Transport & Logistics', 'Construction Materials & Resources', 'Fishing & Seafood', 'Horse & Riding Services', 'Glassware & Mirrors'],
      negative: ['Armor & Weapons', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Food & Beverages show a significantly higher mean return than Armor & Weapons.",
      "Craftsmanship & Technology have a higher proportion of high-volatility days than Precious Metals.",
      "Medicine & Healing have a higher proportion of positive return days than Transport & Logistics.",
      "No significant difference in mean return between Construction Materials & Resources and Exploration & Cartography.",
      "Jewelry & Gems have a higher proportion of negative return days than Agriculture & Livestock."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Food & Beverages is higher than the mean return of Armor & Weapons.",
      "The proportion of days exceeding a predefined volatility threshold for Craftsmanship & Technology is higher than for Precious Metals.",
      "The proportion of days with positive returns for Medicine & Healing is higher than for Transport & Logistics.",
      "The mean return of Construction Materials & Resources is not significantly different from the mean return of Exploration & Cartography.",
      "The proportion of days with negative returns for Jewelry & Gems is higher than for Agriculture & Livestock."
    ]
  },
  {
    description: "In the deep green of Fangorn, the Ents forbid the felling of any living wood. Timber prices crash; stonemasons rejoice; harvests flourish.",
    recommendedTool: "T-Test",
    toolDescription: "Construction Materials & Resources rise because farmers build extra storage halls. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Construction Materials & Resources', 'Agriculture & Livestock', 'Medicine & Healing', 'Armor & Weapons', 'Textiles & Clothing'],
      neutral: ['Precious Metals', 'Craftsmanship & Technology', 'Transport & Logistics', 'Fishing & Seafood', 'Horse & Riding Services', 'Glassware & Mirrors'],
      negative: ['Food & Beverages', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Construction Materials & Resources have a mean return significantly greater than zero.",
      "Agriculture & Livestock have a lower proportion of high-volatility days than Jewelry & Gems.",
      "Medicine & Healing have a higher proportion of positive return days than Food & Beverages.",
      "No significant difference in mean return between Exploration & Cartography and Precious Metals.",
      "Transport & Logistics have a higher proportion of loss days than Armor & Weapons."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Construction Materials & Resources is greater than zero.",
      "The proportion of days exceeding a predefined volatility threshold for Agriculture & Livestock is lower than for Jewelry & Gems.",
      "The proportion of days with positive returns for Medicine & Healing is higher than for Food & Beverages.",
      "The mean return of Exploration & Cartography is not significantly different from the mean return of Precious Metals.",
      "The proportion of days with losses for Transport & Logistics is higher than for Armor & Weapons."
    ]
  },
  {
    description: "Deep inside a rocky cavern, goblin torches flicker over raw gemstones, steaming potions, and ticking gears. Traders pay heavy tolls; precious metals shine.",
    recommendedTool: "T-Test",
    toolDescription: "Precious Metals outperform Agriculture & Livestock. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Precious Metals', 'Transport & Logistics', 'Construction Materials & Resources', 'Glassware & Mirrors'],
      neutral: ['Armor & Weapons', 'Craftsmanship & Technology', 'Fishing & Seafood', 'Textiles & Clothing', 'Horse & Riding Services', 'Music & Entertainment'],
      negative: ['Food & Beverages', 'Agriculture & Livestock', 'Medicine & Healing', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Precious Metals show a significantly higher mean return than Agriculture & Livestock.",
      "Jewelry & Gems have a higher proportion of high-volatility days than Craftsmanship & Technology.",
      "Transport & Logistics have a higher proportion of positive return days than Exploration & Cartography.",
      "No significant difference in mean gain between Construction Materials & Resources and Armor & Weapons.",
      "Medicine & Healing have a higher proportion of negative return days than Food & Beverages."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Precious Metals is higher than the mean return of Agriculture & Livestock.",
      "The proportion of days exceeding a predefined volatility threshold for Jewelry & Gems is higher than for Craftsmanship & Technology.",
      "The proportion of days with positive returns for Transport & Logistics is higher than for Exploration & Cartography.",
      "The mean gain of Construction Materials & Resources is not significantly different from the mean gain of Armor & Weapons.",
      "The proportion of days with negative returns for Medicine & Healing is higher than for Food & Beverages."
    ]
  },
  {
    description: "By flickering torchlight, a Dwarf King and an Elf Lord forge an alliance: gemstones for silk, knife steel for crystal harps. Artisans and glassblowers celebrate.",
    recommendedTool: "T-Test",
    toolDescription: "Craftsmanship & Technology outperform Armor & Weapons. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Craftsmanship & Technology', 'Precious Metals', 'Textiles & Clothing', 'Glassware & Mirrors', 'Music & Entertainment'],
      neutral: ['Transport & Logistics', 'Medicine & Healing', 'Construction Materials & Resources', 'Fishing & Seafood', 'Agriculture & Livestock', 'Horse & Riding Services'],
      negative: ['Armor & Weapons', 'Food & Beverages', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Craftsmanship & Technology show a significantly higher mean return than Armor & Weapons.",
      "Precious Metals have a lower proportion of high-volatility days than Exploration & Cartography.",
      "Jewelry & Gems have a higher proportion of positive return days than Construction Materials & Resources.",
      "No significant difference in mean return between Transport & Logistics and Food & Beverages.",
      "Agriculture & Livestock have a higher proportion of negative return days than Medicine & Healing."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Craftsmanship & Technology is higher than the mean return of Armor & Weapons.",
      "The proportion of days exceeding a predefined volatility threshold for Precious Metals is lower than for Exploration & Cartography.",
      "The proportion of days with positive returns for Jewelry & Gems is higher than for Construction Materials & Resources.",
      "The mean return of Transport & Logistics is not significantly different from the mean return of Food & Beverages.",
      "The proportion of days with negative returns for Agriculture & Livestock is higher than for Medicine & Healing."
    ]
  },
  {
    description: "Dense mists swallowed Bree's alleys. Strangers buy up stables and inns; blacksmiths sell locks faster than they forge them. Thieves prowled the darkness.",
    recommendedTool: "T-Test",
    toolDescription: "Exploration & Cartography outperform Food & Beverages. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Exploration & Cartography', 'Armor & Weapons', 'Construction Materials & Resources', 'Horse & Riding Services', 'Craftsmanship & Technology'],
      neutral: ['Precious Metals', 'Transport & Logistics', 'Fishing & Seafood', 'Textiles & Clothing', 'Medicine & Healing', 'Glassware & Mirrors'],
      negative: ['Food & Beverages', 'Agriculture & Livestock', 'Music & Entertainment', 'Jewelry & Gems']
    },
    expectedOutcomes: [
      "Exploration & Cartography show a significantly higher mean return than Food & Beverages.",
      "Armor & Weapons have a higher proportion of high-volatility days than Transport & Logistics.",
      "Construction Materials & Resources have a higher proportion of positive return days than Agriculture & Livestock.",
      "No significant difference in mean return between Craftsmanship & Technology and Precious Metals.",
      "Jewelry & Gems have a higher proportion of negative return days than Medicine & Healing."
    ],
    testCriteria: {
      type: 'T-Test',
      threshold: 0.05,
      comparisonPeriod: 4
    },
    hypotheses: [
      "The mean return of Exploration & Cartography is higher than the mean return of Food & Beverages.",
      "The proportion of days exceeding a predefined volatility threshold for Armor & Weapons is higher than for Transport & Logistics.",
      "The proportion of days with positive returns for Construction Materials & Resources is higher than for Agriculture & Livestock.",
      "The mean return of Craftsmanship & Technology is not significantly different from the mean return of Precious Metals.",
      "The proportion of days with negative returns for Jewelry & Gems is higher than for Medicine & Healing."
    ]
  }
];

const initialState: GameState = {
  capital: 10000,
  portfolio: [],
  currentPrices: {},
  investmentCount: 0,
  timeAdvanceCount: 0,
  stepsInCurrentSituation: 0,
  currentSituationIndex: 0,
  mistakes: 0,
  lastConsultation: 0,
  availableTools: ['T-Test', 'Chi-Square'],
  shownTools: [],
  currentMarketSituation: null,
  marketSituation: {
    description: '',
    recommendedTool: null,
    toolDescription: null,
    expectedOutcome: null
  },
  priceHistory: {},
  historyLimit: 10,
  isAutoProgressPaused: false,
  lastAutoUpdate: 0,
  showScenarioCompletionPopup: false,
  previousCapital: 10000
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

function generateNewPrice(currentPrice: number, performanceGroup: PerformanceGroup): number {
  // Different random ranges based on performance group
  let minChange, maxChange;
  switch (performanceGroup) {
    case 'positive':
      minChange = 0.02;  // +2% to +8%
      maxChange = 0.08;
      break;
    case 'negative':
      minChange = -0.08; // -8% to -2%
      maxChange = -0.02;
      break;
    default: // neutral
      minChange = -0.03; // -3% to +3%
      maxChange = 0.03;
  }

  const changePercent = minChange + Math.random() * (maxChange - minChange);
  const newPrice = currentPrice * (1 + changePercent);
  return Math.round(newPrice * 100) / 100;
}

// Optimierte Hilfsfunktionen für Statistikberechnungen
function calculateMean(numbers: number[]): number {
  let sum = 0;
  const len = numbers.length;
  for (let i = 0; i < len; i++) {
    sum += numbers[i];
  }
  return sum / len;
}

function calculateStandardDeviation(numbers: number[], mean: number): number {
  let sumSquareDiff = 0;
  const len = numbers.length;
  for (let i = 0; i < len; i++) {
    sumSquareDiff += (numbers[i] - mean) ** 2;
  }
  return Math.sqrt(sumSquareDiff / len);
}

// Optimierte T-Test Funktion
function performTTest(group1: number[], group2: number[]): number {
  if (group1.length < 2 || group2.length < 2) return 1;

  const mean1 = calculateMean(group1);
  const mean2 = calculateMean(group2);
  const sd1 = calculateStandardDeviation(group1, mean1);
  const sd2 = calculateStandardDeviation(group2, mean2);
  
  if (sd1 === 0 && sd2 === 0) return 1;
  
  const n1 = group1.length;
  const n2 = group2.length;
  
  const pooledStandardError = Math.sqrt((sd1 * sd1 / n1) + (sd2 * sd2 / n2));
  if (pooledStandardError === 0) return 1;
  
  const tStatistic = Math.abs(mean1 - mean2) / pooledStandardError;
  return 1 / (1 + Math.exp(0.717 * tStatistic));
}

// Optimierte Chi-Square Test Funktion
function performChiSquareTest(observed: number[][], expected: number[][]): number {
  let chiSquare = 0;
  const rows = observed.length;
  const cols = observed[0].length;
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (expected[i][j] !== 0) {
        const diff = observed[i][j] - expected[i][j];
        chiSquare += (diff * diff) / expected[i][j];
      }
    }
  }
  
  return 1 / (1 + Math.exp(0.717 * chiSquare));
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PURCHASE_SECTOR': {
      const totalCost = action.sector.currentPrice * action.quantity;
      if (totalCost > state.capital) {
        return state;
      }

      const existingItem = state.portfolio.find(item => item.sector.name === action.sector.name);
      const newPortfolio = existingItem
        ? state.portfolio.map(item =>
            item.sector.name === action.sector.name
              ? {
                  ...item,
                  quantity: item.quantity + action.quantity,
                  purchasePrice: (item.purchasePrice * item.quantity + action.sector.currentPrice * action.quantity) / (item.quantity + action.quantity)
                }
              : item
          )
        : [...state.portfolio, { sector: action.sector, quantity: action.quantity, purchasePrice: action.sector.currentPrice }];

      return {
        ...state,
        capital: state.capital - totalCost,
        portfolio: newPortfolio,
        investmentCount: state.investmentCount + 1
      };
    }

    case 'SELL_SECTOR': {
      const portfolioItem = state.portfolio.find(item => item.sector.name === action.sectorName);
      if (!portfolioItem || portfolioItem.quantity < action.quantity) {
        return state;
      }

      const saleValue = portfolioItem.sector.currentPrice * action.quantity;
      const newPortfolio = portfolioItem.quantity === action.quantity
        ? state.portfolio.filter(item => item.sector.name !== action.sectorName)
        : state.portfolio.map(item =>
            item.sector.name === action.sectorName
              ? { ...item, quantity: item.quantity - action.quantity }
              : item
          );

      return {
        ...state,
        capital: state.capital + saleValue,
        portfolio: newPortfolio
      };
    }

    case 'UPDATE_PRICES': {
      // Optimiere Preis-Updates durch Vermeidung unnötiger Objektkopien
      const updatedPortfolio = state.portfolio.map(item => ({
        ...item,
        sector: {
          ...item.sector,
          currentPrice: Number((state.currentPrices[item.sector.name] || item.sector.currentPrice).toFixed(2))
        }
      }));

      return {
        ...state,
        portfolio: updatedPortfolio
      };
    }

    case 'TOGGLE_AUTO_PROGRESS':
      return {
        ...state,
        isAutoProgressPaused: !state.isAutoProgressPaused,
        lastAutoUpdate: Date.now()
      };

    case 'ADVANCE_TIME': {
      const newTimeAdvanceCount = state.timeAdvanceCount + 1;
      const newStepsInCurrentSituation = state.stepsInCurrentSituation + 1;
      
      // Only update prices if we're not in auto-progress mode or if it's been long enough
      const shouldUpdatePrices = !state.isAutoProgressPaused || 
        (Date.now() - state.lastAutoUpdate) >= 1000;
      
      if (shouldUpdatePrices) {
        // Update prices for all sectors
        const newPrices = { ...state.currentPrices };
        sectors.forEach(sector => {
          const performanceGroup = getSectorPerformanceGroup(sector.name, state.currentSituationIndex);
          newPrices[sector.name] = generateNewPrice(sector.currentPrice, performanceGroup);
          sector.currentPrice = newPrices[sector.name];
        });
        
        // Update price history
        const newPriceHistory = { ...state.priceHistory };
        sectors.forEach(sector => {
          if (!newPriceHistory[sector.name]) {
            newPriceHistory[sector.name] = { 
              prices: [], 
              timestamp: Date.now() 
            };
          }
          newPriceHistory[sector.name].prices.push(newPrices[sector.name]);
          if (newPriceHistory[sector.name].prices.length > state.historyLimit) {
            newPriceHistory[sector.name].prices.shift();
          }
        });
        
        return {
          ...state,
          currentPrices: newPrices,
          priceHistory: newPriceHistory,
          timeAdvanceCount: newTimeAdvanceCount,
          stepsInCurrentSituation: newStepsInCurrentSituation,
          lastAutoUpdate: Date.now()
        };
      }
      
      return {
        ...state,
        timeAdvanceCount: newTimeAdvanceCount,
        stepsInCurrentSituation: newStepsInCurrentSituation
      };
    }

    case 'ADD_MISTAKE':
      return {
        ...state,
        mistakes: state.mistakes + 1
      };

    case 'COMPLETE_MEETING':
      const meetingUnlockedTools: string[] = [];
      if (state.mistakes >= 3 && !state.availableTools.includes('T-Test')) {
        meetingUnlockedTools.push('T-Test');
      }
      if (state.mistakes >= 9 && !state.availableTools.includes('Chi-Square Test')) {
        meetingUnlockedTools.push('Chi-Square Test');
      }

      return {
        ...state,
        mistakes: 0,
        availableTools: [...state.availableTools, ...meetingUnlockedTools],
        // Don't include newly unlocked tools in shownTools yet
        shownTools: state.shownTools.filter(tool => !meetingUnlockedTools.includes(tool))
      };

    case 'MARK_TOOL_SHOWN':
      return {
        ...state,
        shownTools: [...state.shownTools, action.tool]
      };

    case 'PAY_FOR_HINT': {
      if (action.cost > state.capital) {
        return state;
      }
      
      return {
        ...state,
        capital: state.capital - action.cost
      };
    }

    case 'RESET_GAME':
      return {
        ...initialState,
        availableTools: state.availableTools,  // Preserve unlocked tools
        shownTools: state.shownTools,  // Preserve shown tools history
        currentMarketSituation: null
      };

    case 'CLOSE_SCENARIO_COMPLETION_POPUP': {
      // Calculate current total value when closing the popup using the same method as the UI
      const holdingsValue = state.portfolio.reduce((total, item) => {
        const currentPrice = state.currentPrices[item.sector.name] || item.sector.currentPrice;
        return total + (currentPrice * item.quantity);
      }, 0);
      
      // Add cash to get total portfolio value
      const rawTotalValue = holdingsValue + state.capital;
      
      // Round to 2 decimal places to match UI calculation
      const totalValue = Math.round(rawTotalValue * 100) / 100;
      
      console.log('Closing scenario popup. Detailed calculation:');
      console.log('Holdings value:', holdingsValue);
      console.log('Cash on hand:', state.capital);
      console.log('Raw total:', rawTotalValue);
      console.log('Setting previousCapital for next scenario to:', totalValue);
      
      return {
        ...state,
        showScenarioCompletionPopup: false,
        // Update previousCapital for the next scenario when closing the popup
        previousCapital: totalValue
      };
    }

    case 'ADVANCE_TO_NEXT_SCENARIO': {
      const newSituationIndex = state.currentSituationIndex + 1;
      if (newSituationIndex >= marketSituations.length) {
        return state; // Don't advance if we're at the end
      }
      
      // Update the market situation index without using global state
      const newMarketSituation = marketSituations[newSituationIndex];
      
      // Füge Log hinzu, um den Start eines neuen Szenarios anzuzeigen
      console.log(`🎮 NEUES SZENARIO GESTARTET: Level ${newSituationIndex + 1}`);
      console.log(`📝 Beschreibung: ${newMarketSituation.description}`);
      
      // Aktualisiere den ActionTracker mit der neuen Szenario-ID
      ActionTracker.setCurrentScenario(newSituationIndex);
      console.log(`ActionTracker: Szenario-ID auf ${newSituationIndex} gesetzt`);
      
      return {
        ...state,
        currentSituationIndex: newSituationIndex,
        stepsInCurrentSituation: 0,
        marketSituation: {
          description: newMarketSituation.description,
          recommendedTool: newMarketSituation.recommendedTool,
          toolDescription: newMarketSituation.toolDescription,
          expectedOutcome: newMarketSituation.expectedOutcomes[0]
        },
        showScenarioCompletionPopup: false
      };
    }

    case 'SHOW_SCENARIO_COMPLETION_POPUP':
      console.log(`🏁 SZENARIO BEENDET: Level ${state.currentSituationIndex + 1}`);
      return {
        ...state,
        showScenarioCompletionPopup: true,
        isAutoProgressPaused: true
      };

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Beim ersten Laden des Spiels anzeigen, dass Level 1 gestartet wurde
  useEffect(() => {
    console.log(`🎮 SPIEL GESTARTET: Level 1`);
    console.log(`📝 Beschreibung: ${marketSituations[0].description}`);
    
    // Setze die Szenario-ID im ActionTracker auf 0 (Level 1)
    ActionTracker.setCurrentScenario(0);
    console.log(`ActionTracker: Szenario-ID auf 0 gesetzt (Level 1)`);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!state.isAutoProgressPaused) {
      timer = setInterval(() => {
        const now = Date.now();
        if (now - state.lastAutoUpdate >= 1000) { // Update every 1 second in play mode (changed from 3000)
          dispatch({ type: 'ADVANCE_TIME' });
        }
      }, 100); // Check every 100ms
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isAutoProgressPaused, state.lastAutoUpdate]);

  // Check game state and trigger consultations when necessary
  useEffect(() => {
    const totalValue = state.portfolio.reduce((total, item) => {
      const currentPrice = state.currentPrices[item.sector.name] || item.sector.currentPrice;
      return total + (currentPrice * item.quantity);
    }, state.capital);

    const initialValue = 100000; // Initial capital
    const lossPercentage = ((totalValue - initialValue) / initialValue) * 100;

    if (lossPercentage < -10 && state.mistakes > state.lastConsultation) {
      // Logic for consultation could be implemented here
      dispatch({ type: 'UPDATE_PRICES' }); // Reset prices after consultation
    }
  }, [state.portfolio, state.currentPrices, state.mistakes, state.lastConsultation, state.capital]);

  // Effect for displaying market situations and tools
  useEffect(() => {
    if (state.currentMarketSituation) {
      const situation = marketSituations.find(s => s.description === state.currentMarketSituation);
      if (situation) {
        console.log('New Market Situation:', state.currentMarketSituation);
        console.log('New Tool Available:', situation.toolDescription);
      }
    }
  }, [state.currentMarketSituation]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

/**
 * Debug-Funktion - Führt statistische Tests für das aktuelle Szenario aus und loggt sie in die Konsole
 * @param sectors Die Sektoren
 * @param situation Die aktuelle Marktsituation
 * @param priceHistory Die Preishistorie
 */
export function runDebugStatisticalTests(
  sectors: Sector[], 
  situation: MarketSituation, 
  priceHistory: {[sectorName: string]: {prices: number[], timestamp: number}}
): void {
  const { testCriteria } = situation;
  
  // Group sectors by name
  const sectorsByName = sectors.reduce((acc, sector) => {
    if (!acc[sector.name]) acc[sector.name] = [];
    acc[sector.name].push(sector);
    return acc;
  }, {} as Record<string, Sector[]>);
  
  // Get price changes for each sector
  const sectorNames = Object.keys(sectorsByName);
  
  const getReturns = (sectorName: string): number[] => {
    const history = priceHistory[sectorName];
    if (!history || history.prices.length < 2) return [];
    
    const returns: number[] = [];
    for (let i = 1; i < history.prices.length; i++) {
      const prevPrice = history.prices[i - 1];
      const currentPrice = history.prices[i];
      returns.push((currentPrice - prevPrice) / prevPrice);
    }
    return returns;
  };
  
  switch (testCriteria.type) {
    case 'T-Test': {
      // Compare tech sector returns with others
      const techReturns = situation.performanceGroups.positive
        .map(symbol => getReturns(symbol))
        .flat();
      const otherReturns = situation.performanceGroups.negative
        .map(symbol => getReturns(symbol))
        .flat();
      
      const pValue = performTTest(techReturns, otherReturns);
      console.log('Debug T-Test Results:', { pValue, significant: pValue < testCriteria.threshold });
      break;
    }
    
    case 'Chi-Square': {
      // Compare sector distribution changes
      const observed = sectorNames.map(sectorName => {
        const sectorGroup = sectorsByName[sectorName];
        return [
          sectorGroup.filter(s => situation.performanceGroups.positive.includes(s.name)).length,
          sectorGroup.filter(s => situation.performanceGroups.neutral.includes(s.name)).length,
          sectorGroup.filter(s => situation.performanceGroups.negative.includes(s.name)).length
        ];
      });
      
      // Calculate expected values (uniform distribution)
      const expected = sectorNames.map(sectorName => {
        const groupSize = sectorsByName[sectorName].length;
        return [groupSize/3, groupSize/3, groupSize/3];
      });
      
      const pValue = performChiSquareTest(observed, expected);
      console.log('Debug Chi-Square Test Results:', { pValue, significant: pValue < testCriteria.threshold });
      break;
    }
  }
} 