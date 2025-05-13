import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter, ScatterChart, Line, Cell, Legend } from 'recharts';
import { BarChart as ReBarChart, Bar as ReBar } from 'recharts';
import { Metric } from '../types';
import { 
  normal, 
  binomial, 
  generateCategoricalData,
  getMetricParameters
} from '../models/DataGenerationModel';
import { getSectorPerformanceGroup } from '../models/SectorModel';
import { useGame } from '../contexts/GameContext';

interface DiagramPreviewProps {
  variableX: string;
  variableY: string;
  metrics: Metric[];
  sectorA?: string;
  sectorB?: string;
}

interface DataPoint {
  x: number;
  y: number;
}

// Consistent style variables
const AXIS_LABEL_STYLE = {
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: 13,
  fill: '#b0b0b0',
  fontWeight: 500,
};

const TICK_STYLE = {
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: 12,
  fill: '#b0b0b0',
};

const TITLE_STYLE = {
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  color: 'white',
};

/**
 * Generate data for hypothesis testing based on metric and sector
 * @param metric The metric ID to generate data for
 * @param sector The sector name to generate data for
 * @returns Array of values for the specified metric and sector
 */
export function generateHypothesisData(metric: string, sector: string): number[] {
  // Get sector's performance group in current scenario
  const performanceGroup = getSectorPerformanceGroup(sector, 0);
  
  // Get appropriate parameters based on metric and performance group
  const params = getMetricParameters(metric, performanceGroup);
  
  // Generate data based on the metric type with appropriate parameters
  if (metric === 'mean_return' || metric === 'median_return' || metric === 'mean_gain' || metric === 'mean_loss') {
    return normal(params.mean!, params.stdDev!, 200);
  }
  
  if (metric === 'proportion_positive_days' || metric === 'proportion_negative_days' || metric === 'proportion_high_volatility_days') {
    return binomial(params.probability!, 200);
  }
  
  if (metric === 'distribution_return_categories') {
    return generateCategoricalData(params.categoricalDistribution!, 200);
  }
  
  // Fallback
  return normal(0.05, 0.04, 200);
}

/**
 * Create a stable key for data caching
 */
function getDataKey(metric: string, sector: string): string {
  return `${metric}__${sector}`;
}

interface SingleMetricChartProps {
  metric: string;
  name: string;
  type: string;
  sector: string;
  persistData: (metric: string, sector: string) => { x: string, y: number }[];
  getRawData: (metric: string, sector: string) => number[];
}

/**
 * Chart component for displaying individual metric distributions
 */
