import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface Asset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  allocation: number;
}

interface PortfolioData {
  totalValue: number;
  totalChange24h: number;
  assets: Asset[];
}

// 模拟投资组合数据
const mockPortfolioData: PortfolioData = {
  totalValue: 12543.67,
  totalChange24h: 2.34,
  assets: [
    {
      symbol: 'INJ',
      name: 'Injective',
      balance: 150.5,
      value: 7532.85,
      change24h: 3.2,
      allocation: 60.1,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      balance: 5000,
      value: 5000,
      change24h: 0,
      allocation: 39.9,
    },
  ],
};

export const PortfolioPage: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(mockPortfolioData);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleRefresh = async () => {
    setIsLoading(true);
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 更新数据（保持模拟数据）
    setPortfolioData(mockPortfolioData);
    setIsLoading(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 页面标题和刷新按钮 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" component="h1">
          资产投资组合
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          刷新数据
        </Button>
      </Box>

      {/* 模拟数据提示 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        当前显示模拟数据。实际部署时将连接真实的区块链钱包和市场数据。
      </Alert>

      {isLoading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            正在更新投资组合数据...
          </Typography>
        </Box>
      )}

      {/* 总览卡片 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WalletIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" color="primary">
                总资产价值
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
              {formatCurrency(portfolioData.totalValue)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {portfolioData.totalChange24h >= 0 ? (
                <TrendingUpIcon sx={{ mr: 0.5, color: 'success.main' }} />
              ) : (
                <TrendingDownIcon sx={{ mr: 0.5, color: 'error.main' }} />
              )}
              <Typography
                variant="body1"
                color={portfolioData.totalChange24h >= 0 ? 'success.main' : 'error.main'}
              >
                {formatPercentage(portfolioData.totalChange24h)} (24h)
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              资产配置
            </Typography>
            <Box sx={{ mt: 2 }}>
              {portfolioData.assets.map((asset) => (
                <Box key={asset.symbol} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {asset.symbol}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {asset.name}
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {formatPercentage(asset.allocation)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={asset.allocation}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* 资产详情表格 */}
      <Paper sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" gutterBottom>
          资产详情
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr" sx={{
                '& > th': {
                  textAlign: 'left',
                  py: 2,
                  px: 1,
                  fontWeight: 'bold',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  fontSize: '0.875rem',
                }
              }}>
                <Box component="th">资产</Box>
                <Box component="th" sx={{ textAlign: 'right' }}>余额</Box>
                <Box component="th" sx={{ textAlign: 'right' }}>价值</Box>
                <Box component="th" sx={{ textAlign: 'right' }}>24h变化</Box>
                <Box component="th" sx={{ textAlign: 'right' }}>占比</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {portfolioData.assets.map((asset) => (
                <Box
                  key={asset.symbol}
                  component="tr"
                  sx={{
                    '& > td': {
                      py: 2,
                      px: 1,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <Box component="td">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>
                        {asset.symbol}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {asset.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Box component="td" sx={{ textAlign: 'right' }}>
                    <Typography variant="body1">
                      {asset.balance.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box component="td" sx={{ textAlign: 'right' }}>
                    <Typography variant="body1">
                      {formatCurrency(asset.value)}
                    </Typography>
                  </Box>
                  <Box component="td" sx={{ textAlign: 'right' }}>
                    <Chip
                      label={formatPercentage(asset.change24h)}
                      color={asset.change24h >= 0 ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box component="td" sx={{ textAlign: 'right' }}>
                    <Typography variant="body1">
                      {formatPercentage(asset.allocation)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
