import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../services/axiosClient";
import { productService } from "../../services/productService";
import { getZones } from "../../services/zoneService";
import { saveAs } from 'file-saver';
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Typography, Box, TextField, useTheme, useMediaQuery
} from "@mui/material";
import useStocktake from "../../hooks/useStocktake";
import SnackbarAlert from "../../components/SnackbarAlert";

const StockTakeDetailPage = () => {
    const { id } = useParams();
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.roles?.[0];
    const {
        detail,
        setDetail,
        products,
        zones,
        snackbar,
        setSnackbar,
        filter,
        setFilter,
        filteredDetails,
        handleExportExcel,
    } = useStocktake(user, userRole);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Helper lấy storeId cho Staff (nếu cần dùng cho filter/detail)
    const getStaffStoreId = () => {
        if (user && user.store && typeof user.store === 'object' && user.store.id != null) {
            return Number(user.store.id);
        } else if (typeof user?.storeId === 'number' || (typeof user?.storeId === 'string' && user?.storeId !== '')) {
            return Number(user.storeId);
        } else if (localStorage.getItem('staff_store_id')) {
            return Number(localStorage.getItem('staff_store_id'));
        }
        return '';
    };

    useEffect(() => {
        // Chỉ cần lấy detail từ API nếu chưa có
        if (!detail && id) {
            axios.get(`/stocktakes/${id}`)
                .then(res => setDetail(res.data))
                .catch(() => alert("Không lấy được chi tiết phiếu kiểm kê!"));
        }
    }, [id, detail, setDetail]);

    // Sau khi lấy detail
    const hasDiff = Array.isArray(detail?.detail)
        ? detail.detail.some(d => d.diff !== 0)
        : false;

    if (!detail) return (
        <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">Đang tải chi tiết...</Typography>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1100, margin: '20px auto', background: '#fff', p: isMobile ? 2 : 4, borderRadius: 3, boxShadow: 2 }}>
            {/* Header: Mã kiểm kho, trạng thái, thông tin phụ */}
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', mb: 1 }}>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} mr={2} color="primary.main">
                    {detail.name || `KK${String(detail.id).padStart(6, '0')}`}
                </Typography>
                <Chip
                    label={detail.status === "COMPLETED" ? "Đã cân bằng kho" : detail.status === "DRAFT" ? "Phiếu tạm" : detail.status}
                    color={detail.status === "COMPLETED" ? "success" : detail.status === "DRAFT" ? "warning" : "default"}
                    size="medium"
                    sx={{ fontWeight: 700, fontSize: isMobile ? 16 : 18, ml: isMobile ? 0 : 2, mt: isMobile ? 1 : 0 }}
                />
                {/* Nút Cân bằng kho */}
                {detail.status === 'COMPLETED' && hasDiff && (
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ borderRadius: 2, fontWeight: 700, ml: 2, mt: isMobile ? 2 : 0 }}
                        onClick={() => navigate(`/sale/balance/${detail.id}`)}
                    >
                        Cân bằng kho (Tạo phiếu bán)
                    </Button>
                )}
            </Box>
            <Box mb={2} sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Box>
                    <Typography><b>Người tạo:</b> <span style={{ color: '#1976d2' }}>{detail.createdByName || ''}</span></Typography>
                    <Typography><b>Ngày tạo:</b> {detail.stocktakeDate ? new Date(detail.stocktakeDate).toLocaleString('vi-VN') : ''}</Typography>
                </Box>
                <Box>
                    <Typography><b>Người cân bằng:</b> {detail.status === "COMPLETED" ? <span style={{ color: '#388e3c' }}>{detail.createdByName || ''}</span> : <span style={{ color: '#888' }}>Chưa có</span>}</Typography>
                    <Typography><b>Ngày cân bằng:</b> {detail.status === "COMPLETED" && detail.updatedAt ? new Date(detail.updatedAt).toLocaleString('vi-VN') : <span style={{ color: '#888' }}>Chưa có</span>}</Typography>
                </Box>
            </Box>
            {/* Bộ lọc tìm kiếm */}
            <Box mb={2} sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
                <TextField
                    fullWidth={isMobile}
                    size="small"
                    label="Tìm mã lô"
                    value={filter.batchCode}
                    onChange={e => setFilter(f => ({ ...f, batchCode: e.target.value }))}
                />
                <TextField
                    fullWidth={isMobile}
                    size="small"
                    label="Tìm tên hàng"
                    value={filter.productName}
                    onChange={e => setFilter(f => ({ ...f, productName: e.target.value }))}
                />
                {/* Nút Export Excel chỉ hiển thị khi phiếu đã hoàn thành */}
                {detail.status === "COMPLETED" && (
                    <Button
                        variant="contained"
                        color="success"
                        sx={{ borderRadius: 2, minWidth: 160, fontWeight: 700 }}
                        onClick={() => handleExportExcel(detail, filteredDetails, products, zones)}
                    >
                        Export Excel
                    </Button>
                )}
            </Box>
            {/* Bảng dữ liệu */}
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ background: "#f5f5f5" }}>
                            <TableCell><b>Mã lô</b></TableCell>
                            <TableCell><b>Tên hàng</b></TableCell>
                            {!isMobile && <TableCell><b>Khu vực hệ thống</b></TableCell>}
                            <TableCell><b>Tồn kho</b></TableCell>
                            <TableCell><b>Thực tế</b></TableCell>
                            {!isMobile && <TableCell><b>Khu vực thực tế</b></TableCell>}
                            <TableCell><b>Chênh lệch</b></TableCell>
                            {!isMobile && <TableCell><b>Hạn dùng</b></TableCell>}
                            {!isMobile && <TableCell><b>IsCheck</b></TableCell>}
                            {!isMobile && <TableCell><b>Ghi chú</b></TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredDetails.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isMobile ? 5 : 10} align="center">Không có dữ liệu chi tiết</TableCell>
                            </TableRow>
                        ) : (
                            filteredDetails.map((d, idx) => (
                                <TableRow key={(d.batchCode || d.name || 'row') + '-' + (d.productId || '') + '-' + idx} hover sx={d.diff !== 0 ? { background: '#ffeaea' } : {}}>
                                    <TableCell sx={{ color: '#1976d2', fontWeight: 600 }}>{d.batchCode || d.name}</TableCell>
                                    <TableCell><b>{products.find(p => p.id === d.productId)?.productName || d.productName || d.productId}</b></TableCell>
                                    {!isMobile && <TableCell>
                                        {d.zones_id ?
                                            (Array.isArray(d.zones_id) ?
                                                d.zones_id.map(zid => {
                                                    const zone = zones.find(z => z.id === Number(zid));
                                                    return zone ? zone.zoneName : zid;
                                                }).join(", ")
                                                : d.zones_id)
                                            : (d.zoneName || d.zoneId || '')
                                        }
                                    </TableCell>}
                                    <TableCell>{d.remain}</TableCell>
                                    <TableCell>{d.real}</TableCell>
                                    {!isMobile && <TableCell>{
                                        // Hiển thị tên khu vực thực tế thay vì id
                                        Array.isArray(d.zoneReal)
                                            ? d.zoneReal.map(zid => {
                                                const zone = zones.find(z => z.id === Number(zid));
                                                return zone ? zone.zoneName : zid;
                                            }).join(", ")
                                            : typeof d.zoneReal === "string" && d.zoneReal.includes(",")
                                                ? d.zoneReal.split(",").map(zid => {
                                                    const zone = zones.find(z => z.id === Number(zid.trim()));
                                                    return zone ? zone.zoneName : zid.trim();
                                                }).join(", ")
                                                : (function () {
                                                    const zone = zones.find(z => z.id === Number(d.zoneReal));
                                                    return zone ? zone.zoneName : (d.zoneReal || '');
                                                })()
                                    }</TableCell>}
                                    <TableCell>{d.diff}</TableCell>
                                    {!isMobile && <TableCell>{d.expireDate ? new Date(d.expireDate).toLocaleDateString('vi-VN') : ''}</TableCell>}
                                    {!isMobile && <TableCell>{d.isCheck ? 'Đã kiểm' : 'Chưa kiểm'}</TableCell>}
                                    {!isMobile && <TableCell>{d.note}</TableCell>}
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
            <SnackbarAlert
                open={snackbar.isOpen}
                onClose={() => setSnackbar(prev => ({ ...prev, isOpen: false }))}
                message={snackbar.message}
                severity={snackbar.severity}
            />
        </Box>
    );
};

export default StockTakeDetailPage;
