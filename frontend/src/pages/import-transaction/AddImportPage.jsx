import React, { useRef, useMemo } from 'react';
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
import { FaSearch, FaEye } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import { FiPlus } from 'react-icons/fi';
import { DataGrid } from '@mui/x-data-grid';
import { FaRegTrashCan } from "react-icons/fa6";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

// Components
import ImportProductDialog from '../../components/import-transaction/ImportProductDialog';
import ImportSidebar from '../../components/import-transaction/ImportSidebar';
import AddProductDialog from './AddProductDialog';

// Hooks
import { useImportTransaction } from '../../hooks/useImportTransaction';

// Utils
import { formatCurrency, isValidValue } from '../../utils/formatters';

const AddImportPage = () => {
    const searchRef = useRef(null);

    // Custom hook for import transaction logic
    const {
        // States
        currentUser,
        products,
        suppliers,
        categories,
        zones,
        selectedProducts,
        loading,
        error,
        success,
        
        // Form states
        selectedSupplier,
        nextImportCode,
        note,
        paidAmount,
        
        // Dialog states
        showProductDialog,
        showCategoryDialog,
        selectedCategory,
        categoryProducts,
        
        // Search states
        searchTerm,
        filteredProducts,
        
        // Column visibility
        columnVisibility,
        
        // Setters
        setSelectedSupplier,
        setNote,
        setPaidAmount,
        setShowProductDialog,
        setError,
        setSuccess,
        
        // Handlers
        refreshProducts,
        handleAddNewProduct,
        handleSelectProduct,
        handleQuantityChange,
        handleQuantityInputChange,
        handlePriceChange,
        handleSalePriceChange,
        handleDeleteProduct,
        handleZoneChange,
        handleExpireDateChange,
        handleOpenCategoryDialog,
        handleCloseCategoryDialog,
        handleSelectCategory,
        handleSelectCategoryProduct,
        handleSearchChange,
        toggleColumn,
        handleSaveDraft,
        handleComplete,
        
        // Utility functions
        formatCurrency: formatCurrencyHook,
        formatExpireDateForBackend,
        isValidValue: isValidValueHook,
    } = useImportTransaction();

    // Calculate total amount
    const totalAmount = selectedProducts.reduce((sum, product) => sum + (product.total || 0), 0);

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
        columnVisibility['Giá bán'] && {
            field: 'salePrice',
            headerName: 'Giá bán',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.salePrice || 0}
                        onChange={(e) => handleSalePriceChange(params.row.id, Number(e.target.value) || 0)}
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
        columnVisibility['Zone'] && {
            field: 'zoneId',
            headerName: 'Zone',
            width: 150,
            renderCell: (params) => (
                <Select
                    size="small"
                    value={params.row.zoneId || ''}
                    onChange={(e) => handleZoneChange(params.row.id, e.target.value)}
                    displayEmpty
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="">
                        <em>Chọn zone</em>
                    </MenuItem>
                    {zones.map((zone) => (
                        <MenuItem key={zone.id} value={zone.id}>
                            {zone.name}
                        </MenuItem>
                    ))}
                </Select>
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
    ].filter(Boolean), [columnVisibility, handleQuantityChange, handleQuantityInputChange, handlePriceChange, handleSalePriceChange, handleZoneChange, handleDeleteProduct, zones]);

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
                            placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FaSearch className="text-gray-500" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Tooltip title="Thêm từ danh mục">
                            <IconButton onClick={handleOpenCategoryDialog}>
                                <MdCategory />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Thêm sản phẩm">
                            <IconButton onClick={() => setShowProductDialog(true)}>
                                <FiPlus />
                            </IconButton>
                        </Tooltip>
                        {searchTerm.trim() !== '' && filteredProducts.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 z-10 bg-white border shadow-md rounded w-full max-h-60 overflow-y-auto text-sm">
                                {filteredProducts.map((product, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSelectProduct(product)}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-xs text-gray-500">
                                            Mã: {product.code} | Giá: {formatCurrency(product.unitSalePrice || 0)}
                                        </div>
                                    </div>
                                ))}
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
            <ImportSidebar
                currentUser={currentUser}
                suppliers={suppliers}
                selectedSupplier={selectedSupplier}
                nextImportCode={nextImportCode}
                note={note}
                paidAmount={paidAmount}
                totalAmount={totalAmount}
                loading={loading}
                onSupplierChange={(e) => setSelectedSupplier(e.target.value)}
                onNoteChange={(e) => setNote(e.target.value)}
                onPaidAmountChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPaidAmount(Math.max(0, value));
                }}
                onSaveDraft={handleSaveDraft}
                onComplete={handleComplete}
                formatCurrency={formatCurrency}
                isValidValue={isValidValueHook}
            />

            {/* Product Selection Dialog */}
            <ImportProductDialog
                open={showProductDialog}
                onClose={() => setShowProductDialog(false)}
                products={products}
                onSelectProduct={handleSelectProduct}
                formatCurrency={formatCurrency}
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
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    Mã: {product.code} | Giá: {formatCurrency(product.unitSalePrice || 0)}
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

            {/* Add Product Dialog */}
            <AddProductDialog
                open={false}
                onClose={() => {}}
                onAddProduct={handleAddNewProduct}
                refreshProducts={refreshProducts}
            />
        </div>
    );
};

export default AddImportPage; 