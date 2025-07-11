import React, {useState, useEffect} from "react";
import {
    Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, IconButton
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {productService} from "../../services/productService";
import {getZones} from "../../services/zoneService";
import {createStocktake} from "../../services/stocktakeService";
import {useNavigate} from "react-router-dom";
import ZoneCheckboxDialog from "../../components/zone/ZoneCheckboxDialog";

const LOCAL_STORAGE_KEY = 'stocktake_draft';

const CreateStocktakePage = () => {
    // Lấy bản nháp nếu có
    const [rows, setRows] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [{productId: "", zones: [], real: "", note: ""}];
    });
    const [products, setProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
    const [zoneRowIndex, setZoneRowIndex] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        productService.getAllProducts().then(data => {
            console.log("Products:", data);
            setProducts(data);
        });
        getZones().then(setZones);
    }, []);

    // Auto-save vào localStorage khi rows thay đổi
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rows));
    }, [rows]);

    const handleRowChange = (idx, field, value) => {
        setRows(prev => prev.map((row, i) => i === idx ? {...row, [field]: value} : row));
    };

    const handleAddRow = () => {
        setRows(prev => [...prev, {productId: "", zones: [], real: "", note: ""}]);
    };

    const handleRemoveRow = (idx) => {
        setRows(prev => prev.filter((_, i) => i !== idx));
    };

    const handleOpenZoneDialog = (idx) => {
        setZoneRowIndex(idx);
        setZoneDialogOpen(true);
    };

    const handleZoneDialogChange = (selected) => {
        if (zoneRowIndex !== null) {
            setRows(prev => prev.map((row, i) => i === zoneRowIndex ? {...row, zones: selected} : row));
        }
    };

    const handleSubmit = async () => {
        // Validate
        if (rows.some(row => !row.productId || row.zones.length === 0 || !row.real)) {
            alert("Vui lòng nhập đầy đủ thông tin cho từng dòng!");
            return;
        }
        // Gửi dữ liệu
        try {
            await createStocktake({
                detail: JSON.stringify(
                    rows.map(row => ({
                        productId: row.productId,
                        zones_id: row.zones,
                        real: row.real,
                        note: row.note
                    }))
                ),
                stocktakeNote: "Phiếu kiểm kê mới",
                storeId: 1,
                status: "DRAFT",
                stocktakeDate: new Date().toISOString()
            });
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Xóa bản nháp khi thành công
            alert("Tạo phiếu kiểm kê thành công!");
            navigate("/stocktake");
        } catch {
            alert("Tạo phiếu kiểm kê thất bại!");
        }
    };

    const handleCancel = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        navigate("/stocktake");
    };

    return (
        <Box sx={{maxWidth: 900, margin: "40px auto", background: "#fff", p: 4, borderRadius: 3, boxShadow: 2}}>
            <Typography variant="h5" fontWeight={700} mb={2}>Tạo phiếu kiểm kê mới</Typography>
            <TableContainer component={Paper} elevation={1} sx={{mb: 2, borderRadius: 2}}>
                <Table>
                    <TableHead>
                        <TableRow sx={{background: "#f5f5f5"}}>
                            <TableCell><b>Sản phẩm</b></TableCell>
                            <TableCell><b>Khu vực</b></TableCell>
                            <TableCell><b>Thực tế</b></TableCell>
                            <TableCell><b>Ghi chú</b></TableCell>
                            <TableCell align="center"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell sx={{minWidth: 180}}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Sản phẩm</InputLabel>
                                        <Select
                                            value={row.productId}
                                            label="Sản phẩm"
                                            onChange={e => handleRowChange(idx, "productId", e.target.value)}
                                        >
                                            {products.map(p => (
                                                <MenuItem key={p.id} value={p.id}>{p.productName}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell sx={{minWidth: 160}}>
                                    <Button variant="outlined" size="small" onClick={() => handleOpenZoneDialog(idx)}
                                            sx={{minWidth: 120}}>
                                        {row.zones.length > 0 ? (
                                            (() => {
                                                const z = zones.find(z => String(z.id) === String(row.zones[0]));
                                                return z ? <Chip label={z.zoneName} size="small"
                                                                 sx={{mr: 0.5, mb: 0.5}}/> : null;
                                            })()
                                        ) : "Chọn khu vực"}
                                    </Button>
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
                                <TableCell sx={{minWidth: 140}}>
                                    <TextField
                                        size="small"
                                        value={row.note}
                                        onChange={e => handleRowChange(idx, "note", e.target.value)}
                                        fullWidth
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
            <Button onClick={handleAddRow} variant="outlined" startIcon={<AddIcon/>}
                    sx={{mb: 2, borderRadius: 2, fontWeight: 600}}>
                Thêm dòng
            </Button>
            <Box sx={{mt: 3, display: "flex", justifyContent: "flex-end", gap: 2}}>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} sx={{fontWeight: 600, borderRadius: 2}}>Xác
                    nhận</Button>
            </Box>
            <ZoneCheckboxDialog
                open={zoneDialogOpen}
                onClose={() => setZoneDialogOpen(false)}
                zones={zones}
                selectedZones={zoneRowIndex !== null ? rows[zoneRowIndex]?.zones : []}
                onChange={handleZoneDialogChange}
            />
        </Box>
    );
};

export default CreateStocktakePage; 