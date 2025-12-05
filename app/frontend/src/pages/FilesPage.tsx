import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Fab,
  Snackbar,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { filesApi } from '../services/api';
import { useContextMenu } from '../hooks/useContextMenu';
import ContextMenu from '../components/ContextMenu';
import type { AudioFile } from '../types';

interface FilesPageProps {
  onLogout: () => void;
}

export default function FilesPage({ onLogout }: FilesPageProps) {
  const navigate = useNavigate();
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const { contextMenu, handleContextMenu, handleClose } = useContextMenu();

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await filesApi.getAll();
      setFiles(data);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleScan = async () => {
    try {
      setScanning(true);
      const result = await filesApi.scan();
      setSnackbar(
        `Scan complete: ${result.newFiles} new, ${result.deletedFiles} deleted`
      );
      await loadFiles();
    } catch (err) {
      setError('Failed to scan files');
    } finally {
      setScanning(false);
    }
  };

  const handleFileClick = (file: AudioFile) => {
    if (file.deleted === 0) {
      navigate(`/player/${file.id}`);
    }
  };

  const handleFileContextMenu = (
    e: React.MouseEvent | React.TouchEvent,
    file: AudioFile
  ) => {
    setSelectedFile(file);
    handleContextMenu(e);
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      await filesApi.delete(selectedFile.id);
      setSnackbar('File deleted');
      await loadFiles();
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ pb: 8 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Session Audio Player
          </Typography>
          <IconButton color="inherit" onClick={handleScan} disabled={scanning}>
            {scanning ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
          <IconButton color="inherit" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : files.length === 0 ? (
          <Alert severity="info">
            No audio files found. Click the refresh button to scan for files.
          </Alert>
        ) : (
          <List>
            {files.map((file) => (
              <ListItem
                key={file.id}
                disablePadding
                onContextMenu={(e) => handleFileContextMenu(e, file)}
                sx={{
                  opacity: file.deleted === 1 ? 0.5 : 1,
                }}
              >
                <ListItemButton
                  onClick={() => handleFileClick(file)}
                  disabled={file.deleted === 1}
                >
                  <ListItemText
                    primary={file.filename}
                    secondary={formatDate(file.created_at)}
                    primaryTypographyProps={{
                      fontWeight: 'bold',
                      sx: {
                        textDecoration:
                          file.deleted === 1 ? 'line-through' : 'none',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Container>

      <ContextMenu
        position={contextMenu}
        onClose={handleClose}
        onDelete={handleDelete}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}
