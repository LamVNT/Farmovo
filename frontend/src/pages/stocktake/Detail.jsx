import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../services/axiosClient";
import { productService } from "../../services/productService";
import { getZones } from "../../services/zoneService";
import { saveAs } from 'file-saver';
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Typography, Box, TextField
} from "@mui/material";

const StockTakeDetailPage = () => {
    const { id } = useParams();
    const [detail, setDetail] = useState(null);
    const [products, setProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [filter, setFilter] = useState({ batchCode: '', productName: '' });
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

    const handleExportExcel = async () => {
        try {
            const res = await axios.get(`/stocktakes/${id}/export-excel`, { responseType: 'blob' });
            saveAs(res.data, `stocktake_${id}.xlsx`);
        } catch {
            alert('Không thể export file Excel!');
        }
    };

    if (!detail) return (
        <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">Đang tải chi tiết...</Typography>
        </Box>
    );

    // Parse detail JSON
    let details = [];
    try {
        details = Array.isArray(detail.detail) ? detail.detail : JSON.parse(detail.detail);
    } catch {}

    // Filter bảng chi tiết
    const filteredDetails = details.filter(d => {
        const matchesBatch = !filter.batchCode || (d.batchCode || d.name || '').toLowerCase().includes(filter.batchCode.toLowerCase());
        const product = products.find(p => p.id === d.productId);
        const matchesProduct = !filter.productName || (product?.productName || '').toLowerCase().includes(filter.productName.toLowerCase());
        return matchesBatch && matchesProduct;
    });

    return (
        <Box sx={{ maxWidth: 1200, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2 }}>
            {/* Mã kiểm kho và trạng thái */}
            <Typography variant="h4" fontWeight={900} mb={1}>
                {detail.name || `KK${String(detail.id).padStart(6, '0')}`} {" "}
                <Chip
                    label={detail.status === "COMPLETED" ? "Đã cân bằng kho" : detail.status}
                    color={
                        detail.status === "DRAFT" ? "warning" :
                        detail.status === "INPROGRESS" ? "info" :
                        detail.status === "COMPLETED" ? "success" :
                        detail.status === "CANCELLED" ? "error" :
                        "default"
                    }
                    size="medium"
                    sx={{ fontWeight: 700, fontSize: 18, ml: 2 }}
                />
            </Typography>
            <Box mb={2} sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Box>
                    <Typography><b>Người tạo:</b> {detail.createdByName || ''}</Typography>
                    <Typography><b>Ngày tạo:</b> {detail.stocktakeDate ? new Date(detail.stocktakeDate).toLocaleString('vi-VN') : ''}</Typography>
                </Box>
                <Box>
                    <Typography><b>Người cân bằng:</b> {detail.createdByName || ''}</Typography>
                    <Typography><b>Ngày cân bằng:</b> {detail.updatedAt ? new Date(detail.updatedAt).toLocaleString('vi-VN') : ''}</Typography>
                </Box>
            </Box>
            <Box mb={2} sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    size="small"
                    label="Tìm mã lô"
                    value={filter.batchCode}
                    onChange={e => setFilter(f => ({ ...f, batchCode: e.target.value }))}
                    sx={{ minWidth: 180 }}
                />
                <TextField
                    size="small"
                    label="Tìm tên hàng"
                    value={filter.productName}
                    onChange={e => setFilter(f => ({ ...f, productName: e.target.value }))}
                    sx={{ minWidth: 220 }}
                />
                <Button
                    variant="outlined"
                    sx={{ ml: 'auto', borderRadius: 2, fontWeight: 600 }}
                    onClick={handleExportExcel}
                    color="success"
                >
                    Export Excel
                </Button>
            </Box>
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ background: "#f5f5f5" }}>
                            <TableCell><b>Mã lô</b></TableCell>
                            <TableCell><b>Tên hàng</b></TableCell>
                            <TableCell><b>Khu vực hệ thống</b></TableCell>
                            <TableCell><b>Tồn kho</b></TableCell>
                            <TableCell><b>Thực tế</b></TableCell>
                            <TableCell><b>Khu vực thực tế</b></TableCell>
                            <TableCell><b>Chênh lệch</b></TableCell>
                            <TableCell><b>Hạn dùng</b></TableCell>
                            <TableCell><b>IsCheck</b></TableCell>
                            <TableCell><b>Ghi chú</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredDetails.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center">Không có dữ liệu chi tiết</TableCell>
                            </TableRow>
                        ) : (
                            filteredDetails.map((d, idx) => (
                                <TableRow key={idx} hover sx={d.diff !== 0 ? { background: '#ffeaea' } : {}}>
                                    <TableCell>{d.batchCode || d.name}</TableCell>
                                    <TableCell>{products.find(p => p.id === d.productId)?.productName || d.productName || d.productId}</TableCell>
                                    <TableCell>{d.zones_id ? d.zones_id.map(zid => zones.find(z => z.id === zid)?.zoneName || zid).join(", ") : d.zoneName || d.zoneId}</TableCell>
                                    <TableCell>{d.remain}</TableCell>
                                    <TableCell>{d.real}</TableCell>
                                    <TableCell>{d.zoneReal || ''}</TableCell>
                                    <TableCell>{d.diff}</TableCell>
                                    <TableCell>{d.expireDate ? new Date(d.expireDate).toLocaleDateString('vi-VN') : ''}</TableCell>
                                    <TableCell>{d.isCheck ? 'Đã kiểm' : 'Chưa kiểm'}</TableCell>
                                    <TableCell>{d.note}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box mt={2}>
                <Typography><b>Ghi chú phiếu:</b> {detail.stocktakeNote}</Typography>
            </Box>
            <Box mt={2}>
                <Button variant="outlined" onClick={() => navigate("/stocktake")} sx={{ borderRadius: 2 }}>Quay lại danh sách</Button>
            </Box>
        </Box>
    );
};

export default StockTakeDetailPage;
