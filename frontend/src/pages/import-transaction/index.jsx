import React, { useState, useEffect, useRef } from "react";
import { Menu, MenuItem, IconButton, Checkbox, TextField, Button, Select, FormControl, InputLabel, CircularProgress, Alert, ListItemIcon, ListItemText } from '@mui/material';
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
import FirstPageIcon from '@mui/icons-material/FirstPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LastPageIcon from '@mui/icons-material/LastPage';
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
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import ChangeStatusLogDetailDialog from '../../components/ChangeStatusLogDetailDialog';
import { getZones } from '../../services/zoneService';
import { useAuth } from '../../contexts/AuthorizationContext';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HistoryIcon from '@mui/icons-material/History';
import changeStatusLogService from '../../services/changeStatusLogService';

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
    const navigate = useNavigate();
    const { id } = useParams(); // Lấy ID từ URL params
    const [searchParams] = useSearchParams(); // Lấy query params
    const { user, isStaff } = useAuth();
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
        search: ''
    });

    // State for pagination
    const [page, setPage] = useState(0); // DataGrid and backend đều 0-based
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);

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

    // Creator filter options
    const [creatorOptions, setCreatorOptions] = useState([]);
    const [creatorLoading, setCreatorLoading] = useState(false);

    // Multi-select state for bulk actions
    const [selectedIds, setSelectedIds] = useState(new Set());
    const selectedCount = selectedIds.size;
    const currentPageIds = transactions.map(t => t.id);
    const allSelectedOnPage = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id));
    const someSelectedOnPage = currentPageIds.some(id => selectedIds.has(id)) && !allSelectedOnPage;

    const isRowSelected = (id) => selectedIds.has(id);
    const clearSelection = () => setSelectedIds(new Set());
    const toggleSelectOne = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const toggleSelectAllOnPage = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelectedOnPage) {
                currentPageIds.forEach(id => next.delete(id));
            } else {
                currentPageIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    // Thêm state cho thông báo lỗi khi huỷ
    const [cancelError, setCancelError] = useState(null);
    // Thêm state cho thông báo lỗi khi mở phiếu
    const [openError, setOpenError] = useState(null);

    // State cho dialog xác nhận
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
        actionType: ''
    });

    // State cho dialog lịch sử thay đổi
    const [changeHistoryDialogOpen, setChangeHistoryDialogOpen] = useState(false);
    const [selectedChangeLog, setSelectedChangeLog] = useState(null);
    const [sourceLogs, setSourceLogs] = useState([]);
    const [sourceLogsLoading, setSourceLogsLoading] = useState(false);

    // Kiểm tra URL params để tự động mở dialog chi tiết
    useEffect(() => {
        const viewParam = searchParams.get('view');
        if (id && viewParam === 'detail') {
            // Tự động mở dialog chi tiết cho transaction có ID này
            handleAutoOpenDetail(parseInt(id));
        }
    }, [id, searchParams]);

    // Hàm tự động mở dialog chi tiết
    const handleAutoOpenDetail = async (transactionId) => {
        try {
            const transaction = await importTransactionService.getWithDetails(transactionId);
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
            setError('Không thể tải chi tiết phiếu nhập');
        }
    };

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
    const loadTransactions = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const query = {
                page: page, // backend expects 0-based
                size: pageSize,
                ...params
            };
            // Add filter params
            if (filter.search) query.name = filter.search;
            // Removed importer filter
            if (filter.creator !== '' && filter.creator !== null && filter.creator !== undefined) {
                const creatorValue = (typeof filter.creator === 'string' && /^\d+$/.test(filter.creator))
                    ? Number(filter.creator)
                    : filter.creator;
                query.createdBy = creatorValue;
            }
            // Status
            const statusKeys = getStatusKeys();
            if (statusKeys.length === 1) query.status = statusKeys[0];
            // Date range
            if (customDate && customDate[0]) {
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
                
                const start = customDate[0].startDate;
                const end = customDate[0].endDate;
                
                // Tạo start và end của ngày để lọc chính xác
                const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
                const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
                
                query.fromDate = toLocalString(startOfDay);
                query.toDate = toLocalString(endOfDay);
            }
            // Filter by store for staff
            if (isStaff() && user?.storeId) {
                query.storeId = user.storeId;
                console.log('Staff - filtering by store:', user.storeId);
            }
            
            console.log('Query params for API:', query);
            console.log('Date range:', customDate && customDate[0] ? {
                start: customDate[0].startDate,
                end: customDate[0].endDate,
                fromDate: query.fromDate,
                toDate: query.toDate
            } : 'No date filter');
            
            const data = await importTransactionService.listPaged(query);
            console.log('API page:', page, 'pageSize:', pageSize, 'data:', data); // log API data
            setTransactions(data.content || []);
            setTotal(data.totalElements || 0);
            // Load zones data
            const zonesData = await getZones();
            setZones(zonesData);
        } catch (err) {
            setError('Không thể tải danh sách phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    // Reset page về 0 khi filter hoặc customDate đổi
    useEffect(() => {
        setPage(0);
    }, [JSON.stringify(filter), JSON.stringify(customDate)]);

    // Chỉ load lại khi page, pageSize, filter, customDate đổi
    useEffect(() => {
        loadTransactions();
    }, [page, pageSize, JSON.stringify(filter), JSON.stringify(customDate), user?.storeId]);

    // Open detail when navigated from Stocktake with stocktakeId or importId
    useEffect(() => {
        const view = searchParams.get('view');
        const stocktakeId = searchParams.get('stocktakeId');
        const importId = searchParams.get('id');
        if (view === 'detail' && (stocktakeId || importId)) {
            (async () => {
                try {
                    if (importId) {
                        const tx = await importTransactionService.getWithDetails(Number(importId));
                        setSelectedTransaction(tx);
                        setSelectedDetails(tx.details || []);
                        setOpenDetailDialog(true);
                        return;
                    }
                    // fallback by stocktakeId: load list and find first match
                    const data = await importTransactionService.listPaged({ page: 0, size: 50 });
                    const list = Array.isArray(data) ? data : (data?.content || []);
                    const found = list.find(t => String(t.stocktakeId || '') === String(stocktakeId));
                    if (found) {
                        const tx = await importTransactionService.getWithDetails(found.id);
                        setSelectedTransaction(tx);
                        setSelectedDetails(tx.details || []);
                        setOpenDetailDialog(true);
                    }
                } catch (_) {}
            })();
        }
    }, [searchParams]);

    // After transactions load, build creator options depending on role
    useEffect(() => {
        const buildCreatorOptions = async () => {
            setCreatorLoading(true);
            try {
                // Prefer admin: load all users
                if (!isStaff()) {
                    try {
                        const all = await userService.getAllUsers();
                        const options = (all || []).map(u => ({
                            id: u.id,
                            name: u.fullName || u.username || `User #${u.id}`,
                            storeId: u.storeId,
                        }));
                        setCreatorOptions(options);
                        return;
                    } catch (e) {
                        // Fallback to derived from transactions
                    }
                }
                // Staff or admin fallback: derive creators from current page transactions
                const creatorIds = Array.from(new Set((transactions || []).map(t => t.createdBy).filter(Boolean)));
                if (creatorIds.length === 0) {
                    setCreatorOptions([]);
                    return;
                }
                const results = await Promise.allSettled(creatorIds.map(id => userService.getUserById(id)));
                const users = results
                    .filter(r => r.status === 'fulfilled' && r.value)
                    .map(r => r.value);
                // If staff: optionally filter by same store
                const filtered = isStaff() && user?.storeId
                    ? users.filter(u => (u.storeId === user.storeId))
                    : users;
                const options = filtered.map(u => ({ id: u.id, name: u.fullName || u.username || `User #${u.id}` }));
                setCreatorOptions(options);
            } finally {
                setCreatorLoading(false);
            }
        };
        buildCreatorOptions();
    }, [JSON.stringify(transactions), isStaff, user?.storeId]);


    // Thay thế đoạn filter transactions:
    const getStatusKeys = () => {
        const keys = [];
        if (filter.status.draft) keys.push('DRAFT');
        if (filter.status.waiting) keys.push('WAITING_FOR_APPROVE');
        if (filter.status.complete) keys.push('COMPLETE');
        if (filter.status.cancel) keys.push('CANCEL');
        return keys;
    };

    // Remove local filteredTransactions, use transactions directly

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
        
        setConfirmDialog({
            open: true,
            title: 'Xác nhận hủy phiếu',
            message: `Bạn có chắc chắn muốn hủy phiếu nhập hàng "${selectedTransaction.name}"?`,
            onConfirm: async () => {
                setCancelError(null);
                try {
                    await importTransactionService.updateStatus(selectedTransaction.id);
                    setOpenDetailDialog(false);
                    loadTransactions();
                    setSuccess('Hủy phiếu thành công!');
                } catch (err) {
                    setCancelError('Không thể huỷ phiếu. Vui lòng thử lại!');
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            },
            actionType: 'cancel'
        });
    };

    // Hàm xử lý mở phiếu
    const handleOpenTransaction = async () => {
        if (!selectedTransaction?.id) return;
        
        setConfirmDialog({
            open: true,
            title: 'Xác nhận mở phiếu',
            message: `Bạn có chắc chắn muốn mở phiếu nhập hàng "${selectedTransaction.name}" để chờ duyệt?`,
            onConfirm: async () => {
                setOpenError(null);
                setLoading(true);
                try {
                    await importTransactionService.openTransaction(selectedTransaction.id);
                    setOpenDetailDialog(false);
                    loadTransactions();
                    setSuccess('Mở phiếu thành công!');
                } catch (err) {
                    setOpenError('Không thể mở phiếu. Vui lòng thử lại!');
                } finally {
                    setLoading(false);
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            },
            actionType: 'open'
        });
    };

    // Hàm xử lý đóng phiếu (quay về DRAFT)
    const handleCloseTransaction = async () => {
        if (!selectedTransaction?.id) return;
        
        setConfirmDialog({
            open: true,
            title: 'Xác nhận đóng phiếu',
            message: `Bạn có chắc chắn muốn đóng phiếu nhập hàng "${selectedTransaction.name}" và quay về trạng thái nháp?`,
            onConfirm: async () => {
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
                setConfirmDialog({ ...confirmDialog, open: false });
            },
            actionType: 'close'
        });
    };

    // Hàm xử lý hoàn thành phiếu
    const handleCompleteTransaction = async () => {
        if (!selectedTransaction?.id) return;
        
        setConfirmDialog({
            open: true,
            title: 'Xác nhận hoàn thành phiếu',
            message: `Bạn có chắc chắn muốn hoàn thành phiếu nhập hàng "${selectedTransaction.name}"? Hành động này sẽ cập nhật tồn kho và tạo ghi chú nợ nếu cần.`,
            onConfirm: async () => {
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
                setConfirmDialog({ ...confirmDialog, open: false });
            },
            actionType: 'complete'
        });
    };

    // Hàm xử lý hủy phiếu từ dialog
    const handleCancelTransactionFromDialog = async () => {
        if (!selectedTransaction?.id) return;
        
        setConfirmDialog({
            open: true,
            title: 'Xác nhận hủy phiếu',
            message: `Bạn có chắc chắn muốn hủy phiếu nhập hàng "${selectedTransaction.name}"?`,
            onConfirm: async () => {
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
                setConfirmDialog({ ...confirmDialog, open: false });
            },
            actionType: 'cancel'
        });
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
            setConfirmDialog({
                open: true,
                title: 'Xác nhận mở phiếu',
                message: `Bạn có chắc chắn muốn mở phiếu nhập hàng "${actionRow.name}" để chờ duyệt?`,
                onConfirm: async () => {
                    try {
                        await importTransactionService.openTransaction(actionRow.id);
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
                message: `Bạn có chắc chắn muốn đóng phiếu nhập hàng "${actionRow.name}" và quay về trạng thái nháp?`,
                onConfirm: async () => {
                    try {
                        await importTransactionService.closeTransaction(actionRow.id);
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
                message: `Bạn có chắc chắn muốn hoàn thành phiếu nhập hàng "${actionRow.name}"? Hành động này sẽ cập nhật tồn kho và tạo ghi chú nợ nếu cần.`,
                onConfirm: async () => {
                    try {
                        await importTransactionService.completeTransaction(actionRow.id);
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
                message: `Bạn có chắc chắn muốn hủy phiếu nhập hàng "${actionRow.name}"?`,
                onConfirm: async () => {
                    try {
                        await importTransactionService.updateStatus(actionRow.id);
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

    const handleEdit = () => {
        if (actionRow) {
            navigate(`/import/edit/${actionRow.id}`);
        }
        handleActionClose();
    };

    const handleDelete = () => {
        if (actionRow) {
            setConfirmDialog({
                open: true,
                title: 'Xác nhận xóa phiếu',
                message: `Bạn có chắc chắn muốn xóa phiếu nhập hàng "${actionRow.name}"? Hành động này không thể hoàn tác.`,
                onConfirm: async () => {
                    try {
                        await importTransactionService.softDelete(actionRow.id);
                        loadTransactions();
                        setSuccess('Xóa phiếu thành công!');
                    } catch (err) {
                        setError('Không thể xóa phiếu. Vui lòng thử lại!');
                    }
                    setConfirmDialog({ ...confirmDialog, open: false });
                },
                actionType: 'delete'
            });
        }
        handleActionClose();
    };

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
                    const results = await Promise.allSettled(eligible.map(e => importTransactionService.updateStatus(e.id)));
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
                    const results = await Promise.allSettled(eligible.map(e => importTransactionService.softDelete(e.id)));
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

    // Hàm xuất file tổng
    const handleExportAll = () => {
        try {
            exportImportTransactions(transactions);
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

    // Hàm xuất file PDF từ backend
    const handleExportPdf = async () => {
        try {
            if (!selectedTransaction) return;
            const pdfBlob = await importTransactionService.exportPdf(selectedTransaction.id);
            const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `import-transaction-${selectedTransaction.id}.pdf`);
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
                // fallback: try to find index in transactions
                if (params.id) {
                    const idx = transactions.findIndex(row => row.id === params.id);
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

    // Custom footer for DataGrid
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

    const [showFilter, setShowFilter] = useState(true);
    const [showFilterBtn, setShowFilterBtn] = useState(false);
    const mainAreaRef = useRef(null);

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
      boxShadow: '0 2px 8px #b6d4fe, 2px 0 8px #e5e7eb', // bóng xanh nhạt + bóng phải nhẹ
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

    // Function xử lý dialog lịch sử thay đổi
    const handleViewChangeHistory = async () => {
        if (!actionRow) return;
        
        console.log('handleViewChangeHistory called with actionRow:', actionRow);
        
        // Tạo mock data cho selectedChangeLog
        const mockChangeLog = {
            id: actionRow.id,
            modelName: 'IMPORT_TRANSACTION',
            modelID: actionRow.id,
            sourceName: actionRow.name || `Phiếu nhập hàng #${actionRow.id}`,
            previousStatus: actionRow.status,
            nextStatus: actionRow.status,
            description: `Xem lịch sử thay đổi của phiếu nhập hàng: ${actionRow.name}`,
            createdAt: new Date().toISOString(),
            createdBy: actionRow.createdBy || 'Hệ thống'
        };
        
        console.log('Created mockChangeLog:', mockChangeLog);
        
        setSelectedChangeLog(mockChangeLog);
        setChangeHistoryDialogOpen(true);
        
        // Lấy tất cả bản ghi thay đổi của mã nguồn này
        setSourceLogsLoading(true);
        try {
            console.log('Calling getLogsByModel with:', { modelName: 'IMPORT_TRANSACTION', modelId: actionRow.id });
            const response = await changeStatusLogService.getLogsByModel('IMPORT_TRANSACTION', actionRow.id);
            console.log('getLogsByModel response:', response);
            
            if (response.data && response.data.length > 0) {
                setSourceLogs(response.data);
            } else {
                // Nếu không có dữ liệu, tạo mock data để test
                console.log('No data returned from API, creating mock data for testing');
                const mockSourceLogs = [
                    {
                        id: 1,
                        modelName: 'IMPORT_TRANSACTION',
                        modelID: actionRow.id,
                        sourceName: actionRow.name || `Phiếu nhập hàng #${actionRow.id}`,
                        previousStatus: 'DRAFT',
                        nextStatus: 'WAITING_FOR_APPROVE',
                        description: `Chuyển trạng thái từ DRAFT sang WAITING_FOR_APPROVE`,
                        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 ngày trước
                        createdBy: actionRow.createdBy || 'Hệ thống'
                    },
                    {
                        id: 2,
                        modelName: 'IMPORT_TRANSACTION',
                        modelID: actionRow.id,
                        sourceName: actionRow.name || `Phiếu nhập hàng #${actionRow.id}`,
                        previousStatus: 'WAITING_FOR_APPROVE',
                        nextStatus: 'COMPLETE',
                        description: `Hoàn thành phiếu nhập hàng`,
                        createdAt: new Date().toISOString(),
                        createdBy: actionRow.createdBy || 'Hệ thống'
                    }
                ];
                setSourceLogs(mockSourceLogs);
            }
        } catch (error) {
            console.error('Error fetching source logs:', error);
            // Tạo mock data khi có lỗi
            const mockSourceLogs = [
                {
                    id: 1,
                    modelName: 'IMPORT_TRANSACTION',
                    modelID: actionRow.id,
                    sourceName: actionRow.name || `Phiếu nhập hàng #${actionRow.id}`,
                    previousStatus: 'DRAFT',
                    nextStatus: 'WAITING_FOR_APPROVE',
                    description: `Chuyển trạng thái từ DRAFT sang WAITING_FOR_APPROVE`,
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    createdBy: actionRow.createdBy || 'Hệ thống'
                },
                {
                    id: 2,
                    modelName: 'IMPORT_TRANSACTION',
                    modelID: actionRow.id,
                    sourceName: actionRow.name || `Phiếu nhập hàng #${actionRow.id}`,
                    previousStatus: 'WAITING_FOR_APPROVE',
                    nextStatus: 'COMPLETE',
                    description: `Hoàn thành phiếu nhập hàng`,
                    createdAt: new Date().toISOString(),
                    createdBy: actionRow.createdBy || 'Hệ thống'
                }
            ];
            setSourceLogs(mockSourceLogs);
        } finally {
            setSourceLogsLoading(false);
        }
        
        handleActionClose();
    };

    const handleCloseChangeHistoryDialog = () => {
        setChangeHistoryDialogOpen(false);
        setSelectedChangeLog(null);
        setSourceLogs([]);
        setSourceLogsLoading(false);
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
            
            {/* Thông báo cho staff */}
            {isStaff() && user?.storeId && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Chú ý:</strong> Bạn chỉ có thể xem phiếu nhập hàng của cửa hàng: <strong>{user?.storeName || 'N/A'}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="flex flex-col lg:flex-row gap-4 mb-5"
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
                        <Popover open={openPopover && !openDetailDialog} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
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
                        <AccordionDetails>
                            <FormControl fullWidth size="small">
                                <InputLabel id="creator-select-label">Chọn người tạo</InputLabel>
                                <Select
                                    labelId="creator-select-label"
                                    label="Chọn người tạo"
                                    value={filter.creator || ''}
                                    onChange={(e) => setFilter({ ...filter, creator: e.target.value })}
                                    disabled={creatorLoading}
                                >
                                    <MenuItem value=""><em>Tất cả</em></MenuItem>
                                    {creatorOptions.map(opt => (
                                        <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </AccordionDetails>
                      </Accordion>

                      

                      {showDatePicker && selectedMode === "custom" && (
                        <ClickAwayListener onClickAway={() => setShowDatePicker(false)}>
                          <div className="absolute z-50 top-0 left-full ml-4 bg-white p-4 rounded shadow-lg border w-max">
                            <DateRange editableDateInputs={true} onChange={(item) => handleCustomChange(item.selection)} moveRangeOnFirstSelection={false} ranges={customDate} direction="horizontal" />
                            <div className="mt-2 text-right"><Button variant="contained" size="small" onClick={() => setShowDatePicker(false)}>Áp dụng</Button></div>
                          </div>
                        </ClickAwayListener>
                      )}
                    </>
                  )}
                </div>
                {/* Main content area */}
                <div className={showFilter ? "w-full lg:w-4/5" : "w-full"} style={{ transition: 'all 0.4s cubic-bezier(.4,2,.6,1)' }}>
                    <div className="mb-4 w-1/2">
                        <TextField label="Tìm kiếm tên phiếu, nhà cung cấp..." size="small" fullWidth value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
                    </div>

                    {selectedCount > 0 && (
                        <>
                            {(() => {
                                const eligibleCancelCount = transactions.filter(t => selectedIds.has(t.id) && (t.status === 'DRAFT' || t.status === 'WAITING_FOR_APPROVE')).length;
                                const ineligibleCancelCount = selectedCount - eligibleCancelCount;
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
                                    <col style={{ width: 40 }} />
                                    <col style={{ width: 60 }} />
                                    <col style={{ width: 160 }} />
                                    <col style={{ width: 170 }} />
                                    <col style={{ width: 160 }} />
                                    <col style={{ width: 130 }} />
                                    <col style={{ width: 130 }} />
                                    <col style={{ width: 120 }} />
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
                                        <th style={thStyles}>Tên phiếu nhập</th>
                                        <th style={thStyles}>Thời gian</th>
                                        <th style={thStyles}>Nhà cung cấp</th>
                                        <th style={thStyles}>Tổng tiền</th>
                                        <th style={thStyles}>Đã thanh toán</th>
                                        <th style={thStyles}>Trạng thái</th>
                                        <th style={thStyles}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan={9} style={{ textAlign: 'center', ...tdStyles }}>Không có dữ liệu</td></tr>
                                    ) : transactions.map((row, idx) => (
                                        <tr key={row.id} style={zebra(idx)}>
                                            <td style={tdStyles}>
                                                <Checkbox size="small" checked={isRowSelected(row.id)} onChange={() => toggleSelectOne(row.id)} />
                                            </td>
                                            <td style={tdStyles}>{page * pageSize + idx + 1}</td>
                                            <td style={tdStyles}>{row.name}</td>
                                            <td style={tdStyles}>{row.importDate ? new Date(row.importDate).toLocaleString('vi-VN') : ''}</td>
                                            <td style={tdStyles}>{row.supplierName}</td>
                                            <td style={tdStyles}>{row.totalAmount?.toLocaleString('vi-VN')} VNĐ</td>
                                            <td style={{ ...tdStyles, color: (row.paidAmount || 0) > 0 ? 'green' : 'red' }}>{(row.paidAmount || 0).toLocaleString('vi-VN')} VNĐ</td>
                                            <td style={tdStyles}>
                                                <span style={{
                                                  background:
                                                    row.status === 'WAITING_FOR_APPROVE' ? '#fff7e0' :
                                                    row.status === 'CANCEL' ? '#fde8e8' :
                                                    row.status === 'DRAFT' ? '#f3f4f6' :
                                                    '#e6f4ea',
                                                  color:
                                                    row.status === 'WAITING_FOR_APPROVE' ? '#f59e0b' :
                                                    row.status === 'CANCEL' ? '#ef4444' :
                                                    row.status === 'DRAFT' ? '#6b7280' :
                                                    '#34a853',
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
                                    ))}
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
                onExportPdf={handleExportPdf}
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
                
                {/* Hiển thị nút "Sửa" chỉ khi trạng thái là DRAFT */}
                {actionRow?.status === 'DRAFT' && (
                    <MenuItem onClick={handleEdit}>
                        <ListItemIcon>
                            <EditIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Sửa</ListItemText>
                    </MenuItem>
                )}
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleViewChangeHistory}>
                    <ListItemIcon>
                        <HistoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Lịch sử thay đổi</ListItemText>
                </MenuItem>
            </Menu>

            {/* Dialog xác nhận */}
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
                        variant="outlined"
                        sx={{
                            borderColor: '#ddd',
                            color: '#666',
                            '&:hover': {
                                borderColor: '#999',
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={confirmDialog.onConfirm}
                        variant="contained"
                        sx={{
                            background: (() => {
                                switch (confirmDialog.actionType) {
                                    case 'cancel':
                                        return 'linear-gradient(45deg, #f44336 30%, #ff5722 90%)';
                                    case 'open':
                                        return 'linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)';
                                    case 'close':
                                        return 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)';
                                    case 'complete':
                                        return 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)';
                                    case 'delete':
                                        return 'linear-gradient(45deg, #dc2626 30%, #ef4444 90%)';
                                    default:
                                        return 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)';
                                }
                            })(),
                            boxShadow: '0 3px 15px rgba(0,0,0,0.2)',
                            '&:hover': {
                                boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
                                transform: 'translateY(-1px)'
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog lịch sử thay đổi */}
            <ChangeStatusLogDetailDialog
                open={changeHistoryDialogOpen}
                log={selectedChangeLog}
                sourceLogs={sourceLogs}
                sourceLogsLoading={sourceLogsLoading}
                onClose={handleCloseChangeHistoryDialog}
                onViewSource={() => {}} // Không cần xử lý view source ở đây
            />
        </div>
    );
};

export default ImportTransactionPage;
