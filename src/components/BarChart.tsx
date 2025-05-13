import React from 'react';
import { Box, Typography } from '@mui/material';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  variableX: string;
  variableY: string;
}

// Sample data - in a real application, this would come from your data source
const sampleData = [
  { name: 'Category A', value: 400 },
  { name: 'Category B', value: 300 },
  { name: 'Category C', value: 200 },
  { name: 'Category D', value: 500 },
];

export const BarChart: React.FC<BarChartProps> = ({ variableX, variableY }) => {
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Typography variant="subtitle1" gutterBottom>
        Bar Chart: {variableX} vs {variableY}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <RechartsBarChart
          data={sampleData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#43e294" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </Box>
  );
}; 