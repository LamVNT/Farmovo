import React, { useEffect, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, TextField, Button, Stack, TablePagination } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axiosClient';
import dayjs from 'dayjs';
import { FaExchangeAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthorizationContext';

const toCSV = (rows) => {
  const header = ['date', 'importQuantity', 'exportQuantity', 'remainQuantity'];
  const body = rows.map(r => [r.date, r.importQuantity, r.exportQuantity, r.remainQuantity].join(','));
  return [header.join(','), ...body].join('\n');
};

const InOutSummaryReport = () => {
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const [data, setData] = useState([]);
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Lấy storeId nếu là Staff
  const userStoreId = user && isStaff() ? user.storeId : null;

  const fetchData = () => {
    const params = { from, to };
    if (userStoreId) params.storeId = userStoreId;

    api.get('/reports/inout-summary', { params }).then(res => setData(res.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setToday = () => { const d = dayjs().format('YYYY-MM-DD'); setFrom(d); setTo(d); };
  const setLast7Days = () => { setFrom(dayjs().subtract(6, 'day').format('YYYY-MM-DD')); setTo(dayjs().format('YYYY-MM-DD')); };
  const setThisMonth = () => { setFrom(dayjs().startOf('month').format('YYYY-MM-DD')); setTo(dayjs().format('YYYY-MM-DD')); };

  const summary = useMemo(() => {
    let imp = 0, exp = 0, lastRemain = 0;
    for (const r of data) {
      imp += Number(r.importQuantity || 0);
      exp += Number(r.exportQuantity || 0);
      lastRemain = r.remainQuantity || lastRemain;
    }
    return { imp, exp, lastRemain };
  }, [data]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page, rowsPerPage]);

  const handleExport = () => {
    try {
      const csv = toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inout_${from}_${to}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) { alert('Xuất CSV thất bại'); }
  };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 5 }}>
      <Box sx={{ maxWidth: 1300, mx: 'auto', p: 4, background: '#fff', borderRadius: 3, boxShadow: 3 }}>
        <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
        <Typography variant="h5" fontWeight={700} mb={1}><FaExchangeAlt style={{ marginRight: 8 }} /> Báo cáo nhập xuất kho</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Theo dõi số lượng nhập, xuất và tồn cuối theo từng ngày.</Typography>

        {/* Filter */}
        <Box mb={2} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField label="Từ ngày" type="date" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Đến ngày" type="date" value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" onClick={fetchData}>Lọc</Button>
          <Button variant="outlined" onClick={handleExport}>Xuất CSV</Button>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={3}>
          <Button size="small" variant="outlined" onClick={() => { setToday(); fetchData(); }}>Hôm nay</Button>
          <Button size="small" variant="outlined" onClick={() => { setLast7Days(); fetchData(); }}>7 ngày qua</Button>
          <Button size="small" variant="outlined" onClick={() => { setThisMonth(); fetchData(); }}>Tháng này</Button>
        </Stack>

        {/* Summary */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">Tổng nhập</Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">{summary.imp}</Typography>
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">Tổng xuất</Typography>
            <Typography variant="h6" fontWeight={700} color="error.main">{summary.exp}</Typography>
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">Tồn cuối kỳ</Typography>
            <Typography variant="h6" fontWeight={700}>{summary.lastRemain}</Typography>
          </Paper>
        </Stack>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 560 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ background: '#f5f5f5' }}>
                <TableCell><b>Ngày</b></TableCell>
                <TableCell><b>Nhập</b></TableCell>
                <TableCell><b>Xuất</b></TableCell>
                <TableCell><b>Tồn cuối</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Không có dữ liệu</TableCell></TableRow>
              ) : (
                pagedRows.map((row, idx) => (
                  <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{row.importQuantity}</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{row.exportQuantity}</TableCell>
                    <TableCell fontWeight={600}>{row.remainQuantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Box>
    </Box>
  );
};

export default InOutSummaryReport;
