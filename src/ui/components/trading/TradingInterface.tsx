import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { TradingForm } from './TradingForm';
import { OrderBook } from './OrderBook';
import { TradingChart } from './TradingChart';
import { useTradingStore } from '../../data/store/tradingStore';
import { PriceMonitorService } from '../../business/core/services/monitoring/PriceMonitorService';

export const TradingInterface: React.FC = () => {
  const { updateOrderBook, updateMarketData } = useTradingStore();
  const priceMonitorRef = useRef<PriceMonitorService | null>(null);

  useEffect(() => {
    // 初始化价格监控服务
    priceMonitorRef.current = new PriceMonitorService();

    const marketId = 'INJ/USDT';

    // 订阅市场价格更新（模拟）
    const simulatePriceUpdates = () => {
      const interval = setInterval(() => {
        const currentPrice = PriceMonitorService.getMockPrice(100, 0.01);

        // 更新市场数据
        updateMarketData({
          marketId,
          price: currentPrice.toFixed(2),
          change24h: '+2.5%',
          change24hPercent: 2.5,
          volume24h: '1000000',
          high24h: '105.00',
          low24h: '95.00',
          timestamp: Date.now(),
        });

        // 模拟订单簿更新
        const mockOrderBook = {
          marketId,
          bids: [
            { price: (currentPrice - 0.5).toFixed(2), quantity: '100', total: ((currentPrice - 0.5) * 100).toFixed(2) },
            { price: (currentPrice - 1.0).toFixed(2), quantity: '200', total: ((currentPrice - 1.0) * 200).toFixed(2) },
            { price: (currentPrice - 1.5).toFixed(2), quantity: '150', total: ((currentPrice - 1.5) * 150).toFixed(2) },
            { price: (currentPrice - 2.0).toFixed(2), quantity: '300', total: ((currentPrice - 2.0) * 300).toFixed(2) },
            { price: (currentPrice - 2.5).toFixed(2), quantity: '250', total: ((currentPrice - 2.5) * 250).toFixed(2) },
          ],
          asks: [
            { price: (currentPrice + 0.5).toFixed(2), quantity: '100', total: ((currentPrice + 0.5) * 100).toFixed(2) },
            { price: (currentPrice + 1.0).toFixed(2), quantity: '200', total: ((currentPrice + 1.0) * 200).toFixed(2) },
            { price: (currentPrice + 1.5).toFixed(2), quantity: '150', total: ((currentPrice + 1.5) * 150).toFixed(2) },
            { price: (currentPrice + 2.0).toFixed(2), quantity: '300', total: ((currentPrice + 2.0) * 300).toFixed(2) },
            { price: (currentPrice + 2.5).toFixed(2), quantity: '250', total: ((currentPrice + 2.5) * 250).toFixed(2) },
          ],
          timestamp: Date.now(),
        };

        updateOrderBook(mockOrderBook);
      }, 2000); // 每2秒更新一次

      return interval;
    };

    const intervalId = simulatePriceUpdates();

    // 清理函数
    return () => {
      clearInterval(intervalId);
      if (priceMonitorRef.current) {
        priceMonitorRef.current.destroy();
      }
    };
  }, [updateOrderBook, updateMarketData]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>
        交易界面
      </Typography>

      {/* 行情数据状态提示 */}
      <Alert severity="info" sx={{ mb: 1 }}>
        📊 实时行情数据：模拟模式 - 每2秒更新一次价格和订单簿
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
        {/* 左侧：交易表单和订单簿 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <TradingForm />
          </Paper>

          <Paper sx={{ p: 2, flex: 1 }}>
            <OrderBook />
          </Paper>
        </Box>

        {/* 右侧：图表 */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <TradingChart />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};
