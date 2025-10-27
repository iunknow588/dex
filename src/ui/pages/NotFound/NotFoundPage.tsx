import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <Paper
        sx={{
          p: 6,
          maxWidth: 500,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2,
            opacity: 0.7,
          }}
        >
          404
        </Typography>

        <Typography variant="h4" gutterBottom>
          页面未找到
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          抱歉，您访问的页面不存在或已被移动。
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ minWidth: 200 }}
        >
          返回首页
        </Button>
      </Paper>
    </Box>
  );
};
