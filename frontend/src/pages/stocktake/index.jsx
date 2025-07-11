import React, {useState, useEffect} from "react";
import {createStocktake, getStocktakeList, updateStocktakeStatus} from "../../services/stocktakeService";
import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    CircularProgress,
    Box,
    Typography
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import {useNavigate} from "react-router-dom";
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';
import {productService} from "../../services/productService";
import {getZones} from "../../services/zoneService";
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import importDetailService from '../../services/importDetailService';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

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
    const user = JSON.parse(localStorage.getItem("user"));
    const userRole = user?.roles?.[0]; // hoặc lấy theo cấu trúc bạn lưu
    const [actionLoading, setActionLoading] = useState({}); // { [id]: true/false }
    const [importDetails, setImportDetails] = useState([]);
    const [openImportDetailModal, setOpenImportDetailModal] = useState(false);
    const [selectedStocktakeDate, setSelectedStocktakeDate] = useState(null);

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
            } catch {
            }
            if (!details || !Array.isArray(details) || details.length === 0) {
                // Nếu không có detail, vẫn xuất dòng tổng quát
                exportRows.push({
                    ID: st.id,
                    "Ngày kiểm kê": new Date(st.stocktakeDate).toLocaleString("vi-VN", {hour12: false}),
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
                        "Ngày kiểm kê": new Date(st.stocktakeDate).toLocaleString("vi-VN", {hour12: false}),
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
        const excelBuffer = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
        saveAs(new Blob([excelBuffer], {type: 'application/octet-stream'}), 'stocktake-details.xlsx');
    };

    const handleSendForApproval = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn gửi phê duyệt phiếu này?")) return;
        setActionLoading(prev => ({...prev, [id]: true}));
        try {
            await updateStocktakeStatus(id, "INPROGRESS");
            alert("Đã gửi phê duyệt!");
            reloadStocktakeList();
        } catch (e) {
            alert("Không thể gửi phê duyệt: " + (e?.response?.data?.message || ""));
        } finally {
            setActionLoading(prev => ({...prev, [id]: false}));
        }
    };
    const handleApprove = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn duyệt phiếu này?")) return;
        setActionLoading(prev => ({...prev, [id]: true}));
        try {
            await updateStocktakeStatus(id, "COMPLETED");
            alert("Đã duyệt thành công!");
            reloadStocktakeList();
        } catch (e) {
            alert("Không thể duyệt: " + (e?.response?.data?.message || ""));
        } finally {
            setActionLoading(prev => ({...prev, [id]: false}));
        }
    };
    const handleCancel = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy phiếu này?")) return;
        setActionLoading(prev => ({...prev, [id]: true}));
        try {
            await updateStocktakeStatus(id, "CANCELLED");
            alert("Đã hủy phiếu!");
            reloadStocktakeList();
        } catch (e) {
            alert("Không thể hủy: " + (e?.response?.data?.message || ""));
        } finally {
            setActionLoading(prev => ({...prev, [id]: false}));
        }
    };
    const reloadStocktakeList = () => {
        setLoading(true);
        getStocktakeList()
            .then(res => setStocktakes(res.data))
            .catch(() => alert("Lỗi khi reload danh sách!"))
            .finally(() => setLoading(false));
    };

    const handleShowImportDetails = async (stocktakeDate) => {
        setSelectedStocktakeDate(stocktakeDate);
        setOpenImportDetailModal(true);
        try {
            const res = await importDetailService.getByStocktakeDate(stocktakeDate.split('T')[0]);
            setImportDetails(res.data);
        } catch (e) {
            alert('Không thể lấy danh sách lô hàng kiểm kê!');
            setImportDetails([]);
        }
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
        <Box sx={{maxWidth: 1100, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2}}>
            <Typography variant="h4" fontWeight={700} mb={1}>StockTake (Kiểm kê kho)</Typography>
            <Typography variant="subtitle1" mb={3} color="text.secondary">Quản lý và theo dõi các phiếu kiểm kê kho
                trứng.</Typography>
            <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon/>}
                    sx={{borderRadius: 2, fontWeight: 600, mr: 1}}
                    onClick={() => navigate('/stocktake/create')}
                >
                    Tạo phiếu kiểm kê mới
                </Button>
                <Button
                    variant="outlined"
                    sx={{borderRadius: 2, fontWeight: 600, mr: 1}}
                    onClick={handleExportExcel}
                >
                    Export Excel
                </Button>
                <TextField
                    size="small"
                    label="Tìm kiếm mã/Ghi chú"
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                    sx={{minWidth: 200}}
                />
                <TextField
                    size="small"
                    select
                    label="Trạng thái"
                    value={statusFilter}
                    onChange={e => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                    }}
                    sx={{minWidth: 150}}
                >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="DRAFT">DRAFT</MenuItem>
                    <MenuItem value="INPROGRESS">INPROGRESS</MenuItem>
                    <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                    <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                </TextField>
            </Box>
            {loading ? (
                <Box sx={{textAlign: "center", mt: 6}}>
                    <CircularProgress/>
                    <Typography mt={2}>Đang tải dữ liệu...</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{mt: 2, borderRadius: 2}}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{background: "#f5f5f5"}}>
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
                                        sx={{transition: "background 0.2s"}}
                                    >
                                        <TableCell>{st.id}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleShowImportDetails(st.stocktakeDate)}
                                                size="small"
                                            >
                                                {new Date(st.stocktakeDate).toLocaleString('vi-VN', {hour12: false})}
                                            </Button>
                                        </TableCell>
                                        <TableCell>{st.stocktakeNote}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={st.status}
                                                color={
                                                    st.status === "DRAFT" ? "warning" :
                                                        st.status === "INPROGRESS" ? "info" :
                                                            st.status === "COMPLETED" ? "success" :
                                                                st.status === "CANCELLED" ? "error" :
                                                                    "default"
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Xem chi tiết">
                                                <span>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => navigate(`/stocktake/${st.id}`)}
                                                        disabled={actionLoading[st.id]}
                                                        size="small"
                                                    >
                                                        <VisibilityIcon/>
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            {userRole === "STAFF" && st.status === "DRAFT" && (
                                                <Tooltip title="Gửi phê duyệt">
                                                    <span>
                                                        <IconButton
                                                            color="success"
                                                            onClick={() => handleSendForApproval(st.id)}
                                                            disabled={actionLoading[st.id]}
                                                            size="small"
                                                        >
                                                            <SendIcon/>
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            )}
                                            {userRole === "OWNER" && (st.status === "DRAFT" || st.status === "INPROGRESS") && (
                                                <Tooltip title="Hoàn thành">
                                                    <span>
                                                        <IconButton
                                                            color="success"
                                                            onClick={() => handleApprove(st.id)}
                                                            disabled={actionLoading[st.id]}
                                                            size="small"
                                                        >
                                                            <CheckIcon/>
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            )}
                                            {userRole === "STAFF" && st.status === "DRAFT" && (
                                                <Tooltip title="Hủy phiếu">
                                                    <span>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => handleCancel(st.id)}
                                                            disabled={actionLoading[st.id]}
                                                            size="small"
                                                        >
                                                            <CancelIcon/>
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            )}
                                            {userRole === "OWNER" && (st.status === "DRAFT" || st.status === "INPROGRESS") && (
                                                <Tooltip title="Hủy phiếu">
                                                    <span>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => handleCancel(st.id)}
                                                            disabled={actionLoading[st.id]}
                                                            size="small"
                                                        >
                                                            <CancelIcon/>
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Chỉnh sửa phiếu kiểm kê">
                                                <span>
                                                    <IconButton
                                                        color="secondary"
                                                        onClick={() => navigate(`/stocktake/edit/${st.id}`)}
                                                        disabled={actionLoading[st.id]}
                                                        size="small"
                                                    >
                                                        <EditIcon/>
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
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
                onRowsPerPageChange={e => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20, 50]}
            />
            <Dialog open={openImportDetailModal} onClose={() => setOpenImportDetailModal(false)} maxWidth="md"
                    fullWidth>
                <DialogTitle>
                    Lô hàng kiểm kê
                    ngày {selectedStocktakeDate && new Date(selectedStocktakeDate).toLocaleDateString('vi-VN')}
                </DialogTitle>
                <DialogContent>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tên sản phẩm</TableCell>
                                <TableCell>Số lượng còn</TableCell>
                                <TableCell>Khu vực</TableCell>
                                <TableCell>Đã kiểm tra</TableCell>
                                <TableCell>Hạn sử dụng</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {importDetails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Không có lô hàng nào</TableCell>
                                </TableRow>
                            ) : (
                                importDetails.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.id}</TableCell>
                                        <TableCell>{row.productName}</TableCell>
                                        <TableCell>{row.remainQuantity}</TableCell>
                                        <TableCell>{Array.isArray(row.zones_id) ? row.zones_id.join(', ') : row.zones_id}</TableCell>
                                        <TableCell>{row.isCheck ? 'Đã kiểm' : 'Chưa kiểm'}</TableCell>
                                        <TableCell>{row.expireDate ? new Date(row.expireDate).toLocaleDateString('vi-VN') : ''}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => window.location.href = `/import-transaction/${row.id}`}
                                            >
                                                Xem chi tiết
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default StockTakePage; 