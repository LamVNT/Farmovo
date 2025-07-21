import React, {useEffect, useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import axios from "../../services/axiosClient";
import {productService} from "../../services/productService";
import {getZones} from "../../services/zoneService";
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";

const StockTakeDetailLinePage = () => {
    const {id} = useParams();
    const [detail, setDetail] = useState(null);
    const [products, setProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [lotMap, setLotMap] = useState({}); // { productId: [importDetailId, ...] }
    const [selectedZone, setSelectedZone] = useState("");
    const [rows, setRows] = useState([]);
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

    // Khi user chọn zone, lấy dữ liệu từng dòng cho zone đó
    const handleZoneChange = async (zoneId) => {
        setSelectedZone(zoneId);
        setRows([]);
        setLotMap({});
        if (!zoneId || !detail) return;
        let details = [];
        try {
            // Ưu tiên lấy từ localStorage nếu có
            const rawLocal = localStorage.getItem(`stocktake_raw_${id}`);
            if (rawLocal) {
                details = JSON.parse(rawLocal);
            } else if (detail.rawDetail) {
                details = JSON.parse(detail.rawDetail);
            } else if (detail.detail) {
                const raw = JSON.parse(detail.detail);
                details = raw.flatMap(d =>
                    (d.zones_id && d.zones_id.length > 0)
                        ? d.zones_id.map((zid, idx) => ({
                            ...d,
                            zoneId: zid,
                            real: Array.isArray(d.real) ? d.real[idx] : d.real,
                            zones_id: undefined
                        }))
                        : [{...d, zoneId: d.zoneId || null}]
                );
            }
        } catch {}
        // Lọc các dòng thuộc zone đang chọn
        const zoneRows = details.filter(d => String(d.zoneId) === String(zoneId));
        // Lấy danh sách lô từ backend
        let detailsByZone = [];
        try {
            const res = await axios.get(`/import-details/details-by-zone?zoneId=${zoneId}`);
            detailsByZone = res.data;
        } catch {
            detailsByZone = [];
        }
        // Group lại: mỗi sản phẩm 1 dòng, lô là chuỗi
        const productMap = {};
        detailsByZone.forEach(d => {
            if (!productMap[d.productId]) {
                productMap[d.productId] = {
                    zoneId,
                    productId: d.productId,
                    productName: d.productName,
                    lots: [],
                    real: '',
                    note: ''
                };
            }
            productMap[d.productId].lots.push(d.importDetailId);
        });
        let rowsWithNames = Object.values(productMap).map(row => ({
            ...row,
            lotString: row.lots.join(', ')
        }));
        // Nếu đã có dữ liệu kiểm kê cho zone này thì giữ lại real/note giống Update
        rowsWithNames = rowsWithNames.map(row => {
            const old = zoneRows.find(x => x.productId === row.productId && String(x.zoneId) === String(row.zoneId));
            return old ? { ...row, real: old.real, note: old.note } : row;
        });
        setRows(rowsWithNames);
    };

    if (!detail) return (
        <Box sx={{textAlign: "center", mt: 8}}>
            <Typography variant="h6" color="text.secondary">Đang tải chi tiết...</Typography>
        </Box>
    );

    return (
        <Box sx={{maxWidth: 900, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2}}>
            <Typography variant="h5" fontWeight={700} mb={1}>
                Xem chi tiết dòng kiểm kê #{detail.id}
            </Typography>
            <Box mb={2}>
                <Typography>
                    <b>Ngày kiểm kê:</b> {new Date(detail.stocktakeDate).toLocaleDateString("vi-VN")}
                </Typography>
                <Typography>
                    <b>Ghi chú:</b> {detail.stocktakeNote}
                </Typography>
                <Typography component="span">
                    <b>Trạng thái:</b> {detail.status}
                </Typography>
            </Box>
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
            <Button
                variant="outlined"
                sx={{mb: 3, borderRadius: 2, fontWeight: 600}}
                onClick={() => navigate("/stocktake")}
            >
                Quay lại danh sách
            </Button>
            <TableContainer component={Paper} elevation={2} sx={{borderRadius: 2}}>
                <Table>
                    <TableHead>
                        <TableRow sx={{background: "#f5f5f5"}}>
                            <TableCell><b>Khu vực</b></TableCell>
                            <TableCell><b>Sản phẩm</b></TableCell>
                            <TableCell><b>Lô</b></TableCell>
                            <TableCell><b>Thực tế</b></TableCell>
                            <TableCell><b>Ghi chú</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedZone && rows.length > 0 ? (
                            rows.map((row, idx) => (
                                <TableRow key={idx} hover>
                                    <TableCell>
                                        {zones.find(z => z.id === row.zoneId)?.zoneName || row.zoneId || ""}
                                    </TableCell>
                                    <TableCell>
                                        {products.find(p => p.id === row.productId)?.productName || row.productName || row.productId}
                                    </TableCell>
                                    <TableCell>
                                        {row.lotString}
                                    </TableCell>
                                    <TableCell>{row.real}</TableCell>
                                    <TableCell>{row.note}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">Vui lòng chọn khu vực để xem chi tiết</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default StockTakeDetailLinePage; 