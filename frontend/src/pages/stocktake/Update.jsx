import React, {useEffect, useState} from "react";
import {
    Box,
    Button,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {productService} from "../../services/productService";
import {getZones} from "../../services/zoneService";
import {getStocktakeById, updateStocktake} from "../../services/stocktakeService";
import {useNavigate, useParams} from "react-router-dom";
import ZoneCheckboxDialog from "../../components/zone/ZoneCheckboxDialog";

const UpdateStocktakePage = () => {
    const {id} = useParams();
    const [rows, setRows] = useState([]);
    const [products, setProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
    const [zoneRowIndex, setZoneRowIndex] = useState(null);
    const [note, setNote] = useState("");
    const [status, setStatus] = useState("DRAFT");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        productService.getAllProducts().then(data => {
            console.log("Products:", data);
            setProducts(data);
        });
        getZones().then(setZones);
        getStocktakeById(id).then(res => {
            // Ưu tiên dùng rawDetail nếu có
            let details = [];
            try {
                details = res.data.rawDetail
                    ? JSON.parse(res.data.rawDetail)
                    : JSON.parse(res.data.detail);
            } catch {
            }
            setRows(details.map(d => ({
                productId: d.productId,
                zones: d.zones_id || [],
                real: d.real,
                note: d.note || ""
            })));
            setNote(res.data.stocktakeNote || "");
            setStatus(res.data.status || "DRAFT");
            setLoading(false);
        });
    }, [id]);

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
        if (rows.some(row => !row.productId || row.zones.length === 0 || !row.real)) {
            alert("Vui lòng nhập đầy đủ thông tin cho từng dòng!");
            return;
        }
        try {
            await updateStocktake(id, {
                detail: JSON.stringify(
                    rows.map(row => ({
                        productId: row.productId,
                        zones_id: row.zones,
                        real: row.real,
                        note: row.note
                    }))
                ),
                stocktakeNote: note,
                storeId: 1,
                status: status,
                stocktakeDate: new Date().toISOString()
            });
            alert("Cập nhật phiếu kiểm kê thành công!");
            navigate("/stocktake");
        } catch {
            alert("Cập nhật phiếu kiểm kê thất bại!");
        }
    };

    const handleCancel = () => {
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
                <Button variant="contained" onClick={handleSubmit} sx={{fontWeight: 600, borderRadius: 2}}>Cập
                    nhật</Button>
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

export default UpdateStocktakePage; 