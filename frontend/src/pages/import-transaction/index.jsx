import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
    TextField, Button, Checkbox, FormControlLabel,
    FormControl, FormLabel, Accordion, AccordionSummary,
    AccordionDetails, Popover, Dialog, DialogTitle, DialogContent,
    Table, TableHead, TableRow, TableCell, TableBody,
    Alert, CircularProgress, Menu, MenuItem, ListItemIcon, ListItemText, Chip
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
// Không cần import FaPlus nữa vì đã dùng Material-UI icons
import { DateRange } from "react-date-range";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {
    format, subDays, startOfWeek, endOfWeek,
    startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
    startOfYear, endOfYear
} from "date-fns";
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { Link } from "react-router-dom";
import importTransactionService from "../../services/importTransactionService";
import { getCustomerById } from "../../services/customerService";
import { userService } from "../../services/userService";
import { getStoreById } from "../../services/storeService";
import ReplyIcon from '@mui/icons-material/Reply';
import SaveIcon from '@mui/icons-material/Save';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import DialogActions from '@mui/material/DialogActions';
import { exportImportTransactions, exportImportTransactionDetail } from '../../utils/excelExport';
import ImportDetailDialog from '../../components/import-transaction/ImportDetailDialog';
import { getZones } from '../../services/zoneService';

const getRange = (key) => {
    const today = new Date();
    switch (key) {
        case "today": return [{ startDate: today, endDate: today, key: 'selection' }];
        case "yesterday": {
            const y = subDays(today, 1);
            return [{ startDate: y, endDate: y, key: 'selection' }];
        }
        case "this_week": return [{ startDate: startOfWeek(today), endDate: endOfWeek(today), key: 'selection' }];
        case "last_week": {
            const lastWeekStart = startOfWeek(subDays(today, 7));
            const lastWeekEnd = endOfWeek(subDays(today, 7));
            return [{ startDate: lastWeekStart, endDate: lastWeekEnd, key: 'selection' }];
        }
        case "this_month": return [{ startDate: startOfMonth(today), endDate: endOfMonth(today), key: 'selection' }];
        case "last_month": {
            const lastMonth = subDays(startOfMonth(today), 1);
            return [{ startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth), key: 'selection' }];
        }
        case "this_quarter": return [{ startDate: startOfQuarter(today), endDate: endOfQuarter(today), key: 'selection' }];
        case "this_year": return [{ startDate: startOfYear(today), endDate: endOfYear(today), key: 'selection' }];
        default: return [{ startDate: today, endDate: today, key: 'selection' }];
    }
};

