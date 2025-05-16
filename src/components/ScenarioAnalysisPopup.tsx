import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Collapse
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useGame } from '../contexts/GameContext';
import { getSectorPerformanceGroup } from '../models/SectorModel';
import { PerformanceGroup } from '../models/DataGenerationModel';

interface ScenarioAnalysisPopupProps {
  open: boolean;
  onClose: () => void;
  situationIndex: number;
}

// Helper function to determine performance change
const getPerformanceChange = (previousGroup: PerformanceGroup, currentGroup: PerformanceGroup): 'improved' | 'worsened' | 'stable' => {
  if (previousGroup === currentGroup) return 'stable';
  
  if (previousGroup === 'negative' && (currentGroup === 'neutral' || currentGroup === 'positive')) return 'improved';
  if (previousGroup === 'neutral' && currentGroup === 'positive') return 'improved';
  
  return 'worsened';
};

// Fantasy-themed explanations for sector performance
const getPerformanceExplanation = (sector: string, change: 'improved' | 'worsened' | 'stable', situation: string): string => {
  const explanations = {
    'Food & Beverages': {
      improved: [
        "Taverns overflow with mead and honey cakes as the festival season approaches.",
        "Elven bakers share their secret recipes, causing a surge in demand for their exquisite pastries.",
        "The Royal Court's announcement of a grand feast spurs tremendous growth in luxury food imports."
      ],
      worsened: [
        "Crop blights have withered the fields, driving up prices and reducing consumption.",
        "Goblin raids on trade caravans have disrupted the flow of exotic ingredients to the kingdom.",
        "Rumors of poison in imported wines cause taverns to empty and prices to plummet."
      ],
      stable: [
        "The steady demand for daily bread and ale keeps the market predictable.",
        "While some taverns struggle, others thrive, balancing the overall market impact.",
        "Traditional food suppliers maintain their consistent customer base despite market changes."
      ]
    },
    'Armor & Weapons': {
      improved: [
        "War drums echo across the realm, driving unprecedented demand for swords and shields.",
        "The royal army's expansion requires thousands of new armaments, boosting the sector.",
        "News of orc raids in the borderlands has every able citizen seeking protection."
      ],
      worsened: [
        "The peace treaty between rival kingdoms has dramatically reduced military spending.",
        "The discovery of ancient elven armor has flooded the market with superior alternatives.",
        "Royal blacksmiths offer their services at reduced rates, undercutting private craftsmen."
      ],
      stable: [
        "Regular militia training maintains constant demand for practice weapons and armor.",
        "While border skirmishes continue, no major conflicts drive significant market changes.",
        "The steady wear and replacement of guard equipment provides reliable market stability."
      ]
    },
    'Precious Metals': {
      improved: [
        "Deep in Moria's shadows, new mithril veins gleam with unprecedented promise.",
        "Royal minters work day and night to produce coins for the kingdom's expanding economy.",
        "Dwarven craftsmen have perfected new smithing techniques, creating high demand for gold and silver."
      ],
      worsened: [
        "The dragon's hoard released to the market floods trading posts with gold and gems.",
        "Counterfeit coins have shaken public trust in precious metal currency.",
        "Alchemists claim to have discovered gold transmutation, causing market panic."
      ],
      stable: [
        "Traditional jewelry demand maintains steady precious metal consumption.",
        "While new mines open, others deplete, creating a market balance.",
        "Royal treasury policies maintain stable precious metal prices across the realm."
      ]
    }
    // Add more sectors as needed
  };
  
  // Default explanations for sectors not specifically defined
  const defaultExplanations = {
    improved: [
      "Unexpected developments have significantly boosted this sector's performance.",
      "Remarkably favorable conditions create unprecedented opportunities in this market.",
      "Surprising demand surges drive exceptional growth in this area."
    ],
    worsened: [
      "Challenging circumstances have negatively impacted this sector's performance.",
      "Unforeseen complications create significant headwinds for businesses in this area.",
      "Shifting market dynamics have reduced opportunities in this sector."
    ],
    stable: [
      "Consistent patterns maintain this sector's reliable performance.",
      "Balanced forces keep this market in a predictable state despite wider changes.",
      "Neither particularly favored nor hindered by recent events, this sector continues steadily."
    ]
  };
  
  // Get explanations for the specific sector or use defaults
  const explanationSet = explanations[sector as keyof typeof explanations] || defaultExplanations;
  
  // Pick a random explanation from the appropriate set
  const options = explanationSet[change];
  return options[Math.floor(Math.random() * options.length)];
};

