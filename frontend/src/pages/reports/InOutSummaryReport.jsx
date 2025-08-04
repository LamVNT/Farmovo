import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, TextField, Button } from '@mui/material';
import api from '../../services/axiosClient';
import dayjs from 'dayjs';

const InOutSummaryReport = () => {
  const [data, setData] = useState([]);
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));

  const fetchData = () => {
    api.get('/reports/inout-summary', { params: { from, to } }).then(res => setData(res.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>Báo cáo nhập xuất kho</Typography>
      <Box mb={2} display="flex" gap={2}>
        <TextField
          label="Từ ngày"
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Đến ngày"
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={fetchData}>Lọc</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ngày</TableCell>
              <TableCell>Nhập</TableCell>
              <TableCell>Xuất</TableCell>
              <TableCell>Tồn cuối</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(row => (
              <TableRow key={row.date}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.importQuantity}</TableCell>
                <TableCell>{row.exportQuantity}</TableCell>
                <TableCell>{row.remainQuantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InOutSummaryReport; 