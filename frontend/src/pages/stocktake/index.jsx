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
    Typography,
    useTheme,
    useMediaQuery
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
    // Move user initialization to the top before any use
    const user = JSON.parse(localStorage.getItem("user"));
    const userRole = user?.roles?.[0];
    // Ưu tiên lấy tên kho theo thứ tự: user.store.name -> user.storeName -> user.store (nếu là string)
    let userStoreName = "";
    if (user?.store && typeof user.store === 'object' && user.store.name) {
        userStoreName = user.store.name;
    } else if (user?.storeName) {
        userStoreName = user.storeName;
    } else if (user?.store && typeof user.store === 'string') {
        userStoreName = user.store;
    }
    const userStoreId = user?.store?.id || user?.storeId;
    const userName = user?.fullName || user?.username || "";
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [stocktakes, setStocktakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [statusFilter, setStatusFilter] = useState("DRAFT"); // Mặc định DRAFT cho Staff
    // For staff, storeFilter is always the user's storeId, readonly
    const [storeFilter, setStoreFilter] = useState(userStoreId || "");
    // Remove stores state for staff
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [actionLoading, setActionLoading] = useState({}); // { [id]: true/false }
    const [dateFilter, setDateFilter] = useState(getTodayString());
    const [noteFilter, setNoteFilter] = useState("");
    const [codeFilter, setCodeFilter] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteValue, setEditingNoteValue] = useState("");
    const [noteLoading, setNoteLoading] = useState({}); // { [id]: true/false }
    const [confirmDialog, setConfirmDialog] = useState({isOpen: false, title: "", content: "", onConfirm: null});
    const [snackbar, setSnackbar] = useState({isOpen: false, message: "", severity: "success"});

    useEffect(() => {
        setLoading(true);
        // For staff, always filter by their store and creator
        const params = {
            status: statusFilter,
            note: noteFilter,
            fromDate: dateFilter,
            toDate: dateFilter
        };
        if (userRole === "STAFF") {
            params.storeId = userStoreId;
            params.createdBy = userName;
        }
        getStocktakeList(params)
            .then(res => {
                setStocktakes(res.data);
            })
            .catch(err => {
                alert("Lỗi khi lấy danh sách phiếu kiểm kê!");
            })
            .finally(() => setLoading(false));
        productService.getAllProducts().then(setProducts);
        getZones().then(setZones);
        // Only fetch all stores for Owner
        // if (userRole === "OWNER") getAllStores().then(setStores);
    }, [statusFilter, noteFilter, dateFilter, userRole, userStoreId, userName]);


    const handleCreate = (rows) => {
        createStocktake({
            detail: JSON.stringify(rows),
            stocktakeNote: "Phiếu kiểm kê mới",
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

    // Lọc và tìm kiếm
    const filteredStocktakes = stocktakes.filter(st => {
        const matchesCode = !codeFilter || (st.name && st.name.toLowerCase().includes(codeFilter.toLowerCase()));
        // For staff, always filter by their store
        const matchesStore = userRole === "STAFF"
            ? ((st.storeId && st.storeId === userStoreId) || (!st.storeId && st.storeName === userStoreName))
            : (!storeFilter || st.storeId === parseInt(storeFilter, 10));
        // For staff, always filter by creator
        const matchesCreator = userRole === "STAFF" ? (st.createdByName === userName) : true;
        const matchesStatus = !statusFilter || st.status === statusFilter;
        // Lọc theo ngày kiểm kê
        const matchesDate = !dateFilter || (st.stocktakeDate && new Date(st.stocktakeDate).toISOString().slice(0, 10) === dateFilter);
        // Lọc theo ghi chú
        const matchesNote = !noteFilter || (st.stocktakeNote && st.stocktakeNote.toLowerCase().includes(noteFilter.toLowerCase()));
        return matchesCode && matchesStore && matchesCreator && matchesStatus && matchesDate && matchesNote;
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

    // Hàm lưu ghi chú (fix: gửi đủ trường cần thiết)
    const handleSaveNote = async (st) => {
        setNoteLoading(prev => ({...prev, [st.id]: true}));
        try {
            await updateStocktake(st.id, {
                id: st.id,
                detail: st.detail,
                stocktakeNote: editingNoteValue,
                storeId: st.storeId,
                status: st.status,
                stocktakeDate: st.stocktakeDate
            });
            setSnackbar({isOpen: true, message: "Cập nhật ghi chú thành công!", severity: "success"});
            setEditingNoteId(null);
            // Reload list
            setLoading(true);
            getStocktakeList({
                status: statusFilter,
                note: noteFilter,
                fromDate: dateFilter,
                toDate: dateFilter,
                ...(userRole === "STAFF" ? {storeId: userStoreId, createdBy: userName} : {})
            })
                .then(res => setStocktakes(res.data))
                .finally(() => setLoading(false));
        } catch (e) {
            setSnackbar({isOpen: true, message: "Cập nhật ghi chú thất bại!" + (e?.response?.data?.message || ""), severity: "error"});
        } finally {
            setNoteLoading(prev => ({...prev, [st.id]: false}));
        }
    };

    // Cập nhật trạng thái phiếu kiểm kê
    const handleUpdateStatus = async (id, newStatus) => {
        setActionLoading(prev => ({...prev, [id]: true}));
        try {
            await updateStocktakeStatus(id, newStatus);
            setSnackbar({isOpen: true, message: `Cập nhật trạng thái phiếu thành ${newStatus === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED'} thành công!`, severity: "success"});
            
            // Reload list
            setLoading(true);
            getStocktakeList({
                status: statusFilter,
                note: noteFilter,
                fromDate: dateFilter,
                toDate: dateFilter,
                ...(userRole === "STAFF" ? {storeId: userStoreId, createdBy: userName} : {})
            })
                .then(res => setStocktakes(res.data))
                .finally(() => setLoading(false));
        } catch (e) {
            setSnackbar({isOpen: true, message: `Cập nhật trạng thái thất bại! ${e?.response?.data?.message || ""}`, severity: "error"});
        } finally {
            setActionLoading(prev => ({...prev, [id]: false}));
        }
    };

    // Hủy phiếu (Cancel)
    const handleCancel = async (id) => {
        setActionLoading(prev => ({...prev, [id]: true}));
        try {
            // Lấy phiếu kiểm kê hiện tại từ state
            const st = stocktakes.find(s => s.id === id);
            if (!st) throw new Error('Không tìm thấy phiếu kiểm kê');
            
            // Xử lý dữ liệu chi tiết
            let detail = [];
            
            // Nếu st.detail là mảng, sử dụng trực tiếp
            if (Array.isArray(st.detail)) {
                detail = st.detail;
            } 
            // Nếu st.rawDetail là mảng, sử dụng rawDetail
            else if (Array.isArray(st.rawDetail)) {
                detail = st.rawDetail;
            } 
            // Nếu st.detail là chuỗi, thử parse
            else if (typeof st.detail === 'string') {
                try { 
                    detail = JSON.parse(st.detail); 
                } catch (e) { 
                    console.error("Lỗi parse chi tiết phiếu", e);
                    detail = []; 
                }
            }
            
            // Đảm bảo detail là mảng
            if (!Array.isArray(detail)) detail = [];
            
            // Lọc bỏ các lô không có đủ thông tin và map lại đầy đủ trường
            const mappedDetail = detail
                .filter(lot => lot && (lot.id != null || lot.productId != null || lot.batchCode))
                .map(lot => ({
                    id: lot.id,
                    productId: lot.productId,
                    productName: lot.productName,
                    batchCode: lot.batchCode,
                    real: lot.real,
                    remain: lot.remain,
                    diff: lot.diff,
                    isCheck: lot.isCheck,
                    note: lot.note,
                    zoneReal: lot.zoneReal,
                    zones_id: lot.zones_id,
                    expireDate: lot.expireDate
                }));
            
            // Đảm bảo storeId không null
            const storeId = st.storeId || (userRole === "STAFF" ? userStoreId : null);
            if (!storeId) {
                throw new Error('Không tìm thấy thông tin cửa hàng cho phiếu kiểm kê này');
            }
            
            // Log để debug
            console.log('Dữ liệu chi tiết phiếu sẽ gửi đi:', mappedDetail);
            
            // Gọi API cập nhật phiếu với trạng thái CANCELLED
            await updateStocktake(id, {
                id: st.id,
                detail: mappedDetail,
                stocktakeNote: st.stocktakeNote || '',
                storeId: storeId,
                status: "CANCELLED",
                stocktakeDate: st.stocktakeDate
            });
            
            setSnackbar({isOpen: true, message: "Đã hủy phiếu thành công!", severity: "success"});
            
            // Reload list
            setLoading(true);
            getStocktakeList({
                status: statusFilter,
                note: noteFilter,
                fromDate: dateFilter,
                toDate: dateFilter,
                ...(userRole === "STAFF" ? {storeId: userStoreId, createdBy: userName} : {})
            })
                .then(res => setStocktakes(res.data))
                .finally(() => setLoading(false));
        } catch (e) {
            console.error('Lỗi khi hủy phiếu:', e);
            setSnackbar({isOpen: true, message: "Hủy phiếu thất bại!" + (e?.response?.data?.message || ""), severity: "error"});
        } finally {
            setActionLoading(prev => ({...prev, [id]: false}));
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
        <Box sx={{maxWidth: 1100, margin: '20px auto', background: '#fff', p: isMobile ? 2 : 4, borderRadius: 3, boxShadow: 2}}>
            <Box sx={{display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', mb: 1}}>
                <Typography variant="h4" fontWeight={700} mr={2}>StockTake</Typography>
                {/* Staff: show store name next to title */}
                {userRole === "STAFF" && (
                    <Chip label={userStoreName} color="primary" sx={{fontWeight: 600, fontSize: 16, height: 32, mt: isMobile ? 1 : 0}} />
                )}
            </Box>
            <Typography variant="subtitle1" mb={3} color="text.secondary">Quản lý và theo dõi các phiếu kiểm kê</Typography>
            <Box sx={{flexDirection: 'column', display: 'flex', gap: 2, mb: 2}}>
                <Box sx={{display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2}}>
                    {/* Filter mã kiểm kê */}
                    <TextField
                        fullWidth={isMobile}
                        size="small"
                        label="Mã kiểm kê"
                        value={codeFilter}
                        onChange={e => {
                            setCodeFilter(e.target.value);
                            setPage(0);
                        }}
                    />
                    
                    {/* Owner: có thể chọn kho */}
                    
                    {/* Staff: readonly store filter */}
                    {userRole === "STAFF" && (
                        <TextField
                            fullWidth={isMobile}
                            size="small"
                            label="Kho"
                            value={userStoreName}
                            InputProps={{readOnly: true}}
                        />
                    )}
                </Box>
                 <Box sx={{display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2}}>
                    {/* Filter ngày kiểm kê */}
                    <TextField
                        fullWidth={isMobile}
                        size="small"
                        type="date"
                        label="Ngày kiểm kê"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        InputLabelProps={{shrink: true}}
                    />
                    {/* Filter ghi chú */}
                    <TextField
                        fullWidth={isMobile}
                        size="small"
                        label="Lọc theo ghi chú"
                        value={noteFilter}
                        onChange={e => {
                            setNoteFilter(e.target.value);
                            setPage(0);
                        }}
                    />
                    {/* Filter trạng thái */}
                    <TextField
                        fullWidth={isMobile}
                        size="small"
                        select
                        label="Trạng thái"
                        value={statusFilter}
                        onChange={e => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        <MenuItem value="DRAFT">DRAFT</MenuItem>
                        <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                        <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                    </TextField>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: isMobile ? 2 : 0 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        sx={{borderRadius: 2, fontWeight: 600}}
                        onClick={() => navigate('/stocktake/create')}
                    >
                        Tạo phiếu kiểm kê mới
                    </Button>
                </Box>
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
                                <TableCell><b>Mã Kiểm kho</b></TableCell>
                                <TableCell><b>Ngày kiểm kê</b></TableCell>
                                <TableCell><b>Ngày cân bằng</b></TableCell>
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
                                    <TableCell colSpan={8} align="center">Không có phiếu kiểm kê nào</TableCell>
                                </TableRow>
                            ) : (
                                paginatedStocktakes.map((st, idx) => (
                                    <TableRow
                                        key={st.id}
                                        hover
                                        sx={{
                                            transition: "background 0.2s",
                                            ...(hasDiff(st) && {backgroundColor: "#ffeaea"})
                                        }}
                                    >
                                        <TableCell>{st.name}</TableCell>
                                        { !isMobile && <TableCell>{st.stocktakeDate ? new Date(st.stocktakeDate).toLocaleString('vi-VN', {hour12: false}) : ""}</TableCell> }
                                        { !isMobile && <TableCell>{st.status === "COMPLETED" && st.updatedAt ? new Date(st.updatedAt).toLocaleString('vi-VN', {hour12: false}) : ""}</TableCell> }
                                        <TableCell>{st.storeName || st.storeId}</TableCell>
                                        { !isMobile && <TableCell>{st.createdByName || ''}</TableCell> }
                                        { !isMobile && <TableCell>{st.stocktakeNote}</TableCell> }
                                        <TableCell>
                                            <Chip
                                                label={st.status}
                                                color={
                                                    st.status === "DRAFT" ? "warning" :
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
                                                        onClick={() => navigate(
                                                            st.status === "DRAFT"
                                                                ? `/stocktake/edit/${st.id}`
                                                                : `/stocktake/${st.id}`
                                                        )}
                                                        disabled={actionLoading[st.id]}
                                                        size="small"
                                                    >
                                                        <VisibilityIcon/>
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            {/* Staff chỉ có quyền hủy khi DRAFT */}
                                            {userRole === "STAFF" && st.status === "DRAFT" && (
                                                <>
                                                <Tooltip title="Hủy phiếu">
                                                    <span>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    isOpen: true,
                                                                    title: "Xác nhận hủy phiếu kiểm kê",
                                                                    content: "Bạn có chắc chắn muốn hủy phiếu kiểm kê này? Thao tác này không thể hoàn tác.",
                                                                    onConfirm: () => handleCancel(st.id)
                                                                });
                                                            }}
                                                            disabled={actionLoading[st.id]}
                                                            size="small"
                                                        >
                                                            <CancelIcon/>
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