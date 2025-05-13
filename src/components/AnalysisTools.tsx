import React from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useGame } from '../contexts/GameContext';

interface AnalysisToolsProps {
  onToolSelect: (toolId: string) => void;
  selectedTool: string | null;
}

export const AnalysisTools: React.FC<AnalysisToolsProps> = ({ onToolSelect, selectedTool }) => {
  const { state } = useGame();

  const tools = [
    { id: 'T-Test', name: 'T-Test' },
    { id: 'Chi-Square Test', name: 'Chi-Square Test' }
  ];

  return (
    <Box>
      {tools.map((tool) => {
        const isAvailable = state.availableTools.includes(tool.id);
        const isSelected = selectedTool === tool.id;

        return (
          <Paper
            key={tool.id}
            onClick={() => isAvailable && onToolSelect(tool.id)}
            sx={{
              p: 2,
              mb: 1,
              cursor: isAvailable ? 'pointer' : 'default',
              backgroundColor: isSelected ? '#2196f3' : '#424242',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background-color 0.3s',
              '&:hover': {
                backgroundColor: isAvailable ? (isSelected ? '#1976d2' : '#616161') : '#424242'
              }
            }}
          >
            <Typography variant="body1">
              {tool.name}
            </Typography>
            {!isAvailable && (
              <IconButton size="small" sx={{ color: 'white' }}>
                <LockIcon />
              </IconButton>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}; 