import React, { useState } from 'react';
import { Box, Container } from '@mui/material';
import { useGame } from './contexts/GameContext';
import { SectorPurchase } from './components/SectorBuy';
import { Sector } from './data/sectors';
import { HeaderWithScenario } from './components/HeaderWithScenario';
import { StickyStartPauseButton } from './components/StickyStartPauseButton';
import { TestSelection } from './components/TestSelection';
import { PlayerActionAnalysis } from './components/PlayerActionAnalysis';
import { ActionTracker } from './models/ActionTracker';

function App() {
  const { state, dispatch } = useGame();
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

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

  return (
    <Container maxWidth="lg">
      <StickyStartPauseButton />
      <HeaderWithScenario />
      <Box sx={{ my: 4 }}>
        {/* Statistical Tests Section */}
        <Box sx={{ mb: 4 }}>
          <TestSelection />
        </Box>

        <SectorPurchase
          sector={selectedSector}
          availableCapital={state.capital}
          onClose={() => setSelectedSector(null)}
          onPurchase={handlePurchase}
        />
      </Box>

      {/* Player Action Analysis Popup */}
      <PlayerActionAnalysis
        open={state.showScenarioCompletionPopup}
        onClose={handleCloseScenarioAnalysis}
        situationIndex={state.currentSituationIndex}
      />
    </Container>
  );
}

export default App; 