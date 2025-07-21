import React, {useState, useEffect, useRef} from "react";
import {
    Button, TextField, FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, IconButton
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import {productService} from "../../services/productService";
import {getZones} from "../../services/zoneService";
import {getStocktakeById, updateStocktake, checkMissingZones} from "../../services/stocktakeService";
import {useNavigate, useParams} from "react-router-dom";
import axios from '../../services/axiosClient';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";

const UpdateStocktakePage = () => {
    const {id} = useParams();
    const LOCAL_STORAGE_KEY = `stocktake_update_draft_${id}`;
    const [rows, setRows] = useState([]);
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState("");
    const [zoneData, setZoneData] = useState({});
    const [note, setNote] = useState("");
    const [status, setStatus] = useState("DRAFT");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const prevZoneRef = useRef("");
    const [lotMap, setLotMap] = useState({}); // { productId: [importDetailId, ...] }
    const [confirmDialog, setConfirmDialog] = useState({isOpen: false, title: "", content: "", onConfirm: null});
    const [snackbar, setSnackbar] = useState({isOpen: false, message: "", severity: "success"});

    // Load zone và phiếu kiểm kê, ưu tiên bản nháp nếu có
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const zones = await getZones();
            setZones(zones);

            let res;
            try {
                res = await getStocktakeById(id);
            } catch {}
            setNote(res?.data?.stocktakeNote || "");
            setStatus(res?.data?.status || "DRAFT");

            // Ưu tiên lấy rawDetail từ localStorage nếu có
            let rawDetail = [];
            try {
                rawDetail = JSON.parse(localStorage.getItem(`stocktake_raw_${id}`) || '[]');
            } catch {}

            let zoneDataInit = {};
            if (rawDetail.length > 0) {
                rawDetail.forEach(d => {
                    if (d.zoneId) {
                        if (!zoneDataInit[d.zoneId]) zoneDataInit[d.zoneId] = [];
                        zoneDataInit[d.zoneId].push({
                            zoneId: d.zoneId,
                            productId: d.productId,
                            real: d.real,
                            note: d.note
                        });
                    }
                });
            } else if (res?.data?.rawDetail) {
                const details = JSON.parse(res.data.rawDetail);
                details.forEach(d => {
                    if (d.zoneId) {
                        if (!zoneDataInit[d.zoneId]) zoneDataInit[d.zoneId] = [];
                        zoneDataInit[d.zoneId].push({
                            zoneId: d.zoneId,
                            productId: d.productId,
                            real: d.real,
                            note: d.note
                        });
                    }
                });
            }
            setZoneData(zoneDataInit);
            setSelectedZone(""); // Không chọn zone mặc định
            setRows([]); // Bảng trống
            setLoading(false);
        }
        fetchData();
    }, [id]);

    // Lưu bản nháp mỗi khi zoneData, selectedZone, note, status thay đổi
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ zoneData, selectedZone, note, status }));
    }, [zoneData, selectedZone, note, status]);

    // Khi chọn lại zone, lưu lại dữ liệu zone cũ, load lại dữ liệu zone mới nếu đã nhập, nếu chưa thì lấy từ backend
    const handleZoneChange = async (zoneId) => {
        setSelectedZone(zoneId);
        prevZoneRef.current = zoneId;
        setRows([]);
        setLotMap({});
        if (!zoneId) return;

        // Lấy lại danh sách lô và tên sản phẩm từ backend
        let details = [];
        try {
            const res = await axios.get(`/import-details/details-by-zone?zoneId=${zoneId}`);
            details = res.data;
        } catch {
            details = [];
        }
        // Group lại: mỗi sản phẩm 1 dòng, lô là chuỗi
        const productMap = {};
        details.forEach(d => {
            if (d.zonesId && d.zonesId.includes(Number(zoneId))) {
                if (!productMap[d.productId]) {
                    productMap[d.productId] = {
                        zoneId,
                        productId: d.productId,
                        productName: d.productName,
                        lots: [],
                        real: '', // lấy từ zoneData nếu có
                        note: ''
                    };
                }
                productMap[d.productId].lots.push(d.importDetailId);
            }
        });
        let rowsWithNames = Object.values(productMap).map(row => ({
            ...row,
            lotString: row.lots.join(', ')
        }));
        // Nếu đã có dữ liệu kiểm kê cũ cho zone này thì giữ lại real/note
        if (zoneData[zoneId] && zoneData[zoneId].length > 0) {
            rowsWithNames = rowsWithNames.map(row => {
                const old = zoneData[zoneId].find(x => x.productId === row.productId);
                return old ? { ...row, real: old.real, note: old.note } : row;
            });
        }
        setRows(rowsWithNames);
    };

    // Khi nhập liệu, lưu lại dữ liệu cho zone hiện tại vào zoneData và localStorage
    const handleRowChange = (idx, field, value) => {
        setRows(prev => {
            const newRows = prev.map((row, i) => i === idx ? {...row, [field]: value} : row);
            setZoneData(zData => {
                const updated = {...zData, [selectedZone]: newRows};
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ zoneData: updated, selectedZone, note, status }));
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
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ zoneData: updated, selectedZone, note, status }));
                return updated;
            });
            return newRows;
        });
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
            setSnackbar({ isOpen: true, message: "Vui lòng nhập đầy đủ thông tin cho từng dòng!", severity: "warning" });
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

        // Gọi API kiểm tra thiếu zone
        try {
            const res = await checkMissingZones(detail);
            if (res.data && res.data.length > 0) {
                const msg = res.data.map(item =>
                    `Sản phẩm: ${item.productName}\nThiếu khu vực: ${item.missingZones.map(z => z.zoneName).join(', ')}`
                ).join('\n\n');
                setConfirmDialog({
                    isOpen: true,
                    title: "Cảnh báo thiếu khu vực kiểm kê",
                    content: `Cảnh báo thiếu khu vực kiểm kê:\n${msg}\n\nBạn vẫn muốn lưu phiếu?`,
                    onConfirm: async () => {
                        setConfirmDialog(prev => ({...prev, isOpen: false}));
                        await doUpdateStocktake(detail, allRows);
                    }
                });
                return;
            }
        } catch (e) {
            setSnackbar({ isOpen: true, message: "Lỗi kiểm tra thiếu khu vực!", severity: "error" });
            return;
        }

        await doUpdateStocktake(detail, allRows);
    };

    const doUpdateStocktake = async (detail, allRows) => {
        try {
            await updateStocktake(id, {
                detail: JSON.stringify(detail),
                stocktakeNote: note,
                storeId: 1,
                status: status,
                stocktakeDate: new Date().toISOString()
            });
            const rawDetail = allRows.map(row => ({
                productId: row.productId,
                zoneId: row.zoneId,
                real: Number(row.real || 0),
                note: row.note || ''
            }));
            localStorage.setItem(`stocktake_raw_${id}`, JSON.stringify(rawDetail));
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setSnackbar({ isOpen: true, message: "Cập nhật phiếu kiểm kê thành công!", severity: "success" });
            navigate("/stocktake");
        } catch {
            setSnackbar({ isOpen: true, message: "Cập nhật phiếu kiểm kê thất bại!", severity: "error" });
        }
    };

    const handleCancel = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        navigate("/stocktake");
    };

    if (loading) return (
        <Box sx={{textAlign: "center", mt: 8}}>
            <Typography variant="h6" color="text.secondary">Đang tải dữ liệu...</Typography>
        </Box>
    );

    return (
        <Box sx={{maxWidth: 900, margin: "40px auto", background: "#fff", p: 4, borderRadius: 3, boxShadow: 2}}>
            <Typography variant="h5" fontWeight={700} mb={2}>Cập nhật phiếu kiểm kê</Typography>
            <FormControl fullWidth size="small" sx={{mb: 2, maxWidth: 300}}>
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
                        {selectedZone && rows.length > 0 ? (
                            rows.map((row, idx) => (
                                <TableRow key={idx} hover>
                                    <TableCell sx={{minWidth: 160}}>
                                        {zones.find(z => String(z.id) === String(row.zoneId))?.zoneName || ""}
                                    </TableCell>
                                    <TableCell sx={{minWidth: 180}}>
                                        {row.productName}
                                    </TableCell>
                                    <TableCell sx={{minWidth: 100}}>
                                        {row.lotString}
                                    </TableCell>
                                    <TableCell sx={{minWidth: 100}}>
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
                                        <IconButton onClick={() => handleRemoveRow(idx)}><DeleteIcon/></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">Vui lòng chọn khu vực để xem chi tiết</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{mt: 3, display: "flex", justifyContent: "flex-end", gap: 2}}>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} sx={{fontWeight: 600, borderRadius: 2}}>Cập
                    nhật</Button>
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

export default UpdateStocktakePage; 