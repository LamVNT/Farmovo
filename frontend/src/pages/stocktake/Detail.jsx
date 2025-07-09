import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../services/axiosClient";
import { productService } from "../../services/productService";
import { getZones } from "../../services/zoneService";
import {
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Typography, Box
} from "@mui/material";

const StockTakeDetailPage = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [products, setProducts] = useState([]);
  const [zones, setZones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/stocktakes/${id}`)
      .then(res => setDetail(res.data))
      .catch(() => alert("Không lấy được chi tiết phiếu kiểm kê!"));
  }, [id]);

  useEffect(() => {
    productService.getAllProducts().then(setProducts);
    getZones().then(setZones);
  }, []);

  if (!detail) return (
    <Box sx={{ textAlign: "center", mt: 8 }}>
      <Typography variant="h6" color="text.secondary">Đang tải chi tiết...</Typography>
    </Box>
  );

  // Parse detail JSON
  let details = [];
  try {
    details = JSON.parse(detail.detail);
  } catch {}

  return (
    <Box sx={{ maxWidth: 1100, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Chi tiết phiếu kiểm kê #{detail.id}
      </Typography>
      <Box mb={2}>
        <Typography>
          <b>Ngày kiểm kê:</b> {new Date(detail.stocktakeDate).toLocaleDateString("vi-VN")}
        </Typography>
        <Typography>
          <b>Ghi chú:</b> {detail.stocktakeNote}
        </Typography>
        <Typography>
          <b>Trạng thái:</b> {" "}
          <Chip
            label={detail.status}
            color={detail.status === "DRAFT" ? "warning" : "success"}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Typography>
      </Box>
      <Button
        variant="outlined"
        sx={{ mb: 3, borderRadius: 2, fontWeight: 600, mr: 2 }}
        onClick={() => navigate(`/stocktake/edit/${detail.id}`)}
        color="primary"
      >
        Chỉnh sửa
      </Button>
      <Button
        variant="outlined"
        sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}
        onClick={() => navigate("/stocktake")}
      >
        Quay lại danh sách
      </Button>
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell><b>Sản phẩm</b></TableCell>
              <TableCell><b>Khu vực đã kiểm</b></TableCell>
              <TableCell><b>Thực tế</b></TableCell>
              <TableCell><b>Tồn kho hệ thống</b></TableCell>
              <TableCell><b>Chênh lệch</b></TableCell>
              <TableCell><b>Ghi chú</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {details.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Không có dữ liệu chi tiết</TableCell>
              </TableRow>
            ) : (
              details.map((d, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    {products.find(p => p.id === d.productId)?.name || d.productId}
                  </TableCell>
                  <TableCell>
                    {d.zones_id
                      ? d.zones_id.map(zid => zones.find(z => z.id === zid)?.zoneName || zid).join(", ")
                      : ""}
                  </TableCell>
                  <TableCell>{d.real}</TableCell>
                  <TableCell>{d.remain}</TableCell>
                  <TableCell>{d.diff}</TableCell>
                  <TableCell>{d.note}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StockTakeDetailPage;
