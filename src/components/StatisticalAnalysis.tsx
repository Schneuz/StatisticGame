import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Grid,
  Select,
  MenuItem,
  FormControl,
  Paper
} from '@mui/material';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { sectors } from '../data/sectors';

interface StatisticalAnalysisProps {
  initialTab: 'ttest' | 'chisquare' | null;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

interface Point {
  x: number;
  y: number;
  sector: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const getHistoricalData = (sectorName: string | null): number[] => {
  if (!sectorName) return [];
  const sector = sectors.find(s => s.name === sectorName);
  if (!sector) return [];
  return [...sector.historicalPrices, sector.currentPrice];
};

const calculateMeanAndError = (data: number[]) => {
  if (data.length === 0) return { mean: 0, error: 0 };
  
  const validData = data.filter(val => !isNaN(val) && val !== null);
  if (validData.length === 0) return { mean: 0, error: 0 };
  
  const mean = validData.reduce((a, b) => a + b, 0) / validData.length;
  const variance = validData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (validData.length - 1);
  const stdError = Math.sqrt(variance / validData.length);
  
  return {
    mean: mean || 0,
    error: (stdError * 1.96) || 0 // 95% confidence interval
  };
};

const BoxPlotChart = ({ sector1, sector2 }: { sector1: string | null, sector2: string | null }) => {
  const data1 = useMemo(() => {
    const rawData = sector1 ? getHistoricalData(sector1) : [];
    return rawData.filter(val => !isNaN(val) && val !== null);
  }, [sector1]);

  const data2 = useMemo(() => {
    const rawData = sector2 ? getHistoricalData(sector2) : [];
    return rawData.filter(val => !isNaN(val) && val !== null);
  }, [sector2]);

  const scatterData = useMemo(() => {
    const points: Point[] = [];
    
    if (data1.length > 0) {
      data1.forEach(value => {
        points.push({
          x: value,
          y: 1,
          sector: sector1 || ''
        });
      });
    }
    if (data2.length > 0) {
      data2.forEach(value => {
        points.push({
          x: value,
          y: 2,
          sector: sector2 || ''
        });
      });
    }
    return points;
  }, [data1, data2, sector1, sector2]);

  const yDomain = useMemo(() => {
    if (scatterData.length === 0) return [0, 100];
    const values = scatterData.map(d => d.x);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = ((max - min) || 100) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }, [scatterData]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          domain={yDomain}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[0, 3]}
          ticks={[1, 2]}
          tickFormatter={(value) => {
            if (value === 1) return sector1 || '';
            if (value === 2) return sector2 || '';
            return '';
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={yDomain}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const data = payload[0].payload;
            return (
              <div style={{ backgroundColor: '#2a2a2a', padding: '10px', border: '1px solid #666' }}>
                <p style={{ color: 'white', margin: 0 }}>{`${data.sector}`}</p>
                <p style={{ color: 'white', margin: 0 }}>{`Value: ${data.y.toFixed(2)}`}</p>
              </div>
            );
          }}
        />
        <Legend />
        {sector1 && (
          <Scatter
            name={sector1}
            data={scatterData.filter(d => d.sector === sector1)}
            fill="#4a90e2"
          />
        )}
        {sector2 && (
          <Scatter
            name={sector2}
            data={scatterData.filter(d => d.sector === sector2)}
            fill="#43e294"
          />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
};

const MeanComparisonChart = ({ sector1, sector2 }: { sector1: string | null, sector2: string | null }) => {
  const chartData = useMemo(() => {
    const result = [];
    
    if (sector1) {
      const data = getHistoricalData(sector1);
      const stats = calculateMeanAndError(data);
      result.push({
        name: sector1,
        value: stats.mean,
        error: stats.error
      });
    }
    
    if (sector2) {
      const data = getHistoricalData(sector2);
      const stats = calculateMeanAndError(data);
      result.push({
        name: sector2,
        value: stats.mean,
        error: stats.error
      });
    }
    
    return result;
  }, [sector1, sector2]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 'auto']} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#4a90e2" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({ initialTab }) => {
  const [tabValue, setTabValue] = useState(
    initialTab === 'ttest' ? 0 : 
    initialTab === 'chisquare' ? 1 : 0
  );
  const [sector1, setSector1] = useState<string | null>(null);
  const [sector2, setSector2] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ color: 'white', p: 3 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, backgroundColor: '#2a2a2a', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#4a90e2' }}>
              Select First Sector
            </Typography>
            <FormControl fullWidth>
              <Select
                value={sector1 || ''}
                onChange={(e) => setSector1(e.target.value as string)}
                sx={{
                  color: 'white',
                  backgroundColor: '#1e1e1e',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4a90e2',
                  }
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {sectors.map((sector) => (
                  <MenuItem 
                    key={sector.name} 
                    value={sector.name}
                    disabled={sector.name === sector2}
                  >
                    {sector.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, backgroundColor: '#2a2a2a', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#43e294' }}>
              Select Second Sector
            </Typography>
            <FormControl fullWidth>
              <Select
                value={sector2 || ''}
                onChange={(e) => setSector2(e.target.value as string)}
                sx={{
                  color: 'white',
                  backgroundColor: '#1e1e1e',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#43e294',
                  }
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {sectors.map((sector) => (
                  <MenuItem 
                    key={sector.name} 
                    value={sector.name}
                    disabled={sector.name === sector1}
                  >
                    {sector.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="T-Test Analysis" />
        <Tab label="Chi-Square Test" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, backgroundColor: '#2a2a2a', borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Box Plot Comparison
              </Typography>
              <BoxPlotChart sector1={sector1} sector2={sector2} />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, backgroundColor: '#2a2a2a', borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Mean Comparison
              </Typography>
              <MeanComparisonChart sector1={sector1} sector2={sector2} />
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography>Chi-Square Test Analysis</Typography>
      </TabPanel>
    </Box>
  );
}; 