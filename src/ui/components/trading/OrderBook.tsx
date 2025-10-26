import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useTradingStore } from '../../data/store/tradingStore';

export const OrderBook: React.FC = () => {
  const { orderBook } = useTradingStore();

  // 模拟订单簿数据
  const mockOrderBook = {
    marketId: 'INJ/USDT',
    bids: [
      { price: '99.50', quantity: '100', total: '9950' },
      { price: '99.00', quantity: '200', total: '19800' },
      { price: '98.50', quantity: '150', total: '14775' },
      { price: '98.00', quantity: '300', total: '29400' },
      { price: '97.50', quantity: '250', total: '24375' },
    ],
    asks: [
      { price: '100.50', quantity: '100', total: '10050' },
      { price: '101.00', quantity: '200', total: '20200' },
      { price: '101.50', quantity: '150', total: '15225' },
      { price: '102.00', quantity: '300', total: '30600' },
      { price: '102.50', quantity: '250', total: '25625' },
    ],
    timestamp: Date.now(),
  };

  const displayOrderBook = orderBook || mockOrderBook;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        订单簿
      </Typography>
      
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">价格</TableCell>
              <TableCell align="center">数量</TableCell>
              <TableCell align="center">总计</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 卖盘 */}
            {displayOrderBook.asks.map((ask, index) => (
              <TableRow key={`ask-${index}`} sx={{ backgroundColor: 'rgba(255, 0, 0, 0.05)' }}>
                <TableCell align="center" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  {ask.price}
                </TableCell>
                <TableCell align="center">{ask.quantity}</TableCell>
                <TableCell align="center">{ask.total}</TableCell>
              </TableRow>
            ))}
            
            {/* 分隔线 */}
            <TableRow>
              <TableCell colSpan={3} align="center" sx={{ border: 'none', py: 1 }}>
                <Chip label="---" size="small" variant="outlined" />
              </TableCell>
            </TableRow>
            
            {/* 买盘 */}
            {displayOrderBook.bids.map((bid, index) => (
              <TableRow key={`bid-${index}`} sx={{ backgroundColor: 'rgba(0, 255, 0, 0.05)' }}>
                <TableCell align="center" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  {bid.price}
                </TableCell>
                <TableCell align="center">{bid.quantity}</TableCell>
                <TableCell align="center">{bid.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
