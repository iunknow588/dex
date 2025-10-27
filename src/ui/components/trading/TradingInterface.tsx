import React, { useState } from 'react';
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
  Button,
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface Order {
  id: string;
  type: 'limit' | 'market';
  side: 'buy' | 'sell';
  price: string;
  quantity: string;
  filled: string;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
}

// 模拟订单数据
const mockOrders: Order[] = [
  {
    id: '1',
    type: 'limit',
    side: 'buy',
    price: '25.50',
    quantity: '100',
    filled: '50',
    status: 'pending',
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: '2',
    type: 'market',
    side: 'sell',
    price: '25.75',
    quantity: '75',
    filled: '75',
    status: 'filled',
    timestamp: Date.now() - 1000 * 60 * 15,
  },
];

export const TradingInterface: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const theme = useTheme();

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status: 'cancelled' as const }
          : order
      )
    );
  };

  const handleRefresh = () => {
    // 模拟刷新订单
    console.log('刷新订单列表');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'filled':
        return '已成交';
      case 'pending':
        return '进行中';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 标题栏 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6">
          订单管理
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          刷新
        </Button>
      </Box>

      {/* 订单表格 */}
      <TableContainer component={Paper} sx={{ flex: 1 }}>
        <Table sx={{ minWidth: 650 }} aria-label="订单表格">
          <TableHead>
            <TableRow>
              <TableCell>类型</TableCell>
              <TableCell>方向</TableCell>
              <TableCell align="right">价格</TableCell>
              <TableCell align="right">数量</TableCell>
              <TableCell align="right">已成交</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>时间</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    暂无订单
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Chip
                      label={order.type === 'limit' ? '限价' : '市价'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.side === 'buy' ? '买入' : '卖出'}
                      size="small"
                      color={order.side === 'buy' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {order.price === '0' ? '市价' : `$${order.price}`}
                  </TableCell>
                  <TableCell align="right">{order.quantity}</TableCell>
                  <TableCell align="right">{order.filled}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {order.status === 'pending' && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCancelOrder(order.id)}
                        title="取消订单"
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 统计信息 */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          订单统计
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 2
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              总订单数
            </Typography>
            <Typography variant="h6">
              {orders.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              进行中
            </Typography>
            <Typography variant="h6">
              {orders.filter(o => o.status === 'pending').length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              已成交
            </Typography>
            <Typography variant="h6">
              {orders.filter(o => o.status === 'filled').length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              成交率
            </Typography>
            <Typography variant="h6">
              {orders.length > 0
                ? `${((orders.filter(o => o.status === 'filled').length / orders.length) * 100).toFixed(1)}%`
                : '0%'
              }
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
