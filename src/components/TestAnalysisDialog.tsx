import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box
} from '@mui/material';
import { StatisticalAnalysis } from './StatisticalAnalysis';

interface TestAnalysisDialogProps {
  open: boolean;
  onClose: () => void;
  testType: 'ttest' | 'chisquare' | null;
}

export const TestAnalysisDialog: React.FC<TestAnalysisDialogProps> = ({
  open,
  onClose,
  testType
}) => {
  const getTestTitle = () => {
    switch (testType) {
      case 'ttest':
        return 'T-Test Analysis';
      case 'chisquare':
        return 'Chi-Square Test Analysis';
      default:
        return 'Statistical Analysis';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          zIndex: 2000,
          backgroundColor: '#1e1e1e',
          color: 'white',
          minHeight: '80vh',
          maxHeight: '90vh',
          position: 'fixed',
          top: '90px'
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid #4a90e2' }}>
        {getTestTitle()}
      </DialogTitle>
      <DialogContent sx={{ p: 0, maxHeight: 'calc(90vh - 64px)', overflowY: 'auto' }}>
        <Box sx={{ height: '100%', p: 2 }}>
          <StatisticalAnalysis initialTab={testType} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #4a90e2', p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: '#4a90e2',
            '&:hover': {
              backgroundColor: '#2196f3'
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 