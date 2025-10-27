import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useTradingStore } from '../../../data/store/tradingStore';
import { PriceMonitorService } from '../../../business/core/services/monitoring/PriceMonitorService';

// 导入交易组件（保持原有结构）
import { TradingInterface } from '../../components/trading/TradingInterface';
import { OrderBook } from '../../components/trading/OrderBook';
import { DynamicHedgeTradingForm } from '../../components/trading/DynamicHedgeTradingForm';
import { ArbitrageTradingForm } from '../../components/trading/ArbitrageTradingForm';
import { FlashLoanTradingForm } from '../../components/trading/FlashLoanTradingForm';

export const TradingPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [priceMonitor] = useState(() => new PriceMonitorService('INJ/USDT'));
  const { marketData, updateMarketData, updateOrderBook } = useTradingStore();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // 初始化价格监控
  React.useEffect(() => {
    const initPriceMonitor = async () => {
      try {
        await priceMonitor.connect();

        // 订阅价格更新
        priceMonitor.subscribe((message) => {
          if (message.type === 'price_update') {
            updateMarketData(PriceMonitorService.getMockPrice());
          } else if (message.type === 'orderbook_update') {
            updateOrderBook(PriceMonitorService.getMockOrderBook());
          }
        });

        // 初始数据
        updateMarketData(PriceMonitorService.getMockPrice());
        updateOrderBook(PriceMonitorService.getMockOrderBook());
      } catch (error) {
        console.error('价格监控初始化失败:', error);
      }
    };

    initPriceMonitor();

    return () => {
      priceMonitor.disconnect();
    };
  }, [priceMonitor, updateMarketData, updateOrderBook]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0: // 低风险合约交易
        return <DynamicHedgeTradingForm />;
      case 1: // 无风险套利交易
        return <ArbitrageTradingForm />;
      case 2: // 低风险闪电贷模式
        return <FlashLoanTradingForm />;
      case 3: // 订单管理
        return <TradingInterface />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 页面标题 */}
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        交易中心
      </Typography>

      {/* 模拟数据提示 */}
      <Alert severity="info" sx={{ mb: 2 }}>
        当前使用模拟数据进行演示。实际部署时将连接真实的Injective区块链网络。
      </Alert>

      {/* 市场概览 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          市场概览 - INJ/USDT
        </Typography>
        {marketData && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography>价格: ${marketData.price}</Typography>
            <Typography color={marketData.change24h.startsWith('+') ? 'success.main' : 'error.main'}>
              24h变化: {marketData.change24h}
            </Typography>
            <Typography>交易量: {marketData.volume24h}</Typography>
            <Typography>最高: ${marketData.high24h}</Typography>
            <Typography>最低: ${marketData.low24h}</Typography>
          </Box>
        )}
      </Paper>

      {/* 主要内容区域 */}
      <Box sx={{
        display: 'flex',
        flex: 1,
        gap: 2,
        minHeight: 0,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* 左侧：交易表单 */}
        <Box sx={{
          flex: isMobile ? 'none' : 3,
          display: 'flex',
          flexDirection: 'column',
          minHeight: isMobile ? 'auto' : 0
        }}>
          <Paper sx={{ p: { xs: 1, md: 2 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{ mb: 2 }}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons={isMobile ? 'auto' : false}
            >
              <Tab label={isMobile ? "合约交易" : "低风险合约交易"} />
              <Tab label={isMobile ? "套利交易" : "无风险套利交易"} />
              <Tab label={isMobile ? "闪电贷" : "低风险闪电贷模式"} />
              <Tab label="订单管理" />
            </Tabs>

            <Box sx={{ flex: 1, overflow: 'auto', minHeight: isMobile ? 400 : 'auto' }}>
              {renderTabContent()}
            </Box>
          </Paper>
        </Box>

        {/* 右侧：市场数据 */}
        <Box sx={{
          flex: isMobile ? 'none' : 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minHeight: isMobile ? 'auto' : 0
        }}>
          {/* 订单簿 */}
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              订单簿
            </Typography>
            <OrderBook />
          </Paper>

          {/* 图表 */}
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              价格图表
            </Typography>
            <Box sx={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              borderRadius: 1
            }}>
              <Typography color="text.secondary">
                图表组件开发中...
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};
