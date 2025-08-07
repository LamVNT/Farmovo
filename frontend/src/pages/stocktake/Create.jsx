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
    useMediaQuery,
    TablePagination
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
    // 1. Thêm state phân trang
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [oldDetails, setOldDetails] = useState([]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        // Nếu là STAFF thì luôn set filter.store là kho của staff
        if (userRole === 'STAFF' && staffStoreId) {
            setFilter(f => ({...f, store: staffStoreId}));
        }
    }, []);

    // Hàm fetch lots theo filter, có merge dữ liệu cũ nếu ở chế độ update
    const fetchLotsByFilter = async (filter, products, oldDetails = []) => {
        setLoadingLots(true);
        try {
            const params = new URLSearchParams();
            if (filter.store) params.append('store', filter.store);
            if (filter.zone) params.append('zone', filter.zone);
            if (filter.product) params.append('product', filter.product);
            const res = await axios.get(`/import-details/stocktake-lot?${params.toString()}`);
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
                    zoneReal: old ? old.zoneReal : (Array.isArray(zonesId) ? zonesId : []),
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
                    const details = res.data.detail || [];
                    // Map lại detail thành lots phù hợp với form
                    const mappedDetails = details.map(d => ({
                        ...d,
                        name: d.batchCode || d.name,
                        zonesId: Array.isArray(d.zones_id) ? d.zones_id.map(Number) : (d.zones_id ? d.zones_id.split(',').map(Number) : []),
                        productId: d.productId || (products.find(p => p.productName.trim().toLowerCase() === (d.productName || '').trim().toLowerCase())?.id),
                        real: d.real,
                        remainQuantity: d.remain,
                        zoneReal: Array.isArray(d.zoneReal) ? d.zoneReal : (d.zoneReal ? d.zoneReal.split(',').map(Number) : []),
                        diff: d.diff,
                        note: d.note,
                        isCheck: d.isCheck,
                        expireDate: d.expireDate,
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
                    fetchLotsByFilter(filter, products, mappedDetails);
                })
                .catch(() => setSnackbar({isOpen: true, message: "Không lấy được chi tiết phiếu kiểm kê!", severity: "error"}));
        } else {
            fetchLotsByFilter(filter, products, []);
        }
        // eslint-disable-next-line
    }, [id, products, filter.store, filter.zone, filter.product]);

    // Khi filter thay đổi ở chế độ update, fetch lại lots và merge dữ liệu cũ
    useEffect(() => {
        if (id && oldDetails.length > 0) {
            fetchLotsByFilter(filter, products, oldDetails);
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
                zoneReal: lot.zoneIds || [lot.zoneId || lot.zone?.id].filter(Boolean), // thêm dòng này
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
        setLots(prev => prev.map((lot, i) => {
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
        if (!Array.isArray(lots) || lots.length === 0) {
            setSnackbar({isOpen: true, message: "Vui lòng chọn ít nhất một lô để kiểm kê!", severity: "error"});
            return;
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
            if (Number(lot.real) > Number(lot.remainQuantity)) {
                setSnackbar({
                    isOpen: true,
                    message: `Số thực tế của lô ${lot.name || lot.id} không được lớn hơn số tồn kho!`,
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
            setLots([]);
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
            <Box sx={{display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap'}}>
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
                        sx={{minWidth: 250, width: 320}}
                        InputProps={{
                            endAdornment: (
                                <></>
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
                {/* Bộ lọc Zone */}
                <FormControl size="small" sx={{minWidth: 150}}>
                    <InputLabel>Khu vực</InputLabel>
                    <Select
                        value={filter.zone}
                        label="Khu vực"
                        onChange={e => {
                            setFilter(f => ({...f, zone: e.target.value}));
                        }}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.zoneName}</MenuItem>)}
                    </Select>
                </FormControl>
                {/* Bộ lọc Sản phẩm */}
                <FormControl size="small" sx={{minWidth: 150}}>
                    <InputLabel>Sản phẩm</InputLabel>
                    <Select
                        value={filter.product}
                        label="Sản phẩm"
                        onChange={e => {
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
            {/* Không render bảng này nữa */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Danh sách lô hàng</Typography>
            <TableContainer component={Paper} elevation={1} sx={{mb: 2, borderRadius: 2}}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{background: "#f5f5f5"}}>
                            <TableCell><b>STT</b></TableCell>
                            <TableCell><b>Mã lô</b></TableCell>
                            {!isMobile && <TableCell><b>Khu vực</b></TableCell>}
                            <TableCell><b>Sản phẩm</b></TableCell>
                            {!isMobile && <TableCell><b>Hạn dùng</b></TableCell>}
                            {!isMobile && <TableCell><b>Tồn kho</b></TableCell>}
                            <TableCell><b>Thực tế</b></TableCell>
                            {!isMobile && <TableCell><b>Khu vực thực tế</b></TableCell>}
                            <TableCell><b>Chênh lệch</b></TableCell>
                            {!isMobile && <TableCell><b>Đã kiểm</b></TableCell>}
                            {!isMobile && <TableCell><b>Ghi chú</b></TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(lots.length === 0) ? (
                            <TableRow><TableCell colSpan={isMobile ? 5 : 12} align="center">Chưa có lô nào</TableCell></TableRow>
                        ) : (
                            <>
                                {console.log('LOTS TO RENDER:', lots)}
                                {lots
                                    .filter(lot => {
                                        const matchSearch = !filter.search ||
                                            (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                                            (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                                        return matchSearch;
                                    })
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((lot, idx) => (
                                        <TableRow
                                            key={(lot.batchCode || lot.name || 'row') + '-' + (lot.productId || '') + '-' + idx}
                                            hover>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>{lot.name || lot.batchCode}</TableCell>
                                            {!isMobile && <TableCell>{lot.zoneName || lot.zoneId}</TableCell>}
                                            <TableCell>{lot.productName || lot.productId}</TableCell>
                                            {!isMobile &&
                                                <TableCell>{lot.expireDate ? new Date(lot.expireDate).toLocaleDateString("vi-VN") : ""}</TableCell>}
                                            {!isMobile && <TableCell>{lot.remainQuantity}</TableCell>}
                                            <TableCell>
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={lot.real || ''}
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
                                                    value={lot.note || ''}
                                                    onChange={e => handleLotChange(idx, 'note', e.target.value)}
                                                    fullWidth
                                                    multiline
                                                    minRows={1}
                                                    maxRows={4}
                                                    inputProps={{maxLength: 255}}
                                                    disabled={editMode && stocktakeStatus !== 'DRAFT'}
                                                />
                                            </TableCell>}
                                        </TableRow>
                                    ))}
                            </>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={lots.filter(lot => {
                        const matchSearch = !filter.search ||
                            (lot.name && lot.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                            (lot.productName && lot.productName.toLowerCase().includes(filter.search.toLowerCase()));
                        return matchSearch;
                    }).length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={e => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 20, 50]}
                />
            </TableContainer>
            <Box sx={{mt: 3, display: "flex", justifyContent: "flex-end", gap: 2, flexWrap: 'wrap'}}>
                <Button onClick={() => {
                    setLots([]);
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
                    Hoàn thành phiếu kiểm kê
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
        </Box>
    );
};

export default CreateStocktakePage;