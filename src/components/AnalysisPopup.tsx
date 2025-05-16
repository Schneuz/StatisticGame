import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MetricCard } from './MetricCard';
import { VariableSlot } from './VariableSlot';
import { DiagramPreview } from './DiagramPreview';
import { generateHypothesisData } from './DiagramPreview';
import { runAndLogStatisticalTest, TestResult } from '../models/StatisticalTestModel';
import PurchaseRecommendationDialog from './PurchaseRecommendationDialog';
import { ActionTracker } from '../models/ActionTracker';
import { useGame } from '../contexts/GameContext';

interface AnalysisPopupProps {
  open: boolean;
  onClose: () => void;
  hypothesis: string;
}

type MetricType = 'numerical' | 'categorical';

interface Metric {
  id: string;
  name: string;
  type: MetricType;
  icon: string;
}

// Metric explanations (English, with concrete example)
const metricExplanations: Record<string, string> = {
  mean_return: `The average daily return of a sector.\n\nExample: If a sector had returns of +2%, -1%, +3%, and -2%, the mean return would be (+2% - 1% + 3% - 2%) / 4 = +0.5%.`,
  median_return: `The middle value of all daily returns when sorted.\n\nExample: For returns [-2%, -1%, +1%, +2%, +3%], the median return is +1%.`,
  proportion_positive_days: `The proportion of days where the sector had a positive return.\n\nExample: If a sector had positive returns on 12 out of 20 days, the proportion is 12/20 = 60%.`,
  proportion_negative_days: `The proportion of days where the sector had a negative return.\n\nExample: If a sector had negative returns on 8 out of 20 days, the proportion is 8/20 = 40%.`
};

