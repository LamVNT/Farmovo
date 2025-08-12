import { useState, useEffect, useCallback, useMemo } from "react";
import {
    getStocktakeList,
    updateStocktakeStatus,
    updateStocktake,
} from "../services/stocktakeService";
import { productService } from "../services/productService";
import { getZones } from "../services/zoneService";
import { getAllStores } from "../services/storeService";
import { getCategories } from "../services/categoryService";

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
    const [statusFilter, setStatusFilter] = useState("DRAFT");
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
    const [filter, setFilter] = useState({ batchCode: "", productName: "" });

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
                matchesStore = !storeFilter || st.storeId === parseInt(storeFilter, 10) || st.storeName === userStoreName;
            }

            const matchesCreator = userRole === "STAFF" ? st.createdByName === userName : true;

            return matchesCode && matchesStatus && matchesDate && matchesNote && matchesStore && matchesCreator;
        });
    }, [stocktakes, codeFilter, statusFilter, fromDate, toDate, noteFilter, userRole, userStoreId, userStoreName, storeFilter, userName]);

    const paginatedStocktakes = useMemo(() => {
        return filteredStocktakes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredStocktakes, page, rowsPerPage]);

    // ================== Load danh sách ==================
    const loadStocktakeList = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const query = {
                page,
                size: rowsPerPage,
                status: statusFilter,
                note: noteFilter,
                fromDate: fromDate,
                toDate: toDate,
                ...(userRole === "OWNER" && storeFilter && { storeId: storeFilter }), // Lọc theo kho cho Owner
                ...(userRole === "STAFF" && { storeId: userStoreId }), // Giới hạn theo kho cho Staff
            };
            const res = await getStocktakeList(query);
            setStocktakes(res.content || []);
            setTotal(res.totalElements || 0);
            setPage(res.number || 0);
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

    // ================== Load master data ==================
    // Helper xác định role
    const isStaff = userRole === "STAFF" || userRole === "ROLE_STAFF";
    const isOwner = userRole === "OWNER" || userRole === "ROLE_OWNER";
    const isAdmin = userRole === "ADMIN" || userRole === "ROLE_ADMIN";

    const loadMasterData = useCallback(async () => {
        try {
            let productsRes, zonesRes, storesRes, categoriesRes;
            if (isStaff) {
                // Staff chỉ cần lấy products, zones, categories, KHÔNG gọi getAllStores
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
                // Owner/Admin lấy đủ
                [productsRes, zonesRes, storesRes, categoriesRes] = await Promise.all([
                    productService.getAllProducts(),
                    getZones(),
                    getAllStores(),
                    getCategories(),
                ]);
                setProducts(productsRes);
                setZones(zonesRes);
                // Sửa tại đây: đảm bảo storesRes là mảng, nếu không thì set [] và log lỗi
                if (Array.isArray(storesRes)) {
                    setStores(storesRes.map(s => ({
                        id: s.id,
                        name: s.name || s.storeName
                    })));
                } else {
                    console.error("Dữ liệu kho trả về không hợp lệ:", storesRes);
                    setStores([]);
                }
                setCategories(categoriesRes);
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
            setActionLoading((prev) => ({ ...prev, [id]: true }));
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
                setActionLoading((prev) => ({ ...prev, [id]: false }));
            }
        },
        [loadStocktakeList]
    );

    // ================== Cancel ==================
    const handleCancel = useCallback(
        async (id) => {
            setActionLoading((prev) => ({ ...prev, [id]: true }));
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
                setActionLoading((prev) => ({ ...prev, [id]: false }));
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
        paginatedStocktakes,
        handleUpdateStatus,
        handleCancel,
        loadStocktakeList,
        loadMasterData,
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
    };
}