const labelMap = {
    today: "Hôm nay",
    yesterday: "Hôm qua",
    this_week: "Tuần này",
    last_week: "Tuần trước",
    this_month: "Tháng này",
    last_month: "Tháng trước",
    this_quarter: "Quý này",
    this_year: "Năm nay"
};
const ImportTransactionPage = () => {
    const [presetLabel, setPresetLabel] = useState("Tháng này");
    const [customLabel, setCustomLabel] = useState("Lựa chọn khác");
    const [customDate, setCustomDate] = useState(getRange("this_month"));
    const [selectedMode, setSelectedMode] = useState("preset");
    const [anchorEl, setAnchorEl] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const openPopover = Boolean(anchorEl);

    const [filter, setFilter] = useState({
        status: {
            draft: false,
            waiting: false,
            complete: false,
            cancel: false,
        },
        creator: '',
        importer: '',
        search: ''
    });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [zones, setZones] = useState([]);

    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedDetails, setSelectedDetails] = useState([]);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [actionRow, setActionRow] = useState(null);
    const [supplierDetails, setSupplierDetails] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [storeDetails, setStoreDetails] = useState(null);

    // Thêm state cho thông báo lỗi khi huỷ
    const [cancelError, setCancelError] = useState(null);
    // Thêm state cho thông báo lỗi khi mở phiếu
    const [openError, setOpenError] = useState(null);

    // Auto-dismiss error/success messages
    useEffect(() => {
        if (error || success || openError || cancelError) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
                setOpenError(null);
                setCancelError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success, openError, cancelError]);

    // Load transactions from API
    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await importTransactionService.listAll();
            setTransactions(data);
            
            // Load zones data
            const zonesData = await getZones();
            setZones(zonesData);
        } catch (err) {
            setError('Không thể tải danh sách phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    // Thay thế đoạn filter transactions:
    const getStatusKeys = () => {
        const keys = [];
        if (filter.status.draft) keys.push('DRAFT');
        if (filter.status.waiting) keys.push('WAITING_FOR_APPROVE');
        if (filter.status.complete) keys.push('COMPLETE');
        if (filter.status.cancel) keys.push('CANCEL');
        return keys;
    };

    const filteredTransactions = transactions.filter(t => {
        // Lọc theo trạng thái
        const statusKeys = getStatusKeys();
        // Nếu không chọn gì thì không lọc theo trạng thái
        if (statusKeys.length > 0 && !statusKeys.includes(t.status)) return false;

        // Lọc theo thời gian
        if (customDate && customDate[0]) {
            const start = customDate[0].startDate;
            const end = customDate[0].endDate;
            const importDate = t.importDate ? new Date(t.importDate) : null;
            if (importDate) {
                if (importDate < new Date(start.setHours(0,0,0,0)) || importDate > new Date(end.setHours(23,59,59,999))) {
                    return false;
                }
            }
        }

        // Lọc theo search
        if (
            filter.search &&
            !(
                (t.name && t.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                (t.supplierName && t.supplierName.toLowerCase().includes(filter.search.toLowerCase()))
            )
        ) {
            return false;
        }

        return true;
    });
    // Sort by newest importDate first
    filteredTransactions.sort((a, b) => {
        const dateA = a.importDate ? new Date(a.importDate).getTime() : 0;
        const dateB = b.importDate ? new Date(b.importDate).getTime() : 0;
        return dateB - dateA;
    });

    const handlePresetChange = (key) => {
        setCustomDate(getRange(key));
        setPresetLabel(labelMap[key]);
        setSelectedMode("preset");
        setShowDatePicker(false);
        setAnchorEl(null);
    };

    const handleCustomChange = (range) => {
        const start = format(range.startDate, "dd/MM/yyyy");
        const end = format(range.endDate, "dd/MM/yyyy");
        setCustomLabel(`${start} - ${end}`);
        setCustomDate([range]);
        setSelectedMode("custom");
    };

    const handleViewDetail = async (row) => {
        try {
            const transaction = await importTransactionService.getWithDetails(row.id);
            setSelectedTransaction(transaction);
            setSelectedDetails(transaction.details);
            
            // Fetch thông tin supplier
            if (transaction.supplierId) {
                try {
                    const supplier = await getCustomerById(transaction.supplierId);
                    setSupplierDetails(supplier);
                } catch (error) {
                    setSupplierDetails(null);
                }
            }
            
            // Fetch thông tin user (người tạo)
            if (transaction.createdBy) {
                try {
                    const user = await userService.getUserById(transaction.createdBy);
                    setUserDetails(user);
                } catch (error) {
                    setUserDetails(null);
                }
            }

            // Fetch thông tin store
            if (transaction.storeId) {
                try {
                    const store = await getStoreById(transaction.storeId);
                    setStoreDetails(store);
                } catch (error) {
                    setStoreDetails(null);
                }
            }
            
            setOpenDetailDialog(true);
        } catch (error) {
            console.error("Lỗi khi tải chi tiết phiếu nhập:", error);
        }
    };

    // Hàm xử lý huỷ phiếu
    const handleCancelTransaction = async () => {
        if (!selectedTransaction?.id) return;
        setCancelError(null);
        try {
            await importTransactionService.updateStatus(selectedTransaction.id);
            setOpenDetailDialog(false);
            loadTransactions();
        } catch (err) {
            setCancelError('Không thể huỷ phiếu. Vui lòng thử lại!');
        }
    };

    // Hàm xử lý mở phiếu
    const handleOpenTransaction = async () => {
        if (!selectedTransaction?.id) return;
        setOpenError(null);
        setLoading(true);
        try {
            await importTransactionService.openTransaction(selectedTransaction.id);
            setOpenDetailDialog(false);
            loadTransactions();
            // Thêm thông báo thành công
            setSuccess('Mở phiếu thành công!');
        } catch (err) {
            setOpenError('Không thể mở phiếu. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý đóng phiếu (quay về DRAFT)
    const handleCloseTransaction = async () => {
        if (!selectedTransaction?.id) return;
        setOpenError(null);
        setLoading(true);
        try {
            await importTransactionService.closeTransaction(selectedTransaction.id);
            setOpenDetailDialog(false);
            loadTransactions();
            setSuccess('Đóng phiếu thành công!');
        } catch (err) {
            setOpenError('Không thể đóng phiếu. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý hoàn thành phiếu
    const handleCompleteTransaction = async () => {
        if (!selectedTransaction?.id) return;
        setOpenError(null);
        setLoading(true);
        try {
            await importTransactionService.completeTransaction(selectedTransaction.id);
            setOpenDetailDialog(false);
            loadTransactions();
            setSuccess('Hoàn thành phiếu thành công!');
        } catch (err) {
            setOpenError('Không thể hoàn thành phiếu. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý hủy phiếu từ dialog
    const handleCancelTransactionFromDialog = async () => {
        if (!selectedTransaction?.id) return;
        setCancelError(null);
        setLoading(true);
        try {
            await importTransactionService.updateStatus(selectedTransaction.id);
            setOpenDetailDialog(false);
            loadTransactions();
            setSuccess('Hủy phiếu thành công!');
        } catch (err) {
            setCancelError('Không thể hủy phiếu. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý action menu
    const handleActionClick = (event, row) => {
        setActionAnchorEl(event.currentTarget);
        setActionRow(row);
    };

    const handleActionClose = () => {
        setActionAnchorEl(null);
        setActionRow(null);
    };

    const handleViewDetailMenu = () => {
        handleViewDetail(actionRow);
        handleActionClose();
    };

    const handleOpenTransactionMenu = async () => {
        if (actionRow?.status === 'DRAFT') {
            setSelectedTransaction(actionRow);
            try {
                await importTransactionService.openTransaction(actionRow.id);
                loadTransactions();
                setSuccess('Mở phiếu thành công!');
            } catch (err) {
                setError('Không thể mở phiếu. Vui lòng thử lại!');
            }
        }
        handleActionClose();
    };

    const handleCloseTransactionMenu = async () => {
        if (actionRow?.status === 'WAITING_FOR_APPROVE') {
            setSelectedTransaction(actionRow);
            try {
                await importTransactionService.closeTransaction(actionRow.id);
                loadTransactions();
                setSuccess('Đóng phiếu thành công!');
            } catch (err) {
                setError('Không thể đóng phiếu. Vui lòng thử lại!');
            }
        }
        handleActionClose();
    };

    const handleCompleteTransactionMenu = async () => {
        if (actionRow?.status === 'WAITING_FOR_APPROVE') {
            setSelectedTransaction(actionRow);
            try {
                await importTransactionService.completeTransaction(actionRow.id);
                loadTransactions();
                setSuccess('Hoàn thành phiếu thành công!');
            } catch (err) {
                setError('Không thể hoàn thành phiếu. Vui lòng thử lại!');
            }
        }
        handleActionClose();
    };

    const handleCancelTransactionMenu = async () => {
        if (actionRow?.status === 'DRAFT' || actionRow?.status === 'WAITING_FOR_APPROVE') {
            setSelectedTransaction(actionRow);
            try {
                await importTransactionService.updateStatus(actionRow.id);
                loadTransactions();
                setSuccess('Hủy phiếu thành công!');
            } catch (err) {
                setError('Không thể hủy phiếu. Vui lòng thử lại!');
            }
        }
        handleActionClose();
    };

    const handleEdit = () => {
        // TODO: Thêm logic sửa
        handleActionClose();
    };

    const handleDelete = () => {
        // TODO: Thêm logic xóa
        handleActionClose();
    };

    // Hàm xuất file tổng
    const handleExportAll = () => {
        try {
            exportImportTransactions(filteredTransactions);
        } catch (error) {
            alert('Không thể xuất file. Vui lòng thử lại!');
        }
    };

    // Hàm xuất file chi tiết
    const handleExportDetail = () => {
        try {
            if (selectedTransaction && selectedDetails) {
                exportImportTransactionDetail(selectedTransaction, selectedDetails, supplierDetails, userDetails);
            }
        } catch (error) {
            alert('Không thể xuất file chi tiết. Vui lòng thử lại!');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'WAITING_FOR_APPROVE': return '#f59e0b'; // Vàng
            case 'COMPLETE': return '#10b981'; // Xanh lá
            case 'CANCEL': return '#ef4444'; // Đỏ
            case 'DRAFT': return '#6b7280'; // Đỏ
            default: return '#6b7280'; // Mặc định
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'WAITING_FOR_APPROVE': return 'Chờ xử lý';
            case 'COMPLETE': return 'Đã hoàn thành';
            case 'CANCEL': return 'Đã hủy';
            case 'DRAFT': return 'Nháp';
            default: return status;
        }
    };


    const columns = [
        {
            field: 'stt',
            headerName: 'STT',
            width: 80,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                // Try to use params.rowIndex (for newer DataGrid), fallback to indexOf in visibleRows
                if (typeof params.rowIndex === 'number') {
                    return params.rowIndex + 1;
                }
                // fallback: try to find index in filteredTransactions
                if (params.id) {
                    const idx = filteredTransactions.findIndex(row => row.id === params.id);
                    return idx >= 0 ? idx + 1 : '';
                }
                return '';
            },
        },
        { field: 'name', headerName: 'Tên phiếu nhập', flex: 1 },
        { 
            field: 'importDate', 
            headerName: 'Thời gian', 
            flex: 1,
            renderCell: (params) => {
                if (params.value) {
                    return new Date(params.value).toLocaleString('vi-VN');
                }
                return '';
            }
        },
        { field: 'supplierName', headerName: 'Nhà cung cấp', flex: 1 },
        {
            field: 'totalAmount', 
            headerName: 'Tổng tiền', 
            flex: 1,
            renderCell: (params) => {
                if (params.value) {
                    return params.value.toLocaleString('vi-VN') + ' VNĐ';
                }
                return '0 VNĐ';
            }
        },
        {
            field: 'paidAmount',
            headerName: 'Đã thanh toán',
            flex: 1,
            renderCell: (params) => {
                const paid = params.value || 0;
                const total = params.row.totalAmount || 0;
                let color = '#6b7280'; // default gray
                let label = paid.toLocaleString('vi-VN') + ' VNĐ';
                
                if (paid < total) {
                    color = '#ef4444'; // đỏ nếu trả thiếu hoặc chưa trả
                } else if (paid === total) {
                    color = '#10b981'; // xanh nếu trả đủ
                } else if (paid > total) {
                    color = '#f59e42'; // cam nếu trả dư
                }
                
                return (
                    <span style={{ color, fontWeight: 600 }}>{label}</span>
                );
            }
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    'WAITING_FOR_APPROVE': { label: 'Chờ xử lý', color: '#f59e0b' },       // Vàng
                    'COMPLETE': { label: 'Đã hoàn thành', color: '#10b981' }, // Xanh lá
                    'CANCEL': { label: 'Đã hủy', color: '#ef4444' },   // Đỏ
                    'DRAFT': { label: 'Nháp', color: '#6b7280' }   // Đỏ
                };
                const status = statusMap[params.value] || { label: params.value, color: '#6b7280' };

                return (
                    <span
                        style={{
                            backgroundColor: status.color,
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                {status.label}
            </span>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 80,
            renderCell: (params) => (
                <>
                    <Button
                        size="small"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleActionClick(event, params.row);
                        }}
                        sx={{ minWidth: 0, p: 1 }}
                    >
                        <MoreHorizIcon />
                    </Button>
                </>
            )
        }
    ];

    return (
        <div className="w-full relative">
            {error && (
                <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
                    {success}
                </Alert>
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Phiếu nhập hàng</h2>
                <div className="flex gap-2">
                    <Link to="/import/new">
                        <Button variant="contained" startIcon={<AddIcon />} className="!bg-green-600 hover:!bg-green-700">
                            Nhập hàng
                        </Button>
                    </Link>
                    <Button variant="outlined" startIcon={<TableChartIcon />} onClick={handleExportAll}>
                        Xuất file
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-5">
                <div className="w-full lg:w-1/5 relative">
                    <div className="bg-white p-4 rounded shadow mb-4">
                        <FormLabel className="mb-2 font-semibold">Lọc theo thời gian</FormLabel>
                        <div className="flex flex-col gap-2">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedMode === "preset"}
                                        onChange={() => {
                                            setSelectedMode("preset");
                                            setShowDatePicker(false);
                                            setAnchorEl(null);
                                        }}
                                    />
                                }
                                label={
                                    <div
                                        className="flex items-center justify-between w-full cursor-pointer"
                                        onClick={(e) => {
                                            setSelectedMode("preset");
                                            setShowDatePicker(false);
                                            setAnchorEl(e.currentTarget);
                                        }}
                                    >
                                        <span>{presetLabel}</span>
                                        <Button size="small">▼</Button>
                                    </div>
                                }
                            />
                            <FormControlLabel control={<Checkbox checked={selectedMode === "custom"} onChange={() => { setSelectedMode("custom"); setAnchorEl(null); setShowDatePicker(true); }} />} label={<div className="flex items-center justify-between w-full"><span>{customLabel}</span><Button size="small" onClick={() => { setSelectedMode("custom"); setAnchorEl(null); setShowDatePicker(!showDatePicker); }}>📅</Button></div>} />
                        </div>
                        <Popover open={openPopover} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
                            <div className="p-4 grid grid-cols-2 gap-2">
                                {Object.entries(labelMap).map(([key, label]) => (
                                    <Button key={key} size="small" variant="outlined" onClick={() => handlePresetChange(key)}>{label}</Button>
                                ))}
                            </div>
                        </Popover>
                    </div>

                    <div className="bg-white p-4 rounded shadow mb-4">
                        <FormLabel className="font-semibold mb-2 block">Trạng thái</FormLabel>
                        <FormControl component="fieldset" className="flex flex-col gap-2">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.draft}
                                        onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, draft: !prev.status.draft } }))}
                                    />
                                }
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({ ...prev, status: { ...prev.status, draft: !prev.status.draft } }))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Nháp
                                    </span>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.waiting}
                                        onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, waiting: !prev.status.waiting } }))}
                                    />
                                }
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({ ...prev, status: { ...prev.status, waiting: !prev.status.waiting } }))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Chờ xử lý
                                    </span>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.complete}
                                        onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, complete: !prev.status.complete } }))}
                                    />
                                }
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({ ...prev, status: { ...prev.status, complete: !prev.status.complete } }))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Đã hoàn thành
                                    </span>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.cancel}
                                        onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, cancel: !prev.status.cancel } }))}
                                    />
                                }
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({ ...prev, status: { ...prev.status, cancel: !prev.status.cancel } }))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Đã huỷ
                                    </span>
                                }
                            />
                        </FormControl>
                    </div>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}><span className="font-semibold">Người tạo</span></AccordionSummary>
                        <AccordionDetails><TextField fullWidth size="small" placeholder="Chọn người tạo" value={filter.creator} onChange={(e) => setFilter({ ...filter, creator: e.target.value })} /></AccordionDetails>
                    </Accordion>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}><span className="font-semibold">Người nhập</span></AccordionSummary>
                        <AccordionDetails><TextField fullWidth size="small" placeholder="Chọn người nhập" value={filter.importer} onChange={(e) => setFilter({ ...filter, importer: e.target.value })} /></AccordionDetails>
                    </Accordion>

                    {showDatePicker && selectedMode === "custom" && (
                        <ClickAwayListener onClickAway={() => setShowDatePicker(false)}>
                            <div className="absolute z-50 top-0 left-full ml-4 bg-white p-4 rounded shadow-lg border w-max">
                                <DateRange editableDateInputs={true} onChange={(item) => handleCustomChange(item.selection)} moveRangeOnFirstSelection={false} ranges={customDate} direction="horizontal" />
                                <div className="mt-2 text-right"><Button variant="contained" size="small" onClick={() => setShowDatePicker(false)}>Áp dụng</Button></div>
                            </div>
                        </ClickAwayListener>
                    )}
                </div>

                <div className="w-full lg:w-4/5">
                    <div className="mb-4 w-1/2">
                        <TextField label="Tìm kiếm tên phiếu, nhà cung cấp..." size="small" fullWidth value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
                    </div>
                    
                    {error && (
                        <Alert severity="error" className="mb-4">
                            {error}
                        </Alert>
                    )}
                    
                    <div style={{ height: 500 }} className="bg-white rounded shadow">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <CircularProgress />
                            </div>
                        ) : (
                            <DataGrid
                                rows={filteredTransactions}
                                columns={columns}
                                rowsPerPageOptions={[25, 50, 100]}
                                initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                                checkboxSelection
                                disableSelectionOnClick
                                getRowId={row => row.id}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Chi tiết phiếu nhập */}
            <ImportDetailDialog
                open={openDetailDialog}
                onClose={() => {
                    setOpenDetailDialog(false);
                    setSupplierDetails(null);
                    setUserDetails(null);
                    setStoreDetails(null);
                    setCancelError(null);
                    setOpenError(null);
                }}
                transaction={selectedTransaction}
                details={selectedDetails}
                formatCurrency={(v) => (v || 0).toLocaleString('vi-VN') + ' VNĐ'}
                supplierDetails={supplierDetails}
                userDetails={userDetails}
                storeDetails={storeDetails}
                onExport={handleExportDetail}
                onOpenTransaction={handleOpenTransaction}
                onCloseTransaction={handleCloseTransaction}
                onCompleteTransaction={handleCompleteTransaction}
                onCancelTransaction={handleCancelTransactionFromDialog}
                loading={loading}
                zones={zones}
            />

            {/* Hiển thị thông báo lỗi cho dialog */}
            {cancelError && (
                <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
                    {cancelError}
                </Alert>
            )}
            {openError && (
                <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
                    {openError}
                </Alert>
            )}

            {/* Action Menu */}
            <Menu
                anchorEl={actionAnchorEl}
                open={Boolean(actionAnchorEl)}
                onClose={handleActionClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleViewDetailMenu}>
                    <ListItemIcon>
                        <VisibilityIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
                {/* Hiển thị nút "Mở phiếu" chỉ khi trạng thái là DRAFT */}
                {actionRow?.status === 'DRAFT' && (
                    <MenuItem onClick={handleOpenTransactionMenu}>
                        <ListItemIcon>
                            <LockOpenIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Mở phiếu</ListItemText>
                    </MenuItem>
                )}
                
                {/* Hiển thị nút "Đóng phiếu" chỉ khi trạng thái là WAITING_FOR_APPROVE */}
                {actionRow?.status === 'WAITING_FOR_APPROVE' && (
                    <MenuItem onClick={handleCloseTransactionMenu}>
                        <ListItemIcon>
                            <SaveIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Đóng phiếu</ListItemText>
                    </MenuItem>
                )}
                
                {/* Hiển thị nút "Hoàn thành" chỉ khi trạng thái là WAITING_FOR_APPROVE */}
                {actionRow?.status === 'WAITING_FOR_APPROVE' && (
                    <MenuItem onClick={handleCompleteTransactionMenu}>
                        <ListItemIcon>
                            <CheckIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Hoàn thành</ListItemText>
                    </MenuItem>
                )}
                
                {/* Hiển thị nút "Hủy phiếu" cho các trạng thái DRAFT và WAITING_FOR_APPROVE */}
                {(actionRow?.status === 'DRAFT' || actionRow?.status === 'WAITING_FOR_APPROVE') && (
                    <MenuItem onClick={handleCancelTransactionMenu}>
                        <ListItemIcon>
                            <CancelIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Hủy phiếu</ListItemText>
                    </MenuItem>
                )}
                
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Sửa</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>

        </div>
    );
};

export default ImportTransactionPage;
