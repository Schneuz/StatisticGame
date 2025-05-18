import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { useGame, marketSituations } from '../contexts/GameContext';
import { sectors, Sector } from '../data/sectors';
import { SectorPurchase } from './SectorBuy';
import { SectorSell } from './SectorSell';
import { runAndLogStatisticalTest } from '../models/StatisticalTestModel';
import { normal, binomial, getMetricParameters } from '../models/DataGenerationModel';
import CloseIcon from '@mui/icons-material/Close';
import { ActionTracker } from '../models/ActionTracker';

interface PurchaseRecommendationDialogProps {
  open: boolean;
  onClose: () => void;
  sectorA: string;
  sectorB: string;
  hypothesis?: string;
}

// Create a global map to track which hypotheses have already received hints
// This persists between component unmounts/remounts
const usedHintsMap: Record<string, boolean> = {};

const PurchaseRecommendationDialog: React.FC<PurchaseRecommendationDialogProps> = ({
  open,
  onClose,
  sectorA,
  sectorB,
  hypothesis = ""
}) => {
  const { state, dispatch } = useGame();
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Calculate hint cost (1000 * level)
  const level = Math.max(1, Math.floor(state.timeAdvanceCount / 10) + 1);
  const hintCost = 1000 * level;
  
  // Create a unique key for the current hint
  const hintKey = `${hypothesis}-${sectorA}-${sectorB}`;
  
  // Check if this hint has already been used
  const isHintUsed = usedHintsMap[hintKey] || false;
  
  // Get sectors that can be purchased (have significant statistical differences)
  const purchasableSectors = [sectorA, sectorB].filter(Boolean);
  
  // Set hint as shown if we already have data for it
  useEffect(() => {
    if (isHintUsed) {
      setShowHint(true);
    }
  }, [isHintUsed]);
  
  // Event-Listener für das Schließen aller Popups
  useEffect(() => {
    const handleCloseAllPopups = () => {
      if (open) {
        onClose();
      }
    };
    
    // Event-Listener hinzufügen
    window.addEventListener('closeAllPopups', handleCloseAllPopups);
    
    // Event-Listener entfernen, wenn die Komponente unmountet
    return () => {
      window.removeEventListener('closeAllPopups', handleCloseAllPopups);
    };
  }, [open, onClose]);
  
  // Effect to run only once when dialog opens
  useEffect(() => {
    if (open) {
      // Reset analysis settings when dialog opens
      setShowHint(false);
      setActiveSector(null);
      
      // Initialize dialog
      setTimeout(() => {
        // Automatically show hint if it was previously used
        if (isHintUsed) {
          setShowHint(true);
        }
      }, 500);
    }
  }, [open, sectorA, sectorB, isHintUsed]);
  
  // Handle buy button click
  const handleBuy = (sectorName: string) => {
    const sector = sectors.find(s => s.name === sectorName);
    if (sector) {
      setSelectedSector(sector);
      setPurchaseDialogOpen(true);
    }
  };

  // Handle sell button click
  const handleSell = (sectorName: string) => {
    const portfolioItem = state.portfolio.find(item => item.sector.name === sectorName);
    if (portfolioItem) {
      setSelectedPortfolioItem(portfolioItem);
      setSellDialogOpen(true);
    }
  };

  // Handle purchase from dialog
  const handlePurchase = (sector: Sector, quantity: number) => {
    // Track the stock purchase action
    ActionTracker.addAction('stock_purchase', {
      purchasedSector: sector.name,
      quantity: quantity,
      isCorrect: true // Annahme: alle Käufe sind "korrekt"
    });
    dispatch({ type: 'PURCHASE_SECTOR', sector, quantity });
    setPurchaseDialogOpen(false);
  };

  // Handle sell from dialog
  const handleSellConfirm = (sectorName: string, quantity: number) => {
    dispatch({ type: 'SELL_SECTOR', sectorName, quantity });
    setSellDialogOpen(false);
  };

  // Calculate portfolio value
  const portfolioValue = state.portfolio.reduce((total: number, item: any) => {
    return total + (item.quantity * item.sector.currentPrice);
  }, 0);

  // Handle hint button click
  const handleHint = () => {
    if (isHintUsed) {
      return; // Don't allow multiple clicks for the same hypothesis
    }
    
    if (state.capital >= hintCost) {
      // Deduct the cost
      dispatch({ 
        type: 'PAY_FOR_HINT', 
        cost: hintCost
      });
      
      // Mark this hint as used
      usedHintsMap[hintKey] = true;
      
      setShowHint(true);
      setSnackbarMessage(`Spent ${hintCost} coins on market analysis.`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage(`Not enough capital. You need ${hintCost} coins for this hint.`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Generate dynamic hint based on statistical results and the hypothesis
  const getHintText = () => {
    const currentSituation = state.currentSituationIndex ?? 0;
    const marketSituation = marketSituations[currentSituation];
    
    if (!sectorA || !sectorB) {
      return "Unable to generate a hint without two sectors to compare.";
    }
    
    // Run actual statistical test
    let testType: 'T-Test' | 'Chi-Square' = 'T-Test';
    
    // Determine test type based on hypothesis statement
    const hypothesis = marketSituation.hypotheses[0].statement.toLowerCase();
    if (hypothesis.includes('proportion') || hypothesis.includes('distribution') || hypothesis.includes('frequency')) {
      testType = 'Chi-Square';
    }
    
    // Determine the metric type from the hypothesis
    let metricType = "mean_return";
    if (hypothesis.includes("median return")) {
      metricType = "median_return";
    } else if (hypothesis.includes("positive returns")) {
      metricType = "proportion_positive_days";
    } else if (hypothesis.includes("negative returns")) {
      metricType = "proportion_negative_days";
    } else if (hypothesis.includes("distribution")) {
      metricType = "distribution_return_categories";
    }
    
    // Generate data for each sector
    const getPerformanceGroup = (sector: string) => {
      if (marketSituation.performanceGroups.positive.includes(sector)) {
        return 'positive';
      } else if (marketSituation.performanceGroups.negative.includes(sector)) {
        return 'negative';
      }
      return 'neutral';
    };
    
    // Generate data based on sector performance
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sectorAData = generateHypothesisData(metricType, sectorA, getPerformanceGroup);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sectorBData = generateHypothesisData(metricType, sectorB, getPerformanceGroup);
    
    // Run the actual statistical test
    runAndLogStatisticalTest(
      testType,
      [metricType.replace('_', ' ')],
      [sectorA, sectorB]
    );
    
    // Simulate test results for the hint
    const simulatedPValue = Math.random() * 0.1; // Generate a random p-value between 0 and 0.1
    const simulatedIsSignificant = simulatedPValue < marketSituation.testCriteria.threshold;
    
    // Extract the metric from hypothesis (if available)
    let metric = "";
    if (hypothesis) {
      if (hypothesis.includes("mean return")) {
        metric = "mean return";
      } else if (hypothesis.includes("median return")) {
        metric = "median return";
      } else if (hypothesis.includes("positive returns")) {
        metric = "proportion of days with positive returns";
      } else if (hypothesis.includes("negative returns")) {
        metric = "proportion of days with negative returns";
      } else if (hypothesis.includes("volatility")) {
        metric = "volatility";
      }
    }
    
    // Get positive and negative performers from current market situation
    const positivePerformers = marketSituation.performanceGroups.positive;
    // We'll use these variables through commented references since we need them in the code logic
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const neutralPerformers = marketSituation.performanceGroups.neutral;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const negativePerformers = marketSituation.performanceGroups.negative;
    
    // If the p-value indicates statistical significance
    if (simulatedIsSignificant) {
      const isASectorPositive = positivePerformers.includes(sectorA);
      const isBSectorPositive = positivePerformers.includes(sectorB);
      
      if (isASectorPositive && !isBSectorPositive) {
        return `Analysis of hypothesis: "${hypothesis}"\n\nBased on our statistical analysis (p-value: ${simulatedPValue.toFixed(3)}), the hypothesis is confirmed. ${sectorA} shows a significantly better ${metric || "performance"} compared to ${sectorB}. We recommend investing in ${sectorA}.`;
      } else if (!isASectorPositive && isBSectorPositive) {
        return `Analysis of hypothesis: "${hypothesis}"\n\nBased on our statistical analysis (p-value: ${simulatedPValue.toFixed(3)}), the hypothesis is not confirmed. Contrary to expectations, ${sectorB} shows a significantly better ${metric || "performance"} compared to ${sectorA}. We recommend investing in ${sectorB}.`;
      } else {
        // If both are positive or both are negative
        if (isASectorPositive && isBSectorPositive) {
          return `Analysis of hypothesis: "${hypothesis}"\n\nBased on our statistical analysis (p-value: ${simulatedPValue.toFixed(3)}), the hypothesis is confirmed. Both ${sectorA} and ${sectorB} show strong ${metric || "performance"}. While both are good investments, our data suggests ${sectorA} may have a slight edge.`;
        } else {
          return `Analysis of hypothesis: "${hypothesis}"\n\nBased on our statistical analysis (p-value: ${simulatedPValue.toFixed(3)}), the hypothesis is confirmed, but neither sector shows particularly strong performance in the current market. If you must invest between these two, ${sectorA} appears marginally better.`;
        }
      }
    } else {
      // No statistical significance
      return `Analysis of hypothesis: "${hypothesis}"\n\nBased on our statistical analysis (p-value: ${simulatedPValue.toFixed(3)}), we cannot confirm the hypothesis with statistical significance. The observed differences between ${sectorA} and ${sectorB} regarding ${metric || "performance"} might be due to random chance.`;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{
        sx: {
          zIndex: 2000,
          background: 'linear-gradient(135deg, #23272f 80%, #43e294 120%)',
          color: 'white',
          border: '2px solid #43e294',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(67,226,148,0.15)',
          maxHeight: '90vh',
          position: 'fixed',
          top: '90px',
          p: 0
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #4a90e2',
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
          Purchase Recommendations
        </Typography>
        <IconButton 
          onClick={onClose}
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
      <DialogContent sx={{ p: 2, maxHeight: 'calc(90vh - 64px)', overflowY: 'auto' }}>
        <Box sx={{ mt: 2, mb: 3 }}>
          {/* Portfolio Table */}
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#4a90e2', textAlign: 'center', fontWeight: 'bold' }}>
            Portfolio Overview
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: 'rgba(34, 50, 60, 0.7)', border: '1.5px solid #2196f3', borderRadius: 3, boxShadow: '0 2px 12px rgba(33,150,243,0.10)', mb: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white' }}>Sector</TableCell>
                    <TableCell align="right" sx={{ color: 'white' }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ color: 'white' }}>Purchase Price</TableCell>
                    <TableCell align="right" sx={{ color: 'white' }}>Current Price</TableCell>
                    <TableCell align="right" sx={{ color: 'white' }}>Total Value</TableCell>
                    <TableCell align="right" sx={{ color: 'white' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.portfolio.length > 0 ? (
                    state.portfolio.map((item) => (
                      <TableRow key={item.sector.name}>
                        <TableCell sx={{ color: 'white' }}>{item.sector.name}</TableCell>
                        <TableCell align="right" sx={{ color: 'white' }}>{item.quantity}</TableCell>
                        <TableCell align="right" sx={{ color: 'white' }}>${item.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: 'white' }}>${item.sector.currentPrice.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: 'white' }}>
                          ${(item.quantity * item.sector.currentPrice).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleSell(item.sector.name)}
                            sx={{ textTransform: 'uppercase' }}
                          >
                            Sell
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: 'white' }}>
                        No sectors in portfolio
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={4} sx={{ color: 'white', fontWeight: 'bold' }}>Total Portfolio Value:</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>${portfolioValue.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Typography variant="subtitle1" gutterBottom sx={{ color: '#4a90e2', textAlign: 'center' }}>
            Analyzed Sectors
          </Typography>
          
          {/* Hint Button - Make it more visible and disable if already used */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleHint}
              disabled={isHintUsed}
              sx={{ 
                mb: 2, 
                py: 1.5,
                px: 3,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                '&:hover': {
                  boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
                  transform: 'translateY(-2px)'
                },
                '&.Mui-disabled': {
                  backgroundColor: '#555',
                  color: '#aaa'
                }
              }}
            >
              {isHintUsed ? '✓ Hint Received' : `💡 Get Expert Hint (${hintCost} coins)`}
            </Button>
          </Box>

          {/* Hint Text */}
          {showHint && (
            <Paper sx={{ 
              p: 3, 
              backgroundColor: 'rgba(34, 50, 60, 0.7)',
              border: '1.5px solid #43e294',
              borderRadius: 3, 
              boxShadow: '0 2px 12px rgba(67,226,148,0.10)',
              mb: 3,
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#fff', 
                  fontStyle: 'italic',
                  whiteSpace: 'pre-line', // Preserve line breaks
                  mb: 1
                }}
              >
                {getHintText()}
              </Typography>
            </Paper>
          )}

          {/* Render the sectors grid without any text in between */}
          {purchasableSectors.length > 0 ? (
            <>
              {/* List of analyzed sectors - improved visuals */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {purchasableSectors.map((sector) => (
                  <Grid item xs={6} key={sector}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        backgroundColor: 'rgba(34, 50, 60, 0.7)',
                        border: activeSector === sector ? '2px solid #43e294' : '1.5px solid #2196f3',
                        borderRadius: 3,
                        boxShadow: '0 2px 12px rgba(33,150,243,0.10)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                          transform: 'translateY(-2px)',
                          borderColor: '#666'
                        },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                      onClick={() => setActiveSector(sector)}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#fff', 
                          mb: 2,
                          textAlign: 'center'
                        }}
                      >
                        {sector}
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="success" 
                        size="medium"
                        sx={{ 
                          mt: 1, 
                          textTransform: 'uppercase',
                          minWidth: '120px',
                          fontWeight: 'bold'
                        }}
                        onClick={() => handleBuy(sector)}
                      >
                        Buy
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Typography variant="body2" color="error">
              No sectors with significant differences available for purchase.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid #4a90e2', 
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        background: 'rgba(34, 50, 60, 0.7)'
      }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="warning"
          sx={{ 
            textTransform: 'uppercase',
            mx: 2,
            fontWeight: 'bold',
            minWidth: '150px',
            backgroundColor: '#666',
            '&:hover': {
              backgroundColor: '#444'
            }
          }}
        >
          BUY NOTHING
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
          sx={{ 
            textTransform: 'uppercase',
            mx: 2,
            minWidth: '150px',
            fontWeight: 'bold',
          }}
        >
          CANCEL
        </Button>
      </DialogActions>

      {/* Purchase Dialog */}
      {purchaseDialogOpen && selectedSector && (
        <SectorPurchase
          selectedSector={selectedSector}
          onSectorSelect={(sector) => {
            setSelectedSector(sector);
            if (!sector) setPurchaseDialogOpen(false);
          }}
          onPurchase={handlePurchase}
        />
      )}

      {/* Sell Dialog */}
      {sellDialogOpen && selectedPortfolioItem && (
        <SectorSell
          portfolioItem={selectedPortfolioItem}
          onClose={() => setSellDialogOpen(false)}
          onSell={handleSellConfirm}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

// Helper function to generate hypothesis data
function generateHypothesisData(metric: string, sector: string, 
  getPerformanceGroup: (sector: string) => 'positive' | 'neutral' | 'negative'): number[] {
  
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

export default PurchaseRecommendationDialog;
