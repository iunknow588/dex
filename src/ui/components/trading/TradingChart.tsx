import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Alert, Chip } from '@mui/material';
import { useTradingStore } from '../../data/store/tradingStore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export const TradingChart: React.FC = () => {
  const { marketData } = useTradingStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 简单的价格历史记录（用于绘制折线图）
  const priceHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (marketData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentPrice = parseFloat(marketData.price);
      priceHistoryRef.current.push(currentPrice);

      // 只保留最近50个数据点
      if (priceHistoryRef.current.length > 50) {
        priceHistoryRef.current.shift();
      }

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制网格
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;

      // 水平网格线
      for (let i = 0; i <= 5; i++) {
        const y = (canvas.height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 垂直网格线
      for (let i = 0; i <= 10; i++) {
        const x = (canvas.width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // 绘制价格曲线
      if (priceHistoryRef.current.length > 1) {
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const prices = priceHistoryRef.current;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;

        prices.forEach((price, index) => {
          const x = (index / (prices.length - 1)) * canvas.width;
          const y = canvas.height - ((price - minPrice) / priceRange) * canvas.height;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // 绘制当前价格点
        const lastPrice = prices[prices.length - 1];
        const lastX = ((prices.length - 1) / (prices.length - 1)) * canvas.width;
        const lastY = canvas.height - ((lastPrice - minPrice) / priceRange) * canvas.height;

        ctx.fillStyle = '#1976d2';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [marketData]);

  const getPriceChangeIcon = () => {
    if (!marketData) return undefined;
    return marketData.change24hPercent >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        交易图表
      </Typography>

      {/* 市场数据概览 */}
      {marketData && (
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`价格: $${marketData.price}`}
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
          <Chip
            label={`${marketData.change24h} (${marketData.change24hPercent.toFixed(2)}%)`}
            variant="outlined"
            color={marketData.change24hPercent >= 0 ? 'success' : 'error'}
            icon={getPriceChangeIcon() || undefined}
          />
          <Chip
            label={`24h量: ${(parseFloat(marketData.volume24h) / 1000).toFixed(0)}K`}
            variant="outlined"
          />
          <Chip
            label={`高: $${marketData.high24h}`}
            variant="outlined"
          />
          <Chip
            label={`低: $${marketData.low24h}`}
            variant="outlined"
          />
        </Box>
      )}

      {/* 图表区域 */}
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          backgroundColor: 'grey.50',
        }}
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          📊 简易价格图表 - 显示最近50个价格点的趋势线
        </Alert>

        <Box sx={{ flex: 1, position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: 'white',
            }}
          />

          {!marketData && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  📈
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  等待市场数据...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  连接钱包后将显示实时价格图表
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          * 此为简化版图表，生产环境建议集成 TradingView 或其他专业图表库
        </Typography>
      </Paper>
    </Box>
  );
};
