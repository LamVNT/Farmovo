// ======================= StockTakePage.jsx =======================
import React, { useState, useMemo, useEffect } from "react";
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
    useMediaQuery,
    TextField,
    MenuItem,
    Tooltip,
    TablePagination
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import {useNavigate} from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";
import useStocktake from "../../hooks/useStocktake";
import { debounce } from "lodash";

const StockTakePage = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userRole = user?.roles?.[0];
    const {
        loading,
        statusFilter,
        setStatusFilter,
        storeFilter,
        setStoreFilter,
        dateFilter,
        setDateFilter,
        noteFilter,
        setNoteFilter,
        stocktakes,
        page,
        setPage,
        rowsPerPage,
        setRowsPerPage,
        total,
        actionLoading,
        confirmDialog,
        setConfirmDialog,
        snackbar,
        setSnackbar,
        handleCancel,
    } = useStocktake(user, userRole);

    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [codeSearch, setCodeSearch] = useState("");
    const [noteSearch, setNoteSearch] = useState("");
    // Debounce cho search
    const [debouncedCode, setDebouncedCode] = useState("");
    const [debouncedNote, setDebouncedNote] = useState("");
    useEffect(() => {
        const handler = debounce(() => {
            setDebouncedCode(codeSearch);
            setDebouncedNote(noteSearch);
        }, 400);
        handler();
        return () => handler.cancel();
    }, [codeSearch, noteSearch]);
    // Filter local theo mã kiểm kê và ghi chú
    const filteredStocktakes = useMemo(() => {
        return stocktakes.filter(st => {
            let matchCode = true;
            if (debouncedCode.trim()) {
                matchCode = (st.name || "").toLowerCase().includes(debouncedCode.toLowerCase());
            }
            let matchNote = true;
            if (debouncedNote.trim()) {
                matchNote = (st.stocktakeNote || "").toLowerCase().includes(debouncedNote.toLowerCase());
            }
            return matchCode && matchNote;
        });
    }, [stocktakes, debouncedCode, debouncedNote]);

    // ✅ Ưu tiên lấy tên kho theo thứ tự
    let userStoreName = "";
    if (user?.store && typeof user.store === 'object' && user.store.name) {
        userStoreName = user.store.name;
    } else if (user?.storeName) {
        userStoreName = user.storeName;
    } else if (user?.store && typeof user.store === 'string') {
        userStoreName = user.store;
    }

    // ✅ Hàm kiểm tra diff (sửa lại mục 1)
    function hasDiff(stocktake) {
        let details = [];
        if (Array.isArray(stocktake.detail)) {
            details = stocktake.detail;
        } else if (typeof stocktake.detail === "string") {
            try {
                details = JSON.parse(stocktake.detail);
            } catch {
                details = [];
            }
        }
        return Array.isArray(details) && details.some(d => d.diff !== 0);
    }

    return (
        <div className="p-3 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Quản lý kiểm kho</h2>
                        <p className="text-gray-600 mt-1">Quản lý và theo dõi các phiếu kiểm kê trong hệ thống</p>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                        <TextField
                            size="small"
                            label="Lọc theo mã kiểm kê"
                            value={codeSearch}
                            onChange={e => setCodeSearch(e.target.value)}
                            sx={{ minWidth: 150, background: '#fff', borderRadius: 2 }}
                        />
                        {userRole === "STAFF" && (
                            <TextField
                                size="small"
                                label="Kho"
                                value={userStoreName}
                                InputProps={{ readOnly: true }}
                                sx={{ minWidth: 120, background: '#fff', borderRadius: 2 }}
                            />
                        )}
                        <TextField
                            size="small"
                            type="date"
                            label="Ngày kiểm kê"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150, background: '#fff', borderRadius: 2 }}
                        />
                        <TextField
                            size="small"
                            label="Lọc theo ghi chú"
                            value={noteSearch}
                            onChange={e => setNoteSearch(e.target.value)}
                            sx={{ minWidth: 150, background: '#fff', borderRadius: 2 }}
                        />
                        <TextField
                            size="small"
                            select
                            label="Trạng thái"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                            sx={{ minWidth: 130, background: '#fff', borderRadius: 2 }}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="DRAFT">DRAFT</MenuItem>
                            <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                            <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                        </TextField>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ borderRadius: 2, fontWeight: 600, px: 3, py: 1, textTransform: 'none', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' }}
                            onClick={() => navigate('/stocktake/create')}
                        >
                            Tạo phiếu kiểm kê mới
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200">
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 900 }}>
                                <TableHead>
                                    <TableRow sx={{ background: "#f5f5f5" }}>
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
                                    {filteredStocktakes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">Không có phiếu kiểm kê nào</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStocktakes.map(st => (
                                            <TableRow
                                                key={st.id}
                                                hover
                                                sx={{ transition: "background 0.2s", ...(hasDiff(st) && { backgroundColor: "#ffeaea" }) }}
                                            >
                                                <TableCell>{st.name}</TableCell>
                                                <TableCell>{st.stocktakeDate ? new Date(st.stocktakeDate).toLocaleString('vi-VN', { hour12: false }) : "-"}</TableCell>
                                                <TableCell>
                                                    {st.status === "COMPLETED" && st.updatedAt
                                                        ? new Date(st.updatedAt).toLocaleString('vi-VN', { hour12: false })
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>{st.storeName || st.storeId || "-"}</TableCell>
                                                <TableCell>{st.createdByName || '-'}</TableCell>
                                                <TableCell>{st.stocktakeNote || '-'}</TableCell>
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
                                                                <VisibilityIcon />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                    {userRole === "STAFF" && st.status === "DRAFT" && (
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
                                                                    <CancelIcon />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
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
                <ConfirmDialog
                    open={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmDialog.onConfirm}
                    title={confirmDialog.title}
                    content={confirmDialog.content}
                />
                <SnackbarAlert
                    open={snackbar.isOpen}
                    onClose={() => setSnackbar(prev => ({ ...prev, isOpen: false }))}
                    message={snackbar.message}
                    severity={snackbar.severity}
                />
            </div>
        </div>
    );
};

export default StockTakePage;
