import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  MenuItem, 
  Button,
  Box,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Typography,
  InputAdornment,
  Divider,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api/config';
import AcceptanceForm from './AcceptanceForm';

function AcceptanceList() {
  const theme = useTheme();
  const { translations } = useLanguage();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [acceptances, setAcceptances] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    payer: '',
    minAmount: '',
    maxAmount: '',
  });
  const [openModal, setOpenModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAcceptance, setSelectedAcceptance] = useState(null);
  const [formData, setFormData] = useState({
    operationDate: '',
    operationNumber: '',
    payer: '',
    payee: '',
    amount: '',
    status: '',
    channel: ''
  });

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return '';
      
      // If date is already in DD/MM/YYYY format, return as is
      if (dateStr.includes('/')) {
        const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
        return isValid(parsedDate) ? dateStr : '';
      }
      
      // Otherwise, parse and format the date
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const columns = [
    { 
      field: 'operationDate', 
      headerName: 'Data da Operação', 
      flex: 1,
      minWidth: 130,
      valueFormatter: (params) => {
        if (!params.value) return '';
      
        try {
          const parsedDate = parse(params.value, 'yyyy-MM-dd', new Date());
      
          if (!isValid(parsedDate)) {
            return params.value.includes('/')
              ? params.value
              : format(new Date(params.value), 'dd/MM/yyyy', { locale: ptBR });
          }
      
          return format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
          console.error('Erro ao formatar data:', error);
          return params.value;
        }
      }
    },
    {
      field: 'operationNumber',
      headerName: 'Operação',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Box sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
          {params.value}
        </Box>
      )
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
      renderCell: (params) => (
        <Box sx={{
          color: params.value >= 10000 ? theme.palette.success.main : theme.palette.text.primary,
          fontWeight: params.value >= 10000 ? 600 : 400
        }}>
          {formatCurrency(params.value)}
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const statusConfig = {
          'ACEITE OK': { color: theme.palette.success.main },
          'EMISSÃO OK': { color: theme.palette.info.main },
          'DISPENSADO': { color: theme.palette.warning.main },
          'PRÉ FATURAMENTO': { color: theme.palette.primary.main }
        };
        
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              backgroundColor: `${statusConfig[params.value]?.color}15`,
              color: statusConfig[params.value]?.color,
              fontWeight: 600,
              border: `1px solid ${statusConfig[params.value]?.color}30`
            }}
          />
        );
      }
    },
    {
      field: 'channel',
      headerName: 'Canal',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        params.row.status === 'DISPENSADO' ? (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        ) : (
          params.value
        )
      )
    },
    {
      field: 'actions',
      headerName: translations.actions || 'Ações',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title={translations.edit || "Editar"}>
            <IconButton
              onClick={() => handleEdit(params.row)}
              size="small"
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}15`
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={translations.delete || "Excluir"}>
            <IconButton
              onClick={() => handleDeleteClick(params.row)}
              size="small"
              sx={{
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: `${theme.palette.error.main}15`
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={translations.export || "Exportar"}>
            <IconButton
              onClick={() => handleExportSingle(params.row)}
              size="small"
              sx={{
                color: theme.palette.info.main,
                '&:hover': {
                  backgroundColor: `${theme.palette.info.main}15`
                }
              }}
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  useEffect(() => {
    fetchAcceptances();
  }, [filters]);

  const fetchAcceptances = async () => {
    try {
      const response = await api.get('/api/acceptances', { params: filters });
      setAcceptances(response.data.map(row => ({
        ...row,
        operationDate: new Date(row.operationDate).toISOString().split('T')[0]
      })));
    } catch (error) {
      console.error('Erro ao buscar aceitações:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      payer: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  const handleEdit = (row) => {
    setFormData(row);
    setOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (formData.id) {
        await api.put(`/api/acceptances/${formData.id}`, payload);
      } else {
        await api.post('/api/acceptances', payload);
      }
      setOpenModal(false);
      await fetchAcceptances();
      setFormData({
        operationDate: '',
        operationNumber: '',
        payer: '',
        payee: '',
        amount: '',
        status: '',
        channel: ''
      });
    } catch (error) {
      console.error('Erro ao salvar aceitação:', error);
      alert(translations.saveError || 'Erro ao salvar aceitação. Verifique se o servidor está rodando e tente novamente.');
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  const handleDeleteClick = (acceptance) => {
    setSelectedAcceptance(acceptance);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/acceptances/${selectedAcceptance.id}`);
      setDeleteDialogOpen(false);
      await fetchAcceptances();
    } catch (error) {
      console.error('Erro ao excluir aceitação:', error);
      alert(translations.deleteError || 'Erro ao excluir aceitação');
    }
  };

  const handleExportSingle = async (acceptance) => {
    try {
      const response = await api.get(`/api/acceptances/${acceptance.id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aceite_${acceptance.operationNumber}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar aceitação:', error);
      alert(translations.exportError || 'Erro ao exportar aceitação');
    }
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
            fontWeight: 600,
            mb: 1
          }}>
            Gerenciamento de Aceitações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie e monitore todas as aceitações do sistema
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="subtitle2" 
            gutterBottom 
            sx={{ 
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}
          >
            <FilterListIcon fontSize="small" />
            Filtros ({getActiveFiltersCount()})
          </Typography>

          <Stack spacing={3}>
            <Box 
              display="grid" 
              gridTemplateColumns={{
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr'
              }}
              gap={2}
            >
              <TextField
                label="Data Inicial"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Data Final"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ACEITE OK">ACEITE OK</MenuItem>
                <MenuItem value="EMISSÃO OK">EMISSÃO OK</MenuItem>
                <MenuItem value="DISPENSADO">DISPENSADO</MenuItem>
                <MenuItem value="PRÉ FATURAMENTO">PRÉ FATURAMENTO</MenuItem>
              </TextField>
            </Box>

            <Box 
              display="grid" 
              gridTemplateColumns={{
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr'
              }}
              gap={2}
            >
              <TextField
                label="Valor Mínimo"
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalAtmIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Valor Máximo"
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalAtmIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Buscar por Pagador"
                value={filters.payer}
                onChange={(e) => setFilters({ ...filters, payer: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box 
              display="flex" 
              gap={2}
              justifyContent="flex-end"
              flexWrap="wrap"
            >
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                sx={{ 
                  minWidth: 130,
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary
                }}
              >
                Limpar
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ 
                  minWidth: 130,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark
                  }
                }}
              >
                Nova
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Paper 
        elevation={0}
        sx={{ 
          height: 600,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={acceptances}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: theme.palette.background.paper,
              borderBottom: `2px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-cell': {
              borderColor: theme.palette.divider
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: `${theme.palette.primary.main}08`
            },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
              outline: 'none'
            }
          }}
        />
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          {translations.confirmDelete || 'Confirmar exclusão'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {translations.deleteWarning || 'Tem certeza que deseja excluir esta aceitação? Esta ação não pode ser desfeita.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {translations.cancel || 'Cancelar'}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            {translations.confirm || 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <AcceptanceForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
      />
    </Container>
  );
}

export default AcceptanceList;