import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaCashRegister, FaMoneyBillWave } from 'react-icons/fa';

const FinancialReport = () => {
  const navigate = useNavigate();

  const CardItem = ({ title, icon, desc, link }) => (
    <Card
      sx={{
        p: 3,
        cursor: 'pointer',
        height: '100%',
        borderRadius: 3,
        boxShadow: 2,
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 5 },
      }}
      onClick={() => navigate(link)}
    >
      <Box display="flex" alignItems="center" mb={2}>
        {icon}
        <Typography variant="subtitle1" ml={2} fontWeight={600}>{title}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">{desc}</Typography>
      <Button variant="text" sx={{ mt: 2 }} onClick={() => navigate(link)}>
        Xem chi tiết
      </Button>
    </Card>
  );

  return (
    <Box p={3} sx={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} color="primary.main">Báo cáo tài chính</Typography>
        <Typography variant="subtitle1" color="text.secondary">Tổng hợp các báo cáo doanh thu, bán hàng và chi phí nhập</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <CardItem
            title="Doanh thu (ngày/khoảng ngày)"
            icon={<FaChartLine size={28} color="#1976d2" />}
            link="/reports/daily-revenue"
            desc="Tổng Sale, Tổng Import, Net Revenue."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardItem
            title="Sale theo ca/giờ/nhân viên"
            icon={<FaCashRegister size={28} color="#388e3c" />}
            link="/reports/sales-total"
            desc="Tổng tiền và số đơn theo ca/giờ hoặc theo nhân viên."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardItem
            title="Tổng tiền Import"
            icon={<FaMoneyBillWave size={28} color="#6d4c41" />}
            link="/reports/imports-total"
            desc="Theo Ngày/Tuần/Tháng, lọc theo supplier."
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialReport; 