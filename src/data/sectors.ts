export interface Sector {
  name: string;
  description: string;
  currentPrice: number;
  historicalPrices: number[];
  volatility: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  growthRate: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  correlation: number;
}

export const sectors: Sector[] = [
  {
    name: 'Precious Metals',
    description: 'Gold, silver, and other valuable metals used for currency and jewelry',
    currentPrice: 150.00,
    historicalPrices: [145.00, 148.00, 152.00, 150.00],
    volatility: 0.25,
    marketCap: 1000000000,
    peRatio: 25.0,
    dividendYield: 0.5,
    growthRate: 0.15,
    riskLevel: 'High',
    correlation: 0.8
  },
  {
    name: 'Food & Beverages',
    description: 'Essential foodstuffs, spices, and beverages for daily consumption',
    currentPrice: 85.00,
    historicalPrices: [84.00, 84.50, 85.50, 85.00],
    volatility: 0.12,
    marketCap: 800000000,
    peRatio: 15.0,
    dividendYield: 2.0,
    growthRate: 0.05,
    riskLevel: 'Low',
    correlation: 0.4
  },
  {
    name: 'Armor & Weapons',
    description: 'Military equipment, armor, and weapons for defense and warfare',
    currentPrice: 120.00,
    historicalPrices: [118.00, 119.00, 121.00, 120.00],
    volatility: 0.20,
    marketCap: 900000000,
    peRatio: 18.0,
    dividendYield: 1.5,
    growthRate: 0.10,
    riskLevel: 'Medium',
    correlation: 0.7
  },
  {
    name: 'Agriculture & Livestock',
    description: 'Farming produce and livestock for food and materials',
    currentPrice: 95.00,
    historicalPrices: [94.00, 95.50, 96.00, 95.00],
    volatility: 0.15,
    marketCap: 750000000,
    peRatio: 12.0,
    dividendYield: 2.5,
    growthRate: 0.06,
    riskLevel: 'Medium',
    correlation: 0.6
  },
  {
    name: 'Craftsmanship & Technology',
    description: 'Advanced tools, machinery, and innovative craftsmanship',
    currentPrice: 110.00,
    historicalPrices: [108.00, 109.00, 111.00, 110.00],
    volatility: 0.18,
    marketCap: 700000000,
    peRatio: 20.0,
    dividendYield: 1.0,
    growthRate: 0.12,
    riskLevel: 'Medium',
    correlation: 0.65
  },
  {
    name: 'Jewelry & Gems',
    description: 'Precious stones and crafted jewelry for adornment',
    currentPrice: 200.00,
    historicalPrices: [195.00, 198.00, 202.00, 200.00],
    volatility: 0.22,
    marketCap: 600000000,
    peRatio: 22.0,
    dividendYield: 0.8,
    growthRate: 0.18,
    riskLevel: 'High',
    correlation: 0.75
  },
  {
    name: 'Medicine & Healing',
    description: 'Medicinal herbs, potions, and healing services',
    currentPrice: 130.00,
    historicalPrices: [128.00, 129.00, 131.00, 130.00],
    volatility: 0.16,
    marketCap: 550000000,
    peRatio: 16.0,
    dividendYield: 1.8,
    growthRate: 0.08,
    riskLevel: 'Medium',
    correlation: 0.5
  },
  {
    name: 'Transport & Logistics',
    description: 'Carriage services, shipping, and goods transportation',
    currentPrice: 100.00,
    historicalPrices: [98.00, 99.00, 101.00, 100.00],
    volatility: 0.20,
    marketCap: 500000000,
    peRatio: 14.0,
    dividendYield: 2.0,
    growthRate: 0.07,
    riskLevel: 'Medium',
    correlation: 0.7
  },
  {
    name: 'Exploration & Cartography',
    description: 'Map making, exploration services, and navigation tools',
    currentPrice: 140.00,
    historicalPrices: [138.00, 139.00, 141.00, 140.00],
    volatility: 0.24,
    marketCap: 450000000,
    peRatio: 19.0,
    dividendYield: 1.2,
    growthRate: 0.14,
    riskLevel: 'High',
    correlation: 0.6
  },
  {
    name: 'Construction Materials & Resources',
    description: 'Building materials, stone, wood, and construction resources',
    currentPrice: 90.00,
    historicalPrices: [88.00, 89.00, 91.00, 90.00],
    volatility: 0.15,
    marketCap: 400000000,
    peRatio: 13.0,
    dividendYield: 2.2,
    growthRate: 0.06,
    riskLevel: 'Medium',
    correlation: 0.5
  },
  {
    name: 'Fishing & Seafood',
    description: 'Fresh and preserved seafood products',
    currentPrice: 75.00,
    historicalPrices: [74.00, 74.50, 75.50, 75.00],
    volatility: 0.14,
    marketCap: 350000000,
    peRatio: 11.0,
    dividendYield: 2.8,
    growthRate: 0.04,
    riskLevel: 'Low',
    correlation: 0.4
  },
  {
    name: 'Textiles & Clothing',
    description: 'Fabric production and clothing manufacturing',
    currentPrice: 80.00,
    historicalPrices: [78.00, 79.00, 81.00, 80.00],
    volatility: 0.16,
    marketCap: 300000000,
    peRatio: 12.0,
    dividendYield: 2.5,
    growthRate: 0.05,
    riskLevel: 'Medium',
    correlation: 0.5
  },
  {
    name: 'Horse & Riding Services',
    description: 'Horse breeding, riding services, and equipment',
    currentPrice: 160.00,
    historicalPrices: [158.00, 159.00, 161.00, 160.00],
    volatility: 0.18,
    marketCap: 250000000,
    peRatio: 17.0,
    dividendYield: 1.5,
    growthRate: 0.09,
    riskLevel: 'Medium',
    correlation: 0.6
  },
  {
    name: 'Glassware & Mirrors',
    description: 'Glass products, mirrors, and decorative items',
    currentPrice: 110.00,
    historicalPrices: [108.00, 109.00, 111.00, 110.00],
    volatility: 0.20,
    marketCap: 200000000,
    peRatio: 15.0,
    dividendYield: 1.8,
    growthRate: 0.07,
    riskLevel: 'Medium',
    correlation: 0.5
  },
  {
    name: 'Music & Entertainment',
    description: 'Musical instruments, performances, and entertainment services',
    currentPrice: 95.00,
    historicalPrices: [94.00, 94.50, 95.50, 95.00],
    volatility: 0.22,
    marketCap: 150000000,
    peRatio: 14.0,
    dividendYield: 2.0,
    growthRate: 0.08,
    riskLevel: 'Medium',
    correlation: 0.6
  }
]; 