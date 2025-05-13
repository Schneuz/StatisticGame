import React from 'react';
import { Paper, Typography } from '@mui/material';
import { useDrop } from 'react-dnd';

interface VariableSlotProps {
  id: string;
  label: string;
  onDrop: (metricId: string) => void;
  currentMetric: string | null;
}

export const VariableSlot: React.FC<VariableSlotProps> = ({ id, label, onDrop, currentMetric }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'metric',
    drop: (item: { id: string }) => {
      onDrop(item.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const getBorderColor = () => {
    if (isOver && canDrop) return '#4a90e2';
    if (canDrop) return '#666';
    return '#444';
  };

  return (
    <Paper
      ref={drop}
      sx={{
        p: 2,
        height: '80px',
        backgroundColor: '#2a2a2a',
        border: '2px dashed',
        borderColor: getBorderColor(),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'default',
        transition: 'all 0.2s',
      }}
    >
      <Typography variant="caption" sx={{ color: '#999', mb: 1 }}>
        {label}
      </Typography>
      {currentMetric ? (
        <Typography variant="body2" sx={{ color: '#fff' }}>
          {currentMetric}
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ color: '#666' }}>
          Drop metric here
        </Typography>
      )}
    </Paper>
  );
}; 