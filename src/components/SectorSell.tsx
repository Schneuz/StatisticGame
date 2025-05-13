import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Slider
} from '@mui/material';
import { PortfolioItem } from '../contexts/GameContext';

interface SectorSellProps {
  portfolioItem: PortfolioItem | null;
  onClose: () => void;
  onSell: (sectorName: string, quantity: number) => void;
}

export const SectorSell: React.FC<SectorSellProps> = ({
  portfolioItem,
  onClose,
  onSell
}) => {
  const [quantity, setQuantity] = useState<number>(0);

  if (!portfolioItem) return null;

  const handleQuantityChange = (event: Event, newValue: number | number[]) => {
    setQuantity(newValue as number);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0 && value <= portfolioItem.quantity) {
      setQuantity(value);
    }
  };

  const handleSell = () => {
    if (quantity > 0 && quantity <= portfolioItem.quantity) {
      onSell(portfolioItem.sector.name, quantity);
      setQuantity(0);
    }
  };

  const totalValue = quantity * portfolioItem.sector.currentPrice;

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      PaperProps={{
        style: {
          backgroundColor: '#1e1e1e',
          color: 'white'
        }
      }}
    >
      <DialogTitle>
        Sell Sector: {portfolioItem.sector.name}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Current Price: ${portfolioItem.sector.currentPrice.toFixed(2)}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Available Units: {portfolioItem.quantity}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Maximum Quantity: {portfolioItem.quantity}
        </Typography>

        <Typography variant="body1" sx={{ mb: 1 }}>
          Select Quantity:
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setQuantity(portfolioItem.quantity)}
            sx={{
              borderColor: 'white',
              color: 'white',
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: '#2196f3',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Sell All ({portfolioItem.quantity})
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Slider
            value={quantity}
            onChange={handleQuantityChange}
            min={0}
            max={portfolioItem.quantity}
            step={1}
            valueLabelDisplay="auto"
            sx={{
              color: '#2196f3',
              '& .MuiSlider-thumb': {
                backgroundColor: '#fff',
              },
              '& .MuiSlider-track': {
                backgroundColor: '#2196f3',
              },
              '& .MuiSlider-rail': {
                backgroundColor: '#666',
              }
            }}
          />
        </Box>

        <Typography variant="body1" sx={{ mb: 1 }}>
          Quantity
        </Typography>
        <TextField
          value={quantity}
          onChange={handleInputChange}
          type="number"
          fullWidth
          inputProps={{
            min: 0,
            max: portfolioItem.quantity,
            style: { 
              color: 'white',
              backgroundColor: '#333',
              padding: '12px'
            }
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#666',
              },
              '&:hover fieldset': {
                borderColor: '#2196f3',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2196f3',
              },
            }
          }}
        />

        <Typography variant="body1">
          Total Value: ${totalValue.toFixed(2)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          sx={{ color: '#2196f3' }}
        >
          CANCEL
        </Button>
        <Button
          onClick={handleSell}
          variant="contained"
          disabled={quantity <= 0 || quantity > portfolioItem.quantity}
          sx={{
            backgroundColor: '#333',
            '&:hover': {
              backgroundColor: '#444'
            },
            '&:not(:disabled)': {
              backgroundColor: '#2196f3',
              '&:hover': {
                backgroundColor: '#1976d2'
              }
            }
          }}
        >
          SELL
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 