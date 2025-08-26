import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem, Select, FormControl, InputLabel, Stack } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getSalesTotal } from '../../services/reportService';
import { FaCashRegister } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthorizationContext';

const SalesShiftTotal = () => {
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [fromTime, setFromTime] = useState('08:00');
  const [toTime, setToTime] = useState('22:00');
  const [groupBy, setGroupBy] = useState('shift');
  const [rows, setRows] = useState([]);

  // Lấy storeId nếu là Staff
  const userStoreId = user && isStaff() ? user.storeId : null;

  const buildRange = () => ({ from: `${date}T${fromTime}:00`, to: `${date}T${toTime}:00` });

  const fetchData = () => {
    const range = buildRange();
    getSalesTotal({ ...range, groupBy, storeId: userStoreId })
      .then(res => setRows(res.data))
      .catch(() => alert('Lỗi khi lấy báo cáo Sale theo ca!'));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setShift = (shift) => {
    if (shift === 'morning') { setFromTime('06:00'); setToTime('14:00'); }
    else if (shift === 'afternoon') { setFromTime('14:00'); setToTime('22:00'); }
    else { setFromTime('22:00'); setToTime('06:00'); }
  };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 5 }}>
      <Box sx={{ maxWidth: 1300, mx: 'auto', p: 4, background: '#fff', borderRadius: 3, boxShadow: 3 }}>
        <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
        <Typography variant="h5" fontWeight={700} mb={3}>
          <FaCashRegister style={{ marginRight: 8 }} /> Tổng tiền Sale theo ca
          {isStaff() && user?.storeName && (
            <Typography component="span" variant="h6" color="primary.main" sx={{ ml: 2 }}>
              - Kho: {user.storeName}
            </Typography>
          )}
        </Typography>

        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item><TextField type="date" label="Ngày" InputLabelProps={{ shrink: true }} value={date} onChange={e => setDate(e.target.value)} /></Grid>
          <Grid item><TextField type="time" label="Từ giờ" InputLabelProps={{ shrink: true }} value={fromTime} onChange={e => setFromTime(e.target.value)} /></Grid>
          <Grid item><TextField type="time" label="Đến giờ" InputLabelProps={{ shrink: true }} value={toTime} onChange={e => setToTime(e.target.value)} /></Grid>
          <Grid item>
            <FormControl size="small">
              <InputLabel>Group By</InputLabel>
              <Select value={groupBy} label="Group By" onChange={e => setGroupBy(e.target.value)} sx={{ minWidth: 160 }}>
                <MenuItem value="shift">Ca</MenuItem>
                <MenuItem value="hour">Giờ</MenuItem>
                <MenuItem value="cashier">Nhân viên</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item><Button variant="contained" onClick={fetchData}>Xem</Button></Grid>
        </Grid>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={3}>
          <Button size="small" variant="outlined" onClick={() => { setShift('morning'); fetchData(); }}>Ca sáng (06:00 - 14:00)</Button>
          <Button size="small" variant="outlined" onClick={() => { setShift('afternoon'); fetchData(); }}>Ca chiều (14:00 - 22:00)</Button>
          <Button size="small" variant="outlined" onClick={() => { setShift('night'); fetchData(); }}>Ca tối (22:00 - 06:00)</Button>
        </Stack>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          {rows.map((r, idx) => (
            <Box key={idx} sx={{
              display: 'flex', justifyContent: 'space-between', py: 1,
              borderBottom: idx < rows.length - 1 ? '1px solid #eee' : 'none',
              '&:hover': { backgroundColor: '#fafafa' }
            }}>
              <Typography>{r.label}</Typography>
              <Typography fontWeight={600} color="primary">{Number(r.totalAmount || 0).toLocaleString('vi-VN')} ({r.orderCount || 0} đơn)</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};

export default SalesShiftTotal;
