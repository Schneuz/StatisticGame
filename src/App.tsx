import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import { useGame } from './contexts/GameContext';
import { SectorPurchase } from './components/SectorBuy';
import { Sector } from './data/sectors';
import { HeaderWithScenario } from './components/HeaderWithScenario';
import { StickyStartPauseButton } from './components/StickyStartPauseButton';
import { PlayerActionAnalysis } from './components/PlayerActionAnalysis';
import { ActionTracker } from './models/ActionTracker';
import { StartupVideoPopup } from './components/StartupVideoPopup';

function App() {
  const { state, dispatch } = useGame();
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showStartupVideo, setShowStartupVideo] = useState(true);

  const handlePurchase = (sector: Sector, quantity: number) => {
    // Track the stock purchase action
    ActionTracker.addAction('stock_purchase', {
      purchasedSector: sector.name,
      quantity: quantity,
      isCorrect: true // Assuming all purchases are "correct" as they represent player decisions
    });
    
    // Dispatch purchase action
    dispatch({ type: 'PURCHASE_SECTOR', sector, quantity });
    setSelectedSector(null);
  };

  const handleCloseScenarioAnalysis = () => {
    dispatch({ type: 'CLOSE_SCENARIO_COMPLETION_POPUP' });
  };

  // Nur beim allerersten Laden anzeigen
  useEffect(() => {
    setShowStartupVideo(true);
  }, []);

  return (
    <Container maxWidth="lg">
      <StartupVideoPopup open={showStartupVideo} onClose={() => setShowStartupVideo(false)} />
      
      {/* Sticky bar placed at the top */}
      <StickyStartPauseButton />
      
      <Box sx={{ mt: 2, mb: 4 }}>
        <HeaderWithScenario />
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SectorPurchase 
          onSectorSelect={setSelectedSector} 
          selectedSector={selectedSector}
          onPurchase={handlePurchase}
        />
      </Box>
      
      {state.showScenarioCompletionPopup && (
        <PlayerActionAnalysis
          open={state.showScenarioCompletionPopup}
          onClose={handleCloseScenarioAnalysis}
          situationIndex={state.currentSituationIndex}
        />
      )}
    </Container>
  );
}

export default App; 