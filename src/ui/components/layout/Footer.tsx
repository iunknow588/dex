import React from 'react';
import { Box, Typography, Link } from '@mui/material';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © 2024 智运通交易系统 (LuckEngine). 基于 Injective 链的专业级去中心化交易平台.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="#" variant="body2" color="text.secondary">
            帮助
          </Link>
          <Link href="#" variant="body2" color="text.secondary">
            隐私政策
          </Link>
          <Link href="#" variant="body2" color="text.secondary">
            服务条款
          </Link>
        </Box>
      </Box>
    </Box>
  );
};
