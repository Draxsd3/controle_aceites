import React from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Sistema de Aceitação de Clientes
        </Typography>
        <Button 
          color="inherit" 
          component={Link} 
          to="/"
          startIcon={<AssignmentIcon />}
        >
          Aceitações
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/reports"
          startIcon={<DescriptionIcon />}
        >
          Relatórios
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;