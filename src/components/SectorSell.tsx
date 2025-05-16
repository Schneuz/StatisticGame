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
  Slider,
  IconButton
} from '@mui/material';
import { PortfolioItem } from '../contexts/GameContext';
import CloseIcon from '@mui/icons-material/Close';

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
          Sell Sector: {portfolioItem.sector.name}
        </Typography>
        <IconButton 
          onClick={onClose}
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
          onClick={handleSell}
          variant="contained"
          fullWidth
          disabled={quantity <= 0 || quantity > portfolioItem.quantity}
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
          SELL
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 