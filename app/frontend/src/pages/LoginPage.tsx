import { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface LoginPageProps {
  onLogin: (password: string) => Promise<any>;
  locked: boolean;
}

export default function LoginPage({ onLogin, locked }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await onLogin(password);

      if (result.error) {
        if (result.locked) {
          setError(
            'System locked due to too many failed attempts. Please contact administrator.'
          );
        } else {
          setError(result.error);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
      setPassword('');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Session Audio Player
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter password to continue
            </Typography>
          </Box>

          {locked && (
            <Alert severity="error" sx={{ mb: 3 }}>
              System is locked due to too many failed login attempts. Please
              contact the administrator to unlock.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || locked}
              autoFocus
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || locked || !password}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
