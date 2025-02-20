import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Box,
  IconButton,
  Stack,
  Grid,
  InputAdornment,
  useTheme,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PrintIcon from '@mui/icons-material/Print';
import TableChartIcon from '@mui/icons-material/TableChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api/config';
import { parse, isValid, format } from 'date-fns';

// Logo SVG component
const CompanyLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#C5A572" />
    <path d="M12 20h16M20 12v16" stroke="white" strokeWidth="2" />
  </svg>
);

function Reports() {
  const theme = useTheme();
  const { translations } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    payer: '',
    payee: '',
    operationNumber: '',
    minAmount: '',
    maxAmount: '',
  });
  const [exporting, setExporting] = useState(false);

  const columns = [
    { 
      field: 'operationDate', 
      headerName: 'Data da Operação', 
      flex: 1,
      minWidth: 130,
      valueFormatter: (params) => {
        try {
          if (!params.value) return '';
          const date = new Date(params.value);
          return date.toLocaleDateString('pt-BR');
        } catch (error) {
          console.error('Date formatting error:', error);
          return params.value;
        }
      }
    },
    { 
      field: 'operationNumber', 
      headerName: 'Nº da Operação', 
      flex: 1,
      minWidth: 130 
    },
    { 
      field: 'payer', 
      headerName: 'Cedente', 
      flex: 1.5,
      minWidth: 180 
    },
    { 
      field: 'payee', 
      headerName: 'Sacado', 
      flex: 1.5,
      minWidth: 180 
    },
    { 
      field: 'amount', 
      headerName: 'Valor', 
      flex: 1,
      minWidth: 130,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(params.value);
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'channel',
      headerName: 'Canal',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => params.row.status === 'DISPENSADO' ? 'N/A' : params.value || '',
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/acceptances', { 
        params: {
          ...filters,
          startDate: filters.startDate ? formatDateForAPI(filters.startDate) : '',
          endDate: filters.endDate ? formatDateForAPI(filters.endDate) : '',
        }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar os dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      payer: '',
      payee: '',
      operationNumber: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  const formatDateForAPI = (dateStr) => {
    try {
      if (!dateStr) return '';
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      return isValid(date) ? format(date, 'dd/MM/yyyy') : '';
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const generateReport = async (format) => {
    setExporting(true);
    try {
      const response = await api.get(`/api/reports/${format}`, {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${new Date().toLocaleDateString('pt-BR')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Erro ao gerar relatório. Por favor, tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.createElement('div');
    printContent.style.padding = '20px';
    
    // Add header with logo
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';
    header.style.borderBottom = '2px solid #C5A572';
    header.style.paddingBottom = '10px';
    
    const logo = document.createElement('div');
    logo.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#C5A572" />
        <path d="M12 20h16M20 12v16" stroke="white" strokeWidth="2" />
      </svg>
    `;
    
    const title = document.createElement('h1');
    title.textContent = 'Relatório de Aceitações';
    title.style.margin = '0 0 0 15px';
    title.style.color = '#333';
    title.style.fontFamily = 'Inter, sans-serif';
    
    header.appendChild(logo);
    header.appendChild(title);
    printContent.appendChild(header);

    // Add filters summary
    const filtersSummary = document.createElement('div');
    filtersSummary.style.marginBottom = '20px';
    filtersSummary.style.fontSize = '14px';
    filtersSummary.style.color = '#666';
    
    const activeFilters = [];
    if (filters.startDate) activeFilters.push(`Data Inicial: ${filters.startDate}`);
    if (filters.endDate) activeFilters.push(`Data Final: ${filters.endDate}`);
    if (filters.status) activeFilters.push(`Status: ${filters.status}`);
    if (filters.payer) activeFilters.push(`Cedente: ${filters.payer}`);
    if (filters.payee) activeFilters.push(`Sacado: ${filters.payee}`);
    if (filters.operationNumber) activeFilters.push(`Nº Operação: ${filters.operationNumber}`);
    
    filtersSummary.textContent = `Filtros aplicados: ${activeFilters.join(' | ') || 'Nenhum'}`;
    printContent.appendChild(filtersSummary);

    // Create table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    
    // Add table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background-color: #f5f5f5;">
        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Data</th>
        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Operação</th>
        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Cedente</th>
        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Sacado</th>
        <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Valor</th>
        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Status</th>
        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Canal</th>
      </tr>
    `;
    table.appendChild(thead);

    // Add table body
    const tbody = document.createElement('tbody');
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 12px; border: 1px solid #ddd;">${format(new Date(row.operationDate), 'dd/MM/yyyy')}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${row.operationNumber}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${row.payer}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${row.payee}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.amount)}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${row.status}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${row.status === 'DISPENSADO' ? 'N/A' : (row.channel || '')}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    printContent.appendChild(table);

    // Add footer with date
    const footer = document.createElement('div');
    footer.style.marginTop = '20px';
    footer.style.borderTop = '1px solid #ddd';
    footer.style.paddingTop = '10px';
    footer.style.fontSize = '12px';
    footer.style.color = '#666';
    footer.textContent = `Relatório gerado em ${new Date().toLocaleString('pt-BR')}`;
    printContent.appendChild(footer);

    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Aceitações</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            @media print {
              @page { margin: 20mm; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after images are loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 600 
          }}>
            Relatórios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure os filtros desejados e exporte os dados em PDF ou Excel
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Data Inicial"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Data Final"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="ACEITE OK">ACEITE OK</MenuItem>
                  <MenuItem value="EMISSÃO OK">EMISSÃO OK</MenuItem>
                  <MenuItem value="DISPENSADO">DISPENSADO</MenuItem>
                  <MenuItem value="PRÉ FATURAMENTO">PRÉ FATURAMENTO</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Cedente"
                value={filters.payer}
                onChange={(e) => setFilters({ ...filters, payer: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Sacado"
                value={filters.payee}
                onChange={(e) => setFilters({ ...filters, payee: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nº da Operação"
                value={filters.operationNumber}
                onChange={(e) => setFilters({ ...filters, operationNumber: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Valor Mínimo"
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalAtmIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Valor Máximo"
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalAtmIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ borderColor: theme.palette.divider }}
              disabled={loading || exporting}
            >
              Limpar Filtros
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              disabled={loading || exporting}
            >
              Imprimir
            </Button>
            <Button
              variant="contained"
              startIcon={<TableChartIcon />}
              onClick={() => generateReport('xlsx')}
              disabled={loading || exporting}
            >
              Exportar Excel
            </Button>
          </Box>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper 
        elevation={0}
        sx={{ 
          height: 600,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          position: 'relative'
        }}
      >
        <DataGrid
          rows={data}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          components={{
            LoadingOverlay: () => (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <CircularProgress />
              </Box>
            ),
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: theme.palette.background.paper,
              borderBottom: `2px solid ${theme.palette.divider}`,
            }
          }}
        />
      </Paper>
    </Container>
  );
}

export default Reports;