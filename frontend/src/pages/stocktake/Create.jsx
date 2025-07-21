import React, { useState, useEffect } from "react";
import {
    Button, TextField, FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, IconButton, Checkbox, Tooltip, CircularProgress
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { getZones } from "../../services/zoneService";
import { createStocktake } from "../../services/stocktakeService";
import { getAllStores } from "../../services/storeService";
import axios from '../../services/axiosClient';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";
import { useNavigate } from "react-router-dom";

const CreateStocktakePage = () => {
    const [zones, setZones] = useState([]);
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState({ store: '', zone: '', product: '', batchCode: '', search: '' });
    const [loadingLots, setLoadingLots] = useState(false);
    const [lots, setLots] = useState([]); // Danh sách lô tìm được
    const [selectedLots, setSelectedLots] = useState([]); // Danh sách lô đã chọn để kiểm kê
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", content: "", onConfirm: null });
    const [snackbar, setSnackbar] = useState({ isOpen: false, message: "", severity: "success" });
    const navigate = useNavigate();

    useEffect(() => {
        getZones().then(setZones);
        getAllStores().then(setStores);
        // Lấy danh sách sản phẩm nếu cần (hoặc lấy từ API lô)
    }, []);

    // Lấy danh sách lô khi filter thay đổi
    useEffect(() => {
        const fetchLots = async () => {
            setLoadingLots(true);
            try {
                const params = new URLSearchParams();
                if (filter.store) params.append('store', filter.store);
                if (filter.zone) params.append('zone', filter.zone);
                if (filter.product) params.append('product', filter.product);
                if (filter.batchCode) params.append('batchCode', filter.batchCode);
                if (filter.search) params.append('search', filter.search);
                const res = await axios.get(`/import-transaction-details/stocktake-lot?${params.toString()}`);
                setLots(res.data || []);
            } catch {
                setLots([]);
            } finally {
                setLoadingLots(false);
            }
        };
        fetchLots();
    }, [filter]);

    useEffect(() => {
        localStorage.setItem('stocktake_create_selected_lots', JSON.stringify(selectedLots));
    }, [selectedLots]);

    // Thêm lô vào danh sách kiểm kê tạm
    const handleSelectLot = (lot) => {
        if (selectedLots.some(l => l.id === lot.id)) return;
        setSelectedLots(prev => [
            ...prev,
            {
                ...lot,
                real: '',
                note: '',
                isCheck: false,
                diff: 0
            }
        ]);
    };

    // Xóa lô khỏi danh sách kiểm kê tạm
    const handleRemoveLot = (id) => {
        setSelectedLots(prev => prev.filter(l => l.id !== id));
    };

    // Nhập số thực tế, ghi chú, tick isCheck
    const handleLotChange = (idx, field, value) => {
        setSelectedLots(prev => prev.map((lot, i) => {
            if (i !== idx) return lot;
            let newLot = { ...lot, [field]: value };
            if (field === 'real') {
                const realVal = Number(value);
                newLot.diff = realVal - (Number(lot.remainQuantity) || 0);
            }
            return newLot;
        }));
    };

    // Validate và submit
    const handleSubmit = async () => {
        if (selectedLots.length === 0) {
            setSnackbar({ isOpen: true, message: "Vui lòng chọn ít nhất một lô để kiểm kê!", severity: "error" });
            return;
        }
        for (const lot of selectedLots) {
            if (lot.real === '' || isNaN(Number(lot.real))) {
                setSnackbar({ isOpen: true, message: `Vui lòng nhập số thực tế cho lô ${lot.batchCode || lot.id}!`, severity: "error" });
                return;
            }
        }
        // Chuẩn hóa dữ liệu gửi backend
        const detail = selectedLots.map(lot => ({
            productId: lot.productId,
            batchCode: lot.batchCode || lot.name,
            zoneId: lot.zoneId,
            remain: lot.remainQuantity,
            real: Number(lot.real),
            diff: lot.diff,
            isCheck: lot.isCheck,
            note: lot.note,
            expireDate: lot.expireDate
        }));
        try {
            await createStocktake({
                detail,
                stocktakeNote: "Phiếu kiểm kê mới",
                storeId: filter.store,
                status: "DRAFT",
                stocktakeDate: new Date().toISOString()
            });
            setSnackbar({ isOpen: true, message: "Tạo phiếu kiểm kê thành công!", severity: "success" });
            setSelectedLots([]);
            localStorage.removeItem('stocktake_create_selected_lots');
            navigate("/stocktake");
        } catch {
            setSnackbar({ isOpen: true, message: "Tạo phiếu kiểm kê thất bại!", severity: "error" });
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, margin: "40px auto", background: "#fff", p: 4, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h5" fontWeight={700} mb={2}>Tạo phiếu kiểm kê mới</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    size="small"
                    label="Tìm kiếm nhanh (mã lô, tên sản phẩm, ...)"
                    value={filter.search}
                    onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                    sx={{ minWidth: 220 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Kho</InputLabel>
                    <Select
                        value={filter.store}
                        label="Kho"
                        onChange={e => setFilter(f => ({ ...f, store: e.target.value }))}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {stores.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Khu vực</InputLabel>
                    <Select
                        value={filter.zone}
                        label="Khu vực"
                        onChange={e => setFilter(f => ({ ...f, zone: e.target.value }))}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.zoneName}</MenuItem>)}
                    </Select>
                </FormControl>
                <TextField
                    size="small"
                    label="Sản phẩm"
                    value={filter.product}
                    onChange={e => setFilter(f => ({ ...f, product: e.target.value }))}
                    sx={{ minWidth: 150 }}
                />
                <TextField
                    size="small"
                    label="Mã lô"
                    value={filter.batchCode}
                    onChange={e => setFilter(f => ({ ...f, batchCode: e.target.value }))}
                    sx={{ minWidth: 120 }}
                />
            </Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Danh sách lô phù hợp</Typography>
            <TableContainer component={Paper} elevation={1} sx={{ mb: 2, borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ background: "#f5f5f5" }}>
                            <TableCell><b>Khu vực</b></TableCell>
                            <TableCell><b>Sản phẩm</b></TableCell>
                            <TableCell><b>Mã lô</b></TableCell>
                            <TableCell><b>Tồn kho</b></TableCell>
                            <TableCell><b>Hạn dùng</b></TableCell>
                            <TableCell><b>Đã kiểm</b></TableCell>
                            <TableCell align="center"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingLots ? (
                            <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        ) : lots.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center">Không có lô phù hợp</TableCell></TableRow>
                        ) : lots.map((lot, idx) => (
                            <TableRow key={lot.id} hover>
                                <TableCell>{lot.zoneName || lot.zoneId}</TableCell>
                                <TableCell>{lot.productName || lot.productId}</TableCell>
                                <TableCell>{lot.batchCode || lot.name}</TableCell>
                                <TableCell>{lot.remainQuantity}</TableCell>
                                <TableCell>{lot.expireDate ? new Date(lot.expireDate).toLocaleDateString("vi-VN") : ""}</TableCell>
                                <TableCell>{lot.isCheck ? "Đã kiểm" : "Chưa kiểm"}</TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Chọn lô này để kiểm kê">
                                        <span>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleSelectLot(lot)}
                                                disabled={selectedLots.some(l => l.id === lot.id)}
                                            >
                                                Chọn
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Các lô đã chọn để kiểm kê</Typography>
            <TableContainer component={Paper} elevation={1} sx={{ mb: 2, borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ background: "#f5f5f5" }}>
                            <TableCell><b>Khu vực</b></TableCell>
                            <TableCell><b>Sản phẩm</b></TableCell>
                            <TableCell><b>Mã lô</b></TableCell>
                            <TableCell><b>Tồn kho</b></TableCell>
                            <TableCell><b>Hạn dùng</b></TableCell>
                            <TableCell><b>Thực tế</b></TableCell>
                            <TableCell><b>Chênh lệch</b></TableCell>
                            <TableCell><b>Đã kiểm</b></TableCell>
                            <TableCell><b>Ghi chú</b></TableCell>
                            <TableCell align="center"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedLots.length === 0 ? (
                            <TableRow><TableCell colSpan={10} align="center">Chưa có lô nào được chọn</TableCell></TableRow>
                        ) : selectedLots.map((lot, idx) => (
                            <TableRow key={lot.id} hover>
                                <TableCell>{lot.zoneName || lot.zoneId}</TableCell>
                                <TableCell>{lot.productName || lot.productId}</TableCell>
                                <TableCell>{lot.batchCode || lot.name}</TableCell>
                                <TableCell>{lot.remainQuantity}</TableCell>
                                <TableCell>{lot.expireDate ? new Date(lot.expireDate).toLocaleDateString("vi-VN") : ""}</TableCell>
                                <TableCell>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={lot.real}
                                        onChange={e => handleLotChange(idx, 'real', e.target.value)}
                                        inputProps={{ min: 0 }}
                                        fullWidth
                                    />
                                </TableCell>
                                <TableCell sx={lot.diff !== 0 ? { background: '#ffeaea' } : {}}>{lot.diff}</TableCell>
                                <TableCell>
                                    <Checkbox
                                        checked={!!lot.isCheck}
                                        onChange={e => handleLotChange(idx, 'isCheck', e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        size="small"
                                        value={lot.note}
                                        onChange={e => handleLotChange(idx, 'note', e.target.value)}
                                        fullWidth
                                        multiline
                                        minRows={1}
                                        maxRows={4}
                                        inputProps={{ maxLength: 255 }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Xóa lô này khỏi phiếu kiểm kê">
                                        <span>
                                            <IconButton color="error" onClick={() => handleRemoveLot(lot.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => {
                    setSelectedLots([]);
                    localStorage.removeItem('stocktake_create_selected_lots');
                    navigate("/stocktake");
                }}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} sx={{ fontWeight: 600, borderRadius: 2 }}>Tạo phiếu kiểm kê</Button>
            </Box>
            <ConfirmDialog
                open={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                content={confirmDialog.content}
            />
            <SnackbarAlert
                open={snackbar.isOpen}
                onClose={() => setSnackbar(prev => ({ ...prev, isOpen: false }))}
                message={snackbar.message}
                severity={snackbar.severity}
            />
        </Box>
    );
};

export default CreateStocktakePage; 