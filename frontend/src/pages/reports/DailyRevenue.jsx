import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Stack } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getDailyRevenue } from '../../services/reportService';
import { FaMoneyBillWave, FaShoppingCart, FaTruckLoading } from 'react-icons/fa';

const DailyRevenue = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState(dayjs().format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [data, setData] = useState({ totalSaleAmount: 0, totalImportAmount: 0, netRevenue: 0 });

  const fetchData = () => {
    getDailyRevenue({ from, to })
      .then(res => setData(res.data))
      .catch(() => alert('Lỗi khi lấy báo cáo doanh thu!'));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setToday = () => {
    const d = dayjs().format('YYYY-MM-DD');
    setFrom(d); setTo(d);
  };
  const setLast7Days = () => {
    setFrom(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
    setTo(dayjs().format('YYYY-MM-DD'));
  };
  const setThisMonth = () => {
    setFrom(dayjs().startOf('month').format('YYYY-MM-DD'));
    setTo(dayjs().format('YYYY-MM-DD'));
  };

  const InfoCard = ({ title, value, icon, color }) => (
    <Paper sx={{
      p: 3, borderRadius: 3, boxShadow: 3, textAlign: 'center',
      transition: 'all 0.25s',
      '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
    }}>
      <Box mb={2} fontSize={40} color={color}>{icon}</Box>
      <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
      <Typography variant="h5" fontWeight={700} color={color}>
        {Number(value || 0).toLocaleString('vi-VN')}
      </Typography>
    </Paper>
  );

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 5 }}>
      <Box sx={{ maxWidth: 1300, mx: 'auto', p: 4, background: '#fff', borderRadius: 3, boxShadow: 3 }}>
        <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
        <Typography variant="h5" fontWeight={700} mb={1}>Doanh thu theo ngày / khoảng ngày</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Theo dõi tổng Sale, tổng Import và Net Revenue theo phạm vi thời gian bạn chọn.</Typography>

        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item><TextField type="date" label="Từ ngày" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} /></Grid>
          <Grid item><TextField type="date" label="Đến ngày" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} /></Grid>
          <Grid item><Button variant="contained" onClick={fetchData}>Xem</Button></Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={3}>
          <Button size="small" variant="outlined" onClick={() => { setToday(); fetchData(); }}>Hôm nay</Button>
          <Button size="small" variant="outlined" onClick={() => { setLast7Days(); fetchData(); }}>7 ngày qua</Button>
          <Button size="small" variant="outlined" onClick={() => { setThisMonth(); fetchData(); }}>Tháng này</Button>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}><InfoCard title="Tổng tiền Sale" value={data.totalSaleAmount} icon={<FaShoppingCart />} color="#1976d2" /></Grid>
          <Grid item xs={12} md={4}><InfoCard title="Tổng tiền Import" value={data.totalImportAmount} icon={<FaTruckLoading />} color="#e65100" /></Grid>
          <Grid item xs={12} md={4}><InfoCard title="Net Revenue" value={data.netRevenue} icon={<FaMoneyBillWave />} color="#6a1b9a" /></Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DailyRevenue;