export interface Sector {
  name: string;
  description: string;
  currentPrice: number;
  volatility: number;
  beta: number;
}

export const sectors: Sector[] = [
  {
    name: "Technology",
    description: "Companies focused on software, hardware, and IT services",
    currentPrice: 150.00,
    volatility: 0.25,
    beta: 1.2
  },
  {
    name: "Healthcare",
    description: "Medical devices, pharmaceuticals, and healthcare services",
    currentPrice: 120.00,
    volatility: 0.18,
    beta: 0.9
  },
  {
    name: "Finance",
    description: "Banks, insurance, and financial services",
    currentPrice: 85.00,
    volatility: 0.22,
    beta: 1.1
  },
  {
    name: "Consumer Goods",
    description: "Retail, food, and consumer products",
    currentPrice: 65.00,
    volatility: 0.15,
    beta: 0.8
  },
  {
    name: "Industry",
    description: "Manufacturing, construction, and industrial services",
    currentPrice: 95.00,
    volatility: 0.20,
    beta: 1.0
  },
  {
    name: "Energy",
    description: "Oil, gas, and renewable energy",
    currentPrice: 75.00,
    volatility: 0.28,
    beta: 1.3
  },
  {
    name: "Materials",
    description: "Mining, chemicals, and raw materials",
    currentPrice: 55.00,
    volatility: 0.24,
    beta: 1.2
  },
  {
    name: "Utilities",
    description: "Electric, water, and gas utilities",
    currentPrice: 45.00,
    volatility: 0.12,
    beta: 0.6
  },
  {
    name: "Telecommunications",
    description: "Phone, internet, and communication services",
    currentPrice: 70.00,
    volatility: 0.16,
    beta: 0.9
  }
];

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
}

export const stocks: Stock[] = [
  // Technology
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", currentPrice: 173.50 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", currentPrice: 378.85 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", currentPrice: 142.65 },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", currentPrice: 875.35 },
  { symbol: "SAP", name: "SAP SE", sector: "Technology", currentPrice: 173.76 },

  // Finance
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Finance", currentPrice: 183.27 },
  { symbol: "BAC", name: "Bank of America Corp.", sector: "Finance", currentPrice: 35.68 },
  { symbol: "V", name: "Visa Inc.", sector: "Finance", currentPrice: 279.87 },
  { symbol: "MA", name: "Mastercard Inc.", sector: "Finance", currentPrice: 475.83 },
  { symbol: "AXA", name: "AXA SA", sector: "Finance", currentPrice: 32.45 },

  // Healthcare
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", currentPrice: 158.18 },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare", currentPrice: 27.76 },
  { symbol: "NVS", name: "Novartis AG", sector: "Healthcare", currentPrice: 98.67 },
  { symbol: "ROG", name: "Roche Holding AG", sector: "Healthcare", currentPrice: 238.95 },
  { symbol: "SAN", name: "Sanofi", sector: "Healthcare", currentPrice: 87.34 },

  // Consumer Goods
  { symbol: "PG", name: "Procter & Gamble Co.", sector: "Consumer Goods", currentPrice: 160.95 },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer Goods", currentPrice: 59.48 },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer Goods", currentPrice: 172.73 },
  { symbol: "NESN", name: "Nestlé SA", sector: "Consumer Goods", currentPrice: 94.85 },
  { symbol: "MC", name: "LVMH", sector: "Consumer Goods", currentPrice: 853.90 },

  // Industry
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industry", currentPrice: 358.75 },
  { symbol: "BA", name: "Boeing Co.", sector: "Industry", currentPrice: 203.36 },
  { symbol: "HON", name: "Honeywell International Inc.", sector: "Industry", currentPrice: 198.43 },
  { symbol: "SIE", name: "Siemens AG", sector: "Industry", currentPrice: 179.88 },
  { symbol: "AIR", name: "Airbus SE", sector: "Industry", currentPrice: 158.92 },

  // Energy
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", currentPrice: 113.55 },
  { symbol: "CVX", name: "Chevron Corp.", sector: "Energy", currentPrice: 155.55 },
  { symbol: "SHEL", name: "Shell PLC", sector: "Energy", currentPrice: 65.34 },
  { symbol: "BP", name: "BP PLC", sector: "Energy", currentPrice: 38.65 },
  { symbol: "TTE", name: "TotalEnergies SE", sector: "Energy", currentPrice: 64.89 },

  // Telecommunications
  { symbol: "T", name: "AT&T Inc.", sector: "Telecommunications", currentPrice: 17.15 },
  { symbol: "VZ", name: "Verizon Communications Inc.", sector: "Telecommunications", currentPrice: 40.87 },
  { symbol: "DTE", name: "Deutsche Telekom AG", sector: "Telecommunications", currentPrice: 22.35 },
  { symbol: "TEF", name: "Telefónica SA", sector: "Telecommunications", currentPrice: 4.12 },
  { symbol: "ORAN", name: "Orange SA", sector: "Telecommunications", currentPrice: 11.45 },

  // Materials
  { symbol: "BHP", name: "BHP Group Ltd.", sector: "Materials", currentPrice: 63.45 },
  { symbol: "RIO", name: "Rio Tinto PLC", sector: "Materials", currentPrice: 65.78 },
  { symbol: "VALE", name: "Vale SA", sector: "Materials", currentPrice: 12.87 },
  { symbol: "LIN", name: "Linde PLC", sector: "Materials", currentPrice: 462.75 },
  { symbol: "SQM", name: "Sociedad Química y Minera de Chile", sector: "Materials", currentPrice: 47.23 },

  // Utilities
  { symbol: "NEE", name: "NextEra Energy Inc.", sector: "Utilities", currentPrice: 57.98 },
  { symbol: "DUK", name: "Duke Energy Corp.", sector: "Utilities", currentPrice: 94.87 },
  { symbol: "ENEL", name: "Enel SpA", sector: "Utilities", currentPrice: 6.23 },
  { symbol: "ENGI", name: "Engie SA", sector: "Utilities", currentPrice: 15.34 },
  { symbol: "IBE", name: "Iberdrola SA", sector: "Utilities", currentPrice: 11.78 }
]; 