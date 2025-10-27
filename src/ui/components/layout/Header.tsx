import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Menu as MenuIcon, Brightness4 as DarkIcon, Brightness7 as LightIcon } from '@mui/icons-material';
import { useUIStore } from '../../../data/store/uiStore';
import { useThemeContext } from '../../contexts/ThemeContext';
import { WalletConnector } from '../wallet/WalletConnector';

export const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toggleSidebar } = useUIStore();
  const { theme: currentTheme, setTheme } = useThemeContext();

  return (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="打开菜单"
            onClick={toggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          智运通交易系统
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={currentTheme === 'dark'}
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                icon={<LightIcon />}
                checkedIcon={<DarkIcon />}
                color="default"
              />
            }
            label=""
            sx={{ mr: 1 }}
          />
          <WalletConnector />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
