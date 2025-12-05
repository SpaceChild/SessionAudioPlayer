import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import FilesPage from './pages/FilesPage';
import PlayerPage from './pages/PlayerPage';
import { CircularProgress, Box } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const { authenticated, locked, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {!authenticated ? (
          <LoginPage onLogin={login} locked={locked} />
        ) : (
          <Routes>
            <Route path="/files" element={<FilesPage onLogout={logout} />} />
            <Route path="/player/:fileId" element={<PlayerPage />} />
            <Route path="*" element={<Navigate to="/files" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
