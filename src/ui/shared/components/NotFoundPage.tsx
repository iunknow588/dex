import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        p: 3
      }}
    >
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 400,
          width: '100%'
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
          404
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          页面未找到
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          您访问的页面不存在或已被移动。请检查URL或返回首页。
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleGoHome}
          sx={{ minWidth: 120 }}
        >
          返回首页
        </Button>
      </Paper>
    </Box>
  );
};
