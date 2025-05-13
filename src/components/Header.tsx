import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useGame } from '../contexts/GameContext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

export const Header: React.FC = () => {
  const { state, dispatch } = useGame();

  const handleToggleAutoProgress = () => {
    dispatch({ type: 'TOGGLE_AUTO_PROGRESS' });
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Sector Investment Simulation
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
          <Button 
            variant="contained"
            color={state.isAutoProgressPaused ? "primary" : "secondary"}
            onClick={handleToggleAutoProgress}
            startIcon={state.isAutoProgressPaused ? <PlayArrowIcon /> : <PauseIcon />}
            sx={{ 
              minWidth: '160px',
              backgroundColor: state.isAutoProgressPaused ? '#4caf50' : '#f44336',
              '&:hover': {
                backgroundColor: state.isAutoProgressPaused ? '#45a049' : '#d32f2f'
              }
            }}
          >
            {state.isAutoProgressPaused ? 'Continue' : 'Pause'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'flex-end' }}>
          <Button 
            color="inherit" 
            onClick={() => dispatch({ type: 'RESET_GAME' })}
          >
            NEW GAME
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 