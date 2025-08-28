import {useState, useEffect, useCallback, useMemo} from "react";
import {
    getStocktakeList,
    updateStocktakeStatus,
    updateStocktake,
} from "../services/stocktakeService";
import {productService} from "../services/productService";
import {getZones} from "../services/zoneService";
import {getAllStores} from "../services/storeService";
import {getCategories} from "../services/categoryService";
import axios from "../services/axiosClient";
import {saveAs} from 'file-saver';

export default function useStocktake(user, userRole) {
    // ================== Thông tin người dùng ==================
    let userStoreId = "";
    if (user && user.store && typeof user.store === "object" && user.store.id != null) {
        userStoreId = user.store.id;
    } else if (typeof user?.storeId === "number") {
        userStoreId = user.storeId;
    }

    let userStoreName = "";
    if (user && user.store && typeof user.store === "object" && typeof user.store.name === "string") {
        userStoreName = user.store.name;
    } else if (typeof user?.storeName === "string") {
        userStoreName = user.storeName;
    }

    const userName = user?.fullName || user?.username || "";
    const staffStoreId = localStorage.getItem("staff_store_id") || "";

    // ================== State chính ==================
    const [stocktakes, setStocktakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [stores, setStores] = useState([]);
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);

    // Bộ lọc danh sách
    const [statusFilter, setStatusFilter] = useState("");
    const [storeFilter, setStoreFilter] = useState(""); // Mặc định rỗng cho Owner, tự động đặt cho Staff
    const [fromDate, setFromDate] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    });
    const [toDate, setToDate] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    });
    const [noteFilter, setNoteFilter] = useState("");
    const [codeFilter, setCodeFilter] = useState("");
    // Loading trạng thái
    const [actionLoading, setActionLoading] = useState({});
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        content: "",
        onConfirm: null,
    });
    const [snackbar, setSnackbar] = useState({
        isOpen: false,
        message: "",
        severity: "success",
    });

    // ================== State bổ sung cho Create/Detail ==================
    const [editMode, setEditMode] = useState(false);
    const [stocktakeStatus, setStocktakeStatus] = useState("DRAFT");
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchAnchorEl, setSearchAnchorEl] = useState(null);
    const [selectedLots, setSelectedLots] = useState([]);
    const [rawDetail, setRawDetail] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // ✅ Thêm state cho Detail page
    const [detail, setDetail] = useState(null);
    const [filter, setFilter] = useState({batchCode: "", productName: ""});

    const filteredDetails = useMemo(() => {
        if (!detail || !Array.isArray(detail.detail)) return [];
        return detail.detail.filter((d) => {
            const matchBatch =
                !filter.batchCode || (d.batchCode || "").toLowerCase().includes(filter.batchCode.toLowerCase());
            const matchProduct =
                !filter.productName || (d.productName || "").toLowerCase().includes(filter.productName.toLowerCase());
            return matchBatch && matchProduct;
        });
    }, [detail, filter]);

    // ================== Lọc danh sách ==================
    const filteredStocktakes = useMemo(() => {
        return (Array.isArray(stocktakes) ? stocktakes : []).filter((st) => {
            const matchesCode = !codeFilter || (st.name && st.name.toLowerCase().includes(codeFilter.toLowerCase()));
            const matchesStatus = !statusFilter || st.status === statusFilter;
            const matchesDate =
                !fromDate || !toDate ||
                (st.stocktakeDate && new Date(st.stocktakeDate).toISOString().slice(0, 10) >= fromDate && new Date(st.stocktakeDate).toISOString().slice(0, 10) <= toDate);
            const matchesNote =
                !noteFilter || (st.stocktakeNote && st.stocktakeNote.toLowerCase().includes(noteFilter.toLowerCase()));

            let matchesStore = true;
            if (userRole === "STAFF") {
                matchesStore = (st.storeId && st.storeId === userStoreId) || (!st.storeId && st.storeName === userStoreName);
            } else {
                // Admin/Owner: nếu không có storeFilter thì hiển thị tất cả, nếu có thì filter theo storeId
                matchesStore = !storeFilter || st.storeId === parseInt(storeFilter, 10);
            }

            const matchesCreator = userRole === "STAFF" ? st.createdByName === userName : true;

            return matchesCode && matchesStatus && matchesDate && matchesNote && matchesStore && matchesCreator;
        });
    }, [stocktakes, codeFilter, statusFilter, fromDate, toDate, noteFilter, userRole, userStoreId, userStoreName, storeFilter, userName]);

    // Không cần paginatedStocktakes nữa vì backend đã phân trang

    // ================== Load danh sách ==================
    const loadStocktakeList = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const query = {
                page,
                size: rowsPerPage,
                ...(statusFilter && {status: statusFilter}),
                note: noteFilter,
                fromDate: fromDate,
                toDate: toDate,
            };

            // Thêm storeId cho Owner/Admin nếu có chọn kho
            const isOwnerOrAdmin = ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(userRole);
            if (isOwnerOrAdmin && storeFilter && storeFilter !== "") {
                query.storeId = String(storeFilter);
            }

            // Thêm storeId cho Staff
            if (userRole === "STAFF" && userStoreId) {
                query.storeId = userStoreId;
            }

            const res = await getStocktakeList(query);
            setStocktakes(res.content || []);
            setTotal(res.totalElements || 0);
            // Không set lại page từ response để tránh conflict với user action
        } catch (err) {
            console.error("Error loading stocktake list:", err);
            setSnackbar({
                isOpen: true,
                message: "Lỗi khi lấy danh sách phiếu kiểm kê!",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [statusFilter, noteFilter, fromDate, toDate, userRole, userStoreId, storeFilter, page, rowsPerPage]);

    // ================== Auto reload khi thay đổi filters hoặc pagination ==================
    useEffect(() => {
        loadStocktakeList();
    }, [loadStocktakeList]);

    // ================== Load master data ==================
    // Helper xác định role
    const isStaff = userRole === "STAFF" || userRole === "ROLE_STAFF";
    const isOwner = userRole === "OWNER" || userRole === "ROLE_OWNER";
    const isAdmin = userRole === "ADMIN" || userRole === "ROLE_ADMIN";

    // Hàm load zones theo store
    const loadZonesByStore = useCallback(async (storeId) => {
        if (!storeId) return;
        try {
            const zonesRes = await getZones(storeId);
            setZones(zonesRes || []);
        } catch (zoneErr) {
            console.error("Error loading zones for store:", zoneErr);
            setZones([]);
        }
    }, []);

    const loadMasterData = useCallback(async (selectedStoreId = null) => {
        try {
            let productsRes, zonesRes, categoriesRes, storesRes;
            if (isStaff) {
                // Staff chỉ cần lấy products, zones, categories, KHÔNG cần stores
                [productsRes, zonesRes, categoriesRes] = await Promise.all([
                    productService.getAllProducts(),
                    getZones(),
                    getCategories(),
                ]);
                setProducts(productsRes);
                setZones(zonesRes);
                setCategories(categoriesRes);
                setStores([]); // Staff không cần danh sách kho
            } else {
                // Owner/Admin cần stores cho filter dropdown ở trang StockTake
                [productsRes, storesRes, categoriesRes] = await Promise.all([
                    productService.getAllProducts(),
                    getAllStores(),
                    getCategories(),
                ]);
                setProducts(productsRes);
                
                // Sửa tại đây: đảm bảo storesRes là mảng, nếu không thì set [] và log lỗi
                if (Array.isArray(storesRes)) {
                    const mappedStores = storesRes.map(s => ({
                        id: s.id,
                        name: s.name || s.storeName
                    }));
                    setStores(mappedStores);
                } else {
                    console.error("Dữ liệu kho trả về không hợp lệ:", storesRes);
                    setStores([]);
                }
                setCategories(categoriesRes);
                
                // Load zones theo store đã chọn (nếu có)
                if (selectedStoreId) {
                    try {
                        const zonesRes = await getZones(selectedStoreId);
                        setZones(zonesRes || []);
                    } catch (zoneErr) {
                        console.error("Error loading zones for store:", zoneErr);
                        setZones([]);
                    }
                } else {
                    // Nếu chưa chọn store, load tất cả zones
                    const zonesRes = await getZones();
                    setZones(zonesRes || []);
                }
            }
        } catch (err) {
            console.error("Error loading master data:", err);
            setSnackbar({
                isOpen: true,
                message: "Lỗi khi tải dữ liệu cơ bản!",
                severity: "error",
            });
        }
    }, [isStaff]);

    // ================== Update status ==================
    const handleUpdateStatus = useCallback(
        async (id, newStatus) => {
            setActionLoading((prev) => ({...prev, [id]: true}));
            try {
                await updateStocktakeStatus(id, newStatus);
                setSnackbar({
                    isOpen: true,
                    message: `Cập nhật trạng thái thành công!`,
                    severity: "success",
                });
                await loadStocktakeList();
            } catch (err) {
                console.error("Error updating status:", err);
                setSnackbar({
                    isOpen: true,
                    message: `Cập nhật trạng thái thất bại! ${err?.response?.data?.message || ""}`,
                    severity: "error",
                });
            } finally {
                setActionLoading((prev) => ({...prev, [id]: false}));
            }
        },
        [loadStocktakeList]
    );

    // ================== Cancel ==================
    const handleCancel = useCallback(
        async (id) => {
            setActionLoading((prev) => ({...prev, [id]: true}));
            try {
                const st = stocktakes.find((s) => s.id === id);
                if (!st) throw new Error("Không tìm thấy phiếu");

                let detailArr = [];
                if (Array.isArray(st.detail)) {
                    detailArr = st.detail;
                } else if (Array.isArray(st.rawDetail)) {
                    detailArr = st.rawDetail;
                } else if (typeof st.detail === "string") {
                    try {
                        detailArr = JSON.parse(st.detail);
                    } catch {
                        detailArr = [];
                    }
                }

                const mappedDetail = (detailArr || [])
                    .filter((lot) => lot && (lot.id != null || lot.productId != null || lot.batchCode))
                    .map((lot) => ({
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
                        expireDate: lot.expireDate,
                    }));

                const storeId = st.storeId || (userRole === "STAFF" ? userStoreId : null);
                if (!storeId) throw new Error("Không tìm thấy thông tin cửa hàng");

                await updateStocktake(id, {
                    id: st.id,
                    detail: mappedDetail,
                    stocktakeNote: st.stocktakeNote || "",
                    storeId: storeId,
                    status: "CANCELLED",
                    stocktakeDate: st.stocktakeDate,
                });

                setSnackbar({
                    isOpen: true,
                    message: "Đã hủy phiếu thành công!",
                    severity: "success",
                });
                await loadStocktakeList();
            } catch (err) {
                console.error("Error cancelling stocktake:", err);
                setSnackbar({
                    isOpen: true,
                    message: `Hủy phiếu thất bại! ${err?.response?.data?.message || ""}`,
                    severity: "error",
                });
            } finally {
                setActionLoading((prev) => ({...prev, [id]: false}));
            }
        },
        [stocktakes, userRole, userStoreId, loadStocktakeList]
    );

    // ================== Effect ==================
    useEffect(() => {
        loadStocktakeList();
    }, [loadStocktakeList]);

    useEffect(() => {
        if (isOwner || isAdmin) {
            loadMasterData();
        }
        if (isStaff) {
            loadMasterData();
        }
        // Không gọi khi userRole chưa xác định
    }, [isOwner, isAdmin, isStaff, loadMasterData]);

    useEffect(() => {
        if (isStaff && staffStoreId && !storeFilter) {
            setStoreFilter(staffStoreId);
        } else if (isOwner && storeFilter) {
            setStoreFilter(""); // Đặt lại storeFilter về rỗng cho Owner khi tải lại
        }
    }, [isStaff, isOwner, staffStoreId, storeFilter]);

    useEffect(() => {
        setPage(0);
    }, [statusFilter, storeFilter, fromDate, toDate, noteFilter, codeFilter]);

    // ================== Export Excel ==================
    const handleExportExcel = useCallback(async (stocktake, details, products, zones) => {
        try {
            const response = await axios.get(`/stocktakes/${stocktake.id}/export-excel`, {
                responseType: 'blob'
            });

            // Tạo tên file
            const fileName = `KiemKe_${stocktake.name || stocktake.id}_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Tạo blob và download
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            saveAs(blob, fileName);

            setSnackbar({
                isOpen: true,
                message: 'Xuất Excel thành công!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Export Excel error:', error);
            setSnackbar({
                isOpen: true,
                message: 'Xuất Excel thất bại!',
                severity: 'error'
            });
        }
    }, [setSnackbar]);

    // ================== Return ==================
    return {
        stocktakes,
        loading,
        products,
        zones,
        stores,
        categories,
        statusFilter,
        setStatusFilter,
        storeFilter,
        setStoreFilter,
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        noteFilter,
        setNoteFilter,
        codeFilter,
        setCodeFilter,
        page,
        setPage,
        rowsPerPage,
        setRowsPerPage,
        total,
        actionLoading,
        setActionLoading,
        confirmDialog,
        setConfirmDialog,
        snackbar,
        setSnackbar,
        filteredStocktakes,
        handleUpdateStatus,
        handleCancel,
        loadStocktakeList,
        loadMasterData,
        loadZonesByStore,
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
        selectedLots,
        setSelectedLots,
        rawDetail,
        setRawDetail,
        dataLoaded,
        setDataLoaded,
        detail,
        setDetail,
        filter,
        setFilter,
        filteredDetails,
        handleExportExcel,
    };
}