import React, {useState, useEffect, useRef} from "react";
import {
    Button, TextField, FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, IconButton
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import {productService} from "../../services/productService";
import {getZones} from "../../services/zoneService";
import {createStocktake, checkMissingZones} from "../../services/stocktakeService";
import {useNavigate} from "react-router-dom";
import axios from '../../services/axiosClient';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";

const LOCAL_STORAGE_KEY = 'stocktake_draft';

const CreateStocktakePage = () => {
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState("");
    const [rows, setRows] = useState([]); // Dữ liệu dòng cho zone hiện tại
    const [zoneData, setZoneData] = useState({}); // { zoneId: [rows] }
    const [lotMap, setLotMap] = useState({}); // { productId: [importDetailId, ...] }
    const [missingZoneWarning, setMissingZoneWarning] = useState([]); // [{productName, missingZones: [zoneName,...]}]
    const navigate = useNavigate();
    const prevZoneRef = useRef("");
    const [confirmDialog, setConfirmDialog] = useState({isOpen: false, title: "", content: "", onConfirm: null});
    const [snackbar, setSnackbar] = useState({isOpen: false, message: "", severity: "success"});

    // Khi load trang, lấy bản nháp nếu có
    useEffect(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            try {
                const { zoneData: savedZoneData, selectedZone: savedSelectedZone } = JSON.parse(saved);
                setZoneData(savedZoneData || {});
                setSelectedZone(savedSelectedZone || "");
                if (savedSelectedZone && savedZoneData && savedZoneData[savedSelectedZone]) {
                    setRows(savedZoneData[savedSelectedZone]);
                }
                prevZoneRef.current = savedSelectedZone || "";
            } catch {}
        }
        getZones().then(setZones);
    }, []);

    // Lưu bản nháp mỗi khi zoneData hoặc selectedZone thay đổi
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ zoneData, selectedZone }));
    }, [zoneData, selectedZone]);

    // Khi nhập liệu, lưu lại dữ liệu cho zone hiện tại vào zoneData và localStorage
    const handleRowChange = (idx, field, value) => {
        setRows(prev => {
            const newRows = prev.map((row, i) => i === idx ? {...row, [field]: value} : row);
            setZoneData(zData => {
                const updated = {...zData, [selectedZone]: newRows};
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ zoneData: updated, selectedZone }));
                return updated;
            });
            return newRows;
        });
    };

    const handleRemoveRow = (idx) => {
        setRows(prev => {
            const newRows = prev.filter((_, i) => i !== idx);
            setZoneData(zData => {
                const updated = {...zData, [selectedZone]: newRows};
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ zoneData: updated, selectedZone }));
                return updated;
            });
            return newRows;
        });
    };

    // Khi chọn zone, ưu tiên lấy dữ liệu nhập trước đó nếu có
    const handleZoneChange = async (zoneId) => {
        setSelectedZone(zoneId);
        prevZoneRef.current = zoneId;
        setRows([]);
        setLotMap({});
        if (!zoneId) return;
        if (zoneData[zoneId] && zoneData[zoneId].length > 0) {
            setRows(zoneData[zoneId]);
            // Lấy lại lotMap từ backend để đảm bảo cột Lô đúng
            let details = [];
            try {
                const res = await axios.get(`/import-details/details-by-zone?zoneId=${zoneId}`);
                details = res.data;
            } catch {
                details = [];
            }
            const productLots = {};
            details.forEach(d => {
                if (!productLots[d.productId]) productLots[d.productId] = [];
                productLots[d.productId].push(d.importDetailId);
            });
            setLotMap(productLots);
            return;
        }
        // Nếu chưa nhập thì gọi API như cũ
        let details = [];
        try {
            const res = await axios.get(`/import-details/details-by-zone?zoneId=${zoneId}`);
            details = res.data;
        } catch {
            details = [];
        }
        const productLots = {};
        details.forEach(d => {
            if (!productLots[d.productId]) productLots[d.productId] = [];
            productLots[d.productId].push(d.importDetailId);
        });
        setLotMap(productLots);
        const products = Object.keys(productLots).map(pid => {
            const d = details.find(x => x.productId === Number(pid));
            return {
                zoneId,
                productId: d.productId,
                productName: d.productName,
                real: '',
                note: ''
            };
        });
        setRows(products);
    };

    const handleSubmit = async () => {
        // Lưu lại dữ liệu zone hiện tại
        const allZoneData = {
            ...zoneData,
            [selectedZone]: rows
        };
        // Gộp tất cả dòng lại
        const allRows = Object.values(allZoneData).flat();
        if (allRows.length === 0 || allRows.some(row => !row.zoneId || !row.productId || !row.real)) {
            alert("Vui lòng nhập đầy đủ thông tin cho từng dòng!");
            return;
        }
        // Group lại theo productId, gộp đủ các zone đã kiểm kê cho từng sản phẩm
        const grouped = {};
        allRows.forEach(row => {
            if (!grouped[row.productId]) {
                grouped[row.productId] = {
                    productId: row.productId,
                    zones_id: [],
                    real: 0,
                    note: ''
                };
            }
            grouped[row.productId].zones_id.push(Number(row.zoneId));
            grouped[row.productId].real += Number(row.real || 0);
            grouped[row.productId].note += (row.note ? row.note + '; ' : '');
        });
        // Loại bỏ trùng lặp zone
        const detail = Object.values(grouped).map(item => ({
            ...item,
            zones_id: Array.from(new Set(item.zones_id))
        }));

        // Lưu rawDetail vào localStorage để dùng lại khi update
        const rawDetail = allRows.map(row => ({
            productId: row.productId,
            zoneId: row.zoneId,
            real: Number(row.real || 0),
            note: row.note || ''
        }));
        localStorage.setItem('stocktake_raw_last', JSON.stringify(rawDetail));

        // Gọi API kiểm tra thiếu zone
        try {
            const res = await checkMissingZones(detail);
            if (res.data && res.data.length > 0) {
                const msg = res.data.map(item =>
                    `Sản phẩm: ${item.productName} vẫn còn tồn kho ở khu vực: ${item.missingZones.map(z => z.zoneName).join(', ')}`
                ).join('\n\n');
                setConfirmDialog({
                    isOpen: true,
                    title: "Cảnh báo thiếu khu vực kiểm kê",
                    content: `${msg}\n\nBạn có muốn lưu phiếu kiểm kê không?`,
                    onConfirm: async () => {
                        setConfirmDialog(prev => ({...prev, isOpen: false}));
                        await doCreateStocktake(detail, rawDetail);
                    }
                });
                return;
            }
        } catch (e) {
            setSnackbar({isOpen: true, message: "Lỗi kiểm tra thiếu khu vực!", severity: "error"});
            return;
        }

        await doCreateStocktake(detail, rawDetail);
    };

    const doCreateStocktake = async (detail, rawDetail) => {
        try {
            const response = await createStocktake({
                detail: JSON.stringify(detail),
                stocktakeNote: "Phiếu kiểm kê mới",
                storeId: 1,
                status: "DRAFT",
                stocktakeDate: new Date().toISOString()
            });
            if (response && response.data && response.data.id) {
                localStorage.setItem(`stocktake_raw_${response.data.id}`, JSON.stringify(rawDetail));
            }
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setSnackbar({isOpen: true, message: "Tạo phiếu kiểm kê thành công!", severity: "success"});
            navigate("/stocktake");
        } catch {
            setSnackbar({isOpen: true, message: "Tạo phiếu kiểm kê thất bại!", severity: "error"});
        }
    };

    const handleCancel = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        navigate("/stocktake");
    };

    return (
        <Box sx={{maxWidth: 1200, margin: "40px auto", background: "#fff", p: 4, borderRadius: 3, boxShadow: 2}}>
            <Typography variant="h5" fontWeight={700} mb={2}>Tạo phiếu kiểm kê mới</Typography>
            <FormControl fullWidth size="small" sx={{mb: 2, maxWidth: 350}}>
                <InputLabel>Khu vực</InputLabel>
                <Select
                    value={selectedZone}
                    label="Khu vực"
                    onChange={e => handleZoneChange(e.target.value)}
                >
                    <MenuItem value="">Chọn khu vực</MenuItem>
                    {zones.map(z => (
                        <MenuItem key={z.id} value={z.id}>{z.zoneName}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TableContainer component={Paper} elevation={1} sx={{mb: 2, borderRadius: 2}}>
                <Table>
                    <TableHead>
                        <TableRow sx={{background: "#f5f5f5"}}>
                            <TableCell><b>Khu vực</b></TableCell>
                            <TableCell><b>Sản phẩm</b></TableCell>
                            <TableCell><b>Lô</b></TableCell>
                            <TableCell><b>Thực tế</b></TableCell>
                            <TableCell><b>Ghi chú</b></TableCell>
                            <TableCell align="center"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell sx={{minWidth: 160}}>
                                    {zones.find(z => String(z.id) === String(row.zoneId))?.zoneName || ""}
                                </TableCell>
                                <TableCell sx={{minWidth: 180}}>
                                    {row.productName}
                                </TableCell>
                                <TableCell sx={{minWidth: 100}}>
                                    {(lotMap[row.productId] || []).join(', ')}
                                </TableCell>
                                <TableCell sx={{minWidth: 80, maxWidth: 100}}>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={row.real}
                                        onChange={e => handleRowChange(idx, "real", e.target.value)}
                                        inputProps={{min: 0}}
                                        fullWidth
                                    />
                                </TableCell>
                                <TableCell sx={{minWidth: 220, maxWidth: 350}}>
                                    <TextField
                                        size="small"
                                        value={row.note}
                                        onChange={e => handleRowChange(idx, "note", e.target.value)}
                                        fullWidth
                                        multiline
                                        minRows={1}
                                        maxRows={4}
                                        inputProps={{maxLength: 255}}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton color="error" onClick={() => handleRemoveRow(idx)}
                                                disabled={rows.length === 1}>
                                        <DeleteIcon/>
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{mt: 3, display: "flex", justifyContent: "flex-end", gap: 2}}>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} sx={{fontWeight: 600, borderRadius: 2}}>Xác
                    nhận</Button>
            </Box>
            <ConfirmDialog
                open={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                content={confirmDialog.content}
            />
            <SnackbarAlert
                open={snackbar.isOpen}
                onClose={() => setSnackbar(prev => ({...prev, isOpen: false}))}
                message={snackbar.message}
                severity={snackbar.severity}
            />
        </Box>
    );
};

export default CreateStocktakePage; 