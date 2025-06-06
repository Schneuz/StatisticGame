import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useGame } from '../contexts/GameContext';
import { ActionTracker, PlayerAction, ScenarioPerformance } from '../models/ActionTracker';
import { getSectorPerformanceGroup } from '../models/SectorModel';
import { PerformanceGroup } from '../models/DataGenerationModel';
import { validateMetrics, validateTestForMetrics, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMetricType, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MetricType 
} from '../utils/MetricsValidator';
import { log } from '../utils/logging';

interface PlayerActionAnalysisProps {
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

// Helper to get performance feedback text based on profit percentage
const getPerformanceFeedback = (profit: number): { text: string; color: string } => {
  if (profit > 1000) {
    return {
      text: "Positive results. Nice one!",
      color: '#43e294'
    };
  } else if (profit < -1000) {
    return {
      text: "Negative results. Try to make decisions according to the statistical test.",
      color: '#e24343'
    };
  } else {
    return {
      text: "Neutral performance. Your result is close to break-even.",
      color: '#e2c943'
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

// Füge die fehlenden Helfer-Funktionen hinzu
const getBackgroundColor = (action: PlayerAction): string => {
  if (action.details.isCorrect) {
    return 'rgba(67, 226, 148, 0.05)'; // Grün für korrekte Aktionen
  } else {
    return 'rgba(226, 67, 67, 0.05)'; // Rot für falsche Aktionen
  }
};

// Funktion zum Rendern der Aktionsdetails
const renderActionDetails = (action: PlayerAction, expectedSectors: string[], scenarioIndex: number): React.ReactNode => {
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
      // Prüfe, ob die Metriken mit der Hypothese übereinstimmen
      const metricsAreValid = action.details.isCorrect !== false;
      const metrics = action.details.metrics || [];
      
      return (
        <Box>
          <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
            {metrics && metrics.length > 1 ? 'Selected metrics:' : 'Metric:'}
          </Typography>
          {metrics && metrics.length > 1 ? (
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {metrics.map((metric: string, idx: number) => (
                <Typography component="li" key={metric + idx} variant="body2" sx={{ color: '#ddd' }}>
                  {metric}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#ddd' }}>
              {metrics && metrics[0]}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: '#aaa', mt: 0.5 }}>
            Data type: {action.details.dataType || 'Unknown'}
          </Typography>
          {!metricsAreValid && action.details.errorMessage && (
            <Paper sx={{ 
              mt: 1,
              p: 1,
              backgroundColor: 'rgba(226, 67, 67, 0.15)',
              borderLeft: '3px solid #e24343',
              borderRadius: 1
            }}>
              <Typography variant="body2" sx={{ color: '#e24343', fontWeight: 'bold' }}>
                {action.details.errorMessage || ''}
              </Typography>
            </Paper>
          )}
        </Box>
      );
    case 'test_execution': {
      let testHint = '';
      const metricsTest = action.details.metrics;
      const testType = (action.details.testType || '').toLowerCase();
      const numericalMetrics = ['Mean Return', 'Median Return', 'Mean Gain', 'Mean Loss'];
      const categoricalMetrics = ['Positive Return Days', 'Negative Return Days', 'High Volatility Days'];
      let isCorrectTest = true;
      if (metricsTest && metricsTest.length === 2) {
        const isFirstNumerical = numericalMetrics.includes(metricsTest[0]);
        const isSecondNumerical = numericalMetrics.includes(metricsTest[1]);
        const isFirstCategorical = categoricalMetrics.includes(metricsTest[0]);
        const isSecondCategorical = categoricalMetrics.includes(metricsTest[1]);
        if (isFirstNumerical && isSecondNumerical) {
          testHint = 'You chose numerical data, use T-Test.';
          if (testType !== 't-test') {
            isCorrectTest = false;
          }
        } else if (isFirstCategorical && isSecondCategorical) {
          testHint = 'You chose categorical data, use Chi-Square test.';
          if (testType !== 'chi-square') {
            isCorrectTest = false;
          }
        } else {
          // Mixed types: immer Fehler, egal welcher Test
          testHint = "Use the same metrics, and don't mix up categorical and numerical metrics.";
          isCorrectTest = false;
        }
      } else if (metricsTest && metricsTest.length === 1) {
        // Nur eine Metrik gewählt: Prüfe, ob Testtyp zum Typ passt
        const isNumerical = numericalMetrics.includes(metricsTest[0]);
        const isCategorical = categoricalMetrics.includes(metricsTest[0]);
        if (isNumerical && testType !== 't-test') {
          testHint = 'Numerical metric selected, use T-Test.';
          isCorrectTest = false;
        } else if (isCategorical && testType !== 'chi-square') {
          testHint = 'Categorical metric selected, use Chi-Square test.';
          isCorrectTest = false;
        }
      }
      action.details.isCorrect = isCorrectTest;
      return (
        <Box>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Test type: {action.details.testType || 'Unknown'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa', mt: 0.5 }}>
            Data type: {action.details.dataType || 'Unknown'}
          </Typography>
          {testHint && (
            <Paper sx={{ mt: 1, p: 1, backgroundColor: isCorrectTest ? 'rgba(34, 50, 60, 0.15)' : 'rgba(226, 67, 67, 0.15)', borderLeft: isCorrectTest ? '3px solid #2196f3' : '3px solid #e24343', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: isCorrectTest ? '#2196f3' : '#e24343', fontWeight: 'bold' }}>{testHint}</Typography>
            </Paper>
          )}
        </Box>
      );
    }
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
  const feedback = useMemo(() => getPerformanceFeedback(profitLoss), [profitLoss]);

  // Prepare performance data when component mounts or key props change
  useEffect(() => {
    if (open) {
      log('Opening PlayerActionAnalysis for scenario:', situationIndex);
      
      // Stelle sicher, dass wir die aktuelle Szenario-ID korrekt setzen
      ActionTracker.setCurrentScenario(situationIndex);
      
      // Hole alle Aktionen und filtere nach der aktuellen Szenario-ID
      const allActions = ActionTracker.getActions();
      
      // Filtere Aktionen für das aktuelle Szenario
      let currentScenarioActions = allActions.filter(a => a.scenarioId === situationIndex);
      log('Current scenario actions:', currentScenarioActions.length);

      // Validierung für test_execution-Aktionen
      currentScenarioActions = currentScenarioActions.map(action => {
        if (action.type === 'test_execution') {
          const metricsTest = action.details.metrics;
          const testType = (action.details.testType || '').toLowerCase();
          
          if (metricsTest && metricsTest.length > 0) {
            // Validiere Metriken
            const metricsValidation = validateMetrics(metricsTest);
            // Validiere Test für diese Metriken
            const testValidation = validateTestForMetrics(testType, metricsValidation.metricType);
            
            return { 
              ...action, 
              details: { 
                ...action.details, 
                isCorrect: testValidation.isValid,
                errorMessage: testValidation.errorMessage 
              } 
            };
          }
        }
        return action;
      });
      
      // Validierung für metric_selection-Aktionen
      currentScenarioActions = currentScenarioActions.map(action => {
        if (action.type === 'metric_selection') {
          const metrics = action.details.metrics;
          
          if (metrics && metrics.length > 0) {
            // Verwende zentrale Validierungsfunktion
            const validationResult = validateMetrics(metrics);
            
            return { 
              ...action, 
              details: { 
                ...action.details, 
                isCorrect: validationResult.isValid,
                errorMessage: validationResult.errorMessage 
              } 
            };
          }
        }
        return action;
      });
      
      // Decision Summary nur für das aktuelle Szenario berechnen
      const correctDecisions = currentScenarioActions.filter(a => a.details.isCorrect).length;
      const incorrectDecisions = currentScenarioActions.filter(a => a.details.isCorrect === false).length;
      
      // Für das erste Level (situationIndex=0) müssen wir möglicherweise Daten hinzufügen
      // Wenn keine Aktionen vorhanden sind, erstelle Dummy-Aktionen für die Anzeige
      if (currentScenarioActions.length === 0 && situationIndex === 0) {
        log('No actions found for first scenario, creating dummy actions');
        
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
            isCorrect: true
          };
          ActionTracker.addAction('stock_purchase', stockPurchaseAction);
        }
      }
      
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
        actions: currentScenarioActions, // Nur aktuelle Szenario-Aktionen
        correctDecisions,
        incorrectDecisions,
        sectorPerformance: sectorPerformanceData
      });
      
      log('Performance Data prepared for scenario:', situationIndex);
    }
  }, [open, situationIndex, portfolio, capital, previousPortfolioValue, currentPrices, marketSituation]);
  
  // Handle closing the popup - memoize this function
  const handleClose = useCallback(() => {
    log('Closing player action analysis popup and advancing to next scenario');
    
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
    
    // Aktionen für das aktuelle Szenario löschen
    ActionTracker.clearScenarioActions(situationIndex);
    
    // Zum nächsten Szenario wechseln
    dispatch({ 
      type: 'ADVANCE_TO_NEXT_SCENARIO'
    });
    
    // Öffne das Popup für das neue Szenario direkt
    dispatch({ type: 'SHOW_SCENARIO_COMPLETION_POPUP' });
    
    // Schließe alle offenen Popups
    onClose();
  }, [portfolio, dispatch, onClose, situationIndex]);
  
  // Memoize renderActions to prevent function recreation on every render
  const renderActions = useCallback(() => {
    if (!performanceData?.actions || performanceData.actions.length === 0) {
      return (
        <Box sx={{ p: 2, color: 'text.secondary' }}>
          No actions recorded for this scenario.
        </Box>
      );
    }

    // Filtere Aktionen für das aktuelle Szenario
    const currentScenarioActions = performanceData.actions.filter(a => a.scenarioId === situationIndex);

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
            .map(type => {
              const actionsOfType = currentScenarioActions.filter(a => a.type === type);
              return actionsOfType.length > 0 ? [actionsOfType[actionsOfType.length - 1]] : [];
            })
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
                      {renderActionDetails(action, expectedSectors, situationIndex)}
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
                  {renderActionDetails(action, [], situationIndex)}
                </Box>
              </ListItem>
            ));
          }
        })()}
      </List>
    );
  }, [performanceData, situationIndex]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          zIndex: 2000,
          background: 'linear-gradient(135deg, #23272f 80%, #43e294 120%)',
          color: 'white',
          border: '2px solid #43e294',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(67,226,148,0.15)',
          minHeight: 600,
          maxHeight: '90vh',
          position: 'fixed',
          top: '90px',
          display: 'flex',
          flexDirection: 'column',
          p: 0
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #43e294',
          py: 1,
          background: 'rgba(34, 50, 60, 0.7)',
          position: 'relative'
        }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              color: '#43e294',
              fontWeight: 'bold',
              fontSize: '1.25rem',
              lineHeight: 1.4,
              textAlign: 'center',
              width: '100%'
            }}
          >
            Scenario Analysis - Player Actions
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'white',
              position: 'absolute',
              right: 16,
              top: 12,
              '&:hover': {
                color: '#ff4444'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Box sx={{ flex: 1, overflow: 'auto', width: '100%' }}>
          <DialogContent sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
            {/* Profit/Loss Overview */}
            <Paper
              sx={{
                p: 3,
                mb: 4,
                background: profitLoss >= 0 ? 'rgba(67, 226, 148, 0.10)' : 'rgba(226, 67, 67, 0.10)',
                borderRadius: 3,
                border: `1.5px solid ${profitLoss >= 0 ? '#43e294' : '#e24343'}`,
                boxShadow: '0 2px 12px rgba(67,226,148,0.10)',
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
            <Paper sx={{ p: 2, mb: 3, background: 'rgba(34, 50, 60, 0.7)', border: '1.5px solid #43e294', borderRadius: 3, boxShadow: '0 2px 12px rgba(67,226,148,0.10)' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#43e294', mb: 1 }}>
                Scenario Complete
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic', color: '#ccc' }}>
                {marketSituation.description}
              </Typography>
            </Paper>
            
            {/* Player Actions Analysis */}
            <Paper sx={{ p: 2, mb: 3, background: 'rgba(34, 50, 60, 0.7)', border: '1.5px solid #2196f3', borderRadius: 3, boxShadow: '0 2px 12px rgba(33,150,243,0.10)' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#2196f3', mb: 2 }}>
                Your Actions
              </Typography>
              
              {/* Verwende renderActions Funktion mit zusätzlichem Log für Debugging */}
              {(() => {
                // Log für Debugging
                log('Rendering actions in PlayerActionAnalysis dialog, current scenario:', situationIndex);
                if (performanceData?.actions) {
                  log(
                    'All actions:', performanceData.actions.length, 
                    'Current scenario actions:', performanceData.actions.filter(a => a.scenarioId === situationIndex).length
                  );
                  
                  // Extrahiere Sektoren aus der Hypothese
                  const currentScenarioHypothesis = performanceData.actions
                    .find(a => a.type === 'hypothesis_selection' && a.scenarioId === situationIndex);
                  
                  if (currentScenarioHypothesis && currentScenarioHypothesis.details.hypothesis) {
                    const expectedSectors = extractSectorsFromHypothesis(currentScenarioHypothesis.details.hypothesis);
                    log('Hypothesis sectors:', expectedSectors.join(' '));
                    
                    // Überprüfe Sektorauswahl auf Hypothese-Match
                    const sectorSelection = performanceData.actions
                      .find(a => a.type === 'sector_selection' && a.scenarioId === situationIndex);
                    
                    if (sectorSelection && sectorSelection.details.sectors) {
                      log('Selected sectors:', sectorSelection.details.sectors);
                      
                      // Normalisiere die Hypothese-Sektoren zur besseren Vergleichbarkeit
                      const normalizedHypothesisSectors = expectedSectors.map(s => s.toLowerCase());
                      const normalizedSelectedSectors = sectorSelection.details.sectors.map(s => s.toLowerCase());
                      
                      log('Normalized hypothesis sectors:', normalizedHypothesisSectors);
                      log('Normalized selected sectors:', normalizedSelectedSectors);
                      
                      // Prüfe, ob die Sektoren übereinstimmen
                      const sectorsMatch = 
                        normalizedSelectedSectors.length === 2 &&
                        normalizedSelectedSectors.every(selected => 
                          normalizedHypothesisSectors.some(expected => 
                            selected === expected || (selected.includes(expected) || expected.includes(selected))
                          )
                        );
                      
                      log('Sectors match?', sectorsMatch);
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
                fullWidth
                sx={{
                  maxWidth: 300,
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  py: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #43e294 60%, #2196f3 100%)',
                  boxShadow: '0 2px 12px rgba(67,226,148,0.15)',
                  color: '#fff',
                  letterSpacing: 1,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #2196f3 60%, #43e294 100%)',
                    color: '#fff'
                  }
                }}
                onClick={handleClose}
              >
                NEXT LVL
              </Button>
            </Box>
          </DialogContent>
        </Box>
      </Box>
    </Dialog>
  );
}); 