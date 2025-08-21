import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaExchangeAlt, FaExclamationTriangle, FaClock } from 'react-icons/fa';

const InventoryReport = () => {
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
        <Typography variant="h4" fontWeight={700} color="primary.main">Báo cáo tồn kho</Typography>
        <Typography variant="subtitle1" color="text.secondary">Tổng hợp các báo cáo tồn, nhập/xuất và lô sắp hết hạn</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <CardItem
            title="Tồn kho tổng hợp"
            icon={<FaBoxOpen size={28} color="#1976d2" />}
            link="/reports/remain-summary"
            desc="Xem tồn kho tổng hợp theo danh mục, sản phẩm, zone."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardItem
            title="Nhập xuất kho"
            icon={<FaExchangeAlt size={28} color="#388e3c" />}
            link="/reports/inout-summary"
            desc="Theo dõi số lượng nhập, xuất, tồn cuối mỗi ngày."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardItem
            title="Sản phẩm sai lệch"
            icon={<FaExclamationTriangle size={28} color="#fbc02d" />}
            link="/reports/stocktake-diff"
            desc="Kiểm tra các sản phẩm có chênh lệch khi kiểm kho."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardItem
            title="Lô sắp hết hạn"
            icon={<FaClock size={28} color="#d32f2f" />}
            link="/reports/expiring-lots"
            desc="Danh sách lô sản phẩm sắp hết hạn sử dụng."
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryReport; 