import React, { useState, useRef } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Switch, 
  FormControlLabel,
  Divider,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  useTheme,
  Stack,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import { useTheme as useThemeContext } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import TranslateIcon from '@mui/icons-material/Translate';
import BackupIcon from '@mui/icons-material/Backup';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../api/config';

function Settings() {
  const theme = useTheme();
  const { darkMode, toggleDarkMode } = useThemeContext();
  const { language, setLanguage, translations } = useLanguage();
  const [status, setStatus] = useState({ message: '', severity: 'success' });
  const fileInputRef = useRef(null);

  const handleBackup = async () => {
    try {
      setStatus({ message: translations.backupInProgress, severity: 'info' });
      const response = await api.get('/api/export/excel', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setStatus({ message: translations.backupSuccess, severity: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setStatus({ message: translations.backupError, severity: 'error' });
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus({ message: translations.importInProgress, severity: 'info' });
      await api.post('/api/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setStatus({ message: translations.importSuccess, severity: 'success' });
    } catch (error) {
      console.error('Import error:', error);
      setStatus({ message: translations.importError, severity: 'error' });
    }
    
    // Reset file input
    event.target.value = '';
  };

  const downloadTemplate = () => {
    window.open('/template.xlsx', '_blank');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            color: 'primary.main', 
            fontWeight: 600,
            mb: 1
          }}>
            {translations.settings}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {translations.settingsDescription}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={4}>
          {/* Theme */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DarkModeIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">{translations.appearance}</Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  color="primary"
                />
              }
              label={translations.darkMode}
            />
          </Box>

          {/* Language */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TranslateIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">{translations.language}</Typography>
            </Box>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>{translations.selectLanguage}</InputLabel>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                label={translations.selectLanguage}
              >
                <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                <MenuItem value="en-US">English (United States)</MenuItem>
                <MenuItem value="es">Español</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Data Management */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BackupIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">{translations.dataManagement}</Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {translations.exportData}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {translations.exportDescription}
              </Typography>
              <Button
                variant="contained"
                onClick={handleBackup}
                startIcon={<FileDownloadIcon />}
              >
                {translations.exportToExcel}
              </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {translations.importData}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {translations.importDescription}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<FileUploadIcon />}
                >
                  {translations.importFromExcel}
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                  />
                </Button>
                <Tooltip title={translations.downloadTemplateTooltip}>
                  <IconButton 
                    onClick={downloadTemplate}
                    sx={{ color: theme.palette.primary.main }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary'
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                {translations.importWarning}
              </Typography>
            </Box>

            {status.message && (
              <Alert 
                severity={status.severity}
                sx={{ mt: 2 }}
                onClose={() => setStatus({ message: '', severity: 'success' })}
              >
                {status.message}
              </Alert>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default Settings;