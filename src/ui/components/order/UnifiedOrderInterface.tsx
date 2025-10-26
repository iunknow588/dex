/**
 * 统一订单界面
 * 显示和管理所有订单的状态
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useTradingStore } from '../../data/store/tradingStore';
import { OrderStatus } from '../../data/types';
import { OrderStateManager } from '../../business/core/services/order/OrderStateManager';
import { errorHandler, getUserFriendlyMessage, getRecoverySuggestion, ErrorType } from '../../data/utils/errorHandler';

interface UnifiedOrderInterfaceProps {
  orderStateManager: OrderStateManager;
}

export const UnifiedOrderInterface: React.FC<UnifiedOrderInterfaceProps> = ({
  orderStateManager,
}) => {
  const { orders, removeOrder } = useTradingStore();
  const [selectedTab, setSelectedTab] = useState<string>('all');

  // 获取状态统计
  const stateStats = orderStateManager.getStateStats() as Record<string, number>;

  // 过滤订单
  const filteredOrders = selectedTab === 'all'
    ? orders
    : orders.filter(order => order.orderState === selectedTab);

  // 处理取消订单
  const handleCancelOrder = (orderId: string) => {
    try {
      if (orderStateManager.cancelOrder(orderId)) {
        // 取消成功，从UI中移除订单
        removeOrder(orderId);
      } else {
        // 取消失败，显示用户友好的错误提示
        const error = errorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          'ORDER_CANCEL_FAILED',
          '订单取消失败：当前状态不允许取消',
          { orderId },
          true
        );
        errorHandler.handleError(error);
        alert(getUserFriendlyMessage(error) + '\n\n' + getRecoverySuggestion(error));
      }
    } catch (error) {
      const appError = errorHandler.handleError(error);
      alert(getUserFriendlyMessage(appError) + '\n\n' + getRecoverySuggestion(appError));
    }
  };

  // 处理刷新状态
  const handleRefreshState = (orderId: string) => {
    // 这里可以触发状态重新评估
    console.log('Refreshing state for order:', orderId);
  };

  // 获取状态标签
  const getStateChip = (state: OrderStatus) => {
    const color = orderStateManager.getOrderStateColor(state);
    const description = orderStateManager.getOrderStateDescription(state);
    const icon = orderStateManager.getOrderStateIcon(state);

    return (
      <Chip
        label={`${icon} ${description}`}
        sx={{
          backgroundColor: color,
          color: 'white',
          fontWeight: 'bold',
        }}
        size="small"
      />
    );
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
    });
  };

  // 格式化价格
  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2);
  };

  // 获取订单方向图标
  const getSideIcon = (side: 'buy' | 'sell') => {
    return side === 'buy' ? (
      <TrendingUpIcon sx={{ color: 'success.main' }} />
    ) : (
      <TrendingDownIcon sx={{ color: 'error.main' }} />
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        统一订单管理
      </Typography>

      {/* 状态统计标签页 */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="全部订单"
            value="all"
            icon={
              <Badge
                badgeContent={orders.length}
                color="primary"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              />
            }
            iconPosition="end"
          />
          <Tab
            label="正常运行期"
            value={OrderStatus.NORMAL_RUNNING}
            icon={
              <Badge
                badgeContent={stateStats[OrderStatus.NORMAL_RUNNING]}
                color="primary"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              />
            }
            iconPosition="end"
          />
          <Tab
            label="准备风险锁定"
            value={OrderStatus.PREPARING_RISK_LOCK}
            icon={
              <Badge
                badgeContent={stateStats[OrderStatus.PREPARING_RISK_LOCK]}
                color="warning"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              />
            }
            iconPosition="end"
          />
          <Tab
            label="风险锁定期"
            value={OrderStatus.RISK_LOCKING}
            icon={
              <Badge
                badgeContent={stateStats[OrderStatus.RISK_LOCKING]}
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              />
            }
            iconPosition="end"
          />
          <Tab
            label="利润锁定准备期"
            value={OrderStatus.PREPARING_PROFIT_LOCK}
            icon={
              <Badge
                badgeContent={stateStats[OrderStatus.PREPARING_PROFIT_LOCK]}
                color="info"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              />
            }
            iconPosition="end"
          />
          <Tab
            label="利润锁定期"
            value={OrderStatus.PROFIT_LOCKING}
            icon={
              <Badge
                badgeContent={stateStats[OrderStatus.PROFIT_LOCKING]}
                color="success"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              />
            }
            iconPosition="end"
          />
        </Tabs>
      </Paper>

      {/* 订单列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell>订单ID</TableCell>
              <TableCell>市场</TableCell>
              <TableCell>方向</TableCell>
              <TableCell>类型</TableCell>
              <TableCell align="right">价格</TableCell>
              <TableCell align="right">数量</TableCell>
              <TableCell align="right">已成交</TableCell>
              <TableCell align="right">剩余</TableCell>
              <TableCell>订单状态</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTab === 'all' ? '暂无订单' : `暂无${orderStateManager.getOrderStateDescription(selectedTab as OrderStatus)}订单`}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {order.id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.marketId}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getSideIcon(order.side)}
                      <Typography variant="body2" color={order.side === 'buy' ? 'success.main' : 'error.main'}>
                        {order.side === 'buy' ? '买入' : '卖出'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.type === 'limit' ? '限价单' : '市价单'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {order.type === 'limit' ? formatPrice(order.price) : '市价'}
                  </TableCell>
                  <TableCell align="right">{order.quantity}</TableCell>
                  <TableCell align="right">{order.filledQuantity}</TableCell>
                  <TableCell align="right">{order.remainingQuantity}</TableCell>
                  <TableCell>
                    {getStateChip(order.orderState)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(order.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="刷新状态">
                        <IconButton
                          size="small"
                          onClick={() => handleRefreshState(order.id)}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {order.status === 'pending' && order.orderState !== OrderStatus.RISK_LOCKING && order.orderState !== OrderStatus.PROFIT_LOCKING && (
                        <Tooltip title="取消订单">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 状态说明 */}
      <Paper sx={{ mt: 2, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          📋 订单状态说明
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#2196f3', borderRadius: '50%' }} />
            <Typography variant="body2">正常运行期 - 订单正常执行中</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#ff9800', borderRadius: '50%' }} />
            <Typography variant="body2">准备风险锁定期 - 即将触发风险锁定</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#f44336', borderRadius: '50%' }} />
            <Typography variant="body2">风险锁定期 - 已激活风险锁定对冲单</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#ffeb3b', borderRadius: '50%' }} />
            <Typography variant="body2">利润锁定准备期 - 即将触发利润锁定</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#4caf50', borderRadius: '50%' }} />
            <Typography variant="body2">利润锁定期 - 已激活利润锁定对冲单</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
