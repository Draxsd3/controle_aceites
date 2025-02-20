import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem } from '@mui/material';

function AcceptanceForm({ open, onClose, formData, setFormData, handleSubmit }) {
  const statusOptions = [
    { value: 'ACEITE OK', label: 'ACEITE OK' },
    { value: 'EMISSÃO OK', label: 'EMISSÃO OK' },
    { value: 'DISPENSADO', label: 'DISPENSADO' },
    { value: 'PRÉ FATURAMENTO', label: 'PRÉ FATURAMENTO' }
  ];

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFormData({ 
      ...formData, 
      status: newStatus,
      channel: newStatus === 'DISPENSADO' ? '' : formData.channel
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{formData.id ? 'Editar Aceitação' : 'Nova Aceitação'}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Data da Operação"
            type="date"
            value={formData.operationDate}
            onChange={(e) => setFormData({ ...formData, operationDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Número da Operação"
            value={formData.operationNumber}
            onChange={(e) => setFormData({ ...formData, operationNumber: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Cedente"
            value={formData.payer}
            onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Sacado"
            value={formData.payee}
            onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Valor"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={formData.status}
            onChange={handleStatusChange}
            sx={{ mt: 2 }}
            required
          >
            {statusOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {formData.status !== 'DISPENSADO' && (
            <TextField
              fullWidth
              label="Canal"
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              sx={{ mt: 2 }}
              required
            />
          )}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={
            !formData.operationDate || 
            !formData.operationNumber ||
            !formData.payer ||
            !formData.payee ||
            !formData.amount ||
            !formData.status ||
            (formData.status !== 'DISPENSADO' && !formData.channel)
          }
        >
          {formData.id ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AcceptanceForm;