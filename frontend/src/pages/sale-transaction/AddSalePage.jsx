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

const AddSalePage = () => {
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

    const handleSelectBatch = (batch) => {
        // Thêm sản phẩm từ batch vào bảng
        handleSelectProduct({
            id: batch.productId,
            name: batch.productName,
            unit: batch.unit || 'quả',
            price: batch.unitSalePrice,
            quantity: 1,
            batchCode: batch.batchCode,
            remainQuantity: batch.remainQuantity,
            // ... các trường khác nếu cần
        });
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

    const handleSelectCategoryProduct = (product) => {
        handleSelectProduct(product);
    };

    // Memoized columns for DataGrid
    const columns = useMemo(() => [
        columnVisibility['STT'] && { field: 'id', headerName: 'STT', width: 80 },
        columnVisibility['Tên hàng'] && { field: 'name', headerName: 'Tên hàng', flex: 1 },
        columnVisibility['ĐVT'] && { field: 'unit', headerName: 'ĐVT', width: 80 },
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
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                            '& .MuiInput-underline:hover:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                display: 'none',
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield',
                            }
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
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.price || 0}
                        onChange={(e) => handlePriceChange(params.row.id, Number(e.target.value) || 0)}
                        InputProps={{
                            endAdornment: <span className="text-gray-500">VND</span>,
                        }}
                        sx={{
                            width: '100px',
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                            '& .MuiInput-underline:hover:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                display: 'none',
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield',
                            }
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
                return price * quantity;
            },
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => {
                const price = parseFloat(params.row.price) || 0;
                const quantity = parseInt(params.row.quantity) || 0;
                const total = price * quantity;
                return (
                    <div className="text-right w-full">
                        {formatCurrency(total)}
                    </div>
                );
            },
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Tooltip title="Xóa">
                    <IconButton size="small" onClick={() => handleDeleteProduct(params.row.id)}>
                        <FaRegTrashCan />
                    </IconButton>
                </Tooltip>
            ),
        },
    ].filter(Boolean), [columnVisibility, handleQuantityChange, handleQuantityInputChange, handlePriceChange, handleDeleteProduct]);

    return (
        <div className="flex w-full h-screen bg-gray-100">
            {error && <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">{error}</Alert>}
            {success && <Alert severity="success" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">{success}</Alert>}

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
                        {/* Đã xóa icon Thêm từ danh mục */}
                        <Tooltip title="Thêm sản phẩm">
                            <IconButton onClick={() => setShowProductDialog(true)}>
                                <FiPlus />
                            </IconButton>
                        </Tooltip>
                        {filteredBatches.length > 0 && isSearchFocused && (
                            <div className="absolute top-full mt-1 left-0 z-10 bg-white shadow-lg rounded-xl w-full max-h-96 overflow-y-auto text-sm" style={{boxShadow: '0 8px 32px 0 rgba(25, 118, 210, 0.10)'}}>
                                {filteredBatches.map((batch, index) => {
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
                                                <span className="font-bold text-blue-800">Lô #{batch.id}</span>
                                                <span className="font-bold text-gray-900">{batch.productName}</span>
                                            </div>
                                            <div
                                                className="grid grid-cols-4 gap-px text-[12px] text-gray-600 mt-1 w-full"
                                                style={{ alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}
                                            >
                                                <span className="col-span-1">
                                                    Số lượng còn: <span className="font-bold text-gray-900">{batch.remainQuantity}</span>
                                                </span>
                                                <span className="col-span-1">
                                                    Giá: <span className="font-bold text-green-700">{formatCurrency(batch.unitSalePrice)}</span>
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
                        rows={selectedProducts}
                        columns={columns}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                        disableSelectionOnClick
                        getRowId={(row) => row.id}
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
                onCustomerChange={(e) => setSelectedCustomer(e.target.value)}
                onStoreChange={(e) => setSelectedStore(e.target.value)}
                onDateChange={(newValue) => setSaleDate(newValue)}
                onNoteChange={(e) => setNote(e.target.value)}
                onPaidAmountChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPaidAmount(Math.max(0, value)); // chỉ giới hạn >= 0, không giới hạn max
                }}
                onSaveDraft={handleSaveDraft}
                onComplete={handleComplete}
                onCancel={handleCancel}
                formatCurrency={formatCurrency}
                isValidValue={isValidValue}
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