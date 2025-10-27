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
  Chip,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface Transaction {
  id: string;
  timestamp: number;
  type: 'trade' | 'deposit' | 'withdrawal' | 'flashloan';
  symbol: string;
  amount: number;
  price: number;
  total: number;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
}

// 模拟历史记录数据
const mockTransactions: Transaction[] = [
  {
    id: '1',
    timestamp: Date.now() - 1000 * 60 * 30, // 30分钟前
    type: 'flashloan',
    symbol: 'INJ',
    amount: 1000,
    price: 25.5,
    total: 25500,
    status: 'completed',
    txHash: '0x1234...abcd',
  },
  {
    id: '2',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2小时前
    type: 'trade',
    symbol: 'INJ/USDT',
    amount: 50,
    price: 25.2,
    total: 1260,
    status: 'completed',
    txHash: '0x5678...efgh',
  },
  {
    id: '3',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1天前
    type: 'deposit',
    symbol: 'USDT',
    amount: 5000,
    price: 1,
    total: 5000,
    status: 'completed',
    txHash: '0x9abc...ijkl',
  },
  {
    id: '4',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2天前
    type: 'withdrawal',
    symbol: 'INJ',
    amount: -25,
    price: 24.8,
    total: -620,
    status: 'pending',
  },
];

const ITEMS_PER_PAGE = 10;

export const HistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 过滤和搜索逻辑
  React.useEffect(() => {
    let filtered = transactions;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 类型过滤
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    setTransactions(mockTransactions);
    setIsLoading(false);
  };

  const handleExport = () => {
    // 模拟导出功能
    const csvContent = [
      ['时间', '类型', '资产', '数量', '价格', '总计', '状态', '交易哈希'],
      ...filteredTransactions.map(tx => [
        new Date(tx.timestamp).toLocaleString(),
        tx.type,
        tx.symbol,
        tx.amount.toString(),
        tx.price.toString(),
        tx.total.toString(),
        tx.status,
        tx.txHash || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transaction_history.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 分页逻辑
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(value));
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      trade: '交易',
      deposit: '充值',
      withdrawal: '提现',
      flashloan: '闪电贷',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      completed: 'success',
      pending: 'warning',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 页面标题和操作按钮 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" component="h1">
          交易历史
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            size="small"
          >
            导出
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
            size="small"
          >
            刷新
          </Button>
        </Box>
      </Box>

      {/* 模拟数据提示 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        当前显示模拟数据。实际部署时将连接真实的区块链交易记录。
      </Alert>

      {/* 搜索和过滤 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{
          display: 'flex',
          gap: 2,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          <TextField
            placeholder="搜索资产或交易哈希..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
            size="small"
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>类型</InputLabel>
            <Select
              value={typeFilter}
              label="类型"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="trade">交易</MenuItem>
              <MenuItem value="deposit">充值</MenuItem>
              <MenuItem value="withdrawal">提现</MenuItem>
              <MenuItem value="flashloan">闪电贷</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>状态</InputLabel>
            <Select
              value={statusFilter}
              label="状态"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="completed">已完成</MenuItem>
              <MenuItem value="pending">进行中</MenuItem>
              <MenuItem value="failed">失败</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 交易记录表格 */}
      <TableContainer component={Paper} sx={{ flex: 1 }}>
        <Table sx={{ minWidth: 650 }} aria-label="交易历史表格">
          <TableHead>
            <TableRow>
              <TableCell>时间</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>资产</TableCell>
              <TableCell align="right">数量</TableCell>
              <TableCell align="right">价格</TableCell>
              <TableCell align="right">总计</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>交易哈希</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    暂无交易记录
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {formatDate(transaction.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeLabel(transaction.type)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{transaction.symbol}</TableCell>
                  <TableCell align="right">
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(transaction.price)}</TableCell>
                  <TableCell align="right">
                    <Typography
                      color={transaction.total >= 0 ? 'success.main' : 'error.main'}
                    >
                      {transaction.total >= 0 ? '+' : ''}{formatCurrency(transaction.total)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status === 'completed' ? '已完成' :
                             transaction.status === 'pending' ? '进行中' : '失败'}
                      color={getStatusColor(transaction.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {transaction.txHash ? (
                      <Typography variant="body2" sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {transaction.txHash}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 分页 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* 统计信息 */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          统计信息
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 2
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              总交易次数
            </Typography>
            <Typography variant="h6">
              {filteredTransactions.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              成功交易
            </Typography>
            <Typography variant="h6">
              {filteredTransactions.filter(tx => tx.status === 'completed').length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              总交易额
            </Typography>
            <Typography variant="h6">
              {formatCurrency(filteredTransactions.reduce((sum, tx) => sum + Math.abs(tx.total), 0))}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              平均交易额
            </Typography>
            <Typography variant="h6">
              {filteredTransactions.length > 0
                ? formatCurrency(filteredTransactions.reduce((sum, tx) => sum + Math.abs(tx.total), 0) / filteredTransactions.length)
                : formatCurrency(0)
              }
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
