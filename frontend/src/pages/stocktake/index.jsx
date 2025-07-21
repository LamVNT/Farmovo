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
import {getAllStores} from "../../services/storeService";
import Checkbox from '@mui/material/Checkbox';
import { updateStocktake } from '../../services/stocktakeService';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";

// Định nghĩa hàm trước
const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const StockTakePage = () => {
    const [stocktakes, setStocktakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [statusFilter, setStatusFilter] = useState("INPROGRESS"); // Mặc định INPROGRESS
    const [storeFilter, setStoreFilter] = useState("");
    const [stores, setStores] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const user = JSON.parse(localStorage.getItem("user"));
    const userRole = user?.roles?.[0]; // hoặc lấy theo cấu trúc bạn lưu
    const [actionLoading, setActionLoading] = useState({}); // { [id]: true/false }
    const [dateFilter, setDateFilter] = useState(getTodayString());
    const [noteFilter, setNoteFilter] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteValue, setEditingNoteValue] = useState("");
    const [noteLoading, setNoteLoading] = useState({}); // { [id]: true/false }
    const [confirmDialog, setConfirmDialog] = useState({isOpen: false, title: "", content: "", onConfirm: null});
    const [snackbar, setSnackbar] = useState({isOpen: false, message: "", severity: "success"});

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
        getAllStores().then(setStores); // Lấy danh sách kho
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
        if (selectedIds.length === 0) {
            alert("Vui lòng chọn ít nhất một phiếu để export!");
            return;
        }
        let exportRows = [];
        const selectedStocktakes = stocktakes.filter(st => selectedIds.includes(st.id));
        selectedStocktakes.forEach(st => {
            let details = [];
            try {
                details = JSON.parse(st.detail);
            } catch {}
            if (!details || !Array.isArray(details) || details.length === 0) {
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
        setSelectMode(false);
        setSelectedIds([]);
    };

    const handleSendForApproval = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: "Gửi phê duyệt phiếu kiểm kê",
            content: "Bạn có chắc chắn muốn gửi phê duyệt phiếu này?",
            onConfirm: async () => {
                setConfirmDialog(prev => ({...prev, isOpen: false}));
                setActionLoading(prev => ({...prev, [id]: true}));
                try {
                    await updateStocktakeStatus(id, "INPROGRESS");
                    setSnackbar({isOpen: true, message: "Đã gửi phê duyệt!", severity: "success"});
                    reloadStocktakeList();
                } catch (e) {
                    setSnackbar({isOpen: true, message: "Không thể gửi phê duyệt: " + (e?.response?.data?.message || ""), severity: "error"});
                } finally {
                    setActionLoading(prev => ({...prev, [id]: false}));
                }
            }
        });
    };
    const handleApprove = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: "Duyệt phiếu kiểm kê",
            content: "Bạn có chắc chắn muốn duyệt phiếu này?",
            onConfirm: async () => {
                setConfirmDialog(prev => ({...prev, isOpen: false}));
                setActionLoading(prev => ({...prev, [id]: true}));
                try {
                    await updateStocktakeStatus(id, "COMPLETED");
                    setSnackbar({isOpen: true, message: "Đã duyệt thành công!", severity: "success"});
                    reloadStocktakeList();
                } catch (e) {
                    setSnackbar({isOpen: true, message: "Không thể duyệt: " + (e?.response?.data?.message || ""), severity: "error"});
                } finally {
                    setActionLoading(prev => ({...prev, [id]: false}));
                }
            }
        });
    };
    const handleCancel = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: "Hủy phiếu kiểm kê",
            content: "Bạn có chắc chắn muốn hủy phiếu này?",
            onConfirm: async () => {
                setConfirmDialog(prev => ({...prev, isOpen: false}));
                setActionLoading(prev => ({...prev, [id]: true}));
                try {
                    await updateStocktakeStatus(id, "CANCELLED");
                    setSnackbar({isOpen: true, message: "Đã hủy phiếu!", severity: "success"});
                    reloadStocktakeList();
                } catch (e) {
                    setSnackbar({isOpen: true, message: "Không thể hủy: " + (e?.response?.data?.message || ""), severity: "error"});
                } finally {
                    setActionLoading(prev => ({...prev, [id]: false}));
                }
            }
        });
    };
    const reloadStocktakeList = () => {
        setLoading(true);
        getStocktakeList()
            .then(res => setStocktakes(res.data))
            .catch(() => alert("Lỗi khi reload danh sách!"))
            .finally(() => setLoading(false));
    };

    // Lọc và tìm kiếm
    const filteredStocktakes = stocktakes.filter(st => {
        const matchesStore = !storeFilter || st.storeId === parseInt(storeFilter, 10);
        const matchesStatus = !statusFilter || st.status === statusFilter;
        // Lọc theo ngày kiểm kê
        const matchesDate = !dateFilter || (st.stocktakeDate && new Date(st.stocktakeDate).toISOString().slice(0, 10) === dateFilter);
        // Lọc theo ghi chú
        const matchesNote = !noteFilter || (st.stocktakeNote && st.stocktakeNote.toLowerCase().includes(noteFilter.toLowerCase()));
        return matchesStore && matchesStatus && matchesDate && matchesNote;
    });
    const paginatedStocktakes = filteredStocktakes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Hàm kiểm tra phiếu có dòng chênh lệch không
    function hasDiff(stocktake) {
        let details = [];
        try {
            details = JSON.parse(stocktake.detail);
        } catch {
        }
        return details.some(d => d.diff !== 0);
    }

    // Hàm chọn tất cả
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedIds(filteredStocktakes.map(st => st.id));
        } else {
            setSelectedIds([]);
        }
    };
    // Hàm chọn từng dòng
    const handleSelectRow = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // Hàm lưu ghi chú
    const handleSaveNote = async (st) => {
        setNoteLoading(prev => ({...prev, [st.id]: true}));
        try {
            await updateStocktake(st.id, {
                detail: st.detail,
                stocktakeNote: editingNoteValue,
                storeId: st.storeId,
                status: st.status,
                stocktakeDate: st.stocktakeDate
            });
            setSnackbar({isOpen: true, message: "Cập nhật ghi chú thành công!", severity: "success"});
            reloadStocktakeList();
            setEditingNoteId(null);
        } catch (e) {
            setSnackbar({isOpen: true, message: "Cập nhật ghi chú thất bại!" + (e?.response?.data?.message || ""), severity: "error"});
        } finally {
            setNoteLoading(prev => ({...prev, [st.id]: false}));
        }
    };

    // Sửa lại nút Export Excel
    const handleExportClick = () => {
        setSelectMode(true);
        setSelectedIds([]);
    };
    const handleCancelSelect = () => {
        setSelectMode(false);
        setSelectedIds([]);
    };

    return (
        <Box sx={{maxWidth: 1100, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2}}>
            <Typography variant="h4" fontWeight={700} mb={1}>StockTake</Typography>
            <Typography variant="subtitle1" mb={3} color="text.secondary">Quản lý và theo dõi các phiếu kiểm
                kê</Typography>
            <Box sx={{flexDirection: { xs: 'column', md: 'row' }, display: 'flex', gap: 2, mb: 2, alignItems: 'center'}}>
                {/* Dropdown lọc kho bên trái */}
                <TextField
                    size="small"
                    select
                    label="Kho"
                    value={storeFilter}
                    onChange={e => setStoreFilter(e.target.value)}
                    sx={{minWidth: 150}}
                >
                    <MenuItem value="">Tất cả</MenuItem>
                    {stores.map(store => (
                        <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
                    ))}
                </TextField>
                {/* Filter ngày kiểm kê */}
                <TextField
                    size="small"
                    type="date"
                    label="Ngày kiểm kê"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    sx={{minWidth: 160}}
                    InputLabelProps={{shrink: true}}
                />
                {/* Filter ghi chú */}
                <TextField
                    size="small"
                    label="Lọc theo ghi chú"
                    value={noteFilter}
                    onChange={e => {
                        setNoteFilter(e.target.value);
                        setPage(0);
                    }}
                    sx={{minWidth: 180}}
                />
                {/* Filter trạng thái */}
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
                {/* Spacer để đẩy nút sang phải */}
                <Box sx={{flexGrow: 1}}/>
                {/* Nút tạo phiếu và export ở bên phải */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon/>}
                    sx={{borderRadius: 2, fontWeight: 600, mr: 1}}
                    onClick={() => navigate('/stocktake/create')}
                >
                    Tạo phiếu kiểm kê mới
                </Button>
                {!selectMode ? (
                    <Button
                        variant="outlined"
                        sx={{borderRadius: 2, fontWeight: 600, mr: 1}}
                        onClick={handleExportClick}
                    >
                        Export Excel
                    </Button>
                ) : (
                    <>
                        <Tooltip title="Export các phiếu đã chọn">
                            <IconButton
                                color="success"
                                onClick={handleExportExcel}
                                sx={{mr: 1, bgcolor: '#4caf50', color: '#fff', '&:hover': {bgcolor: '#388e3c'}}}
                            >
                                <CheckIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Hủy chọn">
                            <IconButton
                                color="error"
                                onClick={handleCancelSelect}
                                sx={{bgcolor: '#f44336', color: '#fff', '&:hover': {bgcolor: '#b71c1c'}}}
                            >
                                <CloseIcon/>
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </Box>
            {loading ? (
                <Box sx={{textAlign: "center", mt: 6}}>
                    <CircularProgress/>
                    <Typography mt={2}>Đang tải dữ liệu...</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{mt: 2, borderRadius: 2, overflowX: 'auto'}}>
                    <Table sx={{minWidth: 900}}>
                        <TableHead>
                            <TableRow sx={{background: "#f5f5f5"}}>
                                {selectMode && (
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedStocktakes.length}
                                            checked={paginatedStocktakes.length > 0 && selectedIds.length === paginatedStocktakes.length}
                                            onChange={handleSelectAll}
                                            inputProps={{'aria-label': 'select all'}}
                                        />
                                    </TableCell>
                                )}
                                <TableCell><b>STT</b></TableCell>
                                <TableCell><b>Ngày kiểm kê</b></TableCell>
                                <TableCell><b>Kho</b></TableCell>
                                <TableCell><b>Người tạo</b></TableCell>
                                <TableCell><b>Ghi chú</b></TableCell>
                                <TableCell><b>Trạng thái</b></TableCell>
                                <TableCell align="center"><b>Thao tác</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedStocktakes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={selectMode ? 8 : 7} align="center">Không có phiếu kiểm kê nào</TableCell>
                                </TableRow>
                            ) : (
                                paginatedStocktakes.map((st, idx) => (
                                    <TableRow
                                        key={st.id}
                                        hover
                                        sx={{
                                            transition: "background 0.2s",
                                            ...(hasDiff(st) && {backgroundColor: "#ffeaea"}) // màu đỏ nhạt nếu có diff
                                        }}
                                    >
                                        {selectMode && (
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedIds.includes(st.id)}
                                                    onChange={() => handleSelectRow(st.id)}
                                                    inputProps={{'aria-label': `select row ${st.id}`}}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => {
                                                    // Xoá các state và hàm liên quan đến importDetails, openImportDetailModal, selectedStocktakeDate
                                                    // Xoá hàm handleShowImportDetails
                                                    // Xoá Dialog hiển thị lô hàng kiểm kê theo ngày
                                                }}
                                                size="small"
                                            >
                                                {new Date(st.stocktakeDate).toLocaleString('vi-VN', {hour12: false})}
                                            </Button>
                                        </TableCell>
                                        <TableCell>{st.storeName || st.storeId}</TableCell>
                                        <TableCell>{st.createdByName || ''}</TableCell>
                                        <TableCell>
                                            {editingNoteId === st.id ? (
                                                <>
                                                    <TextField
                                                        value={editingNoteValue}
                                                        onChange={e => setEditingNoteValue(e.target.value)}
                                                        size="small"
                                                        sx={{minWidth: 120}}
                                                        disabled={noteLoading[st.id]}
                                                        multiline
                                                        minRows={1}
                                                        maxRows={4}
                                                    />
                                                    <Button
                                                        onClick={() => handleSaveNote(st)}
                                                        size="small"
                                                        color="success"
                                                        disabled={noteLoading[st.id]}
                                                        sx={{ml: 1}}
                                                    >
                                                        Lưu
                                                    </Button>
                                                    <Button
                                                        onClick={() => setEditingNoteId(null)}
                                                        size="small"
                                                        color="inherit"
                                                        sx={{ml: 1}}
                                                        disabled={noteLoading[st.id]}
                                                    >
                                                        Hủy
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    {st.stocktakeNote}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditingNoteId(st.id);
                                                            setEditingNoteValue(st.stocktakeNote || "");
                                                        }}
                                                        sx={{ml: 1}}
                                                    >
                                                        <EditIcon fontSize="small"/>
                                                    </IconButton>
                                                </>
                                            )}
                                        </TableCell>
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
                                            {/* Staff chỉ sửa/hủy khi DRAFT */}
                                            {userRole === "STAFF" && st.status === "DRAFT" && (
                                                <>
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
                                                </>
                                            )}
                                            {/* Owner chỉ sửa/hủy khi DRAFT hoặc INPROGRESS */}
                                            {userRole === "OWNER" && (st.status === "DRAFT" || st.status === "INPROGRESS") && (
                                                <>
                                                    {st.status === "INPROGRESS" && (
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
                                                </>
                                            )}
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

export default StockTakePage; 