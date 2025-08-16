import React, {useEffect, useMemo, useState} from "react";
import {getExpiringLotsAdvanced} from "../../services/reportService";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Button,
    TextField,
    Stack,
    Chip,
    TablePagination,
    InputAdornment
} from "@mui/material";
import ArrowBack from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';

const toCSV = (rows) => {
    const header = ["lotId","productName","zoneName","remainQuantity","expireDate","daysLeft"]; 
    const body = rows.map(r => [r.id || "", r.productName || "", r.zoneName || "", r.remainQuantity ?? "", r.expireDate || "", r.daysLeft ?? ""]).map(a => a.join(","));
    return [header.join(","), ...body].join("\n");
};

const ExpiringLotsReport = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = () => {
        setLoading(true);
        getExpiringLotsAdvanced({ days, includeZeroRemain: false })
            .then(res => setData(res.data || res))
            .catch(() => alert("Lỗi khi lấy báo cáo lô sắp hết hạn!"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredSorted = useMemo(() => {
        let rows = Array.isArray(data) ? [...data] : [];
        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter(r => (r.productName || "").toLowerCase().includes(q) || (r.zoneName || "").toLowerCase().includes(q));
        }
        rows.sort((a,b) => {
            const da = a.expireDate ? new Date(a.expireDate).getTime() : Infinity;
            const db = b.expireDate ? new Date(b.expireDate).getTime() : Infinity;
            return da - db;
        });
        return rows;
    }, [data, search]);

    const pagedRows = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredSorted.slice(start, start + rowsPerPage);
    }, [filteredSorted, page, rowsPerPage]);

    const overdue = filteredSorted.filter(r => (r.daysLeft ?? 0) < 0).length;
    const soon3 = filteredSorted.filter(r => (r.daysLeft ?? 0) >= 0 && (r.daysLeft ?? 0) <= 3).length;

    const handleExport = () => {
        try {
            const csv = toCSV(filteredSorted);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expiring_lots_${days}d.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (_) {
            alert('Xuất CSV thất bại');
        }
    };

    const renderDaysChip = (d) => {
        if (d == null) return <Chip label="--" size="small" />;
        if (d < 0) return <Chip label={`${d}`} color="error" size="small" />;
        if (d === 0) return <Chip label="0" color="warning" size="small" />;
        if (d <= 3) return <Chip label={`${d}`} color="warning" size="small" />;
        if (d <= 7) return <Chip label={`${d}`} color="info" size="small" />;
        return <Chip label={`${d}`} size="small" />;
    };

    return (
        <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 5 }}>
            <Box sx={{maxWidth: 1300, mx: 'auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 3}}>
                <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
                <Typography variant="h5" fontWeight={700} mb={1}>Báo cáo lô hàng sắp hết hạn</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>Sắp xếp theo ngày hết hạn gần nhất để ưu tiên xả hàng và áp dụng khuyến mãi.</Typography>

                {/* Controls */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={2}>
                    <TextField
                        type="number"
                        label="Số ngày tới"
                        InputLabelProps={{ shrink: true }}
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                        sx={{ width: 160 }}
                        size="small"
                    />
                    <Stack direction="row" spacing={1}>
                        {[3,7,14,30].map(v => (
                            <Button key={v} size="small" variant={days === v ? 'contained' : 'outlined'} onClick={() => setDays(v)}>{v} ngày</Button>
                        ))}
                    </Stack>
                    <TextField
                        placeholder="Tìm theo sản phẩm/khu vực"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        size="small"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                        sx={{ minWidth: 260 }}
                    />
                    <Button variant="contained" onClick={fetchData}>Làm mới</Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Xuất CSV</Button>
                </Stack>

                {/* Summary */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Tổng số lô</Typography>
                        <Typography variant="h6" fontWeight={700}>{filteredSorted.length}</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Quá hạn</Typography>
                        <Typography variant="h6" fontWeight={700} color="error.main">{overdue}</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">≤ 3 ngày</Typography>
                        <Typography variant="h6" fontWeight={700} color="warning.main">{soon3}</Typography>
                    </Paper>
                </Stack>

                {loading ? (
                    <Box sx={{textAlign: "center", mt: 6}}>
                        <CircularProgress/>
                        <Typography mt={2}>Đang tải dữ liệu...</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer component={Paper} elevation={2} sx={{mt: 2, borderRadius: 2, maxHeight: 560}}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{background: "#f5f5f5"}}>
                                        <TableCell><b>Mã lô</b></TableCell>
                                        <TableCell><b>Tên sản phẩm</b></TableCell>
                                        <TableCell><b>Khu vực</b></TableCell>
                                        <TableCell align="right"><b>Số lượng còn lại</b></TableCell>
                                        <TableCell><b>Ngày hết hạn</b></TableCell>
                                        <TableCell align="center"><b>Còn lại (ngày)</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagedRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Không có dữ liệu</TableCell>
                                        </TableRow>
                                    ) : (
                                        pagedRows.map((row, idx) => (
                                            <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                                                <TableCell>{row.lotId || row.id}</TableCell>
                                                <TableCell>{row.productName || row.name}</TableCell>
                                                <TableCell>{row.zoneName || row.zone}</TableCell>
                                                <TableCell align="right">{row.remainQuantity || row.remain}</TableCell>
                                                <TableCell>{row.expireDate ? new Date(row.expireDate).toLocaleDateString('vi-VN') : ''}</TableCell>
                                                <TableCell align="center">{renderDaysChip(row.daysLeft)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={filteredSorted.length}
                            page={page}
                            onPageChange={(e, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            rowsPerPageOptions={[10, 25, 50]}
                        />
                    </>
                )}
            </Box>
        </Box>
    );
};

export default ExpiringLotsReport; 