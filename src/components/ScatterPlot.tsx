import React from 'react';
import { Box, Typography } from '@mui/material';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScatterPlotProps {
  variableX: string;
  variableY: string;
}

// Sample data - in a real application, this would come from your data source
const sampleData = [
  { x: 1, y: 2 },
  { x: 2, y: 3 },
  { x: 3, y: 4 },
  { x: 4, y: 5 },
  { x: 5, y: 6 },
];

export const ScatterPlot: React.FC<ScatterPlotProps> = ({ variableX, variableY }) => {
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Typography variant="subtitle1" gutterBottom>
        Scatter Plot: {variableX} vs {variableY}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name={variableX} />
          <YAxis type="number" dataKey="y" name={variableY} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={sampleData} fill="#4a90e2" />
        </ScatterChart>
      </ResponsiveContainer>
    </Box>
  );
}; 