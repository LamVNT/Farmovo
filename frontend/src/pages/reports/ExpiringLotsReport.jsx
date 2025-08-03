import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';
import api from '../../services/axiosClient';

const getColor = (daysLeft) => {
  if (daysLeft < 0) return '#ff5252'; // đỏ
  if (daysLeft === 0) return '#ff9800'; // cam
  if (daysLeft <= 3) return '#fff176'; // vàng
  return '';
};

const ExpiringLotsReport = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/api/reports/expiring-lots?days=7').then(res => setData(res.data));
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>Cảnh báo sản phẩm sắp hết hạn</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã sản phẩm</TableCell>
              <TableCell>Lot</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Ngày hết hạn</TableCell>
              <TableCell>Số ngày còn lại</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(lot => (
              <TableRow key={lot.id} style={{ background: getColor(lot.daysLeft) }}>
                <TableCell>{lot.productCode}</TableCell>
                <TableCell>{lot.lotCode}</TableCell>
                <TableCell>{lot.zoneName}</TableCell>
                <TableCell>{lot.expireDate}</TableCell>
                <TableCell>{lot.daysLeft}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ExpiringLotsReport; 