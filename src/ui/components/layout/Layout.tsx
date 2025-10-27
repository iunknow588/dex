import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

// 简化的Layout组件，避免复杂的依赖
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 简化的头部 */}
      <AppBar position="static" sx={{ zIndex: 1100 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🚀 智运通交易系统 (LuckEngine)
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            基于Injective区块链的专业级去中心化交易平台
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 主内容区域 */}
      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>

      {/* 简化的底部 */}
      <Box sx={{ py: 2, textAlign: 'center', bgcolor: 'grey.100', mt: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          © 2025年10月 智运通交易系统 - 基于Injective区块链的专业级去中心化交易平台
        </Typography>
      </Box>
    </Box>
  );
};
