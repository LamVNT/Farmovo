import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, TextField, Button } from '@mui/material';
import api from '../../services/axiosClient';

const StocktakeDiffReport = () => {
  const [data, setData] = useState([]);
  const [stocktakeId, setStocktakeId] = useState('');

  const fetchData = () => {
    api.get('/api/reports/stocktake-diff', { params: stocktakeId ? { stocktakeId } : {} }).then(res => setData(res.data));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [stocktakeId]);

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>Báo cáo kiểm kê</Typography>
      <Box mb={2} display="flex" gap={2}>
        <TextField
          label="ID đợt kiểm kê (bỏ trống = mới nhất)"
          value={stocktakeId}
          onChange={e => setStocktakeId(e.target.value)}
        />
        <Button variant="contained" onClick={fetchData}>Lọc</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã lot</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Thực tế</TableCell>
              <TableCell>Hệ thống</TableCell>
              <TableCell>Chênh lệch</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(row => (
              <TableRow key={row.batchCode + row.zoneName}>
                <TableCell>{row.batchCode}</TableCell>
                <TableCell>{row.zoneName}</TableCell>
                <TableCell>{row.real}</TableCell>
                <TableCell>{row.remain}</TableCell>
                <TableCell>{row.diff}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StocktakeDiffReport; 