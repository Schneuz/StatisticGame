import React from 'react';
import { useDrag } from 'react-dnd';
import { Paper, Typography, Box } from '@mui/material';

export interface MetricCardProps {
  id: string;
  name: string;
  type: 'numerical' | 'categorical';
  icon: string;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ id, name, type, icon, color = '#4a90e2' }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'metric',
    item: { id, name, type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <Paper
      ref={drag}
      sx={{
        p: 1.5,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: color,
        '&:hover': {
          filter: 'brightness(110%)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
          {name}
        </Typography>
      </Box>
    </Paper>
  );
}; 