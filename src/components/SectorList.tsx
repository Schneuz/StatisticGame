import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import { Sector, sectors } from '../data/sectors';

interface SectorListProps {
  onBuyClick: (sector: Sector) => void;
  availableCapital: number;
}

export const SectorList: React.FC<SectorListProps> = ({ onBuyClick, availableCapital }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSectors = sectors.filter((sector: Sector) => {
    return sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sector.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Box sx={{ width: '100%', maxWidth: 800, margin: '0 auto', p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Search sectors"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            width: '100%',
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': {
                borderColor: '#4a90e2',
              },
              '&:hover fieldset': {
                borderColor: '#4a90e2',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4a90e2',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#4a90e2',
            },
          }}
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2' }}>Sector</TableCell>
              <TableCell sx={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2' }}>Description</TableCell>
              <TableCell align="right" sx={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2' }}>Price</TableCell>
              <TableCell align="right" sx={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSectors.map((sector: Sector) => (
              <TableRow 
                key={sector.name}
                sx={{ 
                  '&:hover': {
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                  },
                }}
              >
                <TableCell sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>{sector.name}</TableCell>
                <TableCell sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>{sector.description}</TableCell>
                <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #4a90e2' }}>${sector.currentPrice.toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ borderBottom: '1px solid #4a90e2' }}>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: '#4a90e2',
                      color: 'white',
                      fontWeight: 700,
                      '&:hover': {
                        backgroundColor: '#1976d2',
                      },
                    }}
                    onClick={() => onBuyClick(sector)}
                  >
                    Buy
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 