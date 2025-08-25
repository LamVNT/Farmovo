import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../services/axiosClient";
import { productService } from "../../services/productService";
import { getZones } from "../../services/zoneService";
import { saveAs } from 'file-saver';
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Typography, Box, TextField, useTheme, useMediaQuery, Link
} from "@mui/material";
import useStocktake from "../../hooks/useStocktake";
import SnackbarAlert from "../../components/SnackbarAlert";
import { useStoreForStocktake } from "../../hooks/useStoreForStocktake";

const StockTakeDetailPage = () => {
    const { id } = useParams();
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.roles?.[0];

    // Store selection for stocktake
    const storeForStocktake = useStoreForStocktake(user, userRole);
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

    // Auto-sync store from stocktake detail for Owner/Admin (chỉ khi thực sự cần)
    useEffect(() => {
        if (detail && detail.storeId && storeForStocktake.shouldShowStoreSelector()) {
            const currentStoreId = storeForStocktake.currentStoreId;

            // If no store selected or different store, sync from stocktake
            if (!currentStoreId || String(currentStoreId) !== String(detail.storeId)) {
                console.log('Detail.jsx - Auto-syncing store from stocktake detail:', {
                    currentStoreId,
                    detailStoreId: detail.storeId,
                    detailStoreName: detail.storeName
                });
                const storeObj = {
                    id: detail.storeId,
                    storeName: detail.storeName || `Store ${detail.storeId}`
                };
                storeForStocktake.selectStore(storeObj);
            }
        }
    }, [detail?.storeId, detail?.storeName]); // Chỉ depend vào storeId và storeName để tránh vòng lặp

    // Sau khi lấy detail
    const hasDiff = Array.isArray(detail?.detail)
        ? detail.detail.some(d => d.diff !== 0)
        : false;

    const hasShortage = Array.isArray(detail?.detail)
        ? detail.detail.some(d => Number(d.diff) < 0)
        : false;
    const hasSurplus = Array.isArray(detail?.detail)
        ? detail.detail.some(d => Number(d.diff) > 0)
        : false;
    const canBalance = detail?.status === 'COMPLETED'
        && hasShortage
        && detail?.hasBalance !== true; // Ẩn nếu đã có PCB COMPLETE liên kết

    // Surplus (dư hàng): real > remain
    const surplusItems = Array.isArray(detail?.detail)
        ? detail.detail.filter(d => Number(d.diff) > 0)
        : [];

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
                    label={detail.status === "COMPLETED" ? "Đã hoàn thành" : detail.status === "DRAFT" ? "Phiếu tạm" : detail.status}
                    color={detail.status === "COMPLETED" ? "success" : detail.status === "DRAFT" ? "warning" : "default"}
                    size="medium"
                    sx={{ fontWeight: 700, fontSize: isMobile ? 16 : 18, ml: isMobile ? 0 : 2, mt: isMobile ? 1 : 0 }}
                />
                {/* Nút hành động ở header: Tạo phiếu nhập (dư hàng) và Cân bằng kho (thiếu hàng) */}
                {hasSurplus && !localStorage.getItem(`stocktake_${detail.id}_hasBalanceImport`) && (
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ borderRadius: 2, fontWeight: 700, ml: 2, mt: isMobile ? 2 : 0 }}
                        onClick={() => navigate('/import/balance', {
                            state: { surplusFromStocktake: { stocktakeId: detail.id, stocktakeCode: detail.name, storeId: detail.storeId, items: surplusItems } }
                        })}
                    >
                        Tạo phiếu nhập hàng
                    </Button>
                )}
                {hasSurplus && localStorage.getItem(`stocktake_${detail.id}_hasBalanceImport`) && (
                    <Button
                        variant="outlined"
                        color="success"
                        sx={{ borderRadius: 2, fontWeight: 700, ml: 2, mt: isMobile ? 2 : 0 }}
                        disabled
                    >
                        Đã tạo phiếu nhập
                    </Button>
                )}
                {canBalance && (
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ borderRadius: 2, fontWeight: 700, ml: 2, mt: isMobile ? 2 : 0 }}
                        onClick={() => {
                            // Ensure store is selected in context before navigating
                            if (detail.storeId && storeForStocktake.shouldShowStoreSelector()) {
                                // For Owner/Admin, set the store from stocktake detail
                                const storeObj = { id: detail.storeId, storeName: detail.storeName || `Store ${detail.storeId}` };
                                storeForStocktake.selectStore(storeObj);
                            }
                            navigate(`/sale/balance/${detail.id}`, {
                                state: {
                                    stocktakeId: detail.id,
                                    stocktakeCode: detail.name,
                                    storeId: detail.storeId,
                                    storeName: detail.storeName
                                }
                            });
                        }}
                    >
                        Cân bằng kho (Tạo PCB)
                    </Button>
                )}
                {/* Nút mở PCB đã liên kết nếu có */}
                {!canBalance && detail?.hasBalance && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        sx={{ borderRadius: 2, fontWeight: 700, ml: 2, mt: isMobile ? 2 : 0 }}
                        onClick={() => navigate(`/balance?view=detail&id_by_stocktake=${detail.id}`)}
                        title="Mở phiếu cân bằng đã liên kết"
                    >
                        Xem phiếu cân bằng
                    </Button>
                )}
                {/* Nút mở Phiếu nhập đã liên kết nếu có */}
                {detail?.hasImport && (
                    <Button
                        variant="outlined"
                        color="success"
                        sx={{ borderRadius: 2, fontWeight: 700, ml: 2, mt: isMobile ? 2 : 0 }}
                        onClick={() => navigate(`/import?view=detail&stocktakeId=${detail.id}`)}
                        title="Mở phiếu nhập đã liên kết"
                    >
                        Xem phiếu nhập
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

            {/* Surplus banner & actions */}
            {surplusItems.length > 0 && (
                <Box sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #fde68a',
                    background: '#fffbeb'
                }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#92400e' }}>
                        Phát hiện dư hàng: {surplusItems.length} lô có thực tế &gt; tồn kho
                    </Typography>
                </Box>
            )}

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
                            {/* Ẩn cột Khu vực hệ thống */}
                            {/* {!isMobile && <TableCell><b>Khu vực hệ thống</b></TableCell>} */}
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
                                    {/* Ẩn giá trị cột Khu vực hệ thống */}
                                    {/* {!isMobile && <TableCell>
                                        {d.zones_id ?
                                            (Array.isArray(d.zones_id) ?
                                                d.zones_id.map(zid => {
                                                    const zone = zones.find(z => z.id === Number(zid));
                                                    return zone ? zone.zoneName : zid;
                                                }).join(", ")
                                                : d.zones_id)
                                            : (d.zoneName || d.zoneId || '')
                                        }
                                    </TableCell>} */}
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