export const AnalysisPopup: React.FC<AnalysisPopupProps> = ({ open, onClose, hypothesis }) => {
  const { state } = useGame();
  const [slotA, setSlotA] = useState<string | null>(null);
  const [slotB, setSlotB] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [interpretation, setInterpretation] = useState<string>('');
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  // State für die neue Sektoren-Auswahl
  const [sectorA, setSectorA] = useState<string>('');
  const [sectorB, setSectorB] = useState<string>('');

  // Use useMemo to prevent the metrics array from being recreated on every render
  const metrics = useMemo<Metric[]>(() => [
    { id: 'mean_return', name: 'Mean Return', type: 'numerical', icon: '📈' },
    { id: 'median_return', name: 'Median Return', type: 'numerical', icon: '📊' },
    { id: 'proportion_positive_days', name: 'Positive Days', type: 'categorical', icon: '📈' },
    { id: 'proportion_negative_days', name: 'Negative Days', type: 'categorical', icon: '📉' },
    { id: 'mean_gain', name: 'Mean Gain', type: 'numerical', icon: '➕' },
    { id: 'mean_loss', name: 'Mean Loss', type: 'numerical', icon: '➖' }
  ], []);

  const sectorOptions = useMemo(() => [
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
  ], []);

  // Track the hypothesis selection when the popup opens
  useEffect(() => {
    if (open && hypothesis) {
      // Verwende die aktuelle Szenario-ID aus dem GameContext
      const currentScenarioId = state.currentSituationIndex;
      
      // Stelle sicher, dass die richtige Szenario-ID verwendet wird
      ActionTracker.setCurrentScenario(currentScenarioId);
      
      // Log the current scenario ID
      console.log(`Adding hypothesis action for scenario ${currentScenarioId}:`, hypothesis);
      
      // First action: Hypothesis Selection
      ActionTracker.addAction('hypothesis_selection', {
        hypothesis,
        isCorrect: true
      });
      
      console.log('Opened analysis with new hypothesis');
    }
  }, [open, hypothesis, state.currentSituationIndex]);
  
  // Helper to extract sectors from hypothesis
  const extractHypothesisSectors = useMemo(() => {
    // If no hypothesis, return null
    if (!hypothesis) return null;
    
    console.log('Extracting sectors from hypothesis:', hypothesis);
    
    // Direct matching approach: Check which known sectors are mentioned in the hypothesis
    const mentionedSectors = sectorOptions.filter(sector => 
      hypothesis.toLowerCase().includes(sector.toLowerCase())
    );
    
    if (mentionedSectors.length >= 2) {
      console.log('Found hypothesis sectors:', mentionedSectors[0], mentionedSectors[1]);
      return [mentionedSectors[0], mentionedSectors[1]];
    }
    
    // Fallback to regex pattern if needed
    console.log('No sectors found in hypothesis through direct matching');
    return null;
  }, [hypothesis, sectorOptions]);
  
  // Check if selected sectors match hypothesis sectors
  const doSelectedSectorsMatchHypothesis = useMemo(() => {
    // If we don't have hypothesis sectors or two selected sectors, can't validate
    if (!extractHypothesisSectors || !sectorA || !sectorB) return true;
    
    const normalizedHypothesisSectors = extractHypothesisSectors.map(s => s.toLowerCase());
    const normalizedSelectedSectors = [sectorA, sectorB].map(s => s.toLowerCase());
    
    console.log('Comparing sectors:', {
      hypothesis: normalizedHypothesisSectors,
      selected: normalizedSelectedSectors
    });
    
    // Check if both selected sectors are mentioned in hypothesis
    const sectorsMatch = normalizedSelectedSectors.every(selected => 
      normalizedHypothesisSectors.some(expected => 
        selected === expected
      )
    );
    
    console.log('Sectors match hypothesis?', sectorsMatch);
    return sectorsMatch;
  }, [extractHypothesisSectors, sectorA, sectorB]);
  
  // Helper to extract metric from hypothesis
  const extractHypothesisMetric = useMemo(() => {
    // If no hypothesis, return null
    if (!hypothesis) return null;
    
    console.log('Extracting metric from hypothesis:', hypothesis);
    
    // Look for metric keywords in the hypothesis
    const metricKeywords = [
      { id: 'mean_return', keywords: ['mean', 'average', 'return'] },
      { id: 'median_return', keywords: ['median', 'middle', 'return'] },
      { id: 'proportion_positive_days', keywords: ['positive', 'days', 'proportion'] },
      { id: 'proportion_negative_days', keywords: ['negative', 'days', 'proportion'] },
      { id: 'mean_gain', keywords: ['mean gain', 'average gain'] },
      { id: 'mean_loss', keywords: ['mean loss', 'average loss'] }
    ];
    
    const lowerHypothesis = hypothesis.toLowerCase();
    
    // Find the first metric that matches keywords in the hypothesis
    const foundMetric = metricKeywords.find(metric => 
      metric.keywords.some(keyword => lowerHypothesis.includes(keyword))
    );
    
    if (foundMetric) {
      const metricInfo = metrics.find(m => m.id === foundMetric.id);
      console.log('Found hypothesis metric:', metricInfo?.name);
      return metricInfo;
    }
    
    console.log('No metric found in hypothesis through keyword matching');
    return null;
  }, [hypothesis, metrics]);
  
  // Check if selected metrics match hypothesis metric
  const doSelectedMetricsMatchHypothesis = useMemo(() => {
    // If we don't have a hypothesis metric or player hasn't selected metrics, can't validate
    if (!extractHypothesisMetric || (!slotA && !slotB)) return true;
    
    const hypothesisMetricId = extractHypothesisMetric.id;
    
    // Check if either of the selected metrics matches the hypothesis metric
    const metricsMatch = (slotA === hypothesisMetricId) || (slotB === hypothesisMetricId);
    
    console.log('Selected metrics:', {
      hypothesisMetric: hypothesisMetricId,
      slotA,
      slotB,
      match: metricsMatch
    });
    
    return metricsMatch;
  }, [extractHypothesisMetric, slotA, slotB]);

  // For tracking when sectors are selected
  useEffect(() => {
    if (sectorA && sectorB) {
      // Ensure we have the correct scenario ID
      const currentScenarioId = state.currentSituationIndex;
      ActionTracker.setCurrentScenario(currentScenarioId);
      
      // Check if sectors match hypothesis
      const isCorrect = doSelectedSectorsMatchHypothesis;
      
      // Track sector selection when both sectors are set
      console.log(`Adding sector selection for scenario ${currentScenarioId}:`, [sectorA, sectorB]);
      ActionTracker.addAction('sector_selection', {
        sectors: [sectorA, sectorB],
        isCorrect
      });
    }
  }, [sectorA, sectorB, doSelectedSectorsMatchHypothesis, state.currentSituationIndex]);

  const handleDrop = useCallback((slot: 'A' | 'B', metricId: string) => {
    // Get the new metric details
    const newMetric = metrics.find(m => m.id === metricId);
    if (!newMetric) return;

    if (slot === 'A') {
      setSlotA(metricId);
    } else {
      setSlotB(metricId);
    }
    
    // Ensure we have the correct scenario ID
    const currentScenarioId = state.currentSituationIndex;
    ActionTracker.setCurrentScenario(currentScenarioId);
    
    // Track sector selection if both sectors are selected
    if (sectorA && sectorB) {
      console.log(`Re-adding sector selection for scenario ${currentScenarioId} during metric drop:`, [sectorA, sectorB]);
      ActionTracker.addAction('sector_selection', {
        sectors: [sectorA, sectorB],
        isCorrect: doSelectedSectorsMatchHypothesis
      });
    }
    
    // Only track metric selection if we have both metrics selected
    if (slot === 'B' && slotA) {
      const metricA = metrics.find(m => m.id === slotA);
      if (metricA) {
        // Check if metrics match what's in the hypothesis
        const isMetricSelectionCorrect = doSelectedMetricsMatchHypothesis;
        
        // Track both metrics together
        console.log(`Adding metric selection for scenario ${currentScenarioId}:`, [metricA.name, newMetric.name]);
        ActionTracker.addAction('metric_selection', {
          metrics: [metricA.name, newMetric.name],
          dataType: metricA.type === newMetric.type ? metricA.type : 'mixed',
          isCorrect: isMetricSelectionCorrect,
          errorMessage: !isMetricSelectionCorrect && extractHypothesisMetric 
            ? `You selected different metrics than mentioned in the hypothesis (${extractHypothesisMetric.name})`
            : undefined
        });
      }
    } else if (slot === 'A' && slotB) {
      const metricB = metrics.find(m => m.id === slotB);
      if (metricB) {
        // Check if metrics match what's in the hypothesis
        const isMetricSelectionCorrect = doSelectedMetricsMatchHypothesis;
        
        // Track both metrics together
        console.log(`Adding metric selection for scenario ${currentScenarioId}:`, [newMetric.name, metricB.name]);
        ActionTracker.addAction('metric_selection', {
          metrics: [newMetric.name, metricB.name],
          dataType: newMetric.type === metricB.type ? newMetric.type : 'mixed',
          isCorrect: isMetricSelectionCorrect,
          errorMessage: !isMetricSelectionCorrect && extractHypothesisMetric 
            ? `You selected different metrics than mentioned in the hypothesis (${extractHypothesisMetric.name})`
            : undefined
        });
      }
    } else {
      // Just one metric selected so far, track it individually
      const isMetricSelectionCorrect = metricId === extractHypothesisMetric?.id;
      
      console.log(`Adding single metric selection for scenario ${currentScenarioId}:`, newMetric.name);
      ActionTracker.addAction('metric_selection', {
        metrics: [newMetric.name],
        dataType: newMetric.type,
        isCorrect: isMetricSelectionCorrect,
        errorMessage: !isMetricSelectionCorrect && extractHypothesisMetric 
          ? `You selected a different metric than mentioned in the hypothesis (${extractHypothesisMetric.name})`
          : undefined
      });
    }
  }, [slotA, slotB, metrics, sectorA, sectorB, doSelectedSectorsMatchHypothesis, doSelectedMetricsMatchHypothesis, extractHypothesisMetric, state.currentSituationIndex]);

  const getData = (metric: string, sector: string): number[] => {
    const key = `${metric}-${sector}`;
    if (!(window as any)._diagramRawDataCache) (window as any)._diagramRawDataCache = {};
    const cache = (window as any)._diagramRawDataCache;
    if (!cache[key]) {
      cache[key] = generateHypothesisData(metric, sector);
    }
    return cache[key];
  };

  // Helper to check if a test type is appropriate for a metric type
  const checkTestAppropriatenessForMetric = (testType: 'ttest' | 'chisquare', metricType: MetricType): boolean => {
    // Check if test type matches the metric type
    if (testType === 'ttest' && metricType === 'numerical') return true;
    if (testType === 'chisquare' && metricType === 'categorical') return true;
    return false;
  };

  const runTest = (testType: 'ttest' | 'chisquare') => {
    if (!slotA || !slotB || !sectorA || !sectorB) {
      // Show a message instead of just returning silently
      setInterpretation("Please select both sectors and metrics before running a statistical test.");
      return;
    }

    // Get metric information
    const metricA = metrics.find(m => m.id === slotA);
    const metricB = metrics.find(m => m.id === slotB);

    if (!metricA || !metricB) {
      setInterpretation("Could not find metric information. Please try selecting your metrics again.");
      return;
    }
    
    // Convert UI values to model values
    const testTypeForModel = testType === 'ttest' ? 'T-Test' : 'Chi-Square';
    
    // Log test execution
    console.log(`Running statistical test: ${testTypeForModel}`);
    
    // Ensure we have the correct scenario ID
    const currentScenarioId = state.currentSituationIndex;
    ActionTracker.setCurrentScenario(currentScenarioId);
    
    // Make sure sector selection is tracked if it wasn't already
    // This ensures sector selection is always tracked before test execution
    console.log(`Re-adding sector selection for scenario ${currentScenarioId} before test:`, [sectorA, sectorB]);
    ActionTracker.addAction('sector_selection', {
      sectors: [sectorA, sectorB],
      isCorrect: doSelectedSectorsMatchHypothesis
    });

    // Check if test type is appropriate for the metric types
    const isAppropriate = checkTestAppropriatenessForMetric(testType, metricA.type);
    
    // Generate appropriate error message if the test doesn't match the data type
    let errorMessage: string | undefined = undefined;
    if (!isAppropriate) {
      if (testType === 'ttest' && metricA.type === 'categorical') {
        errorMessage = 'You used a T-Test with categorical data. T-Test is appropriate for numerical data.';
      } else if (testType === 'chisquare' && metricA.type === 'numerical') {
        errorMessage = 'You used a Chi-Square test with numerical data. Chi-Square is appropriate for categorical data.';
      }
    }
    
    // Fourth action: Test execution
    console.log(`Adding test execution for scenario ${currentScenarioId}:`, testTypeForModel);
    ActionTracker.addAction('test_execution', {
      testType: testTypeForModel,
      dataType: metricA.type,
      isCorrect: isAppropriate,
      errorMessage: errorMessage
    });

    // Create synthetic data for the test
    const data1 = getData(slotA, sectorA);
    const data2 = getData(slotB, sectorB);
    
    // Generate test result data
    const testResultData = runAndLogStatisticalTest(
      testTypeForModel,
      hypothesis,
      data1,
      data2,
      0.05
    );

    // Generate interpretation text
    const interpretation = getTestInterpretation(
      testResultData.significant, 
      testResultData.pValue, 
      !isAppropriate
    );
    
    // Store the interpretation in a separate state variable
    setInterpretation(interpretation);
    
    // Store the test results
    setTestResult(testResultData);
  };

  // Generate interpretation of test results
  const getTestInterpretation = (isSignificant: boolean, pValue: number, isInappropriate?: boolean): string => {
    // Check traditional appropriateness despite allowing all tests
    const metricA = metrics.find(m => m.id === slotA);
    const isTraditionallyAppropriate = 
      (testResult?.testType === 'T-Test' && metricA?.type === 'numerical') ||
      (testResult?.testType === 'Chi-Square' && metricA?.type === 'categorical');
    
    // Show warning based on traditional appropriateness
    if (!isTraditionallyAppropriate && testResult) {
      const recommendedTest = metricA?.type === 'numerical' ? 'T-Test' : 'Chi-Square';
      const currentTest = testResult.testType;
      return `Note: ${currentTest} is traditionally used for ${currentTest === 'T-Test' ? 'numerical' : 'categorical'} data, while you're analyzing ${metricA?.type} data. Consider using ${recommendedTest} for more accurate results. Results: p=${pValue.toFixed(3)}, ${isSignificant ? 'statistically significant' : 'not statistically significant'}.`;
    }

    // Standard interpretations
    if (isInappropriate) {
      return "Test results may be misleading due to inappropriate test selection. Please select a more suitable test for your data type.";
    }

    if (isSignificant) {
      return `The results are statistically significant (p=${pValue.toFixed(3)}). There is evidence to support this hypothesis.`;
    } else {
      return `The results are not statistically significant (p=${pValue.toFixed(3)}). There is insufficient evidence to support this hypothesis.`;
    }
  };

  const getMetricById = (id: string | null) => {
    return metrics.find(m => m.id === id);
  };

  const [openMetricInfo, setOpenMetricInfo] = useState<string | null>(null);
  const [openTestInfo, setOpenTestInfo] = useState(false);
  const [openTestStatisticInfo, setOpenTestStatisticInfo] = useState(false);
  const [openPValueInfo, setOpenPValueInfo] = useState(false);

  // Felder zurücksetzen, wenn sich die Hypothese ändert
  useEffect(() => {
    setSectorA('');
    setSectorB('');
    setSlotA(null);
    setSlotB(null);
    setTestResult(null);
    setInterpretation('');
  }, [hypothesis]);

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            Analysis
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
        {hypothesis && (
          <Box sx={{
            width: '100%',
            background: 'rgba(67, 226, 148, 0.12)',
            borderBottom: '1px solid #43e294',
            px: 4,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: '#43e294',
            letterSpacing: 0.5,
            boxShadow: '0 2px 8px rgba(67,226,148,0.08)'
          }}>
            {hypothesis}
          </Box>
        )}
        <Box sx={{ flex: 1, overflow: 'hidden', width: '100%', minHeight: 0 }}>
          <DialogContent sx={{ p: 2, height: '100%', maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
            <DndProvider backend={HTML5Backend}>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                {/* Left side - Available metrics */}
                <Grid item xs={3}>
                  <Paper sx={{
                    p: 1.5,
                    height: '100%',
                    background: 'rgba(34, 50, 60, 0.7)',
                    border: '1.5px solid #2196f3',
                    borderRadius: 3,
                    boxShadow: '0 2px 12px rgba(33,150,243,0.10)',
                    mb: 2
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', color: '#2196f3', fontWeight: 'bold', mb: 1 }}>
                      Available Metrics
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {metrics.map(metric => (
                        <Box
                          key={metric.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            height: '48px',
                            minHeight: '48px',
                            maxHeight: '48px',
                            borderRadius: 1,
                            background: 'none',
                            mb: 0,
                            gap: 1,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            paddingLeft: 0,
                            paddingRight: 0,
                          }}
                        >
                          <MetricCard
                            id={metric.id}
                            name={metric.name}
                            type={metric.type}
                            icon={metric.icon}
                          />
                          <Tooltip title="More info">
                            <InfoOutlinedIcon
                              sx={{ color: '#4a90e2', cursor: 'pointer', fontSize: 20 }}
                              onClick={() => setOpenMetricInfo(metric.id)}
                            />
                          </Tooltip>
                        </Box>
                      ))}
                    </Box>
                    {/* Info-Popup für Metric-Erklärung */}
                    <Dialog open={!!openMetricInfo} onClose={() => setOpenMetricInfo(null)}>
                      <DialogTitle>Metric Info</DialogTitle>
                      <DialogContent>
                        <Typography>
                          {openMetricInfo ? metricExplanations[openMetricInfo] : ''}
                        </Typography>
                      </DialogContent>
                    </Dialog>
                  </Paper>
                </Grid>

                {/* Middle - Configuration and Preview */}
                <Grid item xs={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', minHeight: 0 }}>
                    {/* Configuration */}
                    <Paper sx={{
                      p: 2,
                      background: 'rgba(34, 50, 60, 0.7)',
                      border: '1.5px solid #43e294',
                      borderRadius: 3,
                      boxShadow: '0 2px 12px rgba(67,226,148,0.10)',
                      mb: 2,
                      mt: 1
                    }}>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', color: '#43e294', fontWeight: 'bold', mb: 2 }}>
                        Configuration
                      </Typography>
                      <Grid container spacing={2}>
                        {/* Vergleichsbox A */}
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.95rem', color: '#43e294', fontWeight: 'bold' }}>Sector A</Typography>
                          <select
                            value={sectorA}
                            onChange={e => setSectorA(e.target.value)}
                            style={{ width: '100%', marginBottom: 10, background: '#1e1e1e', color: 'white', border: '1.5px solid #43e294', borderRadius: 6, height: '36px', fontSize: '1rem', paddingLeft: 8 }}
                          >
                            <option value="">Select sector...</option>
                            {sectorOptions.map(sector => (
                              <option key={sector} value={sector}>{sector}</option>
                            ))}
                          </select>
                          <VariableSlot
                            id="A"
                            label="Metric for A"
                            onDrop={(metricId) => handleDrop('A', metricId)}
                            currentMetric={getMetricById(slotA)?.name || null}
                          />
                        </Grid>
                        {/* Vergleichsbox B */}
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.95rem', color: '#43e294', fontWeight: 'bold' }}>Sector B</Typography>
                          <select
                            value={sectorB}
                            onChange={e => setSectorB(e.target.value)}
                            style={{ width: '100%', marginBottom: 10, background: '#1e1e1e', color: 'white', border: '1.5px solid #43e294', borderRadius: 6, height: '36px', fontSize: '1rem', paddingLeft: 8 }}
                          >
                            <option value="">Select sector...</option>
                            {sectorOptions.map(sector => (
                              <option key={sector} value={sector}>{sector}</option>
                            ))}
                          </select>
                          <VariableSlot
                            id="B"
                            label="Metric for B"
                            onDrop={(metricId) => handleDrop('B', metricId)}
                            currentMetric={getMetricById(slotB)?.name || null}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                    {/* Diagram Preview */}
                    <Paper sx={{ p: 2, pb: 5, background: 'rgba(34, 50, 60, 0.7)', border: '1.5px solid #2196f3', borderRadius: 3, boxShadow: '0 2px 12px rgba(33,150,243,0.10)', flex: 1, minHeight: 0, mt: 2, overflowY: 'auto' }}>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', color: '#2196f3', fontWeight: 'bold', mb: 1 }}>
                        Diagram Preview
                      </Typography>
                      <Box sx={{ height: 'calc(100% - 32px)' }}>
                        <DiagramPreview
                          variableX={slotA || ''}
                          variableY={slotB || ''}
                          metrics={metrics}
                          sectorA={sectorA}
                          sectorB={sectorB}
                        />
                      </Box>
                    </Paper>
                    {/* Test-Buttons - centered */}
                    <Grid container spacing={2} sx={{ mt: 2, mb: 2, justifyContent: 'center' }}>
                      <Grid item xs={5} sm={4} md={3}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => runTest('ttest')}
                          sx={{
                            background: '#2196f3',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            borderRadius: 2,
                            boxShadow: '0 2px 12px rgba(33,150,243,0.15)',
                            py: 1.5,
                            letterSpacing: 1,
                            minWidth: 140,
                            minHeight: 48,
                            '&:hover': {
                              background: '#1769aa',
                              color: '#fff'
                            }
                          }}
                        >
                          T-TEST
                        </Button>
                      </Grid>
                      <Grid item xs={5} sm={4} md={3}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => runTest('chisquare')}
                          sx={{
                            background: '#2196f3',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            borderRadius: 2,
                            boxShadow: '0 2px 12px rgba(33,150,243,0.15)',
                            py: 1.5,
                            letterSpacing: 1,
                            minWidth: 180,
                            minHeight: 48,
                            '&:hover': {
                              background: '#1769aa',
                              color: '#fff'
                            }
                          }}
                        >
                          CHI-SQUARE
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Right side - Analysis results */}
                <Grid item xs={3}>
                  <Paper sx={{
                    p: 2,
                    height: '100%',
                    background: 'linear-gradient(135deg, #23272f 80%, #43e294 120%)',
                    border: '2px solid #43e294',
                    borderRadius: 3,
                    boxShadow: '0 4px 24px rgba(67,226,148,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    minHeight: 320
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', color: '#43e294', fontWeight: 'bold', letterSpacing: 1, mb: 2 }}>
                      Analysis Results
                    </Typography>
                    {testResult ? (
                      <Box sx={{ width: '100%', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>
                            Test Statistic:
                          </Typography>
                          <Typography variant="subtitle1" sx={{ color: '#43e294', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {testResult.statistic.toFixed(3)}
                          </Typography>
                          <Tooltip title="Was ist die Teststatistik?">
                            <InfoOutlinedIcon sx={{ color: '#43e294', cursor: 'pointer', fontSize: 20 }} onClick={() => setOpenTestStatisticInfo(true)} />
                          </Tooltip>
                        </Box>
                        <Dialog open={openTestStatisticInfo} onClose={() => setOpenTestStatisticInfo(false)}>
                          <DialogTitle>Test Statistic Info</DialogTitle>
                          <DialogContent>
                            <Typography>
                              Die Teststatistik ist eine Zahl, die zeigt, wie groß der Unterschied zwischen zwei Gruppen ist. Je größer die Zahl, desto größer der Unterschied.
                              <br /><br />
                              <b>Beispiel:</b> Wenn Gruppe A einen Durchschnitt von 10 hat und Gruppe B einen Durchschnitt von 5, ist die Teststatistik größer als wenn beide Gruppen fast gleich sind.
                            </Typography>
                          </DialogContent>
                        </Dialog>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>
                            P-Value:
                          </Typography>
                          <Typography variant="subtitle1" sx={{ color: '#43e294', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {testResult.pValue.toFixed(3)}
                          </Typography>
                          <Tooltip title="Was ist der p-Wert?">
                            <InfoOutlinedIcon sx={{ color: '#43e294', cursor: 'pointer', fontSize: 20 }} onClick={() => setOpenPValueInfo(true)} />
                          </Tooltip>
                        </Box>
                        <Dialog open={openPValueInfo} onClose={() => setOpenPValueInfo(false)}>
                          <DialogTitle>P-Value Info</DialogTitle>
                          <DialogContent>
                            <Typography>
                              Der p-Wert zeigt, wie wahrscheinlich es ist, dass der Unterschied zwischen zwei Gruppen nur Zufall ist. Ein kleiner p-Wert (z.B. unter 0,05) bedeutet: Es ist sehr wahrscheinlich ein echter Unterschied.
                              <br /><br />
                              <b>Beispiel:</b> Ein p-Wert von 0,01 heißt: Es gibt nur 1% Wahrscheinlichkeit, dass das Ergebnis Zufall ist.
                            </Typography>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outlined"
                          color="info"
                          fullWidth
                          sx={{ mt: 2, fontWeight: 'bold', borderColor: '#43e294', color: '#43e294', '&:hover': { borderColor: '#43e294', background: 'rgba(67,226,148,0.08)' } }}
                          onClick={() => setOpenTestInfo(true)}
                        >
                          SHOW TEST INFO
                        </Button>
                        <Dialog open={openTestInfo} onClose={() => setOpenTestInfo(false)}>
                          <DialogTitle>Test Result Info</DialogTitle>
                          <DialogContent>
                            <Typography>
                              {interpretation}
                            </Typography>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          sx={{ mt: 3, fontWeight: 'bold', fontSize: '1.2rem', py: 2, borderRadius: 2, background: 'linear-gradient(90deg, #43e294 60%, #2196f3 100%)', boxShadow: '0 2px 12px rgba(67,226,148,0.15)' }}
                          onClick={() => setPurchaseDialogOpen(true)}
                        >
                          BUY NOW
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="gray" sx={{ fontSize: '0.95rem' }}>
                        Run the test to see results
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DndProvider>
          </DialogContent>
        </Box>
      </Box>
      
      {/* Add PurchaseRecommendationDialog */}
      <PurchaseRecommendationDialog
        open={purchaseDialogOpen}
        onClose={() => setPurchaseDialogOpen(false)}
        sectorA={sectorA}
        sectorB={sectorB}
        hypothesis={hypothesis}
      />
    </Dialog>
  );
}; 