import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { FaLock, FaCheck, FaSearch, FaEye } from 'react-icons/fa';
import { MdKeyboardArrowDown, MdCategory } from 'react-icons/md';
import { FiPlus } from 'react-icons/fi';
import { DataGrid } from '@mui/x-data-grid';
import { FaRegTrashCan } from "react-icons/fa6";
import { format } from 'date-fns';

// Components
import SaleProductDialog from '../../components/sale-transaction/SaleProductDialog';
import SaleSidebar from '../../components/sale-transaction/SaleSidebar';
import SaleSummaryDialog from '../../components/sale-transaction/SaleSummaryDialog';

// Hooks
import { useSaleTransaction } from '../../hooks/useSaleTransaction';

// Utils
import { formatCurrency, isValidValue } from '../../utils/formatters';
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
    const [nextCode, setNextCode] = useState(''); // Thêm state mã phiếu
    // Thêm state cho đơn vị tính
    const [unit, setUnit] = useState('quả'); // Đơn vị tính mặc định
    
    // Thêm state cho paidAmountInput
    const [paidAmountInput, setPaidAmountInput] = useState('0');
    
    // Column visibility state - moved up before useMemo
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng': true,
        'Đơn giá': true,
        'Thành tiền': true,
    });

    // Custom hook for sale transaction logic
    const {
        // States
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
        
        // Form states
        selectedCustomer,
        selectedStore,
        saleDate,
        note,
        status,
        paidAmount,
        totalAmount,
        
        // Dialog states
        showProductDialog,
        selectedProduct,
        availableBatches,
        
        // Summary dialog states
        showSummaryDialog,
        summaryData,
        pendingAction,
        
        // Setters
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
        setSelectedProducts, // <-- thêm dòng này để sửa lỗi và cho phép cập nhật
        setCustomers, // <-- thêm dòng này để cập nhật danh sách customers
        
        // Handlers
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

    // Highlight states
    const [highlightCustomer, setHighlightCustomer] = useState(false);
    const [highlightStore, setHighlightStore] = useState(false);
    const [highlightProducts, setHighlightProducts] = useState(false);

    // Thêm state riêng cho chế độ cân bằng kho
    const [balanceModeInitialized, setBalanceModeInitialized] = useState(false);

    // Khi ở chế độ cân bằng kho, khởi tạo dữ liệu đặc biệt (chỉ 1 lần)
    useEffect(() => {
        if (props.isBalanceStock && !balanceModeInitialized) {
            if (props.initialProducts) setSelectedProducts(props.initialProducts);
            if (props.initialNote) setNote(props.initialNote);
            if (props.initialCustomer) setSelectedCustomer(props.initialCustomer);
            setBalanceModeInitialized(true);
        }
    }, [props.isBalanceStock, props.initialProducts, props.initialNote, props.initialCustomer, balanceModeInitialized]);

    // Khi đổi đơn vị, cập nhật toàn bộ selectedProducts sang đơn vị mới
    useEffect(() => {
        if (selectedProducts.length > 0) {
            setSelectedProducts(prev => prev.map(p => ({ ...p, unit })));
        }
    }, [unit]);

    // Khi khởi tạo selectedProducts, map unitSalePrice sang price nếu có
    useEffect(() => {
        if (props.isBalanceStock && props.initialProducts) {
            setSelectedProducts(props.initialProducts.map(p => ({
                ...p,
                price: p.unitSalePrice || 0 // Đảm bảo có trường price cho DataGrid
            })));
        }
        // eslint-disable-next-line
    }, [props.isBalanceStock, props.initialProducts]);

    // Handle click outside search dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setFilteredBatches([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Force re-render DataGrid when selectedProducts changes
    useEffect(() => {
        setDataGridKey(prev => prev + 1);
    }, [selectedProducts]);

    useEffect(() => {
        // Lấy danh sách batch (import transaction detail) còn hàng
        const fetchBatches = async () => {
            try {
                const data = await saleTransactionService.getCreateFormData();
                setBatches(data.products || []);
            } catch (error) {
                // Có thể setError nếu muốn
            }
        };
        fetchBatches();
    }, []);

    useEffect(() => {
        // Lấy mã phiếu tiếp theo
        saleTransactionService.getNextCode && saleTransactionService.getNextCode().then(setNextCode).catch(() => setNextCode(''));
    }, []);

    // Gợi ý batch mới nhất khi focus hoặc search
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            const results = batches.filter(
                (b) =>
                    (b.batchCode && b.batchCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (b.productName && b.productName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            // Sắp xếp batch mới nhất lên đầu (theo importDate hoặc id giảm dần)
            results.sort((a, b) => {
                const dateA = a.importDate ? new Date(a.importDate).getTime() : 0;
                const dateB = b.importDate ? new Date(b.importDate).getTime() : 0;
                return dateB - dateA;
            });
            setFilteredBatches(results.slice(0, 10));
        } else if (isSearchFocused) {
            // Gợi ý 10 batch mới nhất khi chưa nhập gì
            const sorted = [...batches].sort((a, b) => {
                const dateA = a.importDate ? new Date(a.importDate).getTime() : 0;
                const dateB = b.importDate ? new Date(b.importDate).getTime() : 0;
                return dateB - dateA;
            });
            setFilteredBatches(sorted.slice(0, 10));
        } else {
            setFilteredBatches([]);
        }
    }, [batches, searchTerm, isSearchFocused]);

    // Auto-dismiss error/success after 5s
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

    // Validate before show summary (save draft or complete)
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
        // Gọi đúng handler để mở dialog tổng kết
        if (status === 'DRAFT') {
            await handleSaveDraft();
        } else if (status === 'COMPLETE') {
            await handleComplete();
        }
    };

    const toggleColumn = (col) => {
        setColumnVisibility((prev) => ({ ...prev, [col]: !prev[col] }));
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') {
            setFilteredBatches([]);
        } else {
            const results = batches.filter(
                (b) =>
                    (b.batchCode && b.batchCode.toLowerCase().includes(value.toLowerCase())) ||
                    (b.productName && b.productName.toLowerCase().includes(value.toLowerCase()))
            );
            setFilteredBatches(results);
        }
    };

    // Khi thêm sản phẩm từ batch hoặc từ danh mục, truyền unit hiện tại
    const handleSelectBatch = (batch) => {
        if (unit === 'khay') {
            const remainKhay = Math.floor(batch.remainQuantity / 25);
            if (remainKhay < 1) return; // Không cho thêm nếu không đủ 1 khay
            handleSelectProduct({
                id: batch.id,
                proId: batch.proId,
                name: batch.productName,
                unit: 'khay',
                price: (batch.unitSalePrice || 0) * 25,
                quantity: 1,
                remainQuantity: remainKhay,
                batchCode: batch.batchCode,
                productCode: batch.productCode,
                categoryName: batch.categoryName,
                storeName: batch.storeName,
                createAt: batch.createAt,
            }, { directAdd: true });
        } else {
            handleSelectProduct({
                id: batch.id,
                proId: batch.proId,
                name: batch.productName,
                unit: 'quả',
                price: batch.unitSalePrice,
                quantity: 1,
                remainQuantity: batch.remainQuantity,
                batchCode: batch.batchCode,
                productCode: batch.productCode,
                categoryName: batch.categoryName,
                storeName: batch.storeName,
                createAt: batch.createAt,
            }, { directAdd: true });
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
        const filteredProducts = products.filter(product => 
            product.categoryId === category.id || product.category?.id === category.id
        );
        setCategoryProducts(filteredProducts);
    };

    // Khi chọn sản phẩm từ danh mục
    const handleSelectCategoryProduct = (product) => {
        handleSelectProduct({ ...product, unit }, { directAdd: true });
    };

    // Memoized columns for DataGrid
    const columns = useMemo(() => {
        const baseCols = [
            { field: 'stt', headerName: 'STT', width: 80, renderCell: (params) => params.row.stt },
            // Chỉ hiển thị cột batchCode và zoneReal khi là phiếu cân bằng kho
            ...(props.isBalanceStock ? [
                { field: 'batchCode', headerName: 'Mã lô', width: 120 },
            ] : []),
            { field: 'name', headerName: 'Tên hàng', flex: 1 },
            { field: 'unit', headerName: 'ĐVT', width: 80, renderCell: (params) => params.row.unit || unit },
            {
                field: 'quantity', headerName: 'Số lượng', width: 150,
                renderCell: (params) => (
                    <div className="flex items-center justify-center h-full gap-1">
                        <button onClick={() => handleQuantityChange(params.row.id, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium">–</button>
                        <TextField size="small" type="number" variant="standard" value={params.row.quantity || 1} onChange={(e) => handleQuantityInputChange(params.row.id, Number(e.target.value) || 1)} sx={{ width: '60px', '& .MuiInput-underline:before': { borderBottomColor: 'transparent', }, '& .MuiInput-underline:after': { borderBottomColor: '#1976d2', }, '& .MuiInput-underline:hover:before': { borderBottomColor: 'transparent', }, '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { display: 'none', }, '& input[type=number]': { MozAppearance: 'textfield', } }} />
                        <button onClick={() => handleQuantityChange(params.row.id, 1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium">+</button>
                    </div>
                )
            },
            {
                field: 'price', headerName: 'Đơn giá', width: 150,
                renderCell: (params) => (
                    <TextField size="small" type="number" variant="standard" value={params.row.price || 0} onChange={(e) => handlePriceChange(params.row.id, Number(e.target.value) || 0)} InputProps={{ endAdornment: <span className="text-gray-500">VND</span>, }} sx={{ width: '100px', '& .MuiInput-underline:before': { borderBottomColor: 'transparent', }, '& .MuiInput-underline:after': { borderBottomColor: '#1976d2', }, '& .MuiInput-underline:hover:before': { borderBottomColor: 'transparent', }, '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { display: 'none', }, '& input[type=number]': { MozAppearance: 'textfield', } }} />
                )
            },
            {
                field: 'total', headerName: 'Thành tiền', width: 150,
                valueGetter: (params) => {
                    const row = params?.row ?? {};
                    const price = parseFloat(row.price) || 0;
                    const quantity = parseInt(row.quantity) || 0;
                    return price * quantity;
                },
                valueFormatter: (params) => formatCurrency(params.value || 0),
                renderCell: (params) => {
                    const price = parseFloat(params.row.price) || 0;
                    const quantity = parseInt(params.row.quantity) || 0;
                    const total = price * quantity;
                    return (<div className="text-right w-full">{formatCurrency(total)}</div>);
                },
            },
            // Chỉ hiển thị cột zoneReal khi là phiếu cân bằng kho
            ...(props.isBalanceStock ? [
                { field: 'zoneReal', headerName: 'Zone', width: 120, renderCell: (params) => <span>{params.row.zoneReal}</span> },
            ] : []),
        ];
        // Chỉ render cột actions (xóa) nếu không phải balance mode
        if (!props.isBalanceStock) {
            baseCols.push({
                field: 'actions', headerName: '', width: 60, renderCell: (params) => (
                    <Tooltip title="Xóa">
                        <IconButton size="small" onClick={() => handleDeleteProduct(params.row.id)}>
                            <FaRegTrashCan />
                        </IconButton>
                    </Tooltip>
                ),
            });
        }
        return baseCols;
    }, [props.isBalanceStock, unit, handleQuantityChange, handleQuantityInputChange, handlePriceChange, handleDeleteProduct]);

    const [invalidProductIds, setInvalidProductIds] = useState([]);

    return (
        <div className="flex w-full h-screen bg-gray-100">
            {error && <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{error}</Alert>}
            {success && <Alert severity="success" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{success}</Alert>}

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
                                        <FaSearch className="text-gray-500" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ borderRadius: 2, background: '#f9fafb' }}
                        />
                        {/* Thêm Select đơn vị tính */}
                        <Select
                            size="small"
                            value={unit}
                            onChange={e => {
                                const newUnit = e.target.value;
                                setUnit(newUnit);
                                setSelectedProducts(prev => prev.map(p => {
                                    if (newUnit === 'khay' && p.unit !== 'khay') {
                                        // Đổi từ quả sang khay
                                        return {
                                            ...p,
                                            unit: 'khay',
                                            quantity: Math.ceil((p.quantity || 1) / 25),
                                            price: (p.price || 0) * 25,
                                            total: ((p.price || 0) * 25) * Math.ceil((p.quantity || 1) / 25)
                                        };
                                    } else if (newUnit === 'quả' && p.unit !== 'quả') {
                                        // Đổi từ khay sang quả
                                        return {
                                            ...p,
                                            unit: 'quả',
                                            quantity: (p.quantity || 1) * 25,
                                            price: (p.price || 0) / 25,
                                            total: ((p.price || 0) / 25) * ((p.quantity || 1) * 25)
                                        };
                                    }
                                    return p;
                                }));
                            }}
                            sx={{ minWidth: 80, marginLeft: 1, background: '#fff' }}
                        >
                            <MenuItem value="quả">quả</MenuItem>
                            <MenuItem value="khay">khay</MenuItem>
                        </Select>
                        {/* Ẩn nút thêm sản phẩm khi ở balance mode */}
                        {!props.isBalanceStock && (
                            <Tooltip title="Thêm sản phẩm">
                                <IconButton onClick={() => setShowProductDialog(true)}>
                                    <FiPlus />
                                </IconButton>
                            </Tooltip>
                        )}
                        {filteredBatches.length > 0 && isSearchFocused && (
                            <div className="absolute top-full mt-1 left-0 z-10 bg-white shadow-lg rounded-xl w-full max-h-96 overflow-y-auto text-sm" style={{boxShadow: '0 8px 32px 0 rgba(25, 118, 210, 0.10)'}}>
                                {filteredBatches.map((batch, index) => {
                                    // Quy đổi tồn kho và giá nếu là khay
                                    const remainKhay = unit === 'khay' ? Math.floor(batch.remainQuantity / 25) : batch.remainQuantity;
                                    const price = unit === 'khay' ? (batch.unitSalePrice || 0) * 25 : batch.unitSalePrice;
                                    // Nếu là khay mà tồn kho < 1 khay thì không hiển thị
                                    if (unit === 'khay' && remainKhay < 1) return null;
                                    const importDate = batch.createAt ? format(new Date(batch.createAt), 'dd/MM/yyyy') : 'N/A';
                                    const expireDate = batch.expireDate ? format(new Date(batch.expireDate), 'dd/MM/yyyy') : 'N/A';
                                    return (
                                        <div
                                            key={batch.id || index}
                                            onClick={() => handleSelectBatch(batch)}
                                            className={`px-4 py-3 cursor-pointer flex flex-col transition-all duration-150 hover:bg-blue-50 ${index === filteredBatches.length - 1 ? 'rounded-b-xl' : ''} ${index === 0 ? 'rounded-t-xl' : ''}`}
                                            style={{ borderBottom: index === filteredBatches.length - 1 ? 'none' : '1px solid #f1f1f1' }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-blue-800">Lô {batch.name}</span>
                                                <span className="font-bold text-gray-900">{batch.productName}</span>
                                            </div>
                                            <div
                                                className="grid grid-cols-4 gap-px text-[12px] text-gray-600 mt-1 w-full"
                                                style={{ alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}
                                            >
                                                <span className="col-span-1">
                                                    Số lượng còn: <span className="font-bold text-gray-900">{remainKhay}</span> {unit}
                                                </span>
                                                <span className="col-span-1">
                                                    Giá: <span className="font-bold text-green-700">{formatCurrency(price)}</span>
                                                </span>
                                                <span className="col-span-1">
                                                    Ngày nhập: <span className="font-bold text-indigo-700">{importDate}</span>
                                                </span>
                                                <span className="col-span-1">
                                                    Hạn: <span className="font-bold text-red-700">{expireDate}</span>
                                                </span>
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
                                <FaEye />
                            </IconButton>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                            {Object.entries(columnVisibility).map(([col, visible]) => (
                                <MenuItem key={col} dense>
                                    <MuiFormControlLabel 
                                        control={<Checkbox checked={visible} onChange={() => toggleColumn(col)} />} 
                                        label={col} 
                                    />
                                                    </MenuItem>
                            ))}
                        </Menu>
                    </div>
                </div>

                <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                        key={dataGridKey}
                        rows={selectedProducts.map((row, idx) => ({ ...row, stt: idx + 1 }))}
                        columns={columns}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                        disableSelectionOnClick
                        getRowId={(row) => row.id}
                        sx={highlightProducts ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 4, background: '#fff6f6' } : {}}
                        getRowClassName={(params) => invalidProductIds && invalidProductIds.includes(params.row.id) ? 'row-error' : ''}
                    />
                </div>
            </div>

            {/* Sidebar */}
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
                onCustomerChange={(e) => { setSelectedCustomer(e.target.value); setHighlightCustomer(false); }}
                onStoreChange={(e) => { setSelectedStore(e.target.value); setHighlightStore(false); }}
                onDateChange={(newValue) => setSaleDate(newValue)}
                onNoteChange={(e) => setNote(e.target.value)}
                onPaidAmountChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPaidAmount(Math.max(0, value));
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

            {/* Product Selection Dialog */}
            <SaleProductDialog
                open={showProductDialog}
                onClose={() => setShowProductDialog(false)}
                products={products}
                selectedProduct={selectedProduct}
                availableBatches={availableBatches}
                selectedBatchesForDialog={[]}
                onSelectProduct={handleSelectProduct}
                onSelectBatches={() => {}}
                onAddProducts={handleAddProductsFromDialog}
                formatCurrency={formatCurrency}
            />

            {/* Summary Dialog */}
            <SaleSummaryDialog
                open={showSummaryDialog}
                onClose={handleCloseSummary}
                onConfirm={handleConfirmSummary}
                saleData={summaryData}
                formatCurrency={formatCurrency}
                loading={loading}
                currentUser={currentUser}
                nextCode={nextCode} // Truyền mã phiếu vào summary
            />

            {/* Category Dialog */}
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
                        {/* Danh sách Category */}
                        <div>
                            <h3 className="font-semibold mb-3 text-gray-700">Danh mục sản phẩm</h3>
                            <div className="border rounded-lg max-h-80 overflow-y-auto">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleSelectCategory(category)}
                                        className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${
                                            selectedCategory?.id === category.id ? 'bg-blue-50 border-blue-200' : ''
                                        }`}
                                    >
                                        <div className="font-medium">{category.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {products.filter(p => p.categoryId === category.id || p.category?.id === category.id).length} sản phẩm
                                </div>
                                    </div>
                                ))}
                                </div>
                                                            </div>
                        
                        {/* Danh sách sản phẩm theo category */}
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
                                                    Mã: {product.productCode} | Tồn: {product.remainQuantity} | Giá: {formatCurrency(product.unitSalePrice)}
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