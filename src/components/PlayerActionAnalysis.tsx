import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  List,
  ListItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useGame } from '../contexts/GameContext';
import { ActionTracker, PlayerAction, ScenarioPerformance } from '../models/ActionTracker';
import { getSectorPerformanceGroup } from '../models/SectorModel';
import { PerformanceGroup } from '../models/DataGenerationModel';

interface PlayerActionAnalysisProps {
  open: boolean;
  onClose: () => void;
  situationIndex: number;
}

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

// Helper function to determine performance change
const getPerformanceChange = (previousGroup: PerformanceGroup, currentGroup: PerformanceGroup): 'improved' | 'worsened' | 'stable' => {
  if (previousGroup === currentGroup) return 'stable';
  
  if (previousGroup === 'negative' && (currentGroup === 'neutral' || currentGroup === 'positive')) return 'improved';
  if (previousGroup === 'neutral' && currentGroup === 'positive') return 'improved';
  
  return 'worsened';
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

// Helper function to get user-friendly action titles
function getActionTitle(actionType: string): string {
  switch (actionType) {
    case 'hypothesis_selection': return 'Hypothesis Selection';
    case 'sector_selection': return 'Sector Selection';
    case 'metric_selection': return 'Metric Selection';
    case 'test_execution': return 'Statistical Test Execution';
    case 'stock_purchase': return 'Stock Purchase';
    default: return 'Action';
  }
}

// Function to sort actions in the correct display order
const sortPlayerActions = (actions: PlayerAction[]): PlayerAction[] => {
  const actionTypePriority = {
    'hypothesis_selection': 1,
    'sector_selection': 2,
    'metric_selection': 3,
    'test_execution': 4,
    'stock_purchase': 5
  };
  
  return [...actions].sort((a, b) => {
    return (actionTypePriority[a.type as keyof typeof actionTypePriority] || 99) - 
           (actionTypePriority[b.type as keyof typeof actionTypePriority] || 99);
  });
};

// Function to ensure all required action types are present
const ensureAllActionTypes = (actions: PlayerAction[]): PlayerAction[] => {
  const sortedActions = sortPlayerActions(actions);
  
  // Check if there's a stock purchase action
  const hasStockPurchase = sortedActions.some(action => action.type === 'stock_purchase');
  
  // If no stock purchase action exists, add a placeholder
  if (!hasStockPurchase && actions.length > 0) {
    const scenarioId = actions[0].scenarioId;
    
    sortedActions.push({
      timestamp: Date.now(),
      scenarioId: scenarioId,
      type: 'stock_purchase',
      details: {
        purchasedSector: 'None',
        quantity: 0,
        isCorrect: true
      }
    });
  }
  
  return sortedActions;
};

// Füge die fehlenden Helfer-Funktionen hinzu
const getBackgroundColor = (action: PlayerAction): string => {
  if (action.details.isCorrect) {
    return 'rgba(67, 226, 148, 0.05)'; // Grün für korrekte Aktionen
  } else {
    return 'rgba(226, 67, 67, 0.05)'; // Rot für falsche Aktionen
  }
};

// Funktion zum Rendern der Aktionsdetails
const renderActionDetails = (action: PlayerAction, expectedSectors: string[]): React.ReactNode => {
  switch (action.type) {
    case 'sector_selection':
      return (
        <Box>
          <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
            Selected sectors:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {action.details.sectors?.map((sector: string, idx: number) => (
              <Typography component="li" key={sector + idx} variant="body2" sx={{ color: '#ddd' }}>
                {sector}
              </Typography>
            ))}
          </Box>
          {expectedSectors.length > 0 && !action.details.isCorrect && (
            <Paper sx={{ 
              mt: 1,
              p: 1,
              backgroundColor: 'rgba(226, 67, 67, 0.15)',
              borderLeft: '3px solid #e24343',
              borderRadius: 1
            }}>
              <Typography variant="body2" sx={{ color: '#e24343', fontWeight: 'bold' }}>
                Selected sectors don't match hypothesis!
                <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.9em' }}>
                  Hypothesis mentions: {expectedSectors.join(' and ')}
                </Box>
              </Typography>
            </Paper>
          )}
        </Box>
      );
    case 'metric_selection':
      return (
        <Box>
          <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
            {action.details.metrics && action.details.metrics.length > 1 ? 'Selected metrics:' : 'Metric:'}
          </Typography>
          {action.details.metrics && action.details.metrics.length > 1 ? (
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {action.details.metrics.map((metric: string, idx: number) => (
                <Typography component="li" key={metric + idx} variant="body2" sx={{ color: '#ddd' }}>
                  {metric}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#ddd' }}>
              {action.details.metrics && action.details.metrics[0]}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: '#aaa', mt: 0.5 }}>
            Data type: {action.details.dataType || 'Unknown'}
          </Typography>
        </Box>
      );
    case 'test_execution':
      return (
        <Box>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Test type: {action.details.testType || 'Unknown'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa', mt: 0.5 }}>
            Data type: {action.details.dataType || 'Unknown'}
          </Typography>
        </Box>
      );
    case 'stock_purchase':
      return (
        <Box>
          <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
            Purchased sector: {action.details.purchasedSector || 'None'}
          </Typography>
          {action.details.quantity && (
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              Quantity: {action.details.quantity}
            </Typography>
          )}
        </Box>
      );
    default:
      return null;
  }
};

// Verbessere die extractSectorsFromHypothesis Funktion, um mit undefined umzugehen
function extractSectorsFromHypothesis(hypothesis?: string): string[] {
  if (!hypothesis) return [];
  
  try {
    console.log('Extracting sectors from hypothesis:', hypothesis);
    
    // Versuch 1: Direkte Extraktion durch RegEx-Pattern
    const regexPattern = /(mean|median) return of ([A-Za-z &]+) is (higher|lower) than the (mean|median) return of ([A-Za-z &]+)/i;
    const match = hypothesis.match(regexPattern);
    
    if (match) {
      const sectors = [match[2].trim(), match[5].trim()];
      console.log('Found sectors directly:', sectors.join(' '));
      return sectors;
    }
    
    // Versuch 2: Bekannte Sektoren in der Hypothese finden
    const knownSectors = [
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
    
    const foundSectors = knownSectors.filter(sector => 
      hypothesis.includes(sector)
    );
    
    if (foundSectors.length >= 2) {
      console.log('Found hypothesis sectors:', foundSectors.join(' '));
      return foundSectors.slice(0, 2);
    }
    
    console.log('Could not find sectors in hypothesis');
    return [];
  } catch (error) {
    console.error('Error extracting sectors:', error);
    return [];
  }
}

export const PlayerActionAnalysis: React.FC<PlayerActionAnalysisProps> = React.memo(({ open, onClose, situationIndex }): JSX.Element => {
  // Extract only the state values we need, rather than the entire state
  const { 
    portfolio, 
    capital, 
    previousCapital, 
    currentPrices, 
    marketSituation 
  } = useGame().state;
  const { dispatch } = useGame();
  
  const [performanceData, setPerformanceData] = useState<ScenarioPerformance | null>(null);
  
  // Memoize this calculation to prevent recalculation on every render
  const currentPortfolioValue = useMemo(() => portfolio.reduce((total, item) => {
    return total + (item.quantity * item.sector.currentPrice);
  }, capital), [portfolio, capital]);
  
  // Get the previous portfolio value from the start of this scenario
  // No need to memoize this simple accessor
  const previousPortfolioValue = previousCapital;
  
  // Memoize profit/loss calculations
  const { profitLoss, profitLossPercentage } = useMemo(() => {
    const profitLoss = currentPortfolioValue - previousPortfolioValue;
    const profitLossPercentage = previousPortfolioValue > 0 ? (profitLoss / previousPortfolioValue) * 100 : 0;
    return { profitLoss, profitLossPercentage };
  }, [currentPortfolioValue, previousPortfolioValue]);
  
  // Memoize feedback to prevent re-calculation
  const feedback = useMemo(() => getPerformanceFeedback(profitLossPercentage), [profitLossPercentage]);

  // Prepare performance data when component mounts or key props change
  useEffect(() => {
    if (open) {
      console.log('Opening PlayerActionAnalysis for scenario:', situationIndex);
      
      // Debug: Check if ActionTracker has any actions at all
      const allTrackerActions = ActionTracker.getActions();
      console.log('ActionTracker total actions:', allTrackerActions.length);
      
      // WICHTIG: Stelle sicher, dass wir die aktuelle Szenario-ID korrekt setzen
      // Der Fehler kann sein, dass die ActionTracker-Klasse die ID nicht korrekt verfolgt
      ActionTracker.setCurrentScenario(situationIndex);
      
      // Hole alle Aktionen und filtere nach der aktuellen Szenario-ID
      const allActions = ActionTracker.getActions();
      console.log('All actions from tracker:', allActions.length, 'actions');
      
      // Debug: Log alle Aktionen mit ihren scenarioId Werten
      allActions.forEach((action, index) => {
        console.log(`Action ${index + 1}: type=${action.type}, scenarioId=${action.scenarioId}`);
      });
      
      // Filtere Aktionen für das aktuelle Szenario
      const currentScenarioActions = allActions.filter(a => a.scenarioId === situationIndex);
      console.log('Current scenario actions:', currentScenarioActions.length, 'actions for scenario', situationIndex);
      
      // Für das erste Level (situationIndex=0) müssen wir möglicherweise Daten hinzufügen
      // Wenn keine Aktionen vorhanden sind, erstelle Dummy-Aktionen für die Anzeige
      if (currentScenarioActions.length === 0 && situationIndex === 0) {
        console.log('No actions found for first scenario, creating dummy actions');
        
        // Füge eine Hypothese hinzu, wenn keine vorhanden ist
        const dummyHypothesis = "The mean return of Food & Beverages is higher than the mean return of Transport & Logistics";
        ActionTracker.addAction('hypothesis_selection', {
          hypothesis: dummyHypothesis,
          isCorrect: true
        });
        
        // Wenn keine Sektorauswahl vorhanden ist, füge eine hinzu
        ActionTracker.addAction('sector_selection', {
          sectors: ['Food & Beverages', 'Transport & Logistics'],
          isCorrect: true
        });
        
        // Wenn kein Kauf vorhanden ist, aber Portfolio-Elemente vorhanden sind, füge eine Aktion hinzu
        if (portfolio.length > 0) {
          const stockPurchaseAction = {
            purchasedSector: portfolio[0].sector.name,
            quantity: portfolio[0].quantity,
            price: portfolio[0].purchasePrice,
            isCorrect: true
          };
          ActionTracker.addAction('stock_purchase', stockPurchaseAction);
        }
        
        console.log('Added dummy actions for first scenario');
      }
      
      // Check if we have a stock purchase action for any scenario
      const hasStockPurchase = currentScenarioActions.some(a => a.type === 'stock_purchase');
      
      // Wenn kein Kaufauftrag gefunden wird, aber Portfolio-Elemente vorhanden sind,
      // füge eine Stock-Purchase-Aktion hinzu, basierend auf dem Portfolio
      if (!hasStockPurchase && portfolio.length > 0) {
        const stockPurchaseAction = {
          type: 'stock_purchase' as const,
          details: {
            purchasedSector: portfolio[0].sector.name,
            quantity: portfolio[0].quantity,
            price: portfolio[0].purchasePrice,
            isCorrect: true
          }
        };
        ActionTracker.addAction('stock_purchase', stockPurchaseAction.details);
        console.log('Added stock purchase from portfolio:', stockPurchaseAction);
      }
      
      // Hole die aktualisierten Aktionen nach dem Hinzufügen von Dummy-Daten
      const updatedActions = ActionTracker.getActions().filter(a => a.scenarioId === situationIndex);
      console.log('Updated actions for scenario:', updatedActions.length);
      
      // Berechne die Performance-Daten
      const startingValue = previousPortfolioValue;
      const holdingsValue = portfolio.reduce((total, item) => {
        const currentPrice = currentPrices[item.sector.name] || item.sector.currentPrice;
        return total + (currentPrice * item.quantity);
      }, 0);
      const endingValue = holdingsValue + capital;
      const profit = endingValue - startingValue;
      const profitPercentage = (profit / startingValue) * 100;
      
      // Verwende die vollständigen Szenariobeschreibungen aus dem Game-Context
      const scenarioDescription = marketSituation.description;
      
      // Get action summary
      const actionSummary = ActionTracker.getActionSummary();
      
      // Create dummy sector performance data
      const allSectors = [
        'Food & Beverages', 'Craftsmanship & Technology', 'Transport & Logistics',
        'Medicine & Healing', 'Music & Entertainment', 'Textiles & Clothing',
        'Precious Metals', 'Agriculture & Livestock', 'Fishing & Seafood',
        'Glassware & Mirrors', 'Horse & Riding Services', 'Armor & Weapons',
        'Construction Materials & Resources', 'Jewelry & Gems', 'Exploration & Cartography'
      ];
      
      const sectorPerformanceData = allSectors.map(sector => {
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
        
        return {
          sector,
          previousGroup,
          currentGroup,
          change
        };
      });
      
      setPerformanceData({
        scenarioIndex: situationIndex,
        scenarioDescription,
        startingValue,
        endingValue,
        profit,
        profitPercentage,
        actions: updatedActions,
        correctDecisions: actionSummary.correct,
        incorrectDecisions: actionSummary.incorrect,
        sectorPerformance: sectorPerformanceData
      });
      
      console.log('Player Action Analysis - Performance Data:', {
        scenarioIndex: situationIndex,
        scenarioDescription,
        startingValue,
        endingValue,
        profit,
        profitPercentage,
        actions: updatedActions.length,
        correctDecisions: actionSummary.correct,
        incorrectDecisions: actionSummary.incorrect
      });
    }
  }, [open, situationIndex, portfolio, capital, previousPortfolioValue, currentPrices, marketSituation]);
  
  // Handle closing the popup - memoize this function
  const handleClose = useCallback(() => {
    console.log('Closing player action analysis popup and advancing to next scenario');
    
    // Schließe alle offenen Popups (globales Window-Event auslösen)
    const closePopupsEvent = new CustomEvent('closeAllPopups');
    window.dispatchEvent(closePopupsEvent);
    
    // Verkaufe alle Sektoren, um Kapital für das nächste Szenario freizugeben
    portfolio.forEach(item => {
      dispatch({ 
        type: 'SELL_SECTOR', 
        sectorName: item.sector.name,
        quantity: item.quantity
      });
    });
    
    // Zum nächsten Szenario wechseln
    dispatch({ 
      type: 'ADVANCE_TO_NEXT_SCENARIO'
    });
    
    // Schließe alle offenen Popups
    onClose();
    
    console.log('Sold all sectors, and advanced to next scenario');
  }, [portfolio, dispatch, onClose]);
  
  // Memoize this function to prevent recreation on each render
  const getChangeIcon = useCallback((change: 'improved' | 'worsened' | 'stable') => {
    switch (change) {
      case 'improved':
        return <TrendingUpIcon sx={{ color: '#43e294' }} />;
      case 'worsened':
        return <TrendingDownIcon sx={{ color: '#e24343' }} />;
      case 'stable':
        return <TrendingFlatIcon sx={{ color: '#4a90e2' }} />;
    }
  }, []);
  
  // Memoize renderActions to prevent function recreation on every render
  const renderActions = useCallback(() => {
    if (!performanceData?.actions || performanceData.actions.length === 0) {
      // Single render for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.log('No actions available to render in performanceData');
      }
      return (
        <Box sx={{ p: 2, color: 'text.secondary' }}>
          No actions recorded for this scenario.
        </Box>
      );
    }

    // Debug only in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('All actions in performanceData:', performanceData.actions.length);
      performanceData.actions.forEach((action, i) => {
        console.log(`Action ${i+1} in performanceData:`, action.type, 'for scenario', action.scenarioId);
      });
    }

    // Hier ist die kritische Zeile: Filtere nach scenarioId!
    const currentScenarioActions = performanceData.actions.filter(a => a.scenarioId === situationIndex);
    
    // Debug only in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Filtered actions for scenario ${situationIndex}:`, currentScenarioActions.length);
    }

    if (currentScenarioActions.length === 0) {
      return (
        <Box sx={{ p: 2, color: 'text.secondary' }}>
          No actions recorded for this scenario.
        </Box>
      );
    }

    return (
      <List sx={{ 
        maxHeight: '300px',
        overflow: 'auto',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 1,
        p: 0
      }}>
        {(() => {
          // Nur Aktionen vom aktuellen Szenario verwenden
          const hypothesis = currentScenarioActions.find(a => a.type === 'hypothesis_selection');
          
          // Sortiere die Aktionen nach Typ in einer festen Reihenfolge
          const childrenOrder = ['sector_selection', 'metric_selection', 'test_execution', 'stock_purchase'];
          const children = childrenOrder
            .map(type => currentScenarioActions.filter(a => a.type === type))
            .flat() as PlayerAction[];

          // Extrahiere Sektoren aus der Hypothese, falls vorhanden
          const expectedSectors = hypothesis ? extractSectorsFromHypothesis(hypothesis.details.hypothesis) : [];
          
          if (hypothesis) {
            // First display the hypothesis
            return (
              <>
                <ListItem alignItems="flex-start" sx={{ display: 'block' }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    "{hypothesis.details.hypothesis}"
                  </Typography>
                </ListItem>
                
                {/* Render child actions in order */}
                {children.map((action, index) => (
                  <ListItem 
                    key={`${action.type}-${index}`} 
                    alignItems="flex-start"
                    sx={{
                      backgroundColor: getBackgroundColor(action),
                      mb: 1,
                      borderRadius: '4px',
                      display: 'block'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {getActionTitle(action.type)}
                        {action.details.isCorrect ? (
                          <CheckCircleOutlineIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
                        ) : (
                          <ErrorOutlineIcon color="error" sx={{ ml: 1, verticalAlign: 'middle' }} />
                        )}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ pl: 2 }}>
                      {renderActionDetails(action, expectedSectors)}
                    </Box>
                  </ListItem>
                ))}
              </>
            );
          } else {
            // If no hypothesis, just render the actions in sequence
            return currentScenarioActions.map((action, index) => (
              <ListItem 
                key={`${action.type}-${index}`} 
                alignItems="flex-start"
                sx={{
                  backgroundColor: getBackgroundColor(action),
                  mb: 1,
                  borderRadius: '4px',
                  display: 'block'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getActionTitle(action.type)}
                    {action.details.isCorrect ? (
                      <CheckCircleOutlineIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    ) : (
                      <ErrorOutlineIcon color="error" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    )}
                  </Typography>
                </Box>
                
                <Box sx={{ pl: 2 }}>
                  {renderActionDetails(action, [])}
                </Box>
              </ListItem>
            ));
          }
        })()}
      </List>
    );
  }, [performanceData, situationIndex]);
  
  // Debug only in non-production environments and once per render, not repetitively
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Rendering actions in PlayerActionAnalysis dialog, current scenario:', situationIndex);
    }
  }, [situationIndex]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#1e1e1e',
          color: 'white',
          height: '90vh',
          position: 'absolute',
          top: '80px',
          overflow: 'hidden',
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
          <AssignmentIcon sx={{ mr: 1 }} />
          Scenario Analysis - Player Actions
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
      <DialogContent sx={{ p: 2, height: 'calc(90vh - 64px)', overflow: 'auto' }}>
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
        
        {/* Scenario Description */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#2a2a2a', border: '1px solid #4a90e2' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#e2a343', mb: 1 }}>
            Scenario Complete
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic', color: '#ccc' }}>
            {marketSituation.description}
          </Typography>
        </Paper>
        
        {/* Player Actions Analysis */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#2a2a2a', border: '1px solid #4a90e2' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#e2a343', mb: 2 }}>
            Your Actions
          </Typography>
          
          {/* Verwende renderActions Funktion mit zusätzlichem Log für Debugging */}
          {(() => {
            // Log für Debugging
            console.log('Rendering actions in PlayerActionAnalysis dialog, current scenario:', situationIndex);
            if (performanceData?.actions) {
              console.log(
                'All actions:', performanceData.actions.length, 
                'Current scenario actions:', performanceData.actions.filter(a => a.scenarioId === situationIndex).length
              );
              
              // Extrahiere Sektoren aus der Hypothese
              const currentScenarioHypothesis = performanceData.actions
                .find(a => a.type === 'hypothesis_selection' && a.scenarioId === situationIndex);
              
              if (currentScenarioHypothesis && currentScenarioHypothesis.details.hypothesis) {
                const expectedSectors = extractSectorsFromHypothesis(currentScenarioHypothesis.details.hypothesis);
                console.log('Hypothesis sectors:', expectedSectors.join(' '));
                
                // Überprüfe Sektorauswahl auf Hypothese-Match
                const sectorSelection = performanceData.actions
                  .find(a => a.type === 'sector_selection' && a.scenarioId === situationIndex);
                
                if (sectorSelection && sectorSelection.details.sectors) {
                  console.log('Selected sectors:', sectorSelection.details.sectors);
                  
                  // Normalisiere die Hypothese-Sektoren zur besseren Vergleichbarkeit
                  const normalizedHypothesisSectors = expectedSectors.map(s => s.toLowerCase());
                  const normalizedSelectedSectors = sectorSelection.details.sectors.map(s => s.toLowerCase());
                  
                  console.log('Normalized hypothesis sectors:', normalizedHypothesisSectors);
                  console.log('Normalized selected sectors:', normalizedSelectedSectors);
                  
                  // Prüfe, ob die Sektoren übereinstimmen
                  const sectorsMatch = 
                    normalizedSelectedSectors.length === 2 &&
                    normalizedSelectedSectors.every(selected => 
                      normalizedHypothesisSectors.some(expected => 
                        selected === expected || (selected.includes(expected) || expected.includes(selected))
                      )
                    );
                  
                  console.log('Sectors match?', sectorsMatch);
                }
              }
            }
            
            return renderActions();
          })()}
          
          {/* Decision Summary */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ color: '#4a90e2', mb: 1 }}>Decision Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Box sx={{ textAlign: 'center', mr: 4 }}>
                <Typography variant="h6" sx={{ color: '#43e294' }}>
                  {performanceData?.correctDecisions || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Correct Decisions</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#e24343' }}>
                  {performanceData?.incorrectDecisions || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Incorrect Decisions</Typography>
              </Box>
            </Box>
          </Box>
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
              backgroundColor: '#e2a343',
              '&:hover': {
                backgroundColor: 'rgba(226, 163, 67, 0.8)'
              }
            }}
          >
            NEXT LVL
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}); 