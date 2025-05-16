import React, { useEffect, useState } from 'react';
import { Button, Box, Paper, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useGame } from '../contexts/GameContext';

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export const StickyStartPauseButton: React.FC = () => {
  const { state, dispatch } = useGame();
  const isPaused = state.isAutoProgressPaused;
  const capital = state.capital;
  
  // Calculate total portfolio value
  const totalValue = state.portfolio.reduce((total, item) => {
    const currentPrice = state.currentPrices[item.sector.name] || item.sector.currentPrice;
    return total + (currentPrice * item.quantity);
  }, 0);

  // Timer logic: Zeit bis zum nächsten Market Update (alle 10 Schritte)
  const stepsPerSituation = 10;
  const msPerStep = 1000; // 1 Sekunde pro Schritt
  const stepsLeft = stepsPerSituation - (state.stepsInCurrentSituation ?? 0);
  const [timer, setTimer] = useState(stepsLeft * msPerStep);
  
  // Szenario ist abgeschlossen, wenn wir bei Schritt 9 sind (von 0-9)
  // und der Timer bei 0 ist
  const isScenarioComplete = state.stepsInCurrentSituation === 9;

  useEffect(() => {
    // Reset timer when steps change
    setTimer(stepsLeft * msPerStep);
  }, [stepsLeft]);

  useEffect(() => {
    // Set timer based on steps left, but keep at 0 if scenario is complete
    if (isScenarioComplete) {
      setTimer(0);
      // Automatically show completion popup when scenario is complete
      if (!state.showScenarioCompletionPopup) {
        dispatch({ type: 'SHOW_SCENARIO_COMPLETION_POPUP' });
      }
      return;
    }
    
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isScenarioComplete, state.showScenarioCompletionPopup, dispatch]);

  function formatTimer(ms: number) {
    if (ms === 0 && isScenarioComplete) {
      return '0s';
    }
    const sec = Math.max(0, Math.floor(ms / 1000) % 60);
    const min = Math.max(0, Math.floor(ms / 60000));
    return `${min > 0 ? min + ':' : ''}${sec.toString().padStart(2, '0')}s`;
  }

  // Handle button click based on game state
  const handleButtonClick = () => {
    if (isScenarioComplete) {
      // Schließe alle offenen Popups (globales Window-Event auslösen)
      const closePopupsEvent = new CustomEvent('closeAllPopups');
      window.dispatchEvent(closePopupsEvent);

      // Sende ein weiteres Event speziell für das ScenarioAnalysisPopup
      const closeScenarioAnalysisPopupEvent = new CustomEvent('closeScenarioAnalysisPopup');
      window.dispatchEvent(closeScenarioAnalysisPopupEvent);

      // Alle Aktien verkaufen
      state.portfolio.forEach(item => {
        dispatch({
          type: 'SELL_SECTOR',
          sectorName: item.sector.name,
          quantity: item.quantity
        });
      });

      // Aktionen für das aktuelle Szenario löschen
      import('../models/ActionTracker').then(({ ActionTracker }) => {
        ActionTracker.clearScenarioActions(state.currentSituationIndex);
      });

      // Zum nächsten Szenario wechseln
      dispatch({ type: 'ADVANCE_TO_NEXT_SCENARIO' });
      
    } else {
      // Toggle pause state
      dispatch({ type: 'TOGGLE_AUTO_PROGRESS' });
    }
  };

  // Button text and icon based on game state
  const getButtonText = () => {
    if (isScenarioComplete) {
      return 'NEXT LVL';
    }
    return isPaused ? 'START' : 'PAUSE';
  };

  const getButtonIcon = () => {
    if (isScenarioComplete) {
      return <ArrowForwardIcon />;
    }
    return isPaused ? <PlayArrowIcon /> : <PauseIcon />;
  };

  const getButtonColor = () => {
    if (isScenarioComplete) {
      return {
        background: '#e2a343', // Gold color for next level
        hoverBackground: '#c78d36'
      };
    }
    return {
      background: isPaused ? '#4caf50' : '#f44336', // Green for start, red for pause
      hoverBackground: isPaused ? '#388e3c' : '#c62828'
    };
  };

  // Level (1-basiert)
  const level = (state.currentSituationIndex ?? 0) + 1;
  const buttonColors = getButtonColor();

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 2,
        background: 'rgba(24,28,36,0.85)',
        boxShadow: 3,
      }}
    >
      {/* Timer */}
      <Paper sx={{ minWidth: 120, mr: 3, px: 2, py: 1.5, background: '#23293a', borderRadius: 2, boxShadow: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ color: '#e2c14a', fontWeight: 700 }}>Next Update</Typography>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 900 }}>{formatTimer(timer)}</Typography>
      </Paper>
      {/* Available Capital */}
      <Paper sx={{ minWidth: 180, mr: 3, px: 3, py: 1.5, background: '#23293a', borderRadius: 2, boxShadow: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ color: '#4a90e2', fontWeight: 700 }}>Available Capital</Typography>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900 }}>${formatNumber(capital)}</Typography>
      </Paper>
      {/* Center: Start/Pause Button */}
      <Button
        variant="contained"
        size="large"
        startIcon={getButtonIcon()}
        sx={{
          fontSize: 22,
          fontWeight: 700,
          px: 5,
          py: 2,
          borderRadius: 3,
          backgroundColor: buttonColors.background,
          '&:hover': {
            backgroundColor: buttonColors.hoverBackground,
          },
          boxShadow: 4,
        }}
        onClick={handleButtonClick}
      >
        {getButtonText()}
      </Button>
      {/* Total Portfolio Value */}
      <Paper sx={{ minWidth: 180, ml: 3, px: 3, py: 1.5, background: '#23293a', borderRadius: 2, boxShadow: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ color: '#4a90e2', fontWeight: 700 }}>Total Portfolio Value</Typography>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900 }}>${formatNumber(totalValue)}</Typography>
      </Paper>
      {/* Level */}
      <Paper sx={{ minWidth: 100, ml: 3, px: 2, py: 1.5, background: '#23293a', borderRadius: 2, boxShadow: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ color: '#43e294', fontWeight: 700 }}>Level</Typography>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 900 }}>{level}</Typography>
      </Paper>
    </Box>
  );
}; 