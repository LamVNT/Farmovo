import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    InputAdornment,
    IconButton,
    Tooltip,
    Menu,
    FormControlLabel as MuiFormControlLabel,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {FaLock, FaCheck, FaSearch, FaEye} from 'react-icons/fa';
import {MdKeyboardArrowDown, MdCategory} from 'react-icons/md';
import {FiPlus} from 'react-icons/fi';
import {DataGrid} from '@mui/x-data-grid';
import {FaRegTrashCan} from "react-icons/fa6";
import {format} from 'date-fns';

// Components
import SaleProductDialog from '../../components/sale-transaction/SaleProductDialog';
import SaleSidebar from '../../components/sale-transaction/SaleSidebar';
import SaleSummaryDialog from '../../components/sale-transaction/SaleSummaryDialog';

// Hooks
import {useSaleTransaction} from '../../hooks/useSaleTransaction';

// Utils
import {formatCurrency, isValidValue} from '../../utils/formatters';
import saleTransactionService from '../../services/saleTransactionService';

const AddSalePage = (props) => {
    const searchRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [batches, setBatches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBatches, setFilteredBatches] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [dataGridKey, setDataGridKey] = useState(0);
    const [nextCode, setNextCode] = useState('');
    const [unit, setUnit] = useState('quả');
    const [paidAmountInput, setPaidAmountInput] = useState('0');
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng': true,
        'Đơn giá': true,
        'Thành tiền': true,
        ...(props.isBalanceStock ? {'Mã lô': true, 'Zone': true} : {}),
    });
    const [highlightCustomer, setHighlightCustomer] = useState(false);
    const [highlightStore, setHighlightStore] = useState(false);
    const [highlightProducts, setHighlightProducts] = useState(false);
    const [balanceModeInitialized, setBalanceModeInitialized] = useState(false);
    const [invalidProductIds, setInvalidProductIds] = useState([]);

    const {
        currentUser,
        products,
        customers,
        stores,
        categories,
        zones,
        selectedProducts,
        loading,
        error,
        success,
        selectedCustomer,
        selectedStore,
        saleDate,
        note,
        status,
        paidAmount,
        totalAmount,
        showProductDialog,
        selectedProduct,
        availableBatches,
        showSummaryDialog,
        summaryData,
        pendingAction,
        setSelectedCustomer,
        setSelectedStore,
        setSaleDate,
        setNote,
        setStatus,
        setPaidAmount,
        setShowProductDialog,
        setError,
        setSuccess,
        setShowSummaryDialog,
        setSummaryData,
        setPendingAction,
        setSelectedProducts,
        setCustomers,
        handleSelectProduct,
        handleAddProductsFromDialog,
        handleQuantityChange,
        handleQuantityInputChange,
        handlePriceChange,
        handleDeleteProduct,
        handleSaveDraft,
        handleComplete,
        handleCancel,
        handleConfirmSummary,
        handleCloseSummary,
    } = useSaleTransaction();

    useEffect(() => {
        if (props.isBalanceStock && !balanceModeInitialized) {
            if (props.initialProducts) setSelectedProducts(props.initialProducts);
            if (props.initialNote) setNote(props.initialNote);
            if (props.initialCustomer) setSelectedCustomer(props.initialCustomer);
            setBalanceModeInitialized(true);
        }
    }, [props.isBalanceStock, props.initialProducts, props.initialNote, props.initialCustomer, balanceModeInitialized]);

    useEffect(() => {
        if (selectedProducts.length > 0) {
            setSelectedProducts(prev => prev.map(p => ({...p, unit})));
        }
    }, [unit]);

    useEffect(() => {
        if (props.isBalanceStock && props.initialProducts) {
            setSelectedProducts(props.initialProducts.map((p, idx) => ({
                ...p,
                price: p.unitSalePrice || 0,
                id: p.id || p.batchId || `temp_${idx}_${Date.now()}` // Gán id hợp lệ
            })));
        }
    }, [props.isBalanceStock, props.initialProducts]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setFilteredBatches([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setDataGridKey(prev => prev + 1);
    }, [selectedProducts]);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const data = await saleTransactionService.getCreateFormData();
                setBatches(data.products || []);
            } catch (error) {
                setError('Không thể tải danh sách lô hàng');
            }
        };
        fetchBatches();
    }, []);

    useEffect(() => {
        saleTransactionService.getNextCode?.().then(setNextCode).catch(() => setNextCode(''));
    }, []);

    useEffect(() => {
        const storeFilteredBatches = batches.filter(batch => {
            if (!selectedStore) return false;
            const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
            if (!selectedStoreData) return false;
            return batch.storeName === selectedStoreData.storeName || batch.storeName === selectedStoreData.name;
        });

        if (searchTerm.trim() !== '') {
            const results = storeFilteredBatches.filter(
                (b) =>
                    (b.batchCode && b.batchCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (b.productName && b.productName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            results.sort((a, b) => {
                const dateA = a.importDate ? new Date(a.importDate).getTime() : 0;
                const dateB = b.importDate ? new Date(b.importDate).getTime() : 0;
                return dateB - dateA;
            });
            setFilteredBatches(results.slice(0, 10));
        } else if (isSearchFocused) {
            const sorted = [...storeFilteredBatches].sort((a, b) => {
                const dateA = a.importDate ? new Date(a.importDate).getTime() : 0;
                const dateB = b.importDate ? new Date(b.importDate).getTime() : 0;
                return dateB - dateA;
            });
            setFilteredBatches(sorted.slice(0, 10));
        } else {
            setFilteredBatches([]);
        }
    }, [batches, searchTerm, isSearchFocused, selectedStore, stores]);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
                setHighlightCustomer(false);
                setHighlightStore(false);
                setHighlightProducts(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const handleShowSummary = async (status) => {
        let missing = false;
        if (!selectedCustomer) {
            setError('Vui lòng chọn khách hàng');
            setHighlightCustomer(true);
            missing = true;
        } else {
            setHighlightCustomer(false);
        }
        if (!selectedStore) {
            setError('Vui lòng chọn cửa hàng');
            setHighlightStore(true);
            missing = true;
        } else {
            setHighlightStore(false);
        }
        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            setHighlightProducts(true);
            missing = true;
        } else {
            setHighlightProducts(false);
        }
        if (missing) return;
        if (status === 'DRAFT') {
            await handleSaveDraft();
        } else if (status === 'COMPLETE') {
            await handleComplete();
        }
    };

    const toggleColumn = (col) => {
        setColumnVisibility((prev) => ({...prev, [col]: !prev[col]}));
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') {
            setFilteredBatches([]);
        } else {
            const storeFilteredBatches = batches.filter(batch => {
                if (!selectedStore) return false;
                const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
                if (!selectedStoreData) return false;
                return batch.storeName === selectedStoreData.storeName || batch.storeName === selectedStoreData.name;
            });
            const results = storeFilteredBatches.filter(
                (b) =>
                    (b.batchCode && b.batchCode.toLowerCase().includes(value.toLowerCase())) ||
                    (b.productName && b.productName.toLowerCase().includes(value.toLowerCase()))
            );
            setFilteredBatches(results);
        }
    };

    const handleSelectBatch = (batch) => {
        if (unit === 'khay') {
            const remainKhay = Math.floor(batch.remainQuantity / 30);
            if (remainKhay < 1) return;
            handleSelectProduct({
                id: batch.id,
                proId: batch.proId,
                name: batch.productName,
                unit: 'khay',
                price: batch.unitSalePrice || 0,
                quantity: 1,
                remainQuantity: remainKhay,
                batchCode: batch.batchCode,
                productCode: batch.productCode,
                categoryName: batch.categoryName,
                storeName: batch.storeName,
                createAt: batch.createAt,
            }, {directAdd: true});
        } else {
            handleSelectProduct({
                id: batch.id,
                proId: batch.proId,
                name: batch.productName,
                unit: 'quả',
                price: batch.unitSalePrice || 0,
                quantity: 1,
                remainQuantity: batch.remainQuantity,
                batchCode: batch.batchCode,
                productCode: batch.productCode,
                categoryName: batch.categoryName,
                storeName: batch.storeName,
                createAt: batch.createAt,
            }, {directAdd: true});
        }
        setSearchTerm('');
        setFilteredBatches([]);
        setIsSearchFocused(false);
    };

    const handleOpenCategoryDialog = () => {
        setShowCategoryDialog(true);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    const handleCloseCategoryDialog = () => {
        setShowCategoryDialog(false);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        const filteredProducts = products.filter(product => {
            const categoryMatch = product.categoryId === category.id || product.category?.id === category.id;
            if (!categoryMatch) return false;
            if (!selectedStore) return false;
            const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
            if (!selectedStoreData) return false;
            return product.storeName === selectedStoreData.storeName || product.storeName === selectedStoreData.name;
        });
        setCategoryProducts(filteredProducts);
    };

    const handleSelectCategoryProduct = (product) => {
        handleSelectProduct({...product, unit: 'quả'}, {directAdd: true});
    };

    const handleUnitChange = (id, newUnit) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    if (newUnit === 'khay' && p.unit !== 'khay') {
                        if (p.remainQuantity < 30) {
                            setError(`Không đủ tồn kho để đổi thành khay. Cần ít nhất 30 quả, hiện có: ${p.remainQuantity} quả`);
                            return p;
                        }
                        const maxKhay = Math.floor(p.remainQuantity / 30);
                        if (maxKhay < 1) {
                            setError(`Không đủ tồn kho để đổi thành khay. Cần ít nhất 30 quả, hiện có: ${p.remainQuantity} quả`);
                            return p;
                        }
                    }
                    const newQuantity = 1;
                    setError(null);
                    return {
                        ...p,
                        unit: newUnit,
                        quantity: newQuantity,
                        price: p.price,
                        total: (p.price || 0) * (newUnit === 'khay' ? newQuantity * 30 : newQuantity)
                    };
                }
                return p;
            })
        );
    };

    const columns = useMemo(() => [
        columnVisibility['STT'] && {
            field: 'stt',
            headerName: 'STT',
            width: 80,
            renderCell: (params) => params.row.stt,
            sortable: false,
            filterable: false,
        },
        ...(props.isBalanceStock && columnVisibility['Mã lô'] ? [{
            field: 'batchCode',
            headerName: 'Mã lô',
            width: 120,
        }] : []),
        columnVisibility['Tên hàng'] && {
            field: 'name',
            headerName: 'Tên hàng',
            flex: 1,
            renderCell: (params) => (
                <div className="flex flex-col w-full">
                    <div className="font-medium text-gray-900">{params.row.name}</div>
                    {params.row.batchCode && (
                        <div className="text-xs text-gray-500 font-mono">
                            Lô: {params.row.batchCode}
                        </div>
                    )}
                    {!params.row.batchCode && params.row.batchId && (
                        <div className="text-xs text-gray-500 font-mono">
                            Lô: {params.row.batchId}
                        </div>
                    )}
                    {!params.row.batchCode && !params.row.batchId && params.row.id && (
                        <div className="text-xs text-gray-500 font-mono">
                            Lô: {params.row.id}
                        </div>
                    )}
                </div>
            )
        },
        columnVisibility['ĐVT'] && {
            field: 'unit',
            headerName: 'ĐVT',
            width: 120,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <Select
                        size="small"
                        value={params.row.unit || 'quả'}
                        onChange={(e) => handleUnitChange(params.row.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        sx={{
                            width: '80px',
                            '& .MuiOutlinedInput-notchedOutline': {borderColor: 'transparent'},
                            '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: '#1976d2'},
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: '#1976d2'},
                        }}
                    >
                        <MenuItem value="quả">quả</MenuItem>
                        <MenuItem
                            value="khay"
                            disabled={params.row.remainQuantity < 30}
                            sx={{'&.Mui-disabled': {color: '#999', fontStyle: 'italic'}}}
                        >
                            khay {params.row.remainQuantity < 30 && '(cần ≥30 quả)'}
                        </MenuItem>
                    </Select>
                </div>
            )
        },
        columnVisibility['Số lượng'] && {
            field: 'quantity',
            headerName: 'Số lượng',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full gap-1">
                    <button
                        onClick={() => handleQuantityChange(params.row.id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                    >
                        –
                    </button>
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.quantity || 1}
                        onChange={(e) => handleQuantityInputChange(params.row.id, Number(e.target.value) || 1)}
                        sx={{
                            width: '60px',
                            '& .MuiInput-underline:before': {borderBottomColor: 'transparent'},
                            '& .MuiInput-underline:after': {borderBottomColor: '#1976d2'},
                            '& .MuiInput-underline:hover:before': {borderBottomColor: 'transparent'},
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {display: 'none'},
                            '& input[type=number]': {MozAppearance: 'textfield'}
                        }}
                    />
                    <button
                        onClick={() => handleQuantityChange(params.row.id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                    >
                        +
                    </button>
                </div>
            )
        },
        columnVisibility['Đơn giá'] && {
            field: 'price',
            headerName: 'Đơn giá',
            renderHeader: () => (
                <span>Đơn giá<span style={{color: '#6b7280', fontSize: '0.875em'}}>/quả</span></span>
            ),
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.price || 0}
                        onChange={(e) => handlePriceChange(params.row.id, Number(e.target.value) || 0)}
                        InputProps={{endAdornment: <span className="text-gray-500">VND</span>}}
                        sx={{
                            width: '100px',
                            '& .MuiInput-underline:before': {borderBottomColor: 'transparent'},
                            '& .MuiInput-underline:after': {borderBottomColor: '#1976d2'},
                            '& .MuiInput-underline:hover:before': {borderBottomColor: 'transparent'},
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {display: 'none'},
                            '& input[type=number]': {MozAppearance: 'textfield'}
                        }}
                    />
                </div>
            ),
        },
        columnVisibility['Thành tiền'] && {
            field: 'total',
            headerName: 'Thành tiền',
            width: 150,
            valueGetter: (params) => {
                const row = params?.row ?? {};
                const price = parseFloat(row.price) || 0;
                const quantity = parseInt(row.quantity) || 0;
                const unit = row.unit || 'quả';
                const quantityInQua = unit === 'khay' ? quantity * 30 : quantity;
                return price * quantityInQua;
            },
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => {
                const price = parseFloat(params.row.price) || 0;
                const quantity = parseInt(params.row.quantity) || 0;
                const unit = params.row.unit || 'quả';
                const quantityInQua = unit === 'khay' ? quantity * 30 : quantity;
                const total = price * quantityInQua;
                return <div className="text-right w-full">{formatCurrency(total)}</div>;
            },
        },
        ...(props.isBalanceStock && columnVisibility['Zone'] ? [{
            field: 'zoneReal',
            headerName: 'Zone',
            width: 120,
            renderCell: (params) => <span>{params.row.zoneReal}</span>,
        }] : []),
        !props.isBalanceStock && {
            field: 'actions',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Tooltip title="Xóa">
                    <IconButton size="small" onClick={() => handleDeleteProduct(params.row.id)}>
                        <FaRegTrashCan/>
                    </IconButton>
                </Tooltip>
            ),
        },
    ].filter(Boolean), [columnVisibility, handleQuantityChange, handleQuantityInputChange, handlePriceChange, handleDeleteProduct, handleUnitChange, props.isBalanceStock]);

    return (
        <div className="flex w-full h-screen bg-gray-100">
            {error && <Alert severity="error"
                             className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{error}</Alert>}
            {success && <Alert severity="success"
                               className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{success}</Alert>}

            <div className="flex-1 p-4 bg-white rounded-md m-4 shadow-md overflow-auto">
                <div className="flex justify-between items-center mb-2">
                    <div ref={searchRef} className="relative w-full max-w-2xl flex items-center gap-2">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Tìm lô hàng theo mã hoặc tên sản phẩm"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FaSearch className="text-gray-500"/>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{borderRadius: 2, background: '#f9fafb'}}
                        />
                        <Select
                            size="small"
                            value={unit}
                            onChange={e => {
                                const newUnit = e.target.value;
                                setUnit(newUnit);
                                setSelectedProducts(prev => prev.map(p => {
                                    if (newUnit === 'khay' && p.unit !== 'khay') {
                                        return {
                                            ...p,
                                            unit: 'khay',
                                            quantity: Math.ceil((p.quantity || 1) / 30),
                                            price: (p.price || 0),
                                            total: (p.price || 0) * Math.ceil((p.quantity || 1) / 30) * 30
                                        };
                                    } else if (newUnit === 'quả' && p.unit !== 'quả') {
                                        return {
                                            ...p,
                                            unit: 'quả',
                                            quantity: (p.quantity || 1) * 30,
                                            price: (p.price || 0),
                                            total: (p.price || 0) * ((p.quantity || 1) * 30)
                                        };
                                    }
                                    return p;
                                }));
                            }}
                            sx={{minWidth: 80, marginLeft: 1, background: '#fff'}}
                        >
                            <MenuItem value="quả">quả</MenuItem>
                            <MenuItem value="khay">khay</MenuItem>
                        </Select>
                        {!props.isBalanceStock && (
                            <Tooltip title="Thêm sản phẩm">
                                <IconButton onClick={() => setShowProductDialog(true)}>
                                    <FiPlus/>
                                </IconButton>
                            </Tooltip>
                        )}
                        {filteredBatches.length > 0 && isSearchFocused && (
                            <div
                                className="absolute top-full mt-1 left-0 z-10 bg-white shadow-lg rounded-xl w-full max-h-96 overflow-y-auto text-sm"
                                style={{boxShadow: '0 8px 32px 0 rgba(25, 118, 210, 0.10)'}}>
                                {filteredBatches.map((batch, index) => {
                                    const remainKhay = unit === 'khay' ? Math.floor(batch.remainQuantity / 30) : batch.remainQuantity;
                                    const price = batch.unitSalePrice || 0;
                                    if (unit === 'khay' && remainKhay < 1) return null;
                                    const importDate = batch.createAt ? format(new Date(batch.createAt), 'dd/MM/yyyy') : 'N/A';
                                    const expireDate = batch.expireDate ? format(new Date(batch.expireDate), 'dd/MM/yyyy') : 'N/A';
                                    return (
                                        <div
                                            key={batch.id || index}
                                            onClick={() => handleSelectBatch(batch)}
                                            className={`px-4 py-3 cursor-pointer flex flex-col transition-all duration-150 hover:bg-blue-50 ${index === filteredBatches.length - 1 ? 'rounded-b-xl' : ''} ${index === 0 ? 'rounded-t-xl' : ''}`}
                                            style={{borderBottom: index === filteredBatches.length - 1 ? 'none' : '1px solid #f1f1f1'}}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-blue-800">Lô {batch.name}</span>
                                                <span className="font-bold text-gray-900">{batch.productName}</span>
                                            </div>
                                            <div
                                                className="grid grid-cols-4 gap-px text-[12px] text-gray-600 mt-1 w-full"
                                                style={{alignItems: 'center', paddingTop: 2, paddingBottom: 2}}>
                                                <span className="col-span-1">Số lượng còn: <span
                                                    className="font-bold text-gray-900">{remainKhay}</span> {unit}</span>
                                                <span className="col-span-1">Giá: <span
                                                    className="font-bold text-green-700">{formatCurrency(price)}/quả</span></span>
                                                <span className="col-span-1">Ngày nhập: <span
                                                    className="font-bold text-indigo-700">{importDate}</span></span>
                                                <span className="col-span-1">Hạn: <span
                                                    className="font-bold text-red-700">{expireDate}</span></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="ml-auto">
                        <Tooltip title="Ẩn/hiện cột hiển thị">
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                                <FaEye/>
                            </IconButton>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                            {Object.entries(columnVisibility).map(([col, visible]) => (
                                <MenuItem key={col} dense>
                                    <MuiFormControlLabel
                                        control={<Checkbox checked={visible} onChange={() => toggleColumn(col)}/>}
                                        label={col}
                                    />
                                </MenuItem>
                            ))}
                        </Menu>
                    </div>
                </div>
                <div style={{height: 400, width: '100%'}}>
                    <DataGrid
                        key={dataGridKey}
                        rows={selectedProducts.map((row, idx) => ({
                            ...row,
                            stt: idx + 1,
                            id: row.id || row.batchId || `temp_${idx}_${Date.now()}` // Đảm bảo id duy nhất
                        }))}
                        columns={columns}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                        disableSelectionOnClick
                        getRowId={(row) => row.id}
                        sx={highlightProducts ? {
                            boxShadow: '0 0 0 3px #ffbdbd',
                            borderRadius: 4,
                            background: '#fff6f6'
                        } : {}}
                        getRowClassName={(params) => invalidProductIds.includes(params.row.id) ? 'row-error' : ''}
                    />
                </div>
            </div>
            <SaleSidebar
                currentUser={currentUser}
                customers={customers}
                stores={stores}
                selectedCustomer={selectedCustomer}
                selectedStore={selectedStore}
                saleDate={saleDate}
                note={note}
                paidAmount={paidAmount}
                totalAmount={totalAmount}
                loading={loading}
                onCustomerChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setHighlightCustomer(false);
                }}
                onStoreChange={(e) => {
                    setSelectedStore(e.target.value);
                    setHighlightStore(false);
                }}
                onDateChange={(newValue) => setSaleDate(newValue)}
                onNoteChange={(e) => setNote(e.target.value)}
                onPaidAmountChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPaidAmount(Math.max(0, value));
                    setPaidAmountInput(e.target.value);
                }}
                onSaveDraft={() => handleShowSummary('DRAFT')}
                onComplete={() => handleShowSummary('COMPLETE')}
                onCancel={handleCancel}
                formatCurrency={formatCurrency}
                isValidValue={isValidValue}
                highlightCustomer={highlightCustomer}
                highlightStore={highlightStore}
                highlightProducts={highlightProducts}
                setCustomers={setCustomers}
                paidAmountInput={paidAmountInput}
                setPaidAmountInput={setPaidAmountInput}
            />
            <SaleProductDialog
                open={showProductDialog}
                onClose={() => setShowProductDialog(false)}
                products={products.filter(product => {
                    if (!selectedStore) return false;
                    const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
                    if (!selectedStoreData) return false;
                    return product.storeName === selectedStoreData.storeName || product.storeName === selectedStoreData.name;
                })}
                selectedProduct={selectedProduct}
                availableBatches={availableBatches}
                selectedBatchesForDialog={[]}
                onSelectProduct={handleSelectProduct}
                onSelectBatches={() => {
                }}
                onAddProducts={handleAddProductsFromDialog}
                formatCurrency={formatCurrency}
            />
            <SaleSummaryDialog
                open={showSummaryDialog}
                onClose={handleCloseSummary}
                onConfirm={handleConfirmSummary}
                saleData={summaryData}
                formatCurrency={formatCurrency}
                loading={loading}
                currentUser={currentUser}
                nextCode={nextCode}
            />
            <Dialog
                open={showCategoryDialog}
                onClose={handleCloseCategoryDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle className="flex justify-between items-center">
                    <span>Thêm từ danh mục</span>
                    <IconButton onClick={handleCloseCategoryDialog} size="small">
                        <span>×</span>
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-3 text-gray-700">Danh mục sản phẩm</h3>
                            <div className="border rounded-lg max-h-80 overflow-y-auto">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleSelectCategory(category)}
                                        className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${selectedCategory?.id === category.id ? 'bg-blue-50 border-blue-200' : ''}`}
                                    >
                                        <div className="font-medium">{category.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {products.filter(p => {
                                                const categoryMatch = p.categoryId === category.id || p.category?.id === category.id;
                                                if (!categoryMatch) return false;
                                                if (!selectedStore) return false;
                                                const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
                                                if (!selectedStoreData) return false;
                                                return p.storeName === selectedStoreData.storeName || p.storeName === selectedStoreData.name;
                                            }).length} sản phẩm
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3 text-gray-700">
                                {selectedCategory ? `Sản phẩm - ${selectedCategory.name}` : 'Chọn danh mục để xem sản phẩm'}
                            </h3>
                            <div className="border rounded-lg max-h-80 overflow-y-auto">
                                {selectedCategory ? (
                                    categoryProducts.length > 0 ? (
                                        categoryProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => handleSelectCategoryProduct(product)}
                                                className="p-3 cursor-pointer border-b hover:bg-gray-50"
                                            >
                                                <div className="font-medium">{product.productName}</div>
                                                <div className="text-sm text-gray-500">
                                                    Mã: {product.productCode} | Tồn: {product.remainQuantity} |
                                                    Giá: {formatCurrency(product.unitSalePrice)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">
                                            Không có sản phẩm nào trong danh mục này
                                        </div>
                                    )
                                ) : (
                                    <div className="p-4 text-center text-gray-500">
                                        Vui lòng chọn một danh mục
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCategoryDialog} color="primary">
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AddSalePage;