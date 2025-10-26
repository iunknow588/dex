import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './ui/components/layout/Layout';
import { NotFoundPage } from './ui/shared/components/NotFoundPage';

// 路由级代码分割 - 按页面懒加载
const TradingPage = lazy(() => import('./ui/pages/Trading/TradingPage').then(module => ({ default: module.TradingPage })));
const PortfolioPage = lazy(() => import('./ui/pages/Portfolio/PortfolioPage').then(module => ({ default: module.PortfolioPage })));
const HistoryPage = lazy(() => import('./ui/pages/History/HistoryPage').then(module => ({ default: module.HistoryPage })));

// 加载组件
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px',
    color: '#666'
  }}>
    页面加载中...
  </div>
);

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<TradingPage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
