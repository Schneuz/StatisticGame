import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Slider,
  Box
} from '@mui/material';
import { Sector } from '../data/sectors';

interface SectorPurchaseProps {
  sector: Sector | null;
  availableCapital: number;
  onClose: () => void;
  onPurchase: (sector: Sector, quantity: number) => void;
}

export const SectorPurchase: React.FC<SectorPurchaseProps> = ({
  sector,
  availableCapital,
  onClose,
  onPurchase
}) => {
  const [quantity, setQuantity] = useState(0);

  if (!sector) return null;

  const maxQuantity = Math.floor(availableCapital / sector.currentPrice);
  const totalCost = quantity * sector.currentPrice;

  const handleSliderChange = (_: any, value: number | number[]) => {
    setQuantity(typeof value === 'number' ? value : value[0]);
  };

  const handleBuyMax = () => {
    setQuantity(maxQuantity);
  };

  return (
    <Dialog 
      open={!!sector} 
      onClose={onClose}
      PaperProps={{
        style: {
          backgroundColor: '#1e1e1e',
          color: 'white',
        }
      }}
    >
      <DialogTitle>
        Buy Sector: {sector.name}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Current Price: ${sector.currentPrice.toFixed(2)}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Available Capital: ${availableCapital.toFixed(2)}
        </Typography>

        <Typography variant="body1" sx={{ mb: 1 }}>
          Select Quantity:
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBuyMax}
            sx={{
              borderColor: 'white',
              color: 'white',
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: '#2196f3',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
            disabled={maxQuantity === 0}
          >
            Buy Max ({maxQuantity})
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Slider
            value={quantity}
            onChange={handleSliderChange}
            min={0}
            max={maxQuantity}
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
            disabled={maxQuantity === 0}
          />
        </Box>

        <Typography variant="body1" sx={{ mb: 1 }}>
          Quantity
        </Typography>
        <TextField
          value={quantity}
          onChange={(e) => setQuantity(Math.min(Number(e.target.value), maxQuantity))}
          type="number"
          fullWidth
          inputProps={{
            min: 0,
            max: maxQuantity,
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
          Total Cost: ${totalCost.toFixed(2)}
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
          onClick={() => onPurchase(sector, quantity)}
          variant="contained"
          disabled={quantity <= 0 || totalCost > availableCapital}
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
          BUY
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 