import React from 'react';
import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BoxPlotProps {
  variableX: string;
  variableY: string;
}

// Sample data - in a real application, this would come from your data source
const sampleData = [
  { name: 'Group A', min: 1, q1: 2, median: 3, q3: 4, max: 5 },
  { name: 'Group B', min: 2, q1: 3, median: 4, q3: 5, max: 6 },
  { name: 'Group C', min: 3, q1: 4, median: 5, q3: 6, max: 7 },
];

export const BoxPlot: React.FC<BoxPlotProps> = ({ variableX, variableY }) => {
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Typography variant="subtitle1" gutterBottom>
        Box Plot: {variableX} vs {variableY}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={sampleData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="median" fill="#4a90e2" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}; 