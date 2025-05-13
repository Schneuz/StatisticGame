import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  ListSubheader,
  Paper
} from '@mui/material';
import { sectors } from '../data/sectors';

interface TTestAnalysisProps {
  onClose: () => void;
}

export const TTestAnalysis: React.FC<TTestAnalysisProps> = ({ onClose }) => {
  const [group1Sectors, setGroup1Sectors] = useState<string[]>([]);
  const [group2Sectors, setGroup2Sectors] = useState<string[]>([]);
  const [tTestResult, setTTestResult] = useState<number | null>(null);

  const calculateMean = (sectorNames: string[]) => {
    if (sectorNames.length === 0) return 0;
    const prices = sectorNames.map(name => {
      const sector = sectors.find(s => s.name === name);
      return sector ? sector.currentPrice : 0;
    });
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  };

  const group1Mean = calculateMean(group1Sectors);
  const group2Mean = calculateMean(group2Sectors);

  const handleSectorSelect = (event: any, groupNumber: number) => {
    const value = event.target.value as string[];
    if (groupNumber === 1) {
      setGroup1Sectors(value);
    } else {
      setGroup2Sectors(value);
    }
  };

  const handleRunTest = () => {
    // Implement T-Test calculation here
    // For now, just set a random result
    setTTestResult(Math.random());
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1e1e1e', color: 'white' }}>
      <Typography variant="h5" gutterBottom>
        T-Test Analysis
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ color: '#4a90e2' }}>Select Sectors - Group 1</InputLabel>
          <Select
            multiple
            value={group1Sectors}
            onChange={(e) => handleSectorSelect(e, 1)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4a90e2',
              },
            }}
          >
            {sectors.map(sector => (
              <MenuItem key={sector.name} value={sector.name}>
                {sector.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={{ color: '#4a90e2' }}>Select Sectors - Group 2</InputLabel>
          <Select
            multiple
            value={group2Sectors}
            onChange={(e) => handleSectorSelect(e, 2)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4a90e2',
              },
            }}
          >
            {sectors.map(sector => (
              <MenuItem key={sector.name} value={sector.name}>
                {sector.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography>
          Group 1 Mean: ${group1Mean.toFixed(2)}
        </Typography>
        <Typography>
          Group 2 Mean: ${group2Mean.toFixed(2)}
        </Typography>
      </Box>

      {tTestResult !== null && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#2e2e2e' }}>
          <Typography>
            T-Test Result: {tTestResult.toFixed(4)}
          </Typography>
          <Typography>
            {tTestResult < 0.05 
              ? "The difference between the groups is statistically significant."
              : "The difference between the groups is not statistically significant."}
          </Typography>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleRunTest}
          disabled={group1Sectors.length === 0 || group2Sectors.length === 0}
        >
          Run T-Test
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Box>
    </Box>
  );
}; 