// Helper to get color based on performance group
const getPerformanceColor = (group: PerformanceGroup): string => {
  switch (group) {
    case 'positive':
      return '#43e294'; // green
    case 'negative':
      return '#e24343'; // red
    case 'neutral':
      return '#4a90e2'; // blue
    default:
      return '#ffffff'; // white
  }
};

// Helper to get performance feedback text based on profit percentage
const getPerformanceFeedback = (profitPercentage: number): { text: string; color: string } => {
  if (profitPercentage >= 5) {
    return {
      text: "Outstanding performance! Your investment strategy is yielding exceptional results.",
      color: '#43e294' // bright green
    };
  } else if (profitPercentage >= 2) {
    return {
      text: "Good job! Your investments are performing well in this market.",
      color: '#7ce243' // light green
    };
  } else if (profitPercentage >= 0) {
    return {
      text: "Modest gains. You're on the right track, but consider optimizing your strategy.",
      color: '#e2c943' // yellow
    };
  } else if (profitPercentage >= -3) {
    return {
      text: "Slight loss. The market proved challenging, but you limited your exposure well.",
      color: '#e29943' // orange
    };
  } else {
    return {
      text: "Significant losses. Consider revising your investment approach for the next scenario.",
      color: '#e24343' // red
    };
  }
};

