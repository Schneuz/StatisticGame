import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Slider,
  Box,
  IconButton
} from '@mui/material';
import { Sector } from '../data/sectors';
import CloseIcon from '@mui/icons-material/Close';
import { useGame } from '../contexts/GameContext';

export interface SectorPurchaseProps {
  onPurchase: (sector: Sector, quantity: number) => void;
  selectedSector: Sector | null;
  onSectorSelect: (sector: Sector | null) => void;
}

export const SectorPurchase: React.FC<SectorPurchaseProps> = ({
  onPurchase,
  selectedSector,
  onSectorSelect
}) => {
  const { state } = useGame();
  const [quantity, setQuantity] = useState(1);
  
  // Reset quantity when selected sector changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSector]);
  
  if (!selectedSector) return null;
  
  const maxQuantity = Math.floor(state.capital / selectedSector.currentPrice);
  const totalCost = quantity * selectedSector.currentPrice;

  const handleSliderChange = (_: any, value: number | number[]) => {
    setQuantity(typeof value === 'number' ? value : value[0]);
  };

  const handleMax = () => {
    setQuantity(maxQuantity);
  };

  return (
    <Dialog 
      open={!!selectedSector} 
      onClose={() => onSectorSelect(null)}
      PaperProps={{
        sx: {
          backgroundColor: '#23272f',
          color: 'white',
          border: '2px solid #43e294',
          borderRadius: 0,
          minHeight: 420,
          maxHeight: '90vh',
          position: 'fixed',
          top: '90px',
          zIndex: 2000,
          p: 0,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #4a90e2',
        py: 2,
        pr: 7,
        background: 'rgba(34, 50, 60, 0.7)',
        position: 'relative',
        minHeight: 0
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
          Buy Sector: {selectedSector.name}
        </Typography>
        <IconButton 
          onClick={() => onSectorSelect(null)}
          sx={{ 
            color: 'white',
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            p: 0.5,
            '&:hover': {
              color: '#ff4444'
            }
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        <Typography variant="body1" sx={{ mb: 2, mt: 2 }}>
          Current Price: ${selectedSector.currentPrice.toFixed(2)}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Available Capital: ${state.capital.toFixed(2)}
        </Typography>

        <Typography variant="body1" sx={{ mb: 1 }}>
          Select Quantity:
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleMax}
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
          onClick={() => onSectorSelect(null)}
          fullWidth
          sx={{ 
            color: '#fff',
            backgroundColor: '#444',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            py: 1.2,
            borderRadius: 1,
            mr: 2,
            '&:hover': {
              backgroundColor: '#666'
            }
          }}
        >
          CANCEL
        </Button>
        <Button
          onClick={() => onPurchase(selectedSector, quantity)}
          variant="contained"
          fullWidth
          disabled={quantity <= 0 || totalCost > state.capital}
          sx={{
            backgroundColor: '#2196f3',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            py: 1.2,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: '#1769aa',
              color: '#fff'
            },
            ml: 2
          }}
        >
          BUY
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 