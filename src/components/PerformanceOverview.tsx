import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button
} from '@mui/material';
import { useGame, PortfolioItem } from '../contexts/GameContext';
import { SectorSell } from './SectorSell';

interface PerformanceOverviewProps {
  portfolio: PortfolioItem[];
  currentPrices: Record<string, number>;
}

const formatNumber = (num: number): string => {
  // First round to 2 decimal places
  const roundedNum = Number(num.toFixed(2));
  // Then format with apostrophes for thousands
  return roundedNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
};

export const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({ portfolio, currentPrices }) => {
  const { state, dispatch } = useGame();
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const handleSell = (sectorName: string, quantity: number) => {
    dispatch({ type: 'SELL_SECTOR', sectorName, quantity });
    setSelectedItem(null);
  };

  const calculateTotalValue = () => {
    return portfolio.reduce((total, item) => {
      const currentPrice = currentPrices[item.sector.name] || item.sector.currentPrice;
      return total + (currentPrice * item.quantity);
    }, 0);
  };

  const totalValue = calculateTotalValue();
  const initialCapital = 10000;
  const percentChange = ((totalValue - initialCapital) / initialCapital) * 100;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, backgroundColor: '#1e1e1e', border: '1px solid #4a90e2' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              Available Capital
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              ${formatNumber(state.capital)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, backgroundColor: '#1e1e1e', border: '1px solid #4a90e2' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              Total Portfolio Value
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ color: 'white' }}>
                ${formatNumber(totalValue)}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: percentChange >= 0 ? '#43e294' : '#e24a4a',
                  fontWeight: 700,
                  minWidth: 80
                }}
              >
                {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Portfolio Overview
        </Typography>
        <TableContainer component={Box} sx={{ backgroundColor: '#1e1e1e', borderRadius: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>Sector</TableCell>
                <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>Quantity</TableCell>
                <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>Purchase Price</TableCell>
                <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>Current Price</TableCell>
                <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>Total Value</TableCell>
                <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolio.map((item) => (
                <TableRow key={item.sector.name}>
                  <TableCell sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>{item.sector.name}</TableCell>
                  <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>${formatNumber(item.purchasePrice)}</TableCell>
                  <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>${formatNumber(item.sector.currentPrice)}</TableCell>
                  <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>${formatNumber(item.sector.currentPrice * item.quantity)}</TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #4a90e2' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setSelectedItem(item)}
                      sx={{
                        backgroundColor: '#4a90e2',
                        '&:hover': {
                          backgroundColor: '#2196f3'
                        }
                      }}
                    >
                      Sell
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>Total Portfolio Value:</TableCell>
                <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>${formatNumber(totalValue)}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #4a90e2' }}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {selectedItem && (
        <SectorSell
          portfolioItem={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSell={handleSell}
        />
      )}
    </Box>
  );
}; 