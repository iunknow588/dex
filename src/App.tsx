import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

// 懒加载页面组件以提高性能
const HomePage = React.lazy(() => import('./ui/pages/Home/HomePage').then(module => ({ default: module.HomePage })));
const TradingPage = React.lazy(() => import('./ui/pages/Trading/TradingPage').then(module => ({ default: module.TradingPage })));
const PortfolioPage = React.lazy(() => import('./ui/pages/Portfolio/PortfolioPage').then(module => ({ default: module.PortfolioPage })));
const HistoryPage = React.lazy(() => import('./ui/pages/History/HistoryPage').then(module => ({ default: module.HistoryPage })));
const NotFoundPage = React.lazy(() => import('./ui/pages/NotFound/NotFoundPage').then(module => ({ default: module.NotFoundPage })));

// 加载组件
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 2,
    }}
  >
    <CircularProgress size={60} />
    <Typography variant="h6" color="text.secondary">
      页面加载中...
    </Typography>
  </Box>
);

function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Box>
  );
}

export default App;