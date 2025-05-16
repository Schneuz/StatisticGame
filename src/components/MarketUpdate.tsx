import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useGame } from '../contexts/GameContext';

export const MarketUpdate: React.FC = () => {
  const { state } = useGame();
  const { marketSituation } = state;
  const [showHelp, setShowHelp] = useState(false);

  if (!marketSituation) {
    return null;
  }

  const situationNumber = state.currentSituationIndex + 1;
  const timeUntilNext = Math.max(0, 10 - (state.stepsInCurrentSituation % 10));

  return (
    <>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: '#1e1e1e',
          color: 'white',
          borderRadius: 2,
          border: '1px solid #2196f3'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h5" sx={{ color: '#2196f3' }}>
                Market Update
              </Typography>
              <Chip 
                label={`Situation ${situationNumber}`}
                sx={{ 
                  backgroundColor: '#2196f3',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Chip 
                label={`Next update in ${timeUntilNext} steps`}
                sx={{ 
                  backgroundColor: '#333',
                  color: 'white'
                }}
              />
            </Box>
            <Typography variant="body1" sx={{ color: '#fff' }}>
              {marketSituation.description}
            </Typography>
          </Box>
          {marketSituation.recommendedTool && (
            <IconButton 
              onClick={() => setShowHelp(true)}
              sx={{ 
                color: '#2196f3',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.1)'
                }
              }}
            >
              <HelpOutlineIcon />
            </IconButton>
          )}
        </Box>
      </Paper>

      <Dialog 
        open={showHelp} 
        onClose={() => setShowHelp(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            color: 'white',
            border: '1px solid #2196f3'
          }
        }}
      >
        <DialogTitle sx={{ color: '#2196f3' }}>Analysis Recommendation</DialogTitle>
        <DialogContent sx={{ p: 2, maxHeight: { xs: '60vh', sm: '70vh', md: '80vh' }, overflowY: 'auto' }}>
          <Typography variant="body1" gutterBottom>
            {marketSituation.toolDescription}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: '#2196f3' }}>
            Expected Outcome:
          </Typography>
          <Typography variant="body1">
            {marketSituation.expectedOutcome}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowHelp(false)}
            sx={{ 
              color: '#2196f3',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.1)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 