const SingleMetricChart: React.FC<SingleMetricChartProps> = ({ 
  metric, 
  name, 
  type, 
  sector, 
  persistData, 
  getRawData 
}) => {
  // Get raw data from cache
  const rawData = getRawData(metric, sector);
  
  // Set up categorical data if applicable
  let categories: string[] = [];
  let counts: number[] = [0, 0, 0];
  let isCategorical = false;
  
  if (metric === 'proportion_positive_days') {
    categories = ['No', 'Yes'];
    counts = [0, 0];
    rawData.forEach(v => { if (v === 1) counts[1]++; else counts[0]++; });
    isCategorical = true;
  } else if (metric === 'proportion_negative_days') {
    categories = ['No', 'Yes'];
    counts = [0, 0];
    rawData.forEach(v => { if (v === 1) counts[1]++; else counts[0]++; });
    isCategorical = true;
  } else if (metric === 'distribution_return_categories' || type === 'categorical' || (rawData.length > 0 && rawData.every(v => v === 0 || v === 1 || v === 2))) {
    categories = ['Loss', 'Neutral', 'Gain'];
    counts = [0, 0, 0];
    rawData.forEach(v => { 
      if (v === 0) counts[0]++; 
      else if (v === 1) counts[1]++; 
      else if (v === 2) counts[2]++; 
    });
    isCategorical = true;
  }
  
  // Dynamic axis labels
  const xAxisLabel = `${name} (${sector})`;
  const yAxisLabel = 'Frequency';
  
  // Render categorical chart
  if (isCategorical) {
    const barData = categories.map((cat, i) => ({ 
      category: cat, 
      count: counts[i], 
    }));
    
    return (
      <Box sx={{ height: 190, width: '100%', pb: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography gutterBottom sx={TITLE_STYLE}>
          {name} Distribution
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <Box sx={{ width: 28, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: 120 }}>
            <Typography gutterBottom sx={{ ...AXIS_LABEL_STYLE, writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center' }}>
              {yAxisLabel}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={barData} barSize={24} margin={{ left: 0, right: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={TICK_STYLE} />
                <YAxis allowDecimals={false} hide />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {barData.map((entry, i) => (
                    <Cell key={categories[i]} fill="#4a90e2" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        <Typography gutterBottom sx={AXIS_LABEL_STYLE}>
          {xAxisLabel}
        </Typography>
      </Box>
    );
  }
  
  // For numerical data: histogram
  const data = persistData(metric, sector);
  return (
    <Box sx={{ height: 190, width: '100%', pb: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography gutterBottom sx={TITLE_STYLE}>
        {name} Distribution
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
        <Box sx={{ width: 28, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: 120 }}>
          <Typography gutterBottom sx={{ ...AXIS_LABEL_STYLE, writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center' }}>
            {yAxisLabel}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data} barSize={16} margin={{ left: 0, right: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={TICK_STYLE} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="y" fill="#4a90e2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Typography gutterBottom sx={AXIS_LABEL_STYLE}>
        {xAxisLabel}
      </Typography>
    </Box>
  );
};

/**
 * Calculate linear regression for a set of data points
 */
function linearRegression(data: {x: number, y: number}[]): { slope: number, intercept: number } {
  const n = data.length;
  const sumX = data.reduce((acc, d) => acc + d.x, 0);
  const sumY = data.reduce((acc, d) => acc + d.y, 0);
  const sumXY = data.reduce((acc, d) => acc + d.x * d.y, 0);
  const sumXX = data.reduce((acc, d) => acc + d.x * d.x, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

/**
 * Delete a specific key from a cache object
 */
function clearCacheForKey(cacheRef: React.MutableRefObject<any>, key: string): void {
  if (cacheRef.current[key]) {
    delete cacheRef.current[key];
  }
}

/**
 * Create bins for numerical data
 */
function binCounts(arr: number[]): number[] {
  if (!arr.length) return [0, 0, 0];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const binSize = (max - min) / 3;
  return arr.reduce((acc: number[], v: number) => {
    let idx = Math.floor((v - min) / binSize);
    if (idx >= 3) idx = 2;
    if (idx < 0) idx = 0;
    acc[idx]++;
    return acc;
  }, [0, 0, 0]);
}

export const DiagramPreview: React.FC<DiagramPreviewProps> = ({ 
  variableX, 
  variableY, 
  metrics, 
  sectorA = '', 
  sectorB = '' 
}) => {
  const metricX = metrics.find(m => m.id === variableX);
  const metricY = metrics.find(m => m.id === variableY);

  // Persistent data caches
  const rawDataCache = useRef<{ [key: string]: number[] }>({});
  const histogramCache = useRef<{ [key: string]: { x: string, y: number }[] }>({});

  // Track the last keys for cache invalidation
  const lastKeyA = useRef<string | null>(null);
  const lastKeyB = useRef<string | null>(null);

  // Track the last metric IDs for diagram type reset
  const lastMetricXId = useRef<string | null>(null);
  const lastMetricYId = useRef<string | null>(null);

  // State for diagram type
  const [diagramType, setDiagramType] = useState<'numerical' | 'categorical' | null>(null);

  const { state } = useGame();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);

  // Clear cache when variableX or sectorA changes
  useEffect(() => {
    const keyA = variableX && sectorA ? getDataKey(variableX, sectorA) : null;
    if (lastKeyA.current && lastKeyA.current !== keyA) {
      clearCacheForKey(rawDataCache, lastKeyA.current);
      clearCacheForKey(histogramCache, lastKeyA.current);
    }
    lastKeyA.current = keyA;
  }, [variableX, sectorA]);

  // Clear cache when variableY or sectorB changes
  useEffect(() => {
    const keyB = variableY && sectorB ? getDataKey(variableY, sectorB) : null;
    if (lastKeyB.current && lastKeyB.current !== keyB) {
      clearCacheForKey(rawDataCache, lastKeyB.current);
      clearCacheForKey(histogramCache, lastKeyB.current);
    }
    lastKeyB.current = keyB;
  }, [variableY, sectorB]);

  // Reset diagram type when metrics change
  useEffect(() => {
    const currentMetricXId = metricX?.id || null;
    const currentMetricYId = metricY?.id || null;
    if (
      lastMetricXId.current !== null && 
      lastMetricYId.current !== null &&
      (lastMetricXId.current !== currentMetricXId || lastMetricYId.current !== currentMetricYId)
    ) {
      setDiagramType(null);
    }
    lastMetricXId.current = currentMetricXId;
    lastMetricYId.current = currentMetricYId;
  }, [metricX?.id, metricY?.id]);

  useEffect(() => {
    if (selectedSector && selectedMetric) {
      const performanceGroup = getSectorPerformanceGroup(selectedSector, state.currentSituationIndex);
      
      // Get appropriate parameters based on metric and performance group
      const params = getMetricParameters(selectedMetric, performanceGroup);
      
      // Generate data based on the metric type with appropriate parameters
      if (selectedMetric === 'mean_return' || selectedMetric === 'median_return' || selectedMetric === 'mean_gain' || selectedMetric === 'mean_loss') {
        const values = normal(params.mean!, params.stdDev!, 200);
        setData(values.map((value, index) => ({ x: index, y: value })));
      }
      
      if (selectedMetric === 'proportion_positive_days' || selectedMetric === 'proportion_negative_days' || selectedMetric === 'proportion_high_volatility_days') {
        const values = binomial(params.probability!, 200);
        setData(values.map((value, index) => ({ x: index, y: value })));
      }
      
      if (selectedMetric === 'distribution_return_categories') {
        const values = generateCategoricalData(params.categoricalDistribution!, 200);
        setData(values.map((value, index) => ({ x: index, y: value })));
      }
    }
  }, [selectedSector, selectedMetric, state.currentSituationIndex]);

  /**
   * Get raw data for a metric-sector combination
   */
  const getRawData = (metric: string, sector: string): number[] => {
    if (!metric || !sector) return [];
    const key = getDataKey(metric, sector);
    if (!rawDataCache.current[key]) {
      rawDataCache.current[key] = generateHypothesisData(metric, sector);
    }
    return rawDataCache.current[key];
  };

  /**
   * Generate histogram data from raw values
   */
  const persistHistogramData = (metric: string, sector: string): { x: string, y: number }[] => {
    if (!metric || !sector) return [];
    const key = getDataKey(metric, sector);
    if (!histogramCache.current[key]) {
      const values = getRawData(metric, sector);
      const binCount = 8;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binSize = (max - min) / binCount;
      const bins = Array(binCount).fill(0);
      values.forEach(v => {
        let idx = Math.floor((v - min) / binSize);
        if (idx >= binCount) idx = binCount - 1;
        if (idx < 0) idx = 0;
        bins[idx]++;
      });
      histogramCache.current[key] = bins.map((count, i) => ({ 
        x: (min + i * binSize).toFixed(2), 
        y: count 
      }));
    }
    return histogramCache.current[key];
  };

  /**
   * Generate scatter plot data from two metric-sector combinations
   */
  const getScatterData = (
    metricX: string, 
    sectorX: string, 
    metricY: string, 
    sectorY: string
  ): {x: number, y: number}[] => {
    if (!metricX || !sectorX || !metricY || !sectorY) return [];
    const valuesX = getRawData(metricX, sectorX);
    const valuesY = getRawData(metricY, sectorY);
    return valuesX.map((x, i) => ({ x, y: valuesY[i] }));
  };

  /**
   * Generate data for grouped bar chart
   */
  const getGroupedBarData = () => {
    // Set up categories and colors
    let categories: string[] = [];
    let countsA: number[] = [];
    let countsB: number[] = [];
    
    const dataA = (metricX && sectorA) ? getRawData(metricX.id, sectorA) : [];
    const dataB = (metricY && sectorB) ? getRawData(metricY.id, sectorB) : [];
    
    if (metricX?.id === 'proportion_positive_days' || metricY?.id === 'proportion_positive_days') {
      categories = ['No', 'Yes'];
      countsA = [0, 0];
      countsB = [0, 0];
      dataA.forEach(v => { if (v === 1) countsA[1]++; else countsA[0]++; });
      dataB.forEach(v => { if (v === 1) countsB[1]++; else countsB[0]++; });
    } else if (metricX?.id === 'proportion_negative_days' || metricY?.id === 'proportion_negative_days') {
      categories = ['No', 'Yes'];
      countsA = [0, 0];
      countsB = [0, 0];
      dataA.forEach(v => { if (v === 1) countsA[1]++; else countsA[0]++; });
      dataB.forEach(v => { if (v === 1) countsB[1]++; else countsB[0]++; });
    } else if (
      metricX?.id === 'distribution_return_categories' || 
      metricY?.id === 'distribution_return_categories' || 
      metricX?.type === 'categorical' || 
      metricY?.type === 'categorical' || 
      ((dataA.length > 0 && dataA.every(v => v === 0 || v === 1 || v === 2)) && 
       (dataB.length > 0 && dataB.every(v => v === 0 || v === 1 || v === 2)))
    ) {
      categories = ['Loss', 'Neutral', 'Gain'];
      countsA = [0, 0, 0];
      countsB = [0, 0, 0];
      dataA.forEach(v => { 
        if (v === 0) countsA[0]++; 
        else if (v === 1) countsA[1]++; 
        else if (v === 2) countsA[2]++; 
      });
      dataB.forEach(v => { 
        if (v === 0) countsB[0]++; 
        else if (v === 1) countsB[1]++; 
        else if (v === 2) countsB[2]++; 
      });
    } else {
      // Fallback: numeric bins
      categories = ['Low', 'Medium', 'High'];
      countsA = binCounts(dataA);
      countsB = binCounts(dataB);
    }
    
    return categories.map((cat, i) => ({
      category: cat,
      [sectorA || 'A']: countsA[i],
      [sectorB || 'B']: countsB[i],
    }));
  };

  const combinedData = (metricX && metricY && sectorA && sectorB)
    ? getScatterData(metricX.id, sectorA, metricY.id, sectorB)
    : [];

  // Calculate regression line
  let regressionLine: {x: number, y: number}[] = [];
  if (combinedData.length > 1) {
    const { slope, intercept } = linearRegression(combinedData);
    const minX = Math.min(...combinedData.map(d => d.x));
    const maxX = Math.max(...combinedData.map(d => d.x));
    regressionLine = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
        {/* Individual metric charts */}
        <Grid container item spacing={2} sx={{ mb: 2, width: '100%' }}>
          {/* Histogram for metric A */}
          {metricX && sectorA && (
            <Grid item xs={6} sx={{ pr: 1 }}>
              <Box sx={{ p: 2, background: 'rgba(255,255,255,0.02)', borderRadius: 2, height: 180 }}>
              <SingleMetricChart 
                metric={metricX.id} 
                name={metricX.name}
                type={metricX.type}
                  sector={sectorA}
                  persistData={persistHistogramData}
                  getRawData={getRawData}
              />
              </Box>
            </Grid>
          )}
          
          {/* Histogram for metric B */}
          {metricY && sectorB && (
            <Grid item xs={6} sx={{ pl: 1 }}>
              <Box sx={{ p: 2, background: 'rgba(255,255,255,0.02)', borderRadius: 2, height: 180 }}>
              <SingleMetricChart 
                metric={metricY.id} 
                name={metricY.name}
                type={metricY.type}
                  sector={sectorB}
                  persistData={persistHistogramData}
                  getRawData={getRawData}
              />
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Combined chart section */}
        {metricX && metricY && sectorA && sectorB && (
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Box sx={{ height: 300, width: '100%', p: 2, background: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
              {/* Chart type selector */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, justifyContent: 'center', width: '100%' }}>
                <Button
                  variant={diagramType === 'numerical' ? 'contained' : 'outlined'}
                  onClick={() => setDiagramType('numerical')}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  Numerical
                </Button>
                <Button
                  variant={diagramType === 'categorical' ? 'contained' : 'outlined'}
                  onClick={() => setDiagramType('categorical')}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  Categorical
                </Button>
              </Box>
              
              {/* Numerical chart (scatter plot) */}
              {diagramType === 'numerical' && metricX && metricY && (
                <>
                  <Typography gutterBottom sx={TITLE_STYLE}>
                    {metricX.name} vs {metricY.name}
                    {metricX && metricY && (metricX.type !== 'numerical' || metricY.type !== 'numerical') && (
                      <Box component="span" sx={{ color: '#e29943', fontSize: '0.8em', fontStyle: 'italic', display: 'block' }}>
                        Note: For optimal numerical visualization, both metrics should be numerical type
                      </Box>
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    {/* Y-axis label */}
                    <Box sx={{ width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                      <Typography gutterBottom sx={{ 
                        ...AXIS_LABEL_STYLE, 
                        writingMode: 'vertical-rl', 
                        transform: 'rotate(180deg)', 
                        textAlign: 'center', 
                        whiteSpace: 'pre-line' 
                      }}>
                        {metricY.name + '\n(' + sectorB + ')'}
                      </Typography>
                    </Box>
                    
                    {/* Scatter plot */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height={260}>
                        <ScatterChart margin={{ top: 24, right: 24, left: 0, bottom: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="x" 
                            name={`${metricX.name} (${sectorA})`}
                            type="number"
                            tick={TICK_STYLE}
                            label={{ value: `${metricX.name} (${sectorA})`, position: 'insideBottom', offset: -10 }}
                          />
                          <YAxis 
                            dataKey="y" 
                            name={`${metricY.name} (${sectorB})`}
                            type="number"
                            tick={TICK_STYLE}
                          />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter 
                            name={`${metricX.name} vs ${metricY.name}`} 
                            data={combinedData} 
                            fill="#4a90e2" 
                          />
                          {regressionLine.length === 2 && (
                            <Line
                              type="linear"
                              data={regressionLine}
                              dataKey="y"
                              stroke="#e24a4a"
                              dot={false}
                              strokeWidth={2}
                              legendType="none"
                              isAnimationActive={false}
                              connectNulls={true}
                            />
                          )}
                        </ScatterChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </>
              )}
              
              {/* Categorical chart (grouped bar chart) */}
              {diagramType === 'categorical' && metricX && metricY && (
                <>
                  <Typography gutterBottom sx={TITLE_STYLE}>
                    {metricX.name} vs {metricY.name} (Grouped Bar Chart)
                    {metricX && metricY && (metricX.type !== 'categorical' || metricY.type !== 'categorical') && (
                      <Box component="span" sx={{ color: '#e29943', fontSize: '0.8em', fontStyle: 'italic', display: 'block' }}>
                        Note: For optimal categorical visualization, both metrics should be categorical type
                      </Box>
                    )}
                  </Typography>
                  <ResponsiveContainer>
                    <ReBarChart data={getGroupedBarData()} margin={{ top: 32, right: 32, left: 32, bottom: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category"
                        tickFormatter={(cat) => `${metricX.name} (${cat})`}
                        tick={TICK_STYLE}
                        label={{ value: 'Category', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis allowDecimals={false} tick={TICK_STYLE} />
                      <Tooltip />
                      <Legend verticalAlign="top" align="center" />
                      <ReBar dataKey={sectorA || 'A'} fill="#4a90e2" />
                      <ReBar dataKey={sectorB || 'B'} fill="#e24a4a" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </>
              )}
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 