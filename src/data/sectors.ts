export interface Sector {
  name: string;
  currentPrice: number;
  description: string;
  icon: string;
  historicalPrices: number[];
}

export const sectors: Sector[] = [
  {
    name: 'Food & Beverages',
    currentPrice: 100,
    description: 'Essential goods for daily life',
    icon: '🍖',
    historicalPrices: []
  },
  {
    name: 'Precious Metals',
    currentPrice: 100,
    description: 'Valuable metals and minerals',
    icon: '💎',
    historicalPrices: []
  },
  {
    name: 'Armor & Weapons',
    currentPrice: 100,
    description: 'Military equipment and defense',
    icon: '⚔️',
    historicalPrices: []
  },
  {
    name: 'Transport & Logistics',
    currentPrice: 100,
    description: 'Movement of goods and people',
    icon: '🚛',
    historicalPrices: []
  },
  {
    name: 'Medicine & Healing',
    currentPrice: 100,
    description: 'Healthcare and remedies',
    icon: '💊',
    historicalPrices: []
  },
  {
    name: 'Construction Materials & Resources',
    currentPrice: 100,
    description: 'Building materials and resources',
    icon: '🏗️',
    historicalPrices: []
  },
  {
    name: 'Agriculture & Livestock',
    currentPrice: 100,
    description: 'Farming and animal husbandry',
    icon: '🌾',
    historicalPrices: []
  },
  {
    name: 'Craftsmanship & Technology',
    currentPrice: 100,
    description: 'Skilled crafts and innovations',
    icon: '⚒️',
    historicalPrices: []
  },
  {
    name: 'Fishing & Seafood',
    currentPrice: 100,
    description: 'Marine resources and fishing',
    icon: '🐟',
    historicalPrices: []
  },
  {
    name: 'Textiles & Clothing',
    currentPrice: 100,
    description: 'Fabric and garments',
    icon: '🧵',
    historicalPrices: []
  },
  {
    name: 'Horse & Riding Services',
    currentPrice: 100,
    description: 'Equestrian services and supplies',
    icon: '🐎',
    historicalPrices: []
  },
  {
    name: 'Glassware & Mirrors',
    currentPrice: 100,
    description: 'Glass products and mirrors',
    icon: '🥂',
    historicalPrices: []
  },
  {
    name: 'Music & Entertainment',
    currentPrice: 100,
    description: 'Musical instruments and entertainment',
    icon: '🎵',
    historicalPrices: []
  },
  {
    name: 'Jewelry & Gems',
    currentPrice: 100,
    description: 'Precious jewelry and gemstones',
    icon: '💍',
    historicalPrices: []
  },
  {
    name: 'Exploration & Cartography',
    currentPrice: 100,
    description: 'Maps and exploration services',
    icon: '🗺️',
    historicalPrices: []
  }
]; 