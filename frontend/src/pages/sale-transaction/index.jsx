import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
    TextField, Button, Checkbox, FormControlLabel,
    FormControl, FormLabel, Accordion, AccordionSummary,
    AccordionDetails, Popover, Dialog, DialogTitle, DialogContent,
    Table, TableHead, TableRow, TableCell, TableBody,
    Alert, CircularProgress, Chip
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FaPlus, FaFileExport, FaDownload } from "react-icons/fa";
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
import saleTransactionService from "../../services/saleTransactionService";
import { userService } from "../../services/userService";
import { getCustomerById } from "../../services/customerService";
import { exportSaleTransactions, exportSaleTransactionDetail } from '../../utils/excelExport';
import DialogActions from '@mui/material/DialogActions';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaleDetailDialog from "../../components/sale-transaction/SaleDetailDialog";
import { formatCurrency } from "../../utils/formatters";
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import TableChartIcon from '@mui/icons-material/TableChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Typography from '@mui/material/Typography';

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

const SaleTransactionPage = () => {
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
            complete: false,
        },
        customer: '',
        store: '',
        search: ''
    });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [actionRow, setActionRow] = useState(null);
    const [success, setSuccess] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState(null); // 'complete' | 'cancel'
    const [confirmRow, setConfirmRow] = useState(null);

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
            exportSaleTransactions(filteredTransactions);
        } catch (error) {
            console.error('Lỗi khi xuất file:', error);
            alert('Không thể xuất file. Vui lòng thử lại!');
        }
    };

    // Hàm xuất file chi tiết
    const handleExportDetail = (transaction = null) => {
        try {
            const targetTransaction = transaction || selectedTransaction;
            if (targetTransaction) {
                let details = [];
                if (targetTransaction.detail) {
                    // Parse detail từ JSON string nếu cần
                    details = typeof targetTransaction.detail === 'string' 
                        ? JSON.parse(targetTransaction.detail) 
                        : targetTransaction.detail;
                }
                exportSaleTransactionDetail(targetTransaction, details);
            }
        } catch (error) {
            console.error('Lỗi khi xuất file chi tiết:', error);
            alert('Không thể xuất file chi tiết. Vui lòng thử lại!');
        }
    };

    const handleExportPdf = async (transaction = null) => {
        try {
            const targetTransaction = transaction || selectedTransaction;
            if (!targetTransaction) return;
            const pdfBlob = await saleTransactionService.exportPdf(targetTransaction.id);
            const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sale-transaction-${targetTransaction.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Không thể xuất PDF. Vui lòng thử lại!');
        }
    };

    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await saleTransactionService.listAll();
            setTransactions(data);
        } catch (err) {
            setError('Không thể tải danh sách phiếu bán hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const getStatusKeys = () => {
        const keys = [];
        if (filter.status.draft) keys.push('DRAFT');
        if (filter.status.complete) keys.push('COMPLETE');
        return keys;
    };

    const filteredTransactions = transactions.filter(t => {
        const statusKeys = getStatusKeys();
        if (statusKeys.length > 0 && !statusKeys.includes(t.status)) return false;

        if (customDate && customDate[0]) {
            const start = customDate[0].startDate;
            const end = customDate[0].endDate;
            const saleDate = t.saleDate ? new Date(t.saleDate) : null;
            if (saleDate) {
                if (saleDate < new Date(start.setHours(0,0,0,0)) || saleDate > new Date(end.setHours(23,59,59,999))) {
                    return false;
                }
            }
        }

        if (
            filter.search &&
            !(
                (t.customerName && t.customerName.toLowerCase().includes(filter.search.toLowerCase())) ||
                (t.storeName && t.storeName.toLowerCase().includes(filter.search.toLowerCase()))
            )
        ) {
            return false;
        }

        return true;
    });
    // Sắp xếp theo saleDate mới nhất lên trên
    filteredTransactions.sort((a, b) => {
        const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
        const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
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
            // Lấy chi tiết đầy đủ từ API
            const detailedTransaction = await saleTransactionService.getById(row.id);

            // Nếu thiếu customerId/storeId, lấy lại từ row gốc
            if (!detailedTransaction.customerId && row.customerId) {
                detailedTransaction.customerId = row.customerId;
            }
            if (!detailedTransaction.storeId && row.storeId) {
                detailedTransaction.storeId = row.storeId;
            }

            setSelectedTransaction(detailedTransaction);
            
            // Lấy thông tin người tạo nếu có createdBy
            if (detailedTransaction.createdBy) {
                try {
                    const user = await userService.getUserById(detailedTransaction.createdBy);
                    setUserDetails(user);
                } catch (error) {
                    console.error('Error loading user details:', error);
                    setUserDetails(null);
                }
            } else {
                setUserDetails(null);
            }
            
            // Lấy thông tin chi tiết khách hàng nếu có customerId
            if (detailedTransaction.customerId) {
                try {
                    const customer = await getCustomerById(detailedTransaction.customerId);
                    setCustomerDetails(customer);
                } catch (error) {
                    console.error('Error loading customer details:', error);
                    setCustomerDetails(null);
                }
            } else {
                setCustomerDetails(null);
            }
            
            setOpenDetailDialog(true);
        } catch (error) {
            console.error('Error loading transaction details:', error);
            // Fallback to row data if API fails
            setSelectedTransaction(row);
            setUserDetails(null);
            setCustomerDetails(null);
            setOpenDetailDialog(true);
        }
    };

    // Xử lý hủy phiếu
    const handleCancel = async (row) => {
        if (!row) return;
        try {
            await saleTransactionService.cancel(row.id);
            setSuccess('Hủy phiếu thành công!');
            setOpenDetailDialog(false);
            setSelectedTransaction(null);
            setUserDetails(null);
            setCustomerDetails(null);
            loadTransactions();
        } catch (error) {
            setError('Không thể hủy phiếu. Vui lòng thử lại!');
        }
    };
    // Xử lý hoàn thành phiếu
    const handleComplete = async (row) => {
        if (!row) return;
        try {
            await saleTransactionService.complete(row.id);
            setSuccess('Hoàn thành phiếu thành công!');
            setOpenDetailDialog(false);
            setSelectedTransaction(null);
            setUserDetails(null);
            setCustomerDetails(null);
            loadTransactions();
        } catch (error) {
            setError('Không thể hoàn thành phiếu. Vui lòng thử lại!');
        }
    };

    const handleConfirm = () => {
        setConfirmOpen(false);
        if (confirmType === 'complete') handleComplete(confirmRow);
        if (confirmType === 'cancel') handleCancel(confirmRow);
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
        { field: 'name', headerName: 'Mã phiếu bán', flex: 1 },
        { field: 'customerName', headerName: 'Khách hàng', flex: 1 },
        { field: 'storeName', headerName: 'Cửa hàng', flex: 1 },
        {
            field: 'saleDate',
            headerName: 'Thời gian',
            flex: 1,
            renderCell: (params) => {
                if (params.value) {
                    return new Date(params.value).toLocaleString('vi-VN');
                }
                return '';
            }
        },
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
                    'COMPLETE': { label: 'Đã hoàn thành', color: '#10b981' },
                    'DRAFT': { label: 'Nháp', color: '#6b7280' },
                    'CANCEL': { label: 'Đã hủy', color: '#ef4444' }
                };
                const status = statusMap[params.value] || { label: params.value, color: '#6b7280' };
                return (
                    <Chip
                        label={status.label}
                        style={{
                            backgroundColor: status.color,
                            color: '#fff',
                            fontWeight: 600
                        }}
                        size="small"
                    />
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
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Phiếu bán hàng</h2>
                <div className="flex gap-2">
                    <Link to="/sale/new">
                        <Button variant="contained" startIcon={<FaPlus />} className="!bg-green-600 hover:!bg-green-700">
                            Bán hàng
                        </Button>
                    </Link>
                    <Button variant="outlined" startIcon={<FaFileExport />} onClick={handleExportAll}>Xuất file</Button>
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
                            <FormControlLabel 
                                control={
                                    <Checkbox 
                                        checked={selectedMode === "custom"} 
                                        onChange={() => { 
                                            setSelectedMode("custom"); 
                                            setAnchorEl(null); 
                                            setShowDatePicker(true); 
                                        }} 
                                    />
                                } 
                                label={
                                    <div className="flex items-center justify-between w-full">
                                        <span>{customLabel}</span>
                                        <Button 
                                            size="small" 
                                            onClick={() => { 
                                                setSelectedMode("custom"); 
                                                setAnchorEl(null); 
                                                setShowDatePicker(!showDatePicker); 
                                            }}
                                        >
                                            📅
                                        </Button>
                                    </div>
                                } 
                            />
                        </div>
                        <Popover 
                            open={openPopover} 
                            anchorEl={anchorEl} 
                            onClose={() => setAnchorEl(null)} 
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }} 
                            transformOrigin={{ vertical: "top", horizontal: "left" }}
                        >
                            <div className="p-4 grid grid-cols-2 gap-2">
                                {Object.entries(labelMap).map(([key, label]) => (
                                    <Button key={key} size="small" variant="outlined" onClick={() => handlePresetChange(key)}>
                                        {label}
                                    </Button>
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
                                label="Nháp"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.complete}
                                        onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, complete: !prev.status.complete } }))}
                                    />
                                }
                                label="Đã hoàn thành"
                            />
                        </FormControl>
                    </div>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <span className="font-semibold">Khách hàng</span>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TextField 
                                fullWidth 
                                size="small" 
                                placeholder="Tìm khách hàng" 
                                value={filter.customer} 
                                onChange={(e) => setFilter({ ...filter, customer: e.target.value })} 
                            />
                        </AccordionDetails>
                    </Accordion>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <span className="font-semibold">Cửa hàng</span>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TextField 
                                fullWidth 
                                size="small" 
                                placeholder="Tìm cửa hàng" 
                                value={filter.store} 
                                onChange={(e) => setFilter({ ...filter, store: e.target.value })} 
                            />
                        </AccordionDetails>
                    </Accordion>

                    {showDatePicker && selectedMode === "custom" && (
                        <ClickAwayListener onClickAway={() => setShowDatePicker(false)}>
                            <div className="absolute z-50 top-0 left-full ml-4 bg-white p-4 rounded shadow-lg border w-max">
                                <DateRange 
                                    editableDateInputs={true} 
                                    onChange={(item) => handleCustomChange(item.selection)} 
                                    moveRangeOnFirstSelection={false} 
                                    ranges={customDate} 
                                    direction="horizontal" 
                                />
                                <div className="mt-2 text-right">
                                    <Button variant="contained" size="small" onClick={() => setShowDatePicker(false)}>
                                        Áp dụng
                                    </Button>
                                </div>
                            </div>
                        </ClickAwayListener>
                    )}
                </div>

                <div className="w-full lg:w-4/5">
                    <div className="mb-4 w-1/2">
                        <TextField 
                            label="Tìm kiếm khách hàng, cửa hàng..." 
                            size="small" 
                            fullWidth 
                            value={filter.search} 
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })} 
                        />
                    </div>
                    
                    {success && (
                        <Alert severity="success" className="mb-4">
                            {success}
                        </Alert>
                    )}
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
                                pageSize={10}
                                rowsPerPageOptions={[10]}
                                checkboxSelection
                                disableSelectionOnClick
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Chi tiết phiếu bán hàng */}
            <SaleDetailDialog
                open={openDetailDialog}
                onClose={() => {
                    setOpenDetailDialog(false);
                    setSelectedTransaction(null);
                    setUserDetails(null);
                    setCustomerDetails(null);
                }}
                transaction={selectedTransaction}
                formatCurrency={formatCurrency}
                onExport={() => handleExportDetail(selectedTransaction)}
                onExportPdf={() => handleExportPdf(selectedTransaction)}
                userDetails={userDetails}
                customerDetails={customerDetails}
                onCancel={() => handleCancel(selectedTransaction)}
                onComplete={() => handleComplete(selectedTransaction)}
            />

            <Menu
                anchorEl={actionAnchorEl}
                open={Boolean(actionAnchorEl)}
                onClose={handleActionClose}
                PaperProps={{
                    elevation: 4,
                    sx: {
                        borderRadius: 2,
                        minWidth: 160,
                        p: 0.5,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    },
                }}
                MenuListProps={{
                    sx: {
                        p: 0,
                    },
                }}
            >
                <MenuItem onClick={handleViewDetailMenu} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#e0f2fe' } }}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Xem chi tiết" />
                </MenuItem>
                <MenuItem onClick={() => {
                    handleExportDetail(actionRow);
                    handleActionClose();
                }} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#e0f2fe' } }}>
                    <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Xuất chi tiết" />
                </MenuItem>
                <MenuItem onClick={() => {
                    handleExportPdf(actionRow);
                    handleActionClose();
                }} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#e0f2fe' } }}>
                    <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Xuất PDF" />
                </MenuItem>
                {actionRow && actionRow.status !== 'COMPLETE' && actionRow.status !== 'CANCEL' && (
                    <MenuItem onClick={() => {
                        setConfirmType('complete');
                        setConfirmRow(actionRow);
                        setConfirmOpen(true);
                        handleActionClose();
                    }} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#e0ffe2' } }}>
                        <ListItemIcon><CheckIcon fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Hoàn thành" />
                    </MenuItem>
                )}
                <MenuItem onClick={() => {
                    setConfirmType('cancel');
                    setConfirmRow(actionRow);
                    setConfirmOpen(true);
                    handleActionClose();
                }} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#fee2e2' } }}>
                    <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText primary="Hủy phiếu" />
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ borderRadius: 1, '&:hover': { backgroundColor: '#fee2e2' } }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText primary="Xóa" />
                </MenuItem>
            </Menu>
            {/* Dialog xác nhận chuyên nghiệp cho menu ba chấm */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle className="flex items-center gap-2">
                    {confirmType === 'complete' ? (
                        <CheckCircleIcon color="success" fontSize="large" />
                    ) : (
                        <CancelIcon color="error" fontSize="large" />
                    )}
                    {confirmType === 'complete' ? 'Xác nhận hoàn thành phiếu' : 'Xác nhận hủy phiếu'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {confirmType === 'complete'
                            ? 'Bạn có chắc chắn muốn hoàn thành phiếu bán hàng này? Sau khi hoàn thành, phiếu sẽ không thể chỉnh sửa.'
                            : 'Bạn có chắc chắn muốn hủy phiếu bán hàng này? Thao tác này không thể hoàn tác.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} color="inherit">Huỷ</Button>
                    <Button onClick={handleConfirm} color={confirmType === 'complete' ? 'success' : 'error'} variant="contained">
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SaleTransactionPage; 