import { Box, IconButton, Typography, Slider } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

interface PlayerControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerControls({
  playing,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
}: PlayerControlsProps) {
  const remainingTime = duration - currentTime;

  const handleSliderChange = (_: Event, value: number | number[]) => {
    onSeek(value as number);
  };

  return (
    <Box sx={{ width: '100%', px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <IconButton
          onClick={onPlayPause}
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {playing ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
        </IconButton>
      </Box>

      <Slider
        value={currentTime}
        max={duration || 100}
        onChange={handleSliderChange}
        sx={{ mb: 1 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {formatTime(currentTime)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          -{formatTime(remainingTime)}
        </Typography>
      </Box>
    </Box>
  );
}
