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
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { getZones } from "../../services/zoneService";
import { createStocktake, getStocktakeById, updateStocktake, deleteStocktake } from "../../services/stocktakeService";
import { getAllStores, getStoreById } from "../../services/storeService";
import axios from '../../services/axiosClient';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";
import { useNavigate, useParams } from "react-router-dom";
import { getCategories } from '../../services/categoryService';
import useStocktake from "../../hooks/useStocktake";

const CreateStocktakePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.roles?.[0];
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
    } = useStocktake(user, userRole);
    const staffStoreId = localStorage.getItem('staff_store_id') || '';
    const [filter, setFilter] = useState({ store: '', zone: '', product: '', search: '', startDate: '', endDate: '' });
    const [loadingLots, setLoadingLots] = useState(false);
    const [lots, setLots] = useState([]); // luôn khởi tạo là []
    // Khôi phục dữ liệu đã nhập từ localStorage nếu có (chỉ khi tạo mới, không phải editMode)
    const [confirmCompleteDialog, setConfirmCompleteDialog] = useState(false);
    // 1. Thêm state phân trang
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [oldDetails, setOldDetails] = useState([]);
    const [zonePopoverAnchor, setZonePopoverAnchor] = useState(null);
    const [zonePopoverProductId, setZonePopoverProductId] = useState(null);
    const [zonePopoverType, setZonePopoverType] = useState(null); // 'original' hoặc 'real'
    const [stores, setStores] = useState([]);

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
        if (userRole === 'STAFF') {
            const staffStoreIdNum = getStaffStoreId();
            if (staffStoreIdNum) {
                setFilter(f => ({ ...f, store: staffStoreIdNum }));
            }
        }
    }, [userRole]);

    // Khi filter.store thay đổi hoặc products thay đổi, fetch lots (chỉ khi cần thiết)
    useEffect(() => {
        if (filter.store && products.length > 0) {
            // Chỉ fetch khi thực sự cần thiết, tránh fetch quá nhiều
            const timeoutId = setTimeout(() => {
                fetchLotsByFilter();
            }, 300); // Debounce 300ms
            
            return () => clearTimeout(timeoutId);
        }
    }, [filter.store, filter.zone, filter.product, filter.startDate, filter.endDate, products]);

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
            loadMasterData();
        }
    }, []);

    // Load stores cho OWNER và STAFF (để hiển thị tên store)
    useEffect(() => {
        // Chỉ load stores khi cần thiết
        if (userRole === 'OWNER' || (userRole === 'STAFF' && filter.store)) {
            const loadStores = async () => {
                try {
                    if (userRole === 'OWNER') {
                        // OWNER cần danh sách tất cả stores
                        const storesData = await getAllStores();
                        setStores(storesData || []);
                    } else if (userRole === 'STAFF' && filter.store) {
                        // STAFF chỉ cần thông tin store của mình
                        try {
                            const storeData = await getStoreById(filter.store);
                            setStores([storeData]);
                        } catch (storeError) {
                            // Nếu không lấy được thông tin store, tạo object giả để hiển thị
                            setStores([{ id: filter.store, storeName: `Store ${filter.store}` }]);
                        }
                    }
                } catch (error) {
                    console.error('Error loading stores:', error);
                    if (userRole === 'STAFF' && filter.store) {
                        // Fallback cho STAFF: tạo object giả để hiển thị
                        setStores([{ id: filter.store, storeName: `Store ${filter.store}` }]);
                    } else {
                        setStores([]);
                    }
                }
            };
            loadStores();
        }
    }, [userRole, filter.store]);

    // Hàm fetch lots theo filter, có merge dữ liệu cũ nếu ở chế độ update
    const fetchLotsByFilter = async () => {
        setLoadingLots(true);
        try {
            const params = new URLSearchParams();
            if (filter.store) params.append('store', Number(filter.store));
            if (filter.zone) params.append('zone', filter.zone);
            if (filter.product) params.append('product', filter.product);
            
            // Xử lý filter ngày tháng
            if (filter.startDate) {
                const startDate = new Date(filter.startDate);
                startDate.setHours(0, 0, 0, 0);
                params.append('createdAtFrom', startDate.toISOString());
            }
            if (filter.endDate) {
                const endDate = new Date(filter.endDate);
                endDate.setHours(23, 59, 59, 999);
                params.append('createdAtTo', endDate.toISOString());
            }
            
            console.log('[DEBUG] Filter params:', {
                store: filter.store,
                zone: filter.zone,
                product: filter.product,
                startDate: filter.startDate,
                endDate: filter.endDate,
                params: params.toString()
            });
            
            const res = await axios.get(`/import-details/stocktake-lot?${params.toString()}`);
            
            console.log('[DEBUG] API Response:', {
                storeFilter: filter.store,
                apiParams: params.toString(),
                responseData: res.data,
                totalLots: res.data?.length
            });
            
            const lotsData = (res.data || []).map(lot => {
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
                // Merge dữ liệu cũ nếu có (dựa trên batchCode hoặc id)
                const old = oldDetails.find(d => (d.batchCode || d.name) === (lot.batchCode || lot.name) || d.id === lot.id);
                return {
                    ...lot,
                    zonesId,
                    productId,
                    real: old ? old.real : lot.remainQuantity,
                    remainQuantity: lot.remainQuantity,
                    zoneReal: old ? old.zoneReal : (Array.isArray(zonesId) ? zonesId.map(Number).filter(v => !isNaN(v)) : []),
                    diff: old ? old.diff : 0,
                    isCheck: old ? !!old.isCheck : false,
                    note: old ? old.note : '',
                    expireDate: lot.expireDate,
                    name: lot.batchCode || lot.name,
                    zoneName: lot.zoneName,
                };
            });
            setLots(lotsData);
        } catch (err) {
            setLots([]);
            console.error('[DEBUG] Lỗi khi fetch lots:', err);
        } finally {
            setLoadingLots(false);
        }
    };

    // Khi vào trang, lấy chi tiết phiếu kiểm kê và fetch lots theo filter (nếu có id)
    useEffect(() => {
        if (id) {
            axios.get(`/stocktakes/${id}`)
                .then(res => {
                    const details = (res.data.detail || []).filter(d => d.isCheck); // chỉ lấy dòng đã tích isCheck
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
                        isCheck: d.isCheck,
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
            
            // Chỉ update lot cụ thể, không update toàn bộ array
            const newLots = [...prev];
            newLots[idx] = newLot;
            return newLots;
        });
    }, []);

    // Validate và submit
    const handleSubmit = async (status) => {
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
            const payload = {
                detail,
                stocktakeNote: "Phiếu kiểm kê mới",
                status,
                stocktakeDate: new Date().toISOString(),
                storeId: userRole === 'OWNER' ? filter.store : staffStoreIdNum
            };
            if (id) {
                await updateStocktake(id, payload);
                setSnackbar({
                    isOpen: true,
                    message: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thành công!" : "Lưu nháp phiếu kiểm kê thành công!",
                    severity: "success"
                });
            } else {
                await createStocktake(payload);
                setSnackbar({
                    isOpen: true,
                    message: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thành công!" : "Lưu nháp phiếu kiểm kê thành công!",
                    severity: "success"
                });
            }
            setLots([]);
            localStorage.removeItem('stocktake_create_selected_lots');
            navigate("/stocktake", { state: { successMessage: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thành công!" : "Lưu nháp phiếu kiểm kê thành công!" } });
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
                
                {/* Bộ lọc Store - chỉ hiển thị cho OWNER, nằm dưới */}
                {userRole === 'OWNER' && (
                    <FormControl size="small" sx={{ minWidth: 150, mt: 1 }}>
                        <InputLabel>Kho hàng</InputLabel>
                    <Select
                            value={filter.store}
                            label="Kho hàng"
                        onChange={e => {
                                setFilter(f => ({ ...f, store: e.target.value }));
                        }}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                            {stores.map(store => (
                                <MenuItem key={store.id} value={store.id}>{store.storeName}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                )}
            </Box>
            {/* Thông báo store cho STAFF */}
            {userRole === 'STAFF' && filter.store && (
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
            {/* Tiêu đề danh sách lô hàng */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Danh sách lô hàng
                {userRole === 'STAFF' && filter.store && stores.length > 0 && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2, fontWeight: 400 }}>
                        tại kho: {stores[0]?.storeName || `Store ${filter.store}`}
                    </Typography>
                )}
            </Typography>
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
                            {!isMobile && <TableCell sx={{ 
                                minWidth: 80, 
                                maxWidth: 100,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '8px 4px',
                                textAlign: 'left'
                            }}><b>Khu vực</b></TableCell>}
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
                                            {!isMobile && <TableCell>
                                                <div style={{ 
                                                    position: 'relative', 
                                                    width: '100%', 
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    {/* Zone chips display */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'row',
                                                        flexWrap: 'nowrap', 
                                                        gap: 1, 
                                                        alignItems: 'center', 
                                                        justifyContent: 'flex-start',
                                                        height: '24px', 
                                                        width: '100%',
                                                        maxWidth: '160px',
                                                        position: 'relative',
                                                        zIndex: 3,
                                                        overflow: 'hidden'
                                                    }}>
                                                        {(lot.zonesId || []).filter(v => v !== null && v !== undefined && v !== '').length > 0 ? (
                                                            <>
                                                                {(lot.zonesId || []).filter(v => v !== null && v !== undefined && v !== '').slice(0, 2).map((zoneId) => {
                                                                    const z = zones.find(z => Number(z.id) === Number(zoneId));
                                                                    return z ? (
                                                                        <Chip
                                                                            key={z.id}
                                                                            label={z.zoneName}
                                                                            size="small"
                                                                                                                                                    sx={{
                                                                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                                            color: 'white',
                                                                            fontWeight: '600',
                                                                            borderRadius: '6px',
                                                                            height: '18px',
                                                                            fontSize: '0.65rem',
                                                                            maxWidth: '45px',
                                                                            minWidth: '35px',
                                                                            '& .MuiChip-label': {
                                                                                padding: '0 3px',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap',
                                                                                fontSize: '0.6rem'
                                                                            }
                                                                        }}
                                                                        />
                                                                    ) : null;
                                                                })}
                                                                {(lot.zonesId || []).filter(v => v !== null && v !== undefined && v !== '').length > 2 && (
                                                                    <Chip
                                                                        key={`more-zones-${lot.id}`}
                                                                        label={`+${(lot.zonesId || []).filter(v => v !== null && v !== undefined && v !== '').length - 2}`}
                                                                        size="small"
                                                                        sx={{ 
                                                                            background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                                                                            color: 'white',
                                                                            fontWeight: '700',
                                                                            borderRadius: '6px',
                                                                            height: '18px',
                                                                            fontSize: '0.6rem',
                                                                            minWidth: '18px',
                                                                            maxWidth: '18px',
                                                                            '& .MuiChip-label': {
                                                                                padding: '0 2px'
                                                                            }
                                                                        }}
                                                                    />
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                Chưa có khu vực
                                                            </Typography>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Icon xem chi tiết - chỉ hiển thị khi có zones */}
                                                    {(lot.zonesId || []).filter(v => v !== null && v !== undefined && v !== '').length > 0 && (
                                                        <IconButton 
                                                            size="small" 
                                                            style={{ 
                                                                marginLeft: 6, 
                                                                color: '#28a745',
                                                                backgroundColor: '#f8f9fa',
                                                                border: '1px solid #e9ecef',
                                                                borderRadius: '4px',
                                                                width: '20px',
                                                                height: '20px',
                                                                zIndex: 2,
                                                                transition: 'all 0.2s ease',
                                                                flexShrink: 0
                                                            }} 
                                                            onClick={e => { 
                                                                e.stopPropagation(); 
                                                                setZonePopoverAnchor(e.currentTarget); 
                                                                setZonePopoverProductId(actualIdx); 
                                                                setZonePopoverType('original'); // Zones gốc từ cột "Khu vực"
                                                            }}
                                                            sx={{
                                                                '&:hover': {
                                                                    backgroundColor: '#28a745',
                                                                    color: 'white',
                                                                    transform: 'translateY(-1px)',
                                                                    boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)'
                                                                }
                                                            }}
                                                        >
                                                            <VisibilityIcon sx={{ fontSize: '0.75rem' }} />
                                                        </IconButton>
                                                    )}
                                                </div>
                                            </TableCell>}
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
                                                                    backgroundColor: '#e0e0e0',
                                                                    color: '#333'
                                                                },
                                                                '&:disabled': {
                                                                    backgroundColor: '#f0f0f0',
                                                                    color: '#ccc'
                                                                }
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>-</Typography>
                                                        </IconButton>
                                                        
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                            value={lot.real ?? ''}
                                                            onChange={e => {
                                                                const value = e.target.value;
                                                                // Chỉ cho phép nhập số dương hoặc rỗng
                                                                if (value === '' || /^\d+$/.test(value)) {
                                                                    handleLotChange(actualIdx, 'real', value);
                                                                } else {
                                                                    setSnackbar({
                                                                        isOpen: true,
                                                                        message: "Chỉ được nhập số dương!",
                                                                        severity: "warning"
                                                                    });
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                // Khi bấm ra ngoài, nếu ô để trống thì khôi phục số ban đầu
                                                                if (e.target.value === '') {
                                                                    const originalValue = lot.remainQuantity || 0;
                                                                    handleLotChange(actualIdx, 'real', originalValue.toString());
                                                                }
                                                            }}
                                                            variant="standard"
                                                            inputProps={{ 
                                                                min: 0,
                                                                style: { 
                                                                    textAlign: 'center',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 600,
                                                                    padding: '2px 4px',
                                                                    width: '35px'
                                                                }
                                                            }}
                                                            sx={{
                                                                '& .MuiInput-root': {
                                                                    height: 24,
                                                                    minHeight: 24,
                                                                    '&:before': {
                                                                        borderBottom: '1px solid #e0e0e0'
                                                                    },
                                                                    '&:hover:not(.Mui-disabled):before': {
                                                                        borderBottom: '1px solid #bdbdbd'
                                                                    },
                                                                    '&:after': {
                                                                        borderBottom: '2px solid #1976d2'
                                                                    }
                                                                },
                                                                '& .MuiInput-input': {
                                                                    padding: '4px 8px',
                                                                    textAlign: 'center'
                                                                },
                                                                // Ẩn mũi tên tăng giảm của input number
                                                                '& input[type="number"]::-webkit-outer-spin-button, & input[type="number"]::-webkit-inner-spin-button': {
                                                                    WebkitAppearance: 'none',
                                                                    margin: 0
                                                                },
                                                                '& input[type="number"]': {
                                                                    MozAppearance: 'textfield'
                                                                }
                                                            }}
                                                    disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                                />
                                                        
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                const currentValue = Number(lot.real) || 0;
                                                                // Bỏ giới hạn trên, cho phép tăng không giới hạn
                                                                handleLotChange(actualIdx, 'real', currentValue + 1);
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
                                                                    backgroundColor: '#e0e0e0',
                                                                    color: '#333'
                                                                },
                                                                '&:disabled': {
                                                                    backgroundColor: '#f0f0f0',
                                                                    color: '#ccc'
                                                                }
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>+</Typography>
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            {!isMobile && <TableCell>
                                                                                                 <div style={{ 
                                                     position: 'relative', 
                                                     width: '100%', 
                                                     height: '28px',
                                                     display: 'flex',
                                                     alignItems: 'center',
                                                     gap: '6px'
                                                 }}>
                                                     {/* Zone input container */}
                                                     <div style={{ 
                                                         position: 'relative', 
                                                         flex: 1,
                                                         height: '100%',
                                                         minWidth: '160px'
                                                     }}>
                                                         {/* Placeholder text */}
                                                         {(lot.zoneReal || []).filter(v => v !== null && v !== undefined && v !== '').length === 0 && (
                                                             <span style={{ 
                                                                 color: '#6c757d', 
                                                                 fontSize: '0.75rem',
                                                                 fontStyle: 'italic',
                                                                 display: 'flex',
                                                                 alignItems: 'center',
                                                                 gap: '4px',
                                                                 whiteSpace: 'nowrap',
                                                                 pointerEvents: 'none',
                                                                 userSelect: 'none',
                                                                 position: 'absolute',
                                                                 left: '8px',
                                                                 top: '50%',
                                                                 transform: 'translateY(-50%)',
                                                                 zIndex: 4
                                                             }}>
                                                                 <span style={{ 
                                                                     width: '3px', 
                                                                     height: '3px', 
                                                                     backgroundColor: '#adb5bd', 
                                                                     borderRadius: '50%',
                                                                     flexShrink: 0
                                                                 }}></span>
                                                                 Chọn vị trí
                                                             </span>
                                                         )}
                                                         
                                                         {/* Zone chips display */}
                                                         <div style={{ 
                                                             display: 'flex', 
                                                             flexWrap: 'wrap', 
                                                             gap: 2, 
                                                             alignItems: 'center', 
                                                             justifyContent: 'center',
                                                             height: '24px', 
                                                             cursor: 'pointer', 
                                                             width: '100%',
                                                             maxWidth: '160px',
                                                             position: 'relative',
                                                             zIndex: 3
                                                         }}>
                                                             {(lot.zoneReal || []).filter(v => v !== null && v !== undefined && v !== '').length > 0 && (
                                                                 <>
                                                                     {(lot.zoneReal || []).filter(v => v !== null && v !== undefined && v !== '').slice(0, 2).map((zoneId) => {
                                                                         const z = zones.find(z => Number(z.id) === Number(zoneId));
                                                                         return z ? (
                                                                             <Chip
                                                                                 key={z.id}
                                                                                 label={z.zoneName}
                                                                                 size="small"
                                                                                 onClick={(e) => e.stopPropagation()}
                                                                                 sx={{
                                                                                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                                     color: 'white',
                                                                                     fontWeight: '600',
                                                                                     borderRadius: '6px',
                                                                                     height: '18px',
                                                                                     fontSize: '0.65rem',
                                                                                     maxWidth: '50px',
                                                                                     '& .MuiChip-label': {
                                                                                         padding: '0 4px',
                                                                                         overflow: 'hidden',
                                                                                         textOverflow: 'ellipsis',
                                                                                         whiteSpace: 'nowrap'
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
                                                                     {(lot.zoneReal || []).filter(v => v !== null && v !== undefined && v !== '').length > 2 && (
                                                                         <Chip
                                                                             key={`more-${(lot.zoneReal || []).filter(v => v !== null && v !== undefined && v !== '').length}`}
                                                                             label={`+${(lot.zoneReal || []).filter(v => v !== null && v !== undefined && v !== '').length - 2}`}
                                                                             size="small"
                                                                             onClick={(e) => e.stopPropagation()}
                                                                             sx={{ 
                                                                                 background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                                                                 color: '#d63384',
                                                                                 fontWeight: '700',
                                                                                 borderRadius: '6px',
                                                                                 height: '18px',
                                                                                 fontSize: '0.65rem',
                                                                                 minWidth: '20px',
                                                                                 '& .MuiChip-label': {
                                                                                     padding: '0 3px'
                                                                                 },
                                                                                 '&:hover': {
                                                                                     background: 'linear-gradient(135deg, #ffe4b5 0%, #fbb040 100%)',
                                                                                     transform: 'translateY(-1px)',
                                                                                     boxShadow: '0 2px 6px rgba(252, 182, 159, 0.3)'
                                                                                 },
                                                                                 transition: 'all 0.2s ease'
                                                                             }}
                                                                         />
                                                                     )}
                                                                 </>
                                                             )}
                                                         </div>
                                                         
                                                         {/* Zone Select dropdown */}
                                                    <Select
                                                             size="small"
                                                             variant="outlined"
                                                        multiple
                                                        value={Array.isArray(lot.zoneReal) ? lot.zoneReal.map(Number).filter(v => !isNaN(v)) : (lot.zoneReal ? lot.zoneReal.split(',').map(Number).filter(v => !isNaN(v)) : [])}
                                                        onChange={e => {
                                                                 handleLotChange(actualIdx, 'zoneReal', e.target.value);
                                                        }}
                                                        disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                                             onClick={e => e.stopPropagation()}
                                                             displayEmpty
                                                             renderValue={(selected) => {
                                                                 if (!selected || selected.length === 0) return '';
                                                                 return selected
                                                            .map(id => {
                                                                             const z = zones.find(z => Number(z.id) === Number(id));
                                                                return z ? z.zoneName : id;
                                                            })
                                                                    .join(', ');
                                                             }}
                                                             sx={{
                                                                 position: 'absolute',
                                                                 left: 0,
                                                                 top: 0,
                                                                 width: '100%',
                                                                 height: '100%',
                                                                 minWidth: 160,
                                                                 padding: 0,
                                                                 background: 'transparent',
                                                                 '& .MuiSelect-select': { 
                                                                     padding: '4px 8px', 
                                                                     height: '100%',
                                                                     opacity: 1,
                                                                     color: 'transparent',
                                                                     cursor: 'pointer'
                                                                 },
                                                                 '& .MuiOutlinedInput-root': {
                                                                     borderRadius: '4px',
                                                                     backgroundColor: 'transparent',
                                                                     '& .MuiOutlinedInput-notchedOutline': {
                                                                         border: 'none'
                                                                     },
                                                                     '&:hover': {
                                                                         '& .MuiOutlinedInput-notchedOutline': {
                                                                             border: 'none'
                                                                         }
                                                                     },
                                                                     '&.Mui-focused': {
                                                                         '& .MuiOutlinedInput-notchedOutline': {
                                                                             border: 'none'
                                                                         }
                                                                     }
                                                                 },
                                                                 '& .MuiSelect-icon': {
                                                                     right: 6,
                                                                     position: 'absolute',
                                                                     top: '50%',
                                                                     transform: 'translateY(-50%)',
                                                                     pointerEvents: 'auto',
                                                                     color: '#6c757d',
                                                                     transition: 'all 0.2s ease',
                                                                     fontSize: '0.875rem',
                                                                     zIndex: 2,
                                                                     '&:hover': {
                                                                         color: '#495057',
                                                                         transform: 'translateY(-50%) scale(1.1)'
                                                                     }
                                                                 },
                                                                 zIndex: 1,
                                                                 cursor: 'pointer',
                                                                 '&:hover': {
                                                                     '& .MuiSelect-icon': {
                                                                         color: '#495057'
                                                                     }
                                                                 }
                                                             }}
                                                             MenuProps={{
                                                                 PaperProps: {
                                                                     style: {
                                                                         maxHeight: 280,
                                                                         minWidth: 200,
                                                                         borderRadius: 12,
                                                                         boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                                                                         border: '1px solid #e9ecef',
                                                                         padding: 12,
                                                                     },
                                                                     sx: {
                                                                         '& .MuiMenu-list': {
                                                                             display: 'grid',
                                                                             gridTemplateColumns: 'repeat(2, 1fr)',
                                                                             gap: 1,
                                                                             padding: 0
                                                                         },
                                                                     },
                                                                 },
                                                             }}
                                                         >
                                                             {zones.map((zone) => (
                                                                 <MenuItem 
                                                                     key={zone.id} 
                                                                     value={zone.id} 
                                                                     style={{ 
                                                                         borderRadius: 6, 
                                                                         display: 'flex', 
                                                                         alignItems: 'center', 
                                                                         gap: 4, 
                                                                         padding: '6px 8px',
                                                                         margin: '1px 0',
                                                                         transition: 'all 0.2s ease'
                                                                     }}
                                                                 >
                                                                <Checkbox
                                                                         checked={(lot.zoneReal || []).map(Number).filter(v => !isNaN(v)).includes(Number(zone.id))} 
                                                                         color="primary" 
                                                                         size="small" 
                                                                         style={{ 
                                                                             padding: 1,
                                                                             color: '#667eea'
                                                                         }}
                                                                         onClick={(e) => {
                                                                             e.stopPropagation();
                                                                             e.preventDefault();
                                                                             
                                                                             const currentZoneReal = Array.isArray(lot.zoneReal) ? lot.zoneReal.map(Number).filter(v => !isNaN(v)) : [];
                                                                             const zoneId = Number(zone.id);
                                                                             
                                                                             let newZoneReal;
                                                                             if (currentZoneReal.includes(zoneId)) {
                                                                                 // Nếu zone đã được chọn, bỏ chọn
                                                                                 newZoneReal = currentZoneReal.filter(id => id !== zoneId);
                                                                             } else {
                                                                                 // Nếu zone chưa được chọn, thêm vào
                                                                                 newZoneReal = [...currentZoneReal, zoneId];
                                                                             }
                                                                             
                                                                             handleLotChange(actualIdx, 'zoneReal', newZoneReal);
                                                                         }}
                                                                     />
                                                                     <span style={{
                                                                         fontSize: '0.8rem',
                                                                         fontWeight: '500',
                                                                         color: '#495057',
                                                                         overflow: 'hidden',
                                                                         textOverflow: 'ellipsis',
                                                                         whiteSpace: 'nowrap',
                                                                         maxWidth: '80px'
                                                                     }}>
                                                                         {zone.zoneName}
                                                                     </span>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                     </div>
                                                     
                                                     {/* Icon xem chi tiết */}
                                                     <IconButton 
                                                         size="small" 
                                                         style={{ 
                                                             marginLeft: 6, 
                                                             color: '#667eea',
                                                             backgroundColor: '#f8f9fa',
                                                             border: '1px solid #e9ecef',
                                                             borderRadius: '4px',
                                                             width: '20px',
                                                             height: '20px',
                                                             zIndex: 2,
                                                             transition: 'all 0.2s ease',
                                                             flexShrink: 0
                                                         }} 
                                                         onClick={e => { 
                                                             e.stopPropagation(); 
                                                             setZonePopoverAnchor(e.currentTarget); 
                                                             setZonePopoverProductId(actualIdx); 
                                                             setZonePopoverType('real'); // Zones thực tế từ cột "Khu vực thực tế"
                                                         }}
                                                         sx={{
                                                             '&:hover': {
                                                                 backgroundColor: '#667eea',
                                                                 color: 'white',
                                                                 transform: 'translateY(-1px)',
                                                                 boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                                             }
                                                         }}
                                                     >
                                                         <VisibilityIcon sx={{ fontSize: '0.75rem' }} />
                                                     </IconButton>
                                                 </div>
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
                                                                ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' // Cam gradient cho số âm
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
                                            {!isMobile && <TableCell>
                                                <Checkbox
                                                    checked={!!lot.isCheck}
                                                    onChange={e => handleLotChange(actualIdx, 'isCheck', e.target.checked)}
                                                    disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                                />
                                            </TableCell>}
                                            {!isMobile && <TableCell>
                                                <TextField
                                                    size="small"
                                                    value={lot.note || ''}
                                                    onChange={e => handleLotChange(actualIdx, 'note', e.target.value)}
                                                    fullWidth
                                                    multiline
                                                    minRows={1}
                                                    maxRows={4}
                                                    inputProps={{ maxLength: 20 }}
                                                    disabled={editMode && stocktakeStatus !== 'DRAFT'}
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
                <div style={{
                    display: 'flex', alignItems: 'center', padding: 8, background: '#fafbfc',
                    borderRadius: 16, fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', 
                    width: 'fit-content', minWidth: 480, justifyContent: 'space-between',
                    height: '44px' // Chiều cao cố định
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8, fontFamily: 'Roboto, Arial, sans-serif', color: '#374151', fontWeight: 500 }}>Hiển thị</span>
                        <FormControl size="small" style={{ minWidth: 90, marginRight: 12, fontFamily: 'Roboto, Arial, sans-serif' }}>
                            <Select
                                value={rowsPerPage}
                                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                                style={{
                                    borderRadius: 10,
                                    fontFamily: 'Roboto, Arial, sans-serif',
                                    fontSize: 14,
                                    height: 36,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    border: '1px solid #d1d5db',
                                    padding: '4px 12px',
                                    backgroundColor: '#fff'
                                }}
                                MenuProps={{ PaperProps: { style: { fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14 } } }}
                            >
                                {[10, 25, 50, 100].map(opt => (
                                    <MenuItem key={opt} value={opt} style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14 }}>{opt} dòng</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button size="small" variant="outlined" style={{ minWidth: 32, borderRadius: 8, margin: '0 2px', padding: '4px 8px', borderColor: '#d1d5db', color: '#374151' }} disabled={page === 0} onClick={() => setPage(0)}>{'|<'}</Button>
                        <Button size="small" variant="outlined" style={{ minWidth: 32, borderRadius: 8, margin: '0 2px', padding: '4px 8px', borderColor: '#d1d5db', color: '#374151' }} disabled={page === 0} onClick={() => setPage(page - 1)}>{'<'}</Button>
                        <input
                            type="number"
                            min={1}
                            max={Math.ceil(lots.filter(lot => {
                        const matchSearch = !filter.search ||
                            (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                            (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                        return matchSearch;
                            }).length / rowsPerPage)}
                            value={page + 1}
                            onChange={e => {
                                let val = Number(e.target.value) - 1;
                                if (val < 0) val = 0;
                                if (val >= Math.ceil(lots.filter(lot => {
                                    const matchSearch = !filter.search ||
                                        (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                        (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                                    return matchSearch;
                                }).length / rowsPerPage)) val = Math.ceil(lots.filter(lot => {
                                    const matchSearch = !filter.search ||
                                        (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                        (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                                    return matchSearch;
                                }).length / rowsPerPage) - 1;
                                setPage(val);
                            }}
                            style={{
                                width: 40, textAlign: 'center', margin: '0 6px', height: 32, border: '1px solid #d1d5db',
                                borderRadius: 8, fontSize: 14, fontFamily: 'Roboto, Arial, sans-serif', 
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', outline: 'none', backgroundColor: '#fff'
                            }}
                        />
                        <Button size="small" variant="outlined" style={{ minWidth: 32, borderRadius: 8, margin: '0 2px', padding: '4px 8px', borderColor: '#d1d5db', color: '#374151' }} disabled={page + 1 >= Math.ceil(lots.filter(lot => {
                            const matchSearch = !filter.search ||
                                (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                            return matchSearch;
                        }).length / rowsPerPage)} onClick={() => setPage(page + 1)}>{'>'}</Button>
                        <Button size="small" variant="outlined" style={{ minWidth: 8, borderRadius: 8, margin: '0 2px', padding: '4px 8px', borderColor: '#d1d5db', color: '#374151' }} disabled={page + 1 >= Math.ceil(lots.filter(lot => {
                            const matchSearch = !filter.search ||
                                (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                            return matchSearch;
                        }).length / rowsPerPage)} onClick={() => setPage(Math.ceil(lots.filter(lot => {
                            const matchSearch = !filter.search ||
                                (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                            return matchSearch;
                        }).length / rowsPerPage) - 1)}>{'>|'}</Button>
                    </div>
                    
                    <div style={{ marginLeft: 16 }}>
                        <span style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                            {`${page * rowsPerPage + 1} - ${Math.min((page + 1) * rowsPerPage, lots.filter(lot => {
                                const matchSearch = !filter.search ||
                                    (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                    (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                                return matchSearch;
                            }).length)} trong ${lots.filter(lot => {
                                const matchSearch = !filter.search ||
                                    (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                    (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                                return matchSearch;
                            }).length} lô hàng`}
                        </span>
                    </div>
                </div>
                
                {/* Action buttons bên phải */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button onClick={() => {
                    setLots([]);
                    localStorage.removeItem('stocktake_create_selected_lots');
                    navigate("/stocktake");
                }}>Hủy</Button>
                {/* Nút lưu nháp, hoàn thành, xóa chỉ hiển thị khi editMode && stocktakeStatus === 'DRAFT' */}
                {(!editMode || stocktakeStatus === 'DRAFT') && (
                    <>
                        <Button variant="outlined" onClick={() => handleSubmit('DRAFT')}
                            sx={{ fontWeight: 600, borderRadius: 2 }}>Lưu nháp</Button>
                        <Button variant="contained" color="success" onClick={() => setConfirmCompleteDialog(true)}
                            sx={{ fontWeight: 600, borderRadius: 2 }}>Hoàn thành</Button>
                        {editMode && (
                            <Button color="error" onClick={() => {
                                setConfirmDialog({
                                    isOpen: true,
                                    title: "Xác nhận xóa phiếu kiểm kê",
                                    content: "Bạn có chắc chắn muốn xóa phiếu kiểm kê này? Thao tác này sẽ xóa vĩnh viễn phiếu khỏi hệ thống.",
                                    onConfirm: async () => {
                                        try {
                                            await axios.delete(`/stocktakes/${id}`);
                                            setSnackbar({
                                                isOpen: true,
                                                message: "Xóa phiếu kiểm kê thành công!",
                                                severity: "success"
                                            });
                                            navigate('/stocktake');
                                        } catch {
                                            setSnackbar({
                                                isOpen: true,
                                                message: "Xóa phiếu kiểm kê thất bại!",
                                                severity: "error"
                                            });
                                        }
                                    }
                                });
                            }}>
                                Xóa phiếu
                            </Button>
                        )}
                    </>
                )}
            </Box>
            </Box>
            

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
                    <Typography variant="h6" fontWeight={600}>Lọc</Typography>
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
                        
                        {/* Filter Ngày tháng */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} mb={2} color="#374151">
                                Ngày tạo:
                            </Typography>
                            
                            {/* Các nút tiện ích */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                <Button
                                    size="small"
                                    variant={!filter.startDate && !filter.endDate ? "contained" : "outlined"}
                                    onClick={() => setFilter(f => ({ ...f, startDate: '', endDate: '' }))}
                                    sx={{ fontSize: '0.75rem', px: 2, py: 0.5 }}
                                >
                                    Tất cả
                                </Button>
                                <Button
                                    size="small"
                                    variant={filter.startDate === getTodayString() && filter.endDate === getTodayString() ? "contained" : "outlined"}
                                    onClick={() => {
                                        const today = getTodayString();
                                        setFilter(f => ({ ...f, startDate: today, endDate: today }));
                                    }}
                                    sx={{ fontSize: '0.75rem', px: 2, py: 0.5 }}
                                >
                                    Hôm nay
                                </Button>
                                <Button
                                    size="small"
                                    variant={filter.startDate === getYesterdayString() && filter.endDate === getYesterdayString() ? "contained" : "outlined"}
                                    onClick={() => {
                                        const today = getTodayString();
                                        setFilter(f => ({ ...f, startDate: getYesterdayString(), endDate: getYesterdayString() }));
                                    }}
                                    sx={{ fontSize: '0.75rem', px: 2, py: 0.5 }}
                                >
                                    Hôm qua
                                </Button>
                                <Button
                                    size="small"
                                    variant={filter.startDate === getThisWeekStart() && filter.endDate === getThisWeekEnd() ? "contained" : "outlined"}
                                    onClick={() => {
                                        setFilter(f => ({ ...f, startDate: getThisWeekStart(), endDate: getThisWeekEnd() }));
                                    }}
                                    sx={{ fontSize: '0.75rem', px: 2, py: 0.5 }}
                                >
                                    Tuần này
                                </Button>
                                <Button
                                    size="small"
                                    variant={filter.startDate === getLastWeekStart() && filter.endDate === getLastWeekEnd() ? "contained" : "outlined"}
                                    onClick={() => {
                                        setFilter(f => ({ ...f, startDate: getLastWeekStart(), endDate: getLastWeekEnd() }));
                                    }}
                                    sx={{ fontSize: '0.75rem', px: 2, py: 0.5 }}
                                >
                                    Tuần trước
                                </Button>
                                <Button
                                    size="small"
                                    variant={filter.startDate === getThisMonthStart() && filter.endDate === getThisMonthEnd() ? "contained" : "outlined"}
                                    onClick={() => {
                                        setFilter(f => ({ ...f, startDate: getThisMonthStart(), endDate: getThisMonthEnd() }));
                                    }}
                                    sx={{ fontSize: '0.75rem', px: 2, py: 0.5 }}
                                >
                                    Tháng này
                                </Button>
                            </Box>
                            
                            {/* Input ngày tháng */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    type="date"
                                    label="Từ ngày"
                                    value={filter.startDate}
                                    onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))}
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ borderRadius: 2 }}
                                    inputProps={{
                                        max: filter.endDate || undefined
                                    }}
                                />
                                <TextField
                                    type="date"
                                    label="Đến ngày"
                                    value={filter.endDate}
                                    onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))}
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ borderRadius: 2 }}
                                    inputProps={{
                                        min: filter.startDate || undefined
                                    }}
                                />
                            </Box>
                            {(filter.startDate && filter.endDate && filter.startDate > filter.endDate) && (
                                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                    Ngày bắt đầu không được lớn hơn ngày kết thúc
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={() => {
                            setFilter(f => ({ ...f, zone: '', product: '', startDate: '', endDate: '' }));
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
        </Box>
    );
};

export default CreateStocktakePage;