import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Typography,
  styled
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

const DrawerContent = styled(Box)(({ theme }) => ({
  width: 260,
  height: '100%',
  background: theme.palette.background.default,
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const Logo = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  margin: theme.spacing(0.5, 2),
  borderRadius: theme.spacing(1),
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

function Sidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
        },
      }}
    >
      <DrawerContent>
        <Logo>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Sistema de Aceitação
          </Typography>
        </Logo>
        <List sx={{ mt: 2 }}>
          <StyledListItem
            button
            component={Link}
            to="/"
            active={location.pathname === '/' ? 1 : 0}
          >
            <ListItemIcon>
              <AssignmentIcon color={location.pathname === '/' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Aceitações" />
          </StyledListItem>
          <StyledListItem
            button
            component={Link}
            to="/reports"
            active={location.pathname === '/reports' ? 1 : 0}
          >
            <ListItemIcon>
              <DescriptionIcon color={location.pathname === '/reports' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Relatórios" />
          </StyledListItem>
          <StyledListItem
            button
            component={Link}
            to="/settings"
            active={location.pathname === '/settings' ? 1 : 0}
          >
            <ListItemIcon>
              <SettingsIcon color={location.pathname === '/settings' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Configurações" />
          </StyledListItem>
        </List>
      </DrawerContent>
    </Drawer>
  );
}

export default Sidebar;