export const ScenarioAnalysisPopup: React.FC<ScenarioAnalysisPopupProps> = ({ open, onClose, situationIndex }) => {
  const { state } = useGame();
  const [sectorPerformance, setSectorPerformance] = useState<Array<{
    sector: string;
    previousGroup: PerformanceGroup;
    currentGroup: PerformanceGroup;
    change: 'improved' | 'worsened' | 'stable';
    explanation: string;
  }>>([]);
  const [showSectorDetails, setShowSectorDetails] = useState(false);
  
  // Calculate current portfolio value (holdings + cash) - ensure it matches the UI value exactly
  const currentPortfolioValue = useMemo(() => {
    const holdingsValue = state.portfolio.reduce((total, item) => {
      const currentPrice = state.currentPrices[item.sector.name] || item.sector.currentPrice;
      return total + (currentPrice * item.quantity);
    }, 0);
    
    const totalValue = holdingsValue + state.capital;
    return Math.round(totalValue * 100) / 100;
  }, [state.portfolio, state.capital, state.currentPrices]);
  
  // Get the previous portfolio value from the start of this scenario
  const previousPortfolioValue = state.previousCapital;
  
  // Calculate profit/loss compared to previous scenario
  const profitLoss = currentPortfolioValue - previousPortfolioValue;
  const profitLossPercentage = previousPortfolioValue > 0 ? (profitLoss / previousPortfolioValue) * 100 : 0;
  
  // Get performance feedback
  const feedback = getPerformanceFeedback(profitLossPercentage);
  
  // Log detailed information when popup opens
  useEffect(() => {
    if (open) {
      console.log('--------------------------------');
      console.log('SCENARIO ANALYSIS POPUP OPENED');
      console.log('--------------------------------');
      console.log('Current situation index:', situationIndex);
      console.log('Previous portfolio value (from start of scenario):', previousPortfolioValue);
      
      // Log portfolio details
      console.log('Current portfolio:');
      let holdingsSum = 0;
      state.portfolio.forEach(item => {
        const itemValue = item.quantity * item.sector.currentPrice;
        holdingsSum += itemValue;
        console.log(`- ${item.sector.name}: ${item.quantity} units @ $${item.sector.currentPrice} = $${itemValue.toFixed(2)}`);
      });
      console.log('Cash on hand:', state.capital);
      console.log('Holdings value:', holdingsSum);
      console.log('Total value (holdings + cash):', holdingsSum + state.capital);
      console.log('Current total portfolio value (rounded):', currentPortfolioValue);
      
      console.log('Profit/Loss calculation:');
      console.log(`$${currentPortfolioValue.toFixed(2)} - $${previousPortfolioValue.toFixed(2)} = $${profitLoss.toFixed(2)} (${profitLossPercentage.toFixed(2)}%)`);
      console.log('--------------------------------');
    }
  }, [open, state.portfolio, state.capital, previousPortfolioValue, currentPortfolioValue, profitLoss, profitLossPercentage, situationIndex]);
  
  // Handle closing the popup - this is when the previousCapital should be updated for the next scenario
  const handleClose = () => {
    console.log('Closing scenario popup - this will update previousCapital for the next scenario');
    console.log('New previousCapital value will be:', currentPortfolioValue);
    onClose();
  };
  
  // Setup sector performance data when the popup opens
  useEffect(() => {
    if (!open) return;
    
    // Simulate previous and current performance groups for demonstration
    const allSectors = [
      'Food & Beverages',
      'Craftsmanship & Technology',
      'Transport & Logistics',
      'Medicine & Healing',
      'Music & Entertainment',
      'Textiles & Clothing',
      'Precious Metals',
      'Agriculture & Livestock',
      'Fishing & Seafood',
      'Glassware & Mirrors',
      'Horse & Riding Services',
      'Armor & Weapons',
      'Construction Materials & Resources',
      'Jewelry & Gems',
      'Exploration & Cartography'
    ];
    
    // Get the current situation description
    const currentSituation = state.marketSituation.description;
    
    // For each sector, determine previous and current performance groups
    const performanceData = allSectors.map(sector => {
      const currentGroup = getSectorPerformanceGroup(sector, situationIndex);
      
      // Simulate previous group based on current group
      let previousGroup: PerformanceGroup;
      if (currentGroup === 'positive') {
        previousGroup = Math.random() > 0.3 ? 'neutral' : 'negative';
      } else if (currentGroup === 'negative') {
        previousGroup = Math.random() > 0.3 ? 'neutral' : 'positive';
      } else {
        previousGroup = Math.random() > 0.5 ? 'positive' : 'negative';
      }
      
      const change = getPerformanceChange(previousGroup, currentGroup);
      const explanation = getPerformanceExplanation(sector, change, currentSituation);
      
      return {
        sector,
        previousGroup,
        currentGroup,
        change,
        explanation
      };
    });
    
    // Sort by change type - improved first, then stable, then worsened
    performanceData.sort((a, b) => {
      const order = { 'improved': 0, 'stable': 1, 'worsened': 2 };
      return order[a.change] - order[b.change];
    });
    
    setSectorPerformance(performanceData);
  }, [open, state.marketSituation.description, situationIndex]);
  
  const getChangeIcon = (change: 'improved' | 'worsened' | 'stable') => {
    switch (change) {
      case 'improved':
        return <TrendingUpIcon sx={{ color: '#43e294' }} />;
      case 'worsened':
        return <TrendingDownIcon sx={{ color: '#e24343' }} />;
      case 'stable':
        return <TrendingFlatIcon sx={{ color: '#4a90e2' }} />;
    }
  };
  
  // Event-Listener für das Schließen aller Popups
  useEffect(() => {
    const handleCloseAllPopups = () => {
      if (open) {
        onClose();
      }
    };
    const handleCloseScenarioAnalysisPopup = () => {
      if (open) {
        onClose();
      }
    };
    
    // Event-Listener hinzufügen
    window.addEventListener('closeAllPopups', handleCloseAllPopups);
    window.addEventListener('closeScenarioAnalysisPopup', handleCloseScenarioAnalysisPopup);
    
    // Event-Listener entfernen, wenn die Komponente unmountet
    return () => {
      window.removeEventListener('closeAllPopups', handleCloseAllPopups);
      window.removeEventListener('closeScenarioAnalysisPopup', handleCloseScenarioAnalysisPopup);
    };
  }, [open, onClose]);
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1e1e1e',
          color: 'white',
          height: '90vh',
          maxHeight: '90vh',
          position: 'fixed',
          top: '80px',
          overflow: 'hidden',
          zIndex: 2000
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #4a90e2',
        py: 1
      }}>
        <Typography 
          variant="h6" 
          component="div"
          sx={{
            color: '#e2a343',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            padding: '10px 16px',
            backgroundColor: 'rgba(226, 163, 67, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(226, 163, 67, 0.3)',
            boxShadow: '0 0 8px rgba(226, 163, 67, 0.2)',
            maxWidth: '90%',
            lineHeight: 1.4,
          }}
        >
          Scenario Complete - Performance Analysis
        </Typography>
        <IconButton 
          onClick={handleClose}
          sx={{ 
            color: 'white',
            '&:hover': {
              color: '#ff4444'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, height: '100%', maxHeight: 'calc(90vh - 64px)', overflowY: 'auto' }}>
        {/* Profit/Loss Overview */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 4, 
            backgroundColor: profitLoss >= 0 ? 'rgba(67, 226, 148, 0.1)' : 'rgba(226, 67, 67, 0.1)', 
            borderRadius: 2,
            border: `1px solid ${profitLoss >= 0 ? 'rgba(67, 226, 148, 0.3)' : 'rgba(226, 67, 67, 0.3)'}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOnIcon 
                sx={{ 
                  fontSize: 48, 
                  color: profitLoss >= 0 ? '#43e294' : '#e24343',
                  mr: 2
                }} 
              />
              <Box>
                <Typography variant="h6" sx={{ color: profitLoss >= 0 ? '#43e294' : '#e24343', fontWeight: 'bold' }}>
                  {profitLoss >= 0 ? 'Profit Made!' : 'Loss Incurred'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#ccc' }}>
                  Level start value: ${previousPortfolioValue.toFixed(2)}
                </Typography>
                <Typography variant="body1" sx={{ color: '#ccc' }}>
                  Level end value: ${currentPortfolioValue.toFixed(2)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: profitLoss >= 0 ? '#43e294' : '#e24343',
                    fontWeight: 'bold',
                  }}
                >
                  {profitLoss >= 0 ? '+' : ''}${Math.abs(profitLoss).toFixed(2)}
                </Typography>
                {profitLoss >= 0 
                  ? <TrendingUpIcon sx={{ ml: 1, fontSize: 30, color: '#43e294' }} /> 
                  : <TrendingDownIcon sx={{ ml: 1, fontSize: 30, color: '#e24343' }} />
                }
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: profitLoss >= 0 ? 'rgba(67, 226, 148, 0.8)' : 'rgba(226, 67, 67, 0.8)',
                }}
              >
                {profitLoss >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
          
          {/* Performance Feedback */}
          <Paper sx={{ 
            p: 2, 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            borderLeft: `4px solid ${feedback.color}`,
            mt: 2
          }}>
            <Typography variant="body1" sx={{ color: feedback.color, fontWeight: 'medium' }}>
              {feedback.text}
            </Typography>
          </Paper>
        </Paper>
        
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#2a2a2a', border: '1px solid #4a90e2' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#e2a343', mb: 1 }}>
            Scenario Complete
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic', color: '#ccc' }}>
            {state.marketSituation.description}
          </Typography>
        </Paper>
        
        {/* Toggleable Sector Analysis */}
        <Paper sx={{ p: 2, backgroundColor: '#2a2a2a', border: '1px solid #4a90e2', mb: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer' 
            }}
            onClick={() => setShowSectorDetails(!showSectorDetails)}
          >
            <Typography variant="h6" sx={{ color: '#e2a343' }}>
              Sector Performance Details
            </Typography>
            {showSectorDetails ? 
              <ExpandLessIcon sx={{ color: '#4a90e2' }} /> : 
              <ExpandMoreIcon sx={{ color: '#4a90e2' }} />
            }
          </Box>
          
          <Collapse in={showSectorDetails}>
            <Divider sx={{ my: 2, backgroundColor: '#4a90e2', opacity: 0.3 }} />
            <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
              As market conditions shifted, different sectors responded in distinct ways. Here's how each sector's performance changed during this scenario.
            </Typography>
            
            <Grid container spacing={2}>
              {sectorPerformance.map((item, index) => (
                <Grid item xs={12} key={index}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#2a2a2a',
                      borderLeft: `4px solid ${
                        item.change === 'improved' 
                          ? '#43e294' 
                          : item.change === 'worsened' 
                            ? '#e24343' 
                            : '#4a90e2'
                      }`,
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {item.sector}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getChangeIcon(item.change)}
                        <Typography 
                          variant="subtitle2"
                          sx={{ 
                            color: item.change === 'improved' 
                              ? '#43e294' 
                              : item.change === 'worsened' 
                                ? '#e24343' 
                                : '#4a90e2'
                          }}
                        >
                          {item.change.charAt(0).toUpperCase() + item.change.slice(1)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1, backgroundColor: '#555' }} />
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                          Previous Performance:
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'rgba(0,0,0,0.2)', 
                          p: 1, 
                          borderRadius: 1,
                          border: `1px solid ${getPerformanceColor(item.previousGroup)}`,
                          color: getPerformanceColor(item.previousGroup)
                        }}>
                          {item.previousGroup.charAt(0).toUpperCase() + item.previousGroup.slice(1)}
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                          Current Performance:
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'rgba(0,0,0,0.2)', 
                          p: 1, 
                          borderRadius: 1,
                          border: `1px solid ${getPerformanceColor(item.currentGroup)}`,
                          color: getPerformanceColor(item.currentGroup)
                        }}>
                          {item.currentGroup.charAt(0).toUpperCase() + item.currentGroup.slice(1)}
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 1.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontStyle: 'italic', 
                          color: '#ddd',
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #555'
                        }}
                      >
                        "{item.explanation}"
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleClose}
            sx={{ 
              minWidth: 200,
              borderColor: '#4a90e2',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(226, 163, 67, 0.8)'
              }
            }}
          >
            Continue to Next Scenario
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}; 