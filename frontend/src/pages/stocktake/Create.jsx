import React, { useState, useEffect, useCallback } from "react";
import {
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    IconButton,
    Checkbox,
    Tooltip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
    TablePagination,
    Chip
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import StoreIcon from '@mui/icons-material/Store';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { getZones } from "../../services/zoneService";
import { createStocktake, getStocktakeById, updateStocktake } from "../../services/stocktakeService";
import { getAllStores, getStoreById } from "../../services/storeService";
import axios from '../../services/axiosClient';
import { getStocktakeLots } from '../../services/stocktakeService';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";
import { useNavigate, useParams } from "react-router-dom";
import { getCategories } from '../../services/categoryService';
import useStocktake from "../../hooks/useStocktake";
import ZoneChips from "../../components/stocktake/ZoneChips";
import ZoneRealSelect from "../../components/stocktake/ZoneRealSelect";
import PaginationBar from "../../components/stocktake/PaginationBar";
import { useStoreSelection } from "../../contexts/StoreSelectionContext";
import StoreSelector from "../../components/stocktake/StoreSelector";
import { useStoreForStocktake } from "../../hooks/useStoreForStocktake";
import { useNotification } from "../../contexts/NotificationContext";

const CreateStocktakePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = (user?.roles?.[0] || "").toUpperCase();



    // Helper functions for role checking
    const isOwnerOrAdmin = ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(userRole);
    const isStaff = userRole === "STAFF" || userRole === "ROLE_STAFF";

    // Store selection for stocktake
    const storeForStocktake = useStoreForStocktake(user, userRole);
    
    // Notification hook
    const { createStocktakeNotification } = useNotification();
    
    const {
        products = [],
        zones = [],
        snackbar,
        setSnackbar,
        confirmDialog,
        setConfirmDialog,
        editMode,
        setEditMode,
        stocktakeStatus,
        setStocktakeStatus,
        filterDialogOpen,
        setFilterDialogOpen,
        showSuggestions,
        setShowSuggestions,
        searchAnchorEl,
        setSearchAnchorEl,
        selectedLots = [],
        setSelectedLots,
        rawDetail,
        setRawDetail,
        dataLoaded,
        setDataLoaded,
        loadMasterData, // <-- thêm loadMasterData từ hook
        loadZonesByStore, // <-- thêm loadZonesByStore từ hook
    } = useStocktake(user, userRole);

    // Dialog sau khi tạo thành công để chuyển trang chi tiết nếu có chênh lệch
    const [postCreateDialog, setPostCreateDialog] = useState({ open: false, id: null, name: '' });
    const staffStoreId = localStorage.getItem('staff_store_id') || '';
    const [filter, setFilter] = useState({
        store: '', // Sẽ được sync từ storeForStocktake.currentStoreId trong useEffect
        zone: '',
        product: '',
        search: '',
        startDate: '',
        endDate: ''
    });
    const [loadingLots, setLoadingLots] = useState(false);
    const [lots, setLots] = useState([]); // luôn khởi tạo là []
    // Khôi phục dữ liệu đã nhập từ localStorage nếu có (chỉ khi tạo mới, không phải editMode)
    const [confirmCompleteDialog, setConfirmCompleteDialog] = useState(false);
    // 1. Thêm state phân trang
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [oldDetails, setOldDetails] = useState([]);
    // State để lưu trữ các thay đổi của user (để không mất khi filter/pagination)
    const [userEdits, setUserEdits] = useState(new Map());
    const [zonePopoverAnchor, setZonePopoverAnchor] = useState(null);
    const [zonePopoverProductId, setZonePopoverProductId] = useState(null);
    const [zonePopoverType, setZonePopoverType] = useState(null); // 'original' hoặc 'real'
    const [stores, setStores] = useState([]);

    const getDraftStorageKey = () => (id ? `stocktake_edit_${id}` : 'stocktake_create_draft');
    const loadDraft = () => {
        try {
            const raw = localStorage.getItem(getDraftStorageKey());
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    };
    const getLotKey = (lot) => String(lot.name || lot.batchCode || lot.id || '');
    const mergeLotsWithEdits = (fetched, edits) => {
        if (!Array.isArray(fetched) || fetched.length === 0) return [];
        const editMap = new Map((edits || []).map(e => [getLotKey(e), e]));
        return fetched.map(l => {
            const key = getLotKey(l);
            const edited = editMap.get(key);
            if (!edited) return l;
            const real = edited.real !== undefined ? edited.real : l.real;
            const isCheck = edited.isCheck !== undefined ? edited.isCheck : l.isCheck;
            const note = edited.note !== undefined ? edited.note : l.note;
            const zoneReal = edited.zoneReal !== undefined ? edited.zoneReal : l.zoneReal;
            const diff = (real === '' || real === undefined) ? 0 : (Number(real) - (Number(l.remainQuantity) || 0));
            return { ...l, real, isCheck, note, zoneReal, diff };
        });
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Các hàm tiện ích để tính toán ngày
    const getTodayString = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getYesterdayString = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    };

    const getThisWeekStart = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Thứ 2 là ngày đầu tuần
        const monday = new Date(today.setDate(diff));
        return monday.toISOString().split('T')[0];
    };

    const getThisWeekEnd = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7); // Chủ nhật là ngày cuối tuần
        const sunday = new Date(today.setDate(diff));
        return sunday.toISOString().split('T')[0];
    };

    const getLastWeekStart = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek - 6; // Tuần trước
        const lastMonday = new Date(today.setDate(diff));
        return lastMonday.toISOString().split('T')[0];
    };

    const getLastWeekEnd = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek; // Chủ nhật tuần trước
        const lastSunday = new Date(today.setDate(diff));
        return lastSunday.toISOString().split('T')[0];
    };

    const getThisMonthStart = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    };

    const getThisMonthEnd = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    };

    // Bổ sung useEffect để tự động set editMode dựa vào id
    useEffect(() => {
        if (id) {
            setEditMode(true);
        } else {
            setEditMode(false);
        }
    }, [id, setEditMode]);

    // Helper lấy storeId cho Staff
    const getStaffStoreId = () => {
        if (user && user.store && typeof user.store === 'object' && user.store.id != null) {
            return Number(user.store.id);
        } else if (typeof user?.storeId === 'number' || (typeof user?.storeId === 'string' && user?.storeId !== '')) {
            return Number(user.storeId);
        } else if (localStorage.getItem('staff_store_id')) {
            return Number(localStorage.getItem('staff_store_id'));
        }
        return '';
    };

    useEffect(() => {
        // Nếu là STAFF thì luôn set filter.store là kho của staff (kiểu number)
        if (isStaff) {
            const staffStoreIdNum = getStaffStoreId();
            if (staffStoreIdNum) {
                setFilter(f => ({ ...f, store: staffStoreIdNum }));
            }
        }
    }, [userRole]);

    // Đồng bộ filter.store với storeForStocktake.currentStoreId cho Owner/Admin (chỉ khi thực sự cần)
    useEffect(() => {
        const isOwnerOrAdmin = ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(userRole);
        if (isOwnerOrAdmin && storeForStocktake.currentStoreId) {
            const currentStoreId = String(storeForStocktake.currentStoreId);
            const filterStoreId = String(filter.store);
            if (filterStoreId !== currentStoreId) {
                console.log('Create.jsx - Syncing filter.store with storeForStocktake:', {
                    oldFilterStore: filter.store,
                    newStoreId: currentStoreId,
                    filterStoreIdStr: filterStoreId,
                    currentStoreIdStr: currentStoreId
                });
                setFilter(f => ({ ...f, store: currentStoreId }));
                
                // Load zones theo store mới
                if (typeof loadZonesByStore === 'function') {
                    loadZonesByStore(Number(currentStoreId));
                }
            }
        }
    }, [userRole, storeForStocktake.currentStoreId, loadZonesByStore]); // Bỏ filter.store khỏi dependencies để tránh vòng lặp

    // Khởi tạo filter.store từ storeForStocktake khi component mount
    useEffect(() => {
        const isOwnerOrAdmin = ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(userRole);
        if (isOwnerOrAdmin && storeForStocktake.currentStoreId && !filter.store) {
            console.log('Create.jsx - Initializing filter.store from storeForStocktake:', {
                currentStoreId: storeForStocktake.currentStoreId,
                currentFilterStore: filter.store
            });
            setFilter(f => ({ ...f, store: String(storeForStocktake.currentStoreId) }));
            
            // Load zones theo store đã chọn
            if (typeof loadZonesByStore === 'function') {
                loadZonesByStore(Number(storeForStocktake.currentStoreId));
            }
        } else if (userRole === 'STAFF' && !filter.store) {
            // Staff: khởi tạo từ staffStoreId
            const staffStoreIdNum = getStaffStoreId();
            if (staffStoreIdNum) {
                setFilter(f => ({ ...f, store: String(staffStoreIdNum) }));
            }
        }
    }, [userRole, storeForStocktake.currentStoreId, loadZonesByStore]); // Chỉ chạy khi role hoặc currentStoreId thay đổi


    // Khi filter.store thay đổi hoặc products thay đổi, fetch lots (chỉ khi cần thiết)
    useEffect(() => {
        if (filter.store && products.length > 0) {
            // Chỉ fetch khi thực sự cần thiết, tránh fetch quá nhiều
            const timeoutId = setTimeout(() => {
                fetchLotsByFilter();
            }, 300); // Debounce 300ms

            return () => clearTimeout(timeoutId);
        }
    }, [filter.store, filter.zone, filter.product, products]);

    // Đảm bảo rằng khi staff được set store, lots được fetch ngay lập tức
    useEffect(() => {
        if (userRole === 'STAFF' && filter.store && products.length > 0) {
            // Staff cần fetch lots ngay lập tức khi có store và products
            fetchLotsByFilter();
        }
    }, [userRole, filter.store, products]);

    // Debug: Kiểm tra lots có đúng store không
    useEffect(() => {
        if (userRole === 'STAFF' && filter.store && lots.length > 0) {
            const wrongStoreLots = lots.filter(lot => {
                const lotStoreId = lot.storeId || lot.store_id || lot.store?.id;
                return Number(lotStoreId) !== Number(filter.store);
            });

            if (wrongStoreLots.length > 0) {
                console.warn('[DEBUG] Staff seeing lots from wrong store:', {
                    staffStore: filter.store,
                    wrongStoreLots: wrongStoreLots.map(lot => ({
                        id: lot.id,
                        name: lot.batchCode || lot.name,
                        storeId: lot.storeId || lot.store_id || lot.store?.id
                    }))
                });
            }
        }
    }, [userRole, filter.store, lots]);

    // Đảm bảo luôn gọi loadMasterData khi vào trang
    useEffect(() => {
        if (typeof loadMasterData === 'function') {
            // Nếu đã có store được chọn, load zones theo store đó
            if (filter.store) {
                loadMasterData(Number(filter.store));
            } else {
                loadMasterData();
            }
        }
    }, [loadMasterData, filter.store]);

    // Load stores cho STAFF (để hiển thị tên store) - OWNER/ADMIN sử dụng StoreSelector
    useEffect(() => {
        // Chỉ load stores cho STAFF khi cần thiết
        if (isStaff && filter.store) {
            const loadStores = async () => {
                try {
                    // STAFF chỉ cần thông tin store của mình
                    try {
                        const storeData = await getStoreById(filter.store);
                        setStores([storeData]);
                    } catch (storeError) {
                        // Nếu không lấy được thông tin store, tạo object giả để hiển thị
                        setStores([{ id: filter.store, storeName: `Store ${filter.store}` }]);
                    }
                } catch (error) {
                    console.error('Error loading stores:', error);
                    // Fallback cho STAFF: tạo object giả để hiển thị
                    setStores([{ id: filter.store, storeName: `Store ${filter.store}` }]);
                }
            };
            loadStores();
        } else if (isOwnerOrAdmin) {
            // OWNER/ADMIN không cần load stores ở đây vì StoreSelector sẽ handle
            setStores([]);
        }
    }, [userRole, filter.store, isStaff, isOwnerOrAdmin]);

    // Hàm fetch lots theo filter, có merge dữ liệu cũ nếu ở chế độ update
    const fetchLotsByFilter = async () => {
        // Validate store selection for Owner/Admin before fetching
        if (!storeForStocktake.isStoreSelected()) {
            setLots([]);
            setLoadingLots(false);
            return;
        }

        setLoadingLots(true);
        try {
            const params = new URLSearchParams();
            if (filter.store) params.append('store', Number(filter.store));
            if (filter.zone) params.append('zone', filter.zone);
            if (filter.product) params.append('product', filter.product);

            // Filter ngày tháng đã được ẩn

            const resData = await getStocktakeLots(Object.fromEntries(params));

            const lotsData = (resData || []).map(lot => {
                // Đảm bảo luôn có zonesId là mảng số
                let zonesId = lot.zonesId || lot.zoneIds || lot.zones_id || lot.zone_id || [];
                if (typeof zonesId === 'string') {
                    try { zonesId = JSON.parse(zonesId); } catch { zonesId = zonesId.split(',').map(z => Number(z.trim())).filter(Boolean); }
                }
                if (Array.isArray(zonesId)) zonesId = zonesId.map(z => Number(z)).filter(Boolean);
                else if (typeof zonesId === 'number') zonesId = [zonesId];
                else zonesId = [];
                let productId = lot.productId || lot.product_id;
                if (!productId && lot.productName && products.length > 0) {
                    const found = products.find(p => p.productName.trim().toLowerCase() === lot.productName.trim().toLowerCase());
                    if (found) productId = found.id;
                }
                if (typeof productId === 'string' && productId !== '') productId = Number(productId);
                const defaultReal = Number(lot.remainQuantity) || 0;
                const initialReal = (lot.real === 0 || lot.real) ? Number(lot.real) : defaultReal;
                const initialDiff = Number(initialReal) - (Number(lot.remainQuantity) || 0);


                return {
                    ...lot,
                    zonesId,
                    productId,
                    name: lot.batchCode || lot.name || lot.id,
                    real: initialReal,
                    isCheck: id ? (lot.isCheck === true || lot.isCheck === 'true' || lot.isCheck === 1 || lot.isCheck === '1') : false,
                    note: lot.note ?? '',
                    zoneReal: Array.isArray(lot.zoneReal) ? lot.zoneReal : (Array.isArray(zonesId) ? zonesId : []),
                    diff: initialDiff,
                };
            });

            // FIXED: Luôn ưu tiên userEdits thay vì draft.lots để tránh mất dữ liệu khi filter
            let edits = [];
            if (id && Array.isArray(oldDetails) && oldDetails.length > 0) {
                edits = oldDetails;
            } else {
                // Luôn sử dụng userEdits làm nguồn chính thay vì draft.lots
                edits = Array.from(userEdits.entries()).map(([lotKey, editData]) => ({
                    name: lotKey,
                    batchCode: lotKey,
                    ...editData
                }));
            }

            const merged = mergeLotsWithEdits(lotsData, edits);

            // FIXED: Luôn preserve edited lots, bất kể có filter hay không
            const hasActiveFilter = filter.zone || filter.product || filter.startDate || filter.endDate;
            let finalResult;

            if (!hasActiveFilter) {
                // Không có filter → preserve tất cả edited lots
                const existingLotKeys = new Set(merged.map(lot => getLotKey(lot)));
                const missingEditedLots = [];

                for (const [lotKey, editData] of userEdits.entries()) {
                    if (!existingLotKeys.has(lotKey)) {
                        const existingLot = lots.find(lot => getLotKey(lot) === lotKey);
                        if (existingLot) {
                            // Apply user edits to existing lot
                            const editedLot = { ...existingLot };
                            Object.keys(editData).forEach(key => {
                                editedLot[key] = editData[key];
                            });
                            // Recalculate diff if real was edited
                            if (editData.real !== undefined) {
                                editedLot.diff = Number(editData.real) - (Number(existingLot.remainQuantity) || 0);
                            }
                            missingEditedLots.push(editedLot);
                        }
                    }
                }

                finalResult = [...merged, ...missingEditedLots];

            } else {
                            // FIXED: Có filter → vẫn preserve edited lots nhưng chỉ hiển thị những lot phù hợp với filter
            const existingLotKeys = new Set(merged.map(lot => getLotKey(lot)));
            const preservedEditedLots = [];

            // Preserve edited lots that are not in current filter result
            for (const [lotKey, editData] of userEdits.entries()) {
                if (!existingLotKeys.has(lotKey)) {
                    const existingLot = lots.find(lot => getLotKey(lot) === lotKey);
                    if (existingLot) {
                        // Check if this lot should be included based on current filter
                        let shouldInclude = true;

                        // Check zone filter
                        if (filter.zone && existingLot.zonesId && Array.isArray(existingLot.zonesId)) {
                            shouldInclude = existingLot.zonesId.includes(Number(filter.zone));
                        }

                        // Check product filter
                        if (shouldInclude && filter.product) {
                            shouldInclude = Number(existingLot.productId) === Number(filter.product);
                        }

                        // Filter ngày tháng đã được ẩn

                        if (shouldInclude) {
                            // Apply user edits to existing lot
                            const editedLot = { ...existingLot };
                            Object.keys(editData).forEach(key => {
                                editedLot[key] = editData[key];
                            });
                            // Recalculate diff if real was edited
                            if (editData.real !== undefined) {
                                editedLot.diff = Number(editData.real) - (Number(existingLot.remainQuantity) || 0);
                            }
                            preservedEditedLots.push(editedLot);
                        }
                    }
                }
            }

                finalResult = [...merged, ...preservedEditedLots];
            }

            // FIXED: Không ghi đè isCheck = false nếu đã có userEdits
            if (!id) {
                // Chỉ set isCheck = false cho những lot chưa có trong userEdits
                const finalLotsWithCorrectCheckState = finalResult.map(l => {
                    const lotKey = getLotKey(l);
                    const hasUserEdit = userEdits.has(lotKey);
                    if (hasUserEdit) {
                        // Giữ nguyên trạng thái từ userEdits (đã được merge)
                        return l;
                    } else {
                        // Chỉ set false cho lot mới chưa có edit
                        return { ...l, isCheck: false };
                    }
                });
                setLots(finalLotsWithCorrectCheckState);
            } else {
                setLots(finalResult);
            }
        } catch (err) {
            setLots([]);
            console.error('Lỗi khi fetch lots:', err);
        } finally {
            setLoadingLots(false);
        }
    };

    // Khi vào trang, lấy chi tiết phiếu kiểm kê và fetch lots theo filter (nếu có id)
    useEffect(() => {
        if (id) {
            axios.get(`/stocktakes/${id}`)
                .then(res => {
                    const details = (res.data.detail || []); // lấy tất cả dòng như đã lưu trong Nháp
                    // Map lại detail thành lots phù hợp với form
                    const mappedDetails = details.map(d => ({
                        ...d,
                        name: d.batchCode || d.name,
                        zonesId: Array.isArray(d.zones_id) ? d.zones_id.map(Number) : (d.zones_id ? d.zones_id.split(',').map(Number) : []),
                        productId: d.productId || (products.find(p => p.productName.trim().toLowerCase() === (d.productName || '').trim().toLowerCase())?.id),
                        real: d.real,
                        remainQuantity: d.remain,
                        zoneReal: Array.isArray(d.zoneReal) ? d.zoneReal.map(Number).filter(v => !isNaN(v)) : (d.zoneReal ? d.zoneReal.split(',').map(Number).filter(v => !isNaN(v)) : []),
                        diff: d.diff,
                        note: d.note,
                        isCheck: (d.isCheck === true || d.isCheck === 'true' || d.isCheck === 1 || d.isCheck === '1'),
                        expireDate: d.expireDate,
                        createdAt: d.createdAt, // thêm trường createdAt
                        zoneName: d.zones_id
                            ? (Array.isArray(d.zones_id)
                                ? d.zones_id.map(zid => {
                                    const zone = zones.find(z => z.id === Number(zid));
                                    return zone ? zone.zoneName : zid;
                                }).join(', ')
                                : d.zones_id)
                            : (d.zoneName || d.zoneId || ''),
                    }));
                    setOldDetails(mappedDetails);
                    fetchLotsByFilter();
                })
                .catch(() => setSnackbar({ isOpen: true, message: "Không lấy được chi tiết phiếu kiểm kê!", severity: "error" }));
        } else {
            fetchLotsByFilter();
        }
        // eslint-disable-next-line
    }, [id, products, filter.store, filter.zone, filter.product]);

    // Khi filter thay đổi ở chế độ update, fetch lại lots và merge dữ liệu cũ (chỉ khi cần thiết)
    useEffect(() => {
        if (id && oldDetails.length > 0 && (filter.zone || filter.product)) {
            // Chỉ fetch lại khi zone hoặc product thay đổi, không phải store
            const timeoutId = setTimeout(() => {
                fetchLotsByFilter();
            }, 300); // Debounce 300ms

            return () => clearTimeout(timeoutId);
        }
        // eslint-disable-next-line
    }, [filter.zone, filter.product]);

    // Xóa toàn bộ UI/logic Danh sách lô phù hợp, chỉ còn table Danh sách lô hàng (lots)
    // Table này cho phép chọn nhiều lô, nhập số thực tế, ghi chú, ... như cũ

    // Luôn lưu selectedLots vào localStorage khi thay đổi (chỉ khi tạo mới, không phải editMode)
    useEffect(() => {
        if (!editMode) {
            localStorage.setItem('stocktake_create_selected_lots', JSON.stringify(selectedLots));
        }
    }, [selectedLots, editMode]);

    // Thêm lô vào danh sách kiểm kê tạm
    const handleSelectLot = (lot) => {
        if (selectedLots.some(l => l.id === lot.id)) return;
        if (!lot.productId) {
            setSnackbar({
                isOpen: true,
                message: `Không thể chọn lô thiếu productId: ${lot.name || lot.id}`,
                severity: "error"
            });
            return;
        }
        setSelectedLots(prev => [
            ...prev,
            {
                ...lot,
                productId: lot.productId || lot.product?.id || '',
                zoneId: (lot.zoneIds && lot.zoneIds[0]) || lot.zoneId || lot.zone?.id || '',
                real: lot.remainQuantity, // sửa ở đây
                zoneReal: Array.isArray(lot.zoneIds) ? lot.zoneIds.map(Number).filter(v => !isNaN(v)) : [lot.zoneId || lot.zone?.id].filter(Boolean).map(Number).filter(v => !isNaN(v)), // thêm dòng này
                note: '',
                isCheck: false,
                diff: 0
            }
        ]);
    };

    // Xóa lô khỏi danh sách kiểm kê tạm
    const handleRemoveLot = (id) => {
        setSelectedLots(prev => prev.filter(l => l.id !== id));
    };

    // Nhập số thực tế, ghi chú, tick isCheck
    const handleLotChange = useCallback((idx, field, value) => {
        setLots(prev => {
            const lot = prev[idx];
            if (!lot) return prev;

            let newLot = { ...lot };
            if (field === 'real') {
                if (value === '') {
                    // Nếu để rỗng, giữ nguyên rỗng
                    newLot.real = '';
                    newLot.diff = 0;
                } else {
                    const realVal = Math.max(0, Number(value)); // Đảm bảo không nhỏ hơn 0
                    newLot.real = realVal; // Gán giá trị đã validate
                    newLot.diff = realVal - (Number(lot.remainQuantity) || 0);
                }
            } else {
                newLot[field] = value;
            }
            if (field === 'zoneReal') {
                // Đảm bảo zoneReal luôn là mảng số
                if (Array.isArray(value)) {
                    newLot.zoneReal = value.map(v => Number(v)).filter(v => !isNaN(v));
                } else if (typeof value === 'string' && value.includes(',')) {
                    newLot.zoneReal = value.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v));
                } else if (typeof value === 'number') {
                    newLot.zoneReal = [value];
                } else {
                    newLot.zoneReal = [];
                }
            }

            // Lưu user edit vào Map để preserve khi filter/pagination thay đổi
            const lotKey = getLotKey(lot);
            setUserEdits(prevEdits => {
                const newEdits = new Map(prevEdits);
                const existingEdit = newEdits.get(lotKey) || {};
                const updatedEdit = { ...existingEdit, [field]: value };
                newEdits.set(lotKey, updatedEdit);
                return newEdits;
            });

            // Chỉ update lot cụ thể, không update toàn bộ array
            const newLots = [...prev];
            newLots[idx] = newLot;
            return newLots;
        });
    }, []);

    // Validate và submit
    const handleSubmit = async (status) => {
        // Validate store selection for Owner/Admin
        const validation = storeForStocktake.validateStoreSelection();
        if (!validation.isValid) {
            setSnackbar({
                isOpen: true,
                message: validation.message,
                severity: "error"
            });
            return;
        }

        // Debug: Kiểm tra store selection trước khi submit
        const isOwnerOrAdmin = ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(userRole);
        if (isOwnerOrAdmin) {
            console.log('Create.jsx - Pre-submit store validation:', {
                storeForStocktakeId: storeForStocktake.currentStoreId,
                storeForStocktakeName: storeForStocktake.getStoreDisplayName(),
                filterStore: filter.store,
                validation
            });

            if (!storeForStocktake.currentStoreId) {
                setSnackbar({
                    isOpen: true,
                    message: "Vui lòng chọn kho trước khi lưu phiếu kiểm kê!",
                    severity: "error"
                });
                return;
            }
        }

        if (!Array.isArray(lots) || lots.length === 0) {
            setSnackbar({ isOpen: true, message: "Vui lòng chọn ít nhất một lô để kiểm kê!", severity: "error" });
            return;
        }

        // Kiểm tra ít nhất một lô phải được check khi draft
        if (status === 'DRAFT') {
            const checkedLots = lots.filter(lot => lot.isCheck === true);
            if (checkedLots.length === 0) {
                setSnackbar({
                    isOpen: true,
                    message: "Vui lòng check ít nhất một lô để lưu nháp!",
                    severity: "error"
                });
                return;
            }
        }

        // Kiểm tra tất cả lô phải được check khi hoàn thành
        if (status === 'COMPLETED') {
            const uncheckedLots = lots.filter(lot => lot.isCheck !== true);
            if (uncheckedLots.length > 0) {
                setSnackbar({
                    isOpen: true,
                    message: `Vui lòng check tất cả ${uncheckedLots.length} lô để hoàn thành phiếu kiểm kê!`,
                    severity: "error"
                });
                return;
            }
        }

        const missingProductIdLots = lots.filter(lot => !lot.productId);
        if (missingProductIdLots.length > 0) {
            setSnackbar({
                isOpen: true,
                message: `Không thể tạo phiếu! Có ${missingProductIdLots.length} lô bị thiếu productId.`,
                severity: "error"
            });
            console.warn('[DEBUG] Không thể submit, các lô thiếu productId:', missingProductIdLots);
            return;
        }
        for (const lot of lots) {
            if (lot.real === '' || isNaN(Number(lot.real))) {
                setSnackbar({
                    isOpen: true,
                    message: `Vui lòng nhập số thực tế cho lô ${lot.name || lot.id}!`,
                    severity: "error"
                });
                return;
            }
            // Chỉ validate không cho phép số âm
            if (Number(lot.real) < 0) {
                setSnackbar({
                    isOpen: true,
                    message: `Số thực tế của lô ${lot.name || lot.id} không được âm!`,
                    severity: "error"
                });
                return;
            }
            if (!lot.zoneReal || (Array.isArray(lot.zoneReal) && lot.zoneReal.length === 0)) {
                setSnackbar({
                    isOpen: true,
                    message: `Thiếu khu vực (zonesId) cho lô ${lot.name || lot.id}!`,
                    severity: "error"
                });
                return;
            }
        }
        // Chuẩn hóa dữ liệu gửi backend: cần cả productId
        const detail = lots.map(lot => ({
            batchCode: lot.name,
            zones_id: lot.zonesId,
            productId: lot.productId,
            remain: lot.remainQuantity,
            real: Number(lot.real),
            diff: lot.diff,
            isCheck: lot.isCheck,
            note: lot.note,
            expireDate: lot.expireDate,
            zoneReal: Array.isArray(lot.zoneReal) ? lot.zoneReal.join(',') : (lot.zoneReal || '')
        }));
        try {
            const staffStoreIdNum = getStaffStoreId();
            // Lấy storeId từ storeForStocktake context cho Owner/Admin, từ staff store cho Staff
            const isOwnerOrAdmin = ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(userRole);
            const selectedStoreId = isOwnerOrAdmin ? storeForStocktake.currentStoreId : staffStoreIdNum;

            console.log('Create.jsx - Debug store selection:', {
                userRole,
                filterStore: filter.store,
                storeForStocktakeId: storeForStocktake.currentStoreId,
                staffStoreIdNum,
                selectedStoreId
            });

            const payload = {
                detail,
                stocktakeNote: "Phiếu kiểm kê mới",
                status,
                stocktakeDate: new Date().toISOString(),
                storeId: selectedStoreId
            };
            if (id) {
                const updated = await updateStocktake(id, payload);
                
                // Tạo thông báo khi cập nhật stocktake
                try {
                    const selectedStoreId = isOwnerOrAdmin ? storeForStocktake.currentStoreId : staffStoreId;
                    await createStocktakeNotification('update', updated?.name || 'Phiếu kiểm kê', selectedStoreId, user.id, status);
                } catch (notificationError) {
                    console.error('Lỗi khi tạo thông báo:', notificationError);
                }
                
                setSnackbar({
                    isOpen: true,
                    message: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thành công!" : "Lưu nháp phiếu kiểm kê thành công!",
                    severity: "success"
                });
                localStorage.removeItem(`stocktake_edit_${id}`);
                // Nếu hoàn thành và có chênh lệch thì mở dialog chuyển trang chi tiết
                const hasDiff = Array.isArray(lots) && lots.some(l => Number(l.diff) !== 0);
                if (status === 'COMPLETED' && hasDiff) {
                                    // Tạo thông báo cần cân bằng kho
                try {
                    const selectedStoreId = isOwnerOrAdmin ? storeForStocktake.currentStoreId : staffStoreIdNum;
                    await createStocktakeNotification('balance_required', updated?.name || 'Phiếu kiểm kê', selectedStoreId, user.id, 'COMPLETED');
                } catch (notificationError) {
                    console.error('Lỗi khi tạo thông báo cân bằng kho:', notificationError);
                }
                    setPostCreateDialog({ open: true, id: id, name: updated?.name || '' });
                } else {
                    setLots([]);
                    localStorage.removeItem('stocktake_create_selected_lots');
                    navigate("/stocktake", { state: { successMessage: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thành công!" : "Lưu nháp phiếu kiểm kê thành công!" } });
                }
            } else {
                const created = await createStocktake(payload);
                
                // Tạo thông báo khi tạo stocktake mới
                try {
                    const selectedStoreId = isOwnerOrAdmin ? storeForStocktake.currentStoreId : staffStoreIdNum;
                    await createStocktakeNotification('create', created?.name || 'Phiếu kiểm kê mới', selectedStoreId, user.id, status);
                } catch (notificationError) {
                    console.error('Lỗi khi tạo thông báo:', notificationError);
                }
                
                setSnackbar({
                    isOpen: true,
                    message: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thành công!" : "Lưu nháp phiếu kiểm kê thành công!",
                    severity: "success"
                });
                localStorage.removeItem('stocktake_create_draft');
                const createdId = created?.id;
                const hasDiff = Array.isArray(lots) && lots.some(l => Number(l.diff) !== 0);
                if (status === 'COMPLETED' && hasDiff && createdId) {
                                    // Tạo thông báo cần cân bằng kho
                try {
                    const selectedStoreId = isOwnerOrAdmin ? storeForStocktake.currentStoreId : staffStoreIdNum;
                    await createStocktakeNotification('balance_required', created?.name || 'Phiếu kiểm kê mới', selectedStoreId, user.id, 'COMPLETED');
                } catch (notificationError) {
                    console.error('Lỗi khi tạo thông báo cân bằng kho:', notificationError);
                }
                    setPostCreateDialog({ open: true, id: createdId, name: created?.name || '' });
                } else {
                    setLots([]);
                    localStorage.removeItem('stocktake_create_selected_lots');
                    navigate("/stocktake", { state: { successMessage: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thành công!" : "Lưu nháp phiếu kiểm kê thành công!" } });
                }
            }
        } catch (err) {
            console.error("[ERROR][handleSubmit] Lỗi khi lưu phiếu kiểm kê:", err, err?.response);
            setSnackbar({
                isOpen: true,
                message: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thất bại!" : "Lưu nháp phiếu kiểm kê thất bại!",
                severity: "error"
            });
        }
    };

    // Gợi ý sản phẩm/lô dựa trên filter.search
    const searchSuggestions = products.filter(p =>
        filter.search && p.productName.toLowerCase().includes(filter.search.toLowerCase())
    ).slice(0, 5);

    // Tree view render helper
    const renderCategoryTree = (cats, level = 0) => cats.filter(cat => !cat.parentId).map(cat => (
        <Box key={cat.id} sx={{ pl: level * 2, display: 'flex', alignItems: 'center', py: 0.5 }}>
            <Checkbox
                checked={false} // Always unchecked for now, as selectedCategories state is removed
                onChange={() => {
                }}
                size="small"
            />
            <Typography sx={{ fontWeight: 500 }}>{cat.name}</Typography>
        </Box>
    ));

    useEffect(() => {
        // Restore persisted state for Create/Update by key
        const storageKey = id ? `stocktake_edit_${id}` : 'stocktake_create_draft';
        const raw = localStorage.getItem(storageKey);

        if (raw) {
            try {
                const saved = JSON.parse(raw);

                if (saved.filter) {
                    setFilter(prev => ({ ...prev, ...saved.filter }));
                }
                if (!id && Array.isArray(saved.selectedLots)) {
                    setSelectedLots(saved.selectedLots);
                }
                if (Array.isArray(saved.lots)) {
                    // Đặt flag để tránh fetch ngay lập tức khi restore
                    setDataLoaded(true);
                    setLots(saved.lots);
                }
                if (typeof saved.page === 'number') setPage(saved.page);
                if (typeof saved.rowsPerPage === 'number') setRowsPerPage(saved.rowsPerPage);
                if (saved.userEdits) {
                    // Restore userEdits Map from saved object
                    const editsMap = new Map(Object.entries(saved.userEdits));
                    setUserEdits(editsMap);
                }
            } catch (error) {
                console.error('Error parsing localStorage data:', error);
            }
        }
    }, [id]);

    // Persist on relevant changes
    useEffect(() => {
        const storageKey = id ? `stocktake_edit_${id}` : 'stocktake_create_draft';
        const payload = {
            filter,
            selectedLots,
            lots,
            page,
            rowsPerPage,
            userEdits: Object.fromEntries(userEdits), // Convert Map to Object for JSON
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
    }, [filter, selectedLots, lots, page, rowsPerPage, userEdits, id]);

    // Clear draft after successful submit

    return (
        <Box sx={{ maxWidth: '98%', margin: "0px auto 10px auto", background: "#fff", p: 4, borderRadius: 3, boxShadow: 2 }}>


            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight={700}>{editMode ? "Cập nhật phiếu kiểm kê" : "Tạo phiếu kiểm kê mới"}</Typography>

                {/* Thanh tìm kiếm và nút Filter cùng hàng */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            size="small"
                            label="Tìm kiếm nhanh (mã lô, tên sản phẩm, ...)"
                            value={filter.search}
                            onChange={e => {
                                setFilter(f => ({ ...f, search: e.target.value }));
                                setShowSuggestions(!!e.target.value);
                            }}
                            onFocus={e => setShowSuggestions(!!filter.search)}
                            inputRef={el => setSearchAnchorEl(el)}
                            sx={{ minWidth: 250, width: 320 }}
                            InputProps={{
                                endAdornment: (
                                    <></>
                                )
                            }}
                        />
                        {/* Popup gợi ý sản phẩm/lô */}
                        <Popper open={showSuggestions && searchSuggestions.length > 0} anchorEl={searchAnchorEl}
                            placement="bottom-start" style={{ zIndex: 1300, width: searchAnchorEl?.offsetWidth }}>
                            <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
                                <Paper elevation={3} sx={{ mt: 1, borderRadius: 2, width: '100%' }}>
                                    {searchSuggestions.map((p, idx) => (
                                        <Box key={p.id} sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 1.5,
                                            cursor: 'pointer',
                                            '&:hover': { background: '#f5f5f5' }
                                        }}
                                            onClick={() => {
                                                setFilter(f => ({ ...f, search: p.productName }));
                                                setShowSuggestions(false);
                                            }}
                                        >
                                            <Box sx={{
                                                width: 48,
                                                height: 48,
                                                bgcolor: '#e3e8ef',
                                                borderRadius: 2,
                                                mr: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {/* Hiển thị ảnh nếu có, nếu không thì icon mặc định */}
                                                <img src={p.imageUrl || '/farmovo-icon.png'} alt="Ảnh"
                                                    style={{ width: 32, height: 32, objectFit: 'cover' }} onError={e => {
                                                        e.target.style.display = 'none';
                                                    }} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight={600}>{p.productName}</Typography>
                                                <Typography variant="body2"
                                                    color="text.secondary">{p.productCode || p.id}</Typography>
                                                <Typography variant="body2"
                                                    color="text.secondary">Tồn: {p.quantity || 0}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Paper>
                            </ClickAwayListener>
                        </Popper>
                    </Box>

                    {/* Nút Filter */}
                    <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={() => setFilterDialogOpen(true)}
                        sx={{
                            border: '1px solid #d1d5db',
                            borderRadius: 2,
                            backgroundColor: '#fff',
                            color: '#374151',
                            fontWeight: 600,
                            height: '40px', // Đảm bảo chiều cao bằng với TextField
                            '&:hover': {
                                borderColor: '#9ca3af',
                                backgroundColor: '#f9fafb'
                            }
                        }}
                    >
                        Lọc
                    </Button>
                </Box>

                {/* Store Selection for Owner/Admin */}
                <StoreSelector
                    user={user}
                    userRole={userRole}
                    variant="simple"
                    size="small"
                    onStoreChange={(storeId, storeObj) => {
                        // Chỉ update filter nếu thực sự có thay đổi
                        const newStoreId = String(storeId);
                        const currentFilterStore = String(filter.store);
                        if (currentFilterStore !== newStoreId) {
                            console.log('Create.jsx - StoreSelector onStoreChange:', {
                                oldStore: filter.store,
                                newStore: storeId,
                                oldStoreStr: currentFilterStore,
                                newStoreStr: newStoreId
                            });
                            // Update filter
                            setFilter(f => ({ ...f, store: newStoreId }));
                            // Reset lots khi đổi kho
                            setLots([]);
                            setSelectedLots([]);
                            setUserEdits(new Map());
                            
                            // Load zones theo store mới
                            if (typeof loadZonesByStore === 'function') {
                                loadZonesByStore(Number(storeId));
                            }
                        }
                    }}
                />
            </Box>
            {/* Thông báo store cho STAFF */}
            {isStaff && filter.store && (
                <Box sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid #e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <Typography variant="body2" color="text.secondary">
                        Bạn đang làm việc tại kho:
                    </Typography>
                    <Chip
                        label={stores.length > 0 ? stores[0]?.storeName : `Store ${filter.store}`}
                        color="primary"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        (Chỉ hiển thị lô hàng thuộc kho này - Store ID: {filter.store})
                    </Typography>
                    {loadingLots ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">
                                Đang tải lô hàng...
                            </Typography>
                        </Box>
                    ) : lots.length > 0 ? (
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                            • Có {lots.length} lô hàng trong kho (đã filter theo store)
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            • Không có lô hàng nào trong kho
                        </Typography>
                    )}
                </Box>
            )}
            {/* Validation for Owner/Admin - Must select store */}
            {!storeForStocktake.validateStoreSelection().isValid ? (
                <Box sx={{
                    textAlign: 'center',
                    py: 8,
                    bgcolor: '#fff3cd',
                    borderRadius: 2,
                    border: '1px solid #ffeaa7',
                    mb: 3
                }}>
                    <WarningIcon sx={{ fontSize: 48, color: '#856404', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#856404', fontWeight: 600, mb: 1 }}>
                        Chưa chọn kho hàng
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#856404' }}>
                        Vui lòng chọn kho hàng ở phần trên để bắt đầu kiểm kê
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Header với Danh sách lô hàng bên trái và Chú thích bên phải */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        {/* Danh sách lô hàng - Max trái */}
                        <Typography variant="subtitle1" fontWeight={600}>
                            Danh sách lô hàng
                            {isStaff && filter.store && stores.length > 0 && (
                                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2, fontWeight: 400 }}>
                                    tại kho: {stores[0]?.storeName || `Store ${filter.store}`}
                                </Typography>
                            )}
                            {isOwnerOrAdmin && filter.store && (
                                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2, fontWeight: 400 }}>
                                    tại kho: {stores.find(s => s.id === filter.store)?.storeName || stores.find(s => s.id === filter.store)?.name}
                                </Typography>
                            )}
                        </Typography>

                        {/* Chú thích chênh lệch - Max phải */}
                        <Box sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                                Chú thích chênh lệch:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#dc2626' }} />
                                <Typography variant="body2" color="#dc2626" fontWeight={500}>
                                    Đỏ: Thực tế {'>'} Tồn kho
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#3dc0c9ff' }} />
                                <Typography variant="body2" color="#3dc0c9ff" fontWeight={500}>
                                    Xanh: Thực tế {'<'} Tồn kho
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
            <TableContainer component={Paper} elevation={1} sx={{
                mb: 2,
                borderRadius: 2,
                maxWidth: '100%',
                maxHeight: '90vh', // Tăng chiều cao để hiển thị nhiều bản ghi hơn
                overflowX: 'auto',
                overflowY: 'auto' // Cho phép cuộn dọc khi cần
            }}>
                <Table size="small" sx={{ minWidth: 1200 }}>
                    <TableHead>
                        <TableRow sx={{ background: "#f5f5f5" }}>
                            <TableCell sx={{
                                minWidth: 50,
                                maxWidth: 50,
                                textAlign: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px'
                            }}><b>STT</b></TableCell>
                            <TableCell sx={{
                                minWidth: 100,
                                maxWidth: 120,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 6px',
                                textAlign: 'left'
                            }}><b>Mã lô</b></TableCell>
                            {/* Ẩn cột Khu vực (vẫn giữ logic bên dưới) */}
                            {/* {!isMobile && <TableCell sx={{
                                minWidth: 80,
                                maxWidth: 100,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px',
                                textAlign: 'left'
                            }}><b>Khu vực</b></TableCell>} */}
                            <TableCell sx={{
                                minWidth: 120,
                                maxWidth: 150,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 6px',
                                textAlign: 'left'
                            }}><b>Sản phẩm</b></TableCell>
                            {!isMobile && <TableCell sx={{
                                minWidth: 80,
                                maxWidth: 100,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px',
                                textAlign: 'left'
                            }}><b>Ngày tạo</b></TableCell>}
                            {!isMobile && <TableCell sx={{
                                minWidth: 70,
                                maxWidth: 90,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px',
                                textAlign: 'center'
                            }}><b>Tồn kho</b></TableCell>}
                            <TableCell sx={{
                                minWidth: 80,
                                maxWidth: 100,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px',
                                textAlign: 'center'
                            }}><b>Thực tế</b></TableCell>
                            {!isMobile && <TableCell sx={{
                                minWidth: 120,
                                maxWidth: 140,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px'
                            }}><b>Khu vực thực tế</b></TableCell>}
                            <TableCell sx={{
                                minWidth: 80,
                                maxWidth: 100,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px',
                                textAlign: 'center'
                            }}><b>Chênh lệch</b></TableCell>
                            {!isMobile && <TableCell sx={{
                                minWidth: 70,
                                maxWidth: 90,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px',
                                textAlign: 'center'
                            }}><b>Đã kiểm</b></TableCell>}
                            {!isMobile && <TableCell sx={{
                                minWidth: 100,
                                maxWidth: 120,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px'
                            }}><b>Ghi chú</b></TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(lots.length === 0) ? (
                            <TableRow><TableCell colSpan={isMobile ? 5 : 12} align="center">Chưa có lô nào</TableCell></TableRow>
                        ) : (
                            <>
                                {lots
                                    .filter(lot => {
                                        // Đảm bảo chỉ hiển thị lô hàng thuộc store của staff
                                        if (userRole === 'STAFF' && filter.store) {
                                            const lotStoreId = lot.storeId || lot.store_id || lot.store?.id;
                                            if (Number(lotStoreId) !== Number(filter.store)) {
                                                return false; // Không hiển thị lô hàng không thuộc store của staff
                                            }
                                        }

                                        const matchSearch = !filter.search ||
                                            (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                            (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                                        return matchSearch;
                                    })
                                    .sort((a, b) => {
                                        // Sắp xếp theo createdAt giảm dần (lô mới nhất lên đầu)
                                        if (a.createdAt && b.createdAt) {
                                            return new Date(b.createdAt) - new Date(a.createdAt);
                                        }
                                        // Nếu không có createdAt, giữ nguyên thứ tự
                                        return 0;
                                    })
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((lot, displayIdx) => {
                                        // Tìm index thực tế của lot trong array gốc
                                        const actualIdx = lots.findIndex(l =>
                                            (l.id && l.id === lot.id) ||
                                            (l.batchCode && l.batchCode === lot.batchCode) ||
                                            (l.name && l.name === lot.name)
                                        );

                                        return (
                                            <TableRow
                                                key={`${lot.id || lot.batchCode || lot.name}-${lot.productId || 'unknown'}`}
                                                hover>
                                                <TableCell>{displayIdx + 1}</TableCell>
                                                <TableCell>{lot.name || lot.batchCode}</TableCell>
                                                {/* Ẩn cột Khu vực (giữ ZoneChips nhưng không render) */}
                                                {/* {!isMobile && <TableCell>
                                                    <ZoneChips
                                                        zones={zones}
                                                        zonesId={lot.zonesId}
                                                        actualIdx={actualIdx}
                                                        onOpenPopover={(e, idx, type) => {
                                                            e.stopPropagation();
                                                            setZonePopoverAnchor(e.currentTarget);
                                                            setZonePopoverProductId(idx);
                                                            setZonePopoverType(type);
                                                        }}
                                                    />
                                                </TableCell>} */}
                                                <TableCell>{lot.productName || lot.productId}</TableCell>
                                                {!isMobile &&
                                                    <TableCell>{lot.createdAt ? new Date(lot.createdAt).toLocaleDateString("vi-VN") : ""}</TableCell>}
                                                {!isMobile && <TableCell>{lot.remainQuantity}</TableCell>}
                                                <TableCell>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1
                                                        }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    const currentValue = Number(lot.real) || 0;
                                                                    // Chỉ giới hạn không cho phép xuống dưới 0
                                                                    if (currentValue > 0) {
                                                                        handleLotChange(actualIdx, 'real', currentValue - 1);
                                                                    }
                                                                }}
                                                                disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                                                sx={{
                                                                    width: 24,
                                                                    height: 24,
                                                                    minWidth: 24,
                                                                    minHeight: 24,
                                                                    borderRadius: '4px',
                                                                    backgroundColor: '#f5f5f5',
                                                                    color: '#666',
                                                                    '&:hover': {
                                                                        backgroundColor: '#eee'
                                                                    }
                                                                }}
                                                            >
                                                                -
                                                            </IconButton>
                                                            <TextField
                                                                value={lot.real}
                                                                onChange={(e) => handleLotChange(actualIdx, 'real', Number(e.target.value))}
                                                                type="number"
                                                                size="small"
                                                                inputProps={{ min: 0, style: { textAlign: 'center', width: 60 } }}
                                                                disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                                            />
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleLotChange(actualIdx, 'real', (Number(lot.real) || 0) + 1)}
                                                                disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                                                sx={{
                                                                    width: 24,
                                                                    height: 24,
                                                                    minWidth: 24,
                                                                    minHeight: 24,
                                                                    borderRadius: '4px',
                                                                    backgroundColor: '#f5f5f5',
                                                                    color: '#666',
                                                                    '&:hover': {
                                                                        backgroundColor: '#eee'
                                                                    }
                                                                }}
                                                            >
                                                                +
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                {!isMobile && <TableCell>
                                                        <ZoneRealSelect
                                                            zones={zones}
                                                        value={Array.isArray(lot.zoneReal) ? lot.zoneReal : []}
                                                        onChange={(newZones) => handleLotChange(actualIdx, 'zoneReal', newZones)}
                                                        />
                                                </TableCell>}
                                                <TableCell sx={{ textAlign: 'center', padding: '8px 4px' }}>
                                                    {lot.diff === 0 ? (
                                                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                                                            0
                                                        </Typography>
                                                    ) : (
                                                        <Chip
                                                            label={lot.diff > 0 ? `+${lot.diff}` : lot.diff}
                                                            size="small"
                                                            sx={{
                                                                background: lot.diff < 0 
                                                                    ? 'linear-gradient(135deg, #3dc0c9ff 0%, #3dc0c9ff 100%)' // Cam gradient cho số âm
                                                                    : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', // Đỏ gradient cho số dương
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                borderRadius: '12px',
                                                                height: '24px',
                                                                fontSize: '0.75rem',
                                                                minWidth: '40px',
                                                                '& .MuiChip-label': {
                                                                    padding: '0 8px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 600
                                                                },
                                                                boxShadow: lot.diff !== 0 ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': {
                                                                    transform: 'translateY(-1px)',
                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </TableCell>
                                                {!isMobile && <TableCell sx={{ textAlign: 'center' }}>
                                                    <Checkbox
                                                        checked={!!lot.isCheck}
                                                        onChange={(e) => handleLotChange(actualIdx, 'isCheck', e.target.checked)}
                                                    />
                                                </TableCell>}
                                                {!isMobile && <TableCell>
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        value={lot.note || ''}
                                                        onChange={(e) => handleLotChange(actualIdx, 'note', e.target.value)}
                                                    />
                                                </TableCell>}
                                            </TableRow>
                                        );
                                    })}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination controls và Action buttons - Thẳng hàng với nhau */}
            <Box sx={{
                mt: 2,
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: '100%',
                minHeight: '60px' // Đảm bảo chiều cao cố định
            }}>
                {/* Pagination controls bên trái */}
                <PaginationBar
                    lots={lots}
                    page={page}
                    setPage={setPage}
                    rowsPerPage={rowsPerPage}
                    setRowsPerPage={setRowsPerPage}
                    filterPredicate={(lot) => {
                        const s = (filter.search || '').toLowerCase();
                        return !s || (lot.name?.toLowerCase().includes(s) || lot.productName?.toLowerCase().includes(s));
                    }}
                />

                {/* Action buttons bên phải */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button onClick={() => {
                        setLots([]);
                        // Xóa draft chỉ khi người dùng bấm Hủy
                        if (id) {
                            localStorage.removeItem(`stocktake_edit_${id}`);
                        } else {
                            localStorage.removeItem('stocktake_create_draft');
                        }
                        localStorage.removeItem('stocktake_create_selected_lots');
                        navigate("/stocktake");
                    }}>Hủy</Button>
                    {/* Nút lưu nháp, hoàn thành, xóa chỉ hiển thị khi editMode && stocktakeStatus === 'DRAFT' */}
                    {(!editMode || stocktakeStatus === 'DRAFT') && (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => handleSubmit('DRAFT')}
                                disabled={!storeForStocktake.validateStoreSelection().isValid}
                                sx={{
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    opacity: !storeForStocktake.validateStoreSelection().isValid ? 0.5 : 1
                                }}
                            >
                                Lưu nháp
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => setConfirmCompleteDialog(true)}
                                disabled={!storeForStocktake.validateStoreSelection().isValid}
                                sx={{
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    opacity: !storeForStocktake.validateStoreSelection().isValid ? 0.5 : 1
                                }}
                            >
                                Hoàn thành
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
                </>
            )}

            <Dialog open={confirmCompleteDialog} onClose={() => setConfirmCompleteDialog(false)}>
                <DialogTitle>Xác nhận hoàn thành phiếu kiểm kê</DialogTitle>
                <DialogContent>
                    <Typography>
                        Hoàn thành phiếu kiểm kê
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                        <Button onClick={() => setConfirmCompleteDialog(false)}>Hủy</Button>
                        <Button variant="contained" color="success" onClick={() => {
                            setConfirmCompleteDialog(false);
                            handleSubmit('COMPLETED');
                        }}>Xác nhận</Button>
                    </Box>
                </DialogContent>
            </Dialog>
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

            {/* Popup hiển thị các zone đã chọn */}
            <Popper
                open={Boolean(zonePopoverAnchor)}
                anchorEl={zonePopoverAnchor}
                placement="bottom-start"
                style={{ zIndex: 1300 }}
            >
                <ClickAwayListener onClickAway={() => {
                    setZonePopoverAnchor(null);
                    setZonePopoverProductId(null);
                    setZonePopoverType(null);
                }}>
                    <Paper elevation={8} sx={{
                        p: 2,
                        borderRadius: 2,
                        minWidth: 300,
                        border: '1px solid #e9ecef',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{
                                width: 8,
                                height: 8,
                                backgroundColor: zonePopoverType === 'original' ? '#28a745' : '#667eea',
                                borderRadius: '50%',
                                mr: 1
                            }} />
                            <Typography variant="subtitle1" fontWeight={600} color="#333">
                                {zonePopoverType === 'original' ? 'Vị trí gốc' : 'Vị trí thực tế'}
                            </Typography>
                        </Box>

                        {zonePopoverProductId !== null && (() => {
                            const lot = lots[zonePopoverProductId];
                            const selectedZones = zonePopoverType === 'original' ? (lot?.zonesId || []) : (lot?.zoneReal || []);

                            if (selectedZones.length === 0) {
                                return (
                                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                                        Chưa có vị trí nào được chọn
                                    </Typography>
                                );
                            }

                            return (
                                <>
                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        mb: 2
                                    }}>
                                        {selectedZones.map((zoneId) => {
                                            const zone = zones.find(z => z.id === zoneId || z.id === Number(zoneId));
                                            return zone ? (
                                                <Chip
                                                    key={zone.id}
                                                    label={zone.zoneName}
                                                    size="small"
                                                    onDelete={zonePopoverType === 'real' ? () => {
                                                        // Chỉ cho phép xóa zones thực tế
                                                        const updatedZoneReal = selectedZones.filter(id => id !== zoneId);
                                                        handleLotChange(
                                                            zonePopoverProductId,
                                                            'zoneReal',
                                                            updatedZoneReal
                                                        );
                                                    } : undefined}
                                                    sx={{
                                                        background: zonePopoverType === 'original'
                                                            ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: 'white',
                                                        fontWeight: '600',
                                                        borderRadius: '6px',
                                                        height: '24px',
                                                        fontSize: '0.75rem',
                                                        '& .MuiChip-deleteIcon': {
                                                            color: 'white',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                            borderRadius: '50%',
                                                            width: '16px',
                                                            height: '16px',
                                                            fontSize: '0.7rem',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(255, 255, 255, 0.3)'
                                                            }
                                                        },
                                                        '&:hover': {
                                                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                                        },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                />
                                            ) : null;
                                        })}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{
                                        fontSize: '0.75rem',
                                        fontStyle: 'italic'
                                    }}>
                                        Nhấn vào dấu x để xóa vị trí
                                    </Typography>
                                </>
                            );
                        })()}
                    </Paper>
                </ClickAwayListener>
            </Popper>

            {/* Filter Dialog */}
            <Dialog
                open={filterDialogOpen}
                onClose={() => setFilterDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #e5e7eb',
                    pb: 2
                }}>
                    Lọc
                    <IconButton
                        onClick={() => setFilterDialogOpen(false)}
                        sx={{ color: '#6b7280' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Filter Khu vực */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} mb={2} color="#374151">
                                Khu vực:
                            </Typography>
                            <FormControl fullWidth size="small">
                                <InputLabel>Chọn khu vực</InputLabel>
                                <Select
                                    value={filter.zone}
                                    label="Chọn khu vực"
                                    onChange={e => setFilter(f => ({ ...f, zone: e.target.value }))}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="">Tất cả khu vực</MenuItem>
                                    {zones.map(zone => (
                                        <MenuItem key={zone.id} value={zone.id}>
                                            {zone.zoneName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Filter Sản phẩm */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} mb={2} color="#374151">
                                Sản phẩm:
                            </Typography>
                            <FormControl fullWidth size="small">
                                <InputLabel>Chọn sản phẩm</InputLabel>
                                <Select
                                    value={filter.product}
                                    label="Chọn sản phẩm"
                                    onChange={e => setFilter(f => ({ ...f, product: e.target.value }))}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="">Tất cả sản phẩm</MenuItem>
                                    {products.map(product => (
                                        <MenuItem key={product.id} value={product.id}>
                                            {product.productName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Filter Ngày tháng - Đã ẩn */}
                        {/* <Box>
                            <Typography variant="subtitle1" fontWeight={600} mb={2} color="#374151">
                                Ngày tạo:
                            </Typography>

                            Các nút tiện ích và input ngày tháng đã được ẩn
                        </Box> */}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button
                        onClick={() => {
                            setFilter(f => ({ ...f, zone: '', product: '' }));
                        }}
                        sx={{
                            color: '#6b7280',
                            '&:hover': { backgroundColor: '#f3f4f6' }
                        }}
                    >
                        Xóa bộ lọc
                    </Button>
                    <Button
                        onClick={() => setFilterDialogOpen(false)}
                        sx={{
                            color: '#6b7280',
                            '&:hover': { backgroundColor: '#f3f4f6' }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setFilterDialogOpen(false);
                            // Có thể thêm logic xử lý filter ở đây nếu cần
                        }}
                        sx={{
                            backgroundColor: '#3b82f6',
                            '&:hover': { backgroundColor: '#2563eb' },
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        Áp dụng
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Dialog gợi ý chuyển trang chi tiết sau khi tạo nếu có chênh lệch */}
            <Dialog open={postCreateDialog.open} onClose={() => setPostCreateDialog({ open: false, id: null, name: '' })} maxWidth="sm" fullWidth>
                <DialogTitle className="flex justify-between items-center">
                    <span>Phiếu kiểm kê đã tạo</span>
                    <IconButton size="small" onClick={() => setPostCreateDialog({ open: false, id: null, name: '' })}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 1 }}>
                        <Typography variant="body1">Phiếu <b>{postCreateDialog.name || 'vừa tạo'}</b> có chênh lệch số lượng.</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Bạn có muốn chuyển sang trang chi tiết để xem và cân bằng kho?</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setPostCreateDialog({ open: false, id: null, name: '' });
                        navigate('/stocktake');
                    }} color="inherit">Về trang kiểm kê</Button>
                    <Button onClick={() => {
                        const targetId = postCreateDialog.id || id;
                        setPostCreateDialog({ open: false, id: null, name: '' });
                        if (targetId) navigate(`/stocktake/${targetId}`);
                    }} variant="contained">Xem chi tiết</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreateStocktakePage;