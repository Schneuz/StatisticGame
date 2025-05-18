import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import introVideo from './Audio/Intro.mp4';

interface StartupVideoPopupProps {
  open: boolean;
  onClose: () => void;
}

export const StartupVideoPopup: React.FC<StartupVideoPopupProps> = ({ open, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        videoRef.current?.play();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" disableEnforceFocus>
      <DialogContent sx={{ position: 'relative', p: 0 }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
        <video
          ref={videoRef}
          width="600"
          controls
          muted
          style={{ display: 'block', width: '100%', borderRadius: 8, background: 'black' }}
        >
          <source src={introVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </DialogContent>
    </Dialog>
  );
}; 