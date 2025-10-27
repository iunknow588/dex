import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import { useTradingStore } from '../../../data/store/tradingStore';

export const OrderBook: React.FC = () => {
  const { orderBook } = useTradingStore();
  const theme = useTheme();

  // 如果没有订单簿数据，使用模拟数据
  const displayOrderBook = orderBook || {
    bids: [
      ['25.40', '150.5'],
      ['25.35', '200.0'],
      ['25.30', '175.8'],
      ['25.25', '120.3'],
      ['25.20', '300.2'],
    ] as [string, string][],
    asks: [
      ['25.45', '180.7'],
      ['25.50', '220.4'],
      ['25.55', '165.9'],
      ['25.60', '140.6'],
      ['25.65', '190.1'],
    ] as [string, string][],
    timestamp: Date.now(),
  };

  const formatPrice = (price: string) => parseFloat(price).toFixed(2);
  const formatQuantity = (quantity: string) => parseFloat(quantity).toFixed(1);

  // 计算总数量用于显示深度
  const bidsWithTotal = (displayOrderBook.bids as [string, string][]).map((bid, index) => ({
    price: bid[0],
    quantity: bid[1],
    total: (displayOrderBook.bids as [string, string][]).slice(0, index + 1).reduce((sum, b) => sum + parseFloat(b[1]), 0),
  }));

  const asksWithTotal = (displayOrderBook.asks as [string, string][]).map((ask, index) => ({
    price: ask[0],
    quantity: ask[1],
    total: (displayOrderBook.asks as [string, string][]).slice(0, index + 1).reduce((sum, a) => sum + parseFloat(a[1]), 0),
  }));

  const maxBidTotal = Math.max(...bidsWithTotal.map(b => b.total));
  const maxAskTotal = Math.max(...asksWithTotal.map(a => a.total));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        订单簿 - INJ/USDT
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
        {/* 卖单 (Asks) */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
            卖单 (Asks)
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: '200px', overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    价格
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    数量
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    累计
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asksWithTotal.map((ask, index) => (
                  <TableRow key={`ask-${index}`}>
                    <TableCell
                      align="right"
                      sx={{
                        color: 'error.main',
                        fontSize: '0.75rem',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${(ask.total / maxAskTotal) * 100}%`,
                          backgroundColor: theme.palette.error.main,
                          opacity: 0.1,
                          zIndex: 0,
                        }}
                      />
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        ${formatPrice(ask.price)}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                      {formatQuantity(ask.quantity)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                      {ask.total.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 最新价格显示 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            $25.42
          </Typography>
        </Box>

        {/* 买单 (Bids) */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
            买单 (Bids)
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: '200px', overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    价格
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    数量
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    累计
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bidsWithTotal.map((bid, index) => (
                  <TableRow key={`bid-${index}`}>
                    <TableCell
                      align="right"
                      sx={{
                        color: 'success.main',
                        fontSize: '0.75rem',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${(bid.total / maxBidTotal) * 100}%`,
                          backgroundColor: theme.palette.success.main,
                          opacity: 0.1,
                          zIndex: 0,
                        }}
                      />
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        ${formatPrice(bid.price)}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                      {formatQuantity(bid.quantity)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                      {bid.total.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* 更新时间 */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        更新时间: {new Date(displayOrderBook.timestamp).toLocaleTimeString()}
      </Typography>
    </Box>
  );
};
