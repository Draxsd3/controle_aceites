import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import AcceptanceList from './components/AcceptanceList';
import Reports from './components/Reports';
import Settings from './components/Settings';

function AppContent() {
  const { darkMode } = useTheme();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#C5A572',
        dark: '#B4914E',
        light: '#D4BC94',
      },
      secondary: {
        main: '#212121',
        dark: '#000000',
        light: '#484848',
      },
      background: {
        default: darkMode ? '#121212' : '#FFFFFF',
        paper: darkMode ? '#1E1E1E' : '#FAFAFA',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
    },
  });

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              pt: 4,
              backgroundColor: (theme) => theme.palette.background.default,
            }}
          >
            <Routes>
              <Route path="/" element={<AcceptanceList />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
        <Footer />
      </Box>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;