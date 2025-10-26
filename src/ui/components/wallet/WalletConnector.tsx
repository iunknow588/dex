import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useWalletStore } from '../../data/store/walletStore';
import { WalletType } from '../../data/types';

const walletOptions = [
  { type: 'keplr' as WalletType, name: 'Keplr', icon: '🔗' },
  { type: 'metamask' as WalletType, name: 'MetaMask', icon: '🦊' },
  { type: 'injective' as WalletType, name: 'Injective', icon: '⚡' },
  { type: 'walletconnect' as WalletType, name: 'WalletConnect', icon: '📱' },
];

export const WalletConnector: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet } = useWalletStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [connecting, setConnecting] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleConnect = async (walletType: WalletType) => {
    try {
      setConnecting(true);
      await connectWallet(walletType);
      handleClose();
    } catch (error) {
      console.error('钱包连接失败:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    handleClose();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (wallet.isConnected) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<CheckIcon />}
          label={`${wallet.walletType?.toUpperCase()} 已连接`}
          color="success"
          variant="outlined"
        />
        <Typography variant="body2" color="text.secondary">
          {wallet.address && formatAddress(wallet.address)}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleDisconnect}
        >
          断开
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<WalletIcon />}
        endIcon={<ExpandMoreIcon />}
        onClick={handleClick}
        disabled={connecting}
      >
        {connecting ? '连接中...' : '连接钱包'}
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {walletOptions.map((option) => (
          <MenuItem
            key={option.type}
            onClick={() => handleConnect(option.type)}
            disabled={connecting}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem' }}>
                {option.icon}
              </Avatar>
              <Typography>{option.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
