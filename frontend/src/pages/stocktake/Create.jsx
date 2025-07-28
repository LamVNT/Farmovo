import React, {useState, useEffect} from "react";
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
    useTheme,
    useMediaQuery
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import {getZones} from "../../services/zoneService";
import {createStocktake, getStocktakeById, updateStocktake, deleteStocktake} from "../../services/stocktakeService";
import {getAllStores} from "../../services/storeService";
import axios from '../../services/axiosClient';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";
import {useNavigate, useParams} from "react-router-dom";
import {getCategories} from '../../services/categoryService';
import useStocktake from "../../hooks/useStocktake";

const CreateStocktakePage = () => {
    const {id} = useParams();
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
    } = useStocktake(user, userRole);
    const staffStoreId = localStorage.getItem('staff_store_id') || '';
    const [filter, setFilter] = useState({store: '', zone: '', product: '', search: ''});
    const [loadingLots, setLoadingLots] = useState(false);
    const [lots, setLots] = useState([]); // luôn khởi tạo là []
    // Khôi phục dữ liệu đã nhập từ localStorage nếu có (chỉ khi tạo mới, không phải editMode)
    const [confirmCompleteDialog, setConfirmCompleteDialog] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        // Nếu là STAFF thì luôn set filter.store là kho của staff
        if (userRole === 'STAFF' && staffStoreId) {
            setFilter(f => ({...f, store: staffStoreId}));
        }
    }, []);

    // Lấy danh sách lô khi filter hoặc products thay đổi
    useEffect(() => {
        // Nếu đang ở chế độ chỉnh sửa và chưa tải dữ liệu phiếu, bỏ qua việc tải lô theo filter
        if (id && !dataLoaded) return;

        if (products.length === 0) return; // Chỉ fetch lots khi đã có products
        // Chỉ fetch lots khi có thao tác search hoặc lọc (zone/product/search)
        // Nếu filter.product có giá trị thì vẫn fetch lots, không cần filter.zone
        if (!filter.search && !filter.product && !filter.zone) {
            setLots([]);
            return;
        }
        const fetchLots = async () => {
            setLoadingLots(true);
            try {
                const params = new URLSearchParams();
                if (filter.store) params.append('store', filter.store);
                if (filter.zone) params.append('zone', filter.zone);
                if (filter.product) params.append('product', filter.product);
                if (filter.batchCode) params.append('batchCode', filter.batchCode);
                if (filter.search) params.append('search', filter.search);
                const res = await axios.get(`/import-details/stocktake-lot?${params.toString()}`);
                // Chuẩn hóa lại lots: đảm bảo có productId và zoneIds (có thể là mảng)
                const lotsData = (res.data || []).map(lot => {
                    let zoneIds = lot.zoneIds || lot.zones_id || lot.zoneId || lot.zone_id || [];
                    if (typeof zoneIds === 'string') {
                        zoneIds = zoneIds.split(',').map(z => z.trim()).filter(Boolean);
                    }
                    if (!Array.isArray(zoneIds)) {
                        zoneIds = zoneIds ? [zoneIds] : [];
                    }
                    // Map productId từ products dựa vào productName (so sánh trim, không phân biệt hoa thường)
                    let productId = lot.productId || lot.product?.id || lot.product_id || '';
                    if (!productId && lot.productName && products.length > 0) {
                        const found = products.find(p => p.productName.trim().toLowerCase() === lot.productName.trim().toLowerCase());
                        if (found) productId = found.id;
                    }
                    if (!productId) {
                        console.warn('[DEBUG] Không tìm thấy productId cho lô:', lot);
                    }
                    return {
                        ...lot,
                        productId,
                        zoneIds,
                        zoneId: zoneIds[0] || '',
                    };
                });
                // Log tất cả các lô bị thiếu productId
                const missingProductIdLots = lotsData.filter(lot => !lot.productId);
                if (missingProductIdLots.length > 0) {
                    console.warn('[DEBUG] Các lô bị thiếu productId:', missingProductIdLots);
                }
                setLots(lotsData);
            } catch (err) {
                setLots([]);
                console.error('[DEBUG] Lỗi khi fetch lots:', err);
            } finally {
                setLoadingLots(false);
            }
        };
        fetchLots();
    }, [filter, products, id, dataLoaded]);

    // Nếu có id trên URL, load dữ liệu phiếu kiểm kê (enrich lại từ API lots theo batchCode)
    useEffect(() => {
        if (id && !dataLoaded) {
            getStocktakeById(id).then(data => {
                if (!data) {
                    console.error("Stocktake data is null/undefined!", data);
                    setDataLoaded(true);
                    return;
                }
                console.log("Stocktake data from API:", data);
                setEditMode(true);
                setStocktakeStatus(data.status);
                setFilter(f => ({...f, store: data.storeId}));

                // Lấy dữ liệu từ detail thay vì rawDetail
                let detailData = data.detail || [];
                console.log("Detail data before parsing:", detailData);

                if (typeof detailData === 'string') {
                    try {
                        detailData = JSON.parse(detailData);
                        console.log("Detail data after parsing:", detailData);
                    } catch (e) {
                        console.error("Error parsing detail data:", e);
                        detailData = [];
                    }
                }

                // Đảm bảo detailData là array
                if (!Array.isArray(detailData)) {
                    console.warn("detailData is not an array, converting to empty array");
                    detailData = [];
                }

                const batchCodes = detailData.map(lot => lot.batchCode).filter(Boolean);
                console.log("Batch codes extracted:", batchCodes); // Log các batchCode

                if (batchCodes.length > 0) {
                    // Thay đổi cách gọi API: gọi riêng lẻ cho từng batchCode và gộp kết quả
                    console.log("Calling API for individual batch codes");

                    // Tạo mảng các promise gọi API cho từng batchCode
                    const batchPromises = batchCodes.map(code =>
                        axios.get(`/import-details/stocktake-lot?batchCode=${code}`)
                            .then(res => {
                                console.log(`API response for batch code ${code}:`, res.data);
                                return res.data;
                            })
                            .catch(err => {
                                console.error(`Error fetching batch code ${code}:`, err);
                                return [];
                            })
                    );

                    // Đợi tất cả các promise hoàn thành
                    Promise.all(batchPromises)
                        .then(results => {
                            // Gộp kết quả từ tất cả các API call
                            const combinedLotsData = results.flat();
                            console.log("Combined results from all API calls:", combinedLotsData);

                            if (combinedLotsData.length > 0) {
                                const enrichedLots = detailData.map(lot => {
                                    const enrich = combinedLotsData.find(l => l.name === lot.batchCode);
                                    console.log(`Matching for batch code ${lot.batchCode}:`, enrich ? "Found" : "Not found");

                                    return {
                                        ...enrich,
                                        ...lot,
                                        id: enrich?.id || lot.id,
                                        batchCode: lot.batchCode || enrich?.name,
                                        productId: lot.productId || enrich?.productId,
                                        productName: lot.productName || enrich?.productName,
                                        zones_id: enrich?.zonesId || enrich?.zones_id || lot.zones_id,
                                        zoneName: enrich?.zoneName || lot.zoneName,
                                        remain: enrich?.remainQuantity || lot.remain,
                                        expireDate: enrich?.expireDate || lot.expireDate,
                                    };
                                });

                                console.log("Final enriched lots:", enrichedLots);
                                setSelectedLots(enrichedLots);
                            } else {
                                console.warn("All API calls returned empty data");
                                setSelectedLots(detailData);
                            }
                        })
                        .catch(err => {
                            console.error("Error in batch API calls:", err);
                            setSelectedLots(detailData);
                        })
                        .finally(() => {
                            // Đánh dấu đã tải dữ liệu xong
                            setDataLoaded(true);
                        });
                } else {
                    console.log("No batch codes found, using detail data directly");
                    setSelectedLots(detailData);
                    // Đánh dấu đã tải dữ liệu xong
                    setDataLoaded(true);
                }
            }).catch(err => {
                console.error("Error fetching stocktake:", err);
                // Đánh dấu đã tải dữ liệu (dù có lỗi) để không bị lặp lại
                setDataLoaded(true);
            });
        }

        // Hàm xử lý dữ liệu lô từ API
        function processLotsData(detailData, lotsData) {
            console.log("Processing lots data. Detail data:", detailData.length, "Lots data:", lotsData.length);

            const enrichedLots = detailData.map(lot => {
                const enrich = lotsData.find(l => l.name === lot.batchCode);
                console.log(`Matching for batch code ${lot.batchCode}:`, enrich ? "Found" : "Not found");

                return {
                    ...enrich,
                    ...lot,
                    id: enrich?.id || lot.id,
                    batchCode: lot.batchCode || enrich?.name,
                    productId: lot.productId || enrich?.productId,
                    productName: lot.productName || enrich?.productName,
                    zones_id: enrich?.zonesId || enrich?.zones_id || lot.zones_id,
                    zoneName: enrich?.zoneName || lot.zoneName,
                    remain: enrich?.remainQuantity || lot.remain,
                    expireDate: enrich?.expireDate || lot.expireDate,
                };
            });

            console.log("Final enriched lots:", enrichedLots);
            setSelectedLots(enrichedLots);
        }
    }, [id]);

    // Xóa useEffect enrich selectedLots theo lots và rawDetail cũ (nếu còn)

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
                real: '',
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
    const handleLotChange = (idx, field, value) => {
        setSelectedLots(prev => prev.map((lot, i) => {
            if (i !== idx) return lot;
            let newLot = {...lot, [field]: value};
            if (field === 'real') {
                const realVal = Number(value);
                newLot.diff = realVal - (Number(lot.remainQuantity) || 0);
            }
            return newLot;
        }));
    };

    // Validate và submit
    const handleSubmit = async (status) => {
        if (!Array.isArray(selectedLots) || selectedLots.length === 0) {
            setSnackbar({isOpen: true, message: "Vui lòng chọn ít nhất một lô để kiểm kê!", severity: "error"});
            return;
        }
        const missingProductIdLots = selectedLots.filter(lot => !lot.productId);
        if (missingProductIdLots.length > 0) {
            setSnackbar({
                isOpen: true,
                message: `Không thể tạo phiếu! Có ${missingProductIdLots.length} lô bị thiếu productId.`,
                severity: "error"
            });
            console.warn('[DEBUG] Không thể submit, các lô thiếu productId:', missingProductIdLots);
            return;
        }
        for (const lot of selectedLots) {
            if (lot.real === '' || isNaN(Number(lot.real))) {
                setSnackbar({
                    isOpen: true,
                    message: `Vui lòng nhập số thực tế cho lô ${lot.name || lot.id}!`,
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
        const detail = selectedLots.map(lot => ({
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
            const payload = {
                detail,
                stocktakeNote: "Phiếu kiểm kê mới",
                status,
                stocktakeDate: new Date().toISOString(),
                storeId: userRole === 'OWNER' ? filter.store : (user?.store?.id || user?.storeId)
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
            setSelectedLots([]);
            localStorage.removeItem('stocktake_create_selected_lots');
            navigate("/stocktake", {state: {successMessage: status === 'COMPLETED' ? "Hoàn thành phiếu kiểm kê thành công!" : "Lưu nháp phiếu kiểm kê thành công!"}});
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
        <Box key={cat.id} sx={{pl: level * 2, display: 'flex', alignItems: 'center', py: 0.5}}>
            <Checkbox
                checked={false} // Always unchecked for now, as selectedCategories state is removed
                onChange={() => {
                }}
                size="small"
            />
            <Typography sx={{fontWeight: 500}}>{cat.name}</Typography>
        </Box>
    ));

    return (
        <Box sx={{maxWidth: 1200, margin: "40px auto", background: "#fff", p: 4, borderRadius: 3, boxShadow: 2}}>
            <Typography variant="h5" fontWeight={700} mb={2}>Tạo phiếu kiểm kê mới</Typography>
            <Box sx={{display: 'flex', gap: 2, mb: 2, alignItems: 'center'}}>
                <Box sx={{position: 'relative'}}>
                    <TextField
                        size="small"
                        label="Tìm kiếm nhanh (mã lô, tên sản phẩm, ...)"
                        value={filter.search}
                        onChange={e => {
                            setFilter(f => ({...f, search: e.target.value}));
                            setShowSuggestions(!!e.target.value);
                        }}
                        onFocus={e => setShowSuggestions(!!filter.search)}
                        inputRef={el => setSearchAnchorEl(el)}
                        sx={{minWidth: 250, width: 380}}
                        InputProps={{
                            endAdornment: (
                                <IconButton size="small" onClick={() => setFilterDialogOpen(true)} sx={{mx: 0.5}}>
                                    <FilterListIcon/>
                                </IconButton>
                            )
                        }}
                    />
                    {/* Popup gợi ý sản phẩm/lô */}
                    <Popper open={showSuggestions && searchSuggestions.length > 0} anchorEl={searchAnchorEl}
                            placement="bottom-start" style={{zIndex: 1300, width: searchAnchorEl?.offsetWidth}}>
                        <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
                            <Paper elevation={3} sx={{mt: 1, borderRadius: 2, width: '100%'}}>
                                {searchSuggestions.map((p, idx) => (
                                    <Box key={p.id} sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: 1.5,
                                        cursor: 'pointer',
                                        '&:hover': {background: '#f5f5f5'}
                                    }}
                                         onClick={() => {
                                             setFilter(f => ({...f, search: p.productName}));
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
                                                 style={{width: 32, height: 32, objectFit: 'cover'}} onError={e => {
                                                e.target.style.display = 'none';
                                            }}/>
                                        </Box>
                                        <Box sx={{flex: 1}}>
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
                {/* ĐÃ DI CHUYỂN filter zone và sản phẩm vào dialog, ngoài này KHÔNG còn */}
            </Box>
            {/* Chỉ hiển thị danh sách lô khi có thao tác search/lọc */}
            {(filter.search || filter.zone || filter.product) && (
                <>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>Danh sách lô phù hợp</Typography>
                    <TableContainer component={Paper} elevation={1}
                                    sx={{mb: 2, borderRadius: 2, minWidth: isMobile ? '100%' : 700}}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{background: "#f5f5f5"}}>
                                    <TableCell padding="checkbox"></TableCell>
                                    <TableCell><b>Mã lô</b></TableCell>
                                    {!isMobile && <TableCell><b>Khu vực</b></TableCell>}
                                    <TableCell><b>Sản phẩm</b></TableCell>
                                    <TableCell><b>Tồn kho</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingLots ? (
                                    <TableRow><TableCell colSpan={isMobile ? 4 : 5} align="center"><CircularProgress
                                        size={24}/></TableCell></TableRow>
                                ) : lots.length === 0 ? (
                                    <TableRow><TableCell colSpan={isMobile ? 4 : 5} align="center">Không có lô phù
                                        hợp</TableCell></TableRow>
                                ) : lots.map((lot, idx) => (
                                    <TableRow key={lot.id} hover>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={Array.isArray(selectedLots) && selectedLots.some(l => l.id === lot.id)}
                                                onChange={e => {
                                                    if (e.target.checked) handleSelectLot(lot);
                                                    else setSelectedLots(prev => prev.filter(l => l.id !== lot.id));
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{lot.name}</TableCell>
                                        {!isMobile && <TableCell>{lot.zoneName || lot.zoneId}</TableCell>}
                                        <TableCell>{lot.productName || lot.productId}</TableCell>
                                        <TableCell>{lot.remainQuantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Các lô đã chọn để kiểm kê</Typography>
            <TableContainer component={Paper} elevation={1} sx={{mb: 2, borderRadius: 2}}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{background: "#f5f5f5"}}>
                            <TableCell><b>STT</b></TableCell>
                            <TableCell><b>Mã lô</b></TableCell>
                            {!isMobile && <TableCell><b>Khu vực</b></TableCell>}
                            <TableCell><b>Sản phẩm</b></TableCell>
                            {!isMobile && <TableCell><b>Tồn kho</b></TableCell>}
                            {!isMobile && <TableCell><b>Hạn dùng</b></TableCell>}
                            <TableCell><b>Thực tế</b></TableCell>
                            {!isMobile && <TableCell><b>Khu vực thực tế</b></TableCell>}
                            <TableCell><b>Chênh lệch</b></TableCell>
                            {!isMobile && <TableCell><b>Đã kiểm</b></TableCell>}
                            {!isMobile && <TableCell><b>Ghi chú</b></TableCell>}
                            <TableCell align="center"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(Array.isArray(selectedLots) ? selectedLots.length : 0) === 0 ? (
                            <TableRow><TableCell colSpan={isMobile ? 5 : 12} align="center">Chưa có lô nào được
                                chọn</TableCell></TableRow>
                        ) : selectedLots.map((lot, idx) => (
                            <TableRow
                                key={(lot.batchCode || lot.name || 'row') + '-' + (lot.productId || '') + '-' + idx}
                                hover>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>{lot.name || lot.batchCode}</TableCell>
                                {!isMobile && <TableCell>{lot.zoneName || lot.zoneId}</TableCell>}
                                <TableCell>{lot.productName || lot.productId}</TableCell>
                                {!isMobile && <TableCell>{lot.remainQuantity}</TableCell>}
                                {!isMobile &&
                                    <TableCell>{lot.expireDate ? new Date(lot.expireDate).toLocaleDateString("vi-VN") : ""}</TableCell>}
                                <TableCell>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={lot.real}
                                        onChange={e => handleLotChange(idx, 'real', e.target.value)}
                                        inputProps={{min: 0}}
                                        fullWidth
                                        disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                    />
                                </TableCell>
                                {!isMobile && <TableCell>
                                    <FormControl size="small" fullWidth>
                                        <Select
                                            multiple
                                            value={Array.isArray(lot.zoneReal) ? lot.zoneReal : (lot.zoneReal ? lot.zoneReal.split(',') : [])}
                                            onChange={e => handleLotChange(idx, 'zoneReal', e.target.value)}
                                            disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                            renderValue={selected => selected
                                                .map(id => {
                                                    const z = zones.find(z => z.id === id || z.id === Number(id));
                                                    return z ? z.zoneName : id;
                                                })
                                                .join(', ')}
                                        >
                                            {zones.map(z => (
                                                <MenuItem key={z.id} value={z.id}>
                                                    <Checkbox
                                                        checked={Array.isArray(lot.zoneReal) ? lot.zoneReal.indexOf(z.id) > -1 : false}/>
                                                    <Typography>{z.zoneName}</Typography>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>}
                                <TableCell sx={lot.diff !== 0 ? {background: '#ffeaea'} : {}}>{lot.diff}</TableCell>
                                {!isMobile && <TableCell>
                                    <Checkbox
                                        checked={!!lot.isCheck}
                                        onChange={e => handleLotChange(idx, 'isCheck', e.target.checked)}
                                        disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                    />
                                </TableCell>}
                                {!isMobile && <TableCell>
                                    <TextField
                                        size="small"
                                        value={lot.note}
                                        onChange={e => handleLotChange(idx, 'note', e.target.value)}
                                        fullWidth
                                        multiline
                                        minRows={1}
                                        maxRows={4}
                                        inputProps={{maxLength: 255}}
                                        disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                    />
                                </TableCell>}
                                <TableCell align="center">
                                    <Tooltip title="Xóa lô này khỏi phiếu kiểm kê">
                                        <span>
                                            <IconButton color="error" onClick={() => handleRemoveLot(lot.id)}
                                                        disabled={editMode && stocktakeStatus !== 'DRAFT'}>
                                                <DeleteIcon/>
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{mt: 3, display: "flex", justifyContent: "flex-end", gap: 2, flexWrap: 'wrap'}}>
                <Button onClick={() => {
                    setSelectedLots([]);
                    localStorage.removeItem('stocktake_create_selected_lots');
                    navigate("/stocktake");
                }}>Hủy</Button>
                {/* Nút lưu nháp, hoàn thành, xóa chỉ hiển thị khi editMode && stocktakeStatus === 'DRAFT' */}
                {(!editMode || stocktakeStatus === 'DRAFT') && (
                    <>
                        <Button variant="outlined" onClick={() => handleSubmit('DRAFT')}
                                sx={{fontWeight: 600, borderRadius: 2}}>Lưu nháp</Button>
                        <Button variant="contained" color="success" onClick={() => setConfirmCompleteDialog(true)}
                                sx={{fontWeight: 600, borderRadius: 2}}>Hoàn thành</Button>
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
            <Dialog open={confirmCompleteDialog} onClose={() => setConfirmCompleteDialog(false)}>
                <DialogTitle>Xác nhận hoàn thành phiếu kiểm kê</DialogTitle>
                <DialogContent>
                    <Typography>
                        {userRole === 'STAFF'
                            ? "Bạn có chắc chắn muốn hoàn thành phiếu kiểm kê này? Số lượng tồn kho sẽ được cập nhật theo số lượng thực tế đã nhập."
                            : "Bạn có chắc chắn muốn hoàn thành và cân bằng kho theo số lượng thực tế không?"
                        }
                    </Typography>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2}}>
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
                onClose={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                content={confirmDialog.content}
            />
            <SnackbarAlert
                open={snackbar.isOpen}
                onClose={() => setSnackbar(prev => ({...prev, isOpen: false}))}
                message={snackbar.message}
                severity={snackbar.severity}
            />
            {/* Dialog bộ lọc nhóm hàng chỉ UI, không ảnh hưởng logic filter thực tế */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{fontWeight: 700}}>Bộ lọc</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                        <FormControl size="small" sx={{minWidth: 150}}>
                            <InputLabel>Khu vực</InputLabel>
                            <Select
                                value={filter.zone}
                                label="Khu vực"
                                onChange={e => {
                                    // Khi chọn 'Tất cả', set zone về rỗng để hiển thị tất cả bản ghi
                                    setFilter(f => ({...f, zone: e.target.value}));
                                }}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.zoneName}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{minWidth: 150}}>
                            <InputLabel>Sản phẩm</InputLabel>
                            <Select
                                value={filter.product}
                                label="Sản phẩm"
                                onChange={e => {
                                    // Khi chọn sản phẩm, reset filter.search để ưu tiên lọc theo productId
                                    setFilter(f => ({...f, product: e.target.value, search: ''}));
                                }}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {products.map(p => (
                                    <MenuItem key={p.id} value={p.id}>{p.productName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2}}>
                        <Button onClick={() => setFilterDialogOpen(false)} sx={{mr: 1}}>Bỏ qua</Button>
                        <Button variant="contained" onClick={() => setFilterDialogOpen(false)}>Xong</Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default CreateStocktakePage;