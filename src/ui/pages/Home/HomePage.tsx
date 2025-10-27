import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Container,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TradingIcon,
  AccountBalance as PortfolioIcon,
  History as HistoryIcon,
  FlashOn as FlashLoanIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  features: string[];
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, path, features, color }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: color,
        },
        border: `2px solid transparent`,
      }}
      onClick={() => navigate(path)}
    >
      <CardContent sx={{ flex: 1, textAlign: 'center', pb: 1 }}>
        <Box
          sx={{
            mb: 2,
            color: color,
            fontSize: '3rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
          {features.map((feature, index) => (
            <Chip
              key={index}
              label={feature}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: color,
            '&:hover': {
              backgroundColor: color,
              opacity: 0.9,
            },
          }}
        >
          进入功能
        </Button>
      </CardActions>
    </Card>
  );
};

export const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      title: '交易中心',
      description: '专业的去中心化交易平台，支持多种交易策略和订单类型',
      icon: <TradingIcon fontSize="inherit" />,
      path: '/trading',
      color: theme.palette.primary.main,
      features: ['闪电贷清算', '合约交易', '套利交易', '订单管理'],
    },
    {
      title: '资产投资组合',
      description: '实时监控和管理您的数字资产投资组合',
      icon: <PortfolioIcon fontSize="inherit" />,
      path: '/portfolio',
      color: theme.palette.secondary.main,
      features: ['资产概览', '收益统计', '风险分析', '历史回测'],
    },
    {
      title: '交易历史',
      description: '完整的交易记录和历史数据分析',
      icon: <HistoryIcon fontSize="inherit" />,
      path: '/history',
      color: theme.palette.success.main,
      features: ['交易记录', '收益统计', '导出数据', '高级筛选'],
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* 顶部英雄区域 */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: { xs: 6, md: 10 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <FlashLoanIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.9 }} />
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              智运通交易系统
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.9,
                maxWidth: 600,
                mx: 'auto',
                fontSize: { xs: '1.1rem', md: '1.25rem' }
              }}
            >
              基于Injective区块链的专业级去中心化交易平台
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
              <SecurityIcon />
              <Typography variant="body1">安全可靠</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
              <SpeedIcon />
              <Typography variant="body1">高效快速</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
              <FlashLoanIcon />
              <Typography variant="body1">闪电贷支持</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 功能卡片区域 */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Typography
          variant="h3"
          component="h2"
          sx={{
            textAlign: 'center',
            mb: 2,
            fontWeight: 'bold',
            color: 'text.primary'
          }}
        >
          核心功能
        </Typography>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: 'text.secondary',
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          选择您需要的功能模块，每个模块都可以独立运行，互不干扰
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </Box>
      </Container>

      {/* 底部信息区域 */}
      <Box
        sx={{
          backgroundColor: 'background.paper',
          py: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
          >
            © 2025年10月 智运通交易系统 - 基于Injective区块链的专业级去中心化交易平台
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
