import React from 'react';
import { Button, Typography, Container, Box, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface HomePageProps {
  onStart: () => void;
}

export function HomePage({ onStart }: HomePageProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        py: 4 
      }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 600 }}>
          <Typography variant="h4" gutterBottom>
            Sector Investment Pro
          </Typography>
          
          <Typography variant="body1" paragraph>
            Welcome to Sector Investment Pro! Your journey to becoming a successful sector investor begins here.
          </Typography>

          <Typography variant="h6" gutterBottom>
            Features:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircleOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="• Real-time sector trading simulation" />
            </ListItem>
            {/* ... other list items ... */}
          </List>

          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={onStart}
            sx={{ mt: 2 }}
          >
            Start Your Career
          </Button>
        </Paper>
      </Box>
    </Container>
  );
} 