import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem, Select, FormControl, InputLabel, Stack } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getImportsTotal } from '../../services/reportService';
import { FaTruckLoading } from 'react-icons/fa';

const ImportsTotal = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [groupBy, setGroupBy] = useState('day');
  const [rows, setRows] = useState([]);

  const fetchData = () => {
    getImportsTotal({ from, to, groupBy })
      .then(res => setRows(res.data))
      .catch(() => alert('Lỗi khi lấy tổng tiền nhập!'));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setToday = () => { const d = dayjs().format('YYYY-MM-DD'); setFrom(d); setTo(d); };
  const setLast7Days = () => { setFrom(dayjs().subtract(6, 'day').format('YYYY-MM-DD')); setTo(dayjs().format('YYYY-MM-DD')); };
  const setThisMonth = () => { setFrom(dayjs().startOf('month').format('YYYY-MM-DD')); setTo(dayjs().format('YYYY-MM-DD')); };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 5 }}>
      <Box sx={{ maxWidth: 1300, mx: 'auto', p: 4, background: '#fff', borderRadius: 3, boxShadow: 3 }}>
        <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
        <Typography variant="h5" fontWeight={700} mb={1}><FaTruckLoading style={{ marginRight: 8 }} /> Tổng tiền Import</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Theo dõi tổng chi phí nhập theo Ngày / Tuần / Tháng.</Typography>

        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item><TextField type="date" label="Từ ngày" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} /></Grid>
          <Grid item><TextField type="date" label="Đến ngày" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} /></Grid>
          <Grid item>
            <FormControl size="small">
              <InputLabel>Nhóm</InputLabel>
              <Select value={groupBy} label="Nhóm" onChange={e => setGroupBy(e.target.value)} sx={{ minWidth: 160 }}>
                <MenuItem value="day">Ngày</MenuItem>
                <MenuItem value="week">Tuần</MenuItem>
                <MenuItem value="month">Tháng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item><Button variant="contained" onClick={fetchData}>Xem</Button></Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={3}>
          <Button size="small" variant="outlined" onClick={() => { setToday(); fetchData(); }}>Hôm nay</Button>
          <Button size="small" variant="outlined" onClick={() => { setLast7Days(); fetchData(); }}>7 ngày qua</Button>
          <Button size="small" variant="outlined" onClick={() => { setThisMonth(); fetchData(); }}>Tháng này</Button>
        </Stack>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          {rows.map((r, idx) => (
            <Box key={idx} sx={{
              display: 'flex', justifyContent: 'space-between', py: 1,
              borderBottom: idx < rows.length - 1 ? '1px solid #eee' : 'none',
              '&:hover': { backgroundColor: '#fafafa' }
            }}>
              <Typography>{r.bucket}</Typography>
              <Typography fontWeight={600} color="primary">{Number(r.totalAmount || 0).toLocaleString('vi-VN')} ({r.count || 0} phiếu)</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};

export default ImportsTotal;
