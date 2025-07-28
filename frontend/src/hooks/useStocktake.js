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

    // Bộ lọc danh sách
    const [statusFilter, setStatusFilter] = useState("DRAFT");
    const [storeFilter, setStoreFilter] = useState(userStoreId || "");
    const [dateFilter, setDateFilter] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;
    });
    const [noteFilter, setNoteFilter] = useState("");
    const [codeFilter, setCodeFilter] = useState("");

    // Trang / phân trang
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

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
                !dateFilter ||
                (st.stocktakeDate && new Date(st.stocktakeDate).toISOString().slice(0, 10) === dateFilter);
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
    }, [stocktakes, codeFilter, statusFilter, dateFilter, noteFilter, userRole, userStoreId, userStoreName, storeFilter, userName]);

    const paginatedStocktakes = useMemo(() => {
        return filteredStocktakes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredStocktakes, page, rowsPerPage]);

    // ================== Load danh sách ==================
    const loadStocktakeList = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                status: statusFilter,
                note: noteFilter,
                fromDate: dateFilter,
                toDate: dateFilter,
            };
            if (userRole === "STAFF") {
                params.storeId = userStoreId;
                params.createdBy = userName;
            }
            const res = await getStocktakeList(params);
            setStocktakes(Array.isArray(res) ? res : []);
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
    }, [statusFilter, noteFilter, dateFilter, userRole, userStoreId, userName]);

    // ================== Load master data ==================
    const loadMasterData = useCallback(async () => {
        try {
            const [productsRes, zonesRes, storesRes, categoriesRes] = await Promise.all([
                productService.getAllProducts(),
                getZones(),
                getAllStores(),
                getCategories(),
            ]);
            setProducts(productsRes);
            setZones(zonesRes);
            setStores(storesRes);
            setCategories(categoriesRes);
        } catch (err) {
            console.error("Error loading master data:", err);
            setSnackbar({
                isOpen: true,
                message: "Lỗi khi tải dữ liệu cơ bản!",
                severity: "error",
            });
        }
    }, []);

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
        loadMasterData();
    }, [loadMasterData]);

    useEffect(() => {
        if (userRole === "STAFF" && staffStoreId && !storeFilter) setStoreFilter(staffStoreId);
    }, [userRole, staffStoreId, storeFilter]);

    useEffect(() => {
        setPage(0);
    }, [statusFilter, storeFilter, dateFilter, noteFilter, codeFilter]);

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
        dateFilter,
        setDateFilter,
        noteFilter,
        setNoteFilter,
        codeFilter,
        setCodeFilter,
        page,
        setPage,
        rowsPerPage,
        setRowsPerPage,
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

        // 👇 Thêm đầy đủ cho Create/Detail
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

        // 👇 Thêm mới cho Detail page
        detail,
        setDetail,
        filter,
        setFilter,
        filteredDetails,
    };
}
