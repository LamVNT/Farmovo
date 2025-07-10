import React, {useState, useEffect} from "react";
import { createStocktake, getStocktakeList, deleteStocktake } from "../../services/stocktakeService";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, CircularProgress, Box, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { productService } from "../../services/productService";
import { getZones } from "../../services/zoneService";
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

const StockTakePage = () => {
    const [stocktakes, setStocktakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        getStocktakeList()
            .then(res => {
                setStocktakes(res.data);
            })
            .catch(err => {
                alert("Lỗi khi lấy danh sách phiếu kiểm kê!");
            })
            .finally(() => setLoading(false));
        productService.getAllProducts().then(setProducts);
        getZones().then(setZones);
    }, []);

    const handleCreate = (rows) => {
        createStocktake({
            detail: JSON.stringify(rows),
            stocktakeNote: "Phiếu kiểm kê mới",
            storeId: 1, // hoặc lấy từ context
            status: "DRAFT",
            stocktakeDate: new Date().toISOString()
        }).then(() => {
            alert("Tạo phiếu kiểm kê thành công!");
            setLoading(true);
            getStocktakeList()
                .then(res => setStocktakes(res.data))
                .catch(() => alert("Lỗi khi reload danh sách!"))
                .finally(() => setLoading(false));
        }).catch(() => alert("Tạo phiếu kiểm kê thất bại!"));
    };

    const handleDelete = (id) => {
        if(window.confirm("Bạn có chắc chắn muốn xóa phiếu kiểm kê này?")) {
            setLoading(true);
            deleteStocktake(id)
                .then(() => {
                    setStocktakes(prev => prev.filter(st => st.id !== id));
                    alert("Đã xóa phiếu kiểm kê thành công!");
                })
                .catch(() => alert("Xóa phiếu kiểm kê thất bại!"))
                .finally(() => setLoading(false));
        }
    };

    const handleExportExcel = () => {
        if (stocktakes.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }
        let exportRows = [];
        stocktakes.forEach(st => {
            let details = [];
            try {
                details = JSON.parse(st.detail);
            } catch {}
            if (!details || !Array.isArray(details) || details.length === 0) {
                // Nếu không có detail, vẫn xuất dòng tổng quát
                exportRows.push({
                    ID: st.id,
                    "Ngày kiểm kê": new Date(st.stocktakeDate).toLocaleString("vi-VN", { hour12: false }),
                    "Ghi chú phiếu": st.stocktakeNote,
                    "Trạng thái": st.status,
                    "Sản phẩm": "",
                    "Khu vực đã kiểm": "",
                    "Thực tế": "",
                    "Tồn kho hệ thống": "",
                    "Chênh lệch": "",
                    "Ghi chú chi tiết": ""
                });
            } else {
                details.forEach(d => {
                    exportRows.push({
                        ID: st.id,
                        "Ngày kiểm kê": new Date(st.stocktakeDate).toLocaleString("vi-VN", { hour12: false }),
                        "Ghi chú phiếu": st.stocktakeNote,
                        "Trạng thái": st.status,
                        "Sản phẩm": products.find(p => p.id === d.productId)?.productName || d.productId,
                        "Khu vực đã kiểm": d.zones_id ? d.zones_id.map(zid => zones.find(z => z.id === zid)?.zoneName || zid).join(", ") : "",
                        "Thực tế": d.real,
                        "Tồn kho hệ thống": d.remain,
                        "Chênh lệch": d.diff,
                        "Ghi chú chi tiết": d.note
                    });
                });
            }
        });
        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "StockTake");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'stocktake-details.xlsx');
    };

    // Lọc và tìm kiếm
    const filteredStocktakes = stocktakes.filter(st => {
        const matchesSearch =
            (!search ||
                st.id.toString().includes(search) ||
                (st.stocktakeNote && st.stocktakeNote.toLowerCase().includes(search.toLowerCase()))
            );
        const matchesStatus = !statusFilter || st.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const paginatedStocktakes = filteredStocktakes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ maxWidth: 1100, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h4" fontWeight={700} mb={1}>StockTake (Kiểm kê kho)</Typography>
            <Typography variant="subtitle1" mb={3} color="text.secondary">Quản lý và theo dõi các phiếu kiểm kê kho trứng.</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 2, fontWeight: 600, mr: 1 }}
                    onClick={() => navigate('/stocktake/create')}
                >
                    Tạo phiếu kiểm kê mới
                </Button>
                <Button
                    variant="outlined"
                    sx={{ borderRadius: 2, fontWeight: 600, mr: 1 }}
                    onClick={handleExportExcel}
                >
                    Export Excel
                </Button>
                <TextField
                    size="small"
                    label="Tìm kiếm mã/Ghi chú"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                    sx={{ minWidth: 200 }}
                />
                <TextField
                    size="small"
                    select
                    label="Trạng thái"
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="DRAFT">DRAFT</MenuItem>
                    <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                </TextField>
            </Box>
            {loading ? (
                <Box sx={{ textAlign: "center", mt: 6 }}>
                    <CircularProgress />
                    <Typography mt={2}>Đang tải dữ liệu...</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ mt: 2, borderRadius: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: "#f5f5f5" }}>
                                <TableCell><b>ID</b></TableCell>
                                <TableCell><b>Ngày kiểm kê</b></TableCell>
                                <TableCell><b>Ghi chú</b></TableCell>
                                <TableCell><b>Trạng thái</b></TableCell>
                                <TableCell align="center"><b>Thao tác</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedStocktakes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Không có phiếu kiểm kê nào</TableCell>
                                </TableRow>
                            ) : (
                                paginatedStocktakes.map(st => (
                                    <TableRow
                                        key={st.id}
                                        hover
                                        sx={{ transition: "background 0.2s" }}
                                    >
                                        <TableCell>{st.id}</TableCell>
                                        <TableCell>{new Date(st.stocktakeDate).toLocaleString("vi-VN", { hour12: false })}</TableCell>
                                        <TableCell>{st.stocktakeNote}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={st.status}
                                                color={st.status === "DRAFT" ? "warning" : "success"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                color="primary"
                                                onClick={() => navigate(`/stocktake/${st.id}`)}
                                                title="Xem chi tiết"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton
                                                color="secondary"
                                                onClick={() => navigate(`/stocktake/edit/${st.id}`)}
                                                title="Chỉnh sửa phiếu kiểm kê"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(st.id)}
                                                title="Xóa phiếu kiểm kê"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <TablePagination
                component="div"
                count={filteredStocktakes.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 20, 50]}
            />
        </Box>
    );
};

export default StockTakePage; 