import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';
import api from '../../services/axiosClient';

const RemainSummaryReport = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/reports/remain-summary').then(res => setData(res.data));
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>Báo cáo tồn kho tổng hợp</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Danh mục</TableCell>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Khu vực (Zone)</TableCell>
              <TableCell>Số lượng tồn</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">Không có dữ liệu</TableCell></TableRow>
            )}
            {data.map(category =>
              category.products.map(product =>
                product.zones.length > 0 ? (
                  product.zones.map(zone => (
                    <TableRow key={`${category.category}-${product.productName}-${zone.zoneName || zone.zoneId}`}>
                      <TableCell>{category.category}</TableCell>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell>{zone.zoneName || '-'}</TableCell>
                      <TableCell>{zone.totalRemain}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow key={`${category.category}-${product.productName}-nozone`}>
                    <TableCell>{category.category}</TableCell>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{product.totalRemain}</TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RemainSummaryReport; 