import React from 'react';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Box
} from '@mui/material';
import { useGame } from '../contexts/GameContext';
import { sectors } from '../data/sectors';

export function Portfolio() {
  const { state, dispatch } = useGame();

  const calculateTotalValue = () => {
    return state.portfolio.reduce((total, item) => {
      const sector = sectors.find(s => s.name === item.sector.name);
      return total + (sector?.currentPrice || 0) * item.quantity;
    }, 0);
  };

  const handleSell = (sectorName: string) => {
    const portfolioItem = state.portfolio.find(item => item.sector.name === sectorName);
    if (portfolioItem) {
      dispatch({ type: 'SELL_SECTOR', sectorName, quantity: 1 });
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Performance Overview
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" color="primary">
          Total Value: ${calculateTotalValue().toLocaleString()}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sector</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Current Price</TableCell>
              <TableCell align="right">Total Value</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.portfolio.map((item) => {
              const sector = sectors.find(s => s.name === item.sector.name);
              if (!sector) return null;
              
              return (
                <TableRow key={item.sector.name}>
                  <TableCell>{item.sector.name}</TableCell>
                  <TableCell>{sector.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">${item.sector.currentPrice.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    ${(item.quantity * item.sector.currentPrice).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleSell(item.sector.name)}
                    >
                      Sell
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
} 