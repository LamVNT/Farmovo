import React, {useEffect, useState, useMemo} from "react";
import {getStocktakeDiff} from "../../services/reportService";
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
    TablePagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment
} from "@mui/material";
import ArrowBack from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const toCSV = (rows) => {
    const header = ["productId", "productName", "real", "remain", "diff", "note"]; 
    const body = rows.map(r => [r.productId || r.id || "", r.productName || r.name || "", r.real ?? "", r.remain ?? "", r.diff ?? "", r.note ?? ""]).map(a => a.join(","));
    return [header.join(","), ...body].join("\n");
};

const StocktakeDiffReport = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    const [stocktakeId, setStocktakeId] = useState("");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("absdesc"); // absdesc | diffasc | diffdesc

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = () => {
        setLoading(true);
        const params = stocktakeId ? { stocktakeId } : undefined;
        getStocktakeDiff(params)
            .then(res => setRows(res.data || res))
            .catch(() => alert("Lỗi khi lấy báo cáo sai lệch!"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredSortedRows = useMemo(() => {
        let data = Array.isArray(rows) ? [...rows] : [];
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(r => (r.productName || r.name || "").toLowerCase().includes(q));
        }
        if (sortBy === "absdesc") {
            data.sort((a,b) => Math.abs(b.diff || 0) - Math.abs(a.diff || 0));
        } else if (sortBy === "diffasc") {
            data.sort((a,b) => (a.diff || 0) - (b.diff || 0));
        } else if (sortBy === "diffdesc") {
            data.sort((a,b) => (b.diff || 0) - (a.diff || 0));
        }
        return data;
    }, [rows, search, sortBy]);

    const summary = useMemo(() => {
        const total = filteredSortedRows.length;
        let positive = 0, negative = 0, sumDiff = 0;
        for (const r of filteredSortedRows) {
            const d = Number(r.diff || 0);
            if (d > 0) positive++; else if (d < 0) negative++;
            sumDiff += d;
        }
        return { total, positive, negative, sumDiff };
    }, [filteredSortedRows]);

    const handleExport = () => {
        try {
            const csv = toCSV(filteredSortedRows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `stocktake_diff_${stocktakeId || 'latest'}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (_) {
            alert('Xuất CSV thất bại');
        }
    };

    const pagedRows = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredSortedRows.slice(start, start + rowsPerPage);
    }, [filteredSortedRows, page, rowsPerPage]);

    return (
        <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 5 }}>
            <Box sx={{ maxWidth: 1300, mx: 'auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
                <Typography variant="h5" fontWeight={700} mb={1}><FaExclamationTriangle style={{ marginRight: 8 }} /> Báo cáo sai lệch kiểm kê</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>Các sản phẩm có chênh lệch giữa tồn kho hệ thống và thực tế.</Typography>

                {/* Filters */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                    <TextField
                        label="ID kiểm kê (trống = mới nhất)"
                        value={stocktakeId}
                        onChange={e => setStocktakeId(e.target.value)}
                        size="small"
                    />
                    <TextField
                        label="Tìm sản phẩm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        size="small"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Sắp xếp</InputLabel>
                        <Select value={sortBy} label="Sắp xếp" onChange={e => setSortBy(e.target.value)}>
                            <MenuItem value="absdesc">|diff| giảm dần</MenuItem>
                            <MenuItem value="diffdesc">diff giảm dần</MenuItem>
                            <MenuItem value="diffasc">diff tăng dần</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={fetchData}>Lọc</Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Xuất CSV</Button>
                </Box>

                {/* Summary */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Tổng dòng</Typography>
                        <Typography variant="h6" fontWeight={700}>{summary.total}</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Chênh lệch dương</Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">{summary.positive}</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Chênh lệch âm</Typography>
                        <Typography variant="h6" fontWeight={700} color="error.main">{summary.negative}</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Tổng chênh lệch</Typography>
                        <Typography variant="h6" fontWeight={700}>{summary.sumDiff}</Typography>
                    </Paper>
                </Box>

                {loading ? (
                    <Box sx={{ textAlign: "center", mt: 6 }}>
                        <CircularProgress />
                        <Typography mt={2}>Đang tải dữ liệu...</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 560 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ background: "#f5f5f5" }}>
                                        <TableCell><b>#</b></TableCell>
                                        <TableCell><b>Mã SP</b></TableCell>
                                        <TableCell><b>Tên sản phẩm</b></TableCell>
                                        <TableCell><b>Thực tế</b></TableCell>
                                        <TableCell><b>Tồn kho hệ thống</b></TableCell>
                                        <TableCell><b>Chênh lệch</b></TableCell>
                                        <TableCell><b>Ghi chú</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagedRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>Không có dữ liệu</TableCell>
                                        </TableRow>
                                    ) : (
                                        pagedRows.map((row, idx) => (
                                            <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                                                <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                                <TableCell>{row.productId || row.id}</TableCell>
                                                <TableCell>{row.productName || row.name}</TableCell>
                                                <TableCell>{row.real}</TableCell>
                                                <TableCell>{row.remain}</TableCell>
                                                <TableCell sx={{ color: (row.diff || 0) < 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>{row.diff}</TableCell>
                                                <TableCell>{row.note}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={filteredSortedRows.length}
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

export default StocktakeDiffReport;
