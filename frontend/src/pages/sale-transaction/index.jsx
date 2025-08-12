import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Menu, MenuItem, IconButton, Checkbox, TextField, Button, Select, FormControl, InputLabel, CircularProgress, Alert, ListItemIcon, ListItemText } from '@mui/material';
import { DataGrid, GridFooterContainer, GridPagination } from '@mui/x-data-grid';
import {
    FormControlLabel, FormLabel, Accordion, AccordionSummary,
    AccordionDetails, Popover, Dialog, DialogTitle, DialogContent,
    Table, TableHead, TableRow, TableCell, TableBody,
    Chip
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
import { getCustomerById } from "../../services/customerService";
import { userService } from "../../services/userService";
import { getStoreById, getAllStores } from "../../services/storeService";
import ReplyIcon from '@mui/icons-material/Reply';
import SaveIcon from '@mui/icons-material/Save';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import DialogActions from '@mui/material/DialogActions';
import { exportSaleTransactions, exportSaleTransactionDetail } from '../../utils/excelExport';
import SaleDetailDialog from '../../components/sale-transaction/SaleDetailDialog';
import { formatCurrency } from "../../utils/formatters";
import { customerService, getCustomers, getAllCustomers } from "../../services/customerService";
import { useAuth } from "../../contexts/AuthorizationContext";

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
    const { isAdmin } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Lấy query params
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
            waitingForApprove: false,
            complete: false,
            cancel: false,
        },
        customer: '',
        store: '',
        search: ''
    });

    const [customerOptions, setCustomerOptions] = useState([]);
    const [customerLoading, setCustomerLoading] = useState(false);

    const [storeOptions, setStoreOptions] = useState([]);
    const [storeLoading, setStoreLoading] = useState(false);

    useEffect(() => {
        const loadCustomers = async () => {
            setCustomerLoading(true);
            try {
                // Try to fetch a paged list first for performance
                const page = await customerService.getCustomersPaged({ page: 0, size: 100 });
                const list = page?.content || [];
                if (list.length > 0) {
                    setCustomerOptions(list.map(c => ({ id: c.id, name: c.name })));
                    return;
                }
                // Fallback to API returning all customers
                const all = await getAllCustomers();
                setCustomerOptions((all || []).map(c => ({ id: c.id, name: c.name })));
            } catch (e) {
                // Silent fail; keep empty list
                setCustomerOptions([]);
            } finally {
                setCustomerLoading(false);
            }
        };
        loadCustomers();
    }, []);

    useEffect(() => {
        const loadStores = async () => {
            if (!isAdmin()) return; // only admin sees/loads stores
            setStoreLoading(true);
            try {
                const stores = await getAllStores();
                setStoreOptions((stores || []).map(s => ({ id: s.id, name: s.storeName || s.name })));
            } catch (e) {
                setStoreOptions([]);
            } finally {
                setStoreLoading(false);
            }
        };
        loadStores();
    }, [isAdmin]);

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [actionRow, setActionRow] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState(null);
    const [confirmRow, setConfirmRow] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
        actionType: ''
    });

    // Pagination states
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const selectedCount = selectedIds.size;
    const currentPageIds = transactions.map(t => t.id);
    const allSelectedOnPage = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id));
    const someSelectedOnPage = currentPageIds.some(id => selectedIds.has(id)) && !allSelectedOnPage;
    const isRowSelected = (id) => selectedIds.has(id);
    const clearSelection = () => setSelectedIds(new Set());
    const toggleSelectOne = (id) => setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    const toggleSelectAllOnPage = () => setSelectedIds(prev => { const next = new Set(prev); if (allSelectedOnPage) { currentPageIds.forEach(id => next.delete(id)); } else { currentPageIds.forEach(id => next.add(id)); } return next; });

    // Bulk actions
    const handleBulkCancel = () => {
        const eligible = transactions.filter(t => selectedIds.has(t.id) && (t.status === 'DRAFT' || t.status === 'WAITING_FOR_APPROVE'));
        if (eligible.length === 0) {
            setError('Không có phiếu hợp lệ để hủy (chỉ DRAFT/WAITING_FOR_APPROVE).');
            return;
        }
        setConfirmDialog({
            open: true,
            title: `Xác nhận hủy ${eligible.length} phiếu`,
            message: `Bạn có chắc chắn muốn hủy ${eligible.length} phiếu đã chọn?`,
            onConfirm: async () => {
                setLoading(true);
                try {
                    const results = await Promise.allSettled(eligible.map(e => saleTransactionService.cancel(e.id)));
                    const succeeded = results.filter(r => r.status === 'fulfilled').length;
                    const failed = results.length - succeeded;
                    if (succeeded > 0) setSuccess(`Đã hủy ${succeeded}/${results.length} phiếu.`);
                    if (failed > 0) setError(`Không thể hủy ${failed} phiếu.`);
                    clearSelection();
                    await loadTransactions();
                } finally {
                    setLoading(false);
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            },
            actionType: 'cancel'
        });
    };

    const handleBulkDelete = () => {
        const eligible = transactions.filter(t => selectedIds.has(t.id));
        if (eligible.length === 0) {
            setError('Hãy chọn ít nhất một phiếu để xóa.');
            return;
        }
        setConfirmDialog({
            open: true,
            title: `Xác nhận xóa ${eligible.length} phiếu`,
            message: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa các phiếu đã chọn?',
            onConfirm: async () => {
                setLoading(true);
                try {
                    const results = await Promise.allSettled(eligible.map(e => saleTransactionService.softDelete(e.id)));
                    const succeeded = results.filter(r => r.status === 'fulfilled').length;
                    const failed = results.length - succeeded;
                    if (succeeded > 0) setSuccess(`Đã xóa ${succeeded}/${results.length} phiếu.`);
                    if (failed > 0) setError(`Không thể xóa ${failed} phiếu.`);
                    clearSelection();
                    await loadTransactions();
                } finally {
                    setLoading(false);
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            },
            actionType: 'delete'
        });
    };

    // Filter sidebar states
    const [showFilter, setShowFilter] = useState(true);
    const [showFilterBtn, setShowFilterBtn] = useState(false);
    const mainAreaRef = useRef(null);

    // Kiểm tra URL params để tự động mở dialog chi tiết
    useEffect(() => {
        const viewParam = searchParams.get('view');
        const idByStocktake = searchParams.get('id_by_stocktake');
        if (idByStocktake) {
            // Thử tìm PCB theo stocktakeId sau khi load danh sách
            (async () => {
                try {
                    // Tải trang đầu để tìm nhanh
                    const data = await saleTransactionService.listPaged({ page: 0, size: 50 });
                    const list = Array.isArray(data) ? data : (data?.content || []);
                    const pcb = list.find(r => (r.name || '').startsWith('PCB') && (r.stocktakeId === Number(idByStocktake)));
                    if (pcb) {
                        await handleAutoOpenDetail(pcb.id);
                        return;
                    }
                    // Fallback: thử gọi getById theo ID từ filter khác nếu BE/FE khác cấu trúc
                    // Ở đây bỏ qua để tránh gọi sai; người dùng vẫn ở trang danh sách
                } catch (e) {
                    // ignore
                }
            })();
        } else if (id && viewParam === 'detail') {
            // Tự động mở dialog chi tiết cho transaction có ID này
            handleAutoOpenDetail(parseInt(id));
        }
    }, [id, searchParams]);

    // Hàm tự động mở dialog chi tiết
    const handleAutoOpenDetail = async (transactionId) => {
        try {
            const transaction = await saleTransactionService.getById(transactionId);
            setSelectedTransaction(transaction);
            
            // Fetch thông tin customer
            if (transaction.customerId) {
                try {
                    const customer = await getCustomerById(transaction.customerId);
                    setCustomerDetails(customer);
                } catch (error) {
                    setCustomerDetails(null);
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
            
            setOpenDetailDialog(true);
        } catch (error) {
            console.error("Lỗi khi tải chi tiết phiếu bán:", error);
            setError('Không thể tải chi tiết phiếu bán');
        }
    };

    const loadTransactions = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            // Build query parameters
            const queryParams = {
                page: page,
                size: pageSize,
                ...params
            };

            // Add filter parameters
            if (filter.search) {
                queryParams.name = filter.search;
                queryParams.customerName = filter.search;
                queryParams.storeName = filter.search;
            }

            // Apply customer filter explicitly if selected
            if (filter.customer) {
                // If we have an id-based select, we can still filter by name on backend; find the option name
                const selected = customerOptions.find(c => `${c.id}` === `${filter.customer}` || c.name === filter.customer);
                queryParams.customerName = selected ? selected.name : filter.customer;
            }

            if (filter.store) {
                // Only admins set store filter; map id -> name
                const selectedStore = storeOptions.find(s => `${s.id}` === `${filter.store}` || s.name === filter.store);
                queryParams.storeName = selectedStore ? selectedStore.name : filter.store;
            }

            // Add status filters
            const statusKeys = getStatusKeys();
            if (statusKeys.length > 0) {
                queryParams.status = statusKeys.join(',');
            }

            // Add date range (use local datetime strings, no timezone)
            const toLocalString = (d) => {
                const pad = (n) => String(n).padStart(2, '0');
                const yyyy = d.getFullYear();
                const mm = pad(d.getMonth() + 1);
                const dd = pad(d.getDate());
                const HH = pad(d.getHours());
                const MM = pad(d.getMinutes());
                const SS = pad(d.getSeconds());
                return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`;
            };
            if (customDate && customDate[0]) {
                const start = customDate[0].startDate;
                const end = customDate[0].endDate;
                const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
                const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
                queryParams.fromDate = toLocalString(startOfDay);
                queryParams.toDate = toLocalString(endOfDay);
            }

            // Loại bỏ phiếu Cân Bằng kho
            queryParams.note = '';

            console.log('API page:', page, 'pageSize:', pageSize, 'data:', queryParams);
            const data = await saleTransactionService.listPaged(queryParams);
            let transactions = Array.isArray(data) ? data : (data?.content || []);
            // Lọc bỏ phiếu Cân Bằng kho (chỉ theo Note), vẫn hiển thị các phiếu bán cho 'Khách lẻ'
            transactions = transactions.filter(row => {
                const note = (row.saleTransactionNote || '').toLowerCase();
                return !note.includes('cân bằng kho');
            });
            setTransactions(transactions);
            setTotal(data?.totalElements || transactions.length);
        } catch (err) {
            console.error('Error loading transactions:', err);
            setError('Không thể tải danh sách phiếu bán hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, [page, pageSize, JSON.stringify(filter), JSON.stringify(customDate)]);

    useEffect(() => {
        setPage(0);
    }, [filter, customDate]);

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
        if (filter.status.waitingForApprove) keys.push('WAITING_FOR_APPROVE');
        if (filter.status.complete) keys.push('COMPLETE');
        if (filter.status.cancel) keys.push('CANCEL');
        return keys;
    };

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
            const detailedTransaction = await saleTransactionService.getById(row.id);

            if (!detailedTransaction.customerId && row.customerId) {
                detailedTransaction.customerId = row.customerId;
            }
            if (!detailedTransaction.storeId && row.storeId) {
                detailedTransaction.storeId = row.storeId;
            }

            setSelectedTransaction(detailedTransaction);
            
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
            setSelectedTransaction(row);
            setUserDetails(null);
            setCustomerDetails(null);
            setOpenDetailDialog(true);
        }
    };

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

    const handleOpenTransaction = async () => {
        if (selectedTransaction?.status === 'DRAFT') {
            try {
                await saleTransactionService.openTransaction(selectedTransaction.id);
                setSuccess('Mở phiếu thành công!');
                loadTransactions();
            } catch (err) {
                setError('Không thể mở phiếu. Vui lòng thử lại!');
            }
        }
    };

    const handleCloseTransaction = async () => {
        if (selectedTransaction?.status === 'WAITING_FOR_APPROVE') {
            try {
                await saleTransactionService.closeTransaction(selectedTransaction.id);
                setSuccess('Đóng phiếu thành công!');
                loadTransactions();
            } catch (err) {
                setError('Không thể đóng phiếu. Vui lòng thử lại!');
            }
        }
    };

    const handleCancelTransaction = async () => {
        if (selectedTransaction?.status === 'DRAFT' || selectedTransaction?.status === 'WAITING_FOR_APPROVE') {
            try {
                await saleTransactionService.cancel(selectedTransaction.id);
                setSuccess('Hủy phiếu thành công!');
                setSelectedTransaction(null);
                setUserDetails(null);
                setCustomerDetails(null);
                loadTransactions();
            } catch (err) {
                setError('Không thể hủy phiếu. Vui lòng thử lại!');
            }
        }
    };

    const handleConfirm = () => {
        setConfirmOpen(false);
        if (confirmType === 'complete') handleComplete(confirmRow);
        if (confirmType === 'cancel') handleCancel(confirmRow);
    };

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
        handleActionClose();
    };

    const handleDelete = () => {
        handleActionClose();
    };

    const handleOpenTransactionMenu = async () => {
        if (actionRow?.status === 'DRAFT') {
            setSelectedTransaction(actionRow);
            setConfirmDialog({
                open: true,
                title: 'Xác nhận mở phiếu',
                message: `Bạn có chắc chắn muốn mở phiếu bán hàng "${actionRow.name}" và chuyển sang trạng thái chờ phê duyệt?`,
                onConfirm: async () => {
                    try {
                        await saleTransactionService.openTransaction(actionRow.id);
                        loadTransactions();
                        setSuccess('Mở phiếu thành công!');
                    } catch (err) {
                        setError('Không thể mở phiếu. Vui lòng thử lại!');
                    }
                    setConfirmDialog({ ...confirmDialog, open: false });
                },
                actionType: 'open'
            });
        }
        handleActionClose();
    };

    const handleCloseTransactionMenu = async () => {
        if (actionRow?.status === 'WAITING_FOR_APPROVE') {
            setSelectedTransaction(actionRow);
            setConfirmDialog({
                open: true,
                title: 'Xác nhận đóng phiếu',
                message: `Bạn có chắc chắn muốn đóng phiếu bán hàng "${actionRow.name}" và quay về trạng thái nháp?`,
                onConfirm: async () => {
                    try {
                        await saleTransactionService.closeTransaction(actionRow.id);
                        loadTransactions();
                        setSuccess('Đóng phiếu thành công!');
                    } catch (err) {
                        setError('Không thể đóng phiếu. Vui lòng thử lại!');
                    }
                    setConfirmDialog({ ...confirmDialog, open: false });
                },
                actionType: 'close'
            });
        }
        handleActionClose();
    };

    const handleCompleteTransactionMenu = async () => {
        if (actionRow?.status === 'WAITING_FOR_APPROVE') {
            setSelectedTransaction(actionRow);
            setConfirmDialog({
                open: true,
                title: 'Xác nhận hoàn thành phiếu',
                message: `Bạn có chắc chắn muốn hoàn thành phiếu bán hàng "${actionRow.name}"? Hành động này sẽ cập nhật tồn kho và tạo ghi chú nợ nếu cần.`,
                onConfirm: async () => {
                    try {
                        await saleTransactionService.complete(actionRow.id);
                        loadTransactions();
                        setSuccess('Hoàn thành phiếu thành công!');
                    } catch (err) {
                        setError('Không thể hoàn thành phiếu. Vui lòng thử lại!');
                    }
                    setConfirmDialog({ ...confirmDialog, open: false });
                },
                actionType: 'complete'
            });
        }
        handleActionClose();
    };

    const handleCancelTransactionMenu = async () => {
        if (actionRow?.status === 'DRAFT' || actionRow?.status === 'WAITING_FOR_APPROVE') {
            setSelectedTransaction(actionRow);
            setConfirmDialog({
                open: true,
                title: 'Xác nhận hủy phiếu',
                message: `Bạn có chắc chắn muốn hủy phiếu bán hàng "${actionRow.name}"?`,
                onConfirm: async () => {
                    try {
                        await saleTransactionService.cancel(actionRow.id);
                        loadTransactions();
                        setSuccess('Hủy phiếu thành công!');
                    } catch (err) {
                        setError('Không thể hủy phiếu. Vui lòng thử lại!');
                    }
                    setConfirmDialog({ ...confirmDialog, open: false });
                },
                actionType: 'cancel'
            });
        }
        handleActionClose();
    };

    const handleExportAll = () => {
        try {
            exportSaleTransactions(transactions);
        } catch (error) {
            console.error('Lỗi khi xuất file:', error);
            alert('Không thể xuất file. Vui lòng thử lại!');
        }
    };

    const handleExportDetail = (transaction = null) => {
        try {
            const targetTransaction = transaction || selectedTransaction;
            if (targetTransaction) {
                let details = [];
                if (targetTransaction.detail) {
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETE':
                return { bg: '#10b981', text: '#fff' };
            case 'DRAFT':
                return { bg: '#6b7280', text: '#fff' };
            case 'WAITING_FOR_APPROVE':
                return { bg: '#f59e0b', text: '#fff' };
            case 'CANCEL':
                return { bg: '#ef4444', text: '#fff' };
            default:
                return { bg: '#6b7280', text: '#fff' };
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'COMPLETE':
                return 'Đã hoàn thành';
            case 'DRAFT':
                return 'Nháp';
            case 'WAITING_FOR_APPROVE':
                return 'Chờ phê duyệt';
            case 'CANCEL':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    // Custom CSS for table
    const tableStyles = {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      minWidth: 1100,
      background: '#fff',
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 15,
    };
    const thStyles = {
      background: '#dbeafe', // xanh nhạt đậm hơn
      fontWeight: 700,
      padding: '8px 10px',
      borderBottom: '1px solid #dbeafe',
      whiteSpace: 'nowrap',
      textAlign: 'left',
      color: '#222',
      fontSize: 15,
      height: 38,
      fontFamily: 'Roboto, Arial, sans-serif',
      position: 'sticky',
      top: 0,
      zIndex: 2,
    };
    const tdStyles = {
      padding: '8px 10px',
      borderBottom: '1px solid #f0f0f0',
      background: '#fff',
      whiteSpace: 'nowrap',
      fontSize: 15,
      color: '#222',
      height: 38,
      fontFamily: 'Roboto, Arial, sans-serif',
    };
    const zebra = idx => ({ background: idx % 2 === 0 ? '#f8fafc' : '#fff' });

    function CustomFooter({ page, pageSize, total }) {
        const from = total === 0 ? 0 : page * pageSize + 1;
        const to = Math.min((page + 1) * pageSize, total);
        const totalPages = Math.ceil(total / pageSize);
                return (
            <GridFooterContainer>
                <div style={{ flex: 1, paddingLeft: 16 }}>
                    {`Hiển thị ${from}-${to} trên tổng số ${total} | Trang ${total === 0 ? 0 : page + 1}/${totalPages}`}
                </div>
                <GridPagination />
            </GridFooterContainer>
        );
    }

    // CSS for filter hide button
    const filterHideBtnStyle = {
        position: 'absolute',
        right: -16,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        background: '#fff',
        border: '2px solid #3b82f6',
        borderRadius: '50%',
        padding: 0,
        width: 36,
        height: 36,
        cursor: 'pointer',
        boxShadow: '0 2px 8px #b6d4fe, 2px 0 8px #e5e7eb',
        fontSize: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#2563eb',
        opacity: 0,
        transition: 'opacity 0.2s, background 0.2s, border 0.2s, transform 0.2s',
    };

    const filterSidebarStyle = {
        minWidth: 240,
        maxWidth: 320,
        transition: 'all 0.2s',
        position: 'relative',
    };

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
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Phiếu bán hàng</h2>
                <div className="flex gap-2">
                    <Link to="/sale/new">
                        <Button variant="contained" startIcon={<AddIcon />} className="!bg-green-600 hover:!bg-green-700">
                            Bán hàng
                        </Button>
                    </Link>
                    <Button variant="outlined" startIcon={<TableChartIcon />} onClick={handleExportAll}>
                        Xuất file
                    </Button>
                </div>
            </div>

            <div
                className="flex flex-col lg:flex-row gap-3 mb-4"
                ref={mainAreaRef}
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowFilterBtn(true)}
                onMouseLeave={() => setShowFilterBtn(false)}
            >
                {/* Nút hiện filter khi đang ẩn */}
                {!showFilter && showFilterBtn && (
                  <button
                    style={{
                      position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
                      background: '#fff', border: '2px solid #3b82f6', borderRadius: '50%', padding: 0, width: 36, height: 36,
                      cursor: 'pointer', boxShadow: '0 2px 8px #b6d4fe, 2px 0 8px #e5e7eb', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb',
                      opacity: 1, transition: 'opacity 0.2s, background 0.2s, border 0.2s, transform 0.2s',
                    }}
                    onClick={() => setShowFilter(true)}
                    title='Hiện bộ lọc'
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>
                  </button>
                )}
                {/* Filter sidebar */}
                <div
                  className={showFilter ? "w-full lg:w-1/5 relative group" : "relative group"}
                  style={{
                    ...filterSidebarStyle,
                    width: showFilter ? undefined : 0,
                    minWidth: showFilter ? 240 : 0,
                    maxWidth: showFilter ? 320 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(.4,2,.6,1)',
                    paddingRight: showFilter ? undefined : 0,
                  }}
                >
                  {showFilter && (
                    <>
                      {/* Nút ẩn filter chỉ hiện khi hover filter sidebar và không mở dialog detail */}
                      {!openDetailDialog && (
                        <button
                          style={{ ...filterHideBtnStyle, opacity: 0 }}
                          className="filter-hide-btn"
                          onClick={() => setShowFilter(false)}
                          title='Ẩn bộ lọc'
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                      )}
                      <style>{`
                        .group:hover .filter-hide-btn { opacity: 1 !important; }
                        .filter-hide-btn:hover {
                          background: #e0edff !important;
                          border-color: #2563eb !important;
                          color: #1d4ed8 !important;
                          transform: scale(1.08);
                          box-shadow: 0 4px 16px #b6d4fe;
                        }
                      `}</style>
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
                                        checked={filter.status.waitingForApprove}
                                        onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, waitingForApprove: !prev.status.waitingForApprove } }))}
                                    />
                                }
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({ ...prev, status: { ...prev.status, waitingForApprove: !prev.status.waitingForApprove } }))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Chờ phê duyệt
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
                                        Đã hủy
                                    </span>
                                }
                            />
                        </FormControl>
                    </div>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <span className="font-semibold">Khách hàng</span>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormControl fullWidth size="small">
                                <InputLabel id="customer-select-label">Chọn khách hàng</InputLabel>
                                <Select
                                    labelId="customer-select-label"
                                    label="Chọn khách hàng"
                                    value={filter.customer}
                                    onChange={(e) => setFilter({ ...filter, customer: e.target.value })}
                                    disabled={customerLoading}
                                >
                                    <MenuItem value=""><em>Tất cả</em></MenuItem>
                                    {customerOptions.map(opt => (
                                        <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </AccordionDetails>
                    </Accordion>

                    {isAdmin() && (
                        <Accordion className="bg-white rounded shadow mb-4 w-full">
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <span className="font-semibold">Cửa hàng</span>
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="store-select-label">Chọn cửa hàng</InputLabel>
                                    <Select
                                        labelId="store-select-label"
                                        label="Chọn cửa hàng"
                                        value={filter.store}
                                        onChange={(e) => setFilter({ ...filter, store: e.target.value })}
                                        disabled={storeLoading}
                                    >
                                        <MenuItem value=""><em>Tất cả</em></MenuItem>
                                        {storeOptions.map(opt => (
                                            <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </AccordionDetails>
                        </Accordion>
                    )}

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
                    </>
                    )}
                </div>

                {/* Main content area */}
                <div className={showFilter ? "w-full lg:w-4/5" : "w-full"} style={{ transition: 'all 0.4s cubic-bezier(.4,2,.6,1)' }}>
                    <div className="mb-4 w-1/2">
                        <TextField 
                            label="Tìm kiếm khách hàng, cửa hàng..." 
                            size="small" 
                            fullWidth 
                            value={filter.search} 
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })} 
                        />
                    </div>
                    
                    {selectedCount > 0 && (
                        <>
                            {(() => {
                                const eligibleCancelCount = transactions.filter(t => selectedIds.has(t.id) && (t.status === 'DRAFT' || t.status === 'WAITING_FOR_APPROVE')).length;
                                const ineligibleCancelCount = selectedCount - eligibleCancelCount; // includes COMPLETE and others
                                return (
                                    <div
                                        className="bulk-toolbar"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: 6,
                                            background: 'linear-gradient(180deg, #f8fbff 0%, #eef2ff 100%)',
                                            borderRadius: 12,
                                            marginBottom: 8,
                                            boxShadow: '0 1px 6px rgba(59,130,246,0.08)',
                                            border: '1px solid #dbeafe',
                                            width: 'fit-content',
                                            fontFamily: 'Roboto, Arial, sans-serif',
                                            fontSize: 14
                                        }}
                                    >
                                        <span style={{ color: '#1e40af' }}>Đã chọn {selectedCount}</span>
                                        <span style={{ width: 1, height: 18, background: '#dbeafe' }} />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={clearSelection}
                                            className="bulk-btn"
                                            sx={{ minWidth: 28, borderRadius: 1, padding: '2px 8px' }}
                                            aria-label="Bỏ chọn"
                                        >
                                            <CloseIcon fontSize="small" />
                                            <span className="label">Bỏ chọn</span>
                                        </Button>
                                        {eligibleCancelCount > 0 && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={handleBulkCancel}
                                                className="bulk-btn"
                                                sx={{ minWidth: 28, borderRadius: 1, padding: '2px 8px' }}
                                                aria-label="Hủy"
                                            >
                                                <CancelIcon fontSize="small" />
                                                <span className="label">Hủy</span>
                                            </Button>
                                        )}
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={handleBulkDelete}
                                            className="bulk-btn"
                                            sx={{ minWidth: 28, borderRadius: 1, padding: '2px 8px' }}
                                            aria-label="Xóa"
                                        >
                                            <DeleteIcon fontSize="small" />
                                            <span className="label">Xóa</span>
                                        </Button>
                                        {ineligibleCancelCount > 0 && eligibleCancelCount === 0 && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6b7280', marginLeft: 6 }}>
                                                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                                                <span>Phiếu đã hoàn thành không thể hủy</span>
                                            </span>
                                        )}
                                        {ineligibleCancelCount > 0 && eligibleCancelCount > 0 && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6b7280', marginLeft: 6 }}>
                                                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                                                <span>Có {ineligibleCancelCount} phiếu đã hoàn thành không thể hủy</span>
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}
                            <style>{`
                                .bulk-toolbar .bulk-btn { display: inline-flex; align-items: center; }
                                .bulk-toolbar .bulk-btn .label {
                                  max-width: 0;
                                  opacity: 0;
                                  overflow: hidden;
                                  margin-left: 0;
                                  transition: max-width .2s ease, opacity .2s ease, margin-left .2s ease;
                                  white-space: nowrap;
                                }
                                .bulk-toolbar .bulk-btn:hover .label {
                                  max-width: 120px;
                                  opacity: 1;
                                  margin-left: 6px;
                                }
                            `}</style>
                        </>
                    )}

                    {error && (
                        <Alert severity="error" className="mb-4">
                            {error}
                        </Alert>
                    )}
                    
                    <div style={{ height: 500, overflowY: 'auto', overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <CircularProgress />
                            </div>
                        ) : (
                            <table style={tableStyles}>
                                <colgroup>
                                    {/* Checkbox */}
                                    <col style={{ width: 40 }} />
                                    {/* STT */}
                                    <col style={{ width: 60 }} />
                                    {/* Mã phiếu bán */}
                                    <col style={{ width: 160 }} />
                                    {/* Khách hàng */}
                                    <col style={{ width: 160 }} />
                                    {/* Cửa hàng */}
                                    <col style={{ width: 150 }} />
                                    {/* Thời gian */}
                                    <col style={{ width: 170 }} />
                                    {/* Tổng tiền */}
                                    <col style={{ width: 130 }} />
                                    {/* Đã thanh toán */}
                                    <col style={{ width: 130 }} />
                                    {/* Trạng thái */}
                                    <col style={{ width: 120 }} />
                                    {/* Hành động */}
                                    <col style={{ width: 80 }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={thStyles}>
                                            <Checkbox
                                                checked={allSelectedOnPage}
                                                indeterminate={someSelectedOnPage}
                                                onChange={toggleSelectAllOnPage}
                                            />
                                        </th>
                                        <th style={thStyles}>STT</th>
                                        <th style={thStyles}>Mã phiếu bán</th>
                                        <th style={thStyles}>Khách hàng</th>
                                        <th style={thStyles}>Cửa hàng</th>
                                        <th style={thStyles}>Thời gian</th>
                                        <th style={thStyles}>Tổng tiền</th>
                                        <th style={thStyles}>Đã thanh toán</th>
                                        <th style={thStyles}>Trạng thái</th>
                                        <th style={thStyles}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan={10} style={{ textAlign: 'center', ...tdStyles }}>Không có dữ liệu</td></tr>
                                    ) : transactions.map((row, idx) => {
                                        const paid = row.paidAmount || 0;
                                        const total = row.totalAmount || 0;
                                        let paidColor = '#6b7280';
                                        if (paid < total) paidColor = '#ef4444';
                                        else if (paid === total) paidColor = '#10b981';
                                        else if (paid > total) paidColor = '#f59e42';

                                        return (
                                            <tr key={row.id} style={zebra(idx)}>
                                                <td style={tdStyles}><Checkbox size="small" checked={isRowSelected(row.id)} onChange={() => toggleSelectOne(row.id)} /></td>
                                                <td style={tdStyles}>{page * pageSize + idx + 1}</td>
                                                <td style={tdStyles}>{row.name}</td>
                                                <td style={tdStyles}>{row.customerName}</td>
                                                <td style={tdStyles}>{row.storeName}</td>
                                                <td style={tdStyles}>{row.saleDate ? new Date(row.saleDate).toLocaleString('vi-VN') : ''}</td>
                                                <td style={tdStyles}>{row.totalAmount ? row.totalAmount.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ'}</td>
                                                <td style={{ ...tdStyles, color: paidColor }}>{paid.toLocaleString('vi-VN') + ' VNĐ'}</td>
                                                <td style={tdStyles}>
                                                    <span style={{
                                                      background:
                                                        row.status === 'COMPLETE' ? '#e6f4ea' :
                                                        row.status === 'CANCEL' ? '#fde8e8' :
                                                        row.status === 'DRAFT' ? '#f3f4f6' :
                                                        row.status === 'WAITING_FOR_APPROVE' ? '#fff7e0' : '#fff7e0',
                                                      color:
                                                        row.status === 'COMPLETE' ? '#34a853' :
                                                        row.status === 'CANCEL' ? '#ef4444' :
                                                        row.status === 'DRAFT' ? '#6b7280' :
                                                        row.status === 'WAITING_FOR_APPROVE' ? '#f59e0b' : '#f59e0b',
                                                      borderRadius: 6,
                                                      padding: '2px 10px',
                                                      fontWeight: 400,
                                                      fontSize: 14,
                                                      display: 'inline-block',
                                                      minWidth: 90,
                                                      textAlign: 'center'
                                                    }}>
                                                      {getStatusLabel(row.status)}
                                                    </span>
                                                </td>
                                                <td style={tdStyles}>
                                                    <IconButton size="small" onClick={e => { setActionAnchorEl(e.currentTarget); setActionRow(row); }}><MoreHorizIcon fontSize="small" /></IconButton>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Pagination controls dưới bảng */}
                    <div style={{
                        display: 'flex', alignItems: 'center', padding: 6, background: '#fafbfc',
                        borderRadius: 12, marginTop: 12, fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14, boxShadow: '0 1px 4px #e5e7eb',
                        border: '1px solid #e5e7eb', width: 'fit-content', minWidth: 420
                    }}>
                        <span style={{ marginRight: 6, fontFamily: 'Roboto, Arial, sans-serif' }}>Hiển thị</span>
                        <FormControl size="small" style={{ minWidth: 80, marginRight: 6, fontFamily: 'Roboto, Arial, sans-serif' }}>
                            <Select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                                style={{
                                    borderRadius: 8,
                                    fontFamily: 'Roboto, Arial, sans-serif',
                                    fontSize: 14,
                                    height: 32,
                                    boxShadow: '0 1px 2px #e5e7eb',
                                    border: '1px solid #e5e7eb',
                                    padding: '2px 8px',
                                }}
                                MenuProps={{ PaperProps: { style: { fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14 } } }}
                            >
                                {[15, 25, 50, 100].map(opt => (
                                    <MenuItem key={opt} value={opt} style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14 }}>{opt} dòng</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button size="small" variant="outlined" style={{ minWidth: 28, borderRadius: 8, margin: '0 2px', padding: 0 }} disabled={page === 0} onClick={() => setPage(0)}>{'|<'}</Button>
                        <Button size="small" variant="outlined" style={{ minWidth: 28, borderRadius: 8, margin: '0 2px', padding: 0 }} disabled={page === 0} onClick={() => setPage(page - 1)}>{'<'}</Button>
                        <input
                            type="number"
                            min={1}
                            max={Math.ceil(total / pageSize)}
                            value={page + 1}
                            onChange={e => {
                                let val = Number(e.target.value) - 1;
                                if (val < 0) val = 0;
                                if (val >= Math.ceil(total / pageSize)) val = Math.ceil(total / pageSize) - 1;
                                setPage(val);
                            }}
                            style={{
                                width: 32, textAlign: 'center', margin: '0 4px', height: 28, border: '1px solid #e0e0e0',
                                borderRadius: 8, fontSize: 14, fontFamily: 'Roboto, Arial, sans-serif', boxShadow: '0 1px 2px #e5e7eb', outline: 'none'
                            }}
                        />
                        <Button size="small" variant="outlined" style={{ minWidth: 28, borderRadius: 8, margin: '0 2px', padding: 0 }} disabled={page + 1 >= Math.ceil(total / pageSize)} onClick={() => setPage(page + 1)}>{'>'}</Button>
                        <Button size="small" variant="outlined" style={{ minWidth: 28, borderRadius: 8, margin: '0 2px', padding: 0 }} disabled={page + 1 >= Math.ceil(total / pageSize)} onClick={() => setPage(Math.ceil(total / pageSize) - 1)}>{'>|'}</Button>
                        <span style={{ marginLeft: 8, fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14 }}>
                            {`${page * pageSize + 1} - ${Math.min((page + 1) * pageSize, total)} trong ${total} giao dịch`}
                        </span>
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
                    if (id) {
                        navigate('/sale');
                    }
                }}
                transaction={selectedTransaction}
                formatCurrency={formatCurrency}
                onExport={() => handleExportDetail(selectedTransaction)}
                onExportPdf={() => handleExportPdf(selectedTransaction)}
                userDetails={userDetails}
                customerDetails={customerDetails}
                onCancel={() => handleCancel(selectedTransaction)}
                onComplete={() => handleComplete(selectedTransaction)}
                onOpenTransaction={handleOpenTransaction}
                onCloseTransaction={handleCloseTransaction}
                loading={loading}
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
                {/* Hiển thị nút "Mở phiếu" chỉ khi trạng thái là DRAFT */}
                {actionRow?.status === 'DRAFT' && (
                    <MenuItem onClick={handleOpenTransactionMenu} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#e0f2fe' } }}>
                        <ListItemIcon><LockOpenIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Mở phiếu" />
                    </MenuItem>
                )}
                
                {/* Hiển thị nút "Đóng phiếu" chỉ khi trạng thái là WAITING_FOR_APPROVE */}
                {actionRow?.status === 'WAITING_FOR_APPROVE' && (
                    <MenuItem onClick={handleCloseTransactionMenu} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#e0f2fe' } }}>
                        <ListItemIcon><SaveIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Đóng phiếu" />
                    </MenuItem>
                )}
                
                {/* Hiển thị nút "Hoàn thành" chỉ khi trạng thái là WAITING_FOR_APPROVE */}
                {actionRow?.status === 'WAITING_FOR_APPROVE' && (
                    <MenuItem onClick={handleCompleteTransactionMenu} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#e0ffe2' } }}>
                        <ListItemIcon><CheckIcon fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Hoàn thành" />
                    </MenuItem>
                )}
                
                {/* Hiển thị nút "Hủy phiếu" cho các trạng thái DRAFT và WAITING_FOR_APPROVE */}
                {(actionRow?.status === 'DRAFT' || actionRow?.status === 'WAITING_FOR_APPROVE') && (
                    <MenuItem onClick={handleCancelTransactionMenu} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { backgroundColor: '#fee2e2' } }}>
                        <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText primary="Hủy phiếu" />
                    </MenuItem>
                )}
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
                <MenuItem onClick={handleDelete} sx={{ borderRadius: 1, '&:hover': { backgroundColor: '#fee2e2' } }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText primary="Xóa" />
                </MenuItem>
            </Menu>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle className="flex items-center gap-2">
                    {confirmType === 'complete' ? (
                        <CheckIcon color="success" fontSize="large" />
                    ) : (
                        <CancelIcon color="error" fontSize="large" />
                    )}
                    {confirmType === 'complete' ? 'Xác nhận hoàn thành phiếu' : 'Xác nhận hủy phiếu'}
                </DialogTitle>
                <DialogContent>
                    <div>
                        {confirmType === 'complete'
                            ? 'Bạn có chắc chắn muốn hoàn thành phiếu bán hàng này? Sau khi hoàn thành, phiếu sẽ không thể chỉnh sửa.'
                            : 'Bạn có chắc chắn muốn hủy phiếu bán hàng này? Thao tác này không thể hoàn tác.'}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} color="inherit">Huỷ</Button>
                    <Button onClick={handleConfirm} color={confirmType === 'complete' ? 'success' : 'error'} variant="contained">
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog xác nhận cho các action WAITING_FOR_APPROVE */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    {(() => {
                        switch (confirmDialog.actionType) {
                            case 'cancel':
                                return <CancelIcon color="error" />;
                            case 'open':
                                return <LockOpenIcon color="primary" />;
                            case 'close':
                                return <SaveIcon color="warning" />;
                            case 'complete':
                                return <CheckIcon color="success" />;
                            case 'delete':
                                return <DeleteIcon color="error" />;
                            default:
                                return <CancelIcon />;
                        }
                    })()}
                    {confirmDialog.title}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <div className="text-gray-700">
                        {confirmDialog.message}
                    </div>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                        color="inherit"
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={confirmDialog.onConfirm}
                        color={confirmDialog.actionType === 'complete' ? 'success' : 
                               confirmDialog.actionType === 'open' ? 'primary' :
                               confirmDialog.actionType === 'close' ? 'warning' : 'error'}
                        variant="contained"
                    >
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SaleTransactionPage; 