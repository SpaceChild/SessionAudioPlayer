import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Fab,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { ArrowBack, BookmarkAdd } from '@mui/icons-material';
import { filesApi, marksApi, getStreamUrl } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import PlayerControls from '../components/PlayerControls';
import MarkDialog from '../components/MarkDialog';
import MarksList from '../components/MarksList';
import type { AudioFile, TimeMark } from '../types';

export default function PlayerPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<AudioFile | null>(null);
  const [marks, setMarks] = useState<TimeMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [pendingMarkTime, setPendingMarkTime] = useState(0);

  const streamUrl = fileId ? getStreamUrl(parseInt(fileId)) : '';
  const audioPlayer = useAudioPlayer(streamUrl);

  useEffect(() => {
    if (!fileId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [fileData, marksData] = await Promise.all([
          filesApi.getById(parseInt(fileId)),
          marksApi.getByFileId(parseInt(fileId)),
        ]);
        setFile(fileData);
        setMarks(marksData);
      } catch (err) {
        setError('Failed to load audio file');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fileId]);

  const handleMarkCreate = () => {
    setPendingMarkTime(audioPlayer.currentTime);
    setMarkDialogOpen(true);
  };

  const handleMarkSave = async (note: string) => {
    if (!fileId) return;

    try {
      const newMark = await marksApi.create(
        parseInt(fileId),
        pendingMarkTime,
        note
      );
      setMarks((prev) => [...prev, newMark].sort((a, b) => a.time_seconds - b.time_seconds));
      setMarkDialogOpen(false);
    } catch (err) {
      setError('Failed to create mark');
    }
  };

  const handleMarkClick = (mark: TimeMark) => {
    audioPlayer.seek(mark.time_seconds);
    if (!audioPlayer.playing) {
      audioPlayer.play();
    }
  };

  const handleMarkDelete = async (mark: TimeMark) => {
    try {
      await marksApi.delete(mark.id);
      setMarks((prev) => prev.filter((m) => m.id !== mark.id));
    } catch (err) {
      setError('Failed to delete mark');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!file) {
    return (
      <Container>
        <Alert severity="error">File not found</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/files')}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            {file.filename}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {audioPlayer.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {audioPlayer.error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <PlayerControls
            playing={audioPlayer.playing}
            currentTime={audioPlayer.currentTime}
            duration={audioPlayer.duration}
            onPlayPause={audioPlayer.togglePlay}
            onSeek={audioPlayer.seek}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Time Marks
        </Typography>

        <MarksList
          marks={marks}
          onMarkClick={handleMarkClick}
          onMarkDelete={handleMarkDelete}
        />
      </Container>

      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleMarkCreate}
        disabled={audioPlayer.loading}
      >
        <BookmarkAdd />
      </Fab>

      <MarkDialog
        open={markDialogOpen}
        onClose={() => setMarkDialogOpen(false)}
        onSave={handleMarkSave}
        timeSeconds={pendingMarkTime}
      />
    </Box>
  );
}
