import React, { useEffect, useState } from "react";
import { getStocktakeDiff } from "../../services/reportService";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, CircularProgress } from "@mui/material";

const StocktakeDiffReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStocktakeDiff()
      .then(res => setData(res.data))
      .catch(() => alert("Lỗi khi lấy báo cáo sai lệch!"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ maxWidth: 1100, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Báo cáo sản phẩm sai lệch kiểm kê</Typography>
      {loading ? (
        <Box sx={{ textAlign: "center", mt: 6 }}>
          <CircularProgress />
          <Typography mt={2}>Đang tải dữ liệu...</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ mt: 2, borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: "#f5f5f5" }}>
                <TableCell><b>Mã SP</b></TableCell>
                <TableCell><b>Tên sản phẩm</b></TableCell>
                <TableCell><b>Thực tế</b></TableCell>
                <TableCell><b>Tồn kho hệ thống</b></TableCell>
                <TableCell><b>Chênh lệch</b></TableCell>
                <TableCell><b>Ghi chú</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Không có dữ liệu</TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.productId || row.id}</TableCell>
                    <TableCell>{row.productName || row.name}</TableCell>
                    <TableCell>{row.real}</TableCell>
                    <TableCell>{row.remain}</TableCell>
                    <TableCell>{row.diff}</TableCell>
                    <TableCell>{row.note}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default StocktakeDiffReport; 