import React, { useRef, useState, useEffect } from 'react';
import {
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
    Alert,
} from '@mui/material';
import { FaSearch } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import { FiPlus } from 'react-icons/fi';

// Components
import AddProductDialog from '../../components/import-transaction/AddProductDialog';
import ImportSidebar from '../../components/import-transaction/ImportSidebar';
import ImportCategoryDialog from '../../components/import-transaction/ImportCategoryDialog';
import ImportProductTable from '../../components/import-transaction/ImportProductTable';

// Hooks
import { useImportTransaction } from '../../hooks/useImportTransaction';

// Utils
import { formatCurrency, isValidValue } from '../../utils/formatters';

const ImportPage = () => {
    const searchRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [dataGridKey, setDataGridKey] = useState(0);

    // Custom hook for import transaction logic
    const {
        // States
        currentUser,
        products,
        suppliers,
        categories,
        zones,
        selectedProducts,
        nextImportCode,
        
        // Form states
        selectedSupplier,
        note,
        paidAmount,
        
        // UI states
        loading,
        error,
        success,
        showProductDialog,
        showCategoryDialog,
        
        // Search and filter states
        searchTerm,
        filteredProducts,
        selectedCategory,
        categoryProducts,
        
        // Column visibility
        columnVisibility,
        
        // Calculated values
        totalAmount,
        
        // Setters
        setSelectedSupplier,
        setNote,
        setPaidAmount,
        setError,
        setSuccess,
        setShowProductDialog,
        setShowCategoryDialog,
        setSelectedCategory,
        setCategoryProducts,
        
        // Handlers
        handleSearchChange,
        handleSelectProduct,
        handleSelectCategory,
        handleSelectCategoryProduct,
        handleQuantityChange,
        handleQuantityInputChange,
        handleImportPriceChange,
        handleSalePriceChange,
        handleZoneChange,
        handleExpireDateChange,
        handleDeleteProduct,
        handleSaveDraft,
        handleComplete,
        handleCancel,
        toggleColumn,
    } = useImportTransaction();

    // Handle click outside search dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setFilteredProducts([]);
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
                                        <div className="font-medium">{product.productName}</div>
                                        <div className="text-xs text-gray-500">
                                            Mã: {product.productCode} | Tồn: {product.remainQuantity} | Giá: {formatCurrency(product.unitSalePrice)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <ImportProductTable
                    selectedProducts={selectedProducts}
                    columnVisibility={columnVisibility}
                    zones={zones}
                    anchorEl={anchorEl}
                    dataGridKey={dataGridKey}
                    onQuantityChange={handleQuantityChange}
                    onQuantityInputChange={handleQuantityInputChange}
                    onImportPriceChange={handleImportPriceChange}
                    onSalePriceChange={handleSalePriceChange}
                    onZoneChange={handleZoneChange}
                    onExpireDateChange={handleExpireDateChange}
                    onDeleteProduct={handleDeleteProduct}
                    onToggleColumn={toggleColumn}
                    onSetAnchorEl={setAnchorEl}
                />
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
                onCancel={handleCancel}
                formatCurrency={formatCurrency}
                isValidValue={isValidValue}
            />

            {/* Add Product Dialog */}
            <AddProductDialog
                open={showProductDialog}
                onClose={() => setShowProductDialog(false)}
                onProductCreated={() => {
                    // Refresh products list
                    window.location.reload();
                }}
                onProductAdded={handleSelectProduct}
            />

            {/* Category Dialog */}
            <ImportCategoryDialog
                open={showCategoryDialog}
                onClose={handleCloseCategoryDialog}
                categories={categories}
                selectedCategory={selectedCategory}
                categoryProducts={categoryProducts}
                onSelectCategory={handleSelectCategory}
                onSelectProduct={handleSelectCategoryProduct}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default ImportPage;
